import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { firebaseConfig } from "../firebase-config";
import type { StoreData } from "../store-service";
import { ApiError } from "./api-error";
import { effectivePlan } from "../subscription";
import { verifyFirebaseIdToken } from "./id-token";

/**
 * Firebase with full server access, for the payment routes only. It needs a service account:
 * Firebase console › Project settings › Service accounts › Generate new private key, then put the
 * whole JSON file (or its base64) in FIREBASE_SERVICE_ACCOUNT. Never expose it to the browser.
 */
function readServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  if (!raw) throw new ApiError(503, "Online payments aren't set up on the server yet (FIREBASE_SERVICE_ACCOUNT missing).");
  let json: Record<string, string>;
  try {
    json = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    throw new ApiError(503, "FIREBASE_SERVICE_ACCOUNT isn't valid JSON (or base64 of it).");
  }
  const projectId = json.project_id;
  const clientEmail = json.client_email;
  const privateKey = String(json.private_key || "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new ApiError(503, "FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email or private_key.");
  if (projectId !== firebaseConfig.projectId) {
    throw new ApiError(503, `FIREBASE_SERVICE_ACCOUNT is for project "${projectId}", but the app uses "${firebaseConfig.projectId}".`);
  }
  return { projectId, clientEmail, privateKey };
}

let app: App | undefined;
function adminApp(): App {
  if (app) return app;
  const existing = getApps().find((a) => a.name === "shopersite-admin");
  if (existing) return (app = existing);
  const sa = readServiceAccount();
  app = initializeApp({ credential: cert(sa), projectId: sa.projectId }, "shopersite-admin");
  return app;
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

/** The signed-in seller behind an `Authorization: Bearer <Firebase ID token>` header. */
export async function requireUser(req: Request): Promise<{ uid: string; email?: string; emailVerified: boolean }> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new ApiError(401, "Please sign in again.");
  const { projectId } = readServiceAccount(); // a setup problem should say so, not "sign in again"
  try {
    const decoded = await verifyFirebaseIdToken(token, projectId);
    return { uid: decoded.uid, email: decoded.email, emailVerified: !!decoded.email_verified };
  } catch {
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
}

/** The signed-in user if the request carries a valid token, otherwise null (for public routes). */
export async function optionalUser(req: Request): Promise<{ uid: string; email?: string; emailVerified: boolean } | null> {
  if (!(req.headers.get("authorization") || "").startsWith("Bearer ")) return null;
  try {
    return await requireUser(req);
  } catch {
    return null;
  }
}

/** Loads a store and checks the signed-in user owns it (same rule as the dashboard's store list). */
export async function requireStoreOwner(req: Request, subdomain: string): Promise<{ store: StoreData; uid: string }> {
  const user = await requireUser(req);
  const store = await getStoreDoc(subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  const email = (user.email || "").toLowerCase().trim();
  const owns =
    (store.ownerId && store.ownerId === user.uid) ||
    // older stores were linked by email only; accept that only for a verified email
    (!store.ownerId && !!email && user.emailVerified &&
      [store.ownerEmail, store.contactEmail].some((e) => (e || "").toLowerCase().trim() === email));
  if (!owns) throw new ApiError(403, "You don't have access to this store.");
  return { store, uid: user.uid };
}

export async function getStoreDoc(subdomain: string): Promise<StoreData | null> {
  const clean = String(subdomain || "").toLowerCase().trim();
  if (!/^[a-z0-9-]{1,63}$/.test(clean)) return null;
  const snap = await adminDb().collection("stores").doc(clean).get();
  // an ended paid plan counts as Free here too
  return snap.exists ? effectivePlan(snap.data() as StoreData) : null;
}
