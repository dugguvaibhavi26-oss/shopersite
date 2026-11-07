import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { sendToSubscribers } from "@/lib/server/email-service";

// sending to a few hundred subscribers through Gmail can take a while
export const maxDuration = 60;

const Body = z.object({
  store: z.string().max(63),
  subject: z.string().max(150),
  message: z.string().max(5000),
  ctaText: z.string().max(40).optional(),
  productId: z.string().max(200).optional(),
});

/** POST: emails every subscriber of the store, within the plan's limits. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "email-send", 6, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json(await sendToSubscribers(store, parsed.data));
  });
}
