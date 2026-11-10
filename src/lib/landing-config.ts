import { PLATFORM_THEMES } from "./themes";

export interface LandingConfig {
  themesEyebrow: string;
  themesTitle: string;
  themesText: string;
  selectedThemeSlugs: string[];
  announcementBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
}

export const DEFAULT_FEATURED_THEME_SLUGS = [
  "classic-bloom", // Lume Editorial
  "mono-studio",   // Mono Studio
  "theme03",       // Theme 03
  "theme04",       // Theme 04
  "theme05",       // Theme 05
  "f01",           // F01
];

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  themesEyebrow: "Themes",
  themesTitle: "Designed to sell.",
  themesText: "Start with Lume Editorial for free. Upgrade to unlock our full collection of designer themes.",
  selectedThemeSlugs: DEFAULT_FEATURED_THEME_SLUGS,
  announcementBadge: "Zero Commission • Direct UPI Settlements",
};

/** Clean and sanitize landing config from raw Firestore / local storage data */
export function mergeLandingConfig(raw: unknown): LandingConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LANDING_CONFIG };
  const d = raw as Partial<LandingConfig>;

  let slugs = Array.isArray(d.selectedThemeSlugs)
    ? Array.from(new Set(d.selectedThemeSlugs.filter((s): s is string => typeof s === "string" && s.trim().length > 0)))
    : [];

  if (slugs.length === 0) {
    slugs = [...DEFAULT_FEATURED_THEME_SLUGS];
  }

  return {
    themesEyebrow: typeof d.themesEyebrow === "string" && d.themesEyebrow.trim() ? d.themesEyebrow.trim() : DEFAULT_LANDING_CONFIG.themesEyebrow,
    themesTitle: typeof d.themesTitle === "string" && d.themesTitle.trim() ? d.themesTitle.trim() : DEFAULT_LANDING_CONFIG.themesTitle,
    themesText: typeof d.themesText === "string" && d.themesText.trim() ? d.themesText.trim() : DEFAULT_LANDING_CONFIG.themesText,
    selectedThemeSlugs: slugs,
    announcementBadge: typeof d.announcementBadge === "string" ? d.announcementBadge.trim() : DEFAULT_LANDING_CONFIG.announcementBadge,
    heroTitle: typeof d.heroTitle === "string" ? d.heroTitle.trim() : undefined,
    heroSubtitle: typeof d.heroSubtitle === "string" ? d.heroSubtitle.trim() : undefined,
  };
}

