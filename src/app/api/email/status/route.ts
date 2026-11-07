import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { emailStatus } from "@/lib/server/email-service";

/** GET ?store=: whether Gmail is connected, and how many emails are left. */
export async function GET(req: Request) {
  return handle(async () => {
    const sub = new URL(req.url).searchParams.get("store") || "";
    if (!sub) throw new ApiError(400, "Invalid request.");
    const { store } = await requireStoreOwner(req, sub);
    return Response.json(await emailStatus(store));
  });
}
