import { canUseCoupons } from "./plans";
import type { DiscountData, StoreData } from "./store-service";

/** Checks a coupon code against a store's coupons. Pure, so the checkout and the server agree. */
export function evaluateCoupon(
  store: Pick<StoreData, "discounts" | "planId">,
  rawCode: string,
  subtotal: number
): { ok: true; discount: DiscountData; amount: number } | { ok: false; error: string } {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code." };
  if (!canUseCoupons(store.planId)) return { ok: false, error: "This code isn't valid." };
  const d = store.discounts?.find((x) => x.isActive && x.code.toUpperCase() === code);
  if (!d) return { ok: false, error: "This code isn't valid." };
  const now = Date.now();
  if (d.startsAt && new Date(d.startsAt).getTime() > now) return { ok: false, error: "This code isn't active yet." };
  if (d.expiresAt && new Date(d.expiresAt).getTime() < now) return { ok: false, error: "This code has expired." };
  if (d.usageLimit && d.timesUsed >= d.usageLimit) return { ok: false, error: "This code has been fully used." };
  if (d.minOrderValue && subtotal < d.minOrderValue) {
    return { ok: false, error: `Add items worth ₹${(d.minOrderValue / 100).toLocaleString("en-IN")} or more to use this code.` };
  }
  let amount = d.type === "percentage" ? Math.round((subtotal * d.value) / 100) : d.value;
  if (d.type === "percentage" && d.maxDiscount) amount = Math.min(amount, d.maxDiscount);
  return { ok: true, discount: d, amount: Math.max(0, Math.min(amount, subtotal)) };
}
