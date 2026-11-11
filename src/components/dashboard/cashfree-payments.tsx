"use client";

import * as React from "react";
import { BadgeCheck, Clock, ExternalLink, Landmark, Loader2, RefreshCw, ShieldCheck, X, XCircle } from "lucide-react";
import type { StoreData } from "@/lib/store-service";
import { fetchMerchantStatus, startKyc, type MerchantStatus } from "@/lib/payments/client";

/**
 * Settings › Online payments. The seller gets their own Cashfree merchant account, completes KYC on
 * Cashfree's secure form, and buyer payments settle straight to the seller's bank account.
 */
export function CashfreePaymentsCard({ store }: { store: StoreData }) {
  const [status, setStatus] = React.useState<MerchantStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [kycLink, setKycLink] = React.useState("");
  // online payments not switched on for the platform yet (no Cashfree keys on the server)
  const [comingSoon, setComingSoon] = React.useState(false);
  const [form, setForm] = React.useState({
    businessName: store.name || "",
    email: store.contactEmail || store.ownerEmail || "",
    phone: (store.contactPhone || "").replace(/[^0-9]/g, "").slice(-10),
  });

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStatus(await fetchMerchantStatus(store.subdomain));
      setComingSoon(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (/aren't set up on the server|CASHFREE_PARTNER_API_KEY/i.test(msg)) setComingSoon(true);
      else setError(msg || "Couldn't check your payment account.");
    } finally {
      setLoading(false);
    }
  }, [store.subdomain]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // the KYC form tells us when the seller finishes it
  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if ((e.data as { type?: string })?.type === "shopersite:cashfree-kyc-return") {
        setKycLink("");
        refresh();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refresh]);

  const openKyc = async () => {
    setError("");
    if (form.businessName.trim().length < 2) return setError("Enter your business name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return setError("Enter a valid email address.");
    if (!/^[6-9][0-9]{9}$/.test(form.phone)) return setError("Enter a valid 10-digit mobile number.");
    setBusy(true);
    try {
      const r = await startKyc({ store: store.subdomain, ...form });
      if (r.link) setKycLink(r.link);
      setStatus((s) => ({ ...(s || { mode: "sandbox" }), state: r.state }));
      if (!r.link) await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open the KYC form.");
    } finally {
      setBusy(false);
    }
  };

  const state = status?.state;
  const needsForm = state === "not_started";

  // Until Cashfree is switched on for the platform, say nothing: a "coming soon" note here
  // would contradict the Razorpay option right below it.
  if (comingSoon) return null;
  const canContinueKyc = state === "kyc_pending" || state === "rejected" || state === "in_review";

  return (
    <div className="rounded-[24px] bg-white ring-1 ring-black/[0.04]">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              Online payments <span className="text-sm font-normal text-neutral-400">via Cashfree</span>
              {status?.mode === "sandbox" && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">Test mode</span>}
            </h3>
            <p className="mt-0.5 text-sm text-neutral-500">
              UPI, cards, net banking and wallets through your own Cashfree account. Money settles straight to your bank account; Shopersite never holds it.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label="Check status again"
            style={{ minHeight: 0 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:border-neutral-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {comingSoon ? (
          <StatusRow tone="amber" icon={<Clock className="h-5 w-5" />} title="Coming soon">
            Card, net banking and automatic UPI payments through your own Cashfree account are on the way. Until then buyers pay you
            directly by UPI or cash on delivery (set below).
          </StatusRow>
        ) : loading && !status ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your payment account…
          </p>
        ) : state === "active" ? (
          <StatusRow tone="green" icon={<BadgeCheck className="h-5 w-5" />} title="Online payments are live">
            Buyers can pay online at checkout. Cashfree settles each payment to the bank account you verified in KYC.
            {status?.merchantId && <span className="mt-1 block font-mono text-xs text-emerald-800/70">Cashfree account: {status.merchantId}</span>}
          </StatusRow>
        ) : state === "in_review" ? (
          <StatusRow tone="amber" icon={<Clock className="h-5 w-5" />} title="Cashfree is reviewing your KYC">
            This usually takes 1–3 working days. Online payment turns on by itself once they approve it.
          </StatusRow>
        ) : state === "rejected" ? (
          <StatusRow tone="red" icon={<XCircle className="h-5 w-5" />} title="Cashfree needs changes to your KYC">
            Open the KYC form to see what Cashfree asked for and send it again.
          </StatusRow>
        ) : state === "suspended" ? (
          <StatusRow tone="red" icon={<XCircle className="h-5 w-5" />} title="Your Cashfree account is on hold">
            Please contact Cashfree support. Buyers can still use cash on delivery meanwhile.
          </StatusRow>
        ) : state === "kyc_pending" ? (
          <StatusRow tone="amber" icon={<ShieldCheck className="h-5 w-5" />} title="Finish your KYC to go live">
            Your Cashfree account is ready. Complete the KYC form (PAN, ID and bank account) to start taking online payments.
          </StatusRow>
        ) : null}

        {needsForm && (
          <div className="mt-5 space-y-3">
            <ul className="space-y-2 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" /> KYC happens on Cashfree&apos;s secure form. Keep your PAN, Aadhaar and bank details ready.</li>
              <li className="flex gap-2"><Landmark className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" /> Payments settle directly to your own bank account.</li>
            </ul>
            <Field label="Business name (as on PAN / bank account)" value={form.businessName} onChange={(v) => setForm((f) => ({ ...f, businessName: v }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email for Cashfree" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              <Field label="Mobile number" inputMode="numeric" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v.replace(/[^0-9]/g, "").slice(0, 10) }))} />
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {(needsForm || canContinueKyc) && (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={openKyc}
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {needsForm ? "Start KYC with Cashfree" : state === "in_review" ? "View KYC form" : "Continue KYC"}
            </button>
          </div>
        )}
      </div>

      {kycLink && (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/50 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Cashfree KYC">
          <div className="flex h-full w-full flex-col overflow-hidden bg-white sm:h-[90vh] sm:max-w-3xl sm:rounded-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
              <p className="text-sm font-semibold">Cashfree KYC</p>
              <div className="flex items-center gap-1">
                <a
                  href={kycLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
                </a>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setKycLink("");
                    refresh();
                  }}
                  style={{ minHeight: 0 }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <iframe
              src={kycLink}
              title="Cashfree KYC form"
              className="h-full w-full flex-1 border-0"
              allow="camera; microphone; geolocation; clipboard-write"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ tone, icon, title, children }: { tone: "green" | "amber" | "red"; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-900",
    amber: "bg-amber-50 text-amber-900",
    red: "bg-rose-50 text-rose-900",
  } as const;
  return (
    <div className={`mt-5 flex gap-3 rounded-xl p-4 ${tones[tone]}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 opacity-80">{children}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition-colors focus:border-neutral-900"
      />
    </label>
  );
}
