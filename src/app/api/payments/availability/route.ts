import { handle } from "@/lib/server/api-error";
import { isOnlinePaymentAvailable } from "@/lib/server/payment-service";

/** GET ?store=<subdomain>: can this shop's checkout offer online payment? Public. */
export async function GET(req: Request) {
  return handle(async () => {
    const subdomain = (new URL(req.url).searchParams.get("store") || "").toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(subdomain)) return Response.json({ online: false });
    // payments not configured on this server: just don't offer online payment
    if (!process.env.CASHFREE_PARTNER_API_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT) return Response.json({ online: false });
    return Response.json({ online: await isOnlinePaymentAvailable(subdomain) });
  });
}
