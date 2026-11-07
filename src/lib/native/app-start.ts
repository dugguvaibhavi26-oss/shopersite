/**
 * Where the Android/iOS app opens, and remembering that onboarding is done.
 *
 * The app shell starts at /app (capacitor.config.ts `server.appStartPath`). That page waits for
 * Firebase to restore the session, then sends people on:
 *   signed in            -> dashboard (never onboarding or login again until they log out)
 *   signed out, seen it  -> app login
 *   first time           -> onboarding slides
 */

const ONBOARDED_KEY = "shopersite_app_onboarded";

export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Called when onboarding is finished or skipped, and whenever someone is signed in. */
export function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    // storage can be unavailable (private mode); onboarding just shows again
  }
}

export function decideStartPath(state: {
  loading: boolean;
  signedIn: boolean;
  storeSubdomain?: string | null;
  onboarded: boolean;
}): string | null {
  if (state.loading) return null;
  if (state.signedIn) {
    return state.storeSubdomain ? `/dashboard?store=${encodeURIComponent(state.storeSubdomain)}` : "/dashboard";
  }
  return state.onboarded ? "/app/login" : "/app/welcome";
}

/**
 * Website pages that have an app version. Inside the app these are swapped for the app screens, so
 * the marketing home page and the desktop-style login never appear (e.g. after logging out).
 */
const APP_REPLACEMENTS: Record<string, string> = {
  "/": "/app",
  "/login": "/app/login",
  "/signup": "/register",
};

export function appReplacementFor(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return APP_REPLACEMENTS[clean] ?? null;
}
