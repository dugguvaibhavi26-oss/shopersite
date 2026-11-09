import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner, requireUser } from "@/lib/server/firebase-admin";
import { createSupportRequest } from "@/lib/server/support-service";

const Body = z.object({
  store: z.string().min(1).max(63),
  name: z.string().trim().min(2).max(60),
  note: z.string().trim().max(500).optional(),
});

/** POST {store, name, note?}: a seller asks for a new plugin; it lands in Admin → Requests. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Enter the plugin name (2–60 characters).");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    const user = await requireUser(req);
    const r = await createSupportRequest(store, user.email, "plugin_request", { subject: parsed.data.name, note: parsed.data.note || undefined });
    return Response.json({ id: r.id });
  });
}
