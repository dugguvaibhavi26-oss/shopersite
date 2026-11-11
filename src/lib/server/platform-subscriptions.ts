import "server-only";
import { PLATFORM_PLANS } from "../plans";
import { rankOf } from "../subscription";
import { siteConfig } from "../config/site";
import type { StoreData } from "../store-service";
import {
  applySubscription,
  isLiveStatus,
  liveSubscription,
  verifySubscriptionSignature,
  type BillingSub,
  type PaidPlanId,
  type PlanBilling,
  type RzSubPayment,
  type RzSubscription,
} from "../billing/subscription-core";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { RazorpayError, razorpayKeyMode, razorpayRequest } from "./razorpay";
import type { Transaction } from "firebase-admin/firestore";
import { readStore, readStoreTx, storeRefs, writeStoreTx } from "./store-data";

/**
 * Sellers paying Shopersite for Growth / Pro through Razorpay Subscriptions on Shopersite's own
 * Razorpay account: the seller approves once (card or UPI AutoPay) and Razorpay charges every month.
 * The plan turns on from Razorpay's own news (webhook, or fetched right after checkout), never from
 * what the browser says.
 */

/** Monthly charges a subscription may run for (10 years; Razorpay needs a number). */
const TOTAL_MONTHS = 120;
/** A checkout that was opened but not finished is reused for this long instead of making another. */
const REUSE_ATTEMPT_MS = 30 * 60_000;

interface PlatformRazorpay {
  keyId: string;
  keySecret: string;
  mode: "test" | "live";
  plans: { starter: string; pro: string; proIntro: string };
  /** a Razorpay offer on the Pro plan for the introductory months (Dashboard > Offers) */
  proIntroOffer: string;
}

/** Shopersite's own Razorpay account, or null while it isn't set up in Vercel. */
export function platformRazorpay(): PlatformRazorpay | null {
  const keyId = (process.env.RAZORPAY_PLATFORM_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_PLATFORM_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) return null;
  return {
    keyId,
    keySecret,
    mode: razorpayKeyMode(keyId),
    plans: {
      starter: (process.env.RAZORPAY_PLAN_GROWTH || "plan_TydgqzNCtfDsYY").trim(),
      pro: (process.env.RAZORPAY_PLAN_PRO || "plan_TydhvxAWdlRWFA").trim(),
      proIntro: (process.env.RAZORPAY_PLAN_PRO_INTRO || "plan_Tydhc481blXqNa").trim(),
    },
    proIntroOffer: (process.env.RAZORPAY_OFFER_PRO_INTRO || "").trim(),
  };
}

function requireRazorpay(): PlatformRazorpay {
  const rz = platformRazorpay();
  if (!rz) throw new ApiError(503, "Automatic plan payments aren't set up yet.", "billing_not_configured");
  return rz;
}

const creds = (rz: PlatformRazorpay) => ({ keyId: rz.keyId, keySecret: rz.keySecret });

function fetchSubscription(rz: PlatformRazorpay, id: string): Promise<RzSubscription> {
  return razorpayRequest<RzSubscription>(creds(rz), "GET", `/v1/subscriptions/${encodeURIComponent(id)}`);
}

/** Stops a subscription. An already-ended one counts as stopped. */
async function cancelAtRazorpay(rz: PlatformRazorpay, id: string, atCycleEnd: boolean): Promise<void> {
  try {
    await razorpayRequest(creds(rz), "POST", `/v1/subscriptions/${encodeURIComponent(id)}/cancel`, { cancel_at_cycle_end: atCycleEnd ? 1 : 0 });
  } catch (err) {
    if (!(err instanceof RazorpayError) || err.status !== 400) throw err;
    const now = await fetchSubscription(rz, id);
    if (isLiveStatus(now.status) || now.status === "created") throw err;
  }
}

/**
 * Saves plan changes. `planBilling` is replaced whole (a merge would leave fields of an older
 * subscription behind, such as its trial flag).
 */
function writePlan(tx: Transaction, subdomain: string, updates: Partial<StoreData>) {
  const { planBilling, ...rest } = updates;
  writeStoreTx(tx, subdomain, rest);
  if (planBilling === undefined) return;
  tx.set(
    storeRefs(subdomain).priv,
    { planBilling: JSON.parse(JSON.stringify(planBilling)), updatedAt: new Date().toISOString() },
    { mergeFields: ["planBilling", "updatedAt"] }
  );
}

/** The plan fields the dashboard shows, sent back after every change. */
export function planView(store: StoreData) {
  return {
    planId: store.planId,
    planPaidUntil: store.planPaidUntil || null,
    planRenewal: store.planRenewal || null,
    planBilling: store.planBilling || null,
    subscriptionHistory: store.subscriptionHistory || [],
  };
}

export interface SubscriptionCheckout {
  keyId: string;
  subscriptionId: string;
  planId: PaidPlanId;
  planName: string;
  /** shown on Razorpay's page under the shop name */
  description: string;
  mode: "test" | "live";
}

const day = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

/** Creates (or reuses) the Razorpay subscription a seller is about to approve in Checkout. */
export async function startSubscription(subdomain: string, planIdRaw: string): Promise<SubscriptionCheckout> {
  const rz = requireRazorpay();
  if (planIdRaw !== "starter" && planIdRaw !== "pro") throw new ApiError(400, "Choose a paid plan.");
  const planId: PaidPlanId = planIdRaw;
  const plan = PLATFORM_PLANS[planId];

  const store = await readStore(subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  // test keys take pretend money: only Shopersite's own admins may use them
  if (rz.mode === "test" && !siteConfig.adminEmails.includes(String(store.ownerEmail || "").toLowerCase().trim())) {
    throw new ApiError(503, "Automatic plan payments aren't open yet. Please try again soon.", "billing_not_configured");
  }
  if (store.pendingSubscription) throw new ApiError(409, "We're still checking your earlier plan payment. Cancel it first, or wait for it to be confirmed.");

  const billing: PlanBilling = store.planBilling || {};
  const cur = liveSubscription(billing);
  const now = Date.now();
  if (cur && cur.planId === planId && !cur.cancelRequested) throw new ApiError(409, `You're already subscribed to ${plan.name}.`);
  if (rankOf(planId) < rankOf(store.planId)) {
    const until = store.planPaidUntil ? ` until ${day(Date.parse(store.planPaidUntil))}` : "";
    throw new ApiError(409, `You're on ${PLATFORM_PLANS[store.planId]?.name || "a higher plan"}${until}. You can choose a lower plan after it ends.`);
  }

  // the seller closed Razorpay's page and came back: same subscription, not a second one
  const old = billing.attempt;
  if (old && old.planId === planId && old.mode === rz.mode && old.status === "created" && now - Date.parse(old.createdAt) < REUSE_ATTEMPT_MS) {
    return { keyId: rz.keyId, subscriptionId: old.subscriptionId, planId, planName: plan.name, description: describe(plan.name, old), mode: rz.mode };
  }

  const paidBefore = (store.subscriptionHistory || []).some((h) => h.status === "verified");
  const trial = !!plan.trialDays && !billing.trialUsed && !paidBefore && store.planId === "free";
  // time already paid for on this plan isn't charged twice: the first charge waits until it ends
  const paidUntil = store.planId === planId && store.planPaidUntil ? Date.parse(store.planPaidUntil) : 0;
  const startMs = Math.max(trial ? now + plan.trialDays! * 86_400_000 : 0, paidUntil > now + 3_600_000 ? paidUntil : 0);

  const wantsIntro = planId === "pro" && !!plan.introPriceMonthly && !!plan.introMonths && !billing.introUsed;
  const intro: BillingSub["intro"] = wantsIntro ? (rz.proIntroOffer ? "offer" : "plan") : undefined;
  const rzPlanId = planId === "starter" ? rz.plans.starter : intro === "plan" ? rz.plans.proIntro : rz.plans.pro;

  let created: RzSubscription;
  try {
    created = await razorpayRequest<RzSubscription>(creds(rz), "POST", "/v1/subscriptions", {
      plan_id: rzPlanId,
      total_count: TOTAL_MONTHS,
      quantity: 1,
      customer_notify: true,
      ...(startMs ? { start_at: Math.floor(startMs / 1000) } : {}),
      ...(intro === "offer" ? { offer_id: rz.proIntroOffer } : {}),
      notes: { kind: "shopersite_plan", store: store.subdomain, plan: planId },
    });
  } catch (err) {
    if (err instanceof RazorpayError) {
      console.error("[billing] couldn't create subscription", store.subdomain, planId, rzPlanId, err.code, err.message);
      throw new ApiError(502, "We couldn't start the payment just now. Please try again in a minute.");
    }
    throw err;
  }

  const at = new Date(now).toISOString();
  const attempt: BillingSub = {
    subscriptionId: created.id,
    planId,
    rzPlanId,
    mode: rz.mode,
    status: "created",
    ...(trial ? { trial: true } : {}),
    ...(intro ? { intro } : {}),
    ...(startMs ? { startsAt: new Date(startMs).toISOString() } : {}),
    paidCount: 0,
    createdAt: at,
    updatedAt: at,
  };
  await adminDb().runTransaction(async (tx) => {
    const fresh = await readStoreTx(tx, store.subdomain);
    if (!fresh) throw new ApiError(404, "Store not found.");
    writePlan(tx, store.subdomain, { planBilling: { ...(fresh.planBilling || {}), attempt } });
  });
  return { keyId: rz.keyId, subscriptionId: created.id, planId, planName: plan.name, description: describe(plan.name, attempt), mode: rz.mode };
}

function describe(planName: string, sub: BillingSub): string {
  const plan = PLATFORM_PLANS[sub.planId];
  const price = `${rupees(plan.priceMonthly)}/month`;
  const paid = sub.intro && plan.introPriceMonthly ? `${rupees(plan.introPriceMonthly)}/month for ${plan.introMonths} months, then ${price}` : price;
  if (sub.trial && sub.startsAt) return `${planName}: free until ${day(Date.parse(sub.startsAt))}, then ${paid}`;
  if (sub.intro) return `${planName}: ${paid}`;
  if (sub.startsAt) return `${planName}: ${price} from ${day(Date.parse(sub.startsAt))}`;
  return `${planName}: ${price}`;
}

/**
 * Brings a shop in line with a subscription's latest state. `entity` comes from Razorpay itself
 * (a signed webhook, or fetched with our keys). Returns the shop afterwards, or null when the
 * subscription isn't this shop's.
 */
export async function syncSubscription(subdomain: string, entity: RzSubscription, payment?: RzSubPayment | null): Promise<StoreData | null> {
  const rz = requireRazorpay();

  // never trust what the shop's own record says a subscription is for: Razorpay's copy names the
  // shop (set by us when it was created) and the plan it charges
  const notes = entity.notes && !Array.isArray(entity.notes) ? entity.notes : {};
  if (notes.store !== subdomain) return null;
  const paysFor: PaidPlanId | null = entity.plan_id === rz.plans.starter ? "starter" : entity.plan_id === rz.plans.pro || entity.plan_id === rz.plans.proIntro ? "pro" : null;
  const before = await readStore(subdomain);
  if (!before) return null;
  const known = [before.planBilling?.current, before.planBilling?.attempt].find((s) => s?.subscriptionId === entity.id);
  if (!known || known.planId !== paysFor) return null;

  // an upgrade replaces the older subscription: stop that one first, so nobody pays for both
  const preview = applySubscription(before, entity, { payment });
  if (!preview) return null;
  if (preview.cancelOld) await cancelAtRazorpay(rz, preview.cancelOld, false);

  const db = adminDb();
  const change = await db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, subdomain);
    if (!store) return null;
    const mine = [store.planBilling?.current, store.planBilling?.attempt].find((s) => s?.subscriptionId === entity.id);
    if (!mine || mine.planId !== paysFor) return null;
    const c = applySubscription(store, entity, { payment, planName: PLATFORM_PLANS[paysFor].name, introMonths: PLATFORM_PLANS.pro.introMonths });
    if (c) writePlan(tx, subdomain, c.updates);
    return c;
  });

  // intro plan (no Razorpay offer set up): after the introductory months, move to the full-price plan
  if (change?.needsIntroSwitch) {
    let result: "done" | "failed" = "done";
    try {
      await razorpayRequest(creds(rz), "PATCH", `/v1/subscriptions/${encodeURIComponent(entity.id)}`, {
        plan_id: rz.plans.pro,
        schedule_change_at: "cycle_end",
        customer_notify: true,
      });
    } catch (err) {
      // Razorpay can't change the plan of a UPI AutoPay subscription: end it after this month so
      // the seller is never kept on the introductory price, and ask them to subscribe again
      console.error("[billing] couldn't move intro subscription to the full plan", subdomain, entity.id, err);
      result = "failed";
      await cancelAtRazorpay(rz, entity.id, true).catch((e) => console.error("[billing] couldn't end intro subscription", entity.id, e));
    }
    await db.runTransaction(async (tx) => {
      const store = await readStoreTx(tx, subdomain);
      const cur = store?.planBilling?.current;
      if (!store || !cur || cur.subscriptionId !== entity.id) return;
      writePlan(tx, subdomain, {
        planBilling: { ...store.planBilling, current: { ...cur, introSwitch: result, ...(result === "failed" ? { cancelRequested: true } : {}) } },
        ...(result === "failed" ? { planRenewal: "off" as const } : {}),
      });
    });
  }
  return readStore(subdomain);
}

/** After Razorpay Checkout closes with success: check its signature, then read the truth from Razorpay. */
export async function confirmCheckout(subdomain: string, input: { subscriptionId: string; paymentId: string; signature: string }): Promise<StoreData> {
  const rz = requireRazorpay();
  const store = await readStore(subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  const mine = [store.planBilling?.attempt?.subscriptionId, store.planBilling?.current?.subscriptionId].filter(Boolean);
  if (!mine.includes(input.subscriptionId)) throw new ApiError(400, "This payment doesn't belong to your shop.");
  if (!verifySubscriptionSignature(input.paymentId, input.subscriptionId, input.signature, rz.keySecret)) {
    throw new ApiError(400, "We couldn't confirm this payment. If money was taken, it will show here in a few minutes.");
  }
  // Razorpay can take a moment to mark it approved after its page closes
  let entity = await fetchSubscription(rz, input.subscriptionId);
  for (let i = 0; i < 3 && entity.status === "created"; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    entity = await fetchSubscription(rz, input.subscriptionId);
  }
  const after = await syncSubscription(subdomain, entity);
  return after || store;
}

/** The seller cancels: no more charges; the plan stays until the time already paid (or the trial) ends. */
export async function cancelSubscription(subdomain: string): Promise<StoreData> {
  const rz = requireRazorpay();
  const store = await readStore(subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  const cur = liveSubscription(store.planBilling);
  if (!cur) throw new ApiError(404, "There's no automatic payment to cancel.");
  if (!cur.cancelRequested) {
    // a subscription that hasn't been charged yet (trial) can only be cancelled straight away
    const paidPeriod = cur.status === "active" || cur.status === "pending";
    try {
      await cancelAtRazorpay(rz, cur.subscriptionId, paidPeriod);
    } catch (err) {
      console.error("[billing] couldn't cancel subscription", subdomain, cur.subscriptionId, err);
      throw new ApiError(502, "We couldn't cancel it just now. Please try again in a minute.");
    }
  }
  await adminDb().runTransaction(async (tx) => {
    const fresh = await readStoreTx(tx, subdomain);
    const c = fresh?.planBilling?.current;
    if (!fresh || !c || c.subscriptionId !== cur.subscriptionId) return;
    writePlan(tx, subdomain, { planRenewal: "off", planBilling: { ...fresh.planBilling, current: { ...c, cancelRequested: true }, attempt: null } });
  });
  return (await readStore(subdomain)) || store;
}
