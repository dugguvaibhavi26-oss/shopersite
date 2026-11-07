import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-[#0F172A] rounded-lg shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150",
            position === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
            position === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-1.5",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
