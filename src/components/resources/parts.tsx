import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CalendarDays,
  ChevronRight,
  Compass,
  CreditCard,
  Megaphone,
  Package,
  Palette,
  Plug,
  Receipt,
  Rocket,
  Scale,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Wrench,
} from "lucide-react";
import type { Guide } from "@/lib/resources/types";

/** Shared, server-rendered pieces for the Help Center and Explore. */

export const DOC_ICONS: Record<string, React.ElementType> = { Rocket, Package, ShoppingBag, CreditCard, Truck, Palette, Megaphone, Settings, Receipt, Sparkles, Plug };

export const GUIDE_ICONS: Record<Guide["category"], React.ElementType> = {
  Start: Rocket,
  "Sell more": TrendingUp,
  Marketing: Megaphone,
  Operations: Wrench,
  Trends: BarChart3,
  Compare: Scale,
};

export const TINTS: Record<Guide["tint"], { bg: string; ink: string; dot: string }> = {
  rose: { bg: "bg-[radial-gradient(120%_120%_at_0%_0%,#ffe4e6_0%,#fff1f2_45%,#fafafa_100%)]", ink: "text-rose-700", dot: "bg-rose-400" },
  amber: { bg: "bg-[radial-gradient(120%_120%_at_0%_0%,#fde68a_0%,#fef3c7_40%,#fafafa_100%)]", ink: "text-amber-800", dot: "bg-amber-400" },
  emerald: { bg: "bg-[radial-gradient(120%_120%_at_0%_0%,#a7f3d0_0%,#ecfdf5_45%,#fafafa_100%)]", ink: "text-emerald-800", dot: "bg-emerald-400" },
  sky: { bg: "bg-[radial-gradient(120%_120%_at_0%_0%,#bae6fd_0%,#f0f9ff_45%,#fafafa_100%)]", ink: "text-sky-800", dot: "bg-sky-400" },
  violet: { bg: "bg-[radial-gradient(120%_120%_at_0%_0%,#ddd6fe_0%,#f5f3ff_45%,#fafafa_100%)]", ink: "text-violet-800", dot: "bg-violet-400" },
  stone: { bg: "bg-[radial-gradient(120%_120%_at_0%_0%,#e7e5e4_0%,#fafaf9_45%,#fafafa_100%)]", ink: "text-stone-700", dot: "bg-stone-400" },
};

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-neutral-500">
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 && <ChevronRight aria-hidden className="h-3.5 w-3.5 text-neutral-300" />}
          {it.href ? (
            <Link href={it.href} className="hover:text-neutral-950">
              {it.label}
            </Link>
          ) : (
            <span className="text-neutral-950">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** The art panel on guide cards and the guide header: a soft tint, the topic icon and a few shapes. */
export function GuideArt({ guide, size = "md" }: { guide: Guide; size?: "sm" | "md" | "lg" }) {
  const t = TINTS[guide.tint];
  const Icon = GUIDE_ICONS[guide.category];
  const box = size === "lg" ? "h-14 w-14 rounded-2xl" : size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-xl";
  return (
    <div className={`relative h-full w-full overflow-hidden ${t.bg}`}>
      <span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/70" />
      <span aria-hidden className="absolute -right-4 top-12 h-24 w-24 rounded-full border border-white/60" />
      <span aria-hidden className={`absolute bottom-5 right-6 h-2 w-2 rounded-full ${t.dot}`} />
      <span aria-hidden className={`absolute bottom-9 right-12 h-1.5 w-1.5 rounded-full ${t.dot} opacity-60`} />
      <span className={`absolute left-5 top-5 flex items-center justify-center bg-white/80 shadow-sm backdrop-blur ${box} ${t.ink}`}>
        <Icon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
      </span>
      <span className={`absolute bottom-4 left-5 text-[11px] font-semibold uppercase tracking-[0.14em] ${t.ink}`}>{guide.category}</span>
    </div>
  );
}

export function GuideCard({ guide, wide }: { guide: Guide; wide?: boolean }) {
  return (
    <Link
      href={`/explore/${guide.slug}`}
      className={`group flex overflow-hidden rounded-[22px] border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35)] ${wide ? "flex-col sm:flex-row" : "flex-col"}`}
    >
      <div className={wide ? "h-44 shrink-0 sm:h-auto sm:w-[44%]" : "h-40"}>
        <GuideArt guide={guide} />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className={`font-semibold leading-snug tracking-[-0.01em] text-neutral-950 ${wide ? "text-[22px] sm:text-[26px]" : "text-[17px]"}`}>{guide.title}</h3>
        <p className={`mt-2 text-neutral-500 ${wide ? "text-[15px] leading-relaxed" : "line-clamp-2 text-[14px] leading-relaxed"}`}>{guide.summary}</p>
        <span className="mt-auto flex items-center justify-between pt-5 text-[13px]">
          <span className="text-neutral-400">{guide.minutes} min read</span>
          <span className="inline-flex items-center gap-1 font-semibold text-neutral-950">
            Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </Link>
  );
}

export function PlanBadge({ plan }: { plan?: "Growth" | "Pro" }) {
  if (!plan) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${plan === "Pro" ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200" : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"}`}>
      {plan === "Pro" ? "Pro plan" : "Growth & Pro"}
    </span>
  );
}

/** The dark sign-up band at the end of pages. */
export function StartBand({ title = "Start your online shop today", text = "Free forever plan. No card needed. Your shop is live in minutes." }: { title?: string; text?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-[28px] bg-neutral-950 px-6 py-12 text-white sm:px-12 sm:py-16">
        <span aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <span aria-hidden className="absolute -right-8 top-20 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative max-w-xl">
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">{title}</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/60">{text}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-neutral-950 transition-colors hover:bg-neutral-200">
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/themes" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-[15px] font-semibold text-white transition-colors hover:border-white/50">
              See themes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Small link cards to the other resource areas. */
export const RESOURCE_LINKS = [
  { href: "/docs", icon: Compass, title: "Help Center", text: "Step-by-step setup guides" },
  { href: "/explore/tools", icon: Calculator, title: "Seller tools", text: "Profit, GST and COD calculators" },
  { href: "/explore/festival-calendar", icon: CalendarDays, title: "Festival calendar", text: "Plan every sale season" },
];
