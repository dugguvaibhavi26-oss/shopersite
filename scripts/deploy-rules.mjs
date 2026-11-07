#!/usr/bin/env node
/**
 * Publishes firestore.rules and storage.rules to the live Firebase project.
 *
 *   npm run test:rules         first: attack-test the rules in the local emulator (must pass)
 *   npm run rules:deploy       then: publish them (node scripts/deploy-rules.mjs --deploy)
 *   node scripts/deploy-rules.mjs --print   write the final rules to rules-out/ to paste into the console
 *
 * Needs FIREBASE_SERVICE_ACCOUNT (env or .env.local). The admin list comes from
 * NEXT_PUBLIC_ADMIN_EMAILS (comma separated); default tejaswithreddy0101@gmail.com.
 *
 * ORDER MATTERS on first launch: deploy the new app code, run `npm run data:migrate`, then this.
 * Publishing these rules while the old app version is live would stop its buyers placing orders.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const require = createRequire(path.join(root, "package.json"));

function env(name) {
  if (process.env[name]) return process.env[name];
  const file = path.join(root, ".env.local");
  if (!existsSync(file)) return "";
  const m = readFileSync(file, "utf8").match(new RegExp(`^${name}="?(.*?)"?$`, "m"));
  return m ? m[1] : "";
}

const admins = (env("NEXT_PUBLIC_ADMIN_EMAILS") || "tejaswithreddy0101@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter((e) => /^[^\s@'"]+@[^\s@'"]+\.[^\s@'"]+$/.test(e));
if (!admins.length) throw new Error("No valid admin emails in NEXT_PUBLIC_ADMIN_EMAILS");

const fill = (src) =>
  src.replace(/\/\*ADMIN_EMAILS\*\/[\s\S]*?\/\*END_ADMIN_EMAILS\*\//g, `/*ADMIN_EMAILS*/${admins.map((e) => `'${e}'`).join(", ")}/*END_ADMIN_EMAILS*/`);
const firestoreRules = fill(readFileSync(path.join(root, "firestore.rules"), "utf8"));
const storageRules = fill(readFileSync(path.join(root, "storage.rules"), "utf8"));

if (process.argv.includes("--print")) {
  const out = path.join(root, "rules-out");
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, "firestore.rules"), firestoreRules);
  writeFileSync(path.join(out, "storage.rules"), storageRules);
  console.log(`Wrote ${out}/firestore.rules and storage.rules (admins: ${admins.join(", ")})`);
  process.exit(0);
}
if (!process.argv.includes("--deploy")) {
  console.log("Nothing done. Use --deploy to publish, or --print to write the rules for the Firebase console.");
  process.exit(0);
}

const raw = env("FIREBASE_SERVICE_ACCOUNT");
if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
const sa = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
const { cert } = require("firebase-admin/app");
const project = sa.project_id;
const bucket = `${project}.firebasestorage.app`;
const token = (await cert({ projectId: project, clientEmail: sa.client_email, privateKey: sa.private_key }).getAccessToken()).access_token;
const API = "https://firebaserules.googleapis.com/v1";

async function call(method, url, body) {
  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(json).slice(0, 1500)}`);
  return json;
}

async function release(releaseName, file, content) {
  const rs = await call("POST", `${API}/projects/${project}/rulesets`, { source: { files: [{ name: file, content }] } });
  const name = `projects/${project}/releases/${releaseName}`;
  await call("PATCH", `${API}/${name}`, { release: { name, rulesetName: rs.name } });
  console.log(`Deployed ${file} -> ${releaseName} (${rs.name})`);
}

console.log(`Project ${project} · admins: ${admins.join(", ")}`);
await release("cloud.firestore", "firestore.rules", firestoreRules);
await release(`firebase.storage/${bucket}`, "storage.rules", storageRules);
console.log("Done. Rules are live.");
