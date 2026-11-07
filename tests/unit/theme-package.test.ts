import { describe, it, expect, afterEach } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { buildThemeZip, readThemePackage, themeZipName } from "@/lib/theme-package";
import { getDefaultSiteContent, registerCustomThemes, themeKeyOf, toSiteTheme } from "@/lib/site-content";
import { getAllThemes, getTheme } from "@/lib/themes";
import { isThemeAllowed } from "@/lib/plans";

afterEach(() => registerCustomThemes([]));

const zipOf = (json: unknown) => zipSync({ "theme.json": strToU8(JSON.stringify(json)) });

describe("Theme packages", () => {
  it("download a built-in theme as a zip with theme.json, sample products and a README", () => {
    const files = unzipSync(buildThemeZip("theme13"));
    expect(Object.keys(files).sort()).toEqual(["README.md", "sample-catalog.json", "theme.json"]);
    const json = JSON.parse(strFromU8(files["theme.json"]));
    expect(json).toMatchObject({ format: "shopersite-theme", version: 1, name: "Theme 13", base: "theme13" });
    expect(json.content.sections.map((s: { type: string }) => s.type)).toEqual(getDefaultSiteContent("theme13", "Your brand").sections.map((s) => s.type));
    expect(JSON.parse(strFromU8(files["sample-catalog.json"])).products.length).toBeGreaterThanOrEqual(10);
    expect(themeZipName("theme13")).toBe("theme13-theme.zip");
  });

  it("upload a downloaded zip back as a new theme that never replaces a built-in one", () => {
    const res = readThemePackage(buildThemeZip("theme21"), "theme21-theme.zip");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.theme.slug).toBe("custom-theme-21");
    expect(res.theme.base).toBe("theme21");
    expect(res.theme.enabled).toBe(true);
    // a second upload with the same name gets its own slug
    const again = readThemePackage(buildThemeZip("theme21"), "x.zip", [res.theme.slug]);
    expect(again.ok && again.theme.slug).toBe("custom-theme-21-2");
  });

  it("keeps edits, drops unknown sections and accepts a bare theme.json", () => {
    const json = JSON.parse(strFromU8(unzipSync(buildThemeZip("theme14"))["theme.json"]));
    json.name = "Masala House";
    json.content.settings.accent = "#AA2200";
    json.content.sections.push({ id: "x", type: "not-a-section", settings: {} });
    json.content.sections[0].settings.heading = "Spice it up, Your brand";
    const res = readThemePackage(strToU8(JSON.stringify(json)), "theme.json");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.theme.slug).toBe("custom-masala-house");
    expect(res.theme.content.settings.accent).toBe("#AA2200");
    expect(res.theme.content.sections.some((s) => (s.type as string) === "not-a-section")).toBe(false);
  });

  it("explains what is wrong with a bad package", () => {
    const bad = (json: unknown) => {
      const r = readThemePackage(zipOf(json), "t.zip");
      return r.ok ? "" : r.error;
    };
    expect(bad({ name: "X" })).toMatch(/format/);
    expect(bad({ format: "shopersite-theme", name: "X", base: "nope", content: {} })).toMatch(/base/);
    expect(bad({ format: "shopersite-theme", base: "theme13", content: {} })).toMatch(/name/);
    const noJson = readThemePackage(zipSync({ "readme.txt": strToU8("hi") }), "t.zip");
    expect(noJson.ok ? "" : noJson.error).toMatch(/theme\.json/);
    const notZip = readThemePackage(strToU8("hello"), "t.zip");
    expect(notZip.ok ? "" : notZip.error).toMatch(/zip/);
  });

  it("lets sellers use an uploaded theme: drawn with its base layout, with its own content and their shop name", () => {
    const res = readThemePackage(buildThemeZip("theme22"), "t.zip");
    if (!res.ok) throw new Error(res.error);
    registerCustomThemes([res.theme]);
    const slug = res.theme.slug;
    expect(toSiteTheme(slug)).toBe("theme22");
    expect(themeKeyOf(slug)).toBe(slug);
    expect(getTheme(slug).name).toBe("Theme 22");
    expect(getAllThemes().some((t) => t.slug === slug)).toBe(true);
    expect(isThemeAllowed(slug, "free")).toBe(true);
    const content = getDefaultSiteContent(slug, "Acme Gold");
    expect(JSON.stringify(content)).toContain("Acme Gold");
    expect(JSON.stringify(content)).not.toContain("Your brand");

    // hidden: no longer offered or allowed, but shops already on it still draw
    registerCustomThemes([{ ...res.theme, enabled: false }]);
    expect(getAllThemes().some((t) => t.slug === slug)).toBe(false);
    expect(isThemeAllowed(slug, "free")).toBe(false);
    expect(toSiteTheme(slug)).toBe("theme22");
  });
});
