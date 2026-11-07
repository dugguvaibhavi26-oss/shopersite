"use client";

export type PinInfo = { pincode: string; city: string; state: string; areas: string[] };

const KEY = "shopersite_pins";
const read = (): Record<string, PinInfo> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};

/**
 * City and state for a PIN code. PIN codes looked up before on this device answer at once, without
 * asking the server again. Returns null if the PIN doesn't exist.
 */
export async function lookupPincode(pin: string): Promise<PinInfo | null> {
  if (!/^[1-9][0-9]{5}$/.test(pin)) return null;
  const saved = read()[pin];
  if (saved) return saved;
  const res = await fetch(`/api/pincode?pin=${pin}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("lookup failed");
  const info = (await res.json()) as PinInfo;
  if (info.city) {
    try {
      const all = read();
      all[pin] = info;
      const keys = Object.keys(all);
      if (keys.length > 50) delete all[keys[0]];
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      // storage full or blocked: fine, it's only a shortcut
    }
  }
  return info;
}
