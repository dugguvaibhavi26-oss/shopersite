import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = "pill", className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 overflow-x-auto no-scrollbar py-1 text-sm font-medium",
        variant === "pill" && "p-1 bg-[#F5F5F5] rounded-[3px]",
        variant === "underline" && "border-b border-[#E5E5E5] gap-4",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-sm transition-all duration-150 cursor-pointer min-h-[40px]",
              variant === "pill" && [
                "rounded-lg",
                isActive
                  ? "bg-white text-[#111111] font-semibold shadow-xs"
                  : "text-[#555555] hover:text-[#111111] hover:bg-white/50",
              ],
              variant === "underline" && [
                "-mb-px border-b-2",
                isActive
                  ? "border-[#111111] text-[#111111] font-semibold"
                  : "border-transparent text-[#555555] hover:text-[#111111] hover:border-[#CCCCCC]",
              ]
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs font-semibold",
                  isActive ? "bg-[#DBEAFE] text-[#111111]" : "bg-[#E5E5E5] text-[#555555]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
