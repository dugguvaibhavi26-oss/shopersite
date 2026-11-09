import "server-only";
import { siteConfig } from "../config/site";
import { ApiError } from "./api-error";
import { adminDb, requireUser } from "./firebase-admin";
import { sendPlatformMail } from "./platform-mail";

/**
 * Platform admins come from two places:
 *  - owners: NEXT_PUBLIC_ADMIN_EMAILS (Vercel). Fixed; only they can add or remove other admins.
 *  - added admins: `platform_admins/{email}` docs, created from Admin → Admins. The database rules
 *    check the same collection, so an added admin can do everything in the panel.
 */
const COLLECTION = "platform_admins";
const EMAIL_RE = /^[^\s@'"/]+@[^\s@'"/]+\.[^\s@'"/]+$/;

export interface PlatformAdmin {
  email: string;
  name: string;
  addedBy: string;
  addedAt: string;
  /** first time they opened the admin panel */
  joinedAt?: string;
}

export type AdminRole = "owner" | "admin";

export interface AdminListItem extends Partial<PlatformAdmin> {
  email: string;
  role: AdminRole;
}

const norm = (email: string) => email.trim().toLowerCase();
const isOwnerEmail = (email: string) => siteConfig.adminEmails.includes(norm(email));

/** The role of a verified email, or null when it isn't an admin. */
export async function adminRole(email: string | undefined | null): Promise<AdminRole | null> {
  if (!email) return null;
  const e = norm(email);
  if (isOwnerEmail(e)) return "owner";
  if (!EMAIL_RE.test(e)) return null;
  const doc = await adminDb().collection(COLLECTION).doc(e).get();
  return doc.exists ? "admin" : null;
}

/** Throws 403 unless the caller is a signed-in admin with a verified email. */
export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  const role = user.emailVerified ? await adminRole(user.email) : null;
  if (!role) throw new ApiError(403, "Admins only.");
  return { user, role, email: norm(user.email || "") };
}

/** Records the first visit of an added admin (shown as "Joined" in the list). */
export async function markAdminJoined(email: string) {
  const ref = adminDb().collection(COLLECTION).doc(norm(email));
  const snap = await ref.get();
  if (snap.exists && !snap.get("joinedAt")) await ref.update({ joinedAt: new Date().toISOString() });
}

export async function listAdmins(): Promise<AdminListItem[]> {
  const snap = await adminDb().collection(COLLECTION).orderBy("addedAt", "asc").get();
  const owners: AdminListItem[] = siteConfig.adminEmails.map((email) => ({ email, role: "owner" }));
  const added: AdminListItem[] = snap.docs
    .map((d) => ({ ...(d.data() as PlatformAdmin), role: "admin" as const }))
    .filter((a) => !isOwnerEmail(a.email));
  return [...owners, ...added];
}

/** Every admin email, for notifications. */
export async function allAdminEmails(): Promise<string[]> {
  const list = await listAdmins().catch(() => siteConfig.adminEmails.map((email) => ({ email })));
  return [...new Set(list.map((a) => a.email))];
}

/** Adds an admin and emails them. Returns whether the email went out. */
export async function addAdmin(by: string, input: { email: string; name: string }) {
  const email = norm(input.email);
  const name = input.name.trim().slice(0, 80);
  if (!EMAIL_RE.test(email) || email.length > 120) throw new ApiError(400, "Enter a valid email address.");
  if (isOwnerEmail(email)) throw new ApiError(409, "That email is already an owner admin.");
  const ref = adminDb().collection(COLLECTION).doc(email);
  if ((await ref.get()).exists) throw new ApiError(409, "That email is already an admin.");

  const admin: PlatformAdmin = { email, name, addedBy: by, addedAt: new Date().toISOString() };
  await ref.set(admin);

  const site = (process.env.NEXT_PUBLIC_APP_URL || `https://www.${siteConfig.domain || "shopersite.in"}`).replace(/\/$/, "");
  const emailed = await sendPlatformMail({
    to: email,
    replyTo: by,
    subject: "You've been made an admin of Shopersite",
    text: [
      `Hi${name ? ` ${name}` : ""},`,
      "",
      `${by} has made you an admin of Shopersite.`,
      "",
      "To open the admin panel:",
      `1. Go to ${site}/admin`,
      `2. Sign in with this email address (${email}). If you don't have a Shopersite account yet, sign up with this same email.`,
      "",
      "As an admin you can see and manage every store, plan payment and help request on the platform.",
      "",
      "If you weren't expecting this, you can ignore this email or reply to let us know.",
      "",
      "— Shopersite",
    ].join("\n"),
  }).catch((err) => {
    console.error("[admins] invite email failed", err);
    return false;
  });
  return { admin, emailed };
}

export async function removeAdmin(email: string) {
  const e = norm(email);
  if (isOwnerEmail(e)) throw new ApiError(400, "Owner admins are set in Vercel and can't be removed here.");
  const ref = adminDb().collection(COLLECTION).doc(e);
  if (!(await ref.get()).exists) throw new ApiError(404, "That admin wasn't found.");
  await ref.delete();
}
