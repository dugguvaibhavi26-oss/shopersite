"use client";

import * as React from "react";
import { Building2, Check, ExternalLink, Loader2, Scale } from "lucide-react";
import { auth } from "@/lib/firebase";
import type { Company, EditableCompanyField } from "@/lib/legal/company";

type Form = Record<EditableCompanyField, string>;

async function call(init?: RequestInit) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch("/api/admin/company", {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    cache: "no-store",
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body;
}

const FIELDS: { key: EditableCompanyField; label: string; hint?: string; placeholder?: string; required?: boolean; wide?: boolean }[] = [
  { key: "legalName", label: "Company legal name", placeholder: "Roxten Studios Pvt Ltd", required: true },
  { key: "email", label: "Support email", placeholder: "support@shopersite.in", required: true, hint: "Shown on every policy page." },
  { key: "grievanceOfficer", label: "Grievance Officer name", placeholder: "e.g. Tejaswith Reddy", hint: "Required by the IT Rules, 2021. Can be you." },
  { key: "grievanceEmail", label: "Grievance email", placeholder: "Leave blank to use the support email" },
  { key: "phone", label: "Support phone", placeholder: "+91 98765 43210" },
  { key: "whatsapp", label: "WhatsApp number", placeholder: "919876543210", hint: "Digits with country code." },
  { key: "address", label: "Registered office address", placeholder: "Street, area, city, state, PIN", wide: true },
  { key: "city", label: "City for courts & arbitration", placeholder: "e.g. Hyderabad, Telangana", hint: "Used in the Terms of Service." },
  { key: "cin", label: "CIN", placeholder: "Optional" },
  { key: "gstin", label: "GSTIN", placeholder: "Optional" },
];

const toForm = (c: Company): Form => ({
  legalName: c.legalName,
  email: c.email,
  grievanceOfficer: c.grievanceOfficer,
  grievanceEmail: c.grievanceEmail,
  phone: c.phone,
  whatsapp: c.whatsapp,
  address: c.address,
  city: c.city,
  cin: c.cin,
  gstin: c.gstin,
});

/** Admin: the company details printed on ShoperSite's legal pages. Saving updates the pages straight away. */
export function CompanySettings() {
  const [form, setForm] = React.useState<Form | null>(null);
  const [saved, setSaved] = React.useState<Form | null>(null);
  const [canEdit, setCanEdit] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    call()
      .then((b) => {
        setForm(toForm(b.company));
        setSaved(toForm(b.company));
        setCanEdit(!!b.canEdit);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load company details."));
  }, []);

  const dirty = !!form && !!saved && FIELDS.some((f) => form[f.key] !== saved[f.key]);
  const missing = form ? (["grievanceOfficer", "address", "city"] as const).filter((k) => !form[k].trim()) : [];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError("");
    setSaving(true);
    try {
      const b = await call({ method: "POST", body: JSON.stringify(form) });
      setForm(toForm(b.company));
      setSaved(toForm(b.company));
      setDone(true);
      window.setTimeout(() => setDone(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Company & legal</h2>
          <p className="text-sm text-neutral-500">The details printed on ShoperSite&apos;s policy pages. Changes go live as soon as you save.</p>
        </div>
        <a
          href="/legal"
          target="_blank"
          rel="noreferrer"
          style={{ minHeight: 0 }}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium hover:border-neutral-900"
        >
          <Scale className="h-4 w-4" /> View policy pages <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
        </a>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {!form ? (
        !error && (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        )
      ) : (
        <form onSubmit={save} className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-4 w-4" /> Company details
          </div>

          {missing.length > 0 && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Still to add: {missing.map((k) => FIELDS.find((f) => f.key === k)!.label).join(", ")}. Until then those lines are left out of the pages.
            </p>
          )}

          <fieldset disabled={!canEdit || saving} className="mt-5 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className={`block text-sm ${f.wide ? "sm:col-span-2" : ""}`}>
                <span className="mb-1 block font-medium">
                  {f.label}
                  {f.required && <span className="text-rose-600"> *</span>}
                </span>
                <input
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 outline-none focus:border-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-500"
                />
                {f.hint && <span className="mt-1 block text-xs text-neutral-500">{f.hint}</span>}
              </label>
            ))}
          </fieldset>

          {canEdit ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving || !dirty}
                style={{ minHeight: 0 }}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save and update pages
              </button>
              {done && (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                  <Check className="h-4 w-4" /> Saved. The policy pages show the new details now.
                </span>
              )}
            </div>
          ) : (
            <p className="mt-5 text-xs text-neutral-500">Only owner admins can change these details.</p>
          )}
        </form>
      )}
    </div>
  );
}
