import { describe, it, expect } from "vitest";
import { DOC_BY_SLUG, DOC_CATEGORIES, DOCS } from "@/lib/resources/docs";
import { GUIDE_BY_SLUG, GUIDES } from "@/lib/resources/guides";
import { LEGACY_DOC_IDS, LEGACY_EXPLORE_SECTIONS } from "@/lib/resources/legacy";
import { plainText } from "@/lib/resources/types";

const STATIC_PAGES = new Set(["/", "/register", "/themes", "/explore", "/explore/tools", "/explore/festival-calendar", "/docs", "/legal/contact"]);
const exists = (href: string) => {
  const path = href.split("#")[0];
  if (STATIC_PAGES.has(path)) return true;
  const doc = path.match(/^\/docs\/([\w-]+)$/);
  if (doc) return !!DOC_BY_SLUG[doc[1]];
  const guide = path.match(/^\/explore\/([\w-]+)$/);
  if (guide) return !!GUIDE_BY_SLUG[guide[1]];
  return false;
};

describe("Help Center and Explore content", () => {
  it("has unique slugs and known categories", () => {
    expect(new Set(DOCS.map((d) => d.slug)).size).toBe(DOCS.length);
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
    const cats = new Set(DOC_CATEGORIES.map((c) => c.id));
    for (const d of DOCS) expect(cats.has(d.category), d.slug).toBe(true);
  });

  it("only links to pages that exist", () => {
    const all = [
      ...DOCS.map((d) => ({ id: d.slug, text: plainText(d.body) + (d.faqs || []).map((f) => f.a).join(" ") })),
      ...GUIDES.map((g) => ({ id: g.slug, text: plainText(g.body) + (g.faqs || []).map((f) => f.a).join(" ") })),
    ];
    for (const a of all) {
      for (const m of a.text.matchAll(/\]\((\/[^)]*)\)/g)) expect(exists(m[1]), `${a.id} → ${m[1]}`).toBe(true);
    }
    for (const d of DOCS) for (const r of d.related || []) expect(DOC_BY_SLUG[r], `${d.slug} related ${r}`).toBeTruthy();
    for (const g of GUIDES) for (const r of g.related || []) expect(GUIDE_BY_SLUG[r], `${g.slug} related ${r}`).toBeTruthy();
  });

  it("redirects every old link to a real page", () => {
    for (const to of Object.values(LEGACY_DOC_IDS)) expect(DOC_BY_SLUG[to], to).toBeTruthy();
    for (const to of Object.values(LEGACY_EXPLORE_SECTIONS)) expect(exists(to), to).toBe(true);
  });

  it("keeps meta descriptions a sensible length", () => {
    for (const x of [...DOCS, ...GUIDES]) expect(x.summary.length, x.slug).toBeLessThanOrEqual(200);
  });
});
