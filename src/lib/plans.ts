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
  /** free trial before the first charge */
  trialDays?: number;
  /** introductory monthly price in paise for the first `introMonths` months (Pro) */
  introPriceMonthly?: number;
  introMonths?: number;
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
    themesAllowed: [],
    customDomain: false,
    maxBanners: 1,
    description: "Everything you need to start selling.",
    features: ["Up to 75 products", "1 ready-made theme", "Edit your theme's photos", "Cash on Delivery", "Order management and tracking", "Sales analytics and low-stock alerts", "AI product descriptions"],
  },
  starter: {
    id: "starter",
    name: "Growth",
    tier: "starter",
    priceMonthly: 19900,
    priceFormatted: "₹199 / month",
    trialDays: 30,
    maxProducts: 200,
    themesAllowed: [],
    customDomain: false,
    maxBanners: 5,
    highlight: true,
    description: "Take online payments and sell more.",
    features: ["Everything in Free", "Up to 200 products", "7 themes and the full theme editor", "Online payments (payment gateway)", "Coupons and promo codes", "Customer reviews", "Abandoned cart recovery", "Shipping integrations", "Bulk upload (CSV / Excel)"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tier: "pro",
    priceMonthly: 59900,
    priceFormatted: "₹599 / month",
    trialDays: 10,
    introPriceMonthly: 29900,
    introMonths: 2,
    maxProducts: 999999,
    themesAllowed: [],
    customDomain: true,
    maxBanners: 20,
    description: "Run it like a brand, on your own domain.",
    features: ["Everything in Growth", "Unlimited products", "All 30 themes", "Your own domain", "Remove Shopersite branding", "Automatic invoices", "Email integration and automatic emails", "AI business insights and the full AI agent", "Advanced SEO"],
  },
};

/** How long a free trial is, in words: "1 month" for 30 days, otherwise "10 days". */
export function trialLength(days: number): string {
  return days === 30 ? "1 month" : `${days} days`;
}

/** What a plan costs once any free trial is over: "₹199/month", or the intro offer in words. */
export function priceAfterTrial(plan: PlanFeature): string {
  return introOfferText(plan) || `₹${Math.round(plan.priceMonthly / 100).toLocaleString("en-IN")}/month`;
}

/** "₹299 for 2 months, then ₹599/month": the intro offer in words, or "" when there isn't one. */
export function introOfferText(plan: PlanFeature): string {
  if (!plan.introPriceMonthly || !plan.introMonths) return "";
  const r = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;
  return `${r(plan.introPriceMonthly)}/month for the first ${plan.introMonths === 1 ? "month" : `${plan.introMonths} months`}, then ${r(plan.priceMonthly)}/month`;
}

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

/**
 * Whether a theme exists for shops at all. Which plan a theme comes with (Free: Lume Editorial, Growth: 7 more,
 * Pro: all) is decided in theme-pricing.ts. Uploaded themes count when switched on.
 */
export function isThemeAllowed(themeSlug: string, planId: string = "free"): boolean {
  void planId;
  if (themeSlug.startsWith("custom-")) return !!getCustomTheme(themeSlug)?.enabled;
  return true;
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
  /** The full theme editor: text, photos, sections and colours. Without it, only the Media section (photos). */
  themeEditor: boolean;
  /** how many ready-made themes the plan can use */
  maxThemes: number;
  /** a payment gateway (online payments) at checkout; without it, Cash on Delivery only */
  paymentGateway: boolean;
  /** CSV / Excel bulk product upload */
  bulkUpload: boolean;
  /** unfinished-checkout list and reminders */
  abandonedCart: boolean;
  /** automatic invoices */
  invoices: boolean;
  /** hide the "Powered by Shopersite" mark on the store */
  removeBranding: boolean;
  /** custom social sharing previews (title, text, image) */
  socialPreviews: boolean;
  /** advanced SEO settings (per-product titles and descriptions, etc.) */
  seoAdvanced: boolean;
  /** shipping integrations (Shiprocket) */
  shipping: boolean;
  /** AI business insights */
  aiInsights: boolean;
}

/** The yes/no features, for loops (admin editor, pricing table). */
export const PLAN_SWITCHES = ["paymentGateway", "coupons", "reviews", "abandonedCart", "bulkUpload", "shipping", "themeEditor", "socialPreviews", "email", "invoices", "customDomain", "removeBranding", "seoAdvanced", "aiInsights"] as const;
export type PlanSwitch = (typeof PLAN_SWITCHES)[number];

// From the plan sheet (Shoppersite_All_Plan_Feature_Blocks.xlsx)
const DEFAULT_PLAN_ACCESS: Record<PlanId, PlanAccess> = {
  free: {
    maxProducts: 75, maxBanners: 1, maxThemes: 1,
    coupons: false, reviews: false, email: false, customDomain: false, themeEditor: false,
    paymentGateway: false, bulkUpload: false, abandonedCart: false, invoices: false, removeBranding: false,
    socialPreviews: false, seoAdvanced: false, shipping: false, aiInsights: false,
  },
  starter: {
    maxProducts: 200, maxBanners: 5, maxThemes: 7,
    coupons: true, reviews: true, email: false, customDomain: false, themeEditor: true,
    paymentGateway: true, bulkUpload: true, abandonedCart: true, invoices: false, removeBranding: false,
    socialPreviews: true, seoAdvanced: false, shipping: true, aiInsights: false,
  },
  pro: {
    maxProducts: UNLIMITED, maxBanners: 20, maxThemes: 30,
    coupons: true, reviews: true, email: true, customDomain: true, themeEditor: true,
    paymentGateway: true, bulkUpload: true, abandonedCart: true, invoices: true, removeBranding: true,
    socialPreviews: true, seoAdvanced: true, shipping: true, aiInsights: true,
  },
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
    const d = next[id];
    const switches = Object.fromEntries(PLAN_SWITCHES.map((k) => [k, bool(s[k], d[k])])) as Pick<PlanAccess, PlanSwitch>;
    next[id] = {
      ...d,
      ...switches,
      maxProducts: num(s.maxProducts, d.maxProducts),
      maxBanners: num(s.maxBanners, d.maxBanners),
      maxThemes: Math.max(1, num(s.maxThemes, d.maxThemes)),
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
export function cheapestPlanWith(feature: PlanSwitch): PlanFeature | undefined {
  const id = PLAN_IDS.find((p) => planAccess[p][feature]);
  return id ? PLATFORM_PLANS[id] : undefined;
}

/** Does this plan include a feature? */
export function planHas(planId: string | undefined, feature: PlanSwitch): boolean {
  return getPlanAccess(planId || "free")[feature];
}

export function canAddBanner(currentCount: number, planId: string = "free"): { allowed: boolean; limit: number } {
  const limit = getPlanAccess(planId).maxBanners;
  return { allowed: currentCount < limit, limit };
}

