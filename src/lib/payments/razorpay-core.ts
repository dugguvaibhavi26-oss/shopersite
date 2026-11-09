import { createHmac, timingSafeEqual } from "node:crypto";
import { applyNewOrder } from "./cashfree-core";
import type { OrderData, StoreData } from "../store-service";
import type { PendingOrder } from "./cashfree-core";

export type { PendingOrder };

export type RazorpayConnectionState = "not_connected" | "test" | "live";

/** Verifies the signature Razorpay puts on a completed payment. */
export function verifyRazorpaySignature(rzOrderId: string, rzPaymentId: string, signature: string, keySecret: string): boolean {
  try {
    const message = `${rzOrderId}|${rzPaymentId}`;
    const expected = createHmac("sha256", keySecret).update(message).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/** Verifies a Razorpay webhook signature (SHA-256 HMAC of raw body, hex-encoded). */
export function verifyRazorpayWebhook(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/** Applies a Razorpay-paid order to the store. Same as applyPaidOrder but with provider = razorpay. */
export function applyRazorpayPaidOrder(
  store: Pick<StoreData, "orders" | "customers" | "products" | "discounts">,
  pending: PendingOrder,
  paid: { rzPaymentId?: string; paidAt: string; couponId?: string }
): ReturnType<typeof applyNewOrder> {
  return applyNewOrder(
    store,
    {
      ...pending,
      paymentMethod: "razorpay" as "razorpay",
      paymentStatus: "paid",
      ...(paid.rzPaymentId ? { paymentUtr: paid.rzPaymentId } : {}),
    },
    { at: paid.paidAt, couponId: paid.couponId, shortNote: "Paid online via Razorpay, but stock ran out before payment finished: check before shipping" }
  );
}
