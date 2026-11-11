/**
 * Which parts of a store are public, private or protected. Shared by the browser, the server and
 * firestore.rules (keep the lists there in step with these).
 *
 * Firestore layout:
 * - stores/{subdomain}                   public: what the storefront needs (products, theme, prices…)
 * - stores/{subdomain}/private/data      private: buyers' details and payment records (owner + admin)
 */
import type { StoreData } from "./store-service";
import { effectivePlan } from "./subscription";

/** Kept in stores/{subdomain}/private/data, never in the public store document. */
export const PRIVATE_STORE_KEYS = [
  "orders",
  "customers",
  "subscribers",
  "pendingSubscription",
  "subscriptionHistory",
  "themePurchases",
  // the shop's Razorpay subscription for its Shopersite plan (server-written)
  "planBilling",
] as const;
export type PrivateStoreKey = (typeof PRIVATE_STORE_KEYS)[number];

/** Private fields that only the server or an admin may change (payment requests and approvals). */
export const BILLING_KEYS = ["pendingSubscription", "subscriptionHistory", "themePurchases", "planBilling"] as const;

/** Public fields a store owner may never change themselves (plan, ownership, suspension…). */
export const OWNER_LOCKED_KEYS = [
  "id",
  "subdomain",
  "ownerId",
  "ownerEmail",
  "planId",
  "planPaidUntil",
  "ownedThemes",
  "isPaused",
  "pauseMessage",
  "status",
  "createdAt",
  // set by the server once a domain is connected (Settings → Domain)
  "customDomain",
  // the 5-digit store ID staff sign in with (the server keeps the real list in store_codes)
  "storeCode",
] as const;

const PRIVATE = new Set<string>(PRIVATE_STORE_KEYS);

/** Splits a partial store update into its public and private parts. */
export function splitStoreUpdate(updates: Partial<StoreData>): { pub: Record<string, unknown>; priv: Record<string, unknown> } {
  const pub: Record<string, unknown> = {};
  const priv: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined) continue;
    (PRIVATE.has(k) ? priv : pub)[k] = v;
  }
  return { pub, priv };
}

/** The store as one object: public fields plus private ones (or older public copies of them). */
export function mergeStoreParts(pub: Partial<StoreData>, priv?: Partial<StoreData> | null): StoreData {
  const merged: Record<string, unknown> = { ...pub };
  const defaults: Record<PrivateStoreKey, unknown> = {
    orders: [],
    customers: [],
    subscribers: [],
    pendingSubscription: null,
    subscriptionHistory: [],
    themePurchases: [],
    planBilling: null,
  };
  for (const k of PRIVATE_STORE_KEYS) {
    const fromPriv = priv && k in priv ? (priv as Record<string, unknown>)[k] : undefined;
    merged[k] = fromPriv !== undefined ? fromPriv : (pub as Record<string, unknown>)[k] ?? defaults[k];
  }
  // a paid plan past its end date counts as Free everywhere (dashboard, shop and server)
  return effectivePlan(merged as unknown as StoreData);
}
