import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
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

import { cleanThemeOptions, getDefaultSiteContent, themeOptionFields } from "@/lib/site-content";
import { demoCatalogFor, demoStoreFor } from "@/lib/demo-store";
import { SiteProvider } from "@/components/storefront/site/context";
import { SiteHeader } from "@/components/storefront/site/shell";
import { SiteHome } from "@/components/storefront/site/home";
import { SiteInfoPage } from "@/components/storefront/site/account";
import type { StoreData } from "@/lib/store-service";

const shop = { id: "s5", name: "Stride", subdomain: "stride", planId: "pro", products: [], categories: [], reviews: [], banners: [] } as unknown as StoreData;

function renderIt(node: React.ReactNode, draft?: unknown) {
  return render(
    <SiteProvider store={demoStoreFor(shop, "theme05")} base="" theme="theme05" draft={draft} editing={false} demo previewQuery="">
      {node}
    </SiteProvider>
  );
}

describe("Theme 5 (sneakers)", () => {
  it("has its own settings with its own Editorial motion", () => {
    const groups = [...new Set(themeOptionFields("theme05").map((f) => f.group))];
    expect(groups).toEqual(["Scroll effects", "Highlights", "Product cards", "About page", "Contact page"]);
    expect(getDefaultSiteContent("theme05").options.motion).toBe("editorial");
    expect(cleanThemeOptions("theme05", { motion: "glide" }).motion).toBe("editorial");
  });

  it("mixes kinds of sections, with one product grid and few photo posters", () => {
    const types = getDefaultSiteContent("theme05").sections.map((s) => s.type);
    expect(types).toEqual(["hero", "marquee", "product-row", "category-panels", "colour-chips", "type-collage", "facts", "featured-product", "size-finder", "countdown-deals", "tilt-gallery", "occasion-mosaic", "reviews", "popular-searches", "perks"]);
    expect(types.filter((t) => t === "product-row")).toHaveLength(1);
    for (const gone of ["features", "feature-cards", "gallery", "banners", "image-text"]) expect(types).not.toContain(gone);
  });

  it("measures shoe sizes, not clothes", () => {
    const { container } = renderIt(<SiteHome />);
    const finder = container.querySelector('[data-type="size-finder"]')!;
    expect(finder.textContent).toContain("Foot length");
    expect(finder.textContent).not.toContain("Bust");
    expect(finder.textContent).not.toContain("inches");
    expect(finder.textContent).not.toContain("″");
    expect(finder.textContent).toContain("EU");
  });

  it("finds sample pairs for every colour chip", () => {
    const products = demoCatalogFor("theme05").products;
    for (const colour of ["white", "black", "red", "green", "grey", "yellow"]) {
      expect(products.some((p) => `${p.title} ${p.description}`.toLowerCase().includes(colour))).toBe(true);
    }
  });

  it("sends each colour chip to that colour's own page", () => {
    const { container } = renderIt(<SiteHome />);
    const chips = container.querySelector('[data-type="colour-chips"]')!;
    expect(chips.querySelector('a[href*="search?q=red"]')).not.toBeNull();
    expect(chips.querySelector("button")).toBeNull();
  });

  it("shows the deal of the day with a big clock and the best saving", () => {
    const { container } = renderIt(<SiteHome />);
    const deal = container.querySelector('[data-type="countdown-deals"]')!;
    expect(deal.querySelector(".t-deal")).not.toBeNull();
    expect(deal.textContent).toContain("Deal of the day");
    expect(deal.textContent).toMatch(/\d+%off/);
  });

  it("lists new pairs by number and shows the picked one big", () => {
    const { container } = renderIt(<SiteHome />);
    const sec = container.querySelector('[data-type="featured-product"]')!;
    const rows = sec.querySelectorAll("ol button");
    expect(rows.length).toBeGreaterThan(2);
    const before = sec.querySelector(".t-drops img")!.getAttribute("src");
    act(() => fireEvent.click(rows[2]));
    expect(rows[2].getAttribute("aria-current")).toBe("true");
    expect(sec.textContent).toContain("N°03");
    expect(sec.querySelector(".t-drops img")!.getAttribute("src")).not.toBe(before);
  });

  it("puts the seller's badge words on its cards and can hide the description", () => {
    const { container } = renderIt(<SiteHome />, { options: { dSale: "SALE {n}%", dDesc: "hide" } });
    expect(container.textContent).toMatch(/SALE \d+%/);
    expect(container.textContent).not.toContain("Clean white leather sneaker");
  });

  it("opens its editorial phone menu, and the bag shows no count when empty", () => {
    const { container } = renderIt(<SiteHeader overHero={false} />);
    const bag = container.querySelector('a[aria-label^="Bag, 0"]')!;
    expect(bag.textContent?.trim()).toBe("");
    fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!);
    const menu = document.querySelector(".t-menu")!;
    expect(menu.textContent).toContain("New this week");
    expect(menu.querySelectorAll(".t-menu-list > li").length).toBeGreaterThan(2);
  });

  it("has editorial About and Contact pages that differ", () => {
    const about = renderIt(<SiteInfoPage id="about" />).container;
    expect(about.textContent).toContain("What every pair promises");
    const contact = renderIt(<SiteInfoPage id="contact" />).container;
    expect(about.querySelector(".t-box-label")).not.toBeNull();
    expect(contact.querySelector(".t-ticket")).not.toBeNull();
    expect(contact.querySelector(".t-box-label")).toBeNull();
    const pages = getDefaultSiteContent("theme05").pages;
    expect(pages.about.image).not.toBe(pages.contact.image);
  });
});
