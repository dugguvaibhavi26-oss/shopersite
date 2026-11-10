"use client";

import * as React from "react";
import { Check, ChevronDown, Minus, Plug } from "lucide-react";
import { PLATFORM_PLANS, type PlanFeature } from "@/lib/plans";
import { PLAN_BLOCKS, type Cell } from "@/lib/plan-blocks";
import type { PlanMove } from "@/lib/subscription";

/**
 * The plans section of Settings → Plan & billing: three plan cards (with the Growth trial and the
 * Pro intro price spelled out before checkout) and a full comparison, block by block.
 */

const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const ORDER = ["free", "starter", "pro"] as const;
const COL: Record<(typeof ORDER)[number], "free" | "growth" | "pro"> = { free: "free", starter: "growth", pro: "pro" };
/** a quiet accent per plan: Growth indigo, Pro violet; Free stays neutral */
const TONE: Record<string, { bar: string; check: string; badge: string; btn: string; head: string }> = {
  free: { bar: "bg-neutral-200", check: "text-neutral-900", badge: "", btn: "", head: "text-neutral-800" },
  starter: { bar: "bg-indigo-500", check: "text-indigo-600", badge: "bg-indigo-600 text-white", btn: "bg-indigo-600 text-white hover:bg-indigo-700", head: "text-indigo-700" },
  pro: { bar: "bg-violet-500", check: "text-violet-600", badge: "border border-violet-200 bg-violet-50 text-violet-700", btn: "bg-violet-600 text-white hover:bg-violet-700", head: "text-violet-700" },
};

function PriceBlock({ plan, muted }: { plan: PlanFeature; muted: boolean }) {
  if (plan.introPriceMonthly && plan.introMonths) {
    return (
      <div className="mt-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-[32px] font-semibold leading-none tracking-tight tabular-nums">{rupees(plan.introPriceMonthly)}</span>
          <span className="text-sm text-neutral-500">/ month</span>
        </p>
        <p className={`mt-2 text-[13px] ${muted ? "text-neutral-500" : "text-neutral-700"}`}>
          for the first {plan.introMonths} months, then <b className="font-semibold text-neutral-900">{rupees(plan.priceMonthly)}/month</b>
        </p>
      </div>
    );
  }
  if (plan.trialDays) {
    return (
      <div className="mt-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-[32px] font-semibold leading-none tracking-tight tabular-nums">{rupees(plan.priceMonthly)}</span>
          <span className="text-sm text-neutral-500">/ month</span>
        </p>
        <p className={`mt-2 text-[13px] ${muted ? "text-neutral-500" : "text-neutral-700"}`}>
          <b className="font-semibold text-neutral-900">{plan.trialDays} days free</b>, first charge on day {plan.trialDays + 1}
        </p>
      </div>
    );
  }
  if (plan.priceMonthly > 0) {
    return (
      <div className="mt-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-[32px] font-semibold leading-none tracking-tight tabular-nums">{rupees(plan.priceMonthly)}</span>
          <span className="text-sm text-neutral-500">/ month</span>
        </p>
        <p className="mt-2 text-[13px] text-neutral-500">Paid automatically each month</p>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <p className="flex items-baseline gap-1.5">
        <span className="text-[32px] font-semibold leading-none tracking-tight tabular-nums">₹0</span>
        <span className="text-sm text-neutral-500">forever</span>
      </p>
      <p className="mt-2 text-[13px] text-neutral-500">No card needed</p>
    </div>
  );
}

function CellView({ value, soon, tone }: { value: Cell; soon?: boolean; tone: string }) {
  const body =
    value === true ? (
      <Check className={`mx-auto h-4 w-4 ${tone}`} aria-label="Included" />
    ) : value === false ? (
      <Minus className="mx-auto h-4 w-4 text-neutral-300" aria-label="Not included" />
    ) : (
      <span className="text-[12px] font-medium text-neutral-800 sm:text-[13px]">{value}</span>
    );
  return <span className={`block text-center ${soon && value !== false ? "opacity-60" : ""}`}>{body}</span>;
}

export function PlansSection({
  currentPlanId,
  moveFor,
  pending,
  onUpgrade,
  onRenew,
  lowerNote,
  trialUsed,
  introUsed,
}: {
  /** this shop already had its free trial / introductory price: show the normal price instead */
  trialUsed?: boolean;
  introUsed?: boolean;
  currentPlanId: string;
  moveFor: (planId: string) => PlanMove;
  pending: boolean;
  onUpgrade: (planId: "starter" | "pro") => void;
  onRenew: (planId: string) => void;
  lowerNote?: string;
}) {
  const [compareOpen, setCompareOpen] = React.useState(false);
  const plans = ORDER.map((id) => PLATFORM_PLANS[id])
    .filter(Boolean)
    .map((p) => ({ ...p, trialDays: trialUsed ? undefined : p.trialDays, ...(introUsed ? { introPriceMonthly: undefined, introMonths: undefined } : {}) }));

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 pt-2">
        <h3 className="text-base font-semibold">Plans</h3>
        <span className="text-xs text-neutral-500">Billed monthly · cancel any time</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {plans.map((plan) => {
          const move = moveFor(plan.id);
          const isCurrent = move === "current" || move === "renew";
          const lower = move === "downgrade";
          const dark = !!plan.highlight && !isCurrent && !lower;
          const tone = TONE[plan.id] || TONE.free;
          return (
            <div
              key={plan.id}
              aria-disabled={lower}
              className={`relative flex flex-col overflow-hidden rounded-2xl border p-5 sm:p-6 ${
                dark
                  ? "border-indigo-500 bg-gradient-to-b from-indigo-50/60 to-white shadow-[0_0_0_1px_#6366f1,0_20px_40px_-24px_rgba(79,70,229,0.45)]"
                  : isCurrent
                    ? "border-neutral-900 bg-white shadow-[0_0_0_1px_#171717]"
                    : "border-neutral-200 bg-white"
              } ${lower ? "opacity-55" : ""}`}
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${tone.bar} ${lower ? "opacity-40" : ""}`} />
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[15px] font-semibold ${lower ? "" : tone.head}`}>{plan.name}</span>
                {isCurrent ? (
                  <span className="rounded-full bg-neutral-950 px-2.5 py-0.5 text-[11px] font-medium text-white">Current plan</span>
                ) : plan.trialDays && !lower ? (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tone.badge}`}>Most popular</span>
                ) : plan.introPriceMonthly && !lower ? (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tone.badge}`}>Intro offer</span>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] text-neutral-500">{plan.description}</p>

              <PriceBlock plan={plan} muted={lower} />

              <div className="mt-5">
                {move === "upgrade" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onUpgrade(plan.id as "starter" | "pro")}
                    className={`h-11 w-full rounded-xl text-sm font-semibold disabled:opacity-50 ${
                      tone.btn || "border border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                    }`}
                  >
                    {plan.trialDays ? `Start ${plan.trialDays}-day free trial` : `Get ${plan.name}`}
                  </button>
                ) : move === "renew" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onRenew(plan.id)}
                    className="h-11 w-full rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                  >
                    Renew {plan.name}
                  </button>
                ) : (
                  <div className="flex h-11 items-center justify-center rounded-xl bg-neutral-100 text-sm font-medium text-neutral-500">
                    {isCurrent ? "You're on this plan" : "Included in your plan"}
                  </div>
                )}
                {move === "upgrade" && (plan.trialDays || plan.introPriceMonthly) ? (
                  <p className="mt-2 text-center text-[11px] text-neutral-500">
                    {plan.trialDays
                      ? `Cancel before day ${plan.trialDays + 1} and pay nothing`
                      : `${rupees(plan.priceMonthly)}/month from month ${(plan.introMonths || 0) + 1}`}
                  </p>
                ) : null}
              </div>

              <ul className="mt-5 space-y-2.5 border-t border-neutral-100 pt-5 text-[13px] text-neutral-700">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${lower ? "text-neutral-500" : tone.check}`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {lowerNote && <p className="px-1 text-xs text-neutral-500">{lowerNote}</p>}

      {/* full comparison */}
      <div className="rounded-2xl border border-neutral-200 bg-white">
        <button
          type="button"
          onClick={() => setCompareOpen((o) => !o)}
          aria-expanded={compareOpen}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
        >
          <span>
            <span className="block text-[15px] font-semibold">Compare every feature</span>
            <span className="block text-xs text-neutral-500">What each plan includes, block by block</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${compareOpen ? "rotate-180" : ""}`} />
        </button>
        {compareOpen && (
          <div className="border-t border-neutral-100">
            <table className="w-full table-fixed border-collapse text-[13px]">
              <colgroup>
                <col className="w-[46%] sm:w-[52%]" />
                <col />
                <col />
                <col />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 sm:px-6">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className={`px-1 py-3 text-center text-[13px] font-semibold ${(TONE[p.id] || TONE.free).head} ${p.id === currentPlanId ? "underline decoration-2 underline-offset-4" : ""}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_BLOCKS.map((block) => (
                  <React.Fragment key={block.title}>
                    <tr>
                      <td colSpan={4} className="bg-neutral-50 px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 sm:px-6">
                        {block.title}
                      </td>
                    </tr>
                    {block.rows.map((row) => (
                      <tr key={row.feature} className="border-b border-neutral-100 last:border-0">
                        <td className="px-4 py-2.5 text-neutral-800 sm:px-6">
                          {row.feature}
                          {row.soon && <span className="ml-1.5 whitespace-nowrap rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">Coming soon</span>}
                        </td>
                        {plans.map((p) => (
                          <td key={p.id} className={`px-1 py-2.5 ${p.id === currentPlanId ? "bg-neutral-50/70" : ""}`}>
                            <CellView value={row[COL[p.id as (typeof ORDER)[number]]]} soon={row.soon} tone={(TONE[p.id] || TONE.free).check} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* third-party apps */}
      <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50">
          <Plug className="h-4 w-4 text-sky-600" />
        </span>
        <div className="min-w-0 text-[13px]">
          <p className="font-semibold text-neutral-900">Connected apps bill you separately</p>
          <p className="mt-0.5 text-neutral-500">
            Razorpay, Shiprocket, WhatsApp and email providers charge their own fees on your account with them. Shopersite only connects and controls them — we never add a margin.
          </p>
        </div>
      </div>
    </section>
  );
}
