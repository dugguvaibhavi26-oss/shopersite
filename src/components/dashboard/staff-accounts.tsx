"use client";

import * as React from "react";
import { Check, Copy, KeyRound, Loader2, Lock, Plus, Trash2, UserRound } from "lucide-react";
import { auth } from "@/lib/firebase";
import { appConfirm } from "@/components/ui/app-dialog";
import { effectivePlan } from "@/lib/subscription";
import type { StoreData } from "@/lib/store-service";
import { MAX_STAFF, passwordProblem, STAFF_ROLES, STAFF_ROLE_IDS, type StaffRole } from "@/lib/staff/roles";
import { WorkplaceChat } from "@/components/staff/workplace-chat";

/** Settings → Staff (Pro): the store's 5-digit ID, the team's accounts and roles, and the WorkPlace chat. */

interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

async function ownerHeaders(): Promise<Record<string, string>> {
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

function CopyButton({ text, label }: { text: string; label: string }) {
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
      className={btnSmall}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : label}
    </button>
  );
}

export function StaffAccounts({ store, onUpgrade }: { store: StoreData; onUpgrade: () => void }) {
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

  const idCard = (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-neutral-500">Your store ID</span>
        <span className="block text-2xl font-semibold tracking-[0.18em]">{storeCode || "·····"}</span>
        <span className="block text-sm text-neutral-500">Staff type this ID, with their email and password, to sign in.</span>
      </span>
      {storeCode && <CopyButton text={storeCode} label="Copy ID" />}
    </div>
  );

  if (!isPro) {
    return (
      <div className="space-y-4">
        {idCard}
        <div className="rounded-2xl bg-neutral-950 p-6 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
            <Lock className="h-3.5 w-3.5" /> Pro plan
          </span>
          <h3 className="mt-3 text-lg font-semibold">Give your team their own logins</h3>
          <p className="mt-1 text-sm text-white/65">Add an order manager, product manager, packer, support person or accountant. Each one sees only their own work.</p>
          <button type="button" onClick={onUpgrade} style={{ minHeight: 0 }} className="mt-5 h-11 rounded-xl bg-white px-5 text-sm font-semibold text-neutral-950 hover:bg-neutral-100">
            See the Pro plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {idCard}

      {error && <p className="reveal-in rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {handover && (
        <div className="reveal-in rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
          <p className="text-sm font-semibold text-emerald-900">
            {handover.emailed === undefined ? `New password set for ${handover.name}.` : handover.emailed ? `Account made. We emailed the login details to ${handover.email}.` : `Account made. We couldn't email ${handover.email}, so send them these details yourself.`}
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-neutral-800">{`Sign in: ${loginUrl}\nStore ID: ${storeCode}\nEmail: ${handover.email}\nPassword: ${handover.password}`}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={`Sign in: ${loginUrl}\nStore ID: ${storeCode}\nEmail: ${handover.email}\nPassword: ${handover.password}`} label="Copy login details" />
            <button type="button" onClick={() => setHandover(null)} style={{ minHeight: 0 }} className={btnSmall}>
              Done
            </button>
          </div>
          <p className="mt-2 text-xs text-emerald-900/80">The password is shown only this once. Ask them to change it after signing in.</p>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 p-5 sm:p-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold">Staff accounts</h3>
            <p className="text-sm text-neutral-500">
              You are the owner and see everything. {staff ? `${staff.length} of ${MAX_STAFF} staff accounts used.` : ""}
            </p>
          </div>
          {!adding && (staff?.length || 0) < MAX_STAFF && (
            <button type="button" onClick={() => { setAdding(true); setError(""); }} style={{ minHeight: 0 }} className={btnDark}>
              <Plus className="h-4 w-4" /> Add staff
            </button>
          )}
        </div>

        {adding && (
          <form onSubmit={add} className="space-y-4 border-t border-neutral-100 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={60} className={`${field} mt-1.5 font-normal`} />
              </label>
              <label className="block text-sm font-semibold">
                Email
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={120} autoCapitalize="none" className={`${field} mt-1.5 font-normal`} />
              </label>
              <label className="block text-sm font-semibold">
                Password
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} maxLength={72} autoComplete="off" className={`${field} mt-1.5 font-normal`} />
                <span className="mt-1 block text-xs font-normal text-neutral-500">At least 8 characters. They can change it later.</span>
              </label>
              <label className="block text-sm font-semibold">
                Role
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })} className={`${field} mt-1.5 font-normal`}>
                  {STAFF_ROLE_IDS.map((r) => (
                    <option key={r} value={r}>
                      {STAFF_ROLES[r].label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-normal text-neutral-500">{STAFF_ROLES[form.role].about}</span>
              </label>
            </div>
            <p className="text-xs text-neutral-500">We email them the sign-in page, your store ID, their email and this password.</p>
            <div className="flex gap-2">
              <button type="submit" disabled={busy === "add"} style={{ minHeight: 0 }} className={btnDark}>
                {busy === "add" && <Loader2 className="h-4 w-4 animate-spin" />} Create account
              </button>
              <button type="button" onClick={() => setAdding(false)} style={{ minHeight: 0 }} className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-semibold hover:border-neutral-900">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-neutral-100 border-t border-neutral-100">
          {!staff ? (
            <p className="flex items-center gap-2 p-5 text-sm text-neutral-500 sm:px-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : staff.length === 0 ? (
            <p className="p-5 text-sm text-neutral-500 sm:px-6">No staff yet. Add your first team member.</p>
          ) : (
            staff.map((m) => (
              <div key={m.id} className="p-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{m.name}</span>
                      {!m.active && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">Switched off</span>}
                    </span>
                    <span className="block truncate text-sm text-neutral-500">{m.email}</span>
                    <span className="block text-xs text-neutral-400">{m.lastLoginAt ? `Last signed in ${new Date(m.lastLoginAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : "Has not signed in yet"}</span>
                  </span>
                  {busy === m.id && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Role for ${m.name}`}
                    value={m.role}
                    disabled={busy === m.id}
                    onChange={(e) => patch(m.id, { role: e.target.value as StaffRole })}
                    className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm outline-none focus:border-neutral-900"
                  >
                    {STAFF_ROLE_IDS.map((r) => (
                      <option key={r} value={r}>
                        {STAFF_ROLES[r].label}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={busy === m.id} onClick={() => patch(m.id, { active: !m.active })} style={{ minHeight: 0 }} className={btnSmall}>
                    {m.active ? "Switch off" : "Switch on"}
                  </button>
                  <button type="button" disabled={busy === m.id} onClick={() => { setResetFor(resetFor === m.id ? "" : m.id); setNewPassword(""); }} style={{ minHeight: 0 }} className={btnSmall}>
                    <KeyRound className="h-3.5 w-3.5" /> New password
                  </button>
                  <button type="button" disabled={busy === m.id} onClick={() => remove(m)} style={{ minHeight: 0 }} className={`${btnSmall} text-rose-700`}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                {resetFor === m.id && (
                  <form onSubmit={(e) => reset(e, m)} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="off" placeholder="New password (at least 8 characters)" aria-label="New password" className={`${field} flex-1`} />
                    <button type="submit" disabled={busy === m.id} style={{ minHeight: 0 }} className={btnDark}>
                      Set password
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold">What each role sees</h3>
        <dl className="mt-3 space-y-2.5 text-sm">
          {STAFF_ROLE_IDS.map((r) => (
            <div key={r}>
              <dt className="font-semibold">{STAFF_ROLES[r].label}</dt>
              <dd className="text-neutral-500">{STAFF_ROLES[r].about}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-neutral-500">
          Staff sign in at <span className="font-medium text-neutral-800">{loginUrl}</span>
        </p>
      </div>

      <WorkplaceChat store={store.subdomain} authHeaders={ownerHeaders} />
    </div>
  );
}
