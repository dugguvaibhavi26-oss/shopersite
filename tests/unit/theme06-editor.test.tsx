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

import { cleanThemeOptions, getDefaultSiteContent, themeOptionFields } from "@/lib/site-content";
import { demoCatalogFor, demoStoreFor } from "@/lib/demo-store";
import { SiteProvider } from "@/components/storefront/site/context";
import { SiteHeader } from "@/components/storefront/site/shell";
import { SiteHome } from "@/components/storefront/site/home";
import type { StoreData } from "@/lib/store-service";

const shop = { id: "s6", name: "Volt", subdomain: "volt", planId: "pro", products: [], categories: [], reviews: [], banners: [] } as unknown as StoreData;

function renderTheme(theme: string, draft: unknown) {
  return render(
    <SiteProvider store={demoStoreFor(shop, theme)} base="" theme={theme} draft={draft} editing={false} demo previewQuery="">
      <SiteHeader overHero={false} />
      <SiteHome />
    </SiteProvider>
  );
}

describe("E01 (theme06)", () => {
  it("has its own settings: scroll effects, product cards and benefit card colours", () => {
    const groups = [...new Set(themeOptionFields("theme06").map((f) => f.group))];
    expect(groups).toEqual(["Scroll effects", "Product cards", "Benefit cards", "Product stage", "About page", "Contact page"]);
    const o = getDefaultSiteContent("theme06").options;
    expect(o.motion).toBe("glide");
    expect(o.notchSale).toBe("{n}% off");
    expect(cleanThemeOptions("theme06", { motion: "sporty", notchBadge: "#00AA00" })).toMatchObject({ motion: "glide", notchBadge: "#00AA00" });
  });

  it("sells tech only in its sample shop", () => {
    const { categories, products } = demoCatalogFor("theme06");
    const names = categories.map((c) => c.name);
    expect(names).toEqual(["Audio", "Wearables", "Cameras", "Speakers", "Charging", "Cases"]);
    const slugs = categories.map((c) => c.slug);
    for (const p of products) expect(slugs).toContain(p.category);
    expect(products.some((p) => /sneaker|hoodie|chair|vase|lamp/i.test(p.title))).toBe(false);
  });

  it("mixes different kinds of sections, with a single big photo poster", () => {
    const types = getDefaultSiteContent("theme06").sections.map((s) => s.type);
    expect(types).toEqual([
      "hero",
      "category-cards",
      "product-row",
      "brand-strip",
      "budget-picker",
      "offer-split",
      "room-shop",
      "menu-board",
      "scent-quiz",
      "stage",
      "bento-benefits",
      "reviews",
      "faq",
      "perks",
    ]);
    const posters = types.filter((t) => ["duo-promo", "spotlight-cards", "offer-split", "category-spotlight", "promo-banner", "gallery"].includes(t));
    expect(posters).toEqual(["offer-split"]);
  });

  it("puts the seller's words and colours on its product cards", () => {
    const { container } = renderTheme("theme06", { options: { notchAdd: "Grab it", notchBadge: "#00aa00", notchHeart: "hide" } });
    expect(container.textContent).toContain("Grab it");
    expect(container.innerHTML).toContain("background: rgb(0, 170, 0)");
    expect(container.querySelector('[data-type="product-row"] button[aria-label="Add to wishlist"]')).toBeNull();
  });

  it("marks the chosen price-list tab so it can be styled", () => {
    const { container } = renderTheme("theme06", undefined);
    const pressed = container.querySelectorAll('[data-type="menu-board"] [role="tablist"] button[aria-pressed="true"]');
    expect(pressed).toHaveLength(1);
  });

  it("opens its own soft phone menu with category tiles and the Orders word from the header", () => {
    const { container } = renderTheme("theme06", { header: { ordersLabel: "My orders" } });
    expect(container.textContent).toContain("My orders");
    fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!);
    const menu = document.querySelector(".t-menu");
    expect(menu).not.toBeNull();
    expect(menu!.querySelectorAll(".t-menu-list > a").length).toBe(6);
  });

  it("shows five hot picks, three across with the promo tile", () => {
    const hot = getDefaultSiteContent("theme06").sections.find((x) => x.id === "hot")!;
    expect(hot.settings.limit).toBe("5");
    const { container } = renderTheme("theme06", undefined);
    const tiles = container.querySelectorAll('[data-type="product-row"] .m-stagger > *');
    expect(tiles).toHaveLength(6);
    expect(container.querySelector('[data-type="product-row"] .m-stagger')!.className).toContain("md:grid-cols-3");
  });

  it("draws the budget picker as a coloured panel, unlike the product grids", () => {
    const { container } = renderTheme("theme06", undefined);
    const panel = container.querySelector('[data-type="budget-picker"] .t-budget');
    expect(panel).not.toBeNull();
    expect(panel!.querySelectorAll('[role="tab"]').length).toBe(4);
  });

  it("finds products for every choice in the finder", async () => {
    const { container } = renderTheme("theme06", undefined);
    const tabs = [...container.querySelectorAll('[data-type="scent-quiz"] [role="tab"]')] as HTMLElement[];
    expect(tabs.map((t) => t.textContent)).toEqual(["Listening", "Workouts", "Photos", "Parties", "Staying charged"]);
    for (const t of tabs) {
      fireEvent.click(t);
      expect(container.querySelectorAll('[data-type="scent-quiz"] .m-page > *').length).toBeGreaterThan(0);
    }
  });

  it("lists the policy pages in the phone menu (the shop's own, or samples in previews)", () => {
    const { container } = renderTheme("theme06", undefined);
    fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!);
    const links = [...document.querySelectorAll(".t-menu ul a")].map((a) => a.getAttribute("href") || "");
    for (const id of ["terms", "returns", "shipping", "privacy"]) expect(links.some((h) => h.endsWith(`/pages/${id}`))).toBe(true);
  });
});

import { SiteInfoPage } from "@/components/storefront/site/account";

describe("E01 About and Contact", () => {
  const page = (id: string) =>
    render(
      <SiteProvider store={demoStoreFor(shop, "theme06")} base="" theme="theme06" draft={undefined} editing={false} demo previewQuery="">
        <SiteInfoPage id={id} />
      </SiteProvider>
    ).container;

  it("are E01's own soft designs, different from each other", () => {
    const about = page("about");
    expect(about.querySelector(".t-about")).not.toBeNull();
    expect(about.textContent).toContain("What we promise");
    expect(about.textContent).not.toMatch(/clothes/i);
    const contact = page("contact");
    expect(contact.querySelector(".t-contact")).not.toBeNull();
    expect(contact.textContent).toContain("Talk to us");
    const pages = getDefaultSiteContent("theme06").pages;
    expect(pages.about.image).not.toBe(pages.contact.image);
  });
});

describe("E01 questions", () => {
  it("are numbered cards with a help card, which comes after the questions on phones", () => {
    const { container } = renderTheme("theme06", undefined);
    const faq = container.querySelector('[data-type="faq"]')!;
    const cards = [...faq.querySelectorAll(".t-faq-list button[aria-expanded]")];
    expect(cards).toHaveLength(5);
    expect(cards[0].textContent).toContain("01");
    expect(faq.textContent).toContain("Still have questions?");
    // desktop copy beside the questions, phone copy after them
    const phoneHelp = [...faq.querySelectorAll(".t-faq-list > div")].find((d) => d.classList.contains("lg:hidden"))?.querySelector(".t-faq-help");
    expect(phoneHelp).not.toBeNull();
    // the first question starts open; another opens on tap and the first closes
    expect(cards[0].getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(cards[2]);
    expect(cards[2].getAttribute("aria-expanded")).toBe("true");
    expect(cards[0].getAttribute("aria-expanded")).toBe("false");
  });

  it("stay a simple list on themes that have not chosen the card style", () => {
    const { container } = renderTheme("theme15", undefined);
    expect(container.querySelector('[data-type="faq"] .t-faq-list')).toBeNull();
  });
});
