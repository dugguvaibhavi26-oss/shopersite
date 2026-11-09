"use client";

import * as React from "react";
import { ArrowUp, Check, ChevronRight, HelpCircle, Pencil } from "lucide-react";
import { ISparkle } from "@/components/icons";
import type { StoreData } from "@/lib/store-service";
import type { DashPage } from "@/lib/assistant/commands";
import { hasAnyPolicy } from "@/lib/policies";

/**
 * Home, kept calm: a big black sales card, the assistant, and what needs doing. Lots of space,
 * nothing else. (Charts and details live on the Analytics page.)
 */

const DAY = 86400_000;
const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

const card = "rounded-[24px] border border-black/[0.06] bg-white p-6 sm:p-7";

/** A smooth area chart for the sales card (white on black). */
function AreaChart({ values }: { values: number[] }) {
  const w = 320;
  const h = 90;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 6 - (v / max) * (h - 16)] as const);
  const d = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="bento-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#bento-area)" />
      <path d={d} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function HomeBento({
  store,
  ownerName,
  greeting,
  shopClosed,
  closedMessage,
  onClosedMessage,
  onSaveClosedMessage,
  onToggleShop,
  onAsk,
  onNavigate,
  onTour,
}: {
  store: StoreData;
  ownerName: string;
  greeting: string;
  shopClosed: boolean;
  closedMessage: string;
  onClosedMessage: (v: string) => void;
  onSaveClosedMessage: () => void;
  onToggleShop: () => void;
  onAsk: (text: string) => void;
  onNavigate: (page: DashPage) => void;
  onTour: () => void;
}) {
  const [range, setRange] = React.useState<7 | 30>(30);
  const [text, setText] = React.useState("");

  /* the monthly goal, remembered in this browser */
  const goalKey = `bento:goal:${store.subdomain}`;
  const [goal, setGoal] = React.useState(0);
  const [editingGoal, setEditingGoal] = React.useState(false);
  const [goalDraft, setGoalDraft] = React.useState("");
  React.useEffect(() => {
    try {
      setGoal(Number(localStorage.getItem(goalKey)) || 0);
    } catch {
      // storage blocked
    }
  }, [goalKey]);
  const saveGoal = () => {
    const n = Math.max(0, Math.round(Number(goalDraft.replace(/[^0-9.]/g, "")) || 0));
    setGoal(n);
    try {
      localStorage.setItem(goalKey, String(n));
    } catch {
      // private mode
    }
    setEditingGoal(false);
  };

  const d = React.useMemo(() => {
    const now = Date.now();
    const orders = store.orders || [];
    const ok = orders.filter((o) => o.fulfilmentStatus !== "cancelled" && o.paymentStatus !== "rejected");
    const between = (from: number, to: number) => ok.filter((o) => {
      const t = Date.parse(o.createdAt);
      return t >= from && t < to;
    });
    const sum = (l: typeof ok) => l.reduce((n, o) => n + o.total, 0);
    const startToday = new Date().setHours(0, 0, 0, 0);
    const period = (days: number) => {
      const cur = between(now - days * DAY, now + DAY);
      const prev = between(now - 2 * days * DAY, now - days * DAY);
      return {
        sales: sum(cur),
        orders: cur.length,
        buyers: new Set(cur.map((o) => o.customer?.phone || o.customer?.name)).size,
        change: sum(prev) ? Math.round(((sum(cur) - sum(prev)) / sum(prev)) * 100) : null,
        series: Array.from({ length: days }, (_, i) => sum(between(startToday - (days - 1 - i) * DAY, startToday - (days - 2 - i) * DAY))),
      };
    };
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    const toShip = ok.filter((o) => ["placed", "confirmed", "packed"].includes(o.fulfilmentStatus) && o.paymentStatus !== "awaiting_verification").length;
    const todos: { title: string; count?: number; page: DashPage }[] = [];
    if (!hasAnyPolicy(store)) todos.push({ title: "Add a policy page", page: "policies" });
    if (!(store.products || []).length) todos.push({ title: "Add your first product", page: "products" });
    const pay = orders.filter((o) => o.paymentStatus === "awaiting_verification").length;
    if (pay) todos.push({ title: "Check payments", count: pay, page: "orders" });
    if (toShip) todos.push({ title: "Ship orders", count: toShip, page: "orders" });
    const ret = orders.filter((o) => o.returnRequest?.status === "requested").length;
    if (ret) todos.push({ title: "Answer returns", count: ret, page: "orders" });
    const rev = (store.reviews || []).filter((r) => r.status === "pending").length;
    if (rev) todos.push({ title: "Approve reviews", count: rev, page: "reviews" });
    const low = (store.products || []).filter((p) => p.status === "published" && p.stock <= 3).length;
    if (low) todos.push({ title: "Restock products", count: low, page: "products" });

    return { p7: period(7), p30: period(30), monthSales: sum(between(monthStart, now + DAY)), todos: todos.slice(0, 4) };
  }, [store]);

  const p = range === 7 ? d.p7 : d.p30;
  const first = ownerName.split(" ")[0];
  const goalPct = goal ? Math.min(1, d.monthSales / (goal * 100)) : 0;
  const monthName = new Date().toLocaleDateString("en-IN", { month: "long" });
  const ask = (q = text) => {
    const v = q.trim();
    if (!v) return;
    setText("");
    onAsk(v);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* header */}
      <div className="hero-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">
            {greeting}
            {first ? `, ${first}` : ""}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={!shopClosed}
            onClick={onToggleShop}
            style={{ minHeight: 0 }}
            className="inline-flex h-9 items-center gap-2.5 rounded-full border border-black/[0.06] bg-white pl-3.5 pr-1.5 text-sm font-medium"
          >
            <span className={`h-2 w-2 rounded-full ${shopClosed ? "bg-neutral-400" : "bg-emerald-500"}`} />
            {shopClosed ? "Shop closed" : "Shop open"}
            <span className={`relative h-6 w-10 rounded-full transition-colors ${shopClosed ? "bg-neutral-200" : "bg-neutral-950"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${shopClosed ? "left-0.5" : "left-[18px]"}`} />
            </span>
          </button>
          <button type="button" onClick={onTour} aria-label="Show me around" title="Show me around" style={{ minHeight: 0 }} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-white hover:text-neutral-900">
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {shopClosed && hasAnyPolicy(store) && (
        <label className="hero-rise -mt-2 flex items-center gap-3 rounded-2xl bg-neutral-950 px-4 py-3 text-white">
          <span className="shrink-0 text-sm font-medium">Buyers see:</span>
          <input
            value={closedMessage}
            onChange={(e) => onClosedMessage(e.target.value)}
            onBlur={onSaveClosedMessage}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            maxLength={160}
            placeholder="Back on Monday!"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />
        </label>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
        {/* SALES */}
        <section data-tour="stats" className="hero-rise relative flex min-h-[380px] flex-col overflow-hidden rounded-[24px] bg-neutral-950 p-6 text-white sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">Sales</span>
            <div className="inline-flex rounded-full bg-white/10 p-0.5 text-xs">
              {([7, 30] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRange(r)} style={{ minHeight: 0 }} className={`h-7 rounded-full px-3 font-medium transition-colors ${range === r ? "bg-white text-neutral-950" : "text-white/60 hover:text-white"}`}>
                  {r}D
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums sm:text-6xl">{rupees(p.sales)}</span>
            {p.change !== null && (
              <span className={`mb-1.5 text-sm font-medium ${p.change >= 0 ? "text-emerald-400" : "text-white/50"}`}>
                {p.change >= 0 ? "+" : ""}
                {p.change}%
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-white/45">
            {p.orders} order{p.orders === 1 ? "" : "s"} · {p.buyers} buyer{p.buyers === 1 ? "" : "s"} · last {range} days
          </p>
          <div className="-mx-1 mt-auto h-28 pt-6">
            <AreaChart values={p.series} />
          </div>

          {/* goal: one quiet line */}
          <div className="mt-5 border-t border-white/10 pt-4">
            {editingGoal ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveGoal();
                }}
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-white/50">{monthName} goal ₹</span>
                <input autoFocus value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} inputMode="numeric" placeholder="25000" aria-label="Monthly sales goal" className="w-28 border-b border-white/30 bg-transparent py-0.5 text-white outline-none" />
                <button type="submit" style={{ minHeight: 0 }} className="font-semibold">
                  Save
                </button>
              </form>
            ) : goal ? (
              <button type="button" onClick={() => { setGoalDraft(String(goal)); setEditingGoal(true); }} style={{ minHeight: 0 }} className="group block w-full text-left">
                <span className="flex items-center justify-between text-xs text-white/50">
                  <span>
                    {monthName} goal · {rupees(d.monthSales)} of ₹{goal.toLocaleString("en-IN")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {Math.round(goalPct * 100)}% <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </span>
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${Math.max(2, goalPct * 100)}%` }} />
                </span>
              </button>
            ) : (
              <button type="button" onClick={() => { setGoalDraft(""); setEditingGoal(true); }} style={{ minHeight: 0 }} className="text-xs text-white/50 hover:text-white">
                + Set a sales goal for {monthName}
              </button>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-5 lg:gap-6">
          {/* ASSISTANT */}
          <section style={{ animationDelay: "80ms" }} className={`hero-rise ${card}`}>
            <p className="flex items-center gap-2 text-base font-semibold">
              <ISparkle className="h-4 w-4" /> Ask your assistant
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask();
              }}
              className="mt-4 flex items-center gap-2 rounded-2xl bg-neutral-100 py-1.5 pl-4 pr-1.5 transition-shadow focus-within:shadow-[0_0_0_1px_#d4d4d4]"
            >
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Ask anything about your shop…" aria-label="Ask the assistant" className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-neutral-400" />
              <button type="submit" aria-label="Ask" style={{ minHeight: 0 }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["How's my week?", "How did my shop do this week?"],
                ["Write a description", "Write a short description for my newest product."],
                ["Suggest a coupon", "Suggest a coupon I should run this week and create it."],
              ].map(([l, q]) => (
                <button key={l} type="button" onClick={() => ask(q)} style={{ minHeight: 0 }} className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 ring-1 ring-black/[0.08] transition-colors hover:text-neutral-900 hover:ring-neutral-900">
                  {l}
                </button>
              ))}
            </div>
          </section>

          {/* TO DO */}
          <section style={{ animationDelay: "140ms" }} className={`hero-rise ${card} flex-1`}>
            <p className="text-base font-semibold">To do</p>
            {d.todos.length ? (
              <ul className="mt-3 divide-y divide-neutral-100">
                {d.todos.map((t) => (
                  <li key={t.title}>
                    <button type="button" onClick={() => onNavigate(t.page)} style={{ minHeight: 0 }} className="group flex w-full items-center gap-3 py-3 text-left text-[15px]">
                      <span className="flex-1 text-neutral-800">{t.title}</span>
                      {t.count !== undefined && <span className="text-sm tabular-nums text-neutral-400">{t.count}</span>}
                      <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-900" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
                <Check className="h-4 w-4 text-neutral-900" /> All caught up. Nothing waiting for you.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
