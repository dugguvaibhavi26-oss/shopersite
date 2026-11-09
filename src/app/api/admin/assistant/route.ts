import { ApiError, handle } from "@/lib/server/api-error";
import { requireAdmin } from "@/lib/server/admin-service";
import { aiConfigured } from "@/lib/server/assistant/providers";
import { getAssistantSettings, saveAssistantSettings, usageHistory } from "@/lib/server/assistant/usage";

/** GET: the assistant's budgets and the last 14 days of AI usage. Admins only. */
export async function GET(req: Request) {
  return handle(async () => {
    const { role } = await requireAdmin(req);
    const [settings, history] = await Promise.all([getAssistantSettings(true), usageHistory(14)]);
    return Response.json({
      settings,
      history,
      canEdit: role === "owner",
      providers: { gemini: !!process.env.GEMINI_API_KEY, groq: !!process.env.GROQ_API_KEY },
      ai: aiConfigured(),
    });
  });
}

/** POST {enabled, budgets, platformTokens, platformRequests, stretch}: save. Owner admins only. */
export async function POST(req: Request) {
  return handle(async () => {
    const { role, email } = await requireAdmin(req);
    if (role !== "owner") throw new ApiError(403, "Only owner admins can change the assistant's limits.");
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new ApiError(400, "Bad request.");
    return Response.json({ settings: await saveAssistantSettings(body, email) });
  });
}
