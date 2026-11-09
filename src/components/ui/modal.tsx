import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: "dialog" | "sheet"; // dialog = centered modal; sheet = mobile bottom sheet
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  variant = "dialog",
  className,
}: ModalProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "dialog-pop relative z-50 w-full bg-white shadow-2xl transition-all duration-200 overflow-hidden pb-[env(safe-area-inset-bottom)] sm:pb-0",
          variant === "sheet"
            ? "rounded-t-xl max-h-[90vh] flex flex-col slide-in-from-bottom"
            : "rounded-lg sm:max-w-lg max-h-[90vh] flex flex-col scale-in-95",
          className
        )}
      >
        {/* Mobile drag handle for sheet */}
        {variant === "sheet" && (
          <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-[#CCCCCC]" />
          </div>
        )}

        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-[#F5F5F5]">
            <div className="flex flex-col text-left">
              {title && <h2 className="text-lg font-bold text-[#111111]">{title}</h2>}
              {description && <p className="text-xs text-[#555555] mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 rounded-md text-[#555555] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
