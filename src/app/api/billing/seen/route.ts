import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { markBillingSeen } from "@/lib/server/billing-service";

/** POST: the seller has seen their approved / rejected payment notices. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = z.object({ store: z.string().max(63) }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    await markBillingSeen(store.subdomain);
    return Response.json({ ok: true });
  });
}
