import { describe, it, expect } from "vitest";
import { PLATFORM_PLANS, canUseCoupons, canUseEmail, canUseReviews, planDiscountPercent } from "@/lib/plans";

describe("subscription plans", () => {
  it("prices Growth at ₹199 with a 10-day trial, and Pro at ₹599 with ₹299 for the first 2 months", () => {
    expect(PLATFORM_PLANS.starter.priceMonthly).toBe(19900);
    expect(PLATFORM_PLANS.starter.trialDays).toBe(10);
    expect(PLATFORM_PLANS.pro.priceMonthly).toBe(59900);
    expect(PLATFORM_PLANS.pro.introPriceMonthly).toBe(29900);
    expect(PLATFORM_PLANS.pro.introMonths).toBe(2);
    expect(planDiscountPercent(PLATFORM_PLANS.starter)).toBe(0);
    expect(planDiscountPercent(PLATFORM_PLANS.pro)).toBe(0);
    expect(planDiscountPercent(PLATFORM_PLANS.free)).toBe(0);
  });

  it("sets product limits of 75, 200 and unlimited", () => {
    expect(PLATFORM_PLANS.free.maxProducts).toBe(75);
    expect(PLATFORM_PLANS.starter.maxProducts).toBe(200);
    expect(PLATFORM_PLANS.pro.maxProducts).toBeGreaterThanOrEqual(9999);
  });

  it("unlocks coupons and reviews on Growth; email is Pro only", () => {
    expect(canUseCoupons("free")).toBe(false);
    expect(canUseCoupons("starter")).toBe(true);
    expect(canUseReviews("free")).toBe(false);
    expect(canUseReviews("starter")).toBe(true);
    expect(canUseEmail("free")).toBe(false);
    expect(canUseEmail("starter")).toBe(false);
    expect(canUseEmail("pro")).toBe(true);
    expect(canUseEmail("pro")).toBe(true);
  });

  it("gives custom domains to Pro only", () => {
    expect(PLATFORM_PLANS.free.customDomain).toBe(false);
    expect(PLATFORM_PLANS.starter.customDomain).toBe(false);
    expect(PLATFORM_PLANS.pro.customDomain).toBe(true);
  });
});
