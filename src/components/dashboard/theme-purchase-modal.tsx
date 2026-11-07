"use client";
import { appAlert, appConfirm, appPrompt } from "@/components/ui/app-dialog";

import * as React from "react";
import { Check, Clock, Loader2, X } from "lucide-react";
import { storeService, type StoreData } from "@/lib/store-service";
import type { ThemeDefinition } from "@/lib/themes";
import { formatThemePrice, getThemePlan, getThemePrice } from "@/lib/theme-pricing";
import { PLATFORM_PLANS } from "@/lib/plans";
import { auth } from "@/lib/firebase";
import { UpiPayPanel } from "@/components/payments/upi-pay-panel";

/**
 * Buying a theme once: pay the amount by UPI, add the payment's 12-digit reference number, and an
 * admin checks it. Once approved, the theme is the shop's for good, editing included, on any plan.
 * The amount and payee come from the server, so they can't be changed in the browser.
 */
export function ThemePurchaseModal({
  store,
  theme,
  onClose,
  onUpgrade,
}: {
  store: StoreData;
  theme: ThemeDefinition;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const waiting = store.themePurchases?.find((p) => p.themeSlug === theme.slug && p.status === "pending_verification");
  const [paying, setPaying] = React.useState(false);
  const [quote, setQuote] = React.useState<{ amount: number; label: string; payee: { upiId: string; payeeName: string } } | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startPaying = async () => {
    setError("");
    setPaying(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in again.");
      const res = await fetch(`/api/billing/quote?kind=theme&theme=${encodeURIComponent(theme.slug)}`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't load the payment details.");
      setQuote(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the payment details.");
      setPaying(false);
    }
  };

  const price = getThemePrice(theme.slug);
  const plan = getThemePlan(theme.slug);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Buy ${theme.name}`}>
      <div className="animate-backdrop-in absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet-up relative max-h-[94svh] w-full max-w-[480px] overflow-y-auto rounded-t-[24px] bg-neutral-100 p-4 sm:rounded-[24px] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3 px-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Buy once, keep for good</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">{theme.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {waiting ? (
          <div className="rounded-2xl bg-white p-6 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
              <Clock className="h-5 w-5" />
            </span>
            <p className="mt-3 font-semibold">We&apos;re checking your payment</p>
            <p className="mt-1 text-sm text-neutral-500">
              {waiting.amountFormatted} · UTR {waiting.paymentUtr || "not given"} · Ref {waiting.referenceId}. {theme.name} unlocks as soon as it&apos;s approved,
              usually within a few hours.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (await appConfirm("Do this only if you haven't paid or typed the wrong reference.", { title: "Withdraw this payment request?", okLabel: "Withdraw", danger: true }))
                  storeService.cancelThemePurchase(store.subdomain, waiting.id).catch((err) => appAlert(err instanceof Error ? err.message : "Couldn't withdraw."));
              }}
              className="mt-4 text-xs font-semibold text-neutral-500 underline-offset-4 hover:text-black hover:underline"
            >
              Withdraw request
            </button>
          </div>
        ) : paying && quote ? (
          <UpiPayPanel
            merchantName={quote.payee.payeeName}
            purpose={`${quote.label} · ${store.name}`}
            amount={quote.amount}
            payeeUpiId={quote.payee.upiId}
            payeeName={quote.payee.payeeName}
            note={`${quote.label}`.slice(0, 48)}
            submitLabel="Submit for verification"
            onBack={() => {
              setPaying(false);
              setQuote(null);
            }}
            onSubmit={async (utr) => {
              await storeService.createThemePurchase(store.subdomain, theme.slug, { paymentUtr: utr });
            }}
          />
        ) : (
          <div className="space-y-5 rounded-2xl bg-white p-5">
            <ul className="space-y-2 text-sm">
              {["Yours for good, on any plan, even Free", "Edit its words, photos, sections and colours", "One payment, no monthly fee"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            {error && <p className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</p>}
            <button
              type="button"
              onClick={startPaying}
              disabled={paying}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-black text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              Pay {formatThemePrice(price)} with UPI
            </button>
            {plan && (
              <p className="text-center text-xs text-neutral-500">
                Or use it with {PLATFORM_PLANS[plan]?.name || "a paid plan"}
                {plan === "starter" ? " or Pro" : ""} (from ₹{((PLATFORM_PLANS[plan]?.priceMonthly || 0) / 100).toLocaleString("en-IN")}/mo) for as long as
                you&apos;re on it.{" "}
                <button type="button" onClick={onUpgrade} className="font-semibold text-black underline underline-offset-4">
                  See plans
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
