"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSite } from "./context";

/**
 * The seller's own tracking (Settings → Tracking & ads): Meta Pixel and Google Analytics, loaded only
 * on the live storefront (never in the theme editor or previews). With the cookie notice on
 * (Settings → Customer privacy) nothing loads until the buyer accepts.
 */

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const PIXEL = /^\d{10,20}$/;
const GA = /^G-[A-Z0-9]{4,14}$/;

function loadScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function startPixel(id: string) {
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as Fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
    loadScript("https://connect.facebook.net/en_US/fbevents.js");
  }
  window.fbq("init", id);
}

function startGa(id: string) {
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  }
  // page views are sent by hand on each page change below
  window.gtag("config", id, { send_page_view: false });
}

export function StoreTracking() {
  const { store, editing, demo } = useSite();
  const pathname = usePathname();
  const pixel = PIXEL.test(store.tracking?.metaPixelId || "") ? store.tracking!.metaPixelId! : "";
  const ga = GA.test(store.tracking?.gaId || "") ? store.tracking!.gaId! : "";
  const hasTracking = !!(pixel || ga);
  const needsConsent = store.cookieBanner ?? hasTracking;
  const key = `cookie-consent:${store.subdomain}`;
  const [choice, setChoice] = React.useState<"yes" | "no" | null | "unknown">("unknown");
  const started = React.useRef(false);
  const live = !editing && !demo;

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      setChoice(v === "yes" || v === "no" ? v : null);
    } catch {
      setChoice(null);
    }
  }, [key]);

  const allowed = live && hasTracking && (!needsConsent || choice === "yes");

  React.useEffect(() => {
    if (!allowed || started.current) return;
    started.current = true;
    if (pixel) startPixel(pixel);
    if (ga) startGa(ga);
  }, [allowed, pixel, ga]);

  // one page view per page, including moves between pages without a reload
  React.useEffect(() => {
    if (!allowed) return;
    if (pixel) window.fbq?.("track", "PageView");
    if (ga) window.gtag?.("event", "page_view", { page_path: pathname, page_location: window.location.href });
  }, [allowed, pathname, pixel, ga]);

  const decide = (v: "yes" | "no") => {
    setChoice(v);
    try {
      localStorage.setItem(key, v);
    } catch {
      // private mode: the choice lasts for this visit only
    }
  };

  if (!live || !needsConsent || choice !== null) return null;
  return (
    <div role="dialog" aria-label="Cookie notice" className="dialog-pop fixed inset-x-3 bottom-3 z-[150] mx-auto max-w-xl rounded-2xl border border-black/10 bg-white p-4 text-neutral-900 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)] sm:inset-x-auto sm:left-1/2 sm:w-[560px] sm:-translate-x-1/2 font-[Inter,sans-serif]">
      <p className="text-[14px] leading-relaxed">
        {store.name} uses cookies to keep your bag and sign-in working{hasTracking ? ", and to measure visits and ads" : ""}.{" "}
        <a href={`${window.location.pathname.startsWith("/s/") ? `/s/${store.subdomain}` : ""}/pages/privacy`} className="underline underline-offset-2">
          Privacy policy
        </a>
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => decide("no")} style={{ minHeight: 0 }} className="h-10 rounded-xl border border-neutral-200 px-4 text-[14px] font-medium hover:border-neutral-900">
          Decline
        </button>
        <button type="button" onClick={() => decide("yes")} style={{ minHeight: 0 }} className="h-10 rounded-xl bg-neutral-950 px-4 text-[14px] font-semibold text-white hover:bg-black">
          Accept
        </button>
      </div>
    </div>
  );
}
