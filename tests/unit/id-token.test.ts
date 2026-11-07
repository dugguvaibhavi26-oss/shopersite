import { describe, expect, it, vi } from "vitest";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";

vi.mock("server-only", () => ({}));
import { verifyFirebaseIdToken } from "@/lib/server/id-token";

const P = "rox-shoppersite";
const now = () => Math.floor(Date.now() / 1000);

async function setup() {
  const good = await generateKeyPair("RS256", { extractable: true });
  const evil = await generateKeyPair("RS256", { extractable: true });
  const jwk = { ...(await exportJWK(good.publicKey)), kid: "k1", alg: "RS256" };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const sign = (claims: Record<string, unknown> = {}, key = good.privateKey, alg = "RS256") =>
    new SignJWT({ email: "a@b.in", email_verified: true, auth_time: now() - 60, ...claims })
      .setProtectedHeader({ alg, kid: "k1" })
      .setIssuer((claims.iss as string) ?? `https://securetoken.google.com/${P}`)
      .setAudience((claims.aud as string) ?? P)
      .setSubject((claims.sub as string) ?? "uid123")
      .setIssuedAt((claims.iat as number) ?? now() - 60)
      .setExpirationTime((claims.exp as number) ?? now() + 3600)
      .sign(key);
  return { keys, sign, evil };
}

describe("verifyFirebaseIdToken", () => {
  it("accepts a genuine token", async () => {
    const { keys, sign } = await setup();
    const r = await verifyFirebaseIdToken(await sign(), P, keys);
    expect(r).toEqual({ uid: "uid123", email: "a@b.in", email_verified: true });
  });
  it("rejects forged, foreign, expired and malformed tokens", async () => {
    const { keys, sign, evil } = await setup();
    const bad = [
      await sign({}, evil.privateKey), // signed by someone else
      await sign({ iss: "https://securetoken.google.com/other" }),
      await sign({ aud: "other" }),
      await sign({ exp: now() - 10 }),
      await sign({ iat: now() + 600 }),
      await sign({ auth_time: now() + 600 }),
      "not.a.token",
      "",
    ];
    for (const t of bad) await expect(verifyFirebaseIdToken(t, P, keys)).rejects.toBeTruthy();
    // alg "none" style tampering: payload changed after signing
    const t = await sign();
    const [h, , s] = t.split(".");
    const forged = `${h}.${Buffer.from(JSON.stringify({ sub: "admin", aud: P, iss: `https://securetoken.google.com/${P}`, exp: now() + 999, iat: now(), auth_time: now() })).toString("base64url")}.${s}`;
    await expect(verifyFirebaseIdToken(forged, P, keys)).rejects.toBeTruthy();
  });
  it("treats an unverified email as unverified", async () => {
    const { keys, sign } = await setup();
    const r = await verifyFirebaseIdToken(await sign({ email_verified: false }), P, keys);
    expect(r.email_verified).toBe(false);
  });
});
