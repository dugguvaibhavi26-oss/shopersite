"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type RevealVariant = "up" | "left" | "right" | "zoom" | "flip" | "pop" | "blur" | "none";

/**
 * Heading entrance styles. Each plays once its parent <Reveal> becomes visible:
 * - "words-up": words rise out of a mask, one after another
 * - "words-blur": words sharpen from a blur
 * - "words-flip": words flip up in 3D
 * - "chars": letters cascade in with a slight spin
 * - "zoom": the whole line shrinks into place from large and spaced-out
 * - "type": letters appear one by one with a blinking caret
 * - "fill": grey text fills black as you scroll (scroll-linked)
 */
export type TitleEffect = "words-up" | "words-blur" | "words-flip" | "chars" | "zoom" | "type" | "fill";

export function AnimatedTitle({
  text,
  effect,
  className,
}: {
  /** Use "\n" for a line break that only applies from the sm breakpoint up */
  text: string;
  effect: TitleEffect;
  className?: string;
}) {
  if (effect === "fill" || effect === "zoom") {
    return (
      <h2 className={cn(effect === "fill" ? "scroll-text-fill" : "fx-zoom", className)}>
        {text.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br className="hidden sm:block" />}
            {line}
          </React.Fragment>
        ))}
      </h2>
    );
  }

  const perChar = effect === "chars" || effect === "type";
  let n = 0; // running index for stagger delays
  return (
    <h2 aria-label={text.replace("\n", " ")} className={cn(`fx fx-${effect}`, className)}>
      {text.split("\n").map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 && <br className="hidden sm:block" />}
          {line.split(" ").map((word, wi, words) => (
            <React.Fragment key={wi}>
              <span aria-hidden className="fx-word">
                {perChar ? (
                  word.split("").map((ch, ci) => (
                    <span key={ci} className="fx-unit" style={{ "--i": n++ } as React.CSSProperties}>
                      {ch}
                    </span>
                  ))
                ) : (
                  <span className="fx-unit" style={{ "--i": n++ } as React.CSSProperties}>
                    {word}
                  </span>
                )}
              </span>
              {wi < words.length - 1 && " "}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
      {effect === "type" && <span aria-hidden className="fx-caret" />}
    </h2>
  );
}

/**
 * Animates its children in the first time they scroll into view.
 *
 * `spotlight`: on touch devices (no hover), also toggles `.is-active` while the
 * element crosses the middle of the screen, so `hot:` / `group-hot:` styles
 * play as you scroll instead of on hover.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
  spotlight = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  spotlight?: boolean;
  as?: "div" | "section" | "li";
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [active, setActive] = React.useState(false);
  // Once the entrance has played, drop the stagger delay so hovers respond instantly
  const [settled, setSettled] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setSettled(true), delay + 900);
    return () => clearTimeout(t);
  }, [visible, delay]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!spotlight || !el || typeof IntersectionObserver === "undefined") return;
    // Scroll-triggered on touch screens and on any phone-width window (where hovering isn't
    // how people browse); wide mouse screens keep using real hover.
    const touch = window.matchMedia("(hover: none)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const scrollMode = () => touch.matches || narrow.matches;
    let inBand = false;
    // A thin band across the middle of the viewport
    const io = new IntersectionObserver(
      ([entry]) => {
        inBand = entry.isIntersecting;
        setActive(inBand && scrollMode());
      },
      { rootMargin: "-42% 0px -42% 0px" }
    );
    const onResize = () => setActive(inBand && scrollMode());
    io.observe(el);
    narrow.addEventListener("change", onResize);
    return () => {
      io.disconnect();
      narrow.removeEventListener("change", onResize);
    };
  }, [spotlight]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("reveal", variant !== "up" && `reveal-${variant}`, visible && "is-visible", active && "is-active", className)}
      style={{ transitionDelay: settled ? undefined : `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** Counts from `from` to `to` once visible, e.g. ₹999 → ₹0 or 0 → 60. */
export function CountUp({
  from,
  to,
  prefix = "",
  suffix = "",
  duration = 1600,
}: {
  from: number;
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [value, setValue] = React.useState(to);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setValue(from);
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          setValue(Math.round(from + (to - from) * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [from, to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
