import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStaff, sameOrigin, staffUploadImage } from "@/lib/server/staff-service";

/** POST (form data, field "file"): uploads one product photo. Product manager only. */
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    rateLimit(req, "staff-upload", 60, 10 * 60_000);
    const ctx = await requireStaff(req);
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Choose a photo to upload.");
    return Response.json({ url: await staffUploadImage(ctx, file) });
  });
}
