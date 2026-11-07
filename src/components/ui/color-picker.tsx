import * as React from "react";
import { cn } from "@/lib/utils";
import { evaluateContrast, type ContrastResult } from "@/lib/tokens/contrast";
import { Check, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface ColorPickerProps {
  label?: string;
  value?: string;
  backgroundHex?: string; // Color to evaluate contrast against (defaults to #FFFFFF)
  onChange?: (colorHex: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  { name: "Deep Indigo", hex: "#1E3A8A" },
  { name: "Emerald Teal", hex: "#0F766E" },
  { name: "Royal Purple", hex: "#6B21A8" },
  { name: "Warm Amber", hex: "#B45309" },
  { name: "Ruby Rose", hex: "#BE123C" },
  { name: "Midnight Slate", hex: "#0F172A" },
  { name: "Forest Green", hex: "#14532D" },
  { name: "Terracotta", hex: "#C2410C" },
];

export function ColorPicker({
  label,
  value = "#1E3A8A",
  backgroundHex = "#FFFFFF",
  onChange,
  className,
}: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = React.useState(value);

  const contrastResult: ContrastResult = React.useMemo(() => {
    return evaluateContrast(selectedColor, backgroundHex);
  }, [selectedColor, backgroundHex]);

  const handleColorChange = (hex: string) => {
    setSelectedColor(hex);
    onChange?.(hex);
  };

  return (
    <div className={cn("w-full flex flex-col gap-3 text-left", className)}>
      {label && <label className="text-sm font-medium text-[#0F172A]">{label}</label>}

      {/* Preset Swatches */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {PRESET_COLORS.map((preset) => {
          const isSelected = selectedColor.toUpperCase() === preset.hex.toUpperCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => handleColorChange(preset.hex)}
              title={preset.name}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-transform cursor-pointer relative",
                "shadow-2xs border border-black/10 hover:scale-105 active:scale-95",
                isSelected && "ring-2 ring-offset-2 ring-[#0F172A]"
              )}
              style={{ backgroundColor: preset.hex }}
            >
              {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {/* Custom Color Input & Preview */}
      <div className="flex items-center gap-3 mt-1">
        <div className="relative">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-11 h-11 rounded-xl cursor-pointer border border-[#CBD5E1] p-1 bg-white"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={selectedColor.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (val.startsWith("#") || val.length <= 7) {
                handleColorChange(val);
              }
            }}
            placeholder="#1E3A8A"
            className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#1E3A8A]"
          />
        </div>
      </div>

      {/* Live WCAG AA Contrast Evaluation Card */}
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-xl border text-xs transition-colors",
          contrastResult.isNormalTextPass
            ? "border-[#86EFAC] bg-[#F0FDF4] text-[#15803D]"
            : "border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]"
        )}
      >
        <div className="flex items-center gap-2">
          {contrastResult.isNormalTextPass ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#B45309]" />
          )}
          <span className="font-semibold">
            {contrastResult.isNormalTextPass
              ? `WCAG AA Passed (${contrastResult.ratio}:1)`
              : `Low Contrast Warning (${contrastResult.ratio}:1)`}
          </span>
        </div>
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/80 border border-current">
          {contrastResult.level}
        </span>
      </div>
    </div>
  );
}
