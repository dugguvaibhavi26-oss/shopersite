"use client";

import * as React from "react";
import { ArrowRight, Check, ClipboardCheck, Copy, Crown, Headphones, IndianRupee, KeyRound, Loader2, Lock, MailCheck, MessagesSquare, Package, Plus, Send, ShieldCheck, Trash2, Truck, Users } from "lucide-react";
import { auth } from "@/lib/firebase";
import { appConfirm } from "@/components/ui/app-dialog";
import { effectivePlan } from "@/lib/subscription";
import type { StoreData } from "@/lib/store-service";
import { MAX_STAFF, passwordProblem, STAFF_ROLES, STAFF_ROLE_IDS, type StaffRole } from "@/lib/staff/roles";

/** Dashboard → Staff (Pro): the store's 5-digit ID, the team's accounts and roles, and the WorkPlace chat. */

interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export async function ownerHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(await ownerHeaders()) }, cache: "no-store" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

/** Gives the store its 5-digit ID the first time the owner opens the dashboard (older stores have none yet). */
export function useEnsureStoreCode(store: StoreData | null | undefined) {
  const sub = store?.subdomain;
  const has = !!store?.storeCode;
  React.useEffect(() => {
    if (!sub || has) return;
    const stop = auth.onAuthStateChanged((user) => {
      if (!user) return;
      call("/api/store/code", { method: "POST", body: JSON.stringify({ store: sub }) }).catch(() => {});
    });
    return stop;
  }, [sub, has]);
}

const field = "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-neutral-900";
const btnDark = "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50";
const btnSmall = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm hover:border-neutral-900 disabled:opacity-50";

/** how each role looks: its icon, its colour, and the few things it can see */
const ROLE_LOOK: Record<StaffRole, { icon: React.ComponentType<{ className?: string }>; tile: string; chip: string; bar: string; sees: string[] }> = {
  order_manager: { icon: ClipboardCheck, tile: "bg-amber-100 text-amber-700", chip: "bg-amber-50 text-amber-800", bar: "bg-amber-400", sees: ["New orders", "Live stock", "Accept or reject"] },
  product_manager: { icon: Package, tile: "bg-violet-100 text-violet-700", chip: "bg-violet-50 text-violet-800", bar: "bg-violet-400", sees: ["Products", "Prices", "Photos", "Stock"] },
  fulfilment: { icon: Truck, tile: "bg-sky-100 text-sky-700", chip: "bg-sky-50 text-sky-800", bar: "bg-sky-400", sees: ["Accepted orders", "Addresses", "Tracking"] },
  support: { icon: Headphones, tile: "bg-emerald-100 text-emerald-700", chip: "bg-emerald-50 text-emerald-800", bar: "bg-emerald-400", sees: ["Orders", "Customers", "View only"] },
  finance: { icon: IndianRupee, tile: "bg-rose-100 text-rose-700", chip: "bg-rose-50 text-rose-800", bar: "bg-rose-400", sees: ["Payments", "Refunds", "CSV download"] },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** a small ring that fills as staff seats are used */
function SeatRing({ used, total }: { used: number; total: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90" aria-hidden="true">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, used / total))} style={{ transition: "stroke-dashoffset 500ms ease" }} />
    </svg>
  );
}

function CopyButton({ text, label, dark }: { text: string; label: string; dark?: boolean }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      style={{ minHeight: 0 }}
      className={dark ? "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-white/10 px-3 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/20" : btnSmall}
    >
      {copied ? <Check className={`h-3.5 w-3.5 ${dark ? "text-emerald-300" : "text-emerald-600"}`} /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : label}
    </button>
  );
}

export function StaffAccounts({ store, onUpgrade, onOpenWorkplace }: { store: StoreData; onUpgrade: () => void; onOpenWorkplace?: () => void }) {
  const isPro = effectivePlan(store).planId === "pro";
  const [storeCode, setStoreCode] = React.useState(store.storeCode || "");
  const [staff, setStaff] = React.useState<Staff[] | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", password: "", role: "order_manager" as StaffRole });
  /** shown once, right after an account is made or a password is reset, so the owner can pass it on */
  const [handover, setHandover] = React.useState<{ name: string; email: string; password: string; emailed?: boolean } | null>(null);
  const [resetFor, setResetFor] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const q = `store=${encodeURIComponent(store.subdomain)}`;
  const loginUrl = typeof window === "undefined" ? "/staff/login" : `${window.location.origin}/staff/login`;

  const refresh = React.useCallback(async () => {
    try {
      const d = await call<{ storeCode: string; staff: Staff[] }>(`/api/staff/accounts?${q}`);
      setStoreCode(d.storeCode);
      setStaff(d.staff);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your staff.");
      setStaff((s) => s || []);
    }
  }, [q]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(form.password);
    if (problem) return setError(problem);
    setBusy("add");
    setError("");
    try {
      const d = await call<{ staff: Staff; emailed: boolean; storeCode: string }>("/api/staff/accounts", { method: "POST", body: JSON.stringify({ store: store.subdomain, ...form }) });
      setStoreCode(d.storeCode);
      setStaff((s) => [...(s || []), d.staff]);
      setHandover({ name: d.staff.name, email: d.staff.email, password: form.password, emailed: d.emailed });
      setForm({ name: "", email: "", password: "", role: "order_manager" });
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that account.");
    } finally {
      setBusy("");
    }
  };

  const patch = async (id: string, change: Partial<Pick<Staff, "role" | "active">> & { password?: string }) => {
    setBusy(id);
    setError("");
    try {
      const d = await call<{ staff: Staff }>("/api/staff/accounts", { method: "PATCH", body: JSON.stringify({ store: store.subdomain, id, ...change }) });
      setStaff((s) => (s || []).map((m) => (m.id === id ? d.staff : m)));
      return d.staff;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that change.");
      return null;
    } finally {
      setBusy("");
    }
  };

  const remove = async (m: Staff) => {
    if (!(await appConfirm(`Remove ${m.name}? They will be signed out and can no longer sign in.`, { danger: true, okLabel: "Remove" }))) return;
    setBusy(m.id);
    setError("");
    try {
      await call(`/api/staff/accounts?${q}&id=${encodeURIComponent(m.id)}`, { method: "DELETE" });
      setStaff((s) => (s || []).filter((x) => x.id !== m.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove that account.");
    } finally {
      setBusy("");
    }
  };

  const reset = async (e: React.FormEvent, m: Staff) => {
    e.preventDefault();
    const problem = passwordProblem(newPassword);
    if (problem) return setError(problem);
    const saved = await patch(m.id, { password: newPassword });
    if (saved) {
      setHandover({ name: m.name, email: m.email, password: newPassword });
      setResetFor("");
      setNewPassword("");
    }
  };

  const count = staff?.length || 0;
  const activeCount = (staff || []).filter((m) => m.active).length;
  const perRole = (r: StaffRole) => (staff || []).filter((m) => m.role === r).length;
  const canAdd = count < MAX_STAFF;
  const openAdd = (role?: StaffRole) => {
    if (role) setForm((f) => ({ ...f, role }));
    setAdding(true);
    setError("");
    requestAnimationFrame(() => document.getElementById("staff-add-form")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  /** the black header card: the store ID as big digits, how staff sign in, and how many seats are used */
  const hero = (
    <div
      className="relative overflow-hidden rounded-3xl bg-neutral-950 p-5 text-white sm:p-7"
      style={{ backgroundImage: "radial-gradient(120% 90% at 100% 0%, rgba(99,102,241,0.35), transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(16,185,129,0.22), transparent 60%)" }}
    >
      <div className="flex flex-wrap items-center gap-5">
        <div className="min-w-0 flex-1 basis-full sm:basis-72">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
              <ShieldCheck className="h-3.5 w-3.5" /> Your store ID
            </span>
            {isPro && (
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 sm:hidden">
                {count} of {MAX_STAFF} seats used
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:flex" aria-label={`Store ID ${storeCode}`}>
            {(storeCode || "·····").split("").map((d, i) => (
              <span key={i} className="flex h-14 items-center justify-center rounded-xl bg-white/10 text-3xl font-semibold tabular-nums ring-1 ring-white/15 sm:w-12">
                {d}
              </span>
            ))}
          </div>
          <p className="mt-3 max-w-md text-sm text-white/65">Staff sign in with this ID, their email and their password.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {storeCode && <CopyButton text={storeCode} label="Copy ID" dark />}
            <CopyButton text={loginUrl} label="Copy sign-in link" dark />
          </div>
        </div>
        {isPro && (
          <div className="hidden items-center gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:flex">
            <SeatRing used={count} total={MAX_STAFF} />
            <div className="text-sm">
              <p className="font-semibold">{count} of {MAX_STAFF} seats used</p>
              <p className="text-white/60">{activeCount} switched on</p>
            </div>
          </div>
        )}
      </div>

      <ol className="mt-6 hidden gap-2 border-t border-white/10 pt-5 text-sm sm:grid sm:grid-cols-3">
        {["Add a team member and pick a role", "We email them their login details", "They sign in and see only their work"].map((t, i) => (
          <li key={t} className="flex items-center gap-2.5 text-white/75">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-neutral-950">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
    </div>
  );

  /** one coloured card per role: what it is for, what it can see, and how many people have it */
  const roleCards = (locked: boolean) => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {STAFF_ROLE_IDS.map((r) => {
        const look = ROLE_LOOK[r];
        const Icon = look.icon;
        const n = perRole(r);
        return (
          <div key={r} className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md sm:p-5">
            <span className={`absolute inset-x-0 top-0 h-1 ${look.bar}`} />
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${look.tile}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{STAFF_ROLES[r].label}</p>
                <p className="text-xs text-neutral-500">{locked ? "Pro plan" : n === 0 ? "Nobody yet" : n === 1 ? "1 person" : `${n} people`}</p>
              </div>
              {locked && <Lock className="h-4 w-4 text-neutral-400" />}
            </div>
            <p className="mt-3 text-sm text-neutral-600">{STAFF_ROLES[r].about}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {look.sees.map((t) => (
                <span key={t} className={`rounded-full px-2.5 py-1 text-xs font-medium ${look.chip}`}>
                  {t}
                </span>
              ))}
            </div>
            {!locked && canAdd && (
              <button type="button" onClick={() => openAdd(r)} style={{ minHeight: 0 }} className="mt-4 hidden h-9 items-center gap-1.5 self-start rounded-lg border border-neutral-200 px-3 text-sm font-semibold hover:border-neutral-900 sm:inline-flex">
                <Plus className="h-3.5 w-3.5" /> Add {STAFF_ROLES[r].label.toLowerCase()}
              </button>
            )}
          </div>
        );
      })}
      <div className="flex flex-col justify-between rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Owner (you)</p>
            <p className="text-xs text-neutral-500">Full access</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-600">You see everything, manage the team and can switch any account off at once.</p>
      </div>
    </div>
  );

  if (!isPro) {
    return (
      <div className="space-y-5">
        {hero}
        <div
          className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8"
          style={{ backgroundImage: "radial-gradient(80% 120% at 100% 0%, rgba(99,102,241,0.10), transparent 60%)" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-white">
            <Lock className="h-3.5 w-3.5" /> Pro plan
          </span>
          <h3 className="mt-3 text-xl font-semibold sm:text-2xl">Give your team their own logins</h3>
          <p className="mt-1 max-w-xl text-sm text-neutral-600">Up to {MAX_STAFF} staff accounts, five roles, and a shared WorkPlace chat. Each person sees only their own work.</p>
          <button type="button" onClick={onUpgrade} style={{ minHeight: 0 }} className={`${btnDark} mt-5`}>
            See the Pro plan
          </button>
        </div>
        <div className="opacity-80">{roleCards(true)}</div>
      </div>
    );
  }

  const details = handover ? `Sign in: ${loginUrl}\nStore ID: ${storeCode}\nEmail: ${handover.email}\nPassword: ${handover.password}` : "";

  return (
    <div className="space-y-5">
      {hero}

      {error && <p className="reveal-in rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {handover && (
        <div className="reveal-in overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
          <div className="flex items-start gap-3 p-4 sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              {handover.emailed ? <MailCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-950">
                {handover.emailed === undefined ? `New password set for ${handover.name}.` : handover.emailed ? `Account made. We emailed the login details to ${handover.email}.` : `Account made. We couldn't email ${handover.email}, so send them these details yourself.`}
              </p>
              <p className="text-xs text-emerald-900/80">The password is shown only this once. Ask them to change it after signing in.</p>
            </div>
          </div>
          <dl className="grid gap-px bg-emerald-200/70 text-sm sm:grid-cols-2">
            {[
              ["Sign in at", loginUrl],
              ["Store ID", storeCode],
              ["Email", handover.email],
              ["Password", handover.password],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-4 py-3 sm:px-5">
                <dt className="text-xs text-neutral-500">{k}</dt>
                <dd className="break-all font-semibold text-neutral-900">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2 p-4 sm:px-5">
            <CopyButton text={details} label="Copy login details" />
            <button type="button" onClick={() => setHandover(null)} style={{ minHeight: 0 }} className={btnSmall}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* the team */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 p-5 sm:p-6">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 sm:flex">
            <Users className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold">Your team</h3>
            <p className="text-sm text-neutral-500">{staff ? (count === 0 ? "Only you so far." : `${count} staff · ${activeCount} switched on`) : "Loading…"}</p>
          </div>
          {!adding && canAdd && (
            <button type="button" onClick={() => openAdd()} style={{ minHeight: 0 }} className={btnDark}>
              <Plus className="h-4 w-4" /> Add staff
            </button>
          )}
        </div>

        {adding && (
          <form id="staff-add-form" onSubmit={add} className="reveal-in space-y-5 border-t border-neutral-100 bg-neutral-50/70 p-5 sm:p-6">
            <div>
              <p className="text-sm font-semibold">1. Pick a role</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Role">
                {STAFF_ROLE_IDS.map((r) => {
                  const look = ROLE_LOOK[r];
                  const Icon = look.icon;
                  const on = form.role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setForm({ ...form, role: r })}
                      style={{ minHeight: 0 }}
                      className={`flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition ${on ? "border-neutral-950 ring-2 ring-neutral-950/10" : "border-neutral-200 hover:border-neutral-400"}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${look.tile}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-semibold">{STAFF_ROLES[r].label}</span>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300"}`}>{on && <Check className="h-3 w-3" />}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-neutral-600">{STAFF_ROLES[form.role].about}</p>
            </div>

            <div>
              <p className="text-sm font-semibold">2. Their login</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-semibold text-neutral-600">
                  Name
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={60} placeholder="Asha Rao" className={`${field} mt-1 font-normal`} />
                </label>
                <label className="block text-xs font-semibold text-neutral-600">
                  Email
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={120} autoCapitalize="none" placeholder="asha@example.com" className={`${field} mt-1 font-normal`} />
                </label>
                <label className="block text-xs font-semibold text-neutral-600">
                  Password
                  <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} maxLength={72} autoComplete="off" placeholder="At least 8 characters" className={`${field} mt-1 font-normal`} />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" disabled={busy === "add"} style={{ minHeight: 0 }} className={btnDark}>
                {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Create and email login
              </button>
              <button type="button" onClick={() => setAdding(false)} style={{ minHeight: 0 }} className="h-11 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold hover:border-neutral-900">
                Cancel
              </button>
              <span className="text-xs text-neutral-500">They can change the password after signing in.</span>
            </div>
          </form>
        )}

        <div className="border-t border-neutral-100">
          {!staff ? (
            <div className="space-y-3 p-5 sm:p-6">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="h-11 w-11 animate-pulse rounded-full bg-neutral-100" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 w-40 animate-pulse rounded bg-neutral-100" />
                    <span className="block h-3 w-56 animate-pulse rounded bg-neutral-100" />
                  </span>
                </div>
              ))}
            </div>
          ) : count === 0 ? (
            !adding && (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="flex -space-x-3">
                  {STAFF_ROLE_IDS.map((r) => {
                    const Icon = ROLE_LOOK[r].icon;
                    return (
                      <span key={r} className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-white ${ROLE_LOOK[r].tile}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                    );
                  })}
                </div>
                <p className="mt-4 text-base font-semibold">Bring in your first team member</p>
                <p className="mt-1 max-w-sm text-sm text-neutral-500">Hand over orders, products, packing, support or accounts. You stay in charge.</p>
                <button type="button" onClick={() => openAdd()} style={{ minHeight: 0 }} className={`${btnDark} mt-5`}>
                  <Plus className="h-4 w-4" /> Add staff
                </button>
              </div>
            )
          ) : (
            <ul className="divide-y divide-neutral-100">
              {staff.map((m) => {
                const look = ROLE_LOOK[m.role];
                const Icon = look.icon;
                const working = busy === m.id;
                return (
                  <li key={m.id} className={`p-4 sm:px-6 sm:py-5 ${m.active ? "" : "bg-neutral-50/70"}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${m.active ? look.tile : "bg-neutral-200 text-neutral-500"}`}>
                        {initials(m.name)}
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${m.active ? "bg-emerald-500" : "bg-neutral-400"}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold">{m.name}</span>
                          <span className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold sm:inline-flex ${look.chip}`}>
                            <Icon className="h-3 w-3" /> {STAFF_ROLES[m.role].label}
                          </span>
                        </div>
                        <p className="truncate text-sm text-neutral-500">{m.email}</p>
                        <p className="text-xs text-neutral-400">{m.lastLoginAt ? `Last signed in ${new Date(m.lastLoginAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : "Has not signed in yet"}</p>
                      </div>
                      {working && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={m.active}
                        aria-label={`${m.name} can sign in`}
                        disabled={working}
                        onClick={() => patch(m.id, { active: !m.active })}
                        style={{ minHeight: 0 }}
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${m.active ? "bg-emerald-500" : "bg-neutral-300"}`}
                      >
                        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${m.active ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:pl-14">
                      <select
                        aria-label={`Role for ${m.name}`}
                        value={m.role}
                        disabled={working}
                        onChange={(e) => patch(m.id, { role: e.target.value as StaffRole })}
                        className="col-span-2 h-10 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-sm outline-none focus:border-neutral-900 sm:h-9 sm:w-auto"
                      >
                        {STAFF_ROLE_IDS.map((r) => (
                          <option key={r} value={r}>
                            {STAFF_ROLES[r].label}
                          </option>
                        ))}
                      </select>
                      <button type="button" disabled={working} onClick={() => { setResetFor(resetFor === m.id ? "" : m.id); setNewPassword(""); }} style={{ minHeight: 0 }} className={`${btnSmall} justify-center max-sm:h-10`}>
                        <KeyRound className="h-3.5 w-3.5" /> New password
                      </button>
                      <button type="button" disabled={working} onClick={() => remove(m)} style={{ minHeight: 0 }} className={`${btnSmall} justify-center text-rose-700 hover:border-rose-600 max-sm:h-10`}>
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                    {resetFor === m.id && (
                      <form onSubmit={(e) => reset(e, m)} className="reveal-in mt-3 flex flex-col gap-2 sm:flex-row sm:pl-14">
                        <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="off" placeholder="New password (at least 8 characters)" aria-label="New password" className={`${field} flex-1`} />
                        <button type="submit" disabled={working} style={{ minHeight: 0 }} className={btnDark}>
                          Set password
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* the roles */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Roles</h3>
            <p className="text-sm text-neutral-500">Each role opens its own dashboard, with nothing else in it.</p>
          </div>
        </div>
        {roleCards(false)}
      </section>

      {onOpenWorkplace && (
        <button
          type="button"
          onClick={onOpenWorkplace}
          className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-shadow hover:shadow-md sm:p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">WorkPlace</span>
            <span className="block text-sm text-neutral-500">The team chat. Ask, answer and flag anything urgent.</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-900" />
        </button>
      )}
    </div>
  );
}
