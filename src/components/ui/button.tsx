import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-[12px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#111111] text-[#FFFFFF] hover:bg-[#333333] focus-visible:ring-[#111111] border border-[#111111]",
      secondary:
        "bg-[#F5F5F5] text-[#111111] hover:bg-[#EEEEEE] focus-visible:ring-[#111111] border border-[#E5E5E5]",
      outline:
        "border border-[#111111] bg-transparent text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] focus-visible:ring-[#111111]",
      ghost:
        "text-[#333333] hover:bg-[#F5F5F5] hover:text-[#111111] focus-visible:ring-[#111111]",
      destructive:
        "bg-[#111111] text-[#FFFFFF] hover:bg-[#333333] focus-visible:ring-[#111111]",
    };

    const sizeStyles = {
      sm: "h-9 px-3.5 text-[13px] gap-1.5",
      md: "min-h-[44px] h-11 px-4 text-sm gap-2", // 44px touch target on mobile
      lg: "min-h-[48px] h-12 px-6 text-base gap-2.5",
      icon: "h-11 w-11 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
