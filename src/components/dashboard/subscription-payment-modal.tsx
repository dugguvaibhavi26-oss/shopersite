"use client";
import { appAlert, appConfirm, appPrompt } from "@/components/ui/app-dialog";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, Clock, Loader2 } from "lucide-react";
import { PLATFORM_PLANS, calculatePlanPrice, BILLING_CYCLES, type BillingCycle } from "@/lib/plans";
import { siteConfig } from "@/lib/config/site";
import { storeService, StoreData, SubscriptionRequest } from "@/lib/store-service";
import { UpiPayPanel } from "@/components/payments/upi-pay-panel";
import { auth } from "@/lib/firebase";
import { rankOf } from "@/lib/subscription";

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: StoreData;
  initialPlanId?: "starter" | "pro";
  initialBillingCycle?: BillingCycle;
  onSuccess?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenSetupWizard?: () => void;
}

type ModalStep = "review" | "payment" | "verifying";

// The checkout lives in the URL (?checkout=pro&cycle=monthly&step=payment) so a refresh lands on
// the same plan and step.
const CHECKOUT_PARAMS = ["checkout", "upgrade", "cycle", "step", "ref"];

function readParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

function writeCheckoutParams(values: Record<string, string> | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  CHECKOUT_PARAMS.forEach((k) => url.searchParams.delete(k));
  if (values) Object.entries(values).forEach(([k, v]) => url.searchParams.set(k, v));
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url.href);
}

const inr = (rupees: number) => `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const CYCLE_NAME: Record<BillingCycle, string> = { monthly: "Monthly", quarterly: "Every 3 months", yearly: "Yearly" };
const STEPS: { id: ModalStep; label: string }[] = [
  { id: "review", label: "Plan" },
  { id: "payment", label: "Payment" },
  { id: "verifying", label: "Confirmation" },
];

export function SubscriptionPaymentModal({
  isOpen,
  onClose,
  store,
  initialPlanId = "starter",
  initialBillingCycle = "monthly",
  onSuccess,
  onNavigateTab,
  onOpenSetupWizard,
}: SubscriptionPaymentModalProps) {
  // a running paid plan can only be renewed or upgraded, never swapped for a lower one
  const isLower = (planId: string) => rankOf(planId) < rankOf(store.planId);
  const startPlan = isLower(initialPlanId) ? "pro" : initialPlanId;
  const [selectedPlanId, setSelectedPlanId] = useState<"starter" | "pro">(startPlan);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [step, setStep] = useState<ModalStep>(() => (readParam("step") === "payment" ? "payment" : "review"));
  const [submittedRequest, setSubmittedRequest] = useState<SubscriptionRequest | null>(store?.pendingSubscription || null);
  const [cancelling, setCancelling] = useState(false);

  // If there is already a pending subscription for this store, show the confirmation step
  useEffect(() => {
    if (!isOpen) return;
    if (store?.pendingSubscription) {
      setSubmittedRequest(store.pendingSubscription);
      setStep("verifying");
    } else {
      setSubmittedRequest(null);
      setSelectedPlanId(rankOf(initialPlanId) < rankOf(store.planId) ? "pro" : initialPlanId);
      setBillingCycle(initialBillingCycle);
      setStep((s) => (s === "verifying" ? "review" : s));
    }
  }, [isOpen, store?.pendingSubscription, store?.planId, initialPlanId, initialBillingCycle]);

  // Mirror the checkout into the URL so a refresh comes back to the same place
  useEffect(() => {
    if (!isOpen) return;
    writeCheckoutParams({ checkout: selectedPlanId, cycle: billingCycle, step });
  }, [isOpen, selectedPlanId, billingCycle, step]);

  // Escape closes the page
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const close = () => {
    writeCheckoutParams(null);
    setStep("review");
    onClose();
  };

  if (!isOpen) return null;

  const currentPlan = PLATFORM_PLANS[selectedPlanId] || PLATFORM_PLANS.starter;
  const pricing = calculatePlanPrice(selectedPlanId, billingCycle);
  const months = BILLING_CYCLES.find((c) => c.id === billingCycle)?.months || 1;
  const listTotal = (currentPlan.priceMonthly / 100) * months;

  /** Sends the UTR to the server; the plan starts only when an admin approves the payment. */
  const handleSubmitPayment = async (utr: string) => {
    const req = await storeService.createSubscriptionPayment(store.subdomain, { planId: selectedPlanId, billingCycle, paymentUtr: utr });
    setSubmittedRequest(req);
    setStep("verifying");
    if (onSuccess) onSuccess();
  };

  const handleCancelPending = async () => {
    if (!(await appConfirm("Only do this if you haven't paid, or entered the wrong reference number.", { title: "Cancel this payment request?", okLabel: "Cancel request", cancelLabel: "Keep it", danger: true }))) return;
    setCancelling(true);
    try {
      await storeService.cancelSubscriptionRequest(store.subdomain);
      setSubmittedRequest(null);
      setStep("review");
      if (onSuccess) onSuccess();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Couldn't cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const summary = (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="px-5 pt-5">
        <h3 className="text-sm font-semibold">Order summary</h3>
        <dl className="mt-4 space-y-2.5 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-600">
              {currentPlan.name} plan · {CYCLE_NAME[billingCycle]}
            </dt>
            <dd className="tabular-nums">{inr(listTotal)}</dd>
          </div>
          {pricing.savedRupees > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-600">Discount ({pricing.discountPercent}%)</dt>
              <dd className="tabular-nums text-emerald-700">−{inr(pricing.savedRupees)}</dd>
            </div>
          )}
        </dl>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 px-5 py-4">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-lg font-semibold tabular-nums">{inr(pricing.totalRupees)}</span>
      </div>
    </div>
  );

  return (
    <div className="[&_:is(h1,h2,h3)]:[font-family:inherit] [&_:is(h1,h2,h3)]:tracking-tight fixed inset-0 z-[70] flex flex-col bg-neutral-50 text-neutral-900 animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-label="Upgrade plan">
      {/* header */}
      <header className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={close}
            aria-label="Back to dashboard"
            style={{ minHeight: 0 }}
            className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-semibold leading-tight">Upgrade plan</h1>
            <p className="truncate text-xs text-neutral-500">
              {store.subdomain}.{siteConfig.domain}
            </p>
          </div>
          <ol className="hidden items-center gap-2 text-[13px] sm:flex" aria-label="Steps">
            {STEPS.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-5 bg-neutral-300" />}
                <span className={i === stepIndex ? "font-medium text-neutral-900" : i < stepIndex ? "text-neutral-600" : "text-neutral-400"}>
                  {i < stepIndex && <Check className="mr-1 inline h-3.5 w-3.5 -translate-y-px" />}
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
        {/* phone: step x of 3 with a thin progress bar */}
        <div className="mx-auto max-w-5xl px-4 pb-2.5 sm:hidden">
          <p className="text-xs text-neutral-500">
            Step {stepIndex + 1} of 3 · <span className="font-medium text-neutral-800">{STEPS[stepIndex].label}</span>
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {STEPS.map((s, i) => (
              <span key={s.id} className={`h-0.5 rounded-full ${i <= stepIndex ? "bg-neutral-900" : "bg-neutral-200"}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* STEP 1: choose a plan */}
        {step === "review" && (
          <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-10 lg:pt-8">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Choose a plan</h2>
              <p className="mt-1 text-sm text-neutral-500">Prices in INR. You pay once for the period you pick.</p>

              {/* billing period */}
              <div role="radiogroup" aria-label="Billing period" className="mt-5 grid grid-cols-3 rounded-lg border border-neutral-200 bg-white p-1">
                {BILLING_CYCLES.map((c) => {
                  const on = billingCycle === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setBillingCycle(c.id)}
                      style={{ minHeight: 0 }}
                      className={`flex h-10 flex-col items-center justify-center rounded-md text-[13px] leading-tight transition-colors ${
                        on ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      <span className="font-medium">{c.shortLabel}</span>
                      {c.discountPercent > 0 && (
                        <span className={`text-[11px] ${on ? "text-white/70" : "text-emerald-700"}`}>Save {c.discountPercent}%</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* plans */}
              <div role="radiogroup" aria-label="Plan" className="mt-4 grid gap-3 sm:grid-cols-2">
                {(["starter", "pro"] as const).map((planKey) => {
                  const p = PLATFORM_PLANS[planKey];
                  const on = selectedPlanId === planKey;
                  const lower = isLower(planKey);
                  const cardPricing = calculatePlanPrice(planKey, billingCycle);
                  return (
                    <button
                      key={planKey}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={lower}
                      onClick={() => setSelectedPlanId(planKey)}
                      style={{ minHeight: 0 }}
                      className={`flex flex-col rounded-xl border bg-white p-5 text-left transition-shadow disabled:cursor-not-allowed disabled:opacity-50 ${
                        on ? "border-neutral-900 shadow-[0_0_0_1px_#171717]" : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold">{p.name}</span>
                          {lower ? (
                            <span className="rounded border border-neutral-200 px-1.5 py-px text-[11px] text-neutral-500">Included in your plan</span>
                          ) : rankOf(planKey) === rankOf(store.planId) ? (
                            <span className="rounded border border-neutral-200 px-1.5 py-px text-[11px] text-neutral-600">Renew</span>
                          ) : (
                            p.highlight && <span className="rounded border border-neutral-200 px-1.5 py-px text-[11px] text-neutral-600">Popular</span>
                          )}
                        </span>
                        <span
                          aria-hidden
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${on ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"}`}
                        >
                          {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-neutral-500">{p.description}</p>
                      <p className="mt-4">
                        <span className="text-[26px] font-semibold tracking-tight tabular-nums">{cardPricing.formattedMonthly}</span>
                        <span className="text-[13px] text-neutral-500"> / month</span>
                      </p>
                      <p className="mt-0.5 h-4 text-xs text-neutral-500">
                        {billingCycle === "monthly" ? "Billed monthly" : `${cardPricing.formattedTotal} billed ${billingCycle === "yearly" ? "yearly" : "every 3 months"}`}
                      </p>
                      <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-[13px] text-neutral-700">
                        {p.features.map((f) => (
                          <li key={f} className="flex gap-2">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-900" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* summary (desktop: sticky side column) */}
            <aside className="hidden lg:block">
              <div className="sticky top-8 space-y-3">
                {summary}
                <button
                  type="button"
                  onClick={() => setStep("payment")}
                  className="h-11 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-black"
                >
                  Continue to payment
                </button>
                <p className="px-1 text-xs leading-relaxed text-neutral-500">
                  You&apos;ll pay by UPI on the next step.   </p>
              </div>
            </aside>

            {/* phone / tablet: total + continue pinned at the bottom */}
            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
              <div className="mx-auto flex max-w-5xl items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-500">
                    {currentPlan.name} · {CYCLE_NAME[billingCycle]}
                  </p>
                  <p className="text-lg font-semibold leading-tight tabular-nums">{inr(pricing.totalRupees)}</p>
                </div>
                <button type="button" onClick={() => setStep("payment")} className="h-11 shrink-0 rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-black">
                  Continue to payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: UPI payment (amount and payee come from the server) */}
        {step === "payment" && (
          <div className="mx-auto grid max-w-5xl items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-8">
            <PlanPaymentStep
              planId={selectedPlanId}
              cycle={billingCycle}
              storeLabel={store.subdomain}
              onBack={() => setStep("review")}
              onSubmit={handleSubmitPayment}
            />
            <aside className="hidden lg:block">
              <div className="sticky top-8 space-y-3">
                {summary}
                <ol className="space-y-2 px-1 text-xs leading-relaxed text-neutral-500">
                  <li>1. Pay the exact amount to the UPI ID shown.</li>
                  <li>2. Enter the 12-digit UTR from your UPI app.</li>
                  <li>3. We match it with our bank account and switch your plan on.</li>
                </ol>
              </div>
            </aside>
          </div>
        )}

        {/* STEP 3: submitted, waiting for us to confirm */}
        {step === "verifying" && (
          <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
            <div className="rounded-xl border border-neutral-200 bg-white">
              <div className="px-6 pb-6 pt-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                  <Clock className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-xl font-semibold tracking-tight">Payment submitted</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  We&apos;ll match your UTR with the payment in our bank account and switch your store to{" "}
                  {submittedRequest?.planName || currentPlan.name}. This usually takes{" "}
                  {submittedRequest?.estimatedVerificationTime || "a few hours"}. You can close this page; the change shows up
                  in your dashboard by itself.
                </p>
              </div>

              <dl className="divide-y divide-neutral-100 border-t border-neutral-200 px-6 text-[13px]">
                <Detail label="Status">
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Awaiting confirmation
                  </span>
                </Detail>
                <Detail label="Plan">
                  {submittedRequest?.planName || currentPlan.name} · {CYCLE_NAME[submittedRequest?.billingCycle || billingCycle]}
                </Detail>
                <Detail label="Amount">
                  <span className="tabular-nums">{submittedRequest?.amountFormatted || inr(pricing.totalRupees)}</span>
                </Detail>
                {submittedRequest?.paymentUtr && (
                  <Detail label="UTR">
                    <span className="tabular-nums">{submittedRequest.paymentUtr}</span>
                  </Detail>
                )}
                {submittedRequest?.referenceId && (
                  <Detail label="Reference">
                    <span className="tabular-nums">{submittedRequest.referenceId}</span>
                  </Detail>
                )}
                {submittedRequest?.createdAt && (
                  <Detail label="Submitted">
                    {new Date(submittedRequest.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </Detail>
                )}
              </dl>

              <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleCancelPending}
                  disabled={cancelling}
                  style={{ minHeight: 0 }}
                  className="h-10 rounded-lg px-1 text-left text-[13px] text-neutral-500 hover:text-rose-600 disabled:opacity-60"
                >
                  {cancelling ? "Cancelling…" : "Cancel request"}
                </button>
                <button type="button" onClick={close} className="h-10 rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-black">
                  Back to dashboard
                </button>
              </div>
            </div>

            <p className="mt-4 px-1 text-xs leading-relaxed text-neutral-500">
              Entered the wrong UTR? Cancel this request and submit it again with the right number.
              {(onOpenSetupWizard || onNavigateTab) && (
                <>
                  {" "}
                  Meanwhile, you can keep{" "}
                  <button
                    type="button"
                    style={{ minHeight: 0 }}
                    className="font-medium text-neutral-800 underline underline-offset-2"
                    onClick={() => {
                      close();
                      if (onOpenSetupWizard) onOpenSetupWizard();
                      else onNavigateTab?.("settings");
                    }}
                  >
                    setting up your store
                  </button>
                  .
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-neutral-900">{children}</dd>
    </div>
  );
}

/** Loads the exact amount and payee from the server, then shows the UPI payment panel. */
function PlanPaymentStep({
  planId,
  cycle,
  storeLabel,
  onBack,
  onSubmit,
}: {
  planId: "starter" | "pro";
  cycle: BillingCycle;
  storeLabel: string;
  onBack: () => void;
  onSubmit: (utr: string) => Promise<void>;
}) {
  const [quote, setQuote] = useState<{ amount: number; label: string; payee: { upiId: string; payeeName: string } } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setQuote(null);
    setError("");
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Please sign in again.");
        const res = await fetch(`/api/billing/quote?kind=plan&plan=${planId}&cycle=${cycle}`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Couldn't load the payment details.");
        if (live) setQuote(body);
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : "Couldn't load the payment details.");
      }
    })();
    return () => {
      live = false;
    };
  }, [planId, cycle]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[440px] rounded-xl border border-rose-200 bg-white p-5 text-sm">
        <p className="font-medium text-rose-700">{error}</p>
        <button type="button" onClick={onBack} style={{ minHeight: 0 }} className="mt-3 text-[13px] font-medium text-neutral-700 underline underline-offset-2">
          Back to plans
        </button>
      </div>
    );
  }
  if (!quote) {
    return (
      <div className="mx-auto flex w-full max-w-[440px] items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-20 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment details…
      </div>
    );
  }
  return (
    <UpiPayPanel
      merchantName={quote.payee.payeeName}
      purpose={`${quote.label} · ${storeLabel}`}
      amount={quote.amount}
      payeeUpiId={quote.payee.upiId}
      payeeName={quote.payee.payeeName}
      note={`${quote.label}`.slice(0, 48)}
      submitLabel="Submit payment"
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
}
