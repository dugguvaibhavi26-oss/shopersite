import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface StepItem {
  id: number | string;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 1-indexed
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Stepper: Compact bar with step count */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
          <span>
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-[#64748B] font-normal">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
          <div
            className="h-full bg-[#1E3A8A] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop & Tablet Stepper: Numbered circles with connecting lines */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 shrink-0",
                    isCompleted && "bg-[#15803D] text-white shadow-2xs",
                    isCurrent && "bg-[#1E3A8A] text-white ring-4 ring-[#1E3A8A]/15 shadow-2xs",
                    !isCompleted && !isCurrent && "bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNumber}
                </div>
                <div className="flex flex-col text-left">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isCurrent ? "text-[#0F172A]" : "text-[#64748B]"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-[11px] text-[#94A3B8]">{step.description}</span>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 transition-colors duration-200",
                    stepNumber < currentStep ? "bg-[#15803D]" : "bg-[#E2E8F0]"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Progress Bar
 */
export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-medium text-[#0F172A]">
          {label && <span>{label}</span>}
          {showPercent && <span className="text-[#64748B] ml-auto">{percentage}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
        <div
          className="h-full bg-[#1E3A8A] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
