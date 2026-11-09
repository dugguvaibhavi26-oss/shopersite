/**
 * The assistant's daily AI allowance. Each seller gets a token budget per day (by plan) that resets
 * at midnight India time; the dashboard shows it as a usage bar, never as a message count. Simple
 * commands are handled by our own code and never touch the budget.
 *
 * Shared by the server (enforcing) and the browser (showing the bar).
 */

export type AssistantPlan = "free" | "starter" | "pro";

export interface AssistantSettings {
  /** Master switch: off hides the AI (simple commands still work). */
  enabled: boolean;
  /** Tokens per seller per day, by plan. */
  budgets: Record<AssistantPlan, number>;
  /** Safety cap for the whole platform per day (both providers' free tiers together, with margin). */
  platformTokens: number;
  platformRequests: number;
  /** Give active sellers more when the platform is quiet. */
  stretch: boolean;
}

export const DEFAULT_ASSISTANT_SETTINGS: AssistantSettings = {
  enabled: true,
  budgets: { free: 60_000, starter: 150_000, pro: 2_000_000 },
  platformTokens: 4_000_000,
  platformRequests: 1_500,
  stretch: true,
};

export const BUDGET_LIMITS = { min: 5_000, max: 2_000_000 };

/** Settings as saved by the admin, with anything missing or invalid replaced by the defaults. */
export function mergeAssistantSettings(saved: unknown): AssistantSettings {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<AssistantSettings>;
  const num = (v: unknown, d: number, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : d);
  const b = (s.budgets || {}) as Partial<Record<AssistantPlan, number>>;
  const D = DEFAULT_ASSISTANT_SETTINGS;
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : D.enabled,
    budgets: {
      free: num(b.free, D.budgets.free, BUDGET_LIMITS.min, BUDGET_LIMITS.max),
      starter: num(b.starter, D.budgets.starter, BUDGET_LIMITS.min, BUDGET_LIMITS.max),
      pro: num(b.pro, D.budgets.pro, BUDGET_LIMITS.min, BUDGET_LIMITS.max),
    },
    platformTokens: num(s.platformTokens, D.platformTokens, 10_000, 1_000_000_000),
    platformRequests: num(s.platformRequests, D.platformRequests, 10, 10_000_000),
    stretch: typeof s.stretch === "boolean" ? s.stretch : D.stretch,
  };
}

export const planKey = (planId?: string): AssistantPlan => (planId === "starter" || planId === "pro" ? planId : "free");

/** Today's date in India (YYYY-MM-DD): the day the budget belongs to. */
export function istDay(now = Date.now()): string {
  return new Date(now + 5.5 * 3600_000).toISOString().slice(0, 10);
}

/** When today's budget resets: the next midnight in India. */
export function nextResetAt(now = Date.now()): string {
  const ist = now + 5.5 * 3600_000;
  const midnight = Math.floor(ist / 86400_000 + 1) * 86400_000;
  return new Date(midnight - 5.5 * 3600_000).toISOString();
}

/**
 * The seller's budget for today. On quiet days (little of the platform's free capacity used), it
 * stretches: under 30% used → 2×, under 60% → 1.5×.
 */
export function effectiveBudget(settings: AssistantSettings, planId: string | undefined, platformUsedTokens: number): number {
  const base = settings.budgets[planKey(planId)];
  if (!settings.stretch) return base;
  const share = platformUsedTokens / Math.max(1, settings.platformTokens);
  return Math.round(base * (share < 0.3 ? 2 : share < 0.6 ? 1.5 : 1));
}

export interface UsageView {
  /** 0–100, for the bar */
  percent: number;
  resetsAt: string;
  /** false: today's budget is used up (or the platform is at its safety cap) */
  available: boolean;
  /** true when the whole platform is at the cap rather than this seller */
  busy: boolean;
  enabled: boolean;
}

export function usageView(settings: AssistantSettings, planId: string | undefined, used: number, platform: { tokens: number; requests: number }, now = Date.now()): UsageView {
  const budget = effectiveBudget(settings, planId, platform.tokens);
  const busy = platform.tokens >= settings.platformTokens || platform.requests >= settings.platformRequests;
  const percent = Math.min(100, Math.round((used / Math.max(1, budget)) * 100));
  return { percent, resetsAt: nextResetAt(now), available: settings.enabled && !busy && used < budget, busy, enabled: settings.enabled };
}
