import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { listWorkplace, postWorkplace, requireStaff, sameOrigin, type WorkplaceMessage } from "@/lib/server/staff-service";

export const dynamic = "force-dynamic";

/**
 * WorkPlace: the team chat shared by the store owner and every staff role.
 * The owner calls it with their sign-in token and ?store=; staff with their staff cookie.
 */
async function whoIs(req: Request, storeParam: string | null): Promise<{ sub: string; by: WorkplaceMessage["by"] }> {
  if ((req.headers.get("authorization") || "").startsWith("Bearer ")) {
    const { store } = await requireStoreOwner(req, storeParam || "");
    if (store.planId !== "pro") throw new ApiError(403, "WorkPlace is part of the Pro plan.", "plan");
    return { sub: store.subdomain, by: { id: "owner", name: store.ownerName?.trim() || "Owner", role: "owner" } };
  }
  const ctx = await requireStaff(req);
  return { sub: ctx.subdomain, by: { id: ctx.staff.id, name: ctx.staff.name, role: ctx.staff.role } };
}

/** GET ?after=: the latest messages (or only those after a time). */
export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams;
    const { sub, by } = await whoIs(req, q.get("store"));
    return Response.json({ me: by.id, messages: await listWorkplace(sub, q.get("after") || undefined) }, { headers: { "Cache-Control": "no-store" } });
  });
}

const Body = z.object({ store: z.string().max(63).optional(), text: z.string().min(1).max(1000), urgent: z.boolean().optional() });

/** POST {text, urgent?}: send a message. */
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    rateLimit(req, "workplace-post", 40, 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Write a message first (up to 1,000 characters).");
    const { sub, by } = await whoIs(req, parsed.data.store || null);
    return Response.json({ message: await postWorkplace(sub, by, { text: parsed.data.text, urgent: parsed.data.urgent }) });
  });
}
