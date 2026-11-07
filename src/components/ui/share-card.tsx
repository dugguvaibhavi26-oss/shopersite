import * as React from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, QrCode, Share2, Download } from "lucide-react";
import { Button } from "./button";

export interface ShareCardProps {
  storeName: string;
  storeUrl: string;
  className?: string;
}

export function ShareCard({ storeName, storeUrl, className }: ShareCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Shop from ${storeName} online: ${storeUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-sm flex flex-col gap-5 text-left max-w-sm w-full mx-auto",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">Share Your Store</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Let your buyers shop directly</p>
        </div>
        <div className="w-9 h-9 rounded-md bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center">
          <Share2 className="w-4 h-4" />
        </div>
      </div>

      {/* SVG QR Code Simulation */}
      <div className="flex flex-col items-center justify-center p-5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] gap-3">
        <div className="w-32 h-32 bg-white p-2.5 rounded-md border border-[#CBD5E1] shadow-2xs flex items-center justify-center">
          {/* Crisp, clean SVG QR visual */}
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[#0F172A]">
            <rect x="0" y="0" width="30" height="30" rx="4" />
            <rect x="6" y="6" width="18" height="18" fill="white" rx="2" />
            <rect x="10" y="10" width="10" height="10" rx="1" />
            
            <rect x="70" y="0" width="30" height="30" rx="4" />
            <rect x="76" y="6" width="18" height="18" fill="white" rx="2" />
            <rect x="80" y="10" width="10" height="10" rx="1" />
            
            <rect x="0" y="70" width="30" height="30" rx="4" />
            <rect x="6" y="76" width="18" height="18" fill="white" rx="2" />
            <rect x="10" y="80" width="10" height="10" rx="1" />

            <rect x="40" y="10" width="8" height="8" />
            <rect x="52" y="10" width="8" height="8" />
            <rect x="40" y="24" width="8" height="8" />
            <rect x="52" y="38" width="8" height="8" />
            <rect x="40" y="52" width="8" height="8" />
            <rect x="52" y="66" width="8" height="8" />
            <rect x="40" y="80" width="8" height="8" />
            <rect x="70" y="50" width="8" height="8" />
            <rect x="82" y="62" width="8" height="8" />
            <rect x="70" y="76" width="8" height="8" />
            <rect x="85" y="85" width="8" height="8" />
          </svg>
        </div>
        <span className="text-[11px] font-medium text-[#64748B]">Scan with Google Pay, Paytm, or Camera</span>
      </div>

      {/* Store Link Input & Copy Button */}
      <div className="flex items-center gap-2 p-1.5 rounded-md border border-[#CBD5E1] bg-[#F8FAFC]">
        <span className="text-xs font-mono text-[#0F172A] truncate pl-2 flex-1">{storeUrl}</span>
        <Button
          size="sm"
          variant={copied ? "primary" : "secondary"}
          onClick={handleCopy}
          className="h-8 px-3 text-xs shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Share Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleWhatsAppShare}
          className="text-xs h-10 border-[#86EFAC] bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]"
        >
          <span>Share WhatsApp</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="text-xs h-10"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          <span>Save Poster</span>
        </Button>
      </div>
    </div>
  );
}
