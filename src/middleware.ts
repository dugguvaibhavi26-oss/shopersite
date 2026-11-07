import { NextRequest, NextResponse } from "next/server";
import { getStoreSubdomainFromHost } from "./lib/config/site";

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

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Only a store's own address (roxtenn.shopersite.in, roxtenn.localhost) is a storefront. The main
  // domain, www and deployment URLs like rox-shop-xyz.vercel.app all serve the main app.
  const storeSub = getStoreSubdomainFromHost(hostname);
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

  // If path already starts with /s/, /dashboard, /register, /gallery, or /orders, don't rewrite
  if (
    path.startsWith("/s/") ||
    path.startsWith("/app") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/register") ||
    path.startsWith("/gallery") ||
    path.startsWith("/orders")
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
