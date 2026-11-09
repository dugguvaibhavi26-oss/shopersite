import { handle } from "@/lib/server/api-error";
import { handleWebhook } from "@/lib/server/shiprocket-service";

/**
 * Shiprocket tracking webhook. The seller pastes this URL and their token (shown in Plugins →
 * Shiprocket) into Shiprocket → Settings → API → Webhooks; Shiprocket sends the token as x-api-key.
 * The path avoids "shiprocket"/"sr"/"kr", which Shiprocket doesn't allow in webhook URLs. Always
 * answers 200 for a valid token, as Shiprocket expects.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const store = (url.searchParams.get("store") || "").toLowerCase().slice(0, 63);
    const key = req.headers.get("x-api-key") || url.searchParams.get("key") || "";
    const body = await req.json().catch(() => ({}));
    await handleWebhook(store, key, body || {});
    return Response.json({ ok: true });
  });
}
