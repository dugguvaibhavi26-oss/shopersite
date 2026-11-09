import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requestOrderChange } from "@/lib/server/order-service";
import { cleanSubdomain } from "@/lib/server/store-data";

const Body = z.object({
  store: z.string().max(63),
  token: z.string().regex(/^tok_(sh|rz)_[a-z0-9]{6,40}$/),
  kind: z.enum(["cancel", "return"]),
  reason: z.string().trim().min(5).max(500),
});

/** POST: a buyer cancels their order or asks for a return, with the order's token. Public. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "order-request", 6, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Tell the shop why, in a few words (at least 5 letters).");
    const store = cleanSubdomain(parsed.data.store);
    if (!store) throw new ApiError(404, "Store not found.");
    const reason = parsed.data.reason.replace(/[<>]/g, "").replace(/\s+/g, " ");
    const order = await requestOrderChange({ subdomain: store, token: parsed.data.token, kind: parsed.data.kind, reason });
    return Response.json({ order });
  });
}
