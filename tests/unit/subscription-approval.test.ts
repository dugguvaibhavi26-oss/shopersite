// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { storeService } from "@/lib/store-service";
import { seedPlanRequest, seedThemePurchase } from "../helpers/seed-requests";
import { canUseCoupons, canUseEmail } from "@/lib/plans";

describe("Paid plans unlock only after admin approval", () => {
  let sub = "";

  beforeEach(() => {
    sub = `approve-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    storeService.registerStore({
      name: "Approval Test",
      subdomain: sub,
      category: "Fashion & Apparel",
      ownerName: "Test Owner",
      contactPhone: "+919876543210",
      upiId: "testowner@okhdfcbank",
      tagline: "Approval test store",
    });
  });

  it("stays on Free while the payment is waiting for approval", () => {
    seedPlanRequest(sub, { planId: "pro", paymentUtr: "428910293841" });
    const store = storeService.getStore(sub)!;
    expect(store.planId).toBe("free");
    expect(store.pendingSubscription?.status).toBe("pending_verification");
    expect(canUseCoupons(store.planId)).toBe(false);
    expect(canUseEmail(store.planId)).toBe(false);
  });

  it("unlocks the plan on approval and leaves an unseen notice for the seller", () => {
    const req = seedPlanRequest(sub, { planId: "pro" });
    const res = storeService.verifySubscriptionPayment(sub, req.id);
    expect(res.success).toBe(true);

    const store = storeService.getStore(sub)!;
    expect(store.planId).toBe("pro");
    expect(store.pendingSubscription).toBeNull();
    const notice = store.subscriptionHistory?.find((h) => h.id === req.id);
    expect(notice?.status).toBe("verified");
    expect(notice?.seenBySeller).toBe(false);
    expect(canUseEmail(store.planId)).toBe(true);
  });

  it("keeps the store on Free when the payment is rejected, with the reason", () => {
    const req = seedPlanRequest(sub, { planId: "starter" });
    expect(storeService.rejectSubscriptionPayment(sub, "UTR not found")).toBe(true);

    const store = storeService.getStore(sub)!;
    expect(store.planId).toBe("free");
    expect(store.pendingSubscription).toBeNull();
    const notice = store.subscriptionHistory?.find((h) => h.id === req.id);
    expect(notice?.status).toBe("rejected");
    expect(notice?.note).toBe("UTR not found");
    expect(notice?.seenBySeller).toBe(false);
  });

  it("clears the notice once the seller has seen it", () => {
    const req = seedPlanRequest(sub, { planId: "pro" });
    storeService.verifySubscriptionPayment(sub, req.id);
    storeService.markSubscriptionUpdatesSeen(sub);
    const store = storeService.getStore(sub)!;
    expect(store.subscriptionHistory?.every((h) => h.seenBySeller !== false)).toBe(true);
  });
});
