"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";

/**
 * The dashboard's shared look: every section has its own soft colour (orders blue, products violet,
 * customers green, reviews amber, discounts rose, categories teal…), used by the page header, stat
 * cards and empty states so each page feels distinct but part of one app.
 */

export type Section =
  | "orders"
  | "products"
  | "customers"
  | "reviews"
  | "discounts"
  | "categories"
  | "themes"
  | "plugins"
  | "settings"
  | "overview"
  | "notifications"
  | "profile";

// literal class names so Tailwind keeps them
// Monochrome on purpose: black, white and greys, so pages stay calm. Colour is kept only for meaning
// (green = live/paid, amber = warning, red = error, gold stars), and those live in the pages themselves.
const MONO = {
  tile: "text-neutral-900",
  soft: "bg-neutral-50",
  text: "text-neutral-900",
  band: "from-neutral-50 via-white to-white",
  blob: "bg-neutral-300/20",
  bar: "bg-neutral-900",
  hex: "#171717",
  ring: "hover:border-neutral-300",
};
export const THEME: Record<Section, typeof MONO> = {
  orders: MONO,
  products: MONO,
  customers: MONO,
  reviews: MONO,
  discounts: MONO,
  categories: MONO,
  themes: MONO,
  plugins: MONO,
  settings: MONO,
  overview: MONO,
  notifications: MONO,
  profile: MONO,
};

/* ------------------------------ page header ------------------------------ */

export function PageHero({
  section,
  icon: Icon,
  title,
  text,
  onBack,
  backOnPhonesOnly,
  actions,
}: {
  section: Section;
  icon: React.ElementType;
  title: string;
  text?: string;
  onBack?: () => void;
  /** hide the back arrow on computers (e.g. Settings, where the menu is already beside the page) */
  backOnPhonesOnly?: boolean;
  actions?: React.ReactNode;
}) {
  const t = THEME[section];
  return (
    <div className="hero-rise mb-5 flex items-center gap-3 sm:mb-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{ minHeight: 0 }}
          className={`group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-700 ring-1 ring-black/[0.05] transition-colors hover:text-neutral-950 ${backOnPhonesOnly ? "lg:hidden" : ""}`}
        >
          <ArrowLeft className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-0.5" />
        </button>
      )}
      <Icon className="hidden h-5 w-5 shrink-0 text-neutral-900 sm:block" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight sm:text-xl">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------ stats ------------------------------ */

/** A tiny line chart (no axes) for a stat card. */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2 || values.every((v) => v === 0)) return null;
  const max = Math.max(...values, 1);
  const w = 96;
  const h = 32;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - (v / max) * (h - 6)}`).join(" ");
  const id = `spark-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-24" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface Stat {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ElementType;
  section: Section;
  spark?: number[];
  /** 0–1: shows a thin progress bar */
  progress?: number;
}

/**
 * The numbers at the top of a page, on one black card: the first number large, the rest in small
 * boxes beside it (computers) or under it (phones). `phone` = how many numbers phones show (0 hides
 * the card on phones).
 */
export function StatStrip({ stats, phone = 3 }: { stats: Stat[]; phone?: number }) {
  if (!stats.length) return null;
  const [lead, ...rest] = stats;
  return (
    <div className={`hero-rise rounded-[28px] bg-neutral-950 p-5 text-white sm:p-6 ${phone > 0 ? "" : "hidden md:block"}`}>
      <div className="md:flex md:items-stretch md:gap-3">
        <div className="min-w-0 md:flex md:flex-1 md:flex-col md:justify-between md:pr-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-white/60">{lead.label}</p>
            {lead.spark && <Sparkline values={lead.spark} color="#ffffff" />}
          </div>
          <div>
            <p className="mt-1 truncate text-[34px] font-semibold leading-none tracking-tight tabular-nums">{lead.value}</p>
            {lead.hint && <p className="mt-2 truncate text-xs text-white/55">{lead.hint}</p>}
          </div>
        </div>
        {rest.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 md:mt-0 md:flex md:flex-[2] md:gap-3">
            {rest.map((s, i) => (
              <div key={s.label} className={`min-w-0 rounded-2xl bg-white/[0.07] p-3.5 md:flex-1 md:p-4 ${i + 1 >= phone ? "hidden md:block" : ""}`}>
                <div className="flex items-center gap-1.5 text-white/60">
                  <s.icon className="h-3.5 w-3.5 shrink-0" />
                  <p className="truncate text-xs font-medium">{s.label}</p>
                </div>
                <p className="mt-1.5 truncate text-lg font-semibold leading-tight tracking-tight tabular-nums md:text-xl">{s.value}</p>
                {typeof s.progress === "number" ? (
                  <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-lime-200" style={{ width: `${Math.max(3, Math.min(100, s.progress * 100))}%` }} />
                  </span>
                ) : (
                  s.hint && <p className="mt-1 truncate text-[11px] text-white/50">{s.hint}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Phones only: a few numbers as a quiet single line (no box, no icons): a bold number with a small
 * label, divided by thin rules. Never wraps or scrolls.
 */
export function StatChips({ items, className = "" }: { items: { label: string; value: React.ReactNode; tone?: string }[]; className?: string }) {
  return (
    <div className={`flex items-center gap-4 overflow-hidden whitespace-nowrap px-0.5 md:hidden ${className}`}>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 && <span aria-hidden className="h-4 w-px shrink-0 bg-neutral-300" />}
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className={`truncate text-[17px] font-semibold tabular-nums tracking-tight ${it.tone || "text-neutral-950"}`}>{it.value}</span>
            <span className="truncate text-[12.5px] text-neutral-500">{it.label}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Counts per day for the last `days` days (oldest first), for sparklines. */
export function dailyCounts<T>(items: T[], dateOf: (x: T) => string | undefined, days = 14, weight: (x: T) => number = () => 1): number[] {
  const out = new Array(days).fill(0);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const first = start.getTime() - (days - 1) * 86400000;
  for (const x of items) {
    const d = dateOf(x);
    if (!d) continue;
    const t = new Date(d).getTime();
    const i = Math.floor((t - first) / 86400000);
    if (i >= 0 && i < days) out[i] += weight(x);
  }
  return out;
}

/* ------------------------------ empty states ------------------------------ */

/** A small illustration: the section's icon on soft blobs with floating shapes, in the section's colour. */
export function Illustration({ section, icon: Icon }: { section: Section; icon: React.ElementType }) {
  const t = THEME[section];
  return (
    <div className="relative mx-auto h-36 w-44">
      <svg viewBox="0 0 176 144" className="absolute inset-0 h-full w-full" aria-hidden>
        <ellipse cx="88" cy="128" rx="54" ry="8" fill={t.hex} opacity="0.08" />
        <circle cx="88" cy="68" r="52" fill={t.hex} opacity="0.08" />
        <circle cx="88" cy="68" r="36" fill={t.hex} opacity="0.1" />
        <rect x="18" y="26" width="18" height="18" rx="5" fill={t.hex} opacity="0.18" transform="rotate(-12 27 35)" />
        <circle cx="152" cy="40" r="7" fill={t.hex} opacity="0.22" />
        <circle cx="30" cy="104" r="5" fill={t.hex} opacity="0.2" />
        <path d="M146 96 l6 -10 l6 10 z" fill={t.hex} opacity="0.2" />
        <path d="M58 20 q4 -6 8 0 q4 6 8 0" stroke={t.hex} strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round" />
      </svg>
      <span className={`absolute left-1/2 top-[68px] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white shadow-[0_14px_30px_-12px_rgba(0,0,0,0.25)] ${t.text}`}>
        <Icon className="h-7 w-7" />
      </span>
    </div>
  );
}

export function EmptyState({
  section,
  icon,
  title,
  text,
  action,
  secondary,
}: {
  section: Section;
  icon: React.ElementType;
  title: string;
  text: string;
  action?: { label: string; onClick: () => void; icon?: React.ElementType };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="hero-rise rounded-[24px] border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
      <Illustration section={section} icon={icon} />
      <p className="mt-4 text-lg font-semibold tracking-tight">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">{text}</p>
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              style={{ minHeight: 0 }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-black"
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </button>
          )}
          {secondary && (
            <button type="button" onClick={secondary.onClick} style={{ minHeight: 0 }} className="inline-flex h-11 items-center rounded-xl border border-neutral-200 px-5 text-sm font-semibold hover:border-neutral-900">
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** A small icon in a soft coloured square, beside card titles. */
export function SectionIcon({ section, icon: Icon, size = "md" }: { section: Section; icon: React.ElementType; size?: "sm" | "md" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center ${TINTS[SECTION_TINT[section]]} ${size === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl"}`}>
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"} />
    </span>
  );
}

const SECTION_TINT: Record<Section, Tint> = {
  orders: "blue",
  products: "violet",
  customers: "green",
  reviews: "amber",
  discounts: "rose",
  categories: "blue",
  themes: "violet",
  plugins: "grey",
  settings: "grey",
  overview: "grey",
  notifications: "amber",
  profile: "grey",
};

/* ------------------------------ app pieces ------------------------------ */

/** The white card most lists and panels sit on. */
export const CARD = "rounded-[24px] bg-white ring-1 ring-black/[0.04]";

/** A few soft colours, used sparingly (avatars, action icons, status). */
export const TINTS = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-800",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  grey: "bg-neutral-100 text-neutral-700",
} as const;
export type Tint = keyof typeof TINTS;
const TINT_CYCLE: Tint[] = ["blue", "green", "violet", "amber", "rose"];

/** The same soft colour every time for the same name (e.g. a buyer's initial). */
export function tintFor(key: string): Tint {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TINT_CYCLE[h % TINT_CYCLE.length];
}

/** A round initial in a soft colour, for people. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ${TINTS[tintFor(name || "?")]} ${size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm"}`}>
      {(name || "?").trim().charAt(0) || "?"}
    </span>
  );
}

/** A status label with a dot, e.g. "• Shipped". */
export function StatusChip({ label, tint = "grey" }: { label: React.ReactNode; tint?: Tint }) {
  const dot: Record<Tint, string> = { green: "bg-emerald-500", blue: "bg-sky-500", amber: "bg-amber-500", violet: "bg-violet-500", rose: "bg-rose-500", grey: "bg-neutral-400" };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TINTS[tint]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[tint]}`} />
      {label}
    </span>
  );
}

export interface ActionTile {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  tint?: Tint;
  /** a small number or word in the corner */
  badge?: React.ReactNode;
}

/** Big tap targets for a page's main jobs: the name top left, an icon bottom right. */
export function ActionTiles({ items, className = "" }: { items: ActionTile[]; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : ""} ${className}`}>
      {items.map((t, i) => (
        <button
          key={t.label}
          type="button"
          onClick={t.onClick}
          style={{ minHeight: 0 }}
          className={`group relative flex h-[108px] flex-col justify-between overflow-hidden p-4 text-left transition-transform duration-300 active:scale-[0.98] sm:h-[116px] ${CARD} hover:ring-black/10 ${
            items.length % 2 === 1 && i === 0 ? "col-span-2 sm:col-span-1" : ""
          }`}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="max-w-[9rem] text-[15px] font-semibold leading-snug tracking-tight">{t.label}</span>
            {t.badge !== undefined && t.badge !== null && t.badge !== "" && (
              <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">{t.badge}</span>
            )}
          </span>
          <span className={`flex h-11 w-11 items-center justify-center self-end rounded-2xl transition-transform duration-300 group-hover:-translate-y-0.5 ${TINTS[t.tint || "grey"]}`}>
            <t.icon className="h-5 w-5" />
          </span>
        </button>
      ))}
    </div>
  );
}

/** Pill filters: the chosen one is black. Each shows an optional count. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className = "",
}: {
  items: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={`flex gap-1 rounded-full bg-white p-1 ring-1 ring-black/[0.05] ${className}`}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.id)}
            style={{ minHeight: 0 }}
            className={`flex h-9 min-w-0 flex-auto items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 text-[13px] font-medium transition-colors sm:gap-1.5 sm:px-3 ${
              on ? "bg-neutral-950 text-white" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <span className="truncate">{it.label}</span>
            {typeof it.count === "number" && <span className={`shrink-0 text-[11px] tabular-nums ${on ? "text-white/60" : "text-neutral-400"}`}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A small heading above a block, with an optional link on the right ("View all"). */
export function SectionTitle({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      {action && (
        <button type="button" onClick={action.onClick} style={{ minHeight: 0 }} className="text-[13px] font-medium text-neutral-500 hover:text-neutral-950">
          {action.label}
        </button>
      )}
    </div>
  );
}
