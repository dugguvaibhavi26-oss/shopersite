import "server-only";
import { randomBytes } from "node:crypto";
import { siteConfig } from "../config/site";
import type { StoreData } from "../store-service";
import { allAdminEmails, requireAdmin } from "./admin-service";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { sendPlatformMail } from "./platform-mail";

const REQUESTS = "support_requests";
const REPEAT_WINDOW_MS = 60 * 60 * 1000;

export type SupportTopic = "razorpay_setup" | "plugin_request";
export type SupportStatus = "open" | "resolved";

export interface SupportRequest {
  id: string;
  topic: SupportTopic;
  status: SupportStatus;
  storeSubdomain: string;
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  /** plugin requests: the app name and what it should do */
  subject?: string;
  note?: string;
  createdAt: string;
  resolvedAt?: string;
}

const TOPIC_LABEL: Record<SupportTopic, string> = { razorpay_setup: "Razorpay setup help", plugin_request: "Plugin request" };

/** Saves a seller's help request and emails the admins. A repeat within the hour returns the open one. */
export async function createSupportRequest(store: StoreData, userEmail: string | undefined, topic: SupportTopic, extra: { subject?: string; note?: string } = {}) {
  const db = adminDb();
  const recent = await db.collection(REQUESTS).where("storeSubdomain", "==", store.subdomain).limit(20).get();
  const open = recent.docs
    .map((d) => d.data() as SupportRequest)
    .find(
      (r) =>
        r.topic === topic &&
        r.status === "open" &&
        Date.now() - Date.parse(r.createdAt) < REPEAT_WINDOW_MS &&
        (topic !== "plugin_request" || (r.subject || "").toLowerCase() === (extra.subject || "").toLowerCase())
    );
  if (open) return open;

  const req: SupportRequest = {
    id: `sr_${randomBytes(8).toString("hex")}`,
    topic,
    status: "open",
    storeSubdomain: store.subdomain,
    storeName: store.name || store.subdomain,
    ownerName: store.ownerName || "",
    phone: store.contactPhone || "",
    email: store.contactEmail || store.ownerEmail || userEmail || "",
    ...(extra.subject ? { subject: extra.subject } : {}),
    ...(extra.note ? { note: extra.note } : {}),
    createdAt: new Date().toISOString(),
  };
  await db.collection(REQUESTS).doc(req.id).set(req);
  await notifyAdmins(req).catch((err) => console.error("[support] admin email failed", err));
  return req;
}

async function notifyAdmins(r: SupportRequest) {
  const to = await allAdminEmails();
  const lines = [
    `${TOPIC_LABEL[r.topic]} — ${r.storeName}`,
    "",
    ...(r.subject ? [`Plugin: ${r.subject}`] : []),
    ...(r.note ? [`Details: ${r.note}`] : []),
    ...(r.subject || r.note ? [""] : []),
    `Store:  ${r.storeName} (${r.storeSubdomain}.${siteConfig.domain || "shopersite.in"})`,
    `Owner:  ${r.ownerName || "—"}`,
    `Phone:  ${r.phone || "—"}`,
    `Email:  ${r.email || "—"}`,
    `When:   ${new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    "",
    r.topic === "plugin_request" ? "Mark it resolved in Admin → Requests." : "They were promised a reply within 2–3 hours. Mark it resolved in Admin → Requests.",
  ];
  await sendPlatformMail({
    to: to.join(","),
    ...(r.email ? { replyTo: r.email } : {}),
    subject: r.subject ? `[Plugin request] ${r.subject} — ${r.storeName}` : `[Help request] ${TOPIC_LABEL[r.topic]} — ${r.storeName}`,
    text: lines.join("\n"),
  });
}

export { requireAdmin };

export async function listSupportRequests(): Promise<SupportRequest[]> {
  const snap = await adminDb().collection(REQUESTS).orderBy("createdAt", "desc").limit(200).get();
  return snap.docs.map((d) => d.data() as SupportRequest);
}

export async function setSupportStatus(id: string, status: SupportStatus) {
  if (!/^sr_[a-f0-9]{16}$/.test(id)) throw new ApiError(400, "Bad request id.");
  const ref = adminDb().collection(REQUESTS).doc(id);
  if (!(await ref.get()).exists) throw new ApiError(404, "Request not found.");
  await ref.update(status === "resolved" ? { status, resolvedAt: new Date().toISOString() } : { status, resolvedAt: null });
}
