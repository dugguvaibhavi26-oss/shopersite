"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { StoreData } from "@/lib/store-service";
import { auth } from "@/lib/firebase";
import { getStoreDomain, getStoreUrl } from "@/lib/config/site";

/** Shopersite's Razorpay partner referral link: sellers who sign up through it are linked to our partner account. */
const SIGNUP_URL = process.env.NEXT_PUBLIC_RAZORPAY_SIGNUP_URL || "https://rzp.io/rzp/0dyAwJS";
/** Razorpay's "Business website details" page: adding the website and generating API keys both happen here. */
const WEBSITE_SETTINGS_URL = "https://dashboard.razorpay.com/app/website-app-settings";
const API_KEYS_URL = WEBSITE_SETTINGS_URL;

interface RazorpayStatus {
  connected: boolean;
  auth?: "keys" | "oauth";
  keyId?: string;
  mode?: "test" | "live";
  connectedAt?: string;
}

type Step = "choose" | "new" | "keys";

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

async function send<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(await authHeaders()), ...(init.headers || {}) }, cache: "no-store" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || fallback);
  return body as T;
}

const fetchStatus = (s: string) => send<RazorpayStatus>(`/api/razorpay/merchant?store=${encodeURIComponent(s)}`, {}, "Couldn't check Razorpay status.");
const connectKeys = (s: string, keyId: string, keySecret: string) =>
  send<RazorpayStatus>("/api/razorpay/merchant", { method: "POST", body: JSON.stringify({ store: s, keyId, keySecret }) }, "Couldn't connect Razorpay.");
const disconnectRazorpay = (s: string) => send(`/api/razorpay/merchant?store=${encodeURIComponent(s)}`, { method: "DELETE" }, "Couldn't disconnect Razorpay.");
const requestGuidance = (s: string) =>
  send("/api/support/guidance", { method: "POST", body: JSON.stringify({ store: s, topic: "razorpay_setup" }) }, "Couldn't send your request. Please try again.");
const getTestPass = (s: string) =>
  send<{ pass: string }>("/api/razorpay/test-pass", { method: "POST", body: JSON.stringify({ store: s }) }, "Couldn't start a test payment.");
const startOAuth = (s: string) =>
  send<{ url: string }>("/api/razorpay/oauth/connect", { method: "POST", body: JSON.stringify({ store: s }) }, "Couldn't open Razorpay. Please try again.");

async function fetchOAuthAvailable(): Promise<boolean> {
  try {
    const r = await fetch("/api/razorpay/oauth/connect", { cache: "no-store" });
    return !!(await r.json()).available;
  } catch {
    return false;
  }
}

/** The new-seller checklist is remembered on this device, so sellers can come back after Razorpay approves them. */
function useChecklist(subdomain: string) {
  const key = `rzp-setup:${subdomain}`;
  const [done, setDone] = React.useState<number[]>([]);
  React.useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch {
      setDone([]);
    }
  }, [key]);
  const toggle = (n: number) =>
    setDone((prev) => {
      const next = prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n];
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  return { done, toggle };
}

export function RazorpayPaymentsCard({ store }: { store: StoreData }) {
  const [status, setStatus] = React.useState<RazorpayStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [step, setStep] = React.useState<Step>("choose");
  const [updating, setUpdating] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(false);
  const [form, setForm] = React.useState({ keyId: "", keySecret: "" });
  const [oauthAvailable, setOauthAvailable] = React.useState(false);
  const [guidance, setGuidance] = React.useState<"closed" | "open" | "sending" | "sent">("closed");
  const [guidanceError, setGuidanceError] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const checklist = useChecklist(store.subdomain);
  const storeAddress = `https://${getStoreDomain(store.subdomain)}`;

  React.useEffect(() => {
    fetchOAuthAvailable().then(setOauthAvailable);
    const p = new URLSearchParams(window.location.search);
    if (p.get("razorpay") === "error") setError("Razorpay connection didn't finish. Please try again.");
    if (p.has("razorpay")) {
      p.delete("razorpay");
      const q = p.toString();
      window.history.replaceState(null, "", window.location.pathname + (q ? `?${q}` : "") + window.location.hash);
    }
  }, []);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStatus(await fetchStatus(store.subdomain));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check Razorpay status.");
    } finally {
      setLoading(false);
    }
  }, [store.subdomain]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const go = (s: Step) => {
    setError("");
    setStep(s);
  };

  const handleConnect = async () => {
    setError("");
    const keyId = form.keyId.trim();
    if (/^rzp_(test|live)_partner_/.test(keyId))
      return setError(
        "That's a Razorpay partner credential, not your store's API key. In Razorpay open Account & Settings → API Keys → Generate Key, and use the key that starts with rzp_live_ (no \"partner\")."
      );
    if (!keyId.startsWith("rzp_")) return setError("Your Key ID starts with rzp_live_ (or rzp_test_ for testing).");
    if (!form.keySecret.trim()) return setError("Paste your Key Secret too.");
    setBusy(true);
    try {
      setStatus(await connectKeys(store.subdomain, keyId, form.keySecret.trim()));
      setUpdating(false);
      setForm({ keyId: "", keySecret: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't connect Razorpay.");
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = async () => {
    setError("");
    setBusy(true);
    try {
      window.location.href = (await startOAuth(store.subdomain)).url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open Razorpay.");
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Razorpay? Buyers won't be able to pay online through Razorpay until you reconnect.")) return;
    setBusy(true);
    setError("");
    try {
      await disconnectRazorpay(store.subdomain);
      setStatus({ connected: false });
      setStep("choose");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't disconnect.");
    } finally {
      setBusy(false);
    }
  };

  const [testing, setTesting] = React.useState(false);
  const handleTestPayment = async () => {
    setError("");
    setTesting(true);
    // open the tab now (inside the click) so pop-up blockers allow it, then point it at the store
    const tab = window.open("about:blank", "_blank");
    try {
      const { pass } = await getTestPass(store.subdomain);
      const url = new URL(getStoreUrl(store.subdomain), window.location.href);
      url.searchParams.set("rzp_test", pass);
      if (tab) tab.location.href = url.toString();
      else window.location.href = url.toString();
    } catch (e) {
      tab?.close();
      setError(e instanceof Error ? e.message : "Couldn't open your store. Please try again.");
    } finally {
      setTesting(false);
    }
  };

  const handleGuidance = async () => {
    setGuidanceError("");
    setGuidance("sending");
    try {
      await requestGuidance(store.subdomain);
      setGuidance("sent");
    } catch (e) {
      setGuidanceError(e instanceof Error ? e.message : "Couldn't send your request.");
      setGuidance("open");
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(storeAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const isLive = status?.mode === "live";
  const connected = !!status?.connected;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold">
              Online payments <span className="text-sm font-normal text-neutral-400">via Razorpay</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  !connected ? "bg-neutral-100 text-neutral-600" : isLive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                }`}
              >
                {!connected ? "Not set up" : isLive ? "On" : "Testing"}
              </span>
            </h3>
            <p className="mt-0.5 text-sm text-neutral-500">Buyers pay by card, UPI app or net banking, and the money reaches your bank automatically.</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh"
            style={{ minHeight: 0 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:border-neutral-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div key={loading && !status ? "loading" : connected && !updating ? `connected-${isLive}` : updating ? "update" : step} className="swap-enter">
        {loading && !status ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking Razorpay connection…
          </p>
        ) : connected && !updating ? (
          /* ---------- Connected ---------- */
          <>
            {isLive ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">Buyers can pay online</p>
                  <p className="mt-0.5 text-emerald-800">Money goes from Razorpay to your bank account.</p>
                </div>
              </div>
            ) : (
              /* test keys: two clear steps */
              <ol className="mt-5 space-y-3">
                <li className="flex gap-3 rounded-xl border border-neutral-200 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">1</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Try it yourself</p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      Place a pretend order on your store. Pay with UPI <span className="font-mono text-neutral-800">success@razorpay</span>. No real money moves.
                    </p>
                    <button
                      type="button"
                      onClick={handleTestPayment}
                      disabled={testing}
                      style={{ minHeight: 0 }}
                      className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                    >
                      {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      Try a test payment
                    </button>
                  </div>
                </li>
                <li className="flex gap-3 rounded-xl border border-neutral-200 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xs font-semibold text-neutral-600">2</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Go live</p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      Once Razorpay approves your account, switch it to Live mode, create live keys and add them here.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setUpdating(true);
                        setError("");
                      }}
                      style={{ minHeight: 0 }}
                      className="mt-3 inline-flex h-10 items-center rounded-lg border border-neutral-300 px-4 text-sm font-semibold hover:border-neutral-950"
                    >
                      Add live keys
                    </button>
                  </div>
                </li>
              </ol>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {status!.auth === "oauth" ? (
                <span className="text-neutral-500">Linked to your Razorpay account</span>
              ) : (
                <span className="min-w-0 truncate text-neutral-500">
                  Key <span className="font-mono text-neutral-700">{status!.keyId}</span>
                </span>
              )}
              {status!.auth !== "oauth" && isLive && (
                <button type="button" onClick={() => { setUpdating(true); setError(""); }} style={{ minHeight: 0 }} className="font-medium text-neutral-700 underline-offset-2 hover:underline">
                  Change keys
                </button>
              )}
              <button type="button" onClick={handleDisconnect} disabled={busy} style={{ minHeight: 0 }} className="font-medium text-rose-600 underline-offset-2 hover:underline disabled:opacity-60">
                Disconnect
              </button>
            </div>
          </>
        ) : step === "choose" && !updating ? (
          /* ---------- Choose a path ---------- */
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => go("keys")} style={{ minHeight: 0 }} className="group rounded-2xl border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-900">
              <KeyRound className="h-5 w-5 text-neutral-700" />
              <span className="mt-3 block text-sm font-semibold">I have a Razorpay account</span>
              <span className="mt-0.5 block text-xs text-neutral-500">Connect it in a minute.</span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-900">
                Connect <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
            <button type="button" onClick={() => go("new")} style={{ minHeight: 0 }} className="group rounded-2xl border border-neutral-950 bg-neutral-950 p-4 text-left text-white">
              <Sparkles className="h-5 w-5" />
              <span className="mt-3 block text-sm font-semibold">I&apos;m new to Razorpay</span>
              <span className="mt-0.5 block text-xs text-white/70">Create a free account. We&apos;ll show you each step.</span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                Get started <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>
        ) : step === "new" && !updating ? (
          /* ---------- New to Razorpay: guided checklist ---------- */
          <div className="mt-5">
            <BackLink onClick={() => go("choose")} />
            <ol className="mt-3 space-y-3">
              <ChecklistStep
                n={1}
                done={checklist.done.includes(1)}
                onToggle={() => checklist.toggle(1)}
                title="Create your Razorpay account"
                text="Sign up and finish KYC: PAN, bank account and business details. Razorpay usually approves in 1–2 working days."
              >
                <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 text-sm font-semibold text-white hover:bg-black">
                  Create Razorpay account <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </ChecklistStep>
              <ChecklistStep
                n={2}
                done={checklist.done.includes(2)}
                onToggle={() => checklist.toggle(2)}
                title="Add your store as your website"
                text="In Razorpay open Account & Settings → Business website details → Add website/app, and paste your store address below. Razorpay approves it in 24–48 hours."
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="max-w-full truncate rounded-lg border border-neutral-200 bg-white px-3 py-2 font-mono text-xs">{storeAddress}</span>
                  <button type="button" onClick={copyAddress} style={{ minHeight: 0 }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm hover:border-neutral-900">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
                  </button>
                  <a href={WEBSITE_SETTINGS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 text-sm text-blue-600 underline-offset-2 hover:underline">
                    Open in Razorpay <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </ChecklistStep>
              <ChecklistStep
                n={3}
                done={checklist.done.includes(3)}
                onToggle={() => checklist.toggle(3)}
                title="Generate your API keys"
                text="When your website shows Approved, click Generate Key on the same page (with Test Mode switched off). Copy the Key ID and the Key Secret; the secret is shown only once."
              >
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => { checklist.done.includes(3) || checklist.toggle(3); go("keys"); }} style={{ minHeight: 0 }} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 text-sm font-semibold text-white hover:bg-black">
                    I have my keys <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <a href={API_KEYS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 text-sm text-blue-600 underline-offset-2 hover:underline">
                    Open in Razorpay <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </ChecklistStep>
            </ol>
            <p className="mt-3 text-xs text-neutral-500">Your progress is saved on this device, so you can come back once Razorpay approves you.</p>
          </div>
        ) : (
          /* ---------- Paste keys (new connection or update) ---------- */
          <div className="mt-5">
            {updating ? <BackLink onClick={() => { setUpdating(false); setForm({ keyId: "", keySecret: "" }); setError(""); }} label="Cancel" /> : <BackLink onClick={() => go("choose")} />}

            {oauthAvailable && !updating && (
              <div className="mt-3 rounded-xl border border-neutral-200 p-4">
                <p className="text-sm font-semibold">Fastest: sign in to Razorpay</p>
                <p className="mt-0.5 text-sm text-neutral-500">Approve Shopersite in your Razorpay account. No keys to copy.</p>
                <button type="button" onClick={handleOAuth} disabled={busy} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Connect with Razorpay
                </button>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Or paste your API keys</p>
              </div>
            )}

            <p className="mt-3 text-sm text-neutral-600">
              Get them in Razorpay:{" "}
              <a href={API_KEYS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-neutral-950 underline underline-offset-2">
                Account & Settings <ExternalLink className="h-3 w-3" />
              </a>{" "}
              → Generate Key. Copy both values and paste them here.
            </p>
            <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              Keys starting <span className="font-mono">rzp_live_</span> take real payments. <span className="font-mono">rzp_test_</span> keys are only for trying it yourself.
            </p>
            <div className="mt-3 space-y-3">
              <Field label="Key ID" value={form.keyId} onChange={(v) => setForm((f) => ({ ...f, keyId: v }))} placeholder="rzp_live_…" />
              <label className="block">
                <span className="block text-sm font-medium">Key Secret</span>
                <div className="relative mt-1.5">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={form.keySecret}
                    onChange={(e) => setForm((f) => ({ ...f, keySecret: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 pr-10 text-sm outline-none transition-colors focus:border-neutral-900"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    style={{ minHeight: 0 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    aria-label={showSecret ? "Hide secret" : "Show secret"}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={handleConnect} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {updating ? "Save new keys" : "Connect Razorpay"}
              </button>
            </div>
          </div>
        )}
        </div>

        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 reveal-in">{error}</p>}

        {/* ---------- Help ---------- */}
        {!connected && !loading && (
          <div className="mt-5 border-t border-neutral-100 pt-4">
            {guidance === "closed" ? (
              <button type="button" onClick={() => setGuidance("open")} style={{ minHeight: 0 }} className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline">
                Don&apos;t know how to connect?
              </button>
            ) : guidance === "sent" ? (
              <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4 swap-enter">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Request submitted!</p>
                  <p className="mt-0.5 text-sm text-neutral-600">We&apos;ll get back to you within 2–3 hours to help you set up Razorpay.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-neutral-50 p-4 reveal-in">
                <p className="text-sm font-semibold text-neutral-900">Need help setting up Razorpay?</p>
                <p className="mt-1 text-sm text-neutral-600">Our team will call or email you and walk you through it.</p>
                {guidanceError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{guidanceError}</p>}
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={handleGuidance} disabled={guidance === "sending"} style={{ minHeight: 0 }} className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
                    {guidance === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Request guidance
                  </button>
                  <button type="button" onClick={() => setGuidance("closed")} style={{ minHeight: 0 }} className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-sm text-neutral-700 hover:border-neutral-900">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} style={{ minHeight: 0 }} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
      <ArrowLeft className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function ChecklistStep({
  n,
  done,
  onToggle,
  title,
  text,
  children,
}: {
  n: number;
  done: boolean;
  onToggle: () => void;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <li className={`rounded-xl border p-4 ${done ? "border-emerald-200 bg-emerald-50/50" : "border-neutral-200"}`}>
      <div className="flex gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? `Step ${n} done` : `Mark step ${n} done`}
          onClick={onToggle}
          style={{ minHeight: 0 }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            done ? "bg-emerald-600 text-white" : "border border-neutral-300 text-neutral-600 hover:border-neutral-900"
          }`}
        >
          {done ? <Check className="h-4 w-4" /> : n}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${done ? "text-emerald-900" : ""}`}>{title}</p>
          <p className="mt-0.5 text-sm text-neutral-600">{text}</p>
          {!done && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </li>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition-colors focus:border-neutral-900"
      />
    </label>
  );
}
