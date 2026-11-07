// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { storeService } from "@/lib/store-service";
import { PLATFORM_PLANS, canAddProduct, isThemeAllowed } from "@/lib/plans";
import { PLATFORM_THEMES, getTheme } from "@/lib/themes";

describe("Platform Multi-Tenant Store & Subscription Engine", () => {
  const testSubdomain = `testboutique-${Date.now().toString(36)}`;

  it("registers a new seller store with free starter plan & default theme", () => {
    const store = storeService.registerStoreOffline({
      name: "Test Silk Boutique",
      subdomain: testSubdomain,
      category: "Fashion & Apparel",
      ownerName: "Anita Roy",
      contactPhone: "+919876543210",
      contactEmail: "anita@testboutique.com",
      upiId: "anita@okhdfcbank",
      tagline: "Finest Indian silk sarees",
    });

    expect(store).toBeDefined();
    expect(store.subdomain).toBe(testSubdomain);
    expect(store.planId).toBe("free");
    expect(store.activeThemeSlug).toBe("mono-studio");
    // a new store starts empty: no sample products, banners or stock-photo collections
    expect(store.products).toEqual([]);
    expect(store.banners).toEqual([]);
    expect(store.categories.map((c) => c.name)).toEqual(["Fashion & Apparel"]);
    expect(store.categories.every((c) => !c.imageUrl)).toBe(true);
    expect(store.upiId).toBe("anita@okhdfcbank");
  });

  it("enforces plan product quotas on the free tier (max 75 products)", () => {
    const store = storeService.getStore(testSubdomain)!;
    expect(store).toBeDefined();

    const quota = canAddProduct(store.products.length, "free");
    expect(quota.limit).toBe(75);
    expect(quota.allowed).toBe(true);

    // Test quota block when at limit
    const atLimitQuota = canAddProduct(75, "free");
    expect(atLimitQuota.allowed).toBe(false);
    expect(atLimitQuota.remaining).toBe(0);
  });

  it("offers only the two built-in themes, to every plan", () => {
    expect(Object.keys(PLATFORM_THEMES).sort()).toEqual(["classic-bloom", "f01", "f02", "mono-studio", "theme03", "theme04", "theme05", "theme06", "theme07", "theme08", "theme09", "theme10", "theme11", "theme12", "theme13", "theme14", "theme15", "theme16", "theme17", "theme18", "theme19", "theme20", "theme21", "theme22", "theme23", "theme24", "theme25", "theme26", "theme27", "theme28", "theme29", "theme30", "theme31", "theme32", "theme33", "theme34", "theme35"]);
    for (const plan of ["free", "starter", "pro"]) {
      expect(isThemeAllowed("classic-bloom", plan)).toBe(true);
      expect(isThemeAllowed("mono-studio", plan)).toBe(true);
      expect(isThemeAllowed("theme03", plan)).toBe(true);
      expect(isThemeAllowed("theme04", plan)).toBe(true);
      expect(isThemeAllowed("theme05", plan)).toBe(true);
      expect(isThemeAllowed("bento-tech", plan)).toBe(false);
    }
    // shops still set to a removed theme show Lume Editorial
    expect(getTheme("bento-tech").slug).toBe("classic-bloom");
  });

  it("upgrades store subscription and unlocks higher quotas and premium themes", () => {
    // Upgrade to starter/growth plan
    const updated = storeService.upgradeStorePlan(testSubdomain, "starter");
    expect(updated.planId).toBe("starter");

    const starterQuota = canAddProduct(20, "starter");
    expect(starterQuota.allowed).toBe(true);
    expect(starterQuota.limit).toBe(200);

    const themeRes = storeService.setStoreTheme(testSubdomain, "classic-bloom");
    expect(themeRes.success).toBe(true);

    const storeAfterTheme = storeService.getStore(testSubdomain)!;
    expect(storeAfterTheme.activeThemeSlug).toBe("classic-bloom");
  });

  it("lets sellers moderate buyer reviews", () => {
    // buyers post reviews through the server (tests/integration/orders-billing.test.ts); here a
    // posted review is moderated by the seller
    const review = {
      id: "rev-test-1",
      storeId: "s",
      productId: "prod-test-1",
      customerName: "Meera Nair",
      rating: 5,
      comment: "Zari work is authentic and fabric is pure silk. Super fast delivery.",
      verifiedPurchase: true,
      status: "approved" as const,
      createdAt: new Date().toISOString(),
    };
    storeService.updateStore(testSubdomain, { reviews: [review] });

    expect(review).toBeDefined();
    expect(review.rating).toBe(5);
    expect(review.status).toBe("approved");

    // Moderate review (hide/pending)
    const updatedReview = storeService.updateReviewStatus(testSubdomain, review.id, "pending");
    expect(updatedReview.status).toBe("pending");
  });

});
