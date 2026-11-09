import { handle } from "@/lib/server/api-error";
import { storeForHost } from "@/lib/server/domain-service";

/** GET ?host=: which store a custom domain belongs to. Public (used by middleware); cached briefly. */
export async function GET(req: Request) {
  return handle(async () => {
    const host = (new URL(req.url).searchParams.get("host") || "").slice(0, 260);
    const subdomain = host ? await storeForHost(host).catch(() => null) : null;
    return Response.json({ subdomain }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
  });
}
