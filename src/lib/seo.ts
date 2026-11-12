import type { Metadata } from "next";
import { PLATFORM_PLANS } from "@/lib/plans";
import { siteConfig } from "@/lib/config/site";

/**
 * SEO helpers for the marketing site: per-page metadata, the share image and the site-wide
 * structured data (Organization, WebSite, SoftwareApplication). Prices come from lib/plans.ts so
 * the markup always matches what sellers actually pay.
 */

export const SITE_URL = `https://www.${siteConfig.domain}`;
export const BRAND = "Shopersite";

/**
 * The one sentence that says what Shopersite is. The same words go on the homepage, About page and
 * structured data (and should be used for directory listings), so search engines and AI assistants
 * see one consistent description. Keep it true: change it when the product changes.
 */
export const BRAND_DEFINITION =
  "Shopersite is an online store builder for Indian sellers: a free plan, 0% commission on sales, cash on delivery, and online payments through the seller's own Razorpay account, on the seller's own shopersite.in address.";

/** Other ways people write the name (and the name it gets confused with in search). */
export const BRAND_ALIASES = ["ShoperSite", "Shoper Site", "shopersite.in"];

export function ogImage(title: string, kicker = "Shopersite") {
  return `/og?title=${encodeURIComponent(title)}&kicker=${encodeURIComponent(kicker)}`;
}

/** Title, description, canonical, Open Graph and X card for one page. */
export function pageMeta({ title, description, path, keywords, kicker, type = "website", noBrandSuffix }: { title: string; description: string; path: string; keywords?: string[]; kicker?: string; type?: "website" | "article"; noBrandSuffix?: boolean }): Metadata {
  const full = noBrandSuffix ? title : `${title} | ${BRAND}`;
  const image = ogImage(title, kicker);
  return {
    title: full,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: { title, description, url: `${SITE_URL}${path}`, type, siteName: BRAND, locale: "en_IN", images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const rupees = (paise: number) => String(Math.round(paise / 100));

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND,
    alternateName: BRAND_ALIASES,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description: BRAND_DEFINITION,
    areaServed: "IN",
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BRAND,
    alternateName: BRAND_ALIASES,
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** The product itself, with the real plan prices (no ratings — we don't have verified ones). */
export function softwareLd() {
  const plans = [PLATFORM_PLANS.free, PLATFORM_PLANS.starter, PLATFORM_PLANS.pro].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: BRAND,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android",
    url: SITE_URL,
    description: BRAND_DEFINITION,
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: plans.map((p) => ({
      "@type": "Offer",
      name: `${p.name} plan`,
      price: rupees(p.priceMonthly),
      priceCurrency: "INR",
      ...(p.priceMonthly > 0 ? { priceSpecification: { "@type": "UnitPriceSpecification", price: rupees(p.priceMonthly), priceCurrency: "INR", unitText: "MONTH" } } : {}),
      url: `${SITE_URL}/register`,
    })),
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}
