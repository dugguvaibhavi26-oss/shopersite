/**
 * Ready-made WhatsApp messages a seller sends to a buyer with one tap (every plan). They open
 * WhatsApp with the text filled in; nothing is sent until the seller presses send, so they cost
 * nothing. Sellers can rewrite each message; {placeholders} are filled from the order.
 */
import type { OrderData, StoreData } from "./store-service";

export type BuyerUpdate = "confirmed" | "shipped" | "delivered" | "payment";

export const BUYER_UPDATES: { id: BuyerUpdate; label: string }[] = [
  { id: "confirmed", label: "Order confirmed" },
  { id: "shipped", label: "Shipped + tracking" },
  { id: "delivered", label: "Delivered, thank you" },
  { id: "payment", label: "Payment reminder" },
];

/** placeholders a template can use */
export const TEMPLATE_TAGS: { tag: string; label: string }[] = [
  { tag: "{name}", label: "Buyer's first name" },
  { tag: "{order}", label: "Order number" },
  { tag: "{store}", label: "Shop name" },
  { tag: "{items}", label: "Items" },
  { tag: "{total}", label: "Total" },
  { tag: "{courier}", label: "Courier" },
  { tag: "{tracking}", label: "Tracking number" },
  { tag: "{tracking_link}", label: "Tracking link" },
  { tag: "{link}", label: "Order page link" },
];

export const DEFAULT_TEMPLATES: Record<BuyerUpdate, string> = {
  confirmed: "Hi {name}! Your order {order} from {store} is confirmed 🎉\n{items}\nTotal: {total}\n\nTrack it here: {link}",
  shipped: "Hi {name}! Your order {order} from {store} is on its way 🚚\nCourier: {courier}\nTracking no.: {tracking}\nTrack: {tracking_link}\n\nOrder page: {link}",
  delivered: "Hi {name}! Your order {order} from {store} has been delivered. Thank you for shopping with us 💛\nWe'd love to hear what you think: {link}",
  payment: "Hi {name}, a quick reminder about your order {order} from {store} ({total}). Once the payment is done, we'll ship it right away.\n\nOrder page: {link}",
};

export const TEMPLATE_MAX = 1000;

const rupees = (p: number) => `₹${(Math.round(p) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function templateFor(store: Pick<StoreData, "whatsappTemplates">, kind: BuyerUpdate): string {
  const t = store.whatsappTemplates?.[kind];
  return typeof t === "string" && t.trim() ? t : DEFAULT_TEMPLATES[kind];
}

export function fillTemplate(template: string, store: Pick<StoreData, "name">, order: OrderData, orderLink: string): string {
  const values: Record<string, string> = {
    name: order.customer.name.split(/\s+/)[0] || "there",
    order: order.number,
    store: store.name,
    items: order.items.map((i) => `${i.quantity} × ${i.title}`).join(", "),
    total: rupees(order.total),
    courier: order.courierName || "",
    tracking: order.trackingNumber || "",
    tracking_link: order.trackingUrl || "",
    link: orderLink,
  };
  return (
    template
      // a line whose only placeholder is empty (e.g. "Courier: {courier}" before shipping) is dropped
      .split("\n")
      .filter((line) => {
        const tags = line.match(/\{(\w+)\}/g) || [];
        return !tags.length || tags.some((t) => values[t.slice(1, -1)] !== "");
      })
      .join("\n")
      .replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k] : m))
  );
}

export function buyerUpdateText(store: Pick<StoreData, "name" | "whatsappTemplates">, order: OrderData, kind: BuyerUpdate, orderLink: string): string {
  return fillTemplate(templateFor(store, kind), store, order, orderLink);
}

/** wa.me link to the buyer with the message filled in, or "" if the number isn't usable. */
export function buyerWhatsAppLink(phone: string, text: string): string {
  const d = String(phone || "").replace(/\D/g, "");
  const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.slice(-10);
  if (!/^[6-9]\d{9}$/.test(ten)) return "";
  return `https://wa.me/91${ten}?text=${encodeURIComponent(text)}`;
}
