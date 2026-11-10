"use client";

import * as React from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { firebaseConfig } from "@/lib/firebase-config";
import { siteConfig } from "@/lib/config/site";

/**
 * Google Analytics 4 for the Shopersite marketing site only: the homepage, landing pages, guides,
 * the Help Center, themes and sign-up. Never on seller stores (they have their own tracking), the
 * dashboard, admin, or order and invoice links (their addresses contain private tokens).
 *
 * The measurement ID comes from NEXT_PUBLIC_GA_MEASUREMENT_ID, or the Firebase project's GA4 stream.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || (firebaseConfig as { measurementId?: string }).measurementId || "";
const PRIVATE = /^\/(dashboard|admin|app|orders|invoice|s\/|cashfree|login)/;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Only Shopersite's own addresses — never a seller's subdomain or connected domain. */
function isMarketingHost(host: string) {
  const own = siteConfig.domain.toLowerCase();
  return host === own || host === `www.${own}` || host === "localhost" || host.endsWith(".vercel.app");
}

/** Send a GA4 event from anywhere (no-op when analytics isn't loaded). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag("event", name, params);
}

export function SiteAnalytics() {
  const pathname = usePathname() || "/";
  const [allowed, setAllowed] = React.useState(false);

  React.useEffect(() => {
    setAllowed(!!GA_ID && isMarketingHost(window.location.hostname));
  }, []);

  // page views on client-side navigation (the first one is sent by the config call)
  const first = React.useRef(true);
  React.useEffect(() => {
    if (!allowed || PRIVATE.test(pathname)) return;
    if (first.current) {
      first.current = false;
      return;
    }
    window.gtag?.("event", "page_view", { page_path: pathname, page_location: window.location.origin + pathname });
  }, [pathname, allowed]);

  if (!allowed || PRIVATE.test(pathname)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{page_path:location.pathname});`}
      </Script>
    </>
  );
}
