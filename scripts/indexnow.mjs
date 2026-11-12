// Tells Bing (which ChatGPT search and Copilot use), Yandex and other IndexNow engines that the
// site's pages exist or changed, so they are crawled now instead of whenever. Google doesn't use
// IndexNow: for Google, use Search Console's sitemap and "Request indexing".
//
//   node scripts/indexnow.mjs            -> every page in the live sitemap
//   node scripts/indexnow.mjs /about     -> just these pages
//
// The key is public on purpose: it proves we own the site (public/<key>.txt).
const KEY = "a262c2c063205ffd941db02e503887c5";
const SITE = "https://www.shopersite.in";

const args = process.argv.slice(2);
let urls;
if (args.length) {
  urls = args.map((p) => (p.startsWith("http") ? p : SITE + (p.startsWith("/") ? p : "/" + p)));
} else {
  const xml = await (await fetch(SITE + "/sitemap.xml")).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const keyCheck = await fetch(SITE + "/" + KEY + ".txt");
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  console.error("The key file isn't live yet at " + SITE + "/" + KEY + ".txt. Deploy first.");
  process.exit(1);
}
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: "www.shopersite.in", key: KEY, keyLocation: SITE + "/" + KEY + ".txt", urlList: urls.slice(0, 10000) }),
});
console.log("IndexNow: " + res.status + " " + res.statusText + " for " + urls.length + " pages");
