import "server-only";
import type { CashfreeMerchantResponse } from "../payments/cashfree-core";
import { ApiError } from "./api-error";

/**
 * Cashfree API calls, made with Shopersite's PARTNER key on behalf of each seller's own merchant
 * account. Settings (server-only environment variables):
 * - CASHFREE_ENV: "sandbox" (default) or "production"
 * - CASHFREE_PARTNER_API_KEY: Partner Dashboard › Developers › API keys
 * - CASHFREE_PARTNER_API_VERSION: partner (onboarding) API version, default 2023-01-01
 * - CASHFREE_PG_API_VERSION: payment gateway API version, default 2025-01-01
 */
export type CashfreeMode = "sandbox" | "production";

export function cashfreeConfig() {
  const mode: CashfreeMode = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
  const partnerKey = (process.env.CASHFREE_PARTNER_API_KEY || "").trim();
  return {
    mode,
    partnerKey,
    partnerBase: mode === "production" ? "https://api.cashfree.com/partners" : "https://api-sandbox.cashfree.com/partners",
    pgBase: mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
    partnerVersion: process.env.CASHFREE_PARTNER_API_VERSION || "2023-01-01",
    pgVersion: process.env.CASHFREE_PG_API_VERSION || "2025-01-01",
  };
}

export function requireCashfreeKey(): string {
  const { partnerKey } = cashfreeConfig();
  if (!partnerKey) throw new ApiError(503, "Online payments aren't set up on the server yet (CASHFREE_PARTNER_API_KEY missing).");
  return partnerKey;
}

/** A failed Cashfree call: the HTTP status plus Cashfree's own error code/message. */
export class CashfreeError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function call<T>(url: string, init: { method: string; headers: Record<string, string>; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method,
      headers: { Accept: "application/json", ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}), ...init.headers },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    console.error("[cashfree] network error", url, err);
    throw new ApiError(502, "Couldn't reach Cashfree. Please try again in a minute.");
  }
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // not JSON (e.g. a gateway error page)
  }
  if (!res.ok) {
    const code = String(json.code || json.type || res.status);
    const message = String(json.message || `Cashfree error ${res.status}`);
    console.warn("[cashfree]", init.method, url.replace(/\/\/[^/]+/, "//…"), res.status, code, message);
    throw new CashfreeError(res.status, code, message);
  }
  return json as T;
}

function partnerHeaders() {
  const c = cashfreeConfig();
  return { "x-partner-apikey": requireCashfreeKey(), "x-api-version": c.partnerVersion };
}

/** Payment gateway headers acting for one seller's merchant account. */
function pgHeaders(merchantId: string) {
  const c = cashfreeConfig();
  return { "x-partner-apikey": requireCashfreeKey(), "x-partner-merchantid": merchantId, "x-api-version": c.pgVersion };
}

// ----- Merchant onboarding (partner API) ------------------------------------------------------

export function createMerchant(body: {
  merchant_id: string;
  merchant_email: string;
  merchant_name: string;
  poc_phone: string;
  merchant_site_url: string;
  /** the shop's policy pages; RBI requires them and Cashfree checks them during KYC */
  website_details?: {
    website_contact_us?: string;
    website_tnc?: string;
    website_privacy_policy?: string;
    website_refund_policy?: string;
    website_shop_delivery?: string;
  };
}) {
  return call<CashfreeMerchantResponse>(`${cashfreeConfig().partnerBase}/merchants`, { method: "POST", headers: partnerHeaders(), body });
}

export async function getMerchant(merchantId: string): Promise<CashfreeMerchantResponse | null> {
  try {
    return await call<CashfreeMerchantResponse>(`${cashfreeConfig().partnerBase}/merchants/${encodeURIComponent(merchantId)}`, {
      method: "GET",
      headers: partnerHeaders(),
    });
  } catch (err) {
    if (err instanceof CashfreeError && err.status === 404) return null;
    throw err;
  }
}

/**
 * A one-hour link to Cashfree's hosted KYC form for this merchant (no Cashfree login needed).
 * The API reference spells the path "onboarding_link"; one guide spells it "onboarding-link", so
 * that is tried if the first is not found as a route.
 */
export async function createOnboardingLink(merchantId: string, returnUrl: string): Promise<{ onboarding_link: string; expires_at?: string }> {
  const base = `${cashfreeConfig().partnerBase}/merchants/${encodeURIComponent(merchantId)}`;
  const body = { type: "account_onboarding", return_url: returnUrl };
  try {
    return await call(`${base}/onboarding_link`, { method: "POST", headers: partnerHeaders(), body });
  } catch (err) {
    if (err instanceof CashfreeError && err.status === 404 && !/partner_connect_not_found|merchant/i.test(err.code + err.message)) {
      return await call(`${base}/onboarding-link`, { method: "POST", headers: partnerHeaders(), body });
    }
    // the embedded (no-login) link is a feature Cashfree enables per partner; if it is off, use the
    // standard link instead (the seller signs in to Cashfree with an OTP sent to their email)
    if (err instanceof CashfreeError && err.code === "feature_not_enabled") {
      return await call(`${base}/onboarding_link/standard`, { method: "POST", headers: partnerHeaders(), body });
    }
    throw err;
  }
}

// ----- Payments on a seller's merchant account (PG API) ----------------------------------------

export interface CfOrder {
  cf_order_id?: string | number;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED" | string;
  payment_session_id?: string;
}

export function createPgOrder(
  merchantId: string,
  body: {
    order_id: string;
    order_amount: number;
    order_currency: "INR";
    customer_details: { customer_id: string; customer_phone: string; customer_name?: string; customer_email?: string };
    order_meta: { return_url: string; notify_url?: string };
    order_note?: string;
    order_tags?: Record<string, string>;
  }
) {
  return call<CfOrder>(`${cashfreeConfig().pgBase}/orders`, {
    method: "POST",
    headers: { ...pgHeaders(merchantId), "x-idempotency-key": body.order_id },
    body,
  });
}

export function getPgOrder(merchantId: string, orderId: string) {
  return call<CfOrder>(`${cashfreeConfig().pgBase}/orders/${encodeURIComponent(orderId)}`, { method: "GET", headers: pgHeaders(merchantId) });
}

export interface CfPayment {
  cf_payment_id?: string | number;
  payment_status?: string;
  payment_amount?: number;
  payment_time?: string;
}

export async function getPgOrderPayments(merchantId: string, orderId: string): Promise<CfPayment[]> {
  const res = await call<unknown>(`${cashfreeConfig().pgBase}/orders/${encodeURIComponent(orderId)}/payments`, {
    method: "GET",
    headers: pgHeaders(merchantId),
  });
  return Array.isArray(res) ? (res as CfPayment[]) : [];
}
