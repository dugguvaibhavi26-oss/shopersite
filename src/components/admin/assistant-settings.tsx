"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { BUDGET_LIMITS, type AssistantSettings as Settings } from "@/lib/assistant/budget";

/** Admin → AI assistant: daily budget per plan (sliders), the platform safety cap, and today's usage. */

interface Day {
  day: string;
  tokens: number;
  requests: number;
  by: Record<string, number>;
}

async function call<T>(init?: RequestInit): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch("/api/admin/assistant", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

const k = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
// about 4,000 tokens for a typical AI message with shop data
const roughMessages = (tokens: number) => Math.max(1, Math.round(tokens / 4000));

export function AssistantSettings() {
  const [data, setData] = React.useState<{ settings: Settings; history: Day[]; canEdit: boolean; providers: Record<string, boolean> } | null>(null);
  const [form, setForm] = React.useState<Settings | null>(null);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    call<{ settings: Settings; history: Day[]; canEdit: boolean; providers: Record<string, boolean> }>()
      .then((d) => {
        setData(d);
        setForm(d.settings);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!data || !form)
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );

  const today = data.history[data.history.length - 1] || { tokens: 0, requests: 0, by: {} };
  const max = Math.max(1, ...data.history.map((d) => d.tokens));
  const dirty = JSON.stringify(form) !== JSON.stringify(data.settings);
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const r = await call<{ settings: Settings }>({ method: "POST", body: JSON.stringify(form) });
      setData({ ...data, settings: r.settings });
      setForm(r.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const share = (n: number, cap: number) => Math.min(100, Math.round((n / Math.max(1, cap)) * 100));

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">AI assistant</h2>
        <p className="text-sm text-neutral-500">Daily AI allowance per seller (shown to them as a usage bar), and the safety cap that keeps the platform inside the free tiers.</p>
      </div>

      {/* today */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Today</p>
          <p className="text-xs text-neutral-500">
            Gemini {data.providers.gemini ? "connected" : "missing"} · Groq {data.providers.groq ? "connected" : "missing"}
          </p>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {[
            { label: "Tokens", used: today.tokens, cap: form.platformTokens },
            { label: "AI requests", used: today.requests, cap: form.platformRequests },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>{r.label}</span>
                <span className="tabular-nums">
                  {k(r.used)} / {k(r.cap)}
                </span>
              </div>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-neutral-100">
                <span className={`block h-full rounded-full ${share(r.used, r.cap) >= 90 ? "bg-rose-500" : share(r.used, r.cap) >= 70 ? "bg-amber-500" : "bg-neutral-900"}`} style={{ width: `${share(r.used, r.cap)}%` }} />
              </span>
            </div>
          ))}
        </div>
        {Object.keys(today.by).length > 0 && (
          <p className="mt-3 text-xs text-neutral-500">
            By provider: {Object.entries(today.by).map(([p, n]) => `${p} ${n}`).join(" · ")}
          </p>
        )}
        {/* last 14 days */}
        <div className="mt-4 flex h-16 items-end gap-1">
          {data.history.map((d) => (
            <span key={d.day} title={`${d.day}: ${k(d.tokens)} tokens, ${d.requests} requests`} className="flex-1 rounded-t bg-neutral-900/80" style={{ height: `${Math.max(3, (d.tokens / max) * 100)}%` }} />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">Last 14 days</p>
      </div>

      {/* budgets */}
      <fieldset disabled={!data.canEdit} className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 disabled:opacity-70">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold">AI answers on</span>
            <span className="block text-xs text-neutral-500">Off: sellers keep the free simple commands only.</span>
          </span>
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-5 w-5 accent-neutral-900" />
        </label>

        {(
          [
            ["free", "Free plan"],
            ["starter", "Growth plan"],
            ["pro", "Pro plan"],
          ] as const
        ).map(([id, label]) => (
          <div key={id}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs tabular-nums text-neutral-500">
                {k(form.budgets[id])} tokens a day · about {roughMessages(form.budgets[id])} AI messages
              </span>
            </div>
            <input
              type="range"
              min={BUDGET_LIMITS.min}
              max={600_000}
              step={5_000}
              value={Math.min(600_000, form.budgets[id])}
              onChange={(e) => setForm({ ...form, budgets: { ...form.budgets, [id]: Number(e.target.value) } })}
              className="mt-2 w-full accent-neutral-900"
            />
          </div>
        ))}

        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold">Stretch on quiet days</span>
            <span className="block text-xs text-neutral-500">Under 30% of the cap used: budgets ×2. Under 60%: ×1.5.</span>
          </span>
          <input type="checkbox" checked={form.stretch} onChange={(e) => setForm({ ...form, stretch: e.target.checked })} className="h-5 w-5 accent-neutral-900" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Platform tokens a day</span>
            <input
              type="number"
              min={10000}
              step={100000}
              value={form.platformTokens}
              onChange={(e) => setForm({ ...form, platformTokens: Number(e.target.value) || 0 })}
              className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Platform AI requests a day</span>
            <input
              type="number"
              min={10}
              step={100}
              value={form.platformRequests}
              onChange={(e) => setForm({ ...form, platformRequests: Number(e.target.value) || 0 })}
              className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900"
            />
          </label>
        </div>
        <p className="text-xs text-neutral-500">Keep these a little under Gemini&apos;s and Groq&apos;s free daily limits together. When the cap is reached, sellers see &ldquo;AI is busy&rdquo; and simple commands keep working. No card is on either account, so nothing can be charged.</p>

        {data.canEdit && (
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            style={{ minHeight: 0 }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved" : "Save"}
          </button>
        )}
        {!data.canEdit && <p className="text-xs text-neutral-500">Only owner admins can change these.</p>}
      </fieldset>
    </div>
  );
}
