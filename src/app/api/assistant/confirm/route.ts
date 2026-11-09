import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { applyWrite, loadPlanAccess, readProposal } from "@/lib/server/assistant/tools";

const Body = z.object({ store: z.string().min(1).max(63), token: z.string().min(10).max(20000) });

/** POST {store, token}: the seller tapped Confirm on a change the assistant prepared. Owner only. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "assistant-confirm", 40, 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    const { store, uid } = await requireStoreOwner(req, parsed.data.store);
    const p = readProposal(parsed.data.token, store.subdomain, uid);
    await loadPlanAccess();
    const message = await applyWrite(store.subdomain, p.action, p.args);
    return Response.json({ ok: true, message });
  });
}
