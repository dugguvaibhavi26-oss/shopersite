// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { storeService } from "@/lib/store-service";
import { seedPlanRequest, seedThemePurchase } from "../helpers/seed-requests";
import { siteConfig } from "@/lib/config/site";
import { PLATFORM_PLANS, calculatePlanPrice } from "@/lib/plans";

describe("Subscription & UPI Payment Flow Unit Tests", () => {
  const testSubdomain = `subtest-${Date.now().toString(36)}`;

  beforeAll(() => {
    storeService.registerStore({
      name: "Sub Test Boutique",
      subdomain: testSubdomain,
      category: "Fashion & Apparel",
      ownerName: "Test Owner",
      contactPhone: "+919876543210",
      upiId: "testowner@okhdfcbank",
      tagline: "Test store for subscriptions",
    });
  });

  it("creates a pending subscription payment request with fixed 2-decimal amount", () => {
    const req = seedPlanRequest(testSubdomain, {
      planId: "starter",
      billingCycle: "monthly",
      paymentUtr: "428910293841",
    });

    expect(req).toBeDefined();
    expect(req.planId).toBe("starter");
    expect(req.planName).toBe(PLATFORM_PLANS.starter.name);
    expect(req.amount).toBe(29900); // ₹299.00 in paise
    expect(req.status).toBe("pending_verification");
    expect(req.estimatedVerificationTime).toBe("1-2 hours");
    expect(req.paymentUtr).toBe("428910293841");
    expect(req.referenceId).toMatch(/^SHS-SUB-/);

    const store = storeService.getStore(testSubdomain);
    expect(store?.pendingSubscription).toBeDefined();
    expect(store?.pendingSubscription?.id).toBe(req.id);
    expect(store?.planId).toBe("free"); // Plan remains free until verified
  });

  it("formats UPI URL with strictly fixed amount and standard INR currency", () => {
    const plan = PLATFORM_PLANS.starter;
    const amountRupees = plan.priceMonthly / 100;
    const fixedAmountStr = amountRupees.toFixed(2); // "299.00"

    const platformUpi = siteConfig.platformUpiId;
    const platformName = siteConfig.platformMerchantName;
    const refId = "REF-SUB-123456";
    const note = "Sub Growth Plan - demo-shop";

    const upiUrl = `upi://pay?pa=${encodeURIComponent(platformUpi)}&pn=${encodeURIComponent(
      platformName
    )}&am=${fixedAmountStr}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(refId)}`;

    expect(upiUrl).toContain("upi://pay?");
    expect(upiUrl).toContain(`am=299.00`); // Strict fixed amount
    expect(upiUrl).toContain("cu=INR");
    expect(upiUrl).toContain(`pa=${encodeURIComponent(platformUpi)}`);
  });

    it("supports quarterly billing option with 5% discount calculation", () => {
    const pricing = calculatePlanPrice("starter", "quarterly");
    expect(pricing.discountPercent).toBe(5);
    expect(pricing.totalRupees).toBe(852); // Math.round(299 * 3 * 0.95)
    expect(pricing.totalPaise).toBe(85200);

    const req = seedPlanRequest(testSubdomain, {
      planId: "starter",
      billingCycle: "quarterly",
    });

    expect(req.billingCycle).toBe("quarterly");
    expect(req.amount).toBe(85200);
    expect(req.status).toBe("pending_verification");
  });

  it("supports annual billing option with 10% discount calculation", () => {
    const pricing = calculatePlanPrice("starter", "yearly");
    expect(pricing.discountPercent).toBe(10);
    expect(pricing.totalRupees).toBe(3229); // Math.round(299 * 12 * 0.90)
    expect(pricing.totalPaise).toBe(322900);

    const req = seedPlanRequest(testSubdomain, {
      planId: "starter",
      billingCycle: "yearly",
    });

    expect(req.billingCycle).toBe("yearly");
    expect(req.amount).toBe(322900);
    expect(req.status).toBe("pending_verification");
  });

  it("verifies and activates subscription upon bank confirmation", () => {
    const req = seedPlanRequest(testSubdomain, {
      planId: "starter",
      paymentUtr: "987654321012",
    });

    const verifyRes = storeService.verifySubscriptionPayment(testSubdomain, req.id);
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.store?.planId).toBe("starter"); // Successfully upgraded to starter
    expect(verifyRes.store?.pendingSubscription).toBeNull(); // Pending cleared

    const historyItem = verifyRes.store?.subscriptionHistory?.find((h) => h.id === req.id);
    expect(historyItem).toBeDefined();
    expect(historyItem?.status).toBe("verified");
    expect(historyItem?.verifiedAt).toBeDefined();
  });

});
