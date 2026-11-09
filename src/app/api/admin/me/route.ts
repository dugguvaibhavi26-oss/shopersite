import { handle } from "@/lib/server/api-error";
import { adminRole, markAdminJoined } from "@/lib/server/admin-service";
import { requireUser } from "@/lib/server/firebase-admin";

/** GET: is the signed-in user a platform admin? `{ admin, role }`. Never 403s, so the page can explain. */
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const role = user.emailVerified ? await adminRole(user.email) : null;
    if (role === "admin" && user.email) await markAdminJoined(user.email).catch(() => {});
    return Response.json({ admin: !!role, role });
  });
}
