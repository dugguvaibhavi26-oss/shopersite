import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";
import type { CategoryData, ProductData, StoreData } from "@/lib/store-service";
import { getStoreDoc } from "./firebase-admin";

/**
 * Search-engine details for seller shops: each page's title, description, canonical address and
 * structured data, plus the shop's own robots.txt and sitemap.xml. Only what buyers already see on
 * the shop is used (name, tagline, products, categories); never orders, customers or owner details.
 */

/** One read per request, shared by the layout and the page. A slow or failed read gives null. */
export const shopForSeo = cache(async (subdomain: string): Promise<StoreData | null> => {
  try {
    return await Promise.race([getStoreDoc(subdomain), new Promise<null>((r) => setTimeout(() => r(null), 1500))]);
  } catch {
    return null;
  }
});

/** The one address search engines should use for a shop: its own domain if connected, else its shopersite.in address. */
export function shopOrigin(store: Pick<StoreData, "subdomain" | "customDomain">): string {
  return store.customDomain ? `https://${store.customDomain}` : `https://${store.subdomain}.${siteConfig.domain}`;
}

/** Shops that are not open to the public stay out of search results. */
export function shopHidden(store: StoreData): boolean {
  return Boolean(store.isPaused) || store.status !== "published";
}

const NOINDEX: Metadata = { robots: { index: false, follow: false } };

export function plainText(html: string, max = 160): string {
  const text = String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const webImage = (url?: string) => (url && /^https?:\/\//.test(url) ? url : undefined);

export const liveProducts = (store: StoreData): ProductData[] => (store.products || []).filter((p) => p.status === "published");
export const liveCategories = (store: StoreData): CategoryData[] => (store.categories || []).filter((c) => c.isActive !== false && c.slug);
export const productPath = (p: ProductData) => `/products/${p.slug || p.id}`;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function findProduct(store: StoreData, slug: string) {
  const key = safeDecode(slug);
  return liveProducts(store).find((p) => p.slug === key || p.id === key);
}
function findCategory(store: StoreData, slug: string) {
  const key = safeDecode(slug);
  return liveCategories(store).find((c) => c.slug === key);
}

function meta(store: StoreData, path: string, title: string | null, description: string, image?: string): Metadata {
  const name = store.name || store.subdomain;
  const url = `${shopOrigin(store)}${path === "/" ? "" : path}`;
  const full = title ? `${title} | ${name}` : name;
  const own = webImage(image);
  const img = own || webImage(store.logoUrl);
  return {
    title: full,
    description,
    alternates: { canonical: url },
    ...(shopHidden(store) ? NOINDEX : {}),
    openGraph: { title: title || name, description, url, siteName: name, type: "website", locale: "en_IN", images: img ? [{ url: img, alt: title || name }] : [] },
    twitter: { card: own ? "summary_large_image" : "summary", title: title || name, description, images: img ? [img] : [] },
  };
}

const PAGE_TITLES: Record<string, string> = {
  terms: "Terms & conditions",
  returns: "Returns, refunds & cancellations",
  shipping: "Shipping & delivery",
  privacy: "Privacy policy",
  about: "About us",
  contact: "Contact us",
};

export type ShopPage = { kind: "home" } | { kind: "catalog" } | { kind: "product"; slug: string } | { kind: "category"; slug: string } | { kind: "page"; id: string };

/** Metadata for one shop page. A shop that could not be read adds nothing (the layout's fallback stays). */
export async function shopPageMetadata(subdomain: string, page: ShopPage): Promise<Metadata> {
  const store = await shopForSeo(subdomain);
  if (!store) return {};
  const name = store.name || subdomain;
  if (page.kind === "home") return meta(store, "/", null, plainText(store.tagline || "") || `Shop ${name} online. Browse products and order easily.`);
  if (page.kind === "catalog") return meta(store, "/catalog", "All products", `Browse every product from ${name} and order online.`);
  if (page.kind === "product") {
    const p = findProduct(store, page.slug);
    if (!p) return NOINDEX;
    const price = `₹${Math.round(p.price / 100).toLocaleString("en-IN")}`;
    return meta(store, productPath(p), p.title, plainText(p.description) || `Buy ${p.title} for ${price} at ${name}.`, p.images?.[0]);
  }
  if (page.kind === "category") {
    const c = findCategory(store, page.slug);
    if (!c) return NOINDEX;
    return meta(store, `/category/${c.slug}`, c.name, plainText(c.description || c.subtitle || "") || `Shop ${c.name} at ${name}.`, c.bannerUrl || c.imageUrl);
  }
  const title = PAGE_TITLES[page.id];
  if (!title) return {};
  return meta(store, `/pages/${page.id}`, title, `${title} for ${name}.`);
}

/** Structured data for one shop page (what search engines use for rich results), or null. */
export async function shopPageLd(subdomain: string, page: ShopPage): Promise<unknown[] | null> {
  const store = await shopForSeo(subdomain);
  if (!store || shopHidden(store)) return null;
  const origin = shopOrigin(store);
  const name = store.name || subdomain;
  const crumbs = (items: { name: string; path: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${origin}${it.path === "/" ? "" : it.path}` })),
  });
  if (page.kind === "home") {
    const logo = webImage(store.logoUrl);
    return [
      { "@context": "https://schema.org", "@type": "OnlineStore", name, url: origin, ...(store.tagline ? { description: plainText(store.tagline, 300) } : {}), ...(logo ? { logo, image: logo } : {}) },
      { "@context": "https://schema.org", "@type": "WebSite", name, url: origin },
    ];
  }
  if (page.kind === "product") {
    const p = findProduct(store, page.slug);
    if (!p) return null;
    const images = (p.images || []).map(webImage).filter(Boolean);
    const description = plainText(p.description, 5000);
    // only real, approved buyer reviews count toward the rating
    const ratings = (store.reviews || []).filter((r) => r.productId === p.id && r.status === "approved" && r.rating >= 1 && r.rating <= 5).map((r) => r.rating);
    const category = liveCategories(store).find((c) => c.name === p.category || c.slug === p.category);
    return [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.title,
        ...(description ? { description } : {}),
        ...(images.length ? { image: images } : {}),
        sku: p.id,
        ...(p.category ? { category: p.category } : {}),
        brand: { "@type": "Brand", name },
        offers: {
          "@type": "Offer",
          url: `${origin}${productPath(p)}`,
          priceCurrency: "INR",
          price: (p.price / 100).toFixed(2),
          availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name },
        },
        ...(ratings.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1), reviewCount: ratings.length } } : {}),
      },
      crumbs([{ name: "Home", path: "/" }, ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []), { name: p.title, path: productPath(p) }]),
    ];
  }
  if (page.kind === "category") {
    const c = findCategory(store, page.slug);
    if (!c) return null;
    const items = liveProducts(store).filter((p) => p.category === c.name || p.category === c.slug).slice(0, 30);
    return [
      crumbs([{ name: "Home", path: "/" }, { name: c.name, path: `/category/${c.slug}` }]),
      ...(items.length ? [{ "@context": "https://schema.org", "@type": "ItemList", name: c.name, itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${origin}${productPath(p)}` })) }] : []),
    ];
  }
  return null;
}

/** The script tags holding a page's structured data. */
export async function ShopLd({ subdomain, page }: { subdomain: string; page: ShopPage }) {
  const data = await shopPageLd(subdomain, page);
  if (!data) return null;
  return (
    <>
      {data.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}

/** robots.txt served on a shop's own address. */
export function shopRobots(store: StoreData | null, origin: string): string {
  const lines = ["User-agent: *"];
  if (store && shopHidden(store)) lines.push("Disallow: /");
  else lines.push("Allow: /", "Disallow: /cart", "Disallow: /bag", "Disallow: /checkout", "Disallow: /account", "Disallow: /order/", "Disallow: /wishlist", "Disallow: /search", "Disallow: /api/", "", `Sitemap: ${origin}/sitemap.xml`);
  return `${lines.join("\n")}\n`;
}

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const xml = (s: string) => s.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);

/** sitemap.xml served on a shop's own address: home, catalog, categories, products and policy pages. */
export function shopSitemap(store: StoreData): string {
  const urls: { loc: string; priority: string; lastmod?: string }[] = [];
  if (!shopHidden(store)) {
    const origin = shopOrigin(store);
    urls.push({ loc: `${origin}/`, priority: "1.0" }, { loc: `${origin}/catalog`, priority: "0.8" });
    for (const c of liveCategories(store)) urls.push({ loc: `${origin}/category/${encodeURIComponent(c.slug)}`, priority: "0.7" });
    for (const p of liveProducts(store)) {
      const day = /^\d{4}-\d{2}-\d{2}/.test(p.createdAt || "") ? p.createdAt.slice(0, 10) : undefined;
      urls.push({ loc: `${origin}/products/${encodeURIComponent(p.slug || p.id)}`, priority: "0.9", lastmod: day });
    }
    for (const id of ["terms", "returns", "shipping", "privacy"] as const) if (store.policies?.[id]?.body) urls.push({ loc: `${origin}/pages/${id}`, priority: "0.3" });
  }
  const body = urls.map((u) => `  <url><loc>${xml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<priority>${u.priority}</priority></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
