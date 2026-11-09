"use client";

import * as React from "react";
import { Check, ChevronRight, Loader2, Lock, Package, RotateCcw, Send } from "lucide-react";
import { IChat, IMail, ITruck } from "@/components/icons";
import { auth } from "@/lib/firebase";
import type { StoreData } from "@/lib/store-service";
import { effectivePlan } from "@/lib/subscription";
import { canUseEmail, planHas } from "@/lib/plans";
import { appConfirm } from "@/components/ui/app-dialog";
import { BUYER_UPDATES, DEFAULT_TEMPLATES, TEMPLATE_MAX, TEMPLATE_TAGS, fillTemplate, templateFor, type BuyerUpdate } from "@/lib/whatsapp-messages";
import { storeService } from "@/lib/store-service";
import type { OrderData } from "@/lib/store-service";

/**
 * Plugins: extra tools a store can switch on. Gmail (emails to buyers), WhatsApp (alerts and buyer
 * updates) and Shiprocket (shipping). More will be added here over time.
 */

export type PluginId = "gmail" | "whatsapp" | "shiprocket";

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

const PLUGINS: { id: PluginId; name: string; text: string; icon: React.ElementType; tone: string; plan: "free" | "starter" | "pro" }[] = [
  { id: "shiprocket", name: "Shiprocket", text: "Ship orders with 25+ couriers. Labels, pickup and live tracking.", icon: ITruck, tone: "bg-neutral-100 text-neutral-900", plan: "starter" },
  { id: "whatsapp", name: "WhatsApp", text: "One-tap order updates to buyers: confirmed, shipped with tracking, delivered.", icon: IChat, tone: "bg-neutral-100 text-neutral-900", plan: "free" },
  { id: "gmail", name: "Gmail", text: "Email buyers about their orders and new products, from your Gmail.", icon: IMail, tone: "bg-neutral-100 text-neutral-900", plan: "pro" },
];

const PLAN_NAME = { free: "Free", starter: "Growth", pro: "Pro" } as const;

export function PluginsHub({
  store,
  view,
  onOpen,
  onUpgrade,
  onChanged,
  gmail,
}: {
  store: StoreData;
  view: PluginId | null;
  onOpen: (id: PluginId | null) => void;
  onUpgrade: () => void;
  onChanged: () => void;
  gmail: React.ReactNode;
}) {
  const plan = effectivePlan(store).planId;
  const allowed = (p: "free" | "starter" | "pro") => (p === "free" ? true : p === "pro" ? plan === "pro" : plan !== "free");
  const isOn = (id: PluginId) =>
    id === "gmail" ? !!store.pluginsConfig?.gmailIntegration?.isConnected : id === "whatsapp" ? true : false;

  if (view) {
    const p = PLUGINS.find((x) => x.id === view)!;
    return (
      <div key={view} className="swap-enter space-y-5">
        <div className="flex items-center gap-3">
          <p.icon className="h-6 w-6 text-neutral-900" />
          <div>
            <h2 className="text-base font-semibold tracking-tight">{p.name}</h2>
            <p className="text-sm text-neutral-500">{p.text}</p>
          </div>
        </div>
        {!(p.id === "shiprocket" ? planHas(store.planId, "shipping") : allowed(p.plan)) && p.id !== "gmail" ? (
          <UpgradeCard plan={PLAN_NAME[p.plan]} onUpgrade={onUpgrade} />
        ) : p.id === "gmail" ? (
          gmail
        ) : p.id === "whatsapp" ? (
          <WhatsAppPlugin store={store} onChanged={onChanged} />
        ) : (
          <ShiprocketPlugin store={store} />
        )}
      </div>
    );
  }

  return (
    <div className="swap-enter space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLUGINS.map((p) => {
          const ok = p.id === "gmail" ? canUseEmail(store.planId) : p.id === "shiprocket" ? planHas(store.planId, "shipping") : allowed(p.plan);
          return (
            <button
              key={p.id}
              data-tour={`plugin-${p.id}`}
              type="button"
              onClick={() => onOpen(p.id)}
              style={{ minHeight: 0 }}
              className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-950 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.3)]"
            >
              <span className="flex items-start justify-between gap-3">
                <p.icon className="h-6 w-6 text-neutral-900" />
                {isOn(p.id) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <Check className="h-3 w-3" /> On
                  </span>
                ) : !ok ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                    <Lock className="h-3 w-3" /> {PLAN_NAME[p.plan]}
                  </span>
                ) : null}
              </span>
              <span className="mt-4 text-base font-semibold">{p.name}</span>
              <span className="mt-1 text-sm text-neutral-500">{p.text}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                {isOn(p.id) ? "Manage" : "Set up"} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
      <PluginRequest store={store} />
    </div>
  );
}

function UpgradeCard({ plan, onUpgrade }: { plan: string; onUpgrade: () => void }) {
  return (
    <div className="rounded-2xl bg-neutral-950 p-6 text-white">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
        <Lock className="h-3.5 w-3.5" /> {plan} plan
      </span>
      <p className="mt-3 text-sm text-white/70">This plugin is part of the {plan} plan.</p>
      <button type="button" onClick={onUpgrade} style={{ minHeight: 0 }} className="mt-4 h-11 rounded-xl bg-white px-5 text-sm font-semibold text-neutral-950 hover:bg-neutral-100">
        See plans
      </button>
    </div>
  );
}

/* ------------------------------ WhatsApp ------------------------------ */

function WhatsAppPlugin({ store, onChanged }: { store: StoreData; onChanged: () => void }) {
  // a sample order, so the seller sees exactly what buyers receive
  const sample = {
    number: "#1004",
    customer: { name: "Asha Rao", phone: "9876543210" },
    items: [{ productId: "x", title: "Linen shirt", price: 89900, quantity: 1, image: "" }],
    total: 94900,
    courierName: "Delhivery",
    trackingNumber: "1234567890",
    trackingUrl: "https://shiprocket.co/tracking/1234567890",
  } as unknown as OrderData;
  const link = `https://${store.subdomain}.shopersite.in/order/…`;
  const [editing, setEditing] = React.useState<BuyerUpdate | null>(null);
  const [draft, setDraft] = React.useState("");
  const [savedId, setSavedId] = React.useState<BuyerUpdate | null>(null);
  const boxRef = React.useRef<HTMLTextAreaElement>(null);

  const open = (id: BuyerUpdate) => {
    setEditing(id);
    setDraft(templateFor(store, id));
  };
  const save = (id: BuyerUpdate, text: string) => {
    const next = { ...(store.whatsappTemplates || {}) };
    if (!text.trim() || text.trim() === DEFAULT_TEMPLATES[id]) delete next[id];
    else next[id] = text.slice(0, TEMPLATE_MAX);
    storeService.updateStore(store.subdomain, { whatsappTemplates: next });
    onChanged();
    setEditing(null);
    setSavedId(id);
    window.setTimeout(() => setSavedId(null), 1800);
  };
  const insert = (tag: string) => {
    const el = boxRef.current;
    if (!el) return setDraft((d) => (d + tag).slice(0, TEMPLATE_MAX));
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setDraft((draft.slice(0, start) + tag + draft.slice(end)).slice(0, TEMPLATE_MAX));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:p-5">
        <b>Free on every plan.</b> Open any order and tap <b>WhatsApp the buyer</b>. WhatsApp opens with the message written for you, from your own number. Nothing is sent until you press send.
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold">Your messages</h3>
        <p className="mt-0.5 text-sm text-neutral-500">Edit the wording. Words in {"{brackets}"} fill in from each order.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {BUYER_UPDATES.map((u) => {
            const custom = !!store.whatsappTemplates?.[u.id]?.trim();
            const isEditing = editing === u.id;
            return (
              <div key={u.id} className={`rounded-xl p-4 ${isEditing ? "bg-white ring-2 ring-neutral-950" : "bg-neutral-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {u.label}
                    {custom && !isEditing && <span className="ml-2 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">Edited</span>}
                    {savedId === u.id && <span className="reveal-in ml-2 text-[12px] font-medium text-emerald-700">Saved</span>}
                  </p>
                  {!isEditing && (
                    <button type="button" onClick={() => open(u.id)} style={{ minHeight: 0 }} className="rounded-lg px-2 py-1 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-200">
                      Edit
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="mt-2">
                    <textarea
                      ref={boxRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value.slice(0, TEMPLATE_MAX))}
                      rows={6}
                      className="w-full resize-y rounded-lg border border-neutral-200 p-3 text-[13px] leading-relaxed outline-none focus:border-neutral-900"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {TEMPLATE_TAGS.map((t) => (
                        <button key={t.tag} type="button" title={t.label} onClick={() => insert(t.tag)} style={{ minHeight: 0 }} className="rounded-full border border-neutral-200 px-2 py-0.5 font-mono text-[11px] text-neutral-700 hover:border-neutral-900">
                          {t.tag}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400">Preview</p>
                    <p className="mt-1 whitespace-pre-line rounded-lg bg-[#DCF8C6] p-3 text-[13px] leading-relaxed text-neutral-800">{fillTemplate(draft || DEFAULT_TEMPLATES[u.id], store, sample, link)}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <button type="button" onClick={() => setDraft(DEFAULT_TEMPLATES[u.id])} style={{ minHeight: 0 }} className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-neutral-950">
                        <RotateCcw className="h-3.5 w-3.5" /> Use default
                      </button>
                      <span className="flex gap-2">
                        <button type="button" onClick={() => setEditing(null)} style={{ minHeight: 0 }} className="h-9 rounded-lg px-3 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100">
                          Cancel
                        </button>
                        <button type="button" onClick={() => save(u.id, draft)} style={{ minHeight: 0 }} className="h-9 rounded-lg bg-neutral-950 px-4 text-[13px] font-semibold text-white hover:bg-black">
                          Save
                        </button>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-[#DCF8C6] p-3 text-[13px] leading-relaxed text-neutral-800">{fillTemplate(templateFor(store, u.id), store, sample, link)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Request a plugin ------------------------------ */

function PluginRequest({ store }: { store: StoreData }) {
  const [name, setName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/plugin-requests", { method: "POST", body: JSON.stringify({ store: store.subdomain, name, note }) });
      setDone(true);
      setName("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="rounded-2xl border border-dashed border-neutral-300 bg-white p-5 sm:p-6">
      <p className="text-base font-semibold">Need another plugin?</p>
      <p className="mt-0.5 text-sm text-neutral-500">Tell us which app you use. We read every request.</p>
      {done ? (
        <div className="reveal-in mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Request sent. Thanks!
          </span>
          <button type="button" onClick={() => setDone(false)} style={{ minHeight: 0 }} className="text-[13px] font-semibold hover:underline">
            Request another
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Plugin or app name, e.g. Instagram Shop"
              className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 px-3.5 text-sm outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              disabled={busy || name.trim().length < 2}
              style={{ minHeight: 0 }}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send request
            </button>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={2}
            placeholder="What should it do? (optional)"
            className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900"
          />
          {error && <p className="reveal-in mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </>
      )}
    </form>
  );
}

/* ------------------------------ Shiprocket ------------------------------ */

interface SrStatus {
  connected: boolean;
  allowed: boolean;
  email?: string;
  pickupLocation?: string;
  pickups?: { name: string; address: string }[];
  defaults?: { weight: number; length: number; breadth: number; height: number };
  webhook?: { url: string; token: string };
}

function ShiprocketPlugin({ store }: { store: StoreData }) {
  const [status, setStatus] = React.useState<SrStatus | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [prefs, setPrefs] = React.useState({ pickupLocation: "", weight: "0.5", length: "20", breadth: "15", height: "5" });
  const [saved, setSaved] = React.useState(false);
  const q = `?store=${encodeURIComponent(store.subdomain)}`;

  const apply = (s: SrStatus) => {
    setStatus(s);
    if (s.connected && s.defaults)
      setPrefs({ pickupLocation: s.pickupLocation || "", weight: String(s.defaults.weight), length: String(s.defaults.length), breadth: String(s.defaults.breadth), height: String(s.defaults.height) });
  };

  React.useEffect(() => {
    api<SrStatus>(`/api/shiprocket${q}`).then(apply).catch((e) => setError(e.message));
  }, [q]);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      apply(await api<SrStatus>("/api/shiprocket", { method: "POST", body: JSON.stringify({ store: store.subdomain, ...form }) }));
      setForm({ email: "", password: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect.");
    } finally {
      setBusy(false);
    }
  };

  const savePrefs = async () => {
    setError("");
    setBusy(true);
    try {
      apply(
        await api<SrStatus>("/api/shiprocket", {
          method: "PATCH",
          body: JSON.stringify({
            store: store.subdomain,
            pickupLocation: prefs.pickupLocation,
            defaults: { weight: Number(prefs.weight), length: Number(prefs.length), breadth: Number(prefs.breadth), height: Number(prefs.height) },
          }),
        })
      );
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!(await appConfirm("Orders already sent to Shiprocket stay there. You can connect again any time.", { title: "Disconnect Shiprocket?", okLabel: "Disconnect", danger: true }))) return;
    await api(`/api/shiprocket${q}`, { method: "DELETE" }).catch(() => null);
    setStatus({ connected: false, allowed: true });
  };

  if (!status) return error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;

  const field = "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-neutral-900";

  if (!status.connected)
    return (
      <form onSubmit={connect} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <div>
          <h3 className="text-base font-semibold">Connect your Shiprocket account</h3>
          <p className="mt-0.5 text-sm text-neutral-500">Three quick steps. You only do this once.</p>
          <ol className="mt-4 space-y-3">
            <li className="flex gap-3 rounded-xl border border-neutral-200 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">1</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Get the Shiprocket app</p>
                <p className="mt-0.5 text-sm text-neutral-500">Install it on your phone, or use the website on a computer.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href="https://play.google.com/store/search?q=shiprocket&c=apps" target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 text-sm font-semibold text-white hover:bg-black">
                    Get it on Play Store
                  </a>
                  <a href="https://app.shiprocket.in/register" target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 text-sm font-semibold hover:border-neutral-900">
                    Open Shiprocket website
                  </a>
                </div>
              </div>
            </li>
            <li className="flex gap-3 rounded-xl border border-neutral-200 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">2</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Sign up with your account</p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Create your free Shiprocket account with your phone or email, finish the short KYC, and add your <b>pickup address</b> (where couriers collect your parcels).
                </p>
              </div>
            </li>
            <li className="flex gap-3 rounded-xl border border-neutral-200 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">3</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Create your API keys and connect</p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  On the Shiprocket website go to <b>Settings → Additional Settings → API Users → Add New API User</b>. Use a different email from your login
                  (tip: yourname+api@gmail.com), select all the modules, leave &ldquo;Allowed IPs&rdquo; empty, and click Create User. Shiprocket emails you the password;
                  enter that email and password here.
                </p>
              </div>
            </li>
          </ol>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="API user email" autoComplete="off" className={field} />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="API user password" autoComplete="new-password" className={field} />
        </div>
        {error && <p className="reveal-in rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={busy || !form.email || !form.password} style={{ minHeight: 0 }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Connect Shiprocket
          </button>
        </div>
        <p className="text-xs text-neutral-500">You pay Shiprocket for each shipment.</p>
      </form>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
        <Check className="h-5 w-5 text-emerald-600" />
        <span className="min-w-0 flex-1 text-sm">
          <span className="block font-semibold text-emerald-900">Connected</span>
          <span className="block truncate text-emerald-800">{status.email}</span>
        </span>
        <button type="button" onClick={disconnect} style={{ minHeight: 0 }} className="text-sm font-medium text-rose-600 hover:underline">
          Disconnect
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold">Shipping defaults</h3>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Pickup address</span>
          {status.pickups && status.pickups.length ? (
            <select value={prefs.pickupLocation} onChange={(e) => setPrefs({ ...prefs, pickupLocation: e.target.value })} className={field}>
              {status.pickups.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}: {p.address}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Add a pickup address in Shiprocket (Settings → Pickup Addresses), then come back here.</p>
          )}
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Usual package (you can change it per order)</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["weight", "Weight (kg)"],
                ["length", "Length (cm)"],
                ["breadth", "Width (cm)"],
                ["height", "Height (cm)"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="block text-xs text-neutral-500">
                {label}
                <input inputMode="decimal" value={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.value.replace(/[^\d.]/g, "") })} className={`${field} mt-1`} />
              </label>
            ))}
          </div>
        </div>
        {error && <p className="reveal-in rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="reveal-in text-sm font-medium text-emerald-700">Saved</span>}
          <button type="button" onClick={savePrefs} disabled={busy} style={{ minHeight: 0 }} className="h-11 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
            Save
          </button>
        </div>
      </div>

      {status.webhook && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold">Automatic tracking updates</h3>
          <p className="mt-0.5 text-sm text-neutral-500">
         In Shiprocket open Settings → API → Webhooks, paste these two values and switch it on.</p>
          <CopyRow label="Webhook URL" value={status.webhook.url} />
          <CopyRow label="Security token" value={status.webhook.token} />
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600 sm:p-5">
        <Package className="mt-0.5 h-4 w-4 shrink-0" />
        <span>To ship, open any order in Orders and tap <b>Ship with Shiprocket</b>: choose a courier, and the label and pickup are done for you.</span>
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="mt-3">
      <span className="block text-xs font-medium text-neutral-500">{label}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
        style={{ minHeight: 0 }}
        className="mt-1 flex w-full items-center gap-2 rounded-xl border border-neutral-200 px-3.5 py-2.5 text-left font-mono text-xs hover:border-neutral-900"
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <span className="shrink-0 font-sans text-xs font-semibold">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
