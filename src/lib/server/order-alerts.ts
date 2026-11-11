import "server-only";
import type { OrderData, ReviewData, StoreData } from "../store-service";
import { listStaff } from "./staff-service";
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
  await newOrderEmail(store, order);
  await lowStockEmail(store, order);
}

const LOW = 5;
const ownerEmail = (store: StoreData) => (store.contactEmail || store.ownerEmail || "").trim();
const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "https://www.shopersite.in").replace(/\/$/, "");

/** Pro: the switched-on staff members the owner picked in Settings → Notifications. */
async function staffRecipients(store: StoreData): Promise<string[]> {
  const picked = Array.isArray(store.notifyStaff) ? store.notifyStaff : [];
  if (store.planId !== "pro" || !picked.length) return [];
  try {
    const staff = await listStaff(store.subdomain);
    return staff.filter((s) => s.active && picked.includes(s.id)).map((s) => s.email);
  } catch (err) {
    console.error("[order-alerts] staff list failed", err);
    return [];
  }
}

async function newOrderEmail(store: StoreData, order: OrderData) {
  try {
    const owner = store.notifyNewOrders === false ? "" : ownerEmail(store);
    const staff = await staffRecipients(store);
    const recipients = Array.from(new Set([owner, ...staff].filter(Boolean)));
    if (!recipients.length) return;
    const items = order.items.map((i) => `• ${i.quantity} × ${i.title}${i.variantName ? ` (${i.variantName})` : ""} — ${rupees(i.price * i.quantity)}`).join("\n");
    const app = appUrl();
    const text = (forStaff: boolean) => [
        `You have a new order on ${store.name}.`,
        "",
        `Order: ${order.number}`,
        `Total: ${rupees(order.total)}`,
        `Payment: ${METHOD[order.paymentMethod] || order.paymentMethod}`,
        "",
        items,
        "",
        `Buyer: ${order.customer.name} · ${order.customer.phone}${order.customer.altPhone ? ` (also ${order.customer.altPhone})` : ""}`,
        `Deliver to: ${[order.address.street, order.address.landmark ? `near ${order.address.landmark}` : "", order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(", ")}`,
        order.notes ? `Note: ${order.notes}` : "",
        "",
        forStaff ? `Open it in your staff dashboard: ${app}/staff` : `Open it in your dashboard: ${app}/dashboard?store=${encodeURIComponent(store.subdomain)}&tab=orders`,
        `The store: https://${getStoreDomain(store.subdomain)}`,
        "",
        forStaff ? "The store owner chose to send you these. Ask them to change it in Settings → Notifications." : "You can turn these emails off in Settings → Notifications.",
      ]
        .filter((l, i, a) => l !== "" || a[i - 1] !== "")
        .join("\n");
    for (const to of recipients) {
      await sendPlatformMail({ to, subject: `New order ${order.number} · ${rupees(order.total)} · ${store.name}`, text: text(to !== owner) });
    }
  } catch (err) {
    console.error("[order-alerts] seller email failed", err);
  }
}

/** Products this order left with 5 or fewer in stock (crossing the line now), in one email. */
async function lowStockEmail(store: StoreData, order: OrderData) {
  try {
    if (store.notifyLowStock === false) return;
    const to = ownerEmail(store);
    if (!to) return;
    const sold = new Map<string, number>();
    for (const i of order.items) sold.set(i.productId, (sold.get(i.productId) || 0) + i.quantity);
    const low = (store.products || [])
      .filter((p) => sold.has(p.id))
      .map((p) => ({ p, before: p.stock ?? 0, after: Math.max(0, (p.stock ?? 0) - (sold.get(p.id) || 0)) }))
      .filter((x) => x.before > LOW && x.after <= LOW || (x.before > 0 && x.after === 0));
    if (!low.length) return;
    await sendPlatformMail({
      to,
      subject: `${low.length === 1 ? `"${low[0].p.title}" is` : `${low.length} products are`} running low · ${store.name}`,
      text: [
        `Order ${order.number} just left these with little stock:`,
        "",
        ...low.map((x) => `• ${x.p.title}: ${x.after === 0 ? "sold out" : `${x.after} left`}`),
        "",
        `Restock them: ${appUrl()}/dashboard?store=${encodeURIComponent(store.subdomain)}&tab=products`,
        "",
        "You can turn these emails off in Settings → Notifications.",
      ].join("\n"),
    });
  } catch (err) {
    console.error("[order-alerts] low stock email failed", err);
  }
}

/** A buyer left a review. Never throws. */
export async function notifySellerOfReview(store: StoreData, review: ReviewData) {
  try {
    if (store.notifyReviews === false) return;
    const to = ownerEmail(store);
    if (!to) return;
    const product = (store.products || []).find((p) => p.id === review.productId);
    await sendPlatformMail({
      to,
      subject: `New ${review.rating}★ review${product ? ` on "${product.title}"` : ""} · ${store.name}`,
      text: [
        `${review.customerName} left a ${review.rating}-star review${product ? ` on ${product.title}` : ""}${review.verifiedPurchase ? " (verified buyer)" : ""}:`,
        "",
        review.comment ? `"${review.comment}"` : "(no comment)",
        "",
        `See it, or hide it: ${appUrl()}/dashboard?store=${encodeURIComponent(store.subdomain)}&tab=reviews`,
        "",
        "You can turn these emails off in Settings → Notifications.",
      ].join("\n"),
    });
  } catch (err) {
    console.error("[order-alerts] review email failed", err);
  }
}
