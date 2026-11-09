"use client";

import * as React from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Settings sections the Shopersite team has marked "In maintenance" (Admin → System status).
 * Sellers see a tag in the Settings menu and a notice on that page. Stored in
 * platform_settings/maintenance (anyone can read it; only admins can write).
 */

export const MAINTAINABLE: { id: string; label: string }[] = [
  { id: "general", label: "General" },
  { id: "store", label: "Store link & logo" },
  { id: "domain", label: "Domain" },
  { id: "payments", label: "Payments" },
  { id: "checkout", label: "Checkout" },
  { id: "accounts", label: "Customer accounts" },
  { id: "delivery", label: "Shipping & delivery" },
  { id: "taxes", label: "Taxes" },
  { id: "notifications", label: "Notifications" },
  { id: "events", label: "Tracking & ads" },
  { id: "privacy", label: "Customer privacy" },
  { id: "policies", label: "Policies" },
];

/** Until an admin saves a list: Domain waits for the Vercel API token. */
export const DEFAULT_MAINTENANCE = ["domain"];

const ref = () => doc(db, "platform_settings", "maintenance");

export function useMaintenance(): string[] {
  const [list, setList] = React.useState<string[]>(DEFAULT_MAINTENANCE);
  React.useEffect(() => {
    try {
      return onSnapshot(
        ref(),
        (snap) => {
          const v = snap.data()?.sections;
          setList(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : DEFAULT_MAINTENANCE);
        },
        () => setList(DEFAULT_MAINTENANCE)
      );
    } catch {
      return undefined;
    }
  }, []);
  return list;
}

export async function saveMaintenance(sections: string[]) {
  await setDoc(ref(), { sections, updatedAt: new Date().toISOString() });
}
