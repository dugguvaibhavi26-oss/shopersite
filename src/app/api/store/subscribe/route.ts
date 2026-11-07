import { z } from "zod";
import { isEmail } from "@/lib/payments/cashfree-core";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { addSubscriber } from "@/lib/server/order-service";
import { cleanSubdomain } from "@/lib/server/store-data";

const Body = z.object({ store: z.string().max(63), email: z.string().trim().max(200) });

/** POST: join a shop's drop-alert list. Public, rate limited. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "subscribe", 5, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    const store = parsed.success ? cleanSubdomain(parsed.data.store) : null;
    const email = parsed.success ? parsed.data.email.toLowerCase() : "";
    if (!store || !isEmail(email)) throw new ApiError(400, "Enter a valid email address.");
    return Response.json(await addSubscriber(store, email));
  });
}
