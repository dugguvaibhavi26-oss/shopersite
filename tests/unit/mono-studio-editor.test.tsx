import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";

// jsdom has no matchMedia; some sections ask it about reduced motion
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

import { cleanThemeOptions, getDefaultSiteContent, SITE_THEME_STYLE, themeOptionFields } from "@/lib/site-content";
import { demoStoreFor } from "@/lib/demo-store";
import { SiteProvider } from "@/components/storefront/site/context";
import { SiteHeader } from "@/components/storefront/site/shell";
import { SiteHome } from "@/components/storefront/site/home";
import { SiteInfoPage } from "@/components/storefront/site/account";
import { nextDropTime } from "@/components/storefront/site/mono-sections";
import type { StoreData } from "@/lib/store-service";

const shop = { id: "m1", name: "Plain Co", subdomain: "plainco", planId: "pro", products: [], categories: [], reviews: [], banners: [] } as unknown as StoreData;

function renderIn(theme: string, node: React.ReactNode, draft?: unknown) {
  return render(
    <SiteProvider store={demoStoreFor(shop, theme)} base="" theme={theme} draft={draft} editing={false} demo previewQuery="">
      {node}
    </SiteProvider>
  );
}
const renderHome = (theme: string, draft?: unknown) => renderIn(theme, <><SiteHeader overHero={false} /><SiteHome /></>, draft);

describe("Mono Studio editor settings", () => {
  it("are Mono Studio's own, grouped, with its own scroll effect", () => {
    const groups = [...new Set(themeOptionFields("mono-studio").map((f) => f.group))];
    expect(groups).toEqual(["Scroll effects", "Product cards", "Phone menu", "About page", "Contact page"]);
    expect(getDefaultSiteContent("mono-studio").options.motion).toBe("shutter");
    for (const t of ["theme03", "theme06", "theme07", "theme15", "f02"]) expect(getDefaultSiteContent(t).options.motion).not.toBe("shutter");
    expect(cleanThemeOptions("mono-studio", { motion: "grain" }).motion).toBe("shutter");
  });

  it("has its own starting content; the shared fallback is untouched", () => {
    const types = getDefaultSiteContent("mono-studio").sections.map((s) => s.type);
    expect(types).toEqual(["hero", "marquee", "categories", "product-row", "spec-index", "statement", "size-finder", "product-row", "reviews", "drop-clock", "newsletter"]);
    // the photo posters it used to open with are gone
    for (const t of ["collection-split", "banners", "image-text"]) expect(types).not.toContain(t);
    const pages = getDefaultSiteContent("mono-studio").pages;
    expect(pages.about.image).not.toBe(pages.contact.image);
  });
});

describe("Mono Studio sections", () => {
  it("lists products as a numbered index with column titles", () => {
    const { container } = renderHome("mono-studio");
    const index = container.querySelector('[data-type="spec-index"]')!;
    expect(index.querySelectorAll(".t-index-row").length).toBe(8);
    expect(index.textContent).toContain("Made of");
    expect(index.textContent).toContain("01");
    expect(index.textContent).toContain("240 GSM");
  });

  it("counts down to the next drop: a set date, or next Friday 6 pm once none is set or it has passed", () => {
    const wed = new Date(2026, 10, 11, 12, 0, 0); // Wednesday
    const friday = nextDropTime("", wed);
    expect(friday.getDay()).toBe(5);
    expect(friday.getHours()).toBe(18);
    expect(friday.getTime()).toBeGreaterThan(wed.getTime());
    expect(nextDropTime("2026-12-01 18:00", wed).getMonth()).toBe(11);
    // a date in the past falls back to the weekly drop
    expect(nextDropTime("2020-01-01 10:00", wed).getDay()).toBe(5);
    const { container } = renderHome("mono-studio");
    const clock = container.querySelector('[data-type="drop-clock"]')!;
    expect(clock.querySelectorAll(".t-drop-cell").length).toBe(4);
    expect(clock.textContent).toContain("Days");
  });

  it("uses Mono Studio's card words and can hide the heart; Lume Editorial's cards stay the same", () => {
    const { container } = renderHome("mono-studio", {
      options: { cardSaleBadge: "{n}% OFF", cardHeart: "hide" },
      sections: [{ id: "p", type: "product-row", settings: { heading: "All", source: "newest", display: "grid" } }],
    });
    expect(container.textContent).toMatch(/\d+% OFF/);
    expect(container.querySelector('button[aria-label="Add to wishlist"]')).toBeNull();
    const bloom = renderHome("classic-bloom", { sections: [{ id: "p", type: "product-row", settings: { heading: "All", source: "newest", display: "grid" } }] }).container;
    expect(bloom.querySelector('button[aria-label="Add to wishlist"]')).not.toBeNull();
    expect(bloom.textContent).not.toMatch(/−\d+%/);
  });
});

describe("Mono Studio phone menu and pages", () => {
  it("opens its own menu with outlined category words and a row of icon cells", () => {
    const { container } = renderHome("mono-studio", { options: { menuNote: "Free returns" } });
    fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!);
    const menu = document.querySelector(".t-menu-mono")!;
    expect(menu).not.toBeNull();
    expect(menu.querySelectorAll(".t-mono-word").length).toBeGreaterThan(2);
    expect(menu.textContent).toContain("Hoodies");
    expect(menu.textContent).toContain("Free returns");
    expect(menu.querySelectorAll('nav[aria-label="Quick links"] a').length).toBe(4);
    document.body.innerHTML = "";
    expect(SITE_THEME_STYLE["mono-studio"].menu).toBe("mono");
  });

  it("has a wishlist heart in the header and the bag last", () => {
    const { container } = renderHome("mono-studio");
    const labels = [...container.querySelectorAll("header a[aria-label]")].map((a) => a.getAttribute("aria-label") || "");
    expect(labels).toContain("Wishlist");
    expect(labels[labels.length - 1]).toMatch(/^Bag/);
  });

  it("gives About its own design, different from Contact and from other themes", () => {
    const about = renderIn("mono-studio", <SiteInfoPage id="about" />).container;
    expect(about.querySelector(".t-about-mono")).not.toBeNull();
    expect(about.querySelector(".t-mono-outline")).not.toBeNull();
    expect(about.querySelector(".t-garment-tag")!.textContent).toContain("240 GSM");
    expect(about.textContent).toContain("No loud logos");
    const contact = renderIn("mono-studio", <SiteInfoPage id="contact" />).container;
    expect(contact.querySelector(".t-contact")).not.toBeNull();
    expect(contact.textContent).toContain("Talk to us");
    expect(renderIn("f02", <SiteInfoPage id="about" />).container.querySelector(".t-about-mono")).toBeNull();
  });
});
