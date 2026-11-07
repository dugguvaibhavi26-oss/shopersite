import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "primary";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral: "bg-[#F5F5F5] text-[#111111] border-[#DDDDDD]",
    primary: "bg-[#111111] text-[#FFFFFF] border-[#111111]",
    success: "bg-[#E6EFDF] text-[#2F6B3A] border-[#B9CFAE]",
    warning: "bg-[#F6ECD3] text-[#8A5A12] border-[#E2C88E]",
    error: "bg-[#F6E0DC] text-[#9B2C2C] border-[#DDAFA7]",
    info: "bg-[#E2EAF2] text-[#2C4F73] border-[#B9C8D8]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] rounded-[2px] border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className="w-1 h-1 rotate-45 bg-current opacity-70" />
      <span>{children}</span>
    </span>
  );
}
