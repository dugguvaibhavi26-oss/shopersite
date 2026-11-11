/**
 * Cashfree payments: the pure rules (no network, no secrets), shared by the server routes and tests.
 *
 * How money moves (see CASHFREE_SETUP.md):
 * - Every seller gets their OWN Cashfree merchant account, created through our Cashfree partner
 *   account. The seller completes KYC on Cashfree's hosted form; Shopersite never sees or stores
 *   their PAN / Aadhaar / bank documents.
 * - Buyer payments are created on the seller's merchant account, so Cashfree settles them straight
 *   to the seller's verified bank account. Shopersite never receives, holds or forwards the money.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { evaluateCoupon } from "../coupons";
import { deliveryFee } from "../delivery";
import { minOrderProblem } from "../checkout-rules";
import type { OrderData, OrderItemData, StoreData } from "../store-service";

// ---------------------------------------------------------------------------------------------
// Seller (merchant) account status
// ---------------------------------------------------------------------------------------------

/**
 * What the seller sees:
 * - not_started: no Cashfree account yet
 * - kyc_pending: account made, KYC form not finished
 * - in_review: KYC sent, Cashfree is checking it
 * - active: KYC approved, the shop can take online payments
 * - rejected: Cashfree rejected the KYC (the seller can fix it on the same form)
 * - suspended: Cashfree switched the account off
 */
export type MerchantState = "not_started" | "kyc_pending" | "in_review" | "active" | "rejected" | "suspended";

export interface CashfreeMerchantResponse {
  merchant_id?: string;
  merchant_email?: string;
  merchant_name?: string;
  onboarding_status?: string;
  product_status?: { product_name?: string; product_min_kyc_status?: string }[];
}

/** Turns Cashfree's Get Merchant response into one state. Only a PG approval counts as active. */
export function merchantStateFrom(res: CashfreeMerchantResponse | null | undefined): MerchantState {
  if (!res || !res.merchant_id) return "not_started";
  const onboarding = String(res.onboarding_status || "").toUpperCase();
  if (onboarding.includes("SUSPEND")) return "suspended";

  const products = Array.isArray(res.product_status) ? res.product_status : [];
  // the Payment Gateway product; if Cashfree names it differently, fall back to the only product
  const pg =
    products.find((p) => /(^|[^a-z])pg([^a-z]|$)|payment.?gateway/i.test(String(p.product_name || ""))) ||
    (products.length === 1 ? products[0] : undefined);
  const kyc = String(pg?.product_min_kyc_status || "").toUpperCase();

  if (kyc === "MIN_KYC_APPROVED") return "active";
  if (kyc === "MIN_KYC_REJECTED" || onboarding === "REJECTED") return "rejected";
  if (kyc === "MIN_KYC_SUBMITTED") return "in_review";
  return "kyc_pending";
}

/** Cashfree merchant_id for a store: max 40 chars, letters, digits, "-" and "_". Stable per store. */
export function merchantIdFor(subdomain: string): string {
  const clean = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `shs_${clean}`.slice(0, 40);
}

// ---------------------------------------------------------------------------------------------
// Pricing (the server never trusts amounts sent by the buyer's browser)
// ---------------------------------------------------------------------------------------------

export interface BagItemInput {
  productId: string;
  quantity: number;
  variantName?: string;
}

export interface OnlineQuote {
  items: OrderItemData[];
  subtotal: number; // paise
  discount: number; // paise
  delivery: number; // paise
  total: number; // paise
  couponId?: string;
  couponCode?: string;
}

export class QuoteError extends Error {}

type QuoteStore = Pick<StoreData, "products" | "discounts" | "planId" | "freeDeliveryThreshold" | "standardDeliveryFee" | "checkoutRules">;

/** Prices a bag for online payment (no COD fee, at least ₹1). */
export function quoteOnlineOrder(store: QuoteStore, bag: BagItemInput[], couponCode?: string): OnlineQuote {
  return quoteOrder(store, bag, couponCode, { codFee: 0, minTotal: 100 });
}

/**
 * Prices a bag from the store's saved products, exactly like the checkout screen does (same
 * delivery rule, same coupon rule). The server never trusts prices sent by the buyer's browser.
 */
export function quoteOrder(
  store: QuoteStore,
  bag: BagItemInput[],
  couponCode: string | undefined,
  opts: { codFee: number; minTotal: number }
): OnlineQuote & { codFee: number } {
  if (!Array.isArray(bag) || bag.length === 0) throw new QuoteError("Your bag is empty.");
  if (bag.length > 50) throw new QuoteError("Too many items in one order.");

  // the same product can be in the bag twice (different sizes); stock is checked on the sum
  const wanted = new Map<string, number>();
  const items: OrderItemData[] = bag.map((line) => {
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new QuoteError("Check the quantities in your bag.");
    const p = (store.products || []).find((x) => x.id === line.productId && x.status === "published");
    if (!p) throw new QuoteError("Some items in your bag are no longer available. Go back to your bag to update it.");
    // a product saved with a broken price (0, negative, not whole paise) is never sold
    if (!Number.isInteger(p.price) || p.price <= 0) throw new QuoteError("Some items in your bag are no longer available. Go back to your bag to update it.");
    wanted.set(p.id, (wanted.get(p.id) || 0) + qty);
    const variantName = typeof line.variantName === "string" ? line.variantName.slice(0, 120) : "";
    return {
      productId: p.id,
      title: p.title,
      image: p.images?.[0] || "",
      quantity: qty,
      price: p.price,
      ...(variantName ? { variantName } : {}),
    };
  });
  for (const [id, qty] of wanted) {
    const p = store.products.find((x) => x.id === id)!;
    if ((p.stock ?? 0) < qty) throw new QuoteError("Some items in your bag are no longer available. Go back to your bag to update it.");
    // the seller's limit per order (Products → edit → Most per order)
    if (p.maxPerOrder && p.maxPerOrder > 0 && qty > p.maxPerOrder) throw new QuoteError(`You can order up to ${p.maxPerOrder} of "${p.title}" at a time. Update your bag to continue.`);
  }

  const subtotal = items.reduce((n, l) => n + l.price * l.quantity, 0);
  const coupon = couponCode ? evaluateCoupon(store, couponCode, subtotal) : null;
  const discount = coupon?.ok ? coupon.amount : 0;
  // the seller's minimum order (Settings → Checkout), on the items after any discount
  const tooSmall = minOrderProblem(store, Math.max(0, subtotal - discount));
  if (tooSmall) throw new QuoteError(tooSmall);
  const delivery = deliveryFee(store, subtotal);
  const codFee = Math.max(0, Math.round(opts.codFee || 0));
  const total = Math.max(0, subtotal - discount) + delivery + codFee;
  if (total < opts.minTotal) throw new QuoteError("Online payment needs an order of at least ₹1.");
  return {
    items,
    subtotal,
    discount,
    delivery,
    codFee,
    total,
    ...(coupon?.ok ? { couponId: coupon.discount.id, couponCode: coupon.discount.code } : {}),
  };
}

/** Paise to the rupee amount Cashfree expects (a number with at most 2 decimals). */
export function toRupees(paise: number): number {
  return Math.round(paise) / 100;
}

/** Cashfree's rupee amount back to paise, safe against float noise (e.g. 1299.99). */
export function toPaise(rupees: number | string): number {
  return Math.round(Number(rupees) * 100);
}

// ---------------------------------------------------------------------------------------------
// Recording a paid order on the store
// ---------------------------------------------------------------------------------------------

/** The order as saved when payment starts; it joins the store's orders only once it is paid. */
export type PendingOrder = Omit<OrderData, "number" | "paymentStatus">;

/**
 * Adds a paid order to the store's lists (orders, customers, stock, coupon use).
 * Pure: returns the changed fields, or null if the order is already on the store.
 */
export function applyPaidOrder(
  store: Pick<StoreData, "orders" | "customers" | "products" | "discounts">,
  pending: PendingOrder,
  paid: { cfPaymentId?: string; paidAt: string; couponId?: string }
): { order: OrderData; changes: Pick<StoreData, "orders" | "customers" | "products"> & { discounts?: StoreData["discounts"] } } | null {
  return applyNewOrder(
    store,
    {
      ...pending,
      paymentMethod: "cashfree",
      paymentStatus: "paid",
      ...(paid.cfPaymentId ? { paymentUtr: paid.cfPaymentId, cfPaymentId: paid.cfPaymentId } : {}),
    },
    { at: paid.paidAt, couponId: paid.couponId, shortNote: "Paid online, but stock ran out before payment finished: check before shipping" }
  );
}

/**
 * Adds a new order (any payment method) to the store's lists: numbers it, takes stock, counts
 * the customer and the coupon use. Pure: returns the changed fields, or null if it's already there.
 */
export function applyNewOrder(
  store: Pick<StoreData, "orders" | "customers" | "products" | "discounts">,
  pending: Omit<OrderData, "number">,
  opts: { at: string; couponId?: string; shortNote?: string }
): { order: OrderData; changes: Pick<StoreData, "orders" | "customers" | "products"> & { discounts?: StoreData["discounts"] } } | null {
  const orders = Array.isArray(store.orders) ? store.orders : [];
  if (orders.some((o) => o.id === pending.id)) return null;
  const paid = { paidAt: opts.at, couponId: opts.couponId };

  let stockShort = false;
  const products = (store.products || []).map((p) => {
    const qty = pending.items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.quantity, 0);
    if (!qty) return p;
    if ((p.stock ?? 0) < qty) stockShort = true;
    return { ...p, stock: Math.max(0, (p.stock ?? 0) - qty) };
  });

  const notes = [pending.notes, stockShort ? opts.shortNote || "Stock ran out: check before shipping" : ""].filter(Boolean).join(" · ");

  const order: OrderData = {
    ...pending,
    number: `#${orders.length + 1001}`,
    ...(notes ? { notes } : {}),
    updatedAt: paid.paidAt,
  };

  const customers = [...(store.customers || [])];
  const ci = customers.findIndex((c) => c.phone === order.customer.phone);
  if (ci >= 0) {
    customers[ci] = {
      ...customers[ci],
      totalOrders: (customers[ci].totalOrders || 0) + 1,
      totalSpent: (customers[ci].totalSpent || 0) + order.total,
      ...(order.marketingOptIn ? { marketingOptIn: true } : {}),
      lastOrderAt: paid.paidAt,
    };
  } else {
    customers.push({
      id: `cust-${Date.now().toString(36)}`,
      storeId: order.storeId,
      name: order.customer.name,
      phone: order.customer.phone,
      ...(order.customer.email ? { email: order.customer.email } : {}),
      ...(order.marketingOptIn ? { marketingOptIn: true } : {}),
      totalOrders: 1,
      totalSpent: order.total,
      lastOrderAt: paid.paidAt,
    });
  }

  const changes: Pick<StoreData, "orders" | "customers" | "products"> & { discounts?: StoreData["discounts"] } = {
    orders: [order, ...orders],
    customers,
    products,
  };
  if (paid.couponId && Array.isArray(store.discounts)) {
    changes.discounts = store.discounts.map((d) => (d.id === paid.couponId ? { ...d, timesUsed: (d.timesUsed || 0) + 1 } : d));
  }
  return { order, changes };
}

// ---------------------------------------------------------------------------------------------
// Webhook signatures
// ---------------------------------------------------------------------------------------------

/**
 * Checks a Cashfree webhook signature: Base64(HMAC-SHA256(timestamp + rawBody, key)).
 * Cashfree's docs show the message both with and without a "." between timestamp and body, and
 * name either the partner API key or the merchant secret as the key, so every listed form is
 * tried. Webhooks are only ever used as a hint to re-check with Cashfree's API, so a payment is
 * never marked paid on the strength of a webhook alone.
 */
export function verifyCashfreeSignature(rawBody: string, timestamp: string | null, signature: string | null, keys: string[]): boolean {
  if (!timestamp || !signature) return false;
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  for (const key of keys.filter(Boolean)) {
    for (const message of [timestamp + rawBody, `${timestamp}.${rawBody}`]) {
      const expected = createHmac("sha256", key).update(message).digest();
      if (expected.length === given.length && timingSafeEqual(expected, given)) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------------------------
// Small validators
// ---------------------------------------------------------------------------------------------

export const isIndianMobile = (v: string) => /^[6-9][0-9]{9}$/.test(v);
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
