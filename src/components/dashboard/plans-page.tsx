"use client";

import * as React from "react";
import { Check, ChevronDown, Minus, Plug } from "lucide-react";
import { PLATFORM_PLANS, trialLength, type PlanFeature } from "@/lib/plans";
import { PLAN_BLOCKS, type Cell } from "@/lib/plan-blocks";
import type { PlanMove } from "@/lib/subscription";

/**
 * The plans section of Settings → Plan & billing: three plan cards (with the free trials and the
 * Pro intro price spelled out before checkout) and a full comparison, block by block.
 */

const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const ORDER = ["free", "starter", "pro"] as const;
const COL: Record<(typeof ORDER)[number], "free" | "growth" | "pro"> = { free: "free", starter: "growth", pro: "pro" };
/** a quiet accent per plan: Growth indigo, Pro violet; Free stays neutral */
const TONE: Record<string, { bar: string; check: string; badge: string; btn: string; head: string }> = {
  free: { bar: "bg-neutral-200", check: "text-neutral-900", badge: "", btn: "", head: "text-neutral-800" },
  starter: { bar: "bg-sky-400", check: "text-neutral-900", badge: "bg-neutral-950 text-white", btn: "bg-neutral-950 text-white hover:bg-black", head: "text-neutral-950" },
  pro: { bar: "bg-violet-400", check: "text-neutral-900", badge: "bg-violet-50 text-violet-700", btn: "bg-neutral-950 text-white hover:bg-black", head: "text-neutral-950" },
};

function PriceBlock({ plan, muted, dark }: { plan: PlanFeature; muted: boolean; dark?: boolean }) {
  const strong = dark ? "font-semibold text-white" : "font-semibold text-neutral-900";
  const soft = dark ? "text-white/60" : muted ? "text-neutral-500" : "text-neutral-600";
  const big = (price: string, unit: string) => (
    <p className="flex items-baseline gap-1.5">
      <span className={`text-[40px] font-semibold leading-none tracking-tight tabular-nums ${dark ? "text-lime-200" : ""}`}>{price}</span>
      <span className={`text-sm ${dark ? "text-white/60" : "text-neutral-500"}`}>{unit}</span>
    </p>
  );
  if (plan.introPriceMonthly && plan.introMonths) {
    return (
      <div className="mt-6">
        {big(rupees(plan.introPriceMonthly), "/month")}
        <p className={`mt-2 text-[13px] ${soft}`}>
          {plan.trialDays ? (
            <>
              <b className={strong}>{trialLength(plan.trialDays)} free</b>, then this price{" "}
            </>
          ) : null}
          for the first {plan.introMonths} months, then <b className={strong}>{rupees(plan.priceMonthly)}/month</b>
        </p>
      </div>
    );
  }
  if (plan.trialDays) {
    return (
      <div className="mt-6">
        {big(rupees(plan.priceMonthly), "/month")}
        <p className={`mt-2 text-[13px] ${soft}`}>
          <b className={strong}>{trialLength(plan.trialDays)} free</b>, then paid automatically each month
        </p>
      </div>
    );
  }
  if (plan.priceMonthly > 0) {
    return (
      <div className="mt-6">
        {big(rupees(plan.priceMonthly), "/month")}
        <p className={`mt-2 text-[13px] ${soft}`}>Paid automatically each month</p>
      </div>
    );
  }
  return (
    <div className="mt-6">
      {big("₹0", "forever")}
      <p className={`mt-2 text-[13px] ${soft}`}>No card needed</p>
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
  const paidCurrent = plans.find((p) => p.priceMonthly > 0 && ["current", "renew"].includes(moveFor(p.id)));
  const darkId = (paidCurrent || plans.find((p) => p.highlight) || plans[1])?.id;

  return (
    <section className="space-y-4">
      <div className="px-2 pb-2 pt-6 text-center sm:pt-8">
        <h3 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">Plans that grow with your shop</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">Start free and move up when you need more. Change or cancel any time.</p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 ring-1 ring-black/[0.05]">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400" /> Billed monthly · cancel any time
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
        {plans.map((plan) => {
          const move = moveFor(plan.id);
          const isCurrent = move === "current" || move === "renew";
          const lower = move === "downgrade";
          // the dark card: the paid plan you're on, otherwise the one we recommend
          const dark = plan.id === darkId;
          return (
            <div
              key={plan.id}
              aria-disabled={lower}
              className={`flex flex-col rounded-[28px] p-2 ${dark ? "bg-neutral-950 text-white" : "bg-white ring-1 ring-black/[0.04]"} ${lower ? "opacity-55" : ""}`}
            >
              {/* name, price and button */}
              <div className="px-4 pb-5 pt-4 sm:px-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[17px] font-semibold">{plan.name}</span>
                  {isCurrent ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${dark ? "bg-white text-neutral-950" : "bg-neutral-950 text-white"}`}>Current plan</span>
                  ) : plan.highlight && !lower ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${dark ? "bg-lime-200 text-neutral-950" : "bg-neutral-100 text-neutral-700"}`}>Most popular</span>
                  ) : plan.introPriceMonthly && !lower ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${dark ? "bg-lime-200 text-neutral-950" : "bg-violet-50 text-violet-700"}`}>Intro offer</span>
                  ) : null}
                </div>
                <p className={`mt-1 text-[13px] ${dark ? "text-white/60" : "text-neutral-500"}`}>{plan.description}</p>

                <PriceBlock plan={plan} muted={lower} dark={dark} />

                <div className="mt-5">
                  {move === "upgrade" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onUpgrade(plan.id as "starter" | "pro")}
                      style={{ minHeight: 0 }}
                      className={`h-11 w-full rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
                        dark ? "bg-lime-200 text-neutral-950 hover:bg-lime-300" : "bg-white text-neutral-950 ring-1 ring-neutral-200 hover:ring-neutral-950"
                      }`}
                    >
                      {plan.trialDays ? `Start ${trialLength(plan.trialDays)} free` : `Get ${plan.name}`}
                    </button>
                  ) : move === "renew" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onRenew(plan.id)}
                      style={{ minHeight: 0 }}
                      className={`h-11 w-full rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${dark ? "bg-lime-200 text-neutral-950 hover:bg-lime-300" : "bg-neutral-950 text-white hover:bg-black"}`}
                    >
                      Renew {plan.name}
                    </button>
                  ) : (
                    <div className={`flex h-11 items-center justify-center rounded-full text-sm font-medium ${dark ? "bg-white/10 text-white/80" : "bg-neutral-100 text-neutral-500"}`}>
                      {isCurrent ? "You're on this plan" : "Included in your plan"}
                    </div>
                  )}
                  {move === "upgrade" && (plan.trialDays || plan.introPriceMonthly) ? (
                    <p className={`mt-2 text-center text-[11px] ${dark ? "text-white/55" : "text-neutral-500"}`}>
                      {plan.trialDays ? "Cancel before the trial ends and pay nothing" : `${rupees(plan.priceMonthly)}/month from month ${(plan.introMonths || 0) + 1}`}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* what it includes, on an inset panel */}
              <ul className={`flex-1 space-y-3 rounded-[22px] p-5 text-[13px] ${dark ? "bg-white text-neutral-800" : "bg-neutral-100/80 text-neutral-700"}`}>
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${lower ? "bg-neutral-300 text-white" : "bg-neutral-950 text-white"}`}>
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
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
      <div className="rounded-[24px] bg-white ring-1 ring-black/[0.04]">
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
      <div className="flex gap-3 rounded-[24px] bg-white ring-1 ring-black/[0.04] p-4 sm:p-5">
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
