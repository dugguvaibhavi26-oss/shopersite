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
    "- The seller cannot read code. Your reply must be ordinary sentences only: no code blocks, no backticks, no JSON, no function calls written out. To use a tool, call it through the tool interface; never type the call as text.",
    "- Be proactive: if you notice something that needs attention (payments to check, low stock, a missing policy page), mention it briefly and add a link.",
    "- You only see buyers' first names, never their phone, email or address. If the seller needs contact details, link the Orders or Customers page.",
  ].join("\n");
}

const MAX_STEPS = 6;

const TOOL_NAMES = ALL_TOOLS.map((t) => t.function.name);
const NAMES = TOOL_NAMES.join("|");
const LINK_TOOLS = new Set(["show_link", "open_page"]);

export interface TextCall {
  name: string;
  args: Record<string, unknown>;
}

/** Where the bracket opened at `i` closes (exclusive), skipping quoted text; -1 if it never does. */
function closeOf(s: string, i: number, open: string, close: string, quotes: string): number {
  let depth = 0;
  let q = "";
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (q) {
      if (c === "\\") j++;
      else if (c === q) q = "";
    } else if (quotes.includes(c)) q = c;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return j + 1;
  }
  return -1;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function parseObj(text: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(text);
    return isObj(v) ? v : null;
  } catch {
    return null;
  }
}

/** Arguments written Python-style: key="value", n=5, flag=True */
function kwargs(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const re = /(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|-?\d+(?:\.\d+)?|true|false|none|null)/gi;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const v = m[2];
    if (v[0] === '"' || v[0] === "'") out[m[1]] = v.slice(1, -1).replace(/\\(.)/g, "$1");
    else if (/^(true|false)$/i.test(v)) out[m[1]] = v.toLowerCase() === "true";
    else if (!/^(none|null)$/i.test(v)) out[m[1]] = Number(v);
  }
  return out;
}

const bare = (name: string) => name.replace(/^(functions|default_api)\./, "");

/** A tool call written as a JSON object, in any of the shapes models use. */
function callsInJson(o: Record<string, unknown>): TextCall[] {
  if (Array.isArray(o.tool_calls)) return o.tool_calls.filter(isObj).flatMap(callsInJson);
  const f = isObj(o.function) ? o.function : null;
  const name = [o.name, o.tool, o.tool_name, o.function, f?.name].find((v) => typeof v === "string") as string | undefined;
  if (!name || !TOOL_NAMES.includes(bare(name))) return [];
  let args = o.arguments ?? o.parameters ?? o.args ?? o.input ?? f?.arguments ?? {};
  if (typeof args === "string") args = parseObj(args) || {};
  return [{ name: bare(name), args: isObj(args) ? args : {} }];
}

/**
 * Some models write a tool call as text instead of making it: {{show_link({...})}},
 * print(default_api.find_orders(status="placed")), {"name": "search_help", "arguments": {...}},
 * <function=find_orders>{...}</function>, or inside a ``` code block. Pull those out as real calls
 * and return the text without them.
 */
export function pullTextCalls(input: string): { text: string; calls: TextCall[] } {
  const calls: TextCall[] = [];
  let text = input;

  // name(...) with JSON or key=value arguments
  const callRe = new RegExp(`(?:\\{\\{\\s*)?(?:print\\s*\\(\\s*)?(?:default_api\\.|functions\\.|tools\\.)?\\b(${NAMES})\\s*\\(`, "g");
  for (let m = callRe.exec(text); m; m = callRe.exec(text)) {
    const open = m.index + m[0].length - 1;
    const end = closeOf(text, open, "(", ")", `"'`);
    if (end < 0) break;
    const inner = text.slice(open + 1, end - 1).trim();
    calls.push({ name: m[1], args: inner.startsWith("{") ? parseObj(inner) || {} : kwargs(inner) });
    const tail = (text.slice(end).match(/^[ \t]*\)?[ \t]*(\}\})?/) || [""])[0].length;
    text = text.slice(0, m.index) + " " + text.slice(end + tail);
    callRe.lastIndex = m.index;
  }

  // "to=functions.name … {json}" and "<function=name>{json}"
  const markRe = new RegExp(`(?:to=(?:functions\\.)?|<function=)(${NAMES})\\b[^{\\n]{0,80}`, "g");
  for (let m = markRe.exec(text); m; m = markRe.exec(text)) {
    const open = m.index + m[0].length;
    const end = text[open] === "{" ? closeOf(text, open, "{", "}", `"`) : -1;
    calls.push({ name: m[1], args: end > 0 ? parseObj(text.slice(open, end)) || {} : {} });
    text = text.slice(0, m.index) + " " + text.slice(end > 0 ? end : open);
    markRe.lastIndex = m.index;
  }

  // JSON objects: a tool call, or just stray data. Neither belongs in a reply.
  for (let i = text.indexOf("{"); i >= 0; i = text.indexOf("{", i)) {
    const end = closeOf(text, i, "{", "}", `"`);
    const o = end > 0 ? parseObj(text.slice(i, end)) : null;
    if (!o) {
      i++;
      continue;
    }
    calls.push(...callsInJson(o));
    text = text.slice(0, i) + " " + text.slice(end);
  }
  return { text, calls };
}

/** True for a line that is still code or data rather than a sentence. */
const codeLine = new RegExp(
  `\\b(${NAMES}|default_api|tool_code|tool_calls?|tool_outputs?|function_call)\\b|[{}]|"\\s*:\\s*["\\[{\\d]|^\\s*[\\[\\]],?\\s*$|^\\s*(json|python|javascript|analysis|commentary)\\s*$`,
  "i"
);

/**
 * What the seller sees: plain sentences only. Tool calls written as text become link buttons (links)
 * or are handed back to be run (calls); code blocks, JSON and model markup are removed.
 */
export function cleanReply(raw: string, store: StoreData): { text: string; links: DashLink[]; calls: TextCall[] } {
  const links: DashLink[] = [];
  const pulled = pullTextCalls(raw.replace(/<think(?:ing)?>[\s\S]*?(<\/think(?:ing)?>|$)/gi, ""));
  const calls: TextCall[] = [];
  for (const c of pulled.calls) {
    if (!LINK_TOOLS.has(c.name)) {
      calls.push(c);
      continue;
    }
    try {
      const r = runRead("show_link", { page: c.args.page, label: c.args.label, order_number: c.args.order_number }, store);
      if (r.link) links.push(r.link);
    } catch {
      // unreadable: just drop it
    }
  }
  const tidy = (line: string) =>
    /^\s*\|.*\|\s*$/.test(line)
      ? // a table row reads as "a - b"
        line
          .trim()
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean)
          .join(" - ")
      : line
          .replace(/[ \t]{2,}/g, " ")
          .replace(/\s+([.,!?])/g, "$1")
          .trimEnd();
  let out = pulled.text
    .replace(/```[\s\S]*?(```|$)/g, "\n") // whatever is left in a code block
    .replace(/<\|[^|]*\|>/g, " ") // model control tokens
    .replace(/<\/?(tool_call|tool_code|tool_response|function_call|function|tool)\b[^>]*>/gi, " ")
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, "$1") // markdown links: keep the words
    .replace(/`+/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "") // headings
    .split("\n")
    .filter((line) => !codeLine.test(line) && !/^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line))
    .map(tidy)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // a trailing "I've prepared links…" line with nothing after it reads oddly once the buttons are below
  out = out.replace(/\n*(here are|i've prepared|i have prepared|use) (the |some )?(links?|buttons?)[^\n]*:?\s*$/i, "").trim();
  return { text: out, links, calls };
}

const PLAIN_WORDS = "Write your answer to the seller now in plain, friendly sentences, following the reply rules. No code, no JSON, no tool names, no backticks.";

/** One assistant reply: the AI may look things up and prepare changes, a few steps at most. */
export async function runAssistant(store: StoreData, uid: string, history: Turn[]): Promise<AssistantReply> {
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(store) },
    ...history
      .slice(-10)
      // old "too many steps" apologies only confuse the model
      .filter((t) => !(t.role === "assistant" && /took too many steps/i.test(t.content)))
      // an earlier reply that came out as code must not teach the model to do it again
      .map((t) => ({ role: t.role, content: (t.role === "assistant" ? cleanReply(t.content, store).text : t.content).slice(0, 2000) }) as ChatMessage)
      .filter((m) => (m.content || "").trim()),
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
  const ask = async (toolChoice?: "none") => {
    const res = await chat(messages, ALL_TOOLS, toolChoice ? { toolChoice } : {});
    tokens += res.tokens;
    requests += 1;
    provider = res.provider;
    return res.message;
  };
  const finish = (raw: string | null | undefined): AssistantReply => {
    const c = cleanReply(raw || "", store);
    c.links.forEach(addLink);
    const reply =
      c.text ||
      (proposals.length ? "I've prepared that for you. Check it and tap Confirm." : links.length ? "Here you go:" : "Sorry, I couldn't put that into words just now. Please ask again.");
    return { reply, proposals, actions, links, provider };
  };
  /** Runs one tool: a lookup happens now, a change is only prepared for the seller to confirm. */
  const run = (name: string, args: Record<string, unknown>): unknown => {
    if (isWrite(name)) {
      if (proposals.length >= 10) return { error: "Too many changes at once. Ask the seller to confirm these first." };
      try {
        const p = makeProposal(store.subdomain, uid, name, args, store);
        proposals.push(p);
        return { prepared: p.title, details: p.lines, note: "Waiting for the seller to tap Confirm. It is NOT done yet." };
      } catch (e) {
        return { error: e instanceof ApiError ? e.message : "Couldn't prepare that." };
      }
    }
    const r = runRead(name, args, store);
    if (r.client) actions.push(r.client);
    addLink(r.link);
    return r.result;
  };

  try {
    let typedRounds = 0;
    for (let step = 0; step < MAX_STEPS; step++) {
      const message = await ask();
      const calls = message.tool_calls || [];
      if (!calls.length) {
        const c = cleanReply(message.content || "", store);
        // the model typed its tool calls instead of making them: run them and ask for the answer in words
        if (c.calls.length && typedRounds < 2) {
          typedRounds += 1;
          c.links.forEach(addLink);
          const results = c.calls.slice(0, 8).map((call) => `${call.name}: ${JSON.stringify(run(call.name, call.args)).slice(0, 4000)}`);
          messages.push({ role: "assistant", content: c.text || "Let me look that up." });
          messages.push({ role: "user", content: `[Automatic lookup results, not written by the seller]\n${results.join("\n")}\n\n${PLAIN_WORDS}` });
          continue;
        }
        if (c.text) return finish(message.content);
        // nothing readable (the model spent its turn thinking, or wrote only code): ask once more for the written reply
        messages.push({ role: "system", content: `Your last reply had no readable answer. ${PLAIN_WORDS}` });
        return finish((await ask("none")).content);
      }

      messages.push({ role: "assistant", content: message.content || null, tool_calls: calls });
      for (const call of calls.slice(0, 8)) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          // leave empty; the tool will say what's missing
        }
        const name = call.function.name;
        messages.push({ role: "tool", tool_call_id: call.id, name, content: JSON.stringify(run(name, args)).slice(0, 6000) });
      }
    }

    // out of steps: ask once more for a plain answer from what was found (tools still described, but not wanted)
    messages.push({ role: "system", content: `Stop calling tools now. Answer the seller's latest message using what you found above. ${PLAIN_WORDS}` });
    const last = await ask("none");
    return finish(last.content || (proposals.length ? "" : "I looked into that but couldn't finish. Could you ask in a simpler way?"));
  } finally {
    if (requests) await recordUsage(uid, tokens, requests, provider || "unknown").catch(() => null);
  }
}
