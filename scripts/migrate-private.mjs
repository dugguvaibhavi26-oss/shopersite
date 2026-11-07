#!/usr/bin/env node
/**
 * One-time move of buyers' details out of the public store documents:
 * orders, customers, subscribers and payment requests go from stores/{sub} into
 * stores/{sub}/private/data (readable only by the owner and admins), and are deleted from the
 * public document.
 *
 *   node scripts/migrate-private.mjs            dry run: shows what would move (changes nothing)
 *   node scripts/migrate-private.mjs --apply    does it
 *
 * Safe to run more than once. Run it right AFTER the new app version is live and right BEFORE
 * publishing the new rules (npm run rules:deploy).
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const require = createRequire(path.join(root, "package.json"));
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

function env(name) {
  if (process.env[name]) return process.env[name];
  const file = path.join(root, ".env.local");
  if (!existsSync(file)) return "";
  const m = readFileSync(file, "utf8").match(new RegExp(`^${name}="?(.*?)"?$`, "m"));
  return m ? m[1] : "";
}
const raw = env("FIREBASE_SERVICE_ACCOUNT");
if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
const sa = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
const db = getFirestore(initializeApp({ credential: cert({ projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key }) }));

const PRIVATE = ["orders", "customers", "subscribers", "pendingSubscription", "subscriptionHistory", "themePurchases"];
const apply = process.argv.includes("--apply");
const snap = await db.collection("stores").get();

// a local backup of everything first, in case anything needs to be put back
if (apply) {
  const dir = path.join(root, "backups");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `stores-before-migration-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(snap.docs.map((d) => ({ id: d.id, data: d.data() })), null, 1));
  console.log(`Backup written to ${file} (keep it private: it has buyers' details)`);
}

let moved = 0;
for (const d of snap.docs) {
  const pub = d.data();
  const privRef = d.ref.collection("private").doc("data");
  const privSnap = await privRef.get();
  const priv = privSnap.exists ? privSnap.data() : {};
  const toMove = {};
  const toDelete = {};
  for (const k of PRIVATE) {
    if (k in pub) {
      // keep anything already in the private doc (written by the new app); otherwise take the public copy
      if (!(k in priv)) toMove[k] = pub[k];
      toDelete[k] = FieldValue.delete();
    } else if (!(k in priv)) {
      toMove[k] = k === "pendingSubscription" ? null : [];
    }
  }
  const counts = PRIVATE.filter((k) => Array.isArray(pub[k]) && pub[k].length).map((k) => `${k}:${pub[k].length}`).join(" ");
  if (!Object.keys(toMove).length && !Object.keys(toDelete).length) continue;
  moved++;
  console.log(`${apply ? "moving " : "would move"} ${d.id.padEnd(20)} ${counts || "(empty lists)"}`);
  if (apply) {
    await db.runTransaction(async (tx) => {
      tx.set(privRef, { ...toMove, updatedAt: new Date().toISOString() }, { merge: true });
      if (Object.keys(toDelete).length) tx.update(d.ref, toDelete);
    });
  }
}
console.log(`\n${snap.size} stores checked, ${moved} ${apply ? "updated" : "to update"}.${apply ? "" : " Run with --apply to do it."}`);
