import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { cancelSubscription, planView } from "@/lib/server/platform-subscriptions";

/** POST: the seller stops automatic payments. The plan stays on until the time already paid for ends. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "subscribe-cancel", 10, 10 * 60_000);
    const parsed = z.object({ store: z.string().max(63) }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json({ plan: planView(await cancelSubscription(store.subdomain)) });
  });
}
