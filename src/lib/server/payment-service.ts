import "server-only";
import { randomBytes } from "node:crypto";
import {
  applyPaidOrder,
  isEmail,
  isIndianMobile,
  merchantIdFor,
  merchantStateFrom,
  quoteOnlineOrder,
  QuoteError,
  toPaise,
  toRupees,
  type BagItemInput,
  type MerchantState,
  type PendingOrder,
} from "../payments/cashfree-core";
import type { OrderData, StoreData } from "../store-service";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { readStore, readStoreTx, writeStoreTx } from "./store-data";
import {
  CashfreeError,
  cashfreeConfig,
  createMerchant,
  createOnboardingLink,
  createPgOrder,
  getMerchant,
  getPgOrder,
  getPgOrderPayments,
} from "./cashfree";

/**
 * Server-only records (written with the admin SDK; browsers must not be allowed to write them,
 * see CASHFREE_SETUP.md for the Firestore rules):
 * - cashfree_merchants/{subdomain}: the seller's Cashfree merchant account and its KYC state
 * - payments/{orderId}: one online payment, from start until it is paid and added to the store
 */
const MERCHANTS = "cashfree_merchants";
const PAYMENTS = "payments";

export interface MerchantRecord {
  subdomain: string;
  storeId: string;
  merchantId: string;
  ownerUid: string;
  email: string;
  state: MerchantState;
  onboardingStatus?: string;
  mode: "sandbox" | "production";
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string;
}

export type PaymentRecordStatus = "PENDING" | "PAID" | "FAILED" | "AMOUNT_MISMATCH";

export interface PaymentRecord {
  orderId: string;
  token: string;
  storeSubdomain: string;
  storeId: string;
  merchantId: string;
  mode: "sandbox" | "production";
  amount: number; // paise
  status: PaymentRecordStatus;
  paymentSessionId: string;
  cfOrderId?: string;
  couponId?: string;
  order: PendingOrder | OrderData;
  cfPaymentId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const nowIso = () => new Date().toISOString();

/** Turns a Cashfree failure into a message for the seller/buyer. */
function fromCashfree(err: unknown, fallback: string): never {
  if (err instanceof CashfreeError) {
    if (err.code === "feature_not_enabled") {
      console.error("[cashfree] partner feature not enabled:", err.message);
      throw new ApiError(503, "Online payment sign-up isn't open yet: Cashfree still has to enable it for Shopersite. Please try again in a few days.", err.code);
    }
    if (err.status === 401 || err.status === 403) throw new ApiError(503, "Cashfree rejected the platform's API key. The Shopersite team needs to check the payment settings.");
    if (err.status >= 400 && err.status < 500) throw new ApiError(400, `Cashfree: ${err.message}`, err.code);
    throw new ApiError(502, fallback);
  }
  throw err;
}

// =============================================================================================
// Seller onboarding
// =============================================================================================

export async function getMerchantRecord(subdomain: string): Promise<MerchantRecord | null> {
  const snap = await adminDb().collection(MERCHANTS).doc(subdomain).get();
  return snap.exists ? (snap.data() as MerchantRecord) : null;
}

/** Asks Cashfree for the seller's current KYC state and saves it. */
export async function refreshMerchant(record: MerchantRecord): Promise<MerchantRecord> {
  let res;
  try {
    res = await getMerchant(record.merchantId);
  } catch (err) {
    fromCashfree(err, "Couldn't check your Cashfree account. Please try again.");
  }
  const updated: MerchantRecord = {
    ...record,
    state: res ? merchantStateFrom(res) : record.state,
    ...(res?.onboarding_status ? { onboardingStatus: String(res.onboarding_status) } : {}),
    lastCheckedAt: nowIso(),
    updatedAt: nowIso(),
  };
  await adminDb().collection(MERCHANTS).doc(record.subdomain).set(clean(updated));
  return updated;
}

/** What the seller's dashboard shows. Checks Cashfree live unless the account is not made yet. */
export async function merchantStatusFor(store: StoreData): Promise<{ state: MerchantState; merchantId?: string; email?: string; mode: string }> {
  const record = await getMerchantRecord(store.subdomain);
  if (!record) return { state: "not_started", mode: cashfreeConfig().mode };
  if (record.mode !== cashfreeConfig().mode) {
    throw new ApiError(409, `This shop's Cashfree account was made in ${record.mode} mode, but payments now run in ${cashfreeConfig().mode} mode. Ask the Shopersite team to reset it so you can do KYC again.`);
  }
  const fresh = await refreshMerchant(record);
  return { state: fresh.state, merchantId: fresh.merchantId, email: fresh.email, mode: fresh.mode };
}

/**
 * Makes the seller's Cashfree merchant account (first time only) and returns a fresh link to
 * Cashfree's hosted KYC form. The seller enters PAN, Aadhaar/business proof and their bank
 * account there; Cashfree verifies them and settles payments to that bank account.
 */
export async function startOnboarding(
  store: StoreData,
  ownerUid: string,
  input: { email: string; phone: string; businessName: string },
  origin: string
): Promise<{ state: MerchantState; link?: string; expiresAt?: string }> {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.replace(/[^0-9]/g, "").slice(-10);
  const businessName = input.businessName.trim().slice(0, 100);
  if (!isEmail(email)) throw new ApiError(400, "Enter a valid email address.");
  if (!isIndianMobile(phone)) throw new ApiError(400, "Enter a valid 10-digit mobile number.");
  if (businessName.length < 2) throw new ApiError(400, "Enter your business name.");

  const { mode } = cashfreeConfig();
  let record = await getMerchantRecord(store.subdomain);

  if (record && record.mode !== mode) {
    throw new ApiError(409, `This shop's Cashfree account was made in ${record.mode} mode, but the server is in ${mode} mode. Ask the Shopersite team to reset it.`);
  }

  if (!record) {
    const merchantId = merchantIdFor(store.subdomain);
    const site = publicStoreUrl(store.subdomain, origin);
    const basics = { merchant_id: merchantId, merchant_email: email, merchant_name: businessName, poc_phone: phone, merchant_site_url: site };
    try {
      try {
        // every shop has these pages built in, so the seller doesn't have to type them on Cashfree's form
        await createMerchant({ ...basics, website_details: policyLinks(site) });
      } catch (err) {
        // if Cashfree won't take the links, make the account without them (the seller can add them in KYC)
        if (err instanceof CashfreeError && err.status === 400) {
          console.warn("[cashfree] create merchant with policy links refused, retrying without:", err.message);
          await createMerchant(basics);
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (err instanceof CashfreeError && err.status === 409) {
        // an earlier attempt may have made it already; otherwise the email is taken
        const existing = await getMerchant(merchantId).catch(() => null);
        if (!existing) {
          throw new ApiError(409, "This email already has a Cashfree account. Use a different email for this shop.", "email_in_use");
        }
      } else {
        fromCashfree(err, "Couldn't create your Cashfree account. Please try again.");
      }
    }
    const now = nowIso();
    record = {
      subdomain: store.subdomain,
      storeId: store.id,
      merchantId,
      ownerUid,
      email,
      state: "kyc_pending",
      mode,
      createdAt: now,
      updatedAt: now,
      lastCheckedAt: now,
    };
    await adminDb().collection(MERCHANTS).doc(store.subdomain).set(clean(record));
  }

  record = await refreshMerchant(record);
  if (record.state === "active") return { state: "active" };

  try {
    const link = await createOnboardingLink(record.merchantId, `${origin}/cashfree/return?store=${encodeURIComponent(store.subdomain)}`);
    return { state: record.state, link: link.onboarding_link, expiresAt: link.expires_at };
  } catch (err) {
    if (err instanceof CashfreeError && err.status === 409) {
      // merchant_product_is_active: KYC is already approved
      record = await refreshMerchant(record);
      return { state: record.state };
    }
    fromCashfree(err, "Couldn't open the Cashfree KYC form. Please try again.");
  }
}

/** The shop's built-in policy pages (src/lib/site-content.ts SITE_PAGE_IDS), as Cashfree's website_details. */
export function policyLinks(site: string) {
  const page = (id: string) => `${site}/pages/${id}`;
  return {
    website_contact_us: page("contact"),
    website_tnc: page("terms"),
    website_privacy_policy: page("privacy"),
    website_refund_policy: page("returns"),
    website_shop_delivery: page("shipping"),
  };
}

/**
 * The shop's public website for Cashfree's merchant profile. Cashfree rejects non-public addresses
 * (e.g. http://localhost), so while testing locally the live site's address is used instead.
 */
function publicStoreUrl(subdomain: string, origin: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || "shopersite.in";
  if (process.env.NEXT_PUBLIC_STORE_SUBDOMAINS_LIVE === "true") return `https://${subdomain}.${domain}`;
  const isPublic = (u: string) => /^https:\/\//.test(u) && !/^https:\/\/(localhost|127\.0\.0\.1|[^/]*\.localhost)(:|\/|$)/.test(u);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const base = isPublic(origin) ? origin : isPublic(appUrl) ? appUrl : `https://${domain}`;
  return `${base.replace(/\/+$/, "")}/s/${subdomain}`;
}

/** Whether a store can take online payments right now (used by the public checkout). */
export async function isOnlinePaymentAvailable(subdomain: string): Promise<boolean> {
  let record = await getMerchantRecord(subdomain);
  if (!record || record.mode !== cashfreeConfig().mode) return false;
  // waiting on Cashfree's review: re-check now and then, in case a webhook was missed
  const stale = Date.now() - new Date(record.lastCheckedAt).getTime() > 10 * 60 * 1000;
  if (record.state !== "active" && record.state !== "not_started" && stale) {
    record = await refreshMerchant(record).catch(() => record!);
  }
  return record.state === "active";
}

// =============================================================================================
// Buyer payments
// =============================================================================================

export interface CreatePaymentInput {
  subdomain: string;
  items: BagItemInput[];
  couponCode?: string;
  customer: { name: string; phone: string; email?: string };
  address: { street: string; city: string; state: string; pincode: string };
  notes?: string;
  /** absolute URL of the store's order page prefix, e.g. https://lume.shopersite.in/order/ */
  returnBase: string;
}

export async function createPayment(input: CreatePaymentInput, requestOrigin: string | null) {
  const store = await readStore(input.subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  if (store.isClosed || store.isPaused || store.status === "suspended") throw new ApiError(409, "This shop is currently unavailable.");

  const merchant = await getMerchantRecord(store.subdomain);
  if (!merchant || merchant.state !== "active" || merchant.mode !== cashfreeConfig().mode) {
    throw new ApiError(409, "Online payment isn't available for this shop right now. Please choose another payment option.");
  }

  let quote;
  try {
    quote = quoteOnlineOrder(store, input.items, input.couponCode);
  } catch (err) {
    if (err instanceof QuoteError) throw new ApiError(400, err.message);
    throw err;
  }

  const returnBase = checkReturnBase(input.returnBase, requestOrigin);
  const orderId = `ord_${randomBytes(12).toString("hex")}`;
  const token = `tok_sh_${randomBytes(12).toString("hex")}`;
  const now = nowIso();
  const phone = input.customer.phone;

  const pending: PendingOrder = {
    id: orderId,
    storeId: store.id,
    token,
    customer: { name: input.customer.name, phone, ...(input.customer.email ? { email: input.customer.email } : {}) },
    address: input.address,
    items: quote.items,
    subtotal: quote.subtotal,
    discount: quote.discount,
    delivery: quote.delivery,
    codFee: 0,
    total: quote.total,
    paymentMethod: "cashfree",
    cfOrderId: orderId,
    fulfilmentStatus: "placed",
    ...(input.notes || quote.couponCode
      ? { notes: [quote.couponCode ? `Coupon ${quote.couponCode}` : "", input.notes || ""].filter(Boolean).join(" · ") }
      : {}),
    createdAt: now,
    updatedAt: now,
  };

  const appOrigin = (requestOrigin || "").startsWith("https://") ? requestOrigin : null;
  let cf;
  try {
    cf = await createPgOrder(merchant.merchantId, {
      order_id: orderId,
      order_amount: toRupees(quote.total),
      order_currency: "INR",
      customer_details: {
        customer_id: `c_${phone}`,
        customer_phone: phone,
        customer_name: input.customer.name,
        ...(input.customer.email ? { customer_email: input.customer.email } : {}),
      },
      order_meta: {
        return_url: `${returnBase}${token}?placed=1`,
        // payment webhooks for this order; Cashfree only accepts https addresses
        ...(appOrigin ? { notify_url: `${appOrigin}/api/cashfree/webhook` } : {}),
      },
      order_note: `${store.name} order`.slice(0, 200),
      order_tags: { store: store.subdomain.slice(0, 50) },
    });
  } catch (err) {
    fromCashfree(err, "Couldn't start the payment. Please try again.");
  }
  if (!cf?.payment_session_id) throw new ApiError(502, "Cashfree didn't return a payment session. Please try again.");
  if (toPaise(cf.order_amount) !== quote.total) throw new ApiError(502, "The payment amount didn't match. Please try again.");

  const record: PaymentRecord = {
    orderId,
    token,
    storeSubdomain: store.subdomain,
    storeId: store.id,
    merchantId: merchant.merchantId,
    mode: merchant.mode,
    amount: quote.total,
    status: "PENDING",
    paymentSessionId: cf.payment_session_id,
    ...(cf.cf_order_id !== undefined ? { cfOrderId: String(cf.cf_order_id) } : {}),
    ...(quote.couponId ? { couponId: quote.couponId } : {}),
    order: pending,
    createdAt: now,
    updatedAt: now,
  };
  await adminDb().collection(PAYMENTS).doc(orderId).set(clean(record));

  return { orderId, token, paymentSessionId: cf.payment_session_id, mode: merchant.mode, total: quote.total };
}

/** Only send buyers back to the shop they paid from (no open redirects). */
function checkReturnBase(raw: string, requestOrigin: string | null): string {
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
    (cashfreeConfig().mode === "sandbox" && (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1"));
  if (!allowed || !/\/order\/$/.test(url.pathname) || url.search || url.hash) throw new ApiError(400, "Invalid return address.");
  if (cashfreeConfig().mode === "production" && url.protocol !== "https:") throw new ApiError(400, "Payments need a secure (https) shop address.");
  return url.toString();
}

export type VerifyResult =
  | { status: "paid"; order: OrderData }
  | { status: "pending"; paymentSessionId: string; mode: string; lastAttemptFailed: boolean }
  | { status: "failed"; reason: string };

/**
 * Checks one payment with Cashfree and, if paid, adds the order to the store (once).
 * Cashfree's API is the only thing trusted: the browser redirect and webhooks just trigger this.
 */
export async function verifyPayment(orderId: string): Promise<VerifyResult> {
  const ref = adminDb().collection(PAYMENTS).doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, "Payment not found.");
  const rec = snap.data() as PaymentRecord;

  if (rec.status === "PAID") return { status: "paid", order: rec.order as OrderData };
  if (rec.status === "FAILED") return { status: "failed", reason: "This payment was not completed." };
  if (rec.status === "AMOUNT_MISMATCH") return { status: "failed", reason: "This payment needs a manual check. The shop will contact you." };

  let cf;
  try {
    cf = await getPgOrder(rec.merchantId, rec.orderId);
  } catch (err) {
    fromCashfree(err, "Couldn't check the payment with Cashfree. Please refresh in a moment.");
  }

  if (cf.order_status === "PAID") {
    if (toPaise(cf.order_amount) !== rec.amount || (cf.order_currency || "INR") !== "INR") {
      console.error("[payments] amount mismatch", rec.orderId, cf.order_amount, rec.amount);
      await ref.update({ status: "AMOUNT_MISMATCH", updatedAt: nowIso() });
      return { status: "failed", reason: "This payment needs a manual check. The shop will contact you." };
    }
    const payments = await getPgOrderPayments(rec.merchantId, rec.orderId).catch(() => [] as Awaited<ReturnType<typeof getPgOrderPayments>>);
    const success = payments.find((p) => String(p.payment_status).toUpperCase() === "SUCCESS");
    const order = await recordPaid(orderId, success?.cf_payment_id !== undefined ? String(success.cf_payment_id) : undefined);
    return { status: "paid", order };
  }

  if (cf.order_status === "EXPIRED" || cf.order_status === "TERMINATED" || cf.order_status === "TERMINATION_REQUESTED") {
    await ref.update({ status: "FAILED", updatedAt: nowIso() });
    return { status: "failed", reason: "This payment expired. Please place the order again." };
  }

  // still open: the buyer can pay (or retry) with the same session
  const payments = await getPgOrderPayments(rec.merchantId, rec.orderId).catch(() => []);
  const last = payments[0];
  const lastAttemptFailed = !!last && ["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(String(last.payment_status).toUpperCase());
  return { status: "pending", paymentSessionId: rec.paymentSessionId, mode: rec.mode, lastAttemptFailed };
}

/** Marks the payment paid and adds the order to the store, in one transaction (safe to repeat). */
async function recordPaid(orderId: string, cfPaymentId?: string): Promise<OrderData> {
  const db = adminDb();
  const payRef = db.collection(PAYMENTS).doc(orderId);
  return db.runTransaction(async (tx) => {
    const paySnap = await tx.get(payRef);
    const rec = paySnap.data() as PaymentRecord;
    if (rec.status === "PAID") return rec.order as OrderData;

    const store = (await readStoreTx(tx, rec.storeSubdomain)) || undefined;
    const paidAt = nowIso();

    let order: OrderData;
    if (store) {
      const applied = applyPaidOrder(store, rec.order as PendingOrder, { cfPaymentId, paidAt, couponId: rec.couponId });
      if (applied) {
        order = applied.order;
        writeStoreTx(tx, rec.storeSubdomain, { ...applied.changes });
      } else {
        order = store.orders.find((o) => o.id === orderId)!;
      }
    } else {
      // the store was deleted after the buyer paid: keep the record so it can be sorted out
      order = { ...(rec.order as PendingOrder), number: "#—", paymentStatus: "paid", paymentMethod: "cashfree", ...(cfPaymentId ? { cfPaymentId, paymentUtr: cfPaymentId } : {}) };
    }
    tx.set(db.collection("orders").doc(orderId), clean({ ...order, storeSubdomain: rec.storeSubdomain }));
    tx.update(payRef, clean({ status: "PAID", order, paidAt, updatedAt: paidAt, ...(cfPaymentId ? { cfPaymentId } : {}) }));
    return order;
  });
}

export async function findPaymentByToken(token: string): Promise<PaymentRecord | null> {
  if (!/^tok_sh_[a-f0-9]{24}$/.test(token)) return null;
  const q = await adminDb().collection(PAYMENTS).where("token", "==", token).limit(1).get();
  return q.empty ? null : (q.docs[0].data() as PaymentRecord);
}

/**
 * The seller's paid online orders, so the dashboard can re-apply any a stale browser saved over.
 * Also re-checks recent unpaid payments with Cashfree in case a webhook was missed.
 */
export async function paidOrdersFor(subdomain: string): Promise<OrderData[]> {
  const col = adminDb().collection(PAYMENTS);
  const pending = await col.where("storeSubdomain", "==", subdomain).where("status", "==", "PENDING").limit(50).get();
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recent = pending.docs
    .map((d) => d.data() as PaymentRecord)
    .filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return t > cutoff && Date.now() - t > 60 * 1000;
    })
    .slice(0, 10);
  for (const r of recent) {
    await verifyPayment(r.orderId).catch((err) => console.warn("[payments] re-check failed", r.orderId, err?.message));
  }

  const paid = await col.where("storeSubdomain", "==", subdomain).where("status", "==", "PAID").limit(500).get();
  return paid.docs.map((d) => (d.data() as PaymentRecord).order as OrderData);
}

/** For webhooks: find what an event is about, then re-check it with Cashfree. */
export async function handleWebhookEvent(event: { type?: string; data?: Record<string, unknown> }): Promise<string> {
  const type = String(event.type || "");
  const data = (event.data || {}) as Record<string, any>;

  if (type.startsWith("PAYMENT_")) {
    const orderId = String(data.order?.order_id || "");
    if (!/^ord_[a-f0-9]{24}$/.test(orderId)) return "ignored: unknown order id";
    const exists = await adminDb().collection(PAYMENTS).doc(orderId).get();
    if (!exists.exists) return "ignored: no such payment";
    const r = await verifyPayment(orderId);
    return `payment ${orderId}: ${r.status}`;
  }

  if (type === "MERCHANT_ONBOARDING_STATUS" || data.merchant_id) {
    const merchantId = String(data.merchant_id || "");
    if (!merchantId) return "ignored: no merchant id";
    const q = await adminDb().collection(MERCHANTS).where("merchantId", "==", merchantId).limit(1).get();
    if (q.empty) return "ignored: unknown merchant";
    const r = await refreshMerchant(q.docs[0].data() as MerchantRecord);
    return `merchant ${merchantId}: ${r.state}`;
  }

  return `ignored: ${type || "no type"}`;
}
