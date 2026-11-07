/**
 * Decides how a link should open inside the Android/iOS app.
 *
 * - `system`:   hand the URL to the phone (tel:, mailto:, upi://, WhatsApp, Play Store...), so the
 *               right app (dialler, mail, UPI/payment app, WhatsApp) opens.
 * - `browser`:  open the page in the phone's own browser (Chrome / Safari): other websites, and the
 *               seller's storefront (so "Open store" shows the shop exactly as buyers see it), and
 *               sections of the marketing home page (the app itself has no home page).
 * - `navigate`: same-site link that asked for a new tab; the app has no tabs, so open it in place.
 * - `null`:     leave the click alone (normal in-app navigation).
 *
 * Pure function so it can be unit-tested without a device.
 */
export type LinkAction =
  | { kind: "system"; url: string }
  | { kind: "browser"; url: string }
  | { kind: "navigate"; url: string };

/** Hosts whose links should open their own app (via Android App Links / iOS Universal Links). */
const APP_HOSTS = [
  "wa.me",
  "whatsapp.com",
  "play.google.com",
  "apps.apple.com",
  "maps.google.com",
  "maps.app.goo.gl",
];

function isAppHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return APP_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function classifyLink(
  href: string | null | undefined,
  currentUrl: string,
  target?: string | null
): LinkAction | null {
  if (!href) return null;
  const raw = href.trim();
  if (!raw || raw.startsWith("#") || /^javascript:/i.test(raw)) return null;

  let url: URL;
  let current: URL;
  try {
    current = new URL(currentUrl);
    url = new URL(raw, current);
  } catch {
    return null;
  }

  if (url.protocol === "blob:" || url.protocol === "data:") return null;

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    // tel:, mailto:, sms:, upi://pay, whatsapp://, intent:// ...
    return { kind: "system", url: url.href };
  }

  if (url.origin !== current.origin) {
    return isAppHost(url.hostname) ? { kind: "system", url: url.href } : { kind: "browser", url: url.href };
  }

  const opensNewWindow = !!target && target !== "_self" && target !== "_top" && target !== "_parent";
  // The app has no marketing home page ("/" sends you back to the dashboard), so links to its
  // sections (Pricing, FAQs, Store themes...) open the website in the phone's browser instead.
  const homePath = (url.pathname.replace(/\/+$/, "") || "/") === "/";
  if (homePath && (url.hash.length > 1 || opensNewWindow)) return { kind: "browser", url: url.href };
  if (!opensNewWindow) return null;
  // Storefront and order-tracking pages are what buyers see: open them in the real browser
  if (/^\/(s|orders)\//.test(url.pathname)) return { kind: "browser", url: url.href };
  return { kind: "navigate", url: url.href };
}

/** Routes the app treats as "home" screens: the Android back button leaves the app from here. */
export const ROOT_PATHS = ["/", "/dashboard", "/admin", "/app", "/app/welcome", "/app/login"];

export function isRootPath(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return ROOT_PATHS.includes(clean);
}
