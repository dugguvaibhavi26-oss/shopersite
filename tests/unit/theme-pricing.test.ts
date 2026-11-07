// @vitest-environment node
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { storeService } from "@/lib/store-service";
import { seedPlanRequest, seedThemePurchase } from "../helpers/seed-requests";
import { applyThemePricing, canEditTheme, canUseTheme, getThemePlan, getThemePrice, planActive, setAllThemesFree } from "@/lib/theme-pricing";

const DAY = 24 * 60 * 60 * 1000;
const later = (days: number) => new Date(Date.now() + days * DAY).toISOString();

// these check the paid-theme rules, which are switched off while every theme is free
beforeAll(() => setAllThemesFree(false));
afterAll(() => setAllThemesFree(true));

describe("Theme prices and plans", () => {
  beforeEach(() => applyThemePricing(null));

  it("starts a few themes free and the rest priced, some with a plan", () => {
    expect(getThemePrice("mono-studio")).toBe(0);
    expect(getThemePrice("theme20")).toBe(49900);
    expect(getThemePlan("theme06")).toBe("starter");
    expect(getThemePlan("theme12")).toBe("pro");
    expect(getThemePlan("theme20")).toBeNull();
    // a free theme needs no plan
    expect(getThemePlan("mono-studio")).toBeNull();
  });

  it("follows the admin's prices and plans", () => {
    applyThemePricing({ prices: { theme20: 99900, "mono-studio": 19900 }, plans: { theme20: "pro" } });
    expect(getThemePrice("theme20")).toBe(99900);
    expect(getThemePlan("theme20")).toBe("pro");
    expect(getThemePrice("mono-studio")).toBe(19900);
  });

  it("ignores broken saved values", () => {
    applyThemePricing({ prices: { theme20: -5, theme21: "abc" }, plans: { theme22: "gold" } });
    expect(getThemePrice("theme20")).toBe(49900);
    expect(getThemePrice("theme21")).toBe(49900);
    expect(getThemePlan("theme22")).toBeNull();
  });
});

describe("Who can use and edit a theme", () => {
  beforeEach(() => applyThemePricing(null));

  it("lets a Free shop use free themes but not edit them", () => {
    const shop = { planId: "free" };
    expect(canUseTheme(shop, "mono-studio")).toBe(true);
    expect(canEditTheme(shop, "mono-studio")).toBe(false);
    expect(canUseTheme(shop, "theme20")).toBe(false);
  });

  it("lets a Free shop use and edit a theme it bought", () => {
    const shop = { planId: "free", ownedThemes: ["theme20"] };
    expect(canUseTheme(shop, "theme20")).toBe(true);
    expect(canEditTheme(shop, "theme20")).toBe(true);
  });

  it("gives plan themes only while the plan is paid for", () => {
    const paid = { planId: "starter", planPaidUntil: later(10) };
    expect(planActive(paid)).toBe(true);
    expect(canUseTheme(paid, "theme06")).toBe(true);
    expect(canEditTheme(paid, "theme06")).toBe(true);
    // a Pro-only theme isn't on Growth
    expect(canUseTheme(paid, "theme12")).toBe(false);
    // a theme with no plan has to be bought
    expect(canUseTheme(paid, "theme20")).toBe(false);

    const lapsed = { planId: "starter", planPaidUntil: later(-1), activeThemeSlug: "theme06", planThemes: ["theme06"] };
    expect(planActive(lapsed)).toBe(false);
    expect(canUseTheme(lapsed, "theme06")).toBe(false);
  });

  it("gives Pro the themes that come with Growth too", () => {
    const pro = { planId: "pro", planPaidUntil: later(5) };
    expect(canUseTheme(pro, "theme06")).toBe(true);
    expect(canUseTheme(pro, "theme12")).toBe(true);
  });

  it("keeps a theme a shop was already on before it got a price", () => {
    expect(canUseTheme({ planId: "free", activeThemeSlug: "theme20" }, "theme20")).toBe(true);
  });

  it("keeps a bought theme after the plan lapses", () => {
    const shop = { planId: "starter", planPaidUntil: later(-3), ownedThemes: ["theme06"], activeThemeSlug: "theme06" };
    expect(canUseTheme(shop, "theme06")).toBe(true);
    expect(canEditTheme(shop, "theme06")).toBe(true);
  });
});

describe("Buying a theme", () => {
  let sub = "";

  beforeEach(() => {
    applyThemePricing(null);
    sub = `theme-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    storeService.registerStoreOffline({
      name: "Theme Buyer",
      subdomain: sub,
      category: "Fashion & Apparel",
      ownerName: "Test Owner",
      contactPhone: "+919876543210",
      upiId: "testowner@okhdfcbank",
      tagline: "Theme test store",
    });
  });

  it("won't switch a Free shop to a priced theme it hasn't bought", () => {
    expect(storeService.setStoreTheme(sub, "theme20").success).toBe(false);
  });

  it("unlocks the theme for good once the admin approves the payment", () => {
    const purchase = seedThemePurchase(sub, "theme20", "428910293841");
    expect(purchase.amount).toBe(49900);
    // waiting for approval: not yet (a second request is refused by the server, see orders-billing.test.ts)
    expect(storeService.setStoreTheme(sub, "theme20").success).toBe(false);

    expect(storeService.verifyThemePurchase(sub, purchase.id)).toBe(true);
    const store = storeService.getStore(sub)!;
    expect(store.ownedThemes).toContain("theme20");
    expect(storeService.setStoreTheme(sub, "theme20").success).toBe(true);
    expect(canEditTheme(storeService.getStore(sub)!, "theme20")).toBe(true);
  });

  it("leaves the theme locked when the payment is rejected", () => {
    const purchase = seedThemePurchase(sub, "theme20");
    expect(storeService.rejectThemePurchase(sub, purchase.id, "UTR not found")).toBe(true);
    const store = storeService.getStore(sub)!;
    expect(store.ownedThemes || []).not.toContain("theme20");
    expect(store.themePurchases?.[0].note).toBe("UTR not found");
  });

  it("gives an approved plan a paid-until date a month on", () => {
    const req = seedPlanRequest(sub, { planId: "starter", billingCycle: "monthly" });
    storeService.verifySubscriptionPayment(sub, req.id);
    const store = storeService.getStore(sub)!;
    const days = (new Date(store.planPaidUntil!).getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(27);
    expect(days).toBeLessThan(32);
    expect(storeService.setStoreTheme(sub, "theme06").success).toBe(true);
    expect(storeService.getStore(sub)!.planThemes).toContain("theme06");
  });
});

describe("every theme free", () => {
  it("any shop can use any theme at no cost while ALL_THEMES_FREE is on", async () => {
    setAllThemesFree(true);
    const { getThemePrice, canUseTheme, getThemePlan } = await import("@/lib/theme-pricing");
    for (const slug of ["mono-studio", "theme12", "theme35", "custom-abc"]) {
      expect(getThemePrice(slug)).toBe(0);
      expect(getThemePlan(slug)).toBeNull();
      expect(canUseTheme({ planId: "free" }, slug)).toBe(true);
    }
    setAllThemesFree(false);
  });
});
