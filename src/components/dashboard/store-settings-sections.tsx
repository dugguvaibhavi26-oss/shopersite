"use client";

import * as React from "react";
import { brief } from "@/lib/brief";
import { Check, ChevronRight } from "lucide-react";
import { storeService, type CheckoutRules, type StoreData } from "@/lib/store-service";
import { checkoutRulesOf } from "@/lib/checkout-rules";
import { GST_RATES } from "@/lib/invoice";
import { INDIA_STATES } from "@/lib/india-states";

/**
 * The smaller Settings pages: Checkout, Customer accounts, Taxes, Notifications, Tracking & ads and
 * Customer privacy. Each is a card with plain questions and its own Save button.
 */

type Props = { store: StoreData; onChanged: () => void };

/* ------------------------------ building blocks ------------------------------ */

function Panel({ title, text, children, onSave, saved, error }: { title?: string; text?: string; children: React.ReactNode; onSave: () => void; saved: boolean; error?: string }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="rounded-2xl border border-neutral-200 bg-white"
    >
      <div className="space-y-5 p-4 sm:p-6">
        {title && (
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {text && <p className="mt-0.5 text-sm text-neutral-500">{text}</p>}
          </div>
        )}
        {children}
        {error && <p className="reveal-in rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>
      <div className="flex flex-col-reverse items-stretch gap-2 px-4 pb-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6 sm:pb-6">
        {saved && (
          <span className="reveal-in inline-flex items-center justify-center gap-1 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <button type="submit" style={{ minHeight: 0 }} className="h-11 w-full rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-black sm:w-auto">
          Save
        </button>
      </div>
    </form>
  );
}

function useSaved() {
  const [saved, setSaved] = React.useState(false);
  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  return [saved, flash] as const;
}

function Toggle({ label, text, checked, onChange }: { label: string; text?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-4 last-of-type:border-0 last-of-type:pb-0">
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold leading-snug">{label}</span>
        {text && <span className="mt-1 block break-words text-[13px] leading-relaxed text-neutral-500">{brief(text)}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        style={{ minHeight: 0, height: 24 }}
        className={`relative w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-neutral-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; title: string; text: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div role="radiogroup" aria-label={label} className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.id)}
              style={{ minHeight: 0 }}
              className={`rounded-xl border p-3.5 text-left ${on ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
            >
              <span className="block text-sm font-semibold">{o.title}</span>
              <span className={`block text-xs ${on ? "text-white/70" : "text-neutral-500"}`}>{o.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Money({ id, label, hint, value, onChange }: { id: string; label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && <span className="mt-0.5 block text-xs text-neutral-500">{hint}</span>}
      <label className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 focus-within:border-neutral-900 sm:max-w-[220px]">
        <span className="text-sm text-neutral-400">₹</span>
        <input id={id} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 7))} placeholder="0" className="w-full bg-transparent text-sm outline-none" />
      </label>
    </div>
  );
}

function Text({ id, label, hint, value, onChange, placeholder, mono }: { id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-neutral-900 ${mono ? "font-mono" : ""}`}
      />
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </div>
  );
}

const toRupeeText = (paise?: number) => (paise ? String(Math.round(paise / 100)) : "");
const toPaise = (rupees: string) => Math.round((parseInt(rupees || "0", 10) || 0) * 100);
const saveRules = (store: StoreData, changes: CheckoutRules) =>
  storeService.updateStore(store.subdomain, { checkoutRules: { ...(store.checkoutRules || {}), ...changes } });

/* ------------------------------ Checkout ------------------------------ */

export function CheckoutSettings({ store, onChanged }: Props) {
  const r = checkoutRulesOf(store);
  const [minOrder, setMinOrder] = React.useState(toRupeeText(r.minOrder));
  const [codMax, setCodMax] = React.useState(toRupeeText(r.codMax));
  const [notes, setNotes] = React.useState(r.orderNotes);
  const [email, setEmail] = React.useState(r.email);
  const [saved, flash] = useSaved();
  return (
    <Panel
      saved={saved}
      onSave={() => {
        saveRules(store, { minOrder: toPaise(minOrder), codMax: toPaise(codMax), orderNotes: notes, email });
        onChanged();
        flash();
      }}
    >
      <Money id="co-min" label="Minimum order amount" hint="Buyers can't check out below this (the item total, before delivery). Leave empty for no minimum." value={minOrder} onChange={setMinOrder} />
      {store.codEnabled ? (
        <Money id="co-codmax" label="Highest order allowed with cash on delivery" hint="Bigger orders must be paid online or by UPI. Leave empty for no limit." value={codMax} onChange={setCodMax} />
      ) : (
        <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">Cash on delivery is off. Turn it on in Payments to set a limit for it.</p>
      )}
      <Choice
        label="Buyer's email at checkout"
        value={email}
        onChange={setEmail}
        options={[
          { id: "optional", title: "Optional", text: "Buyers can skip it" },
          { id: "required", title: "Required", text: "Needed to place an order" },
          { id: "hidden", title: "Don't ask", text: "Name and phone only" },
        ]}
      />
      <Toggle label="Note for the shop" text="Let buyers add a note, like a landmark or gift message." checked={notes} onChange={setNotes} />
    </Panel>
  );
}

/* ------------------------------ Customer accounts ------------------------------ */

export function AccountSettings({ store, onChanged }: Props) {
  const r = checkoutRulesOf(store);
  const [mode, setMode] = React.useState<"guest" | "login">(r.requireLogin ? "login" : "guest");
  const [saved, flash] = useSaved();
  return (
    <Panel
      saved={saved}
      onSave={() => {
        saveRules(store, { requireLogin: mode === "login" });
        onChanged();
        flash();
      }}
    >
      <Choice
        label="How buyers check out"
        value={mode}
        onChange={setMode}
        options={[
          { id: "guest", title: "Guest checkout", text: "Anyone can order. Signing in is optional" },
          { id: "login", title: "Sign-in required", text: "Buyers create an account first" },
        ]}
      />
      <p className="text-sm text-neutral-500">
        {mode === "guest"
          ? "Recommended: most buyers order faster without making an account. Signed-in buyers still see all their orders on any device."
          : "Buyers sign in with email before ordering. Fewer people may finish checkout, but you always know who ordered."}
      </p>
    </Panel>
  );
}

/* ------------------------------ Taxes ------------------------------ */

export function TaxSettings({ store, onChanged }: Props) {
  const [gstin, setGstin] = React.useState(store.gstin || "");
  const [inclusive, setInclusive] = React.useState(store.pricesIncludeTax !== false);
  const [rate, setRate] = React.useState(String(store.defaultGstRate ?? 18));
  const [gstState, setGstState] = React.useState(store.gstState || "");
  const [error, setError] = React.useState("");
  const [saved, flash] = useSaved();
  return (
    <Panel
      saved={saved}
      error={error}
      onSave={() => {
        const g = gstin.trim().toUpperCase().replace(/\s+/g, "");
        if (g && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return setError("A GSTIN has 15 characters, like 29ABCDE1234F1Z5. Check it, or leave it empty.");
        if (g && !gstState) return setError("Choose the state your GSTIN is registered in.");
        setError("");
        storeService.updateStore(store.subdomain, { gstin: g, pricesIncludeTax: inclusive, defaultGstRate: Number(rate), gstState });
        onChanged();
        flash();
      }}
    >
      <Text
        id="tax-gstin"
        label="GSTIN"
        mono
        value={gstin}
        onChange={setGstin}
        placeholder="29ABCDE1234F1Z5"
        hint="Optional. If you're registered for GST, it's shown to buyers on your contact page and on invoices."
      />
      {gstin.trim() && (
        <div className="reveal-in grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">State of registration</span>
            <select value={gstState} onChange={(e) => setGstState(e.target.value)} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-900">
              <option value="">Choose</option>
              {INDIA_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-neutral-500">Same state as the buyer: CGST + SGST. Other states: IGST.</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Usual GST rate</span>
            <select value={rate} onChange={(e) => setRate(e.target.value)} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-900">
              {GST_RATES.map((r) => (
                <option key={r} value={String(r)}>
                  {r}%
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-neutral-500">Used for delivery and any product without its own rate.</span>
          </label>
        </div>
      )}
      <Toggle
        label="My prices include GST"
        text={inclusive ? "Product pages say \"Inclusive of all taxes\"." : "Product pages don't mention tax. Only switch this off if you're not registered for GST."}
        checked={inclusive}
        onChange={setInclusive}
      />
      <p className="rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        ShoperSite doesn&apos;t add tax on top of your prices.
      </p>
    </Panel>
  );
}

/* ------------------------------ Notifications ------------------------------ */

export function NotificationSettings({ store, onChanged, onOpenEmails }: Props & { onOpenEmails: () => void }) {
  const [newOrders, setNewOrders] = React.useState(store.notifyNewOrders !== false);
  const [saved, flash] = useSaved();
  const to = store.contactEmail || store.ownerEmail || "your account email";
  return (
    <div className="space-y-4">
      <Panel
        saved={saved}
        onSave={() => {
          storeService.updateStore(store.subdomain, { notifyNewOrders: newOrders });
          onChanged();
          flash();
        }}
      >
        <Toggle label="New order emails" text="The moment an order is placed or paid." checked={newOrders} onChange={setNewOrders} />
        <p className="-mt-1 flex min-w-0 items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-[13px] text-neutral-600">
          <span className="shrink-0 text-neutral-400">Sent to</span>
          <span className="truncate font-medium text-neutral-900">{to}</span>
        </p>
      </Panel>
      <button
        type="button"
        onClick={onOpenEmails}
        style={{ minHeight: 0 }}
        className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50 sm:p-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">Emails to your buyers</span>
          <span className="mt-0.5 block text-[13px] text-neutral-500">Order updates and new products, from your Gmail.</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" />
      </button>
    </div>
  );
}

/* ------------------------------ Tracking & ads ------------------------------ */

export function TrackingSettings({ store, onChanged }: Props) {
  const [pixel, setPixel] = React.useState(store.tracking?.metaPixelId || "");
  const [ga, setGa] = React.useState(store.tracking?.gaId || "");
  const [error, setError] = React.useState("");
  const [saved, flash] = useSaved();
  return (
    <Panel
      saved={saved}
      error={error}
      onSave={() => {
        const p = pixel.trim().replace(/\D/g, "");
        const g = ga.trim().toUpperCase();
        if (pixel.trim() && !/^\d{10,20}$/.test(p)) return setError("A Meta Pixel ID is 10 to 20 digits. Find it in Meta Events Manager.");
        if (g && !/^G-[A-Z0-9]{4,14}$/.test(g)) return setError("A Google Analytics ID starts with G-, like G-AB12CD34EF.");
        setError("");
        storeService.updateStore(store.subdomain, { tracking: { metaPixelId: p, gaId: g } });
        onChanged();
        flash();
      }}
    >
      <Text
        id="tr-pixel"
        label="Meta Pixel ID (Facebook & Instagram ads)"
        mono
        value={pixel}
        onChange={setPixel}
        placeholder="123456789012345"
        hint="Meta Events Manager → Data sources → your pixel. Lets you see sales from your Instagram and Facebook ads."
      />
      <Text
        id="tr-ga"
        label="Google Analytics measurement ID"
        mono
        value={ga}
        onChange={setGa}
        placeholder="G-AB12CD34EF"
        hint="Google Analytics → Admin → Data streams. Shows how many people visit and what they look at."
      />
      <p className="rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        Tracking runs on your store only (not in your dashboard).
      </p>
    </Panel>
  );
}

/* ------------------------------ Customer privacy ------------------------------ */

export function PrivacySettings({ store, onChanged, onOpenPolicies }: Props & { onOpenPolicies: () => void }) {
  const tracking = !!(store.tracking?.metaPixelId || store.tracking?.gaId);
  const [banner, setBanner] = React.useState(store.cookieBanner ?? tracking);
  const [saved, flash] = useSaved();
  return (
    <div className="space-y-4">
      <Panel
        saved={saved}
        onSave={() => {
          storeService.updateStore(store.subdomain, { cookieBanner: banner });
          onChanged();
          flash();
        }}
      >
        <Toggle
          label="Show a cookie notice"
          text={
            tracking
              ? "Recommended, because you use tracking. Buyers choose Accept or Decline, and Meta or Google tracking only runs if they accept."
              : "A short notice at the bottom of your store. You don't use tracking yet, so it's optional."
          }
          checked={banner}
          onChange={setBanner}
        />
      </Panel>
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold">Buyers&apos; data requests</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Under India&apos;s DPDP Act, buyers can ask you to show, correct or delete their details. Your store&apos;s contact page shows a &ldquo;Request my data&rdquo; email link to{" "}
          {store.contactEmail || "your email (add one in General)"}. Reply within 30 days.
        </p>
        <button type="button" onClick={onOpenPolicies} style={{ minHeight: 0 }} className="mt-4 h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold hover:border-neutral-900">
          Edit your privacy policy
        </button>
      </div>
    </div>
  );
}
