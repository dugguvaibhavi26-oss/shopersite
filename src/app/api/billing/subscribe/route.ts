import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { startSubscription } from "@/lib/server/platform-subscriptions";

const Body = z.object({ store: z.string().max(63), planId: z.string().max(20) });

/**
 * POST: the seller chose Growth or Pro. Creates the Razorpay subscription they approve in Checkout
 * (card or UPI AutoPay). The plan turns on only after Razorpay confirms it.
 */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "subscribe", 12, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json({ checkout: await startSubscription(store.subdomain, parsed.data.planId) });
  });
}
