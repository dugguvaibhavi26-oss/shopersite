import "server-only";
import { randomBytes } from "node:crypto";
import { applyPlanDetails, BILLING_CYCLES, calculatePlanPrice, PLATFORM_PLANS, type BillingCycle } from "../plans";
import { registerCustomThemes, type CustomThemeDef } from "../site-content";
import { getTheme } from "../themes";
import { applyThemePricing, getThemePrice } from "../theme-pricing";
import { siteConfig } from "../config/site";
import { isValidUpiId, type PlatformPayment, type StoreData, type SubscriptionRequest, type ThemePurchase } from "../store-service";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { readStoreTx, writeStoreTx } from "./store-data";
import { UTR_PATTERN } from "./order-service";

/**
 * Sellers paying Shopersite (plans and themes) by UPI. The server sets the amount, the payee and
 * the reference; the seller only supplies the UPI reference (UTR) from their payment app. Nothing
 * unlocks until an admin checks the bank account and approves it in the admin panel.
 */

let pricingLoadedAt = 0;

/** Applies the admin's saved plan prices, theme prices and uploaded themes (cached for a minute). */
async function loadPlatformPricing(): Promise<void> {
  if (Date.now() - pricingLoadedAt < 60_000) return;
  const col = adminDb().collection("platform_settings");
  const [plans, themePrices, themes] = await Promise.all([col.doc("plan_details").get(), col.doc("theme_prices").get(), col.doc("themes").get()]);
  applyPlanDetails(plans.exists ? (plans.data() as { plans?: Record<string, never> }).plans : null);
  applyThemePricing(themePrices.exists ? (themePrices.data() as { prices?: unknown; plans?: unknown }) : null);
  const custom = themes.exists ? (themes.data() as { themes?: CustomThemeDef[] }).themes : undefined;
  if (Array.isArray(custom)) registerCustomThemes(custom);
  pricingLoadedAt = Date.now();
}

/** The UPI account sellers pay, as set in Admin › Plans & payments. */
async function platformPayee(): Promise<PlatformPayment> {
  const snap = await adminDb().collection("platform_settings").doc("payment").get();
  const saved = (snap.exists ? snap.data() : {}) as { accounts?: PlatformPayment[]; activeUpiId?: string; upiId?: string; payeeName?: string };
  const accounts = (Array.isArray(saved.accounts) ? saved.accounts : []).filter((a) => a && isValidUpiId(String(a.upiId || "")));
  if (!accounts.length && saved.upiId && isValidUpiId(saved.upiId)) accounts.push({ upiId: saved.upiId, payeeName: saved.payeeName || siteConfig.platformMerchantName });
  if (!accounts.length) accounts.push({ upiId: siteConfig.platformUpiId, payeeName: siteConfig.platformMerchantName });
  const active = accounts.find((a) => a.upiId.toLowerCase() === String(saved.activeUpiId || "").toLowerCase()) || accounts[0];
  return { upiId: active.upiId.trim(), payeeName: (active.payeeName || siteConfig.platformMerchantName).slice(0, 50) };
}

const reference = (kind: "SUB" | "THM") => `SHS-${kind}-${randomBytes(4).toString("hex").toUpperCase()}`;

function checkUtr(utr: string) {
  if (!UTR_PATTERN.test(utr)) throw new ApiError(400, "Enter the 12-digit UPI reference number (UTR) from your payment app.");
}

/** What the seller must pay for a plan, and to whom (shown on the payment page). */
export async function planQuote(planId: string, cycle: string) {
  await loadPlatformPricing();
  if (planId !== "starter" && planId !== "pro") throw new ApiError(400, "Choose a paid plan.");
  if (!BILLING_CYCLES.some((c) => c.id === cycle)) throw new ApiError(400, "Choose a billing period.");
  const pricing = calculatePlanPrice(planId, cycle as BillingCycle);
  if (pricing.totalPaise <= 0) throw new ApiError(400, "This plan is free.");
  return { planId: planId as "starter" | "pro", planName: PLATFORM_PLANS[planId].name, cycle: cycle as BillingCycle, pricing, payee: await platformPayee() };
}

export async function requestPlan(subdomain: string, input: { planId: string; billingCycle: string; utr: string }): Promise<SubscriptionRequest> {
  checkUtr(input.utr);
  const q = await planQuote(input.planId, input.billingCycle);
  const db = adminDb();
  const claimRef = db.collection("upi_claims").doc(`p_${input.utr}`);
  return db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, subdomain);
    if (!store) throw new ApiError(404, "Store not found.");
    const claim = await tx.get(claimRef);
    if (claim.exists) throw new ApiError(409, "This UPI reference number was already used. Check the number in your payment app.");
    if (store.pendingSubscription) throw new ApiError(409, "You already have a plan payment being checked. Cancel it first to send a new one.");

    const req: SubscriptionRequest = {
      id: `sub_${randomBytes(8).toString("hex")}`,
      referenceId: reference("SUB"),
      storeSubdomain: store.subdomain,
      storeName: store.name,
      planId: q.planId,
      planName: q.planName,
      amount: q.pricing.totalPaise,
      amountFormatted: `₹${q.pricing.totalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      billingCycle: q.cycle,
      status: "pending_verification",
      paymentMethod: "upi",
      payeeUpiId: q.payee.upiId,
      paymentUtr: input.utr,
      createdAt: new Date().toISOString(),
      estimatedVerificationTime: "1-2 hours",
      note: `Subscription for ${q.planName} (${q.pricing.cycleLabel} · ${q.pricing.formattedTotal})`,
    };
    writeStoreTx(tx, store.subdomain, {
      pendingSubscription: req,
      subscriptionHistory: [req, ...(store.subscriptionHistory || []).filter((h) => h.id !== req.id)],
    });
    tx.set(claimRef, { kind: "plan", store: store.subdomain, requestId: req.id, createdAt: req.createdAt });
    return req;
  });
}

export async function cancelPlan(subdomain: string): Promise<void> {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, subdomain);
    const pending = store?.pendingSubscription;
    if (!store || !pending) throw new ApiError(404, "There's no plan payment to cancel.");
    const cancelled: SubscriptionRequest = { ...pending, status: "rejected", note: "Cancelled by seller", seenBySeller: true };
    writeStoreTx(tx, store.subdomain, {
      pendingSubscription: null,
      subscriptionHistory: (store.subscriptionHistory || []).map((h) => (h.id === pending.id ? cancelled : h)),
    });
    // the seller may have typed the wrong number; let them use their real one again
    if (pending.paymentUtr) tx.delete(db.collection("upi_claims").doc(`p_${pending.paymentUtr}`));
  });
}

export async function themeQuote(themeSlug: string) {
  await loadPlatformPricing();
  const theme = getTheme(themeSlug);
  if (!theme || theme.slug !== themeSlug) throw new ApiError(404, "Theme not found.");
  const amount = getThemePrice(themeSlug);
  if (!amount) throw new ApiError(400, `${theme.name} is free.`);
  return { theme, amount, payee: await platformPayee() };
}

export async function requestTheme(subdomain: string, input: { themeSlug: string; utr: string }): Promise<ThemePurchase> {
  checkUtr(input.utr);
  const q = await themeQuote(input.themeSlug);
  const db = adminDb();
  const claimRef = db.collection("upi_claims").doc(`p_${input.utr}`);
  return db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, subdomain);
    if (!store) throw new ApiError(404, "Store not found.");
    const claim = await tx.get(claimRef);
    if (claim.exists) throw new ApiError(409, "This UPI reference number was already used. Check the number in your payment app.");
    if (store.ownedThemes?.includes(input.themeSlug)) throw new ApiError(409, `You already own ${q.theme.name}.`);
    if ((store.themePurchases || []).some((p) => p.themeSlug === input.themeSlug && p.status === "pending_verification")) {
      throw new ApiError(409, `We're already checking your payment for ${q.theme.name}.`);
    }
    const purchase: ThemePurchase = {
      id: `thm_${randomBytes(8).toString("hex")}`,
      referenceId: reference("THM"),
      themeSlug: input.themeSlug,
      themeName: q.theme.name,
      amount: q.amount,
      amountFormatted: `₹${(q.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      status: "pending_verification",
      payeeUpiId: q.payee.upiId,
      paymentUtr: input.utr,
      createdAt: new Date().toISOString(),
    };
    writeStoreTx(tx, store.subdomain, { themePurchases: [purchase, ...(store.themePurchases || [])] });
    tx.set(claimRef, { kind: "theme", store: store.subdomain, purchaseId: purchase.id, createdAt: purchase.createdAt });
    return purchase;
  });
}

export async function cancelTheme(subdomain: string, purchaseId: string): Promise<void> {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, subdomain);
    const p = store?.themePurchases?.find((x) => x.id === purchaseId && x.status === "pending_verification");
    if (!store || !p) throw new ApiError(404, "There's no theme payment to cancel.");
    writeStoreTx(tx, store.subdomain, {
      themePurchases: store.themePurchases!.map((x) => (x.id === purchaseId ? { ...x, status: "rejected", note: "Cancelled by seller", seenBySeller: true } : x)),
    });
    if (p.paymentUtr) tx.delete(db.collection("upi_claims").doc(`p_${p.paymentUtr}`));
  });
}

/** The seller has seen their approved / rejected notices. */
export async function markBillingSeen(subdomain: string): Promise<void> {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const store = (await readStoreTx(tx, subdomain)) as StoreData | null;
    if (!store) return;
    const hist = store.subscriptionHistory || [];
    const themes = store.themePurchases || [];
    if (!hist.some((h) => h.seenBySeller === false) && !themes.some((t) => t.seenBySeller === false)) return;
    writeStoreTx(tx, store.subdomain, {
      subscriptionHistory: hist.map((h) => (h.seenBySeller === false ? { ...h, seenBySeller: true } : h)),
      themePurchases: themes.map((t) => (t.seenBySeller === false ? { ...t, seenBySeller: true } : t)),
    });
  });
}
