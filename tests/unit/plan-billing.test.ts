import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { applySubscription, CHARGE_GRACE_MS, liveSubscription, RETRY_GRACE_MS, verifySubscriptionSignature, type BillingSub, type RzSubscription } from "@/lib/billing/subscription-core";
import { planMove, subscriptionState } from "@/lib/subscription";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-11-11T06:00:00Z");
const secs = (ms: number) => Math.floor(ms / 1000);
const iso = (ms: number) => new Date(ms).toISOString();

const attempt = (over: Partial<BillingSub> = {}): BillingSub => ({
  subscriptionId: "sub_new",
  planId: "starter",
  rzPlanId: "plan_growth",
  mode: "live",
  status: "created",
  paidCount: 0,
  createdAt: iso(now - 60_000),
  updatedAt: iso(now - 60_000),
  ...over,
});
const shop = (over: Record<string, unknown> = {}) => ({ subdomain: "asha", name: "Asha Sarees", planId: "free", ...over });
const rz = (over: Partial<RzSubscription> = {}): RzSubscription => ({ id: "sub_new", plan_id: "plan_growth", status: "authenticated", paid_count: 0, ...over });

describe("plan subscriptions (Razorpay)", () => {
  it("checks the signature Razorpay Checkout returns", () => {
    const good = createHmac("sha256", "secret").update("pay_1|sub_1").digest("hex");
    expect(verifySubscriptionSignature("pay_1", "sub_1", good, "secret")).toBe(true);
    expect(verifySubscriptionSignature("pay_1", "sub_2", good, "secret")).toBe(false);
    expect(verifySubscriptionSignature("pay_1", "sub_1", good, "other")).toBe(false);
    expect(verifySubscriptionSignature("pay_1", "sub_1", "not-hex", "secret")).toBe(false);
    expect(verifySubscriptionSignature("pay_1", "sub_1", "", "secret")).toBe(false);
  });

  it("ignores a subscription the shop does not have", () => {
    expect(applySubscription(shop({ planBilling: { attempt: attempt() } }), rz({ id: "sub_other" }), { now })).toBeNull();
    expect(applySubscription(shop(), rz(), { now })).toBeNull();
  });

  it("free trial: the plan turns on when the payment method is approved, with no payment recorded", () => {
    const trialEnd = now + 10 * DAY;
    const c = applySubscription(shop({ planBilling: { attempt: attempt({ trial: true }) } }), rz({ start_at: secs(trialEnd), charge_at: secs(trialEnd) }), { now })!;
    expect(c.updates.planId).toBe("starter");
    expect(c.updates.planRenewal).toBe("on");
    expect(Date.parse(c.updates.planPaidUntil!)).toBe(secs(trialEnd) * 1000 + CHARGE_GRACE_MS);
    expect(c.updates.planBilling).toMatchObject({ trialUsed: true, attempt: null, current: { subscriptionId: "sub_new", status: "authenticated", trial: true } });
    expect(c.updates.subscriptionHistory).toBeUndefined();
    expect(c.cancelOld).toBeUndefined();

    // and the billing page shows a trial, not a "renew now" warning
    const state = subscriptionState({ planId: "starter", planPaidUntil: c.updates.planPaidUntil, planRenewal: "on", planBilling: c.updates.planBilling }, now + 5 * DAY);
    expect(state).toMatchObject({ kind: "active", endingSoon: false, autoPay: { stage: "trial" } });
    expect(planMove("starter", "starter", state)).toBe("current");
  });

  it("a charge extends the plan to the end of the period and is recorded once", () => {
    const current = attempt({ status: "authenticated", trial: true });
    const store = shop({ planId: "starter", planPaidUntil: iso(now + DAY), planBilling: { trialUsed: true, current } });
    const end = now + 30 * DAY;
    const entity = rz({ status: "active", paid_count: 1, current_end: secs(end), charge_at: secs(end) });
    const payment = { id: "pay_1", amount: 19900, status: "captured" };
    const c = applySubscription(store, entity, { now, payment, planName: "Growth" })!;
    expect(Date.parse(c.updates.planPaidUntil!)).toBe(secs(end) * 1000 + CHARGE_GRACE_MS);
    expect(c.updates.subscriptionHistory).toHaveLength(1);
    expect(c.updates.subscriptionHistory![0]).toMatchObject({ id: "pay_1", amount: 19900, status: "verified", paymentMethod: "razorpay", planId: "starter", planName: "Growth" });

    // the same news again (webhook and checkout both report it) changes nothing more
    const again = applySubscription({ ...store, ...c.updates }, entity, { now, payment, planName: "Growth" })!;
    expect(again.updates.subscriptionHistory).toBeUndefined();
    expect(again.updates.planPaidUntil).toBe(c.updates.planPaidUntil);
  });

  it("late news about an earlier period is ignored", () => {
    const current = attempt({ status: "active", paidCount: 2 });
    const store = shop({ planId: "starter", planPaidUntil: iso(now + 20 * DAY), planBilling: { current } });
    expect(applySubscription(store, rz({ status: "active", paid_count: 1 }), { now })).toBeNull();
    expect(applySubscription(store, rz({ status: "authenticated", paid_count: 2 }), { now })).toBeNull();
    const ended = shop({ planId: "starter", planBilling: { current: attempt({ status: "cancelled", paidCount: 2 }) } });
    expect(applySubscription(ended, rz({ status: "active", paid_count: 2 }), { now })).toBeNull();
  });

  it("a failed renewal keeps the plan while Razorpay retries, then ends it", () => {
    const current = attempt({ status: "active", paidCount: 1 });
    const store = shop({ planId: "starter", planPaidUntil: iso(now + DAY), planRenewal: "on", planBilling: { current } });
    const retry = applySubscription(store, rz({ status: "pending", paid_count: 1 }), { now })!;
    expect(retry.updates.planId).toBe("starter");
    expect(Date.parse(retry.updates.planPaidUntil!)).toBe(now + RETRY_GRACE_MS);
    expect(retry.updates.planRenewal).toBeUndefined();
    const during = subscriptionState({ planId: "starter", planRenewal: "on", ...retry.updates }, now + DAY);
    expect(during).toMatchObject({ kind: "active", endingSoon: false, autoPay: { stage: "retrying" } });

    const halted = applySubscription({ ...store, ...retry.updates }, rz({ status: "halted", paid_count: 1 }), { now: now + 4 * DAY })!;
    expect(Date.parse(halted.updates.planPaidUntil!)).toBeLessThanOrEqual(now + 4 * DAY);
    expect(halted.updates.planRenewal).toBe("off");
    expect(liveSubscription(halted.updates.planBilling)).toBeNull();
    expect(subscriptionState({ planId: "starter", ...halted.updates }, now + 4 * DAY + 1000)).toMatchObject({ kind: "free", endedPlanId: "starter" });
  });

  it("cancelling stops renewal but keeps the time already paid for", () => {
    const until = iso(now + 12 * DAY);
    const current = attempt({ status: "active", paidCount: 1, cancelRequested: true });
    const store = shop({ planId: "starter", planPaidUntil: until, planRenewal: "off" as const, planBilling: { current } });
    const c = applySubscription(store, rz({ status: "cancelled", paid_count: 1 }), { now })!;
    expect(c.updates.planRenewal).toBe("off");
    expect(c.updates.planPaidUntil).toBeUndefined();
    expect(c.updates.planId).toBeUndefined();
    const state = subscriptionState({ planId: "starter", planPaidUntil: until, ...c.updates }, now);
    expect(state).toMatchObject({ kind: "active", renewing: false });
    expect(state.kind === "active" && state.autoPay).toBeFalsy();
  });

  it("an upgrade replaces the running subscription, which is then stopped", () => {
    const current = attempt({ subscriptionId: "sub_old", status: "active", paidCount: 3 });
    const pro = attempt({ subscriptionId: "sub_pro", planId: "pro", rzPlanId: "plan_pro_intro", intro: "plan" });
    const store = shop({ planId: "starter", planPaidUntil: iso(now + 9 * DAY), planBilling: { trialUsed: true, current, attempt: pro } });
    const end = now + 30 * DAY;
    const c = applySubscription(store, rz({ id: "sub_pro", plan_id: "plan_pro_intro", status: "active", paid_count: 1, current_end: secs(end) }), { now, payment: { id: "pay_9", amount: 29900, status: "captured" } })!;
    expect(c.cancelOld).toBe("sub_old");
    expect(c.updates.planId).toBe("pro");
    expect(c.updates.planBilling).toMatchObject({ trialUsed: true, introUsed: true, attempt: null, current: { subscriptionId: "sub_pro", intro: "plan" } });
    expect(c.needsIntroSwitch).toBeUndefined();
  });

  it("the intro plan asks to move to full price once the intro months are paid", () => {
    const current = attempt({ subscriptionId: "sub_pro", planId: "pro", rzPlanId: "plan_pro_intro", intro: "plan", status: "active", paidCount: 1 });
    const store = shop({ planId: "pro", planPaidUntil: iso(now + DAY), planBilling: { introUsed: true, current } });
    const entity = rz({ id: "sub_pro", plan_id: "plan_pro_intro", status: "active", paid_count: 2, current_end: secs(now + 30 * DAY) });
    expect(applySubscription(store, entity, { now, introMonths: 2 })!.needsIntroSwitch).toBe(true);
    const done = shop({ planId: "pro", planBilling: { introUsed: true, current: { ...current, paidCount: 2, introSwitch: "done" as const } } });
    expect(applySubscription(done, entity, { now, introMonths: 2 })!.needsIntroSwitch).toBeUndefined();
  });

  it("an abandoned checkout is forgotten and never changes the plan", () => {
    const store = shop({ planBilling: { attempt: attempt() } });
    expect(applySubscription(store, rz({ status: "created" }), { now })).toBeNull();
    const c = applySubscription(store, rz({ status: "expired" }), { now })!;
    expect(c.updates).toEqual({ planBilling: { attempt: null } });
  });

  it("manual UPI plans still get the renew reminder in their last week", () => {
    const state = subscriptionState({ planId: "pro", planPaidUntil: iso(now + 3 * DAY) }, now);
    expect(state).toMatchObject({ kind: "active", endingSoon: true });
    expect(state.kind === "active" && state.autoPay).toBeFalsy();
  });
});
