"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { isNativeApp } from "@/lib/native/platform";

/** Where the Android app is served from (public/downloads). Bump APP_VERSION with each new build. */
export const APK_URL = "/downloads/shopersite.apk";
export const APP_VERSION = "1.0.0";

/**
 * "Install the Android app" on the landing page: phones only (hidden from md up), never inside the
 * app itself, and not on iPhones (an APK can't be installed there).
 */
export function InstallAndroidApp({ className = "" }: { className?: string }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    setShow(!isNativeApp() && !ios);
  }, []);
  if (!show) return null;
  return (
    <a
      href={APK_URL}
      download={`shopersite-${APP_VERSION}.apk`}
      className={`md:hidden inline-flex items-center gap-2.5 rounded-[12px] bg-black py-2 pl-2.5 pr-4 text-left text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)] active:scale-[0.98] transition-transform ${className}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/10">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="#3DDC84" aria-hidden>
          <path d="M17.6 9.48l1.84-3.18a.38.38 0 00-.66-.38l-1.86 3.22a11.4 11.4 0 00-9.84 0L5.22 5.92a.38.38 0 10-.66.38L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-white/60">Install the app</span>
        <span className="block text-[14px] font-semibold">Get it for Android</span>
      </span>
      <Download className="ml-1 h-4 w-4 text-white/70" />
    </a>
  );
}
