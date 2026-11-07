"use client";

import * as React from "react";
import QRCode from "qrcode";
import { AlertCircle, ArrowLeft, Check, Copy, Loader2, Lock } from "lucide-react";

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
    QRCode.toDataURL(upiUrl, { margin: 0, width: 400, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(""));
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
    if (!utrOk) return setError("Enter the 12-digit UPI reference number (UTR) from your payment app.");
    if (!confirmed) return setError(`Confirm that you've paid ${rupees(amount)}.`);
    setBusy(true);
    try {
      await onSubmit(utr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your payment details. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="[&_:is(h1,h2,h3)]:[font-family:inherit] [&_:is(h1,h2,h3)]:tracking-tight mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
      {/* amount and payee */}
      <div className="border-b border-neutral-200 px-5 pb-5 pt-4">
        <div className="flex h-6 items-center justify-between text-[13px]">
          {onBack ? (
            <button type="button" onClick={onBack} style={{ minHeight: 0 }} className="-ml-1 inline-flex items-center gap-1 rounded px-1 text-neutral-500 hover:text-neutral-900">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <span />
          )}
          {!expired && (
            <span className={`tabular-nums ${left < 60_000 ? "text-rose-600" : "text-neutral-500"}`}>
              Expires in {mm}:{ss}
            </span>
          )}
        </div>
        <p className="mt-4 text-[13px] text-neutral-500">Amount to pay</p>
        <p className="mt-0.5 text-[30px] font-semibold leading-tight tracking-tight tabular-nums">{rupees(amount)}</p>
        <p className="mt-1 truncate text-[13px] text-neutral-500">
          {merchantName} · {purpose}
        </p>
      </div>

      {expired ? (
        <div className="px-6 py-10 text-center">
          <p className="font-semibold">This payment page has expired</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-neutral-500">If you already paid, start again and enter the UPI reference number from that payment.</p>
          <button
            type="button"
            onClick={() => setDeadline(Date.now() + minutes * 60_000)}
            className="mt-5 h-11 rounded-lg bg-neutral-900 px-6 text-sm font-medium text-white hover:bg-black"
          >
            Start again
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          {/* pay */}
          <section className="px-5 pt-5">
            <h3 className="text-sm font-semibold">Pay by UPI</h3>

            {mobile && (
              <a
                href={upiUrl}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-black"
              >
                Open UPI app
              </a>
            )}

            <div className="mt-3 flex items-center gap-4 rounded-xl border border-neutral-200 p-3">
              <div className="shrink-0 rounded-md bg-white">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt={`UPI QR code to pay ${rupees(amount)} to ${payeeUpiId}`} width={132} height={132} className="h-[132px] w-[132px]" />
                ) : (
                  <div className="flex h-[132px] w-[132px] items-center justify-center bg-neutral-50">
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0 text-[13px] leading-relaxed text-neutral-600">
                <p className="font-medium text-neutral-900">{mobile ? "Or scan from another phone" : "Scan to pay"}</p>
                <p className="mt-0.5">Google Pay, PhonePe, Paytm, BHIM or any UPI app. The amount is filled in for you.</p>
              </div>
            </div>

            <dl className="mt-3 divide-y divide-neutral-100 text-[13px]">
              <Row label="UPI ID">
                <button type="button" onClick={() => copy("upi")} style={{ minHeight: 0 }} className="flex min-w-0 items-center gap-1.5 font-medium" title="Copy UPI ID">
                  <span className="truncate">{payeeUpiId}</span>
                  {copied === "upi" ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-neutral-400" />}
                </button>
              </Row>
              <Row label="Name">
                <span className="truncate font-medium">{payeeName}</span>
              </Row>
              <Row label="Amount">
                <button type="button" onClick={() => copy("amount")} style={{ minHeight: 0 }} className="flex items-center gap-1.5 font-medium tabular-nums" title="Copy amount">
                  {rupees(amount)}
                  {copied === "amount" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-neutral-400" />}
                </button>
              </Row>
            </dl>
          </section>

          {/* confirm */}
          <section className="mt-2 border-t border-neutral-200 px-5 pb-5 pt-5">
            <label htmlFor="upi-utr" className="text-sm font-semibold">
              UPI reference number (UTR)
            </label>
            <p className="mt-0.5 text-[13px] text-neutral-500">The 12-digit number in your UPI app after you pay.</p>
            <input
              id="upi-utr"
              value={utr}
              onChange={(e) => {
                setUtr(e.target.value.replace(/\D/g, "").slice(0, 12));
                setError("");
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 412345678901"
              aria-invalid={!!utr && !utrOk}
              className={`mt-2.5 h-11 w-full rounded-lg border bg-white px-3.5 text-[15px] tabular-nums tracking-wider outline-none transition-shadow placeholder:tracking-normal placeholder:text-neutral-400 focus:ring-4 ${
                utr && !utrOk ? "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-100" : utrOk ? "border-emerald-600 focus:ring-emerald-50" : "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-100"
              }`}
            />
            <div className="mt-1.5 flex items-center justify-between text-[12px]">
              <span className={utrOk ? "text-emerald-700" : "text-neutral-400"}>{utrOk ? "12 digits" : `${utr.length} of 12 digits`}</span>
              <button type="button" onClick={() => setHelp((h) => !h)} style={{ minHeight: 0 }} className="font-medium text-neutral-600 underline-offset-2 hover:underline">
                {help ? "Hide help" : "Where do I find it?"}
              </button>
            </div>
            {help && (
              <ul className="mt-2 space-y-1 rounded-lg bg-neutral-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-neutral-600">
                <li><span className="font-medium text-neutral-800">Google Pay:</span> open the payment › UPI transaction ID</li>
                <li><span className="font-medium text-neutral-800">PhonePe:</span> History › the payment › UTR</li>
                <li><span className="font-medium text-neutral-800">Paytm:</span> Balance &amp; History › the payment › UPI Ref. No.</li>
              </ul>
            )}

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-neutral-700">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setError("");
                }}
                style={{ minHeight: 0, minWidth: 0 }}
                className="mt-px h-4 w-4 shrink-0 rounded accent-neutral-900"
              />
              <span>
                I have paid {rupees(amount)} to {payeeUpiId}
              </span>
            </label>

            {error && (
              <p role="alert" className="mt-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Sending…" : submitLabel || "Submit payment details"}
            </button>
          </section>

          <p className="flex items-center justify-center gap-1.5 border-t border-neutral-100 bg-neutral-50 px-5 py-3 text-center text-[12px] text-neutral-500">
            <Lock className="h-3 w-3 shrink-0" />
            Pay only to the UPI ID above. Never share your UPI PIN.
          </p>
        </form>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="flex min-w-0 justify-end">{children}</dd>
    </div>
  );
}
