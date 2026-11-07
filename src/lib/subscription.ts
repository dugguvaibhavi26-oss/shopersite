/**
 * Plan subscription rules, shared by the dashboard, the shop and the server.
 *
 * - A paid plan runs until `planPaidUntil`. After that the store is on Free limits until it renews
 *   (stores approved before end dates were kept have none and stay on their plan).
 * - While a paid plan is running, the seller can renew it or move UP, never down.
 * - `planRenewal: "off"` means the seller cancelled: no renewal reminders, the plan simply ends.
 *
 * Payments are manual UPI for now, so "renewal" means we remind the seller to pay before the end
 * date. Automatic deduction (UPI AutoPay) needs a payment gateway's subscription API.
 */

export const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2 };
export const REMIND_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

export const rankOf = (planId?: string) => PLAN_RANK[planId || "free"] ?? 0;

type PlanFields = { planId?: string; planPaidUntil?: string; planRenewal?: "on" | "off"; expiredPlanId?: string };

/** The plan the store is actually on right now: an ended paid plan counts as Free. */
export function effectivePlan<T extends PlanFields>(store: T, now = Date.now()): T {
  const planId = store.planId || "free";
  if (planId === "free" || !store.planPaidUntil) return store;
  const end = Date.parse(store.planPaidUntil);
  if (!Number.isFinite(end) || end > now) return store;
  return { ...store, planId: "free", expiredPlanId: planId };
}

export type SubscriptionState =
  | { kind: "free"; endedPlanId?: string; endedAt?: Date }
  | { kind: "active"; planId: string; endsAt?: Date; daysLeft?: number; renewing: boolean; endingSoon: boolean };

/** Where the subscription stands, for the billing page and reminders. Expects the raw store (planId as saved). */
export function subscriptionState(store: PlanFields, now = Date.now()): SubscriptionState {
  const planId = store.expiredPlanId || store.planId || "free";
  if (planId === "free") return { kind: "free" };
  const endsAt = store.planPaidUntil ? new Date(store.planPaidUntil) : undefined;
  if (endsAt && endsAt.getTime() <= now) return { kind: "free", endedPlanId: planId, endedAt: endsAt };
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - now) / DAY)) : undefined;
  return {
    kind: "active",
    planId,
    endsAt,
    daysLeft,
    renewing: store.planRenewal !== "off",
    endingSoon: daysLeft !== undefined && daysLeft <= REMIND_DAYS,
  };
}

export type PlanMove = "current" | "renew" | "upgrade" | "downgrade";

/**
 * What choosing `target` means for a store on `current` (its effective plan).
 * "current" is the plan they're on with more than a week left; "renew" is the same plan within the last week.
 */
export function planMove(current: string, target: string, state?: SubscriptionState): PlanMove {
  const a = rankOf(current);
  const b = rankOf(target);
  if (b > a) return "upgrade";
  if (b < a) return "downgrade";
  if (state?.kind === "active" && state.endingSoon) return "renew";
  return "current";
}
