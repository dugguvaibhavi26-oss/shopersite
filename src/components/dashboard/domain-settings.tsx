"use client";

import * as React from "react";
import { planHas } from "@/lib/plans";
import { CheckCircle2, Clock, Copy, Check, ExternalLink, Globe, Loader2, Lock, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";
import { appConfirm } from "@/components/ui/app-dialog";
import { getStoreDomain } from "@/lib/config/site";
import { effectivePlan } from "@/lib/subscription";
import type { StoreData } from "@/lib/store-service";

/** Settings → Domain (Pro): connect www.yourbrand.com and follow the DNS steps until it's live. */

interface Status {
  domain: string | null;
  live: boolean;
  configured: boolean;
  available: boolean;
  dns: { type: string; name: string; value: string } | null;
  verification: { type: string; domain: string; value: string }[];
}

async function call<T>(init: RequestInit & { query?: string } = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch(`/api/domains${init.query || ""}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    cache: "no-store",
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

export function DomainSettings({ store, onUpgrade }: { store: StoreData; onUpgrade: () => void }) {
  const isPro = planHas(effectivePlan(store).planId, "customDomain");
  const [status, setStatus] = React.useState<Status | null>(null);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState("");

  const refresh = React.useCallback(async () => {
    setChecking(true);
    try {
      setStatus(await call<Status>({ query: `?store=${encodeURIComponent(store.subdomain)}` }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check your domain.");
    } finally {
      setChecking(false);
    }
  }, [store.subdomain]);

  React.useEffect(() => {
    if (isPro || store.customDomain) refresh();
  }, [isPro, store.customDomain, refresh]);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      setStatus(await call<Status>({ method: "POST", body: JSON.stringify({ store: store.subdomain, domain: input }) }));
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect the domain.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await appConfirm(`Your store will stop opening on ${status?.domain}. It always stays on ${getStoreDomain(store.subdomain)}.`, { title: "Disconnect this domain?", okLabel: "Disconnect", danger: true })))
      return;
    setBusy(true);
    try {
      await call({ method: "DELETE", query: `?store=${encodeURIComponent(store.subdomain)}` });
      setStatus((s) => (s ? { ...s, domain: null, live: false, dns: null, verification: [] } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't disconnect.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopied(v);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  const current = (
    <div className="flex items-center gap-3 rounded-[24px] bg-white ring-1 ring-black/[0.04] p-4 sm:p-5">
      <Globe className="h-5 w-5 shrink-0 text-neutral-900" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{getStoreDomain(store.subdomain)}</span>
        <span className="block text-sm text-neutral-500">Your free ShoperSite address. It always keeps working.</span>
      </span>
    </div>
  );

  if (!isPro && !store.customDomain) {
    return (
      <div className="space-y-4">
        {current}
        <div className="rounded-2xl bg-neutral-950 p-6 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
            <Lock className="h-3.5 w-3.5" /> Pro plan
          </span>
          <h3 className="mt-3 text-lg font-semibold">Use your own domain</h3>
          <p className="mt-1 text-sm text-white/65">
            Open your store on an address like www.yourbrand.com.
          </p>
          <button type="button" onClick={onUpgrade} style={{ minHeight: 0 }} className="mt-5 h-11 rounded-xl bg-white px-5 text-sm font-semibold text-neutral-950 hover:bg-neutral-100">
            See the Pro plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {current}

      {error && <p className="reveal-in rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {!status ? (
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking…
        </p>
      ) : !status.domain ? (
        <form onSubmit={connect} className="rounded-[24px] bg-white ring-1 ring-black/[0.04] p-5 sm:p-6">
          <h3 className="text-base font-semibold">Connect a domain you own</h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            Bought one from GoDaddy, Hostinger, Namecheap or similar?
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="www.yourbrand.com"
              autoCapitalize="none"
              spellCheck={false}
              className="h-11 flex-1 rounded-xl border border-neutral-200 px-3.5 text-sm outline-none focus:border-neutral-900"
            />
            <button type="submit" disabled={busy || !input.trim()} style={{ minHeight: 0 }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Connect
            </button>
          </div>
          {!status.available && <p className="mt-3 text-xs text-amber-700">Custom domains are being switched on.</p>}
        </form>
      ) : (
        <div className="rounded-[24px] bg-white ring-1 ring-black/[0.04]">
          <div className="flex flex-wrap items-center gap-3 p-5 sm:p-6">
            {status.live ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Clock className="h-5 w-5 text-amber-600" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{status.domain}</p>
              <p className={`text-sm ${status.live ? "text-emerald-700" : "text-amber-700"}`}>
                {status.live ? "Connected. Your store opens on this domain." : "Waiting for your DNS change. This can take from a few minutes up to 24 hours."}
              </p>
            </div>
            <button type="button" onClick={refresh} disabled={checking} style={{ minHeight: 0 }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm hover:border-neutral-900 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} /> Check again
            </button>
            {status.live && (
              <a href={`https://${status.domain}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-950 px-3 text-sm font-semibold text-white">
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {!status.live && status.dns && (
            <div className="border-t border-neutral-100 p-5 sm:p-6">
              <p className="text-sm font-semibold">Add this record where you bought your domain</p>
              <p className="mt-0.5 text-sm text-neutral-500">Open your domain&apos;s DNS settings (often called &ldquo;Manage DNS&rdquo;), add the record below and save.</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
                <div className="grid grid-cols-[80px_1fr_1.6fr] bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-500">
                  <span>Type</span>
                  <span>Name</span>
                  <span>Value</span>
                </div>
                {[status.dns, ...status.verification.map((v) => ({ type: v.type, name: v.domain, value: v.value }))].map((r) => (
                  <div key={r.type + r.name} className="grid grid-cols-[80px_1fr_1.6fr] items-center gap-2 border-t border-neutral-100 px-4 py-3 text-sm">
                    <span className="font-mono">{r.type}</span>
                    <span className="truncate font-mono">{r.name}</span>
                    <button type="button" onClick={() => copy(r.value)} style={{ minHeight: 0 }} className="flex min-w-0 items-center gap-2 text-left font-mono hover:text-neutral-950">
                      <span className="truncate">{r.value}</span>
                      {copied === r.value ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-neutral-400" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-neutral-100 p-4 sm:px-6">
            <button type="button" onClick={remove} disabled={busy} style={{ minHeight: 0 }} className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50">
              Disconnect domain
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
