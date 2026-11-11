import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Pricing: Free, Growth and Pro plans",
  description: "Shopersite pricing for Indian sellers. Start on the free plan, or pick Growth or Pro for more products, themes and tools. 0% commission on every plan.",
  path: "/pricing",
  kicker: "Pricing",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
