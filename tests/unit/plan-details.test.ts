import { describe, it, expect, afterEach } from "vitest";
import {
  PLATFORM_PLANS,
  applyPlanAccess,
  applyPlanDetails,
  calculatePlanPrice,
  getAllPlanDetails,
  getDefaultPlanDetails,
  planDiscountPercent,
} from "@/lib/plans";

describe("admin-editable plan details", () => {
  afterEach(() => {
    applyPlanDetails(null);
    applyPlanAccess(null);
  });

  it("starts from the built-in plans", () => {
    expect(getAllPlanDetails()).toEqual(getDefaultPlanDetails());
    expect(PLATFORM_PLANS.starter.priceFormatted).toBe("₹299 / month");
  });

  it("renames and re-prices a plan everywhere it's read", () => {
    applyPlanDetails({ pro: { name: "Business", priceRupees: 1299, originalPriceRupees: 1999, description: "For big shops" } });
    expect(PLATFORM_PLANS.pro.name).toBe("Business");
    expect(PLATFORM_PLANS.pro.priceMonthly).toBe(129900);
    expect(PLATFORM_PLANS.pro.priceFormatted).toBe("₹1,299 / month");
    expect(PLATFORM_PLANS.pro.originalPriceFormatted).toBe("₹1,999 / month");
    expect(planDiscountPercent(PLATFORM_PLANS.pro)).toBe(35);
    expect(calculatePlanPrice("pro", "monthly").totalRupees).toBe(1299);
    expect(PLATFORM_PLANS.pro.description).toBe("For big shops");
  });

  it("hides the 'was' price when it isn't higher than the price", () => {
    applyPlanDetails({ starter: { priceRupees: 399, originalPriceRupees: 0 } });
    expect(PLATFORM_PLANS.starter.originalPriceFormatted).toBeUndefined();
    expect(planDiscountPercent(PLATFORM_PLANS.starter)).toBe(0);
  });

  it("keeps Free at ₹0 and ignores broken values", () => {
    applyPlanDetails({ free: { priceRupees: 500 }, starter: { priceRupees: -10, name: "  " } });
    expect(PLATFORM_PLANS.free.priceMonthly).toBe(0);
    expect(PLATFORM_PLANS.starter.priceMonthly).toBe(29900);
    expect(PLATFORM_PLANS.starter.name).toBe("Growth");
  });

  it("uses the edited feature list, with the product line following the limit", () => {
    applyPlanAccess({ free: { maxProducts: 120 } });
    applyPlanDetails({ free: { features: ["Up to 75 products", "Sell on WhatsApp", "  "] } });
    expect(PLATFORM_PLANS.free.features).toEqual(["Up to 120 products", "Sell on WhatsApp"]);
  });
});
