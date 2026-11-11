import { handle } from "@/lib/server/api-error";
import { clearStaffCookie, sameOrigin } from "@/lib/server/staff-service";

/** POST: signs the staff member out of this browser. */
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": clearStaffCookie() } });
  });
}
