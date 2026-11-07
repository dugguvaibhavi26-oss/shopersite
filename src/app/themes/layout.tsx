import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `Theme marketplace · ${siteConfig.name}`,
  description: "Browse every Shopersite storefront theme and start your shop with the one you like.",
};

export default function ThemesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
