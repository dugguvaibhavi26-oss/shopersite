/**
 * Helpers for telling whether the site is running inside the Android/iOS app (Capacitor).
 *
 * The native shell injects `window.Capacitor` before any page script runs, so these checks
 * need no import and add nothing to the web bundle. In a normal browser they return false,
 * and every native-only code path stays switched off.
 */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function capacitor(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/** True only inside the installed Android or iOS app. */
export function isNativeApp(): boolean {
  return !!capacitor()?.isNativePlatform?.();
}

/** "android", "ios" or "web". */
export function getNativePlatform(): "android" | "ios" | "web" {
  if (!isNativeApp()) return "web";
  const platform = capacitor()?.getPlatform?.();
  return platform === "android" || platform === "ios" ? platform : "web";
}
