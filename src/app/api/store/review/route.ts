import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { addReview } from "@/lib/server/order-service";
import { cleanSubdomain } from "@/lib/server/store-data";

const Body = z.object({
  store: z.string().max(63),
  productId: z.string().min(1).max(200),
  name: z.string().trim().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(2).max(1000),
  tokens: z.array(z.string().max(60)).max(50).default([]),
});

/** POST: a buyer's product review. Public, rate limited. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "review", 5, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    const store = parsed.success ? cleanSubdomain(parsed.data.store) : null;
    if (!parsed.success || !store) throw new ApiError(400, "Please write your name, a rating and a short review.");
    const b = parsed.data;
    return Response.json({ review: await addReview({ subdomain: store, productId: b.productId, name: b.name, rating: b.rating, comment: b.comment, tokens: b.tokens }) });
  });
}
