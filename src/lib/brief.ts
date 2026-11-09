/**
 * Keeps help text short: the first sentence only. Long explanations made the dashboard and
 * settings feel heavy; one clear line is enough next to a setting.
 */
export function brief(text?: string): string {
  if (!text) return "";
  const t = text.trim();
  const m = t.match(/^(.+?[.!?])(\s|$)/);
  return m ? m[1] : t;
}
