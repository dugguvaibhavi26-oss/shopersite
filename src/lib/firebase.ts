import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

import { firebaseConfig } from "./firebase-config";
export { firebaseConfig };

/**
 * Google sign-in "Web application" OAuth client of the Firebase project (rox-shoppersite).
 * Public, not a secret. The Android/iOS app uses it to exchange the phone's Google account for a
 * Firebase login. Can be overridden with NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "849711979912-61h6iq3sauuthuib357baeoo69joi9tl.apps.googleusercontent.com";

// Initialize Firebase singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Safe Analytics initialization for Next.js browser execution
export const getClientAnalytics = async () => {
  if (typeof window !== "undefined" && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};
