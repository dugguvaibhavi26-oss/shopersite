"use client";

import * as React from "react";
import { ArrowRight, BadgeCheck, Loader2, PartyPopper } from "lucide-react";
import type { StoreData } from "@/lib/store-service";
import { auth } from "@/lib/firebase";

/**
 * Plugins → Razorpay: one-click connect. The seller approves Shopersite on Razorpay's own page and
 * comes back here, where a card says it worked. The same connection shows in Settings → Payments,
 * which is also where sellers can paste API keys instead.
 */

export interface RazorpayStatus {
  connected: boolean;
  auth?: "keys" | "oauth";
  keyId?: string;
  mode?: "test" | "live";
  connectedAt?: string;
}

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    cache: "no-store",
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body as T;
}

export const fetchRazorpayStatus = (store: string) => call<RazorpayStatus>(`/api/razorpay/merchant?store=${encodeURIComponent(store)}`);

/** Whether this store has Razorpay connected (for the "On" badge on the Plugins list). */
export function useRazorpayConnected(store: string): boolean {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    const check = () =>
      fetchRazorpayStatus(store)
        .then((s) => live && setOn(!!s.connected))
        .catch(() => {});
    // the signed-in user may not be ready on the first render
    if (auth.currentUser) check();
    const off = auth.onAuthStateChanged((u) => u && check());
    return () => {
      live = false;
      off();
    };
  }, [store]);
  return on;
}

/** Reads ?razorpay=connected|error once (left by Razorpay's return), then removes it from the address. */
function useReturnResult(): "connected" | "error" | null {
  const [result, setResult] = React.useState<"connected" | "error" | null>(null);
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const r = p.get("razorpay");
    if (r === "connected" || r === "error") setResult(r);
    if (p.has("razorpay") || p.has("plugin")) {
      p.delete("razorpay");
      p.delete("plugin");
      const q = p.toString();
      window.history.replaceState(window.history.state, "", window.location.pathname + (q ? `?${q}` : "") + window.location.hash);
    }
  }, []);
  return result;
}

export function RazorpayPlugin({ store, onOpenPayments }: { store: StoreData; onOpenPayments: () => void }) {
  const returned = useReturnResult();
  const [status, setStatus] = React.useState<RazorpayStatus | null>(null);
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (returned === "error") setError("Razorpay connection didn't finish. Please try again.");
  }, [returned]);

  React.useEffect(() => {
    fetch("/api/razorpay/oauth/connect", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAvailable(!!d.available))
      .catch(() => setAvailable(false));
  }, []);

  const load = React.useCallback(() => {
    fetchRazorpayStatus(store.subdomain)
      .then(setStatus)
      .catch((e) => {
        setStatus({ connected: false });
        setError(e instanceof Error ? e.message : "Couldn't check Razorpay.");
      });
  }, [store.subdomain]);
  React.useEffect(() => {
    if (auth.currentUser) load();
    return auth.onAuthStateChanged((u) => u && load());
  }, [load]);

  const connect = async () => {
    setError("");
    setBusy(true);
    try {
      const { url } = await call<{ url: string }>("/api/razorpay/oauth/connect", { method: "POST", body: JSON.stringify({ store: store.subdomain }) });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open Razorpay.");
      setBusy(false);
    }
  };

  if (!status || available === null)
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking Razorpay…
      </p>
    );

  const live = status.mode === "live";

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {status.connected ? (
        <>
          {/* just came back from Razorpay: celebrate */}
          {returned === "connected" ? (
            <div className="reveal-in rounded-2xl bg-neutral-950 p-6 text-white sm:p-7">
              <PartyPopper className="h-8 w-8 text-amber-300" />
              <h3 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">Congratulations, Razorpay is connected</h3>
              <p className="mt-1.5 max-w-lg text-sm text-white/70">
                {live
                  ? "Buyers can now pay by UPI, card or net banking, and the money goes from Razorpay to your bank."
                  : "It's connected in test mode, so no real money moves yet. Try a test payment from Payments, then switch to live."}
              </p>
              <button type="button" onClick={onOpenPayments} style={{ minHeight: 0 }} className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-neutral-950 hover:bg-neutral-100">
                {live ? "See it in Payments" : "Try a test payment"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">Razorpay is connected{live ? "" : " (test mode)"}</p>
                <p className="mt-0.5 text-emerald-800">
                  {status.auth === "oauth" ? "Linked to your Razorpay account." : "Connected with your API keys."}{" "}
                  {live ? "Buyers can pay online." : "No real money moves until you switch to live."}
                </p>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-semibold">Manage it in Payments</p>
            <p className="mt-0.5 text-sm text-neutral-500">Test payments, switching to live and disconnecting all live in Settings → Payments.</p>
            <button type="button" onClick={onOpenPayments} style={{ minHeight: 0 }} className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 px-4 text-sm font-semibold hover:border-neutral-900">
              Open Payments <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : available ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold">Connect in one click</h3>
          <p className="mt-0.5 max-w-xl text-sm text-neutral-500">
            Sign in to Razorpay and approve Shopersite. You&apos;ll come straight back here. No keys to copy, and the money always goes to your own bank.
          </p>
          <button type="button" onClick={connect} disabled={busy} style={{ minHeight: 0 }} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Connect with Razorpay
          </button>
          <p className="mt-4 text-sm text-neutral-500">
            New to Razorpay, or prefer API keys?{" "}
            <button type="button" onClick={onOpenPayments} style={{ minHeight: 0 }} className="font-semibold text-neutral-900 underline underline-offset-2">
              Set it up in Payments
            </button>
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold">One-click connect is not available right now</h3>
          <p className="mt-0.5 text-sm text-neutral-500">You can still connect Razorpay with your API keys in Payments.</p>
          <button type="button" onClick={onOpenPayments} style={{ minHeight: 0 }} className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
            Open Payments <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
