import { LEGACY_DOC_IDS, LEGACY_EXPLORE_SECTIONS } from "@/lib/resources/legacy";
import { NextRequest, NextResponse } from "next/server";
import { getStoreSubdomainFromHost, siteConfig } from "./lib/config/site";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};

/** The platform's own addresses: the main domain, www, deployment URLs, local and LAN development. */
function isPlatformHost(hostname: string): boolean {
  const own = siteConfig.domain.toLowerCase();
  return (
    hostname === own ||
    hostname.endsWith(`.${own}`) ||
    hostname.endsWith(".vercel.app") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ||
    !hostname.includes(".")
  );
}

// custom domain → store, remembered for a couple of minutes per server instance
const domainCache = new Map<string, { sub: string | null; until: number }>();

async function storeForCustomDomain(req: NextRequest, hostname: string): Promise<string | null> {
  const hit = domainCache.get(hostname);
  if (hit && hit.until > Date.now()) return hit.sub;
  let sub: string | null = null;
  try {
    const res = await fetch(new URL(`/api/domains/resolve?host=${encodeURIComponent(hostname)}`, req.nextUrl.origin), { headers: { accept: "application/json" } });
    if (res.ok) sub = ((await res.json()) as { subdomain?: string | null }).subdomain || null;
  } catch {
    // lookup failed: treat as unknown this time, try again on the next request
    return null;
  }
  domainCache.set(hostname, { sub, until: Date.now() + (sub ? 120_000 : 30_000) });
  return sub;
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const bareHost = hostname.replace(/:\d+$/, "").toLowerCase();

  // A store's own address (roxtenn.shopersite.in, roxtenn.localhost), or a Pro store's connected
  // domain (www.brand.com). The main domain, www and deployment URLs serve the main app.
  let storeSub = getStoreSubdomainFromHost(hostname);
  const customDomain = !storeSub && !isPlatformHost(bareHost);
  if (customDomain) storeSub = await storeForCustomDomain(req, bareHost);
  const path = url.pathname;

  if (storeSub) {
    // Links written as /s/roxtenn/... are tidied to /... so the address isn't repeated
    const prefix = `/s/${storeSub}`;
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      // build on the Host the visitor used so the store's own address is kept
      const target = new URL(`${path.slice(prefix.length) || "/"}${url.search}`, `${url.protocol}//${hostname}`);
      return NextResponse.redirect(target, 307);
    }
  }

  // Old Help Center / Explore links (?article=…, ?section=…) move to their own pages, so those pages
  // stay static and each article has one address for search engines
  if (!storeSub && path === "/docs" && url.searchParams.has("article")) {
    const id = url.searchParams.get("article") || "";
    return NextResponse.redirect(new URL(`/docs/${LEGACY_DOC_IDS[id] || id}`, url), 308);
  }
  if (!storeSub && path === "/explore" && (url.searchParams.has("section") || url.searchParams.has("view"))) {
    const id = url.searchParams.get("section") || url.searchParams.get("view") || "";
    return NextResponse.redirect(new URL(LEGACY_EXPLORE_SECTIONS[id] || "/explore", url), 308);
  }

  // If path already starts with /s/, /dashboard, /register, /gallery, or /orders, don't rewrite
  if (
    path.startsWith("/s/") ||
    path.startsWith("/app") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/register") ||
    path.startsWith("/gallery") ||
    path.startsWith("/orders") ||
    path.startsWith("/pricing") ||
    path.startsWith("/themes") ||
    path.startsWith("/delete-account") ||
    path.startsWith("/invoice/")
  ) {
    return NextResponse.next();
  }

  // Serve the storefront route /s/[subdomain] on the store's own address
  if (storeSub) {
    url.pathname = `/s/${storeSub}${path === "/" ? "" : path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
