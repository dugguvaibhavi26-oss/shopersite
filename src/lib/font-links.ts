/**
 * Google Fonts, split in two so the marketing pages are not held up by fonts they do not use.
 * CORE holds the fonts of the main site and loads with the page. THEME holds the fonts only shop
 * themes use: shops load it with the page (app/s/[subdomain]/layout.tsx, theme previews), every
 * other page fetches it in the background (app/layout.tsx).
 */
export const CORE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap";

export const THEME_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Anton&family=Bebas+Neue&family=Big+Shoulders+Display:wght@600..900&family=Oswald:wght@500..700&family=Onest:wght@400..800&family=Inter+Tight:wght@400..800&family=Schibsted+Grotesk:wght@400..800&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&family=Syne:wght@500;600;700;800&family=Great+Vibes&family=Unbounded:wght@400;500;600;700;800&display=swap";
