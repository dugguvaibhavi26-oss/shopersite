"use client";

import * as React from "react";
import { ExternalLink, FileText, Loader2, MessageCircle, RefreshCw, Truck } from "lucide-react";
import { IChat, ITruck } from "@/components/icons";
import { auth } from "@/lib/firebase";
import type { OrderData, StoreData } from "@/lib/store-service";
import { effectivePlan } from "@/lib/subscription";
import { BUYER_UPDATES, buyerUpdateText, buyerWhatsAppLink } from "@/lib/whatsapp-messages";
import { getPublicStoreUrl } from "@/lib/config/site";
import { SectionIcon } from "./ui-kit";

/** Extra tools on an order's page: Ship with Shiprocket, WhatsApp updates to the buyer, and the invoice. */

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

const card = "rounded-[24px] bg-white ring-1 ring-black/[0.04] p-4 sm:p-5";
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ------------------------------ Shiprocket ------------------------------ */

interface Courier {
  id: number;
  name: string;
  rate: number;
  etd: string;
}

export function ShiprocketShip({ store, order, onUpdated, onOpenPlugin }: { store: StoreData; order: OrderData; onUpdated: (o: OrderData) => void; onOpenPlugin: () => void }) {
  const [connected, setConnected] = React.useState<boolean | null>(null);
  const [couriers, setCouriers] = React.useState<Courier[] | null>(null);
  const [busy, setBusy] = React.useState("");
  const [picked, setPicked] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");
  const plan = effectivePlan(store).planId;
  const sh = order.shiprocket;

  React.useEffect(() => {
    if (plan === "free") return;
    api<{ connected: boolean }>(`/api/shiprocket?store=${encodeURIComponent(store.subdomain)}`)
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
  }, [store.subdomain, plan]);

  if (plan === "free" || order.fulfilmentStatus === "cancelled" || connected === null) return null;

  const step = async (action: "create" | "couriers" | "ship" | "track", courierId?: number) => {
    setBusy(action);
    setError("");
    try {
      const r = await api<{ order?: OrderData; couriers?: Courier[] }>("/api/shiprocket/ship", {
        method: "POST",
        body: JSON.stringify({ store: store.subdomain, orderId: order.id, action, ...(courierId ? { courierId } : {}) }),
      });
      if (r.order) onUpdated(r.order);
      if (r.couriers) setCouriers(r.couriers);
      if (action === "create") {
        const c = await api<{ couriers: Courier[] }>("/api/shiprocket/ship", { method: "POST", body: JSON.stringify({ store: store.subdomain, orderId: order.id, action: "couriers" }) });
        setCouriers(c.couriers);
      }
      if (action === "ship") setCouriers(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className={card}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <SectionIcon section="plugins" icon={ITruck} size="sm" /> Ship with Shiprocket
      </h3>
      {!connected ? (
        <p className="mt-2 text-sm text-neutral-500">
          Connect Shiprocket to book a courier, print the label and get live tracking in one go.{" "}
          <button type="button" onClick={onOpenPlugin} style={{ minHeight: 0 }} className="font-semibold text-neutral-950 underline">
            Set up
          </button>
        </p>
      ) : sh?.awb ? (
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="text-neutral-500">Courier:</span> <b>{order.courierName || "Assigned"}</b>
          </p>
          <p>
            <span className="text-neutral-500">AWB:</span> <span className="font-mono">{sh.awb}</span>
          </p>
          <p>
            <span className="text-neutral-500">Status:</span> {sh.status || (sh.pickupBooked ? "Pickup booked" : "Courier assigned")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {sh.labelUrl && (
              <a href={sh.labelUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-950 px-3 text-sm font-semibold text-white">
                Print label <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button type="button" onClick={() => step("track")} disabled={!!busy} style={{ minHeight: 0 }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm hover:border-neutral-900 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${busy === "track" ? "animate-spin" : ""}`} /> Refresh tracking
            </button>
          </div>
        </div>
      ) : couriers ? (
        <div className="reveal-in mt-3 space-y-2">
          <p className="text-sm text-neutral-500">Choose a courier (prices from your Shiprocket account):</p>
          {couriers.length === 0 && <p className="text-sm text-rose-600">No courier delivers to this PIN code for this package.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
          {couriers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setPicked(c.id);
                step("ship", c.id).finally(() => setPicked(null));
              }}
              disabled={!!busy}
              style={{ minHeight: 0 }}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 text-left text-sm hover:border-neutral-900 disabled:opacity-50"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{c.name}</span>
                {c.etd && <span className="block text-xs text-neutral-500">Delivery by {c.etd}</span>}
              </span>
              <span className="shrink-0 font-semibold">{picked === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : rupees(c.rate)}</span>
            </button>
          ))}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-neutral-500">{sh ? "Sent to Shiprocket. Pick a courier to get the label and book pickup." : "Sends this order to your Shiprocket account and shows courier prices."}</p>
          <button
            type="button"
            onClick={() => step(sh ? "couriers" : "create")}
            disabled={!!busy}
            style={{ minHeight: 0 }}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            {sh ? "Choose courier" : "Ship with Shiprocket"}
          </button>
        </div>
      )}
      {error && <p className="reveal-in mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}

/* ------------------------------ WhatsApp updates ------------------------------ */

export function WhatsAppUpdates({ store, order }: { store: StoreData; order: OrderData }) {
  const link = getPublicStoreUrl(store.subdomain, `/order/${order.token}`);
  const usable = buyerWhatsAppLink(order.customer.phone, "x") !== "";
  if (!usable) return null;
  return (
    <div className={card}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <SectionIcon section="customers" icon={IChat} size="sm" /> WhatsApp the buyer
      </h3>
      <p className="mt-1 text-xs text-neutral-500">Opens WhatsApp with the message ready. Just press send.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BUYER_UPDATES.filter((u) => u.id !== "payment" || order.paymentStatus === "awaiting_verification" || order.paymentStatus === "cod_pending").map((u) => (
          <a
            key={u.id}
            href={buyerWhatsAppLink(order.customer.phone, buyerUpdateText(store, order, u.id, link))}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-2 text-center text-xs font-semibold hover:border-emerald-600 hover:text-emerald-700"
          >
            {u.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Invoice ------------------------------ */

export function InvoiceButton({ store, order }: { store: StoreData; order: OrderData }) {
  if (effectivePlan(store).planId !== "pro" || order.fulfilmentStatus === "cancelled") return null;
  return (
    <a
      href={`/invoice/${encodeURIComponent(store.subdomain)}/${encodeURIComponent(order.token)}`}
      target="_blank"
      rel="noreferrer"
      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold hover:border-neutral-900"
    >
      <FileText className="h-4 w-4" /> Invoice (PDF)
    </a>
  );
}
