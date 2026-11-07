import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ApiError } from "./api-error";

/**
 * Encrypts small secrets (a seller's Gmail App Password) before they're saved, and signs links
 * (unsubscribe). The key lives only in the server environment: EMAIL_SECRET_KEY, 32 random bytes as base64.
 */
function key(): Buffer {
  const raw = (process.env.EMAIL_SECRET_KEY || "").trim();
  const k = raw ? Buffer.from(raw, "base64") : Buffer.alloc(0);
  if (k.length !== 32) throw new ApiError(503, "Email isn't set up on the server yet (EMAIL_SECRET_KEY missing).");
  return k;
}

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), body.toString("base64")].join(".");
}

export function open(sealed: string): string {
  const [v, iv, tag, body] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !body) throw new Error("bad sealed value");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
}

export function sign(value: string): string {
  return createHmac("sha256", key()).update(value).digest("base64url").slice(0, 32);
}

export function verifySignature(value: string, sig: string): boolean {
  const want = Buffer.from(sign(value));
  const got = Buffer.from(String(sig || ""));
  return want.length === got.length && timingSafeEqual(want, got);
}
