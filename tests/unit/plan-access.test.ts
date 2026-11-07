import { describe, it, expect, afterEach } from "vitest";
import {
  PLATFORM_PLANS,
  UNLIMITED,
  applyPlanAccess,
  canAddBanner,
  canAddProduct,
  canUseCoupons,
  canUseCustomDomain,
  canUseEmail,
  canUseReviews,
  cheapestPlanWith,
  getAllPlanAccess,
  getDefaultPlanAccess,
} from "@/lib/plans";

describe("admin-controlled feature access per plan", () => {
  afterEach(() => applyPlanAccess(null)); // back to defaults

  it("starts from the default plan features", () => {
    expect(getAllPlanAccess()).toEqual(getDefaultPlanAccess());
    expect(canUseCoupons("free")).toBe(false);
    expect(canUseCoupons("starter")).toBe(true);
    expect(canUseEmail("starter")).toBe(false);
    expect(canUseEmail("pro")).toBe(true);
    expect(canUseCustomDomain("pro")).toBe(true);
  });

  it("applies admin changes to every check for that plan", () => {
    applyPlanAccess({ free: { coupons: true, maxProducts: 120, maxBanners: 3 }, starter: { email: true } });
    expect(canUseCoupons("free")).toBe(true);
    expect(canUseEmail("starter")).toBe(true);
    expect(canAddProduct(119, "free").allowed).toBe(true);
    expect(canAddProduct(120, "free").allowed).toBe(false);
    expect(canAddBanner(2, "free")).toEqual({ allowed: true, limit: 3 });
    expect(canAddBanner(3, "free").allowed).toBe(false);
    // untouched settings keep their defaults
    expect(canUseReviews("free")).toBe(false);
  });

  it("keeps the plan card's product line in step with the limit", () => {
    applyPlanAccess({ free: { maxProducts: 120 }, starter: { maxProducts: UNLIMITED } });
    expect(PLATFORM_PLANS.free.features).toContain("Up to 120 products");
    expect(PLATFORM_PLANS.starter.features).toContain("Unlimited products");
    applyPlanAccess(null);
    expect(PLATFORM_PLANS.free.features).toContain("Up to 75 products");
  });

  it("ignores broken saved values and falls back to defaults", () => {
    applyPlanAccess({ free: { maxProducts: -5 as number, coupons: "yes" as unknown as boolean } });
    expect(PLATFORM_PLANS.free.maxProducts).toBe(75);
    expect(canUseCoupons("free")).toBe(false);
  });

  it("names the cheapest plan that unlocks a feature", () => {
    expect(cheapestPlanWith("reviews")?.id).toBe("starter");
    expect(cheapestPlanWith("email")?.id).toBe("pro");
    applyPlanAccess({ free: { reviews: true } });
    expect(cheapestPlanWith("reviews")?.id).toBe("free");
    applyPlanAccess({ free: { email: false }, starter: { email: false }, pro: { email: false } });
    expect(cheapestPlanWith("email")).toBeUndefined();
  });
});
