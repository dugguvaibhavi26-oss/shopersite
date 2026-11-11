// @vitest-environment node
import { describe, it, expect } from "vitest";
import { evaluateCoupon, storeService } from "@/lib/store-service";
import { canUseThemeEditor, isThemeAllowed } from "@/lib/plans";
import { SITE_SECTION_TYPES, SITE_THEME_SLUGS, SITE_THEME_STYLE, getDefaultSiteContent, headingScale, removedThemeSections, resolveSiteContent, restoreThemeSection, toSiteTheme } from "@/lib/site-content";
import { siteViewFor } from "@/components/storefront/site/site-app";

describe("Storefront themes", () => {
  it("are open to every plan, but only Growth and Pro can edit them", () => {
    expect(isThemeAllowed("classic-bloom", "free")).toBe(true);
    expect(isThemeAllowed("mono-studio", "free")).toBe(true);
    expect(isThemeAllowed("mono-studio", "starter")).toBe(true);
    expect(isThemeAllowed("mono-studio", "pro")).toBe(true);
    expect(canUseThemeEditor("free")).toBe(false);
    expect(canUseThemeEditor("starter")).toBe(true);
    expect(canUseThemeEditor("pro")).toBe(true);
  });

  it("lays saved editor content over the defaults and drops broken parts", () => {
    const content = resolveSiteContent(
      {
        settings: { accent: "#ff0000", bogus: "x" },
        header: { catalogLabel: "Shop" },
        sections: [
          { id: "a", type: "hero", settings: { heading: "Hello" } },
          { id: "b", type: "not-a-section", settings: {} },
          { id: "c", type: "marquee", hidden: true, settings: { text: 42 } },
        ],
        pages: { about: { title: "Our story", body: "Since 2020" } },
      },
      "mono-studio",
      "Roxten"
    );
    expect(content.settings.accent).toBe("#ff0000");
    expect(content.settings.background).toBe("#FFFFFF");
    expect(content.header.catalogLabel).toBe("Shop");
    expect(content.header.aboutLabel).toBe("About");
    expect(content.sections.map((s) => s.type)).toEqual(["hero", "marquee"]);
    expect(content.sections[1].hidden).toBe(true);
    expect(content.sections[1].settings.text).toBeUndefined();
    expect(content.pages.about.title).toBe("Our story");
    expect(content.pages.contact.title).toBe("Contact");
    // nothing saved: the defaults, named after the shop
    expect(resolveSiteContent(undefined, "mono-studio", "Roxten").sections[0].settings.heading).toBe("Roxten");
    expect(getDefaultSiteContent().sections.length).toBeGreaterThan(5);
    // the text size stays between 80% and 130%
    expect(resolveSiteContent({ settings: { textSize: "400" } }).settings.textSize).toBe("130");
    expect(resolveSiteContent({ settings: { textSize: "10" } }).settings.textSize).toBe("80");
  });

  it("gives each theme its own starting look and sections", () => {
    const lume = getDefaultSiteContent("classic-bloom", "Roxten");
    const mono = getDefaultSiteContent("mono-studio", "Roxten");
    expect(lume.settings.headingFont).toBe("Playfair Display");
    expect(mono.settings.headingFont).toBe("Unbounded");
    expect(lume.sections.map((s) => s.type)).toContain("category-circles");
    expect(SITE_THEME_STYLE["classic-bloom"].header).toBe("simple");
    expect(SITE_THEME_STYLE["mono-studio"].header).toBe("cells");
    const t3 = getDefaultSiteContent("theme03", "Roxten");
    expect(t3.sections.map((s) => s.type)).toEqual(expect.arrayContaining(["collection-grid", "product-row", "image-text"]));
    expect(t3.sections[0].settings.imageLayout).toBe("center");
    expect(SITE_THEME_STYLE.theme03).toMatchObject({ header: "overlay", card: "boxed", headingAlign: "center" });
    expect(toSiteTheme("theme03")).toBe("theme03");
    const t4 = getDefaultSiteContent("theme04", "Roxten");
    expect(t4.sections.map((s) => s.type)).toEqual(expect.arrayContaining(["promo-cards", "statement", "marquee"]));
    expect(t4.sections[0].settings.imageLayout).toBe("split");
    expect(t4.settings.headingFont).toBe("Anton");
    expect(SITE_THEME_STYLE.theme04).toMatchObject({ header: "split", card: "hover" });
    expect(toSiteTheme("theme04")).toBe("theme04");
    const t5 = getDefaultSiteContent("theme05", "Roxten");
    expect(t5.sections.map((s) => s.type)).toEqual(expect.arrayContaining(["reviews", "colour-chips", "type-collage", "size-finder", "occasion-mosaic"]));
    expect(t5.sections[0].settings.imageLayout).toBe("panel");
    expect(t5.header.ctaLabel).toBe("Find your fit");
    expect(SITE_THEME_STYLE.theme05).toMatchObject({ card: "detailed", footerWordmark: true });
    expect(toSiteTheme("theme05")).toBe("theme05");
    // anything else falls back to Lume Editorial
    expect(toSiteTheme("bento-tech")).toBe("classic-bloom");
    expect(headingScale("s")).toBeLessThan(1);
    expect(headingScale("l")).toBeGreaterThan(1);
  });

  it("maps shop paths to the theme's pages", () => {
    expect(siteViewFor("/", null)).toEqual({ name: "home" });
    expect(siteViewFor("/catalog", null)).toEqual({ name: "catalog" });
    expect(siteViewFor("/category/all", null)).toEqual({ name: "catalog" });
    expect(siteViewFor("/category/hoodies", null)).toEqual({ name: "catalog", slug: "hoodies" });
    expect(siteViewFor("/search", "tee")).toEqual({ name: "catalog", query: "tee" });
    expect(siteViewFor("/products/basic-tee", null)).toEqual({ name: "product", slug: "basic-tee" });
    expect(siteViewFor("/bag", null)).toEqual({ name: "cart" });
    expect(siteViewFor("/checkout", null)).toEqual({ name: "checkout" });
    expect(siteViewFor("/order/tok_1", null)).toEqual({ name: "order", token: "tok_1" });
    expect(siteViewFor("/account", null)).toEqual({ name: "account" });
    expect(siteViewFor("/pages/about", null)).toEqual({ name: "page", id: "about" });
    expect(siteViewFor("/nope", null)).toEqual({ name: "missing" });
  });
});

describe("Coupons", () => {
  const sub = `coupons-${Date.now().toString(36)}`;
  const store = storeService.registerStoreOffline({
    name: "Coupon Shop",
    subdomain: sub,
    category: "Fashion",
    ownerName: "Test",
    contactPhone: "9876543210",
    upiId: "test@okicici",
    tagline: "",
  });
  storeService.updateStore(sub, { planId: "starter", freeDeliveryThreshold: 0 });
  storeService.addDiscount(sub, { code: "save10", type: "percentage", value: 10, maxDiscount: 5000, minOrderValue: 20000, isActive: true });
  storeService.addDiscount(sub, { code: "OLD", type: "flat", value: 10000, isActive: true, expiresAt: "2020-01-01T00:00:00.000Z" });

  it("checks the minimum, the cap and the expiry", () => {
    const s = storeService.getStore(store.subdomain)!;
    expect(evaluateCoupon(s, "SAVE10", 10000)).toMatchObject({ ok: false });
    expect(evaluateCoupon(s, "save10", 30000)).toMatchObject({ ok: true, amount: 3000 });
    expect(evaluateCoupon(s, "SAVE10", 900000)).toMatchObject({ ok: true, amount: 5000 });
    expect(evaluateCoupon(s, "OLD", 30000)).toMatchObject({ ok: false, error: "This code has expired." });
    expect(evaluateCoupon(s, "NOPE", 30000)).toMatchObject({ ok: false });
    expect(evaluateCoupon({ ...s, planId: "free" }, "SAVE10", 30000)).toMatchObject({ ok: false });
  });

});

describe("Adding sections back", () => {
  it("offers only the theme's own removed sections and puts them back in place", () => {
    const full = getDefaultSiteContent("mono-studio", "Acme");
    expect(removedThemeSections(full, "mono-studio")).toEqual([]);
    const ids = full.sections.map((s) => s.id);
    const without = { ...full, sections: full.sections.filter((s) => s.id !== ids[2]) };
    expect(removedThemeSections(without, "mono-studio", "Acme").map((s) => s.id)).toEqual([ids[2]]);
    const back = restoreThemeSection(without, "mono-studio", ids[2], "Acme");
    expect(back.sections.map((s) => s.id)).toEqual(ids);
    // a section from another theme can't be added
    expect(restoreThemeSection(without, "mono-studio", "founder", "Acme")).toBe(without);
  });
});

describe("Theme preview samples", () => {
  it("give every theme its own products, categories, banners and reviews, keeping the shop's own details", async () => {
    const { demoStoreFor } = await import("@/lib/demo-store");
    const sub = `demo${Date.now().toString(36)}`;
    storeService.registerStoreOffline({ name: "Acme", subdomain: sub, category: "Fashion", ownerName: "A", contactPhone: "9999999999", upiId: "acme@upi", tagline: "" });
    const real = storeService.getStore(sub)!;
    const titles = new Set<string>();
    for (const theme of ["classic-bloom", "mono-studio", "theme03", "theme04", "theme05", "theme06", "f01", "f02", "theme07", "theme08", "theme09", "theme10", "theme11", "theme12", "theme13", "theme14", "theme15", "theme16", "theme17", "theme18", "theme19", "theme20", "theme21", "theme22", "theme23", "theme24", "theme25", "theme26", "theme27", "theme28", "theme29", "theme30", "theme31", "theme32", "theme33", "theme34", "theme35"]) {
      const demo = demoStoreFor(real, theme);
      expect(demo.name).toBe(real.name);
      expect(demo.upiId).toBe(real.upiId);
      expect(demo.products.length).toBeGreaterThanOrEqual(8);
      expect(demo.banners.length).toBeGreaterThan(0);
      expect(demo.reviews.every((r) => demo.products.some((p) => p.id === r.productId))).toBe(true);
      // every product sits in one of the sample categories
      expect(demo.products.every((p) => demo.categories.some((c) => c.slug === p.category))).toBe(true);
      titles.add(demo.products[0].title);
    }
    expect(titles.size).toBe(37);
    // the real shop is untouched
    expect(storeService.getStore(sub)!.products).toEqual(real.products);
  });
});

describe("E01 (theme06)", () => {
  it("has its own look, sections and starting content, all editable in the shared editor", () => {
    expect(toSiteTheme("theme06")).toBe("theme06");
    expect(SITE_THEME_STYLE.theme06).toMatchObject({ header: "bar", card: "notch" });
    const c = getDefaultSiteContent("theme06", "Fabrid");
    expect(c.sections.map((x) => x.type)).toEqual(["hero", "category-cards", "product-row", "brand-strip", "budget-picker", "offer-split", "room-shop", "menu-board", "scent-quiz", "stage", "bento-benefits", "reviews", "faq", "perks"]);
    expect(c.sections[0].settings).toMatchObject({ heading: "Fabrid", imageLayout: "notch", stat: "70+" });
    expect(c.sections[2].settings).toMatchObject({ display: "tabs", promoButton: "View collection" });
    for (const type of ["category-cards", "offer-split", "perks"] as const) expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
    expect(isThemeAllowed("theme06", "free")).toBe(true);
  });

  it("can bring back a removed E01 section with its starting content", () => {
    const full = getDefaultSiteContent("theme06", "Fabrid");
    const without = { ...full, sections: full.sections.filter((x) => x.id !== "offer") };
    expect(removedThemeSections(without, "theme06", "Fabrid").map((x) => x.id)).toEqual(["offer"]);
    expect(restoreThemeSection(without, "theme06", "offer", "Fabrid").sections.map((x) => x.id)).toEqual(full.sections.map((x) => x.id));
  });
});

describe("F01", () => {
  it("has its own look, sections and starting content", () => {
    expect(toSiteTheme("f01")).toBe("f01");
    expect(SITE_THEME_STYLE.f01).toMatchObject({ card: "spec", footer: "dark" });
    const c = getDefaultSiteContent("f01", "Form&Wood");
    expect(c.sections.map((x) => x.type)).toEqual(["hero", "about-split", "categories", "product-row", "steps", "offer-split", "perks", "reviews"]);
    expect(c.sections[0].settings).toMatchObject({ heading: "form&wood", imageLayout: "showcase", tile1Label: "Ready to buy", tile2Label: "Custom order" });
    expect(c.sections[3].settings).toMatchObject({ tone: "dark", buttonLabel: "Go to full catalog" });
    expect(SITE_SECTION_TYPES["about-split"].fields.length).toBeGreaterThan(0);
    expect(isThemeAllowed("f01", "free")).toBe(true);
  });
});

describe("F02 and Themes 07–09", () => {
  it("each have their own look, starting sections and sample catalog", async () => {
    const { demoCatalogFor } = await import("@/lib/demo-store");
    const cases = [
      { slug: "f02", hero: "banner", types: ["category-rows", "offer-split"] },
      { slug: "theme07", hero: "split-word", types: ["collection-tiles", "studio-prints"] },
      { slug: "theme08", hero: "poster", types: ["brand-story", "contact-block"] },
      { slug: "theme09", hero: "center", types: ["collection-feature", "stories", "quote"] },
    ];
    for (const c of cases) {
      expect(toSiteTheme(c.slug)).toBe(c.slug);
      expect(SITE_THEME_STYLE[toSiteTheme(c.slug)].card).toBe("line");
      expect(isThemeAllowed(c.slug, "free")).toBe(true);
      const content = getDefaultSiteContent(c.slug, "Acme");
      expect(content.sections[0].settings.imageLayout).toBe(c.hero);
      for (const t of c.types) expect(content.sections.some((x) => x.type === t)).toBe(true);
      const demo = demoCatalogFor(c.slug);
      expect(demo.products.length).toBeGreaterThanOrEqual(10);
      expect(demo.products.every((p) => demo.categories.some((cat) => cat.slug === p.category))).toBe(true);
    }
    for (const type of ["category-rows", "collection-tiles", "brand-story", "contact-block", "collection-feature", "stories"] as const) {
      expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
    }
  });
});

describe("Themes 10–12", () => {
  it("each have their own hero, sections and sample catalog", async () => {
    const { demoCatalogFor } = await import("@/lib/demo-store");
    const cases = [
      { slug: "theme10", hero: "bento", types: ["look-cards", "colour-chips", "testimonial", "why-stats"] },
      { slug: "theme11", hero: "spec", types: ["category-panels", "featured-product", "promo-banner"] },
      { slug: "theme12", hero: "duo", types: ["brand-strip", "category-spotlight", "perks"] },
    ];
    for (const c of cases) {
      expect(toSiteTheme(c.slug)).toBe(c.slug);
      expect(isThemeAllowed(c.slug, "free")).toBe(true);
      const content = getDefaultSiteContent(c.slug, "Acme");
      expect(content.sections[0].settings.imageLayout).toBe(c.hero);
      for (const t of c.types) expect(content.sections.some((x) => x.type === t)).toBe(true);
      const demo = demoCatalogFor(c.slug);
      expect(demo.products.length).toBeGreaterThanOrEqual(10);
      expect(demo.products.every((p) => demo.categories.some((cat) => cat.slug === p.category))).toBe(true);
    }
    expect(SITE_THEME_STYLE.theme10).toMatchObject({ headerSearch: true, pillTabs: true });
    // the spotlight's category exists in Theme 12's own sample shop
    const t12 = demoCatalogFor("theme12");
    const spot = getDefaultSiteContent("theme12", "Acme").sections.find((x) => x.type === "category-spotlight")!;
    expect(t12.categories.some((cat) => `category:${cat.slug}` === spot.settings.source)).toBe(true);
    for (const type of ["look-cards", "colour-chips", "testimonial", "why-stats", "category-panels", "featured-product", "promo-banner", "brand-strip", "category-spotlight"] as const) {
      expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
    }
  });

  it("can bring back a removed Theme 11 section with its starting content", () => {
    const full = getDefaultSiteContent("theme11", "Acme");
    const without = { ...full, sections: full.sections.filter((x) => x.id !== "promo") };
    expect(removedThemeSections(without, "theme11", "Acme").map((x) => x.id)).toEqual(["promo"]);
    expect(restoreThemeSection(without, "theme11", "promo", "Acme").sections.map((x) => x.id)).toEqual(full.sections.map((x) => x.id));
  });
});

describe("Themes 13–16", () => {
  it("each have their own hero, card, sections and sample catalog", async () => {
    const { demoCatalogFor } = await import("@/lib/demo-store");
    const cases = [
      { slug: "theme13", hero: "block", card: "tile", types: ["custom-order", "product-row"] },
      { slug: "theme14", hero: "framed", card: "jar", types: ["marquee", "image-text"] },
      { slug: "theme15", hero: "pop", card: "flavor", types: ["claims-strip", "promo-banner"] },
      { slug: "theme16", hero: "checklist", card: "soft", types: ["product-spotlight", "highlights", "steps", "faq"] },
    ];
    for (const c of cases) {
      expect(toSiteTheme(c.slug)).toBe(c.slug);
      expect(isThemeAllowed(c.slug, "free")).toBe(true);
      expect(SITE_THEME_STYLE[toSiteTheme(c.slug)].card).toBe(c.card);
      const content = getDefaultSiteContent(c.slug, "Acme");
      expect(content.sections[0].settings.imageLayout).toBe(c.hero);
      for (const t of c.types) expect(content.sections.some((x) => x.type === t)).toBe(true);
      const demo = demoCatalogFor(c.slug);
      expect(demo.products.length).toBeGreaterThanOrEqual(10);
      expect(demo.products.every((p) => demo.categories.some((cat) => cat.slug === p.category))).toBe(true);
    }
    const maker = getDefaultSiteContent("theme13", "Acme").sections.find((x) => x.type === "custom-order")!;
    expect(maker.settings.o1Options.split(",").length).toBeGreaterThan(1);
    expect(SITE_THEME_STYLE.theme16.headerTone).toBe("accent");
    for (const type of ["custom-order", "claims-strip", "product-spotlight"] as const) expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
  });
});

describe("Every theme is its own shop", () => {
  it("has its own home page order, page layouts and page text that fits what it sells", () => {
    const orders = new Set<string>();
    const layouts = new Set<string>();
    for (const theme of SITE_THEME_SLUGS) {
      const c = getDefaultSiteContent(theme, "Acme");
      orders.add(c.sections.map((x) => x.type).join(","));
      const look = SITE_THEME_STYLE[theme];
      expect(look.pageStyle).toBeTruthy();
      expect(look.productLayout).toBeTruthy();
      expect(look.catalogLayout).toBeTruthy();
      layouts.add(`${look.pageStyle}/${look.productLayout}/${look.catalogLayout}`);
      // no theme ends on the old "new arrivals, reviews, newsletter" run
      const tail = c.sections.slice(-3).map((x) => x.type + (x.settings.source === "newest" ? ":new" : "")).join(",");
      expect(tail).not.toBe("product-row:new,reviews,newsletter");
    }
    expect(orders.size).toBe(SITE_THEME_SLUGS.length);
    expect(layouts.size).toBeGreaterThan(10);
    expect(getDefaultSiteContent("theme13", "Acme").pages.about.body).toMatch(/donut/i);
    expect(getDefaultSiteContent("theme14", "Acme").pages.returns.body).toMatch(/food/i);
    expect(getDefaultSiteContent("theme16", "Acme").pages.about.image).toBeTruthy();
    for (const type of ["steps", "faq", "highlights", "facts"] as const) expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
  });

  it("keeps a page photo the seller saves", () => {
    const saved = { pages: { about: { title: "Hi", body: "Text", image: "https://example.com/a.jpg" } } };
    expect(resolveSiteContent(saved, "theme13", "Acme").pages.about.image).toBe("https://example.com/a.jpg");
  });
});

describe("Themes 17–20", () => {
  it("each have their own hero, card, sections, pages and sample catalog", async () => {
    const { demoCatalogFor } = await import("@/lib/demo-store");
    const cases = [
      { slug: "theme17", hero: "blob", types: ["category-tints", "sale-banner"], about: /everyday/i },
      { slug: "theme18", hero: "glow", types: ["photo-cta", "gradient-statement", "wordmark-feature", "steps"], about: /skincare/i },
      { slug: "theme19", hero: "carton", types: ["tag-cloud", "bento-benefits", "facts"], about: /protein/i },
      { slug: "theme20", hero: "wordmark", types: ["category-strip", "product-spotlight", "faq"], about: /bikes/i },
    ];
    for (const c of cases) {
      expect(toSiteTheme(c.slug)).toBe(c.slug);
      expect(isThemeAllowed(c.slug, "free")).toBe(true);
      const content = getDefaultSiteContent(c.slug, "Acme");
      expect(content.sections[0].settings.imageLayout).toBe(c.hero);
      for (const t of c.types) expect(content.sections.some((x) => x.type === t)).toBe(true);
      expect(content.pages.about.body).toMatch(c.about);
      const demo = demoCatalogFor(c.slug);
      expect(demo.products.length).toBeGreaterThanOrEqual(10);
      expect(demo.products.every((p) => demo.categories.some((cat) => cat.slug === p.category))).toBe(true);
    }
    expect(getDefaultSiteContent("theme17", "Acme").sections.find((x) => x.id === "trending")?.settings.display).toBe("beside");
    expect(SITE_THEME_STYLE.theme18.card).toBe("shadow");
    for (const type of ["category-tints", "sale-banner", "photo-cta", "gradient-statement", "wordmark-feature", "tag-cloud", "bento-benefits", "category-strip"] as const) {
      expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
    }
  });
});

describe("Themes 21–23", () => {
  it("each have at least seven sections of their own, their own pages and a sample catalog", async () => {
    const { demoCatalogFor } = await import("@/lib/demo-store");
    const cases = [
      { slug: "theme21", hero: "look", types: ["edge-tiles", "engraving", "scatter-gallery"], about: /gold jewellery/i },
      { slug: "theme22", hero: "center", types: ["type-collage", "collection-slider", "guide-row", "quote"], about: /gold jewellery/i },
      { slug: "theme23", hero: "inset", types: ["duo-promo", "offset-pair", "scent-quiz", "collection-tiles"], about: /fragrances/i },
    ];
    for (const c of cases) {
      expect(toSiteTheme(c.slug)).toBe(c.slug);
      expect(isThemeAllowed(c.slug, "free")).toBe(true);
      const content = getDefaultSiteContent(c.slug, "Acme");
      expect(content.sections.length).toBeGreaterThanOrEqual(7);
      expect(content.sections[0].settings.imageLayout).toBe(c.hero);
      for (const t of c.types) expect(content.sections.some((x) => x.type === t)).toBe(true);
      expect(content.pages.about.body).toMatch(c.about);
      const demo = demoCatalogFor(c.slug);
      expect(demo.products.length).toBeGreaterThanOrEqual(10);
      expect(demo.products.every((p) => demo.categories.some((cat) => cat.slug === p.category))).toBe(true);
    }
    // the scent finder's choices each find a sample product
    const quiz = getDefaultSiteContent("theme23", "Acme").sections.find((x) => x.type === "scent-quiz")!;
    const demo23 = demoCatalogFor("theme23");
    for (const line of quiz.settings.options.split("\n")) {
      const term = line.split(":")[1].trim();
      expect(demo23.products.some((p) => new RegExp(`\\b${term}(y|s)?\\b`, "i").test(`${p.title} ${p.description}`))).toBe(true);
    }
    for (const type of ["edge-tiles", "engraving", "type-collage", "collection-slider", "guide-row", "duo-promo", "offset-pair", "scent-quiz"] as const) {
      expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
    }
  });
});

describe("Themes 24–27", () => {
  it("each have at least eight sections of their own, their own pages and a sample catalog", async () => {
    const { demoCatalogFor } = await import("@/lib/demo-store");
    const cases = [
      { slug: "theme24", hero: "peek", types: ["countdown-deals", "spotlight-cards", "review-spotlight", "brand-strip"], about: /phone cases/i },
      { slug: "theme25", hero: "feast", types: ["menu-board", "combo-builder", "tilt-gallery", "steps"], about: /burgers/i },
      { slug: "theme26", hero: "fan", types: ["stage", "story-card", "collection-collage", "faq"], about: /gold jewellery/i },
      { slug: "theme27", hero: "maker", types: ["mission-band", "impact", "highlights", "collection-tiles"], about: /handmade jewellery/i },
    ];
    for (const c of cases) {
      expect(toSiteTheme(c.slug)).toBe(c.slug);
      expect(isThemeAllowed(c.slug, "free")).toBe(true);
      const content = getDefaultSiteContent(c.slug, "Acme");
      expect(content.sections.length).toBeGreaterThanOrEqual(8);
      expect(content.sections[0].settings.imageLayout).toBe(c.hero);
      for (const t of c.types) expect(content.sections.some((x) => x.type === t)).toBe(true);
      expect(content.pages.about.body).toMatch(c.about);
      const demo = demoCatalogFor(c.slug);
      expect(demo.products.length).toBeGreaterThanOrEqual(10);
      expect(demo.products.every((p) => demo.categories.some((cat) => cat.slug === p.category))).toBe(true);
    }
    // the combo builder's three picks each have sample products to choose from
    const combo = getDefaultSiteContent("theme25", "Acme").sections.find((x) => x.type === "combo-builder")!;
    const demo25 = demoCatalogFor("theme25");
    for (const key of Object.keys(combo.settings).filter((k) => String(combo.settings[k]).startsWith("category:"))) {
      const cat = String(combo.settings[key]).slice("category:".length);
      expect(demo25.products.some((p) => p.category === cat)).toBe(true);
    }
    // no two of the four share the same run of section types
    const runs = cases.map((c) => getDefaultSiteContent(c.slug, "Acme").sections.map((x) => x.type).join(","));
    expect(new Set(runs).size).toBe(4);
    for (const type of ["countdown-deals", "spotlight-cards", "review-spotlight", "menu-board", "tilt-gallery", "combo-builder", "stage", "story-card", "collection-collage", "mission-band", "impact"] as const) {
      expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
    }
  });
});

describe("Themes 28–31", () => {
  it("each have at least eight sections of their own, their own pages and a sample catalog", async () => {
    const { demoCatalogFor } = await import("@/lib/demo-store");
    const cases = [
      { slug: "theme28", hero: "carousel", types: ["occasion-mosaic", "promise-icons", "popular-searches", "category-circles"], about: /sarees, lehengas/i },
      { slug: "theme29", hero: "arches", types: ["weave-guide", "heritage-trio", "craft-timeline", "marquee"], about: /weaving families/i },
      { slug: "theme30", hero: "numbered", types: ["collection-circles", "feature-duo", "coupon-banner", "drape-styles"], about: /weaving families/i },
      { slug: "theme31", hero: "boutique", types: ["story-rings", "label-tiles", "offer-band", "budget-picker", "size-finder"], about: /Indian bodies/i },
    ];
    for (const c of cases) {
      expect(toSiteTheme(c.slug)).toBe(c.slug);
      expect(isThemeAllowed(c.slug, "free")).toBe(true);
      const content = getDefaultSiteContent(c.slug, "Acme");
      expect(content.sections.length).toBeGreaterThanOrEqual(8);
      expect(content.sections[0].settings.imageLayout).toBe(c.hero);
      for (const t of c.types) expect(content.sections.some((x) => x.type === t)).toBe(true);
      expect(content.pages.about.body).toMatch(c.about);
      const demo = demoCatalogFor(c.slug);
      expect(demo.products.length).toBeGreaterThanOrEqual(12);
      expect(demo.products.every((p) => demo.categories.some((cat) => cat.slug === p.category))).toBe(true);
    }
    // every weave in the guide has sample sarees woven that way
    const guide = getDefaultSiteContent("theme29", "Acme").sections.find((x) => x.type === "weave-guide")!;
    const demo29 = demoCatalogFor("theme29");
    for (const i of [1, 2, 3, 4]) {
      const term = guide.settings[`w${i}Term`];
      expect(demo29.products.some((p) => new RegExp(`\\b${term}\\b`, "i").test(`${p.title} ${p.description}`))).toBe(true);
    }
    // every price range has something in it
    const budget = getDefaultSiteContent("theme31", "Acme").sections.find((x) => x.type === "budget-picker")!;
    const demo31 = demoCatalogFor("theme31");
    for (const line of budget.settings.ranges.split("\n")) {
      const [from, to] = line.slice(line.lastIndexOf(":") + 1).split("-").map((x) => x.replace(/[^0-9]/g, ""));
      const min = Number(from || 0) * 100;
      const max = to ? Number(to) * 100 : Infinity;
      expect(demo31.products.some((p) => p.price >= min && p.price <= max)).toBe(true);
    }
    // no two of the four share the same run of section types
    const runs = cases.map((c) => getDefaultSiteContent(c.slug, "Acme").sections.map((x) => x.type).join(","));
    expect(new Set(runs).size).toBe(4);
    for (const type of ["occasion-mosaic", "promise-icons", "popular-searches", "weave-guide", "heritage-trio", "craft-timeline", "collection-circles", "feature-duo", "coupon-banner", "drape-styles", "story-rings", "label-tiles", "offer-band", "budget-picker", "size-finder"] as const) {
      expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
    }
  });
});

describe("Themes 32–35", () => {
  it("each have at least eight sections of their own, their own pages and a sample catalog", async () => {
    const { demoCatalogFor } = await import("@/lib/demo-store");
    const cases = [
      { slug: "theme32", hero: "sparkle", types: ["look-trio", "room-shop", "category-tints", "stories"], about: /objects for modern living/i },
      { slug: "theme33", hero: "postcard", types: ["marquee", "circle-tints", "feature-slider", "scallop-band"], about: /illustrated prints/i },
      { slug: "theme34", hero: "archway", types: ["editorial-trio", "gift-note", "wave-signup", "gallery"], about: /luxe little things/i },
      { slug: "theme35", hero: "splash", types: ["pastel-tiles", "promo-trio", "pet-picker", "countdown-deals"], about: /dogs, cats and birds/i },
    ];
    for (const c of cases) {
      expect(toSiteTheme(c.slug)).toBe(c.slug);
      expect(isThemeAllowed(c.slug, "free")).toBe(true);
      const content = getDefaultSiteContent(c.slug, "Acme");
      expect(content.sections.length).toBeGreaterThanOrEqual(8);
      expect(content.sections[0].settings.imageLayout).toBe(c.hero);
      for (const t of c.types) expect(content.sections.some((x) => x.type === t)).toBe(true);
      expect(content.pages.about.body).toMatch(c.about);
      const demo = demoCatalogFor(c.slug);
      expect(demo.products.length).toBeGreaterThanOrEqual(12);
      expect(demo.products.every((p) => demo.categories.some((cat) => cat.slug === p.category))).toBe(true);
    }
    // every pet in the picker has sample products
    const picker = getDefaultSiteContent("theme35", "Acme").sections.find((x) => x.type === "pet-picker")!;
    const demo35 = demoCatalogFor("theme35");
    for (const i of [1, 2, 3]) {
      const term = picker.settings[`p${i}Term`];
      const word = new RegExp(`\\b${term}(s)?\\b`, "i");
      expect(demo35.products.some((p) => word.test(`${p.title} ${p.description} ${demo35.categories.find((c) => c.slug === p.category)?.name}`))).toBe(true);
    }
    // the room photo has a product for every dot
    const room = getDefaultSiteContent("theme32", "Acme").sections.find((x) => x.type === "room-shop")!;
    expect(demoCatalogFor("theme32").products.length).toBeGreaterThanOrEqual([1, 2, 3, 4].filter((i) => room.settings[`h${i}X`]).length);
    // no two of the four share the same run of section types
    const runs = cases.map((c) => getDefaultSiteContent(c.slug, "Acme").sections.map((x) => x.type).join(","));
    expect(new Set(runs).size).toBe(4);
    for (const type of ["look-trio", "room-shop", "circle-tints", "feature-slider", "scallop-band", "editorial-trio", "gift-note", "wave-signup", "promo-trio", "pet-picker", "pastel-tiles"] as const) {
      expect(SITE_SECTION_TYPES[type].fields.length).toBeGreaterThan(0);
    }
  });
});
