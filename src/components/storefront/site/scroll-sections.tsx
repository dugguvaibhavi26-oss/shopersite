"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { productsFromSource, rupees, useSite } from "./context";
import { Container, MLink } from "./ui";

/**
 * Sections that move with the buyer's scroll instead of only animating once:
 * WordStory pins itself while the buyer scrolls through it, swapping big words and wiping from one product to the next;
 * ScatterGallery's photos gather in as it arrives and drift apart as it leaves.
 * They read the scroll progress the shop writes on each section (--p, see site-app.tsx); WordStory keeps its own (--pin).
 * With no motion (the editor, or a buyer who asks for less) they rest in a calm middle state.
 */

function reduced() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function WordStory({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const pairs = [1, 2, 3, 4].map((n) => ({ left: s[`w${n}Left`] || "", right: s[`w${n}Right`] || "" })).filter((p) => p.left || p.right);
  const products = productsFromSource(store, s.source || "bestsellers", 8).filter((p) => p.images?.[0]);
  const count = Math.min(pairs.length, Math.max(products.length, 1));
  const ref = React.useRef<HTMLElement>(null);
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || count < 1) return;
    const snap = reduced();
    let raf = 0;
    const run = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const pin = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      const at = count > 1 ? Math.min(count - 1, Math.round(pin * (count - 1))) : 0;
      // buyers who ask for less motion get whole steps, never a half-wiped picture
      el.style.setProperty("--pin", snap ? String(count > 1 ? at / (count - 1) : 0) : pin.toFixed(4));
      setStep(at);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [count]);

  if (!count || !products.length) return null;
  const shown = Array.from({ length: count }, (_, i) => products[i % products.length]);
  const cur = shown[step] || shown[0];
  const pair = pairs[step] || pairs[0];
  const drift = products.slice(count, count + 2).length === 2 ? products.slice(count, count + 2) : products.slice(0, 2);

  return (
    <section
      ref={ref}
      className="t-wordstory relative"
      style={{ height: `${count * 70 + 50}svh`, "--n1": String(Math.max(1, count - 1)) } as React.CSSProperties}
    >
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center overflow-hidden lg:top-[72px] lg:h-[calc(100svh-72px)]">
        {/* two small pieces drift and turn around the card as the buyer scrolls */}
        {drift.map((p, i) => (
          <span key={p.id} aria-hidden className={`t-ws-drift t-ws-drift-${i} pointer-events-none absolute hidden aspect-square overflow-hidden rounded-full md:block`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.images![0]} alt="" loading="lazy" className="h-full w-full object-cover" />
          </span>
        ))}
        <Container className="grid h-full w-full grid-rows-[auto_1fr_auto] items-center justify-items-center gap-3 py-5 md:grid-cols-[1fr_auto_1fr] md:grid-rows-1 md:gap-[clamp(24px,4vw,64px)]">
          <p key={`l${step}`} className="t-ws-word m-h text-center text-[length:calc(clamp(30px,6vw,96px)*var(--m-scale))] leading-none md:justify-self-end md:text-right">
            {pair.left}
          </p>
          <MLink to={`/products/${cur.slug || cur.id}`} className="t-ws-card m-panel relative block aspect-[3/4] h-[min(50svh,460px)] overflow-hidden md:h-[min(66svh,580px)]" aria-label={cur.title}>
            {shown.map((p, k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${p.id}-${k}`} src={p.images![0]} alt="" loading={k ? "lazy" : undefined} className="t-ws-img absolute inset-0 h-full w-full object-cover" style={{ "--k": String(k - 1), zIndex: k } as React.CSSProperties} />
            ))}
            <span className="absolute inset-x-2.5 bottom-2.5 z-20 flex items-center justify-between gap-3 bg-[var(--m-bg)] px-3 py-2.5 text-[var(--m-text)]">
              <span className="min-w-0">
                <span className="block truncate text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.08em]">{cur.title}</span>
                <span className="m-muted text-[length:calc(12px*var(--m-scale))]">{rupees(cur.price)}</span>
              </span>
              {s.buttonLabel && (
                <span className="flex shrink-0 items-center gap-1 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.12em]">
                  {s.buttonLabel} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </span>
          </MLink>
          <p key={`r${step}`} className="t-ws-word t-ws-word-r m-h text-center text-[length:calc(clamp(30px,6vw,96px)*var(--m-scale))] leading-none md:justify-self-start md:text-left">
            {pair.right}
          </p>
        </Container>
        {/* where the buyer is in the story */}
        {count > 1 && (
          <span aria-hidden className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 gap-1.5 md:flex">
            {shown.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? "w-6 bg-[var(--m-text)]" : "w-1.5 bg-[color-mix(in_srgb,var(--m-text)_25%,transparent)]"}`} />
            ))}
          </span>
        )}
      </div>
    </section>
  );
}

// the mosaic the photos spread into: ten tiles that fit together (left, top, width, height in % of the band, wide screens);
// phones turn it on its side so it fills a tall screen. Each also has a turn while it lies in the pile.
const MOSAIC = [
  { l: 0, t: 0, w: 41, h: 42, turn: -7 },
  { l: 42, t: 0, w: 19, h: 36, turn: 6 },
  { l: 62, t: 0, w: 38, h: 36, turn: -3 },
  { l: 0, t: 43, w: 23, h: 57, turn: 9 },
  { l: 24, t: 43, w: 17, h: 13, turn: -5 },
  { l: 24, t: 57, w: 17, h: 43, turn: 4 },
  { l: 42, t: 37, w: 26, h: 63, turn: -8 },
  { l: 69, t: 37, w: 13, h: 19, turn: 7 },
  { l: 69, t: 57, w: 13, h: 43, turn: -4 },
  { l: 83, t: 37, w: 17, h: 63, turn: 5 },
];

export function ScatterGallery({ s }: { s: Record<string, string> }) {
  const photos = Array.from({ length: 10 }, (_, i) => s[`g${i + 1}Image`]).filter(Boolean);
  const box = React.useRef<HTMLDivElement>(null);
  if (!photos.length && !s.heading) return null;
  const dark = s.tone !== "light";
  const words = (s.heading || "").split("\n");

  // fish-eye: tiles near the pointer swell and come forward, the rest lean a little towards it
  const look = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || reduced()) return;
    const el = box.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>(".t-scatter-photo").forEach((ph) => {
      const r = ph.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / 360);
      ph.style.setProperty("--hx", `${(dx * 0.05).toFixed(1)}px`);
      ph.style.setProperty("--hy", `${(dy * 0.05).toFixed(1)}px`);
      ph.style.setProperty("--hs", (1 + near * 0.14).toFixed(3));
      ph.style.zIndex = String(Math.round(near * 10));
    });
  };
  const rest = () => {
    box.current?.querySelectorAll<HTMLElement>(".t-scatter-photo").forEach((ph) => {
      ph.style.removeProperty("--hx");
      ph.style.removeProperty("--hy");
      ph.style.removeProperty("--hs");
      ph.style.zIndex = "";
    });
  };

  return (
    <section className={`t-scatter relative overflow-hidden ${dark ? "bg-[#121212] text-white" : "bg-[var(--m-panel)]"}`}>
      <div ref={box} onPointerMove={look} onPointerLeave={rest} className="t-mosaic relative mx-auto h-[clamp(560px,100svh,900px)] max-w-[1680px] p-[clamp(8px,1.2vw,18px)]">
        <div className="relative h-full w-full [container-type:size]">
          {/* the photos lie in a pile behind the title and spread into a mosaic as the buyer scrolls */}
          {MOSAIC.map((m, i) => (
            <span
              key={i}
              className="t-scatter-photo absolute block overflow-hidden"
              style={{ "--ll": String(m.l), "--lt": String(m.t), "--lw": String(m.w), "--lh": String(m.h), "--turn": `${m.turn}deg`, zIndex: undefined } as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[i % photos.length]} alt="" loading="lazy" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-[var(--g)] text-center">
          {/* a soft glow behind the words keeps them readable over the photos */}
          <span aria-hidden className={`absolute left-1/2 top-1/2 -z-10 h-[70%] w-[min(92%,640px)] -translate-x-1/2 -translate-y-1/2 ${dark ? "bg-[radial-gradient(closest-side,rgba(18,18,18,0.6),rgba(18,18,18,0.3)_60%,transparent)]" : "bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--m-panel)_88%,transparent),transparent)]"}`} />
          <h2 className="t-scatter-title m-h text-[length:calc(clamp(30px,5.4vw,84px)*var(--m-scale))] leading-[1.02] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
            {words.map((w, i) => (
              <span key={i} className="block">
                {w}
              </span>
            ))}
          </h2>
          {s.text && <p className={`mt-4 max-w-sm text-[length:calc(13.5px*var(--m-scale))] [text-shadow:0_1px_12px_rgba(0,0,0,0.5)] ${dark ? "text-white/85" : "m-muted"}`}>{s.text}</p>}
          {s.buttonLabel && (
            <MLink
              to={s.buttonLink || "/catalog"}
              className={`pointer-events-auto mt-6 inline-flex h-11 items-center gap-2 border px-6 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm transition ${dark ? "border-white/70 bg-black/30 hover:bg-white hover:text-[#121212]" : "border-[var(--m-text)] bg-[var(--m-bg)]/60 hover:bg-[var(--m-text)] hover:text-[var(--m-bg)]"}`}
            >
              {s.buttonLabel} <ArrowRight className="h-3.5 w-3.5" />
            </MLink>
          )}
        </div>
      </div>
    </section>
  );
}
