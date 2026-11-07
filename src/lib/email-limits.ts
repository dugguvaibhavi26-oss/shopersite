/**
 * How many subscriber emails each plan can send. Emails go out through the seller's own Gmail, which
 * itself allows about 500 recipients a day on a normal Gmail account (2,000 on Google Workspace), so we
 * stop a little under that every day to keep the seller's Gmail from being paused.
 */
export const EMAIL_LIMITS: Record<string, { perMonth: number | null; perDay: number }> = {
  free: { perMonth: 0, perDay: 0 },
  starter: { perMonth: 1000, perDay: 450 },
  pro: { perMonth: null, perDay: 450 }, // no Shopersite limit; Gmail's daily limit still applies
};

export function emailLimitsFor(planId?: string) {
  return EMAIL_LIMITS[planId || "free"] || EMAIL_LIMITS.free;
}
