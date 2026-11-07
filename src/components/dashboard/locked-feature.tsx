import * as React from "react";
import { ArrowRight, Lock, type LucideIcon } from "lucide-react";

export interface LockedPerk {
  icon: LucideIcon;
  title: string;
  text: string;
}

/**
 * A "sealed" card for features a seller's plan doesn't include yet: a blurred preview of the
 * feature behind a lock, what it unlocks, and one upgrade button.
 */
export function LockedFeature({
  title,
  text,
  planLabel,
  perks,
  preview,
  ctaLabel,
  onUpgrade,
  onComparePlans,
}: {
  title: string;
  text: string;
  planLabel: string;
  perks: LockedPerk[];
  preview: React.ReactNode;
  ctaLabel: string;
  onUpgrade: () => void;
  onComparePlans?: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-neutral-950 text-white">
      {/* sealed preview */}
      <div className="relative h-44 overflow-hidden sm:h-52">
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none p-5 opacity-60 blur-[3px]">
          {preview}
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-neutral-950/10 via-neutral-950/40 to-neutral-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-950 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.45)]">
            <Lock className="h-6 w-6" />
          </span>
          <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-neutral-950">{planLabel}</span>
        </div>
      </div>

      <div className="px-5 pb-6 sm:px-8 sm:pb-8">
        <h3 className="text-center text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-white/60">{text}</p>

        <ul className="mt-6 space-y-2">
          {perks.map((perk) => (
            <li key={perk.title} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <perk.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{perk.title}</span>
                <span className="block text-xs text-white/55">{perk.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onUpgrade}
          className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-100"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        {onComparePlans && (
          <button
            type="button"
            onClick={onComparePlans}
            className="mt-2 inline-flex h-11 w-full items-center justify-center text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Compare all plans
          </button>
        )}
      </div>
    </div>
  );
}
