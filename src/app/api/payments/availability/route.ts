import { handle } from "@/lib/server/api-error";
import { getStoreDoc } from "@/lib/server/firebase-admin";
import { canUseTestPayments } from "@/lib/server/test-pass";
import { isOnlinePaymentAvailable } from "@/lib/server/payment-service";
import { razorpayAvailability } from "@/lib/server/razorpay-service";

const OFF = { online: false, provider: null, testMode: false };

/** GET ?store=<subdomain>: can this shop's checkout offer online payment? Public. */
export async function GET(req: Request) {
  return handle(async () => {
    const subdomain = (new URL(req.url).searchParams.get("store") || "").toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(subdomain)) return Response.json(OFF);
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) return Response.json(OFF);

    // Cashfree is switched off for now (CASHFREE_ENABLED=true brings it back, ahead of Razorpay)
    if (process.env.CASHFREE_ENABLED === "true" && process.env.CASHFREE_PARTNER_API_KEY && (await isOnlinePaymentAvailable(subdomain))) {
      return Response.json({ online: true, provider: "cashfree", testMode: false });
    }

    const rz = await razorpayAvailability(subdomain);
    if (!rz.available) return Response.json(OFF);
    if (rz.testMode) {
      // test keys take simulated payments: only the signed-in owner gets to try them
      const store = await getStoreDoc(subdomain);
      if (!store || !(await canUseTestPayments(req, store))) return Response.json(OFF);
    }
    return Response.json({ online: true, provider: "razorpay", testMode: rz.testMode });
  });
}
