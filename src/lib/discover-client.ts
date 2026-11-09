"use client";

import * as React from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { mergeDiscover, mergeSlides, type DiscoverCard, type DiscoverId, type HeroSlide } from "./discover";

const ref = () => doc(db, "platform_settings", "discover");

interface DiscoverData {
  cards: Record<DiscoverId, DiscoverCard>;
  slides: HeroSlide[];
  loaded: boolean;
}

/** Everything the admin set for Discover (cards and banner slides), kept live. */
export function useDiscoverData(): DiscoverData {
  const [data, setData] = React.useState<DiscoverData>(() => ({ cards: mergeDiscover(null), slides: [], loaded: false }));
  React.useEffect(() => {
    try {
      return onSnapshot(
        ref(),
        (snap) => {
          const d = snap.exists() ? snap.data() : null;
          setData({ cards: mergeDiscover(d), slides: mergeSlides(d), loaded: true });
        },
        () => setData({ cards: mergeDiscover(null), slides: [], loaded: true })
      );
    } catch {
      return undefined;
    }
  }, []);
  return data;
}

/** The Discover cards as the admin set them, kept live. */
export function useDiscoverCards(): Record<DiscoverId, DiscoverCard> {
  return useDiscoverData().cards;
}

/** Admin: save the cards (merged, so banner slides are kept). Firestore rules allow admins only. */
export async function saveDiscoverCards(cards: Record<DiscoverId, DiscoverCard>, by: string) {
  const clean = mergeDiscover({ cards });
  await setDoc(ref(), { cards: JSON.parse(JSON.stringify(clean)), updatedAt: new Date().toISOString(), updatedBy: by }, { merge: true });
}

/** Admin: save the banner slides (merged, so the cards are kept). */
export async function saveDiscoverSlides(slides: HeroSlide[], by: string) {
  const clean = mergeSlides({ slides });
  await setDoc(ref(), { slides: JSON.parse(JSON.stringify(clean)), updatedAt: new Date().toISOString(), updatedBy: by }, { merge: true });
}
