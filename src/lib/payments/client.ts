"use client";

import { auth } from "../firebase";
import type { MerchantState } from "./cashfree-core";
import type { OrderData } from "../store-service";

/** Browser-side calls to the payment routes. */

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || "Something went wrong. Please try again.");
  return body as T;
}

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

export interface MerchantStatus {
  state: MerchantState;
  merchantId?: string;
  email?: string;
  mode: string;
}

export async function fetchMerchantStatus(store: string): Promise<MerchantStatus> {
  return json(await fetch(`/api/cashfree/merchant?store=${encodeURIComponent(store)}`, { headers: await authHeaders(), cache: "no-store" }));
}

export async function startKyc(input: { store: string; email: string; phone: string; businessName: string }): Promise<{ state: MerchantState; link?: string }> {
  return json(
    await fetch("/api/cashfree/merchant", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(input),
    })
  );
}

export async function fetchPaidOnlineOrders(store: string): Promise<OrderData[]> {
  const r = await json<{ orders: OrderData[] }>(
    await fetch(`/api/payments/orders?store=${encodeURIComponent(store)}`, { headers: await authHeaders(), cache: "no-store" })
  );
  return r.orders || [];
}

export interface OnlineAvailability {
  online: boolean;
  provider: "cashfree" | "razorpay" | null;
  /** The shop is on test keys; only its signed-in owner is offered online payment. */
  testMode?: boolean;
}

/** The sign-in header when someone is signed in (so a shop's owner can try test payments), else none. */
const TEST_PASS_PARAM = "rzp_test";
const TEST_PASS_KEY = "shop-test-pass";

/**
 * The owner's "Try a test payment" link opens the storefront with ?rzp_test=<pass>. Keep it for this
 * tab (the storefront and dashboard don't share sign-in) and tidy it out of the address bar.
 */
export function captureShopTestPass() {
  try {
    const url = new URL(window.location.href);
    const pass = url.searchParams.get(TEST_PASS_PARAM);
    if (!pass) return;
    sessionStorage.setItem(TEST_PASS_KEY, pass.slice(0, 400));
    url.searchParams.delete(TEST_PASS_PARAM);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  } catch {
    // no session storage: the owner can still test by signing in on the storefront
  }
}

async function optionalAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  captureShopTestPass();
  try {
    const pass = sessionStorage.getItem(TEST_PASS_KEY);
    if (pass) headers["x-shop-test-pass"] = pass;
  } catch {}
  try {
    const user = auth.currentUser;
    if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  } catch {}
  return headers;
}

export async function fetchOnlineAvailability(store: string): Promise<OnlineAvailability> {
  try {
    const r = await json<OnlineAvailability>(
      await fetch(`/api/payments/availability?store=${encodeURIComponent(store)}`, { cache: "no-store", headers: await optionalAuthHeaders() })
    );
    return { online: !!r.online, provider: r.provider ?? null, testMode: !!r.testMode };
  } catch {
    return { online: false, provider: null };
  }
}

export interface CreatePaymentResponse {
  orderId: string;
  token: string;
  paymentSessionId: string;
  mode: "sandbox" | "production";
  total: number;
}

export async function createOnlinePayment(body: unknown): Promise<CreatePaymentResponse> {
  return json(
    await fetch("/api/payments/create", { method: "POST", headers: { "Content-Type": "application/json", ...(await optionalAuthHeaders()) }, body: JSON.stringify(body) })
  );
}

export type VerifyResponse =
  | { status: "paid"; order: OrderData }
  | { status: "pending"; paymentSessionId: string; mode: "sandbox" | "production"; lastAttemptFailed: boolean }
  | { status: "failed"; reason: string };

export async function verifyOnlinePayment(store: string, token: string): Promise<VerifyResponse> {
  return json(await fetch(`/api/payments/verify?store=${encodeURIComponent(store)}&token=${encodeURIComponent(token)}`, { cache: "no-store" }));
}

// ----- Buyers' own orders (buyer details aren't public, so they come from the server) ----------

export async function trackOrders(store: string, tokens: string[]): Promise<OrderData[]> {
  if (!tokens.length) return [];
  const r = await json<{ orders: OrderData[] }>(
    await fetch("/api/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store, tokens: tokens.slice(0, 50) }), cache: "no-store" })
  );
  return r.orders || [];
}

/** Buyer: cancel the order (before shipping) or ask for a return, if the shop allows it. */
export async function requestOrderChange(store: string, token: string, kind: "cancel" | "return", reason: string): Promise<OrderData> {
  const r = await json<{ order: OrderData }>(
    await fetch("/api/orders/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store, token, kind, reason }) })
  );
  return r.order;
}

export async function findOrderToken(store: string, number: string, phone: string): Promise<string> {
  const r = await json<{ token: string }>(
    await fetch("/api/orders/find", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store, number, phone }) })
  );
  return r.token;
}

// ----- Razorpay checkout -----------------------------------------------------------------------

export interface CreateRazorpayResponse {
  orderId: string;
  token: string;
  rzOrderId: string;
  keyId: string;
  mode: "test" | "live";
  total: number;
}

export async function createRazorpayPayment(body: unknown): Promise<CreateRazorpayResponse> {
  return json(
    await fetch("/api/razorpay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await optionalAuthHeaders()) },
      body: JSON.stringify(body),
    })
  );
}

export interface RazorpayVerifyResponse {
  status: "paid" | "failed";
  order?: import("../store-service").OrderData;
  reason?: string;
}

export async function verifyRazorpayPayment(
  store: string,
  token: string,
  razorpay_payment_id: string,
  razorpay_order_id: string,
  razorpay_signature: string
): Promise<RazorpayVerifyResponse> {
  return json(
    await fetch("/api/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store, token, razorpay_payment_id, razorpay_order_id, razorpay_signature }),
    })
  );
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: "INR";
  order_id: string;
  name?: string;
  prefill?: { name?: string; contact?: string; email?: string };
  theme?: { color?: string };
};

type RazorpayConstructor = new (options: RazorpayCheckoutOptions & {
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}) => { open(): void; close(): void };

let rzpSdk: Promise<RazorpayConstructor> | null = null;

function loadRazorpay(): Promise<RazorpayConstructor> {
  const w = window as unknown as { Razorpay?: RazorpayConstructor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  if (!rzpSdk) {
    rzpSdk = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("Razorpay didn't load.")));
      s.onerror = () => {
        rzpSdk = null;
        reject(new Error("Couldn't load the payment page. Check your internet and try again."));
      };
      document.head.appendChild(s);
    });
  }
  return rzpSdk;
}

/** Opens Razorpay Checkout and resolves with the payment response after success, or rejects on dismissal/failure. */
export async function openRazorpayCheckout(opts: {
  keyId: string;
  rzOrderId: string;
  amount: number;
  storeName?: string;
  prefill?: { name?: string; contact?: string; email?: string };
}): Promise<{ razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }> {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: opts.keyId,
      amount: opts.amount,
      currency: "INR",
      order_id: opts.rzOrderId,
      name: opts.storeName || "Shopersite",
      prefill: opts.prefill,
      theme: { color: "#171717" },
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
    });
    rzp.open();
  });
}

// ----- Cashfree's checkout (cashfree.js v3) ---------------------------------------------------

type CashfreeFactory = (opts: { mode: "sandbox" | "production" }) => {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<{ error?: { message?: string } } | undefined>;
};

let sdk: Promise<CashfreeFactory> | null = null;

function loadCashfree(): Promise<CashfreeFactory> {
  const w = window as unknown as { Cashfree?: CashfreeFactory };
  if (w.Cashfree) return Promise.resolve(w.Cashfree);
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      s.async = true;
      s.onload = () => (w.Cashfree ? resolve(w.Cashfree) : reject(new Error("Cashfree didn't load.")));
      s.onerror = () => {
        sdk = null;
        reject(new Error("Couldn't load the payment page. Check your internet and try again."));
      };
      document.head.appendChild(s);
    });
  }
  return sdk;
}

/** Opens Cashfree's payment page in this tab. Cashfree brings the buyer back to the order page. */
export async function openCashfreeCheckout(paymentSessionId: string, mode: "sandbox" | "production"): Promise<void> {
  const Cashfree = await loadCashfree();
  const result = await Cashfree({ mode }).checkout({ paymentSessionId, redirectTarget: "_self" });
  if (result?.error) throw new Error(result.error.message || "The payment couldn't be started.");
}
