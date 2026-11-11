import { canUseThemeEditor, isPaidPlan, isThemeAllowed } from "./plans";

/**
 * Which plan each storefront theme comes with, and who may use and edit it.
 *
 * - Free themes: every shop can use them.
 * - Plan themes: a theme comes with Growth or Pro (Pro gets Growth's too). Those last only while the plan is paid
 *   for; when the paid month runs out without a renewal they lock again.
 * - Shops already on a theme before it was locked keep it until they switch away.
 * - Themes are not sold one by one (THEME_SALES is off). A theme the admin unlocked for a shop earlier
 *   (ownedThemes) stays that shop's. The price below only marks a theme as "not free" while sales are off.
 *
 * The admin sets each theme's plan; these are the starting ones.
 */

export type ThemePlan = "starter" | "pro" | null;

/**
 * true makes every theme free on every plan. Off: themes follow the plans below and what the admin saved.
 */
export let ALL_THEMES_FREE = false;

/** Whether a shop can buy a single theme once (by UPI). Off: themes only come with plans. */
export const THEME_SALES: boolean = false;

/** For tests of the paid-theme rules. */
export function setAllThemesFree(on: boolean) {
  ALL_THEMES_FREE = on;
}

/** The theme every shop starts on and the one the Free plan gets: Lume Editorial. */
export const FREE_THEME_SLUG = "classic-bloom";
/** Built-in themes that start out free. */
const FREE_THEMES = [FREE_THEME_SLUG];
/** Built-in themes that start out included with Growth (and so Pro): Mono Studio, Theme 03, Theme 05, E01, F02, Theme 07, Theme 21. */
const GROWTH_THEMES = ["mono-studio", "theme03", "theme05", "theme06", "f02", "theme07", "theme21"];

/** The plan a built-in theme starts out included with; every built-in theme outside Free and Growth is Pro's. */
function builtInPlan(slug: string): ThemePlan {
  if (slug.startsWith("custom-") || FREE_THEMES.includes(slug)) return null;
  return GROWTH_THEMES.includes(slug) ? "starter" : "pro";
}

/** ₹499, in paise */
export const DEFAULT_THEME_PRICE = 49900;
/** the most a theme can cost, ₹1,00,000 in paise */
export const MAX_THEME_PRICE = 10000000;

// what the admin changed, by theme slug
let priceOverrides: Record<string, number> = {};
let planOverrides: Record<string, ThemePlan> = {};

/** Takes the admin's saved prices (paise) and plans, keeping only sensible values. */
export function applyThemePricing(saved: { prices?: unknown; plans?: unknown } | null | undefined) {
  const prices: Record<string, number> = {};
  if (saved?.prices && typeof saved.prices === "object") {
    for (const [slug, value] of Object.entries(saved.prices as Record<string, unknown>)) {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0 && n <= MAX_THEME_PRICE) prices[slug] = Math.round(n);
    }
  }
  const plans: Record<string, ThemePlan> = {};
  if (saved?.plans && typeof saved.plans === "object") {
    for (const [slug, value] of Object.entries(saved.plans as Record<string, unknown>)) {
      if (value === "starter" || value === "pro" || value === null) plans[slug] = value;
    }
  }
  priceOverrides = prices;
  planOverrides = plans;
}

/** The admin's changes, to save. */
export function getThemePricingOverrides(): { prices: Record<string, number>; plans: Record<string, ThemePlan> } {
  return { prices: { ...priceOverrides }, plans: { ...planOverrides } };
}

/** The starting price of a theme before the admin changes it. Uploaded themes start free. */
export function defaultThemePrice(slug: string): number {
  return slug.startsWith("custom-") || FREE_THEMES.includes(slug) ? 0 : DEFAULT_THEME_PRICE;
}

/** The plan a theme starts out included with, before the admin changes it. */
export function defaultThemePlan(slug: string): ThemePlan {
  return builtInPlan(slug);
}

/** What a theme costs once, in paise; 0 means free. */
export function getThemePrice(slug: string): number {
  if (ALL_THEMES_FREE) return 0;
  return slug in priceOverrides ? priceOverrides[slug] : defaultThemePrice(slug);
}

/** The plan that includes the theme ("starter" is Growth); null when no plan does. Free themes need none. */
export function getThemePlan(slug: string): ThemePlan {
  if (getThemePrice(slug) === 0) return null;
  const plan = slug in planOverrides ? planOverrides[slug] : defaultThemePlan(slug);
  // with single sales off, a theme that isn't free always comes with a plan
  return plan || (THEME_SALES ? null : "pro");
}

/** "₹499", or "Free" for a free theme. */
export function formatThemePrice(paise: number): string {
  return paise > 0 ? `₹${(paise / 100).toLocaleString("en-IN")}` : "Free";
}

const RANK: Record<string, number> = { free: 0, starter: 1, pro: 2 };

type ThemeUser = {
  planId: string;
  /** when the paid plan runs out; shops approved before this was kept have none and count as paid */
  planPaidUntil?: string;
  ownedThemes?: string[];
  /** themes the shop switched to through its plan, which lock again if the plan lapses */
  planThemes?: string[];
  activeThemeSlug?: string;
};

/** Whether the shop's paid plan is still paid for. */
export function planActive(store: ThemeUser, now = Date.now()): boolean {
  if (!isPaidPlan(store.planId)) return false;
  return !store.planPaidUntil || new Date(store.planPaidUntil).getTime() > now;
}

/** Whether the shop bought the theme. */
export function ownsTheme(store: ThemeUser, slug: string): boolean {
  return !!store.ownedThemes?.includes(slug);
}

/** Whether the shop's current, paid-for plan includes the theme. */
export function planIncludesTheme(store: ThemeUser, slug: string, now = Date.now()): boolean {
  const plan = getThemePlan(slug);
  return !!plan && planActive(store, now) && (RANK[store.planId] || 0) >= RANK[plan];
}

/** Whether the shop may switch to (or keep showing) this theme. */
export function canUseTheme(store: ThemeUser, slug: string, now = Date.now()): boolean {
  if (ownsTheme(store, slug)) return true;
  if (ALL_THEMES_FREE) return true;
  if (getThemePrice(slug) === 0) return isThemeAllowed(slug, store.planId) || isThemeAllowed(slug, "free");
  if (planIncludesTheme(store, slug, now)) return true;
  // a shop that was already on this theme before it had a price keeps it; one that got it through a plan doesn't
  return store.activeThemeSlug === slug && !store.planThemes?.includes(slug);
}

/** Whether the shop can change this theme's words, photos, sections and colours in the website editor. */
export function canEditTheme(store: ThemeUser, slug: string, now = Date.now()): boolean {
  if (ownsTheme(store, slug)) return true;
  return canUseThemeEditor(planActive(store, now) ? store.planId : "free") && canUseTheme(store, slug, now);
}
