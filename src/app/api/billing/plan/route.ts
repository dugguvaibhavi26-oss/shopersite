import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { requestPlan } from "@/lib/server/billing-service";

const Body = z.object({ store: z.string().max(63), planId: z.string().max(20), billingCycle: z.string().max(20), utr: z.string().max(30) });

/** POST: the seller says they paid for a plan. It waits for an admin to check and approve it. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "plan", 10, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    const request = await requestPlan(store.subdomain, { ...parsed.data, utr: parsed.data.utr.replace(/\s/g, "") });
    return Response.json({ request });
  });
}
