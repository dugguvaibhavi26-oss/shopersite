import { describe, expect, it } from "vitest";
import { effectivePlan, planMove, subscriptionState } from "@/lib/subscription";
import { mergeStoreParts } from "@/lib/store-keys";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-11-07T12:00:00Z");
const at = (days: number) => new Date(now + days * DAY).toISOString();

describe("subscription", () => {
  it("an ended paid plan counts as Free; a running one or one with no end date doesn't", () => {
    expect(effectivePlan({ planId: "pro", planPaidUntil: at(-1) }, now)).toMatchObject({ planId: "free", expiredPlanId: "pro" });
    expect(effectivePlan({ planId: "pro", planPaidUntil: at(3) }, now).planId).toBe("pro");
    expect(effectivePlan({ planId: "pro" }, now).planId).toBe("pro");
    expect(effectivePlan({ planId: "free", planPaidUntil: at(-1) }, now).planId).toBe("free");
  });

  it("stores read from the database get the same treatment", () => {
    const s = mergeStoreParts({ subdomain: "x", planId: "starter", planPaidUntil: new Date(Date.now() - DAY).toISOString() } as never, null);
    expect(s.planId).toBe("free");
    expect(s.expiredPlanId).toBe("starter");
  });

  it("days left, ending soon and cancelled renewal", () => {
    expect(subscriptionState({ planId: "pro", planPaidUntil: at(20) }, now)).toMatchObject({ kind: "active", daysLeft: 20, endingSoon: false, renewing: true });
    expect(subscriptionState({ planId: "pro", planPaidUntil: at(3), planRenewal: "off" }, now)).toMatchObject({ daysLeft: 3, endingSoon: true, renewing: false });
    expect(subscriptionState({ planId: "free", expiredPlanId: "pro", planPaidUntil: at(-2) }, now)).toMatchObject({ kind: "free", endedPlanId: "pro" });
    expect(subscriptionState({ planId: "free" }, now)).toEqual({ kind: "free" });
  });

  it("only up, or renew the same plan in its last week", () => {
    const active = subscriptionState({ planId: "starter", planPaidUntil: at(20) }, now);
    const soon = subscriptionState({ planId: "starter", planPaidUntil: at(2) }, now);
    expect(planMove("starter", "pro", active)).toBe("upgrade");
    expect(planMove("starter", "free", active)).toBe("downgrade");
    expect(planMove("pro", "starter", active)).toBe("downgrade");
    expect(planMove("starter", "starter", active)).toBe("current");
    expect(planMove("starter", "starter", soon)).toBe("renew");
    expect(planMove("free", "starter")).toBe("upgrade");
  });
});
