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

export async function fetchOnlineAvailability(store: string): Promise<boolean> {
  try {
    const r = await json<{ online: boolean }>(await fetch(`/api/payments/availability?store=${encodeURIComponent(store)}`, { cache: "no-store" }));
    return !!r.online;
  } catch {
    return false;
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
  return json(await fetch("/api/payments/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
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
