"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Check, MessageSquare, Zap, FileText } from "lucide-react";
import { CREATIVE_TEMPLATES, type CreativeTemplate } from "@/lib/explore-data";

function InstagramIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function CreativeLab() {
  const [selectedChannel, setSelectedChannel] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("My Boutique");

  const channels = ["All", "WhatsApp", "Instagram", "Flash Sale", "Product Description"];

  const filtered = CREATIVE_TEMPLATES.filter(
    (t) => selectedChannel === "All" || t.channel === selectedChannel
  );

  const handleCopy = (t: CreativeTemplate) => {
    const fullText = `${t.hook}\n\n${t.body}\n\n${t.cta}`.replace(/\{Store_Name\}/g, storeName);
    navigator.clipboard.writeText(fullText);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            High-Conversion Copy Blueprints
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Creative Lab & Marketing Scripts
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Ready-to-use captions, WhatsApp VIP announcements, and product descriptions proven to convert followers into paying customers.
          </p>
        </div>

        {/* Channel Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
          {channels.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setSelectedChannel(ch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedChannel === ch
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => {
          const isCopied = copiedId === item.id;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-[18px] border border-neutral-200/90 bg-white p-5 sm:p-6 transition-all hover:border-neutral-400 hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.08)]"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        item.channel === "WhatsApp"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.channel === "Instagram"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : item.channel === "Flash Sale"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                      }`}
                    >
                      {item.channel === "WhatsApp" && <MessageSquare className="w-3 h-3" />}
                      {item.channel === "Instagram" && <InstagramIcon className="w-3 h-3" />}
                      {item.channel === "Flash Sale" && <Zap className="w-3 h-3" />}
                      {item.channel === "Product Description" && <FileText className="w-3 h-3" />}
                      {item.channel}
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">{item.category}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-black hover:text-white transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="text-base font-bold text-neutral-950 mb-2">{item.title}</h3>
                
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 font-mono text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
                  <span className="font-semibold text-black block mb-1">{item.hook}</span>
                  {item.body}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">Recommended CTA:</span>
                <span className="font-semibold text-neutral-900">{item.cta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

