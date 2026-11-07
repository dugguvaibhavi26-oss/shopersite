import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * Checkbox Component
 */
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, disabled, checked, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex items-start gap-3 select-none cursor-pointer group py-1.5 min-h-[44px]",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 rounded-md border transition-all duration-150 flex items-center justify-center",
              "border-[#CCCCCC] bg-white group-hover:border-[#999999]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[#111111]/20 peer-focus-visible:border-[#111111]",
              "peer-checked:bg-[#111111] peer-checked:border-[#111111] peer-checked:text-white"
            )}
          >
            <Check className="h-3.5 w-3.5 stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col text-left">
            {label && <span className="text-sm font-medium text-[#111111]">{label}</span>}
            {description && <span className="text-xs text-[#555555] mt-0.5">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

/**
 * Radio Component
 */
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex items-start gap-3 select-none cursor-pointer group py-1.5 min-h-[44px]",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={inputId}
            ref={ref}
            type="radio"
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 rounded-full border transition-all duration-150 flex items-center justify-center",
              "border-[#CCCCCC] bg-white group-hover:border-[#999999]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[#111111]/20 peer-focus-visible:border-[#111111]",
              "peer-checked:border-[#111111]"
            )}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-[#111111] scale-0 peer-checked:scale-100 transition-transform duration-150" />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col text-left">
            {label && <span className="text-sm font-medium text-[#111111]">{label}</span>}
            {description && <span className="text-xs text-[#555555] mt-0.5">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Radio.displayName = "Radio";

/**
 * Toggle (Switch) Component
 */
export interface ToggleProps {
  label?: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ label, description, checked = false, onChange, disabled, id }: ToggleProps) {
  const toggleId = id || React.useId();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2 min-h-[44px]",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {(label || description) && (
        <div className="flex flex-col text-left select-none">
          {label && <span className="text-sm font-medium text-[#111111]">{label}</span>}
          {description && <span className="text-xs text-[#555555] mt-0.5">{description}</span>}
        </div>
      )}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20",
          checked ? "bg-[#111111]" : "bg-[#CCCCCC]",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
