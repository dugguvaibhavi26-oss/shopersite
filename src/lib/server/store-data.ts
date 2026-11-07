import "server-only";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { mergeStoreParts, splitStoreUpdate } from "../store-keys";
import type { StoreData } from "../store-service";
import { adminDb } from "./firebase-admin";

/** stores/{subdomain} (public) and stores/{subdomain}/private/data (buyers' details, payments). */
export function storeRefs(subdomain: string): { pub: DocumentReference; priv: DocumentReference } {
  const pub = adminDb().collection("stores").doc(subdomain);
  return { pub, priv: pub.collection("private").doc("data") };
}

export function cleanSubdomain(raw: unknown): string | null {
  const s = String(raw || "").toLowerCase().trim();
  return /^[a-z0-9-]{1,63}$/.test(s) ? s : null;
}

/** Reads the whole store (public + private) inside a transaction. */
export async function readStoreTx(tx: Transaction, subdomain: string): Promise<StoreData | null> {
  const { pub, priv } = storeRefs(subdomain);
  const [p, q] = await Promise.all([tx.get(pub), tx.get(priv)]);
  if (!p.exists) return null;
  return mergeStoreParts(p.data() as Partial<StoreData>, q.exists ? (q.data() as Partial<StoreData>) : null);
}

/** Reads the whole store (public + private) outside a transaction. */
export async function readStore(subdomain: string): Promise<StoreData | null> {
  const { pub, priv } = storeRefs(subdomain);
  const [p, q] = await Promise.all([pub.get(), priv.get()]);
  if (!p.exists) return null;
  return mergeStoreParts(p.data() as Partial<StoreData>, q.exists ? (q.data() as Partial<StoreData>) : null);
}

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Writes changed fields to the right document(s) inside a transaction (reads must come first). */
export function writeStoreTx(tx: Transaction, subdomain: string, updates: Partial<StoreData>) {
  const { pub, priv } = storeRefs(subdomain);
  const parts = splitStoreUpdate(updates);
  const now = new Date().toISOString();
  tx.set(pub, clean({ ...parts.pub, updatedAt: now }), { merge: true });
  if (Object.keys(parts.priv).length) tx.set(priv, clean({ ...parts.priv, updatedAt: now }), { merge: true });
}
