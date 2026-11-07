/**
 * Attack tests for firestore.rules and storage.rules, run against Firebase's local emulator with
 * real reads and writes (nothing touches the live project):
 *
 *   npm run test:rules
 *
 * Every "DENY" case is something an attacker could try from a browser with the public Firebase config.
 */
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, collectionGroup, query } from "firebase/firestore";
import { ref, uploadBytes, deleteObject } from "firebase/storage";

const ADMIN = "tejaswithreddy0101@gmail.com";
const env = await initializeTestEnvironment({
  projectId: "demo-shopersite",
  // hosts come from FIRESTORE_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST set by emulators:exec
  firestore: { rules: readFileSync("firestore.rules", "utf8") },
  storage: { rules: readFileSync("storage.rules", "utf8") },
});

const store = { id: "store-lume", subdomain: "lume", ownerId: "owner1", ownerEmail: "seller@example.com", planId: "free", name: "Lume", products: [], isPaused: false, status: "published" };
const priv = { orders: [{ id: "o1", fulfilmentStatus: "placed", customer: { phone: "9876543210" } }], customers: [], subscribers: [], pendingSubscription: { id: "s1" }, subscriptionHistory: [], themePurchases: [] };

async function seed() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "stores/lume"), store);
    await setDoc(doc(db, "stores/lume/private/data"), priv);
    await setDoc(doc(db, "stores/old"), { ...store, id: "store-old", subdomain: "old", ownerId: "", ownerEmail: "seller@example.com" });
    await setDoc(doc(db, "stores/old/private/data"), priv);
    await setDoc(doc(db, "stores/frozen"), { ...store, subdomain: "frozen", isPaused: true, status: "suspended" });
    await setDoc(doc(db, "platform_settings/payment"), { activeUpiId: "shop@ybl" });
    await setDoc(doc(db, "payments/ord_1"), { status: "PENDING" });
    await setDoc(doc(db, "upi_claims/p_123456789012"), { kind: "plan" });
    await setDoc(doc(db, "cashfree_merchants/lume"), { state: "kyc_pending" });
    await setDoc(doc(db, "orders/ord_1"), { total: 100 });
    await ctx.storage().ref ? null : null;
  });
}

const visitor = () => env.unauthenticatedContext().firestore();
const owner = () => env.authenticatedContext("owner1", { email: "seller@example.com", email_verified: true }).firestore();
const ownerByEmail = () => env.authenticatedContext("owner-new-uid", { email: "seller@example.com", email_verified: true }).firestore();
const stranger = () => env.authenticatedContext("attacker", { email: "attacker@example.com", email_verified: true }).firestore();
const admin = () => env.authenticatedContext("admin1", { email: ADMIN, email_verified: true }).firestore();
const fakeAdmin = () => env.authenticatedContext("fake", { email: ADMIN, email_verified: false }).firestore();

let pass = 0;
let fail = 0;
async function check(name, expect, fn) {
  await seed();
  try {
    await (expect === "ALLOW" ? assertSucceeds(fn()) : assertFails(fn()));
    pass++;
    console.log(`  PASS  [${expect}] ${name}`);
  } catch (err) {
    fail++;
    console.log(`  FAIL  [${expect}] ${name}  <- ${String(err?.message || err).slice(0, 200)}`);
  }
}

console.log("Firestore rules");
// reading
await check("anyone can view a shop", "ALLOW", () => getDoc(doc(visitor(), "stores/lume")));
await check("anyone can list shops (storefront)", "ALLOW", () => getDocs(collection(visitor(), "stores")));
await check("visitor can't read buyers' orders", "DENY", () => getDoc(doc(visitor(), "stores/lume/private/data")));
await check("another seller can't read buyers' orders", "DENY", () => getDoc(doc(stranger(), "stores/lume/private/data")));
await check("owner can read their orders", "ALLOW", () => getDoc(doc(owner(), "stores/lume/private/data")));
await check("older store: owner by verified email can read orders", "ALLOW", () => getDoc(doc(ownerByEmail(), "stores/old/private/data")));
await check("admin can read any shop's orders", "ALLOW", () => getDoc(doc(admin(), "stores/lume/private/data")));
await check("admin can list every shop's private data", "ALLOW", () => getDocs(query(collectionGroup(admin(), "private"))));
await check("seller can't list every shop's private data", "DENY", () => getDocs(query(collectionGroup(owner(), "private"))));
await check("unverified email posing as admin can't read orders", "DENY", () => getDoc(doc(fakeAdmin(), "stores/lume/private/data")));
await check("nobody reads payments from a browser", "DENY", () => getDoc(doc(owner(), "payments/ord_1")));
await check("nobody reads UPI claims", "DENY", () => getDoc(doc(admin(), "upi_claims/p_123456789012")));
await check("nobody reads the orders backup", "DENY", () => getDoc(doc(owner(), "orders/ord_1")));
await check("nobody reads Cashfree records", "DENY", () => getDoc(doc(owner(), "cashfree_merchants/lume")));

// changing a shop
await check("visitor can't change a shop", "DENY", () => updateDoc(doc(visitor(), "stores/lume"), { name: "Hacked" }));
await check("another seller can't change a shop", "DENY", () => updateDoc(doc(stranger(), "stores/lume"), { products: [{ id: "x" }] }));
await check("owner can edit products and prices", "ALLOW", () => updateDoc(doc(owner(), "stores/lume"), { products: [{ id: "p1", price: 100 }], updatedAt: "x" }));
await check("owner can't give themselves Pro", "DENY", () => updateDoc(doc(owner(), "stores/lume"), { planId: "pro" }));
await check("owner can't extend their plan", "DENY", () => updateDoc(doc(owner(), "stores/lume"), { planPaidUntil: "2099-01-01" }));
await check("owner can't grant themselves paid themes", "DENY", () => updateDoc(doc(owner(), "stores/lume"), { ownedThemes: ["luxe"] }));
await check("owner can't lift a suspension", "DENY", () => updateDoc(doc(owner(), "stores/frozen"), { isPaused: false, status: "published" }));
await check("owner can't hand the shop to someone else", "DENY", () => updateDoc(doc(owner(), "stores/lume"), { ownerId: "attacker" }));
await check("owner can't put buyers' orders in the public doc", "DENY", () => updateDoc(doc(owner(), "stores/lume"), { orders: [{ id: 1 }] }));
await check("admin can change a plan", "ALLOW", () => updateDoc(doc(admin(), "stores/lume"), { planId: "pro", planPaidUntil: "2027-01-01" }));
await check("admin can suspend a shop", "ALLOW", () => updateDoc(doc(admin(), "stores/lume"), { isPaused: true, status: "suspended" }));
await check("fake admin (unverified email) can't change a plan", "DENY", () => updateDoc(doc(fakeAdmin(), "stores/lume"), { planId: "pro" }));
await check("owner can't delete their shop record", "DENY", () => deleteDoc(doc(owner(), "stores/lume")));
await check("admin can delete a shop", "ALLOW", () => deleteDoc(doc(admin(), "stores/lume")));

// creating a shop
const fresh = { ...store, id: "store-new", subdomain: "newshop" };
await check("seller creates a Free shop", "ALLOW", () => setDoc(doc(owner(), "stores/newshop"), fresh));
await check("can't create a shop already on Pro", "DENY", () => setDoc(doc(owner(), "stores/newshop"), { ...fresh, planId: "pro" }));
await check("can't create a shop owned by someone else", "DENY", () => setDoc(doc(stranger(), "stores/newshop"), fresh));
await check("can't create a shop with paid themes", "DENY", () => setDoc(doc(owner(), "stores/newshop"), { ...fresh, ownedThemes: ["luxe"] }));
await check("can't take over an existing shop by 'creating' it", "DENY", () => setDoc(doc(stranger(), "stores/lume"), { ...store, ownerId: "attacker" }));
await check("visitor can't create a shop", "DENY", () => setDoc(doc(visitor(), "stores/newshop"), fresh));

// private data
await check("owner can update an order's status", "ALLOW", () =>
  updateDoc(doc(owner(), "stores/lume/private/data"), { orders: [{ id: "o1", fulfilmentStatus: "shipped" }] })
);
await check("owner can't approve their own plan payment", "DENY", () =>
  updateDoc(doc(owner(), "stores/lume/private/data"), { pendingSubscription: null, subscriptionHistory: [{ id: "s1", status: "verified" }] })
);
await check("owner can't mark a theme purchase approved", "DENY", () => updateDoc(doc(owner(), "stores/lume/private/data"), { themePurchases: [{ id: "t", status: "verified" }] }));
await check("buyer can't write a fake paid order", "DENY", () => updateDoc(doc(visitor(), "stores/lume/private/data"), { orders: [{ id: "fake", paymentStatus: "paid" }] }));
await check("another seller can't wipe a shop's orders", "DENY", () => updateDoc(doc(stranger(), "stores/lume/private/data"), { orders: [] }));
await check("admin approves a plan payment", "ALLOW", () => updateDoc(doc(admin(), "stores/lume/private/data"), { pendingSubscription: null }));
await check("can't create a private doc with a fake approval", "DENY", async () => {
  await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), "stores/lume/private/data")));
  return setDoc(doc(owner(), "stores/lume/private/data"), { orders: [], subscriptionHistory: [{ status: "verified" }] });
});
await check("owner creates an empty private doc", "ALLOW", async () => {
  await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), "stores/lume/private/data")));
  return setDoc(doc(owner(), "stores/lume/private/data"), { orders: [], customers: [], subscribers: [], subscriptionHistory: [], themePurchases: [], pendingSubscription: null, updatedAt: "x" });
});

// platform
await check("anyone reads platform settings", "ALLOW", () => getDoc(doc(visitor(), "platform_settings/payment")));
await check("seller can't change where plans are paid", "DENY", () => updateDoc(doc(owner(), "platform_settings/payment"), { activeUpiId: "attacker@ybl" }));
await check("seller can't change plan prices", "DENY", () => setDoc(doc(owner(), "platform_settings/plan_details"), { plans: { pro: { priceMonthly: 0 } } }));
await check("admin changes platform settings", "ALLOW", () => updateDoc(doc(admin(), "platform_settings/payment"), { activeUpiId: "new@ybl" }));
await check("seller can't post platform banners", "DENY", () => setDoc(doc(owner(), "platform_banners/b1"), { imageUrl: "x" }));
await check("seller can't send broadcasts", "DENY", () => setDoc(doc(owner(), "platform_broadcasts/b1"), { message: "x" }));
await check("visitor can't write payments", "DENY", () => setDoc(doc(visitor(), "payments/ord_2"), { status: "PAID" }));
await check("seller can't mark a payment paid", "DENY", () => updateDoc(doc(owner(), "payments/ord_1"), { status: "PAID" }));
await check("seller can't activate their own Cashfree account", "DENY", () => updateDoc(doc(owner(), "cashfree_merchants/lume"), { state: "active" }));
await check("nobody can free a used UPI reference", "DENY", () => deleteDoc(doc(owner(), "upi_claims/p_123456789012")));
await check("visitor can't add fake subscribers", "DENY", () => setDoc(doc(visitor(), "subscribers/x"), { email: "a@b.c" }));
await check("leftover test collections are closed", "DENY", () => getDoc(doc(visitor(), "_health_check/x")));

console.log("\nStorage rules");
const png = new Uint8Array([137, 80, 78, 71]);
const st = (ctx) => ctx.storage();
const ownerCtx = () => env.authenticatedContext("owner1", { email: "seller@example.com", email_verified: true });
const strangerCtx = () => env.authenticatedContext("attacker", { email: "attacker@example.com", email_verified: true });
const adminCtx = () => env.authenticatedContext("admin1", { email: ADMIN, email_verified: true });
async function seedFile() {
  await env.withSecurityRulesDisabled((ctx) => uploadBytes(ref(st(ctx), "store_assets/lume/theme-a.png"), png, { contentType: "image/png" }));
}
async function checkSt(name, expect, fn) {
  try {
    await seedFile();
    await (expect === "ALLOW" ? assertSucceeds(fn()) : assertFails(fn()));
    pass++;
    console.log(`  PASS  [${expect}] ${name}`);
  } catch (err) {
    fail++;
    console.log(`  FAIL  [${expect}] ${name}  <- ${String(err?.message || err).slice(0, 200)}`);
  }
}
await checkSt("visitor can't upload", "DENY", () => uploadBytes(ref(st(env.unauthenticatedContext()), "store_assets/lume/b.png"), png, { contentType: "image/png" }));
await checkSt("seller uploads a theme image", "ALLOW", () => uploadBytes(ref(st(ownerCtx()), `store_assets/lume/new-${Date.now()}.png`), png, { contentType: "image/png" }));
await checkSt("can't upload a web page / script", "DENY", () => uploadBytes(ref(st(ownerCtx()), "store_assets/lume/x.html"), png, { contentType: "text/html" }));
await checkSt("can't upload a huge file", "DENY", () =>
  uploadBytes(ref(st(ownerCtx()), "store_assets/lume/big.png"), new Uint8Array(9 * 1024 * 1024), { contentType: "image/png" })
);
await checkSt("can't overwrite another shop's photo", "DENY", () => uploadBytes(ref(st(strangerCtx()), "store_assets/lume/theme-a.png"), png, { contentType: "image/png" }));
await checkSt("can't delete another shop's photo", "DENY", () => deleteObject(ref(st(strangerCtx()), "store_assets/lume/theme-a.png")));
await checkSt("seller can't upload platform banners", "DENY", () => uploadBytes(ref(st(ownerCtx()), "platform_banners/b.png"), png, { contentType: "image/png" }));
await checkSt("admin uploads a banner", "ALLOW", () => uploadBytes(ref(st(adminCtx()), "platform_banners/b.png"), png, { contentType: "image/png" }));
await checkSt("random paths are read-only", "DENY", () => uploadBytes(ref(st(ownerCtx()), "anything/else.png"), png, { contentType: "image/png" }));

await env.cleanup();
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
