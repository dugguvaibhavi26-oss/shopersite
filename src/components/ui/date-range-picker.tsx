import * as React from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "custom";

export interface DateRangePickerProps {
  label?: string;
  onChange?: (range: { preset: DatePreset; start: string; end: string }) => void;
  className?: string;
}

export function DateRangePicker({ label, onChange, className }: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<DatePreset>("7d");
  const [startDate, setStartDate] = React.useState("2026-10-15");
  const [endDate, setEndDate] = React.useState("2026-10-22");

  const presets: { id: DatePreset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7d", label: "Last 7 days" },
    { id: "30d", label: "Last 30 days" },
    { id: "custom", label: "Custom" },
  ];

  const handleSelectPreset = (preset: DatePreset) => {
    setSelectedPreset(preset);
    onChange?.({ preset, start: startDate, end: endDate });
  };

  return (
    <div className={cn("flex flex-col gap-2 text-left w-full", className)}>
      {label && <label className="text-sm font-medium text-[#0F172A]">{label}</label>}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-xl">
        {presets.map((p) => {
          const isActive = selectedPreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                isActive
                  ? "bg-white text-[#1E3A8A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/50"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {selectedPreset === "custom" && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:border-[#1E3A8A]"
          />
          <span className="text-xs text-[#94A3B8]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:border-[#1E3A8A]"
          />
        </div>
      )}
    </div>
  );
}
