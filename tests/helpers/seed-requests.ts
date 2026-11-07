/**
 * Plan and theme payment requests are created by the server now (src/lib/server/billing-service.ts,
 * tested in tests/integration/orders-billing.test.ts). These helpers put the same pending request on
 * a local test store so the admin approve / reject steps can be tested in the browser code.
 */
import { calculatePlanPrice, PLATFORM_PLANS, type BillingCycle } from "@/lib/plans";
import { getThemePrice } from "@/lib/theme-pricing";
import { storeService, type SubscriptionRequest, type ThemePurchase } from "@/lib/store-service";

let n = 0;
const id = () => `${Date.now().toString(36)}${(n++).toString(36)}`;

export function seedPlanRequest(sub: string, data: { planId: "starter" | "pro"; billingCycle?: BillingCycle; paymentUtr?: string }): SubscriptionRequest {
  const store = storeService.getStore(sub)!;
  const cycle = data.billingCycle || "monthly";
  const pricing = calculatePlanPrice(data.planId, cycle);
  const req: SubscriptionRequest = {
    id: `sub_${id()}`,
    referenceId: `SHS-SUB-${id().toUpperCase().slice(-8).padStart(8, "0")}`,
    storeSubdomain: sub,
    storeName: store.name,
    planId: data.planId,
    planName: PLATFORM_PLANS[data.planId].name,
    amount: pricing.totalPaise,
    amountFormatted: `₹${pricing.totalRupees}`,
    billingCycle: cycle,
    status: "pending_verification",
    paymentMethod: "upi",
    payeeUpiId: "shopersite@ybl",
    paymentUtr: data.paymentUtr,
    createdAt: new Date().toISOString(),
    estimatedVerificationTime: "1-2 hours",
  };
  storeService.updateStore(sub, { pendingSubscription: req, subscriptionHistory: [req, ...(store.subscriptionHistory || [])] });
  return req;
}

export function seedThemePurchase(sub: string, themeSlug: string, paymentUtr?: string): ThemePurchase {
  const store = storeService.getStore(sub)!;
  const amount = getThemePrice(themeSlug);
  const purchase: ThemePurchase = {
    id: `thm_${id()}`,
    referenceId: `SHS-THM-${id()}`,
    themeSlug,
    themeName: themeSlug,
    amount,
    amountFormatted: `₹${amount / 100}`,
    status: "pending_verification",
    payeeUpiId: "shopersite@ybl",
    paymentUtr,
    createdAt: new Date().toISOString(),
  };
  storeService.updateStore(sub, { themePurchases: [purchase, ...(store.themePurchases || [])] });
  return purchase;
}
