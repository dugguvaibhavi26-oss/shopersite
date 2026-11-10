"use client";

import { auth } from "../firebase";
import { loadRazorpay } from "../payments/client";
import { storeService, type StoreData, type SubscriptionRequest } from "../store-service";
import type { PlanBilling } from "./subscription-core";

/** Browser side of Shopersite's own plan subscriptions (Razorpay: card or UPI AutoPay). */

export class BillingError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

/** The seller closed Razorpay's page without paying: not a problem to show. */
export const BILLING_DISMISSED = "dismissed";
/** Automatic payments aren't switched on (no keys yet): fall back to paying by UPI. */
export const BILLING_NOT_CONFIGURED = "billing_not_configured";

type PlanView = {
  planId: StoreData["planId"];
  planPaidUntil: string | null;
  planRenewal: "on" | "off" | null;
  planBilling: PlanBilling | null;
  subscriptionHistory: SubscriptionRequest[];
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new BillingError("Please sign in again.");
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) throw new BillingError(data.error || "Something went wrong. Please try again.", data.code);
  return data;
}

/**
 * Starts automatic payments for a plan: creates the subscription, opens Razorpay so the seller
 * approves it (card or UPI AutoPay), then has the server confirm it and turn the plan on.
 * Resolves once the plan is on. Rejects with a BillingError (see the codes above).
 */
export async function startPlanSubscription(
  store: string,
  planId: "starter" | "pro",
  prefill?: { name?: string; email?: string; contact?: string }
): Promise<void> {
  const { checkout } = await post<{ checkout: { keyId: string; subscriptionId: string; planName: string; description: string } }>("/api/billing/subscribe", { store, planId });
  const Razorpay = await loadRazorpay();
  const paid = await new Promise<{ razorpay_payment_id: string; razorpay_subscription_id?: string; razorpay_signature: string }>((resolve, reject) => {
    const rzp = new Razorpay({
      key: checkout.keyId,
      subscription_id: checkout.subscriptionId,
      name: "Shopersite",
      description: checkout.description,
      prefill,
      theme: { color: "#171717" },
      handler: resolve,
      modal: { ondismiss: () => reject(new BillingError("Payment was cancelled.", BILLING_DISMISSED)) },
    });
    rzp.open();
  });
  const { plan } = await post<{ plan: PlanView }>("/api/billing/subscribe/verify", {
    store,
    subscriptionId: paid.razorpay_subscription_id || checkout.subscriptionId,
    paymentId: paid.razorpay_payment_id,
    signature: paid.razorpay_signature,
  });
  storeService.applyPlan(store, plan);
}

/** Stops automatic payments. The plan stays on until the time already paid for (or the trial) ends. */
export async function cancelPlanSubscription(store: string): Promise<void> {
  const { plan } = await post<{ plan: PlanView }>("/api/billing/subscribe/cancel", { store });
  storeService.applyPlan(store, plan);
}
