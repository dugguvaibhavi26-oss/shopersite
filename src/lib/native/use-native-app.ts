"use client";

import { useEffect, useState } from "react";
import { isNativeApp } from "./platform";

/**
 * True inside the Android/iOS app. Starts false and flips after mount, so server and first client
 * render match (no hydration mismatch); app-only UI appears a frame later.
 */
export function useNativeApp(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNativeApp()), []);
  return native;
}
