import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { listSupportRequests, requireAdmin, setSupportStatus } from "@/lib/server/support-service";

/** GET: every seller help request, newest first. Admins only. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return Response.json({ requests: await listSupportRequests() });
  });
}

const Patch = z.object({ id: z.string().min(1).max(40), status: z.enum(["open", "resolved"]) });

/** PATCH {id, status}: mark a request resolved (or reopen it). Admins only. */
export async function PATCH(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const parsed = Patch.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    await setSupportStatus(parsed.data.id, parsed.data.status);
    return Response.json({ ok: true });
  });
}
