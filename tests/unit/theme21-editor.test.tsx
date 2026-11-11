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

import { SITE_THEME_STYLE, cleanThemeOptions, getDefaultSiteContent, themeOptionFields } from "@/lib/site-content";
import { demoStoreFor } from "@/lib/demo-store";
import { SiteProvider } from "@/components/storefront/site/context";
import { SiteHeader } from "@/components/storefront/site/shell";
import { SiteHome } from "@/components/storefront/site/home";
import { SiteInfoPage } from "@/components/storefront/site/account";
import type { StoreData } from "@/lib/store-service";

const shop = { id: "s21", name: "Lumen", subdomain: "lumen", planId: "pro", products: [], categories: [], reviews: [], banners: [] } as unknown as StoreData;

function renderIt(node: React.ReactNode, draft?: unknown) {
  return render(
    <SiteProvider store={demoStoreFor(shop, "theme21")} base="" theme="theme21" draft={draft} editing={false} demo previewQuery="">
      {node}
    </SiteProvider>
  );
}

describe("Theme 21 (jewellery)", () => {
  it("has its own settings with its own Shimmer motion", () => {
    const groups = [...new Set(themeOptionFields("theme21").map((f) => f.group))];
    expect(groups).toEqual(["Scroll effects", "Gold", "Product cards", "About page", "Contact page"]);
    expect(getDefaultSiteContent("theme21").options.motion).toBe("shimmer");
    expect(cleanThemeOptions("theme21", { motion: "editorial" }).motion).toBe("shimmer");
    expect(SITE_THEME_STYLE.theme21.menu).toBe("jewel");
  });

  it("mixes kinds of sections, with few photo posters", () => {
    const types = getDefaultSiteContent("theme21").sections.map((s) => s.type);
    expect(types).toEqual(["hero", "claims-strip", "collection-circles", "product-row", "word-story", "edge-tiles", "budget-picker", "engraving", "offset-pair", "product-spotlight", "review-spotlight", "scatter-gallery", "newsletter"]);
    expect(types.filter((t) => t === "edge-tiles")).toHaveLength(1);
    expect(new Set(types).size).toBe(types.length);
  });

  it("only uses jewellery words, never clothes or shoes", () => {
    const { container } = renderIt(<SiteHome />);
    const text = container.textContent || "";
    expect(text).toMatch(/gold plated/i);
    expect(text).not.toMatch(/sneaker|t-shirt|dress/i);
  });

  it("pins its word story and scatters its photos as buyers scroll", () => {
    const { container } = renderIt(<SiteHome />);
    const story = container.querySelector('[data-type="word-story"] .t-wordstory') as HTMLElement;
    expect(story).not.toBeNull();
    expect(story.style.height).toMatch(/svh/);
    expect(story.querySelectorAll(".t-ws-img")).toHaveLength(4);
    expect(story.textContent).toContain("Everyday");
    const scatter = container.querySelector('[data-type="scatter-gallery"]')!;
    expect(scatter.querySelectorAll(".t-scatter-photo")).toHaveLength(10);
    expect(scatter.textContent).toContain("Styled");
  });

  it("shows reviews quietly, centred, with a small round photo", () => {
    const { container } = renderIt(<SiteHome />);
    expect(container.querySelector('[data-type="review-spotlight"] .t-review-boutique')).not.toBeNull();
    const spot = container.querySelector('[data-type="product-spotlight"] .t-spot-boutique')!;
    expect(spot).not.toBeNull();
    expect(spot.textContent).toContain("The icon");
    expect(spot.textContent).toContain("Add to bag");
  });

  it("puts the seller's badge words on its cards", () => {
    const { container } = renderIt(<SiteHome />, { options: { cardSaleBadge: "SAVE {n}%" } });
    expect(container.textContent).toMatch(/SAVE \d+%/);
  });

  it("opens its jewellery-box phone menu with policies, and the bag shows no count when empty", () => {
    const { container } = renderIt(<SiteHeader overHero={false} />);
    const bag = container.querySelector('a[aria-label^="Bag, 0"]')!;
    expect(bag.textContent?.trim()).toBe("");
    expect(container.querySelector('a[aria-label="Wishlist"]')).not.toBeNull();
    // the announcement is a slim black ticker
    expect(container.querySelector(".t-announce-reel .t-reel")).not.toBeNull();
    fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!);
    const menu = document.querySelector(".t-menu-jewel")!;
    expect(menu).not.toBeNull();
    expect(menu.querySelectorAll(".t-menu-list > li").length).toBeGreaterThan(2);
  });

  it("has its own About and Contact pages that differ", () => {
    const about = renderIt(<SiteInfoPage id="about" />).container;
    expect(about.querySelector(".t-about-jewel")).not.toBeNull();
    expect(about.textContent).toContain("18k gold plating");
    expect(about.querySelectorAll(".t-tag")).toHaveLength(3);
    const contact = renderIt(<SiteInfoPage id="contact" />).container;
    expect(contact.querySelector(".t-contact-jewel")).not.toBeNull();
    expect(contact.querySelector(".t-booking")).toBeNull();
    expect(contact.querySelector(".t-note")).not.toBeNull();
    expect(contact.querySelectorAll(".t-way")).toHaveLength(3);
    const sizing = [...contact.querySelectorAll('[role="radio"]')].find((b) => b.textContent === "Sizing")!;
    fireEvent.click(sizing);
    expect(sizing.getAttribute("aria-checked")).toBe("true");
    expect(contact.textContent).toContain("Contact");
    expect(contact.querySelector(".t-about-jewel")).toBeNull();
    const pages = getDefaultSiteContent("theme21").pages;
    expect(pages.about.image).not.toBe(pages.contact.image);
  });
});
