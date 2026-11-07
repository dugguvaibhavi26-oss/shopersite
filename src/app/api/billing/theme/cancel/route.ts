import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { cancelTheme } from "@/lib/server/billing-service";

/** POST: the seller withdraws a theme payment that hasn't been checked yet. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = z.object({ store: z.string().max(63), purchaseId: z.string().max(80) }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    await cancelTheme(store.subdomain, parsed.data.purchaseId);
    return Response.json({ ok: true });
  });
}
