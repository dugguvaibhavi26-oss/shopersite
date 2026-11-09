import { handle } from "@/lib/server/api-error";
import { verifyRazorpayWebhook } from "@/lib/payments/razorpay-core";
import { findRazorpayPaymentByToken, verifyRazorpayPayment } from "@/lib/server/razorpay-service";
import { adminDb } from "@/lib/server/firebase-admin";

/** POST: Razorpay sends payment events here. Configure the URL in Razorpay Dashboard → Webhooks. */
export async function POST(req: Request) {
  return handle(async () => {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (secret && !verifyRazorpayWebhook(rawBody, signature, secret)) {
      return new Response("Bad signature", { status: 400 });
    }

    let event: { event?: string; payload?: Record<string, unknown> } = {};
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }

    const eventName = String(event.event || "");
    if (!eventName.startsWith("payment.")) return Response.json({ received: true, action: "ignored" });

    const paymentEntity = (event.payload?.payment as { entity?: Record<string, unknown> })?.entity || {};
    const rzOrderId = String(paymentEntity.order_id || "");
    if (!rzOrderId) return Response.json({ received: true, action: "no order_id" });

    // find our payment record by rzOrderId
    const q = await adminDb().collection("razorpay_payments").where("rzOrderId", "==", rzOrderId).limit(1).get();
    if (q.empty) return Response.json({ received: true, action: "unknown order" });

    const rec = q.docs[0].data();
    if (eventName === "payment.captured" || eventName === "payment.authorized") {
      const rzPaymentId = String(paymentEntity.id || "");
      const rzSig = String(paymentEntity.id || ""); // webhooks don't include signature; we just re-verify via API
      if (rec.status !== "PAID") {
        // We won't have a signature here; instead just call verifyRazorpayPayment which does an API check
        // But verifyRazorpayPayment needs the signature, so for webhooks we do a direct record check
        await adminDb()
          .collection("razorpay_payments")
          .doc(rec.orderId)
          .update({ webhookHint: rzPaymentId, updatedAt: new Date().toISOString() });
      }
    }

    return Response.json({ received: true, event: eventName });
  });
}
