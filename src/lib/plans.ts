import { getCustomTheme } from "./site-content";


export interface PlanFeature {
  id: string;
  name: string;
  tier: "free" | "starter" | "pro";
  priceMonthly: number; // in paise
  priceFormatted: string;
  /** Pre-discount price shown struck through, in paise */
  originalPriceMonthly?: number;
  originalPriceFormatted?: string;
  priceYearly?: number; // in paise
  priceYearlyFormatted?: string;
  maxProducts: number;
  themesAllowed: string[];
  customDomain: boolean;
  maxBanners: number;
  highlight?: boolean;
  description: string;
  features: string[];
}

export const PLATFORM_PLANS: Record<string, PlanFeature> = {
  free: {
    id: "free",
    name: "Free",
    tier: "free",
    priceMonthly: 0,
    priceFormatted: "₹0 / month",
    maxProducts: 75,
    themesAllowed: ["classic-bloom", "mono-studio", "theme03", "theme04", "theme05", "theme06", "f01", "f02", "theme07", "theme08", "theme09", "theme10", "theme11", "theme12", "theme13", "theme14", "theme15", "theme16", "theme17", "theme18", "theme19", "theme20", "theme21", "theme22", "theme23", "theme24", "theme25", "theme26", "theme27", "theme28", "theme29", "theme30", "theme31", "theme32", "theme33", "theme34", "theme35"],
    customDomain: false,
    maxBanners: 1,
    description: "Everything you need to start selling online today.",
    features: [
      "Up to 75 products",
      "37 themes",
      "Cash on Delivery (COD)",
      "Direct UPI payments",
      "Free subdomain (yourshop.shopersite.in)",
      "WhatsApp integration",
    ],
  },
  starter: {
    id: "starter",
    name: "Growth",
    tier: "starter",
    priceMonthly: 29900,
    priceFormatted: "₹299 / month",
    originalPriceMonthly: 49900,
    originalPriceFormatted: "₹499 / month",
    priceYearly: 299000,
    priceYearlyFormatted: "₹2,990 / year",
    maxProducts: 200,
    themesAllowed: ["classic-bloom", "mono-studio", "theme03", "theme04", "theme05", "theme06", "f01", "f02", "theme07", "theme08", "theme09", "theme10", "theme11", "theme12", "theme13", "theme14", "theme15", "theme16", "theme17", "theme18", "theme19", "theme20", "theme21", "theme22", "theme23", "theme24", "theme25", "theme26", "theme27", "theme28", "theme29", "theme30", "theme31", "theme32", "theme33", "theme34", "theme35"],
    customDomain: false,
    maxBanners: 5,
    highlight: true,
    description: "Sell more with coupons, reviews and online payments.",
    features: [
      "Everything in Free",
      "Up to 200 products",
      "Theme editor: your own text, photos and colours",
      "Discount coupons",
      "Customer reviews",
      "Email your subscribers from your Gmail (1,000 a month)",
      "Payment gateway",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tier: "pro",
    priceMonthly: 99900,
    priceFormatted: "₹999 / month",
    originalPriceMonthly: 149900,
    originalPriceFormatted: "₹1,499 / month",
    priceYearly: 999000,
    priceYearlyFormatted: "₹9,990 / year",
    maxProducts: 999999,
    themesAllowed: ["classic-bloom", "mono-studio", "theme03", "theme04", "theme05", "theme06", "f01", "f02", "theme07", "theme08", "theme09", "theme10", "theme11", "theme12", "theme13", "theme14", "theme15", "theme16", "theme17", "theme18", "theme19", "theme20", "theme21", "theme22", "theme23", "theme24", "theme25", "theme26", "theme27", "theme28", "theme29", "theme30", "theme31", "theme32", "theme33", "theme34", "theme35"],
    customDomain: true,
    maxBanners: 20,
    description: "Run it like a business, on your own domain.",
    features: [
      "Everything in Growth",
      "Unlimited products",
      "Connect your own domain",
      "Automatic invoices to generate and download",
      "Unlimited emails to subscribers (within Gmail's daily limit)",
      "Your store as an Android app (APK)",
      "Priority WhatsApp support",
    ],
  },
};

/** Percentage saved against the original price, e.g. 40 for ₹499 → ₹299. */
export function planDiscountPercent(plan: PlanFeature): number {
  if (!plan.originalPriceMonthly || plan.originalPriceMonthly <= plan.priceMonthly) return 0;
  return Math.round((1 - plan.priceMonthly / plan.originalPriceMonthly) * 100);
}

export function canAddProduct(currentCount: number, planId: string = "free"): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const plan = PLATFORM_PLANS[planId] || PLATFORM_PLANS.free;
  const limit = plan.maxProducts;
  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: currentCount < limit,
    limit,
    remaining,
  };
}

/** Both themes are open to every plan; what Growth and Pro add is the website editor. */
export function isThemeAllowed(themeSlug: string, planId: string = "free"): boolean {
  if (getCustomTheme(themeSlug)?.enabled) return true;
  const plan = PLATFORM_PLANS[planId] || PLATFORM_PLANS.free;
  return plan.themesAllowed.includes(themeSlug);
}

export function isPaidPlan(planId: string = "free"): boolean {
  return planId === "starter" || planId === "pro";
}

export type BillingCycle = "monthly" | "quarterly" | "yearly";

export interface BillingCycleOption {
  id: BillingCycle;
  label: string;
  shortLabel: string;
  months: number;
  discountPercent: number;
  tag: string;
}

export const BILLING_CYCLES: BillingCycleOption[] = [
  { id: "monthly", label: "Billed Monthly", shortLabel: "Monthly", months: 1, discountPercent: 0, tag: "" },
  { id: "quarterly", label: "Billed Quarterly", shortLabel: "Quarterly", months: 3, discountPercent: 5, tag: "Save 5%" },
  { id: "yearly", label: "Billed Annually", shortLabel: "Annually", months: 12, discountPercent: 10, tag: "Save 10%" },
];

export interface PlanPricingBreakdown {
  totalPaise: number;
  totalRupees: number;
  monthlyEquivalentRupees: number;
  discountPercent: number;
  savedRupees: number;
  cycleLabel: string;
  formattedTotal: string;
  formattedMonthly: string;
  billingText: string;
}

export function calculatePlanPrice(
  planId: string,
  cycle: BillingCycle = "monthly"
): PlanPricingBreakdown {
  const plan = PLATFORM_PLANS[planId] || PLATFORM_PLANS.free;
  if (plan.priceMonthly === 0) {
    return {
      totalPaise: 0,
      totalRupees: 0,
      monthlyEquivalentRupees: 0,
      discountPercent: 0,
      savedRupees: 0,
      cycleLabel: "Free forever",
      formattedTotal: "₹0",
      formattedMonthly: "₹0",
      billingText: "Free forever",
    };
  }

  const cycleConfig = BILLING_CYCLES.find((c) => c.id === cycle) || BILLING_CYCLES[0];
  const months = cycleConfig.months;
  const discountPercent = cycleConfig.discountPercent;

  const baseMonthlyRupees = plan.priceMonthly / 100;
  const rawBaseTotal = baseMonthlyRupees * months;
  const discountedTotal = Math.round(rawBaseTotal * (1 - discountPercent / 100));
  const totalPaise = discountedTotal * 100;
  const monthlyEquivalentRupees = Math.round(discountedTotal / months);
  const savedRupees = rawBaseTotal - discountedTotal;

  let billingText = "Billed monthly";
  if (cycle === "quarterly") {
    billingText = `Billed quarterly (₹${discountedTotal.toLocaleString("en-IN")}/3 mos · Save 5%)`;
  } else if (cycle === "yearly") {
    billingText = `Billed annually (₹${discountedTotal.toLocaleString("en-IN")}/yr · Save 10%)`;
  }

  return {
    totalPaise,
    totalRupees: discountedTotal,
    monthlyEquivalentRupees,
    discountPercent,
    savedRupees,
    cycleLabel: cycleConfig.label,
    formattedTotal: `₹${discountedTotal.toLocaleString("en-IN")}`,
    formattedMonthly: `₹${monthlyEquivalentRupees.toLocaleString("en-IN")}`,
    billingText,
  };
}

// --- Feature access per plan, editable by the admin -------------------------------------------
// Every limit and feature check below reads from here, so an admin change applies to every store
// on that plan (dashboard, storefront and checkout) without a code change.

export type PlanId = "free" | "starter" | "pro";
export const PLAN_IDS: PlanId[] = ["free", "starter", "pro"];
/** Stand-in for "no limit" */
export const UNLIMITED = 999999;

export interface PlanAccess {
  maxProducts: number;
  maxBanners: number;
  coupons: boolean;
  reviews: boolean;
  email: boolean;
  customDomain: boolean;
  /** The theme editor: change the storefront's text, photos, sections and colours */
  themeEditor: boolean;
}

const DEFAULT_PLAN_ACCESS: Record<PlanId, PlanAccess> = {
  free: { maxProducts: 75, maxBanners: 1, coupons: false, reviews: false, email: false, customDomain: false, themeEditor: false },
  starter: { maxProducts: 200, maxBanners: 5, coupons: true, reviews: true, email: true, customDomain: false, themeEditor: true },
  pro: { maxProducts: UNLIMITED, maxBanners: 20, coupons: true, reviews: true, email: true, customDomain: true, themeEditor: true },
};

let planAccess: Record<PlanId, PlanAccess> = cloneAccess(DEFAULT_PLAN_ACCESS);

function cloneAccess(a: Record<PlanId, PlanAccess>): Record<PlanId, PlanAccess> {
  return { free: { ...a.free }, starter: { ...a.starter }, pro: { ...a.pro } };
}

function toPlanId(planId: string): PlanId {
  return planId === "starter" || planId === "pro" ? planId : "free";
}

export function getDefaultPlanAccess(): Record<PlanId, PlanAccess> {
  return cloneAccess(DEFAULT_PLAN_ACCESS);
}

export function getAllPlanAccess(): Record<PlanId, PlanAccess> {
  return cloneAccess(planAccess);
}

export function getPlanAccess(planId: string = "free"): PlanAccess {
  return planAccess[toPlanId(planId)];
}

/** Applies saved settings (missing or invalid values fall back to the defaults) and keeps the plan cards in step. */
export function applyPlanAccess(saved?: Partial<Record<string, Partial<PlanAccess>>> | null) {
  const next = getDefaultPlanAccess();
  for (const id of PLAN_IDS) {
    const s = saved?.[id];
    if (!s) continue;
    const num = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.min(Math.round(v), UNLIMITED) : fallback;
    const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
    next[id] = {
      maxProducts: num(s.maxProducts, next[id].maxProducts),
      maxBanners: num(s.maxBanners, next[id].maxBanners),
      coupons: bool(s.coupons, next[id].coupons),
      reviews: bool(s.reviews, next[id].reviews),
      email: bool(s.email, next[id].email),
      customDomain: bool(s.customDomain, next[id].customDomain),
      themeEditor: bool(s.themeEditor, next[id].themeEditor),
    };
  }
  planAccess = next;

  for (const id of PLAN_IDS) {
    const plan = PLATFORM_PLANS[id];
    const access = planAccess[id];
    plan.maxProducts = access.maxProducts;
    plan.maxBanners = access.maxBanners;
    plan.customDomain = access.customDomain;
  }
  syncProductLines();
}

/** Keep the "Up to N products" line on each plan card true to the plan's product limit. */
function syncProductLines() {
  for (const id of PLAN_IDS) {
    const plan = PLATFORM_PLANS[id];
    const limit = planAccess[id].maxProducts;
    const productLine = limit >= UNLIMITED ? "Unlimited products" : `Up to ${limit} products`;
    plan.features = plan.features.map((f) => (/^(Up to \d+ products|Unlimited products)$/.test(f) ? productLine : f));
  }
}

// --- Plan name, price, text and feature list, editable by the admin -----------------------------

export interface PlanDetails {
  name: string;
  /** monthly price in rupees (Free is always 0) */
  priceRupees: number;
  /** struck-through "was" price in rupees; 0 hides it */
  originalPriceRupees: number;
  description: string;
  features: string[];
}

function readDetails(id: PlanId): PlanDetails {
  const p = PLATFORM_PLANS[id];
  return {
    name: p.name,
    priceRupees: Math.round(p.priceMonthly / 100),
    originalPriceRupees: Math.round((p.originalPriceMonthly || 0) / 100),
    description: p.description,
    features: [...p.features],
  };
}

const DEFAULT_PLAN_DETAILS: Record<PlanId, PlanDetails> = {
  free: readDetails("free"),
  starter: readDetails("starter"),
  pro: readDetails("pro"),
};

export function getDefaultPlanDetails(): Record<PlanId, PlanDetails> {
  return {
    free: { ...DEFAULT_PLAN_DETAILS.free, features: [...DEFAULT_PLAN_DETAILS.free.features] },
    starter: { ...DEFAULT_PLAN_DETAILS.starter, features: [...DEFAULT_PLAN_DETAILS.starter.features] },
    pro: { ...DEFAULT_PLAN_DETAILS.pro, features: [...DEFAULT_PLAN_DETAILS.pro.features] },
  };
}

export function getAllPlanDetails(): Record<PlanId, PlanDetails> {
  return { free: readDetails("free"), starter: readDetails("starter"), pro: readDetails("pro") };
}

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Applies saved plan details (bad values fall back to the defaults) to every plan card and price. */
export function applyPlanDetails(saved?: Partial<Record<string, Partial<PlanDetails>>> | null) {
  const defaults = getDefaultPlanDetails();
  for (const id of PLAN_IDS) {
    const s = saved?.[id] || {};
    const d = defaults[id];
    const text = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : fallback);
    const money = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000000 ? Math.round(v) : fallback;
    const name = text(s.name, d.name).slice(0, 40);
    // Free stays free: the payment flow only exists for the paid plans
    const price = id === "free" ? 0 : Math.max(1, money(s.priceRupees, d.priceRupees));
    const original = id === "free" ? 0 : money(s.originalPriceRupees, d.originalPriceRupees);
    const features = Array.isArray(s.features)
      ? s.features.filter((f): f is string => typeof f === "string" && !!f.trim()).map((f) => f.trim().slice(0, 120)).slice(0, 20)
      : d.features;

    const plan = PLATFORM_PLANS[id];
    plan.name = name;
    plan.priceMonthly = price * 100;
    plan.priceFormatted = `${rupees(price)} / month`;
    if (original > price) {
      plan.originalPriceMonthly = original * 100;
      plan.originalPriceFormatted = `${rupees(original)} / month`;
    } else {
      delete plan.originalPriceMonthly;
      delete plan.originalPriceFormatted;
    }
    plan.description = text(s.description, d.description);
    plan.features = features.length ? features : d.features;
  }
  syncProductLines();
}

export function canUseReviews(planId: string = "free"): boolean {
  return getPlanAccess(planId).reviews;
}

/** Discount coupons (Growth and Pro by default). */
export function canUseCoupons(planId: string = "free"): boolean {
  return getPlanAccess(planId).coupons;
}

/** Email integration: Gmail alerts and the store newsletter (Pro by default). */
export function canUseEmail(planId: string = "free"): boolean {
  return getPlanAccess(planId).email;
}

/** Connecting your own domain (Pro by default). */
export function canUseCustomDomain(planId: string = "free"): boolean {
  return getPlanAccess(planId).customDomain;
}

/** The theme editor and colour/font changes (Growth and Pro by default). Free stores use themes as they come. */
export function canUseThemeEditor(planId: string = "free"): boolean {
  return getPlanAccess(planId).themeEditor;
}

/** The cheapest plan that unlocks a feature, for "Unlock with …" labels. */
export function cheapestPlanWith(feature: "coupons" | "reviews" | "email" | "customDomain" | "themeEditor"): PlanFeature | undefined {
  const id = PLAN_IDS.find((p) => planAccess[p][feature]);
  return id ? PLATFORM_PLANS[id] : undefined;
}

export function canAddBanner(currentCount: number, planId: string = "free"): { allowed: boolean; limit: number } {
  const limit = getPlanAccess(planId).maxBanners;
  return { allowed: currentCount < limit, limit };
}

