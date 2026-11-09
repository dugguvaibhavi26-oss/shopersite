import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { addAdmin, listAdmins, removeAdmin, requireAdmin } from "@/lib/server/admin-service";

/** GET: every platform admin. Any admin can see the list. */
export async function GET(req: Request) {
  return handle(async () => {
    const { role } = await requireAdmin(req);
    return Response.json({ admins: await listAdmins(), canManage: role === "owner" });
  });
}

const Add = z.object({ email: z.string().min(3).max(120), name: z.string().max(80).default("") });

/** POST {email, name}: make someone an admin and email them. Owner admins only. */
export async function POST(req: Request) {
  return handle(async () => {
    const { role, email } = await requireAdmin(req);
    if (role !== "owner") throw new ApiError(403, "Only owner admins can add admins.");
    const parsed = Add.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Enter a name and a valid email address.");
    const { admin, emailed } = await addAdmin(email, parsed.data);
    return Response.json({ admin, emailed });
  });
}

const Remove = z.object({ email: z.string().min(3).max(120) });

/** DELETE {email}: take admin access away. Owner admins only. */
export async function DELETE(req: Request) {
  return handle(async () => {
    const { role } = await requireAdmin(req);
    if (role !== "owner") throw new ApiError(403, "Only owner admins can remove admins.");
    const parsed = Remove.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Bad request.");
    await removeAdmin(parsed.data.email);
    return Response.json({ ok: true });
  });
}
