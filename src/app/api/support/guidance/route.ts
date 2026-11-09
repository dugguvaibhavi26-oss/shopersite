import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner, requireUser } from "@/lib/server/firebase-admin";
import { createSupportRequest } from "@/lib/server/support-service";

const Body = z.object({ store: z.string().min(1).max(63), topic: z.enum(["razorpay_setup"]) });

/** POST {store, topic}: the seller asks the Shopersite team for setup help. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    const user = await requireUser(req);
    const r = await createSupportRequest(store, user.email, parsed.data.topic);
    return Response.json({ id: r.id, createdAt: r.createdAt });
  });
}
