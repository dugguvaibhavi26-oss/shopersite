/**
 * The seller's checkout rules (Settings → Checkout and Customer accounts). The same functions run in
 * the buyer's browser (to explain things before they pay) and on the server (where they're enforced),
 * so the two can never disagree.
 */
import type { CheckoutRules, StoreData } from "./store-service";

export type FieldRule = "optional" | "required" | "hidden";

export interface ResolvedRules {
  minOrder: number;
  codMax: number;
  orderNotes: boolean;
  email: FieldRule;
  requireLogin: boolean;
  landmark: FieldRule;
  altPhone: FieldRule;
  marketingOptIn: boolean;
  codPincodes: string[];
  thankYou: string;
}

const fieldRule = (v: unknown, fallback: FieldRule): FieldRule => (v === "optional" || v === "required" || v === "hidden" ? v : fallback);

/** PIN codes typed by the seller: 6-digit ones only, no repeats, at most 1000. */
export function cleanPincodes(v: unknown): string[] {
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\s,;]+/) : [];
  return Array.from(new Set(list.map((x) => String(x).trim()).filter((x) => /^[1-9][0-9]{5}$/.test(x)))).slice(0, 1000);
}

const paise = (v: unknown) => {
  const n = Math.round(Number(v) || 0);
  return n > 0 ? Math.min(n, 10_000_000_00) : 0;
};

export function checkoutRulesOf(store: Pick<StoreData, "checkoutRules">): ResolvedRules {
  const r: CheckoutRules = store.checkoutRules || {};
  return {
    minOrder: paise(r.minOrder),
    codMax: paise(r.codMax),
    orderNotes: r.orderNotes !== false,
    email: r.email === "required" || r.email === "hidden" ? r.email : "optional",
    requireLogin: r.requireLogin === true,
    landmark: fieldRule(r.landmark, "hidden"),
    altPhone: fieldRule(r.altPhone, "hidden"),
    marketingOptIn: r.marketingOptIn === true,
    codPincodes: cleanPincodes(r.codPincodes),
    thankYou: typeof r.thankYou === "string" ? r.thankYou.trim().slice(0, 300) : "",
  };
}

/** Problems with the extra details the seller asks for (landmark, second phone), or "" when fine. */
export function detailsProblem(store: Pick<StoreData, "checkoutRules">, d: { landmark?: string; altPhone?: string; phone?: string }): string {
  const r = checkoutRulesOf(store);
  const landmark = (d.landmark || "").trim();
  const alt = (d.altPhone || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  if (r.landmark === "required" && landmark.length < 3) return "Add a landmark near your address.";
  if (landmark.length > 120) return "Keep the landmark under 120 characters.";
  if (r.altPhone === "required" && !alt) return "Add another phone number we can reach you on.";
  if (alt && !/^[6-9]\d{9}$/.test(alt)) return "Enter a 10-digit mobile number for the second phone.";
  if (alt && d.phone && alt === d.phone.replace(/\D/g, "").slice(-10)) return "The second phone should be a different number.";
  return "";
}

/**
 * Why cash on delivery can't be used for this bag and address (a product the seller marked online-only,
 * or a PIN code they don't deliver COD to), or "". Like codAllowedFor, it only applies when the shop
 * also takes online payment; otherwise COD is the shop's only way to take orders.
 */
export function codBlockedReason(
  store: Pick<StoreData, "checkoutRules" | "products">,
  bag: { productIds: string[]; pincode?: string },
  onlineAvailable = true
): string {
  if (!onlineAvailable) return "";
  const r = checkoutRulesOf(store);
  const pin = (bag.pincode || "").trim();
  if (pin && r.codPincodes.includes(pin)) return `Cash on delivery isn't available for PIN code ${pin}. Please pay online.`;
  const blocked = (store.products || []).find((p) => p.codBlocked && bag.productIds.includes(p.id));
  if (blocked) return `"${blocked.title}" can only be paid online.`;
  return "";
}

const rupees = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

/** Why the order's item total is too small, or "" when it's fine. `itemsTotal` = subtotal − discount. */
export function minOrderProblem(store: Pick<StoreData, "checkoutRules">, itemsTotal: number): string {
  const { minOrder } = checkoutRulesOf(store);
  return minOrder && itemsTotal < minOrder ? `This shop's minimum order is ${rupees(minOrder)}. Add ${rupees(minOrder - itemsTotal)} more to your bag.` : "";
}

/** Whether cash on delivery is allowed for this total. */
/**
 * Can this order be paid on delivery? Without online payment, Cash on Delivery is the shop's only
 * way to take orders, so it's always allowed then; with online payment, the seller's COD switch
 * and COD order limit apply.
 */
export function codAllowedFor(store: Pick<StoreData, "checkoutRules" | "codEnabled">, total: number, onlineAvailable = true): boolean {
  if (!onlineAvailable) return true;
  if (!store.codEnabled) return false;
  const { codMax } = checkoutRulesOf(store);
  return !codMax || total <= codMax;
}

export function codLimitText(store: Pick<StoreData, "checkoutRules">): string {
  const { codMax } = checkoutRulesOf(store);
  return codMax ? `Cash on delivery is available on orders up to ${rupees(codMax)}.` : "";
}

/** Problems with who is ordering (sign-in, email), or "" when it's fine. */
export function buyerProblem(store: Pick<StoreData, "checkoutRules">, buyer: { email?: string; signedIn: boolean }): string {
  const r = checkoutRulesOf(store);
  if (r.requireLogin && !buyer.signedIn) return "Please sign in to place an order at this shop.";
  if (r.email === "required" && !buyer.email) return "Enter your email address.";
  return "";
}
