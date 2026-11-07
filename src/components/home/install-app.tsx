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
      className={`md:hidden inline-flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 shadow-sm active:scale-[0.97] transition-transform hover:border-neutral-300 hover:shadow-md ${className}`}
    >
      {/* Android robot icon in brand green */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edfbf3]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1a9e55" aria-hidden>
          <path d="M17.6 9.48l1.84-3.18a.38.38 0 00-.66-.38l-1.86 3.22a11.4 11.4 0 00-9.84 0L5.22 5.92a.38.38 0 10-.66.38L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
        </svg>
      </span>
      <span className="leading-tight text-left">
        <span className="block text-[11px] text-neutral-400">Free download</span>
        <span className="block text-[14px] font-semibold text-neutral-900">Get the Android app</span>
      </span>
      <Download className="ml-auto h-4 w-4 text-neutral-400" />
    </a>
  );
}
