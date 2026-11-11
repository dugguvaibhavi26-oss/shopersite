import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStaff, sameOrigin, staffOrderAction } from "@/lib/server/staff-service";

const Body = z.object({
  id: z.string().min(1).max(200),
  action: z.enum(["accept", "reject", "packed", "shipped", "delivered"]),
  reason: z.string().max(500).optional(),
  courierName: z.string().max(60).optional(),
  trackingNumber: z.string().max(60).optional(),
  trackingUrl: z.string().max(300).optional(),
});

/** POST: accept or reject an order (order manager), or mark it packed, shipped or delivered (fulfilment). */
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    rateLimit(req, "staff-order", 120, 10 * 60_000);
    const ctx = await requireStaff(req);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "That change couldn't be read. Please try again.");
    await staffOrderAction(ctx, parsed.data);
    return Response.json({ ok: true });
  });
}
