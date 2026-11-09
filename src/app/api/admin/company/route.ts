import { revalidatePath } from "next/cache";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireAdmin } from "@/lib/server/admin-service";
import { getCompany, saveCompany } from "@/lib/legal/company-server";

/** GET: the company details shown on the legal pages. Admins only. */
export async function GET(req: Request) {
  return handle(async () => {
    const { role } = await requireAdmin(req);
    return Response.json({ company: await getCompany(), canEdit: role === "owner" });
  });
}

/** POST {legalName, email, grievanceOfficer, …}: save them and refresh the legal pages. Owner admins only. */
export async function POST(req: Request) {
  return handle(async () => {
    const { role } = await requireAdmin(req);
    if (role !== "owner") throw new ApiError(403, "Only owner admins can change company details.");
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new ApiError(400, "Bad request.");
    const company = await saveCompany(body as Record<string, unknown>);
    revalidatePath("/legal", "layout");
    return Response.json({ company });
  });
}
