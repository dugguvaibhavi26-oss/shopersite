"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { decideStartPath, hasOnboarded, markOnboarded } from "@/lib/native/app-start";
import { COLLAGE_IMAGES } from "@/components/home/photo-collage";
import { cn } from "@/lib/utils";
import { ShopperWordmark } from "@/components/brand/shopper-logo";
import { BODY_PATH, HANDLE_PATH, LOGO_HEIGHT, MARK_WIDTH } from "@/components/brand/logo-paths";

/**
 * Launch screen: where the app opens.
 *
 * It starts exactly like Android's launch screen (the black bag mark, 100px tall, on white) so
 * the hand-over is seamless, then plays a short intro:
 *   the bag bounces and its handle swings -> product photos burst out from behind it ->
 *   the wordmark rises in letter by letter -> the photos drift away as the next screen opens.
 * Meanwhile Firebase restores the session, and the intro ends on onboarding, login or dashboard.
 * About 2 s on first launch and 1.2 s after that; skipped for people who prefer reduced motion.
 */

const FIRST_LAUNCH_MS = 2100;
const RETURNING_MS = 1250;

// Where each photo lands, relative to the bag in the centre (px), and its tilt
const TILES = [
  { x: -118, y: -228, r: -11 },
  { x: 116, y: -196, r: 9 },
  { x: -156, y: -10, r: 7 },
  { x: 158, y: 30, r: -8 },
  { x: -112, y: 226, r: 10 },
  { x: 120, y: 252, r: -6 },
];
const TILE_IMAGES = COLLAGE_IMAGES.slice(0, TILES.length).map((src) => src.replace(/w=\d+/, "w=320"));

export default function AppLaunchPage() {
  const router = useRouter();
  const { user, loading, stores } = useAuth();
  const [minTimeDone, setMinTimeDone] = React.useState(false);
  const [exiting, setExiting] = React.useState(false);
  const [returning, setReturning] = React.useState(false);
  // Animations start only once the page is live (the native launch screen hides at the same moment)
  const [playing, setPlaying] = React.useState(false);

  // Play the intro for a minimum time (shorter for returning users, near-instant for reduced motion)
  React.useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const seenBefore = hasOnboarded();
    setReturning(seenBefore);
    setPlaying(true);
    const t = window.setTimeout(() => setMinTimeDone(true), reduced ? 250 : seenBefore ? RETURNING_MS : FIRST_LAUNCH_MS);
    ["/app/welcome", "/app/login", "/dashboard"].forEach((p) => router.prefetch(p));
    return () => window.clearTimeout(t);
  }, [router]);

  const target = decideStartPath({
    loading,
    signedIn: !!user,
    storeSubdomain: stores[0]?.subdomain,
    onboarded: typeof window !== "undefined" && hasOnboarded(),
  });

  React.useEffect(() => {
    if (user) markOnboarded();
  }, [user]);

  // Move on once the intro has played and we know where to go. Navigation starts immediately (a
  // ref, not state, guards it, so a re-render can never cancel it) while the photos drift away.
  // The bag and wordmark stay visible until the next screen replaces this one, so a slow
  // connection shows the logo, never a blank screen.
  const navigated = React.useRef(false);
  React.useEffect(() => {
    if (!minTimeDone || !target || navigated.current) return;
    navigated.current = true;
    setExiting(true);
    router.replace(target);
  }, [minTimeDone, target, router]);

  return (
    <div
      className={cn(
        "launch fixed inset-0 overflow-hidden bg-white",
        playing && "launch-play",
        returning && "launch-fast",
        exiting && "launch-exit"
      )}
      aria-busy="true"
      aria-label="Opening shopersite"
    >
      {/* soft glow that blooms out from the bag */}
      <div aria-hidden className="launch-glow absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full" />

      {/* product photos bursting out from behind the bag */}
      <div aria-hidden className="absolute left-1/2 top-1/2">
        {TILES.map((t, i) => (
          <div
            key={i}
            className="launch-tile absolute -ml-12 -mt-16 h-32 w-24"
            style={
              {
                "--x": `${t.x}px`,
                "--y": `${t.y}px`,
                "--r": `${t.r}deg`,
                animationDelay: `calc(var(--k) * ${180 + i * 70}ms)`,
              } as React.CSSProperties
            }
          >
            <img
              src={TILE_IMAGES[i]}
              alt=""
              decoding="async"
              className="launch-tile-img h-full w-full rounded-[16px] bg-neutral-200 object-cover shadow-[0_18px_40px_-14px_rgba(0,0,0,0.45)]"
              style={{ animationDelay: `${i * 400}ms` }}
            />
          </div>
        ))}
      </div>

      {/* the bag: same size and place as Android's launch screen icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="launch-ring absolute h-[100px] w-[100px] rounded-full border border-black/15" aria-hidden />
        <svg viewBox={`0 0 ${MARK_WIDTH} ${LOGO_HEIGHT}`} aria-hidden className="launch-bag relative h-[100px] w-auto text-black">
          <path className="launch-handle" d={HANDLE_PATH} fill="currentColor" fillRule="evenodd" />
          <path d={BODY_PATH} fill="currentColor" fillRule="evenodd" />
        </svg>

        {/* wordmark rises in, letter by letter (positioned below the bag so the bag stays centred) */}
        <div className="absolute top-1/2 mt-[74px] flex flex-col items-center">
          <div className="overflow-hidden pb-1" role="img" aria-label="Shopersite">
            <span className="launch-letter block" style={{ animationDelay: "calc(var(--k) * 560ms)" }}>
              <ShopperWordmark className="h-[46px] w-auto text-black" />
            </span>
          </div>
          <p className="launch-tagline mt-3 text-[15px] text-neutral-500">Your shop, in your pocket</p>
        </div>
      </div>
    </div>
  );
}
