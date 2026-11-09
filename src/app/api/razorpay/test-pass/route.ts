import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { makeTestPass } from "@/lib/server/test-pass";

const Body = z.object({ store: z.string().min(1).max(63) });

/** POST {store}: the owner gets a 2-hour pass to try test-mode checkout on their storefront. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    const { store } = await requireStoreOwner(req, parsed.data.store.toLowerCase());
    return Response.json({ pass: makeTestPass(store.subdomain) });
  });
}
