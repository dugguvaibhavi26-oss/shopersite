import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { sendTest } from "@/lib/server/email-service";

const Body = z.object({ store: z.string().max(63) });

/** POST: sends a test email to the seller's own Gmail. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "email-test", 5, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json(await sendTest(store));
  });
}
