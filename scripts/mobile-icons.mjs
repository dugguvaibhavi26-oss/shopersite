#!/usr/bin/env node
/**
 * Renders the app icon and splash source images in mobile/assets from the Shopersite bag mark
 * (same artwork as src/app/icon.svg). Then `npm run mobile:assets` turns them into every Android
 * and iOS size. Re-run both after changing the logo:
 *   node scripts/mobile-icons.mjs && npm run mobile:assets
 */
import sharp from "sharp";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../mobile/assets");

// Bag mark from the traced logo artwork (src/components/brand/logo-paths.ts), read straight from
// that file so the app icon always matches the logo used in the app.
const paths = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/components/brand/logo-paths.ts"), "utf8");
const num = (name) => Number(paths.match(new RegExp(`export const ${name} = ([0-9]+)`))[1]);
const MARK_PATH = paths.match(/export const MARK_PATH = "([^"]+)"/)[1];
const MARK_W = num("MARK_WIDTH");
const MARK_H = num("LOGO_HEIGHT");
const mark = (color) => `<path fill="${color}" fill-rule="evenodd" d="${MARK_PATH}"/>`;

/** Square canvas with the mark centred at `scale` of the canvas height. */
function svg(size, { bg, fg, scale }) {
  const h = size * scale;
  const w = (h * MARK_W) / MARK_H;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  const background = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : "";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${background}
    <svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${MARK_W} ${MARK_H}">${mark(fg)}</svg>
  </svg>`);
}

const jobs = [
  // iOS + legacy Android icon: full-bleed (the OS rounds the corners)
  ["icon-only.png", svg(1024, { bg: "#000000", fg: "#ffffff", scale: 0.56 })],
  // Android adaptive icon: transparent foreground kept inside the 66% safe zone, black background
  ["icon-foreground.png", svg(1024, { fg: "#ffffff", scale: 0.42 })],
  ["icon-background.png", svg(1024, { bg: "#000000", fg: "#000000", scale: 0 })],
  // Splash screens: mark on white. The site has no dark theme, so dark mode uses the same light
  // splash to avoid a black-to-white flash when the page appears.
  ["splash.png", svg(2732, { bg: "#ffffff", fg: "#000000", scale: 0.16 })],
  ["splash-dark.png", svg(2732, { bg: "#ffffff", fg: "#000000", scale: 0.16 })],
];

for (const [name, data] of jobs) {
  await sharp(data).png().toFile(path.join(out, name));
  console.log(`wrote mobile/assets/${name}`);
}
