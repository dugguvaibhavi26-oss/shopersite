import "server-only";
import type { StoreData } from "../store-service";
import { isStoreOwnerRequest } from "./firebase-admin";
import { sign, verifySignature } from "./secret-box";

/**
 * A short-lived pass that lets the shop owner try Razorpay test-mode checkout on their storefront.
 * Needed because the dashboard (www.shopersite.in) and the storefront (<shop>.shopersite.in) keep
 * separate sign-ins, so the storefront can't tell it's the owner. Only the owner can get one, it is
 * tied to one shop, it expires, and it only matters while the shop is on test keys (no real money).
 */
export const TEST_PASS_HEADER = "x-shop-test-pass";
const TTL_MS = 2 * 60 * 60 * 1000;

export function makeTestPass(subdomain: string) {
  const payload = Buffer.from(JSON.stringify({ k: "rztest", s: subdomain, e: Date.now() + TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readTestPass(pass: string | null | undefined, subdomain: string): boolean {
  if (!pass || pass.length > 400) return false;
  const [payload, sig] = pass.split(".");
  if (!payload || !sig || !verifySignature(payload, sig)) return false;
  try {
    const { k, s, e } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return k === "rztest" && s === subdomain && typeof e === "number" && e > Date.now();
  } catch {
    return false;
  }
}

/** May this request use the shop's test-mode payments? The signed-in owner, or someone holding the owner's pass. */
export async function canUseTestPayments(req: Request, store: StoreData) {
  return readTestPass(req.headers.get(TEST_PASS_HEADER), store.subdomain) || (await isStoreOwnerRequest(req, store));
}
