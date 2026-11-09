"use client";

import React, { useState } from "react";
import { BookMarked, Check, X, ArrowRight, ShieldCheck, Zap, Smartphone, DollarSign } from "lucide-react";
import { PLATFORM_COMPARISON } from "@/lib/explore-data";
import Link from "next/link";

export function PlaybooksGuides() {
  const [activeTab, setActiveTab] = useState<"playbooks" | "comparison">("comparison");

  return (
    <div className="rounded-[20px] border border-neutral-200/90 bg-white p-5 sm:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.06)] space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookMarked className="w-3.5 h-3.5 text-black" />
            Resources & Platform Architecture
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Playbooks & Platform Comparisons
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Transparent analysis of how Shopersite compares with legacy platforms, plus actionable D2C scaling playbooks.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "comparison" ? "bg-black text-white shadow-xs" : "text-neutral-700 hover:text-black"
            }`}
          >
            Shopersite vs Shopify
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("playbooks")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "playbooks" ? "bg-black text-white shadow-xs" : "text-neutral-700 hover:text-black"
            }`}
          >
            Marketing Playbooks
          </button>
        </div>
      </div>

      {activeTab === "comparison" ? (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 w-1/3">Platform Capability</th>
                  <th className="py-3 px-4 w-1/3 bg-neutral-50 text-neutral-950 font-bold border-x border-neutral-200">
                    Shopersite
                  </th>
                  <th className="py-3 px-4 w-1/6 text-neutral-600">Shopify</th>
                  <th className="py-3 px-4 w-1/6 text-neutral-600">WooCommerce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {PLATFORM_COMPARISON.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="py-3.5 px-4 font-semibold text-neutral-950">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-4 bg-neutral-50/80 font-bold text-neutral-950 border-x border-neutral-200">
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{row.shopersite}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600">{row.shopify}</td>
                    <td className="py-3.5 px-4 text-neutral-600">{row.woocommerce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>RBI Compliance Guarantee:</strong> Shopersite operates with zero aggregator fund pooling. Buyer payments route directly to your own UPI ID or Cashfree/Razorpay account.
              </span>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-1 font-bold text-black hover:underline shrink-0"
            >
              Start Free Store
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Playbook 01</span>
            <h3 className="text-base font-bold text-neutral-950">The Instagram-to-D2C Scaling Blueprint</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              How to transition an Instagram business profile from answering 100+ manual DMs per day to an automated mobile store where followers check out in 60 seconds.
            </p>
            <div className="space-y-1.5 text-xs text-neutral-700 pt-2 border-t border-neutral-200">
              <p>• Setting up Link-in-bio with category deep links</p>
              <p>• Highlighting "How to Order in 60s" stories</p>
              <p>• Using video reels to showcase textile quality & sizing</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Playbook 02</span>
            <h3 className="text-base font-bold text-neutral-950">The WhatsApp High-Retention Community</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              How to cultivate a private WhatsApp broadcast channel of 500 loyal buyers who generate 70% of your monthly repeat revenue without paid ads.
            </p>
            <div className="space-y-1.5 text-xs text-neutral-700 pt-2 border-t border-neutral-200">
              <p>• Optimal broadcast frequency (never more than once in 10 days)</p>
              <p>• Private VIP drops with 24h early access</p>
              <p>• Direct customer feedback loops & bespoke custom orders</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

