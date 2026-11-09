import "server-only";
import { applyPlanAccess, planHas, type PlanSwitch } from "../plans";
import { effectivePlan } from "../subscription";
import type { StoreData } from "../store-service";
import { adminDb } from "./firebase-admin";
import { ApiError } from "./api-error";

let loadedAt = 0;

/** Applies the admin's plan feature settings (Admin → Plans) on the server; cached for a minute. */
export async function loadPlanAccess(): Promise<void> {
  if (Date.now() - loadedAt < 60_000) return;
  try {
    const snap = await adminDb().collection("platform_settings").doc("plan_access").get();
    applyPlanAccess(snap.exists ? (snap.data() as { plans?: Record<string, never> }).plans : null);
  } catch {
    // defaults stay
  }
  loadedAt = Date.now();
}

/** Does this shop's current (paid-up) plan include the feature? */
export async function storeHas(store: Pick<StoreData, "planId" | "planPaidUntil">, feature: PlanSwitch): Promise<boolean> {
  await loadPlanAccess();
  return planHas(effectivePlan(store as StoreData).planId, feature);
}

const NAMES: Record<PlanSwitch, string> = {
  paymentGateway: "Online payments",
  coupons: "Coupons",
  reviews: "Reviews",
  abandonedCart: "Abandoned cart recovery",
  bulkUpload: "Bulk upload",
  shipping: "Shipping integrations",
  themeEditor: "The theme editor",
  socialPreviews: "Custom social previews",
  email: "Email integration",
  invoices: "Invoices",
  customDomain: "A custom domain",
  removeBranding: "Removing Shopersite branding",
  seoAdvanced: "Advanced SEO",
  aiInsights: "AI business insights",
};

/** Throws a friendly 403 when the shop's plan doesn't include the feature. */
export async function requireFeature(store: Pick<StoreData, "planId" | "planPaidUntil">, feature: PlanSwitch): Promise<void> {
  if (await storeHas(store, feature)) return;
  const { cheapestPlanWith } = await import("../plans");
  const plan = cheapestPlanWith(feature);
  throw new ApiError(403, `${NAMES[feature]} ${plan ? `is part of the ${plan.name} plan` : "isn't available on your plan"}. Upgrade in Settings → Plan & billing.`);
}
