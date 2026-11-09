import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../firebase-admin";
import { ApiError } from "../api-error";
import { istDay, mergeAssistantSettings, usageView, type AssistantSettings, type UsageView } from "../../assistant/budget";

/**
 * assistant_usage/{day}            → the whole platform's tokens and requests for that day
 * assistant_usage/{day}/sellers/{uid} → one seller's tokens for that day
 * platform_settings/assistant      → budgets set in Admin
 */

const settingsRef = () => adminDb().collection("platform_settings").doc("assistant");
const dayRef = (day: string) => adminDb().collection("assistant_usage").doc(day);
const sellerRef = (day: string, uid: string) => dayRef(day).collection("sellers").doc(uid);

let cached: { at: number; value: AssistantSettings } | null = null;

export async function getAssistantSettings(fresh = false): Promise<AssistantSettings> {
  if (!fresh && cached && Date.now() - cached.at < 60_000) return cached.value;
  const snap = await settingsRef().get();
  const value = mergeAssistantSettings(snap.exists ? snap.data() : null);
  cached = { at: Date.now(), value };
  return value;
}

export async function saveAssistantSettings(input: unknown, by: string): Promise<AssistantSettings> {
  const value = mergeAssistantSettings(input);
  await settingsRef().set({ ...value, updatedAt: new Date().toISOString(), updatedBy: by });
  cached = { at: Date.now(), value };
  return value;
}

async function readUsage(uid: string, day = istDay()) {
  const [p, s] = await Promise.all([dayRef(day).get(), sellerRef(day, uid).get()]);
  const pd = (p.data() || {}) as { tokens?: number; requests?: number };
  return { platform: { tokens: pd.tokens || 0, requests: pd.requests || 0 }, used: ((s.data() || {}) as { tokens?: number }).tokens || 0 };
}

export async function getUsage(uid: string, planId: string | undefined): Promise<UsageView> {
  const [settings, u] = await Promise.all([getAssistantSettings(), readUsage(uid)]);
  return usageView(settings, planId, u.used, u.platform);
}

/** Throws a friendly 429 when the seller's bar is full or the platform is at its safety cap. */
export async function requireBudget(uid: string, planId: string | undefined): Promise<UsageView> {
  const view = await getUsage(uid, planId);
  if (!view.enabled) throw new ApiError(503, "The AI assistant is switched off right now. Simple commands still work.", "ai_off");
  if (view.busy) throw new ApiError(429, "AI is busy right now. Try again in a little while; simple commands still work.", "ai_busy");
  if (!view.available) throw new ApiError(429, "You've used today's AI. It resets at midnight; simple commands still work.", "ai_used_up");
  return view;
}

export async function recordUsage(uid: string, tokens: number, requests: number, provider: string) {
  const day = istDay();
  const t = Math.max(0, Math.round(tokens));
  await Promise.all([
    dayRef(day).set({ day, tokens: FieldValue.increment(t), requests: FieldValue.increment(requests), by: { [provider]: FieldValue.increment(requests) } }, { merge: true }),
    sellerRef(day, uid).set({ tokens: FieldValue.increment(t), requests: FieldValue.increment(requests), updatedAt: new Date().toISOString() }, { merge: true }),
  ]);
}

/** The last `days` days of platform usage, newest last (for the admin chart). */
export async function usageHistory(days = 14) {
  const out: { day: string; tokens: number; requests: number; by: Record<string, number> }[] = [];
  const now = Date.now();
  const ids = Array.from({ length: days }, (_, i) => istDay(now - (days - 1 - i) * 86400_000));
  const snaps = await adminDb().getAll(...ids.map((d) => dayRef(d)));
  snaps.forEach((s, i) => {
    const d = (s.data() || {}) as { tokens?: number; requests?: number; by?: Record<string, number> };
    out.push({ day: ids[i], tokens: d.tokens || 0, requests: d.requests || 0, by: d.by || {} });
  });
  return out;
}
