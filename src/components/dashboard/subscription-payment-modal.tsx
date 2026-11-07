"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Lock,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Smartphone,
  QrCode,
  Store,
  LayoutDashboard,
  Palette,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { PLATFORM_PLANS, PlanFeature, calculatePlanPrice, BILLING_CYCLES, type BillingCycle } from "@/lib/plans";
import { siteConfig } from "@/lib/config/site";
import { storeService, StoreData, SubscriptionRequest } from "@/lib/store-service";
import { UpiPayPanel } from "@/components/payments/upi-pay-panel";
import { auth } from "@/lib/firebase";

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

// The checkout lives in the URL (?checkout=pro&cycle=monthly&step=payment&ref=...) so a refresh
// lands on the same plan, step and payment reference.
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
  const [selectedPlanId, setSelectedPlanId] = useState<"starter" | "pro">(initialPlanId);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  // Where sellers pay (set by the admin); follows changes live
  const [platformPayment, setPlatformPayment] = useState(() => storeService.getPlatformPayment());
  useEffect(() => storeService.subscribe(() => setPlatformPayment(storeService.getPlatformPayment())), []);

  const [step, setStep] = useState<ModalStep>(() => (readParam("step") === "payment" ? "payment" : "review"));
  // One payment reference per checkout, kept across re-renders and refreshes
  const [generatedRef, setGeneratedRef] = useState(() => {
    const fromUrl = readParam("ref");
    return fromUrl && /^REF-SUB-\d{6}$/.test(fromUrl) ? fromUrl : `REF-SUB-${Math.floor(100000 + Math.random() * 900000)}`;
  });
  const utrKey = `shopersite_checkout_utr_${store.subdomain}`;
  const [paymentUtr, setPaymentUtr] = useState(() => {
    try {
      return sessionStorage.getItem(utrKey) || "";
    } catch {
      return "";
    }
  });
  const [utrError, setUtrError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<SubscriptionRequest | null>(
    store?.pendingSubscription || null
  );
  const [simulatingVerification, setSimulatingVerification] = useState(false);

  // If there is already a pending subscription for this store, show the verifying step by default
  useEffect(() => {
    if (!isOpen) return;
    if (store?.pendingSubscription) {
      setSubmittedRequest(store.pendingSubscription);
      setStep("verifying");
    } else {
      setSubmittedRequest(null);
      setSelectedPlanId(initialPlanId);
      setBillingCycle(initialBillingCycle);
      setStep((s) => (s === "verifying" ? "review" : s));
    }
  }, [isOpen, store?.pendingSubscription, initialPlanId, initialBillingCycle]);

  // Mirror the checkout into the URL so a refresh comes back to the same place
  useEffect(() => {
    if (!isOpen) return;
    writeCheckoutParams({ checkout: selectedPlanId, cycle: billingCycle, step, ref: generatedRef });
  }, [isOpen, selectedPlanId, billingCycle, step, generatedRef]);

  useEffect(() => {
    try {
      if (paymentUtr) sessionStorage.setItem(utrKey, paymentUtr);
      else sessionStorage.removeItem(utrKey);
    } catch {
      // storage unavailable (private mode); the UTR just isn't remembered
    }
  }, [paymentUtr, utrKey]);

  const close = () => {
    writeCheckoutParams(null);
    setStep("review");
    setGeneratedRef(`REF-SUB-${Math.floor(100000 + Math.random() * 900000)}`);
    onClose();
  };

  if (!isOpen) return null;

  const currentPlan = PLATFORM_PLANS[selectedPlanId] || PLATFORM_PLANS.starter;
  const pricing = calculatePlanPrice(selectedPlanId, billingCycle);
  const amountRupees = pricing.totalRupees;
  // Strictly format to 2 decimal places so UPI apps receive a fixed, non-editable amount
  const fixedAmountStr = amountRupees.toFixed(2);

  const platformUpiId = platformPayment.upiId;
  const platformMerchant = platformPayment.payeeName;
  const transactionRef = submittedRequest?.referenceId || generatedRef;
  const transactionNote = `Sub ${currentPlan.name} - ${store.subdomain}`.slice(0, 48);

  // UPI deep link specification: &am=<fixed> locks the amount field in compliant UPI apps
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(platformUpiId)}&pn=${encodeURIComponent(
    platformMerchant
  )}&am=${fixedAmountStr}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${encodeURIComponent(
    transactionRef
  )}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(platformUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(fixedAmountStr);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };


  /** Sends the UTR to the server; the plan starts only when an admin approves the payment. */
  const handleSubmitPayment = async (utr: string) => {
    const req = await storeService.createSubscriptionPayment(store.subdomain, { planId: selectedPlanId, billingCycle, paymentUtr: utr });
    setSubmittedRequest(req);
    setPaymentUtr("");
    setStep("verifying");
    if (onSuccess) onSuccess();
  };

  const handleCancelPending = async () => {
    if (!confirm("Cancel this plan payment request? Do this only if you haven't paid, or entered the wrong reference number.")) return;
    try {
      await storeService.cancelSubscriptionRequest(store.subdomain);
      setSubmittedRequest(null);
      setStep("review");
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't cancel. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#FAFAFA] text-neutral-900 animate-in fade-in duration-200">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Page header */}
        <div className="shrink-0 border-b border-neutral-200 bg-white">
          <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={close}
              aria-label="Back to dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-900 hover:text-black"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight tracking-tight">Upgrade your plan</h1>
              <p className="truncate text-xs text-neutral-500">
                {store.name} · {store.subdomain}.{siteConfig.domain}
              </p>
            </div>
          </div>
        </div>

        {/* Step Progression Indicators */}
        <div className="shrink-0 border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 text-xs font-semibold sm:px-6">
            <div
              className={`flex items-center gap-1.5 ${
                step === "review" ? "text-neutral-950 font-bold" : "text-emerald-700"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  step === "review"
                    ? "bg-neutral-900 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {step === "review" ? "1" : <Check className="h-3 w-3" />}
              </span>
              <span>1. Choose Plan</span>
            </div>
            <div className="h-px w-8 bg-neutral-200" />
            <div
              className={`flex items-center gap-1.5 ${
                step === "payment"
                  ? "text-neutral-950 font-bold"
                  : step === "verifying"
                  ? "text-emerald-700"
                  : "text-neutral-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  step === "payment"
                    ? "bg-neutral-900 text-white"
                    : step === "verifying"
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {step === "verifying" ? <Check className="h-3 w-3" /> : "2"}
              </span>
              <span>2. UPI Payment</span>
            </div>
            <div className="h-px w-8 bg-neutral-200" />
            <div
              className={`flex items-center gap-1.5 ${
                step === "verifying" ? "text-amber-800 font-bold" : "text-neutral-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  step === "verifying"
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                3
              </span>
              <span>3. Verification</span>
            </div>
          </div>
        </div>

        {/* Page body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          {/* STEP 1: REVIEW & PLAN SELECTION */}
          {step === "review" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Billing Cycle Toggle (Monthly, Quarterly save 5%, Annually save 10%) */}
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="inline-flex flex-wrap items-center justify-center rounded-xl bg-neutral-100 p-1 text-xs font-semibold gap-1">
                  {BILLING_CYCLES.map((cycleOption) => {
                    const isCycleSelected = billingCycle === cycleOption.id;
                    return (
                      <button
                        key={cycleOption.id}
                        type="button"
                        onClick={() => setBillingCycle(cycleOption.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                          isCycleSelected
                            ? "bg-white text-neutral-900 shadow-xs"
                            : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        <span>{cycleOption.shortLabel}</span>
                        {cycleOption.tag && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                              cycleOption.id === "yearly"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {cycleOption.tag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tier Cards Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(["starter", "pro"] as const).map((planKey) => {
                  const p = PLATFORM_PLANS[planKey];
                  const isSelected = selectedPlanId === planKey;
                  const cardPricing = calculatePlanPrice(planKey, billingCycle);

                  return (
                    <div
                      key={planKey}
                      onClick={() => setSelectedPlanId(planKey)}
                      className={`relative cursor-pointer rounded-2xl border p-4.5 transition-all ${
                        isSelected
                          ? "border-neutral-950 bg-neutral-950 text-white shadow-lg ring-2 ring-neutral-950"
                          : "border-neutral-200 bg-white hover:border-neutral-300 text-neutral-900"
                      }`}
                    >
                      {p.highlight && (
                        <span
                          className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isSelected
                              ? "bg-amber-400 text-neutral-950"
                              : "bg-neutral-900 text-white"
                          }`}
                        >
                          Most Popular
                        </span>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold">{p.name}</span>
                        <div
                          className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-amber-400 bg-amber-400 text-neutral-950"
                              : "border-neutral-300 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight">
                          {cardPricing.formattedMonthly}
                        </span>
                        <span
                          className={`text-xs ${
                            isSelected ? "text-neutral-400" : "text-neutral-500"
                          }`}
                        >
                          /month
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                          {billingCycle === "monthly" ? "Billed monthly" : `Billed ${billingCycle === "quarterly" ? "quarterly" : "annually"} (${cardPricing.formattedTotal})`}
                        </span>
                        {cardPricing.discountPercent > 0 && (
                          <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${isSelected ? "bg-amber-400 text-neutral-950" : "bg-emerald-100 text-emerald-800"}`}>
                            Save {cardPricing.discountPercent}%
                          </span>
                        )}
                      </div>

                      <p
                        className={`mt-1.5 text-xs line-clamp-2 ${
                          isSelected ? "text-neutral-300" : "text-neutral-600"
                        }`}
                      >
                        {p.description}
                      </p>

                      <ul className="mt-3.5 space-y-1.5 border-t pt-3 text-xs">
                        <li className="flex items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-amber-400" : "text-emerald-600"
                            }`}
                          />
                          <span>
                            {p.maxProducts >= 999999
                              ? "Unlimited products in catalog"
                              : `Up to ${p.maxProducts} products in catalog`}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-amber-400" : "text-emerald-600"
                            }`}
                          />
                          <span>
                            {planKey === "pro"
                              ? "All 5+ designer templates"
                              : "3 designer themes (Bento, Botanical)"}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-amber-400" : "text-emerald-600"
                            }`}
                          />
                          <span>
                            {planKey === "pro"
                              ? "Custom domain support (yourbrand.in)"
                              : "Discount coupons & marketing banners"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary Box */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Billing Summary
                </span>
                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-700">
                    <span>
                      {currentPlan.name} ({pricing.cycleLabel})
                    </span>
                    <span className="font-semibold text-neutral-900 font-mono">
                      ₹{((currentPlan.priceMonthly / 100) * (billingCycle === "yearly" ? 12 : billingCycle === "quarterly" ? 3 : 1)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {pricing.savedRupees > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>{pricing.cycleLabel} Savings ({pricing.discountPercent}%)</span>
                      <span className="font-mono">-₹{pricing.savedRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-700">
                    <span className="inline-flex items-center gap-1">
                      <span>GST & Platform Processing Fees</span>
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                        Inclusive
                      </span>
                    </span>
                    <span className="font-semibold text-neutral-900">₹0.00</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-2 flex justify-between text-sm font-bold text-neutral-900">
                    <span>Total Payable:</span>
                    <span className="text-base text-emerald-700 font-mono">
                      {pricing.formattedTotal}.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Proceed CTA, pinned to the bottom so it's always reachable */}
              <div className="sticky bottom-0 -mx-4 -mb-6 border-t border-neutral-200 bg-[#FAFAFA]/95 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6">
              <button
                type="button"
                onClick={() => setStep("payment")}
                className="w-full h-12 rounded-xl bg-neutral-900 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md cursor-pointer hover:translate-y-[-1px]"
              >
                <span>Proceed to UPI Payment (₹{amountRupees.toLocaleString("en-IN")})</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              </div>
            </div>
          )}

          {/* STEP 2: gateway-style UPI payment (amount and payee confirmed by the server) */}
          {step === "payment" && (
            <PlanPaymentStep
              planId={selectedPlanId}
              cycle={billingCycle}
              storeLabel={`${store.name} · ${store.subdomain}`}
              onBack={() => setStep("review")}
              onSubmit={handleSubmitPayment}
            />
          )}

          {/* STEP 3: VERIFICATION IN PROGRESS (Reassurance + "You can quit now" + Productive options) */}
          {step === "verifying" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Radar Status Badge */}
              <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 text-center space-y-3">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
                  <Clock className="h-8 w-8 animate-spin-slow" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-600" />
                  </span>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Verification Underway</span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-neutral-950">
                    Payment Submitted for Verification
                  </h3>
                </div>

                {/* Prominent "You can quit now" Alert Box */}
                <div className="rounded-2xl border border-amber-300/80 bg-white p-4 text-left space-y-1.5 text-xs text-neutral-800 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>You can safely quit or close this window now</span>
                  </div>
                  <p className="leading-relaxed text-neutral-600 pl-6">
                    Bank verification and automated reconciliation may take up to{" "}
                    <b className="text-neutral-900">1–2 hours</b> during peak banking hours. You don&apos;t
                    need to wait on this screen — your plan limits and features will activate
                    automatically the moment verification clears.
                  </p>
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left pt-1">
                  <div className="rounded-xl bg-white border border-neutral-200/80 p-2.5">
                    <span className="block text-[10px] text-neutral-500 uppercase">Plan</span>
                    <span className="font-bold text-xs truncate block text-neutral-900">
                      {submittedRequest?.planName || currentPlan.name}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-neutral-200/80 p-2.5">
                    <span className="block text-[10px] text-neutral-500 uppercase">Amount</span>
                    <span className="font-bold text-xs font-mono text-emerald-700 block">
                      {submittedRequest?.amountFormatted || `₹${fixedAmountStr}`}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-neutral-200/80 p-2.5 col-span-2 sm:col-span-1">
                    <span className="block text-[10px] text-neutral-500 uppercase">Reference</span>
                    <span className="font-mono font-bold text-xs truncate block text-neutral-900">
                      {submittedRequest?.referenceId || transactionRef}
                    </span>
                  </div>
                </div>

                {submittedRequest?.paymentUtr && (
                  <p className="text-[11px] text-neutral-500 text-left font-mono">
                    Bank UTR: <span className="font-semibold text-neutral-800">{submittedRequest.paymentUtr}</span>
                  </p>
                )}
              </div>

              {/* "While you wait: explore and stay productive" */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold tracking-tight text-neutral-900">
                    What you can do while we verify:
                  </h4>
                  <span className="text-xs text-neutral-500">Pick any task</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Setup store */}
                  <div
                    onClick={() => {
                      close();
                      if (onOpenSetupWizard) onOpenSetupWizard();
                      else if (onNavigateTab) onNavigateTab("settings");
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3.5 transition-all hover:border-neutral-950 hover:bg-neutral-50 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-105">
                      <Store className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                        Complete Store Setup
                      </span>
                      <span className="block text-[11px] text-neutral-500 line-clamp-2">
                        Add store logo, shipping rates, and WhatsApp number.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-900 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Option 2: Explore Dashboard */}
                  <div
                    onClick={() => {
                      close();
                      if (onNavigateTab) onNavigateTab("overview");
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3.5 transition-all hover:border-neutral-950 hover:bg-neutral-50 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-transform group-hover:scale-105">
                      <LayoutDashboard className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                        Explore Dashboard
                      </span>
                      <span className="block text-[11px] text-neutral-500 line-clamp-2">
                        Check live orders, view stats, and configure alerts.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-900 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Option 3: Designer themes */}
                  <div
                    onClick={() => {
                      close();
                      if (onNavigateTab) onNavigateTab("themes");
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3.5 transition-all hover:border-neutral-950 hover:bg-neutral-50 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
                      <Palette className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                        Browse Designer Themes
                      </span>
                      <span className="block text-[11px] text-neutral-500 line-clamp-2">
                        Preview Bento Tech, Kyoto Botanical, and Lookbook.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-900 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Option 4: Add Products */}
                  <div
                    onClick={() => {
                      close();
                      if (onNavigateTab) onNavigateTab("products");
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3.5 transition-all hover:border-neutral-950 hover:bg-neutral-50 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
                      <Package className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                        Draft & Organize Products
                      </span>
                      <span className="block text-[11px] text-neutral-500 line-clamp-2">
                        Add photos, organize categories, and set stock counts.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-900 transition-all shrink-0 mt-1" />
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Dev Sandbox Helper */}
              <div className="border-t border-neutral-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-neutral-900 text-white font-semibold text-xs hover:bg-black transition-colors"
                >
                  Close & Return to Dashboard
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelPending}
                    className="text-xs text-neutral-500 hover:text-rose-600 transition-colors"
                  >
                    Cancel request
                  </button>


                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
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
      <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        <p className="font-semibold">{error}</p>
        <button type="button" onClick={onBack} className="mt-3 text-xs font-semibold underline">
          Back to plans
        </button>
      </div>
    );
  }
  if (!quote) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw className="h-5 w-5 animate-spin text-neutral-400" />
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
      submitLabel="Submit for verification"
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
}
