import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";

// jsdom has no matchMedia; some sections ask it about reduced motion and hover
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
import type { StoreData } from "@/lib/store-service";

const shop = { id: "f2", name: "Oak & Co", subdomain: "oakco", planId: "pro", products: [], categories: [], reviews: [], banners: [] } as unknown as StoreData;

function renderIn(theme: string, node: React.ReactNode, draft?: unknown) {
  return render(
    <SiteProvider store={demoStoreFor(shop, theme)} base="" theme={theme} draft={draft} editing={false} demo previewQuery="">
      {node}
    </SiteProvider>
  );
}
const renderHome = (theme: string, draft?: unknown) => renderIn(theme, <><SiteHeader overHero={false} /><SiteHome /></>, draft);

describe("F02 editor settings", () => {
  it("are F02's own, grouped, with its own scroll effect", () => {
    const groups = [...new Set(themeOptionFields("f02").map((f) => f.group))];
    expect(groups).toEqual(["Scroll effects", "Product cards", "Phone menu", "About page", "Contact page"]);
    expect(themeOptionFields("f02").filter((f) => f.group === "About page").every((f) => f.page === "/pages/about")).toBe(true);
    expect(getDefaultSiteContent("f02").options.motion).toBe("grain");
    for (const t of ["theme03", "theme06", "theme07", "theme15"]) expect(getDefaultSiteContent(t).options.motion).not.toBe("grain");
  });

  it("keep only valid choices", () => {
    const o = cleanThemeOptions("f02", { motion: "wheel", cardHeart: "hide", cardBadgeBackground: "olive" });
    expect(o.motion).toBe("grain");
    expect(o.cardHeart).toBe("hide");
    expect(o.cardBadgeBackground).toBe("#F1EDE4");
  });
});

describe("F02 sections", () => {
  it("mixes kinds: categories, products, planks, a room, a sizer, an offer, reviews and questions", () => {
    const types = getDefaultSiteContent("f02").sections.map((s) => s.type);
    expect(types).toEqual(["hero", "category-rows", "product-row", "wood-planks", "room-shop", "table-sizer", "product-row", "offer-split", "reviews", "faq", "newsletter"]);
    const secs = getDefaultSiteContent("f02").sections;
    // the two product rows are laid out differently
    expect(secs.filter((s) => s.type === "product-row").map((s) => s.settings.display)).toEqual(["grid", "tabs"]);
    // the questions use the card style with a help card
    expect(secs.find((s) => s.type === "faq")!.settings.style).toBe("cards");
    // no photo is used twice on the page
    const photos = secs.flatMap((s) => Object.entries(s.settings).filter(([k, v]) => /image/i.test(k) && v).map(([, v]) => v.split("?")[0]));
    expect(new Set(photos).size).toBe(photos.length);
  });

  it("opens a wood plank to tell its story", () => {
    const { container, getByRole } = renderHome("f02");
    const planks = container.querySelector('[data-type="wood-planks"]')!;
    expect(planks.querySelectorAll(".t-plank").length).toBe(4);
    expect(planks.querySelector('.t-plank[data-open="true"]')!.textContent).toContain("Oak");
    fireEvent.click(getByRole("tab", { name: "Walnut" }));
    expect(planks.querySelector('.t-plank[data-open="true"]')!.textContent).toContain("chocolate grain");
  });

  it("draws the table and the right number of chairs for the seats picked", () => {
    const { container, getByRole } = renderHome("f02");
    const sizer = container.querySelector('[data-type="table-sizer"]')!;
    // starts on six seats
    expect(sizer.querySelectorAll(".t-sizer-chair").length).toBe(6);
    expect(sizer.textContent).toContain("180 × 90 cm");
    fireEvent.click(getByRole("tab", { name: "10 seats" }));
    expect(sizer.querySelectorAll(".t-sizer-chair").length).toBe(10);
    expect(sizer.textContent).toContain("4.4 × 2.8 m");
    expect(sizer.textContent).toContain("See 10-seat tables");
    fireEvent.click(getByRole("tab", { name: "4 seats" }));
    expect(sizer.querySelectorAll(".t-sizer-chair").length).toBe(4);
  });

  it("only sells dining furniture in its sample shop, with reviews about furniture", () => {
    const demo = demoStoreFor(shop, "f02");
    expect(demo.categories.map((c) => c.name)).toEqual(["Dining chairs", "Dining tables", "Benches & stools"]);
    expect(demo.reviews.some((r) => /table|chairs|bench/i.test(r.comment))).toBe(true);
    expect(demo.reviews.some((r) => /wearing|fits just right/i.test(r.comment))).toBe(false);
  });
});

describe("F02 phone menu and pages", () => {
  it("opens its own workshop menu with category photo cards and its help bar", () => {
    const { container } = renderHome("f02", { options: { menuHelp: "Call the workshop" } });
    fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!);
    const menu = document.querySelector(".t-menu-workshop");
    expect(menu).not.toBeNull();
    expect(menu!.textContent).toContain("Dining tables");
    expect(menu!.textContent).toContain("Call the workshop");
    document.body.innerHTML = "";
    expect(SITE_THEME_STYLE.f02.menu).toBe("workshop");
  });

  it("has a wishlist heart in the header and the bag last", () => {
    const { container } = renderHome("f02");
    const labels = [...container.querySelectorAll("header a[aria-label]")].map((a) => a.getAttribute("aria-label") || "");
    expect(labels).toContain("Wishlist");
    expect(labels[labels.length - 1]).toMatch(/^Bag/);
    expect(container.querySelector("header")!.textContent).not.toContain("(0)");
  });

  it("gives About its own design, different from Contact and from other themes", () => {
    const about = renderIn("f02", <SiteInfoPage id="about" />).container;
    expect(about.querySelector(".t-about-workshop")).not.toBeNull();
    expect(about.querySelector(".t-ruler")).not.toBeNull();
    expect(about.textContent).toContain("Mortise and tenon, no metal brackets");
    expect(about.textContent).toContain("Oiling, three coats");
    const contact = renderIn("f02", <SiteInfoPage id="contact" />).container;
    expect(contact.querySelector(".t-contact")).not.toBeNull();
    expect(contact.textContent).toContain("Talk to the workshop");
    const pages = getDefaultSiteContent("f02").pages;
    expect(pages.about.image).not.toBe(pages.contact.image);
    expect(renderIn("theme07", <SiteInfoPage id="about" />).container.querySelector(".t-about-workshop")).toBeNull();
  });
});
