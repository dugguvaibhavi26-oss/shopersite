import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { cancelPlan } from "@/lib/server/billing-service";

/** POST: the seller withdraws a plan payment that hasn't been checked yet. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = z.object({ store: z.string().max(63) }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    await cancelPlan(store.subdomain);
    return Response.json({ ok: true });
  });
}
