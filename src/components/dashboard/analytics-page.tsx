"use client";

import * as React from "react";
import { Download } from "lucide-react";
import type { OrderData, StoreData } from "@/lib/store-service";

/**
 * Analytics: every number about the shop in one place, for a chosen period, with a comparison to
 * the period before. Everything is worked out in the browser from the shop's own orders.
 */

const DAY = 86400_000;
const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const short = (paise: number) => {
  const r = paise / 100;
  return r >= 100000 ? `₹${(r / 100000).toFixed(1)}L` : r >= 1000 ? `₹${(r / 1000).toFixed(1)}K` : `₹${Math.round(r)}`;
};
const pct = (n: number) => `${Math.round(n * 100)}%`;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PAY_LABEL: Record<string, string> = { upi: "UPI", cod: "Cash on delivery", razorpay: "Online (Razorpay)", cashfree: "Online (Cashfree)", bank_transfer: "Bank transfer" };
const STATUS: { id: OrderData["fulfilmentStatus"]; label: string; color: string }[] = [
  { id: "placed", label: "New", color: "#d4d4d4" },
  { id: "confirmed", label: "Confirmed", color: "#a3a3a3" },
  { id: "packed", label: "Packed", color: "#737373" },
  { id: "shipped", label: "Shipped", color: "#6366f1" },
  { id: "delivered", label: "Delivered", color: "#10b981" },
  { id: "cancelled", label: "Cancelled", color: "#f43f5e" },
];
/** black and greys first, with two soft colours last, so colour adds meaning without taking over */
const ACCENT = "#171717";
const PALETTE = ["#171717", "#525252", "#a3a3a3", "#d4d4d4", "#a7f3d0", "#fde68a"];

type Range = 7 | 30 | 90 | 365 | 0;
const RANGES: { id: Range; label: string }[] = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
  { id: 365, label: "12 months" },
  { id: 0, label: "All time" },
];

/* ------------------------------ charts ------------------------------ */

function TrendChart({ points, format }: { points: { label: string; value: number }[]; format: (n: number) => string }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const w = 720;
  const h = 220;
  const pad = { l: 8, r: 8, t: 16, b: 26 };
  const max = Math.max(...points.map((p) => p.value), 1);
  const xy = points.map((p, i) => [pad.l + (i / Math.max(1, points.length - 1)) * (w - pad.l - pad.r), pad.t + (1 - p.value / max) * (h - pad.t - pad.b)] as const);
  const line = xy.reduce((acc, [x, y], i) => {
    if (!i) return `M${x},${y}`;
    const [px, py] = xy[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");
  const every = Math.ceil(points.length / 7);
  const hp = hover !== null ? xy[hover] : null;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * w;
          setHover(Math.max(0, Math.min(points.length - 1, Math.round(((x - pad.l) / (w - pad.l - pad.r)) * (points.length - 1)))));
        }}
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id="an-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={ACCENT} stopOpacity="0.18" />
            <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad.l} x2={w - pad.r} y1={pad.t + (1 - f) * (h - pad.t - pad.b)} y2={pad.t + (1 - f) * (h - pad.t - pad.b)} stroke="#f0f0f0" />
        ))}
        {xy.length > 1 && <path d={`${line} L${xy[xy.length - 1][0]},${h - pad.b} L${xy[0][0]},${h - pad.b} Z`} fill="url(#an-area)" />}
        <path d={line} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
        {points.map((p, i) =>
          i % every === 0 || i === points.length - 1 ? (
            <text key={i} x={xy[i][0]} y={h - 6} textAnchor="middle" fontSize="11" fill="#a3a3a3">
              {p.label}
            </text>
          ) : null
        )}
        {hp && (
          <>
            <line x1={hp[0]} x2={hp[0]} y1={pad.t} y2={h - pad.b} stroke="#d4d4d4" strokeDasharray="3 3" />
            <circle cx={hp[0]} cy={hp[1]} r="5" fill={ACCENT} stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>
      {hover !== null && hp && (
        <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-neutral-950 px-2.5 py-1.5 text-xs text-white shadow-lg" style={{ left: `${(hp[0] / w) * 100}%` }}>
          <span className="block text-white/60">{points[hover].label}</span>
          <span className="font-semibold tabular-nums">{format(points[hover].value)}</span>
        </div>
      )}
    </div>
  );
}

function Donut({ parts, center }: { parts: { label: string; value: number; color: string }[]; center: React.ReactNode }) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#f3f3f3" strokeWidth="16" />
          {parts.map((p) => {
            const len = (p.value / total) * c;
            const el = <circle key={p.label} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="min-w-0 flex-1 truncate text-neutral-600">{p.label}</span>
            <span className="font-semibold tabular-nums">{p.value}</span>
            <span className="w-10 text-right text-xs tabular-nums text-neutral-400">{pct(p.value / total)}</span>
          </li>
        ))}
        {!parts.length && <li className="text-sm text-neutral-400">No data yet</li>}
      </ul>
    </div>
  );
}

function Bars({ rows, format }: { rows: { label: string; value: number; sub?: string }[]; format: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="py-6 text-center text-sm text-neutral-400">No data for this period</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-neutral-700">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {format(r.value)}
              {r.sub && <span className="ml-1.5 text-xs font-normal text-neutral-400">{r.sub}</span>}
            </span>
          </div>
          <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-neutral-100">
            <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(3, (r.value / max) * 100)}%`, background: PALETTE[i % PALETTE.length] }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Columns({ cols, highlight }: { cols: { label: string; value: number }[]; highlight?: boolean }) {
  const max = Math.max(...cols.map((c) => c.value), 1);
  const top = cols.reduce((b, c, i) => (c.value > cols[b].value ? i : b), 0);
  return (
    <div className="flex h-40 items-end gap-1.5">
      {cols.map((c, i) => (
        <div key={c.label + i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] tabular-nums text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100">{c.value}</span>
          <span className="w-full rounded-t-md transition-all duration-500" style={{ height: `${Math.max(3, (c.value / max) * 100)}%`, background: highlight && i === top && c.value ? ACCENT : "#e0e7ff" }} />
          <span className="text-[10px] text-neutral-400">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ page ------------------------------ */

const card = "rounded-[24px] bg-white p-5 ring-1 ring-black/[0.04] sm:p-6";
const title = "text-sm font-semibold";

export function AnalyticsPage({ store }: { store: StoreData }) {
  const [range, setRange] = React.useState<Range>(30);
  const [metric, setMetric] = React.useState<"revenue" | "orders">("revenue");

  const a = React.useMemo(() => {
    const now = Date.now();
    const all = store.orders || [];
    const first = all.reduce((m, o) => Math.min(m, Date.parse(o.createdAt) || now), now);
    const days = range || Math.max(1, Math.ceil((now - first) / DAY) + 1);
    const from = now - days * DAY;
    const inRange = all.filter((o) => Date.parse(o.createdAt) >= from);
    const prev = all.filter((o) => {
      const t = Date.parse(o.createdAt);
      return t >= from - days * DAY && t < from;
    });
    const valid = (l: OrderData[]) => l.filter((o) => o.fulfilmentStatus !== "cancelled" && o.paymentStatus !== "rejected");
    const cur = valid(inRange);
    const before = valid(prev);
    const sum = (l: OrderData[]) => l.reduce((n, o) => n + o.total, 0);
    const buyerKey = (o: OrderData) => o.customer?.phone || o.customer?.name || o.id;
    const buyers = (l: OrderData[]) => new Set(l.map(buyerKey)).size;
    const items = (l: OrderData[]) => l.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0);

    // repeat buyers: ordered more than once in the period
    const countBy = new Map<string, number>();
    cur.forEach((o) => countBy.set(buyerKey(o), (countBy.get(buyerKey(o)) || 0) + 1));
    const repeat = [...countBy.values()].filter((n) => n > 1).length;
    // new vs returning: did they order before this period?
    const earlier = new Set(all.filter((o) => Date.parse(o.createdAt) < from).map(buyerKey));
    const returning = [...countBy.keys()].filter((k) => earlier.has(k)).length;

    const change = (now_: number, then: number) => (then ? (now_ - then) / then : now_ ? null : 0);

    // trend: by day (up to 90 days) or by month
    const byMonth = days > 92;
    const buckets: { label: string; value: number; orders: number }[] = [];
    if (byMonth) {
      const months = Math.min(24, Math.ceil(days / 30));
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        const list = cur.filter((o) => {
          const t = new Date(o.createdAt);
          return t.getMonth() === m && t.getFullYear() === y;
        });
        buckets.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), value: sum(list), orders: list.length });
      }
    } else {
      const start = new Date().setHours(0, 0, 0, 0);
      for (let i = days - 1; i >= 0; i--) {
        const s = start - i * DAY;
        const list = cur.filter((o) => {
          const t = Date.parse(o.createdAt);
          return t >= s && t < s + DAY;
        });
        buckets.push({ label: new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: sum(list), orders: list.length });
      }
    }

    // products & categories
    const prodMap = new Map<string, { label: string; units: number; revenue: number }>();
    const catMap = new Map<string, number>();
    cur.forEach((o) =>
      o.items.forEach((it) => {
        const p = prodMap.get(it.productId) || { label: it.title, units: 0, revenue: 0 };
        p.units += it.quantity;
        p.revenue += it.price * it.quantity;
        prodMap.set(it.productId, p);
        const cat = (store.products || []).find((x) => x.id === it.productId)?.category || "Other";
        catMap.set(cat, (catMap.get(cat) || 0) + it.price * it.quantity);
      })
    );

    // places
    const stateMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    cur.forEach((o) => {
      const st = (o.address?.state || "").trim();
      const ct = (o.address?.city || "").trim();
      if (st) stateMap.set(st, (stateMap.get(st) || 0) + 1);
      if (ct) cityMap.set(ct, (cityMap.get(ct) || 0) + 1);
    });

    // payments & status
    const payMap = new Map<string, number>();
    cur.forEach((o) => payMap.set(o.paymentMethod, (payMap.get(o.paymentMethod) || 0) + 1));
    const statusCount = STATUS.map((s) => ({ ...s, value: inRange.filter((o) => o.fulfilmentStatus === s.id).length }));

    // timing
    const dow = DOW.map((label, i) => ({ label, value: cur.filter((o) => new Date(o.createdAt).getDay() === i).length }));
    const hours = Array.from({ length: 24 }, (_, h) => cur.filter((o) => new Date(o.createdAt).getHours() === h).length);

    // discounts, returns, delivery, reviews
    const discountGiven = cur.reduce((n, o) => n + (o.discount || 0), 0);
    const withCoupon = cur.filter((o) => (o.discount || 0) > 0).length;
    const cancelled = inRange.filter((o) => o.fulfilmentStatus === "cancelled").length;
    const returns = inRange.filter((o) => o.returnRequest).length;
    const delivered = cur.filter((o) => o.deliveredAt);
    const avgDeliveryDays = delivered.length ? delivered.reduce((n, o) => n + (Date.parse(o.deliveredAt!) - Date.parse(o.createdAt)) / DAY, 0) / delivered.length : 0;
    const deliveryFees = cur.reduce((n, o) => n + (o.delivery || 0), 0);
    const reviews = (store.reviews || []).filter((r) => Date.parse(r.createdAt) >= from);
    const rating = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;

    return {
      days,
      byMonth,
      kpis: [
        { label: "Revenue", value: rupees(sum(cur)), change: change(sum(cur), sum(before)) },
        { label: "Orders", value: String(cur.length), change: change(cur.length, before.length) },
        { label: "Avg. order", value: cur.length ? rupees(sum(cur) / cur.length) : "₹0", change: change(cur.length ? sum(cur) / cur.length : 0, before.length ? sum(before) / before.length : 0) },
        { label: "Buyers", value: String(buyers(cur)), change: change(buyers(cur), buyers(before)) },
        { label: "Items sold", value: String(items(cur)), change: change(items(cur), items(before)) },
        { label: "Repeat buyers", value: buyers(cur) ? pct(repeat / buyers(cur)) : "0%", change: null as number | null },
      ],
      buckets,
      products: [...prodMap.values()].sort((x, y) => y.revenue - x.revenue).slice(0, 8),
      categories: [...catMap.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([label, value]) => ({ label, value })),
      states: [...stateMap.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([label, value]) => ({ label, value })),
      cities: [...cityMap.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([label, value]) => ({ label, value })),
      payments: [...payMap.entries()].sort((x, y) => y[1] - x[1]).map(([k, v], i) => ({ label: PAY_LABEL[k] || k, value: v, color: PALETTE[i % PALETTE.length] })),
      statusCount,
      dow,
      hours,
      buyersNew: buyers(cur) - returning,
      buyersReturning: returning,
      discountGiven,
      withCoupon,
      cancelRate: inRange.length ? cancelled / inRange.length : 0,
      returnRate: inRange.length ? returns / inRange.length : 0,
      avgDeliveryDays,
      deliveryFees,
      rating,
      reviewCount: reviews.length,
      cur,
    };
  }, [store, range]);

  const downloadCsv = () => {
    const rows = [
      ["Order", "Date", "Buyer", "City", "State", "Items", "Subtotal", "Discount", "Delivery", "Total", "Payment", "Payment status", "Status"],
      ...a.cur.map((o) => [
        o.number,
        new Date(o.createdAt).toLocaleString("en-IN"),
        o.customer?.name || "",
        o.address?.city || "",
        o.address?.state || "",
        o.items.map((i) => `${i.quantity}x ${i.title}`).join("; "),
        (o.subtotal / 100).toFixed(2),
        ((o.discount || 0) / 100).toFixed(2),
        ((o.delivery || 0) / 100).toFixed(2),
        (o.total / 100).toFixed(2),
        o.paymentMethod,
        o.paymentStatus,
        o.fulfilmentStatus,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${store.subdomain}-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const trend = a.buckets.map((b) => ({ label: b.label, value: metric === "revenue" ? b.value : b.orders }));
  const maxHour = Math.max(...a.hours, 1);

  return (
    <div className="space-y-4">
      {/* period */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-white p-1 text-sm ring-1 ring-black/[0.05]">
          {RANGES.map((r) => (
            <button key={r.id} type="button" onClick={() => setRange(r.id)} style={{ minHeight: 0 }} className={`h-8 rounded-full px-3.5 font-medium transition-colors ${range === r.id ? "bg-neutral-950 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
              {r.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={downloadCsv} disabled={!a.cur.length} style={{ minHeight: 0 }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium ring-1 ring-black/[0.05] hover:ring-neutral-900 disabled:opacity-40">
          <Download className="h-4 w-4" /> Download orders (CSV)
        </button>
      </div>

      {/* KPIs */}
      <div className="m-stagger grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {a.kpis.map((k, i) => (
          <div key={k.label} className={`rounded-[24px] p-4 ${i === 0 ? "col-span-2 bg-neutral-950 text-white md:col-span-1" : "bg-white ring-1 ring-black/[0.04]"}`}>
            <p className={`flex items-center gap-1.5 text-xs ${i === 0 ? "font-medium text-white/60" : "text-neutral-500"}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: PALETTE[Math.min(i, 3)] }} />
              {k.label}
            </p>
            <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">{k.value}</p>
            {k.change !== null && (
              <p className={`mt-0.5 text-xs font-medium ${k.change >= 0 ? (i === 0 ? "text-lime-200" : "text-emerald-600") : i === 0 ? "text-rose-300" : "text-rose-500"}`}>
                {k.change >= 0 ? "▲" : "▼"} {Math.abs(Math.round(k.change * 100))}% <span className="font-normal text-neutral-400">vs before</span>
              </p>
            )}
            {k.change === null && k.label !== "Repeat buyers" && <p className="mt-0.5 text-xs text-neutral-400">New this period</p>}
            {k.label === "Repeat buyers" && <p className="mt-0.5 text-xs text-neutral-400">ordered 2+ times</p>}
          </div>
        ))}
      </div>

      {/* trend */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={title}>{metric === "revenue" ? "Revenue" : "Orders"} over time</p>
            <p className="text-xs text-neutral-500">{a.byMonth ? "By month" : "By day"} · hover to see each {a.byMonth ? "month" : "day"}</p>
          </div>
          <div className="inline-flex rounded-full bg-neutral-100 p-0.5 text-xs">
            {(["revenue", "orders"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMetric(m)} style={{ minHeight: 0 }} className={`h-7 rounded-full px-3 font-medium capitalize ${metric === m ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <TrendChart points={trend} format={(n) => (metric === "revenue" ? rupees(n) : `${n} order${n === 1 ? "" : "s"}`)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className={title}>Top products</p>
          <p className="mb-4 text-xs text-neutral-500">By revenue, with units sold</p>
          <Bars rows={a.products.map((p) => ({ label: p.label, value: p.revenue, sub: `${p.units} sold` }))} format={short} />
        </div>
        <div className={card}>
          <p className={title}>Sales by category</p>
          <p className="mb-4 text-xs text-neutral-500">Revenue from each category</p>
          <Bars rows={a.categories} format={short} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={card}>
          <p className={title}>Order status</p>
          <p className="mb-4 text-xs text-neutral-500">Where your orders are now</p>
          <Donut
            parts={a.statusCount.filter((s) => s.value).map((s) => ({ label: s.label, value: s.value, color: s.color }))}
            center={
              <>
                <span className="text-2xl font-semibold tabular-nums">{a.statusCount.reduce((n, s) => n + s.value, 0)}</span>
                <span className="text-[11px] text-neutral-400">orders</span>
              </>
            }
          />
        </div>
        <div className={card}>
          <p className={title}>How buyers pay</p>
          <p className="mb-4 text-xs text-neutral-500">Orders by payment method</p>
          <Donut
            parts={a.payments}
            center={
              <>
                <span className="text-2xl font-semibold tabular-nums">{a.cur.length}</span>
                <span className="text-[11px] text-neutral-400">paid orders</span>
              </>
            }
          />
        </div>
        <div className={card}>
          <p className={title}>New vs returning buyers</p>
          <p className="mb-4 text-xs text-neutral-500">Returning = ordered before this period</p>
          <Donut
            parts={[
              { label: "New buyers", value: a.buyersNew, color: "#4f46e5" },
              { label: "Returning", value: a.buyersReturning, color: "#10b981" },
            ].filter((p) => p.value)}
            center={
              <>
                <span className="text-2xl font-semibold tabular-nums">{a.buyersNew + a.buyersReturning}</span>
                <span className="text-[11px] text-neutral-400">buyers</span>
              </>
            }
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className={title}>Best days to sell</p>
          <p className="mb-4 text-xs text-neutral-500">Orders by day of the week</p>
          <Columns cols={a.dow} highlight />
        </div>
        <div className={card}>
          <p className={title}>Busiest hours</p>
          <p className="mb-4 text-xs text-neutral-500">When orders come in (darker = more orders)</p>
          <div className="grid grid-cols-12 gap-1.5">
            {a.hours.map((n, h) => (
              <div key={h} className="text-center">
                <span title={`${h}:00 · ${n} order${n === 1 ? "" : "s"}`} className="block aspect-square rounded-md" style={{ background: n ? `rgba(79,70,229,${0.14 + (n / maxHour) * 0.86})` : "#f4f4f5" }} />
                <span className="mt-1 block text-[10px] text-neutral-400">{h % 3 === 0 ? (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`) : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className={title}>Top states</p>
          <p className="mb-4 text-xs text-neutral-500">Where your orders go</p>
          <Bars rows={a.states} format={(n) => `${n} order${n === 1 ? "" : "s"}`} />
        </div>
        <div className={card}>
          <p className={title}>Top cities</p>
          <p className="mb-4 text-xs text-neutral-500">Plan delivery and local offers</p>
          <Bars rows={a.cities} format={(n) => `${n} order${n === 1 ? "" : "s"}`} />
        </div>
      </div>

      {/* operations */}
      <div className={card}>
        <p className={title}>Operations</p>
        <p className="mb-4 text-xs text-neutral-500">Discounts, delivery, returns and reviews in this period</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          {[
            { k: "Discounts given", v: rupees(a.discountGiven), s: `${a.withCoupon} order${a.withCoupon === 1 ? "" : "s"} used a coupon` },
            { k: "Delivery fees collected", v: rupees(a.deliveryFees), s: "charged to buyers" },
            { k: "Avg. time to deliver", v: a.avgDeliveryDays ? `${a.avgDeliveryDays.toFixed(1)} days` : "—", s: "order to delivered" },
            { k: "Cancellation rate", v: pct(a.cancelRate), s: "of all orders" },
            { k: "Return rate", v: pct(a.returnRate), s: "orders with a return request" },
            { k: "Average rating", v: a.reviewCount ? `${a.rating.toFixed(1)} ★` : "—", s: `${a.reviewCount} review${a.reviewCount === 1 ? "" : "s"}` },
            { k: "Products listed", v: String((store.products || []).filter((p) => p.status === "published").length), s: `${(store.products || []).filter((p) => p.stock <= 0).length} out of stock` },
            { k: "Customers in total", v: String(store.customers?.length || 0), s: "all time" },
          ].map((m) => (
            <div key={m.k}>
              <p className="text-xs text-neutral-500">{m.k}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{m.v}</p>
              <p className="text-[11px] text-neutral-400">{m.s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
