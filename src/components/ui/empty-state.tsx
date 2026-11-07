import * as React from "react";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/50 max-w-md mx-auto my-4",
        className
      )}
    >
      <div className="w-14 h-14 rounded-md bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center mb-4 shadow-2xs">
        {icon || <PackageOpen className="w-7 h-7 stroke-[1.75]" />}
      </div>
      <h3 className="text-base font-bold text-[#0F172A]">{title}</h3>
      <p className="text-xs text-[#64748B] mt-1.5 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          size="md"
          className="mt-5"
        >
          {action.icon && <span>{action.icon}</span>}
          <span>{action.label}</span>
        </Button>
      )}
    </div>
  );
}
