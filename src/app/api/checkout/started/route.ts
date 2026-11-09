import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { readStore } from "@/lib/server/store-data";
import { recordCheckout } from "@/lib/server/checkout-recovery";

const Body = z.object({
  store: z.string().min(1).max(63),
  name: z.string().trim().min(1).max(80),
  phone: z.string().max(20),
  email: z.string().trim().max(200).optional(),
  consent: z.boolean(),
  items: z.array(z.object({ productId: z.string().min(1).max(200), quantity: z.number().int().min(1).max(99), variantName: z.string().max(120).optional() })).min(1).max(50),
});

/** POST: the buyer finished their details and went on to payment (for abandoned-checkout reminders). Public. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "checkout-started", 20, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    const store = await readStore(parsed.data.store.toLowerCase());
    if (!store) throw new ApiError(404, "Store not found.");
    await recordCheckout(store, parsed.data);
    return Response.json({ ok: true });
  });
}
