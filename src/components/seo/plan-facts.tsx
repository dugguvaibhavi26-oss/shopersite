import { PLATFORM_PLANS, trialLength } from "@/lib/plans";

/**
 * Every plan in plain text: price, trial and what's included. Rendered on the server so search
 * engines and AI assistants can read the facts without clicking toggles. Read from the plans file,
 * so it can never disagree with checkout.
 */
const r = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

export function planPriceText(id: "free" | "starter" | "pro"): string {
  const p = PLATFORM_PLANS[id];
  if (!p.priceMonthly) return "₹0, free forever, no card needed";
  const trial = p.trialDays ? `${trialLength(p.trialDays)} free trial, then ` : "";
  if (p.introPriceMonthly && p.introMonths) return `${trial}${r(p.introPriceMonthly)} a month for the first ${p.introMonths} months, then ${r(p.priceMonthly)} a month`;
  return `${trial}${r(p.priceMonthly)} a month`;
}

export function PlanFacts({ heading = "Every plan at a glance" }: { heading?: string }) {
  const plans = (["free", "starter", "pro"] as const).map((id) => ({ id, plan: PLATFORM_PLANS[id] }));
  return (
    <section aria-labelledby="plan-facts" className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h2 id="plan-facts" className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {heading}
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] text-neutral-600">
        Prices include GST and are billed monthly. Every plan has 0% commission on your sales: buyers pay you, by cash on delivery or through your own Razorpay account.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map(({ id, plan }) => (
          <article key={id} className="rounded-[24px] bg-neutral-50 p-6 ring-1 ring-black/[0.04]">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-1 text-sm font-medium text-neutral-900">{planPriceText(id)}</p>
            <p className="mt-1 text-sm text-neutral-500">{plan.description}</p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-neutral-700">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
