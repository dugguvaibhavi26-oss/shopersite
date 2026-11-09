"use client";

import * as React from "react";
import { CheckCircle2, Crown, Loader2, Mail, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { appConfirm } from "@/components/ui/app-dialog";

interface AdminItem {
  email: string;
  role: "owner" | "admin";
  name?: string;
  addedBy?: string;
  addedAt?: string;
  joinedAt?: string;
}

async function call(init?: RequestInit) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch("/api/admin/admins", {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    cache: "no-store",
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body;
}

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

export function AdminsManager({ myEmail }: { myEmail: string }) {
  const [admins, setAdmins] = React.useState<AdminItem[] | null>(null);
  const [canManage, setCanManage] = React.useState(false);
  const [error, setError] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const [done, setDone] = React.useState<{ email: string; emailed: boolean } | null>(null);
  const [removing, setRemoving] = React.useState("");

  const load = React.useCallback(async () => {
    setError("");
    try {
      const body = await call();
      setAdmins(body.admins);
      setCanManage(!!body.canManage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load admins.");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const closeForm = () => {
    setFormOpen(false);
    setName("");
    setEmail("");
    setFormError("");
    setDone(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) return setFormError("Enter their name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setFormError("Enter a valid email address.");
    setSaving(true);
    try {
      const body = await call({ method: "POST", body: JSON.stringify({ name: name.trim(), email: cleanEmail }) });
      setDone({ email: cleanEmail, emailed: !!body.emailed });
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't add admin.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: AdminItem) => {
    const ok = await appConfirm(
      `${a.name || a.email} won't be able to open the admin panel any more. You can add them again later.`,
      { title: "Remove admin access?", okLabel: "Remove access", danger: true },
    );
    if (!ok) return;
    setRemoving(a.email);
    try {
      await call({ method: "DELETE", body: JSON.stringify({ email: a.email }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove admin.");
    } finally {
      setRemoving("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Admins</h2>
          <p className="text-sm text-neutral-500">People who can open this admin panel and manage every store.</p>
        </div>
        {canManage && !formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            style={{ minHeight: 0 }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black"
          >
            <UserPlus className="h-4 w-4" /> Give admin access
          </button>
        )}
      </div>

      {formOpen && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          {done ? (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="font-semibold">{done.email} is now an admin</p>
              <p className="text-sm text-neutral-500">
                {done.emailed
                  ? "We've emailed them. They just sign in at shopersite.in/admin with this email."
                  : "The email couldn't be sent, so let them know yourself: they sign in at shopersite.in/admin with this email."}
              </p>
              <button
                type="button"
                onClick={closeForm}
                style={{ minHeight: 0 }}
                className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold hover:border-neutral-900"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Give admin access</p>
                  <p className="text-sm text-neutral-500">They&apos;ll get an email and can sign in right away with that address.</p>
                </div>
                <button type="button" onClick={closeForm} aria-label="Close" style={{ minHeight: 0 }} className="rounded-lg p-1 text-neutral-500 hover:text-neutral-900">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. Rahul Sharma"
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3 outline-none focus:border-neutral-900"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={120}
                    placeholder="name@gmail.com"
                    autoCapitalize="none"
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3 outline-none focus:border-neutral-900"
                  />
                </label>
              </div>
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Admins can see every seller&apos;s orders and customers, and change plans or suspend stores. Only add people you trust.
              </p>
              {formError && <p className="text-sm text-rose-600">{formError}</p>}
              <button
                type="submit"
                disabled={saving}
                style={{ minHeight: 0 }}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Add admin and send email
              </button>
            </form>
          )}
        </div>
      )}

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {!admins ? (
        !error && (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        )
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {admins.map((a) => (
            <li key={a.email} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span className="truncate">{a.name || a.email}</span>
                  {a.role === "owner" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2 py-0.5 text-[11px] font-semibold text-white">
                      <Crown className="h-3 w-3" /> Owner
                    </span>
                  ) : a.joinedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Hasn&apos;t signed in yet</span>
                  )}
                  {a.email === myEmail && <span className="text-xs font-normal text-neutral-400">(you)</span>}
                </p>
                <p className="mt-0.5 truncate text-sm text-neutral-500">
                  {a.name ? `${a.email} · ` : ""}
                  {a.role === "owner" ? "Set in Vercel" : `Added ${date(a.addedAt)}${a.addedBy ? ` by ${a.addedBy}` : ""}`}
                </p>
              </div>
              {canManage && a.role === "admin" && (
                <button
                  type="button"
                  onClick={() => remove(a)}
                  disabled={removing === a.email}
                  style={{ minHeight: 0 }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-rose-600 hover:border-rose-300 disabled:opacity-60"
                >
                  {removing === a.email ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!canManage && admins && (
        <p className="text-xs text-neutral-500">Only owner admins can add or remove admins.</p>
      )}
    </div>
  );
}
