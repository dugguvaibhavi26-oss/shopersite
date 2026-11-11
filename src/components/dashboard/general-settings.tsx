"use client";

import * as React from "react";
import { brief } from "@/lib/brief";
import { ChevronRight, Loader2 } from "lucide-react";
import { IAt, IPin, IStore } from "@/components/icons";
import { storeService, type StoreData } from "@/lib/store-service";
import { hasAnyPolicy } from "@/lib/policies";
import { Modal } from "@/components/ui/modal";
import { appAlert } from "@/components/ui/app-dialog";

/**
 * Settings → General: the store's name and description, how buyers contact the seller, the business
 * address and whether the shop is open. Laid out as cards of rows; a row opens a small editor.
 */

type Editor = null | "store" | "contact" | "address";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanPhone = (v: string) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
const cleanHandle = (v: string) => v.trim().replace(/^@+/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "");

export function GeneralSettings({ store, onChanged, onOpenPolicies }: { store: StoreData; onChanged: () => void; onOpenPolicies: () => void }) {
  const [editor, setEditor] = React.useState<Editor>(null);
  const handle = (store.instagramHandle || "").replace(/^@/, "");
  const needsPolicy = !hasAnyPolicy(store);
  const open = !store.isClosed && !needsPolicy;

  const toggleOpen = () => {
    if (needsPolicy) {
      appAlert("Add at least one policy page (terms, returns, shipping or privacy) first. Templates are ready to edit.", {
        title: "Add a policy page first",
        okLabel: "Add policies",
      }).then(onOpenPolicies);
      return;
    }
    storeService.updateStore(store.subdomain, { isClosed: !store.isClosed });
    onChanged();
  };

  return (
    <div className="space-y-6">
      <Card title="Store details">
        <Row icon={<IStore className="h-4 w-4" />} onClick={() => setEditor("store")} title={store.name} lines={[store.tagline || "Add a short line about your store", store.category]} />
      </Card>

      <Card title="Contact details" hint="Shown to buyers on your store's contact page and order pages.">
        <Row
          icon={<IAt className="h-4 w-4" />}
          onClick={() => setEditor("contact")}
          title={store.ownerName || "Your name"}
          lines={[
            [store.contactEmail || "No email added", store.contactPhone || "No phone added"].join(" · "),
            handle ? `Instagram @${handle}` : "Instagram not linked",
          ]}
        />
        <Row
          icon={<IPin className="h-4 w-4" />}
          onClick={() => setEditor("address")}
          title="Business address"
          lines={[store.businessAddress || "Not added yet. Online shops in India should show one."]}
          muted={!store.businessAddress}
        />
      </Card>

      <Card title="Store status">
        <div className="flex items-center gap-4 p-4 sm:p-5">
          <span className={`relative flex h-2.5 w-2.5 shrink-0 rounded-full ${open ? "bg-emerald-500" : "bg-neutral-400"}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{open ? "Open" : "Closed"}</p>
            <p className="text-sm text-neutral-500">
              {needsPolicy ? "Add at least one policy page to open your store." : open ? "Buyers can browse and order." : "Buyers see a closed notice and can't order."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={open}
            aria-label={open ? "Close the store" : "Open the store"}
            onClick={toggleOpen}
            style={{ minHeight: 0, height: 28 }}
            className={`relative w-12 shrink-0 rounded-full transition-colors ${open ? "bg-emerald-500" : "bg-neutral-300"}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-300 ${open ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </Card>

      {editor === "store" && <StoreEditor store={store} onClose={() => setEditor(null)} onSaved={onChanged} />}
      {editor === "contact" && <ContactEditor store={store} onClose={() => setEditor(null)} onSaved={onChanged} />}
      {editor === "address" && <AddressEditor store={store} onClose={() => setEditor(null)} onSaved={onChanged} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="px-1 text-[15px] font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 px-1 text-sm text-neutral-500">{brief(hint)}</p>}
      <div className="mt-3 divide-y divide-neutral-100 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.04]">{children}</div>
    </section>
  );
}

export function Row({ icon, title, lines, onClick, muted }: { icon: React.ReactNode; title: string; lines: string[]; onClick: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ minHeight: 0 }}
      className="group flex w-full items-center gap-4 p-4 text-left hover:bg-neutral-50 sm:p-5"
    >
      <span className="flex shrink-0 items-center justify-center text-neutral-900">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {lines.filter(Boolean).map((l, i) => (
          <span key={i} className={`block text-sm ${muted ? "text-neutral-400" : "text-neutral-500"} ${i === 0 ? "" : "truncate"}`}>
            {l}
          </span>
        ))}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{brief(hint)}</span>}
    </label>
  );
}

const input = "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-neutral-900";

function EditorShell({
  title,
  onClose,
  onSave,
  error,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => boolean;
  error: string;
  children: React.ReactNode;
}) {
  const [saving, setSaving] = React.useState(false);
  return (
    <Modal isOpen onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          const ok = onSave();
          setSaving(false);
          if (ok) onClose();
        }}
        className="space-y-4"
      >
        {children}
        {error && <p className="reveal-in rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} style={{ minHeight: 0 }} className="h-11 rounded-xl border border-neutral-200 px-4 text-sm font-medium hover:border-neutral-900">
            Cancel
          </button>
          <button type="submit" disabled={saving} style={{ minHeight: 0 }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

type EditorProps = { store: StoreData; onClose: () => void; onSaved: () => void };

function StoreEditor({ store, onClose, onSaved }: EditorProps) {
  const [name, setName] = React.useState(store.name);
  const [tagline, setTagline] = React.useState(store.tagline || "");
  const [category, setCategory] = React.useState(store.category || "");
  const [error, setError] = React.useState("");
  return (
    <EditorShell
      title="Store details"
      onClose={onClose}
      error={error}
      onSave={() => {
        const n = name.trim().replace(/\s+/g, " ");
        if (n.length < 2 || n.length > 60) return setError("Store name should be 2 to 60 characters."), false;
        storeService.updateStore(store.subdomain, { name: n, tagline: tagline.trim().slice(0, 120), category: category.trim().slice(0, 40) || store.category });
        onSaved();
        return true;
      }}
    >
      <Field label="Store name" hint="Shown at the top of your store, in emails and on invoices.">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={input} />
      </Field>
      <Field label="Short description" hint="One line about what you sell. Shown under your store name in search results.">
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} placeholder="Handmade jewellery from Jaipur" className={input} />
      </Field>
      <Field label="What you sell">
        <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={40} placeholder="Fashion" className={input} />
      </Field>
      <p className="text-xs text-neutral-500">Your store&apos;s web address ({store.subdomain}) stays the same.</p>
    </EditorShell>
  );
}

function ContactEditor({ store, onClose, onSaved }: EditorProps) {
  const [ownerName, setOwnerName] = React.useState(store.ownerName || "");
  const [email, setEmail] = React.useState(store.contactEmail || "");
  const [phone, setPhone] = React.useState(store.contactPhone || "");
  const [ig, setIg] = React.useState((store.instagramHandle || "").replace(/^@/, ""));
  const [error, setError] = React.useState("");
  return (
    <EditorShell
      title="Contact details"
      onClose={onClose}
      error={error}
      onSave={() => {
        const p = cleanPhone(phone);
        const e = email.trim().toLowerCase();
        const h = cleanHandle(ig);
        if (!ownerName.trim()) return setError("Enter your name."), false;
        if (!/^[6-9]\d{9}$/.test(p)) return setError("Enter a 10-digit mobile number."), false;
        if (e && !EMAIL.test(e)) return setError("Check the email address."), false;
        if (h && !/^[A-Za-z0-9._]{1,30}$/.test(h)) return setError("An Instagram username has only letters, numbers, dots and underscores."), false;
        storeService.updateStore(store.subdomain, { ownerName: ownerName.trim().slice(0, 80), contactPhone: p, contactEmail: e, instagramHandle: h });
        onSaved();
        return true;
      }}
    >
      <Field label="Your name">
        <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} maxLength={80} className={input} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile number" hint="Buyers can WhatsApp you on this.">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={14} placeholder="9876543210" className={input} />
        </Field>
        <Field label="Email for buyers">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" maxLength={120} placeholder="hello@yourstore.in" className={input} />
        </Field>
      </div>
      <Field label="Instagram username" hint="Optional. Shown as a link in your store.">
        <div className="flex h-11 items-center rounded-xl border border-neutral-200 bg-white px-3.5 focus-within:border-neutral-900">
          <span className="text-sm text-neutral-400">@</span>
          <input value={ig} onChange={(e) => setIg(e.target.value)} maxLength={60} placeholder="yourstore" className="w-full bg-transparent pl-1 text-sm outline-none" />
        </div>
      </Field>
    </EditorShell>
  );
}

function AddressEditor({ store, onClose, onSaved }: EditorProps) {
  const [address, setAddress] = React.useState(store.businessAddress || "");
  const [error, setError] = React.useState("");
  return (
    <EditorShell
      title="Business address"
      onClose={onClose}
      error={error}
      onSave={() => {
        const a = address.trim().replace(/[ \t]+/g, " ");
        if (a && a.length < 10) return setError("Add the full address, with city and PIN code."), false;
        storeService.updateStore(store.subdomain, { businessAddress: a.slice(0, 300) });
        onSaved();
        return true;
      }}
    >
      <Field label="Address" hint="Where your business is run from: building, street, city, state and PIN code. India's e-commerce rules ask online sellers to show it.">
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={4}
          maxLength={300}
          placeholder={"12, MG Road, Indiranagar\nBengaluru, Karnataka 560038"}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-neutral-900"
        />
      </Field>
    </EditorShell>
  );
}
