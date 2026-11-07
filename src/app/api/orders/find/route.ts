import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { findOrderToken } from "@/lib/server/order-service";
import { cleanSubdomain } from "@/lib/server/store-data";

const Body = z.object({ store: z.string().max(63), number: z.string().trim().min(1).max(12), phone: z.string().max(20) });

/** POST: find an order with its number AND the phone used. Public, strictly rate limited. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "find", 8, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    const store = parsed.success ? cleanSubdomain(parsed.data.store) : null;
    if (!parsed.success || !store) throw new ApiError(400, "Invalid request.");
    const phone = parsed.data.phone.replace(/[^0-9]/g, "").slice(-10);
    const token = phone.length === 10 ? await findOrderToken(store, parsed.data.number, phone) : null;
    if (!token) throw new ApiError(404, "We couldn't find an order with that number and phone.");
    return Response.json({ token });
  });
}
