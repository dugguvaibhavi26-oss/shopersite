import "server-only";
import type { StoreData } from "../../store-service";
import { ApiError } from "../api-error";
import { chat, type ChatMessage } from "./providers";
import { ALL_TOOLS, isWrite, makeProposal, runRead, type ClientAction, type DashLink, type Proposal } from "./tools";
import { recordUsage } from "./usage";

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantReply {
  reply: string;
  proposals: Proposal[];
  actions: ClientAction[];
  links: DashLink[];
  provider: string;
}

const PLAN_NAME: Record<string, string> = { free: "Free", starter: "Growth", pro: "Pro" };

function systemPrompt(store: StoreData): string {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  return [
    `You are Roxy, the friendly Shopersite assistant inside the seller dashboard of the shop "${store.name}" (${store.subdomain}.shopersite.in). Today is ${today}. The shop is on the ${PLAN_NAME[store.planId] || "Free"} plan.`,
    "Help the seller run their shop: answer questions from their shop data, explain Shopersite features, and prepare changes. If asked who you are, you're Roxy, Shopersite's assistant.",
    "Rules:",
    "- Always answer the seller's LATEST message. Earlier messages are only context.",
    "- Use the tools to look things up; never guess numbers, ids or features. For how-to questions use search_help. Use as few tool calls as you need.",
    "- When the seller asks for a change (add/edit a product, create a coupon, update an order…), call the matching create_*/update_*/set_* tool straight away. That only PREPARES it: the seller gets a Confirm card. Then say in one line what you prepared. Never claim it's already done.",
    "- If a tool returns an error (e.g. a plan limit or a value out of range), explain it simply, say what IS possible (e.g. coupons go up to 90% off; coupons can't be limited to first orders), and offer that instead.",
    "- To change a product or order, find it first to get its id or number.",
    "- You cannot handle payments, payment keys, bank details, plan purchases or upgrades, custom domains, deleting anything, cancelling orders, or turning the shop on/off. Say it's done manually and add a link to the right page.",
    "- Prices are in Indian rupees (₹). Write product descriptions that are short, warm and honest; never invent facts like fabric or size the seller didn't give.",
    "How to write replies (very important):",
    "- Always write a complete, helpful answer in words. A link button alone is never an answer.",
    "- How-to questions: call search_help, then explain it as numbered steps (3-7 steps) using the guide: say exactly where to click (e.g. 'Plugins → Shiprocket'), what to enter, and anything they need first (e.g. wallet balance, KYC). Finish with one tip if useful.",
    "- Questions about the shop: start with the direct answer and the key numbers in **bold**, then 1-3 short bullets on what to do next.",
    "- After preparing a change: one line saying what you prepared and that they can tap Confirm below.",
    "- Plain, friendly words a first-time seller understands. Up to about 150 words. Use '- ' bullets or '1.' steps where it helps. **Bold** only for key numbers or menu names. No tables, no headings.",
    "- Reply in the seller's language (English, Hindi or Hinglish).",
    "- Buttons to dashboard pages: call the show_link tool. NEVER write tool names, JSON, braces or code in your reply text.",
    "- Be proactive: if you notice something that needs attention (payments to check, low stock, a missing policy page), mention it briefly and add a link.",
    "- You only see buyers' first names, never their phone, email or address. If the seller needs contact details, link the Orders or Customers page.",
  ].join("\n");
}

const MAX_STEPS = 6;

/**
 * Some models write a tool call as text ("{{show_link({...})}}") instead of calling it. Turn those
 * into real link buttons and remove them, along with any leftover model markup, from the reply.
 */
export function cleanReply(text: string, store: StoreData): { text: string; links: DashLink[] } {
  const links: DashLink[] = [];
  let out = text.replace(/\{\{\s*(show_link|open_page)\s*\(\s*(\{[\s\S]*?\})\s*\)\s*\}\}|(?:^|\s)(show_link|open_page)\s*\(\s*(\{[\s\S]*?\})\s*\)/g, (_m, n1, a1, n2, a2) => {
    const name = (n1 || n2) as string;
    try {
      const args = JSON.parse(a1 || a2);
      const r = runRead("show_link", { page: args.page, label: args.label, order_number: args.order_number }, store);
      if (r.link) links.push(r.link);
    } catch {
      // unreadable: just drop it
    }
    return name ? "" : "";
  });
  out = out
    .replace(/<\|[^|]*\|>/g, "") // model control tokens
    .replace(/^\s*#{1,6}\s+/gm, "") // headings
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // a trailing "I've prepared links…" line with nothing after it reads oddly once the buttons are below
  out = out.replace(/\n*(here are|i've prepared|i have prepared|use) (the |some )?(links?|buttons?)[^\n]*:?\s*$/i, "").trim();
  return { text: out, links };
}

/** One assistant reply: the AI may look things up and prepare changes, a few steps at most. */
export async function runAssistant(store: StoreData, uid: string, history: Turn[]): Promise<AssistantReply> {
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(store) },
    ...history
      .slice(-10)
      // old "too many steps" apologies only confuse the model
      .filter((t) => !(t.role === "assistant" && /took too many steps/i.test(t.content)))
      .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }) as ChatMessage),
  ];
  const proposals: Proposal[] = [];
  const actions: ClientAction[] = [];
  const links: DashLink[] = [];
  const addLink = (l?: DashLink) => {
    if (l && links.length < 3 && !links.some((x) => x.page === l.page && x.orderId === l.orderId)) links.push(l);
  };
  let tokens = 0;
  let requests = 0;
  let provider = "";
  const finish = (raw: string | null | undefined): AssistantReply => {
    const c = cleanReply(raw || "", store);
    c.links.forEach(addLink);
    const reply = c.text || (proposals.length ? "I've prepared that for you. Check it and tap Confirm." : links.length ? "Here you go:" : "Done.");
    return { reply, proposals, actions, links, provider };
  };

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const res = await chat(messages, ALL_TOOLS);
      tokens += res.tokens;
      requests += 1;
      provider = res.provider;
      const calls = res.message.tool_calls || [];
      if (!calls.length) {
        if ((res.message.content || "").trim()) return finish(res.message.content);
        // an empty answer (the model spent its turn thinking): ask once more for the written reply
        messages.push({ role: "system", content: "Your last reply was empty. Write your full answer to the seller now, following the reply rules." });
        const again = await chat(messages, ALL_TOOLS, { toolChoice: "none" });
        tokens += again.tokens;
        requests += 1;
        provider = again.provider;
        return finish(again.message.content || "Sorry, I couldn't write an answer just now. Please ask again.");
      }

      messages.push({ role: "assistant", content: res.message.content || null, tool_calls: calls });
      for (const call of calls.slice(0, 8)) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          // leave empty; the tool will say what's missing
        }
        let result: unknown;
        const name = call.function.name;
        if (isWrite(name)) {
          if (proposals.length >= 10) result = { error: "Too many changes at once. Ask the seller to confirm these first." };
          else
            try {
              const p = makeProposal(store.subdomain, uid, name, args, store);
              proposals.push(p);
              result = { prepared: p.title, details: p.lines, note: "Waiting for the seller to tap Confirm. It is NOT done yet." };
            } catch (e) {
              result = { error: e instanceof ApiError ? e.message : "Couldn't prepare that." };
            }
        } else {
          const r = runRead(name, args, store);
          if (r.client) actions.push(r.client);
          addLink(r.link);
          result = r.result;
        }
        messages.push({ role: "tool", tool_call_id: call.id, name, content: JSON.stringify(result).slice(0, 6000) });
      }
    }

    // out of steps: ask once more for a plain answer from what was found (tools still described, but not wanted)
    messages.push({ role: "system", content: "Stop calling tools now. Answer the seller's latest message in plain words using what you found above." });
    const res = await chat(messages, ALL_TOOLS, { toolChoice: "none" });
    tokens += res.tokens;
    requests += 1;
    provider = res.provider;
    return finish(res.message.content || (proposals.length ? "" : "I looked into that but couldn't finish. Could you ask in a simpler way?"));
  } finally {
    if (requests) await recordUsage(uid, tokens, requests, provider || "unknown").catch(() => null);
  }
}
