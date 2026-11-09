import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { findPaymentByToken, verifyPayment } from "@/lib/server/payment-service";
import { findRazorpayPaymentByToken, recheckRazorpayPayment } from "@/lib/server/razorpay-service";

/**
 * GET ?store=<subdomain>&token=<order token>: the buyer's order page asks this after an online
 * payment. The order token is the unguessable key the buyer already holds for their order page.
 */
export async function GET(req: Request) {
  return handle(async () => {
    const params = new URL(req.url).searchParams;
    const token = params.get("token") || "";
    const store = (params.get("store") || "").toLowerCase();

    if (token.startsWith("tok_rz_")) {
      rateLimit(req, "razorpay-recheck", 20, 60_000);
      const rec = await findRazorpayPaymentByToken(token);
      if (!rec || rec.storeSubdomain !== store) throw new ApiError(404, "Order not found.");
      const result = await recheckRazorpayPayment(rec);
      if (result.status !== "pending") return Response.json(result);
      return Response.json({
        status: "failed",
        reason: "We haven't received this payment yet. If money left your account, tap “check again” in a few minutes. Otherwise go back to your bag and try again.",
      });
    }

    const rec = await findPaymentByToken(token);
    if (!rec || rec.storeSubdomain !== store) throw new ApiError(404, "Order not found.");
    return Response.json(await verifyPayment(rec.orderId));
  });
}
