import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";

// jsdom has no matchMedia or IntersectionObserver; some sections ask about them
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

import { cleanThemeOptions, getDefaultSiteContent, resolveSiteContent, SITE_THEME_STYLE, themeOptionFields, type SiteSection } from "@/lib/site-content";

const cleanSaved = (sections: SiteSection[]) => resolveSiteContent({ sections }, "theme07").sections;
import { demoStoreFor } from "@/lib/demo-store";
import { SiteProvider } from "@/components/storefront/site/context";
import { SiteHeader } from "@/components/storefront/site/shell";
import { SiteHome } from "@/components/storefront/site/home";
import { SiteInfoPage } from "@/components/storefront/site/account";
import type { StoreData } from "@/lib/store-service";

const shop = { id: "s7", name: "Clay Co", subdomain: "clayco", planId: "pro", products: [], categories: [], reviews: [], banners: [] } as unknown as StoreData;

function renderIn(theme: string, node: React.ReactNode, draft?: unknown) {
  return render(
    <SiteProvider store={demoStoreFor(shop, theme)} base="" theme={theme} draft={draft} editing={false} demo previewQuery="">
      {node}
    </SiteProvider>
  );
}
const renderHome = (theme: string, draft?: unknown) => renderIn(theme, <><SiteHeader overHero={false} /><SiteHome /></>, draft);

describe("Theme 07 editor settings", () => {
  it("are Theme 07's own, grouped, with its own scroll effect", () => {
    const groups = [...new Set(themeOptionFields("theme07").map((f) => f.group))];
    expect(groups).toEqual(["Scroll effects", "Product cards", "Phone menu", "About page", "Contact page"]);
    expect(themeOptionFields("theme07").filter((f) => f.group === "Contact page").every((f) => f.page === "/pages/contact")).toBe(true);
    const o = getDefaultSiteContent("theme07").options;
    expect(o.motion).toBe("wheel");
    // not one of the other themes' effects
    for (const t of ["theme03", "theme06", "theme15"]) expect(getDefaultSiteContent(t).options.motion).not.toBe("wheel");
  });

  it("keep only valid choices", () => {
    const o = cleanThemeOptions("theme07", { motion: "sporty", cardHeart: "hide", cardQuickAdd: "maybe", cardBadgeBackground: "#C8391F", cardBadgeText: "red" });
    expect(o.motion).toBe("wheel");
    expect(o.cardHeart).toBe("hide");
    expect(o.cardQuickAdd).toBe("show");
    expect(o.cardBadgeBackground).toBe("#C8391F");
    expect(o.cardBadgeText).toBe("#2A1D18");
  });
});

describe("Theme 07 sections", () => {
  it("mixes kinds instead of photo posters, with categories in two different shapes", () => {
    const all = getDefaultSiteContent("theme07").sections;
    const types = all.filter((s) => !s.hidden).map((s) => s.type);
    expect(types).toEqual([
      "hero",
      "marquee",
      "collection-tiles",
      "product-row",
      "glaze-picker",
      "statement",
      "category-circles",
      "product-row",
      "custom-order",
      "review-board",
      "studio-prints",
      "newsletter",
      "care-guide",
    ]);
    // the kiln batch calendar is in the list but switched off, so the editor's eye button can turn it on
    const batch = all.find((s) => s.type === "batch-calendar")!;
    expect(batch.hidden).toBe(true);
    expect(all.indexOf(batch)).toBe(all.findIndex((s) => s.id === "fresh") + 1);
    // the routine photo-and-text story was replaced
    expect(types).not.toContain("about-split");
    const secs = getDefaultSiteContent("theme07").sections;
    // the two product rows are laid out differently
    expect(secs.filter((s) => s.type === "product-row").map((s) => s.settings.display)).toEqual(["mosaic", "beside"]);
    // the steps and the counting numbers are gone
    expect(types).not.toContain("steps");
    expect(types).not.toContain("impact");
    // no photo is used twice on the page
    const photos = secs.flatMap((s) => Object.entries(s.settings).filter(([k, v]) => /image/i.test(k) && v).map(([, v]) => v.split("?")[0]));
    expect(new Set(photos).size).toBe(photos.length);
  });

  it("shows the newest piece on each collection tile, so it doesn't repeat the round category photos", () => {
    expect(SITE_THEME_STYLE.theme07.tilePhoto).toBe("newest");
    const { container } = renderHome("theme07");
    const tiles = [...container.querySelectorAll('[data-type="collection-tiles"] img')].map((i) => i.getAttribute("src"));
    const circles = [...container.querySelectorAll('[data-type="category-circles"] img')].map((i) => i.getAttribute("src"));
    expect(tiles.length).toBe(3);
    expect(circles.length).toBeGreaterThan(0);
    for (const t of tiles) expect(circles).not.toContain(t);
  });

  it("only sells ceramics in its sample shop, with reviews about ceramics", () => {
    const demo = demoStoreFor(shop, "theme07");
    expect(demo.categories.map((c) => c.name)).toEqual(["Vases", "Cups & mugs", "Tableware"]);
    expect(demo.reviews.some((r) => /mug|vase|plates|bowls/i.test(r.comment))).toBe(true);
    expect(demo.reviews.some((r) => /wearing|fits/i.test(r.comment))).toBe(false);
    // other themes keep the shared sample reviews
    expect(demoStoreFor(shop, "theme04").reviews.some((r) => /wearing/i.test(r.comment))).toBe(true);
  });

  it("draws the glaze picker: picking a glaze shows its pieces", () => {
    const { container, getByRole } = renderHome("theme07");
    const glaze = container.querySelector('[data-type="glaze-picker"]')!;
    expect(glaze.querySelectorAll('[role="tab"]').length).toBe(5);
    expect(glaze.textContent).toContain("Speckled Mug");
    fireEvent.click(getByRole("tab", { name: "Sea blue" }));
    expect(glaze.textContent).toContain("Blue Dot Jug");
    expect(glaze.textContent).not.toContain("Speckled Mug");
  });

  it("keeps the kiln calendar off the shop until the seller switches it on", () => {
    const off = renderHome("theme07").container;
    expect(off.querySelector('[data-type="batch-calendar"]')).toBeNull();
    const sections = getDefaultSiteContent("theme07").sections.map((s) => (s.type === "batch-calendar" ? { ...s, hidden: false } : s));
    const on = renderHome("theme07", { sections }).container;
    const batch = on.querySelector('[data-type="batch-calendar"]')!;
    expect(batch).not.toBeNull();
    expect(batch.textContent).toContain("Speckled mugs, batch 41");
    // and a saved "on" stays on, a saved "off" stays off
    expect(cleanSaved(sections).find((s) => s.type === "batch-calendar")!.hidden).toBe(false);
  });

  it("tells the studio story as two tilted prints with captions beside a signed letter", () => {
    const { container } = renderHome("theme07");
    const story = container.querySelector('[data-type="studio-prints"]')!;
    const prints = story.querySelectorAll(".t-print");
    expect(prints.length).toBe(2);
    expect(prints[0].className).toContain("rotate-[-5deg]");
    expect(prints[1].className).toContain("rotate-[5deg]");
    expect(story.textContent).toContain("Carving the foot of a bowl");
    expect(story.textContent).toContain("Meera & the studio");
    expect(story.querySelector('a[href*="/pages/about"]')!.textContent).toContain("Our story");
  });

  it("draws the care guide with stamps, and the batch calendar (still offered in the editor) keeps to three", () => {
    const { container } = renderHome("theme07");
    const care = container.querySelector('[data-type="care-guide"]')!;
    expect(care.querySelectorAll(".t-care-tile").length).toBe(6);
    expect(care.querySelector('.t-stamp[data-tone="no"]')!.textContent).toBe("Avoid");
    const batch = renderHome("theme07", {
      sections: [
        {
          id: "b",
          type: "batch-calendar",
          settings: { b1Title: "A", b1Status: "open", b1Link: "/category/cups-mugs", b2Title: "B", b2Status: "soon", b3Title: "C", b3Status: "soon", openLabel: "Open now", soonLabel: "Coming soon" },
        },
      ],
    }).container.querySelector('[data-type="batch-calendar"]')!;
    // kept short: three batches at most, whatever is saved
    expect(batch.querySelectorAll(".t-batch-row").length).toBe(3);
    expect(batch.textContent).toContain("Open now");
    expect(batch.textContent).toContain("Coming soon");
    // only the open batch links anywhere
    expect(batch.querySelectorAll("a").length).toBe(1);
    expect(batch.querySelector('a[href*="cups-mugs"]')).not.toBeNull();
    const four = renderHome("theme07", {
      sections: [{ id: "b", type: "batch-calendar", settings: { b1Title: "A", b2Title: "B", b3Title: "C", b4Title: "D" } }],
    }).container;
    expect(four.querySelectorAll(".t-batch-row").length).toBe(3);
  });

  it("shows reviews on a dark band as rounded cards in one sliding row, with arrows", () => {
    const { container, getByRole } = renderHome("theme07");
    const board = container.querySelector('[data-type="review-board"]')!;
    expect(board.querySelector("section")!.className).toContain("bg-[var(--m-text)]");
    expect(board.textContent).toMatch(/\d\.\d out of 5 from 6 reviews/);
    const track = board.querySelector(".t-review-track")!;
    expect(track.className).toContain("overflow-x-auto");
    const cards = track.querySelectorAll(".t-review-card");
    expect(cards.length).toBe(6);
    expect(cards[0].className).toContain("rounded-[22px]");
    // the arrows slide the row (jsdom has no layout, so just check they move it without failing)
    const el = track as HTMLElement & { scrollBy: (o: unknown) => void; scrollTo: (o: unknown) => void };
    let moved = 0;
    el.scrollBy = () => void moved++;
    el.scrollTo = () => void moved++;
    fireEvent.click(getByRole("button", { name: "Next reviews" }));
    fireEvent.click(getByRole("button", { name: "Previous reviews" }));
    expect(moved).toBe(2);
  });
});

describe("Theme 07 product cards", () => {
  it("use the theme's badge words and can hide the heart and bag button", () => {
    const { container } = renderHome("theme07", {
      options: { cardSaleBadge: "{n}% off", cardHeart: "hide", cardQuickAdd: "hide" },
      sections: [{ id: "p", type: "product-row", settings: { heading: "All", source: "newest", display: "grid" } }],
    });
    expect(container.textContent).toMatch(/\d+% off/);
    expect(container.querySelector('button[aria-label="Add to wishlist"]')).toBeNull();
    expect(container.querySelector('button[aria-label^="Add "][aria-label$=" to bag"]')).toBeNull();
  });

  it("leave other themes with the same card unchanged", () => {
    const { container } = renderHome("theme11", {
      sections: [{ id: "p", type: "product-row", settings: { heading: "All", source: "newest", display: "grid" } }],
    });
    expect(container.querySelector('button[aria-label="Add to wishlist"]')).not.toBeNull();
  });
});

describe("Theme 07 phone menu and pages", () => {
  it("opens its own studio menu with numbered categories and its own note", () => {
    const { container } = renderHome("theme07", { options: { menuNote: "Fired on Fridays" } });
    fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!);
    const menu = document.querySelector(".t-menu-studio");
    expect(menu).not.toBeNull();
    expect(menu!.textContent).toContain("Cups & mugs");
    expect(menu!.textContent).toContain("02");
    expect(menu!.textContent).toContain("Fired on Fridays");
    document.body.innerHTML = "";
  });

  it("has a wishlist heart in the header and the bag last", () => {
    const { container } = renderHome("theme07");
    const labels = [...container.querySelectorAll("header a[aria-label]")].map((a) => a.getAttribute("aria-label") || "");
    const heart = labels.indexOf("Wishlist");
    const bag = labels.findIndex((l) => l.startsWith("Bag"));
    expect(heart).toBeGreaterThan(-1);
    expect(bag).toBe(labels.length - 1);
    expect(container.querySelector("header")!.textContent).not.toContain("(0)");
  });

  it("gives About and Contact their own, different designs and photos", () => {
    const about = renderIn("theme07", <SiteInfoPage id="about" />).container;
    // Theme 07's own About design, not the one Theme 3 and E01 share
    expect(about.querySelector(".t-about-studio")).not.toBeNull();
    expect(about.querySelector(".t-studio-stamp")).not.toBeNull();
    expect(about.textContent).toContain("How we make");
    expect(about.textContent).toContain("Our first kiln");
    expect(renderIn("theme03", <SiteInfoPage id="about" />).container.querySelector(".t-about-studio")).toBeNull();
    const contact = renderIn("theme07", <SiteInfoPage id="contact" />).container;
    expect(contact.querySelector(".t-contact")).not.toBeNull();
    expect(contact.textContent).toContain("Studio hours");
    const pages = getDefaultSiteContent("theme07").pages;
    expect(pages.about.image).not.toBe(pages.contact.image);
  });
});
