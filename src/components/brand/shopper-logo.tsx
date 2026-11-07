import { cn } from "@/lib/utils";
import { LOGO_HEIGHT, MARK_PATH, MARK_WIDTH, WORD_PATH, WORD_WIDTH, WORD_X } from "./logo-paths";

/** The Shopersite bag on its own. Drawn in currentColor. */
export function ShopperMark({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${MARK_WIDTH} ${LOGO_HEIGHT}`} aria-hidden className={className}>
      <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** The "Shopersite™" lettering on its own, the same height as the mark. */
export function ShopperWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox={`${WORD_X} 0 ${WORD_WIDTH} ${LOGO_HEIGHT}`} aria-hidden className={className}>
      <path d={WORD_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/**
 * Full Shopersite logo: bag + "Shopersite™". Sized by the surrounding font size and drawn in the
 * text colour (black on light backgrounds, white on dark). `markClassName` styles just the bag,
 * e.g. for the hover tilt in the header.
 */
export function ShopperLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.11em] leading-none", className)} role="img" aria-label="Shopersite">
      <ShopperMark className={cn("h-[1.45em] w-auto shrink-0", markClassName)} />
      <ShopperWordmark className="h-[1.45em] w-auto shrink-0" />
    </span>
  );
}
