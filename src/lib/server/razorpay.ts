import "server-only";
import { ApiError } from "./api-error";

export type RazorpayMode = "test" | "live";

export function razorpayKeyMode(keyId: string): RazorpayMode {
  return keyId.startsWith("rzp_live_") ? "live" : "test";
}

export class RazorpayError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function basicAuth(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

const BASE = "https://api.razorpay.com";

async function call<T>(authorization: string, url: string, init: { method: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${url}`, {
      method: init.method,
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    console.error("[razorpay] network error", url, err);
    throw new ApiError(502, "Couldn't reach Razorpay. Please try again in a minute.");
  }
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {}
  if (!res.ok) {
    const err = (json.error as Record<string, unknown>) || {};
    const code = String(err.code || res.status);
    const message = String(err.description || `Razorpay error ${res.status}`);
    console.warn("[razorpay]", init.method, url, res.status, code, message);
    throw new RazorpayError(res.status, code, message);
  }
  return json as T;
}

/** Verifies that a key pair is valid by fetching account info. Returns true if valid. */
export async function testRazorpayKeys(keyId: string, keySecret: string): Promise<boolean> {
  try {
    await call(basicAuth(keyId, keySecret), "/v1/payments?count=1", { method: "GET" });
    return true;
  } catch (err) {
    if (err instanceof RazorpayError && err.status === 401) return false;
    if (err instanceof RazorpayError && err.status === 403) return false;
    throw err;
  }
}

export interface RzOrder {
  id: string; // order_XXXXXXXXXX
  amount: number; // paise
  currency: string;
  status: "created" | "attempted" | "paid" | string;
  receipt?: string;
}

type OrderBody = { amount: number; currency: "INR"; receipt: string; notes?: Record<string, string> };

/** How to authenticate API calls for one merchant: their own key pair, or an OAuth access token. */
export type RzCredentials = { kind: "keys"; keyId: string; keySecret: string } | { kind: "oauth"; accessToken: string };

function authHeader(c: RzCredentials) {
  return c.kind === "keys" ? basicAuth(c.keyId, c.keySecret) : `Bearer ${c.accessToken}`;
}

export function createOrder(creds: RzCredentials, body: OrderBody) {
  return call<RzOrder>(authHeader(creds), "/v1/orders", { method: "POST", body });
}

export async function getOrder(creds: RzCredentials, orderId: string): Promise<RzOrder | null> {
  try {
    return await call<RzOrder>(authHeader(creds), `/v1/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
  } catch (err) {
    if (err instanceof RazorpayError && err.status === 404) return null;
    throw err;
  }
}

export interface RzPayment {
  id: string;
  amount: number; // paise
  status: "created" | "authorized" | "captured" | "refunded" | "failed" | string;
}

/** Every payment attempt on an order, so we can tell whether a buyer paid after closing the page. */
export async function getOrderPayments(creds: RzCredentials, orderId: string): Promise<RzPayment[]> {
  const r = await call<{ items?: RzPayment[] }>(authHeader(creds), `/v1/orders/${encodeURIComponent(orderId)}/payments`, { method: "GET" });
  return r.items || [];
}

// ----- OAuth (Technology Partner) -------------------------------------------------------------

const AUTH_BASE = "https://auth.razorpay.com";

export function oauthConfig() {
  const clientId = (process.env.RAZORPAY_CLIENT_ID || "").trim();
  const clientSecret = (process.env.RAZORPAY_CLIENT_SECRET || "").trim();
  const mode: RazorpayMode = process.env.RAZORPAY_OAUTH_MODE === "live" ? "live" : "test";
  return { clientId, clientSecret, mode, configured: !!(clientId && clientSecret) };
}

function requireOAuth() {
  const cfg = oauthConfig();
  if (!cfg.configured) throw new ApiError(503, "Razorpay one-click connect isn't set up yet. Use your API keys instead.");
  return cfg;
}

export interface RzOAuthToken {
  access_token: string;
  refresh_token: string;
  public_token: string;
  razorpay_account_id: string;
  token_type: string;
  expires_in: number | string;
}

async function authPost<T>(path: string, body: Record<string, string>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    console.error("[razorpay oauth] network error", path, err);
    throw new ApiError(502, "Couldn't reach Razorpay. Please try again.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn("[razorpay oauth]", path, res.status, (json as { error?: unknown }).error);
    throw new RazorpayError(res.status, String(res.status), "Razorpay rejected the request.");
  }
  return json as T;
}

export function oauthAuthorizeUrl(redirectUri: string, state: string) {
  const { clientId } = requireOAuth();
  const u = new URL(`${AUTH_BASE}/authorize`);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", "read_write");
  u.searchParams.set("state", state);
  return u.toString();
}

export function exchangeOAuthCode(code: string, redirectUri: string) {
  const { clientId, clientSecret, mode } = requireOAuth();
  return authPost<RzOAuthToken>("/token", {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
    mode,
  });
}

export function refreshOAuthToken(refreshToken: string) {
  const { clientId, clientSecret } = requireOAuth();
  return authPost<RzOAuthToken>("/token", {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export async function revokeOAuthToken(token: string): Promise<void> {
  const { clientId, clientSecret } = requireOAuth();
  try {
    await authPost("/revoke", { client_id: clientId, client_secret: clientSecret, token_type_hint: "access_token", token });
  } catch {
    // best-effort; the connection is removed on our side regardless
  }
}

/** Any Razorpay API call with a key pair (Shopersite's own account: plan subscriptions). */
export function razorpayRequest<T>(keys: { keyId: string; keySecret: string }, method: "GET" | "POST" | "PATCH", url: string, body?: unknown): Promise<T> {
  return call<T>(basicAuth(keys.keyId, keys.keySecret), url, { method, body });
}
