/**
 * Staff passwords and sign-in sessions. Runs on the server only (uses Node's crypto); kept free of
 * Firebase so it can be tested on its own.
 */
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 32, (err, key) => (err ? reject(err) : resolve(key))));
}

/** A salted scrypt hash; the password itself is never stored. */
export async function hashPassword(password: string, salt: string = randomBytes(16).toString("hex")): Promise<{ salt: string; hash: string }> {
  return { salt, hash: (await derive(password, salt)).toString("hex") };
}

export async function passwordMatches(password: string, salt: string, hash: string): Promise<boolean> {
  const got = await derive(password, salt || "x");
  const want = Buffer.from(hash || "", "hex");
  return want.length === got.length && timingSafeEqual(got, want);
}

/** What a staff sign-in cookie carries. `v` goes up when the password changes or the account is switched off. */
export interface StaffSession {
  /** staff id */
  sid: string;
  /** store subdomain */
  sub: string;
  v: number;
  /** when it stops working (ms since 1970) */
  exp: number;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (body: string, key: Buffer) => createHmac("sha256", key).update(body).digest();

export function signSession(session: StaffSession, key: Buffer): string {
  const body = b64(JSON.stringify(session));
  return `${body}.${b64(sign(body, key))}`;
}

/** The session inside a cookie value, or null when it's missing, altered or expired. */
export function readSession(token: string | undefined | null, key: Buffer, now: number = Date.now()): StaffSession | null {
  if (!token) return null;
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const want = sign(body, key);
  let got: Buffer;
  try {
    got = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StaffSession;
    if (typeof s.sid !== "string" || typeof s.sub !== "string" || typeof s.v !== "number" || typeof s.exp !== "number") return null;
    return s.exp > now ? s : null;
  } catch {
    return null;
  }
}
