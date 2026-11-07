import * as React from "react";
import { PLATFORM_THEMES } from "@/lib/themes";
import { MOCK_PRODUCTS, unsplash } from "@/components/home/mockups";
import { cn } from "@/lib/utils";

export const COLLAGE_IMAGES = [
  ...Object.values(PLATFORM_THEMES)
    .map((t) => t.previewImage)
    .filter((src): src is string => !!src),
  ...MOCK_PRODUCTS.map((p) => unsplash(p.img, 500)),
];

const DURATIONS = [95, 110, 100, 120, 105, 115];

function CollageColumn({
  images,
  direction,
  duration,
  imgClassName,
}: {
  images: string[];
  direction: "up" | "down";
  duration: number;
  imgClassName?: string;
}) {
  // Duplicated so the -50% translate loops seamlessly
  const loop = [...images, ...images];
  return (
    <div className="flex-1 min-w-0">
      <div
        className={cn("flex flex-col gap-4", direction === "up" ? "animate-marquee-up" : "animate-marquee-down")}
        style={{ animationDuration: `${duration}s` }}
      >
        {loop.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            className={cn("w-full aspect-[3/4] object-cover rounded-[11px]", imgClassName)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Tilted columns of shop photos drifting in alternating directions.
 * Purely decorative; place it inside a positioned, overflow-hidden parent.
 */
export function PhotoCollage({
  columns = 3,
  offset = 0,
  className,
  imgClassName,
}: {
  columns?: number;
  /** Start further into the photo list, so two collages on one page differ */
  offset?: number;
  className?: string;
  imgClassName?: string;
}) {
  const source = [...COLLAGE_IMAGES.slice(offset), ...COLLAGE_IMAGES.slice(0, offset)];
  const cols = Array.from({ length: columns }, (_, c) => {
    const imgs = source.filter((_, i) => i % columns === c);
    return imgs.length >= 3 ? imgs : [...imgs, ...source.slice(c, c + 3)];
  });
  return (
    <div aria-hidden className={cn("flex gap-4 rotate-[-8deg]", className)}>
      {cols.map((imgs, c) => (
        <CollageColumn
          key={c}
          images={imgs}
          direction={(c + offset) % 2 === 0 ? "up" : "down"}
          duration={DURATIONS[(c + offset) % DURATIONS.length]}
          imgClassName={imgClassName}
        />
      ))}
    </div>
  );
}

/** A single row of photos drifting sideways — the phone-sized hero backdrop. */
export function PhotoStrip({
  className,
  imgClassName,
  style,
}: {
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
}) {
  const loop = [...COLLAGE_IMAGES, ...COLLAGE_IMAGES];
  return (
    <div aria-hidden style={style} className={cn("overflow-hidden", className)}>
      <div className="flex w-max gap-3 animate-marquee" style={{ animationDuration: "70s" }}>
        {loop.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            className={cn("h-40 w-32 object-cover rounded-[11px] shrink-0", imgClassName)}
          />
        ))}
      </div>
    </div>
  );
}
