import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStaff, sameOrigin, staffSaveProduct } from "@/lib/server/staff-service";

const Body = z.object({
  id: z.string().max(200).optional(),
  title: z.string().max(200),
  description: z.string().max(6000).default(""),
  price: z.number(),
  compareAtPrice: z.number().optional(),
  stock: z.number(),
  category: z.string().min(1).max(120),
  images: z.array(z.string().max(1000)).max(8).default([]),
  status: z.enum(["published", "draft", "hidden"]),
});

/** POST: add a product, or change one (with `id`). Product manager only. */
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    rateLimit(req, "staff-product", 120, 10 * 60_000);
    const ctx = await requireStaff(req);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Fill in the name, price, stock and category.");
    return Response.json({ product: await staffSaveProduct(ctx, parsed.data) });
  });
}
