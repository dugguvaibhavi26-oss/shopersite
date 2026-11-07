"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTheme } from "@/lib/themes";
import { themeKeyOf } from "@/lib/site-content";
import type { StoreData } from "@/lib/store-service";
import { SiteApp } from "@/components/storefront/site/site-app";

/**
 * A theme as a working website for the public theme marketplace: a sample shop in that theme with its own sample
 * products, which visitors can click around (orders can't be placed). `?shot=1` leaves out the top bar for the
 * marketplace's screenshots, and inside a frame it's left out too.
 */
export default function ThemePreviewPage() {
  return (
    <React.Suspense fallback={null}>
      <ThemePreview />
    </React.Suspense>
  );
}

const sampleShop = (slug: string): StoreData => {
  const theme = getTheme(slug);
  const now = new Date().toISOString();
  return {
    id: `preview-${slug}`,
    name: theme.name,
    subdomain: `preview-${slug}`,
    status: "published",
    category: theme.category || "Fashion",
    tagline: theme.tagline,
    ownerName: "Shopersite",
    contactPhone: "",
    upiId: "",
    codEnabled: true,
    codFee: 0,
    freeDeliveryThreshold: 50000,
    standardDeliveryFee: 5000,
    planId: "pro",
    activeThemeSlug: slug,
    isPaused: false,
    categories: [],
    products: [],
    banners: [],
    reviews: [],
    orders: [],
    customers: [],
    createdAt: now,
    updatedAt: now,
  };
};

function ThemePreview() {
  const params = useParams<{ slug: string; path?: string[] }>();
  const search = useSearchParams();
  const slug = String(params?.slug || "");
  const theme = getTheme(slug);
  const store = React.useMemo(() => sampleShop(slug), [slug]);
  const path = `/${(params?.path || []).join("/")}`;
  // unknown until mounted, so the bar never flashes inside the marketplace's frame
  const [framed, setFramed] = React.useState<boolean | null>(null);
  React.useEffect(() => setFramed(window.parent !== window), []);
  const bar = search.get("shot") !== "1" && framed === false;
  const keep = search.get("shot") === "1" ? "?shot=1" : "";

  return (
    <>
      {/* screenshots leave out the dev server's corner badge */}
      {keep && <style>{"nextjs-portal{display:none!important}"}</style>}
      {bar && (
        <div className="sticky top-0 z-[100] flex h-12 items-center justify-between gap-3 bg-black px-3 text-[13px] text-white sm:px-5">
          <Link href={`/themes?theme=${theme.slug}`} className="flex min-w-0 items-center gap-2 rounded-full px-2 py-1 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">All themes</span>
          </Link>
          <span className="truncate text-white/70">
            Live preview of <span className="font-semibold text-white">{theme.name}</span>
            <span className="hidden sm:inline"> with sample products</span>
          </span>
          <Link
            href={`/register?theme=${theme.slug}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-semibold text-black hover:bg-neutral-200"
          >
            Use this theme
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      <SiteApp
        store={store}
        theme={themeKeyOf(slug)}
        base={`/themes/preview/${slug}`}
        path={path}
        query={search.get("q")}
        previewQuery={keep}
        previewing
        editing={false}
        sellerBar={false}
      />
    </>
  );
}
