import type { MetadataRoute } from "next";
import { LEGAL_DOCS } from "@/lib/legal/docs";
import { DOCS } from "@/lib/resources/docs";
import { GUIDES } from "@/lib/resources/guides";
import { SITE_URL } from "@/lib/resources";

/** The marketing site's public pages, for search engines. Shops are on their own addresses. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const latestGuide = GUIDES.reduce((d, g) => (g.date > d ? g.date : d), "2026-01-01");
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/themes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/explore`, lastModified: latestGuide, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/explore/tools`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/explore/festival-calendar`, changeFrequency: "monthly", priority: 0.7 },
    ...GUIDES.map((g) => ({ url: `${base}/explore/${g.slug}`, lastModified: g.date, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/docs`, changeFrequency: "weekly", priority: 0.7 },
    ...DOCS.map((d) => ({ url: `${base}/docs/${d.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${base}/legal`, changeFrequency: "monthly", priority: 0.5 },
    ...LEGAL_DOCS.map((d) => ({ url: `${base}/legal/${d.slug}`, changeFrequency: "yearly" as const, priority: 0.4 })),
  ];
}
