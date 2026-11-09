import { handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { paidOrdersFor } from "@/lib/server/payment-service";
import { razorpayPaidOrdersFor } from "@/lib/server/razorpay-service";

/** GET ?store=<subdomain>: the seller's paid online orders (for the dashboard to re-apply). */
export async function GET(req: Request) {
  return handle(async () => {
    const subdomain = new URL(req.url).searchParams.get("store") || "";
    const { store } = await requireStoreOwner(req, subdomain);
    const [cashfree, razorpay] = await Promise.all([
      paidOrdersFor(store.subdomain),
      razorpayPaidOrdersFor(store.subdomain).catch((err) => {
        console.warn("[razorpay] paid orders lookup failed", err?.message);
        return [];
      }),
    ]);
    return Response.json({ orders: [...cashfree, ...razorpay] });
  });
}
