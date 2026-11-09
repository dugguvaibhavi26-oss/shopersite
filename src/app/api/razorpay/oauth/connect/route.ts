import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { oauthAuthorizeUrl, oauthConfig } from "@/lib/server/razorpay";
import { sign } from "@/lib/server/secret-box";
import { oauthRedirectUri } from "@/lib/server/razorpay-oauth-state";

const Body = z.object({ store: z.string().min(1).max(63) });

/** GET: is one-click connect available on this server? */
export async function GET() {
  return Response.json({ available: oauthConfig().configured });
}

/** POST {store}: returns the Razorpay page the seller should be sent to. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Missing store.");
    const { store, uid } = await requireStoreOwner(req, parsed.data.store);

    const payload = Buffer.from(JSON.stringify({ s: store.subdomain, u: uid, t: Date.now() })).toString("base64url");
    const state = `${payload}.${sign(payload)}`;
    return Response.json({ url: oauthAuthorizeUrl(oauthRedirectUri(req), state) });
  });
}
