import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { createStaff, deleteStaff, ensureStoreCode, listStaff, updateStaff } from "@/lib/server/staff-service";
import { STAFF_ROLE_IDS } from "@/lib/staff/roles";

const Role = z.enum(STAFF_ROLE_IDS);

/** GET ?store=: the store's 5-digit ID and its staff accounts. Owner only. */
export async function GET(req: Request) {
  return handle(async () => {
    const sub = new URL(req.url).searchParams.get("store") || "";
    const { store } = await requireStoreOwner(req, sub);
    const [storeCode, staff] = await Promise.all([ensureStoreCode(store.subdomain), listStaff(store.subdomain)]);
    return Response.json({ storeCode, staff }, { headers: { "Cache-Control": "no-store" } });
  });
}

const Create = z.object({
  store: z.string().min(1).max(63),
  name: z.string().min(1).max(80),
  email: z.string().min(3).max(120),
  password: z.string().min(1).max(100),
  role: Role,
});

/** POST: add a staff account (Pro). Owner only. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "staff-create", 20, 60 * 60_000);
    const parsed = Create.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Fill in the name, email, password and role.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json(await createStaff(store, parsed.data));
  });
}

const Update = z.object({
  store: z.string().min(1).max(63),
  id: z.string().min(1).max(60),
  name: z.string().max(80).optional(),
  role: Role.optional(),
  active: z.boolean().optional(),
  password: z.string().max(100).optional(),
});

/** PATCH: change a staff member's name or role, switch them on or off, or set a new password. Owner only. */
export async function PATCH(req: Request) {
  return handle(async () => {
    rateLimit(req, "staff-update", 60, 60 * 60_000);
    const parsed = Update.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "That change couldn't be read. Please try again.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    const { id, name, role, active, password } = parsed.data;
    return Response.json({ staff: await updateStaff(store, id, { name, role, active, password }) });
  });
}

/** DELETE ?store=&id=: remove a staff account. Owner only. */
export async function DELETE(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams;
    const id = q.get("id") || "";
    if (!/^[A-Za-z0-9]{1,60}$/.test(id)) throw new ApiError(400, "That staff account couldn't be found.");
    const { store } = await requireStoreOwner(req, q.get("store") || "");
    await deleteStaff(store, id);
    return Response.json({ ok: true });
  });
}
