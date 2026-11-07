"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";
import { classifyLink, isRootPath, type LinkAction } from "@/lib/native/links";
import { getNativePlatform, isNativeApp } from "@/lib/native/platform";
import { appReplacementFor } from "@/lib/native/app-start";

/**
 * Glue between the website and the Android/iOS app shell (Capacitor).
 *
 * Mounted once in the root layout. In a normal browser it renders nothing and does nothing.
 * Inside the app it:
 *  - tags <html> with `cap-native` / `cap-android` / `cap-ios` for app-only CSS
 *  - hides the splash screen once the page is ready
 *  - handles the Android back button (closes dialogs, steps back through dashboard tabs and
 *    pages, and leaves the app from a home screen instead of looping)
 *  - opens tel:, mailto:, UPI and WhatsApp links in their apps, and other sites and the seller's own
 *    storefront ("Open store") in the phone's browser
 *  - shows an offline banner while the phone has no connection
 *  - keeps the focused field visible when the keyboard opens
 *  - swaps the marketing home page and desktop login for the app's own screens (/app/...)
 *
 * Pages can intercept the back button by listening for the cancelable `app:back` window event
 * and calling `preventDefault()` (the dashboard does this to return to the Home tab).
 */
export function NativeBridge() {
  const [offline, setOffline] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Website pages with an app version (home page, desktop login) are swapped for the app screens.
  // The app opens at "/" and lands on the /app launch screen this way. Until a page without a
  // swap is showing, the native launch screen stays up, so the home page never flashes.
  useEffect(() => {
    if (!isNativeApp() || !pathname) return;
    const target = appReplacementFor(pathname);
    if (target) {
      router.replace(target);
      return;
    }
    import("@capacitor/splash-screen")
      .then(({ SplashScreen }) => SplashScreen.hide())
      .catch(() => {});
  }, [pathname, router]);

  useEffect(() => {
    if (!isNativeApp()) return;

    const platform = getNativePlatform();
    const root = document.documentElement;
    root.classList.add("cap-native", `cap-${platform}`);

    if (platform === "ios") {
      // Lets env(safe-area-inset-bottom) report the home-indicator height (the status bar is kept
      // out of the web view natively), and stops iOS zooming in when a small input is focused.
      const meta = document.querySelector('meta[name="viewport"]');
      meta?.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover");
    }

    const cleanups: Array<() => void> = [];
    let disposed = false;

    const perform = (action: LinkAction) => {
      if (action.kind === "browser") {
        // The phone's default browser (Chrome / Safari), outside the app
        import("@capacitor/app-launcher")
          .then(({ AppLauncher }) => AppLauncher.openUrl({ url: action.url }))
          .catch(() =>
            import("@capacitor/browser")
              .then(({ Browser }) => Browser.open({ url: action.url }))
              .catch(() => window.location.assign(action.url))
          );
      } else {
        // The app shell hands URLs outside the site (and non-web schemes) to the phone, which
        // opens the dialler, mail, a UPI app or WhatsApp. Same-site URLs load in place.
        window.location.assign(action.url);
      }
    };

    // Links: bubble phase on window so React handlers (and their preventDefault) run first.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download")) return;
      const action = classifyLink(anchor.getAttribute("href"), window.location.href, anchor.getAttribute("target"));
      if (!action) return;
      e.preventDefault();
      perform(action);
    };
    window.addEventListener("click", onClick);
    cleanups.push(() => window.removeEventListener("click", onClick));

    // window.open(...) has no tabs to open in a mobile web view.
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string) {
      const action = url ? classifyLink(String(url), window.location.href, target ?? "_blank") : null;
      if (action) {
        perform(action);
        return null;
      }
      return originalOpen.call(window, url, target, features);
    };
    cleanups.push(() => {
      window.open = originalOpen;
    });

    (async () => {
      const [{ App }, { Network }, { Keyboard }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/network"),
        import("@capacitor/keyboard"),
      ]);
      if (disposed) return;


      const status = await Network.getStatus().catch(() => null);
      if (status && !disposed) setOffline(!status.connected);

      const handles = await Promise.all([
        Network.addListener("networkStatusChange", (s) => setOffline(!s.connected)),

        App.addListener("backButton", ({ canGoBack }) => {
          // 1. Close an open dialog or sheet (they all close on Escape).
          if (document.querySelector('[aria-modal="true"], [role="dialog"]')) {
            const esc = { key: "Escape", code: "Escape", bubbles: true, cancelable: true };
            window.dispatchEvent(new KeyboardEvent("keydown", esc));
            document.dispatchEvent(new KeyboardEvent("keydown", esc));
            return;
          }
          // 2. Let the page handle it (e.g. dashboard tab history).
          const evt = new Event("app:back", { cancelable: true });
          window.dispatchEvent(evt);
          if (evt.defaultPrevented) return;
          // 3. Home screens leave the app, so back never loops through login redirects.
          if (isRootPath(window.location.pathname) || !canGoBack) {
            App.minimizeApp().catch(() => App.exitApp());
            return;
          }
          window.history.back();
        }),

        Keyboard.addListener("keyboardDidShow", () => {
          const el = document.activeElement as HTMLElement | null;
          if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }),

        // Coming back to the app after a long time: refresh connection status.
        App.addListener("resume", async () => {
          const s = await Network.getStatus().catch(() => null);
          if (s) setOffline(!s.connected);
        }),
      ]);

      if (disposed) {
        handles.forEach((h) => h.remove());
        return;
      }
      cleanups.push(() => handles.forEach((h) => h.remove()));
    })().catch((err) => console.warn("Native bridge setup failed", err));

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-neutral-900 px-4 py-2 text-xs font-medium text-white"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      You&apos;re offline. Some actions won&apos;t work until your connection is back.
    </div>
  );
}
