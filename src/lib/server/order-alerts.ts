import "server-only";
import type { OrderData, StoreData } from "../store-service";
import { getStoreDomain } from "../config/site";
import { sendPlatformMail } from "./platform-mail";
import { closeCheckouts } from "./checkout-recovery";

const rupees = (p: number) => `₹${(Math.round(p) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const METHOD: Record<string, string> = {
  cod: "Cash on delivery",
  upi: "UPI (check your bank app before shipping)",
  razorpay: "Paid online (Razorpay)",
  cashfree: "Paid online (Cashfree)",
};

/**
 * Emails the seller about a new order (Settings → Notifications, on unless switched off). Never
 * throws: an email problem must not affect the order itself.
 */
export async function notifySellerOfOrder(store: StoreData, order: OrderData) {
  // the buyer finished: their started checkout is no longer abandoned
  await closeCheckouts(store.subdomain, order.customer.phone);
  try {
    if (store.notifyNewOrders === false) return;
    const to = (store.contactEmail || store.ownerEmail || "").trim();
    if (!to) return;
    const items = order.items.map((i) => `• ${i.quantity} × ${i.title}${i.variantName ? ` (${i.variantName})` : ""} — ${rupees(i.price * i.quantity)}`).join("\n");
    const app = (process.env.NEXT_PUBLIC_APP_URL || "https://www.shopersite.in").replace(/\/$/, "");
    await sendPlatformMail({
      to,
      subject: `New order ${order.number} · ${rupees(order.total)} · ${store.name}`,
      text: [
        `You have a new order on ${store.name}.`,
        "",
        `Order: ${order.number}`,
        `Total: ${rupees(order.total)}`,
        `Payment: ${METHOD[order.paymentMethod] || order.paymentMethod}`,
        "",
        items,
        "",
        `Buyer: ${order.customer.name} · ${order.customer.phone}`,
        `Deliver to: ${[order.address.street, order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(", ")}`,
        order.notes ? `Note: ${order.notes}` : "",
        "",
        `Open it in your dashboard: ${app}/dashboard?store=${encodeURIComponent(store.subdomain)}&tab=orders`,
        `Your store: https://${getStoreDomain(store.subdomain)}`,
        "",
        "You can turn these emails off in Settings → Notifications.",
      ]
        .filter((l, i, a) => l !== "" || a[i - 1] !== "")
        .join("\n"),
    });
  } catch (err) {
    console.error("[order-alerts] seller email failed", err);
  }
}
