import { requireFeature } from "@/lib/server/plan-access";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { readStore } from "@/lib/server/store-data";

/**
 * GET ?store=&token=: what an invoice needs. The order's token (only the buyer and seller have it)
 * is the key, the same as the order page. Pro stores only.
 */
export async function GET(req: Request) {
  return handle(async () => {
    rateLimit(req, "invoice", 60, 10 * 60_000);
    const url = new URL(req.url);
    const sub = (url.searchParams.get("store") || "").toLowerCase();
    const token = url.searchParams.get("token") || "";
    if (!/^[a-z0-9-]{1,63}$/.test(sub) || !/^tok_(sh|rz)_[a-z0-9]{6,40}$/.test(token)) throw new ApiError(404, "Invoice not found.");
    const store = await readStore(sub);
    if (!store) throw new ApiError(404, "Invoice not found.");
    await requireFeature(store, "invoices");
    const order = (store.orders || []).find((o) => o.token === token);
    if (!order || order.fulfilmentStatus === "cancelled") throw new ApiError(404, "Invoice not found.");
    return Response.json({
      store: {
        name: store.name,
        subdomain: store.subdomain,
        logoUrl: store.logoUrl || "",
        businessAddress: store.businessAddress || "",
        gstin: store.gstin || "",
        gstState: store.gstState || "",
        defaultGstRate: store.defaultGstRate,
        contactEmail: store.contactEmail || "",
        contactPhone: store.contactPhone || "",
        products: (store.products || []).map((p) => ({ id: p.id, gstRate: p.gstRate })),
      },
      order,
    });
  });
}
