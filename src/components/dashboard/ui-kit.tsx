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
    <div className="hero-rise mb-5 flex items-center gap-2.5 sm:mb-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{ minHeight: 0 }}
          className={`group -ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 ${backOnPhonesOnly ? "lg:hidden" : ""}`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        </button>
      )}
      <Icon className="h-[18px] w-[18px] shrink-0 text-neutral-900" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight tracking-tight sm:text-lg">{title}</h1>
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
 * The numbers at the top of a page. Phones: just the first one or two, as a quiet line, so the
 * page's own content starts right away. Tablets and computers: a
 * row of separate cards with icons, hints and charts.
 */
export function StatStrip({ stats, phone = 2 }: { stats: Stat[]; /** how many stats phones show (0 = none) */ phone?: number }) {
  return (
    <>
      {phone > 0 && <StatChips items={stats.slice(0, phone).map((s) => ({ label: s.label, value: s.value }))} />}
      <div className="m-stagger hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const t = THEME[s.section];
          return (
            <div
              key={s.label}
              className={`group min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.35)] ${t.ring}`}
            >
              <div className="flex items-start justify-between gap-2">
                <s.icon className="h-5 w-5 text-neutral-900" />
                {s.spark && <Sparkline values={s.spark} color={t.hex} />}
              </div>
              <p className="mt-3 text-xs font-medium text-neutral-500">{s.label}</p>
              <p className="mt-0.5 truncate text-[1.45rem] font-semibold leading-tight tracking-tight tabular-nums">{s.value}</p>
              {typeof s.progress === "number" && (
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <span className={`block h-full rounded-full ${t.bar}`} style={{ width: `${Math.max(3, Math.min(100, s.progress * 100))}%` }} />
                </span>
              )}
              {s.hint && <p className="mt-1 truncate text-xs text-neutral-500">{s.hint}</p>}
            </div>
          );
        })}
      </div>
    </>
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

/** A coloured icon tile used beside card titles. */
export function SectionIcon({ section, icon: Icon, size = "md" }: { section: Section; icon: React.ElementType; size?: "sm" | "md" }) {
  return (
    <Icon className={`shrink-0 text-neutral-900 ${size === "sm" ? "h-4 w-4" : "h-5 w-5"}`} />
  );
}
