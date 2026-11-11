import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Theme marketplace: online store designs",
  description: "Browse every Shopersite storefront theme, preview it on phone and desktop, and start your shop with the one you like.",
  path: "/themes",
  kicker: "Themes",
});

export default function ThemesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
