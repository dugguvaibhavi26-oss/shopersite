import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { PlanFacts } from "@/components/seo/plan-facts";
import { JsonLd } from "@/components/resources/blocks";
import { softwareLd } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Pricing: Free, Growth and Pro plans",
  description: "Shopersite pricing for Indian sellers. Start on the free plan, or pick Growth or Pro for more products, themes and tools. 0% commission on every plan.",
  path: "/pricing",
  kicker: "Pricing",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={softwareLd()} />
      {children}
      {/* the same plans in plain text, readable without the toggle (search engines and AI assistants) */}
      <div className="bg-white font-[Inter,sans-serif] text-neutral-950">
        <PlanFacts />
      </div>
    </>
  );
}
