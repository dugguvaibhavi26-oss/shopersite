"use client";

import * as React from "react";

/**
 * The seller's real shop, drawn at desktop width and shrunk to fit the card, so the live theme
 * shows exactly what buyers see (their products, photos and text). The theme's screenshot shows
 * until the shop has loaded. It's a picture only: clicks go to the card's link.
 */
export function LiveShopFrame({ src, fallback, width = 1280 }: { src: string; fallback: string; width?: number }) {
  const box = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [loaded, setLoaded] = React.useState(false);

  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const scale = size.w ? size.w / width : 0;
  return (
    <div ref={box} className="absolute inset-0 overflow-hidden bg-neutral-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {fallback && <img src={fallback} alt="" className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${loaded ? "opacity-0" : "opacity-100"}`} />}
      {scale > 0 && (
        <iframe
          src={src}
          title="Your live shop"
          tabIndex={-1}
          aria-hidden
          loading="lazy"
          onLoad={(e) => {
            // the page loads before the shop has drawn: wait until its homepage and photos are there
            const frame = e.currentTarget;
            const started = Date.now();
            const check = () => {
              const doc = frame.contentDocument;
              const main = doc?.querySelector(".site main");
              const imgs = Array.from(main?.querySelectorAll("img") || []).slice(0, 4);
              const ready = !!main && (main.textContent || "").trim().length > 40 && imgs.every((i) => i.complete);
              if (ready || Date.now() - started > 9000) window.setTimeout(() => setLoaded(true), 300);
              else window.setTimeout(check, 300);
            };
            check();
          }}
          className={`pointer-events-none absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ width, height: Math.ceil(size.h / scale), transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}
