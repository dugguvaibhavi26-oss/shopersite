"use client";

import * as React from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_LANDING_CONFIG, mergeLandingConfig, type LandingConfig } from "./landing-config";

const LANDING_STORAGE_KEY = "shopper_landing_config";
const ref = () => doc(db, "platform_settings", "landing");

function getInitialConfig(): LandingConfig {
  if (typeof window === "undefined") return { ...DEFAULT_LANDING_CONFIG };
  try {
    const saved = localStorage.getItem(LANDING_STORAGE_KEY);
    if (saved) return mergeLandingConfig(JSON.parse(saved));
  } catch {
    // fallback to defaults
  }
  return { ...DEFAULT_LANDING_CONFIG };
}

/** Hook providing live, real-time landing page configuration set by admin */
export function useLandingConfig(): { config: LandingConfig; loaded: boolean } {
  const [data, setData] = React.useState<{ config: LandingConfig; loaded: boolean }>(() => ({
    config: getInitialConfig(),
    loaded: false,
  }));

  React.useEffect(() => {
    try {
      return onSnapshot(
        ref(),
        (snap) => {
          const raw = snap.exists() ? snap.data() : null;
          const config = mergeLandingConfig(raw);
          setData({ config, loaded: true });
          try {
            localStorage.setItem(LANDING_STORAGE_KEY, JSON.stringify(config));
          } catch {
            // ignore localStorage quota errors
          }
        },
        () => {
          // If Firestore fails or offline, use local storage / defaults
          setData((prev) => ({ ...prev, loaded: true }));
        }
      );
    } catch {
      setData((prev) => ({ ...prev, loaded: true }));
      return undefined;
    }
  }, []);

  return data;
}

/** Admin: save landing page settings to Firestore and local storage */
export async function saveLandingConfig(config: LandingConfig, byEmail: string): Promise<void> {
  const clean = mergeLandingConfig(config);
  try {
    localStorage.setItem(LANDING_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // ignore
  }

  await setDoc(
    ref(),
    {
      ...JSON.parse(JSON.stringify(clean)),
      updatedAt: new Date().toISOString(),
      updatedBy: byEmail,
    },
    { merge: true }
  );
}

