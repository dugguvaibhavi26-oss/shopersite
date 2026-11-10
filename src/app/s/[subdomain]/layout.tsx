import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreClosedGate } from "@/components/storefront/store-closed-gate";
import { StorefrontThemeSwitch } from "@/components/storefront/site/theme-switch";
import { getStoreDoc } from "@/lib/server/firebase-admin";

/**
 * Every storefront page is drawn by the theme switch; the page files under /s/[subdomain] only
 * exist so their addresses resolve (they render nothing themselves).
 */

/**
 * Each shop's own name and description in search results and link previews, instead of the
 * Shopersite defaults. A slow or failed lookup never holds the page: it falls back after 1.5s.
 */
export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await params;
  // Used when the shop cannot be read in time, so a shop never shows Shopersite's own description.
  const fallback: Metadata = {
    title: subdomain,
    description: `Shop ${subdomain} online. Browse products and order easily.`,
    openGraph: { title: subdomain, siteName: subdomain, images: [] },
    twitter: { card: "summary", title: subdomain },
  };
  try {
    const store = await Promise.race([getStoreDoc(subdomain), new Promise<null>((r) => setTimeout(() => r(null), 1500))]);
    if (!store) return fallback;
    const name = store.name || subdomain;
    const description = (store.tagline || `Shop ${name} online. Browse products and order easily.`).slice(0, 160);
    const hidden = store.isPaused || store.status === "draft";
    return {
      title: name,
      description,
      applicationName: name,
      ...(hidden ? { robots: { index: false, follow: false } } : {}),
      openGraph: { title: name, description, siteName: name, type: "website", images: store.logoUrl ? [{ url: store.logoUrl, alt: name }] : [] },
      twitter: { card: "summary", title: name, description, images: store.logoUrl ? [store.logoUrl] : [] },
      ...(store.logoUrl ? { icons: { icon: store.logoUrl, apple: store.logoUrl } } : {}),
    };
  } catch {
    return fallback;
  }
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <StorefrontThemeSwitch />
      </Suspense>
      {children}
      <StoreClosedGate />
    </>
  );
}
