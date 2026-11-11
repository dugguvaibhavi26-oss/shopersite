"use client";

import * as React from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { storeService, type StoreData } from "@/lib/store-service";
import { themeKeyOf } from "@/lib/site-content";
import { StatusScreen } from "@/components/ui/status-screen";
import { SiteApp } from "./site-app";
import { canUseTheme, FREE_THEME_SLUG } from "@/lib/theme-pricing";

/**
 * Every storefront page (home, catalog, product, bag, checkout…) is drawn here in the shop's
 * theme, or the one being previewed with ?preview_theme=<slug>. The route files under
 * /s/[subdomain] only exist so those addresses resolve.
 */
export function StorefrontThemeSwitch() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = String(params?.subdomain || "").toLowerCase();
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const [store, setStore] = React.useState<StoreData | null>(null);
  const [settled, setSettled] = React.useState(false);

  // On a fresh address (e.g. a store's own subdomain) nothing is cached yet, so keep the loader
  // until the store arrives, the first cloud sync says it doesn't exist, or 8 seconds pass.
  React.useEffect(() => {
    if (!subdomain) return;
    const sync = () => {
      // uploaded themes have to be known before the shop is drawn in one
      storeService.getPlatformThemes();
      const s = storeService.getStore(subdomain);
      setStore(s ? { ...s } : null);
      if (s || storeService.isCloudSynced()) setSettled(true);
    };
    sync();
    const unsubscribe = storeService.subscribe(sync);
    const giveUp = setTimeout(() => setSettled(true), 8000);
    return () => {
      unsubscribe();
      clearTimeout(giveUp);
    };
  }, [subdomain]);

  if (!store) {
    if (!settled) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" aria-label="Opening the shop" />
        </div>
      );
    }
    return (
      <StatusScreen
        icon={AlertCircle}
        title="This shop doesn't exist yet"
        text={
          <>
            There&apos;s no shop at <span className="font-semibold text-black">{subdomain}</span>. Want this name for your own shop?
          </>
        }
        actions={[
          { label: "Create this shop", href: "/register" },
          { label: "Go to the home page", href: "/", variant: "outline" },
        ]}
      />
    );
  }

  const preview = search.get("preview_theme") || search.get("theme");
  // on the store's own address the path has no /s/<shop> prefix
  const prefix = `/s/${subdomain}`;
  const onAppAddress = pathname === prefix || pathname.startsWith(`${prefix}/`);
  const path = onAppAddress ? pathname.slice(prefix.length) || "/" : pathname;
  const editing = search.get("editor") === "1" && typeof window !== "undefined" && window.parent !== window;
  const keep = new URLSearchParams();
  if (preview) keep.set("preview_theme", preview);
  if (editing) keep.set("editor", "1");

  return (
    <SiteApp
      store={store}
      // a theme that came with a plan that has since lapsed shows as the free default until renewed or bought
      theme={themeKeyOf(preview || (canUseTheme(store, store.activeThemeSlug) ? store.activeThemeSlug : FREE_THEME_SLUG))}
      base={onAppAddress ? prefix : ""}
      path={path}
      query={search.get("q")}
      previewQuery={keep.toString() ? `?${keep}` : ""}
      previewing={!!preview && !editing}
      editing={editing}
    />
  );
}
