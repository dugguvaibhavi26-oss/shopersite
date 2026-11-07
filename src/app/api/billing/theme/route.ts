import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { requestTheme } from "@/lib/server/billing-service";

const Body = z.object({ store: z.string().max(63), themeSlug: z.string().max(80), utr: z.string().max(30) });

/** POST: the seller says they paid for a theme. It unlocks once an admin approves it. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "theme", 10, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    const purchase = await requestTheme(store.subdomain, { themeSlug: parsed.data.themeSlug, utr: parsed.data.utr.replace(/\s/g, "") });
    return Response.json({ purchase });
  });
}
