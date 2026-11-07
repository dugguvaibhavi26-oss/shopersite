import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
}

export function Skeleton({
  className,
  variant = "rectangular",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full rounded-md",
    rectangular: "rounded-md",
    circular: "rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-[#E2E8F0] dark:bg-[#334155]",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

/**
 * Pre-composed product card skeleton loader
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-[#E2E8F0] bg-white p-3 gap-3">
      <Skeleton className="w-full aspect-square rounded-md" />
      <Skeleton variant="text" className="w-3/4 h-4" />
      <div className="flex items-center justify-between mt-1">
        <Skeleton variant="text" className="w-1/3 h-4" />
        <Skeleton className="w-8 h-8 rounded-md" />
      </div>
    </div>
  );
}
