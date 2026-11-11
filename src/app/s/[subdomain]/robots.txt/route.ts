import { shopForSeo, shopOrigin, shopRobots } from "@/lib/server/shop-seo";

/** A shop's own robots.txt (the middleware sends /robots.txt on a shop address here). */
export async function GET(_req: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const store = await shopForSeo(subdomain);
  const origin = shopOrigin(store || { subdomain });
  return new Response(shopRobots(store, origin), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
