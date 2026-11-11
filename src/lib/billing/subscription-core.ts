/**
 * Shopersite plan subscriptions through Razorpay Subscriptions (automatic monthly payments).
 * Pure rules, shared by the server routes and the tests: what a Razorpay subscription's state
 * means for a shop's plan. The server keeps `planBilling` in the shop's private document.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SubscriptionRequest } from "../store-service";

export type PaidPlanId = "starter" | "pro";

/** One Razorpay subscription of a shop, as we remember it. */
export interface BillingSub {
  subscriptionId: string;
  planId: PaidPlanId;
  /** the Razorpay plan it was created on */
  rzPlanId: string;
  mode: "test" | "live";
  /** Razorpay's status: created, authenticated, active, pending, halted, cancelled, completed, expired, paused */
  status: string;
  /** started with the free trial */
  trial?: boolean;
  /** started on the introductory price: by a Razorpay offer, or on the separate intro plan */
  intro?: "offer" | "plan";
  /** intro plan only: whether the move to the full-price plan was scheduled */
  introSwitch?: "done" | "failed";
  /** first charge date when it starts later (trial, or after time already paid for) */
  startsAt?: string;
  currentEnd?: string;
  nextChargeAt?: string;
  paidCount: number;
  /** the seller cancelled: it runs to the end of the paid time and stops */
  cancelRequested?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanBilling {
  /** one free trial and one intro price per shop */
  trialUsed?: boolean;
  introUsed?: boolean;
  /** the subscription the shop's plan runs on */
  current?: BillingSub | null;
  /** a checkout that was opened but not completed yet */
  attempt?: BillingSub | null;
}

/** The parts of Razorpay's subscription entity we read. Times are Unix seconds. */
export interface RzSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  start_at?: number | null;
  charge_at?: number | null;
  ended_at?: number | null;
  paid_count?: number | null;
  notes?: Record<string, string> | unknown[] | null;
}

export interface RzSubPayment {
  id: string;
  amount: number;
  status: string;
}

const DAY = 24 * 60 * 60 * 1000;
/** Razorpay charges at the period's end; the plan stays on this long so a slow webhook never drops it. */
export const CHARGE_GRACE_MS = DAY;
/** A failed renewal is retried on the next three days; the plan stays on meanwhile. */
export const RETRY_GRACE_MS = 4 * DAY;

export const isLiveStatus = (status?: string) => status === "authenticated" || status === "active" || status === "pending";
const ENDED = ["halted", "cancelled", "completed", "expired"];

/** The shop's running Razorpay subscription, if it has one. */
export function liveSubscription(billing?: PlanBilling | null): BillingSub | null {
  const cur = billing?.current;
  return cur && isLiveStatus(cur.status) ? cur : null;
}

/** Checks the signature Razorpay Checkout returns after a subscription is authorised. */
export function verifySubscriptionSignature(paymentId: string, subscriptionId: string, signature: string, keySecret: string): boolean {
  try {
    const expected = createHmac("sha256", keySecret).update(`${paymentId}|${subscriptionId}`).digest("hex");
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const iso = (sec?: number | null) => (sec ? new Date(sec * 1000).toISOString() : undefined);

type StoreBits = {
  subdomain: string;
  name: string;
  planId?: string;
  planPaidUntil?: string;
  planBilling?: PlanBilling | null;
  subscriptionHistory?: SubscriptionRequest[];
};

export interface SubscriptionChange {
  updates: {
    planId?: PaidPlanId;
    planPaidUntil?: string;
    planRenewal?: "on" | "off";
    planBilling: PlanBilling;
    subscriptionHistory?: SubscriptionRequest[];
  };
  /** an older subscription to stop, now that this one replaced it (an upgrade) */
  cancelOld?: string;
  /** intro plan: the introductory months are paid, move it to the full-price plan */
  needsIntroSwitch?: boolean;
}

/**
 * What a subscription's latest state (from a webhook or fetched after checkout) changes on the
 * shop. Returns null when it isn't this shop's subscription or the news is older than what we have.
 * Safe to apply twice.
 */
export function applySubscription(
  store: StoreBits,
  entity: RzSubscription,
  opts: { now?: number; payment?: RzSubPayment | null; planName?: string; introMonths?: number } = {}
): SubscriptionChange | null {
  const now = opts.now ?? Date.now();
  const billing: PlanBilling = store.planBilling || {};
  const isCurrent = billing.current?.subscriptionId === entity.id;
  const isAttempt = !isCurrent && billing.attempt?.subscriptionId === entity.id;
  const base = isCurrent ? billing.current! : isAttempt ? billing.attempt! : null;
  if (!base) return null;

  const status = String(entity.status || "");
  const live = isLiveStatus(status);
  const paidCount = Math.max(0, Number(entity.paid_count || 0));

  if (isAttempt) {
    // a checkout nobody finished: forget it once Razorpay closes it
    if (!live) return ENDED.includes(status) ? { updates: { planBilling: { ...billing, attempt: null } } } : null;
  } else {
    // late news about an earlier period (webhooks can arrive out of order)
    if (paidCount < base.paidCount) return null;
    if (paidCount === base.paidCount && ENDED.includes(base.status) && !ENDED.includes(status)) return null;
    if (paidCount === base.paidCount && base.status === "active" && status === "authenticated") return null;
  }

  const sub: BillingSub = {
    ...base,
    status,
    paidCount,
    startsAt: iso(entity.start_at) || base.startsAt,
    currentEnd: iso(entity.current_end) || base.currentEnd,
    nextChargeAt: live ? iso(entity.charge_at) || base.nextChargeAt : undefined,
    updatedAt: new Date(now).toISOString(),
  };

  const updates: SubscriptionChange["updates"] = {
    planBilling: {
      ...billing,
      trialUsed: billing.trialUsed || (!!sub.trial && live) || undefined,
      // the intro price counts as used once it has been charged, not while a free trial is still running
      introUsed: billing.introUsed || (!!sub.intro && live && paidCount > 0) || undefined,
      current: sub,
      attempt: isAttempt ? null : billing.attempt,
    },
  };

  const prevUntil = store.planId === sub.planId && store.planPaidUntil ? Date.parse(store.planPaidUntil) : 0;
  if (status === "authenticated") {
    // payment method saved, first charge later (free trial, or after time that is already paid for)
    const first = Math.max((entity.start_at || entity.charge_at || 0) * 1000, now);
    updates.planId = sub.planId;
    updates.planPaidUntil = new Date(first + CHARGE_GRACE_MS).toISOString();
    updates.planRenewal = sub.cancelRequested ? "off" : "on";
  } else if (status === "active") {
    const end = entity.current_end ? entity.current_end * 1000 : now + 31 * DAY;
    updates.planId = sub.planId;
    updates.planPaidUntil = new Date(end + CHARGE_GRACE_MS).toISOString();
    updates.planRenewal = sub.cancelRequested ? "off" : "on";
  } else if (status === "pending") {
    // the renewal failed; Razorpay retries for three days and the plan stays on meanwhile
    updates.planId = sub.planId;
    updates.planPaidUntil = new Date(Math.max(prevUntil || 0, now + RETRY_GRACE_MS)).toISOString();
  } else if (status === "halted") {
    // every retry failed: the plan ends now
    updates.planPaidUntil = new Date(Math.min(prevUntil || now, now)).toISOString();
    updates.planRenewal = "off";
  } else if (ENDED.includes(status)) {
    // cancelled or finished: it runs out on the date already paid up to
    updates.planRenewal = "off";
  }

  const p = opts.payment;
  const history = store.subscriptionHistory || [];
  if (p && p.status === "captured" && p.amount > 0 && paidCount > 0 && !history.some((h) => h.id === p.id)) {
    const at = new Date(now).toISOString();
    const name = opts.planName || sub.planId;
    updates.subscriptionHistory = [
      {
        id: p.id,
        referenceId: p.id,
        storeSubdomain: store.subdomain,
        storeName: store.name,
        planId: sub.planId,
        planName: name,
        amount: p.amount,
        amountFormatted: `₹${(p.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        billingCycle: "monthly",
        status: "verified",
        paymentMethod: "razorpay",
        payeeUpiId: "",
        paymentUtr: p.id,
        createdAt: at,
        estimatedVerificationTime: "",
        verifiedAt: at,
        seenBySeller: true,
        note: `${name} · automatic monthly payment`,
      },
      ...history,
    ];
  }

  const cancelOld = isAttempt && billing.current && isLiveStatus(billing.current.status) ? billing.current.subscriptionId : undefined;
  const needsIntroSwitch = sub.intro === "plan" && !sub.introSwitch && status === "active" && paidCount >= (opts.introMonths || 2);
  return { updates, ...(cancelOld ? { cancelOld } : {}), ...(needsIntroSwitch ? { needsIntroSwitch } : {}) };
}
