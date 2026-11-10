import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { confirmCheckout, planView } from "@/lib/server/platform-subscriptions";

const Body = z.object({
  store: z.string().max(63),
  subscriptionId: z.string().min(5).max(60),
  paymentId: z.string().min(5).max(60),
  signature: z.string().min(10).max(200),
});

/** POST: Razorpay Checkout finished. Checks its signature and turns the plan on straight away. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "subscribe-verify", 20, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json({ plan: planView(await confirmCheckout(store.subdomain, parsed.data)) });
  });
}
