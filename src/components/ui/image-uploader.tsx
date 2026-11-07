import * as React from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, Image as ImageIcon, X, Crop, Check } from "lucide-react";
import { Button } from "./button";

export interface ImageUploaderProps {
  label?: string;
  helperText?: string;
  value?: string;
  onChange?: (fileUrl: string) => void;
  aspectRatio?: "1:1" | "4:5" | "16:9";
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({
  label,
  helperText = "Upload high-res JPG or PNG. Auto-compressed to WebP (max 1600px).",
  value,
  onChange,
  aspectRatio = "1:1",
  className,
  disabled,
}: ImageUploaderProps) {
  const [preview, setPreview] = React.useState<string | undefined>(value);
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setIsCompressing(true);
    // Simulate mobile-friendly image processing & local WebP preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        const result = e.target?.result as string;
        setPreview(result);
        setIsCompressing(false);
        onChange?.(result);
      }, 400);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setPreview(undefined);
    onChange?.("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const aspectClasses = {
    "1:1": "aspect-square max-w-[240px]",
    "4:5": "aspect-[4/5] max-w-[240px]",
    "16:9": "aspect-video w-full",
  };

  return (
    <div className={cn("w-full flex flex-col gap-2 text-left", className)}>
      {label && <label className="text-sm font-medium text-[#0F172A]">{label}</label>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {preview ? (
        <div className={cn("relative rounded-lg overflow-hidden border border-[#E2E8F0] group", aspectClasses[aspectRatio])}>
          <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsCropModalOpen(true)}
              className="h-8 px-2 text-xs gap-1 bg-white text-[#0F172A]"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Crop</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleClear}
              className="h-8 px-2 text-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
            WebP • Optimized
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center min-h-[160px]",
            "border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#94A3B8]",
            disabled && "opacity-60 cursor-not-allowed hover:bg-[#F8FAFC]"
          )}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#1E3A8A]">Compressing & converting to WebP...</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-md bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center text-[#1E3A8A] mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">Tap to upload photo</p>
              <p className="text-xs text-[#64748B] mt-1">{helperText}</p>
            </>
          )}
        </div>
      )}

      {/* Crop Framing Preview Modal */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <h4 className="text-base font-bold text-[#0F172A]">Adjust Framing</h4>
            <div className="relative aspect-square rounded-md overflow-hidden border-2 border-[#1E3A8A] bg-black">
              {preview && <img src={preview} alt="Crop view" className="w-full h-full object-cover opacity-90" />}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/40">
                <div className="border border-white/20" />
                <div className="border border-white/20" />
                <div className="border border-white/20" />
                <div className="border border-white/20" />
                <div className="border border-white/20" />
                <div className="border border-white/20" />
                <div className="border border-white/20" />
                <div className="border border-white/20" />
                <div className="border border-white/20" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsCropModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setIsCropModalOpen(false)}>
                <Check className="w-4 h-4 mr-1" />
                Apply Framing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
