import { describe, it, expect } from "vitest";
import { PLATFORM_PLANS, canUseCoupons, canUseEmail, canUseReviews, planDiscountPercent } from "@/lib/plans";

describe("subscription plans", () => {
  it("prices Growth at ₹299 (was ₹499) and Pro at ₹999 (was ₹1,499)", () => {
    expect(PLATFORM_PLANS.starter.priceMonthly).toBe(29900);
    expect(PLATFORM_PLANS.starter.originalPriceMonthly).toBe(49900);
    expect(PLATFORM_PLANS.pro.priceMonthly).toBe(99900);
    expect(PLATFORM_PLANS.pro.originalPriceMonthly).toBe(149900);
    expect(planDiscountPercent(PLATFORM_PLANS.starter)).toBe(40);
    expect(planDiscountPercent(PLATFORM_PLANS.pro)).toBe(33);
    expect(planDiscountPercent(PLATFORM_PLANS.free)).toBe(0);
  });

  it("sets product limits of 75, 200 and unlimited", () => {
    expect(PLATFORM_PLANS.free.maxProducts).toBe(75);
    expect(PLATFORM_PLANS.starter.maxProducts).toBe(200);
    expect(PLATFORM_PLANS.pro.maxProducts).toBeGreaterThanOrEqual(9999);
  });

  it("unlocks coupons and reviews on Growth, email integration only on Pro", () => {
    expect(canUseCoupons("free")).toBe(false);
    expect(canUseCoupons("starter")).toBe(true);
    expect(canUseReviews("free")).toBe(false);
    expect(canUseReviews("starter")).toBe(true);
    expect(canUseEmail("starter")).toBe(false);
    expect(canUseEmail("pro")).toBe(true);
  });

  it("gives custom domains to Pro only", () => {
    expect(PLATFORM_PLANS.free.customDomain).toBe(false);
    expect(PLATFORM_PLANS.starter.customDomain).toBe(false);
    expect(PLATFORM_PLANS.pro.customDomain).toBe(true);
  });
});
