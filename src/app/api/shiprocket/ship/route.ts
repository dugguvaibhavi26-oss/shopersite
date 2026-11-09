import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { courierOptions, createShipment, refreshTracking, shipWithCourier } from "@/lib/server/shiprocket-service";

const Body = z.object({
  store: z.string().min(1).max(63),
  orderId: z.string().min(1).max(80),
  action: z.enum(["create", "couriers", "ship", "track"]),
  courierId: z.number().int().positive().optional(),
  pkg: z.object({ weight: z.number().positive().max(50), length: z.number().positive().max(200), breadth: z.number().positive().max(200), height: z.number().positive().max(200) }).partial().optional(),
});

/**
 * POST {store, orderId, action}: one step of shipping an order with Shiprocket. Owner only.
 * create → send to Shiprocket · couriers → prices · ship (courierId) → AWB, pickup, label · track → refresh
 */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "shiprocket-ship", 60, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    const b = parsed.data;
    const { store } = await requireStoreOwner(req, b.store);
    if (b.action === "create") return Response.json({ order: await createShipment(store.subdomain, b.orderId, b.pkg) });
    if (b.action === "couriers") return Response.json({ couriers: await courierOptions(store.subdomain, b.orderId) });
    if (b.action === "ship") {
      if (!b.courierId) throw new ApiError(400, "Choose a courier.");
      return Response.json({ order: await shipWithCourier(store.subdomain, b.orderId, b.courierId) });
    }
    return Response.json({ order: await refreshTracking(store.subdomain, b.orderId) });
  });
}
