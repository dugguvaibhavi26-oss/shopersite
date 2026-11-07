import "server-only";
import { randomBytes } from "node:crypto";
import { applyNewOrder, quoteOrder, QuoteError, type BagItemInput } from "../payments/cashfree-core";
import { canUseReviews } from "../plans";
import { isValidUpiId, type OrderData, type ReviewData, type StoreData } from "../store-service";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { getMerchantRecord } from "./payment-service";
import { cashfreeConfig } from "./cashfree";
import { readStore, readStoreTx, writeStoreTx } from "./store-data";

/**
 * Buyer actions, done on the server so nobody can fake them from a browser:
 * prices come from the store's saved products, UPI references can't be reused, and an order's
 * payment can only be marked received by the shop owner (or Cashfree's own confirmation).
 */

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** UPI transaction reference (UTR / RRN): exactly 12 digits in every Indian UPI app. */
export const UTR_PATTERN = /^\d{12}$/;

function shopIsOpen(store: StoreData | null): asserts store is StoreData {
  if (!store) throw new ApiError(404, "Store not found.");
  if (store.isClosed || store.isPaused || store.status === "suspended") throw new ApiError(409, "This shop is currently unavailable.");
}

export interface PlaceOrderInput {
  subdomain: string;
  method: "upi" | "cod";
  items: BagItemInput[];
  couponCode?: string;
  customer: { name: string; phone: string; email?: string };
  address: { street: string; city: string; state: string; pincode: string };
  notes?: string;
  utr?: string;
}

/** Places a UPI (buyer says they paid, shop checks) or cash-on-delivery order. */
export async function placeOrder(input: PlaceOrderInput): Promise<OrderData> {
  const db = adminDb();

  // a shop taking online payments through Cashfree doesn't take unverified manual UPI
  if (input.method === "upi") {
    const merchant = await getMerchantRecord(input.subdomain).catch(() => null);
    if (merchant && merchant.state === "active" && merchant.mode === cashfreeConfig().mode) {
      throw new ApiError(409, "This shop takes UPI through secure online payment. Please choose Pay online.");
    }
    if (!input.utr || !UTR_PATTERN.test(input.utr)) {
      throw new ApiError(400, "Enter the 12-digit UPI reference number (UTR) from your payment app.");
    }
  }

  return db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, input.subdomain);
    shopIsOpen(store);
    if (input.method === "cod" && !store.codEnabled) throw new ApiError(409, "Cash on delivery isn't available at this shop.");
    if (input.method === "upi" && !isValidUpiId(store.upiId || "")) throw new ApiError(409, "UPI payment isn't set up at this shop.");

    // a UPI reference can pay for one order only
    const claimRef = input.method === "upi" ? db.collection("upi_claims").doc(`o_${store.subdomain}_${input.utr}`) : null;
    if (claimRef) {
      const claim = await tx.get(claimRef);
      if (claim.exists) throw new ApiError(409, "This UPI reference number was already used for another order. Check the number in your payment app.");
    }

    // a few orders a minute from one phone is plenty; more is a bot
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    const recent = (store.orders || []).filter((o) => o.customer?.phone === input.customer.phone && new Date(o.createdAt).getTime() > tenMinAgo);
    if (recent.length >= 3) throw new ApiError(429, "Too many orders from this number in a short time. Please wait a few minutes.");

    let quote;
    try {
      quote = quoteOrder(store, input.items, input.couponCode, { codFee: input.method === "cod" ? store.codFee || 0 : 0, minTotal: 0 });
    } catch (err) {
      if (err instanceof QuoteError) throw new ApiError(400, err.message);
      throw err;
    }

    const now = new Date().toISOString();
    const id = `ord_${randomBytes(12).toString("hex")}`;
    const pending: Omit<OrderData, "number"> = {
      id,
      storeId: store.id,
      token: `tok_sh_${randomBytes(12).toString("hex")}`,
      customer: { name: input.customer.name, phone: input.customer.phone, ...(input.customer.email ? { email: input.customer.email } : {}) },
      address: input.address,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      delivery: quote.delivery,
      codFee: quote.codFee,
      total: quote.total,
      paymentMethod: input.method,
      // the buyer only SAYS they paid: it stays unconfirmed until the shop checks its bank app
      paymentStatus: input.method === "upi" ? "awaiting_verification" : "cod_pending",
      ...(input.method === "upi" ? { paymentUtr: input.utr } : {}),
      fulfilmentStatus: "placed",
      ...(input.notes || quote.couponCode
        ? { notes: [quote.couponCode ? `Coupon ${quote.couponCode}` : "", input.notes || ""].filter(Boolean).join(" · ") }
        : {}),
      createdAt: now,
      updatedAt: now,
    };

    const applied = applyNewOrder(store, pending, { at: now, couponId: quote.couponId })!;
    writeStoreTx(tx, store.subdomain, { ...applied.changes });
    tx.set(db.collection("orders").doc(id), clean({ ...applied.order, storeSubdomain: store.subdomain }));
    if (claimRef) tx.set(claimRef, { kind: "order", store: store.subdomain, orderId: id, createdAt: now });
    return applied.order;
  });
}

/** Orders for the buyer's own order tokens (the unguessable keys only the buyer has). */
export async function trackOrders(subdomain: string, tokens: string[]): Promise<OrderData[]> {
  const wanted = new Set(tokens.filter((t) => /^tok_sh_[a-z0-9]{6,40}$/.test(t)).slice(0, 50));
  if (!wanted.size) return [];
  const store = await readStore(subdomain);
  if (!store) return [];
  return (store.orders || []).filter((o) => wanted.has(o.token));
}

/** Finds an order by its number AND the phone used (both must match), returning only its token. */
export async function findOrderToken(subdomain: string, number: string, phone: string): Promise<string | null> {
  const store = await readStore(subdomain);
  if (!store) return null;
  const num = number.trim().startsWith("#") ? number.trim() : `#${number.trim()}`;
  const match = (store.orders || []).find((o) => o.number === num && (o.customer?.phone || "").replace(/[^0-9]/g, "").slice(-10) === phone);
  return match?.token || null;
}

/** A buyer's review. Marked "verified purchase" only if one of the buyer's orders has that product. */
export async function addReview(input: {
  subdomain: string;
  productId: string;
  name: string;
  rating: number;
  comment: string;
  tokens: string[];
}): Promise<ReviewData> {
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, input.subdomain);
    shopIsOpen(store);
    if (!canUseReviews(store.planId)) throw new ApiError(409, "Reviews aren't open at this shop.");
    const product = (store.products || []).find((p) => p.id === input.productId && p.status === "published");
    if (!product) throw new ApiError(404, "Product not found.");
    const reviews = store.reviews || [];
    if (reviews.length >= 2000) throw new ApiError(409, "This shop can't take more reviews right now.");
    const tokens = new Set(input.tokens);
    const bought = (store.orders || []).some((o) => tokens.has(o.token) && o.items.some((i) => i.productId === product.id));
    const review: ReviewData = {
      id: `rev-${randomBytes(6).toString("hex")}`,
      storeId: store.id,
      productId: product.id,
      customerName: input.name,
      rating: input.rating,
      comment: input.comment,
      verifiedPurchase: bought,
      status: "approved",
      createdAt: new Date().toISOString(),
    };
    writeStoreTx(tx, store.subdomain, { reviews: [review, ...reviews] });
    return review;
  });
}

/** Adds an email to the shop's drop-alert list. */
export async function addSubscriber(subdomain: string, email: string): Promise<{ already: boolean }> {
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, subdomain);
    if (!store) throw new ApiError(404, "Store not found.");
    const list = store.subscribers || [];
    if (list.some((s) => s.email.toLowerCase() === email)) return { already: true };
    if (list.length >= 20000) throw new ApiError(409, "This list is full.");
    const now = new Date().toISOString();
    const sub = { id: `sub-${randomBytes(6).toString("hex")}`, email, subscribedAt: now };
    writeStoreTx(tx, store.subdomain, { subscribers: [...list, sub] });
    tx.set(db.collection("subscribers").doc(`${store.subdomain}_${email.replace(/[^a-z0-9]/g, "_")}`), {
      storeSubdomain: store.subdomain,
      storeId: store.id,
      email,
      subscribedAt: now,
    });
    return { already: false };
  });
}
