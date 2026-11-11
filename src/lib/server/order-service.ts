import "server-only";
import { razorpayAvailability } from "./razorpay-service";
import { randomBytes } from "node:crypto";
import { applyNewOrder, quoteOrder, QuoteError, type BagItemInput } from "../payments/cashfree-core";
import { canUseReviews } from "../plans";
import { isShopClosed, orderPolicyOf } from "../policies";
import { buyerProblem, codAllowedFor, codBlockedReason, codLimitText, detailsProblem } from "../checkout-rules";
import { notifySellerOfOrder, notifySellerOfReview } from "./order-alerts";
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
  if (isShopClosed(store) || store.isPaused || store.status === "suspended") throw new ApiError(409, "This shop is currently unavailable.");
}

export interface PlaceOrderInput {
  subdomain: string;
  method: "upi" | "cod";
  items: BagItemInput[];
  couponCode?: string;
  customer: { name: string; phone: string; email?: string; altPhone?: string };
  address: { street: string; landmark?: string; city: string; state: string; pincode: string };
  marketingOptIn?: boolean;
  notes?: string;
  utr?: string;
  /** the signed-in buyer's account id (from a verified token) */
  customerUid?: string;
}

/** Places a cash-on-delivery order (online payments go through the payment gateway instead). */
export async function placeOrder(input: PlaceOrderInput): Promise<OrderData> {
  const db = adminDb();
  // shops no longer take manual UPI: buyers pay online (Growth and Pro) or on delivery
  if (input.method === "upi") throw new ApiError(409, "UPI transfer isn't available. Choose Pay online or Cash on delivery.");
  // without online payment, Cash on Delivery is the only way to pay, so it's always accepted then
  const onlineAvailable = (await razorpayAvailability(input.subdomain).catch(() => ({ available: false }))).available;

  const placed = await db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, input.subdomain);
    shopIsOpen(store);
    if (input.method === "cod" && !store.codEnabled && onlineAvailable) throw new ApiError(409, "Cash on delivery isn't available at this shop. Please pay online.");
    const buyerIssue = buyerProblem(store, { email: input.customer.email, signedIn: !!input.customerUid });
    if (buyerIssue) throw new ApiError(400, buyerIssue);
    const detailsIssue = detailsProblem(store, { landmark: input.address.landmark, altPhone: input.customer.altPhone, phone: input.customer.phone });
    if (detailsIssue) throw new ApiError(400, detailsIssue);
    if (input.method === "cod") {
      const codIssue = codBlockedReason(store, { productIds: input.items.map((i) => i.productId), pincode: input.address.pincode }, onlineAvailable);
      if (codIssue) throw new ApiError(409, codIssue);
    }
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
    if (input.method === "cod" && !codAllowedFor(store, quote.total, onlineAvailable)) throw new ApiError(409, codLimitText(store) || "Cash on delivery isn't available for this order.");

    const now = new Date().toISOString();
    const id = `ord_${randomBytes(12).toString("hex")}`;
    const pending: Omit<OrderData, "number"> = {
      id,
      storeId: store.id,
      token: `tok_sh_${randomBytes(12).toString("hex")}`,
      customer: {
        name: input.customer.name,
        phone: input.customer.phone,
        ...(input.customer.email ? { email: input.customer.email } : {}),
        ...(input.customer.altPhone ? { altPhone: input.customer.altPhone } : {}),
      },
      ...(input.customerUid ? { customerUid: input.customerUid } : {}),
      address: { street: input.address.street, ...(input.address.landmark ? { landmark: input.address.landmark } : {}), city: input.address.city, state: input.address.state, pincode: input.address.pincode },
      ...(input.marketingOptIn ? { marketingOptIn: true } : {}),
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
    return { order: applied.order, store };
  });
  // the seller hears about it once the order is safely saved
  await notifySellerOfOrder(placed.store, placed.order);
  return placed.order;
}

const PAID = new Set(["paid", "verified"]);

/** Puts an order's items back in stock (after a cancellation). */
export function restock(products: StoreData["products"], order: OrderData): StoreData["products"] {
  return (products || []).map((p) => {
    const qty = order.items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.quantity, 0);
    return qty ? { ...p, stock: (p.stock ?? 0) + qty } : p;
  });
}

/**
 * A buyer cancels (before shipping) or asks for a return (within the shop's window after delivery),
 * using the order's token. Only allowed when the shop has switched it on in Dashboard → Policies.
 */
export async function requestOrderChange(input: { subdomain: string; token: string; kind: "cancel" | "return"; reason: string }): Promise<OrderData> {
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, input.subdomain);
    if (!store) throw new ApiError(404, "Store not found.");
    const orders = [...(store.orders || [])];
    const i = orders.findIndex((o) => o.token === input.token);
    if (i < 0) throw new ApiError(404, "Order not found.");
    const order = orders[i];
    const policy = orderPolicyOf(store);
    const now = new Date().toISOString();
    let next: OrderData;
    let products = store.products;

    if (input.kind === "cancel") {
      if (!policy.cancelEnabled) throw new ApiError(409, "This shop doesn't take cancellations online. Message the shop to cancel.");
      if (order.fulfilmentStatus === "cancelled") throw new ApiError(409, "This order is already cancelled.");
      if (!["placed", "confirmed", "packed"].includes(order.fulfilmentStatus)) throw new ApiError(409, "This order has been shipped, so it can't be cancelled. You can ask for a return after it arrives.");
      const owed = PAID.has(order.paymentStatus) || (order.paymentStatus === "awaiting_verification" && !!order.paymentUtr);
      next = {
        ...order,
        fulfilmentStatus: "cancelled",
        cancelledAt: now,
        cancelledBy: "buyer",
        cancelReason: input.reason,
        ...(owed ? { refund: { status: "due" as const, amount: order.total } } : {}),
        updatedAt: now,
      };
      products = restock(store.products, order);
    } else {
      if (!policy.returnEnabled) throw new ApiError(409, "This shop doesn't take returns online. Message the shop about a return.");
      if (order.fulfilmentStatus !== "delivered") throw new ApiError(409, "You can ask for a return once the order is delivered.");
      if (order.returnRequest && order.returnRequest.status !== "declined") throw new ApiError(409, "You've already asked for a return on this order.");
      const delivered = new Date(order.deliveredAt || order.updatedAt).getTime();
      if (Date.now() - delivered > policy.returnDays * 86400000) throw new ApiError(409, `Returns are open for ${policy.returnDays} days after delivery, and that time has passed.`);
      next = { ...order, returnRequest: { status: "requested", reason: input.reason, requestedAt: now }, updatedAt: now };
    }
    orders[i] = next;
    writeStoreTx(tx, store.subdomain, input.kind === "cancel" ? { orders, products } : { orders });
    tx.set(db.collection("orders").doc(order.id), clean({ ...next, storeSubdomain: store.subdomain }), { merge: true });
    return next;
  });
}

/** A signed-in buyer's orders at one shop: placed while signed in, or with their verified email. */
export async function ordersForBuyer(subdomain: string, user: { uid: string; email?: string; emailVerified: boolean }): Promise<OrderData[]> {
  const store = await readStore(subdomain);
  if (!store) return [];
  const email = user.emailVerified ? (user.email || "").toLowerCase().trim() : "";
  return (store.orders || [])
    .filter((o) => o.customerUid === user.uid || (!!email && (o.customer?.email || "").toLowerCase().trim() === email))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 100);
}

/** Orders for the buyer's own order tokens (the unguessable keys only the buyer has). */
export async function trackOrders(subdomain: string, tokens: string[]): Promise<OrderData[]> {
  const wanted = new Set(tokens.filter((t) => /^tok_(sh|rz)_[a-z0-9]{6,40}$/.test(t)).slice(0, 50));
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
  const saved = await db.runTransaction(async (tx) => {
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
    return { review, store };
  });
  await notifySellerOfReview(saved.store, saved.review);
  return saved.review;
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
