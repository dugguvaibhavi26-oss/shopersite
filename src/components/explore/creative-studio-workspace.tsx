"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  MessageSquare,
  Zap,
  FileText,
  Smartphone,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { CREATIVE_TEMPLATES, type CreativeTemplate } from "@/lib/explore-data";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function CreativeStudioWorkspace() {
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [storeName, setStoreName] = useState("Lume Studio");
  const [productName, setProductName] = useState("Oversized Pure Linen Co-ord");
  const [promoCode, setPromoCode] = useState("VIP10");
  const [copied, setCopied] = useState(false);

  const currentTemplate = CREATIVE_TEMPLATES[activeTemplateIdx] || CREATIVE_TEMPLATES[0];

  // Dynamically replace variables
  const generatedHook = currentTemplate.hook
    .replace(/\{Customer_Name\}/g, "Pooja")
    .replace(/\{Store_Name\}/g, storeName)
    .replace(/\{Product_Title\}/g, productName);

  const generatedBody = currentTemplate.body
    .replace(/\{Customer_Name\}/g, "Pooja")
    .replace(/\{Store_Name\}/g, storeName)
    .replace(/\{Product_Title\}/g, productName)
    .replace(/\{Store_Link\}/g, `https://${storeName.toLowerCase().replace(/\s+/g, "")}.shopersite.in`)
    .replace(/\{Checkout_Link\}/g, `https://${storeName.toLowerCase().replace(/\s+/g, "")}.shopersite.in/checkout`)
    .replace(/\*VIPSECRET\*/g, `*${promoCode}*`);

  const generatedCTA = currentTemplate.cta;

  const fullText = `${generatedHook}\n\n${generatedBody}\n\n${generatedCTA}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          Creative Copy Studio & Generator
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
          High-Conversion Marketing Copy Studio
        </h1>
        <p className="text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
          Interactive copy studio to customize, preview, and 1-click copy high-converting scripts for WhatsApp VIP drops, Instagram Reels, and abandoned cart recovery.
        </p>
      </div>

      {/* Studio Workspace: Left Controls + Right Live Smartphone Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Board */}
        <div className="lg:col-span-6 space-y-6">
          {/* Template Channel Switcher */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              1. Select Channel Script Type
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CREATIVE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setActiveTemplateIdx(idx)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    activeTemplateIdx === idx
                      ? "bg-black text-white border-black font-bold shadow-xs"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-black font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {tmpl.channel === "WhatsApp" && <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    {tmpl.channel === "Instagram" && <InstagramIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                    {tmpl.channel === "Flash Sale" && <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    {tmpl.channel === "Product Description" && <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    <span className="truncate">{tmpl.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Customizer Inputs */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
              2. Customize Brand & Offer Variables
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Your Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-neutral-300 bg-white font-medium focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Promo Coupon Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-neutral-300 bg-white font-medium focus:ring-1 focus:ring-black outline-none uppercase font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-neutral-700 mb-1">Product Highlight</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-neutral-300 bg-white font-medium focus:ring-1 focus:ring-black outline-none"
                />
              </div>
            </div>
          </div>

          {/* Copy Button & Conversion Guidance */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-3.5 px-6 rounded-2xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied Script to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Rendered Script</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-neutral-500 text-center">
              Ready to paste into WhatsApp Web, Instagram Creator Studio, or your product dashboard.
            </p>
          </div>
        </div>

        {/* Right Live Device Mockup Canvas */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm rounded-[36px] bg-neutral-900 border-4 border-neutral-800 shadow-2xl p-4 text-white space-y-4">
            {/* Phone speaker notch */}
            <div className="w-24 h-4 bg-neutral-800 rounded-full mx-auto" />

            <div className="flex items-center justify-between text-xs text-neutral-400 px-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                Live {currentTemplate.channel} View
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                High Conversion
              </span>
            </div>

            {/* Rendered Message Canvas */}
            <div className="rounded-[24px] bg-neutral-950 p-4 border border-neutral-800 space-y-3 min-h-[340px] flex flex-col justify-between">
              {currentTemplate.channel === "WhatsApp" ? (
                /* WhatsApp Message Bubble */
                <div className="rounded-2xl rounded-tl-xs bg-[#005c4b] p-3.5 text-xs text-white space-y-2 shadow-md">
                  <span className="font-bold block text-emerald-200">{generatedHook}</span>
                  <p className="whitespace-pre-wrap leading-relaxed text-neutral-100 font-sans">{generatedBody}</p>
                  <div className="pt-2 border-t border-emerald-700/60 flex items-center justify-between text-[10px] text-emerald-300">
                    <span>{generatedCTA}</span>
                    <span>10:42 AM ✓✓</span>
                  </div>
                </div>
              ) : (
                /* Instagram / Web Copy Frame */
                <div className="rounded-2xl bg-neutral-900 p-4 text-xs text-neutral-200 space-y-3 font-sans">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                      {storeName.slice(0, 1)}
                    </div>
                    <span className="font-bold text-white">{storeName.toLowerCase().replace(/\s+/g, "_")}</span>
                  </div>
                  <span className="font-bold text-white block">{generatedHook}</span>
                  <p className="whitespace-pre-wrap leading-relaxed text-neutral-300 text-[11px] font-mono">{generatedBody}</p>
                  <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-400">
                    {generatedCTA}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-neutral-500 flex justify-between px-1">
                <span>Length: {fullText.length} characters</span>
                <span>Optimized for Indian Mobile</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

