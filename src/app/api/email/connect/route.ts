import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { connectGmail, disconnectGmail } from "@/lib/server/email-service";

const Body = z.object({ store: z.string().max(63), email: z.string().max(200), appPassword: z.string().max(40) });

/** POST: checks the Gmail App Password works, then saves it encrypted. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "email-connect", 8, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json(await connectGmail(store, parsed.data.email, parsed.data.appPassword));
  });
}

/** DELETE ?store=: forgets the Gmail login. */
export async function DELETE(req: Request) {
  return handle(async () => {
    const sub = new URL(req.url).searchParams.get("store") || "";
    if (!sub) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, sub);
    await disconnectGmail(store);
    return Response.json({ ok: true });
  });
}
