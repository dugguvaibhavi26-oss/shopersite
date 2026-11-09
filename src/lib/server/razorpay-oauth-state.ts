import "server-only";
import { verifySignature } from "./secret-box";

const STATE_TTL_MS = 30 * 60 * 1000;

/** Must match the redirect URL registered on the Razorpay partner app exactly. */
export function oauthRedirectUri(req: Request) {
  const base = process.env.RAZORPAY_OAUTH_REDIRECT_BASE || new URL(req.url).origin;
  return `${base.replace(/\/$/, "")}/api/razorpay/oauth/callback`;
}

export function readOAuthState(state: string): { subdomain: string; uid: string } | null {
  const [payload, sig] = state.split(".");
  if (!payload || !sig || !verifySignature(payload, sig)) return null;
  try {
    const { s, u, t } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof s !== "string" || typeof u !== "string" || typeof t !== "number") return null;
    if (Date.now() - t > STATE_TTL_MS) return null;
    return { subdomain: s, uid: u };
  } catch {
    return null;
  }
}
