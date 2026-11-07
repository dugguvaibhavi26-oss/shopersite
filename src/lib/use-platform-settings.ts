"use client";

import { useEffect, useReducer } from "react";
import { storeService } from "./store-service";

/**
 * Loads the admin's platform settings (plan names, prices, features, access, payment UPI ID) and
 * re-renders when they change. Runs after the first render so server and client markup match.
 */
export function usePlatformSettings() {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    storeService.getPlatformPayment(); // starts the settings listeners
    bump();
    return storeService.subscribe(bump);
  }, []);
}
