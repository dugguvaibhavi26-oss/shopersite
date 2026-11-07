import { handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { paidOrdersFor } from "@/lib/server/payment-service";

/** GET ?store=<subdomain>: the seller's paid online orders (for the dashboard to re-apply). */
export async function GET(req: Request) {
  return handle(async () => {
    const subdomain = new URL(req.url).searchParams.get("store") || "";
    const { store } = await requireStoreOwner(req, subdomain);
    return Response.json({ orders: await paidOrdersFor(store.subdomain) });
  });
}
