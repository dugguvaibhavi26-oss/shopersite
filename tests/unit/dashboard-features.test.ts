import { describe, expect, it } from "vitest";
import { DASHBOARD_FEATURES, cleanFeature, getFeature, searchFeatures } from "@/lib/dashboard-features";
import { mergeCustomCards, mergeDiscover, MAX_CUSTOM_CARDS } from "@/lib/discover";

describe("dashboard features", () => {
  it("has no repeated ids and every entry is complete", () => {
    const ids = DASHBOARD_FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of DASHBOARD_FEATURES) {
      expect(f.label && f.group && f.hint && f.button).toBeTruthy();
    }
  });

  it("covers every settings page and plugin", () => {
    const sections = DASHBOARD_FEATURES.flatMap((f) => (f.target.kind === "settings" ? [f.target.section] : []));
    expect(sections.sort()).toEqual(["accounts", "billing", "checkout", "delivery", "domain", "events", "general", "notifications", "payments", "policies", "privacy", "store", "taxes"]);
    const plugins = DASHBOARD_FEATURES.flatMap((f) => (f.target.kind === "plugin" ? [f.target.plugin] : []));
    expect(plugins.sort()).toEqual(["gmail", "shiprocket", "whatsapp"]);
  });

  it("finds features by what a person would type", () => {
    expect(searchFeatures("payment gateway")[0].id).toBe("settings-payments");
    expect(searchFeatures("razorpay").map((f) => f.id)).toContain("settings-payments");
    expect(searchFeatures("coupon").map((f) => f.id)).toContain("discounts");
    expect(searchFeatures("")).toHaveLength(DASHBOARD_FEATURES.length);
    expect(searchFeatures("zzzz")).toEqual([]);
  });

  it("drops ids it does not know", () => {
    expect(cleanFeature("settings-payments")).toBe("settings-payments");
    expect(cleanFeature("not-a-page")).toBe("");
    expect(cleanFeature(42)).toBe("");
    expect(getFeature("add-product")?.target).toEqual({ kind: "add-product" });
  });
});

describe("the admin's own Home cards", () => {
  const card = { id: "a", title: "Take payments online", text: "Connect Razorpay.", imageUrl: "https://img.example/x.png", buttonLabel: "Set up payments", feature: "settings-payments", link: "", enabled: true };

  it("keeps a complete card as it is", () => {
    expect(mergeCustomCards({ custom: [card] })).toEqual([card]);
  });

  it("drops cards with no title or nothing to open, and unsafe values", () => {
    expect(mergeCustomCards({ custom: [{ ...card, title: " " }] })).toEqual([]);
    expect(mergeCustomCards({ custom: [{ ...card, feature: "nope", link: "" }] })).toEqual([]);
    const [linked] = mergeCustomCards({ custom: [{ ...card, feature: "", link: "https://docs.shopersite.in/pay", imageUrl: "javascript:alert(1)" }] });
    expect(linked.link).toBe("https://docs.shopersite.in/pay");
    expect(linked.imageUrl).toBe("");
    expect(mergeCustomCards({ custom: [{ ...card, feature: "", link: "javascript:alert(1)" }] })).toEqual([]);
  });

  it("handles missing data and caps the number of cards", () => {
    expect(mergeCustomCards(null)).toEqual([]);
    expect(mergeCustomCards({ custom: "x" })).toEqual([]);
    const many = Array.from({ length: 30 }, (_, i) => ({ ...card, id: `c${i}` }));
    expect(mergeCustomCards({ custom: many })).toHaveLength(MAX_CUSTOM_CARDS);
  });

  it("built-in cards keep a chosen feature and ignore unknown ones", () => {
    expect(mergeDiscover({ cards: { design: { feature: "themes" } } }).design.feature).toBe("themes");
    expect(mergeDiscover({ cards: { design: { feature: "gone" } } }).design.feature).toBe("");
    expect(mergeDiscover(null).season.feature).toBe("");
  });
});
