import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireUser } from "@/lib/server/firebase-admin";
import { ordersForBuyer } from "@/lib/server/order-service";
import { cleanSubdomain } from "@/lib/server/store-data";

const Body = z.object({ store: z.string().max(63) });

/** POST: the signed-in buyer's orders at this shop (by account, or by their verified email). */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "orders-mine", 30, 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    const store = parsed.success ? cleanSubdomain(parsed.data.store) : null;
    if (!store) throw new ApiError(400, "Invalid request.");
    const user = await requireUser(req);
    return Response.json({ orders: await ordersForBuyer(store, user) });
  });
}
