import { DOC_CATEGORIES, DOCS } from "./docs";
import { GUIDES } from "./guides";
import { headingsOf } from "./types";
import { siteConfig } from "@/lib/config/site";
import type { SearchEntry } from "@/components/resources/docs-search";

/** Public base URL of the marketing site (canonical links, sitemap, structured data). */
export const SITE_URL = `https://www.${siteConfig.domain}`;

/** Everything searchable on /docs and /explore. Built once on the server. */
export function searchIndex(): SearchEntry[] {
  const cat = Object.fromEntries(DOC_CATEGORIES.map((c) => [c.id, c.title]));
  return [
    ...DOCS.map((d) => ({
      href: `/docs/${d.slug}`,
      title: d.title,
      summary: d.summary,
      group: cat[d.category] || "Help",
      text: `${d.title} ${d.summary} ${(d.keywords || []).join(" ")} ${headingsOf(d.body).map((h) => h.title).join(" ")}`.toLowerCase(),
    })),
    ...GUIDES.map((g) => ({
      href: `/explore/${g.slug}`,
      title: g.title,
      summary: g.summary,
      group: "Guide",
      text: `${g.title} ${g.summary} ${g.keywords.join(" ")} ${headingsOf(g.body).map((h) => h.title).join(" ")}`.toLowerCase(),
    })),
  ];
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  const strip = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1");
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: strip(f.a) } })),
  };
}

export const PUBLISHER = {
  "@type": "Organization",
  name: siteConfig.name,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
};
