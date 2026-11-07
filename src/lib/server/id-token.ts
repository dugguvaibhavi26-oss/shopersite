import "server-only";

/**
 * Verifies a Firebase Auth ID token the way Google documents it
 * (https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library):
 * RS256 signature by one of Google's securetoken keys, iss = https://securetoken.google.com/<project>,
 * aud = <project>, not expired, issued and authenticated in the past, non-empty sub.
 *
 * We don't use firebase-admin/auth for this: it pulls in jwks-rsa, which require()s the ESM-only `jose`
 * and crashes on Vercel's runtime. `jose` is loaded with import(), which works everywhere.
 */
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

type JoseModule = typeof import("jose");
let jose: Promise<JoseModule> | undefined;
let jwks: ReturnType<JoseModule["createRemoteJWKSet"]> | undefined;

export type VerifiedIdToken = { uid: string; email?: string; email_verified?: boolean };

type KeyInput = Parameters<JoseModule["jwtVerify"]>[1];

export async function verifyFirebaseIdToken(token: string, projectId: string, keys?: KeyInput): Promise<VerifiedIdToken> {
  const j = await (jose ||= import("jose"));
  if (!keys) keys = jwks ||= j.createRemoteJWKSet(new URL(JWKS_URL), { cooldownDuration: 30_000, cacheMaxAge: 6 * 60 * 60 * 1000 });
  const { payload } = await j.jwtVerify(token, keys as Parameters<JoseModule["jwtVerify"]>[1] & CryptoKey, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    requiredClaims: ["exp", "iat", "sub", "auth_time"],
    clockTolerance: 5,
  });
  const now = Math.floor(Date.now() / 1000);
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub || sub.length > 128) throw new Error("bad sub");
  if (typeof payload.iat !== "number" || payload.iat > now + 5) throw new Error("bad iat");
  const authTime = (payload as { auth_time?: unknown }).auth_time;
  if (typeof authTime !== "number" || authTime > now + 5) throw new Error("bad auth_time");
  const email = typeof payload.email === "string" ? payload.email : undefined;
  return { uid: sub, email, email_verified: payload.email_verified === true };
}
