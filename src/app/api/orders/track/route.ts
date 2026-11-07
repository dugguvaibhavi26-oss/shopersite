import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { trackOrders } from "@/lib/server/order-service";
import { cleanSubdomain } from "@/lib/server/store-data";

const Body = z.object({ store: z.string().max(63), tokens: z.array(z.string().max(60)).max(50) });

/** POST: the buyer's own orders, by the order tokens saved on their device. Public. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "track", 60, 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    const store = parsed.success ? cleanSubdomain(parsed.data.store) : null;
    if (!parsed.success || !store) throw new ApiError(400, "Invalid request.");
    return Response.json({ orders: await trackOrders(store, parsed.data.tokens) });
  });
}
