import { handle, ApiError } from "@/lib/server/api-error";
import { sendCartReminders } from "@/lib/server/checkout-recovery";

/**
 * Daily job (vercel.json → crons): emails buyers who agreed and left a checkout unfinished.
 * Vercel calls it with "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(req: Request) {
  return handle(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) throw new ApiError(401, "Not allowed.");
    return Response.json(await sendCartReminders());
  });
}
