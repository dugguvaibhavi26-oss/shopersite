import * as React from "react";
import { PhotoCollage } from "@/components/home/photo-collage";
import { ShopperLogo } from "@/components/brand/shopper-logo";
import { cn } from "@/lib/utils";

/**
 * Top half of the app's onboarding and login screens: the website's drifting product-photo
 * collage, the logo in a white pill, and a fade into the white sheet below.
 */
export function PhotoHero({
  className,
  children,
  action,
}: {
  className?: string;
  /** Floating cards drawn over the photos */
  children?: React.ReactNode;
  /** Top-right control, e.g. Skip */
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-neutral-100", className)}>
      <PhotoCollage columns={3} className="absolute -inset-x-16 -top-28 -bottom-6" imgClassName="rounded-[18px]" />
      {/* soften the photos so cards and the logo read clearly */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-white" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
        <span className="inline-flex items-center rounded-full bg-white/90 px-3.5 py-2 backdrop-blur-md shadow-sm">
          <ShopperLogo className="text-[15px]" />
        </span>
        {action}
      </div>

      {children}
    </div>
  );
}

/** White bottom sheet that overlaps the photos. */
export function AppSheet({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative -mt-8 rounded-t-[28px] bg-white px-6 pt-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-24px_40px_-24px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {children}
    </div>
  );
}
