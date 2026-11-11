import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { changeOwnPassword, requireStaff, sameOrigin } from "@/lib/server/staff-service";

const Body = z.object({ current: z.string().min(1).max(100), next: z.string().min(1).max(100) });

/** POST {current, next}: a staff member changes their own password. */
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    rateLimit(req, "staff-password", 10, 10 * 60_000);
    const ctx = await requireStaff(req);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Enter your current password and a new one.");
    const cookie = await changeOwnPassword(ctx, parsed.data.current, parsed.data.next);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie } });
  });
}
