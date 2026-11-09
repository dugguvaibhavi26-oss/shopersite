import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { findRazorpayPaymentByToken, verifyRazorpayPayment } from "@/lib/server/razorpay-service";

const Body = z.object({
  token: z.string().min(1).max(100),
  store: z.string().min(1).max(63),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

/** POST: the buyer's browser sends Razorpay's payment result here to be verified. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Payment details are missing or invalid.");
    const { token, store, razorpay_payment_id, razorpay_order_id, razorpay_signature } = parsed.data;

    const rec = await findRazorpayPaymentByToken(token);
    if (!rec || rec.storeSubdomain !== store.toLowerCase()) throw new ApiError(404, "Order not found.");

    const result = await verifyRazorpayPayment(rec.orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature);
    return Response.json(result);
  });
}
