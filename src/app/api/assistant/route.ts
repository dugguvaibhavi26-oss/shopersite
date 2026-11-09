import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { readStore } from "@/lib/server/store-data";
import { aiConfigured, AiUnavailable } from "@/lib/server/assistant/providers";
import { runAssistant } from "@/lib/server/assistant/run";
import { loadPlanAccess, makeProposal } from "@/lib/server/assistant/tools";
import { getUsage, requireBudget } from "@/lib/server/assistant/usage";

export const maxDuration = 60;

/** GET ?store=: today's AI usage bar for this seller. Owner only. */
export async function GET(req: Request) {
  return handle(async () => {
    const sub = new URL(req.url).searchParams.get("store") || "";
    const { store, uid } = await requireStoreOwner(req, sub);
    return Response.json({ usage: await getUsage(uid, store.planId), ai: aiConfigured() });
  });
}

const Body = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("chat"),
    store: z.string().min(1).max(63),
    messages: z
      .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
      .min(1)
      .max(30),
  }),
  // a simple command understood in the browser that changes something: prepared without AI, free
  z.object({
    mode: z.literal("command"),
    store: z.string().min(1).max(63),
    command: z.object({ kind: z.literal("order_status"), number: z.string().max(20), status: z.enum(["confirmed", "packed", "shipped", "delivered"]) }),
  }),
]);

/** POST: ask the assistant ({mode:"chat"}) or prepare a simple command ({mode:"command"}). Owner only. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "assistant", 30, 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    const { store: owned, uid } = await requireStoreOwner(req, parsed.data.store);
    const full = await readStore(owned.subdomain);
    if (!full) throw new ApiError(404, "Store not found.");
    const store = { ...full, planId: owned.planId }; // owned has an ended plan counted as Free
    await loadPlanAccess();

    if (parsed.data.mode === "command") {
      const c = parsed.data.command;
      const proposal = makeProposal(store.subdomain, uid, "update_order_status", { order_number: c.number, status: c.status }, store);
      return Response.json({ reply: "Here's the change. Tap Confirm to save it.", proposals: [proposal], actions: [] });
    }

    if (!aiConfigured()) throw new ApiError(503, "The AI assistant isn't set up on the server yet. Simple commands still work.", "ai_off");
    await requireBudget(uid, store.planId);
    const last = parsed.data.messages[parsed.data.messages.length - 1];
    if (last.role !== "user" || !last.content.trim()) throw new ApiError(400, "Type a message.");
    try {
      const out = await runAssistant(store, uid, parsed.data.messages);
      return Response.json({ ...out, usage: await getUsage(uid, store.planId) });
    } catch (e) {
      if (e instanceof AiUnavailable) throw new ApiError(503, "AI is busy right now. Try again in a minute; simple commands still work.", "ai_busy");
      throw e;
    }
  });
}
