"use client";

import * as React from "react";
import QRCode from "qrcode";
import { AlertCircle, Check, ChevronDown, Clock, Copy, Loader2, Lock, ShieldCheck, Smartphone } from "lucide-react";

/**
 * A payment-gateway style UPI screen: amount, payee, QR code (made in the browser), "open UPI app",
 * a countdown, and the 12-digit UPI reference (UTR) the payer types after paying.
 *
 * It never claims a payment succeeded: manual UPI can't be confirmed by software, so the payment
 * is always "sent for checking" until the receiver confirms it in their bank app.
 */
export interface UpiPayPanelProps {
  /** who is being paid, shown in the header (e.g. the shop's name or "Shopersite") */
  merchantName: string;
  /** what this payment is for, e.g. "Order · 2 items" or "Growth plan · Monthly" */
  purpose: string;
  amount: number; // paise
  payeeUpiId: string;
  payeeName: string;
  /** note shown in the payer's UPI app */
  note: string;
  /** called with the 12-digit UTR; throw an Error with a user-facing message to show it */
  onSubmit: (utr: string) => Promise<void>;
  onBack?: () => void;
  submitLabel?: string;
  /** minutes the payment page stays open (cosmetic: it keeps people from paying an old QR) */
  minutes?: number;
}

const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function UpiPayPanel({ merchantName, purpose, amount, payeeUpiId, payeeName, note, onSubmit, onBack, submitLabel, minutes = 10 }: UpiPayPanelProps) {
  const upiUrl = React.useMemo(
    () =>
      `upi://pay?pa=${encodeURIComponent(payeeUpiId)}&pn=${encodeURIComponent(payeeName)}&am=${(amount / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note.slice(0, 60))}`,
    [payeeUpiId, payeeName, amount, note]
  );
  const [qr, setQr] = React.useState("");
  React.useEffect(() => {
    QRCode.toDataURL(upiUrl, { margin: 1, width: 440, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(""));
  }, [upiUrl]);

  const [deadline, setDeadline] = React.useState(() => Date.now() + minutes * 60_000);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const left = Math.max(0, deadline - now);
  const expired = left === 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    setMobile(window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  const [copied, setCopied] = React.useState<"" | "upi" | "amount">("");
  const copy = async (what: "upi" | "amount") => {
    try {
      await navigator.clipboard.writeText(what === "upi" ? payeeUpiId : (amount / 100).toFixed(2));
      setCopied(what);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      // clipboard blocked: the value is on screen to type
    }
  };

  const [utr, setUtr] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [help, setHelp] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const utrOk = /^\d{12}$/.test(utr);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!utrOk) return setError("The UPI reference (UTR) is the 12-digit number shown in your payment app after paying.");
    if (!confirmed) return setError(`Please confirm you've paid ${rupees(amount)}.`);
    setBusy(true);
    try {
      await onSubmit(utr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your payment details. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[22px] border border-neutral-200 bg-white text-neutral-900 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)]">
      {/* header: who you're paying and how much */}
      <div className="bg-neutral-950 px-5 pb-5 pt-4 text-white">
        <div className="flex items-center justify-between gap-3">
          {onBack ? (
            <button type="button" onClick={onBack} className="text-xs font-medium text-white/60 hover:text-white">
              ← Change method
            </button>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
            <Lock className="h-3 w-3" /> Secure UPI payment
          </span>
        </div>
        <p className="mt-4 truncate text-sm text-white/60">{merchantName}</p>
        <p className="mt-0.5 text-[34px] font-semibold leading-none tracking-tight tabular-nums">{rupees(amount)}</p>
        <p className="mt-2 truncate text-xs text-white/50">{purpose}</p>
      </div>

      {expired ? (
        <div className="px-6 py-10 text-center">
          <Clock className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-4 font-semibold">This payment page timed out</p>
          <p className="mt-1 text-sm text-neutral-500">If you already paid, start again and enter your UPI reference number.</p>
          <button
            type="button"
            onClick={() => setDeadline(Date.now() + minutes * 60_000)}
            className="mt-5 h-11 rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-black"
          >
            Start again
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          {/* step 1: pay */}
          <div className="px-5 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[11px] text-white">1</span>
                Pay with any UPI app
              </p>
              <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${left < 60_000 ? "text-rose-600" : "text-neutral-500"}`}>
                <Clock className="h-3.5 w-3.5" /> {mm}:{ss}
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              {mobile && (
                <a href={upiUrl} className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black">
                  <Smartphone className="h-4 w-4" /> Open UPI app to pay {rupees(amount)}
                </a>
              )}
              <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-neutral-200">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt={`UPI QR code to pay ${rupees(amount)} to ${payeeUpiId}`} width={188} height={188} className="h-[188px] w-[188px]" />
                ) : (
                  <div className="flex h-[188px] w-[188px] items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-neutral-500">
                {mobile ? "Or scan from another phone" : "Scan with GPay, PhonePe, Paytm or any UPI app"}
              </p>

              <div className="mt-4 w-full divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white text-sm">
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="text-neutral-500">Pay to</span>
                  <button type="button" onClick={() => copy("upi")} className="flex min-w-0 items-center gap-1.5 font-medium" title="Copy UPI ID">
                    <span className="truncate">{payeeUpiId}</span>
                    {copied === "upi" ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-neutral-400" />}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="text-neutral-500">Name</span>
                  <span className="truncate font-medium">{payeeName}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="text-neutral-500">Exact amount</span>
                  <button type="button" onClick={() => copy("amount")} className="flex items-center gap-1.5 font-semibold tabular-nums" title="Copy amount">
                    {rupees(amount)}
                    {copied === "amount" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-neutral-400" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* step 2: tell us the UTR */}
          <div className="px-5 pb-5 pt-6">
            <p className="text-[13px] font-semibold">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[11px] text-white">2</span>
              Enter the UPI reference number
            </p>
            <input
              value={utr}
              onChange={(e) => {
                setUtr(e.target.value.replace(/\D/g, "").slice(0, 12));
                setError("");
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="12-digit UTR, e.g. 412345678901"
              aria-label="UPI reference number (UTR)"
              aria-invalid={!!utr && !utrOk}
              className={`mt-3 h-12 w-full rounded-xl border bg-white px-4 font-mono text-[15px] tracking-[0.12em] outline-none transition-colors placeholder:font-sans placeholder:tracking-normal ${
                utr && !utrOk ? "border-amber-400" : utrOk ? "border-emerald-500" : "border-neutral-300 focus:border-neutral-900"
              }`}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className={utrOk ? "text-emerald-700" : "text-neutral-500"}>{utrOk ? "Looks right" : `${utr.length}/12 digits`}</span>
              <button type="button" onClick={() => setHelp((h) => !h)} className="inline-flex items-center gap-1 font-medium text-neutral-600">
                Where do I find it? <ChevronDown className={`h-3.5 w-3.5 transition-transform ${help ? "rotate-180" : ""}`} />
              </button>
            </div>
            {help && (
              <div className="mt-2 rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
                After paying, open the payment in your UPI app. It's called <b>UTR</b>, <b>UPI Ref. No.</b> or <b>UPI transaction ID</b>:
                12 digits. GPay: tap the payment › &quot;UPI transaction ID&quot;. PhonePe: History › the payment › &quot;UTR&quot;. Paytm: Balance &amp; History › the payment.
              </div>
            )}

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setError("");
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-neutral-900"
              />
              <span className="text-neutral-700">
                I&apos;ve paid <b>{rupees(amount)}</b> to <b>{payeeUpiId}</b>
              </span>
            </label>

            {error && (
              <p className="mt-4 flex gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {busy ? "Sending…" : submitLabel || "Submit payment details"}
            </button>
          </div>

          <div className="flex items-start gap-2 border-t border-neutral-100 bg-neutral-50 px-5 py-3.5 text-[11.5px] leading-relaxed text-neutral-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Pay only to the UPI ID above. Your UPI PIN is entered only inside your UPI app; nobody here will ever ask for it.
              Your payment is confirmed once {payeeName} checks it.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
