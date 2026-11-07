import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export function Toast({
  type = "info",
  title,
  message,
  onClose,
  action,
}: ToastProps) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#B91C1C] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#0369A1] shrink-0" />,
  };

  const borders = {
    success: "border-[#86EFAC] bg-white",
    error: "border-[#FCA5A5] bg-white",
    warning: "border-[#FCD34D] bg-white",
    info: "border-[#7DD3FC] bg-white",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full transition-all duration-200",
        borders[type]
      )}
    >
      {icons[type]}
      <div className="flex-1 flex flex-col text-left">
        <h4 className="text-sm font-semibold text-[#0F172A]">{title}</h4>
        {message && <p className="text-xs text-[#64748B] mt-0.5">{message}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-bold text-[#1E3A8A] hover:underline mt-2 text-left self-start"
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded-lg"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
