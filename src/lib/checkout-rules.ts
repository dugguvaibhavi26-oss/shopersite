/**
 * The seller's checkout rules (Settings → Checkout and Customer accounts). The same functions run in
 * the buyer's browser (to explain things before they pay) and on the server (where they're enforced),
 * so the two can never disagree.
 */
import type { CheckoutRules, StoreData } from "./store-service";

export interface ResolvedRules {
  minOrder: number;
  codMax: number;
  orderNotes: boolean;
  email: "optional" | "required" | "hidden";
  requireLogin: boolean;
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
  };
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
