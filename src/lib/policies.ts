/**
 * A shop's legal pages (terms, returns & refunds, shipping, privacy), written by the seller in
 * Dashboard → Policies. They show on the shop's /pages/<id> and buyers agree to them at checkout.
 */
import type { StoreData } from "./store-service";

export const POLICY_IDS = ["terms", "returns", "shipping", "privacy"] as const;
export type PolicyId = (typeof POLICY_IDS)[number];

export const POLICY_INFO: Record<PolicyId, { title: string; why: string }> = {
  terms: { title: "Terms & conditions", why: "The rules for buying from your shop: prices, payment, orders and disputes." },
  returns: { title: "Returns, refunds & cancellations", why: "When buyers can cancel or return, and how and when refunds are paid." },
  shipping: { title: "Shipping & delivery", why: "Where you deliver, delivery times and charges." },
  privacy: { title: "Privacy policy", why: "What buyer details you collect and how you use them. Required by India's DPDP Act." },
};

export interface StorePolicy {
  body: string;
  updatedAt: string;
}

/** What the seller lets buyers do after ordering (Dashboard → Policies). */
export interface OrderPolicy {
  /** buyers can cancel from their order page until the order is shipped */
  cancelEnabled: boolean;
  /** buyers can ask for a return within returnDays of delivery */
  returnEnabled: boolean;
  returnDays: number;
}

export const DEFAULT_ORDER_POLICY: OrderPolicy = { cancelEnabled: false, returnEnabled: false, returnDays: 7 };

export function orderPolicyOf(store: Pick<StoreData, "orderPolicy">): OrderPolicy {
  const p = store.orderPolicy;
  return {
    cancelEnabled: p?.cancelEnabled === true,
    returnEnabled: p?.returnEnabled === true,
    returnDays: Math.min(30, Math.max(1, Math.round(Number(p?.returnDays) || 7))),
  };
}

export const MIN_POLICY_LENGTH = 150;
export const MAX_POLICY_LENGTH = 20000;

/** Policies that are missing or too short to be real. */
export function missingPolicies(store: Pick<StoreData, "policies">): PolicyId[] {
  return POLICY_IDS.filter((id) => (store.policies?.[id]?.body || "").trim().length < MIN_POLICY_LENGTH);
}

/**
 * A shop needs at least one real policy page before it can open to buyers. Without one it stays
 * closed: the storefront shows the closed card, orders are refused, and the seller can't switch it on.
 */
export function hasAnyPolicy(store: Pick<StoreData, "policies">): boolean {
  return missingPolicies(store).length < POLICY_IDS.length;
}

/** Closed to buyers: switched off by the seller, or no policy page yet. */
export function isShopClosed(store: Pick<StoreData, "policies" | "isClosed">): boolean {
  return !!store.isClosed || !hasAnyPolicy(store);
}

/**
 * A plain-language starting point, filled with the shop's details. The seller must read and change
 * it to match how they work; it is not legal advice.
 */
export function policyTemplate(id: PolicyId, store: Pick<StoreData, "name" | "contactEmail" | "contactPhone" | "ownerName" | "orderPolicy" | "freeDeliveryThreshold" | "standardDeliveryFee" | "codEnabled">): string {
  const name = store.name || "our shop";
  const contact = [store.contactEmail, store.contactPhone ? `+91 ${store.contactPhone}` : ""].filter(Boolean).join(" or ") || "the contact details on our Contact page";
  const op = orderPolicyOf(store);
  const rupees = (p: number) => `₹${Math.round((p || 0) / 100).toLocaleString("en-IN")}`;
  switch (id) {
    case "terms":
      return [
        `These terms apply when you buy from ${name}${store.ownerName ? `, run by ${store.ownerName}` : ""}. By placing an order you agree to them.`,
        `Products and prices. We describe and photograph our products as accurately as we can. Colours may look slightly different on your screen. Prices are in Indian rupees and include applicable taxes unless stated otherwise. We may change prices at any time, but the price you pay is the one shown when you order.`,
        `Orders. An order is confirmed once we accept it and your payment is received${store.codEnabled ? " (or, for cash on delivery, once we confirm it)" : ""}. We may cancel an order if a product is out of stock, the price was shown wrongly, or we suspect fraud. If we cancel a paid order, we refund you in full.`,
        `Payment. You pay ${name} by cash on delivery, or online through the secure payment page when the shop offers it. We never ask for your card, UPI PIN or bank password.`,
        `Delivery, returns and refunds are covered in our Shipping and Returns policies, which are part of these terms.`,
        `Your responsibilities. Give a correct name, phone number and address. Don't misuse the shop, place fake orders, or use someone else's payment details.`,
        `Liability. Our responsibility for any order is limited to the amount you paid for it. Nothing here limits your rights under the Consumer Protection Act, 2019.`,
        `Disputes. These terms are governed by the laws of India. Please contact us first at ${contact}, and we will try to resolve any problem within 7 days.`,
      ].join("\n\n");
    case "returns":
      return [
        op.cancelEnabled
          ? `Cancellations. You can cancel your order from your order page any time before it is shipped. Once shipped, it can't be cancelled.`
          : `Cancellations. To cancel an order, contact us at ${contact} before it is shipped. Orders that have been shipped can't be cancelled.`,
        op.returnEnabled
          ? `Returns. You can ask for a return within ${op.returnDays} days of delivery from your order page. Items must be unused, with tags and original packaging. We'll tell you how to send it back.`
          : `Returns. We accept returns only if the item arrived damaged, defective or wrong. Contact us at ${contact} within 48 hours of delivery with photos of the item and packaging.`,
        `Items that can't be returned: personalised or custom-made products, innerwear, perishables and items marked "non-returnable".`,
        `Refunds. Once we receive and check the returned item (or cancel your order), we refund the amount you paid to your original payment method (or your bank account for cash orders) within 5–7 working days. Delivery charges are refunded only if the item was damaged, defective or wrong.`,
        `Cash on delivery orders are refunded by UPI or bank transfer to details you share with us.`,
        `Questions? Contact us at ${contact}.`,
      ].join("\n\n");
    case "shipping":
      return [
        `We deliver across India through trusted courier partners.`,
        `Processing. Orders are packed and shipped within 1–3 working days after they're confirmed. You'll get the courier name and tracking number on your order page once it ships.`,
        `Delivery time. Most orders arrive within 3–7 working days after shipping. Remote areas may take longer.`,
        `Charges. ${store.standardDeliveryFee ? `Delivery costs ${rupees(store.standardDeliveryFee)}` : "Delivery is free"}${store.freeDeliveryThreshold && store.standardDeliveryFee ? `, and is free on orders of ${rupees(store.freeDeliveryThreshold)} or more` : ""}. The exact amount is shown before you pay.`,
        `Please give a complete address and a phone number that's reachable. If a parcel is returned because the address was wrong or nobody was available, we may charge delivery again to resend it.`,
        `If your order is late or the parcel looks damaged when it arrives, contact us at ${contact}.`,
      ].join("\n\n");
    case "privacy":
      return [
        `${name} respects your privacy. This policy explains what we collect and how we use it, in line with India's Digital Personal Data Protection Act, 2023.`,
        `What we collect. Your name, phone number, email (if you give it), delivery address, and your order and payment reference details.`,
        `Why. Only to process and deliver your orders, contact you about them, handle returns and refunds, and, if you subscribe, send you news about our products. You can unsubscribe at any time from the link in any email.`,
        `Sharing. We share your name, phone and address with the courier delivering your order. We never sell your details. Our shop runs on ShoperSite, which stores this data securely on our behalf.`,
        `How long. We keep order records as long as the law requires for tax and accounting, and other details only while needed.`,
        `Your rights. You can ask to see, correct or delete your personal data, or withdraw your consent, by contacting us at ${contact}. We'll respond within 30 days.`,
        `Security. Your data is sent over encrypted connections and only we can see your orders.`,
      ].join("\n\n");
  }
}
