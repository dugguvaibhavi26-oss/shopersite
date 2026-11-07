"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/** Call before a programmatic navigation (router.push/replace) to show the loading bar. */
export function startNavProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nav:start"));
}

/**
 * Thin progress bar along the top of the screen while the next page loads, so a tap always shows
 * that something is happening. Starts on clicks of internal links (and on `startNavProgress()`),
 * finishes when the new page is showing.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [state, setState] = React.useState<"idle" | "loading" | "done">("idle");
  const timers = React.useRef<number[]>([]);
  const loading = React.useRef(false);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // New page showing: complete the bar, then hide it
  React.useEffect(() => {
    if (!loading.current) return;
    loading.current = false;
    clearTimers();
    setState("done");
    timers.current.push(window.setTimeout(() => setState("idle"), 380));
  }, [pathname]);

  React.useEffect(() => {
    const start = () => {
      clearTimers();
      loading.current = true;
      setState("loading");
      // never leave it hanging if a navigation is cancelled
      timers.current.push(
        window.setTimeout(() => {
          loading.current = false;
          setState("idle");
        }, 10000)
      );
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    window.addEventListener("click", onClick);
    window.addEventListener("nav:start", start);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("nav:start", start);
      clearTimers();
    };
  }, []);

  if (state === "idle") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]">
      <div className={state === "loading" ? "nav-progress-bar is-loading" : "nav-progress-bar is-done"} />
    </div>
  );
}
