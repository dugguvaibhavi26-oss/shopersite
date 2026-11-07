import en from "./dictionaries/en.json";

export type Locale = "en" | "hi" | "te";
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  // Fallbacks to English for Hindi and Telugu until Phase 2 translation sets are populated
  hi: en,
  te: en,
};

/**
 * Get dictionary for locale (defaults to English)
 */
export function getDictionary(locale: Locale = "en"): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}

/**
 * Helper to interpolate dynamic variables in translation strings
 * Example: interpolate("Resend in {seconds}s", { seconds: 30 }) => "Resend in 30s"
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/{(\w+)}/g, (_, key) => String(values[key] ?? `{${key}}`));
}
