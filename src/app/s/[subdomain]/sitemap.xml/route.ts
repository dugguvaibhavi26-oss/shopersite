import { shopForSeo, shopSitemap } from "@/lib/server/shop-seo";

/** A shop's own sitemap.xml (the middleware sends /sitemap.xml on a shop address here). */
export async function GET(_req: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const store = await shopForSeo(subdomain);
  // a shop that could not be read just now must not look empty to search engines
  if (!store) return new Response("Try again shortly.", { status: 503, headers: { "retry-after": "120" } });
  return new Response(shopSitemap(store), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
