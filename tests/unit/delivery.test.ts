import { describe, expect, it } from "vitest";
import { amountToFreeDelivery, deliveryFee } from "@/lib/delivery";

describe("delivery charges", () => {
  it("is always free when the fee is 0", () => {
    const rule = { standardDeliveryFee: 0, freeDeliveryThreshold: 0 };
    expect(deliveryFee(rule, 10000)).toBe(0);
    expect(amountToFreeDelivery(rule, 10000)).toBe(0);
  });

  it("charges a flat fee on every order when there's no free threshold", () => {
    const rule = { standardDeliveryFee: 5000, freeDeliveryThreshold: 0 };
    expect(deliveryFee(rule, 100)).toBe(5000);
    expect(deliveryFee(rule, 10_000_000)).toBe(5000);
    expect(amountToFreeDelivery(rule, 100)).toBe(0);
  });

  it("is free at or above the threshold", () => {
    const rule = { standardDeliveryFee: 5000, freeDeliveryThreshold: 50000 };
    expect(deliveryFee(rule, 49999)).toBe(5000);
    expect(deliveryFee(rule, 50000)).toBe(0);
    expect(amountToFreeDelivery(rule, 30000)).toBe(20000);
  });

  it("charges nothing for an empty bag", () => {
    expect(deliveryFee({ standardDeliveryFee: 5000, freeDeliveryThreshold: 0 }, 0)).toBe(0);
  });
});
