import "server-only";
import { randomBytes } from "node:crypto";
import { applyRazorpayPaidOrder, verifyRazorpaySignature, type PendingOrder } from "../payments/razorpay-core";
import { quoteOnlineOrder, QuoteError, type BagItemInput } from "../payments/cashfree-core";
import type { OrderData, StoreData } from "../store-service";
import { ApiError } from "./api-error";
import { isShopClosed } from "../policies";
import { storeHas } from "./plan-access";
import { buyerProblem } from "../checkout-rules";
import { notifySellerOfOrder } from "./order-alerts";
import { adminDb } from "./firebase-admin";
import { readStore, readStoreTx, writeStoreTx } from "./store-data";
import { seal, open } from "./secret-box";
import {
  createOrder,
  getOrder,
  getOrderPayments,
  testRazorpayKeys,
  razorpayKeyMode,
  RazorpayError,
  oauthConfig,
  refreshOAuthToken,
  revokeOAuthToken,
  type RzCredentials,
  type RzOAuthToken,
} from "./razorpay";

const ACCOUNTS = "razorpay_accounts";
const PAYMENTS = "razorpay_payments";

export interface RazorpayAccount {
  subdomain: string;
  storeId: string;
  ownerUid: string;
  /** Missing on older docs, which are all key-based. */
  auth?: "keys" | "oauth";
  /** Key-based: the seller's Key ID. OAuth: the public token, which Checkout takes as its key. */
  keyId: string;
  keySealedSecret?: string;
  accessTokenSealed?: string;
  refreshTokenSealed?: string;
  accountId?: string;
  tokenExpiresAt?: string;
  mode: "test" | "live";
  connectedAt: string;
  updatedAt: string;
}

export interface RazorpayPaymentRecord {
  orderId: string;
  token: string;
  storeSubdomain: string;
  storeId: string;
  auth?: "keys" | "oauth";
  keyId: string;
  keySealedSecret?: string;
  mode: "test" | "live";
  amount: number; // paise
  status: "PENDING" | "PAID" | "FAILED";
  rzOrderId: string;
  couponId?: string;
  order: PendingOrder | OrderData;
  rzPaymentId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const nowIso = () => new Date().toISOString();

export async function getRazorpayAccount(subdomain: string): Promise<RazorpayAccount | null> {
  const snap = await adminDb().collection(ACCOUNTS).doc(subdomain).get();
  return snap.exists ? (snap.data() as RazorpayAccount) : null;
}

/** Verifies and stores a seller's Razorpay API keys. */
export async function connectRazorpayAccount(
  store: { subdomain: string; id: string },
  ownerUid: string,
  keyId: string,
  keySecret: string
): Promise<RazorpayAccount> {
  const trimId = keyId.trim();
  const trimSecret = keySecret.trim();
  if (!trimId.startsWith("rzp_")) throw new ApiError(400, "Enter your Razorpay Key ID (starts with rzp_live_ or rzp_test_).");
  if (!trimSecret) throw new ApiError(400, "Enter your Razorpay Key Secret.");

  let valid: boolean;
  try {
    valid = await testRazorpayKeys(trimId, trimSecret);
  } catch (err) {
    if (err instanceof RazorpayError) throw new ApiError(502, `Couldn't reach Razorpay: ${err.message}`);
    throw err;
  }
  if (!valid) throw new ApiError(401, "Razorpay rejected these keys. Check that you copied them correctly from your Razorpay dashboard.");

  const now = nowIso();
  const account: RazorpayAccount = {
    subdomain: store.subdomain,
    storeId: store.id,
    ownerUid,
    keyId: trimId,
    keySealedSecret: seal(trimSecret),
    mode: razorpayKeyMode(trimId),
    connectedAt: now,
    updatedAt: now,
  };
  await adminDb().collection(ACCOUNTS).doc(store.subdomain).set(clean(account));
  return account;
}

/** Stores the tokens Razorpay returned after the seller approved Shopersite. */
export async function connectRazorpayOAuth(
  store: { subdomain: string; id: string },
  ownerUid: string,
  tokens: RzOAuthToken
): Promise<RazorpayAccount> {
  if (!tokens.access_token || !tokens.public_token) throw new ApiError(502, "Razorpay didn't return a usable connection.");
  const now = nowIso();
  const account: RazorpayAccount = {
    subdomain: store.subdomain,
    storeId: store.id,
    ownerUid,
    auth: "oauth",
    keyId: tokens.public_token,
    accessTokenSealed: seal(tokens.access_token),
    refreshTokenSealed: seal(tokens.refresh_token),
    accountId: tokens.razorpay_account_id,
    tokenExpiresAt: expiryFrom(tokens.expires_in),
    mode: tokens.public_token.startsWith("rzp_live_") ? "live" : tokens.public_token.startsWith("rzp_test_") ? "test" : oauthConfig().mode,
    connectedAt: now,
    updatedAt: now,
  };
  await adminDb().collection(ACCOUNTS).doc(store.subdomain).set(clean(account));
  return account;
}

function expiryFrom(expiresIn: number | string) {
  const secs = Number(expiresIn) || 90 * 24 * 3600;
  return new Date(Date.now() + secs * 1000).toISOString();
}

/** API credentials for this account, refreshing an OAuth token that's close to expiry. */
async function credentialsFor(account: RazorpayAccount): Promise<RzCredentials> {
  if (account.auth !== "oauth") return { kind: "keys", keyId: account.keyId, keySecret: open(account.keySealedSecret!) };

  const expiresAt = Date.parse(account.tokenExpiresAt || "");
  if (expiresAt && expiresAt - Date.now() > 7 * 24 * 3600 * 1000) return { kind: "oauth", accessToken: open(account.accessTokenSealed!) };

  let fresh: RzOAuthToken;
  try {
    fresh = await refreshOAuthToken(open(account.refreshTokenSealed!));
  } catch (err) {
    console.error("[razorpay oauth] refresh failed", account.subdomain, err);
    throw new ApiError(409, "Online payment isn't available for this shop right now.");
  }
  await adminDb()
    .collection(ACCOUNTS)
    .doc(account.subdomain)
    .update({
      keyId: fresh.public_token || account.keyId,
      accessTokenSealed: seal(fresh.access_token),
      refreshTokenSealed: seal(fresh.refresh_token),
      tokenExpiresAt: expiryFrom(fresh.expires_in),
      updatedAt: nowIso(),
    });
  account.keyId = fresh.public_token || account.keyId;
  return { kind: "oauth", accessToken: fresh.access_token };
}

/** The secret Razorpay signs checkout responses with: the seller's key secret, or our OAuth client secret. */
function signingSecret(rec: { auth?: "keys" | "oauth"; keySealedSecret?: string }) {
  if (rec.auth === "oauth") return oauthConfig().clientSecret;
  return open(rec.keySealedSecret!);
}

export async function disconnectRazorpayAccount(subdomain: string): Promise<void> {
  const account = await getRazorpayAccount(subdomain);
  if (account?.auth === "oauth" && account.accessTokenSealed) await revokeOAuthToken(open(account.accessTokenSealed));
  await adminDb().collection(ACCOUNTS).doc(subdomain).delete();
}

/** Whether this store can take Razorpay payments right now, and whether they're test (simulated) payments. */
export async function razorpayAvailability(subdomain: string): Promise<{ available: boolean; testMode: boolean }> {
  const account = await getRazorpayAccount(subdomain);
  if (!account) return { available: false, testMode: false };
  // online payments come with Growth and Pro; Free shops take Cash on Delivery only
  const store = await readStore(subdomain);
  if (!store || !(await storeHas(store, "paymentGateway"))) return { available: false, testMode: false };
  return { available: true, testMode: account.mode === "test" };
}

export interface CreateRazorpayPaymentInput {
  subdomain: string;
  items: BagItemInput[];
  couponCode?: string;
  customer: { name: string; phone: string; email?: string };
  address: { street: string; city: string; state: string; pincode: string };
  notes?: string;
  returnBase: string;
  /** the signed-in buyer's account id, when there is one (from a verified token) */
  buyerUid?: string;
}

export async function createRazorpayPayment(
  input: CreateRazorpayPaymentInput,
  requestOrigin: string | null,
  isOwner: (store: StoreData) => Promise<boolean>
) {
  const store = await readStore(input.subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  if (isShopClosed(store) || store.isPaused || store.status === "suspended") throw new ApiError(409, "This shop is currently unavailable.");

  const account = await getRazorpayAccount(store.subdomain);
  if (!account || !(await storeHas(store, "paymentGateway"))) throw new ApiError(409, "Online payment isn't available for this shop right now.");
  // test keys make simulated payments, so only the owner may use them; real buyers must not get a "paid" order for free
  if (account.mode === "test" && !(await isOwner(store))) throw new ApiError(409, "Online payment isn't available for this shop right now.");
  const buyerIssue = buyerProblem(store, { email: input.customer.email, signedIn: !!input.buyerUid });
  if (buyerIssue) throw new ApiError(400, buyerIssue);

  let quote;
  try {
    quote = quoteOnlineOrder(store, input.items, input.couponCode);
  } catch (err) {
    if (err instanceof QuoteError) throw new ApiError(400, err.message);
    throw err;
  }

  const returnBase = checkReturnBase(input.returnBase, requestOrigin, account.mode);
  const orderId = `rzord_${randomBytes(12).toString("hex")}`;
  const token = `tok_rz_${randomBytes(12).toString("hex")}`;
  const now = nowIso();
  const phone = input.customer.phone;
  const creds = await credentialsFor(account);

  let rzOrder;
  try {
    rzOrder = await createOrder(creds, {
      amount: quote.total,
      currency: "INR",
      receipt: orderId.slice(0, 40),
      notes: { store: store.subdomain.slice(0, 15), customer: input.customer.name.slice(0, 15) },
    });
  } catch (err) {
    if (err instanceof RazorpayError) throw new ApiError(502, `Couldn't create payment: ${err.message}`);
    throw err;
  }

  if (rzOrder.amount !== quote.total) throw new ApiError(502, "Payment amount mismatch. Please try again.");

  const pending: PendingOrder = {
    id: orderId,
    storeId: store.id,
    token,
    customer: { name: input.customer.name, phone, ...(input.customer.email ? { email: input.customer.email } : {}) },
    ...(input.buyerUid ? { customerUid: input.buyerUid } : {}),
    address: input.address,
    items: quote.items,
    subtotal: quote.subtotal,
    discount: quote.discount,
    delivery: quote.delivery,
    codFee: 0,
    total: quote.total,
    paymentMethod: "razorpay",
    fulfilmentStatus: "placed",
    ...(input.notes || quote.couponCode
      ? { notes: [quote.couponCode ? `Coupon ${quote.couponCode}` : "", input.notes || ""].filter(Boolean).join(" · ") }
      : {}),
    createdAt: now,
    updatedAt: now,
  };

  const record: RazorpayPaymentRecord = {
    orderId,
    token,
    storeSubdomain: store.subdomain,
    storeId: store.id,
    auth: account.auth || "keys",
    keyId: account.keyId,
    ...(account.keySealedSecret ? { keySealedSecret: account.keySealedSecret } : {}),
    mode: account.mode,
    amount: quote.total,
    status: "PENDING",
    rzOrderId: rzOrder.id,
    ...(quote.couponId ? { couponId: quote.couponId } : {}),
    order: pending,
    createdAt: now,
    updatedAt: now,
  };
  await adminDb().collection(PAYMENTS).doc(orderId).set(clean(record));

  return { orderId, token, rzOrderId: rzOrder.id, keyId: account.keyId, mode: account.mode, total: quote.total };
}

export async function findRazorpayPaymentByToken(token: string): Promise<RazorpayPaymentRecord | null> {
  if (!/^tok_rz_[a-f0-9]{24}$/.test(token)) return null;
  const q = await adminDb().collection(PAYMENTS).where("token", "==", token).limit(1).get();
  return q.empty ? null : (q.docs[0].data() as RazorpayPaymentRecord);
}

export type RazorpayVerifyResult =
  | { status: "paid"; order: OrderData }
  | { status: "failed"; reason: string };

/** The credentials a payment was created with: its own saved keys, or the store's current OAuth token. */
async function credsForRecord(rec: RazorpayPaymentRecord): Promise<RzCredentials> {
  if (rec.auth !== "oauth") return { kind: "keys", keyId: rec.keyId, keySecret: open(rec.keySealedSecret!) };
  const account = await getRazorpayAccount(rec.storeSubdomain);
  if (!account || account.auth !== "oauth") throw new Error("Razorpay account no longer connected");
  return credentialsFor(account);
}

/**
 * Asks Razorpay whether a still-pending order was paid. Covers buyers who paid but closed the page
 * (or lost signal) before their browser reported back.
 */
export async function recheckRazorpayPayment(rec: RazorpayPaymentRecord): Promise<RazorpayVerifyResult | { status: "pending" }> {
  if (rec.status === "PAID") return { status: "paid", order: rec.order as OrderData };
  if (rec.status === "FAILED") return { status: "failed", reason: "This payment was not completed." };
  const payments = await getOrderPayments(await credsForRecord(rec), rec.rzOrderId);
  const captured = payments.find((p) => p.status === "captured" && p.amount === rec.amount);
  if (!captured) return { status: "pending" };
  return { status: "paid", order: await recordRazorpayPaid(rec.orderId, captured.id) };
}

/** Re-checks this store's recent pending Razorpay payments, then returns every paid one's order. */
export async function razorpayPaidOrdersFor(subdomain: string): Promise<OrderData[]> {
  const col = adminDb().collection(PAYMENTS);
  const pending = await col.where("storeSubdomain", "==", subdomain).where("status", "==", "PENDING").limit(50).get();
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recent = pending.docs
    .map((d) => d.data() as RazorpayPaymentRecord)
    .filter((r) => {
      const t = Date.parse(r.createdAt);
      return t > cutoff && Date.now() - t > 60 * 1000;
    })
    .slice(0, 10);
  for (const r of recent) {
    await recheckRazorpayPayment(r).catch((err) => console.warn("[razorpay] re-check failed", r.orderId, err?.message));
  }
  const paid = await col.where("storeSubdomain", "==", subdomain).where("status", "==", "PAID").limit(500).get();
  return paid.docs.map((d) => (d.data() as RazorpayPaymentRecord).order as OrderData);
}

/** Verifies a Razorpay payment by checking the HMAC signature and recording the paid order. */
export async function verifyRazorpayPayment(
  orderId: string,
  rzPaymentId: string,
  rzOrderId: string,
  signature: string
): Promise<RazorpayVerifyResult> {
  const ref = adminDb().collection(PAYMENTS).doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, "Payment not found.");
  const rec = snap.data() as RazorpayPaymentRecord;

  if (rec.status === "PAID") return { status: "paid", order: rec.order as OrderData };
  if (rec.status === "FAILED") return { status: "failed", reason: "This payment was not completed." };

  if (rec.rzOrderId !== rzOrderId) throw new ApiError(400, "Payment ID mismatch.");

  // A wrong signature is rejected but doesn't mark the payment failed: the real payment can still arrive.
  if (!verifyRazorpaySignature(rec.rzOrderId, rzPaymentId, signature, signingSecret(rec))) {
    return { status: "failed", reason: "We couldn't confirm this payment. If money left your account, it will show here within a few minutes." };
  }

  // Also confirm the amount with Razorpay API
  let rzOrder;
  try {
    rzOrder = await getOrder(await credsForRecord(rec), rzOrderId);
  } catch {
    // proceed without API check if network fails; signature is sufficient for safety
  }
  if (rzOrder && rzOrder.amount !== rec.amount) {
    console.error("[razorpay] amount mismatch", rec.orderId, rzOrder.amount, rec.amount);
    await ref.update({ status: "FAILED", updatedAt: nowIso() });
    return { status: "failed", reason: "This payment needs a manual check. The shop will contact you." };
  }

  const order = await recordRazorpayPaid(orderId, rzPaymentId);
  return { status: "paid", order };
}

async function recordRazorpayPaid(orderId: string, rzPaymentId: string): Promise<OrderData> {
  const db = adminDb();
  const payRef = db.collection(PAYMENTS).doc(orderId);
  // set inside the transaction when this call is the one that records the payment
  let alert: { store: StoreData; order: OrderData } | null = null;
  const result = await db.runTransaction(async (tx) => {
    alert = null;
    const paySnap = await tx.get(payRef);
    const rec = paySnap.data() as RazorpayPaymentRecord;
    if (rec.status === "PAID") return rec.order as OrderData;

    const store = (await readStoreTx(tx, rec.storeSubdomain)) || undefined;
    const paidAt = nowIso();

    let order: OrderData;
    if (store) {
      const applied = applyRazorpayPaidOrder(store, rec.order as PendingOrder, { rzPaymentId, paidAt, couponId: rec.couponId });
      if (applied) {
        order = applied.order;
        alert = { store, order };
        writeStoreTx(tx, rec.storeSubdomain, { ...applied.changes });
      } else {
        order = store.orders.find((o) => o.id === orderId)!;
      }
    } else {
      order = { ...(rec.order as PendingOrder), number: "#—", paymentStatus: "paid", paymentMethod: "razorpay", paymentUtr: rzPaymentId };
    }
    tx.set(db.collection("orders").doc(orderId), clean({ ...order, storeSubdomain: rec.storeSubdomain }));
    tx.update(payRef, clean({ status: "PAID", order, paidAt, updatedAt: paidAt, rzPaymentId }));
    return order;
  });
  const done = alert as { store: StoreData; order: OrderData } | null;
  if (done) await notifySellerOfOrder(done.store, done.order);
  return result;
}

function checkReturnBase(raw: string, requestOrigin: string | null, mode: "test" | "live"): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ApiError(400, "Invalid return address.");
  }
  const domain = (process.env.NEXT_PUBLIC_APP_DOMAIN || "shopersite.in").toLowerCase();
  const host = url.hostname.toLowerCase();
  const allowed =
    (requestOrigin && url.origin === requestOrigin) ||
    host === domain ||
    host.endsWith(`.${domain}`) ||
    (mode === "test" && (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1"));
  if (!allowed || !/\/order\/$/.test(url.pathname) || url.search || url.hash) throw new ApiError(400, "Invalid return address.");
  if (mode === "live" && url.protocol !== "https:") throw new ApiError(400, "Payments need a secure (https) shop address.");
  return url.toString();
}
