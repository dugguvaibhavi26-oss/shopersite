import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { emailBuyer } from "@/lib/server/email-service";

const Body = z.object({
  store: z.string().max(63),
  orderId: z.string().min(1).max(80),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(5).max(3000),
});

/** POST: the shop owner emails one buyer about their order, from the shop's connected Gmail. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "order-notify", 20, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Write a subject and a message.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    const subject = parsed.data.subject.replace(/\s+/g, " ");
    return Response.json(await emailBuyer(store, parsed.data.orderId, subject, parsed.data.message));
  });
}
