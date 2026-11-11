"use client";

import * as React from "react";
import { Check, Loader2, Mail, MessageCircle, ShoppingBag } from "lucide-react";
import { ICart } from "@/components/icons";
import { auth } from "@/lib/firebase";
import type { StoreData } from "@/lib/store-service";
import { getPublicStoreUrl } from "@/lib/config/site";
import { buyerWhatsAppLink } from "@/lib/whatsapp-messages";

/** Orders → Abandoned: buyers who filled in their details but didn't finish, with a one-tap WhatsApp nudge. */

interface Checkout {
  id: string;
  name: string;
  phone: string;
  email?: string;
  items: { title: string; quantity: number; price: number }[];
  total: number;
  consent: boolean;
  status: "open" | "contacted" | "reminded";
  updatedAt: string;
}

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

const rupees = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;
function ago(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function AbandonedCheckouts({ store, onCount }: { store: StoreData; onCount?: (n: number) => void }) {
  const [list, setList] = React.useState<Checkout[] | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    api<{ checkouts: Checkout[] }>(`/api/checkout/abandoned?store=${encodeURIComponent(store.subdomain)}`)
      .then((r) => {
        setList(r.checkouts);
        onCount?.(r.checkouts.filter((c) => c.status === "open").length);
      })
      .catch((e) => setError(e.message));
  }, [store.subdomain, onCount]);

  const contacted = async (id: string) => {
    setList((l) => (l ? l.map((c) => (c.id === id ? { ...c, status: "contacted" } : c)) : l));
    await api("/api/checkout/abandoned", { method: "PATCH", body: JSON.stringify({ store: store.subdomain, id }) }).catch(() => null);
  };

  if (error) return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!list)
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  if (!list.length)
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        <ICart className="mx-auto mb-2 h-5 w-5" />
        No unfinished checkouts. Buyers who fill in their details but don&apos;t pay show up here after 30 minutes.
      </div>
    );

  const cart = getPublicStoreUrl(store.subdomain, "/cart");
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-500">
        These buyers filled in their details but didn&apos;t finish. A friendly WhatsApp often brings them back. Buyers who ticked &ldquo;email me a reminder&rdquo; get one email automatically
        {store.pluginsConfig?.gmailIntegration?.isConnected ? "" : " once your Gmail is connected in Plugins"}.
      </p>
      <ul className="space-y-3">
        {list.map((c) => {
          const first = c.name.split(/\s+/)[0] || "there";
          const text = `Hi ${first}! You were almost done ordering from ${store.name}:\n${c.items.map((i) => `• ${i.quantity} × ${i.title}`).join("\n")}\n\nYour bag is waiting here: ${cart}\nNeed any help with the order?`;
          const wa = buyerWhatsAppLink(c.phone, text);
          return (
            <li key={c.id} className="rounded-[24px] bg-white ring-1 ring-black/[0.04] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {c.name}
                    {c.status === "contacted" && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">Contacted</span>}
                    {c.status === "reminded" && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Email reminder sent</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {c.phone} · {rupees(c.total)} · {ago(c.updatedAt)}
                  </p>
                  <p className="mt-1 truncate text-sm text-neutral-700">{c.items.map((i) => `${i.quantity} × ${i.title}`).join(", ")}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => contacted(c.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} onClick={() => contacted(c.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm hover:border-neutral-900">
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {c.status === "open" && (
                    <button type="button" onClick={() => contacted(c.id)} style={{ minHeight: 0 }} aria-label="Mark as contacted" className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-2.5 hover:border-neutral-900">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
