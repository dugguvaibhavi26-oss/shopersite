import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";

// jsdom has no matchMedia; the count-up numbers section asks it about reduced motion
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

import { cleanThemeOptions, getDefaultSiteContent, resolveSiteContent, themeOptionDefaults, themeOptionFields } from "@/lib/site-content";
import { demoStoreFor } from "@/lib/demo-store";
import { SiteProvider } from "@/components/storefront/site/context";
import { SiteHeader } from "@/components/storefront/site/shell";
import { SiteHome } from "@/components/storefront/site/home";
import type { StoreData } from "@/lib/store-service";

const shop = { id: "s1", name: "Fizz Co", subdomain: "fizzco", planId: "pro", products: [], categories: [], reviews: [], banners: [] } as unknown as StoreData;

function renderTheme15(draft: unknown) {
  const store = demoStoreFor(shop, "theme15");
  return render(
    <SiteProvider store={store} base="" theme="theme15" draft={draft} editing={false} demo previewQuery="">
      <SiteHeader overHero={false} />
      <SiteHome />
    </SiteProvider>
  );
}

describe("Theme 15 editor settings", () => {
  it("are offered for Theme 15 only", () => {
    const groups = [...new Set(themeOptionFields("theme15").map((f) => f.group))];
    expect(groups).toEqual(["Scroll effects", "Product cards", "Card stickers"]);
    expect(themeOptionFields("theme14")).toEqual([]);
    expect(getDefaultSiteContent("theme14").options).toEqual({});
  });

  it("start from the theme's own look", () => {
    const o = getDefaultSiteContent("theme15").options;
    expect(o).toEqual(themeOptionDefaults("theme15"));
    expect(o.motion).toBe("bold");
    expect(o.stickerColour).toBe("#FFE14D");
    expect(o.addLabel).toBe("Add to cart");
  });

  it("keep what the seller saved and drop anything broken", () => {
    const o = cleanThemeOptions("theme15", {
      stickerColour: "#00FF88",
      cardBackground: "red", // not a hex colour
      motion: "wild", // not a choice
      addLabel: "Grab one",
      viewLabel: "   ", // empty: back to the default
      somethingElse: "x",
    });
    expect(o.stickerColour).toBe("#00FF88");
    expect(o.cardBackground).toBe("#FFFDF8");
    expect(o.motion).toBe("bold");
    expect(o.addLabel).toBe("Grab one");
    expect(o.viewLabel).toBe("Shop now");
    expect(o).not.toHaveProperty("somethingElse");
    expect(resolveSiteContent({ options: { motion: "calm" } }, "theme15").options.motion).toBe("calm");
  });

  it("no longer carries a header button its header never shows", () => {
    expect(getDefaultSiteContent("theme15").header.ctaLabel).toBe("");
    expect(getDefaultSiteContent("theme15").header.homeLabel).toBe("Home");
  });

  it("reach the shop: card words, card colours and header labels", () => {
    const { container } = renderTheme15({
      header: { homeLabel: "Start", saleLabel: "Deals" },
      options: { addLabel: "Grab one", viewLabel: "See it", stickerColour: "#00ff88", flavour1: "#111111", flavour2: "#111111", flavour3: "#111111", flavour4: "#111111", flavour5: "#111111", flavour6: "#111111" },
    });
    const text = container.textContent || "";
    expect(text).toContain("Start");
    expect(text).toContain("Deals");
    expect(text).toContain("Grab one");
    expect(text).toContain("See it");
    // every flavour card (the cards drawn in the card colours) uses the seller's button words
    const cards = [...container.querySelectorAll<HTMLElement>("div[style*='border-color']")];
    expect(cards.length).toBeGreaterThan(5);
    for (const card of cards) {
      expect(card.textContent).toContain("Grab one");
      expect(card.textContent).not.toContain("Add to cart");
    }
    const html = container.innerHTML.toLowerCase();
    expect(html).toContain("background: rgb(0, 255, 136)"); // sticker band
    expect(html).toContain("border-color: rgb(17, 17, 17)"); // every card in colour 1–6
  });

  it("tag every section so each can make its own entrance", () => {
    const { container } = renderTheme15(undefined);
    const types = [...container.querySelectorAll("[data-type]")].map((e) => e.getAttribute("data-type"));
    expect(types).toEqual([
      "hero",
      "claims-strip",
      "product-row",
      "product-spotlight",
      "reviews",
      "impact",
      "facts",
      "steps",
      "combo-builder",
      "tilt-gallery",
      "countdown-deals",
      "promo-banner",
      "tag-cloud",
      "faq",
    ]);
    // the hero heading is one block per line, so each line enters on its own
    expect(container.querySelectorAll(".t-pop-line").length).toBe(3);
  });

  it("start with fourteen sections of different kinds, each one the seller can hide, move or remove", () => {
    const sections = getDefaultSiteContent("theme15").sections;
    expect(sections).toHaveLength(14);
    expect(new Set(sections.map((s) => s.type)).size).toBe(14);
    // the build-a-box lists draw from the shop's own categories
    const combo = sections.find((s) => s.type === "combo-builder")!;
    expect(combo.settings.c1Source).toBe("category:cans");
    expect(combo.settings.c3Source).toBe("category:packs");
  });
});
