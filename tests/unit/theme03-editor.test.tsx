import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
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
import { demoStoreFor } from "@/lib/demo-store";
import { SiteProvider } from "@/components/storefront/site/context";
import { SiteHeader } from "@/components/storefront/site/shell";
import { SiteHome } from "@/components/storefront/site/home";
import type { StoreData } from "@/lib/store-service";

const shop = { id: "s3", name: "Trail Co", subdomain: "trailco", planId: "pro", products: [], categories: [], reviews: [], banners: [] } as unknown as StoreData;

function renderTheme(theme: string, draft: unknown) {
  return render(
    <SiteProvider store={demoStoreFor(shop, theme)} base="" theme={theme} draft={draft} editing={false} demo previewQuery="">
      <SiteHeader overHero={false} />
      <SiteHome />
    </SiteProvider>
  );
}

describe("Theme 3 editor settings", () => {
  it("are Theme 3's own: scroll effects and product cards", () => {
    const groups = [...new Set(themeOptionFields("theme03").map((f) => f.group))];
    expect(groups).toEqual(["Scroll effects", "Product cards", "About page", "Contact page"]);
    // the page settings open their own page in the editor preview
    expect(themeOptionFields("theme03").filter((f) => f.group === "About page").every((f) => f.page === "/pages/about")).toBe(true);
    const o = getDefaultSiteContent("theme03").options;
    expect(o.motion).toBe("sporty");
    expect(o.cardSaleBadge).toBe("−{n}%");
    // Theme 3's motion is its own, not Theme 15's
    expect(getDefaultSiteContent("theme15").options.motion).toBe("bold");
  });

  it("keep only valid choices", () => {
    const o = cleanThemeOptions("theme03", { motion: "bold", cardHeart: "hide", cardQuickAdd: "maybe", cardBadgeBackground: "#000000" });
    expect(o.motion).toBe("sporty"); // "bold" belongs to Theme 15
    expect(o.cardHeart).toBe("hide");
    expect(o.cardQuickAdd).toBe("show");
    expect(o.cardBadgeBackground).toBe("#000000");
  });

  it("start with fourteen sections, the new ones below the banners and above the newsletter", () => {
    const types = getDefaultSiteContent("theme03").sections.map((s) => s.type);
    expect(types).toEqual([
      "hero",
      "product-row",
      "image-text",
      "collection-grid",
      "banners",
      "marquee",
      "category-strip",
      "collection-slider",
      "feature-slider",
      "edge-tiles",
      "review-spotlight",
      "why-stats",
      "perks",
      "newsletter",
    ]);
  });

  it("reach the shop: header words, card badges, hidden heart and quick add, newsletter words", () => {
    const { container } = renderTheme("theme03", {
      header: { shopAllLabel: "Everything", searchLabel: "Find", bagLabel: "Cart", accountLabel: "Me" },
      options: { cardSaleBadge: "{n}% OFF", cardHeart: "hide", cardQuickAdd: "hide" },
      sections: [
        { id: "arrivals", type: "product-row", settings: { heading: "New", source: "newest", display: "grid" } },
        { id: "news", type: "newsletter", settings: { heading: "Join", placeholder: "Email here", buttonLabel: "Count me in" } },
      ],
    });
    const text = container.textContent || "";
    for (const word of ["Everything", "Find", "Cart", "Me", "Count me in"]) expect(text).toContain(word);
    expect(text).not.toContain("Shop all");
    expect(text).toMatch(/\d+% OFF/);
    expect(container.querySelector('input[placeholder="Email here"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Add to wishlist"]')).toBeNull();
    expect(container.querySelector('button[aria-label^="Add "][aria-label$=" to bag"]')).toBeNull();
  });

  it("leave other themes that share the boxed card unchanged", () => {
    const { container } = renderTheme("theme20", undefined);
    expect(container.querySelector('button[aria-label="Add to wishlist"]')).not.toBeNull();
  });
});

import { siteViewFor } from "@/components/storefront/site/site-app";
import { SiteWishlist } from "@/components/storefront/site/wishlist";
import { SiteInfoPage } from "@/components/storefront/site/account";
import { SiteCatalog } from "@/components/storefront/site/catalog";
import { fireEvent } from "@testing-library/react";

function renderPage(theme: string, node: React.ReactNode, draft?: unknown) {
  return render(
    <SiteProvider store={demoStoreFor(shop, theme)} base="" theme={theme} draft={draft} editing={false} demo previewQuery="">
      {node}
    </SiteProvider>
  );
}

describe("Theme 3 fixes", () => {
  it("featured collections fill exactly the number of tiles asked for, topped up with the seller's extra tiles", () => {
    const grid = (settings: Record<string, string>) =>
      renderTheme("theme03", { sections: [{ id: "c", type: "collection-grid", settings: { heading: "Featured", ...settings } }] }).container.querySelectorAll('[data-type="collection-grid"] .m-stagger > div > a');
    // the sample shop has four categories; Theme 3 adds Sale and New in tiles to fill the three columns
    const def = getDefaultSiteContent("theme03").sections.find((s) => s.type === "collection-grid")!.settings;
    expect(def.count).toBe("6");
    expect(def.tone).toBe("dark");
    const six = grid(def);
    expect(six).toHaveLength(6);
    expect([...six].map((a) => a.textContent).join(" ")).toContain("Sale");
    expect([...six].map((a) => a.textContent).join(" ")).toContain("New in");
    expect(grid({ count: "3" })).toHaveLength(3);
    // never more than six, whatever is saved
    expect(grid({ count: "12", x1Image: "a.jpg", x1Title: "One", x2Image: "b.jpg", x2Title: "Two" })).toHaveLength(6);
  });

  it("puts Shop by activity and Trail favourites in the middle", () => {
    const secs = getDefaultSiteContent("theme03").sections;
    expect(secs.find((s) => s.type === "category-strip")!.settings.align).toBe("center");
    expect(secs.find((s) => s.type === "collection-slider")!.settings.align).toBe("center");
    // other themes keep the heading on the left
    expect(getDefaultSiteContent("theme20").sections.find((s) => s.type === "category-strip")!.settings.align).toBeUndefined();
  });

  it("has a wishlist page of its own", () => {
    expect(siteViewFor("/wishlist", null)).toEqual({ name: "wishlist" });
    const { container } = renderPage("theme03", <SiteWishlist />, { header: { wishlistLabel: "Saved" } });
    expect(container.querySelector("h1")?.textContent).toBe("Saved");
    expect(container.textContent).toContain("Nothing saved yet");
  });

  it("gives About and Contact their own, different designs", () => {
    const about = renderPage("theme03", <SiteInfoPage id="about" />).container;
    expect(about.querySelector(".t-about")).not.toBeNull();
    expect(about.textContent).toContain("What we stand for");
    expect(about.textContent).toContain("2019");
    const contact = renderPage("theme03", <SiteInfoPage id="contact" />).container;
    expect(contact.querySelector(".t-contact")).not.toBeNull();
    expect(contact.textContent).toContain("Send us a message");
    expect(contact.textContent).toContain("Opening hours");
    // the two pages carry different photos
    const pages = getDefaultSiteContent("theme03").pages;
    expect(pages.about.image).not.toBe(pages.contact.image);
    // other themes keep the shared page layout
    expect(renderPage("theme04", <SiteInfoPage id="about" />).container.querySelector(".t-about")).toBeNull();
  });

  it("filters the catalogue by price, with a chip to undo it", () => {
    const { container, getByRole, getAllByRole } = renderPage("theme03", <SiteCatalog />);
    const before = container.querySelectorAll("[data-feature], .m-stagger > *").length;
    fireEvent.click(getByRole("button", { name: /^Filter/ }));
    const under = getAllByRole("button", { name: /^Under ₹/ })[0];
    fireEvent.click(under);
    expect(getByRole("button", { name: /^Filter/ }).textContent).toContain("1");
    expect(container.textContent).toMatch(/\d+ products?/);
    expect(getAllByRole("button", { name: "Clear all" }).length).toBeGreaterThan(0);
    void before;
  });
});

describe("Review spotlight", () => {
  it("slides to the next review by itself, and waits while pointed at", async () => {
    vi.useFakeTimers();
    const { act } = await import("@testing-library/react");
    const { container } = renderTheme("theme03", { sections: [{ id: "r", type: "review-spotlight", settings: { label: "Reviews" } }] });
    const quote = () => container.querySelector("blockquote")?.textContent || "";
    const first = quote();
    await act(async () => {
      vi.advanceTimersByTime(5600);
    });
    const second = quote();
    expect(second).not.toBe(first);
    const card = container.querySelector('[data-type="review-spotlight"] section > div > div') as HTMLElement;
    fireEvent.mouseEnter(card);
    await act(async () => {
      vi.advanceTimersByTime(12000);
    });
    expect(quote()).toBe(second);
    vi.useRealTimers();
  });
});

describe("Theme 3 phone menu", () => {
  it("opens Theme 3's own black menu; other themes keep the shared one", () => {
    const t3 = renderTheme("theme03", undefined).container;
    fireEvent.click(t3.querySelector('button[aria-label="Open menu"]')!);
    const menu = document.querySelector(".t-menu");
    expect(menu).not.toBeNull();
    expect(menu!.textContent).toContain("Jackets");
    expect(menu!.querySelectorAll(".t-menu-list > li").length).toBeGreaterThan(1);
    document.body.innerHTML = "";
    const t4 = renderTheme("theme04", undefined).container;
    fireEvent.click(t4.querySelector('button[aria-label="Open menu"]')!);
    expect(document.querySelector(".t-menu")).toBeNull();
    expect(document.querySelector('[role="dialog"][aria-label="Menu"]')).not.toBeNull();
  });
});
