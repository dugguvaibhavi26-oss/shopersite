import fs from "fs";
import zlib from "zlib";
import path from "path";

const chunksDir = path.join(".next", "static", "chunks");
let totalBytes = 0;
let gzippedBytes = 0;

if (fs.existsSync(chunksDir)) {
  const files = fs.readdirSync(chunksDir);
  console.log("Analyzing JS chunks in .next/static/chunks:");
  for (const f of files) {
    if (f.endsWith(".js")) {
      const content = fs.readFileSync(path.join(chunksDir, f));
      const gzip = zlib.gzipSync(content);
      totalBytes += content.length;
      gzippedBytes += gzip.length;
      console.log(`- ${f}: ${(content.length / 1024).toFixed(1)} KB (gzip: ${(gzip.length / 1024).toFixed(1)} KB)`);
    }
  }
}

console.log("-----------------------------------------");
console.log(`TOTAL First-load JS (raw): ${(totalBytes / 1024).toFixed(2)} KB`);
console.log(`TOTAL First-load JS (gzipped): ${(gzippedBytes / 1024).toFixed(2)} KB`);
console.log(`Budget Target: < 150 KB gzipped`);
console.log(`Budget Met: ${gzippedBytes / 1024 < 150 ? "PASS" : "FAIL"}`);
