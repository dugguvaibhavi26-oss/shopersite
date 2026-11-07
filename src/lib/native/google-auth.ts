import { GoogleAuthProvider, signInWithCredential, type Auth, type UserCredential } from "firebase/auth";
import { getNativePlatform } from "./platform";
import { GOOGLE_WEB_CLIENT_ID } from "../firebase";

/**
 * Google sign-in for the Android/iOS app.
 *
 * Google blocks its sign-in page inside embedded WebViews, so `signInWithPopup` cannot work in the
 * app. Instead the native Google sign-in sheet (Credential Manager on Android, Google Sign-In on iOS)
 * returns an ID token, which is exchanged for the same Firebase user the website uses.
 *
 * Uses the Firebase project's web OAuth client (GOOGLE_WEB_CLIENT_ID in lib/firebase.ts). Android
 * also needs an Android OAuth client for package com.roxten.shopersite with the signing key's SHA-1
 * (see MOBILE_APP_SETUP.md). iOS needs NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID.
 */
let initialized = false;

export class NativeGoogleSignInError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function signInWithGoogleNative(auth: Auth): Promise<UserCredential> {
  const platform = getNativePlatform();
  const webClientId = GOOGLE_WEB_CLIENT_ID;
  const iOSClientId = process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

  if ((platform === "android" && !webClientId) || (platform === "ios" && !iOSClientId)) {
    throw new NativeGoogleSignInError(
      "app/google-not-configured",
      "Google sign-in isn't set up in the app yet. Please log in with your email and password."
    );
  }

  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  if (!initialized) {
    await SocialLogin.initialize({
      google: {
        webClientId: webClientId || undefined,
        iOSClientId: iOSClientId || undefined,
        iOSServerClientId: webClientId || undefined,
        mode: "online",
      },
    });
    initialized = true;
  }

  let idToken: string | null = null;
  try {
    // No custom scopes: the plugin already asks for openid, email and profile (enough for Firebase).
    // Passing any `scopes` on Android requires a modified MainActivity and is rejected otherwise.
    const res = await SocialLogin.login({ provider: "google", options: {} });
    idToken = res.result.responseType === "online" ? res.result.idToken : null;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "USER_CANCELLED") {
      // Same code the website uses when the Google popup is closed, so the pages stay quiet.
      throw new NativeGoogleSignInError("auth/popup-closed-by-user", "Google sign-in was cancelled.");
    }
    throw err;
  }

  if (!idToken) {
    throw new NativeGoogleSignInError("app/google-no-token", "Google didn't return a sign-in token. Please try again.");
  }
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}
