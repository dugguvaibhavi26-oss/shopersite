import { ApiError, handle } from "@/lib/server/api-error";
import { findPaymentByToken, verifyPayment } from "@/lib/server/payment-service";

/**
 * GET ?store=<subdomain>&token=<order token>: the buyer's order page asks this after Cashfree sends
 * them back. The order token is the unguessable key the buyer already holds for their order page.
 */
export async function GET(req: Request) {
  return handle(async () => {
    const params = new URL(req.url).searchParams;
    const token = params.get("token") || "";
    const store = (params.get("store") || "").toLowerCase();
    const rec = await findPaymentByToken(token);
    if (!rec || rec.storeSubdomain !== store) throw new ApiError(404, "Order not found.");
    return Response.json(await verifyPayment(rec.orderId));
  });
}
