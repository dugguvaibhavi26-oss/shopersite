/**
 * Editable content of the storefront themes: homepage sections (text, photos, links), header,
 * footer, info pages, text style and colours. Every theme uses the same sections and editor
 * (/dashboard/editor); a theme decides its own look (header style, card corners) and its
 * starting content. Sellers on Growth and Pro edit it; Free shops always show the defaults.
 * Saved per store and theme in `store.themeContent[<theme slug>]`.
 */

/** The themes sellers can use, both built on these sections. */
export const SITE_THEME_SLUGS = ["classic-bloom", "mono-studio", "theme03", "theme04", "theme05", "theme06", "f01", "f02", "theme07", "theme08", "theme09", "theme10", "theme11", "theme12", "theme13", "theme14", "theme15", "theme16", "theme17", "theme18", "theme19", "theme20", "theme21", "theme22", "theme23", "theme24", "theme25", "theme26", "theme27", "theme28", "theme29", "theme30", "theme31", "theme32", "theme33", "theme34", "theme35"] as const;
export type SiteThemeSlug = (typeof SITE_THEME_SLUGS)[number];

/**
 * A theme the platform admin uploaded as a zip (see src/lib/theme-package.ts): its own name, colours, sections and
 * page text, drawn with the layout of the built-in theme it is based on.
 */
export interface CustomThemeDef {
  /** "custom-<name>", never one of the built-in slugs */
  slug: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  previewImage: string;
  previewColors: string[];
  /** the built-in theme whose layout, cards and type it uses */
  base: SiteThemeSlug;
  /** starting content, written for a shop called "Your brand" */
  content: SiteContent;
  /** sellers only see it while it is switched on */
  enabled: boolean;
  uploadedAt: string;
}

const CUSTOM_THEMES = new Map<string, CustomThemeDef>();

/** Called by the store service whenever the uploaded themes change. */
export function registerCustomThemes(defs: CustomThemeDef[]) {
  CUSTOM_THEMES.clear();
  for (const d of defs) CUSTOM_THEMES.set(d.slug, d);
}

export function getCustomTheme(slug?: string | null): CustomThemeDef | undefined {
  return slug ? CUSTOM_THEMES.get(slug) : undefined;
}

export function getCustomThemes(): CustomThemeDef[] {
  return [...CUSTOM_THEMES.values()];
}

/** The built-in theme that draws a slug: itself, an uploaded theme's base, or the default. */
export function toSiteTheme(slug?: string | null): SiteThemeSlug {
  const custom = getCustomTheme(slug);
  if (custom) return custom.base;
  return (SITE_THEME_SLUGS as readonly string[]).includes(slug || "") ? (slug as SiteThemeSlug) : "classic-bloom";
}

/** The key a shop's content and choice are saved under: an uploaded theme's own slug, or the built-in theme. */
export function themeKeyOf(slug?: string | null): string {
  return getCustomTheme(slug) ? (slug as string) : toSiteTheme(slug);
}

/** What makes each theme look like itself. Not editable: changing these means picking the other theme. */
export interface SiteThemeLook {
  /** "cells": divided lookbook bar; "simple": centred menu; "overlay": see-through over the hero, solid once you
   *  scroll; "split": menu on the left, logo in the middle, icons on the right; "bar": logo and menu on the
   *  left, icons and a solid button on the right */
  header: "cells" | "simple" | "overlay" | "split" | "bar" | "crest";
  cardRadius: string;
  footer: "dark" | "light";
  /** where section headings sit */
  headingAlign: "left" | "center";
  /** "plain": photo with name and price under it; "boxed": rounded panel with a quick-add bag button;
   *  "hover": photo card that shows Add to cart / Buy now when pointed at; "detailed": badge, stars, a line of
   *  description and colour dots; "notch": tinted panel with the price in a cut-out corner and a Buy button;
   *  "spec": white card with name, tag, a line of detail, price and Buy now above the photo; "line": a quiet photo
   *  card shaped by the line* options below; "tile": thin-bordered box with the price in the accent colour, a line of
   *  description and a square + button; "jar": rounded outlined card with the name written big above the photo, a
   *  quantity stepper and an "Add to cart – price" button; "flavor": coloured card with a label band, name in its colour,
   *  stars, description, Add to cart and Shop now; "soft": photo on a soft rounded panel with a heart and Quick view,
   *  serif name, stars and a pill button; "shadow": white card with a soft shadow, rounded photo, name and bold price;
   *  "tech": light rounded photo, sale tag, colour dots and an outlined Add to cart; "blob": product on a plate inside a
   *  soft organic colour shape with a round add button; "ethnic": tall photo, a small label above the name and the saving in
   *  the accent colour; "drape": photo with a gold corner, a centred serif name and a price pill that adds to the bag;
   *  "rated": white card with stars, the review count and a full-width Add to cart; "pastel": product on a pastel tile that
   *  changes colour card to card, serif name, price and a round + button; "print": the product framed like a print on a white
   *  or pink tile, the name in capitals over an underline; "pet": bordered card with sale and Hot badges, stars, centred
   *  name and price */
  card: "plain" | "boxed" | "hover" | "detailed" | "notch" | "spec" | "line" | "tile" | "jar" | "flavor" | "soft" | "shadow" | "tech" | "blob" | "ethnic" | "drape" | "rated" | "pastel" | "print" | "pet";
  /** "line" cards: name and price side by side ("row") or stacked ("stack") */
  lineLayout?: "row" | "stack";
  lineAlign?: "left" | "center";
  /** product name in the accent colour */
  lineAccentName?: boolean;
  /** the category above the name */
  lineCategory?: boolean;
  /** a bag button beside the price */
  lineCart?: boolean;
  /** photo shape, e.g. "1/1" or "4/5" */
  lineAspect?: string;
  /** section headings sit on a thin rule with a "» See all" link at its end */
  headingRule?: boolean;
  /** the footer wordmark in the accent colour instead of faint */
  footerWordmarkTone?: "faint" | "accent";
  /** heading weight; light themes use 400–500 */
  headingWeight?: number;
  /** the shop name written very large across the bottom of the footer */
  footerWordmark?: boolean;
  /** "bar" header: a search field beside the logo on wide screens */
  headerSearch?: boolean;
  /** product-row category tabs as round pills beside the heading, over a grid of big and small photos */
  pillTabs?: boolean;
  /** product-row category tabs as underlined words above the row */
  underlineTabs?: boolean;
  /** "bar" header: a second row with the shop's categories */
  categoryRow?: boolean;
  /** section links as small underlined capitals beside the heading */
  smallLink?: boolean;
  /** a product row's "tag" as small accent capitals above its heading */
  eyebrowTag?: boolean;
  /** slider arrows as round buttons over the row's edges */
  roundArrows?: boolean;
  /** a thin bar under sliding rows showing how far they have scrolled */
  sliderBar?: boolean;
  /** "crest" header: the menu band in this colour (soft, no gold lines) instead of the accent colour */
  bandColor?: string;
  /** "split" header in the accent colour instead of the page colour */
  headerTone?: "page" | "accent";
  /** the phone menu: the shared light list, the theme's own black panel (Theme 3), soft photo tiles (E01) or a
   *  numbered studio list on the panel colour with round category photos (Theme 07) */
  menu?: "light" | "dark" | "soft" | "studio" | "editorial" | "workshop" | "mono" | "jewel";
  /** the announcement as a slim black strip with the words sliding past (Theme 21) */
  announceReel?: boolean;
  /** About, Contact and policy pages: "plain" text column; "banner" photo banner with the title on it; "split" photo
   *  beside the text; "card" big centred title over a soft card */
  pageStyle?: "plain" | "banner" | "split" | "card";
  /** product page: "grid" photo grid beside the details; "stack" one big photo with thumbnails; "centered" photo on a
   *  panel with the details in two columns under it; "split" photo filling half the screen, details on a soft panel */
  productLayout?: "grid" | "stack" | "centered" | "split";
  /** catalog: "chips" category pills above the grid; "sidebar" category list on the left; "banner" coloured title
   *  banner with category tiles */
  catalogLayout?: "chips" | "sidebar" | "banner";
  /** About and Contact get fuller designs (src/components/storefront/site/info-pages.tsx): true = bold black bands, "soft" = soft panels */
  richPages?: boolean | "soft" | "editorial" | "studio" | "workshop" | "sneaker" | "mono" | "jewel";
  /** "Collection tiles": each category's own photo (default) or its newest product's photo (Theme 07, whose round
   *  category plates already show the category photos) */
  tilePhoto?: "category" | "newest";
}

export const SITE_THEME_STYLE: Record<SiteThemeSlug, SiteThemeLook> = {
  "classic-bloom": { pageStyle: "plain", productLayout: "grid", catalogLayout: "chips", header: "simple", cardRadius: "14px", footer: "light", headingAlign: "left", card: "plain" },
  "mono-studio": { pageStyle: "banner", productLayout: "stack", catalogLayout: "sidebar", header: "cells", cardRadius: "0px", footer: "dark", headingAlign: "left", card: "plain", menu: "mono", richPages: "mono" },
  theme03: { pageStyle: "card", productLayout: "centered", catalogLayout: "banner", header: "overlay", cardRadius: "12px", footer: "dark", headingAlign: "center", card: "boxed", richPages: true, menu: "dark" },
  theme04: { pageStyle: "split", productLayout: "split", catalogLayout: "chips", header: "split", cardRadius: "16px", footer: "dark", headingAlign: "left", card: "hover" },
  theme05: { pageStyle: "plain", productLayout: "stack", catalogLayout: "banner", header: "simple", cardRadius: "6px", footer: "light", headingAlign: "left", card: "detailed", headingWeight: 400, footerWordmark: true, menu: "editorial", richPages: "sneaker" },
  theme06: { pageStyle: "card", productLayout: "grid", catalogLayout: "sidebar", header: "bar", cardRadius: "18px", footer: "light", headingAlign: "left", card: "notch", headingWeight: 600, menu: "soft", richPages: "soft" },
  f01: { pageStyle: "split", productLayout: "centered", catalogLayout: "banner", header: "simple", cardRadius: "18px", footer: "dark", headingAlign: "left", card: "spec", headingWeight: 400 },
  f02: { pageStyle: "banner", productLayout: "split", catalogLayout: "sidebar",
    header: "bar",
    cardRadius: "4px",
    footer: "light",
    headingAlign: "left",
    card: "line",
    lineLayout: "row",
    lineCategory: true,
    lineCart: true,
    lineAspect: "1/0.9",
    headingRule: true,
    headingWeight: 400,
    menu: "workshop",
    richPages: "workshop",
  },
  theme07: { pageStyle: "split", productLayout: "stack", catalogLayout: "chips", header: "bar", cardRadius: "0px", footer: "light", headingAlign: "left", card: "line", lineLayout: "stack", lineAccentName: true, lineCart: true, lineAspect: "4/5", headingWeight: 700, menu: "studio", richPages: "studio", tilePhoto: "newest" },
  theme08: { pageStyle: "card", productLayout: "split", catalogLayout: "banner",
    header: "bar",
    cardRadius: "0px",
    footer: "light",
    headingAlign: "center",
    card: "line",
    lineLayout: "stack",
    lineAlign: "center",
    lineAccentName: true,
    lineAspect: "1/1",
    footerWordmark: true,
    footerWordmarkTone: "accent",
  },
  theme09: { pageStyle: "banner", productLayout: "centered", catalogLayout: "chips", header: "overlay", cardRadius: "0px", footer: "light", headingAlign: "center", card: "line", lineLayout: "stack", lineAspect: "1/1", headingWeight: 500 },
  theme10: { pageStyle: "card", productLayout: "grid", catalogLayout: "sidebar",
    header: "bar",
    headerSearch: true,
    cardRadius: "16px",
    footer: "dark",
    headingAlign: "left",
    card: "line",
    lineLayout: "stack",
    lineAspect: "1/1",
    pillTabs: true,
    headingWeight: 400,
  },
  theme11: { pageStyle: "banner", productLayout: "split", catalogLayout: "banner", header: "simple", cardRadius: "0px", footer: "dark", headingAlign: "left", card: "line", lineLayout: "stack", lineAspect: "1/1", headingWeight: 400 },
  theme12: { pageStyle: "split", productLayout: "stack", catalogLayout: "chips", header: "bar", cardRadius: "0px", footer: "dark", headingAlign: "center", card: "line", lineLayout: "stack", lineAspect: "4/5", headingWeight: 400 },
  theme13: { pageStyle: "card", productLayout: "centered", catalogLayout: "banner", header: "cells", cardRadius: "0px", footer: "light", headingAlign: "left", card: "tile", headingWeight: 500 },
  theme14: { pageStyle: "banner", productLayout: "grid", catalogLayout: "chips", header: "simple", cardRadius: "26px", footer: "dark", headingAlign: "center", card: "jar", headingWeight: 800 },
  theme15: { pageStyle: "split", productLayout: "split", catalogLayout: "banner", header: "split", cardRadius: "0px", footer: "dark", headingAlign: "center", card: "flavor", headingWeight: 800 },
  theme17: { pageStyle: "card", productLayout: "stack", catalogLayout: "banner", header: "simple", cardRadius: "14px", footer: "light", headingAlign: "left", card: "line", lineLayout: "stack", lineAspect: "1/1", headingWeight: 700 },
  theme18: { pageStyle: "banner", productLayout: "centered", catalogLayout: "chips", header: "bar", cardRadius: "14px", footer: "dark", headingAlign: "left", card: "shadow", headingWeight: 700 },
  theme19: { pageStyle: "split", productLayout: "split", catalogLayout: "banner", header: "split", cardRadius: "22px", footer: "dark", headingAlign: "center", card: "soft", headingWeight: 800 },
  theme20: { pageStyle: "banner", productLayout: "grid", catalogLayout: "sidebar", header: "cells", cardRadius: "18px", footer: "dark", headingAlign: "left", card: "boxed", headingWeight: 400 },
  theme24: { pageStyle: "split", productLayout: "grid", catalogLayout: "sidebar", header: "bar", cardRadius: "14px", footer: "light", headingAlign: "left", card: "tech", headingWeight: 500 },
  theme25: { pageStyle: "card", productLayout: "centered", catalogLayout: "banner", header: "bar", cardRadius: "28px", footer: "dark", headingAlign: "center", card: "blob", headingWeight: 800 },
  theme26: {
    pageStyle: "split",
    productLayout: "stack",
    catalogLayout: "chips",
    header: "simple",
    cardRadius: "18px",
    footer: "dark",
    headingAlign: "left",
    card: "line",
    lineLayout: "stack",
    lineAspect: "1/1.12",
    headingWeight: 400,
  },
  theme27: {
    pageStyle: "banner",
    productLayout: "split",
    catalogLayout: "chips",
    header: "overlay",
    cardRadius: "0px",
    footer: "dark",
    headingAlign: "left",
    card: "line",
    lineLayout: "stack",
    lineAspect: "4/5",
    underlineTabs: true,
    headingWeight: 500,
  },
  theme28: {
    pageStyle: "banner",
    productLayout: "stack",
    catalogLayout: "sidebar",
    header: "bar",
    headerSearch: true,
    categoryRow: true,
    cardRadius: "6px",
    footer: "light",
    headingAlign: "left",
    card: "ethnic",
    smallLink: true,
    roundArrows: true,
    headingWeight: 500,
  },
  theme29: {
    pageStyle: "card",
    productLayout: "centered",
    catalogLayout: "banner",
    header: "crest",
    cardRadius: "0px",
    footer: "dark",
    headingAlign: "left",
    card: "drape",
    headingRule: true,
    headingWeight: 600,
  },
  theme30: {
    pageStyle: "split",
    productLayout: "split",
    catalogLayout: "chips",
    header: "overlay",
    cardRadius: "10px",
    footer: "dark",
    headingAlign: "left",
    card: "rated",
    eyebrowTag: true,
    headingWeight: 400,
  },
  theme31: {
    pageStyle: "plain",
    productLayout: "grid",
    catalogLayout: "chips",
    header: "split",
    cardRadius: "12px",
    footer: "light",
    headingAlign: "left",
    card: "line",
    lineLayout: "stack",
    lineAspect: "4/5",
    headingWeight: 600,
  },
  theme32: {
    pageStyle: "split",
    productLayout: "centered",
    catalogLayout: "chips",
    header: "simple",
    cardRadius: "14px",
    footer: "light",
    headingAlign: "left",
    card: "pastel",
    sliderBar: true,
    headingWeight: 700,
  },
  theme33: {
    pageStyle: "card",
    productLayout: "stack",
    catalogLayout: "banner",
    header: "crest",
    bandColor: "#F3E3B3",
    cardRadius: "0px",
    footer: "light",
    headingAlign: "center",
    card: "print",
    headingWeight: 400,
  },
  theme34: {
    pageStyle: "banner",
    productLayout: "split",
    catalogLayout: "sidebar",
    header: "crest",
    bandColor: "#F7E6E8",
    cardRadius: "0px",
    footer: "dark",
    headingAlign: "center",
    card: "line",
    lineLayout: "stack",
    lineAlign: "center",
    lineAspect: "4/5",
    headingWeight: 400,
  },
  theme35: {
    pageStyle: "card",
    productLayout: "grid",
    catalogLayout: "sidebar",
    header: "bar",
    cardRadius: "10px",
    footer: "dark",
    headingAlign: "center",
    card: "pet",
    headingWeight: 700,
  },
  theme21: {
    pageStyle: "split",
    productLayout: "stack",
    catalogLayout: "sidebar",
    header: "bar",
    headerSearch: true,
    cardRadius: "0px",
    footer: "light",
    headingAlign: "left",
    card: "line",
    lineLayout: "stack",
    lineAspect: "4/5",
    headingWeight: 600,
    menu: "jewel",
    richPages: "jewel",
    announceReel: true,
  },
  theme22: {
    pageStyle: "banner",
    productLayout: "centered",
    catalogLayout: "chips",
    header: "overlay",
    cardRadius: "0px",
    footer: "light",
    headingAlign: "left",
    card: "line",
    lineLayout: "stack",
    lineAccentName: true,
    lineAspect: "1/1.05",
    headingWeight: 500,
  },
  theme23: {
    pageStyle: "card",
    productLayout: "split",
    catalogLayout: "banner",
    header: "split",
    cardRadius: "0px",
    footer: "light",
    headingAlign: "center",
    card: "line",
    lineLayout: "stack",
    lineAlign: "center",
    lineAspect: "1/1.15",
    headingWeight: 400,
  },
  theme16: { pageStyle: "card", productLayout: "stack", catalogLayout: "sidebar", header: "split", headerTone: "accent", cardRadius: "18px", footer: "dark", headingAlign: "center", card: "soft", headingWeight: 600 },
};

export type SiteSectionType =
  | "hero"
  | "collection-split"
  | "product-row"
  | "banners"
  | "categories"
  | "category-circles"
  | "collection-grid"
  | "promo-cards"
  | "statement"
  | "reviews"
  | "features"
  | "feature-cards"
  | "gallery"
  | "quote"
  | "story-split"
  | "image-text"
  | "marquee"
  | "newsletter"
  | "category-cards"
  | "offer-split"
  | "perks"
  | "about-split"
  | "category-rows"
  | "collection-tiles"
  | "brand-story"
  | "contact-block"
  | "collection-feature"
  | "stories"
  | "look-cards"
  | "colour-chips"
  | "testimonial"
  | "why-stats"
  | "category-panels"
  | "featured-product"
  | "promo-banner"
  | "brand-strip"
  | "category-spotlight"
  | "custom-order"
  | "claims-strip"
  | "product-spotlight"
  | "steps"
  | "faq"
  | "highlights"
  | "facts"
  | "category-tints"
  | "sale-banner"
  | "photo-cta"
  | "gradient-statement"
  | "wordmark-feature"
  | "tag-cloud"
  | "bento-benefits"
  | "category-strip"
  | "edge-tiles"
  | "engraving"
  | "type-collage"
  | "collection-slider"
  | "guide-row"
  | "duo-promo"
  | "offset-pair"
  | "scent-quiz"
  | "countdown-deals"
  | "spotlight-cards"
  | "review-spotlight"
  | "menu-board"
  | "tilt-gallery"
  | "combo-builder"
  | "stage"
  | "story-card"
  | "collection-collage"
  | "mission-band"
  | "impact"
  | "occasion-mosaic"
  | "promise-icons"
  | "popular-searches"
  | "weave-guide"
  | "heritage-trio"
  | "craft-timeline"
  | "collection-circles"
  | "feature-duo"
  | "coupon-banner"
  | "drape-styles"
  | "story-rings"
  | "label-tiles"
  | "offer-band"
  | "budget-picker"
  | "size-finder"
  | "look-trio"
  | "room-shop"
  | "circle-tints"
  | "feature-slider"
  | "scallop-band"
  | "editorial-trio"
  | "gift-note"
  | "wave-signup"
  | "promo-trio"
  | "pet-picker"
  | "pastel-tiles"
  | "glaze-picker"
  | "care-guide"
  | "batch-calendar"
  | "review-board"
  | "word-story"
  | "scatter-gallery"
  | "studio-prints"
  | "wood-planks"
  | "table-sizer"
  | "spec-index"
  | "drop-clock";

export interface SiteSection {
  id: string;
  type: SiteSectionType;
  hidden?: boolean;
  /** text, photo URLs and links; which keys a section uses is listed in SITE_SECTION_TYPES */
  settings: Record<string, string>;
}

export interface SitePage {
  title: string;
  body: string;
  /** photo on page layouts that show one (About and Contact) */
  image?: string;
}

export type SitePageId = "about" | "contact" | "shipping" | "returns" | "privacy" | "terms";

/** Colours, edited on the editor's Theme tab. */
export interface SiteColors {
  background: string;
  text: string;
  /** buttons, the header bag button and badges */
  accent: string;
  accentText: string;
  /** light panel behind product photos */
  panel: string;
}

/** Text and button style, edited in the editor's Sections tab under "Text & buttons". */
export interface SiteTextStyle {
  /** percent of the theme's normal size, 80–130 */
  textSize: string;
  headingFont: string;
  /** hero headings and big offer text; a condensed display font gives the poster look */
  displayFont: string;
  bodyFont: string;
  buttonShape: "pill" | "rounded" | "square";
  uppercaseHeadings: "yes" | "no";
  /** "fit": whole product on the grey panel (best for photos on white); "fill": photo covers the card */
  productPhotos: "fit" | "fill";
}

export type SiteSettings = SiteColors & SiteTextStyle;

export interface SiteContent {
  announcement: string;
  settings: SiteSettings;
  header: {
    catalogLabel: string;
    aboutLabel: string;
    contactLabel: string;
    /** "Home" link, on headers that show one */
    homeLabel: string;
    /** "Sale" link (on-sale products), on headers that show one */
    saleLabel: string;
    /** "Shop all", "Search", "Bag" and "Account" words, on headers that write them out */
    shopAllLabel: string;
    searchLabel: string;
    bagLabel: string;
    accountLabel: string;
    /** the wishlist page's name, in headers that write it out and on the page itself */
    wishlistLabel: string;
    /** "Orders" link (order tracking), on headers that show one */
    ordersLabel: string;
    searchPlaceholder: string;
    /** optional highlighted pill link in the menu, e.g. "Find your fit" */
    ctaLabel: string;
    ctaLink: string;
  };
  footer: { about: string; newsletterHeading: string; copyright: string };
  sections: SiteSection[];
  pages: Record<SitePageId, SitePage>;
  /** settings only the current theme has (see THEME_OPTIONS); always filled with the theme's defaults */
  options: Record<string, string>;
}

export interface SectionField {
  key: string;
  label: string;
  kind: "text" | "textarea" | "image" | "link" | "select" | "source";
  options?: { value: string; label: string }[];
  help?: string;
  /** part of the theme's own look (layout, side, background), so the editor doesn't offer it */
  design?: boolean;
}

const HEADING_SIZE: SectionField = {
  key: "headingSize",
  label: "Heading size",
  kind: "select",
  options: [
    { value: "s", label: "Small" },
    { value: "m", label: "Medium" },
    { value: "l", label: "Large" },
  ],
};

/** What each section type is called in the editor and which settings it has. */
export const SITE_SECTION_TYPES: Record<SiteSectionType, { label: string; description: string; fields: SectionField[] }> = {
  hero: {
    label: "Hero",
    description: "Big photo with your brand name and a button",
    fields: [
      { key: "tag", label: "Small tag above the heading", kind: "text", help: "e.g. Up to 30% off. Leave empty to hide." },
      { key: "heading", label: "Heading", kind: "textarea", help: "Press Enter to start a second line." },
      HEADING_SIZE,
      { key: "subheading", label: "Text under heading", kind: "textarea" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "image", label: "Photo", kind: "image", help: "A person or product on a plain background works best." },
      {
        key: "imageLayout",
        design: true,
        label: "Photo layout",
        kind: "select",
        options: [
          { value: "column", label: "In the middle (portrait photos)" },
          { value: "full", label: "Full width (wide photos)" },
          { value: "center", label: "Full width, text in the centre" },
          { value: "split", label: "Text left, rounded photo right" },
          { value: "panel", label: "Grey panel, product photo right" },
          { value: "notch", label: "Big rounded photo, shop name on it, a product card beside" },
          { value: "showcase", label: "Huge shop name, a product photo in the middle, two link tiles" },
          { value: "banner", label: "Shop name across the top, a wide photo under it, quote lines below" },
          { value: "split-word", label: "Shop name and a small photo card on the left, a tall photo on the right" },
          { value: "poster", label: "Tall shop name on the left, a product photo on the right" },
          { value: "bento", label: "Big rounded photo with the heading on it, two photo tiles beside" },
          { value: "spec", label: "Product name in big letters, the photo over an outline word, a row of details" },
          { value: "duo", label: "Your top product on a colour panel, a big photo with your name beside" },
          { value: "block", label: "Big name on a colour block, a photo beside it" },
          { value: "framed", label: "Rounded colour panel with the heading and a rounded photo inside" },
          { value: "pop", label: "Full photo with a chunky heading on the left" },
          { value: "checklist", label: "Colour panel with a heading and a list of points, a photo with your top product on it" },
          { value: "blob", label: "Heading on the left, the photo in a soft rounded shape on the right" },
          { value: "glow", label: "Rounded photo with the heading and button on it" },
          { value: "carton", label: "Colour panel with a two-line heading, a floating product photo and a round badge" },
          { value: "wordmark", label: "Big photo with your shop name written huge across the top" },
          { value: "look", label: "Wide photo with the heading at the bottom left and a Shop the look button" },
          { value: "inset", label: "Heading on white beside a large photo that fills the right side" },
          { value: "peek", label: "Sliding rounded photos with the next ones peeking in at the sides" },
          { value: "feast", label: "Full photo with a big centred heading and a round sticker" },
          { value: "fan", label: "Your products' photos fanned out in tilted cards" },
          { value: "maker", label: "Full photo with the heading at the bottom and moving text under it" },
          { value: "carousel", label: "Photo slides with arrows at the sides and the heading on the left" },
          { value: "numbered", label: "Photo slides with numbers and arrows at the bottom" },
          { value: "arches", label: "Four photos in arched windows with your name over them" },
          { value: "boutique", label: "Heading with highlighted words, two buttons and a rounded photo on the right" },
          { value: "sparkle", label: "Heading on a soft colour panel with a sparkle, a rounded photo beside it" },
          { value: "postcard", label: "Two photos side by side with a card in the middle; arrows swap to the tile photos" },
          { value: "archway", label: "A background photo, a photo on each side and an arch in the accent colour in the middle" },
          { value: "splash", label: "Bright colour band with paw prints, a tall heading, the photo in a circle and a wavy edge" },
        ],
      },
      { key: "points", label: "List of points", kind: "textarea", help: "One per line, shown with a tick. Shows on layouts that have a list." },
      { key: "ticker", label: "Moving text under the photo", kind: "text", help: "Separate with ·. Shows on layouts that have it." },
      { key: "outline", label: "Outline word behind the photo", kind: "text", help: "e.g. RUN. Shows on layouts that have one." },
      { key: "spec1Label", label: "Detail 1: label", kind: "text", help: "A row of details under the hero, e.g. Model. Leave empty to hide." },
      { key: "spec1Value", label: "Detail 1: value", kind: "text" },
      { key: "spec2Label", label: "Detail 2: label", kind: "text" },
      { key: "spec2Value", label: "Detail 2: value", kind: "text" },
      { key: "spec3Label", label: "Detail 3: label", kind: "text" },
      { key: "spec3Value", label: "Detail 3: value", kind: "text" },
      { key: "spec4Label", label: "Detail 4: label", kind: "text" },
      { key: "spec4Value", label: "Detail 4: value", kind: "text" },
      { key: "tile1Image", label: "Tile 1: photo", kind: "image", help: "Small dark tiles beside the hero, on layouts that have them." },
      { key: "tile1Label", label: "Tile 1: text", kind: "text" },
      { key: "tile1Link", label: "Tile 1: link", kind: "link" },
      { key: "tile2Image", label: "Tile 2: photo", kind: "image" },
      { key: "tile2Label", label: "Tile 2: text", kind: "text" },
      { key: "tile2Link", label: "Tile 2: link", kind: "link" },
      { key: "tile3Image", label: "Tile 3: photo", kind: "image", help: "A fourth photo, on layouts that show four." },
      { key: "stat", label: "Big number in the corner", kind: "text", help: "e.g. 70+. Shows on layouts that have a corner box." },
      { key: "statLabel", label: "Text under the number", kind: "text", help: "e.g. Trusted brands" },
      { key: "secondButtonLabel", label: "Second button text", kind: "text", help: "Optional outline button next to the first." },
      { key: "secondButtonLink", label: "Second button link", kind: "link" },
      { key: "spotSource", label: "Product on the small card", kind: "source", help: "On layouts with a product card beside the photo." },
      { key: "spotButton", label: "Small card: button word", kind: "text", help: "Shown before the price, e.g. Buy." },
    ],
  },
  "collection-split": {
    label: "Collection",
    description: "Two photos side by side with your category names",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "subheading", label: "Small text", kind: "text" },
      { key: "leftImage", label: "Left photo", kind: "image" },
      { key: "rightImage", label: "Right photo", kind: "image" },
      { key: "link", label: "Link", kind: "link" },
    ],
  },
  "product-row": {
    label: "Product row",
    description: "A row or grid of products",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "subheading", label: "Text under heading", kind: "text" },
      { key: "source", label: "Products to show", kind: "source" },
      { key: "badge", label: "Sticker beside the heading", kind: "text", help: "e.g. Free delivery over ₹499. Leave empty to hide." },
      { key: "tag", label: "Small text above the heading", kind: "text", help: "e.g. Trending now. Shows on layouts with a heading beside the products." },
      {
        key: "display",
        design: true,
        label: "Show as",
        kind: "select",
        options: [
          { value: "slider", label: "Sliding row" },
          { value: "grid", label: "Grid of 8" },
          { value: "tabs", label: "Category tabs" },
          { value: "mosaic", label: "Mosaic of big and small photos" },
          { value: "beside", label: "Heading on the left, four products beside it" },
        ],
      },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      {
        key: "tone",
        design: true,
        label: "Background",
        kind: "select",
        options: [
          { value: "light", label: "Page colour" },
          { value: "dark", label: "Dark band" },
        ],
      },
      { key: "promoImage", label: "Promo tile: photo", kind: "image", help: "Optional last tile in the row. Leave empty to hide it." },
      { key: "promoText", label: "Promo tile: text", kind: "text" },
      { key: "promoButton", label: "Promo tile: button text", kind: "text" },
      { key: "promoLink", label: "Promo tile: link", kind: "link" },
      { key: "allLabel", label: "First tab name", kind: "text", help: "The tab that shows everything, on layouts with category tabs." },
      {
        key: "limit",
        label: "Products to show",
        kind: "select",
        help: "How many products the row or grid shows.",
        options: [
          { value: "4", label: "4" },
          { value: "5", label: "5" },
          { value: "6", label: "6" },
          { value: "8", label: "8" },
          { value: "12", label: "12" },
        ],
      },
    ],
  },
  banners: {
    label: "Banner slider",
    description: "Wide photos that slide one after another",
    fields: [1, 2, 3, 4].flatMap((n): SectionField[] => [
      { key: `slide${n}Image`, label: `Slide ${n}: photo`, kind: "image", help: n === 1 ? "Wide photos work best (3:1). Leave a slide empty to skip it." : undefined },
      { key: `slide${n}Link`, label: `Slide ${n}: opens`, kind: "link" },
    ]),
  },
  categories: {
    label: "Category tiles",
    description: "Large photo tiles of your categories",
    fields: [{ key: "heading", label: "Heading", kind: "text" }, HEADING_SIZE],
  },
  "category-circles": {
    label: "Category circles",
    description: "Round category photos in a sliding row",
    fields: [{ key: "heading", label: "Heading", kind: "text", help: "Leave empty to show only the circles." }, HEADING_SIZE],
  },
  "promo-cards": {
    label: "Promo cards",
    description: "Two tall photo cards and two offer cards with a button each",
    fields: [
      { key: "c1Image", label: "Card 1: photo", kind: "image" },
      { key: "c1Button", label: "Card 1: button text", kind: "text" },
      { key: "c1Link", label: "Card 1: link", kind: "link" },
      { key: "c2Image", label: "Card 2: photo", kind: "image" },
      { key: "c2Button", label: "Card 2: button text", kind: "text" },
      { key: "c2Link", label: "Card 2: link", kind: "link" },
      { key: "c3Label", label: "Card 3: small text", kind: "text" },
      { key: "c3Heading", label: "Card 3: heading", kind: "text" },
      { key: "c3Image", label: "Card 3: photo", kind: "image" },
      { key: "c3Button", label: "Card 3: button text", kind: "text" },
      { key: "c3Link", label: "Card 3: link", kind: "link" },
      { key: "c4Label", label: "Card 4: small text", kind: "text" },
      { key: "c4Heading", label: "Card 4: heading", kind: "text" },
      { key: "c4Image", label: "Card 4: photo", kind: "image" },
      { key: "c4Button", label: "Card 4: button text", kind: "text" },
      { key: "c4Link", label: "Card 4: link", kind: "link" },
    ],
  },
  reviews: {
    label: "Customer reviews",
    description: "A sliding row of your shop's real reviews",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "subheading", label: "Small text above", kind: "text", help: "e.g. ★★★★★" },
    ],
  },
  features: {
    label: "Feature list",
    description: "A big photo with points people can open for more",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "image", label: "Photo", kind: "image" },
      { key: "f1Title", label: "Point 1: title", kind: "text" },
      { key: "f1Text", label: "Point 1: text", kind: "textarea" },
      { key: "f2Title", label: "Point 2: title", kind: "text" },
      { key: "f2Text", label: "Point 2: text", kind: "textarea" },
      { key: "f3Title", label: "Point 3: title", kind: "text" },
      { key: "f3Text", label: "Point 3: text", kind: "textarea" },
      { key: "f4Title", label: "Point 4: title", kind: "text" },
      { key: "f4Text", label: "Point 4: text", kind: "textarea" },
      { key: "f5Title", label: "Point 5: title", kind: "text" },
      { key: "f5Text", label: "Point 5: text", kind: "textarea" },
      { key: "f6Title", label: "Point 6: title", kind: "text" },
      { key: "f6Text", label: "Point 6: text", kind: "textarea" },
    ],
  },
  "feature-cards": {
    label: "Detail cards",
    description: "Three photos, each with a title and a line of text",
    fields: [
      { key: "eyebrow", label: "Small text above", kind: "text" },
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "d1Image", label: "Card 1: photo", kind: "image" },
      { key: "d1Title", label: "Card 1: title", kind: "text" },
      { key: "d1Text", label: "Card 1: text", kind: "textarea" },
      { key: "d2Image", label: "Card 2: photo", kind: "image" },
      { key: "d2Title", label: "Card 2: title", kind: "text" },
      { key: "d2Text", label: "Card 2: text", kind: "textarea" },
      { key: "d3Image", label: "Card 3: photo", kind: "image" },
      { key: "d3Title", label: "Card 3: title", kind: "text" },
      { key: "d3Text", label: "Card 3: text", kind: "textarea" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
  },
  gallery: {
    label: "Photo row",
    description: "A sliding row of photos, e.g. customers wearing your pieces",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "buttonLabel", label: "Button text", kind: "text", help: "e.g. Follow us. Links to your Instagram if no link is set." },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "g1Image", label: "Photo 1", kind: "image" },
      { key: "g1Caption", label: "Photo 1: caption", kind: "text" },
      { key: "g2Image", label: "Photo 2", kind: "image" },
      { key: "g2Caption", label: "Photo 2: caption", kind: "text" },
      { key: "g3Image", label: "Photo 3", kind: "image" },
      { key: "g3Caption", label: "Photo 3: caption", kind: "text" },
      { key: "g4Image", label: "Photo 4", kind: "image" },
      { key: "g4Caption", label: "Photo 4: caption", kind: "text" },
      { key: "g5Image", label: "Photo 5", kind: "image" },
      { key: "g5Caption", label: "Photo 5: caption", kind: "text" },
      { key: "g6Image", label: "Photo 6", kind: "image" },
      { key: "g6Caption", label: "Photo 6: caption", kind: "text" },
    ],
  },
  quote: {
    label: "Press quote",
    description: "A big quote with up to three names under it",
    fields: [
      { key: "outlet", label: "Who said it, written big (optional)", kind: "text", help: "e.g. the magazine's name. Shows above a smaller quote." },
      { key: "text", label: "Quote", kind: "textarea" },
      { key: "names", label: "Names under it", kind: "text", help: "Separate with ·, e.g. Vogue · Elle · GQ" },
    ],
  },
  "story-split": {
    label: "Story panels",
    description: "Photo, a black panel with big text, and a short story with a button",
    fields: [
      { key: "image", label: "Photo", kind: "image" },
      { key: "label", label: "Small label", kind: "text", help: "e.g. Featured" },
      { key: "bigText", label: "Big text on black", kind: "textarea" },
      { key: "text", label: "Story", kind: "textarea" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
  },
  "category-cards": {
    label: "Category cards",
    description: "Your categories as soft cards with their photo and name",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "subheading", label: "Text under heading", kind: "text" },
      { key: "buttonLabel", label: "Link text", kind: "text", help: "e.g. Check all categories" },
      { key: "buttonShort", label: "Link text on phones", kind: "text", help: "A shorter version for small screens." },
    ],
  },
  "offer-split": {
    label: "Offer with photo",
    description: "A big photo beside a soft card with an offer and a button",
    fields: [
      { key: "image", label: "Photo", kind: "image" },
      { key: "eyebrow", label: "Small text above", kind: "text", help: "e.g. Limited time only" },
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "panelImage", label: "Card background (optional)", kind: "image" },
      { key: "highlightLabel", label: "Small text before the big number", kind: "text", help: "e.g. up to" },
      { key: "highlight", label: "Big number", kind: "text", help: "e.g. 15%. Leave empty to hide." },
      { key: "note", label: "Small print", kind: "text", help: "e.g. Offer ends this month" },
      {
        key: "tone",
        design: true,
        label: "Card colour",
        kind: "select",
        options: [
          { value: "light", label: "Soft" },
          { value: "dark", label: "Dark" },
        ],
      },
      {
        key: "imageSide",
        design: true,
        label: "Photo side",
        kind: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
    ],
  },
  "about-split": {
    label: "About with photos",
    description: "A two-line heading, a tall photo, a wide photo and your story",
    fields: [
      { key: "label", label: "Small label on the right", kind: "text", help: "e.g. 01/ About us" },
      { key: "heading", label: "Heading", kind: "textarea", help: "Put words between * * to show them in the softer colour." },
      HEADING_SIZE,
      { key: "image", label: "Tall photo", kind: "image" },
      { key: "image2", label: "Wide photo", kind: "image" },
      { key: "text", label: "Text", kind: "textarea" },
      { key: "text2", label: "Second paragraph", kind: "textarea" },
      { key: "linkLabel", label: "Link text", kind: "text" },
      { key: "linkLink", label: "Link goes to", kind: "link" },
    ],
  },
  "category-rows": {
    label: "Category rows",
    description: "Each category on its own row, with a few of its products beside the name",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "buttonLabel", label: "Link text", kind: "text", help: "e.g. See all" },
    ],
  },
  "collection-tiles": {
    label: "Collection tiles",
    description: "Three tall photos of your categories with their names under them",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text beside the heading", kind: "textarea" },
      { key: "buttonLabel", label: "Link text", kind: "text", help: "e.g. All collections" },
    ],
  },
  "brand-story": {
    label: "Brand story",
    description: "Your story with two photos, plus a sign-up box",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "image", label: "Portrait photo", kind: "image" },
      { key: "text", label: "Story", kind: "textarea" },
      { key: "image2", label: "Second photo", kind: "image" },
      { key: "newsHeading", label: "Sign-up heading", kind: "textarea", help: "Leave empty to hide the sign-up box." },
      { key: "newsText", label: "Sign-up text", kind: "textarea" },
      { key: "newsButton", label: "Sign-up button", kind: "text" },
    ],
  },
  "contact-block": {
    label: "Contact details",
    description: "A photo beside your phone, email, opening hours and social links",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "image", label: "Photo", kind: "image" },
      { key: "hours", label: "Opening hours", kind: "textarea", help: "One line each, e.g. Mon–Fri: 10:00–20:00" },
      { key: "text", label: "Extra note", kind: "textarea" },
    ],
    // phone, email, WhatsApp and Instagram come from Settings
  },
  "collection-feature": {
    label: "Collection feature",
    description: "A soft panel with one product and a few words, beside a big photo",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "productImage", label: "Product photo", kind: "image" },
      { key: "text", label: "Text", kind: "textarea" },
      { key: "buttonLabel", label: "Link text", kind: "text" },
      { key: "buttonLink", label: "Link goes to", kind: "link" },
      { key: "image", label: "Big photo", kind: "image" },
      {
        key: "imageSide",
        design: true,
        label: "Big photo side",
        kind: "select",
        options: [
          { value: "right", label: "Right" },
          { value: "left", label: "Left" },
        ],
      },
    ],
  },
  stories: {
    label: "Stories",
    description: "One big story and three smaller ones, like a journal",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "buttonLabel", label: "Link text", kind: "text", help: "e.g. Read all" },
      { key: "buttonLink", label: "Link goes to", kind: "link" },
      { key: "s1Image", label: "Story 1: photo", kind: "image" },
      { key: "s1Tag", label: "Story 1: topic", kind: "text" },
      { key: "s1Title", label: "Story 1: title", kind: "text" },
      { key: "s1Link", label: "Story 1: link", kind: "link" },
      { key: "s2Image", label: "Story 2: photo", kind: "image" },
      { key: "s2Tag", label: "Story 2: topic", kind: "text" },
      { key: "s2Title", label: "Story 2: title", kind: "text" },
      { key: "s2Link", label: "Story 2: link", kind: "link" },
      { key: "s3Image", label: "Story 3: photo", kind: "image" },
      { key: "s3Tag", label: "Story 3: topic", kind: "text" },
      { key: "s3Title", label: "Story 3: title", kind: "text" },
      { key: "s3Link", label: "Story 3: link", kind: "link" },
      { key: "s4Image", label: "Story 4: photo", kind: "image" },
      { key: "s4Tag", label: "Story 4: topic", kind: "text" },
      { key: "s4Title", label: "Story 4: title", kind: "text" },
      { key: "s4Link", label: "Story 4: link", kind: "link" },
    ],
  },
  "look-cards": {
    label: "Look cards",
    description: "A heading and a few words beside two photo cards with a caption each",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "l1Image", label: "Card 1: photo", kind: "image" },
      { key: "l1Title", label: "Card 1: caption", kind: "textarea" },
      { key: "l1Link", label: "Card 1: link", kind: "link" },
      { key: "l2Image", label: "Card 2: photo", kind: "image" },
      { key: "l2Title", label: "Card 2: caption", kind: "textarea" },
      { key: "l2Link", label: "Card 2: link", kind: "link" },
    ],
  },
  "colour-chips": {
    label: "Shop by colour",
    description: "Round colour chips; each one opens your shop's page for that colour",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      {
        key: "colours",
        label: "Colours",
        kind: "textarea",
        help: "One per line: the colour name and its code, e.g. Red #E5604D. Buyers see products whose name or description has that word.",
      },
    ],
  },
  testimonial: {
    label: "Testimonial",
    description: "A customer's words over a wide photo",
    fields: [
      { key: "label", label: "Small text above", kind: "text", help: "e.g. What people said" },
      { key: "heading", label: "Big words", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Their review", kind: "textarea" },
      { key: "name", label: "Name", kind: "text" },
      { key: "role", label: "Under the name", kind: "text", help: "e.g. Verified buyer" },
      { key: "image", label: "Photo", kind: "image", help: "A wide photo with space on the left for the words." },
    ],
  },
  "why-stats": {
    label: "Why shop with us",
    description: "A heading and text above a wide photo with three numbers on it",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "image", label: "Photo", kind: "image" },
      { key: "n1Value", label: "Number 1", kind: "text", help: "e.g. 24–48h" },
      { key: "n1Label", label: "Number 1: title", kind: "text" },
      { key: "n1Text", label: "Number 1: text", kind: "text" },
      { key: "n2Value", label: "Number 2", kind: "text" },
      { key: "n2Label", label: "Number 2: title", kind: "text" },
      { key: "n2Text", label: "Number 2: text", kind: "text" },
      { key: "n3Value", label: "Number 3", kind: "text" },
      { key: "n3Label", label: "Number 3: title", kind: "text" },
      { key: "n3Text", label: "Number 3: text", kind: "text" },
    ],
  },
  "category-panels": {
    label: "Category panels",
    description: "Your first three categories on soft coloured panels, each with a button",
    fields: [
      { key: "heading", label: "Heading", kind: "text", help: "Leave empty to show only the panels." },
      HEADING_SIZE,
      { key: "buttonLabel", label: "Button text", kind: "text" },
    ],
  },
  "featured-product": {
    label: "Featured product",
    description: "A heading and text beside one big product, with three more under it",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "source", label: "Products to show", kind: "source" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      {
        key: "style",
        design: true,
        label: "Layout",
        kind: "select",
        options: [
          { value: "split", label: "One big product with three more under it" },
          { value: "drops", label: "Numbered list of new pairs; the one picked shows big" },
        ],
      },
      { key: "badge", label: "Sticker on the big photo", kind: "text", help: "Numbered list layout, e.g. Just in." },
    ],
  },
  "promo-banner": {
    label: "Promo banner",
    description: "A wide photo with a big heading and a button on it",
    fields: [
      { key: "image", label: "Photo", kind: "image" },
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "text" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
  },
  "brand-strip": {
    label: "Brand names",
    description: "A row of the brands you sell, each in its own lettering",
    fields: [{ key: "names", label: "Brand names", kind: "text", help: "Separate with ·, e.g. Kestrel · Orbit · Nimbus" }],
  },
  "category-spotlight": {
    label: "Category spotlight",
    description: "A category name with one of its products, beside two photos",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "source", label: "Product to show", kind: "source", help: "The first product from here sits under the heading." },
      { key: "image", label: "Middle photo", kind: "image" },
      { key: "image2", label: "Right photo", kind: "image" },
      { key: "buttonLabel", label: "Link text", kind: "text" },
      { key: "buttonLink", label: "Link goes to", kind: "link" },
    ],
  },
  "custom-order": {
    label: "Make your own",
    description: "Buyers pick options from a few lists and send the order to you on WhatsApp",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "noteLabel", label: "Sticker text", kind: "text", help: "e.g. Important note" },
      { key: "note", label: "Note beside the heading", kind: "textarea" },
      { key: "o1Label", label: "List 1: name", kind: "text", help: "e.g. Size. Leave empty to hide the list." },
      { key: "o1Options", label: "List 1: choices", kind: "text", help: "Separate with commas" },
      { key: "o2Label", label: "List 2: name", kind: "text" },
      { key: "o2Options", label: "List 2: choices", kind: "text" },
      { key: "o3Label", label: "List 3: name", kind: "text" },
      { key: "o3Options", label: "List 3: choices", kind: "text" },
      { key: "o4Label", label: "List 4: name", kind: "text" },
      { key: "o4Options", label: "List 4: choices", kind: "text" },
      { key: "image", label: "Photo", kind: "image" },
      { key: "buttonLabel", label: "Button text", kind: "text", help: "Sends the choices to your WhatsApp number from Settings." },
    ],
  },
  "claims-strip": {
    label: "Claims strip",
    description: "A row of boxed words about your products, like Organic or Low sugar",
    fields: [{ key: "text", label: "Words", kind: "text", help: "Separate with ·" }],
  },
  "product-spotlight": {
    label: "Product spotlight",
    description: "One product big, with stars, price, quantity, Add to cart, its details and reviews",
    fields: [
      { key: "source", label: "Product to show", kind: "source", help: "The first product from here is shown." },
      { key: "image", label: "Photo (optional)", kind: "image", help: "Leave empty to use the product's own photo." },
      {
        key: "style",
        design: true,
        label: "Layout",
        kind: "select",
        options: [
          { value: "wide", label: "Wide photo, tabs with details and reviews" },
          { value: "boutique", label: "Framed photo, quiet details and one review" },
        ],
      },
      { key: "label", label: "Small label above the name", kind: "text", help: "Framed layout, e.g. The icon." },
      { key: "buttonLabel", label: "Button", kind: "text", help: "Framed layout, e.g. Add to bag." },
      { key: "linkLabel", label: "Link to the product page", kind: "text", help: "Framed layout, e.g. View details." },
    ],
  },
  steps: {
    label: "How it works",
    description: "Three or four numbered steps, with an optional photo",
    fields: [
      { key: "eyebrow", label: "Small text above", kind: "text" },
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "image", label: "Photo (optional)", kind: "image" },
      { key: "s1Title", label: "Step 1: title", kind: "text" },
      { key: "s1Text", label: "Step 1: text", kind: "textarea" },
      { key: "s2Title", label: "Step 2: title", kind: "text" },
      { key: "s2Text", label: "Step 2: text", kind: "textarea" },
      { key: "s3Title", label: "Step 3: title", kind: "text" },
      { key: "s3Text", label: "Step 3: text", kind: "textarea" },
      { key: "s4Title", label: "Step 4: title", kind: "text", help: "Leave empty for three steps." },
      { key: "s4Text", label: "Step 4: text", kind: "textarea" },
    ],
  },
  faq: {
    label: "Questions",
    description: "Common questions that open to show the answer",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text under heading", kind: "textarea" },
      { key: "q1", label: "Question 1", kind: "text" },
      { key: "a1", label: "Answer 1", kind: "textarea" },
      { key: "q2", label: "Question 2", kind: "text" },
      { key: "a2", label: "Answer 2", kind: "textarea" },
      { key: "q3", label: "Question 3", kind: "text" },
      { key: "a3", label: "Answer 3", kind: "textarea" },
      { key: "q4", label: "Question 4", kind: "text" },
      { key: "a4", label: "Answer 4", kind: "textarea" },
      { key: "q5", label: "Question 5", kind: "text" },
      { key: "a5", label: "Answer 5", kind: "textarea" },
      {
        key: "style",
        label: "Style",
        kind: "select",
        options: [
          { value: "list", label: "A simple list" },
          { value: "cards", label: "Numbered cards with a help card beside them" },
        ],
      },
      { key: "helpTitle", label: "Help card: heading", kind: "text", help: "On the card style." },
      { key: "helpText", label: "Help card: text", kind: "textarea" },
      { key: "helpButton", label: "Help card: button", kind: "text", help: "Opens WhatsApp when your shop has a number, otherwise your Contact page." },
    ],
  },
  highlights: {
    label: "Highlights",
    description: "Four photos with a title and a line each, e.g. ingredients or materials",
    fields: [
      { key: "eyebrow", label: "Small text above", kind: "text" },
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "h1Image", label: "Item 1: photo", kind: "image" },
      { key: "h1Title", label: "Item 1: title", kind: "text" },
      { key: "h1Text", label: "Item 1: text", kind: "textarea" },
      { key: "h2Image", label: "Item 2: photo", kind: "image" },
      { key: "h2Title", label: "Item 2: title", kind: "text" },
      { key: "h2Text", label: "Item 2: text", kind: "textarea" },
      { key: "h3Image", label: "Item 3: photo", kind: "image" },
      { key: "h3Title", label: "Item 3: title", kind: "text" },
      { key: "h3Text", label: "Item 3: text", kind: "textarea" },
      { key: "h4Image", label: "Item 4: photo", kind: "image" },
      { key: "h4Title", label: "Item 4: title", kind: "text" },
      { key: "h4Text", label: "Item 4: text", kind: "textarea" },
    ],
  },
  facts: {
    label: "Facts panel",
    description: "A photo beside a list of facts, like nutrition or tech specs",
    fields: [
      { key: "eyebrow", label: "Small text above", kind: "text" },
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "image", label: "Photo", kind: "image" },
      { key: "rows", label: "Facts", kind: "textarea", help: "One per line as Name: value, e.g. Calories: 35" },
      { key: "note", label: "Small print", kind: "text" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
  },
  "category-tints": {
    label: "Category tiles (colours)",
    description: "Your first four categories on soft colour tiles with their photo",
    fields: [{ key: "buttonLabel", label: "Link text", kind: "text", help: "e.g. Shop" }],
  },
  "sale-banner": {
    label: "Sale banner",
    description: "A soft rounded banner with an offer, a button and a product photo",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "text" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "image", label: "Product photo", kind: "image" },
    ],
  },
  "photo-cta": {
    label: "Photo with button",
    description: "A big rounded photo with one button on it",
    fields: [
      { key: "image", label: "Photo", kind: "image" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
  },
  "gradient-statement": {
    label: "Statement strip",
    description: "A short heading and line of text on a soft colour fade",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
    ],
  },
  "wordmark-feature": {
    label: "Big word feature",
    description: "A huge word with a product photo over it and a small card",
    fields: [
      { key: "word", label: "Big word", kind: "text", help: "e.g. a product line name. Keep it short." },
      { key: "image", label: "Photo", kind: "image", help: "A product on a plain background works best." },
      { key: "label", label: "Card: small text", kind: "text", help: "e.g. New product" },
      { key: "text", label: "Card: text", kind: "text" },
      { key: "buttonLabel", label: "Card: button text", kind: "text" },
      { key: "buttonLink", label: "Card: button link", kind: "link" },
    ],
  },
  "tag-cloud": {
    label: "Colour tags",
    description: "Two moving rows of colourful tags, like High protein or No added sugar",
    fields: [{ key: "text", label: "Tags", kind: "text", help: "Separate with ·" }],
  },
  "bento-benefits": {
    label: "Benefit grid",
    description: "Three colour cards with a benefit each, mixed with four photos",
    fields: [
      { key: "eyebrow", label: "Small label", kind: "text", help: "e.g. Benefits" },
      { key: "heading", label: "Heading", kind: "textarea", help: "Put words between * * to set them lighter." },
      HEADING_SIZE,
      { key: "b1Title", label: "Card 1: title", kind: "text" },
      { key: "b1Text", label: "Card 1: text", kind: "textarea" },
      { key: "b2Title", label: "Card 2: title", kind: "text" },
      { key: "b2Text", label: "Card 2: text", kind: "textarea" },
      { key: "b3Title", label: "Card 3: title", kind: "text" },
      { key: "b3Text", label: "Card 3: text", kind: "textarea" },
      { key: "p1Image", label: "Photo 1", kind: "image" },
      { key: "p2Image", label: "Photo 2", kind: "image" },
      { key: "p3Image", label: "Photo 3", kind: "image" },
      { key: "p4Image", label: "Photo 4", kind: "image" },
    ],
  },
  "category-strip": {
    label: "Category strip",
    description: "A sliding row of square category tiles with a heading and a line of text",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text beside the heading", kind: "textarea" },
      {
        key: "align",
        label: "Layout",
        kind: "select",
        options: [
          { value: "left", label: "Heading on the left" },
          { value: "center", label: "Everything in the middle" },
        ],
      },
    ],
  },
  "edge-tiles": {
    label: "Photo tiles (edge to edge)",
    description: "Two to four tall photos side by side across the full width, each with a title and a link",
    fields: [
      { key: "t1Image", label: "Tile 1: photo", kind: "image" },
      { key: "t1Title", label: "Tile 1: title", kind: "text" },
      { key: "t1Button", label: "Tile 1: link text", kind: "text" },
      { key: "t1Link", label: "Tile 1: link", kind: "link" },
      { key: "t2Image", label: "Tile 2: photo", kind: "image" },
      { key: "t2Title", label: "Tile 2: title", kind: "text" },
      { key: "t2Button", label: "Tile 2: link text", kind: "text" },
      { key: "t2Link", label: "Tile 2: link", kind: "link" },
      { key: "t3Image", label: "Tile 3: photo", kind: "image" },
      { key: "t3Title", label: "Tile 3: title", kind: "text" },
      { key: "t3Button", label: "Tile 3: link text", kind: "text" },
      { key: "t3Link", label: "Tile 3: link", kind: "link" },
      { key: "t4Image", label: "Tile 4: photo", kind: "image" },
      { key: "t4Title", label: "Tile 4: title", kind: "text" },
      { key: "t4Button", label: "Tile 4: link text", kind: "text" },
      { key: "t4Link", label: "Tile 4: link", kind: "link" },
    ],
  },
  engraving: {
    label: "Engraving preview",
    description: "Buyers type their words and see them on the piece, then ask you about it on WhatsApp",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "image", label: "Photo of the piece", kind: "image", help: "A plain area in the middle works best for the preview text." },
      { key: "placeholder", label: "Sample words", kind: "text", help: "e.g. A + R" },
      { key: "buttonLabel", label: "Button text", kind: "text", help: "Sends the words to your WhatsApp number from Settings." },
    ],
  },
  "type-collage": {
    label: "Type collage",
    description: "Big lines of type with a product photo set among them and two small notes",
    fields: [
      { key: "line1", label: "Line 1", kind: "text" },
      { key: "line2", label: "Line 2", kind: "text", help: "Put words between * * to set them in italics." },
      { key: "line3", label: "Line 3", kind: "text" },
      { key: "image", label: "Photo", kind: "image", help: "A product on a plain background." },
      { key: "noteLeft", label: "Small note, left", kind: "textarea" },
      { key: "noteRight", label: "Small note, right", kind: "textarea" },
    ],
  },
  "collection-slider": {
    label: "Collection slider",
    description: "A heading, a few words and a button on the left, products sliding on the right",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "source", label: "Products to show", kind: "source" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      {
        key: "align",
        label: "Layout",
        kind: "select",
        options: [
          { value: "left", label: "Heading on the left" },
          { value: "center", label: "Everything in the middle" },
        ],
      },
    ],
  },
  "guide-row": {
    label: "Guide cards",
    description: "A row of photo cards of different heights, each with a short title",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "g1Image", label: "Card 1: photo", kind: "image" },
      { key: "g1Title", label: "Card 1: title", kind: "text" },
      { key: "g1Link", label: "Card 1: link", kind: "link" },
      { key: "g2Image", label: "Card 2: photo", kind: "image" },
      { key: "g2Title", label: "Card 2: title", kind: "text" },
      { key: "g2Link", label: "Card 2: link", kind: "link" },
      { key: "g3Image", label: "Card 3: photo", kind: "image" },
      { key: "g3Title", label: "Card 3: title", kind: "text" },
      { key: "g3Link", label: "Card 3: link", kind: "link" },
      { key: "g4Image", label: "Card 4: photo", kind: "image" },
      { key: "g4Title", label: "Card 4: title", kind: "text" },
      { key: "g4Link", label: "Card 4: link", kind: "link" },
    ],
  },
  "duo-promo": {
    label: "Two promos",
    description: "A big photo card with a heading and a smaller photo card beside it",
    fields: [
      { key: "image", label: "Big card: photo", kind: "image" },
      { key: "eyebrow", label: "Big card: small text", kind: "text" },
      { key: "heading", label: "Big card: heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "buttonLabel", label: "Big card: link text", kind: "text" },
      { key: "buttonLink", label: "Big card: link", kind: "link" },
      { key: "smallImage", label: "Small card: photo", kind: "image" },
      { key: "smallTitle", label: "Small card: title", kind: "text" },
      { key: "smallButton", label: "Small card: link text", kind: "text" },
      { key: "smallLink", label: "Small card: link", kind: "link" },
    ],
  },
  "offset-pair": {
    label: "Two stories",
    description: "Two photos at different heights, each with a small label, a title and a link",
    fields: [
      { key: "aImage", label: "Story 1: photo", kind: "image" },
      { key: "aEyebrow", label: "Story 1: small text", kind: "text" },
      { key: "aTitle", label: "Story 1: title", kind: "text" },
      { key: "aButton", label: "Story 1: link text", kind: "text" },
      { key: "aLink", label: "Story 1: link", kind: "link" },
      { key: "bImage", label: "Story 2: photo", kind: "image" },
      { key: "bEyebrow", label: "Story 2: small text", kind: "text" },
      { key: "bTitle", label: "Story 2: title", kind: "text" },
      { key: "bButton", label: "Story 2: link text", kind: "text" },
      { key: "bLink", label: "Story 2: link", kind: "link" },
    ],
  },
  "scent-quiz": {
    label: "Finder",
    description: "Buyers pick a mood and see matching products, e.g. a scent finder",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "options", label: "Choices", kind: "textarea", help: "One per line as Choice: search word, e.g. Fresh: citrus. Products whose name or description has that word are shown." },
      { key: "buttonLabel", label: "Button text", kind: "text", help: "e.g. See all" },
    ],
  },
  "countdown-deals": {
    label: "Deals with countdown",
    description: "A row of deals with a clock counting down to the end of the day",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "endsAt", label: "Deals end at", kind: "text", help: "Time of day, e.g. 23:59. The clock restarts every day." },
      { key: "source", label: "Products to show", kind: "source" },
      {
        key: "style",
        design: true,
        label: "Layout",
        kind: "select",
        options: [
          { value: "row", label: "A row of deals with a small clock" },
          { value: "board", label: "Deal of the day: a big clock and the best deal, on a dark card" },
        ],
      },
      { key: "label", label: "Small label", kind: "text", help: "Deal of the day layout: e.g. Deal of the day." },
      { key: "buttonLabel", label: "Button", kind: "text", help: "Deal of the day layout: on the best deal." },
      { key: "moreLabel", label: "Link to more deals", kind: "text", help: "Deal of the day layout." },
    ],
  },
  "spotlight-cards": {
    label: "Spotlight cards",
    description: "Two big soft cards, each with a product photo, a title, a line and a link",
    fields: [
      { key: "c1Image", label: "Card 1: photo", kind: "image" },
      { key: "c1Title", label: "Card 1: title", kind: "text" },
      { key: "c1Text", label: "Card 1: text", kind: "text" },
      { key: "c1Button", label: "Card 1: link text", kind: "text" },
      { key: "c1Link", label: "Card 1: link", kind: "link" },
      { key: "c2Image", label: "Card 2: photo", kind: "image" },
      { key: "c2Title", label: "Card 2: title", kind: "text" },
      { key: "c2Text", label: "Card 2: text", kind: "text" },
      { key: "c2Button", label: "Card 2: link text", kind: "text" },
      { key: "c2Link", label: "Card 2: link", kind: "link" },
    ],
  },
  "review-spotlight": {
    label: "Review spotlight",
    description: "Your reviews one at a time on a dark band, with a photo beside them",
    fields: [
      { key: "label", label: "Small label", kind: "text", help: "e.g. Our customers' reviews" },
      { key: "image", label: "Photo", kind: "image" },
      { key: "text", label: "Quote to show before you have reviews", kind: "textarea" },
      { key: "name", label: "Name under that quote", kind: "text" },
      {
        key: "style",
        design: true,
        label: "Layout",
        kind: "select",
        options: [
          { value: "band", label: "Dark band with a photo beside the review" },
          { value: "boutique", label: "Quiet and centred, with a small round photo" },
        ],
      },
    ],
  },
  "menu-board": {
    label: "Menu board",
    description: "Your categories as tabs, each listing its products with prices and an add button",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "note", label: "Small print", kind: "text", help: "e.g. Ask us about allergens" },
    ],
  },
  "tilt-gallery": {
    label: "Tilted photos",
    description: "Three photos set at slight angles, each with a sticker",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "p1Image", label: "Photo 1: photo", kind: "image" },
      { key: "p1Title", label: "Photo 1: title", kind: "text" },
      { key: "p2Image", label: "Photo 2: photo", kind: "image" },
      { key: "p2Title", label: "Photo 2: title", kind: "text" },
      { key: "p3Image", label: "Photo 3: photo", kind: "image" },
      { key: "p3Title", label: "Photo 3: title", kind: "text" },
    ],
  },
  "combo-builder": {
    label: "Build a combo",
    description: "Buyers pick one product from each of three lists and add them all to the bag at once",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "c1Label", label: "Step 1: name", kind: "text", help: "e.g. Pick a burger" },
      { key: "c1Source", label: "Step 1: products", kind: "source" },
      { key: "c2Label", label: "Step 2: name", kind: "text" },
      { key: "c2Source", label: "Step 2: products", kind: "source" },
      { key: "c3Label", label: "Step 3: name", kind: "text" },
      { key: "c3Source", label: "Step 3: products", kind: "source" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
    ],
  },
  stage: {
    label: "Product stage",
    description: "A heading on the left, one product photo in the middle and a word on the right",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "image", label: "Photo", kind: "image", help: "A product on a plain background." },
      { key: "word", label: "Word on the right", kind: "text" },
      { key: "buttonLabel", label: "Link text", kind: "text" },
      { key: "buttonLink", label: "Link goes to", kind: "link" },
    ],
  },
  "story-card": {
    label: "Story card",
    description: "A photo beside a coloured card with your story",
    fields: [
      { key: "image", label: "Photo", kind: "image" },
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Story", kind: "textarea", help: "Leave an empty line between paragraphs." },
      { key: "buttonLabel", label: "Link text", kind: "text" },
      { key: "buttonLink", label: "Link goes to", kind: "link" },
    ],
  },
  "collection-collage": {
    label: "Collection collage",
    description: "Four photos around a card with a collection name, a badge and a year",
    fields: [
      { key: "heading", label: "Collection name", kind: "textarea" },
      HEADING_SIZE,
      { key: "badge", label: "Badge", kind: "text", help: "e.g. New" },
      { key: "year", label: "Year or small text", kind: "text" },
      { key: "buttonLink", label: "Link goes to", kind: "link" },
      { key: "p1Image", label: "Photo 1", kind: "image" },
      { key: "p2Image", label: "Photo 2", kind: "image" },
      { key: "p3Image", label: "Photo 3", kind: "image" },
      { key: "p4Image", label: "Photo 4", kind: "image" },
    ],
  },
  "mission-band": {
    label: "Mission band",
    description: "A coloured band with your mission in big words and moving text under it",
    fields: [
      { key: "eyebrow", label: "Small text above", kind: "text" },
      { key: "heading", label: "Mission", kind: "textarea", help: "Put words between * * to highlight them." },
      HEADING_SIZE,
      { key: "ticker", label: "Moving text", kind: "text", help: "Separate with ·" },
    ],
  },
  impact: {
    label: "Numbers that count up",
    description: "Three big numbers that count up when they scroll into view",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "n1Value", label: "Number 1", kind: "text", help: "e.g. 12000+ or ₹4.2L. Digits count up." },
      { key: "n1Label", label: "Number 1: label", kind: "text" },
      { key: "n2Value", label: "Number 2", kind: "text" },
      { key: "n2Label", label: "Number 2: label", kind: "text" },
      { key: "n3Value", label: "Number 3", kind: "text" },
      { key: "n3Label", label: "Number 3: label", kind: "text" },
    ],
  },
  "occasion-mosaic": {
    label: "Shop by occasion",
    description: "Five photo tiles of different sizes, each with an occasion and a link",
    fields: [
      { key: "heading", label: "Heading", kind: "text", help: "Put a word between * * to colour it." },
      HEADING_SIZE,
      { key: "buttonLabel", label: "Link beside the heading", kind: "text" },
      { key: "buttonLink", label: "Link goes to", kind: "link" },
      { key: "o1Image", label: "Tile 1: photo", kind: "image" },
      { key: "o1Title", label: "Tile 1: title", kind: "text" },
      { key: "o1Text", label: "Tile 1: small text", kind: "text" },
      { key: "o1Link", label: "Tile 1: link", kind: "link" },
      { key: "o2Image", label: "Tile 2: photo", kind: "image" },
      { key: "o2Title", label: "Tile 2: title", kind: "text" },
      { key: "o2Text", label: "Tile 2: small text", kind: "text" },
      { key: "o2Link", label: "Tile 2: link", kind: "link" },
      { key: "o3Image", label: "Tile 3: photo", kind: "image" },
      { key: "o3Title", label: "Tile 3: title", kind: "text" },
      { key: "o3Text", label: "Tile 3: small text", kind: "text" },
      { key: "o3Link", label: "Tile 3: link", kind: "link" },
      { key: "o4Image", label: "Tile 4: photo", kind: "image" },
      { key: "o4Title", label: "Tile 4: title", kind: "text" },
      { key: "o4Text", label: "Tile 4: small text", kind: "text" },
      { key: "o4Link", label: "Tile 4: link", kind: "link" },
      { key: "o5Image", label: "Tile 5: photo", kind: "image" },
      { key: "o5Title", label: "Tile 5: title", kind: "text" },
      { key: "o5Text", label: "Tile 5: small text", kind: "text" },
      { key: "o5Link", label: "Tile 5: link", kind: "link" },
    ],
  },
  "promise-icons": {
    label: "Promise icons",
    description: "Five promises in a row, each with a round icon",
    fields: [
      { key: "i1Title", label: "Promise 1: title", kind: "text" },
      { key: "i1Text", label: "Promise 1: text", kind: "text" },
      { key: "i2Title", label: "Promise 2: title", kind: "text" },
      { key: "i2Text", label: "Promise 2: text", kind: "text" },
      { key: "i3Title", label: "Promise 3: title", kind: "text" },
      { key: "i3Text", label: "Promise 3: text", kind: "text" },
      { key: "i4Title", label: "Promise 4: title", kind: "text" },
      { key: "i4Text", label: "Promise 4: text", kind: "text" },
      { key: "i5Title", label: "Promise 5: title", kind: "text" },
      { key: "i5Text", label: "Promise 5: text", kind: "text" },
    ],
  },
  "popular-searches": {
    label: "Popular searches",
    description: "Links to the searches your customers use most",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "terms", label: "Searches", kind: "textarea", help: "One per line. Write Label: search word to search for something shorter, e.g. Banarasi silk sarees: banarasi" },
    ],
  },
  "weave-guide": {
    label: "Weave guide",
    description: "A tab for each weave or fabric with a photo, its story and matching products",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "w1Name", label: "Weave 1: name", kind: "text" },
      { key: "w1Image", label: "Weave 1: photo", kind: "image" },
      { key: "w1Text", label: "Weave 1: story", kind: "textarea" },
      { key: "w1Term", label: "Weave 1: search word for its products", kind: "text" },
      { key: "w2Name", label: "Weave 2: name", kind: "text" },
      { key: "w2Image", label: "Weave 2: photo", kind: "image" },
      { key: "w2Text", label: "Weave 2: story", kind: "textarea" },
      { key: "w2Term", label: "Weave 2: search word for its products", kind: "text" },
      { key: "w3Name", label: "Weave 3: name", kind: "text" },
      { key: "w3Image", label: "Weave 3: photo", kind: "image" },
      { key: "w3Text", label: "Weave 3: story", kind: "textarea" },
      { key: "w3Term", label: "Weave 3: search word for its products", kind: "text" },
      { key: "w4Name", label: "Weave 4: name", kind: "text" },
      { key: "w4Image", label: "Weave 4: photo", kind: "image" },
      { key: "w4Text", label: "Weave 4: story", kind: "textarea" },
      { key: "w4Term", label: "Weave 4: search word for its products", kind: "text" },
      { key: "w5Name", label: "Weave 5: name", kind: "text" },
      { key: "w5Image", label: "Weave 5: photo", kind: "image" },
      { key: "w5Text", label: "Weave 5: story", kind: "textarea" },
      { key: "w5Term", label: "Weave 5: search word for its products", kind: "text" },
    ],
  },
  "heritage-trio": {
    label: "Story, values and enquiry",
    description: "A photo with a heading, your story with three values, and a short form that opens WhatsApp",
    fields: [
      { key: "heading", label: "Heading over the photo", kind: "text" },
      { key: "image", label: "Photo", kind: "image" },
      { key: "storyHeading", label: "Story heading", kind: "text" },
      { key: "text", label: "Story", kind: "textarea" },
      { key: "v1Title", label: "Value 1: title", kind: "text" },
      { key: "v1Text", label: "Value 1: text", kind: "text" },
      { key: "v2Title", label: "Value 2: title", kind: "text" },
      { key: "v2Text", label: "Value 2: text", kind: "text" },
      { key: "v3Title", label: "Value 3: title", kind: "text" },
      { key: "v3Text", label: "Value 3: text", kind: "text" },
      { key: "formHeading", label: "Form heading", kind: "text" },
      { key: "formText", label: "Form text", kind: "textarea" },
      { key: "buttonLabel", label: "Form button", kind: "text", help: "The form opens WhatsApp with the customer's details filled in." },
    ],
  },
  "craft-timeline": {
    label: "Timeline",
    description: "The years of your story along a line",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "t1Year", label: "Step 1: year", kind: "text" },
      { key: "t1Title", label: "Step 1: title", kind: "text" },
      { key: "t1Text", label: "Step 1: text", kind: "textarea" },
      { key: "t2Year", label: "Step 2: year", kind: "text" },
      { key: "t2Title", label: "Step 2: title", kind: "text" },
      { key: "t2Text", label: "Step 2: text", kind: "textarea" },
      { key: "t3Year", label: "Step 3: year", kind: "text" },
      { key: "t3Title", label: "Step 3: title", kind: "text" },
      { key: "t3Text", label: "Step 3: text", kind: "textarea" },
      { key: "t4Year", label: "Step 4: year", kind: "text" },
      { key: "t4Title", label: "Step 4: title", kind: "text" },
      { key: "t4Text", label: "Step 4: text", kind: "textarea" },
    ],
  },
  "collection-circles": {
    label: "Collections beside circles",
    description: "A heading and text on the left, your categories as round photos with a line under each",
    fields: [
      { key: "eyebrow", label: "Small text above", kind: "text" },
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "buttonLabel", label: "Link text", kind: "text" },
      { key: "buttonLink", label: "Link goes to", kind: "link" },
    ],
  },
  "feature-duo": {
    label: "Two feature banners",
    description: "A wide photo banner and a coloured banner side by side",
    fields: [
      { key: "eyebrow", label: "Banner 1: small text", kind: "text" },
      { key: "heading", label: "Banner 1: heading", kind: "textarea" },
      { key: "text", label: "Banner 1: text", kind: "text" },
      { key: "image", label: "Banner 1: photo", kind: "image" },
      { key: "buttonLabel", label: "Banner 1: button", kind: "text" },
      { key: "buttonLink", label: "Banner 1: link", kind: "link" },
      { key: "eyebrow2", label: "Banner 2: small text", kind: "text" },
      { key: "heading2", label: "Banner 2: heading", kind: "textarea" },
      { key: "text2", label: "Banner 2: text", kind: "text" },
      { key: "image2", label: "Banner 2: photo", kind: "image" },
      { key: "buttonLabel2", label: "Banner 2: button", kind: "text" },
      { key: "buttonLink2", label: "Banner 2: link", kind: "link" },
    ],
  },
  "coupon-banner": {
    label: "Coupon banner",
    description: "An offer with a code customers can copy, beside a photo",
    fields: [
      { key: "eyebrow", label: "Small text above", kind: "text" },
      { key: "heading", label: "Offer", kind: "textarea" },
      HEADING_SIZE,
      { key: "code", label: "Coupon code", kind: "text", help: "Create the same code under Discounts so it works at checkout." },
      { key: "image", label: "Photo", kind: "image" },
    ],
  },
  "drape-styles": {
    label: "Style cards",
    description: "Four numbered photo cards, e.g. ways to drape or wear something",
    fields: [
      { key: "eyebrow", label: "Small text above", kind: "text" },
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "d1Image", label: "Card 1: photo", kind: "image" },
      { key: "d1Title", label: "Card 1: title", kind: "text" },
      { key: "d1Text", label: "Card 1: text", kind: "textarea" },
      { key: "d1Link", label: "Card 1: link", kind: "link" },
      { key: "d2Image", label: "Card 2: photo", kind: "image" },
      { key: "d2Title", label: "Card 2: title", kind: "text" },
      { key: "d2Text", label: "Card 2: text", kind: "textarea" },
      { key: "d2Link", label: "Card 2: link", kind: "link" },
      { key: "d3Image", label: "Card 3: photo", kind: "image" },
      { key: "d3Title", label: "Card 3: title", kind: "text" },
      { key: "d3Text", label: "Card 3: text", kind: "textarea" },
      { key: "d3Link", label: "Card 3: link", kind: "link" },
      { key: "d4Image", label: "Card 4: photo", kind: "image" },
      { key: "d4Title", label: "Card 4: title", kind: "text" },
      { key: "d4Text", label: "Card 4: text", kind: "textarea" },
      { key: "d4Link", label: "Card 4: link", kind: "link" },
    ],
  },
  "story-rings": {
    label: "Story circles",
    description: "Your categories in small circles with a coloured ring, like stories",
    fields: [{ key: "heading", label: "Heading", kind: "text", help: "Leave empty to hide." }],
  },
  "label-tiles": {
    label: "Photo tiles with labels",
    description: "Your categories as tall photos with a small label on each",
    fields: [{ key: "heading", label: "Heading", kind: "text" }, HEADING_SIZE],
  },
  "offer-band": {
    label: "Offer band",
    description: "A rounded coloured band with an offer, a line of text and a button",
    fields: [
      { key: "heading", label: "Offer", kind: "text" },
      { key: "text", label: "Small text", kind: "text" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
  },
  "budget-picker": {
    label: "Shop by budget",
    description: "Price ranges as buttons; the products in the chosen range show under them",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "ranges", label: "Price ranges", kind: "textarea", help: "One per line as Label: from-to in rupees, e.g. Under ₹999: 0-999. Leave the end empty for no limit, e.g. ₹2000+: 2000-" },
      { key: "buttonLabel", label: "Link under the products", kind: "text" },
      { key: "text", label: "Text under the heading", kind: "text", help: "Shows on the panel style." },
      {
        key: "style",
        label: "Style",
        kind: "select",
        options: [
          { value: "cards", label: "Product cards under the ranges" },
          { value: "panel", label: "Coloured panel with compact product rows" },
          { value: "boutique", label: "Quiet band: ranges as tabs, product cards under them" },
        ],
      },
    ],
  },
  "size-finder": {
    label: "Size finder",
    description: "Your sizes as buttons; picking one shows its measurements",
    fields: [
      { key: "heading", label: "Heading", kind: "text", help: "Put words between * * to highlight them." },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "sizes", label: "Sizes", kind: "textarea", help: "One per line as Size: bust / waist / hip in inches, e.g. M: 36 / 30 / 39" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "measureNames", label: "Measurement names", kind: "text", help: "Separated by /, in the same order as the sizes' numbers, e.g. Bust / Waist / Hip." },
      { key: "unitNote", label: "Words after the size", kind: "text", help: "e.g. fits, in inches. Leave empty for none." },
      { key: "unitMark", label: "Mark after each number", kind: "text", help: "e.g. ″ for inches. Leave empty for none." },
    ],
  },
  "look-trio": {
    label: "Photo, words and a small photo",
    description: "A big photo, a heading with text and a button, and a small photo beside them",
    fields: [
      { key: "image", label: "Big photo", kind: "image" },
      { key: "heading", label: "Heading", kind: "textarea" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "smallImage", label: "Small photo", kind: "image" },
    ],
  },
  "room-shop": {
    label: "Shop the room",
    description: "A room photo with dots on it; tapping a dot shows that product",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "image", label: "Room photo", kind: "image" },
      { key: "source", label: "Products for the dots", kind: "source", help: "The first products go on dots 1 to 4." },
      { key: "h1X", label: "Dot 1: across, in % from the left", kind: "text" },
      { key: "h1Y", label: "Dot 1: down, in % from the top", kind: "text" },
      { key: "h2X", label: "Dot 2: across, in % from the left", kind: "text" },
      { key: "h2Y", label: "Dot 2: down, in % from the top", kind: "text" },
      { key: "h3X", label: "Dot 3: across, in % from the left", kind: "text" },
      { key: "h3Y", label: "Dot 3: down, in % from the top", kind: "text" },
      { key: "h4X", label: "Dot 4: across, in % from the left", kind: "text" },
      { key: "h4Y", label: "Dot 4: down, in % from the top", kind: "text" },
    ],
  },
  "circle-tints": {
    label: "Categories in colour circles",
    description: "Your categories as photos in big circles of different colours",
    fields: [{ key: "heading", label: "Heading", kind: "text" }, HEADING_SIZE],
  },
  "feature-slider": {
    label: "Feature slides",
    description: "A photo beside a coloured panel with a title, text and button; arrows move between slides",
    fields: [
      { key: "f1Image", label: "Slide 1: photo", kind: "image" },
      { key: "f1Title", label: "Slide 1: title", kind: "text" },
      { key: "f1Text", label: "Slide 1: text", kind: "textarea" },
      { key: "f1Button", label: "Slide 1: button", kind: "text" },
      { key: "f1Link", label: "Slide 1: link", kind: "link" },
      { key: "f2Image", label: "Slide 2: photo", kind: "image" },
      { key: "f2Title", label: "Slide 2: title", kind: "text" },
      { key: "f2Text", label: "Slide 2: text", kind: "textarea" },
      { key: "f2Button", label: "Slide 2: button", kind: "text" },
      { key: "f2Link", label: "Slide 2: link", kind: "link" },
      { key: "f3Image", label: "Slide 3: photo", kind: "image" },
      { key: "f3Title", label: "Slide 3: title", kind: "text" },
      { key: "f3Text", label: "Slide 3: text", kind: "textarea" },
      { key: "f3Button", label: "Slide 3: button", kind: "text" },
      { key: "f3Link", label: "Slide 3: link", kind: "link" },
    ],
  },
  "scallop-band": {
    label: "Scalloped band",
    description: "A band with a scalloped edge, a heading, text and three coloured tiles",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "t1Image", label: "Tile 1: photo", kind: "image" },
      { key: "t1Label", label: "Tile 1: label", kind: "text" },
      { key: "t1Link", label: "Tile 1: link", kind: "link" },
      { key: "t2Image", label: "Tile 2: photo", kind: "image" },
      { key: "t2Label", label: "Tile 2: label", kind: "text" },
      { key: "t2Link", label: "Tile 2: link", kind: "link" },
      { key: "t3Image", label: "Tile 3: photo", kind: "image" },
      { key: "t3Label", label: "Tile 3: label", kind: "text" },
      { key: "t3Link", label: "Tile 3: link", kind: "link" },
    ],
  },
  "editorial-trio": {
    label: "Three editorial photos",
    description: "Three tall photos, each with a word in script and a link",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "e1Image", label: "Photo 1: photo", kind: "image" },
      { key: "e1Script", label: "Photo 1: word in script", kind: "text" },
      { key: "e1Title", label: "Photo 1: small title", kind: "text" },
      { key: "e1Link", label: "Photo 1: link", kind: "link" },
      { key: "e2Image", label: "Photo 2: photo", kind: "image" },
      { key: "e2Script", label: "Photo 2: word in script", kind: "text" },
      { key: "e2Title", label: "Photo 2: small title", kind: "text" },
      { key: "e2Link", label: "Photo 2: link", kind: "link" },
      { key: "e3Image", label: "Photo 3: photo", kind: "image" },
      { key: "e3Script", label: "Photo 3: word in script", kind: "text" },
      { key: "e3Title", label: "Photo 3: small title", kind: "text" },
      { key: "e3Link", label: "Photo 3: link", kind: "link" },
    ],
  },
  "gift-note": {
    label: "Gift note",
    description: "Customers write a gift message and see it on a card; it is added to their order note at checkout",
    fields: [
      { key: "heading", label: "Heading", kind: "text", help: "Put words between * * to write them in script." },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "image", label: "Photo", kind: "image" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
    ],
  },
  "wave-signup": {
    label: "Wavy sign-up band",
    description: "A band in the accent colour with a wavy edge, a heading and an email sign-up",
    fields: [
      { key: "eyebrow", label: "Words in script above", kind: "text" },
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
    ],
  },
  "promo-trio": {
    label: "Three promo cards",
    description: "Three soft-coloured cards, each with a small line, a heading, a button and a photo",
    fields: [
      { key: "c1Eyebrow", label: "Card 1: small text", kind: "text" },
      { key: "c1Title", label: "Card 1: heading", kind: "text" },
      { key: "c1Image", label: "Card 1: photo", kind: "image" },
      { key: "c1Button", label: "Card 1: button", kind: "text" },
      { key: "c1Link", label: "Card 1: link", kind: "link" },
      { key: "c2Eyebrow", label: "Card 2: small text", kind: "text" },
      { key: "c2Title", label: "Card 2: heading", kind: "text" },
      { key: "c2Image", label: "Card 2: photo", kind: "image" },
      { key: "c2Button", label: "Card 2: button", kind: "text" },
      { key: "c2Link", label: "Card 2: link", kind: "link" },
      { key: "c3Eyebrow", label: "Card 3: small text", kind: "text" },
      { key: "c3Title", label: "Card 3: heading", kind: "text" },
      { key: "c3Image", label: "Card 3: photo", kind: "image" },
      { key: "c3Button", label: "Card 3: button", kind: "text" },
      { key: "c3Link", label: "Card 3: link", kind: "link" },
    ],
  },
  "pet-picker": {
    label: "Shop by pet",
    description: "Round photo buttons for each pet; the products for the chosen one show under them",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "p1Name", label: "Pet 1: name", kind: "text" },
      { key: "p1Image", label: "Pet 1: photo", kind: "image" },
      { key: "p1Term", label: "Pet 1: word its products contain", kind: "text" },
      { key: "p2Name", label: "Pet 2: name", kind: "text" },
      { key: "p2Image", label: "Pet 2: photo", kind: "image" },
      { key: "p2Term", label: "Pet 2: word its products contain", kind: "text" },
      { key: "p3Name", label: "Pet 3: name", kind: "text" },
      { key: "p3Image", label: "Pet 3: photo", kind: "image" },
      { key: "p3Term", label: "Pet 3: word its products contain", kind: "text" },
      { key: "p4Name", label: "Pet 4: name", kind: "text" },
      { key: "p4Image", label: "Pet 4: photo", kind: "image" },
      { key: "p4Term", label: "Pet 4: word its products contain", kind: "text" },
      { key: "buttonLabel", label: "Link under the products", kind: "text" },
    ],
  },
  "pastel-tiles": {
    label: "Categories on pastel tiles",
    description: "Your categories on square tiles of soft colours, with the name under each",
    fields: [{ key: "heading", label: "Heading", kind: "text" }, HEADING_SIZE],
  },
  perks: {
    label: "Shop promises",
    description: "Four short promises with icons, like free delivery and easy returns",
    fields: [
      { key: "p1Title", label: "Promise 1: title", kind: "text" },
      { key: "p1Text", label: "Promise 1: text", kind: "text" },
      { key: "p2Title", label: "Promise 2: title", kind: "text" },
      { key: "p2Text", label: "Promise 2: text", kind: "text" },
      { key: "p3Title", label: "Promise 3: title", kind: "text" },
      { key: "p3Text", label: "Promise 3: text", kind: "text" },
      { key: "p4Title", label: "Promise 4: title", kind: "text" },
      { key: "p4Text", label: "Promise 4: text", kind: "text" },
      {
        key: "style",
        design: true,
        label: "Layout",
        kind: "select",
        options: [
          { value: "cards", label: "Soft panel with big icons" },
          { value: "strip", label: "Small dark strip with bright icons" },
        ],
      },
    ],
  },
  statement: {
    label: "Big statement",
    description: "A huge heading with a short paragraph beside it",
    fields: [
      { key: "heading", label: "Heading", kind: "textarea", help: "Press Enter to start a second line." },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
    ],
  },
  "collection-grid": {
    label: "Collection grid",
    description: "Photo tiles of your categories in a mosaic, one with a button",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "subheading", label: "Text under heading", kind: "text" },
      { key: "featureText", label: "Text on the big tile", kind: "text" },
      { key: "featureButton", label: "Button on the big tile", kind: "text" },
      {
        key: "count",
        label: "Tiles to show",
        kind: "select",
        help: "Your categories fill the tiles first; the extra tiles below top them up. Six at most.",
        options: [
          { value: "3", label: "3 tiles" },
          { value: "4", label: "4 tiles" },
          { value: "5", label: "5 tiles" },
          { value: "6", label: "6 tiles" },
        ],
      },
      {
        key: "tone",
        label: "Background",
        kind: "select",
        options: [
          { value: "light", label: "Page colour" },
          { value: "dark", label: "Black band" },
        ],
      },
      { key: "x1Image", label: "Extra tile 1: photo", kind: "image", help: "Your own tile, e.g. a sale or a new drop. Shows when there are fewer categories than tiles." },
      { key: "x1Title", label: "Extra tile 1: title", kind: "text" },
      { key: "x1Link", label: "Extra tile 1: link", kind: "link" },
      { key: "x2Image", label: "Extra tile 2: photo", kind: "image" },
      { key: "x2Title", label: "Extra tile 2: title", kind: "text" },
      { key: "x2Link", label: "Extra tile 2: link", kind: "link" },
    ],
  },
  "image-text": {
    label: "Photo with text",
    description: "Tell your story next to a photo",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "highlightLabel", label: "Offer line", kind: "text", help: "e.g. Come and enjoy the sale! Leave empty to hide." },
      { key: "highlight", label: "Big offer text", kind: "text", help: "e.g. 50%" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "image", label: "Photo", kind: "image" },
      {
        key: "imageWidth",
        design: true,
        label: "Photo size",
        kind: "select",
        options: [
          { value: "half", label: "Half the width" },
          { value: "wide", label: "Wide" },
          { value: "small", label: "Small and wide, a big heading beside it" },
        ],
      },
      {
        key: "tone",
        design: true,
        label: "Background",
        kind: "select",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark band" },
        ],
      },
      {
        key: "imageSide",
        design: true,
        label: "Photo side",
        kind: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
    ],
  },
  marquee: {
    label: "Moving text",
    description: "A strip of scrolling text",
    fields: [
      { key: "text", label: "Text", kind: "text", help: "Separate phrases with ·" },
      { key: "colour", label: "Band colour", kind: "text", help: "Optional, e.g. #E8772E. Leave empty for your button colour." },
    ],
  },
  newsletter: {
    label: "Newsletter",
    description: "Collect emails for your drops",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "image", label: "Background photo", kind: "image", help: "Optional. Shows the section as a dark band." },
      { key: "placeholder", label: "Email box text", kind: "text" },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "doneText", label: "Thank-you message", kind: "text", help: "Shown after someone signs up." },
    ],
  },
  "glaze-picker": {
    label: "Glaze picker",
    description: "Round glaze swatches; picking one shows its colour, a few words and the products made in it",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text under heading", kind: "textarea" },
      ...[1, 2, 3, 4, 5].flatMap((n): SectionField[] => [
        { key: `g${n}Name`, label: `Glaze ${n}: name`, kind: "text", help: n === 1 ? "Leave a name empty to hide that glaze." : undefined },
        { key: `g${n}Colour`, label: `Glaze ${n}: colour`, kind: "text", help: n === 1 ? "A colour code like #8FB3C9." : undefined },
        { key: `g${n}Text`, label: `Glaze ${n}: a few words`, kind: "textarea" },
        { key: `g${n}Match`, label: `Glaze ${n}: word to find its products`, kind: "text", help: n === 1 ? "Products whose name or description has this word show under the glaze, e.g. speckled." : undefined },
      ]),
      { key: "emptyText", label: "Text when no product matches", kind: "text" },
      { key: "linkLabel", label: "Link to see them all", kind: "text" },
    ],
  },
  "care-guide": {
    label: "Care guide",
    description: "Up to six care tiles, each with an icon, a stamp like Safe or Avoid, and a line of advice",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text under heading", kind: "textarea" },
      { key: "note", label: "Note under the text", kind: "textarea" },
      ...[1, 2, 3, 4, 5, 6].flatMap((n): SectionField[] => [
        { key: `c${n}Title`, label: `Tile ${n}: title`, kind: "text", help: n === 1 ? "Leave a title empty to hide that tile." : undefined },
        {
          key: `c${n}Icon`,
          label: `Tile ${n}: icon`,
          kind: "select",
          options: [
            { value: "dishwasher", label: "Water drops" },
            { value: "microwave", label: "Microwave" },
            { value: "oven", label: "Flame" },
            { value: "freezer", label: "Snowflake" },
            { value: "hand", label: "Hand" },
            { value: "shine", label: "Sparkle" },
          ],
        },
        { key: `c${n}Stamp`, label: `Tile ${n}: stamp word`, kind: "text", help: n === 1 ? "A short word like Safe, Avoid or Gently." : undefined },
        {
          key: `c${n}Tone`,
          label: `Tile ${n}: stamp colour`,
          kind: "select",
          options: [
            { value: "yes", label: "Green (yes)" },
            { value: "care", label: "Accent (careful)" },
            { value: "no", label: "Dark (no)" },
          ],
        },
        { key: `c${n}Text`, label: `Tile ${n}: advice`, kind: "textarea" },
      ]),
    ],
  },
  "spec-index": {
    label: "Product index",
    description: "Your products as a numbered list like a catalogue page; pointing at a row shows its photo",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text beside the heading", kind: "textarea" },
      { key: "source", label: "Products", kind: "source" },
      {
        key: "count",
        label: "How many rows",
        kind: "select",
        options: [
          { value: "4", label: "4" },
          { value: "6", label: "6" },
          { value: "8", label: "8" },
          { value: "10", label: "10" },
        ],
      },
      { key: "colNo", label: "Column title: number", kind: "text" },
      { key: "colName", label: "Column title: name", kind: "text" },
      { key: "colDetail", label: "Column title: detail", kind: "text" },
      { key: "colType", label: "Column title: category", kind: "text" },
      { key: "colPrice", label: "Column title: price", kind: "text" },
      { key: "linkLabel", label: "Link under the list", kind: "text" },
      { key: "linkUrl", label: "Link", kind: "link" },
    ],
  },
  "drop-clock": {
    label: "Drop countdown",
    description: "A big clock counting down to your next drop on a dark band, with a few words and a button",
    fields: [
      { key: "label", label: "Small text above the heading", kind: "text" },
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text", kind: "textarea" },
      { key: "endsAt", label: "When the drop lands", kind: "text", help: "A date and time like 2026-12-01 18:00. Leave it empty (or let it pass) to count to every Friday at 6 pm." },
      { key: "buttonLabel", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "daysLabel", label: "Word under days", kind: "text" },
      { key: "hoursLabel", label: "Word under hours", kind: "text" },
      { key: "minutesLabel", label: "Word under minutes", kind: "text" },
      { key: "secondsLabel", label: "Word under seconds", kind: "text" },
    ],
  },
  "wood-planks": {
    label: "Wood planks",
    description: "Your woods or materials as planks side by side; the open one widens to show its name, a note and its story",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text beside the heading", kind: "textarea" },
      ...[1, 2, 3, 4, 5].flatMap((n): SectionField[] => [
        { key: `w${n}Name`, label: `Plank ${n}: name`, kind: "text", help: n === 1 ? "Leave a name empty to hide that plank." : undefined },
        { key: `w${n}Colour`, label: `Plank ${n}: wood colour`, kind: "text", help: n === 1 ? "A colour code like #B98A5A. The grain is drawn over it." : undefined },
        { key: `w${n}Note`, label: `Plank ${n}: small note`, kind: "text" },
        { key: `w${n}Text`, label: `Plank ${n}: its story`, kind: "textarea" },
        { key: `w${n}Link`, label: `Plank ${n}: link`, kind: "link" },
      ]),
      { key: "linkLabel", label: "Link text", kind: "text" },
    ],
  },
  "table-sizer": {
    label: "Table sizer",
    description: "Buyers pick how many people sit down and see the table and chairs drawn from above, with sizes and a link",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text under heading", kind: "textarea" },
      ...[1, 2, 3, 4].flatMap((n): SectionField[] => [
        { key: `z${n}Label`, label: `Size ${n}: button`, kind: "text", help: n === 1 ? "Like 6 seats. Leave it empty to hide that size." : undefined },
        { key: `z${n}Seats`, label: `Size ${n}: number of chairs drawn`, kind: "text" },
        { key: `z${n}Table`, label: `Size ${n}: table size`, kind: "text" },
        { key: `z${n}Room`, label: `Size ${n}: room it needs`, kind: "text" },
        { key: `z${n}Link`, label: `Size ${n}: link`, kind: "link" },
      ]),
      { key: "sizeLabel", label: "Label for the table size", kind: "text" },
      { key: "roomLabel", label: "Label for the room size", kind: "text" },
      { key: "linkLabel", label: "Link text", kind: "text", help: "{seats} becomes the number of seats." },
    ],
  },
  "studio-prints": {
    label: "Pinned prints",
    description: "Two photos as tilted prints with handwritten captions, beside a short letter with a signature and a link",
    fields: [
      { key: "label", label: "Small text above the heading", kind: "text" },
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "First paragraph", kind: "textarea" },
      { key: "text2", label: "Second paragraph", kind: "textarea" },
      { key: "image", label: "Print 1: photo", kind: "image" },
      { key: "caption", label: "Print 1: caption", kind: "text" },
      { key: "image2", label: "Print 2: photo", kind: "image" },
      { key: "caption2", label: "Print 2: caption", kind: "text" },
      { key: "signature", label: "Signed by", kind: "text" },
      { key: "linkLabel", label: "Link text", kind: "text" },
      { key: "linkUrl", label: "Link", kind: "link" },
    ],
  },
  "word-story": {
    label: "Word story",
    description: "Pins while buyers scroll through it: big words change on each side and the picture wipes from one product to the next",
    fields: [
      { key: "w1Left", label: "Step 1: word on the left", kind: "text" },
      { key: "w1Right", label: "Step 1: word on the right", kind: "text" },
      { key: "w2Left", label: "Step 2: word on the left", kind: "text" },
      { key: "w2Right", label: "Step 2: word on the right", kind: "text" },
      { key: "w3Left", label: "Step 3: word on the left", kind: "text" },
      { key: "w3Right", label: "Step 3: word on the right", kind: "text" },
      { key: "w4Left", label: "Step 4: word on the left", kind: "text", help: "Leave step 4 empty for three steps." },
      { key: "w4Right", label: "Step 4: word on the right", kind: "text" },
      { key: "source", label: "Products to show", kind: "source" },
      { key: "buttonLabel", label: "Link on the product", kind: "text" },
    ],
  },
  "scatter-gallery": {
    label: "Scatter collage",
    description: "Photos piled behind a big title that spread into a mosaic filling the band as buyers scroll",
    fields: [
      { key: "heading", label: "Title", kind: "textarea", help: "One word or two per line." },
      HEADING_SIZE,
      { key: "text", label: "Text under the title", kind: "text" },
      { key: "buttonLabel", label: "Button", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
      { key: "g1Image", label: "Photo 1", kind: "image" },
      { key: "g2Image", label: "Photo 2", kind: "image" },
      { key: "g3Image", label: "Photo 3", kind: "image" },
      { key: "g4Image", label: "Photo 4", kind: "image" },
      { key: "g5Image", label: "Photo 5", kind: "image" },
      { key: "g6Image", label: "Photo 6", kind: "image" },
      { key: "g7Image", label: "Photo 7", kind: "image" },
      { key: "g8Image", label: "Photo 8", kind: "image" },
      { key: "g9Image", label: "Photo 9", kind: "image" },
      { key: "g10Image", label: "Photo 10", kind: "image", help: "The mosaic has ten tiles; with fewer photos they repeat." },
      {
        key: "tone",
        design: true,
        label: "Colour",
        kind: "select",
        options: [
          { value: "dark", label: "Dark band" },
          { value: "light", label: "Soft panel" },
        ],
      },
    ],
  },
  "review-board": {
    label: "Review slider",
    description: "Your reviews on a dark band as rounded cards that slide sideways, with your average rating on top",
    fields: [
      { key: "label", label: "Small text above the heading", kind: "text" },
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "summary", label: "Line under the rating", kind: "text", help: "{avg} becomes the average rating and {n} the number of reviews." },
      { key: "verifiedLabel", label: "Words under a verified buyer's name", kind: "text" },
    ],
  },
  "batch-calendar": {
    label: "Batch calendar",
    description: "Your next three drops side by side, each with its date and marked open, coming soon or sold out",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      HEADING_SIZE,
      { key: "text", label: "Text under heading", kind: "textarea" },
      ...[1, 2, 3].flatMap((n): SectionField[] => [
        { key: `b${n}Date`, label: `Batch ${n}: date`, kind: "text", help: n === 1 ? "Like 14 Nov. Leave the title empty to hide a batch." : undefined },
        { key: `b${n}Title`, label: `Batch ${n}: title`, kind: "text" },
        { key: `b${n}Note`, label: `Batch ${n}: a line about it`, kind: "text" },
        {
          key: `b${n}Status`,
          label: `Batch ${n}: status`,
          kind: "select",
          options: [
            { value: "open", label: "Open" },
            { value: "soon", label: "Coming soon" },
            { value: "sold", label: "Sold out" },
          ],
        },
        { key: `b${n}Link`, label: `Batch ${n}: link`, kind: "link" },
      ]),
      { key: "openLabel", label: "Word for open batches", kind: "text" },
      { key: "soonLabel", label: "Word for coming batches", kind: "text" },
      { key: "soldLabel", label: "Word for sold-out batches", kind: "text" },
    ],
  },
};

const PHOTO = (id: string, w = 1800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Starting settings for a section added in the editor. */
export function defaultSectionSettings(type: SiteSectionType, storeName = "Your brand"): Record<string, string> {
  switch (type) {
    case "hero":
      return {
        heading: storeName,
        subheading: "Everyday clothing made to move with you.",
        buttonLabel: "Shop now",
        buttonLink: "/catalog",
        image: PHOTO("photo-1578587018452-892bacefd3f2"),
        imageLayout: "column",
      };
    case "collection-split":
      return {
        heading: "New collection",
        subheading: String(new Date().getFullYear()),
        leftImage: PHOTO("photo-1620799140408-edc6dcb6d633", 1200),
        rightImage: PHOTO("photo-1503341504253-dff4815485f1", 1200),
        link: "/catalog",
      };
    case "product-row":
      return { heading: "Best sellers", source: "bestsellers", buttonLabel: "View all", buttonLink: "/catalog" };
    case "banners":
      return {};
    case "categories":
      return { heading: "Shop by category" };
    case "category-circles":
      return { heading: "" };
    case "promo-cards":
      return {
        c1Image: PHOTO("photo-1544022613-e87ca75a784a", 900),
        c1Button: "Explore now",
        c1Link: "/catalog",
        c2Image: PHOTO("photo-1515886657613-9f3515b0c78f", 900),
        c2Button: "Explore now",
        c2Link: "/catalog",
        c3Label: "Women's collection",
        c3Heading: "Stylish winter wear for women",
        c3Image: PHOTO("photo-1495385794356-15371f348c31", 700),
        c3Button: "Check now",
        c3Link: "/catalog",
        c4Label: "Men's collection",
        c4Heading: "Stylish winter shirts for men",
        c4Image: PHOTO("photo-1487222477894-8943e31ef7b2", 700),
        c4Button: "Check now",
        c4Link: "/catalog",
      };
    case "reviews":
      return { subheading: "★★★★★", heading: "Customers love us" };
    case "features":
      return {
        heading: "Made for all-day comfort",
        image: PHOTO("photo-1600185365483-26d7a4cc7519", 1400),
        f1Title: "Comfort first",
        f1Text: "Soft, supportive and light, so you forget you're wearing them.",
        f2Title: "Premium materials",
        f2Text: "Chosen to last, wash after wash.",
        f3Title: "Fresh all day",
        f3Text: "Breathable fabrics that keep odours away.",
        f4Title: "Easy on, easy off",
        f4Text: "Slip in and go. No fuss.",
        f5Title: "Kinder to the planet",
        f5Text: "Less waste, recycled packaging.",
        f6Title: "Easy to clean",
        f6Text: "Wipe or wash, they come back like new.",
      };
    case "feature-cards":
      return {
        eyebrow: "The details",
        heading: "Made down to the last detail",
        d1Image: PHOTO("photo-1608231387042-66d1773070a5", 900),
        d1Title: "Soft lining",
        d1Text: "A smooth lining that feels good from the first wear.",
        d2Image: PHOTO("photo-1600269452121-4f2416e55c28", 900),
        d2Title: "Light cushioning",
        d2Text: "Cushioning that keeps you comfortable all day.",
        d3Image: PHOTO("photo-1512374382149-233c42b6a83b", 900),
        d3Title: "Stretch laces",
        d3Text: "Tie them once and slip them on every day.",
        buttonLabel: "Learn more",
        buttonLink: "/pages/about",
      };
    case "gallery":
      return {
        heading: "Worn every day",
        buttonLabel: "Follow us",
        g1Image: PHOTO("photo-1539109136881-3be0616acf4b", 700),
        g1Caption: "@ananya",
        g2Image: PHOTO("photo-1617137968427-85924c800a22", 700),
        g2Caption: "@rahul.k",
        g3Image: PHOTO("photo-1485968579580-b6d095142e6e", 700),
        g3Caption: "@meera",
        g4Image: PHOTO("photo-1495385794356-15371f348c31", 700),
        g4Caption: "@sana",
        g5Image: PHOTO("photo-1520975954732-35dd22299614", 700),
        g5Caption: "@arjun",
        g6Image: PHOTO("photo-1488161628813-04466f872be2", 700),
        g6Caption: "@vikram",
      };
    case "quote":
      return { text: "“The most thoughtfully made pieces we have tried.”", names: "Vogue · Esquire · Elle" };
    case "story-split":
      return {
        image: PHOTO("photo-1544022613-e87ca75a784a", 900),
        label: "Featured",
        bigText: "Our story",
        text: "Read how we started, what we stand for, and how every piece is made.",
        buttonLabel: "Learn more",
        buttonLink: "/pages/about",
      };
    case "statement":
      return {
        heading: "Cloth and footwear\ncollection",
        text: "We offer more than clothing and footwear: a canvas for who you are. Every piece is chosen for style and comfort, so you can make a statement with every step.",
      };
    case "collection-grid":
      return { heading: "Featured collections", subheading: "Mix and match. Find the pieces that are you.", featureText: "New season styles are in", featureButton: "Discover", count: "6", tone: "light" };
    case "image-text":
      return {
        heading: "Made to last",
        text: "We design pieces we want to wear every day: honest fabrics, relaxed fits and colours that go with everything.",
        buttonLabel: "About us",
        buttonLink: "/pages/about",
        image: PHOTO("photo-1523381210434-271e8be1f52b", 1400),
        imageSide: "left",
      };
    case "marquee":
      return { text: "Free delivery on prepaid orders · Easy exchanges · Cash on delivery available" };
    case "newsletter":
      return { heading: "Join the list", text: "New drops and offers, straight to your inbox. No spam.", placeholder: "Your email", buttonLabel: "Subscribe", doneText: "Thanks, you're on the list." };
    case "category-cards":
      return { heading: "Featured categories", subheading: "Shop by your favourite category in seconds.", buttonLabel: "Check all categories" };
    case "offer-split":
      return {
        image: PHOTO("photo-1545424273-4dd93a233016", 1400),
        eyebrow: "Limited time only",
        heading: "Save 40% on select\nlifestyle essentials.",
        text: "Our favourite pieces for home and every day, at their best price this season.",
        buttonLabel: "Shop the sale",
        buttonLink: "/catalog?sale=1",
        panelImage: PHOTO("photo-1617957689233-207e3cd3c610", 1000),
      };
    case "category-rows":
      return { heading: "Choose a category", buttonLabel: "See all" };
    case "collection-tiles":
      return { heading: "New collections", text: "Discover our newest collections, made with care and attention to every detail.", buttonLabel: "All collections" };
    case "brand-story":
      return {
        heading: "About the brand",
        image: PHOTO("photo-1786484215720-7421dec7e56c", 900),
        text: "We started this brand out of love for honest design. We were tired of things that last one season, so we chose a slower, more thoughtful way.\n\nWe know every maker we work with, and we check every piece before it reaches you.",
        image2: PHOTO("photo-1594223274512-ad4803739b7c", 1200),
        newsHeading: "Stay in\nthe loop",
        newsText: "Get styling ideas, new arrivals and invitations to private launches.",
        newsButton: "Subscribe",
      };
    case "contact-block":
      return {
        heading: "Get in touch",
        image: PHOTO("photo-1584917865442-de89df76afd3", 1000),
        hours: "Mon–Fri: 10:00–20:00\nSat–Sun: 11:00–19:00",
        text: "Questions about an order, a size or a gift? We usually reply within a few hours.",
      };
    case "collection-feature":
      return {
        heading: "The signature collection",
        productImage: PHOTO("photo-1679224106783-c21b1841412a", 900),
        text: "A small collection made from the finest materials, crafted with care for everyday use.",
        buttonLabel: "Shop now",
        buttonLink: "/catalog",
        image: PHOTO("photo-1530700131180-d43d9b8cc41f", 1200),
        imageSide: "right",
      };
    case "look-cards":
      return {
        heading: "Everyday\ninspiration",
        text: "From early mornings to late evenings, easy pieces made to fit the way you live.",
        buttonLabel: "Explore all collections",
        buttonLink: "/catalog",
        l1Image: PHOTO("photo-1553247407-23251ce81f59", 1000),
        l1Title: "Say it\nwith a tee",
        l1Link: "/catalog",
        l2Image: PHOTO("photo-1628030328071-538b251a4455", 1000),
        l2Title: "Bold never\ngets old",
        l2Link: "/catalog",
      };
    case "colour-chips":
      return {
        heading: "Explore\nby colour",
        colours: "Red #E5604D\nGreen #7FB241\nNavy #233B6E\nWhite #F4F4F2\nBlue #8EC5E8\nPurple #9B5DE5\nPink #F06FA4\nYellow #F2C94C\nBlack #1B1B1B\nBrown #8A5A3C",
      };
    case "testimonial":
      return {
        label: "What people said",
        heading: "Love the way they\nhandled my order.",
        text: "Friendly, quick and careful. The parcel came neatly packed and right on time. I will surely be back for more.",
        name: "Ananya Rao",
        role: "Verified buyer",
        image: PHOTO("photo-1758274251700-3ff5df155821", 1800),
      };
    case "why-stats":
      return {
        heading: `Why shop ${storeName}`,
        text: "Easy everyday pieces, thoughtful design and a smooth checkout, from your first click to your doorstep.",
        image: PHOTO("photo-1441984904996-e0b6ba687e04", 1800),
        n1Value: "24–48h",
        n1Label: "Fast delivery",
        n1Text: "To most cities",
        n2Value: "100%",
        n2Label: "Secure checkout",
        n2Text: "UPI, cards and cash on delivery",
        n3Value: "5K+",
        n3Label: "Happy customers",
        n3Text: "Who love the fit and finish",
      };
    case "category-panels":
      return { heading: "", buttonLabel: "Shop now" };
    case "featured-product":
      return {
        heading: "Featured products\nfrom our store",
        text: "Hand-picked from the newest drop, chosen for comfort on long days.",
        source: "newest",
        buttonLabel: "See all products",
        buttonLink: "/catalog",
      };
    case "promo-banner":
      return {
        image: PHOTO("photo-1515955656352-a1fa3ffcd111", 1800),
        heading: "Made for\nthe long run",
        text: "Lighter, softer and ready for every mile.",
        buttonLabel: "Shop now",
        buttonLink: "/catalog",
      };
    case "brand-strip":
      return { names: "Kestrel · Orbit · Nimbus · Halo · Vantage · Atlas · Pulse" };
    case "category-spotlight":
      return {
        heading: "Accessories",
        source: "newest",
        image: PHOTO("photo-1542529727-24cb357c57d2", 1000),
        image2: PHOTO("photo-1606483956061-46a898dce538", 1000),
        buttonLabel: "Shop all",
        buttonLink: "/catalog",
      };
    case "custom-order":
      return {
        heading: "Make it\nyour way",
        noteLabel: "Important note",
        note: "Made-to-order items need at least one day's notice. Need it sooner? Pick from our ready range.",
        o1Label: "Size",
        o1Options: "Small, Medium, Large",
        o2Label: "Flavour",
        o2Options: "Vanilla, Chocolate, Strawberry",
        o3Label: "",
        o3Options: "",
        o4Label: "",
        o4Options: "",
        image: PHOTO("photo-1783171375537-af3cca3ba347", 900),
        buttonLabel: "Order on WhatsApp",
      };
    case "claims-strip":
      return { text: "Certified organic · Low in sugar · Under 40 calories · Made in small batches · Real fruit" };
    case "product-spotlight":
      return { source: "bestsellers", image: "" };
    case "steps":
      return {
        eyebrow: "How it works",
        heading: "Ordering is easy",
        image: "",
        s1Title: "Pick your favourites",
        s1Text: "Browse the shop and add what you love to your bag.",
        s2Title: "Pay your way",
        s2Text: "UPI, cards or cash on delivery.",
        s3Title: "We pack it with care",
        s3Text: "Every order is checked and packed by hand.",
        s4Title: "Delivered to your door",
        s4Text: "Track it all the way with the link we send you.",
      };
    case "faq":
      return {
        heading: "Questions",
        text: "Can't find your answer? Message us on WhatsApp.",
        q1: "How long does delivery take?",
        a1: "Orders are packed within 1–2 working days and arrive in 3–7 days across India.",
        q2: "Can I pay cash on delivery?",
        a2: "Yes, cash on delivery is available on most orders. UPI and cards work too.",
        q3: "How do returns work?",
        a3: "Message us within 7 days of delivery and we'll help you with an exchange.",
        q4: "",
        a4: "",
        q5: "",
        a5: "",
      };
    case "highlights":
      return {
        eyebrow: "",
        heading: "What makes it special",
        text: "",
        h1Image: PHOTO("photo-1635355995448-77b02d33621d", 700),
        h1Title: "Chosen with care",
        h1Text: "Every piece is checked before it ships.",
        h2Image: PHOTO("photo-1486548730767-5c679e8eda6b", 700),
        h2Title: "Made in small batches",
        h2Text: "So quality stays high.",
        h3Image: PHOTO("photo-1742748912566-b2f1851e6021", 700),
        h3Title: "Honest prices",
        h3Text: "No middlemen, no surprises.",
        h4Image: PHOTO("photo-1771541897176-44a3e01dc484", 700),
        h4Title: "Fast delivery",
        h4Text: "Across India, tracked all the way.",
      };
    case "facts":
      return {
        eyebrow: "The details",
        heading: "What's inside",
        image: PHOTO("photo-1781560149615-81883cdd1eec", 1000),
        rows: "Size: Standard\nMade in: India\nDelivery: 3–7 days",
        note: "",
        buttonLabel: "Shop now",
        buttonLink: "/catalog",
      };
    case "category-tints":
      return { buttonLabel: "Shop" };
    case "sale-banner":
      return {
        heading: "Up to 50% off\nselected items",
        text: "Don't miss out on our biggest sale of the season.",
        buttonLabel: "Shop the sale",
        buttonLink: "/catalog?sale=1",
        image: PHOTO("photo-1600185365483-26d7a4cc7519", 900),
      };
    case "photo-cta":
      return { image: PHOTO("photo-1766241883982-93328f309dc9", 1800), buttonLabel: "Shop products", buttonLink: "/catalog" };
    case "gradient-statement":
      return { heading: "Made for everyday you", text: "Simple, honest products made to fit your day." };
    case "wordmark-feature":
      return {
        word: "NEW",
        image: PHOTO("photo-1631700611307-37dbcb89ef7e", 1200),
        label: "New product",
        text: "Our newest favourite is here.",
        buttonLabel: "Shop now",
        buttonLink: "/catalog",
      };
    case "tag-cloud":
      return { text: "Fresh · Handmade · Small batch · Honest prices · Fast delivery · Made in India" };
    case "bento-benefits":
      return {
        eyebrow: "Benefits",
        heading: "Why people\n*keep coming back*",
        b1Title: "Made with care",
        b1Text: "Every order is checked and packed by hand.",
        b2Title: "Honest ingredients",
        b2Text: "Nothing you can't pronounce.",
        b3Title: "Loved by thousands",
        b3Text: "Our customers come back again and again.",
        p1Image: PHOTO("photo-1589785186418-d00a641ebd35", 900),
        p2Image: PHOTO("photo-1514995428455-447d4443fa7f", 900),
        p3Image: PHOTO("photo-1572490122747-3968b75cc699", 900),
        p4Image: PHOTO("photo-1679384322991-f6f16a34aaa9", 900),
      };
    case "category-strip":
      return { heading: "Shop by category", text: "Everything you need, in one place." };
    case "edge-tiles":
      return {
        t1Image: PHOTO("photo-1708220040824-b273dd0a17cc", 900),
        t1Title: "Statement studs",
        t1Button: "Shop earrings",
        t1Link: "/catalog",
        t2Image: PHOTO("photo-1654699991520-aaaf4dd2608b", 900),
        t2Title: "The pearl edit",
        t2Button: "Shop now",
        t2Link: "/catalog",
        t3Image: PHOTO("photo-1777817117657-d2fa6aacef06", 900),
        t3Title: "Stack it up",
        t3Button: "Shop bracelets",
        t3Link: "/catalog",
        t4Image: PHOTO("photo-1786052337650-9e1c0dd01f5e", 900),
        t4Title: "Most wanted",
        t4Button: "Shop necklaces",
        t4Link: "/catalog",
      };
    case "engraving":
      return {
        heading: "Make it yours",
        text: "Add initials, a date or a short word. Type it below to see how it looks, then send it to us.",
        image: PHOTO("photo-1777999802051-f6f0296e76af", 1200),
        placeholder: "A + R",
        buttonLabel: "Ask about engraving",
      };
    case "type-collage":
      return {
        line1: storeName,
        line2: "*The* perfect piece",
        line3: "for you.",
        image: PHOTO("photo-1651160670627-2896ddf7822f", 900),
        noteLeft: "Every piece is shaped by hand and finished in our studio.",
        noteRight: "We make jewellery meant to be worn every day and passed on.",
      };
    case "collection-slider":
      return { heading: "New in", text: "Every piece tells a story, and you can tell yours.", source: "newest", buttonLabel: "View all", buttonLink: "/catalog" };
    case "guide-row":
      return {
        heading: "Inside the house",
        g1Image: PHOTO("photo-1659576645657-154a2b1db97f", 900),
        g1Title: "Our promise",
        g1Link: "/pages/about",
        g2Image: PHOTO("photo-1564428566702-e7db579d5b9e", 900),
        g2Title: "Our story",
        g2Link: "/pages/about",
        g3Image: PHOTO("photo-1628058494685-6c2f796ac24a", 900),
        g3Title: "Our studio",
        g3Link: "/pages/about",
        g4Image: "",
        g4Title: "",
        g4Link: "",
      };
    case "duo-promo":
      return {
        image: PHOTO("photo-1458538977777-0549b2370168", 1400),
        eyebrow: "New arrivals",
        heading: "The new collection",
        buttonLabel: "Shop now",
        buttonLink: "/catalog",
        smallImage: PHOTO("photo-1593472129865-f71f62103a47", 900),
        smallTitle: "Fine jewellery",
        smallButton: "Discover",
        smallLink: "/catalog",
      };
    case "offset-pair":
      return {
        aImage: PHOTO("photo-1785744556873-bfa4e74ff7e0", 1000),
        aEyebrow: "In the mood",
        aTitle: "A signature look",
        aButton: "Discover",
        aLink: "/catalog",
        bImage: PHOTO("photo-1737498205249-b075c65b7b32", 1000),
        bEyebrow: "Gifting",
        bTitle: "A promise kept",
        bButton: "Shop now",
        bLink: "/catalog",
      };
    case "scent-quiz":
      return {
        heading: "Find your favourite",
        text: "Pick what you're in the mood for.",
        options: "Fresh: fresh\nFloral: floral\nWarm: warm\nWoody: wood",
        buttonLabel: "See all",
      };
    case "countdown-deals":
      return { heading: "Hot deals", endsAt: "23:59", source: "sale" };
    case "spotlight-cards":
      return {
        c1Image: PHOTO("photo-1591290619618-904f6dd935e3", 1000),
        c1Title: "Wireless charger",
        c1Text: "Every piece is made to last beyond the season.",
        c1Button: "Shop collection",
        c1Link: "/catalog",
        c2Image: PHOTO("photo-1585771724684-38269d6639fd", 1000),
        c2Title: "Studio headphones",
        c2Text: "Big sound, all-day comfort.",
        c2Button: "Shop collection",
        c2Link: "/catalog",
      };
    case "review-spotlight":
      return {
        label: "Our customers' reviews",
        image: PHOTO("photo-1585771724684-38269d6639fd", 900),
        text: "Great quality and fast delivery. Exactly what I was looking for.",
        name: "Happy customer",
      };
    case "menu-board":
      return { heading: "The full menu", text: "Everything we make, fresh to order.", note: "Ask us about allergens." };
    case "tilt-gallery":
      return {
        heading: "Good times",
        p1Image: PHOTO("photo-1638368593249-7cadb261e8b3", 800),
        p1Title: "Hot off the grill",
        p2Image: PHOTO("photo-1763993679664-6afaf7ff043d", 800),
        p2Title: "Come hang out",
        p3Image: PHOTO("photo-1598679253544-2c97992403ea", 800),
        p3Title: "Extra crispy",
      };
    case "combo-builder":
      return {
        heading: "Build your combo",
        text: "Pick one from each, and we'll add them all to your bag.",
        c1Label: "Pick a main",
        c1Source: "bestsellers",
        c2Label: "Add a side",
        c2Source: "newest",
        c3Label: "Grab a drink",
        c3Source: "sale",
        buttonLabel: "Add combo to bag",
      };
    case "stage":
      return { heading: "Elegance in\nevery detail", image: PHOTO("photo-1769230361954-69a5bd0fcb2e", 1000), word: storeName, buttonLabel: "", buttonLink: "/catalog" };
    case "story-card":
      return {
        image: PHOTO("photo-1616121341778-0dd435d03d23", 900),
        heading: "About us",
        text: `At ${storeName}, we believe what you wear should feel personal.\n\nEvery piece is chosen with care and made to be loved for years.`,
        buttonLabel: "",
        buttonLink: "/pages/about",
      };
    case "collection-collage":
      return {
        heading: "Summer\ncollections",
        badge: "New",
        year: String(new Date().getFullYear()),
        buttonLink: "/catalog",
        p1Image: PHOTO("photo-1633555234296-657a18d8b81a", 800),
        p2Image: PHOTO("photo-1602173574767-37ac01994b2a", 800),
        p3Image: PHOTO("photo-1759346562312-ceb69f73cb7d", 800),
        p4Image: PHOTO("photo-1616121341778-0dd435d03d23", 800),
      };
    case "mission-band":
      return {
        eyebrow: "Because looking good and doing good go hand in hand",
        heading: `${storeName} is for *kind people* who love giving back, and *looking good* while doing it.`,
        ticker: "A share of every order goes to a good cause · Handmade in small batches · Packed plastic-free",
      };
    case "occasion-mosaic":
      return {
        heading: "Shop by *occasion*",
        buttonLabel: "View all",
        buttonLink: "/catalog",
        o1Image: PHOTO("photo-1654764746225-e63f5e90facd", 900),
        o1Title: "The wedding edit",
        o1Text: "Explore",
        o1Link: "/catalog",
        o2Image: PHOTO("photo-1698460918119-7359a8a945a0", 1200),
        o2Title: "Haldi & mehendi",
        o2Text: "Shop yellows & greens",
        o2Link: "/catalog",
        o3Image: PHOTO("photo-1765870973931-87c8eabd6055", 700),
        o3Title: "Cocktail night",
        o3Text: "Shop gowns",
        o3Link: "/catalog",
        o4Image: PHOTO("photo-1597897569252-9df44c7de0db", 700),
        o4Title: "Festive ready",
        o4Text: "Shop silks",
        o4Link: "/catalog",
        o5Image: PHOTO("photo-1768651925875-d1523ed07cb6", 1200),
        o5Title: "Casual ethnic",
        o5Text: "Shop kurtis & suits",
        o5Link: "/catalog",
      };
    case "promise-icons":
      return {
        i1Title: "Authentic quality",
        i1Text: "Handpicked fabrics and craftsmanship you can rely on.",
        i2Title: "Modern tradition",
        i2Text: "Timeless heritage, made for today.",
        i3Title: "Express delivery",
        i3Text: "Fast shipping across India with tracking.",
        i4Title: "Easy returns",
        i4Text: "7-day hassle-free returns and exchanges.",
        i5Title: "Secure payment",
        i5Text: "UPI, cards and cash on delivery.",
      };
    case "popular-searches":
      return { heading: "Popular searches", terms: "New arrivals: new\nBest sellers: best\nOn sale: sale" };
    case "weave-guide":
      return {
        heading: "Know your *weaves*",
        text: "Every region weaves its own story. Pick one to see what makes it special.",
        w1Name: "Banarasi",
        w1Image: PHOTO("photo-1678705730064-a7ecbab4b3fb", 1000),
        w1Text: "Woven in Varanasi with real zari, Banarasi silks carry florals and leaves in gold and silver thread.",
        w1Term: "banarasi",
        w2Name: "Kanjivaram",
        w2Image: PHOTO("photo-1679006831648-7c9ea12e5807", 1000),
        w2Text: "Heavy mulberry silk from Kanchipuram, with temple borders and a contrast pallu.",
        w2Term: "kanjivaram",
      };
    case "heritage-trio":
      return {
        heading: "About us",
        image: PHOTO("photo-1756483482418-3f3e4c13f9b0", 900),
        storyHeading: "Our story",
        text: `${storeName} brings you pieces made by hand, by people who have practised their craft for generations.`,
        v1Title: "Handmade",
        v1Text: "By skilled artisans",
        v2Title: "Pure materials",
        v2Text: "Checked by hand",
        v3Title: "Made to last",
        v3Text: "Passed down for years",
        formHeading: "Need help choosing?",
        formText: "Leave your name and we'll message you on WhatsApp.",
        buttonLabel: "Send on WhatsApp",
      };
    case "craft-timeline":
      return {
        heading: "Our journey",
        t1Year: "2015",
        t1Title: "Where it started",
        t1Text: "A small workshop and a big idea.",
        t2Year: "2018",
        t2Title: "Growing up",
        t2Text: "More makers joined us.",
        t3Year: "2021",
        t3Title: "Our first store",
        t3Text: "We opened our doors to customers.",
        t4Year: "Today",
        t4Title: "Online, everywhere",
        t4Text: "Delivered to your door, anywhere in India.",
      };
    case "collection-circles":
      return { eyebrow: "Shop by category", heading: "Explore our\ncollections", text: "Find something for every mood, occasion and style.", buttonLabel: "View all", buttonLink: "/catalog" };
    case "feature-duo":
      return {
        eyebrow: "Featured collection",
        heading: "Traditional\nhandloom",
        text: "Pure weaves. Timeless beauty.",
        image: PHOTO("photo-1619516388835-2b60acc4049e", 1400),
        buttonLabel: "Shop now",
        buttonLink: "/catalog",
        eyebrow2: "Trending now",
        heading2: "New this season",
        text2: "Rich heritage. Modern elegance.",
        image2: PHOTO("photo-1616986491129-3e37cb654c82", 1000),
        buttonLabel2: "Shop new",
        buttonLink2: "/catalog",
      };
    case "coupon-banner":
      return { eyebrow: "Special offer", heading: "Get 10% off\non your first order", code: "WELCOME10", image: PHOTO("photo-1613665667184-81bb9b8605e2", 1200) };
    case "drape-styles":
      return {
        eyebrow: "Style guide",
        heading: "Ways to *wear it*",
        d1Image: PHOTO("photo-1769275061721-bb6439d24ebc", 700),
        d1Title: "Classic",
        d1Text: "The everyday way, easy and elegant.",
        d1Link: "/catalog",
        d2Image: PHOTO("photo-1761125135357-99cbe52a6271", 700),
        d2Title: "Festive",
        d2Text: "Dressed up for celebrations.",
        d2Link: "/catalog",
        d3Image: PHOTO("photo-1769275061088-85697a30ee50", 700),
        d3Title: "Relaxed",
        d3Text: "Light and comfortable for long days.",
        d3Link: "/catalog",
        d4Image: PHOTO("photo-1610189337543-1c5d8e64f574", 700),
        d4Title: "Party",
        d4Text: "A modern look for the evening.",
        d4Link: "/catalog",
      };
    case "story-rings":
      return { heading: "" };
    case "label-tiles":
      return { heading: "Shop by category" };
    case "offer-band":
      return { heading: "15% off above ₹1499", text: "COD available · 7-day easy returns", buttonLabel: "Shop the sale", buttonLink: "/catalog" };
    case "budget-picker":
      return { heading: "Shop by budget", ranges: "Under ₹999: 0-999\n₹1000–1500: 1000-1500\n₹1500–2000: 1500-2000\n₹2000+: 2000-", buttonLabel: "See everything" };
    case "size-finder":
      return {
        heading: "XS to 5XL, *same styles*",
        text: "Pick your size to see what it fits.",
        sizes: "XS: 32 / 26 / 35\nS: 34 / 28 / 37\nM: 36 / 30 / 39\nL: 38 / 32 / 41\nXL: 40 / 34 / 43\n2XL: 42 / 36 / 45\n3XL: 44 / 38 / 47\n4XL: 46 / 40 / 49\n5XL: 48 / 42 / 51",
        buttonLabel: "Shop all styles",
        buttonLink: "/catalog",
      };
    case "look-trio":
      return {
        image: PHOTO("photo-1622347196821-2e71f9a7ebfc", 1200),
        heading: "Made for\neveryday",
        text: "Thoughtful pieces, modern shapes and timeless style, for the spaces you live in, not just look at.",
        buttonLabel: "Shop the look",
        buttonLink: "/catalog",
        smallImage: PHOTO("photo-1705526966290-2de7b8a33f03", 700),
      };
    case "room-shop":
      return {
        heading: "Shop the room",
        text: "Tap a dot to see what's in the picture.",
        image: PHOTO("photo-1644410960965-0a43b7358f70", 1800),
        source: "bestsellers",
        h1X: "30",
        h1Y: "55",
        h2X: "58",
        h2Y: "40",
        h3X: "75",
        h3Y: "70",
        h4X: "15",
        h4Y: "30",
      };
    case "circle-tints":
      return { heading: "Shop by category" };
    case "feature-slider":
      return {
        f1Image: PHOTO("photo-1632258521940-b29d7d2ae9f5", 1200),
        f1Title: "Art prints",
        f1Text: "Prints designed to celebrate the places that feel like home.",
        f1Button: "Shop prints",
        f1Link: "/catalog",
        f2Image: PHOTO("photo-1783544770399-d1af97c9628b", 1200),
        f2Title: "Cards for every moment",
        f2Text: "Birthdays, thank-yous and just-because notes.",
        f2Button: "Shop cards",
        f2Link: "/catalog",
      };
    case "scallop-band":
      return {
        heading: "Dive right in!",
        text: "Our most-loved collections, all in one place.",
        t1Image: PHOTO("photo-1783544770399-d1af97c9628b", 700),
        t1Label: "Postcards",
        t1Link: "/catalog",
        t2Image: PHOTO("photo-1720698992880-ae93ea16aac9", 700),
        t2Label: "Mugs",
        t2Link: "/catalog",
        t3Image: PHOTO("photo-1549465220-1a8b9238cd48", 700),
        t3Label: "Gifts",
        t3Link: "/catalog",
      };
    case "editorial-trio":
      return {
        heading: "",
        e1Image: PHOTO("photo-1603950227760-e609ce8e15b4", 800),
        e1Script: "Moments",
        e1Title: "Slow mornings",
        e1Link: "/catalog",
        e2Image: PHOTO("photo-1592903297149-37fb25202dfa", 800),
        e2Script: "Gifting",
        e2Title: "Wrapped with love",
        e2Link: "/catalog",
        e3Image: PHOTO("photo-1765870972916-48b69771eb10", 800),
        e3Script: "Evenings",
        e3Title: "Dressed for the night",
        e3Link: "/catalog",
      };
    case "gift-note":
      return {
        heading: "Add a *handwritten* note",
        text: "Write your message and we'll write it by hand on a card tucked inside the box.",
        image: PHOTO("photo-1545844568-98bb15133ec0", 1000),
        buttonLabel: "Save my note",
      };
    case "wave-signup":
      return { eyebrow: "join our", heading: "VIP list", text: "Be the first to know about new collections and exclusive offers." };
    case "promo-trio":
      return {
        c1Eyebrow: "Selected items, online only",
        c1Title: "Hot summer deals",
        c1Image: PHOTO("photo-1537151608828-ea2b11777ee8", 700),
        c1Button: "Shop now",
        c1Link: "/catalog",
        c2Eyebrow: "Treats & grooming",
        c2Title: "Spoil your true love",
        c2Image: PHOTO("photo-1596854273338-cbf078ec7071", 700),
        c2Button: "Shop now",
        c2Link: "/catalog",
        c3Eyebrow: "A brand you will love",
        c3Title: "New in this year",
        c3Image: PHOTO("photo-1758120014319-a7237c9f4a47", 700),
        c3Button: "Shop now",
        c3Link: "/catalog",
      };
    case "pet-picker":
      return {
        heading: "Shop by pet",
        p1Name: "Dogs",
        p1Image: PHOTO("photo-1543466835-00a7907e9de1", 400),
        p1Term: "dog",
        p2Name: "Cats",
        p2Image: PHOTO("photo-1592194996308-7b43878e84a6", 400),
        p2Term: "cat",
        p3Name: "Birds",
        p3Image: PHOTO("photo-1552728089-57bdde30beb3", 400),
        p3Term: "bird",
        buttonLabel: "See everything",
      };
    case "pastel-tiles":
      return { heading: "Top *categories*" };
    case "glaze-picker":
      return {
        heading: "Pick a colour",
        text: "Tap a colour to see it up close and the pieces made in it.",
        g1Name: "Cream",
        g1Colour: "#E6DACB",
        g1Text: "Warm and easy to live with.",
        g1Match: "white",
        g2Name: "Blue",
        g2Colour: "#8FB3C9",
        g2Text: "Soft and calm.",
        g2Match: "blue",
        g3Name: "Yellow",
        g3Colour: "#E9B949",
        g3Text: "Bright and cheerful.",
        g3Match: "yellow",
        emptyText: "Nothing in this colour right now.",
        linkLabel: "See them all",
      };
    case "care-guide":
      return {
        heading: "Caring for your pieces",
        text: "A little care keeps them looking new for years.",
        c1Title: "Dishwasher",
        c1Icon: "dishwasher",
        c1Stamp: "Safe",
        c1Tone: "yes",
        c1Text: "Fine on a normal wash.",
        c2Title: "Microwave",
        c2Icon: "microwave",
        c2Stamp: "Safe",
        c2Tone: "yes",
        c2Text: "Fine for warming.",
        c3Title: "Sudden heat",
        c3Icon: "oven",
        c3Stamp: "Avoid",
        c3Tone: "no",
        c3Text: "Let it warm up slowly.",
      };
    case "spec-index":
      return { heading: "The index", text: "Everything we make, in one list.", source: "bestsellers", count: "6", colNo: "No.", colName: "Piece", colDetail: "Detail", colType: "Type", colPrice: "Price", linkLabel: "Full catalog", linkUrl: "/catalog" };
    case "drop-clock":
      return {
        label: "Next drop",
        heading: "Coming soon",
        text: "New pieces land every Friday at 6 pm.",
        endsAt: "",
        buttonLabel: "Get notified",
        buttonLink: "/catalog",
        daysLabel: "Days",
        hoursLabel: "Hours",
        minutesLabel: "Minutes",
        secondsLabel: "Seconds",
      };
    case "wood-planks":
      return {
        heading: "What it's made of",
        text: "The materials we choose, and why.",
        w1Name: "Oak",
        w1Colour: "#C49A6C",
        w1Note: "Strong and light",
        w1Text: "A hard, pale wood that lasts for generations.",
        w2Name: "Walnut",
        w2Colour: "#6B4A33",
        w2Note: "Rich and dark",
        w2Text: "A deep brown wood with a soft sheen.",
        w3Name: "Ash",
        w3Colour: "#D8C3A0",
        w3Note: "Pale and springy",
        w3Text: "A light wood with a lively grain.",
        linkLabel: "See pieces",
      };
    case "table-sizer":
      return {
        heading: "Which size fits?",
        text: "Pick how many people sit down.",
        z1Label: "4 seats",
        z1Seats: "4",
        z1Table: "140 × 85 cm",
        z1Room: "2.8 × 2.4 m",
        z1Link: "/catalog",
        z2Label: "6 seats",
        z2Seats: "6",
        z2Table: "180 × 90 cm",
        z2Room: "3.4 × 2.6 m",
        z2Link: "/catalog",
        sizeLabel: "Table",
        roomLabel: "Room you need",
        linkLabel: "See {seats}-seat tables",
      };
    case "studio-prints":
      return {
        label: "Our story",
        heading: "Made with care",
        text: "Every piece is made by hand, in small batches.",
        image: PHOTO("photo-1508269151431-a34449ca161d", 900),
        caption: "In the studio",
        image2: PHOTO("photo-1532570204726-145c7199f10e", 900),
        caption2: "Fresh from the kiln",
        signature: storeName,
        linkLabel: "Our story",
        linkUrl: "/pages/about",
      };
    case "word-story":
      return { w1Left: "Made", w1Right: "to last", w2Left: "Worn", w2Right: "every day", w3Left: "Loved", w3Right: "for years", w4Left: "", w4Right: "", source: "bestsellers", buttonLabel: "Shop" };
    case "scatter-gallery":
      return {
        heading: "Styled\nby you",
        text: "Tag us to be featured.",
        buttonLabel: "Follow us",
        buttonLink: "",
        g1Image: PHOTO("photo-1441984904996-e0b6ba687e04", 700),
        g2Image: "",
        g3Image: "",
        g4Image: "",
        g5Image: "",
        g6Image: "",
        tone: "dark",
      };
    case "review-board":
      return { label: "Reviews", heading: "What customers say", summary: "{avg} out of 5 from {n} reviews", verifiedLabel: "Verified buyer" };
    case "batch-calendar":
      return {
        heading: "Coming soon",
        text: "Our next drops, so you never miss one.",
        b1Date: "14 Nov",
        b1Title: "New collection",
        b1Note: "A small batch, made by hand",
        b1Status: "open",
        b1Link: "/catalog",
        b2Date: "28 Nov",
        b2Title: "Next drop",
        b2Note: "Coming soon",
        b2Status: "soon",
        openLabel: "Open now",
        soonLabel: "Coming soon",
        soldLabel: "Sold out",
      };
    case "impact":
      return {
        heading: "Every order counts",
        text: "Here's what our community has made possible so far.",
        n1Value: "12000+",
        n1Label: "Orders packed by hand",
        n2Value: "₹4.2L",
        n2Label: "Given to good causes",
        n3Value: "98%",
        n3Label: "Happy reviews",
      };
    case "stories":
      return {
        heading: "Journal",
        buttonLabel: "Read all",
        buttonLink: "/pages/about",
        s1Image: PHOTO("photo-1577042662593-b4d55517ce31", 900),
        s1Tag: "Interviews",
        s1Title: "In the details: how our pieces are made",
        s1Link: "/pages/about",
        s2Image: PHOTO("photo-1631270275218-fc3bd209e00c", 400),
        s2Tag: "Care",
        s2Title: "Slow living and caring for what you own",
        s2Link: "/pages/about",
        s3Image: PHOTO("photo-1582456780653-aabf23f711b9", 400),
        s3Tag: "Gifts",
        s3Title: "Thoughtful gifts for the ones you love",
        s3Link: "/catalog",
        s4Image: PHOTO("photo-1607810487891-f41ece2349df", 400),
        s4Tag: "Guides",
        s4Title: "Finding the right fit, step by step",
        s4Link: "/pages/shipping",
      };
    case "about-split":
      return {
        label: "01/ About us",
        heading: "*Made with care*\nfor the way you live",
        image: PHOTO("photo-1633944095397-878622ebc01c", 1200),
        image2: PHOTO("photo-1646170629004-b3c84a27fc17", 1200),
        text: "We make things with clean lines, honest materials and close attention to detail, for people who want pieces that last.",
        text2: "Everything we sell should feel good, work hard and stay beautiful for years.",
        linkLabel: "More about us",
        linkLink: "/pages/about",
      };
    case "perks":
      return {
        p1Title: "Free delivery",
        p1Text: "On prepaid orders above ₹999",
        p2Title: "Secure payments",
        p2Text: "UPI, cards and cash on delivery",
        p3Title: "Easy returns",
        p3Text: "7-day exchanges, no questions",
        p4Title: "Here to help",
        p4Text: "Chat with us on WhatsApp",
      };
  }
}

function defaultPages(storeName: string): Record<SitePageId, SitePage> {
  return {
    about: {
      title: "About us",
      body: `${storeName} started with a simple idea: clothes that feel good, last long and look right with everything else you own.\n\nEvery piece is chosen and checked by us before it reaches you.`,
    },
    contact: {
      title: "Contact",
      body: "Questions about an order, sizes or a product? Message us on WhatsApp or email us and we'll reply within a day.",
    },
    shipping: {
      title: "Shipping",
      body: "Orders are packed within 1–2 working days and delivered in 3–7 days across India.\n\nYou'll get a tracking link as soon as your order ships.",
    },
    returns: {
      title: "Returns & exchanges",
      body: "Not the right size? Message us within 7 days of delivery to exchange unworn items with tags attached.",
    },
    privacy: {
      title: "Privacy policy",
      body: "We use your name, phone number and address only to deliver your order and to contact you about it. We never sell your details.",
    },
    terms: {
      title: "Terms of service",
      body: "Prices are in Indian rupees and include taxes unless stated. Orders are confirmed once payment is verified or, for cash on delivery, once we call to confirm.",
    },
  };
}

// what each theme sells, so its About, Contact and policy pages read right
type ShopKind = "tech" | "restaurant" | "handmade" | "jewellery" | "fragrance" | "lifestyle" | "nutrition" | "bikes" | "fashion" | "furniture" | "ceramics" | "bags" | "pets" | "shoes" | "bakery" | "spices" | "drinks" | "skincare" | "ethnic" | "sarees" | "womenswear" | "homeware" | "prints" | "boutique" | "petstore";
const THEME_KIND: Record<SiteThemeSlug, ShopKind> = {
  "classic-bloom": "fashion",
  "mono-studio": "fashion",
  theme03: "fashion",
  theme04: "fashion",
  theme05: "shoes",
  theme06: "tech",
  f01: "furniture",
  f02: "furniture",
  theme07: "ceramics",
  theme08: "bags",
  theme09: "pets",
  theme10: "fashion",
  theme11: "shoes",
  theme12: "shoes",
  theme13: "bakery",
  theme14: "spices",
  theme15: "drinks",
  theme16: "skincare",
  theme17: "lifestyle",
  theme18: "skincare",
  theme19: "nutrition",
  theme20: "bikes",
  theme21: "jewellery",
  theme22: "jewellery",
  theme23: "fragrance",
  theme24: "tech",
  theme25: "restaurant",
  theme26: "jewellery",
  theme27: "handmade",
  theme28: "ethnic",
  theme29: "sarees",
  theme30: "sarees",
  theme31: "womenswear",
  theme32: "homeware",
  theme33: "prints",
  theme34: "boutique",
  theme35: "petstore",
};

function kindPages(kind: ShopKind, name: string): Partial<Record<SitePageId, Partial<SitePage>>> {
  switch (kind) {
    case "furniture":
      return {
        about: { title: "Our workshop", body: `${name} builds furniture by hand from solid wood, in small numbers and to order.\n\nEvery piece is sketched, cut, joined and finished in our own workshop, then delivered and placed in your home by our team.` },
        contact: { title: "Visit or write to us", body: "Planning a room or a custom piece? Send us the size of your space and a photo, and we'll reply within a day with ideas and prices." },
        shipping: { title: "Delivery & assembly", body: "Pieces in stock are delivered in 7–10 days. Made-to-order pieces take 4–6 weeks.\n\nOur team carries everything in, assembles it and takes the packaging away." },
        returns: { title: "Returns & warranty", body: "If something arrives damaged, tell us within 48 hours and we'll repair or replace it.\n\nEvery frame has a 5-year warranty. Custom pieces can't be returned." },
      };
    case "ceramics":
      return {
        about: { title: "Our studio", body: `${name} is a small ceramics studio. Every cup, bowl and vase is thrown, glazed and fired by hand, so no two are exactly alike.\n\nOur glazes are lead-free and safe for food, the microwave and the dishwasher.` },
        contact: { title: "Say hello", body: "Questions about a piece, a gift or a custom set for your café? Message us and we'll reply within a day." },
        returns: { title: "Breakages & returns", body: "Every order is packed in recycled paper. If anything arrives chipped or broken, send us a photo within 48 hours and we'll replace it." },
      };
    case "bags":
      return {
        about: { title: "About the brand", body: `${name} designs bags in soft leather and bold colours, made to be carried every day and loved for years.\n\nEach bag is cut and stitched by a small team of craftspeople.` },
        returns: { title: "Returns & care", body: "Message us within 7 days of delivery to return unused bags with tags attached.\n\nWipe leather with a dry cloth and keep your bag in its dust bag when you're not using it." },
      };
    case "pets":
      return {
        about: { title: "Our heritage", body: `${name} makes collars, leashes, beds and bowls for dogs and the people who love them.\n\nEverything is designed to be comfortable, safe and beautiful enough to leave out.` },
        contact: { title: "Contact", body: "Not sure about a size for your dog? Send us their neck and chest measurements and we'll help you pick." },
        returns: { title: "Returns & exchanges", body: "Wrong size? Message us within 7 days of delivery and we'll exchange unused items." },
      };
    case "shoes":
      return {
        about: { title: "About us", body: `${name} picks sneakers and running shoes we'd wear ourselves: light, comfortable and made to last mile after mile.\n\nEvery pair is checked before it ships.` },
        contact: { title: "Support", body: "Questions about sizing, an order or a return? Message us on WhatsApp or email and we'll reply within a day." },
        returns: { title: "Returns & exchanges", body: "Wrong size? Exchange unworn shoes in their original box within 7 days of delivery." },
      };
    case "bakery":
      return {
        about: { title: "About us", body: `${name} fries and glazes every donut fresh each morning, in small batches, with real butter, fruit and chocolate.\n\nWe started with one fryer and a lot of sprinkles, and we still do things the slow way.` },
        contact: { title: "Contacts", body: "Ordering for a party or an office? Message us a day ahead and we'll make it happen.\n\nWe deliver every day from 8 am to 8 pm." },
        shipping: { title: "Delivery", body: "We deliver warm donuts nearby every day from 8 am to 8 pm. Orders placed before 6 pm arrive the same day.\n\nDelivery is free on orders over ₹499." },
        returns: { title: "Refunds", body: "Fresh food can't be returned, but if anything is wrong with your order, message us within 2 hours of delivery with a photo and we'll make it right." },
      };
    case "spices":
      return {
        about: { title: "Our story", body: `${name} blends spices in small batches. We buy whole spices from small farms, toast and grind them ourselves and pack them the same week.\n\nNo fillers, no colours, no shortcuts.` },
        contact: { title: "Contact us", body: "Questions about a blend, cooking tips or bulk orders for your restaurant? Message us and we'll reply within a day." },
        shipping: { title: "Shipping", body: "Orders are packed within 1–2 days and delivered in 3–6 days across India." },
        returns: { title: "Returns", body: "Food items can't be returned once opened. If a jar arrives damaged, send us a photo within 48 hours and we'll replace it." },
      };
    case "drinks":
      return {
        about: { title: "About", body: `${name} makes fermented fruit sodas with real fruit, live cultures and very little sugar.\n\nEvery batch is brewed slowly, then canned cold so it stays fizzy and fresh.` },
        contact: { title: "Contact", body: "Want our cans in your café or at your event? Message us and we'll send you a wholesale price list." },
        shipping: { title: "Shipping", body: "Cans ship in sturdy boxes and arrive in 3–6 days. Keep them cool and enjoy within 9 months." },
        returns: { title: "Returns", body: "Drinks can't be returned, but if a can arrives dented or leaking, send us a photo within 48 hours and we'll send a new one." },
      };
    case "tech":
      return {
        about: { title: "About us", body: `${name} picks phone cases, chargers, audio and smart gear that we use ourselves, and tests each one before it goes on sale.\n\nEvery product comes with a warranty and real people to help.` },
        contact: { title: "Support", body: "Not sure if something fits your phone? Send us your model and we'll check before you order." },
        returns: { title: "Returns & warranty", body: "Return unused items within 14 days. Electronics have a 6-month warranty against defects; message us with a photo or video and we'll replace it." },
      };
    case "restaurant":
      return {
        about: { title: "Our story", body: `${name} started with one grill and a love for proper smash burgers. Everything is made fresh to order, from the patties to the sauces.` },
        contact: { title: "Find us", body: "Craving something? Order online, call ahead for pickup, or message us for parties and bulk orders." },
        shipping: { title: "Delivery", body: "We deliver hot food nearby in about 35 minutes. Delivery is free on orders over ₹499." },
        returns: { title: "Refunds", body: "If anything is wrong with your order, message us within an hour with a photo and we'll make it right." },
      };
    case "handmade":
      return {
        about: { title: "Our mission", body: `${name} makes well-sourced, handmade jewellery in small batches.\n\nWe give part of every order to research and good causes, because looking good and doing good should go hand in hand.` },
        contact: { title: "Contact", body: "Questions about a stone, a custom length or a gift? Message us and we'll reply within a day." },
        returns: { title: "Returns", body: "Unworn pieces can be returned within 14 days. Custom pieces can't be returned, but we'll always help fix anything that breaks." },
      };
    case "jewellery":
      return {
        about: { title: "Our world", body: `${name} designs gold jewellery to be worn every day, layered, stacked and passed on.\n\nEvery piece is made by skilled craftspeople and finished by hand before it reaches you.` },
        contact: { title: "Contact", body: "Want an engraving, help choosing a gift or news about your order? Message us and we'll reply within a day." },
        returns: { title: "Returns & care", body: "Unworn pieces can be returned within 14 days in their original box. Engraved and made-to-order pieces can't be returned.\n\nKeep your jewellery dry and store it in its pouch to keep it shining." },
      };
    case "fragrance":
      return {
        about: { title: "The maison", body: `${name} brings together fragrances and fine jewellery chosen for how they make you feel.\n\nEvery order is wrapped by hand and comes with two samples to try.` },
        contact: { title: "Contact", body: "Need help choosing a scent or a gift? Tell us what you love and we'll suggest a few to try." },
        returns: { title: "Returns", body: "Unopened fragrances and unworn jewellery can be returned within 14 days in their original packaging." },
      };
    case "lifestyle":
      return {
        about: { title: "About us", body: `${name} brings together modern pieces for everyday life: clothing, home, tech and little extras that make a day better.\n\nWe pick every item ourselves and only stock things we'd use at home.` },
        contact: { title: "Help", body: "Questions about an order, a product or a return? Message us and we'll reply within a day." },
      };
    case "nutrition":
      return {
        about: { title: "Our story", body: `${name} makes protein drinks you'll actually want to finish: 20 g of protein, prebiotic fibre and no added sugar, in flavours that taste like a treat.\n\nMade for your gut, your muscles and your mornings.` },
        contact: { title: "Contact", body: "Questions about ingredients, allergies or subscriptions? Message us and we'll reply within a day." },
        shipping: { title: "Shipping", body: "Orders are packed within 1–2 days and delivered in 3–6 days across India. Bottles ship in insulated boxes." },
        returns: { title: "Returns", body: "Food items can't be returned, but if a bottle arrives damaged or leaking, send us a photo within 48 hours and we'll replace it." },
      };
    case "bikes":
      return {
        about: { title: "About us", body: `${name} designs carbon bikes and the accessories to go with them, for road, gravel and city riding.\n\nEvery bike is checked, tuned and test-ridden before it ships.` },
        contact: { title: "Service & support", body: "Need help with sizing, assembly or a service? Message us with your bike model and we'll get you riding." },
        shipping: { title: "Delivery", body: "Bikes ship 90% assembled in a protective box and arrive in 5–8 days. Accessories arrive in 3–6 days." },
        returns: { title: "Returns & warranty", body: "Unused accessories can be returned within 14 days. Every frame has a lifetime warranty and parts are covered for 2 years." },
      };
    case "skincare":
      return {
        about: { title: "Our formulas", body: `${name} makes gentle skincare from ancient grains: oats, rice, millet and quinoa.\n\nEvery formula is fragrance-free, dermatologically tested and never tested on animals.` },
        contact: { title: "Contact", body: "Not sure which product suits your skin? Tell us about your skin type and we'll suggest a simple routine." },
        returns: { title: "Returns", body: "Unopened products can be returned within 14 days. If a product doesn't agree with your skin, message us and we'll help." },
      };
    case "ethnic":
      return {
        about: { title: "Our story", body: `${name} brings together sarees, lehengas, suits and kurtis from weavers and designers across India.\n\nEvery piece is handpicked for its fabric and finish, so heritage craft and modern style meet in your wardrobe.` },
        contact: { title: "Styling help", body: "Need help with a size, a blouse or a custom fit? Message us on WhatsApp with the product name and we'll reply within a few hours." },
        shipping: { title: "Shipping", body: "Ready-to-ship pieces leave in 1–2 days and reach most cities in 3–6 days.\n\nStitched and customised pieces take 7–10 days more. We share tracking on WhatsApp." },
        returns: { title: "Returns & exchanges", body: "Unused pieces with tags can be returned or exchanged within 7 days.\n\nCustomised, stitched and bridal pieces can't be returned." },
      };
    case "sarees":
      return {
        about: { title: "About us", body: `${name} works directly with weaving families to bring you handwoven sarees: Banarasi, Kanjivaram, Chanderi, Paithani and more.\n\nEvery saree is checked by hand before it is folded, wrapped and sent to you.` },
        contact: { title: "Contact us", body: "Looking for a saree for a wedding or a gift? Tell us the occasion, colour and budget and we'll send you a few to choose from." },
        shipping: { title: "Shipping", body: "Sarees are shipped in 1–2 days and reach you in 3–7 days, anywhere in India.\n\nFall, pico and blouse stitching add 5–7 days." },
        returns: { title: "Returns", body: "Unworn sarees can be returned within 7 days in their original packing.\n\nSarees with fall and pico done or blouses stitched can't be returned." },
      };
    case "womenswear":
      return {
        about: { title: "About us", body: `${name} designs clothing in India, made for Indian bodies.\n\nEvery style comes in sizes XS to 5XL, cut for real shapes, and what you see is what arrives.` },
        contact: { title: "Help", body: "Not sure about a size? Send us your bust, waist and hip measurements and we'll tell you what fits." },
        shipping: { title: "Shipping", body: "Orders leave within 24 hours and reach you in 2–5 days. Cash on delivery is available." },
        returns: { title: "Returns & exchanges", body: "Easy returns and size exchanges within 7 days of delivery. Tags must be on." },
      };
    case "homeware":
      return {
        about: { title: "About", body: `${name} curates objects for modern living: lamps, seats, side tables and small things that make a room feel like yours.\n\nWe look for honest materials, playful shapes and pieces made to be used every day.` },
        contact: { title: "Contact", body: "Need help styling a room or checking a size? Send us a photo of your space and we'll suggest a few pieces." },
        shipping: { title: "Delivery", body: "Small objects ship in 2–3 days. Furniture is delivered in 7–12 days and placed where you want it." },
        returns: { title: "Returns", body: "Changed your mind? Return unused items within 14 days in their original packaging. Large pieces are collected from your door." },
      };
    case "prints":
      return {
        about: { title: "About", body: `${name} makes colourful illustrated prints, cards, tea towels and stationery that celebrate the places we love.\n\nEverything is designed in our studio and printed locally on recycled paper.` },
        contact: { title: "Contact", body: "Looking for a print of a place that's special to you, or ordering for your shop? Drop us a line." },
        shipping: { title: "Shipping", body: "Prints are rolled in sturdy tubes and cards are sent flat. Orders leave within 2 working days." },
        returns: { title: "Returns", body: "If anything arrives damaged, send us a photo within 7 days and we'll replace it." },
      };
    case "boutique":
      return {
        about: { title: "Our story", body: `${name} is a boutique of luxe little things: bags, jewellery, gifts and pieces for slow, beautiful days.\n\nEvery order is wrapped by hand in tissue and ribbon.` },
        contact: { title: "Contact us", body: "Questions about an order, a gift or a corporate hamper? Write to us and we'll reply within a day." },
        shipping: { title: "Shipping", body: "Orders are wrapped and sent within 2 days. Add a gift note at checkout and we'll write it by hand." },
        returns: { title: "Returns", body: "Unused items can be returned within 14 days. Personalised pieces can't be returned." },
      };
    case "petstore":
      return {
        about: { title: "About us", body: `${name} brings you food, treats, toys and comfy beds for dogs, cats and birds.\n\nWe only stock brands we'd feed our own pets, checked by vets.` },
        contact: { title: "Contact", body: "Not sure which food suits your pet's age or breed? Message us and our team will help you choose." },
        shipping: { title: "Delivery", body: "Orders above ₹999 ship free and arrive in 1–3 days. Subscribe to food and it arrives before you run out." },
        returns: { title: "Returns", body: "Unopened food and unused toys can be returned within 7 days." },
      };
    default:
      return {};
  }
}

export function getDefaultSiteContent(theme: string = "mono-studio", storeName = "Your brand"): SiteContent {
  const custom = getCustomTheme(theme);
  if (custom) {
    // uploaded themes are written for "Your brand"; put the shop's own name in
    const named = JSON.stringify(custom.content).split("Your brand").join(JSON.stringify(storeName).slice(1, -1));
    return resolveSiteContent(JSON.parse(named), custom.base, storeName);
  }
  const content = themeDefaultContent(theme, storeName);
  const pages = { ...content.pages };
  for (const [id, page] of Object.entries(kindPages(THEME_KIND[toSiteTheme(theme)], storeName)) as [SitePageId, Partial<SitePage>][]) {
    pages[id] = { ...pages[id], ...page };
  }
  // About and Contact show the theme's hero photo until the seller picks another
  const heroPhoto = content.sections.find((x) => x.type === "hero")?.settings.image || "";
  pages.about = { ...pages.about, image: pages.about.image || heroPhoto };
  pages.contact = { ...pages.contact, image: pages.contact.image || heroPhoto };
  return { ...content, pages, options: themeOptionDefaults(theme) };
}

function themeDefaultContent(theme: string, storeName: string): Omit<SiteContent, "options"> {
  const section = (id: string, type: SiteSectionType, extra: Record<string, string> = {}): SiteSection => ({
    id,
    type,
    settings: { ...defaultSectionSettings(type, storeName), ...extra },
  });
  const header = { catalogLabel: "Catalog", aboutLabel: "About", contactLabel: "Contact", homeLabel: "Home", saleLabel: "Sale", shopAllLabel: "Shop all", searchLabel: "Search", bagLabel: "Bag", accountLabel: "Account", wishlistLabel: "Wishlist", ordersLabel: "Orders", searchPlaceholder: "Search products", ctaLabel: "", ctaLink: "/catalog" };
  const footer = {
    about: `${storeName}. Thoughtfully made clothing, shipped across India.`,
    newsletterHeading: "Get new drops first",
    copyright: `© ${new Date().getFullYear()} ${storeName}`,
  };

  if (toSiteTheme(theme) === "f02") {
    return {
      announcement: "",
      settings: {
        background: "#F1EDE4",
        text: "#2B2620",
        accent: "#66752B",
        accentText: "#FFFFFF",
        panel: "#E8E3D8",
        textSize: "100",
        headingFont: "Inter Tight",
        displayFont: "Unbounded",
        bodyFont: "Inter",
        buttonShape: "square",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Catalog", aboutLabel: "About", contactLabel: "Delivery", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Dining furniture made to gather around, delivered across India.`, newsletterHeading: "New collections, first" },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          subheading: "“A home that *doesn't shout*”\n“Furniture that *speaks softly*”",
          buttonLabel: "Open catalog",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1604578762246-41134e37f9cc", 1800),
          imageLayout: "banner",
        }),
        section("rows", "category-rows", { heading: "Choose a category" }),
        section("hits", "product-row", { heading: "Bestsellers", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "See all", buttonLink: "/catalog" }),
        // the woods as planks that open, in place of four more product photos
        section("wood", "wood-planks", {
          heading: "Woods we work with",
          text: "Every table and chair is built from solid timber, joined the old way and finished by hand. No veneer, no chipboard.",
          w1Name: "Oak",
          w1Colour: "#C49A6C",
          w1Note: "Hard · pale · steady",
          w1Text: "Our everyday wood. Strong enough for a lifetime of dinners, and it turns honey-gold with age.",
          w1Link: "/category/dining-tables",
          w2Name: "Walnut",
          w2Colour: "#6B4A33",
          w2Note: "Rich · dark · soft sheen",
          w2Text: "Deep brown with a chocolate grain. We save it for chairs you'll want to run your hand over.",
          w2Link: "/category/dining-chairs",
          w3Name: "Smoked oak",
          w3Colour: "#3B2E25",
          w3Note: "Oak, darkened by smoke",
          w3Text: "The same strong oak, smoked until it's almost black. No stain, so scratches stay the same colour.",
          w3Link: "/category/dining-tables",
          w4Name: "Ash",
          w4Colour: "#D9C4A1",
          w4Note: "Light · springy · lively grain",
          w4Text: "Bends without breaking, which is why our curved chair backs are made from it.",
          w4Link: "/category/dining-chairs",
          linkLabel: "See pieces",
        }),
        section("room", "room-shop", {
          heading: "Set for eight",
          text: "Tap a dot to see the piece.",
          image: PHOTO("photo-1505409628601-edc9af17fda6", 1800),
          source: "bestsellers",
          h1X: "58",
          h1Y: "60",
          h2X: "40",
          h2Y: "68",
          h3X: "74",
          h3Y: "66",
          h4X: "50",
          h4Y: "76",
        }),
        section("sizer", "table-sizer", {
          heading: "Which table\nfits your room?",
          text: "Pick how many people sit down. We'll show the table, the chairs around it, and the room you need to pull them out comfortably.",
          z1Label: "4 seats",
          z1Seats: "4",
          z1Table: "140 × 85 cm",
          z1Room: "2.8 × 2.4 m",
          z1Link: "/category/dining-tables",
          z2Label: "6 seats",
          z2Seats: "6",
          z2Table: "180 × 90 cm",
          z2Room: "3.4 × 2.6 m",
          z2Link: "/category/dining-tables",
          z3Label: "8 seats",
          z3Seats: "8",
          z3Table: "220 × 95 cm",
          z3Room: "3.9 × 2.7 m",
          z3Link: "/category/dining-tables",
          z4Label: "10 seats",
          z4Seats: "10",
          z4Table: "260 × 100 cm",
          z4Room: "4.4 × 2.8 m",
          z4Link: "/category/dining-tables",
          sizeLabel: "Table",
          roomLabel: "Room you need",
          linkLabel: "See {seats}-seat tables",
        }),
        section("chairs", "product-row", { heading: "Shop by piece", subheading: "", source: "newest", display: "tabs", allLabel: "Everything", buttonLabel: "" }),
        section("offer", "offer-split", {
          image: PHOTO("photo-1547062200-f195b1c77e30", 1400),
          eyebrow: storeName,
          heading: "“Deeper than it looks…”",
          text: "Savings on the new Dusk collection",
          highlightLabel: "up to",
          highlight: "15%",
          note: "Offer ends this month",
          buttonLabel: "Go to catalog",
          buttonLink: "/catalog?sale=1",
          panelImage: "",
          tone: "dark",
          imageSide: "right",
        }),
        section("reviews", "reviews", { heading: "From dining rooms across India", subheading: "" }),
        section("faq", "faq", {
          heading: "Delivery & care",
          text: "",
          style: "cards",
          q1: "How is furniture delivered?",
          a1: "Our team brings it to your room, assembles it and takes the packaging away.",
          q2: "How long does delivery take?",
          a2: "Pieces in stock arrive in 7–10 days. Made-to-order pieces take 4–6 weeks.",
          q3: "How do I care for oiled wood?",
          a3: "Wipe with a damp cloth and re-oil once a year. We include a care kit.",
          q4: "Is there a warranty?",
          a4: "Every frame has a 5-year warranty.",
          helpTitle: "Measuring your room?",
          helpText: "Send us a photo and the size of your space. We'll reply with what fits, usually within a day.",
          helpButton: "Ask the workshop",
        }),
        section("newsletter", "newsletter", { heading: "First to know", text: "New collections, offers and workshop news, once a month." }),
      ],
      pages: {
        ...defaultPages(storeName),
        // About shows a set dining room, Contact a small dining corner, so the two pages don't look alike
        about: { ...defaultPages(storeName).about, image: PHOTO("photo-1617806118233-18e1de247200", 1800) },
        contact: { ...defaultPages(storeName).contact, image: PHOTO("photo-1577140917170-285929fb55b7", 1800) },
      },
    };
  }

  if (toSiteTheme(theme) === "theme07") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#2A1D18",
        accent: "#C8391F",
        accentText: "#FFFFFF",
        panel: "#F4EEEA",
        textSize: "100",
        headingFont: "Inter Tight",
        displayFont: "Syne",
        bodyFont: "Inter",
        buttonShape: "square",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Catalog", aboutLabel: "About", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Handmade ceramics for slow mornings and long dinners.`, newsletterHeading: "New pieces from the studio" },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          subheading: "store",
          tag: "Inspired by slow, handmade traditions",
          buttonLabel: "",
          secondButtonLabel: "",
          image: PHOTO("photo-1656626277991-0fd06ae52d5c", 1400),
          imageLayout: "split-word",
          tile1Image: PHOTO("photo-1565193566173-7a0ee3dbe261", 500),
          tile1Label: "Catalog",
          tile1Link: "/catalog",
        }),
        section("ticker", "marquee", { text: "Thrown by hand · Lead-free glazes · Safe for the dishwasher · Fired at 1240°C · Wrapped in paper, never plastic", colour: "" }),
        section("collections", "collection-tiles", {
          heading: "New collections",
          text: "Discover our new ceramic collections, made with love and an eye for detail. Each piece is a small work of art that brings warmth to your home.",
        }),
        section("best", "product-row", { heading: "Bestsellers", subheading: "", source: "bestsellers", display: "mosaic", buttonLabel: "Go to catalog", buttonLink: "/catalog" }),
        section("glazes", "glaze-picker", {
          heading: "Pick your\nglaze",
          text: "We mix every glaze in the studio. Tap a colour to see it up close and the pieces we've dipped in it.",
          g1Name: "Speckled oat",
          g1Colour: "#E6DACB",
          g1Text: "Our everyday glaze: warm cream with iron speckles that come through in the second firing.",
          g1Match: "speckled",
          g2Name: "Sea blue",
          g2Colour: "#8FB3C9",
          g2Text: "A soft, watery blue that pools darker where the clay dips.",
          g2Match: "blue",
          g3Name: "Sunshine",
          g3Colour: "#E9B949",
          g3Text: "Bright and glossy, for the pieces that should make you smile.",
          g3Match: "yellow",
          g4Name: "Blush",
          g4Colour: "#E7B3AE",
          g4Text: "A dusty pink, satin to the touch.",
          g4Match: "pink",
          g5Name: "Chalk white",
          g5Colour: "#F2EEE7",
          g5Text: "A quiet matte white that lets the shape of the piece speak.",
          g5Match: "white",
          emptyText: "Nothing in this glaze right now. Ask us and we'll fire one for you.",
          linkLabel: "See all in this glaze",
        }),
        section("imperfect", "statement", {
          heading: "Imperfect\non purpose",
          text: "A thumbprint in the clay, a glaze that pooled a little thicker on one side. No two of our pieces come out of the kiln the same, and we wouldn't want them to.",
        }),
        // categories as round plates: a different shape from the arched collection tiles and the square product cards
        section("shapes", "category-circles", { heading: "Shop by shape" }),
        section("fresh", "product-row", { heading: "Fresh from\nthe kiln", subheading: "This week's small batch. Once they're gone, they're gone.", source: "newest", display: "beside", buttonLabel: "See what's new", buttonLink: "/catalog" }),
        // the batch calendar starts switched off: sellers turn it on with the eye button in the editor's section list
        {
          ...section("batches", "batch-calendar", {
            heading: "Next out\nof the kiln",
            text: "We fire in small batches. Here's what's coming, so you never miss a drop.",
            b1Date: "14 Nov",
            b1Title: "Speckled mugs, batch 41",
            b1Note: "60 mugs in speckled oat and sea blue",
            b1Status: "open",
            b1Link: "/category/cups-mugs",
            b2Date: "22 Nov",
            b2Title: "Pasta bowls for winter",
            b2Note: "Wide, deep bowls in chalk white",
            b2Status: "soon",
            b2Link: "",
            b3Date: "05 Dec",
            b3Title: "The festive table",
            b3Note: "Plates, jugs and bud vases in sunshine yellow",
            b3Status: "soon",
            b3Link: "",
            openLabel: "Open now",
            soonLabel: "Coming soon",
            soldLabel: "Sold out",
          }),
          hidden: true,
        },
        section("commission", "custom-order", {
          heading: "Make it\nyour set",
          noteLabel: "Made to order",
          note: "Pick the piece, the glaze and how many. We'll reply on WhatsApp with a price and a firing date.",
          o1Label: "Piece",
          o1Options: "Mugs, Dinner plates, Pasta bowls, Bud vases",
          o2Label: "Glaze",
          o2Options: "Speckled oat, Sea blue, Sunshine, Blush, Chalk white",
          o3Label: "How many",
          o3Options: "2, 4, 6, 8, 12",
          o4Label: "Finish",
          o4Options: "Glossy, Satin, Raw clay outside",
          image: PHOTO("photo-1590422749897-47036da0b0ff", 800),
          buttonLabel: "Ask on WhatsApp",
        }),
        section("reviews", "review-board", {
          label: "From our customers",
          heading: "Kind words",
          summary: "{avg} out of 5 from {n} reviews",
          verifiedLabel: "Verified buyer",
        }),
        // the studio story as two tilted prints pinned beside a short letter, not another photo-and-text block
        section("about", "studio-prints", {
          label: "From our studio",
          heading: "*Made by hand*\nin small batches",
          image: PHOTO("photo-1508269151431-a34449ca161d", 900),
          caption: "Carving the foot of a bowl",
          image2: PHOTO("photo-1532570204726-145c7199f10e", 900),
          caption2: "Cups cooling on the kiln shelf",
          text: "Every piece is thrown, glazed and fired by hand, so no two are exactly alike.",
          text2: "We use lead-free glazes that are safe for food and the dishwasher.",
          signature: "Meera & the studio",
          linkLabel: "Our story",
          linkUrl: "/pages/about",
        }),
        section("newsletter", "newsletter", { heading: "Studio notes", text: "New collections and small-batch drops, before anyone else." }),
        // the care guide closes the page
        section("care", "care-guide", {
          heading: "Caring for\nyour ceramics",
          text: "Handmade pieces are strong. A little care keeps them that way for years.",
          note: "Every glaze we use is lead-free and food-safe, tested batch by batch.",
          c1Title: "Dishwasher",
          c1Icon: "dishwasher",
          c1Stamp: "Safe",
          c1Tone: "yes",
          c1Text: "Glazed pieces go in. Raw clay outside? Wash by hand.",
          c2Title: "Microwave",
          c2Icon: "microwave",
          c2Stamp: "Safe",
          c2Tone: "yes",
          c2Text: "Fine for warming, except pieces with a gold rim.",
          c3Title: "Oven",
          c3Icon: "oven",
          c3Stamp: "Gently",
          c3Tone: "care",
          c3Text: "Up to 180°C, starting from a cold oven.",
          c4Title: "Freezer to stove",
          c4Icon: "freezer",
          c4Stamp: "Avoid",
          c4Tone: "no",
          c4Text: "Sudden heat or cold can crack even strong clay.",
          c5Title: "Hand washing",
          c5Icon: "hand",
          c5Stamp: "Best",
          c5Tone: "yes",
          c5Text: "A soft sponge keeps the glaze glossy longest.",
          c6Title: "Scratches",
          c6Icon: "shine",
          c6Stamp: "Gently",
          c6Tone: "care",
          c6Text: "Cutlery marks lift with a little baking soda.",
        }),
      ],
      pages: {
        ...defaultPages(storeName),
        // About shows the workshop, Contact the finished cups, so the two pages don't look alike
        about: { ...defaultPages(storeName).about, image: PHOTO("photo-1595351298020-038700609878", 1800) },
        contact: { ...defaultPages(storeName).contact, image: PHOTO("photo-1610701596007-11502861dcfa", 1800) },
      },
    };
  }

  if (toSiteTheme(theme) === "theme08") {
    return {
      announcement: "",
      settings: {
        background: "#F6F2EC",
        text: "#2A2522",
        accent: "#E2462B",
        accentText: "#FFFFFF",
        panel: "#ECE6DC",
        textSize: "100",
        headingFont: "Oswald",
        displayFont: "Oswald",
        bodyFont: "Inter",
        buttonShape: "square",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Catalog", aboutLabel: "About", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Bags designed to be loved for years.`, newsletterHeading: "Stay in style" },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          tag: "Your perfect shape of style",
          buttonLabel: "Shop the catalog",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1683921470299-b8f0f3331657", 1200),
          imageLayout: "poster",
        }),
        section("latest", "product-row", { heading: "Latest collections", subheading: "", source: "newest", display: "slider", buttonLabel: "" }),
        section("brand", "brand-story"),
        section("shape", "product-row", { heading: "Find your shape", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "View all", buttonLink: "/catalog" }),
        section("contact", "contact-block"),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme24") {
    return {
      announcement: "Free shipping on orders over ₹999",
      settings: {
        background: "#FFFFFF",
        text: "#111111",
        accent: "#111111",
        accentText: "#FFFFFF",
        panel: "#F3F3F3",
        textSize: "100",
        headingFont: "Inter Tight",
        displayFont: "Inter Tight",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Support", searchPlaceholder: "Search accessories", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Cases, chargers, audio and smart gear for every day.`, newsletterHeading: "Sign up for deals" },
      sections: [
        section("hero", "hero", {
          heading: "Mix. Match. Snap on.",
          subheading: "Snap on a case, wallet, wireless charger or battery pack.",
          buttonLabel: "Shop collection",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1535157412991-2ef801c1748b", 1800),
          imageLayout: "peek",
          tile1Image: PHOTO("photo-1585771724684-38269d6639fd", 1800),
          tile1Label: "Sound that moves you",
          tile1Link: "/catalog",
          tile2Image: PHOTO("photo-1642101373432-a9c683c34902", 1800),
          tile2Label: "Smart on your wrist",
          tile2Link: "/catalog",
        }),
        section("perks", "perks", {
          p1Title: "Free shipping",
          p1Text: "On orders over ₹999",
          p2Title: "Flexible payment",
          p2Text: "UPI, cards or cash on delivery",
          p3Title: "14-day returns",
          p3Text: "Easy exchanges, no fuss",
          p4Title: "Premium support",
          p4Text: "Real people on WhatsApp",
        }),
        section("deals", "countdown-deals", { heading: "Hot deals", endsAt: "23:59", source: "sale" }),
        section("cats", "category-circles", { heading: "Shop by category" }),
        section("spot", "spotlight-cards"),
        section("best", "product-row", { heading: "Best seller", subheading: "", source: "bestsellers", display: "slider", buttonLabel: "" }),
        section("reviews", "review-spotlight", {
          label: "Our customers' reviews",
          image: PHOTO("photo-1585771724684-38269d6639fd", 900),
          text: "Noise cancelling that actually works, and they stay comfortable through a whole flight.",
          name: "Rohan M. · Studio Headphones",
        }),
        section("brands", "brand-strip", { names: "Voltix · Sonora · Arcline · Pixen · Nordwave · Kinetic" }),
        section("gram", "gallery", {
          heading: "Shop gram",
          buttonLabel: "Follow us",
          buttonLink: "",
          g1Image: PHOTO("photo-1636134133682-27a21b8f20ba", 700),
          g1Caption: "",
          g2Image: PHOTO("photo-1654588301119-7e23237ace60", 700),
          g2Caption: "",
          g3Image: PHOTO("photo-1615526675159-e248c3021d3f", 700),
          g3Caption: "",
          g4Image: PHOTO("photo-1608043152269-423dbba4e7e1", 700),
          g4Caption: "",
          g5Image: PHOTO("photo-1786103776067-2df6237af61d", 700),
          g5Caption: "",
          g6Image: PHOTO("photo-1593830566460-2464575a9a24", 700),
          g6Caption: "",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme25") {
    return {
      announcement: "",
      settings: {
        background: "#FBF1E1",
        text: "#2B2118",
        accent: "#EF7B3A",
        accentText: "#FFFFFF",
        panel: "#3E8B5F",
        textSize: "100",
        headingFont: "Bricolage Grotesque",
        displayFont: "Bricolage Grotesque",
        bodyFont: "Outfit",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Menu", aboutLabel: "Our story", contactLabel: "Find us", ctaLabel: "Order now", ctaLink: "/catalog" },
      footer: { ...footer, about: `${storeName}. Smash burgers, crispy sides and thick shakes, made fresh to order.`, newsletterHeading: "Deals for hungry people" },
      sections: [
        section("hero", "hero", {
          heading: "Something\nfor everybody",
          tag: "Fresh off the grill",
          subheading: "",
          buttonLabel: "Order now",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1763689389824-dd2cea2e5772", 2000),
          imageLayout: "feast",
        }),
        section("favs", "product-row", { heading: "Our favourites", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "See the full menu", buttonLink: "/catalog" }),
        section("menu", "menu-board", { heading: "The full menu", text: "Everything is made fresh when you order.", note: "Veg patties available on request. Ask us about allergens." }),
        section("combo", "combo-builder", {
          heading: "Build your meal",
          text: "Pick a burger, a side and a drink. We'll add all three to your bag.",
          c1Label: "1. Pick a burger",
          c1Source: "category:burgers",
          c2Label: "2. Add a side",
          c2Source: "category:sides",
          c3Label: "3. Grab a drink",
          c3Source: "category:drinks",
          buttonLabel: "Add meal to bag",
        }),
        section("fun", "tilt-gallery", { heading: "Good times, every time" }),
        section("how", "steps", {
          eyebrow: "Hot off the grill",
          heading: "From order\nto your door",
          s1Title: "Pick your meal",
          s1Text: "Choose from the menu or build a combo.",
          s2Title: "We smash and grill",
          s2Text: "Every patty is cooked fresh when you order.",
          s3Title: "Packed hot",
          s3Text: "Wrapped and boxed so it stays warm.",
          s4Title: "Pick up or delivered",
          s4Text: "Collect it from us or have it brought over.",
        }),
        section("reviews", "reviews", { subheading: "", heading: "Happy tummies" }),
        section("find", "contact-block", {
          heading: "Come say hi",
          image: PHOTO("photo-1763993679664-6afaf7ff043d", 1200),
          hours: "Mon–Thu: 12:00–23:00\nFri–Sun: 12:00–01:00",
          text: "Dine in, take away or order to your door.",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme26") {
    return {
      announcement: "",
      settings: {
        background: "#070505",
        text: "#F3EDE4",
        accent: "#8B1010",
        accentText: "#FFFFFF",
        panel: "#FFFFFF",
        textSize: "100",
        headingFont: "Playfair Display",
        displayFont: "Playfair Display",
        bodyFont: "Manrope",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "Our story", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Fine jewellery for every chapter of your story.`, newsletterHeading: "Private previews" },
      sections: [
        section("hero", "hero", { heading: storeName, subheading: "", buttonLabel: "Shop", buttonLink: "/catalog", secondButtonLabel: "", image: PHOTO("photo-1633555234296-657a18d8b81a", 1200), imageLayout: "fan" }),
        section("pieces", "product-row", { heading: "From classic to contemporary—\n*your perfect piece awaits*", subheading: "", source: "bestsellers", display: "slider", buttonLabel: "See all", buttonLink: "/catalog" }),
        section("stage", "stage", { heading: "Elegance in\nevery detail", image: PHOTO("photo-1769230361954-69a5bd0fcb2e", 1000), word: storeName }),
        section("about", "story-card", {
          image: PHOTO("photo-1616121341778-0dd435d03d23", 900),
          heading: "About us",
          text: `At ${storeName}, we believe jewellery is more than adornment. It is an intimate expression of elegance, confidence and timeless beauty.\n\nEvery design is crafted with precision, joining fine materials with modern lines. Each piece is more than an accessory: it is a lasting symbol of elegance, made to be cherished for generations.`,
          buttonLabel: "Our story",
          buttonLink: "/pages/about",
        }),
        section("summer", "collection-collage"),
        section("cats", "categories", { heading: "Shop by category" }),
        section("care", "faq", {
          heading: "Jewellery care",
          text: "Simple ways to keep every piece shining.",
          q1: "How do I clean my jewellery?",
          a1: "Wipe with a soft dry cloth after wearing. For a deeper clean, use warm water with a drop of mild soap.",
          q2: "Can I wear it in the shower?",
          a2: "Take it off before showering, swimming or applying perfume to keep the finish bright.",
          q3: "Do you resize rings?",
          a3: "Yes, one free resize within 60 days of delivery.",
          q4: "Is every piece certified?",
          a4: "Every diamond and gold piece comes with a certificate of authenticity.",
        }),
        section("newsletter", "newsletter", { heading: "Private previews", text: "Be first to see new collections and invitation-only events." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme27") {
    return {
      announcement: "",
      settings: {
        background: "#EDE5D2",
        text: "#4A1A12",
        accent: "#5E1A10",
        accentText: "#F6DCE8",
        panel: "#E3D9C3",
        textSize: "100",
        headingFont: "Bricolage Grotesque",
        displayFont: "Bricolage Grotesque",
        bodyFont: "DM Sans",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop all", aboutLabel: "Mission", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Well-sourced, handmade jewellery that always gives back.`, newsletterHeading: "Join the club, cutie" },
      sections: [
        section("hero", "hero", {
          tag: "Handmade gemstone + gold-filled jewellery",
          heading: "Well-sourced, handmade jewellery\nfor kind souls",
          subheading: "Your go-to jewellery shop that always gives back.",
          buttonLabel: "Shop all",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1715374033196-0ff662284a7e", 2000),
          imageLayout: "maker",
          ticker: "Handmade with quality materials · A share of every order goes to charity · Well-sourced, small-batch designs",
        }),
        section("fav", "product-row", { heading: "Your new fav necklace", subheading: "", source: "bestsellers", display: "tabs", buttonLabel: "Shop now", buttonLink: "/catalog" }),
        section("mission", "mission-band", {
          eyebrow: "Because looking good and doing good go hand in hand",
          heading: `${storeName} is for *kind souls* who value giving back, and *looking good* while doing it too.`,
          ticker: "15% of profits go to research · Handmade in small batches · Packed plastic-free",
        }),
        section("collections", "collection-tiles", { heading: "Shop all collections here, cutie", text: "Bold beads, everyday gold and little gifts." }),
        section("impact", "impact", {
          heading: "Every bead counts",
          text: "Here's what you've helped us do so far.",
          n1Value: "18000+",
          n1Label: "Pieces strung by hand",
          n2Value: "₹6.5L",
          n2Label: "Given to research",
          n3Value: "42",
          n3Label: "Gemstones we work with",
        }),
        section("stones", "highlights", {
          eyebrow: "What we use",
          heading: "Real stones, real gold",
          text: "",
          h1Image: PHOTO("photo-1767040276964-d2a39a86b1d4", 700),
          h1Title: "Jade",
          h1Text: "For calm and good luck.",
          h2Image: PHOTO("photo-1601824096525-954268b9eb72", 700),
          h2Title: "Jasper",
          h2Text: "Grounding and earthy.",
          h3Image: PHOTO("photo-1560847133-e6f64dc352ea", 700),
          h3Title: "Carnelian",
          h3Text: "Bright, warm and bold.",
          h4Image: PHOTO("photo-1651958507150-87219b400741", 700),
          h4Title: "Gold-filled",
          h4Text: "Lasts for years, never flakes.",
        }),
        section("maker", "image-text", {
          heading: "Made by hand,\nat our kitchen table",
          text: "Every necklace is strung, knotted and finished by hand in small batches. No two are ever quite the same.",
          buttonLabel: "Our mission",
          buttonLink: "/pages/about",
          image: PHOTO("photo-1646070107254-3713cec279c1", 1200),
          imageWidth: "half",
          tone: "light",
          imageSide: "right",
          highlightLabel: "",
          highlight: "",
        }),
        section("reviews", "reviews", { subheading: "", heading: "Babes love it" }),
        section("newsletter", "newsletter", { heading: "Join the club", text: "New drops, giveaways and how much we've given back, once a month." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme28") {
    return {
      announcement: "For styling help and customisation, WhatsApp us",
      settings: {
        background: "#FFFFFF",
        text: "#1F1A1C",
        accent: "#E3175F",
        accentText: "#FFFFFF",
        panel: "#FBEFF3",
        textSize: "100",
        headingFont: "Outfit",
        displayFont: "Outfit",
        bodyFont: "Inter",
        buttonShape: "rounded",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "Our story", contactLabel: "Contact", searchPlaceholder: "Search for products, brands and more", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Your destination for ethnic wear: handpicked sarees, lehengas and suits that blend heritage craft with modern design.`, newsletterHeading: "Stay connected" },
      sections: [
        section("hero", "hero", {
          tag: "The heritage edit",
          heading: "Elegance\n*Redefined.*",
          subheading: "Discover a curated collection of artisanal sarees and designer lehengas, where heritage craftsmanship meets modern silhouettes.",
          buttonLabel: "Shop collection",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1618901185975-d59f7091bcfe", 2000),
          imageLayout: "carousel",
          tile1Image: PHOTO("photo-1746372283841-dbb3838f9935", 2000),
          tile1Label: "The *wedding* edit",
          tile1Link: "/category/wedding-collection",
          tile2Image: PHOTO("photo-1617627143750-d86bc21e42bb", 2000),
          tile2Label: "Silk for every\n*celebration*",
          tile2Link: "/category/silk-sarees",
        }),
        section("cats", "category-circles", { heading: "CELEBRATE EVERY OCCASION IN STYLE\nShop by *category*" }),
        section("occasion", "occasion-mosaic", {
          o1Link: "/category/wedding-collection",
          o2Link: "/search?q=yellow",
          o3Link: "/category/gowns",
          o4Link: "/category/silk-sarees",
          o5Link: "/category/kurtis",
        }),
        section("new", "product-row", { heading: "New *arrivals*", subheading: "", source: "newest", display: "slider", buttonLabel: "View all products", buttonLink: "/catalog" }),
        section("featured", "product-row", { heading: "Our featured *collection*", subheading: "", source: "bestsellers", display: "slider", buttonLabel: "View all products", buttonLink: "/catalog" }),
        section("reviews", "reviews", { subheading: "", heading: "Reviews & *ratings*" }),
        section("promise", "promise-icons", {
          i1Title: "Authentic quality",
          i1Text: "Handpicked premium fabrics and trusted craftsmanship you can rely on.",
          i2Title: "Modern tradition",
          i2Text: "Designs that blend timeless Indian heritage with today's style.",
          i3Title: "Express delivery",
          i3Text: "Fast shipping across India with secure packaging and tracking.",
          i4Title: "Easy returns",
          i4Text: "7-day hassle-free returns and exchanges on your purchase.",
          i5Title: "100% secure payment",
          i5Text: "UPI, cards and cash on delivery, always kept safe.",
        }),
        section("searches", "popular-searches", {
          heading: "Popular searches",
          terms: "Banarasi silk sarees: banarasi\nKanjivaram sarees: kanjivaram\nGeorgette party wear: georgette\nWedding lehengas: lehenga\nAnarkali suits: anarkali\nChikankari kurtis: chikankari\nHaldi outfits: yellow\nEvening gowns: gown\nKurta sets: kurta\nSilk sarees: silk\nBridal wear: bridal\nFestive collection: festive",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme29") {
    return {
      announcement: "Free shipping across India · Silk Mark certified",
      settings: {
        background: "#FBF3E6",
        text: "#4A1020",
        accent: "#6E1427",
        accentText: "#F6E7C8",
        panel: "#F3E4CC",
        textSize: "100",
        headingFont: "Cormorant Garamond",
        displayFont: "Cormorant Garamond",
        bodyFont: "Manrope",
        buttonShape: "pill",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Collections", aboutLabel: "About us", contactLabel: "Contact us", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Handwoven silk sarees from the looms of Varanasi and Kanchipuram, for weddings, festivals and every day in between.`, newsletterHeading: "Letters from the loom" },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          subheading: "Handwoven silks since 1985",
          buttonLabel: "Explore collections",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1679006831648-7c9ea12e5807", 1000),
          imageLayout: "arches",
          tile1Image: PHOTO("photo-1767955694884-d4bf352c23c2", 1000),
          tile2Image: PHOTO("photo-1617627143750-d86bc21e42bb", 1000),
          tile3Image: PHOTO("photo-1678705730064-a7ecbab4b3fb", 1000),
        }),
        section("marquee", "marquee", { text: "Pure silk · Handwoven in Varanasi · Silk Mark certified · Free shipping across India" }),
        section("featured", "product-row", { heading: "Featured collections", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "See all", buttonLink: "/catalog" }),
        section("weaves", "weave-guide", {
          heading: "Know your *weaves*",
          text: "Every region weaves its own story. Pick one to see what makes it special.",
          w1Name: "Banarasi",
          w1Image: PHOTO("photo-1732381917604-bc8f046965ee", 1000),
          w1Text: "Woven in Varanasi with real zari, Banarasi silks carry Mughal florals and leaves in gold and silver thread. A bride's favourite.",
          w1Term: "banarasi",
          w2Name: "Kanjivaram",
          w2Image: PHOTO("photo-1679006831648-7c9ea12e5807", 1000),
          w2Text: "From Kanchipuram in Tamil Nadu: heavy mulberry silk with temple borders and a contrast pallu, woven to last for generations.",
          w2Term: "kanjivaram",
          w3Name: "Chanderi",
          w3Image: PHOTO("photo-1729146768775-3662af38016e", 1000),
          w3Text: "Light, sheer and glossy, Chanderi blends silk and cotton with tiny gold motifs called buttis. Made for long summer days.",
          w3Term: "chanderi",
          w4Name: "Paithani",
          w4Image: PHOTO("photo-1597897569252-9df44c7de0db", 1000),
          w4Text: "Maharashtra's pride: peacocks and lotuses woven into a rich pallu, with borders that look the same on both sides.",
          w4Term: "paithani",
        }),
        section("cats", "categories", { heading: "Shop by weave" }),
        section("story", "heritage-trio", {
          heading: "About us",
          image: PHOTO("photo-1756483482418-3f3e4c13f9b0", 900),
          storyHeading: "Our collections",
          text: `For three generations, ${storeName} has worked with the same weaving families in Varanasi and Kanchipuram.\n\nEvery saree is woven on a handloom, checked thread by thread, and folded with care before it reaches you.`,
          v1Title: "Pure silk",
          v1Text: "Silk Mark certified",
          v2Title: "Handwoven",
          v2Text: "By master weavers",
          v3Title: "Since 1985",
          v3Text: "Three generations",
          formHeading: "Find your\nperfect drape",
          formText: "Tell us the occasion and we'll send you a few sarees to choose from on WhatsApp.",
          buttonLabel: "Send on WhatsApp",
        }),
        section("journey", "craft-timeline", {
          heading: "From our loom to you",
          t1Year: "1985",
          t1Title: "The first loom",
          t1Text: "Our grandfather set up a single handloom in Varanasi.",
          t2Year: "1998",
          t2Title: "A family of weavers",
          t2Text: "Twelve weaving families joined us, each with their own craft.",
          t3Year: "2012",
          t3Title: "Our first store",
          t3Text: "We opened our doors to brides from across the country.",
          t4Year: "Today",
          t4Title: "Online, everywhere",
          t4Text: "Handwoven silks delivered to your door, anywhere in India.",
        }),
        section("bride", "testimonial", {
          label: "From our brides",
          heading: "“I wore my grandmother's Banarasi and theirs at my wedding. No one could tell which was older.”",
          text: "",
          name: "Ritika S.",
          role: "Bride, Lucknow",
          image: PHOTO("photo-1654764746242-7592b9c6ce2e", 1800),
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme30") {
    return {
      announcement: "",
      settings: {
        background: "#F8F4EF",
        text: "#2A1A28",
        accent: "#5A1F5C",
        accentText: "#FFFFFF",
        panel: "#EFE6DE",
        textSize: "100",
        headingFont: "Playfair Display",
        displayFont: "Playfair Display",
        bodyFont: "DM Sans",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Timeless sarees, modern you. Elegance, culture and craftsmanship in every drape.`, newsletterHeading: "Join our newsletter" },
      sections: [
        section("hero", "hero", {
          tag: "Timeless elegance",
          heading: "Beautiful sarees\nfor every story",
          subheading: "From traditional handloom to modern weaves, find the perfect saree for every occasion.",
          buttonLabel: "Shop now",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1641699862936-be9f49b1c38d", 2000),
          imageLayout: "numbered",
          tile1Image: PHOTO("photo-1726068555279-3d7c0c1fc540", 2000),
          tile1Label: "Silk that glows\nat every festival",
          tile1Link: "/category/silk-sarees",
          tile2Image: PHOTO("photo-1727430228383-aa1fb59db8bf", 2000),
          tile2Label: "Kanjivaram, woven\nfor generations",
          tile2Link: "/category/kanjivaram-sarees",
        }),
        section("explore", "collection-circles", { eyebrow: "Shop by category", heading: "Explore our\ncollections", text: "Discover sarees for every mood, occasion and style.", buttonLabel: "View all", buttonLink: "/catalog" }),
        section("duo", "feature-duo", {
          eyebrow: "Featured collection",
          heading: "Traditional\nhandloom sarees",
          text: "Pure weaves. Timeless beauty.",
          image: PHOTO("photo-1619516388835-2b60acc4049e", 1400),
          buttonLabel: "Shop handloom",
          buttonLink: "/category/handloom-sarees",
          eyebrow2: "Trending now",
          heading2: "Banarasi sarees",
          text2: "Rich heritage. Modern elegance.",
          image2: PHOTO("photo-1616986491129-3e37cb654c82", 1000),
          buttonLabel2: "Shop Banarasi",
          buttonLink2: "/search?q=banarasi",
        }),
        section("best", "product-row", { tag: "Best sellers", heading: "Loved by many", subheading: "Our most popular sarees, handpicked for you.", source: "bestsellers", display: "slider", buttonLabel: "" }),
        section("drapes", "drape-styles", {
          eyebrow: "Style guide",
          heading: "Four ways to *drape*",
          d1Image: PHOTO("photo-1769275061721-bb6439d24ebc", 700),
          d1Title: "Nivi",
          d1Text: "The classic: pleats at the front, pallu over the left shoulder.",
          d1Link: "/category/silk-sarees",
          d2Image: PHOTO("photo-1761125135357-99cbe52a6271", 700),
          d2Title: "Bengali",
          d2Text: "Wide box pleats and the pallu brought round from the right.",
          d2Link: "/category/handloom-sarees",
          d3Image: PHOTO("photo-1769275061088-85697a30ee50", 700),
          d3Title: "Seedha pallu",
          d3Text: "The pallu falls over the right shoulder to show off the border.",
          d3Link: "/category/cotton-sarees",
          d4Image: PHOTO("photo-1610189337543-1c5d8e64f574", 700),
          d4Title: "Butterfly",
          d4Text: "Thin pleats and a narrow pallu for a modern party look.",
          d4Link: "/category/party-wear-sarees",
        }),
        section("offer", "coupon-banner", { eyebrow: "Special offer", heading: "Get 10% off\non your first order", code: "WELCOME10", image: PHOTO("photo-1613665667184-81bb9b8605e2", 1400) }),
        section("perks", "perks", {
          p1Title: "Free shipping",
          p1Text: "On orders above ₹3,000",
          p2Title: "Secure payments",
          p2Text: "100% safe and trusted",
          p3Title: "Easy returns",
          p3Text: "Hassle-free within 7 days",
          p4Title: "Dedicated support",
          p4Text: "We're here to help",
        }),
        section("care", "faq", {
          heading: "Saree care & stitching",
          text: "Everything you need to know before your saree arrives.",
          q1: "Do you stitch blouses?",
          a1: "Yes. Choose Blouse stitching on the product page and send us your measurements on WhatsApp. It adds 5–7 days.",
          q2: "Is fall and pico done?",
          a2: "Every saree can have fall and pico done for free. Just mention it in your order notes.",
          q3: "How do I care for a silk saree?",
          a3: "Dry clean only. Store it folded in a muslin cloth and refold it every few months so the creases don't set.",
          q4: "Will the colour match the photos?",
          a4: "We shoot every saree in daylight. Handwoven silks can vary slightly, which is part of their charm.",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme31") {
    return {
      announcement: "15% off above ₹1499 · COD available · 7-day easy returns",
      settings: {
        background: "#FAF4EC",
        text: "#2B1D17",
        accent: "#B4533A",
        accentText: "#FFFFFF",
        panel: "#F1E5D6",
        textSize: "100",
        headingFont: "Playfair Display",
        displayFont: "Playfair Display",
        bodyFont: "DM Sans",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Help", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Designed in India, made for Indian bodies. XS to plus size, same styles.`, newsletterHeading: "Get first dibs on new drops" },
      sections: [
        section("hero", "hero", {
          tag: "New in · women's clothing",
          heading: "designed in\nindia, *made for*\n*indian bodies*",
          subheading: "Dresses, tops, co-ords and more. XS to plus size, same styles. What you see is what arrives.",
          buttonLabel: "shop new in",
          buttonLink: "/catalog",
          secondButtonLabel: "shop co-ords",
          secondButtonLink: "/category/co-ords",
          image: PHOTO("photo-1769063382633-ef27742cf2a1", 1400),
          imageLayout: "boutique",
          stat: "xs–5xl",
          statLabel: "same styles",
        }),
        section("rings", "story-rings"),
        section("new", "product-row", { heading: "new in", subheading: "", source: "newest", display: "grid", buttonLabel: "view all", buttonLink: "/catalog" }),
        section("cats", "label-tiles", { heading: "shop by category" }),
        section("offer", "offer-band", { heading: "15% off above ₹1499", text: "COD available · 7-day easy returns", buttonLabel: "shop the sale", buttonLink: "/catalog" }),
        section("budget", "budget-picker", { heading: "shop by budget", ranges: "under ₹999: 0-999\n₹1000–1500: 1000-1500\n₹1500–2000: 1500-2000\n₹2000+: 2000-", buttonLabel: "see everything" }),
        section("sizes", "size-finder", {
          heading: "xs to 5xl,\n*same styles*",
          text: "Every style is cut for real Indian body shapes, in nine sizes. Pick yours to see what it fits.",
          buttonLabel: "shop your size",
          buttonLink: "/catalog",
        }),
        section("gram", "gallery", {
          heading: "seen on you",
          buttonLabel: "follow us",
          buttonLink: "",
          g1Image: PHOTO("photo-1763817959593-c3ec2b1ec257", 700),
          g1Caption: "",
          g2Image: PHOTO("photo-1765529374927-052599af9c82", 700),
          g2Caption: "",
          g3Image: PHOTO("photo-1609695813802-3c443be34359", 700),
          g3Caption: "",
          g4Image: PHOTO("photo-1765269303556-b53ff8bd8a8a", 700),
          g4Caption: "",
          g5Image: PHOTO("photo-1763558983896-71c620874ac1", 700),
          g5Caption: "",
          g6Image: PHOTO("photo-1763637896841-cd5a1bb18208", 700),
          g6Caption: "",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme32") {
    return {
      announcement: "",
      settings: {
        background: "#FBF2EA",
        text: "#3A1A16",
        accent: "#E0261C",
        accentText: "#FFFFFF",
        panel: "#F9CDD3",
        textSize: "100",
        headingFont: "Playfair Display",
        displayFont: "Playfair Display",
        bodyFont: "DM Sans",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Home objects with playful shapes, made for the spaces you live in.`, newsletterHeading: "Join the studio" },
      sections: [
        section("hero", "hero", {
          heading: "Shape\nyour space",
          subheading: "Curated objects for modern living.",
          buttonLabel: "Explore collection",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1615884241403-c5ee2e600bef", 1600),
          imageLayout: "sparkle",
        }),
        section("new", "product-row", { heading: "New *favourites*", subheading: "", source: "newest", display: "slider", buttonLabel: "" }),
        section("everyday", "look-trio", {
          image: PHOTO("photo-1622347196821-2e71f9a7ebfc", 1200),
          heading: "Made for\neveryday",
          text: "Thoughtful pieces, modern shapes and timeless style, for the spaces you live in, not just look at.",
          buttonLabel: "Shop the look",
          buttonLink: "/catalog",
          smallImage: PHOTO("photo-1705526966290-2de7b8a33f03", 700),
        }),
        section("room", "room-shop", {
          heading: "Shop the *room*",
          text: "Everything in this corner is ours. Tap a dot to see it.",
          image: PHOTO("photo-1644410960965-0a43b7358f70", 1800),
          source: "bestsellers",
          h1X: "62",
          h1Y: "34",
          h2X: "38",
          h2Y: "64",
          h3X: "82",
          h3Y: "72",
          h4X: "18",
          h4Y: "46",
        }),
        section("rooms", "category-tints", { buttonLabel: "Shop" }),
        section("finds", "product-row", { heading: "Fresh *finds*", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "Shop all objects", buttonLink: "/catalog" }),
        section("stories", "stories", {
          heading: "Stories",
          buttonLabel: "Read all",
          buttonLink: "/pages/about",
          s1Image: PHOTO("photo-1540567592819-88185873775d", 900),
          s1Tag: "At home with",
          s1Title: "A pink flat that breaks every rule, beautifully",
          s1Link: "/pages/about",
          s2Image: PHOTO("photo-1720746382153-06585c99d43b", 400),
          s2Tag: "Lighting",
          s2Title: "Three lamps, three moods",
          s2Link: "/catalog",
          s3Image: PHOTO("photo-1567763745030-bfe9c51bec27", 400),
          s3Tag: "Table",
          s3Title: "Setting a table that feels like you",
          s3Link: "/catalog",
          s4Image: PHOTO("photo-1684165610413-2401399e0e59", 400),
          s4Tag: "Guides",
          s4Title: "How to choose a chair you'll keep for years",
          s4Link: "/pages/about",
        }),
        section("newsletter", "newsletter", { heading: "Join the *studio*", text: "New objects, home stories and early access to drops, once a month." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme33") {
    return {
      announcement: "New here? Sign up to our newsletter for 15% off your first order",
      settings: {
        background: "#F5F2EC",
        text: "#3B3340",
        accent: "#A3A82A",
        accentText: "#FFFFFF",
        panel: "#F4C9CF",
        textSize: "100",
        headingFont: "Instrument Serif",
        displayFont: "Unbounded",
        bodyFont: "Manrope",
        buttonShape: "square",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Colourful prints, cards and homeware that bring joy and connection into your home.`, newsletterHeading: "15% off your first order" },
      sections: [
        section("hero", "hero", {
          heading: "Gifts and stationery",
          subheading: "Stylish, thoughtful and beautifully illustrated gifts and stationery.",
          buttonLabel: "Shop now",
          buttonLink: "/category/stationery",
          secondButtonLabel: "",
          image: PHOTO("photo-1647559709298-c0e3dcb47092", 1200),
          imageLayout: "postcard",
          tile1Image: PHOTO("photo-1655998233171-ee5b130acba5", 1200),
          tile2Label: "Prints for every wall",
          tile2Image: PHOTO("photo-1632258521940-b29d7d2ae9f5", 1200),
          tile2Link: "/category/prints",
          tile3Image: PHOTO("photo-1706630909453-c1058a447373", 1200),
        }),
        section("ticker", "marquee", { text: "Bring colour, joy and connection into your home · Inspired by the places you love · Capturing memories, fuelled by adventure" }),
        section("cats", "circle-tints", { heading: "Shop by category" }),
        section("features", "feature-slider", {
          f1Image: PHOTO("photo-1610566725828-5e945c71393d", 1200),
          f1Title: "Travel posters",
          f1Text: "Our illustrated travel posters celebrate travel, remind us of where we've been and the places that feel like home.",
          f1Button: "Shop travel posters",
          f1Link: "/category/prints",
          f2Image: PHOTO("photo-1649015352520-45cb10548a3d", 1200),
          f2Title: "Tea towels",
          f2Text: "Soft cotton tea towels printed with our favourite places, made to be used and loved.",
          f2Button: "Shop tea towels",
          f2Link: "/category/tea-towels",
          f3Image: PHOTO("photo-1680183718072-e9b55b649698", 1200),
          f3Title: "Greeting cards",
          f3Text: "Cards for birthdays, thank-yous and every little moment in between.",
          f3Button: "Shop cards",
          f3Link: "/category/cards",
        }),
        section("ticker2", "marquee", { text: "Capturing those special memories · Art that tells your story · Celebrating your favourite places", colour: "#E8772E" }),
        section("shop", "product-row", { heading: "", subheading: "From mugs to prints, tea towels to cards, every piece is thoughtfully designed with colour, character and fun.", source: "bestsellers", display: "tabs", buttonLabel: "" }),
        section("dive", "scallop-band", {
          heading: "Dive right in!",
          text: "Our collection of colourful prints celebrating the love of sea swimming, summer and the beach.",
          t1Image: PHOTO("photo-1783544770399-d1af97c9628b", 700),
          t1Label: "Postcards",
          t1Link: "/category/cards",
          t2Image: PHOTO("photo-1720698992880-ae93ea16aac9", 700),
          t2Label: "Mugs",
          t2Link: "/category/homeware",
          t3Image: PHOTO("photo-1584448141569-69f342da535c", 700),
          t3Label: "Vintage posters",
          t3Link: "/category/prints",
        }),
        section("newsletter", "newsletter", { heading: "New here?", text: "Sign up for colourful news, new prints and 15% off your first order." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme34") {
    return {
      announcement: "Complimentary gift wrapping on every order",
      settings: {
        background: "#FFFFFF",
        text: "#3B0D16",
        accent: "#5B0B18",
        accentText: "#F7E7E9",
        panel: "#F4EFEE",
        textSize: "100",
        headingFont: "Cormorant Garamond",
        displayFont: "Cormorant Garamond",
        bodyFont: "Manrope",
        buttonShape: "square",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "Our story", contactLabel: "Contact us", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. A boutique of luxe little things, wrapped by hand.`, newsletterHeading: "Join our VIP list" },
      sections: [
        section("hero", "hero", {
          tag: "Shop our new",
          heading: "Luxe\n*Collection*",
          subheading: "",
          buttonLabel: "Browse",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1629197520669-0210d6b270d9", 2000),
          imageLayout: "archway",
          tile1Image: PHOTO("photo-1603950227760-e609ce8e15b4", 900),
          tile2Image: PHOTO("photo-1790384086829-08aba2dda785", 900),
        }),
        section("best", "product-row", { heading: "Shop our bestsellers", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "" }),
        section("edit", "editorial-trio", {
          heading: "",
          e1Image: PHOTO("photo-1603950227760-e609ce8e15b4", 800),
          e1Script: "Moments",
          e1Title: "Slow mornings",
          e1Link: "/category/home",
          e2Image: PHOTO("photo-1592903297149-37fb25202dfa", 800),
          e2Script: "Gifting",
          e2Title: "Wrapped with love",
          e2Link: "/category/gifts",
          e3Image: PHOTO("photo-1765870972916-48b69771eb10", 800),
          e3Script: "Evenings",
          e3Title: "Dressed for the night",
          e3Link: "/category/clothing",
        }),
        section("note", "gift-note", {
          heading: "Add a *handwritten* note",
          text: "Write your message below. We'll write it by hand on a card and tuck it inside the box.",
          image: PHOTO("photo-1545844568-98bb15133ec0", 1000),
          buttonLabel: "Save my note",
        }),
        section("new", "product-row", { heading: "Just *arrived*", subheading: "", source: "newest", display: "slider", buttonLabel: "" }),
        section("reviews", "reviews", { subheading: "", heading: "Loved by *you*" }),
        section("gram", "gallery", {
          heading: "On the gram",
          buttonLabel: "Follow us",
          buttonLink: "",
          g1Image: PHOTO("photo-1666013138510-9dfad740e972", 700),
          g1Caption: "",
          g2Image: PHOTO("photo-1654699991520-aaaf4dd2608b", 700),
          g2Caption: "",
          g3Image: PHOTO("photo-1771279535634-9af6d6e6964e", 700),
          g3Caption: "",
          g4Image: PHOTO("photo-1520485521983-bfaa0bc6c80e", 700),
          g4Caption: "",
          g5Image: PHOTO("photo-1637508858752-f047b38a0dd8", 700),
          g5Caption: "",
          g6Image: PHOTO("photo-1689193502879-362660fad4a8", 700),
          g6Caption: "",
        }),
        section("vip", "wave-signup", { eyebrow: "join our", heading: "VIP list", text: "Be the first to know about new collections and exclusive offers." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme35") {
    return {
      announcement: "Free delivery on orders above ₹999",
      settings: {
        background: "#FFFFFF",
        text: "#1E1E1E",
        accent: "#F47B20",
        accentText: "#FFFFFF",
        panel: "#FFF3E6",
        textSize: "100",
        headingFont: "Outfit",
        displayFont: "Anton",
        bodyFont: "Outfit",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Contact", searchPlaceholder: "Search food, treats, toys", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Food, treats, toys and beds for happy, healthy pets.`, newsletterHeading: "Get 10% off your first order" },
      sections: [
        section("hero", "hero", {
          tag: "High quality",
          heading: "Pet food",
          subheading: "Sale up to 40% off today",
          buttonLabel: "Shop now",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1537151608828-ea2b11777ee8", 1200),
          imageLayout: "splash",
          stat: "30%",
          statLabel: "off",
        }),
        section("cats", "pastel-tiles", { heading: "Top *categories*" }),
        section("promos", "promo-trio", {
          c1Link: "/category/dog-food",
          c2Link: "/category/treats",
          c3Link: "/category/bird-food",
        }),
        section("best", "product-row", { heading: "Best *seller*", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "" }),
        section("pets", "pet-picker", {
          heading: "Shop by *pet*",
          p1Name: "Dogs",
          p1Image: PHOTO("photo-1543466835-00a7907e9de1", 400),
          p1Term: "dog",
          p2Name: "Cats",
          p2Image: PHOTO("photo-1592194996308-7b43878e84a6", 400),
          p2Term: "cat",
          p3Name: "Birds",
          p3Image: PHOTO("photo-1552728089-57bdde30beb3", 400),
          p3Term: "bird",
          buttonLabel: "See everything",
        }),
        section("deals", "countdown-deals", { heading: "Deal of the day", endsAt: "23:59", source: "sale" }),
        section("subscribe", "steps", {
          eyebrow: "Subscribe & save",
          heading: "Never run out\nof food again",
          image: PHOTO("photo-1591946559594-8c6d3b7391eb", 1200),
          s1Title: "Pick their food",
          s1Text: "Choose from vet-approved brands for every age.",
          s2Title: "Choose how often",
          s2Text: "Every 2, 4 or 6 weeks. Change it any time.",
          s3Title: "Save 10% every time",
          s3Text: "Delivered free before the bag runs empty.",
          s4Title: "Pause any time",
          s4Text: "Going away? Skip a delivery in one tap.",
        }),
        section("brands", "brand-strip", { names: "Pawsome · Whisker Co · Barkley · Feathers · Tailwag · Purrfect" }),
        section("newsletter", "newsletter", { heading: "Get 10% off your first order", text: "Pet tips, new treats and members-only deals in your inbox." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme21") {
    return {
      announcement: "In-store bracelet welding is here · Book now",
      settings: {
        background: "#FFFFFF",
        text: "#121212",
        accent: "#121212",
        accentText: "#FFFFFF",
        panel: "#F6F3EF",
        textSize: "100",
        headingFont: "Inter Tight",
        displayFont: "Inter Tight",
        bodyFont: "Inter",
        buttonShape: "square",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "Our world", contactLabel: "Contact", searchPlaceholder: "Search", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Demi-fine gold jewellery made to be layered and loved.`, newsletterHeading: "Be first to new drops" },
      sections: [
        section("hero", "hero", {
          heading: "Everyday essentials",
          subheading: "Iconic necklaces longing to be layered.",
          buttonLabel: "Shop best sellers",
          buttonLink: "/catalog",
          secondButtonLabel: "Shop the look",
          secondButtonLink: "/catalog",
          image: PHOTO("photo-1633555234296-657a18d8b81a", 2000),
          imageLayout: "look",
        }),
        section("promise", "claims-strip", { text: "18k gold plated · Hypoallergenic · Nickel free · Water resistant · 1-year warranty" }),
        section("categories", "collection-circles", {
          eyebrow: "Shop by category",
          heading: "Find your\n*shine*",
          text: "Hoops, chains, stacks and rings, made to be worn every day.",
          buttonLabel: "View all",
          buttonLink: "/catalog",
        }),
        section("trending", "product-row", { heading: "Trending", subheading: "", source: "bestsellers", display: "slider", buttonLabel: "" }),
        section("story", "word-story", {
          w1Left: "Everyday",
          w1Right: "gold",
          w2Left: "Stack",
          w2Right: "them up",
          w3Left: "Quietly",
          w3Right: "brilliant",
          w4Left: "Made",
          w4Right: "to keep",
          source: "bestsellers",
          buttonLabel: "Shop",
        }),
        section("edits", "edge-tiles", {
          t1Image: PHOTO("photo-1777817117657-d2fa6aacef06", 900),
          t1Title: "Stack it up",
          t1Button: "Shop bracelets",
          t1Link: "/category/bracelets",
          t2Image: PHOTO("photo-1786052337650-9e1c0dd01f5e", 900),
          t2Title: "Most wanted",
          t2Button: "Shop necklaces",
          t2Link: "/category/necklaces",
          t3Image: "",
          t3Title: "",
          t3Button: "",
          t3Link: "",
          t4Image: "",
          t4Title: "",
          t4Button: "",
          t4Link: "",
        }),
        section("budget", "budget-picker", {
          heading: "Gifts by *budget*",
          text: "Pick a price and we'll show the pieces that fit.",
          ranges: "Under ₹4,000: 0-3999\n₹4,000 – ₹6,000: 4000-6000\nOver ₹6,000: 6001-",
          buttonLabel: "See all gifts",
          style: "boutique",
        }),
        section("engrave", "engraving"),
        section("services", "offset-pair", {
          aImage: PHOTO("photo-1778000000743-87e855360c51", 1000),
          aEyebrow: "In store",
          aTitle: "Come get welded",
          aButton: "Book an appointment",
          aLink: "/pages/contact",
          bImage: PHOTO("photo-1728034261686-26d2878f1c2d", 1000),
          bEyebrow: "In store",
          bTitle: "Come get pierced",
          bButton: "Book an appointment",
          bLink: "/pages/contact",
        }),
        section("icon", "product-spotlight", { source: "bestsellers", image: "", style: "boutique", label: "The icon", buttonLabel: "Add to bag", linkLabel: "View details" }),
        section("reviews", "review-spotlight", {
          label: "Worn and loved",
          style: "boutique",
          image: PHOTO("photo-1616121341778-0dd435d03d23", 900),
          text: "I haven't taken my hoops off in months. They still shine like the day they arrived.",
          name: "Ananya, Mumbai",
        }),
        section("styled", "scatter-gallery", {
          heading: "Styled\nby you",
          text: "Tag us to be featured. Our favourite looks from your feed.",
          buttonLabel: "Follow us",
          buttonLink: "",
          g1Image: PHOTO("photo-1787410507883-541bef9c7fb2", 700),
          g2Image: PHOTO("photo-1785273926014-ca2f71ea856a", 700),
          g3Image: PHOTO("photo-1787410544499-605c94d86a0e", 700),
          g4Image: PHOTO("photo-1786520995818-db8a1620531e", 700),
          g5Image: PHOTO("photo-1671644730555-916aa8d8157f", 700),
          g6Image: PHOTO("photo-1764974345389-09da4244809c", 700),
          g7Image: PHOTO("photo-1633555234296-657a18d8b81a", 900),
          g8Image: PHOTO("photo-1708220040824-b273dd0a17cc", 700),
          g9Image: PHOTO("photo-1777817117657-d2fa6aacef06", 700),
          g10Image: PHOTO("photo-1786052337650-9e1c0dd01f5e", 700),
          tone: "dark",
        }),
        section("newsletter", "newsletter", { heading: "Join the club", text: "Early access to new collections and members-only offers." }),
      ],
      pages: {
        ...defaultPages(storeName),
        about: { ...defaultPages(storeName).about, image: PHOTO("photo-1787410544499-605c94d86a0e", 1800) },
        contact: { ...defaultPages(storeName).contact, title: "Contact", image: PHOTO("photo-1616121341778-0dd435d03d23", 1400) },
      },
    };
  }

  if (toSiteTheme(theme) === "theme22") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#2B1A14",
        accent: "#A63D2A",
        accentText: "#FFFFFF",
        panel: "#F4EEE6",
        textSize: "100",
        headingFont: "Cormorant Garamond",
        displayFont: "Cormorant Garamond",
        bodyFont: "Manrope",
        buttonShape: "square",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Collections", aboutLabel: "About us", contactLabel: "Delivery", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Fine gold jewellery shaped by ancient stories.`, newsletterHeading: "Letters from the studio" },
      sections: [
        section("hero", "hero", {
          heading: `${storeName}`,
          subheading: "Gifts made to be kept forever",
          buttonLabel: "View shop",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1688132256337-52e0e4fed1b0", 2000),
          imageLayout: "center",
        }),
        section("collage", "type-collage"),
        section("rings", "collection-slider", { heading: "Rings", text: "Every piece of jewellery is a story, and you can tell every story yourself.", source: "category:rings", buttonLabel: "View rings", buttonLink: "/catalog" }),
        section("earrings", "collection-slider", { heading: "Earrings", text: "Hand-carved drops and studs that catch the light.", source: "category:earrings", buttonLabel: "View earrings", buttonLink: "/catalog" }),
        section("guide", "guide-row"),
        section("promise", "perks", {
          p1Title: "Solid gold",
          p1Text: "18k and 22k, hallmarked",
          p2Title: "Insured delivery",
          p2Text: "Free on every order",
          p3Title: "Lifetime care",
          p3Text: "Free cleaning and repairs",
          p4Title: "Made to order",
          p4Text: "Custom sizes on request",
        }),
        section("press", "quote", { outlet: "Vogue", text: "“Jewellery that feels like an heirloom from the very first day.”", names: "" }),
        section("newsletter", "newsletter", { heading: "Letters from the studio", text: "New collections and stories behind the pieces, a few times a year." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme23") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#151515",
        accent: "#151515",
        accentText: "#FFFFFF",
        panel: "#F7F3F1",
        textSize: "100",
        headingFont: "Playfair Display",
        displayFont: "Playfair Display",
        bodyFont: "Manrope",
        buttonShape: "square",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "Maison", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Fragrance and fine jewellery, chosen with care.`, newsletterHeading: "Newsletter" },
      sections: [
        section("hero", "hero", {
          heading: "This season's\nessentials",
          subheading: "The new collection of fragrances. A sensation of freshness, a journey in every spray.",
          buttonLabel: "Discover",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1600086586698-368d69f00d6e", 1800),
          imageLayout: "inset",
        }),
        section("promos", "duo-promo", { heading: "The new collection\nof fragrances" }),
        section("best", "product-row", { heading: "Best sellers", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "" }),
        section("stories", "offset-pair"),
        section("finder", "scent-quiz", {
          heading: "Find your signature scent",
          text: "Tell us your mood and we'll show you where to start.",
          options: "Fresh & clean: fresh\nSoft & floral: floral\nWarm & sweet: warm\nDeep & woody: wood",
          buttonLabel: "See all",
        }),
        section("discover", "collection-tiles", { heading: "Discover more", text: "Fragrance, fine jewellery and gifts wrapped by hand." }),
        section("services", "perks", {
          p1Title: "Gift wrapping",
          p1Text: "Complimentary on every order",
          p2Title: "Free samples",
          p2Text: "Two with every fragrance",
          p3Title: "Engraving",
          p3Text: "On bottles and jewellery",
          p4Title: "Secure payments",
          p4Text: "UPI, cards and cash on delivery",
        }),
        section("newsletter", "newsletter", { heading: storeName, text: "New scents and private previews, sent now and then." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme17") {
    return {
      announcement: "",
      settings: {
        background: "#FBFBFD",
        text: "#17171C",
        accent: "#F28A1E",
        accentText: "#FFFFFF",
        panel: "#F2F2F5",
        textSize: "100",
        headingFont: "Manrope",
        displayFont: "Manrope",
        bodyFont: "Plus Jakarta Sans",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Help", searchPlaceholder: "Search anything", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Modern pieces for a more inspired everyday.`, newsletterHeading: "Little things, delivered to your inbox" },
      sections: [
        section("hero", "hero", {
          heading: "Live in style.\nShop with *ease.*",
          subheading: "Discover modern products for a more inspired everyday.",
          buttonLabel: "Explore collection",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1578587018452-892bacefd3f2", 1200),
          imageLayout: "blob",
        }),
        section("cats", "category-tints"),
        section("trending", "product-row", { heading: "Handpicked\nfor you", subheading: "Our most-loved items this season.", tag: "Trending now", source: "bestsellers", display: "beside", buttonLabel: "Shop all", buttonLink: "/catalog" }),
        section("sale", "sale-banner"),
        section("home", "product-row", { heading: "Home & living", subheading: "", source: "newest", display: "slider", buttonLabel: "View all", buttonLink: "/catalog" }),
        section("perks", "perks"),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme18") {
    return {
      announcement: "",
      settings: {
        background: "#FAFAFC",
        text: "#1A1A2E",
        accent: "#101C7A",
        accentText: "#FFFFFF",
        panel: "#F3EEF6",
        textSize: "100",
        headingFont: "Syne",
        displayFont: "Syne",
        bodyFont: "Outfit",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Contact", ctaLabel: "Contact us", ctaLink: "/pages/contact" },
      footer: { ...footer, about: `${storeName}. Skincare made to hydrate, refresh and bring out your natural glow.`, newsletterHeading: "Glow notes" },
      sections: [
        section("hero", "hero", {
          heading: "Your best glow\nstarts here",
          subheading: "Skincare made to hydrate, refresh and bring out your skin's natural radiance.",
          buttonLabel: "Shop the collection",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1773305676182-5f34519e11b6", 1800),
          imageLayout: "glow",
        }),
        section("range", "photo-cta", { image: PHOTO("photo-1766241883982-93328f309dc9", 1800), buttonLabel: "Shop products" }),
        section("statement", "gradient-statement", { heading: "Effortless radiance, redefined", text: "Pure, high-performance essentials made to nourish your skin and lift your daily routine." }),
        section("best", "product-row", { heading: "Our best sellers", subheading: "", source: "bestsellers", display: "slider", buttonLabel: "View all", buttonLink: "/catalog" }),
        section("flora", "wordmark-feature", {
          word: "FLORA",
          image: PHOTO("photo-1631700611307-37dbcb89ef7e", 1200),
          label: "New product",
          text: "Rose sleeping mask, made to work while you rest.",
          buttonLabel: "Shop now",
          buttonLink: "/catalog",
        }),
        section("routine", "steps", {
          eyebrow: "Your routine",
          heading: "Glow in three steps",
          image: "",
          s1Title: "Cleanse",
          s1Text: "Start fresh with the Gentle Cleanser, morning and night.",
          s2Title: "Hydrate",
          s2Text: "Two drops of Hydrating Serum on damp skin.",
          s3Title: "Mask",
          s3Text: "Twice a week, finish with a Silk Face Mask.",
          s4Title: "",
          s4Text: "",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme19") {
    return {
      announcement: "",
      settings: {
        background: "#FFF5EC",
        text: "#3B1A12",
        accent: "#5A2A1C",
        accentText: "#FFFFFF",
        panel: "#F6A7A4",
        textSize: "100",
        headingFont: "Playfair Display",
        displayFont: "Playfair Display",
        bodyFont: "DM Sans",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Our flavours", aboutLabel: "Our story", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. The protein drink you'll actually finish, and crave again tomorrow.`, newsletterHeading: "Gut-friendly news" },
      sections: [
        section("hero", "hero", {
          heading: "Your gut's favourite\n*protein drink*",
          subheading: `${storeName} is the protein drink you'll actually finish, and crave again tomorrow.`,
          buttonLabel: "Shop flavours",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1686638745403-d21193f16b2f", 1400),
          imageLayout: "carton",
        }),
        section("tags", "tag-cloud", { text: "High protein · Lactose free · High fibre · Prebiotic fibre · Non-GMO · No artificial sweeteners · Gluten free · No added sugar" }),
        section("benefits", "bento-benefits", {
          eyebrow: "Benefits",
          heading: "Your gut knows\n*so does science*",
          b1Title: "Better gut, better you",
          b1Text: "High fibre. No lactose. No bloating. Just a smooth ride for your gut.",
          b2Title: "Daily movement starts from within",
          b2Text: "Protein and prebiotic fibre to support gut health and strength.",
          b3Title: "Clean never tasted this good",
          b3Text: "No seed oils. Nothing artificial. Easy on your gut.",
        }),
        section("flavours", "product-row", { heading: "Pick your flavour", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "" }),
        section("inside", "facts", {
          eyebrow: "In every bottle",
          heading: "20 g of protein,\nzero fuss",
          image: PHOTO("photo-1589733955941-5eeaf752f6dd", 1200),
          rows: "Protein: 20 g\nFibre: 6 g\nAdded sugar: 0 g\nLactose: None\nSize: 250 ml",
          note: "Per bottle of Strawberry Protein Shake.",
          buttonLabel: "Shop now",
          buttonLink: "/catalog",
        }),
        section("reviews", "reviews", { subheading: "", heading: "Finished every drop" }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme20") {
    return {
      announcement: "",
      settings: {
        background: "#F1F1F0",
        text: "#111111",
        accent: "#111111",
        accentText: "#FFFFFF",
        panel: "#FFFFFF",
        textSize: "100",
        headingFont: "Inter Tight",
        displayFont: "Inter Tight",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Bikes", aboutLabel: "About", contactLabel: "Service", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Carbon bikes, accessories and everything you need for the perfect ride.`, newsletterHeading: "Rides, routes and new gear" },
      sections: [
        section("hero", "hero", {
          heading: storeName.toLowerCase(),
          subheading: "Carbon bikes, accessories and everything you need for the perfect ride, in one place.",
          buttonLabel: "Bikes",
          buttonLink: "/catalog",
          secondButtonLabel: "Accessories",
          secondButtonLink: "/catalog",
          image: PHOTO("photo-1765808925935-e4fab8f2f6c5", 2000),
          imageLayout: "wordmark",
        }),
        section("parts", "category-strip", { heading: "Accessories catalogue", text: "Pick the parts and gear to set up your bike exactly the way you ride." }),
        section("gear", "product-row", { heading: "Ride-ready gear", subheading: "", source: "newest", display: "slider", buttonLabel: "" }),
        section("spotlight", "product-spotlight", { source: "category:bikes" }),
        section("specs", "facts", {
          eyebrow: "Frame",
          heading: "Light where it\ncounts",
          image: PHOTO("photo-1576435728678-68d0fbf94e91", 1200),
          rows: "Frame: Full carbon\nWeight: 8.4 kg\nGroupset: 2×12 speed\nBrakes: Hydraulic disc\nTyres: Up to 45 mm",
          note: "Gravel GR, size M.",
          buttonLabel: "See all bikes",
          buttonLink: "/catalog",
        }),
        section("faq", "faq", {
          heading: "Before you ride",
          text: "",
          q1: "How do I choose my frame size?",
          a1: "Use your height: up to 170 cm is S, 170–182 cm is M, above 182 cm is L. Message us if you're in between.",
          q2: "Does the bike come assembled?",
          a2: "It arrives 90% assembled. Fit the handlebar and pedals in about 15 minutes, or book a free fitting.",
          q3: "Is there a warranty?",
          a3: "Every frame has a lifetime warranty, and parts are covered for 2 years.",
          q4: "Can I pay in instalments?",
          a4: "Yes, pay in easy instalments with most cards and UPI apps at checkout.",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme13") {
    return {
      announcement: "",
      settings: {
        background: "#FFFCF4",
        text: "#2E2A2B",
        accent: "#E0569E",
        accentText: "#FFFFFF",
        panel: "#FFF4DC",
        textSize: "100",
        headingFont: "Space Grotesk",
        displayFont: "Unbounded",
        bodyFont: "DM Sans",
        buttonShape: "square",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Menu", aboutLabel: "About", contactLabel: "Contacts", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Fresh donuts made every morning and delivered warm.`, newsletterHeading: "Sweet news, now and then" },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          subheading: "The freshest donuts in town with free delivery nearby. Build your own with our donut maker.",
          buttonLabel: "See the menu",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1644501963068-a779762d3673", 1400),
          imageLayout: "block",
        }),
        section("today", "product-row", { heading: "Try them\ntoday!", subheading: "", badge: "Free delivery over ₹499", source: "bestsellers", display: "grid", buttonLabel: "See all", buttonLink: "/catalog" }),
        section("how", "steps", {
          eyebrow: "How it works",
          heading: "Warm donuts,\nthree steps away",
          image: "",
          s1Title: "Pick your donuts",
          s1Text: "Choose from today's menu or build your own.",
          s2Title: "We bake at 6 am",
          s2Text: "Everything is fried and glazed fresh every morning.",
          s3Title: "Delivered warm",
          s3Text: "Free delivery nearby on orders over ₹499.",
          s4Title: "",
          s4Text: "",
        }),
        section("maker", "custom-order", {
          heading: "Create your\nspecial taste!",
          noteLabel: "Important note",
          note: "Special orders need at least one day's notice. Want it sooner? Pick from today's menu.",
          o1Label: "Size",
          o1Options: "Small (10 cm), Medium (14 cm), Large (18 cm)",
          o2Label: "Filling",
          o2Options: "Vanilla, Chocolate, Strawberry jam, Salted caramel",
          o3Label: "Glaze",
          o3Options: "Chocolate, Strawberry, Vanilla, Sugar",
          o4Label: "Topping",
          o4Options: "Sprinkles, Nuts, Cookie crumbs, None",
          image: PHOTO("photo-1783171375537-af3cca3ba347", 900),
          buttonLabel: "Order on WhatsApp",
        }),
        section("reviews", "reviews", { subheading: "", heading: "Sweet words" }),
        section("faq", "faq", {
          heading: "Sweet questions",
          text: "",
          q1: "When do you deliver?",
          a1: "Every day from 8 am to 8 pm. Orders before 6 pm arrive the same day.",
          q2: "Do you make eggless donuts?",
          a2: "Yes, every donut can be made eggless. Mention it in your order note.",
          q3: "How long do donuts stay fresh?",
          a3: "They're best the same day. Keep them in the box, away from the fridge.",
          q4: "Can I order for a party?",
          a4: "Yes! Use the Party Box or message us for 50+ donuts.",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme14") {
    return {
      announcement: "",
      settings: {
        background: "#FFF1C9",
        text: "#141414",
        accent: "#141414",
        accentText: "#FFFFFF",
        panel: "#8E9E57",
        textSize: "100",
        headingFont: "Bricolage Grotesque",
        displayFont: "Bricolage Grotesque",
        bodyFont: "Outfit",
        buttonShape: "pill",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "Our story", contactLabel: "Contact us", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Small-batch spice blends for home cooks and busy kitchens.`, newsletterHeading: "Recipes and new blends" },
      sections: [
        section("hero", "hero", {
          heading: "Discover\nnew tastes",
          subheading: "Small-batch spice blends for home cooking and professional kitchens.",
          buttonLabel: "Shop all products",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1781773338964-bc0e969d2973", 1400),
          imageLayout: "framed",
        }),
        section("moods", "marquee", { text: "Cosy · Fiery · Smoky · Sweet · Bright · Fresh" }),
        section("blends", "product-row", { heading: "Our blends", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "Shop all", buttonLink: "/catalog" }),
        section("recipes", "stories", {
          heading: "Cook with our blends",
          buttonLabel: "All recipes",
          buttonLink: "/pages/about",
          s1Image: PHOTO("photo-1532336414038-cf19250c5757", 900),
          s1Tag: "Weeknight",
          s1Title: "One-pot masala rice with Cosiness",
          s1Link: "/catalog",
          s2Image: PHOTO("photo-1771541897176-44a3e01dc484", 400),
          s2Tag: "Grill",
          s2Title: "Smoky paneer skewers with Passion",
          s2Link: "/catalog",
          s3Image: PHOTO("photo-1486548730767-5c679e8eda6b", 400),
          s3Tag: "Spicy",
          s3Title: "Chilli oil in ten minutes with Intensity",
          s3Link: "/catalog",
          s4Image: PHOTO("photo-1754513346375-174bb9d083f1", 400),
          s4Tag: "Drinks",
          s4Title: "A calm evening tea with Calm",
          s4Link: "/catalog",
        }),
        section("origins", "highlights", {
          eyebrow: "Where it comes from",
          heading: "Sourced from\nsmall farms",
          text: "",
          h1Image: PHOTO("photo-1635355995448-77b02d33621d", 700),
          h1Title: "Kashmiri chilli",
          h1Text: "Deep red and mild, from the Kashmir valley.",
          h2Image: PHOTO("photo-1742748912566-b2f1851e6021", 700),
          h2Title: "Lakadong turmeric",
          h2Text: "High-curcumin turmeric from Meghalaya.",
          h3Image: PHOTO("photo-1486548730767-5c679e8eda6b", 700),
          h3Title: "Guntur chilli",
          h3Text: "Fiery and bright, from Andhra Pradesh.",
          h4Image: PHOTO("photo-1677339443020-e37769511005", 700),
          h4Title: "Nilgiri herbs",
          h4Text: "Dried slowly in the hills of Tamil Nadu.",
        }),
        section("story", "image-text", {
          heading: "Ground fresh,\nblended by hand",
          text: "We toast and grind every spice in small batches, so each jar smells like the day it was made.",
          buttonLabel: "Our story",
          buttonLink: "/pages/about",
          image: PHOTO("photo-1635355995448-77b02d33621d", 1200),
          imageWidth: "half",
          tone: "light",
          imageSide: "right",
          highlightLabel: "",
          highlight: "",
        }),
        section("newsletter", "newsletter", { heading: "Recipes, monthly", text: "One easy recipe and our newest blend, once a month." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme15") {
    return {
      announcement: "Free delivery on every 12-can box",
      settings: {
        background: "#FFF4E2",
        text: "#2A2320",
        accent: "#E8412C",
        accentText: "#FFFFFF",
        panel: "#FCE7C8",
        textSize: "100",
        headingFont: "Syne",
        displayFont: "Syne",
        bodyFont: "DM Sans",
        buttonShape: "square",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Contact" },
      footer: { ...footer, about: `${storeName}. Fermented fruit sodas, low in sugar and full of flavour.`, newsletterHeading: "New flavours, first" },
      sections: [
        section("hero", "hero", {
          heading: "Take your\ntaste buds to\nnew heights",
          subheading: "Sip and discover fermented fruit sodas",
          buttonLabel: "Shop now",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1781560149535-5d26b925f174", 2000),
          imageLayout: "pop",
        }),
        section("claims", "claims-strip"),
        section("flavours", "product-row", { heading: "Shop flavours", subheading: "", source: "bestsellers", display: "slider", buttonLabel: "" }),
        section("spotlight", "product-spotlight", { source: "newest", image: "" }),
        section("reviews", "reviews", { subheading: "", heading: "Fans say" }),
        section("numbers", "impact", {
          heading: "Small cans,\nbig numbers",
          text: "What a little fizz adds up to.",
          n1Value: "2.5L+",
          n1Label: "Cans sipped so far",
          n2Value: "35",
          n2Label: "Calories in a can",
          n3Value: "5g",
          n3Label: "Sugar in a can",
        }),
        section("inside", "facts", {
          eyebrow: "What's inside",
          heading: "Good for you,\ngreat to drink",
          image: PHOTO("photo-1781560149522-9797714b5c84", 1200),
          rows: "Calories: 35 per can\nSugar: 5 g\nProbiotics: Live cultures\nSweetened with: Fruit and raw sugar\nCaffeine: None",
          note: "Per 330 ml can of Pineapple Guava.",
          buttonLabel: "Shop flavours",
          buttonLink: "/catalog",
        }),
        section("how", "steps", {
          eyebrow: "How it works",
          heading: "Fresh fizz in\nthree steps",
          image: PHOTO("photo-1781560150438-2bc2bf7c4434", 1200),
          s1Title: "Pick your flavours",
          s1Text: "Mix single cans or grab a ready pack.",
          s2Title: "We ship it cold",
          s2Text: "Packed in insulated boxes and out within 24 hours.",
          s3Title: "Chill and sip",
          s3Text: "Best ice cold, straight from the can.",
          s4Title: "",
          s4Text: "",
        }),
        section("combo", "combo-builder", {
          heading: "Build a box of three",
          text: "Pick one from each list and we'll add all three to your bag.",
          c1Label: "First can",
          c1Source: "category:cans",
          c2Label: "Second can",
          c2Source: "newest",
          c3Label: "Add a pack",
          c3Source: "category:packs",
          buttonLabel: "Add my box",
        }),
        section("fans", "tilt-gallery", {
          heading: "Sip it your way",
          p1Image: PHOTO("photo-1781560149889-21e394a4175f", 900),
          p1Title: "Ice cold",
          p2Image: PHOTO("photo-1781559310925-3f34116c0636", 900),
          p2Title: "Picnic ready",
          p3Image: PHOTO("photo-1781560149414-bd24871a00d3", 900),
          p3Title: "Party size",
        }),
        section("deals", "countdown-deals", { heading: "Today's deals", endsAt: "23:59", source: "category:packs" }),
        section("box", "promo-banner", {
          image: PHOTO("photo-1781560150113-156cf60751fc", 1800),
          heading: "Every flavour,\none box",
          text: "Mix 12 cans any way you like.",
          buttonLabel: "Build a box",
          buttonLink: "/catalog",
        }),
        section("tags", "tag-cloud", { text: "Pineapple · Mandarin · Guava · Strawberry · Orange zest · Live cultures · Low sugar · No caffeine · Real fruit · Gut friendly" }),
        section("faq", "faq", {
          heading: "Questions?",
          text: "Can't find your answer? Message us on WhatsApp.",
          q1: "How should I store the cans?",
          a1: "Keep them in the fridge. The live cultures love the cold.",
          q2: "Is there any caffeine?",
          a2: "No. Every flavour is caffeine free.",
          q3: "How fast is delivery?",
          a3: "We ship within 24 hours and most orders arrive in 2 to 5 days.",
          q4: "Can I mix flavours in one box?",
          a4: "Yes. Build a box with any flavours you like.",
          q5: "",
          a5: "",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme16") {
    return {
      announcement: "Harvest-fresh formulas. Shop new arrivals.",
      settings: {
        background: "#F7F2E8",
        text: "#3A2A1E",
        accent: "#8B5A2B",
        accentText: "#FFFFFF",
        panel: "#E6D2B5",
        textSize: "100",
        headingFont: "Playfair Display",
        displayFont: "Playfair Display",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "Learn", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Gentle skincare made with ancient grains.`, newsletterHeading: "Rituals and new formulas" },
      sections: [
        section("hero", "hero", {
          heading: "Crafted for balance,\nmade with grains.",
          subheading: "Gentle skincare made from oats, rice, millet and quinoa, for calm and glowing skin.",
          points: "Oat extract to calm\nMillet peptides to firm\nQuinoa for deep hydration\nRice water for a bright glow\nGrains from small farms",
          buttonLabel: "Discover the range",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1707539160277-e39464517645", 1400),
          imageLayout: "checklist",
        }),
        section("products", "product-row", { heading: "Our products", subheading: "Grain-based formulas for everyday balance.", source: "bestsellers", display: "grid", buttonLabel: "" }),
        section("ingredients", "highlights", {
          eyebrow: "Key ingredients",
          heading: "Four grains,\none gentle routine",
          text: "",
          h1Image: PHOTO("photo-1676289124506-bdce1e1acc97", 700),
          h1Title: "Oat",
          h1Text: "Calms redness and soothes dry patches.",
          h2Image: PHOTO("photo-1584353781226-579f0ab7c770", 700),
          h2Title: "Rice water",
          h2Text: "Brightens and evens out skin tone.",
          h3Image: PHOTO("photo-1711357187990-40c3bab460ea", 700),
          h3Title: "Millet",
          h3Text: "Peptides that help skin feel firmer.",
          h4Image: PHOTO("photo-1656918828529-345b77bb06e9", 700),
          h4Title: "Quinoa",
          h4Text: "Deep, lasting hydration.",
        }),
        section("spotlight", "product-spotlight", { source: "newest" }),
        section("ritual", "steps", {
          eyebrow: "Your ritual",
          heading: "Three steps,\nmorning and night",
          image: PHOTO("photo-1739980213756-753aea153bb8", 1200),
          s1Title: "Cleanse",
          s1Text: "Massage the Oat Cleansing Gel onto damp skin and rinse.",
          s2Title: "Treat",
          s2Text: "Press three drops of Oat-Rice Serum into your skin.",
          s3Title: "Moisturise",
          s3Text: "Finish with Oat Cloud Cream to lock it all in.",
          s4Title: "",
          s4Text: "",
        }),
        section("faq", "faq", {
          heading: "Skin questions",
          text: "",
          q1: "Is it safe for sensitive skin?",
          a1: "Yes. Our formulas are fragrance-free and patch-tested on sensitive skin.",
          q2: "How long until I see results?",
          a2: "Most people notice calmer, softer skin within two weeks of daily use.",
          q3: "Are your products cruelty-free?",
          a3: "Always. We never test on animals.",
          q4: "Can I return an opened product?",
          a4: "Unopened products can be returned within 14 days. If something irritates your skin, message us.",
        }),
        section("newsletter", "newsletter", { heading: "Join the ritual", text: "Skin tips and early access to new formulas." }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme10") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#161616",
        accent: "#161616",
        accentText: "#FFFFFF",
        panel: "#F1F1EF",
        textSize: "100",
        headingFont: "Inter Tight",
        displayFont: "Inter Tight",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "All categories", aboutLabel: "About us", contactLabel: "Contact us", searchPlaceholder: "Search items", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Everyday clothing and shoes, made to move with you and delivered across India.`, newsletterHeading: "New drops in your inbox" },
      sections: [
        section("hero", "hero", {
          heading: "Move\nyour way",
          subheading: "Easy everyday pieces that keep up with workouts, work and weekends.",
          buttonLabel: "Shop the collection",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1614975059536-2df3b404d53c", 1600),
          imageLayout: "bento",
          tile1Image: PHOTO("photo-1621576912675-f62566f2ebc5", 900),
          tile1Label: "Outdoor\nactive",
          tile1Link: "/catalog",
          tile2Image: PHOTO("photo-1608984361471-ff566593088f", 900),
          tile2Label: "Effortless\nlayers",
          tile2Link: "/catalog",
        }),
        section("looks", "look-cards", { heading: "Casual\ninspirations" }),
        section("trending", "product-row", { heading: "Trending", subheading: "", source: "bestsellers", display: "tabs", buttonLabel: "" }),
        section("colours", "colour-chips", { heading: "Explore\nby colours", colours: "Black #1B1B1B\nWhite #F4F4F2\nRed #E5604D\nNavy #233B6E\nBlue #8EC5E8\nYellow #F2C94C\nBrown #8A5A3C\nGrey #A3A3A0\nOrange #EE7A2B" }),
        section("said", "testimonial"),
        section("journal", "image-text", {
          heading: "How to put together an easy outfit for every day",
          text: "No need to buy something new every week. Start with a few pieces you love, add one bold colour and let your shoes do the talking.",
          buttonLabel: "Read more",
          buttonLink: "/pages/about",
          image: PHOTO("photo-1489987707025-afc232f7ea0f", 1200),
          imageWidth: "small",
          tone: "light",
          imageSide: "left",
          highlightLabel: "",
          highlight: "",
        }),
        section("why", "why-stats"),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme11") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#171515",
        accent: "#171515",
        accentText: "#FFFFFF",
        panel: "#F4ECE8",
        textSize: "100",
        headingFont: "Anton",
        displayFont: "Anton",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About", contactLabel: "Support", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Running and everyday sneakers, shipped across India.`, newsletterHeading: "Subscribe to our newsletter" },
      sections: [
        section("hero", "hero", {
          heading: "Glide Pro\nRunner\nCoral",
          subheading: "",
          buttonLabel: "Shop now",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1600185365483-26d7a4cc7519", 1400),
          imageLayout: "spec",
          outline: "RUN",
          spec1Label: "Model",
          spec1Value: "Glide Pro Runner",
          spec2Label: "Brand",
          spec2Value: storeName,
          spec3Label: "Colour",
          spec3Value: "Washed coral",
          spec4Label: "Price",
          spec4Value: "₹9,499",
        }),
        section("panels", "category-panels"),
        section("featured", "featured-product", { source: "bestsellers" }),
        section("specs", "facts", {
          eyebrow: "Tech specs",
          heading: "Built for\nevery mile",
          image: PHOTO("photo-1600185365926-3a2ce3cdb9eb", 1200),
          rows: "Weight: 248 g (UK 8)\nHeel-to-toe drop: 8 mm\nCushioning: Responsive foam\nUpper: Breathable knit\nBest for: Daily runs and tempo days",
          note: "Measured on the Glide Pro Runner.",
          buttonLabel: "Shop running",
          buttonLink: "/catalog",
        }),
        section("promo", "promo-banner", { heading: "Adapt\nRunner 2.0", text: "Snug, light and ready for every mile." }),
        section("faq", "faq", {
          heading: "Sizing & fit",
          text: "Not sure which size? Here is what runners ask us most.",
          q1: "Do your shoes run true to size?",
          a1: "Most of our runners fit true to size. If you're between sizes, go half a size up.",
          q2: "Can I exchange for a different size?",
          a2: "Yes. Unworn shoes can be exchanged within 7 days of delivery.",
          q3: "How long do running shoes last?",
          a3: "About 600–800 km, depending on how and where you run.",
          q4: "Which shoe is best for a beginner?",
          a4: "Start with a cushioned everyday trainer like the Swift Trainer.",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme12") {
    return {
      announcement: "Free delivery on your first order",
      settings: {
        background: "#FAF7F2",
        text: "#1C1A17",
        accent: "#EE5B2B",
        accentText: "#FFFFFF",
        panel: "#ECE7DF",
        textSize: "100",
        headingFont: "Outfit",
        displayFont: "Anton",
        bodyFont: "Outfit",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "All shoes", aboutLabel: "Brands", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName}. Bright sneakers and everyday gear, delivered across India.`, newsletterHeading: "Fresh drops, first" },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          subheading: "",
          buttonLabel: "Shop all",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1767451436272-daa71c486b96", 1800),
          imageLayout: "duo",
        }),
        section("brands", "brand-strip"),
        section("new", "product-row", { heading: "Fresh drops", subheading: "", source: "newest", display: "grid", buttonLabel: "" }),
        section("spotlight", "category-spotlight", { heading: "Accessories", source: "category:accessories" }),
        section("branded", "product-row", { heading: "Branded shoes", subheading: "", source: "bestsellers", display: "slider", buttonLabel: "Shop all", buttonLink: "/catalog" }),
        section("perks", "perks"),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme09") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#1A1A1A",
        accent: "#1A1A1A",
        accentText: "#FFFFFF",
        panel: "#F1EFEB",
        textSize: "100",
        headingFont: "Inter Tight",
        displayFont: "Cormorant Garamond",
        bodyFont: "Inter",
        buttonShape: "square",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "Heritage", contactLabel: "Contact", ctaLabel: "" },
      footer: { ...footer, about: `${storeName} makes finely crafted accessories for dogs and the people who love them.`, newsletterHeading: "Join the community" },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          subheading: "Finely crafted accessories for dogs, made to last a lifetime.",
          buttonLabel: "",
          secondButtonLabel: "",
          image: PHOTO("photo-1566710582818-d673dc761201", 2000),
          imageLayout: "center",
        }),
        section("intro", "product-row", { heading: `${storeName} is a luxury fashion house for dogs`, subheading: "", source: "newest", display: "grid", buttonLabel: "Shop all", buttonLink: "/catalog" }),
        section("feature", "collection-feature", {
          heading: "The Harmony collection",
          productImage: PHOTO("photo-1679224106783-c21b1841412a", 900),
          text: "Everyday pieces made from soft leather and natural fibres, crafted with care.",
          image: PHOTO("photo-1530700131180-d43d9b8cc41f", 1200),
          imageSide: "right",
        }),
        section("sahara", "product-row", { heading: "Best loved", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "" }),
        section("press", "quote", { outlet: "The Journal", text: "“Truly beautiful pieces that change the way we walk our dogs.”", names: "" }),
        section("stories", "stories", { heading: storeName }),
        section("collar", "collection-feature", {
          heading: "The everyday collar",
          productImage: PHOTO("photo-1708062270853-ee7c66b69f07", 900),
          text: "Hand-stitched leather with solid brass hardware, made to soften beautifully with time.",
          image: PHOTO("photo-1747707498471-315f32090b38", 1200),
          imageSide: "left",
          buttonLabel: "Shop now",
          buttonLink: "/catalog",
        }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "f01") {
    return {
      announcement: "",
      settings: {
        background: "#F2F2EC",
        text: "#1C1C1A",
        accent: "#1F2A24",
        accentText: "#FFFFFF",
        panel: "#E4E3DC",
        textSize: "100",
        headingFont: "Outfit",
        displayFont: "Outfit",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Catalog", aboutLabel: "About", contactLabel: "Contact" },
      footer: { ...footer, about: `${storeName}. Furniture made to order and built to last, delivered across India.`, newsletterHeading: "New pieces and workshop news" },
      sections: [
        section("hero", "hero", {
          heading: storeName.toLowerCase(),
          tag: "furniture workshop",
          subheading: "Furniture made for homes that value quality, texture and thoughtful design. From the first sketch to the final detail, every piece is built to last.",
          buttonLabel: "Go to catalog",
          buttonLink: "/catalog",
          secondButtonLabel: "",
          image: PHOTO("photo-1699588772787-1eed3b726e0a", 1200),
          imageLayout: "showcase",
          tile1Image: PHOTO("photo-1687180498602-5a1046defaa4", 600),
          tile1Label: "Ready to buy",
          tile1Link: "/catalog",
          tile2Image: PHOTO("photo-1659930087003-2d64e33181f7", 600),
          tile2Label: "Custom order",
          tile2Link: "/pages/contact",
        }),
        section("about", "about-split", { heading: "*Elegant furniture*\nfor sophisticated interiors", linkLabel: `More about ${storeName}` }),
        section("categories", "categories", { heading: "*Shop by* room" }),
        section("fresh", "product-row", { heading: "*Fresh* collection", subheading: "", source: "newest", display: "slider", tone: "dark", buttonLabel: "Go to full catalog", buttonLink: "/catalog" }),
        section("process", "steps", {
          eyebrow: "Custom orders",
          heading: "*From sketch*\nto your room",
          image: PHOTO("photo-1659930087003-2d64e33181f7", 1200),
          s1Title: "Tell us your space",
          s1Text: "Share the size of your room and the look you love.",
          s2Title: "Pick wood and fabric",
          s2Text: "We send samples of oak, walnut and teak with fabric swatches.",
          s3Title: "Built by hand",
          s3Text: "Your piece is made in our workshop in 3–5 weeks.",
          s4Title: "Delivered and placed",
          s4Text: "We bring it in, set it up and take the packaging away.",
        }),
        section("custom", "offer-split", {
          image: PHOTO("photo-1788296817269-8df0458ab799", 1400),
          eyebrow: "02/ Custom order",
          heading: "*Made to your*\nsize and finish.",
          text: "Tell us your space and the look you love. We'll sketch it, share the wood and fabric options, and build it by hand in our workshop.",
          buttonLabel: "Start a custom order",
          buttonLink: "/pages/contact",
          panelImage: "",
        }),
        section("perks", "perks", {
          p1Title: "Solid wood",
          p1Text: "Oak, walnut and teak, never veneer",
          p2Title: "Made by hand",
          p2Text: "Built to order in our workshop",
          p3Title: "Free delivery",
          p3Text: "Delivered and placed in your room",
          p4Title: "5-year warranty",
          p4Text: "On every frame we make",
        }),
        section("reviews", "reviews", { subheading: "", heading: "*What clients* say" }),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme06") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#141414",
        accent: "#6D3FE0",
        accentText: "#FFFFFF",
        panel: "#F3F0FC",
        textSize: "100",
        headingFont: "Inter Tight",
        displayFont: "Inter Tight",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", ctaLabel: "Shop now", ctaLink: "/catalog" },
      footer: { ...footer, about: `${storeName}. Everyday tech, picked with care and delivered across India.`, newsletterHeading: "Get new picks and offers first" },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          subheading: "Store",
          tag: "",
          stat: "70+",
          statLabel: "Trusted brands",
          spotSource: "newest",
          spotButton: "Buy",
          buttonLabel: "",
          secondButtonLabel: "",
          image: PHOTO("photo-1771732267144-2890ccee7076", 1800),
          imageLayout: "notch",
        }),
        section("categories", "category-cards"),
        section("hot", "product-row", {
          heading: "Hot picks for you",
          subheading: "Loved by thousands of shoppers.",
          source: "bestsellers",
          display: "tabs",
          buttonLabel: "",
          promoImage: PHOTO("photo-1764137399490-418e64d6ddbb", 800),
          promoText: "Explore 50+ more picks",
          promoButton: "View collection",
          promoLink: "/catalog",
          limit: "5",
        }),
        section("brands", "brand-strip", { names: "Sonix · Lumen · Orbit · Kestrel · Halo · Vantage" }),
        section("budget", "budget-picker", {
          heading: "Shop by budget",
          ranges: "Under ₹2,000: 0-1999\n₹2,000 – ₹4,000: 2000-3999\n₹4,000 – ₹6,000: 4000-5999\n₹6,000 and up: 6000-",
          buttonLabel: "See everything",
          text: "Pick a price range and add straight to your bag.",
          style: "panel",
        }),
        section("offer", "offer-split", {
          eyebrow: "Limited time only",
          heading: "Save 40% on\nselect audio.",
          text: "Headphones, earbuds and speakers at their best price this season.",
          buttonLabel: "Shop the sale",
          buttonLink: "/catalog?sale=1",
        }),
        section("setup", "room-shop", {
          heading: "Shop the desk setup",
          text: "Tap a dot to see what's on the desk.",
          image: PHOTO("photo-1593062096033-9a26b09da705", 1800),
          source: "bestsellers",
          h1X: "30",
          h1Y: "62",
          h2X: "52",
          h2Y: "40",
          h3X: "74",
          h3Y: "58",
          h4X: "14",
          h4Y: "40",
        }),
        section("pricelist", "menu-board", {
          heading: "The price list",
          text: "Every product, every price. Tap a category and add straight to your bag.",
          note: "Prices include GST. Free delivery on orders over ₹999.",
        }),
        section("finder", "scent-quiz", {
          heading: "Find your gear",
          text: "Pick what you need it for.",
          options: "Listening: headphone\nWorkouts: workout\nPhotos: camera\nParties: speaker\nStaying charged: charge",
          buttonLabel: "See all products",
        }),
        section("stage", "stage", {
          heading: "Sound you\ncan feel",
          image: PHOTO("photo-1505740420928-5e560c06d30e", 1200),
          word: "AUDIO",
          buttonLabel: "Shop audio",
          buttonLink: "/category/audio",
        }),
        section("bento", "bento-benefits", {
          eyebrow: "Why shop with us",
          heading: "Picked with care,\n*delivered fast*",
          b1Title: "Genuine products",
          b1Text: "Every gadget arrives sealed, with its brand warranty.",
          b2Title: "Fast delivery",
          b2Text: "Most orders reach you in 3 to 5 days.",
          b3Title: "Easy returns",
          b3Text: "Changed your mind? Return it within 7 days.",
          p1Image: PHOTO("photo-1535157412991-2ef801c1748b", 900),
          p2Image: PHOTO("photo-1591290619618-904f6dd935e3", 900),
          p3Image: PHOTO("photo-1572569511254-d8f925fe2cbb", 900),
          p4Image: PHOTO("photo-1786103776067-2df6237af61d", 900),
        }),
        section("reviews", "reviews", { subheading: "", heading: "What our customers say" }),
        section("faq", "faq", {
          heading: "Good to know",
          text: "Warranty, delivery and returns, answered.",
          q1: "Do products come with a warranty?",
          a1: "Yes. Every gadget arrives sealed, with its brand warranty card.",
          q2: "When will my order arrive?",
          a2: "Most orders arrive in 3–5 days. You'll get a tracking link once it ships.",
          q3: "Can I return a product?",
          a3: "Yes, within 7 days of delivery, unused and in its original box.",
          q4: "Do you offer cash on delivery?",
          a4: "Yes, on most orders across India.",
          q5: "Do you deliver everywhere in India?",
          a5: "Yes, to over 19,000 PIN codes. Enter yours at checkout to see the delivery date.",
          style: "cards",
          helpTitle: "Still have questions?",
          helpText: "Our team replies on WhatsApp within an hour, Monday to Saturday.",
          helpButton: "Chat with us",
        }),
        section("perks", "perks"),
      ],
      pages: {
        ...defaultPages(storeName),
        about: { ...defaultPages(storeName).about, image: PHOTO("photo-1498050108023-c5249f4df085", 1800) },
        contact: { ...defaultPages(storeName).contact, image: PHOTO("photo-1527443224154-c4a3942d3acf", 1800) },
      },
    };
  }

  if (toSiteTheme(theme) === "theme05") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#141414",
        accent: "#141414",
        accentText: "#FFFFFF",
        panel: "#F1F1F1",
        textSize: "100",
        headingFont: "Bricolage Grotesque",
        displayFont: "Bricolage Grotesque",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", ctaLabel: "Find your fit", ctaLink: "/catalog" },
      footer: { ...footer, about: `${storeName}. Comfortable sneakers for every day, shipped across India.`, newsletterHeading: "Join our list for new drops and offers" },
      sections: [
        section("hero", "hero", {
          tag: "Up to 30% off",
          heading: "Big sale,\n*all month.*",
          subheading: "Our best sellers, up to 30% off. Mix colours, add more and pay less for each.",
          buttonLabel: "Shop the sale",
          buttonLink: "/catalog?sale=1",
          secondButtonLabel: "",
          image: PHOTO("photo-1491553895911-0055eca6402d", 1400),
          imageLayout: "panel",
        }),
        section("promises", "marquee", { text: "Free size exchanges · 7-day returns · Cash on delivery · Delivered in 3 to 5 days", colour: "" }),
        section("everyday", "product-row", { heading: "Explore *every day*", source: "newest", buttonLabel: "" }),
        section("ranges", "category-panels", { heading: "Shop the *range*", buttonLabel: "Shop now" }),
        section("colours", "colour-chips", {
          heading: "Shop by\n*colour*",
          colours: "White #F4F4F2\nBlack #1B1B1B\nRed #D7262E\nGreen #2F6B3F\nGrey #9A9A9A\nYellow #E3D23A",
        }),
        section("collage", "type-collage", {
          line1: "Light on",
          line2: "*your* feet,",
          line3: "all day long.",
          image: PHOTO("photo-1542291026-7eec264c27ff", 900),
          noteLeft: "Foam soles that bounce back, mile after mile.",
          noteRight: "Breathable uppers that keep you cool from the morning run to the late night out.",
        }),
        section("anatomy", "facts", {
          eyebrow: "Inside every pair",
          heading: "Anatomy of\na *sneaker*",
          image: PHOTO("photo-1491553895911-0055eca6402d", 1200),
          rows: "Upper: Breathable knit mesh\nCushioning: Springy foam midsole\nOutsole: Rubber grip, built to last\nInsole: Soft, removable footbed\nWeight: About 280 g a shoe",
          note: "Details differ a little from pair to pair.",
          buttonLabel: "Find your pair",
          buttonLink: "/catalog",
        }),
        section("featured", "featured-product", {
          heading: "Fresh off\nthe *shelf*",
          text: "Our newest pairs, picked for comfort from the first step to the last.",
          source: "newest",
          buttonLabel: "See all pairs",
          buttonLink: "/catalog",
          style: "drops",
          badge: "Just in",
        }),
        section("sizes", "size-finder", {
          heading: "Find your *size*",
          text: "Tap your usual size to see how it measures.",
          measureNames: "Foot length / EU / US",
          unitNote: "measures",
          unitMark: "",
          sizes: "UK 6: 24.5 cm / 40 / 7\nUK 7: 25.4 cm / 41 / 8\nUK 8: 26.2 cm / 42 / 9\nUK 9: 27.1 cm / 43 / 10\nUK 10: 27.9 cm / 44 / 11",
          buttonLabel: "Shop all sneakers",
          buttonLink: "/catalog",
        }),
        section("deal", "countdown-deals", {
          heading: "Grab it before\n*midnight*",
          label: "Deal of the day",
          endsAt: "23:59",
          source: "sale",
          style: "board",
          buttonLabel: "Grab this deal",
          moreLabel: "More deals",
        }),
        section("street", "tilt-gallery", {
          heading: "Spotted on the *street*",
          p1Image: PHOTO("photo-1641997465126-c73cc4070337", 900),
          p1Title: "#StrideDaily",
          p2Image: PHOTO("photo-1582898967731-b5834427fd66", 900),
          p2Title: "Night run",
          p3Image: PHOTO("photo-1575537302964-96cd47c06b1b", 900),
          p3Title: "Weekend fit",
        }),
        section("activity", "occasion-mosaic", {
          heading: "Shop by *activity*",
          buttonLabel: "View all",
          buttonLink: "/catalog",
          o1Image: PHOTO("photo-1456613820599-bfe244172af5", 900),
          o1Title: "Trail days",
          o1Text: "Shop grip",
          o1Link: "/category/running",
          o2Image: PHOTO("photo-1542291026-7eec264c27ff", 1200),
          o2Title: "Morning runs",
          o2Text: "Shop runners",
          o2Link: "/category/running",
          o3Image: PHOTO("photo-1608229751021-ed4bd8677753", 700),
          o3Title: "Everyday",
          o3Text: "Shop sneakers",
          o3Link: "/category/sneakers",
          o4Image: PHOTO("photo-1582898967731-b5834427fd66", 700),
          o4Title: "Night out",
          o4Text: "Shop dark pairs",
          o4Link: "/catalog",
          o5Image: PHOTO("photo-1585499583264-491df5142e83", 1200),
          o5Title: "Comfy feet",
          o5Text: "Shop socks",
          o5Link: "/category/socks",
        }),
        section("reviews", "reviews", { heading: `Customers *love* ${storeName}` }),
        section("searches", "popular-searches", {
          heading: "Popular searches",
          terms: "White sneakers: white\nRunning shoes: running\nHigh-tops: high-top\nCanvas: canvas\nSocks: socks",
        }),
        section("perks", "perks", { style: "strip",
          p1Title: "Free size exchange",
          p1Text: "Swap your size within 7 days",
          p2Title: "Cash on delivery",
          p2Text: "Pay when your pair arrives",
          p3Title: "Fast delivery",
          p3Text: "3 to 5 days across India",
          p4Title: "Here to help",
          p4Text: "Chat with us on WhatsApp",
        }),
      ],
      pages: {
        ...defaultPages(storeName),
        about: { ...defaultPages(storeName).about, image: PHOTO("photo-1613972798457-45fc5237ae32", 1800) },
        contact: { ...defaultPages(storeName).contact, image: PHOTO("photo-1516826957135-700dedea698c", 1800) },
      },
    };
  }

  if (toSiteTheme(theme) === "theme04") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#111111",
        accent: "#111111",
        accentText: "#FFFFFF",
        panel: "#EFEFEF",
        textSize: "100",
        headingFont: "Anton",
        displayFont: "Anton",
        bodyFont: "Inter",
        buttonShape: "square",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop", aboutLabel: "About us" },
      footer,
      sections: [
        section("hero", "hero", {
          heading: `${storeName}\nFashion`,
          subheading: `Discover fashion that mirrors your personality. At ${storeName}, every piece is picked to lift your confidence and let you stand out, effortlessly, every day.`,
          buttonLabel: "Buy product",
          buttonLink: "/catalog",
          secondButtonLabel: "Explore products",
          secondButtonLink: "/catalog",
          image: PHOTO("photo-1483985988355-763728e1935b", 1400),
          imageLayout: "split",
        }),
        section("marquee", "marquee", { text: `${storeName} fashion · ${storeName} fashion · ${storeName} fashion · ${storeName} fashion` }),
        section("promo", "promo-cards"),
        section("collection", "product-row", {
          heading: "Our collection",
          subheading: `Step into the world of ${storeName}, where every collection tells its own story. From everyday essentials to bold pieces, there is something for every occasion.`,
          source: "all",
          display: "tabs",
          buttonLabel: "",
        }),
        section("statement", "statement"),
        section("clothing", "image-text", {
          heading: "Clothing\ncollection",
          text: "Our clothing is a celebration of style, versatility and craft. Each piece is designed to go with the moments that matter, from everyday wear to special occasions.",
          buttonLabel: "Shop now",
          buttonLink: "/catalog",
          image: PHOTO("photo-1516826957135-700dedea698c", 1200),
          imageSide: "left",
          tone: "dark",
        }),
        section("banners", "banners"),
        section("newsletter", "newsletter"),
      ],
      pages: defaultPages(storeName),
    };
  }

  if (toSiteTheme(theme) === "theme03") {
    return {
      announcement: "New season is here! Get 10% off your first order",
      settings: {
        background: "#FFFFFF",
        text: "#141414",
        accent: "#111111",
        accentText: "#FFFFFF",
        panel: "#F0F0F0",
        textSize: "100",
        headingFont: "Onest",
        displayFont: "Anton",
        bodyFont: "Onest",
        buttonShape: "pill",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Categories" },
      footer: { ...footer, about: `Gear up with ${storeName}. Quality pieces for every day, delivered across India.` },
      sections: [
        section("hero", "hero", {
          heading: `${storeName}`,
          subheading: "Our latest collection, made for people on the move. Bold colours, honest materials and fits that last.",
          image: PHOTO("photo-1551524559-8af4e6624178"),
          imageLayout: "center",
        }),
        section("arrivals", "product-row", {
          heading: "New arrivals",
          subheading: "Fresh pieces built to keep up with your day while keeping you looking your best.",
          source: "newest",
          display: "grid",
          buttonLabel: "See all",
        }),
        section("promo", "image-text", {
          heading: "Find your perfect look in our new collection",
          text: "Step into our store and discover the newest arrivals, picked to go with everything you already own.",
          highlightLabel: "Come and enjoy the sale!",
          highlight: "50%",
          buttonLabel: "Shop the sale",
          buttonLink: "/catalog",
          image: PHOTO("photo-1441986300917-64674bd600d8", 1600),
          imageSide: "left",
        }),
        section("collections", "collection-grid", {
          count: "6",
          tone: "dark",
          x1Image: PHOTO("photo-1483721310020-03333e577078", 1000),
          x1Title: "Sale",
          x1Link: "/catalog?sale=1",
          x2Image: PHOTO("photo-1501785888041-af3ef285b470", 1000),
          x2Title: "New in",
          x2Link: "/catalog",
        }),
        section("banners", "banners"),
        section("ticker", "marquee", { text: "Built for the trail · Free delivery over ₹1,999 · Easy 7-day exchange · Made to move", colour: "" }),
        section("shop-by", "category-strip", { heading: "Shop by activity", text: "Hiking, running or just the daily commute. Start with what you do.", align: "center" }),
        section("best", "collection-slider", {
          heading: "Trail favourites",
          text: "The pieces our customers take on every trip, tested on real trails.",
          source: "bestsellers",
          buttonLabel: "Shop all",
          buttonLink: "/catalog",
          align: "center",
        }),
        section("stories", "feature-slider", {
          f1Image: PHOTO("photo-1551632811-561732d1e306", 1400),
          f1Title: "Into the hills",
          f1Text: "Layers that breathe on the climb and keep you warm at the top.",
          f1Button: "Shop jackets",
          f1Link: "/category/jackets",
          f2Image: PHOTO("photo-1586022045497-31fcf76fa6cc", 1400),
          f2Title: "Packed for the peak",
          f2Text: "Light packs with room for everything a long day needs.",
          f2Button: "Shop bags",
          f2Link: "/category/bags",
          f3Image: PHOTO("photo-1575987116913-e96e7d490b8a", 1400),
          f3Title: "Grip on every step",
          f3Text: "Boots and trail runners with soles made for loose ground.",
          f3Button: "Shop footwear",
          f3Link: "/category/footwear",
        }),
        section("tiles", "edge-tiles", {
          t1Image: PHOTO("photo-1578964046312-69d266a3e739", 900),
          t1Title: "City cold",
          t1Button: "Puffers",
          t1Link: "/category/jackets",
          t2Image: PHOTO("photo-1580058572462-98e2c0e0e2f0", 900),
          t2Title: "Trail days",
          t2Button: "Runners",
          t2Link: "/category/footwear",
          t3Image: PHOTO("photo-1501555088652-021faa106b9b", 900),
          t3Title: "Long hauls",
          t3Button: "Backpacks",
          t3Link: "/category/bags",
          t4Image: PHOTO("photo-1576871337632-b9aef4c17ab9", 900),
          t4Title: "Little extras",
          t4Button: "Gear",
          t4Link: "/category/gear",
        }),
        section("voices", "review-spotlight", {
          label: "What our customers say",
          image: PHOTO("photo-1551524559-8af4e6624178", 1200),
          text: "Wore the windbreaker up three passes in a week. Light, warm enough and it still looks new.",
          name: "Aditya, Manali",
        }),
        section("why", "why-stats", {
          heading: "Made to keep up",
          text: "Every piece is tested outdoors before it reaches our shop.",
          image: PHOTO("photo-1506905925346-21bda4d32df4", 1800),
          n1Value: "500+",
          n1Label: "Trails tested",
          n1Text: "From city parks to the high passes.",
          n2Value: "4.8★",
          n2Label: "Average rating",
          n2Text: "From buyers across India.",
          n3Value: "7 days",
          n3Label: "Easy exchange",
          n3Text: "If the fit isn't right, swap it.",
        }),
        section("promises", "perks", {
          p1Title: "Free delivery",
          p1Text: "On orders over ₹1,999",
          p2Title: "Easy exchange",
          p2Text: "Within 7 days of delivery",
          p3Title: "Cash on delivery",
          p3Text: "Pay when it arrives",
          p4Title: "Trail tested",
          p4Text: "Every piece, every season",
        }),
        section("newsletter", "newsletter", {
          heading: "Sign up to our newsletter",
          text: "Get the latest drops, offers and stories first.",
          image: PHOTO("photo-1464822759023-fed622ff2c3b"),
        }),
      ],
      pages: {
        ...defaultPages(storeName),
        // About and Contact each get their own photo (not the opening one), so the two pages don't look alike
        about: { ...defaultPages(storeName).about, image: PHOTO("photo-1551632811-561732d1e306", 1800) },
        contact: { ...defaultPages(storeName).contact, image: PHOTO("photo-1454496522488-7a8e488e8606", 1800) },
      },
    };
  }

  if (toSiteTheme(theme) === "classic-bloom") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#111111",
        accent: "#111111",
        accentText: "#FFFFFF",
        panel: "#F4F2EE",
        textSize: "100",
        headingFont: "Playfair Display",
        displayFont: "Playfair Display",
        bodyFont: "Outfit",
        buttonShape: "rounded",
        uppercaseHeadings: "no",
        productPhotos: "fill",
      },
      header: { ...header, catalogLabel: "Shop" },
      footer,
      sections: [
        section("hero", "hero", {
          heading: `Style that\nmoves with you`,
          subheading: `New arrivals from ${storeName}, picked for every day.`,
          image: PHOTO("photo-1441986300917-64674bd600d8"),
          imageLayout: "full",
        }),
        section("circles", "category-circles"),
        section("trending", "product-row", { heading: "Trending now" }),
        section("banners", "banners"),
        section("story", "image-text", { heading: "Our story", imageSide: "right" }),
        section("tiles", "categories", { heading: "Collections" }),
        section("how", "steps", { heading: "Shopping with us" }),
        section("newsletter", "newsletter"),
      ],
      pages: defaultPages(storeName),
    };
  }

  // Mono Studio: black and white everyday basics. Fewer photo posters; categories, an index, sizes and a drop clock.
  if (toSiteTheme(theme) === "mono-studio") {
    return {
      announcement: "",
      settings: {
        background: "#FFFFFF",
        text: "#111111",
        accent: "#1A1A1A",
        accentText: "#FFFFFF",
        panel: "#ECECEC",
        textSize: "100",
        headingFont: "Unbounded",
        displayFont: "Unbounded",
        bodyFont: "Inter",
        buttonShape: "pill",
        uppercaseHeadings: "yes",
        productPhotos: "fill",
      },
      header,
      footer: { ...footer, about: `${storeName}. Heavyweight basics in black, white and grey, made to be worn every day.` },
      sections: [
        section("hero", "hero", {
          heading: storeName,
          subheading: "Heavyweight basics.\nMade to be worn every day.",
          buttonLabel: "Shop the essentials",
          buttonLink: "/catalog",
        }),
        section("marquee", "marquee", { text: "240 GSM cotton · Boxy fits · Free shipping over ₹1,999 · Made in Tiruppur · 7-day exchange", colour: "" }),
        section("categories", "categories", { heading: "Collections" }),
        section("bestsellers", "product-row", { heading: "Essentials", subheading: "", source: "bestsellers", display: "grid", buttonLabel: "Shop all", buttonLink: "/catalog" }),
        section("index", "spec-index", {
          heading: "The index",
          text: "Every piece we make, with what it's made of. Point at a row to see it.",
          source: "newest",
          count: "8",
          colNo: "No.",
          colName: "Piece",
          colDetail: "Made of",
          colType: "Type",
          colPrice: "Price",
          linkLabel: "Open the full catalog",
          linkUrl: "/catalog",
        }),
        section("statement", "statement", {
          heading: "Fewer,\nbetter basics.",
          text: "We make a small number of pieces and make them properly: heavy cotton, clean seams, colours that go with everything you already own.",
        }),
        section("sizes", "size-finder", {
          heading: "Find your *size*",
          text: "Our tees and hoodies are cut boxy. Pick a size to see it measured flat.",
          sizes: "S: 21 / 27 / 19\nM: 22 / 28 / 20\nL: 23 / 29 / 21\nXL: 24 / 30 / 22\n2XL: 25 / 31 / 23",
          measureNames: "Chest / Length / Shoulder",
          unitNote: "Inches, measured flat across the garment",
          buttonLabel: "Shop tees",
          buttonLink: "/category/t-shirts",
        }),
        section("newest", "product-row", { heading: "New in", subheading: "", source: "newest", display: "slider", buttonLabel: "" }),
        section("reviews", "reviews", { heading: "Worn daily", subheading: "" }),
        section("drop", "drop-clock", {
          label: "Drop 07",
          heading: "Next drop\nlands Friday",
          text: "New colours and one new cut, in small runs. When they're gone, they're gone.",
          endsAt: "",
          buttonLabel: "See what's coming",
          buttonLink: "/catalog",
          daysLabel: "Days",
          hoursLabel: "Hours",
          minutesLabel: "Min",
          secondsLabel: "Sec",
        }),
        section("newsletter", "newsletter", { heading: "Join the list", text: "Drop dates and restocks, before anyone else." }),
      ],
      pages: {
        ...defaultPages(storeName),
        // About shows the rack of tees, Contact the shop floor, so the two pages don't look alike
        about: { ...defaultPages(storeName).about, image: PHOTO("photo-1489987707025-afc232f7ea0f", 1800) },
        contact: { ...defaultPages(storeName).contact, image: PHOTO("photo-1441984904996-e0b6ba687e04", 1800) },
      },
    };
  }

  return {
    announcement: "",
    settings: {
      background: "#FFFFFF",
      text: "#111111",
      accent: "#1A1A1A",
      accentText: "#FFFFFF",
      panel: "#ECECEC",
      textSize: "100",
      headingFont: "Unbounded",
      displayFont: "Unbounded",
      bodyFont: "Inter",
      buttonShape: "pill",
      uppercaseHeadings: "yes",
      productPhotos: "fill",
    },
    header,
    footer,
    sections: [
      section("hero", "hero"),
      section("collection", "collection-split"),
      section("bestsellers", "product-row"),
      section("banners", "banners"),
      section("categories", "categories"),
      section("story", "image-text"),
      section("marquee", "marquee"),
      section("newest", "product-row", { heading: "New in", source: "newest" }),
      section("newsletter", "newsletter"),
    ],
    pages: defaultPages(storeName),
  };
}

export const SITE_PAGE_IDS: SitePageId[] = ["about", "contact", "shipping", "returns", "privacy", "terms"];
export const SITE_COLOR_KEYS: (keyof SiteColors)[] = ["background", "text", "accent", "accentText", "panel"];

// --- Settings only one theme has ------------------------------------------------------------------
// Things a theme draws that no other theme does (its own card colours, sticker words, button text).
// The editor shows them only for that theme, grouped under their `group` name.

export interface ThemeOptionField {
  key: string;
  label: string;
  kind: "text" | "color" | "select";
  /** the editor row this field is listed under, e.g. "Product cards" */
  group: string;
  default: string;
  help?: string;
  /** longest text allowed (text fields) */
  max?: number;
  /** the choices (select fields) */
  options?: { value: string; label: string; help?: string }[];
  /** the shop page the editor previews while this setting is open, e.g. "/pages/about" */
  page?: string;
}

export const THEME_OPTIONS: Partial<Record<SiteThemeSlug, ThemeOptionField[]>> = {
  theme21: [
    {
      group: "Scroll effects",
      key: "motion",
      label: "How sections appear as buyers scroll",
      kind: "select",
      default: "shimmer",
      options: [
        { value: "shimmer", label: "Shimmer", help: "Like opening a jewellery box: headings unfold letter by letter, round photos turn in like gems, a soft gold light passes over product photos and pictures rise from below." },
        { value: "calm", label: "Calm", help: "Sections simply fade and rise into place." },
      ],
    },
    { group: "Gold", key: "goldColour", label: "Gold colour", kind: "color", default: "#B08D57", help: "Words between stars in headings, the lines and diamonds on About and Contact, and the review stars." },
    { group: "Product cards", key: "cardHeart", label: "Wishlist heart on the photo", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "cardSaleBadge", label: "Sale badge", kind: "text", default: "−{n}%", max: 20, help: "{n} becomes the discount, e.g. −20%." },
    { group: "Product cards", key: "cardSoldOut", label: "Sold out badge", kind: "text", default: "Sold out", max: 20 },
    { group: "Product cards", key: "cardBadgeBackground", label: "Badge colour", kind: "color", default: "#FFFFFF" },
    { group: "Product cards", key: "cardBadgeText", label: "Badge text colour", kind: "color", default: "#121212" },
    { group: "About page", page: "/pages/about", key: "aboutEyebrow", label: "Small text above the title", kind: "text", default: "The house", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutMaterialsHeading", label: "Materials heading", kind: "text", default: "What it's made of", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutMat1Title", label: "Material 1", kind: "text", default: "18k gold plating", max: 40, help: "Shown beside a gold swatch. Leave empty to hide." },
    { group: "About page", page: "/pages/about", key: "aboutMat1Text", label: "Material 1: text", kind: "text", default: "A thick layer of real gold that keeps its warm shine.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutMat2Title", label: "Material 2", kind: "text", default: "925 sterling silver", max: 40, help: "Shown beside a silver swatch." },
    { group: "About page", page: "/pages/about", key: "aboutMat2Text", label: "Material 2: text", kind: "text", default: "A solid base that is gentle on sensitive skin.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutMat3Title", label: "Material 3", kind: "text", default: "Freshwater pearls", max: 40, help: "Shown beside a pearl swatch." },
    { group: "About page", page: "/pages/about", key: "aboutMat3Text", label: "Material 3: text", kind: "text", default: "Each one slightly different, picked by hand.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutStat1Value", label: "Number 1", kind: "text", default: "2019", max: 12, help: "Three numbers between gold diamonds. Leave a number empty to hide it." },
    { group: "About page", page: "/pages/about", key: "aboutStat1Label", label: "Number 1: what it means", kind: "text", default: "Our first piece", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Value", label: "Number 2", kind: "text", default: "40k+", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Label", label: "Number 2: what it means", kind: "text", default: "Pieces worn every day", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Value", label: "Number 3", kind: "text", default: "1 year", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Label", label: "Number 3: what it means", kind: "text", default: "Warranty on every piece", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutValuesHeading", label: "Promises heading", kind: "text", default: "Our promises", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Title", label: "Promise 1: title", kind: "text", default: "Made to be worn", max: 40, help: "Each promise hangs on a tag." },
    { group: "About page", page: "/pages/about", key: "aboutValue1Text", label: "Promise 1: text", kind: "text", default: "Shower, gym or sleep: our pieces are made for every day.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Title", label: "Promise 2: title", kind: "text", default: "Kind to skin", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Text", label: "Promise 2: text", kind: "text", default: "Nickel free and hypoallergenic, even for sensitive ears.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Title", label: "Promise 3: title", kind: "text", default: "Cared for", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Text", label: "Promise 3: text", kind: "text", default: "A year's warranty and a free polish whenever you visit.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutCtaHeading", label: "Closing heading", kind: "text", default: "Find a piece to keep", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutCtaButton", label: "Closing button", kind: "text", default: "Shop the collection", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactEyebrow", label: "Small text above the title", kind: "text", default: "Visit or write", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactWaysHeading", label: "Heading above the contact cards", kind: "text", default: "Write to us", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactNoteTitle", label: "Note card heading", kind: "text", default: "Write us a note", max: 50 },
    { group: "Contact page", page: "/pages/contact", key: "contactTopics", label: "Topics to pick from", kind: "text", default: "A gift / An order / Sizing / Something else", max: 100, help: "Separate with /." },
    { group: "Contact page", page: "/pages/contact", key: "contactNoteButton", label: "Note card button", kind: "text", default: "Send note", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactNoteThanks", label: "Words after sending", kind: "text", default: "Thank you. Your note is ready to send, and we'll reply soon.", max: 120 },
    { group: "Contact page", page: "/pages/contact", key: "contactVisitTitle", label: "Visit heading", kind: "text", default: "Visit the store", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactHours", label: "Opening hours", kind: "text", default: "Every day, 11 am to 8 pm", max: 80 },
  ],
  theme05: [
    {
      group: "Scroll effects",
      key: "motion",
      label: "How sections appear as buyers scroll",
      kind: "select",
      default: "editorial",
      options: [
        { value: "editorial", label: "Editorial", help: "Like turning the pages of a magazine: headlines rise line by line out of a mask, photos open like a page turning, cards slide in one after another." },
        { value: "calm", label: "Calm", help: "Sections simply fade and rise into place." },
      ],
    },
    { group: "Highlights", key: "markColour", label: "Highlight colour", kind: "color", default: "#D4F56A", help: "The marker stroke behind words written between stars in headings, like *colour*." },
    { group: "Product cards", key: "dBadgeBg", label: "Badge colour", kind: "color", default: "#FFFFFF", help: "The small badge on the photo." },
    { group: "Product cards", key: "dBadgeText", label: "Badge text colour", kind: "color", default: "#141414" },
    { group: "Product cards", key: "dSale", label: "Badge on sale products", kind: "text", default: "{n}% off", max: 20, help: "{n} becomes the discount." },
    { group: "Product cards", key: "dBest", label: "Badge on top sellers", kind: "text", default: "Bestseller", max: 20 },
    { group: "Product cards", key: "dNew", label: "Badge on new products", kind: "text", default: "New", max: 20 },
    { group: "Product cards", key: "dSoldOut", label: "Badge on sold out products", kind: "text", default: "Sold out", max: 20 },
    { group: "Product cards", key: "dDesc", label: "First line of the description", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "dDots", label: "Colour dots", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "About page", page: "/pages/about", key: "aboutEyebrow", label: "Small text above the title", kind: "text", default: "Our story", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStoryLabel", label: "Label beside the story", kind: "text", default: "How it started", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStat1Value", label: "Number 1", kind: "text", default: "2018", max: 12, help: "Printed on a shoe-box size label. Leave a number empty to hide it." },
    { group: "About page", page: "/pages/about", key: "aboutStat1Label", label: "Number 1: what it means", kind: "text", default: "Our first pair", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Value", label: "Number 2", kind: "text", default: "60k", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Label", label: "Number 2: what it means", kind: "text", default: "Pairs on happy feet", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Value", label: "Number 3", kind: "text", default: "7 days", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Label", label: "Number 3: what it means", kind: "text", default: "To swap your size", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutValuesHeading", label: "Values heading", kind: "text", default: "What every pair promises", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Title", label: "Value 1: title", kind: "text", default: "All-day comfort", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Text", label: "Value 1: text", kind: "text", default: "Cushioned soles tested on real streets, not just in a lab.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Title", label: "Value 2: title", kind: "text", default: "The right fit", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Text", label: "Value 2: text", kind: "text", default: "A size guide on every pair, and free size swaps if you need them.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Title", label: "Value 3: title", kind: "text", default: "Made to last", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Text", label: "Value 3: text", kind: "text", default: "Stitched uppers and tough outsoles that keep their shape.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutCtaHeading", label: "Closing heading", kind: "text", default: "Find the pair you'll live in", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutCtaButton", label: "Closing button", kind: "text", default: "Shop all pairs", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactEyebrow", label: "Small text above the title", kind: "text", default: "Say hello", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactCardTitle", label: "Heading above the contact tiles", kind: "text", default: "Find us here", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormTitle", label: "Form heading", kind: "text", default: "Need help with a size or an order?", max: 50 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormButton", label: "Form button", kind: "text", default: "Send message", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactHoursTitle", label: "Hours heading", kind: "text", default: "Opening hours", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactHours", label: "Opening hours", kind: "text", default: "Every day, 10 am to 9 pm", max: 80 },
    { group: "Contact page", page: "/pages/contact", key: "contactReplyTitle", label: "Reply heading", kind: "text", default: "Reply time", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactReply", label: "How fast you reply", kind: "text", default: "Within a few hours", max: 80 },
  ],
  theme06: [
    {
      group: "Scroll effects",
      key: "motion",
      label: "How sections appear as buyers scroll",
      kind: "select",
      default: "glide",
      options: [
        { value: "glide", label: "Glide", help: "Soft and premium: cards open from their price corner, tiles tip up in 3D, promos settle in from a slight zoom, the photo row fans out." },
        { value: "calm", label: "Calm", help: "Sections simply fade and rise into place." },
      ],
    },
    { group: "Product cards", key: "notchBadge", label: "Badge colour", kind: "color", default: "#F26B3A", help: "The small badge on the photo: New, a discount or Sold out." },
    { group: "Product cards", key: "notchBadgeText", label: "Badge text colour", kind: "color", default: "#FFFFFF" },
    { group: "Product cards", key: "notchNew", label: "Badge on new products", kind: "text", default: "New", max: 20, help: "Shown on products added in the last 30 days." },
    { group: "Product cards", key: "notchSale", label: "Badge on sale products", kind: "text", default: "{n}% off", max: 20, help: "{n} becomes the discount." },
    { group: "Product cards", key: "notchSoldOut", label: "Badge on sold out products", kind: "text", default: "Sold out", max: 20 },
    { group: "Product cards", key: "notchAdd", label: "Add button text", kind: "text", default: "Add to bag", max: 24 },
    { group: "Product cards", key: "notchChoose", label: "Add button text when a size must be picked", kind: "text", default: "Choose size", max: 24 },
    { group: "Product cards", key: "notchHeart", label: "Wishlist heart", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Benefit cards", key: "bento1Bg", label: "Card 1 colour", kind: "color", default: "#6D3FE0", help: "The three coloured cards in the benefit grid." },
    { group: "Benefit cards", key: "bento1Text", label: "Card 1 text colour", kind: "color", default: "#FFFFFF" },
    { group: "Benefit cards", key: "bento2Bg", label: "Card 2 colour", kind: "color", default: "#EDE7FD" },
    { group: "Benefit cards", key: "bento2Text", label: "Card 2 text colour", kind: "color", default: "#2B1A5C" },
    { group: "Benefit cards", key: "bento3Bg", label: "Card 3 colour", kind: "color", default: "#1F1A2E" },
    { group: "Benefit cards", key: "bento3Text", label: "Card 3 text colour", kind: "color", default: "#FFFFFF" },
    { group: "Product stage", key: "stageColour", label: "Heading and big word colour", kind: "color", default: "#6D3FE0", help: "The section with one product photo between a heading and a big word." },
    { group: "About page", page: "/pages/about", key: "aboutEyebrow", label: "Small text above the title", kind: "text", default: "Our story", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStoryLabel", label: "Label beside the story", kind: "text", default: "Why we started", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStat1Value", label: "Number 1", kind: "text", default: "2021", max: 12, help: "Three big numbers on a soft band. Leave a number empty to hide it." },
    { group: "About page", page: "/pages/about", key: "aboutStat1Label", label: "Number 1: what it means", kind: "text", default: "The year we started", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Value", label: "Number 2", kind: "text", default: "12k+", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Label", label: "Number 2: what it means", kind: "text", default: "Gadgets delivered", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Value", label: "Number 3", kind: "text", default: "4.8★", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Label", label: "Number 3: what it means", kind: "text", default: "Average rating", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutValuesHeading", label: "Values heading", kind: "text", default: "What we promise", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Title", label: "Value 1: title", kind: "text", default: "Genuine only", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Text", label: "Value 1: text", kind: "text", default: "Every product arrives sealed, with its brand warranty.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Title", label: "Value 2: title", kind: "text", default: "Set up in minutes", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Text", label: "Value 2: text", kind: "text", default: "Clear guides, and help on WhatsApp if you get stuck.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Title", label: "Value 3: title", kind: "text", default: "Fair prices", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Text", label: "Value 3: text", kind: "text", default: "We check prices every week so you don't have to.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutCtaHeading", label: "Closing heading", kind: "text", default: "Find your next favourite gadget", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutCtaButton", label: "Closing button", kind: "text", default: "Shop all tech", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactEyebrow", label: "Small text above the title", kind: "text", default: "We're here to help", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactCardTitle", label: "Heading on the coloured card", kind: "text", default: "Talk to us", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormTitle", label: "Form heading", kind: "text", default: "Ask us anything", max: 50 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormButton", label: "Form button", kind: "text", default: "Send message", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactHoursTitle", label: "Hours heading", kind: "text", default: "Opening hours", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactHours", label: "Opening hours", kind: "text", default: "Mon to Sat, 10 am to 8 pm", max: 80 },
    { group: "Contact page", page: "/pages/contact", key: "contactReplyTitle", label: "Reply heading", kind: "text", default: "Reply time", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactReply", label: "How fast you reply", kind: "text", default: "Within an hour on WhatsApp", max: 80 },
  ],
  theme03: [
    {
      group: "Scroll effects",
      key: "motion",
      label: "How sections appear as buyers scroll",
      kind: "select",
      default: "sporty",
      options: [
        { value: "sporty", label: "Sporty", help: "Fast, sharp moves: headings speed in on a slant, photos zoom out of a blur, cards race in from the side, panels slide open like doors." },
        { value: "calm", label: "Calm", help: "Sections simply fade and rise into place." },
      ],
    },
    { group: "Product cards", key: "cardHeart", label: "Wishlist heart on the photo", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "cardQuickAdd", label: "Quick add button beside the price", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "cardSaleBadge", label: "Sale badge", kind: "text", default: "−{n}%", max: 20, help: "{n} becomes the discount, e.g. −20%. Leave as is to keep the short form." },
    { group: "Product cards", key: "cardSoldOut", label: "Sold out badge", kind: "text", default: "Sold out", max: 20 },
    { group: "Product cards", key: "cardBadgeBackground", label: "Badge colour", kind: "color", default: "#FFFFFF" },
    { group: "Product cards", key: "cardBadgeText", label: "Badge text colour", kind: "color", default: "#737373" },
    { group: "About page", page: "/pages/about", key: "aboutEyebrow", label: "Small text above the title", kind: "text", default: "Our story", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStoryLabel", label: "Label beside the story", kind: "text", default: "How it started", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStat1Value", label: "Number 1", kind: "text", default: "2019", max: 12, help: "Three big numbers on a black band. Leave a number empty to hide it." },
    { group: "About page", page: "/pages/about", key: "aboutStat1Label", label: "Number 1: what it means", kind: "text", default: "The year we started", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Value", label: "Number 2", kind: "text", default: "500+", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Label", label: "Number 2: what it means", kind: "text", default: "Trails our gear is tested on", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Value", label: "Number 3", kind: "text", default: "40k", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Label", label: "Number 3: what it means", kind: "text", default: "Happy customers across India", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutValuesHeading", label: "Values heading", kind: "text", default: "What we stand for", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Title", label: "Value 1: title", kind: "text", default: "Made to move", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Text", label: "Value 1: text", kind: "text", default: "Cuts and fabrics that stretch, breathe and keep up with you.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Title", label: "Value 2: title", kind: "text", default: "Honest materials", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Text", label: "Value 2: text", kind: "text", default: "We tell you what every piece is made of, and why.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Title", label: "Value 3: title", kind: "text", default: "Built to last", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Text", label: "Value 3: text", kind: "text", default: "Fewer, better pieces that stay with you season after season.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutCtaHeading", label: "Closing heading", kind: "text", default: "Ready for your next trip?", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutCtaButton", label: "Closing button", kind: "text", default: "Shop the collection", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactEyebrow", label: "Small text above the title", kind: "text", default: "Get in touch", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactCardTitle", label: "Heading on the black card", kind: "text", default: "Reach us", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormTitle", label: "Form heading", kind: "text", default: "Send us a message", max: 50 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormButton", label: "Form button", kind: "text", default: "Send message", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactHoursTitle", label: "Hours heading", kind: "text", default: "Opening hours", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactHours", label: "Opening hours", kind: "text", default: "Mon to Sat, 10 am to 7 pm", max: 80 },
    { group: "Contact page", page: "/pages/contact", key: "contactReplyTitle", label: "Reply heading", kind: "text", default: "Reply time", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactReply", label: "How fast you reply", kind: "text", default: "Usually within a few hours", max: 80 },
  ],
  "mono-studio": [
    {
      group: "Scroll effects",
      key: "motion",
      label: "How sections appear as buyers scroll",
      kind: "select",
      default: "shutter",
      options: [
        { value: "shutter", label: "Shutter", help: "Sharp and graphic: photos open like a camera shutter, headings rise out of a line, product photos turn from grey to colour, index rows are ruled in, the clock's digits flip." },
        { value: "calm", label: "Calm", help: "Sections simply fade and rise into place." },
      ],
    },
    { group: "Product cards", key: "cardHeart", label: "Wishlist heart on the photo", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "cardSaleBadge", label: "Sale badge", kind: "text", default: "−{n}%", max: 20, help: "{n} becomes the discount, e.g. −20%." },
    { group: "Product cards", key: "cardSoldOut", label: "Sold out badge", kind: "text", default: "Sold out", max: 20 },
    { group: "Phone menu", key: "menuEyebrow", label: "Small text above the categories", kind: "text", default: "Shop", max: 30 },
    { group: "Phone menu", key: "menuNote", label: "Note at the bottom", kind: "text", default: "Free shipping over ₹1,999 · 7-day exchange", max: 80 },
    { group: "About page", page: "/pages/about", key: "aboutEyebrow", label: "Small text above the title", kind: "text", default: "About the studio", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutPointsHeading", label: "Manifesto heading", kind: "text", default: "What we believe", max: 50, help: "Up to four numbered points. Leave a title empty to hide a point." },
    { group: "About page", page: "/pages/about", key: "aboutPoint1Title", label: "Point 1: title", kind: "text", default: "Fewer pieces", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutPoint1Text", label: "Point 1: text", kind: "text", default: "We'd rather make ten things well than a hundred things quickly.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutPoint2Title", label: "Point 2: title", kind: "text", default: "Heavier cotton", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutPoint2Text", label: "Point 2: text", kind: "text", default: "240 GSM for tees, 380 for hoodies. They hold their shape wash after wash.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutPoint3Title", label: "Point 3: title", kind: "text", default: "No loud logos", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutPoint3Text", label: "Point 3: text", kind: "text", default: "Black, white, grey and olive. Clothes that go with everything.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutPoint4Title", label: "Point 4: title", kind: "text", default: "Made close to home", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutPoint4Text", label: "Point 4: text", kind: "text", default: "Cut and sewn in Tiruppur by a team we know by name.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutTag1Label", label: "Tag line 1", kind: "text", default: "Fabric", max: 20, help: "A garment tag on a black band. Leave a value empty to hide a line." },
    { group: "About page", page: "/pages/about", key: "aboutTag1Value", label: "Tag line 1: detail", kind: "text", default: "100% cotton", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutTag2Label", label: "Tag line 2", kind: "text", default: "Weight", max: 20 },
    { group: "About page", page: "/pages/about", key: "aboutTag2Value", label: "Tag line 2: detail", kind: "text", default: "240 GSM", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutTag3Label", label: "Tag line 3", kind: "text", default: "Fit", max: 20 },
    { group: "About page", page: "/pages/about", key: "aboutTag3Value", label: "Tag line 3: detail", kind: "text", default: "Boxy, dropped shoulder", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutTag4Label", label: "Tag line 4", kind: "text", default: "Made in", max: 20 },
    { group: "About page", page: "/pages/about", key: "aboutTag4Value", label: "Tag line 4: detail", kind: "text", default: "Tiruppur, India", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutTag5Label", label: "Tag line 5", kind: "text", default: "Wash", max: 20 },
    { group: "About page", page: "/pages/about", key: "aboutTag5Value", label: "Tag line 5: detail", kind: "text", default: "Cold, inside out", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutCtaHeading", label: "Closing link", kind: "text", default: "Shop the essentials", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactEyebrow", label: "Small text above the title", kind: "text", default: "Get in touch", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactCardTitle", label: "Heading on the black card", kind: "text", default: "Talk to us", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormTitle", label: "Form heading", kind: "text", default: "Send a message", max: 50 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormButton", label: "Form button", kind: "text", default: "Send", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactHoursTitle", label: "Hours heading", kind: "text", default: "Studio hours", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactHours", label: "Opening hours", kind: "text", default: "Mon to Sat, 11 am to 7 pm", max: 80 },
    { group: "Contact page", page: "/pages/contact", key: "contactReplyTitle", label: "Reply heading", kind: "text", default: "Reply time", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactReply", label: "How fast you reply", kind: "text", default: "Same day on WhatsApp", max: 80 },
  ],
  f02: [
    {
      group: "Scroll effects",
      key: "motion",
      label: "How sections appear as buyers scroll",
      kind: "select",
      default: "grain",
      options: [
        { value: "grain", label: "Along the grain", help: "Calm and crafted: headings are planed in from the left, photos slide open like drawers, cards are set down gently, wood planks grow up from the floor, chairs pull up to the table." },
        { value: "calm", label: "Calm", help: "Sections simply fade and rise into place." },
      ],
    },
    { group: "Product cards", key: "cardHeart", label: "Wishlist heart on the photo", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "cardQuickAdd", label: "Bag button on the photo", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "cardSaleBadge", label: "Sale badge", kind: "text", default: "−{n}%", max: 20, help: "{n} becomes the discount, e.g. −15%." },
    { group: "Product cards", key: "cardSoldOut", label: "Sold out badge", kind: "text", default: "Sold out", max: 20 },
    { group: "Product cards", key: "cardBadgeBackground", label: "Badge colour", kind: "color", default: "#F1EDE4" },
    { group: "Product cards", key: "cardBadgeText", label: "Badge text colour", kind: "color", default: "#2B2620" },
    { group: "Phone menu", key: "menuEyebrow", label: "Small text above the categories", kind: "text", default: "Browse the workshop", max: 40 },
    { group: "Phone menu", key: "menuHelp", label: "Words on the WhatsApp bar at the bottom", kind: "text", default: "Not sure what fits? Ask us", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutEyebrow", label: "Small text above the title", kind: "text", default: "The workshop", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutSpecHeading", label: "Spec sheet heading", kind: "text", default: "How we build", max: 40, help: "A short spec sheet beside your story. Leave a line's value empty to hide it." },
    { group: "About page", page: "/pages/about", key: "aboutSpec1Label", label: "Spec 1", kind: "text", default: "Wood", max: 30 },
    { group: "About page", page: "/pages/about", key: "aboutSpec1Value", label: "Spec 1: detail", kind: "text", default: "Solid oak, walnut and ash", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutSpec2Label", label: "Spec 2", kind: "text", default: "Joinery", max: 30 },
    { group: "About page", page: "/pages/about", key: "aboutSpec2Value", label: "Spec 2: detail", kind: "text", default: "Mortise and tenon, no metal brackets", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutSpec3Label", label: "Spec 3", kind: "text", default: "Finish", max: 30 },
    { group: "About page", page: "/pages/about", key: "aboutSpec3Value", label: "Spec 3: detail", kind: "text", default: "Hand-rubbed natural oil", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutSpec4Label", label: "Spec 4", kind: "text", default: "Made in", max: 30 },
    { group: "About page", page: "/pages/about", key: "aboutSpec4Value", label: "Spec 4: detail", kind: "text", default: "Our workshop in Jodhpur", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutSpec5Label", label: "Spec 5", kind: "text", default: "Warranty", max: 30 },
    { group: "About page", page: "/pages/about", key: "aboutSpec5Value", label: "Spec 5: detail", kind: "text", default: "5 years on every frame", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutStepsHeading", label: "Making heading", kind: "text", default: "The making of a table", max: 50, help: "Up to four steps along a ruler. Leave a title empty to hide a step." },
    { group: "About page", page: "/pages/about", key: "aboutStep1Mark", label: "Step 1: when", kind: "text", default: "Week 1", max: 20 },
    { group: "About page", page: "/pages/about", key: "aboutStep1Title", label: "Step 1: title", kind: "text", default: "Choosing the boards", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStep1Text", label: "Step 1: text", kind: "text", default: "We match the grain so the top reads as one piece.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutStep2Mark", label: "Step 2: when", kind: "text", default: "Week 2", max: 20 },
    { group: "About page", page: "/pages/about", key: "aboutStep2Title", label: "Step 2: title", kind: "text", default: "Cutting the joints", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStep2Text", label: "Step 2: text", kind: "text", default: "Every mortise is cut and fitted by hand.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutStep3Mark", label: "Step 3: when", kind: "text", default: "Week 3", max: 20 },
    { group: "About page", page: "/pages/about", key: "aboutStep3Title", label: "Step 3: title", kind: "text", default: "Oiling, three coats", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStep3Text", label: "Step 3: text", kind: "text", default: "Rubbed in by hand, a day apart.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutStep4Mark", label: "Step 4: when", kind: "text", default: "Week 4", max: 20 },
    { group: "About page", page: "/pages/about", key: "aboutStep4Title", label: "Step 4: title", kind: "text", default: "Delivered and set up", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStep4Text", label: "Step 4: text", kind: "text", default: "Our team carries it in and places it for you.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutStat1Value", label: "Number 1", kind: "text", default: "2,400+", max: 12, help: "Three numbers between thin rules. Leave a number empty to hide it." },
    { group: "About page", page: "/pages/about", key: "aboutStat1Label", label: "Number 1: what it means", kind: "text", default: "Tables delivered", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Value", label: "Number 2", kind: "text", default: "12", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Label", label: "Number 2: what it means", kind: "text", default: "Makers in the workshop", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Value", label: "Number 3", kind: "text", default: "5 yrs", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Label", label: "Number 3: what it means", kind: "text", default: "Warranty on every frame", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutCtaHeading", label: "Closing heading", kind: "text", default: "Find the table you'll gather around", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutCtaButton", label: "Closing button", kind: "text", default: "Open the catalog", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactEyebrow", label: "Small text above the title", kind: "text", default: "Visit or write", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactCardTitle", label: "Heading on the olive card", kind: "text", default: "Talk to the workshop", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormTitle", label: "Form heading", kind: "text", default: "Tell us about your room", max: 50 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormButton", label: "Form button", kind: "text", default: "Send", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactHoursTitle", label: "Hours heading", kind: "text", default: "Showroom hours", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactHours", label: "Opening hours", kind: "text", default: "Tue to Sun, 11 am to 7 pm", max: 80 },
    { group: "Contact page", page: "/pages/contact", key: "contactReplyTitle", label: "Reply heading", kind: "text", default: "Reply time", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactReply", label: "How fast you reply", kind: "text", default: "Within a day, with photos if you ask", max: 80 },
  ],
  theme07: [
    {
      group: "Scroll effects",
      key: "motion",
      label: "How sections appear as buyers scroll",
      kind: "select",
      default: "wheel",
      options: [
        { value: "wheel", label: "Potter's wheel", help: "Handmade and unhurried: photos are glazed in from the top, cards turn up as if on the wheel, round photos spin into place, numbers settle like stacked plates." },
        { value: "calm", label: "Calm", help: "Sections simply fade and rise into place." },
      ],
    },
    { group: "Product cards", key: "cardHeart", label: "Wishlist heart on the photo", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "cardQuickAdd", label: "Bag button beside the name", kind: "select", default: "show", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
    { group: "Product cards", key: "cardSaleBadge", label: "Sale badge", kind: "text", default: "−{n}%", max: 20, help: "{n} becomes the discount, e.g. −20%." },
    { group: "Product cards", key: "cardSoldOut", label: "Sold out badge", kind: "text", default: "Sold out", max: 20 },
    { group: "Product cards", key: "cardBadgeBackground", label: "Badge colour", kind: "color", default: "#FFFFFF" },
    { group: "Product cards", key: "cardBadgeText", label: "Badge text colour", kind: "color", default: "#2A1D18" },
    { group: "Phone menu", key: "menuEyebrow", label: "Small text above the categories", kind: "text", default: "Shop the studio", max: 40 },
    { group: "Phone menu", key: "menuNote", label: "Note at the bottom", kind: "text", default: "Thrown, glazed and fired by hand in small batches.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutEyebrow", label: "Small text above the title", kind: "text", default: "Our studio", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStamp", label: "Words around the turning maker's mark", kind: "text", default: "Handmade · small batch · since 2016 ·", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutStoryLabel", label: "Label beside the story", kind: "text", default: "How it started", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutYear1Value", label: "Year 1", kind: "text", default: "2016", max: 12, help: "Up to four years on a line, each with a glaze dot. Leave a year empty to hide it." },
    { group: "About page", page: "/pages/about", key: "aboutYear1Title", label: "Year 1: what happened", kind: "text", default: "A wheel in a garage", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutYear1Text", label: "Year 1: a line about it", kind: "text", default: "One second-hand wheel and a lot of wobbly bowls.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutYear2Value", label: "Year 2", kind: "text", default: "2018", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutYear2Title", label: "Year 2: what happened", kind: "text", default: "Our first kiln", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutYear2Text", label: "Year 2: a line about it", kind: "text", default: "Fired our first full batch of mugs, and sold out in a week.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutYear3Value", label: "Year 3", kind: "text", default: "2021", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutYear3Title", label: "Year 3: what happened", kind: "text", default: "A real studio", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutYear3Text", label: "Year 3: a line about it", kind: "text", default: "Moved into a sunny studio with room for four wheels.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutYear4Value", label: "Year 4", kind: "text", default: "Today", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutYear4Title", label: "Year 4: what happened", kind: "text", default: "38 glazes and counting", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutYear4Text", label: "Year 4: a line about it", kind: "text", default: "Still mixed by hand, still fired twice.", max: 120 },
    { group: "About page", page: "/pages/about", key: "aboutStat1Value", label: "Number 1", kind: "text", default: "12,000+", max: 12, help: "Three big numbers side by side. Leave a number empty to hide it." },
    { group: "About page", page: "/pages/about", key: "aboutStat1Label", label: "Number 1: what it means", kind: "text", default: "Pieces thrown by hand", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Value", label: "Number 2", kind: "text", default: "4", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat2Label", label: "Number 2: what it means", kind: "text", default: "Potters at the wheel", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Value", label: "Number 3", kind: "text", default: "38", max: 12 },
    { group: "About page", page: "/pages/about", key: "aboutStat3Label", label: "Number 3: what it means", kind: "text", default: "Glazes mixed in the studio", max: 50 },
    { group: "About page", page: "/pages/about", key: "aboutValuesHeading", label: "Values heading", kind: "text", default: "How we make", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Title", label: "Value 1: title", kind: "text", default: "Slow by choice", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue1Text", label: "Value 1: text", kind: "text", default: "Each piece takes about three weeks, from the wheel to the second firing.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Title", label: "Value 2: title", kind: "text", default: "Safe to use", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue2Text", label: "Value 2: text", kind: "text", default: "Lead-free, food-safe glazes, tested batch by batch.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Title", label: "Value 3: title", kind: "text", default: "Made to be used", max: 40 },
    { group: "About page", page: "/pages/about", key: "aboutValue3Text", label: "Value 3: text", kind: "text", default: "Not for the shelf: for coffee, dal, flowers and long dinners.", max: 140 },
    { group: "About page", page: "/pages/about", key: "aboutCtaHeading", label: "Closing heading", kind: "text", default: "Bring a piece home", max: 60 },
    { group: "About page", page: "/pages/about", key: "aboutCtaButton", label: "Closing button", kind: "text", default: "Shop the catalog", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactEyebrow", label: "Small text above the title", kind: "text", default: "Say hello", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactCardTitle", label: "Heading on the red card", kind: "text", default: "Visit the studio", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormTitle", label: "Form heading", kind: "text", default: "Write to us", max: 50 },
    { group: "Contact page", page: "/pages/contact", key: "contactFormButton", label: "Form button", kind: "text", default: "Send message", max: 30 },
    { group: "Contact page", page: "/pages/contact", key: "contactHoursTitle", label: "Hours heading", kind: "text", default: "Studio hours", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactHours", label: "Opening hours", kind: "text", default: "Thu to Sun, 11 am to 6 pm", max: 80 },
    { group: "Contact page", page: "/pages/contact", key: "contactReplyTitle", label: "Reply heading", kind: "text", default: "Reply time", max: 40 },
    { group: "Contact page", page: "/pages/contact", key: "contactReply", label: "How fast you reply", kind: "text", default: "Within a day, between firings", max: 80 },
  ],
  theme15: [
    {
      group: "Scroll effects",
      key: "motion",
      label: "How sections appear as buyers scroll",
      kind: "select",
      default: "bold",
      options: [
        { value: "bold", label: "Bold", help: "Each section makes its own entrance: lines slide in, the claims ribbon swings in, cards drop in like cans, reviews glide in, photos wipe open." },
        { value: "calm", label: "Calm", help: "Sections simply fade and rise into place." },
      ],
    },
    { group: "Product cards", key: "cardBackground", label: "Card background", kind: "color", default: "#FFFDF8" },
    { group: "Product cards", key: "flavour1", label: "Card colour 1", kind: "color", default: "#1E88C8", help: "Each product gets one of these six colours for its border, name and buttons." },
    { group: "Product cards", key: "flavour2", label: "Card colour 2", kind: "color", default: "#13995A" },
    { group: "Product cards", key: "flavour3", label: "Card colour 3", kind: "color", default: "#F06A1D" },
    { group: "Product cards", key: "flavour4", label: "Card colour 4", kind: "color", default: "#E2526B" },
    { group: "Product cards", key: "flavour5", label: "Card colour 5", kind: "color", default: "#7B4BC4" },
    { group: "Product cards", key: "flavour6", label: "Card colour 6", kind: "color", default: "#C99A0E" },
    { group: "Product cards", key: "addLabel", label: "Add button text", kind: "text", default: "Add to cart", max: 24 },
    { group: "Product cards", key: "chooseLabel", label: "Add button text when sizes or options must be picked", kind: "text", default: "Choose options", max: 24 },
    { group: "Product cards", key: "viewLabel", label: "Second button text", kind: "text", default: "Shop now", max: 24 },
    { group: "Card stickers", key: "stickerColour", label: "Sticker colour", kind: "color", default: "#FFE14D", help: "The band across the top of every product card." },
    { group: "Card stickers", key: "stickerText", label: "Sticker text colour", kind: "color", default: "#2A2320" },
    { group: "Card stickers", key: "stickerSale", label: "On sale", kind: "text", default: "{n}% off!", max: 30, help: "{n} becomes the discount, e.g. 20% off!" },
    { group: "Card stickers", key: "stickerBest", label: "Top 3 sellers", kind: "text", default: "Best seller!", max: 30 },
    { group: "Card stickers", key: "stickerNew", label: "Added in the last 30 days", kind: "text", default: "New flavour!", max: 30 },
    { group: "Card stickers", key: "stickerDefault", label: "Every other product", kind: "text", default: "Fan favourite!", max: 30 },
    { group: "Card stickers", key: "stickerSoldOut", label: "Sold out", kind: "text", default: "Sold out", max: 30 },
  ],
};

/** The settings only this theme has (uploaded themes use their base theme's). */
export function themeOptionFields(theme: string): ThemeOptionField[] {
  return THEME_OPTIONS[toSiteTheme(theme)] || [];
}

export function themeOptionDefaults(theme: string): Record<string, string> {
  return Object.fromEntries(themeOptionFields(theme).map((f) => [f.key, f.default]));
}

/** Saved theme settings laid over the defaults: unknown keys dropped, colours checked, text capped. */
export function cleanThemeOptions(theme: string, saved: unknown): Record<string, string> {
  const out = themeOptionDefaults(theme);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return out;
  const given = saved as Record<string, unknown>;
  for (const f of themeOptionFields(theme)) {
    const v = given[f.key];
    if (typeof v !== "string") continue;
    if (f.kind === "color") {
      if (/^#[0-9a-fA-F]{6}$/.test(v)) out[f.key] = v;
    } else if (f.kind === "select") {
      if (f.options?.some((o) => o.value === v)) out[f.key] = v;
    } else if (v.trim()) {
      out[f.key] = v.slice(0, f.max || 60);
    }
  }
  return out;
}

/** The theme's own sections that this content no longer has, in the theme's order. */
export function removedThemeSections(content: SiteContent, theme: string, storeName?: string): SiteSection[] {
  const have = new Set(content.sections.map((s) => s.id));
  return getDefaultSiteContent(theme, storeName).sections.filter((s) => !have.has(s.id));
}

/** Puts one of the theme's removed sections back, with its original content, where it sits in the theme. */
export function restoreThemeSection(content: SiteContent, theme: string, id: string, storeName?: string): SiteContent {
  const defaults = getDefaultSiteContent(theme, storeName).sections;
  const at = defaults.findIndex((s) => s.id === id);
  if (at < 0 || content.sections.some((s) => s.id === id)) return content;
  const list = [...content.sections];
  // after the nearest section that comes before it in the theme, or first if none of those are left
  let insert = 0;
  for (let i = at - 1; i >= 0; i--) {
    const found = list.findIndex((s) => s.id === defaults[i].id);
    if (found >= 0) {
      insert = found + 1;
      break;
    }
  }
  list.splice(insert, 0, defaults[at]);
  return { ...content, sections: list };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, fallback: string, max = 2000) => (typeof v === "string" ? v.slice(0, max) : fallback);

/** Saved content laid over the theme's defaults, so missing or broken fields never break the storefront. */
export function resolveSiteContent(saved: unknown, theme: string = "mono-studio", storeName?: string): SiteContent {
  const base = getDefaultSiteContent(theme, storeName);
  if (!isObj(saved)) return base;

  const settings = { ...base.settings };
  if (isObj(saved.settings)) {
    for (const k of Object.keys(settings) as (keyof SiteSettings)[]) {
      const v = saved.settings[k];
      if (typeof v === "string" && v) (settings as Record<string, string>)[k] = v.slice(0, 60);
    }
    const size = Number(settings.textSize);
    settings.textSize = String(Number.isFinite(size) ? Math.min(130, Math.max(80, Math.round(size))) : 100);
  }
  const pick = <T extends Record<string, string>>(def: T, v: unknown): T => {
    const out = { ...def };
    if (isObj(v)) for (const k of Object.keys(def)) (out as Record<string, string>)[k] = str(v[k], def[k], 500);
    return out;
  };

  let sections = base.sections;
  if (Array.isArray(saved.sections)) {
    sections = saved.sections
      .filter((s): s is Record<string, unknown> => isObj(s) && typeof s.type === "string" && s.type in SITE_SECTION_TYPES)
      .slice(0, 30)
      .map((s, i) => {
        const settingsIn = isObj(s.settings) ? s.settings : {};
        const clean: Record<string, string> = {};
        for (const [k, v] of Object.entries(settingsIn)) if (typeof v === "string") clean[k] = v.slice(0, 4000);
        return {
          id: typeof s.id === "string" && s.id ? s.id : `section-${i}`,
          type: s.type as SiteSectionType,
          hidden: s.hidden === true,
          settings: clean,
        };
      });
  }

  const pages = { ...base.pages };
  if (isObj(saved.pages)) {
    for (const id of SITE_PAGE_IDS) {
      const p = saved.pages[id];
      if (isObj(p)) pages[id] = { title: str(p.title, base.pages[id].title, 120), body: str(p.body, base.pages[id].body, 8000), image: str(p.image, base.pages[id].image || "", 2000) };
    }
  }

  return {
    announcement: str(saved.announcement, base.announcement, 200),
    settings,
    header: pick(base.header, saved.header),
    footer: pick(base.footer, saved.footer),
    sections,
    pages,
    options: cleanThemeOptions(theme, saved.options),
  };
}

/** Section heading size as a multiplier for --m-hs. */
export function headingScale(size?: string): number {
  return size === "s" ? 0.8 : size === "l" ? 1.22 : 1;
}

/** Fonts the themes offer in the editor (all loaded in the root layout). */
export const SITE_HEADING_FONTS = [
  "Onest",
  "Inter Tight",
  "Schibsted Grotesk",
  "Bricolage Grotesque",
  "Unbounded",
  "Syne",
  "Space Grotesk",
  "Outfit",
  "Manrope",
  "Instrument Serif",
  "Playfair Display",
  "Cormorant Garamond",
];
/** Tall, narrow poster fonts for the biggest headlines. */
export const SITE_CONDENSED_FONTS = ["Anton", "Bebas Neue", "Big Shoulders Display", "Oswald"];
export const SITE_DISPLAY_FONTS = [...SITE_CONDENSED_FONTS, ...SITE_HEADING_FONTS];
/** Every font a heading can use (the editor's heading list). */
export const SITE_ALL_HEADING_FONTS = [...SITE_HEADING_FONTS, ...SITE_CONDENSED_FONTS];
export const SITE_BODY_FONTS = ["Onest", "Inter", "Inter Tight", "Manrope", "DM Sans", "Outfit", "Plus Jakarta Sans"];

export function fontStack(name: string): string {
  const serif = name === "Playfair Display" || name === "Cormorant Garamond" || name === "Instrument Serif";
  return `'${name}', ${serif ? "serif" : "sans-serif"}`;
}
