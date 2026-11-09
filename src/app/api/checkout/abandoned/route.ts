import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { listAbandoned, markContacted } from "@/lib/server/checkout-recovery";

/** GET ?store=: checkouts started but not finished (last 14 days). Owner only. */
export async function GET(req: Request) {
  return handle(async () => {
    const { store } = await requireStoreOwner(req, new URL(req.url).searchParams.get("store") || "");
    return Response.json({ checkouts: await listAbandoned(store.subdomain) });
  });
}

const Patch = z.object({ store: z.string().min(1).max(63), id: z.string().regex(/^co_[a-f0-9]{20}$/) });

/** PATCH {store, id}: mark as contacted. Owner only. */
export async function PATCH(req: Request) {
  return handle(async () => {
    const parsed = Patch.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    await markContacted(store.subdomain, parsed.data.id);
    return Response.json({ ok: true });
  });
}
