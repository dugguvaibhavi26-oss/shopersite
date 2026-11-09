import type { MetadataRoute } from "next";
import { LEGAL_DOCS } from "@/lib/legal/docs";
import { siteConfig } from "@/lib/config/site";

/** The marketing site's public pages, for search engines. Shops are on their own addresses. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://www.${siteConfig.domain}`;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/themes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/legal`, changeFrequency: "monthly", priority: 0.5 },
    ...LEGAL_DOCS.map((d) => ({ url: `${base}/legal/${d.slug}`, changeFrequency: "yearly" as const, priority: 0.4 })),
  ];
}
