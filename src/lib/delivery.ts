import type { StoreData } from "./store-service";

export type DeliveryRule = Pick<StoreData, "freeDeliveryThreshold" | "standardDeliveryFee">;

/**
 * Delivery charge in paise for a bag subtotal (before coupons).
 * A fee of 0 means delivery is always free; a threshold of 0 means there's no free-delivery offer.
 */
export function deliveryFee(rule: DeliveryRule, subtotal: number): number {
  if (subtotal <= 0 || !(rule.standardDeliveryFee > 0)) return 0;
  if (rule.freeDeliveryThreshold > 0 && subtotal >= rule.freeDeliveryThreshold) return 0;
  return rule.standardDeliveryFee;
}

/** How much more the buyer needs to add for free delivery, or 0 if that doesn't apply. */
export function amountToFreeDelivery(rule: DeliveryRule, subtotal: number): number {
  if (!(rule.standardDeliveryFee > 0) || !(rule.freeDeliveryThreshold > 0)) return 0;
  return Math.max(0, rule.freeDeliveryThreshold - subtotal);
}
