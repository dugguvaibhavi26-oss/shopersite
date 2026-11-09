"use client";

import * as React from "react";
import { ArrowRight, ArrowUp, ChevronLeft, ChevronRight, HelpCircle, ImageIcon, Play } from "lucide-react";
import { RoxyLogo } from "@/components/roxy-logo";
import { Modal } from "@/components/ui/modal";
import { FadeScroll } from "@/components/ui/fade-scroll";
import type { StoreData } from "@/lib/store-service";
import type { DashPage } from "@/lib/assistant/commands";
import { hasAnyPolicy } from "@/lib/policies";
import { DISCOVER_DEFAULTS, EXPLORE_IDS, type HeroSlide } from "@/lib/discover";
import { useDiscoverData } from "@/lib/discover-client";
import { HomeDiscover } from "./home-discover";
import { HomeGrowth, type GrowthTab } from "./home-growth";
import { TUTORIALS, type Tutorial } from "./tutorials";

/**
 * Home: a featured image banner, a big chat box for the assistant, a clear Today card, then rows of
 * ideas (picked for you, explore, tutorials). Banner images and cards are set in Admin →
 * Discover cards; their links can point to docs pages.
 */

const DAY = 86400_000;
const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const short = (paise: number) => {
  const r = paise / 100;
  return r >= 100000 ? `₹${(r / 100000).toFixed(1)}L` : r >= 1000 ? `₹${(r / 1000).toFixed(1)}K` : `₹${Math.round(r)}`;
};
const rowScroll = "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/* ------------------------------ banner ------------------------------ */

/** Example slides shown until the admin adds their own (Admin → Discover cards → Banner slides). */
const EXAMPLE_SLIDES: HeroSlide[] = [
  { id: "example-welcome", title: "Your shop, beautifully simple", text: "", imageUrl: "/banners/welcome.svg", tag: "", ctaLabel: "", link: "", enabled: true },
  { id: "example-season", title: "Make this season your best yet", text: "", imageUrl: "/banners/season.svg", tag: "", ctaLabel: "", link: "", enabled: true },
];

function HeroBanner({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const n = slides.length;
  React.useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), 6000);
    return () => clearTimeout(t);
  }, [i, paused, n]);
  const open = (s: HeroSlide) => {
    if (!s.link) return;
    if (s.link.startsWith("/")) window.location.assign(s.link);
    else window.open(s.link, "_blank", "noopener,noreferrer");
  };

  // nothing set yet: a clean image placeholder
  if (!n)
    return (
      <div className="relative flex aspect-[16/6] max-h-[300px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[28px] border border-dashed border-neutral-300 bg-white text-neutral-400">
        <ImageIcon className="h-8 w-8" />
        <span className="text-sm font-medium">Banner image</span>
        <span className="text-xs">1600 × 600 · set in Admin → Discover cards</span>
      </div>
    );

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="group relative aspect-[16/6] max-h-[300px] w-full overflow-hidden rounded-[28px] bg-neutral-100">
      {slides.map((s, k) => (
        <button
          key={s.id}
          type="button"
          tabIndex={k === i ? 0 : -1}
          aria-hidden={k !== i}
          aria-label={s.title}
          onClick={() => open(s)}
          className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"} ${s.link ? "cursor-pointer" : "cursor-default"}`}
        >
          {s.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-400">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm font-medium">{s.title}</span>
              <span className="text-xs">Add an image for this slide</span>
            </span>
          )}
        </button>
      ))}
      {n > 1 && (
        <>
          <button type="button" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous" style={{ minHeight: 0 }} className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 opacity-0 shadow transition-opacity group-hover:opacity-100 sm:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setI((i + 1) % n)} aria-label="Next" style={{ minHeight: 0 }} className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 opacity-0 shadow transition-opacity group-hover:opacity-100 sm:flex">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur">
            {slides.map((s, k) => (
              <button key={s.id} type="button" onClick={() => setI(k)} aria-label={`Show slide ${k + 1}`} style={{ minHeight: 0 }} className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ today ------------------------------ */

type Range = "today" | "7d" | "30d";

/**
 * The day ring: one segment per day (or per two hours for Today). Each segment's shade is that
 * day's sales (darker = more, light grey = none); the best one is black. An optional thin outer arc
 * shows progress to the monthly goal. Segments fade in one after another.
 */
function DayRing({
  values,
  labels,
  hover,
  onHover,
  goalPct,
  children,
}: {
  values: number[];
  /** short labels shown around the ring (only when there are 12 or fewer segments) */
  labels?: string[];
  hover: number | null;
  onHover: (i: number | null) => void;
  goalPct: number | null;
  children: React.ReactNode;
}) {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    setOn(false);
    const t = setTimeout(() => setOn(true), 60);
    return () => clearTimeout(t);
  }, [values.length]);
  const n = Math.max(1, values.length);
  const max = Math.max(...values, 1);
  const best = values.reduce((b, v, i) => (v > values[b] ? i : b), 0);
  const C = 110;
  const R = 78;
  const few = n <= 12;
  const gap = few ? 7 : 2; // degrees between segments
  const arc = (i: number, r: number) => {
    const a0 = ((i / n) * 360 + gap / 2 - 90) * (Math.PI / 180);
    const a1 = (((i + 1) / n) * 360 - gap / 2 - 90) * (Math.PI / 180);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${C + r * Math.cos(a0)} ${C + r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${C + r * Math.cos(a1)} ${C + r * Math.sin(a1)}`;
  };
  const shade = (v: number, i: number) => {
    if (!v) return "#efefef";
    if (i === best) return "#0a0a0a";
    const t = 0.25 + (v / max) * 0.6; // 25%–85% ink
    const g = Math.round(236 - t * 226);
    return `rgb(${g},${g},${g})`;
  };
  const gp = goalPct === null ? null : Math.max(0, Math.min(1, goalPct));
  return (
    <div className="relative h-[220px] w-[220px] shrink-0">
      <svg viewBox="0 0 220 220" className="h-full w-full" onMouseLeave={() => onHover(null)}>
        {values.map((v, i) => (
          <path
            key={i}
            d={arc(i, R)}
            fill="none"
            stroke={shade(v, i)}
            strokeWidth={hover === i ? 16 : 12}
            strokeLinecap={few ? "round" : "butt"}
            onMouseEnter={() => onHover(i)}
            style={{ opacity: on ? 1 : 0, transition: `opacity 0.4s ease ${i * (n > 14 ? 18 : 60)}ms, stroke-width 0.2s ease` }}
            className="cursor-pointer"
          />
        ))}
        {/* day letters around the outside */}
        {few &&
          labels?.map((l, i) => {
            const a = (((i + 0.5) / n) * 360 - 90) * (Math.PI / 180);
            return (
              <text key={i} x={C + 100 * Math.cos(a)} y={C + 100 * Math.sin(a)} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight={hover === i || i === best ? 600 : 400} fill={hover === i || (i === best && values[i]) ? "#0a0a0a" : "#a3a3a3"}>
                {l}
              </text>
            );
          })}
        {/* goal: a fine line just inside */}
        {gp !== null && (
          <>
            <circle cx={C} cy={C} r={62} fill="none" stroke="#f3f3f3" strokeWidth="2" />
            <circle
              cx={C}
              cy={C}
              r={62}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 62}
              strokeDashoffset={2 * Math.PI * 62 * (1 - (on ? gp : 0))}
              transform={`rotate(-90 ${C} ${C})`}
              style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
            />
          </>
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function TodayCard({ store, onNavigate }: { store: StoreData; onNavigate: (p: DashPage) => void }) {
  const [range, setRange] = React.useState<Range>("7d");
  const [hover, setHover] = React.useState<number | null>(null);

  /* monthly goal, remembered in this browser (same as before) */
  const goalKey = `bento:goal:${store.subdomain}`;
  const [goal, setGoal] = React.useState(0);
  React.useEffect(() => {
    try {
      setGoal(Number(localStorage.getItem(goalKey)) || 0);
    } catch {
      // storage blocked
    }
  }, [goalKey]);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const editGoal = () => {
    setDraft(goal ? String(goal) : "");
    setEditing(true);
  };
  const saveGoal = () => {
    const n = Math.max(0, Math.round(Number(draft.replace(/[^0-9.]/g, "")) || 0));
    setGoal(n);
    try {
      localStorage.setItem(goalKey, String(n));
    } catch {
      // private mode
    }
    setEditing(false);
  };

  const d = React.useMemo(() => {
    const now = Date.now();
    const orders = store.orders || [];
    const ok = orders.filter((o) => o.fulfilmentStatus !== "cancelled" && o.paymentStatus !== "rejected");
    const startToday = new Date().setHours(0, 0, 0, 0);
    const span = range === "today" ? now - startToday : range === "7d" ? 7 * DAY : 30 * DAY;
    const from = range === "today" ? startToday : now - span;
    const prevFrom = from - (range === "today" ? DAY : span);
    const inR = (a: number, b: number) => ok.filter((o) => {
      const t = Date.parse(o.createdAt);
      return t >= a && t < b;
    });
    const cur = inR(from, now + DAY);
    const prev = inR(prevFrom, range === "today" ? prevFrom + (now - startToday) : from);
    const sum = (l: typeof ok) => l.reduce((n, o) => n + o.total, 0);
    const buyers = (l: typeof ok) => new Set(l.map((o) => o.customer?.phone || o.customer?.name)).size;
    const chg = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? null : 0);

    const points: { label: string; value: number; orders: number }[] = [];
    if (range === "today") {
      for (let h = 0; h < 24; h += 2) {
        const a = startToday + h * 3600_000;
        const l = inR(a, a + 2 * 3600_000);
        points.push({ label: h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`, value: sum(l), orders: l.length });
      }
    } else {
      const days = range === "7d" ? 7 : 30;
      for (let k = days - 1; k >= 0; k--) {
        const a = startToday - k * DAY;
        const l = inR(a, a + DAY);
        const dt = new Date(a);
        points.push({ label: days === 7 ? dt.toLocaleDateString("en-IN", { weekday: "short" }) : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: sum(l), orders: l.length });
      }
    }
    const best = points.reduce((b, p, i) => (p.value > points[b].value ? i : b), 0);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    const actions: { label: string; count: number; page: DashPage }[] = [];
    if (!hasAnyPolicy(store)) actions.push({ label: "Add a policy page", count: 1, page: "policies" });
    const pay = orders.filter((o) => o.paymentStatus === "awaiting_verification").length;
    if (pay) actions.push({ label: "to check", count: pay, page: "orders" });
    const ship = ok.filter((o) => ["placed", "confirmed", "packed"].includes(o.fulfilmentStatus) && o.paymentStatus !== "awaiting_verification").length;
    if (ship) actions.push({ label: "to ship", count: ship, page: "orders" });
    const rev = (store.reviews || []).filter((r) => r.status === "pending").length;
    if (rev) actions.push({ label: rev === 1 ? "review" : "reviews", count: rev, page: "reviews" });
    const low = (store.products || []).filter((p) => p.status === "published" && p.stock <= 3).length;
    if (low) actions.push({ label: "low on stock", count: low, page: "products" });

    return {
      sales: sum(cur),
      salesChange: chg(sum(cur), sum(prev)),
      prevSales: sum(prev),
      monthSales: sum(inR(monthStart, now + DAY)),
      pills: [
        { label: cur.length === 1 ? "order" : "orders", value: String(cur.length), change: chg(cur.length, prev.length) },
        { label: buyers(cur) === 1 ? "buyer" : "buyers", value: String(buyers(cur)), change: chg(buyers(cur), buyers(prev)) },
        { label: "avg. order", value: cur.length ? rupees(sum(cur) / cur.length) : "₹0", change: chg(cur.length ? sum(cur) / cur.length : 0, prev.length ? sum(prev) / prev.length : 0) },
      ],
      points,
      best,
      actions,
    };
  }, [store, range]);

  /* ring: progress to the monthly goal, or this period against the last one */
  const ringNote = goal
    ? `${Math.round((d.monthSales / (goal * 100)) * 100)}% of ${new Date().toLocaleDateString("en-IN", { month: "short" })} goal`
    : d.salesChange === null
      ? "your first sales"
      : `${d.salesChange >= 0 ? "+" : ""}${d.salesChange}% vs before`;
  const periodName = range === "today" ? "Today" : range === "7d" ? "This week" : "30 days";

  /* the line */
  const W = 520;
  const H = 150;
  const max = Math.max(...d.points.map((p) => p.value), 1);
  const xy = d.points.map((p, i) => [(i / Math.max(1, d.points.length - 1)) * W, H - 12 - (p.value / max) * (H - 30)] as const);
  const line = xy.reduce((acc, [x, y], i) => {
    if (!i) return `M${x},${y}`;
    const [px, py] = xy[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");
  const hp = hover !== null ? xy[hover] : null;
  const every = d.points.length > 14 ? 6 : d.points.length > 8 ? 2 : 1;

  return (
    <section className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Today</h2>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full bg-neutral-100 p-1 text-xs">
            {(
              [
                ["today", "Today"],
                ["7d", "7 days"],
                ["30d", "30 days"],
              ] as const
            ).map(([id, l]) => (
              <button key={id} type="button" onClick={() => setRange(id)} style={{ minHeight: 0 }} className={`h-7 rounded-full px-3 font-medium transition-colors ${range === id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}>
                {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onNavigate("analytics")} style={{ minHeight: 0 }} className="hidden items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 sm:inline-flex">
            Analytics <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div data-tour="stats" className="mt-6 flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
        {/* ring (tap to set the monthly goal) */}
        <div className="flex shrink-0 flex-col items-center gap-3">
        <button type="button" onClick={editGoal} title={goal ? "Change your monthly goal" : "Set a monthly goal"} style={{ minHeight: 0 }} className="group rounded-full">
          <DayRing values={d.points.map((p) => p.value)} labels={d.points.map((p) => (range === "7d" ? p.label.slice(0, 1) : p.label))} hover={hover} onHover={setHover} goalPct={goal ? d.monthSales / (goal * 100) : null}>
            <span className="text-xs text-neutral-500">{hover !== null ? d.points[hover].label : periodName}</span>
            <span className="mt-0.5 text-[26px] font-semibold leading-none tracking-tight tabular-nums">{short(hover !== null ? d.points[hover].value : d.sales)}</span>
            <span className={`mt-1.5 text-[11px] font-medium ${hover !== null ? "text-neutral-500" : goal || (d.salesChange ?? 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {hover !== null ? `${d.points[hover].orders} order${d.points[hover].orders === 1 ? "" : "s"}` : ringNote}
            </span>
            <span className="mt-1 text-[10px] text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100">{goal ? "Tap to change goal" : "Tap to set a goal"}</span>
          </DayRing>
        </button>
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveGoal();
            }}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white py-1 pl-3 pr-1 text-sm shadow-sm"
          >
            <span className="text-neutral-400">₹</span>
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} inputMode="numeric" placeholder={`${new Date().toLocaleDateString("en-IN", { month: "short" })} goal`} aria-label="Monthly sales goal in rupees" className="w-24 bg-transparent outline-none" />
            <button type="submit" style={{ minHeight: 0 }} className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} aria-label="Cancel" style={{ minHeight: 0 }} className="px-1.5 text-xs text-neutral-400 hover:text-neutral-900">
              ✕
            </button>
          </form>
        )}
        </div>

        {/* the line */}
        <div className="w-full min-w-0 flex-1">
          <div className="relative">
            {hover !== null && hp && (
              <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-neutral-950 px-2.5 py-1.5 text-center text-[11px] text-white shadow-lg" style={{ left: `${(hp[0] / W) * 100}%`, top: `${(hp[1] / H) * 100}%`, marginTop: -10 }}>
                <span className="block font-semibold tabular-nums">{rupees(d.points[hover].value)}</span>
                <span className="text-white/60">
                  {d.points[hover].label} · {d.points[hover].orders} order{d.points[hover].orders === 1 ? "" : "s"}
                </span>
              </div>
            )}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="h-[150px] w-full overflow-visible"
              onMouseLeave={() => setHover(null)}
              onMouseMove={(e) => {
                const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * W;
                setHover(Math.max(0, Math.min(d.points.length - 1, Math.round((x / W) * (d.points.length - 1)))));
              }}
              aria-hidden
            >
              <defs>
                <linearGradient id="today-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#0a0a0a" stopOpacity="0.1" />
                  <stop offset="1" stopColor="#0a0a0a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.33, 0.66].map((f) => (
                <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#f2f2f2" vectorEffect="non-scaling-stroke" />
              ))}
              {xy.length > 1 && <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#today-area)" />}
              <path d={line} fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {xy[d.best] && d.points[d.best].value > 0 && hover === null && <circle cx={xy[d.best][0]} cy={xy[d.best][1]} r="5" fill="#0a0a0a" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
              {hp && (
                <>
                  <line x1={hp[0]} x2={hp[0]} y1="0" y2={H} stroke="#d4d4d4" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  <circle cx={hp[0]} cy={hp[1]} r="5" fill="#0a0a0a" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </>
              )}
            </svg>
            <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
              {d.points.map((p, k) => (
                <span key={k} className={k % every === 0 || k === d.points.length - 1 ? "" : "invisible"}>
                  {p.label}
                </span>
              ))}
            </div>
            {d.points[d.best]?.value > 0 && (
              <p className="mt-2 text-[11px] text-neutral-400">
                Best: <span className="font-medium text-neutral-700">{d.points[d.best].label}</span> · {rupees(d.points[d.best].value)}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* numbers on the left, what needs doing on the right */}
      <div className="mt-6 flex flex-col gap-4 border-t border-neutral-100 pt-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-3 divide-x divide-neutral-100 rounded-2xl bg-neutral-50 py-3">
          {d.pills.map((p, k) => (
            <div key={k} className="px-4 sm:px-6">
              <p className="text-[11px] text-neutral-500">{["Orders", "Buyers", "Avg. order"][k]}</p>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-lg font-semibold tabular-nums">{p.value}</span>
                {p.change !== null && p.change !== 0 && (
                  <span className={`text-[11px] font-semibold ${p.change > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {p.change > 0 ? "▲" : "▼"} {Math.abs(p.change)}%
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
        {d.actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {d.actions.map((a) => (
              <button key={a.label} type="button" onClick={() => onNavigate(a.page)} style={{ minHeight: 0 }} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 pl-1.5 pr-4 text-sm text-white transition-transform hover:-translate-y-0.5">
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/15 px-2 text-xs font-semibold tabular-nums">{a.label === "Add a policy page" ? "!" : a.count}</span>
                {a.label === "Add a policy page" ? a.label : a.label.charAt(0).toUpperCase() + a.label.slice(1)}
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">All caught up. Nothing waiting for you.</p>
        )}
      </div>
    </section>
  );
}

/* ------------------------------ explore previews ------------------------------ */

function ExplorePreview({ id }: { id: (typeof EXPLORE_IDS)[number] }) {
  if (id === "trending")
    return (
      <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
        {[22, 34, 28, 46, 40, 62, 78].map((h, i) => (
          <rect key={i} x={18 + i * 24} y={80 - h} width="14" height={h} rx="4" fill={i === 6 ? "#171717" : "#d4d4d4"} />
        ))}
        <path d="M24 56 L48 48 L72 52 L96 36 L120 40 L144 22 L168 10" fill="none" stroke="#171717" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (id === "calendar")
    return (
      <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
        {[0, 1, 2].map((k) => (
          <g key={k} transform={`translate(${30 + k * 50},14)`}>
            <rect width="40" height="56" rx="8" fill={k === 1 ? "#171717" : "#fff"} stroke="#171717" strokeWidth="1.5" />
            <rect y="0" width="40" height="14" rx="6" fill={k === 1 ? "#404040" : "#e5e5e5"} />
            <text x="20" y="44" textAnchor="middle" fontSize="18" fontWeight="600" fill={k === 1 ? "#fff" : "#171717"}>
              {[14, 27, 25][k]}
            </text>
          </g>
        ))}
      </svg>
    );
  if (id === "creative")
    return (
      <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
        <rect x="30" y="14" width="140" height="62" rx="10" fill="#fff" stroke="#171717" strokeWidth="1.5" />
        <rect x="44" y="28" width="80" height="6" rx="3" fill="#171717" />
        <rect x="44" y="42" width="110" height="5" rx="2.5" fill="#d4d4d4" />
        <rect x="44" y="53" width="92" height="5" rx="2.5" fill="#d4d4d4" />
        <path d="M156 18 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#171717" />
      </svg>
    );
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden>
      <path d="M58 20 Q 100 10 100 26 L100 78 Q 100 66 58 72 Z" fill="#fff" stroke="#171717" strokeWidth="1.5" />
      <path d="M142 20 Q 100 10 100 26 L100 78 Q 100 66 142 72 Z" fill="#171717" />
      {[34, 44, 54].map((y) => (
        <line key={y} x1="66" y1={y} x2="92" y2={y - 3} stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  );
}

const EXPLORE_TAB: Record<(typeof EXPLORE_IDS)[number], GrowthTab> = { trending: "trends", calendar: "campaigns", creative: "templates", academy: "learn" };

/* ------------------------------ typing hint ------------------------------ */

const HINTS = [
  "Write a description for my red cotton saree…",
  "Which orders should I ship first?",
  "Plan a Diwali sale with a coupon…",
  "How did my shop do this week?",
  "Write an Instagram caption for my newest product…",
];

/** Example questions that type themselves out and erase, one after another, while the box is empty. */
function useTypedHint(active: boolean) {
  const [shown, setShown] = React.useState(HINTS[0]);
  React.useEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let hint = 0;
    let len = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const full = HINTS[hint];
      if (!deleting) {
        len++;
        setShown(full.slice(0, len));
        if (len >= full.length) {
          deleting = true;
          timer = window.setTimeout(tick, 2200);
          return;
        }
        timer = window.setTimeout(tick, 38);
      } else {
        len--;
        setShown(full.slice(0, Math.max(0, len)));
        if (len <= 0) {
          deleting = false;
          hint = (hint + 1) % HINTS.length;
          timer = window.setTimeout(tick, 350);
          return;
        }
        timer = window.setTimeout(tick, 18);
      }
    };
    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, [active]);
  return shown || " ";
}

/* ------------------------------ home ------------------------------ */

export function HomeFeed({
  store,
  storeLink,
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
  onStartTutorial,
}: {
  store: StoreData;
  storeLink: string;
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
  onStartTutorial: (t: Tutorial) => void;
}) {
  const { cards, slides } = useDiscoverData();
  const [text, setText] = React.useState("");
  const typedHint = useTypedHint(text === "");
  const [explore, setExplore] = React.useState<GrowthTab | null>(null);
  const first = ownerName.split(" ")[0];
  const ask = (q = text) => {
    const v = q.trim();
    if (!v) return;
    setText("");
    onAsk(v);
  };
  const exploreId = explore ? (Object.entries(EXPLORE_TAB).find(([, t]) => t === explore)?.[0] as (typeof EXPLORE_IDS)[number] | undefined) : undefined;

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* greeting */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">
              {greeting}
              {first ? `, ${first}` : ""}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" role="switch" aria-checked={!shopClosed} onClick={onToggleShop} style={{ minHeight: 0 }} className="inline-flex h-9 items-center gap-2.5 rounded-full border border-black/[0.06] bg-white pl-3.5 pr-1.5 text-sm font-medium">
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
          <label className="flex items-center gap-3 rounded-2xl bg-neutral-950 px-4 py-3 text-white">
            <span className="shrink-0 text-sm font-medium">Buyers see:</span>
            <input value={closedMessage} onChange={(e) => onClosedMessage(e.target.value)} onBlur={onSaveClosedMessage} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} maxLength={160} placeholder="Back on Monday!" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
          </label>
        )}

        {/* banner */}
        <HeroBanner slides={slides.some((s) => s.enabled) ? slides.filter((s) => s.enabled) : EXAMPLE_SLIDES} />

        {/* chat box: Roxy, on soft glass */}
        <section className="relative">
          {/* faint shapes behind the glass so the blur has something to soften */}
          <span aria-hidden className="pointer-events-none absolute -left-6 top-6 h-40 w-64 rounded-full bg-neutral-300/50 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -right-4 -top-4 h-36 w-56 rounded-full bg-white blur-2xl" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
            className="relative rounded-[30px] border border-white/60 bg-[#E2E2DF]/75 p-5 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl transition-shadow focus-within:shadow-[0_28px_70px_-36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-6"
          >
            <div className="flex items-center gap-3">
              <RoxyLogo size={44} />
              <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">What can Roxy do for you today?</h2>
            </div>
            {/* the white box, with a thin border that slowly flows around it and a soft glow beneath */}
            <div className="group/ask relative mt-4">
              <span aria-hidden className="roxy-border-glow pointer-events-none absolute -inset-1.5 rounded-[28px] opacity-70 transition-opacity duration-500 group-focus-within/ask:opacity-100" />
              <div className="roxy-border relative rounded-[24px] p-[2px]">
            <div className="rounded-[22px] bg-white p-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
                rows={3}
                maxLength={2000}
                placeholder={typedHint}
                aria-label="Ask Roxy"
                className="block w-full resize-none bg-transparent px-1.5 py-1 text-base leading-relaxed outline-none placeholder:text-neutral-400"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["How's my week?", "How did my shop do this week? Anything I should do?"],
                    ["Write a description", "Write a short description for my newest product."],
                    ["Suggest a coupon", "Suggest a coupon I should run this week and create it."],
                    ["Connect Shiprocket", "How do I connect Shiprocket?"],
                  ].map(([l, q]) => (
                    <button key={l} type="button" onClick={() => ask(q)} style={{ minHeight: 0 }} className="rounded-full border border-black/[0.07] bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-950">
                      {l}
                    </button>
                  ))}
                </div>
                <button type="submit" aria-label="Ask Roxy" style={{ minHeight: 0 }} className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-white transition-transform hover:scale-105">
                  <ArrowUp className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* today */}
      <TodayCard store={store} onNavigate={onNavigate} />

      {/* picked for you */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Picked for you</h2>
          <span className="text-sm text-neutral-400">Ideas to grow your shop</span>
        </div>
        <HomeDiscover store={store} storeLink={storeLink} onNavigate={onNavigate} onAsk={onAsk} layout="row" />
      </section>

      {/* explore */}
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Explore</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {EXPLORE_IDS.filter((id) => cards[id].enabled).map((id) => {
            const c = cards[id];
            const dft = DISCOVER_DEFAULTS[id];
            const open = () => {
              if (!c.link) return setExplore(EXPLORE_TAB[id]);
              if (c.link.startsWith("/")) window.location.assign(c.link);
              else window.open(c.link, "_blank", "noopener,noreferrer");
            };
            return (
              <button key={id} type="button" onClick={open} className="group flex flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-white text-left transition-shadow duration-300 hover:shadow-[0_24px_48px_-30px_rgba(0,0,0,0.45)]">
                <span className="block h-28 bg-neutral-50 px-4 py-3 transition-colors group-hover:bg-neutral-100 sm:h-32">
                  <ExplorePreview id={id} />
                </span>
                <span className="block p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold">{c.title || dft.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-900" />
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-neutral-500">{c.text || dft.text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* tutorials */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Learn by doing</h2>
            <p className="text-sm text-neutral-500">Step-by-step tutorials right inside your dashboard</p>
          </div>
        </div>
        <FadeScroll className={rowScroll}>
          {TUTORIALS.map((t, k) => (
            <button key={t.id} type="button" onClick={() => onStartTutorial(t)} className="group flex h-[180px] w-[250px] shrink-0 snap-start flex-col justify-between rounded-[22px] border border-black/[0.06] bg-white p-5 text-left transition-shadow hover:shadow-[0_24px_48px_-30px_rgba(0,0,0,0.45)]">
              <span className="flex items-center justify-between text-xs text-neutral-400">
                <span>Tutorial {k + 1}</span>
                <span>
                  {t.steps.length} steps · {t.mins} min
                </span>
              </span>
              <span>
                <span className="block text-base font-semibold leading-snug">{t.title}</span>
                <span className="mt-1 block text-xs text-neutral-500">{t.summary}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-white transition-transform group-hover:scale-105">
                  <Play className="ml-0.5 h-3 w-3 fill-current" />
                </span>
                Start
              </span>
            </button>
          ))}
        </FadeScroll>
      </section>

      {/* explore windows */}
      <Modal isOpen={!!explore} onClose={() => setExplore(null)} title={exploreId ? DISCOVER_DEFAULTS[exploreId].title : ""} className="sm:max-w-4xl">
        {explore && (
          <HomeGrowth
            store={store}
            storeLink={storeLink}
            onNavigate={(p) => {
              setExplore(null);
              onNavigate(p);
            }}
            onAsk={(q) => {
              setExplore(null);
              onAsk(q);
            }}
            only={explore}
          />
        )}
      </Modal>
    </div>
  );
}
