"use client";

import * as React from "react";

/**
 * Roxy, Shopersite's assistant: a soft dark blob with two eyes. When `alive`, it breathes gently,
 * blinks now and then and glances around, so it feels like a little companion rather than an icon.
 * (Motion is switched off for people who prefer reduced motion; see globals.css.)
 */
export function RoxyLogo({ size = 32, alive = true, className = "" }: { size?: number; alive?: boolean; className?: string }) {
  const id = React.useId().replace(/:/g, "");
  return (
    <span className={`relative inline-flex shrink-0 ${alive ? "roxy-breathe" : ""} ${className}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <radialGradient id={`rx-body-${id}`} cx="0.32" cy="0.25" r="0.85">
            <stop offset="0" stopColor="#3a3a3a" />
            <stop offset="0.55" stopColor="#161616" />
            <stop offset="1" stopColor="#050505" />
          </radialGradient>
          <radialGradient id={`rx-shine-${id}`} cx="0.3" cy="0.2" r="0.35">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* body: a soft, slightly irregular blob */}
        <path d="M32 3c10.5 0 18.6 3.9 23.6 11.2C60.4 21.3 61 27 61 33c0 9.7-3.5 17.4-10.1 22.3C45.6 59.2 39.4 61 32 61s-14.1-1.9-19.4-6C6.4 50.2 3 42.7 3 33c0-6.4 1.2-12.5 5.2-18.3C13.4 7.1 21.5 3 32 3z" fill={`url(#rx-body-${id})`} />
        <path d="M32 3c10.5 0 18.6 3.9 23.6 11.2C60.4 21.3 61 27 61 33c0 9.7-3.5 17.4-10.1 22.3C45.6 59.2 39.4 61 32 61s-14.1-1.9-19.4-6C6.4 50.2 3 42.7 3 33c0-6.4 1.2-12.5 5.2-18.3C13.4 7.1 21.5 3 32 3z" fill={`url(#rx-shine-${id})`} />
        {/* eyes */}
        <g className={alive ? "roxy-look" : ""}>
          <g className={alive ? "roxy-blink" : ""} style={{ transformOrigin: "32px 30px" }}>
            <rect x="20.5" y="23" width="7" height="13" rx="3.5" fill="#fff" />
            <rect x="36.5" y="23" width="7" height="13" rx="3.5" fill="#fff" />
          </g>
        </g>
        {/* a small smile */}
        <path d="M27.5 44.5c2.8 2.2 6.2 2.2 9 0" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
