import { handle } from "@/lib/server/api-error";
import { requireStaff, staffData } from "@/lib/server/staff-service";

export const dynamic = "force-dynamic";

/** GET: who is signed in, and only what their role may see. */
export async function GET(req: Request) {
  return handle(async () => Response.json(await staffData(await requireStaff(req)), { headers: { "Cache-Control": "no-store" } }));
}
