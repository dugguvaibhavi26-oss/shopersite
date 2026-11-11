import type { Metadata } from "next";
import { ShopLd, shopPageMetadata } from "@/lib/server/shop-seo";

type Props = { params: Promise<{ subdomain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  return shopPageMetadata(p.subdomain, { kind: "home" });
}

/** Drawn by the storefront layout in the shop's theme (src/components/storefront/site); this adds only the search-engine data. */
export default async function Page({ params }: Props) {
  const p = await params;
  return <ShopLd subdomain={p.subdomain} page={{ kind: "home" }} />;
}
