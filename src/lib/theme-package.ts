import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { demoCatalogFor } from "./demo-store";
import {
  SITE_THEME_SLUGS,
  SITE_THEME_STYLE,
  getCustomTheme,
  getDefaultSiteContent,
  resolveSiteContent,
  type CustomThemeDef,
  type SiteThemeSlug,
} from "./site-content";
import { PLATFORM_THEMES, getTheme } from "./themes";

/**
 * Theme packages: a .zip with theme.json (name, colours, fonts, sections and page text), sample-catalog.json
 * (the products a preview shows) and a README. The admin downloads any theme as one and uploads edited or new
 * ones; an uploaded theme is drawn with the layout of the built-in theme named in "base".
 */

export const THEME_PACKAGE_FORMAT = "shopersite-theme";
export const THEME_PACKAGE_VERSION = 1;
const MAX_PACKAGE_BYTES = 2 * 1024 * 1024;

export interface ThemePackageJson {
  format: typeof THEME_PACKAGE_FORMAT;
  version: number;
  name: string;
  tagline: string;
  category: string;
  description: string;
  previewImage: string;
  previewColors: string[];
  /** the built-in theme whose layout, cards and type it uses */
  base: SiteThemeSlug;
  /** the base theme's fixed look, for reference only: changing it here has no effect */
  look?: unknown;
  /** starting content for a shop called "Your brand" */
  content: unknown;
}

const README = (name: string, base: string) => `# ${name}

A Shopersite theme package.

- theme.json: the theme's name, colours, fonts, homepage sections and page text.
  Edit the text, photo links (https://), colours (#hex) and the order of "sections",
  then zip the files again and upload the zip in Admin > Themes.
- sample-catalog.json: the sample products shown when sellers preview the theme.
- "base": "${base}" picks the built-in layout the theme is drawn with (header, cards,
  section designs). It must be one of: ${SITE_THEME_SLUGS.join(", ")}.

Shop names written as "Your brand" are replaced with each seller's shop name.
Section types must be ones the storefront knows; unknown ones are dropped on upload.
`;

/** The package for a theme (built-in or uploaded), as zip bytes. */
export function buildThemeZip(slug: string): Uint8Array {
  const custom = getCustomTheme(slug);
  const meta = getTheme(slug);
  const base: SiteThemeSlug = custom ? custom.base : (SITE_THEME_SLUGS as readonly string[]).includes(slug) ? (slug as SiteThemeSlug) : "classic-bloom";
  const json: ThemePackageJson = {
    format: THEME_PACKAGE_FORMAT,
    version: THEME_PACKAGE_VERSION,
    name: meta.name,
    tagline: meta.tagline,
    category: meta.category || "",
    description: meta.description,
    previewImage: meta.previewImage || "",
    previewColors: meta.previewColors,
    base,
    look: SITE_THEME_STYLE[base],
    content: custom ? custom.content : getDefaultSiteContent(slug, "Your brand"),
  };
  const catalog = demoCatalogFor(base);
  return zipSync(
    {
      "theme.json": strToU8(JSON.stringify(json, null, 2)),
      "sample-catalog.json": strToU8(JSON.stringify({ categories: catalog.categories, products: catalog.products, banners: catalog.banners }, null, 2)),
      "README.md": strToU8(README(meta.name, base)),
    },
    { level: 6 }
  );
}

/** File name for a theme's package, e.g. "theme13-theme.zip". */
export function themeZipName(slug: string): string {
  return `${slug}-theme.zip`;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "");
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

export type ThemeReadResult = { ok: true; theme: CustomThemeDef } | { ok: false; error: string };

/**
 * Reads an uploaded package (a .zip with theme.json inside, or a bare theme.json) into a theme ready to save.
 * `taken` are slugs already in use, so a new upload never replaces a built-in theme.
 */
export function readThemePackage(bytes: Uint8Array, fileName: string, taken: string[] = []): ThemeReadResult {
  if (bytes.byteLength > MAX_PACKAGE_BYTES) return { ok: false, error: "That file is over 2 MB. A theme package is usually under 100 KB." };
  let text: string;
  try {
    if (/\.json$/i.test(fileName)) {
      text = strFromU8(bytes);
    } else {
      const files = unzipSync(bytes, { filter: (f) => /(^|\/)theme\.json$/i.test(f.name) && !f.name.startsWith("__MACOSX") });
      const name = Object.keys(files)[0];
      if (!name) return { ok: false, error: "No theme.json inside the zip. Download a theme to see the expected layout." };
      text = strFromU8(files[name]);
    }
  } catch {
    return { ok: false, error: "This isn't a zip file we can open. Upload the .zip you downloaded, or its theme.json." };
  }
  let raw: Partial<ThemePackageJson>;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "theme.json isn't valid JSON. Check for a missing comma or quote." };
  }
  if (!raw || typeof raw !== "object") return { ok: false, error: "theme.json is empty." };
  if (raw.format !== THEME_PACKAGE_FORMAT) return { ok: false, error: `theme.json needs "format": "${THEME_PACKAGE_FORMAT}".` };
  if (typeof raw.version === "number" && raw.version > THEME_PACKAGE_VERSION) return { ok: false, error: "This package was made for a newer version of Shopersite." };
  const name = clean(raw.name, 40);
  if (!name) return { ok: false, error: "Give the theme a name in theme.json." };
  if (!(SITE_THEME_SLUGS as readonly string[]).includes(String(raw.base))) {
    return { ok: false, error: `"base" must be one of the built-in themes, e.g. "theme13".` };
  }
  if (!raw.content || typeof raw.content !== "object") return { ok: false, error: "theme.json has no \"content\"." };
  const base = raw.base as SiteThemeSlug;
  // keeps only known sections, fields, colours and fonts; anything else falls back to the base theme
  const content = resolveSiteContent(raw.content, base, "Your brand");
  if (!content.sections.length) return { ok: false, error: "The theme needs at least one homepage section." };

  // a new slug for every new name, never one a built-in theme uses
  const builtIn = Object.keys(PLATFORM_THEMES);
  let slug = `custom-${slugify(name) || "theme"}`;
  for (let i = 2; builtIn.includes(slug) || taken.includes(slug); i++) slug = `custom-${slugify(name) || "theme"}-${i}`;

  const image = clean(raw.previewImage, 500);
  const colours = Array.isArray(raw.previewColors) ? raw.previewColors.filter((c): c is string => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c)).slice(0, 4) : [];
  return {
    ok: true,
    theme: {
      slug,
      name,
      tagline: clean(raw.tagline, 80),
      category: clean(raw.category, 40) || "Custom",
      description: clean(raw.description, 300),
      previewImage: /^https:\/\//.test(image) ? image : "",
      previewColors: colours,
      base,
      content,
      enabled: true,
      uploadedAt: new Date().toISOString(),
    },
  };
}
