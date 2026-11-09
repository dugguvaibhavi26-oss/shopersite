import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { connectDomain, domainStatus, removeDomain } from "@/lib/server/domain-service";

/** GET ?store=: the store's custom domain and whether it's working yet. Owner only. */
export async function GET(req: Request) {
  return handle(async () => {
    const sub = new URL(req.url).searchParams.get("store") || "";
    const { store } = await requireStoreOwner(req, sub);
    return Response.json(await domainStatus(store));
  });
}

const Body = z.object({ store: z.string().min(1).max(63), domain: z.string().min(3).max(260) });

/** POST {store, domain}: connect a domain (Pro). Owner only. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "domain-connect", 10, 60 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Enter a domain like www.yourbrand.com.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json(await connectDomain(store, parsed.data.domain));
  });
}

/** DELETE ?store=: disconnect the domain. Owner only. */
export async function DELETE(req: Request) {
  return handle(async () => {
    const sub = new URL(req.url).searchParams.get("store") || "";
    const { store } = await requireStoreOwner(req, sub);
    await removeDomain(store);
    return Response.json({ ok: true });
  });
}
