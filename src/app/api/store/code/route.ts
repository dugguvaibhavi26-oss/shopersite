import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { ensureStoreCode } from "@/lib/server/staff-service";

const Body = z.object({ store: z.string().min(1).max(63) });

/** POST {store}: gives the store its 5-digit ID if it has none yet, and returns it. Owner only. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "store-code", 30, 60 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Store not found.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json({ storeCode: await ensureStoreCode(store.subdomain) });
  });
}
