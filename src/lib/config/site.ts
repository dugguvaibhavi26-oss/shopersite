/**
 * Site & Platform Configuration
 * Centralized place for brand name, domain, and security switches.
 */

// Production guard for Dev Mock OTP
if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_DEV_MOCK_OTP === "true"
) {
  throw new Error(
    "FATAL CONFIGURATION ERROR: ALLOW_DEV_MOCK_OTP cannot be set to 'true' in production mode. System startup aborted."
  );
}

export const siteConfig = {
  // Brand & Domain placeholders (overridable via environment variables)
  name: process.env.NEXT_PUBLIC_APP_NAME || "shopersite",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "shopersite.in",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // Set NEXT_PUBLIC_STORE_SUBDOMAINS_LIVE="true" once the domain (and its *.domain wildcard) points
  // at this Vercel project. Until then store links use the working /s/<store> address instead.
  storeSubdomainsLive: process.env.NEXT_PUBLIC_STORE_SUBDOMAINS_LIVE === "true",
  description: "The modern store builder for Indian social sellers.",
  version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || `support@${process.env.NEXT_PUBLIC_APP_DOMAIN || "shopersite.in"}`,

  // Help, legal and social links shown at the end of the seller dashboard.
  // Leave a value empty and its row shows "Soon" instead of linking anywhere.
  supportWhatsApp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "", // digits with country code, e.g. 919876543210
  helpCenterUrl: process.env.NEXT_PUBLIC_HELP_CENTER_URL || "",
  legal: {
    terms: process.env.NEXT_PUBLIC_TERMS_URL || "/legal/terms",
    privacy: process.env.NEXT_PUBLIC_PRIVACY_URL || "/legal/privacy",
    refunds: process.env.NEXT_PUBLIC_REFUND_POLICY_URL || "/legal/refunds",
  },
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
    x: process.env.NEXT_PUBLIC_X_URL || "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
  },

  // Dev OTP Mock configuration
  allowDevMockOtp:
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_MOCK_OTP === "true",
  devMockOtp: process.env.DEV_MOCK_OTP || "123456",

  /**
   * Who can open the admin panel: signed in with one of these emails (verified). The database rules
   * (firestore.rules / storage.rules) carry the same list and are what actually enforces it; run
   * `node scripts/deploy-rules.mjs` after changing NEXT_PUBLIC_ADMIN_EMAILS.
   */
  adminEmails: (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "tejaswithreddy0101@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  // Target currency
  currency: "INR",

  // Platform subscription UPI details. These are only the defaults: the admin can change them any
  // time (Admin › Plans & payments), and the saved setting wins.
  platformUpiId: process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || "anumula.sridhar@ybl",
  platformMerchantName: process.env.NEXT_PUBLIC_PLATFORM_MERCHANT_NAME || "shopersite",
  currencySymbol: "₹",

  // Performance budget indicators
  maxStorefrontJsKb: 150,
  targetLcpSeconds: 2.5,

  // Plans config placeholders
  freePlanMaxProducts: 25,
  freePlanMaxStorageMb: 500,
};

export type SiteConfig = typeof siteConfig;

/**
 * Returns the public store domain e.g. "storename.shopersite.in" or "storename.oursite.in"
 */
export function getStoreDomain(subdomain: string): string {
  const baseDomain = siteConfig.domain;
  return `${subdomain}.${baseDomain}`;
}

/**
 * The store name when `host` is a store's own address, e.g. "roxtenn" for roxtenn.shopersite.in or
 * roxtenn.localhost. Any other host (the main domain, www, or a deployment URL such as
 * something.vercel.app) belongs to the main app and returns null.
 */
export function getStoreSubdomainFromHost(host: string): string | null {
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  const suffixes = [`.${siteConfig.domain}`, ".localhost"];
  for (const suffix of suffixes) {
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      return sub && sub !== "www" && !sub.includes(".") ? sub : null;
    }
  }
  return null;
}

/**
 * Where a store opens, judged from the address the app is running at (`appUrl`):
 * - on the company domain: "https://storename.shopersite.in"
 * - on localhost: "http://storename.localhost:3000", so subdomains can be tried locally
 * - anywhere else (e.g. a vercel.app deployment, where *.shopersite.in isn't connected): "/s/storename"
 * `path` is appended as-is (e.g. "/products/tee" or "?view=cart").
 */
export function resolveStoreUrl(subdomain: string, path: string, appUrl: string): string {
  try {
    const app = new URL(appUrl);
    const host = app.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
      return `${app.protocol}//${subdomain}.localhost${app.port ? `:${app.port}` : ""}${path}`;
    }
    if (siteConfig.storeSubdomainsLive || host === siteConfig.domain || host.endsWith(`.${siteConfig.domain}`)) {
      return `https://${getStoreDomain(subdomain)}${path}`;
    }
  } catch {
    // fall through to the path form
  }
  return `/s/${subdomain}${path}`;
}

/** The address a store opens at from wherever the app is currently running. */
export function getStoreUrl(subdomain: string, path = ""): string {
  const appUrl = typeof window !== "undefined" ? window.location.href : siteConfig.url;
  return resolveStoreUrl(subdomain, path, appUrl);
}

/**
 * The full link buyers can open: "https://storename.shopersite.in" once store subdomains are live,
 * otherwise the working address on wherever the app runs, e.g.
 * "https://shopersite-app.vercel.app/s/storename". Use this for sharing and copying.
 */
export function getPublicStoreUrl(subdomain: string, path = ""): string {
  if (siteConfig.storeSubdomainsLive) return `https://${getStoreDomain(subdomain)}${path}`;
  const resolved = getStoreUrl(subdomain, path);
  if (/^https?:\/\//.test(resolved)) return resolved;
  const origin = typeof window !== "undefined" ? window.location.origin : siteConfig.url.replace(/\/+$/, "");
  return `${origin}${resolved}`;
}

/** The same address without "https://", for showing on screen. */
export function getPublicStoreAddress(subdomain: string): string {
  return getPublicStoreUrl(subdomain).replace(/^https?:\/\//, "");
}
