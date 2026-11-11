import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { sameOrigin, staffLogin } from "@/lib/server/staff-service";

const Body = z.object({ storeCode: z.string().min(1).max(10), email: z.string().min(3).max(120), password: z.string().min(1).max(100) });

/** POST {storeCode, email, password}: signs a staff member in (sets a cookie the page can't read). */
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    rateLimit(req, "staff-login", 10, 10 * 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Enter the store ID, your email and your password.");
    const { cookie, staff } = await staffLogin(parsed.data);
    return Response.json({ ok: true, role: staff.role }, { headers: { "Set-Cookie": cookie } });
  });
}
