/**
 * Home → Discover cards, set by the platform admin (Admin → Discover cards): image, title, text and
 * an optional link (e.g. a docs page). Saved in platform_settings/discover (public to read, admins
 * write). Anything left empty falls back to the built-in content.
 */

import { cleanFeature } from "./dashboard-features";

export type DiscoverId = "season" | "design" | "templates" | "photo" | "new" | "trending" | "calendar" | "creative" | "academy";

/** The image cards under "Picked for you"; the rest are the icon cards under "Explore more". */
export const PICKED_IDS = ["season", "design", "templates", "photo", "new"] as const;
export const EXPLORE_IDS = ["trending", "calendar", "creative", "academy"] as const;

export interface DiscoverCard {
  id: DiscoverId;
  /** empty = built-in (the season card's title changes every month) */
  title: string;
  text: string;
  imageUrl: string;
  /** empty = open the built-in tips; "/path" opens in the app; "https://…" opens in a new tab */
  link: string;
  /** the dashboard page the card opens (an id from dashboard-features); empty = the link, or the built-in tips */
  feature: string;
  /** button text, e.g. "Read the guide"; empty = the built-in one */
  linkLabel: string;
  enabled: boolean;
}

export const DISCOVER_IDS: DiscoverId[] = [...PICKED_IDS, ...EXPLORE_IDS];

export const DISCOVER_DEFAULTS: Record<DiscoverId, { title: string; text: string; name: string }> = {
  season: { name: "Seasonal selling", title: "", text: "" },
  design: { name: "Store design inspiration", title: "Store design inspiration", text: "Simple ways to make your shop look like a brand." },
  templates: { name: "Marketing templates", title: "Marketing templates", text: "Ready WhatsApp and Instagram messages with your link." },
  photo: { name: "Product photo tips", title: "Product photo tips", text: "Better photos with just your phone and daylight." },
  new: { name: "New in Shopersite", title: "New in Shopersite", text: "The latest features you can use today." },
  trending: { name: "What's trending", title: "What's trending", text: "Your rising products and what sells this season." },
  calendar: { name: "Campaign calendar", title: "Campaign calendar", text: "Upcoming festivals and sale days to plan for." },
  creative: { name: "Creative lab", title: "Creative lab", text: "Write captions, posts, banners and descriptions with AI." },
  academy: { name: "Seller academy", title: "Seller academy", text: "Short lessons to get more orders and grow." },
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A safe link: an in-app path or an http(s) URL; anything else is dropped. */
export function cleanLink(v: unknown): string {
  const s = str(v, 500);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** An image URL we can show: https, or a data: image (the upload fallback). */
function cleanImage(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.startsWith("https://")) return s.slice(0, 2000);
  if (s.startsWith("data:image/") && s.length < 900_000) return s;
  return "";
}

export function mergeDiscover(saved: unknown): Record<DiscoverId, DiscoverCard> {
  const raw = (saved && typeof saved === "object" ? (saved as { cards?: unknown }).cards : null) as Record<string, Record<string, unknown>> | null;
  const out = {} as Record<DiscoverId, DiscoverCard>;
  for (const id of DISCOVER_IDS) {
    const c = (raw && typeof raw[id] === "object" ? raw[id] : {}) || {};
    out[id] = {
      id,
      title: str(c.title, 80),
      text: str(c.text, 200),
      imageUrl: cleanImage(c.imageUrl),
      link: cleanLink(c.link),
      feature: cleanFeature(c.feature),
      linkLabel: str(c.linkLabel, 30),
      enabled: c.enabled !== false,
    };
  }
  return out;
}

/** The button each built-in card shows when the admin leaves "Button text" empty. */
export const DISCOVER_BUTTONS: Record<DiscoverId, string> = {
  season: "See this month's ideas",
  design: "Get design ideas",
  templates: "Copy a template",
  photo: "See photo tips",
  new: "See what's new",
  trending: "See what's trending",
  calendar: "Open calendar",
  creative: "Open Creative lab",
  academy: "Start learning",
};

/* ------------------------------ the admin's own cards ------------------------------ */

/** A card the admin added: a picture, a few words and a button that opens one dashboard feature. */
export interface CustomCard {
  id: string;
  title: string;
  /** the sub title under it */
  text: string;
  imageUrl: string;
  /** empty = the feature's own button text */
  buttonLabel: string;
  /** an id from dashboard-features */
  feature: string;
  /** used when no feature is picked: "/path" or "https://…" */
  link: string;
  enabled: boolean;
}

export const MAX_CUSTOM_CARDS = 12;

export function mergeCustomCards(saved: unknown): CustomCard[] {
  const raw = (saved && typeof saved === "object" ? (saved as { custom?: unknown }).custom : null) as Record<string, unknown>[] | null;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => c && typeof c === "object")
    .slice(0, MAX_CUSTOM_CARDS)
    .map((c, i) => ({
      id: str(c.id, 40) || `card-${i}`,
      title: str(c.title, 80),
      text: str(c.text, 200),
      imageUrl: cleanImage(c.imageUrl),
      buttonLabel: str(c.buttonLabel, 30),
      feature: cleanFeature(c.feature),
      link: cleanLink(c.link),
      enabled: c.enabled !== false,
    }))
    .filter((c) => c.title && (c.feature || c.link));
}

/* ------------------------------ hero slides ------------------------------ */

/** A slide in the big banner at the top of Home (Admin → App banners → Top banner). */
export interface HeroSlide {
  id: string;
  title: string;
  text: string;
  imageUrl: string;
  /** small label above the title, e.g. "New" or "Guide" */
  tag: string;
  ctaLabel: string;
  /** "/path" opens in the app; "https://…" opens in a new tab */
  link: string;
  enabled: boolean;
}

export const MAX_SLIDES = 5;

export function mergeSlides(saved: unknown): HeroSlide[] {
  const raw = (saved && typeof saved === "object" ? (saved as { slides?: unknown }).slides : null) as Record<string, unknown>[] | null;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === "object")
    .slice(0, MAX_SLIDES)
    .map((s, i) => ({
      id: str(s.id, 40) || `slide-${i}`,
      title: str(s.title, 80),
      text: str(s.text, 180),
      imageUrl: cleanImage(s.imageUrl),
      tag: str(s.tag, 24),
      ctaLabel: str(s.ctaLabel, 30),
      link: cleanLink(s.link),
      enabled: s.enabled !== false,
    }))
    .filter((s) => s.title);
}
