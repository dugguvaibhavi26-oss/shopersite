"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote, Boxes, Check, ChevronDown, Download, Headphones, ImagePlus, Loader2, LogOut, MapPin, MessagesSquare,
  Package, Phone, Plus, RefreshCw, Search, ShoppingBag, Truck, UserRound, X,
} from "lucide-react";
import { ShopperMark } from "@/components/brand/shopper-logo";
import { formatPaise } from "@/lib/utils";
import { passwordProblem, roleLabel, STAFF_ROLES, TAB_LABELS, type StaffRole, type StaffTab } from "@/lib/staff/roles";
import type { FinanceSummary, OrderAction, StaffCustomer, StaffOrder } from "@/lib/staff/views";
import type { ProductData } from "@/lib/store-service";
import { WorkplaceChat } from "./workplace-chat";

type Tab = StaffTab | "account";

interface Data {
  me: { id: string; name: string; email: string; role: StaffRole };
  store: { name: string; subdomain: string; logoUrl: string; storeCode: string };
  orders?: StaffOrder[];
  customers?: StaffCustomer[];
  summary?: FinanceSummary;
  products?: ProductData[];
  categories?: string[];
}

const TAB_ICONS: Record<Tab, React.ComponentType<{ className?: string }>> = {
  orders: ShoppingBag,
  products: Boxes,
  fulfilment: Truck,
  support: Headphones,
  finance: Banknote,
  workplace: MessagesSquare,
  account: UserRound,
};

const STATUS: Record<StaffOrder["fulfilmentStatus"], { label: string; cls: string }> = {
  placed: { label: "New", cls: "bg-indigo-50 text-indigo-700" },
  confirmed: { label: "Accepted", cls: "bg-sky-50 text-sky-700" },
  packed: { label: "Packed", cls: "bg-violet-50 text-violet-700" },
  shipped: { label: "Shipped", cls: "bg-amber-50 text-amber-700" },
  delivered: { label: "Delivered", cls: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", cls: "bg-rose-50 text-rose-700" },
};

const PAYMENT: Record<StaffOrder["paymentStatus"], string> = {
  awaiting_verification: "Payment being checked",
  verified: "Paid",
  paid: "Paid",
  cod_pending: "Cash on delivery",
  rejected: "Payment rejected",
};

const money = (paise?: number) => formatPaise(paise || 0, { hideDecimalsIfZero: true });
const day = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.replace("/staff/login");
    throw new Error("Please sign in again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data as T;
}

const card = "rounded-2xl border border-neutral-200 bg-white";
const btnDark = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-50";
const btnLight = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 hover:border-neutral-900 disabled:opacity-50";
const field = "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-neutral-900";

/** The dashboard a staff member sees: only the page for their role, plus WorkPlace and their account. */
export function StaffDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const d = await api<Data>("/api/staff/data");
      setData(d);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load. Try again.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signOut = async () => {
    await fetch("/api/staff/logout", { method: "POST" }).catch(() => {});
    router.replace("/staff/login");
  };

  if (!data) {
    return (
      <div className="home-sans flex min-h-screen items-center justify-center bg-[#f6f6f4] font-[Inter,sans-serif] text-neutral-950">
        {error ? (
          <div className="px-6 text-center">
            <p className="text-sm text-rose-700">{error}</p>
            <button type="button" onClick={load} style={{ minHeight: 0 }} className={`${btnDark} mt-4`}>
              Try again
            </button>
          </div>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        )}
      </div>
    );
  }

  const role = data.me.role;
  const tabs: Tab[] = [...STAFF_ROLES[role].tabs, "account"];
  const current: Tab = tab && tabs.includes(tab) ? tab : tabs[0];
  const label = (t: Tab) => (t === "account" ? "My account" : TAB_LABELS[t]);

  return (
    <div className="home-sans min-h-screen bg-[#f6f6f4] font-[Inter,sans-serif] text-neutral-950">
      {/* Computers: the black sidebar, as in the owner's dashboard */}
      <aside className="fixed bottom-3 left-3 top-3 z-30 hidden w-[232px] flex-col rounded-[24px] border border-white/[0.08] bg-[#171717] px-3 pb-4 pt-5 text-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/[0.08] px-2 pb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-neutral-950">
            {data.store.logoUrl ? <img src={data.store.logoUrl} alt="" className="h-full w-full object-cover" /> : <ShopperMark className="h-5 w-5" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{data.store.name}</span>
            <span className="block text-xs text-white/50">Store ID {data.store.storeCode}</span>
          </span>
        </div>
        <nav className="mt-3 flex-1 space-y-0.5">
          {tabs.map((t) => {
            const Icon = TAB_ICONS[t];
            const on = current === t;
            return (
              <button
                key={t}
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => setTab(t)}
                style={{ minHeight: 0 }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${on ? "bg-white font-semibold text-neutral-950" : "text-white/60 hover:bg-white/[0.08] hover:text-white"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label(t)}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/[0.08] px-2 pt-3">
          <p className="truncate text-sm font-semibold">{data.me.name}</p>
          <p className="truncate text-xs text-white/50">{roleLabel(role)}</p>
          <button type="button" onClick={signOut} style={{ minHeight: 0 }} className="mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Phones: a top bar and tabs along the bottom */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-950 text-white">
          {data.store.logoUrl ? <img src={data.store.logoUrl} alt="" className="h-full w-full object-cover" /> : <ShopperMark className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{data.store.name}</span>
          <span className="block truncate text-xs text-neutral-500">
            {data.me.name} · {roleLabel(role)}
          </span>
        </span>
        <button type="button" onClick={signOut} aria-label="Sign out" style={{ minHeight: 0 }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:ml-[256px] lg:max-w-none lg:px-8 lg:pb-10 lg:pt-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{label(current)}</h1>
            <p className="text-sm text-neutral-500">{current === "account" ? "Your sign-in details." : current === "workplace" ? "Talk to the owner and the rest of the team." : STAFF_ROLES[role].about}</p>
          </div>
          {current !== "workplace" && current !== "account" && (
            <button type="button" onClick={load} disabled={refreshing} style={{ minHeight: 0 }} className={btnLight}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          )}
        </div>

        {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {(current === "orders" || current === "fulfilment") && <OrdersView role={role} orders={data.orders || []} onChanged={load} />}
        {current === "support" && <SupportView orders={data.orders || []} customers={data.customers || []} />}
        {current === "finance" && <FinanceView orders={data.orders || []} summary={data.summary} storeName={data.store.subdomain} />}
        {current === "products" && <ProductsView products={data.products || []} categories={data.categories || []} onChanged={load} />}
        {current === "workplace" && <WorkplaceChat className="h-[calc(100dvh-240px)] min-h-[420px] lg:h-[calc(100dvh-170px)]" />}
        {current === "account" && <AccountView me={data.me} storeCode={data.store.storeCode} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tabs.map((t) => {
          const Icon = TAB_ICONS[t];
          const on = current === t;
          return (
            <button key={t} type="button" aria-current={on ? "page" : undefined} onClick={() => setTab(t)} style={{ minHeight: 0 }} className={`flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] ${on ? "font-semibold text-neutral-950" : "text-neutral-500"}`}>
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{t === "account" ? "Account" : t === "fulfilment" ? "Pack & ship" : t === "support" ? "Support" : label(t)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------------ orders */

function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          style={{ minHeight: 0 }}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${value === o.id ? "bg-neutral-950 font-semibold text-white" : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"}`}
        >
          {o.label}
          {o.count !== undefined && <span className={`ml-1.5 ${value === o.id ? "text-white/70" : "text-neutral-400"}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

function OrderCard({ order, role, onChanged, readOnly }: { order: StaffOrder; role: StaffRole; onChanged?: () => Promise<void> | void; readOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<"" | "reject" | "shipped">("");
  const [reason, setReason] = useState("");
  const [courierName, setCourierName] = useState(order.courierName || "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const s = STATUS[order.fulfilmentStatus];
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  const short = order.items.some((i) => typeof i.stock === "number" && i.stock < i.quantity);

  const run = async (action: OrderAction, extra: Record<string, string> = {}) => {
    setBusy(action);
    setError("");
    try {
      await api("/api/staff/orders", { id: order.id, action, ...extra });
      setForm("");
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setBusy("");
    }
  };

  const ACTION_LABEL: Record<OrderAction, string> = { accept: "Accept order", reject: "Reject", packed: "Mark packed", shipped: "Mark shipped", delivered: "Mark delivered" };

  return (
    <div className={card}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ minHeight: 0 }} className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">#{order.number}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
            {short && order.fulfilmentStatus === "placed" && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">Not enough stock</span>}
            {order.returnRequest && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Return {order.returnRequest.status}</span>}
          </span>
          <span className="mt-1 block truncate text-sm text-neutral-500">
            {order.customer.name || "Buyer"} · {units} {units === 1 ? "item" : "items"} · {day(order.createdAt)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          {order.total !== undefined && <span className="block text-sm font-semibold">{money(order.total)}</span>}
          {order.collect !== undefined && <span className="block text-sm font-semibold">Collect {money(order.collect)}</span>}
          <span className="block text-xs text-neutral-500">{PAYMENT[order.paymentStatus]}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-neutral-100 px-4 py-4 sm:px-5">
          <ul className="divide-y divide-neutral-100">
            {order.items.map((i, n) => (
              <li key={`${i.productId}-${n}`} className="flex items-center gap-3 py-2.5">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{i.title}</span>
                  <span className="block text-xs text-neutral-500">
                    {i.variantName ? `${i.variantName} · ` : ""}Qty {i.quantity}
                    {i.price !== undefined ? ` · ${money(i.price)} each` : ""}
                  </span>
                </span>
                {i.stock !== undefined && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${i.stock === null ? "bg-neutral-100 text-neutral-600" : i.stock < i.quantity ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {i.stock === null ? "Product removed" : `${i.stock} in stock`}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="grid gap-4 sm:grid-cols-2">
            {(order.address || order.customer.phone || order.customer.email) && (
              <div className="rounded-xl bg-neutral-50 p-3.5 text-sm">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">Buyer</p>
                <p className="font-medium">{order.customer.name}</p>
                {order.customer.phone && (
                  <a href={`tel:${order.customer.phone}`} className="mt-1 flex items-center gap-1.5 text-neutral-700 underline-offset-4 hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {order.customer.phone}
                  </a>
                )}
                {order.customer.email && <p className="mt-1 break-all text-neutral-700">{order.customer.email}</p>}
                {order.address && (
                  <p className="mt-1.5 flex gap-1.5 text-neutral-700">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {order.address.street}, {order.address.city}, {order.address.state} {order.address.pincode}
                    </span>
                  </p>
                )}
                {order.notes && <p className="mt-1.5 text-neutral-600">Note: {order.notes}</p>}
              </div>
            )}
            {order.total !== undefined && (
              <div className="rounded-xl bg-neutral-50 p-3.5 text-sm">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment</p>
                <dl className="space-y-1">
                  <Row k="Items" v={money(order.subtotal)} />
                  {!!order.discount && <Row k="Discount" v={`− ${money(order.discount)}`} />}
                  <Row k="Delivery" v={money(order.delivery)} />
                  {!!order.codFee && <Row k="Cash on delivery fee" v={money(order.codFee)} />}
                  <Row k="Total" v={money(order.total)} bold />
                  <Row k="Status" v={PAYMENT[order.paymentStatus]} />
                  {order.refund && <Row k={order.refund.status === "due" ? "Refund to pay" : "Refunded"} v={money(order.refund.amount)} />}
                </dl>
              </div>
            )}
            {(order.courierName || order.trackingNumber) && (
              <div className="rounded-xl bg-neutral-50 p-3.5 text-sm">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">Shipping</p>
                <p>{[order.courierName, order.trackingNumber].filter(Boolean).join(" · ")}</p>
                {order.trackingUrl && /^https?:\/\//.test(order.trackingUrl) && (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold underline underline-offset-4">
                    Track parcel
                  </a>
                )}
              </div>
            )}
            {order.fulfilmentStatus === "cancelled" && (
              <div className="rounded-xl bg-rose-50 p-3.5 text-sm text-rose-900">
                <p className="font-semibold">Cancelled{order.cancelledBy ? ` by the ${order.cancelledBy === "buyer" ? "buyer" : "store"}` : ""}</p>
                {order.cancelReason && <p className="mt-1">{order.cancelReason}</p>}
              </div>
            )}
            {order.returnRequest && (
              <div className="rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900">
                <p className="font-semibold">Return {order.returnRequest.status}</p>
                <p className="mt-1">{order.returnRequest.reason}</p>
              </div>
            )}
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          {!readOnly && order.actions.length > 0 && form === "" && (
            <div className="flex flex-wrap gap-2">
              {order.actions.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={!!busy}
                  onClick={() => (a === "reject" || a === "shipped" ? setForm(a) : run(a))}
                  style={{ minHeight: 0 }}
                  className={a === "reject" ? `${btnLight} !text-rose-700` : btnDark}
                >
                  {busy === a ? <Loader2 className="h-4 w-4 animate-spin" /> : a === "reject" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  {ACTION_LABEL[a]}
                </button>
              ))}
            </div>
          )}

          {form === "reject" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run("reject", { reason });
              }}
              className="space-y-3 rounded-xl border border-rose-200 p-3.5"
            >
              <label className="block text-sm font-semibold">
                Why is this order being rejected?
                <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} rows={2} required placeholder="Out of stock, wrong address…" className={`${field} mt-1.5 h-auto py-2.5 font-normal`} />
              </label>
              <p className="text-xs text-neutral-500">The buyer sees this reason. The stock goes back, and a refund is noted if the order was already paid.</p>
              <div className="flex gap-2">
                <button type="submit" disabled={!!busy || !reason.trim()} style={{ minHeight: 0 }} className={`${btnDark} !bg-rose-600 hover:!bg-rose-700`}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Reject order
                </button>
                <button type="button" onClick={() => setForm("")} style={{ minHeight: 0 }} className={btnLight}>
                  Back
                </button>
              </div>
            </form>
          )}

          {form === "shipped" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run("shipped", { courierName, trackingNumber, trackingUrl });
              }}
              className="space-y-3 rounded-xl border border-neutral-200 p-3.5"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Courier
                  <input value={courierName} onChange={(e) => setCourierName(e.target.value)} maxLength={80} placeholder="Delhivery, DTDC…" className={`${field} mt-1.5 font-normal`} />
                </label>
                <label className="block text-sm font-semibold">
                  Tracking number
                  <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} maxLength={80} className={`${field} mt-1.5 font-normal`} />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Tracking link (optional)
                <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} maxLength={300} placeholder="https://…" inputMode="url" className={`${field} mt-1.5 font-normal`} />
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={!!busy} style={{ minHeight: 0 }} className={btnDark}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Mark shipped
                </button>
                <button type="button" onClick={() => setForm("")} style={{ minHeight: 0 }} className={btnLight}>
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "font-semibold" : ""}`}>
      <dt className={bold ? "" : "text-neutral-600"}>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
      <Icon className="h-7 w-7 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500">{text}</p>
    </div>
  );
}

function OrdersView({ role, orders, onChanged }: { role: StaffRole; orders: StaffOrder[]; onChanged: () => Promise<void> }) {
  const packer = role === "fulfilment";
  type F = "todo" | "all" | StaffOrder["fulfilmentStatus"];
  const [filter, setFilter] = useState<F>("todo");
  const todo = (o: StaffOrder) => o.actions.length > 0 && (packer || o.fulfilmentStatus === "placed");
  const count = (st: StaffOrder["fulfilmentStatus"]) => orders.filter((o) => o.fulfilmentStatus === st).length;
  const options: { id: F; label: string; count?: number }[] = packer
    ? [
        { id: "todo", label: "To do", count: orders.filter(todo).length },
        { id: "confirmed", label: "To pack", count: count("confirmed") },
        { id: "packed", label: "To ship", count: count("packed") },
        { id: "shipped", label: "On the way", count: count("shipped") },
        { id: "delivered", label: "Delivered" },
      ]
    : [
        { id: "todo", label: "New", count: orders.filter(todo).length },
        { id: "confirmed", label: "Accepted", count: count("confirmed") },
        { id: "shipped", label: "Shipped" },
        { id: "delivered", label: "Delivered" },
        { id: "cancelled", label: "Cancelled" },
        { id: "all", label: "All" },
      ];
  const shown = orders.filter((o) => (filter === "all" ? true : filter === "todo" ? todo(o) : o.fulfilmentStatus === filter || (filter === "confirmed" && !packer && o.fulfilmentStatus === "packed")));

  return (
    <div className="space-y-3">
      <Chips value={filter} onChange={setFilter} options={options} />
      {shown.length === 0 ? (
        <Empty icon={Package} text={filter === "todo" ? "Nothing waiting for you right now." : "No orders here."} />
      ) : (
        shown.map((o) => <OrderCard key={o.id} order={o} role={role} onChanged={onChanged} />)
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ support */

function SupportView({ orders, customers }: { orders: StaffOrder[]; customers: StaffCustomer[] }) {
  const [view, setView] = useState<"orders" | "customers">("orders");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const foundOrders = useMemo(
    () =>
      !needle
        ? orders
        : orders.filter(
            (o) =>
              o.number.toLowerCase().includes(needle.replace(/^#/, "")) ||
              o.customer.name.toLowerCase().includes(needle) ||
              (o.customer.email || "").toLowerCase().includes(needle) ||
              (!!digits && (o.customer.phone || "").replace(/\D/g, "").includes(digits))
          ),
    [orders, needle, digits]
  );
  const foundCustomers = useMemo(
    () => (!needle ? customers : customers.filter((c) => c.name.toLowerCase().includes(needle) || (c.email || "").toLowerCase().includes(needle) || (!!digits && c.phone.replace(/\D/g, "").includes(digits)))),
    [customers, needle, digits]
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order number, name, phone or email" aria-label="Search" className={`${field} pl-10`} />
      </div>
      <Chips
        value={view}
        onChange={setView}
        options={[
          { id: "orders", label: "Orders", count: foundOrders.length },
          { id: "customers", label: "Customers", count: foundCustomers.length },
        ]}
      />
      {view === "orders" ? (
        foundOrders.length === 0 ? (
          <Empty icon={Package} text="No orders match." />
        ) : (
          foundOrders.slice(0, 100).map((o) => <OrderCard key={o.id} order={o} role="support" readOnly />)
        )
      ) : foundCustomers.length === 0 ? (
        <Empty icon={UserRound} text="No customers match." />
      ) : (
        <div className={`${card} divide-y divide-neutral-100`}>
          {foundCustomers.slice(0, 200).map((c) => (
            <div key={c.phone + c.name} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.name}</span>
                <span className="block truncate text-sm text-neutral-500">
                  {c.phone}
                  {c.email ? ` · ${c.email}` : ""}
                </span>
              </span>
              <span className="text-right text-sm">
                <span className="block font-semibold">
                  {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"} · {money(c.totalSpent)}
                </span>
                <span className="block text-xs text-neutral-500">Last order {day(c.lastOrderAt)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-neutral-500">You can look things up here but not change them. Ask in WorkPlace if an order needs changing.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ finance */

/** Spreadsheet-safe cell: quoted, and never starting with a character a spreadsheet would run as a formula. */
function csvCell(v: string | number | undefined): string {
  let s = v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s) && typeof v !== "number") s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function FinanceView({ orders, summary, storeName }: { orders: StaffOrder[]; summary?: FinanceSummary; storeName: string }) {
  type F = "all" | "paid" | "cod" | "awaiting" | "refunds";
  const [filter, setFilter] = useState<F>("all");
  const paid = (o: StaffOrder) => o.paymentStatus === "paid" || o.paymentStatus === "verified";
  const shown = orders.filter((o) =>
    filter === "all" ? true : filter === "paid" ? paid(o) : filter === "cod" ? o.paymentStatus === "cod_pending" && o.fulfilmentStatus !== "cancelled" : filter === "awaiting" ? o.paymentStatus === "awaiting_verification" : !!o.refund
  );

  const download = () => {
    const head = ["Order", "Date", "Buyer", "Order status", "Payment method", "Payment status", "Items total", "Discount", "Delivery", "COD fee", "Total", "Refund status", "Refund amount"];
    const rupees = (p?: number) => ((p || 0) / 100).toFixed(2);
    const lines = shown.map((o) =>
      [
        csvCell(o.number), csvCell(o.createdAt.slice(0, 10)), csvCell(o.customer.name), csvCell(STATUS[o.fulfilmentStatus].label), csvCell(o.paymentMethod), csvCell(PAYMENT[o.paymentStatus]),
        rupees(o.subtotal), rupees(o.discount), rupees(o.delivery), rupees(o.codFee), rupees(o.total), csvCell(o.refund?.status || ""), o.refund ? rupees(o.refund.amount) : "",
      ].join(",")
    );
    const blob = new Blob(["﻿" + [head.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storeName}-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const tiles = summary
    ? [
        { label: "Money received", value: money(summary.received), note: "Paid orders, not cancelled" },
        { label: "Cash on delivery to collect", value: money(summary.codPending), note: "Not collected yet" },
        { label: "Payments being checked", value: money(summary.awaiting), note: "Waiting to be confirmed" },
        { label: "Refunds to pay", value: money(summary.refundsDue), note: `${money(summary.refundsPaid)} refunded so far` },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={`${card} p-4`}>
            <p className="text-xs font-medium text-neutral-500">{t.label}</p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight">{t.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{t.note}</p>
          </div>
        ))}
      </div>
      {summary && (
        <p className="text-sm text-neutral-500">
          {summary.orders} {summary.orders === 1 ? "order" : "orders"} in total, {summary.cancelled} cancelled.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <Chips
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "All" },
              { id: "paid", label: "Paid" },
              { id: "cod", label: "Cash on delivery" },
              { id: "awaiting", label: "Being checked" },
              { id: "refunds", label: "Refunds" },
            ]}
          />
        </div>
        <button type="button" onClick={download} disabled={shown.length === 0} style={{ minHeight: 0 }} className={btnDark}>
          <Download className="h-4 w-4" /> Download CSV
        </button>
      </div>
      {shown.length === 0 ? (
        <Empty icon={Banknote} text="No payments here." />
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Buyer</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Refund</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {shown.slice(0, 300).map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <span className="font-semibold">#{o.number}</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[o.fulfilmentStatus].cls}`}>{STATUS[o.fulfilmentStatus].label}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{day(o.createdAt)}</td>
                  <td className="px-4 py-3">{o.customer.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{PAYMENT[o.paymentStatus]}</td>
                  <td className="px-4 py-3 text-neutral-700">{o.refund ? `${o.refund.status === "due" ? "To pay" : "Paid"} ${money(o.refund.amount)}` : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ products */

interface Draft {
  id?: string;
  title: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  category: string;
  images: string[];
  status: ProductData["status"];
}

const toDraft = (p?: ProductData, firstCategory = ""): Draft => ({
  id: p?.id,
  title: p?.title || "",
  description: p?.description || "",
  price: p ? String(p.price / 100) : "",
  compareAtPrice: p?.compareAtPrice ? String(p.compareAtPrice / 100) : "",
  stock: p ? String(p.stock) : "",
  category: p?.category || firstCategory,
  images: p?.images || [],
  status: p?.status || "published",
});

function ProductsView({ products, categories, onChanged }: { products: ProductData[]; categories: string[]; onChanged: () => Promise<void> }) {
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? products.filter((p) => p.title.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle)) : products;

  const upload = async (files: FileList | null) => {
    if (!files?.length || !draft) return;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 8 - draft.images.length)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/staff/upload", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not upload that photo.");
        urls.push(data.url);
      }
      setDraft((d) => (d ? { ...d, images: [...d.images, ...urls].slice(0, 8) } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that photo.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const price = Math.round(Number(draft.price) * 100);
    const compare = draft.compareAtPrice ? Math.round(Number(draft.compareAtPrice) * 100) : 0;
    const stock = Number(draft.stock);
    if (!Number.isFinite(price) || price <= 0) return setError("Enter the price in rupees.");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number, 0 or more.");
    setBusy(true);
    setError("");
    try {
      await api("/api/staff/products", {
        ...(draft.id ? { id: draft.id } : {}),
        title: draft.title,
        description: draft.description,
        price,
        ...(compare ? { compareAtPrice: compare } : {}),
        stock,
        category: draft.category,
        images: draft.images,
        status: draft.status,
      });
      setDraft(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (draft) {
    const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
    const cats = draft.category && !categories.includes(draft.category) ? [draft.category, ...categories] : categories;
    return (
      <form onSubmit={save} className={`${card} max-w-2xl space-y-4 p-5 sm:p-6`}>
        <h2 className="text-lg font-semibold">{draft.id ? "Edit product" : "Add a product"}</h2>
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <label className="block text-sm font-semibold">
          Name
          <input value={draft.title} onChange={(e) => set({ title: e.target.value })} required maxLength={140} className={`${field} mt-1.5 font-normal`} />
        </label>
        <label className="block text-sm font-semibold">
          Description
          <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} rows={4} maxLength={5000} className={`${field} mt-1.5 h-auto py-2.5 font-normal`} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold">
            Price (₹)
            <input value={draft.price} onChange={(e) => set({ price: e.target.value })} required inputMode="decimal" className={`${field} mt-1.5 font-normal`} />
          </label>
          <label className="block text-sm font-semibold">
            Price before discount (₹)
            <input value={draft.compareAtPrice} onChange={(e) => set({ compareAtPrice: e.target.value })} inputMode="decimal" placeholder="Optional" className={`${field} mt-1.5 font-normal`} />
          </label>
          <label className="block text-sm font-semibold">
            Stock
            <input value={draft.stock} onChange={(e) => set({ stock: e.target.value.replace(/\D/g, "") })} required inputMode="numeric" className={`${field} mt-1.5 font-normal`} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Category
            <select value={draft.category} onChange={(e) => set({ category: e.target.value })} required className={`${field} mt-1.5 font-normal`}>
              {!draft.category && <option value="">Choose a category</option>}
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Shown in the store?
            <select value={draft.status} onChange={(e) => set({ status: e.target.value as Draft["status"] })} className={`${field} mt-1.5 font-normal`}>
              <option value="published">Yes, buyers can see it</option>
              <option value="draft">No, still a draft</option>
              <option value="hidden">No, hidden</option>
            </select>
          </label>
        </div>
        {categories.length === 0 && <p className="text-sm text-amber-700">The store has no categories yet. Ask the owner in WorkPlace to add one.</p>}
        <div>
          <p className="text-sm font-semibold">Photos</p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {draft.images.map((u) => (
              <span key={u} className="relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button type="button" aria-label="Remove photo" onClick={() => set({ images: draft.images.filter((x) => x !== u) })} style={{ minHeight: 0 }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {draft.images.length < 8 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-300 text-xs text-neutral-500 hover:border-neutral-900 hover:text-neutral-900">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                Add photo
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={uploading} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">JPG, PNG or WebP, up to 4 MB each. Up to 8 photos.</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={busy || uploading} style={{ minHeight: 0 }} className={btnDark}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save product
          </button>
          <button type="button" onClick={() => { setDraft(null); setError(""); }} style={{ minHeight: 0 }} className={btnLight}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" className={`${field} pl-10`} />
        </div>
        <button type="button" onClick={() => { setError(""); setDraft(toDraft(undefined, categories[0])); }} style={{ minHeight: 0 }} className={`${btnDark} h-11`}>
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>
      {shown.length === 0 ? (
        <Empty icon={Boxes} text={products.length ? "No products match." : "No products yet. Add the first one."} />
      ) : (
        <div className={`${card} divide-y divide-neutral-100`}>
          {shown.map((p) => (
            <button key={p.id} type="button" onClick={() => { setError(""); setDraft(toDraft(p)); }} style={{ minHeight: 0 }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 sm:px-5">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">{p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.title}</span>
                <span className="block truncate text-xs text-neutral-500">
                  {p.category} · {p.status === "published" ? "In the store" : p.status === "draft" ? "Draft" : "Hidden"}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold">{money(p.price)}</span>
                <span className={`block text-xs ${p.stock <= 0 ? "font-semibold text-rose-700" : p.stock <= 5 ? "font-semibold text-amber-700" : "text-neutral-500"}`}>{p.stock <= 0 ? "Sold out" : `${p.stock} in stock`}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ account */

function AccountView({ me, storeCode }: { me: Data["me"]; storeCode: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setDone(false);
    const problem = passwordProblem(next);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      await api("/api/staff/password", { current, next });
      setCurrent("");
      setNext("");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className={`${card} p-5 sm:p-6`}>
        <dl className="space-y-3 text-sm">
          <Row k="Name" v={me.name} />
          <Row k="Email" v={me.email} />
          <Row k="Role" v={roleLabel(me.role)} />
          <Row k="Store ID" v={storeCode} />
        </dl>
        <p className="mt-4 text-xs text-neutral-500">Only the store owner can change your name, email or role.</p>
      </div>
      <form onSubmit={save} className={`${card} space-y-4 p-5 sm:p-6`}>
        <h2 className="text-base font-semibold">Change your password</h2>
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {done && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Password changed.</p>}
        <label className="block text-sm font-semibold">
          Current password
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required className={`${field} mt-1.5 font-normal`} />
        </label>
        <label className="block text-sm font-semibold">
          New password
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} maxLength={72} className={`${field} mt-1.5 font-normal`} />
          <span className="mt-1 block text-xs font-normal text-neutral-500">At least 8 characters.</span>
        </label>
        <button type="submit" disabled={busy} style={{ minHeight: 0 }} className={btnDark}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Change password
        </button>
      </form>
    </div>
  );
}
