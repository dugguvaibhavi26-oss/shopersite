"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  X,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  CreditCard,
  ChevronDown,
  Layers,
  Store,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SiteFooter, SiteHeader } from "@/components/home/site-chrome";
import { usePlatformSettings } from "@/lib/use-platform-settings";
import {
  PLATFORM_PLANS,
  calculatePlanPrice,
  planDiscountPercent,
  BILLING_CYCLES,
  type BillingCycle,
  type PlanId,
  priceAfterTrial,
  trialLength,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

interface ComparisonFeature {
  name: string;
  category: string;
  tooltip?: string;
  free: string | boolean;
  starter: string | boolean;
  pro: string | boolean;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  // Core Store & Products
  {
    category: "Store & Inventory",
    name: "Platform commission",
    tooltip: "Shopersite takes zero percentage from your revenue.",
    free: "0% forever",
    starter: "0% forever",
    pro: "0% forever",
  },
  {
    category: "Store & Inventory",
    name: "Product listing limit",
    tooltip: "Maximum number of active products in your catalog.",
    free: "5 products",
    starter: "100 products",
    pro: "Unlimited",
  },
  {
    category: "Store & Inventory",
    name: "Categories & Collections",
    free: "Up to 3",
    starter: "Unlimited",
    pro: "Unlimited",
  },
  {
    category: "Store & Inventory",
    name: "Product variants (Sizes, Colors)",
    free: true,
    starter: true,
    pro: true,
  },
  {
    category: "Store & Inventory",
    name: "Inventory tracking & stock alerts",
    free: true,
    starter: true,
    pro: true,
  },

  // Payments & Checkout
  {
    category: "Payments & Settlements",
    name: "Direct UPI payments (GPay, PhonePe, Paytm)",
    tooltip: "Payments settle instantly into your own UPI ID.",
    free: true,
    starter: true,
    pro: true,
  },
  {
    category: "Payments & Settlements",
    name: "Payment gateway processing fee",
    tooltip: "Zero platform fee; standard payment gateway fees only if enabled.",
    free: "₹0 fee",
    starter: "₹0 fee",
    pro: "₹0 fee",
  },
  {
    category: "Payments & Settlements",
    name: "Cash on Delivery (COD) support",
    free: true,
    starter: true,
    pro: true,
  },
  {
    category: "Payments & Settlements",
    name: "Automated WhatsApp payment verification",
    free: false,
    starter: true,
    pro: true,
  },

  // Design & Branding
  {
    category: "Design & Storefront",
    name: "Designer Themes Access",
    tooltip: "Pick from 37 curated, high-converting storefront aesthetics.",
    free: "Free starter themes",
    starter: "All 37 themes",
    pro: "All 37 themes + Custom",
  },
  {
    category: "Design & Storefront",
    name: "Custom domain connection",
    tooltip: "Connect your own www.yourbrand.com domain.",
    free: "storename.shopersite.in",
    starter: "storename.shopersite.in",
    pro: "Custom domain included",
  },
  {
    category: "Design & Storefront",
    name: "Remove Shopersite branding",
    free: false,
    starter: false,
    pro: true,
  },

  // Marketing & Growth
  {
    category: "Marketing & Operations",
    name: "Discount coupons & promo codes",
    free: false,
    starter: true,
    pro: true,
  },
  {
    category: "Marketing & Operations",
    name: "WhatsApp 1-click customer checkout",
    free: true,
    starter: true,
    pro: true,
  },
  {
    category: "Marketing & Operations",
    name: "Customer CRM & Order history",
    free: "Basic",
    starter: "Full CRM",
    pro: "Full CRM + Export",
  },
  {
    category: "Marketing & Operations",
    name: "Sales reports & analytics",
    free: "7-day view",
    starter: "All-time + Trends",
    pro: "Advanced + CSV export",
  },
  {
    category: "Marketing & Operations",
    name: "Support priority",
    free: "Standard email",
    starter: "Priority WhatsApp",
    pro: "Dedicated 1-on-1 manager",
  },
];

const PRICING_FAQS = [
  {
    q: "Are there really no transaction fees or commissions on sales?",
    a: "Yes, exactly 0%. Whether you sell ₹1,000 or ₹10,00,000, Shopersite never takes a percentage cut from your hard-earned revenue. When customers pay via direct UPI, 100% of the money goes directly into your bank account.",
  },
  {
    q: "How do customer payments reach my bank account?",
    a: "During checkout, customers can pay instantly via UPI (Google Pay, PhonePe, Paytm, BHIM) straight to your UPI ID, or choose Cash on Delivery. Settlements are instant with zero holding period because payments go directly to you.",
  },
  {
    q: "Can I start on the Free plan and upgrade later?",
    a: "Yes! You can start on the ₹0 Free plan with no credit card required. As your order volume increases, you can upgrade to Starter or Pro at any time with a single click. Any unused time on your current billing period is credited automatically.",
  },
  {
    q: "Can I connect my own custom domain (e.g., www.mybrand.com)?",
    a: "Yes! The Pro plan includes full custom domain support with automated SSL certificate provisioning. On Free and Starter plans, your shop lives on a clean branded subdomain like storename.shopersite.in.",
  },
  {
    q: "What payment methods are supported for subscription billing?",
    a: "You can pay for your Starter or Pro plan using any Indian UPI app, Debit Cards, Credit Cards, or Net Banking. We support Monthly, Quarterly (save 5%), and Yearly (save 10%) billing.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, absolutely. There are no lock-in contracts. You can cancel or pause your subscription from your dashboard at any time, and you'll retain full access until the end of your prepaid period.",
  },
];

export default function PricingPage() {
  usePlatformSettings();
  const { user, signOut } = useAuth();
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("monthly");
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);

  // Group comparison features by category
  const categories = Array.from(new Set(COMPARISON_FEATURES.map((f) => f.category)));

  return (
    <div className="home-sans flex min-h-screen flex-col overflow-x-clip bg-neutral-50 font-[Inter,sans-serif] text-neutral-950">
      <SiteHeader user={!!user} onSignOut={() => signOut()} />

      <main className="flex-1 pb-24">
        {/* HERO SECTION */}
        <div className="pt-24 pb-16 sm:pt-32 sm:pb-20 border-b border-neutral-200/80 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Transparent Pricing • Zero Commission
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950">
              Run your entire store with one transparent plan.
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              No hidden fees, no percentage cuts, no surprise charges. Keep 100% of your sales with direct UPI settlements.
            </p>

            {/* 3-WAY BILLING CYCLE TOGGLE */}
            <div className="pt-6 flex flex-col items-center justify-center gap-2">
              <div className="inline-flex flex-wrap items-center justify-center rounded-2xl bg-neutral-100 p-1.5 text-xs font-semibold gap-1 border border-neutral-200 shadow-2xs">
                {BILLING_CYCLES.map((cycle) => {
                  const isSelected = billingCycle === cycle.id;
                  return (
                    <button
                      key={cycle.id}
                      type="button"
                      onClick={() => setBillingCycle(cycle.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                        isSelected
                          ? "bg-black text-white shadow-xs"
                          : "text-neutral-600 hover:text-black hover:bg-neutral-200/50"
                      )}
                    >
                      <span>{cycle.label}</span>
                      {cycle.tag && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                            isSelected
                              ? "bg-amber-400 text-black"
                              : cycle.id === "yearly"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          )}
                        >
                          {cycle.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                {billingCycle === "quarterly" && "Save 5% on 3-month commitments. Billed quarterly."}
                {billingCycle === "yearly" && "Save 10% on annual commitments. Billed annually."}
                {billingCycle === "monthly" && "Standard month-to-month billing. Cancel anytime."}
              </p>
            </div>
          </div>
        </div>

        {/* PRICING CARDS GRID */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {Object.values(PLATFORM_PLANS).map((plan) => {
              const hi = !!plan.highlight;
              const pricing = calculatePlanPrice(plan.id, billingCycle);
              const isFree = plan.priceMonthly === 0;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-[24px] p-7 sm:p-9 flex flex-col justify-between transition-all duration-300",
                    hi
                      ? "bg-neutral-950 text-white shadow-2xl ring-2 ring-black"
                      : "bg-white border border-neutral-200/90 text-neutral-950 hover:border-black hover:shadow-xl shadow-xs"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight">{plan.name}</h3>
                      {hi ? (
                        <span className="rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider px-3 py-1 shadow-xs">
                          Most Popular
                        </span>
                      ) : pricing.discountPercent > 0 ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1">
                          Save {pricing.discountPercent}%
                        </span>
                      ) : null}
                    </div>

                    <p className={cn("mt-2 text-xs sm:text-sm leading-relaxed", hi ? "text-neutral-400" : "text-neutral-600")}>
                      {plan.description}
                    </p>

                    <div className="mt-6 pt-6 border-t border-neutral-200/40">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-4xl sm:text-5xl font-black tracking-tighter">
                          {isFree ? "₹0" : pricing.formattedMonthly}
                        </span>
                        {billingCycle === "monthly" && plan.originalPriceFormatted && (
                          <span className={cn("text-base line-through", hi ? "text-neutral-500" : "text-neutral-400")}>
                            {plan.originalPriceFormatted.split(" ")[0]}
                          </span>
                        )}
                        <span className={cn("text-xs font-semibold", hi ? "text-neutral-400" : "text-neutral-500")}>
                          / month
                        </span>
                      </div>

                      {!isFree && billingCycle === "monthly" && (plan.trialDays || plan.introPriceMonthly) ? (
                        <p className={cn("mt-1.5 text-xs font-bold", hi ? "text-amber-300" : "text-emerald-700")}>
                          {plan.trialDays ? `${trialLength(plan.trialDays)} free, then ` : ""}
                          {priceAfterTrial(plan)}
                        </p>
                      ) : null}
                      {!isFree && billingCycle !== "monthly" && (
                        <p className={cn("mt-1.5 text-xs font-bold", hi ? "text-amber-300" : "text-emerald-700")}>
                          {pricing.billingText}
                        </p>
                      )}

                      {billingCycle === "monthly" && planDiscountPercent(plan) > 0 && (
                        <span className="inline-block mt-2 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                          Save {planDiscountPercent(plan)}% · launch offer
                        </span>
                      )}
                    </div>

                    <ul className={cn("mt-8 pt-6 space-y-3.5 text-xs sm:text-sm border-t", hi ? "border-white/15" : "border-neutral-200")}>
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                          <span className={hi ? "text-neutral-300" : "text-neutral-700"}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6">
                    <Link
                      href={plan.id === "free" ? "/register" : `/register?plan=${plan.id}&cycle=${billingCycle}`}
                      className={cn(
                        "w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold text-center block transition-all shadow-xs active:scale-[0.98]",
                        hi
                          ? "bg-white text-black hover:bg-neutral-100"
                          : "bg-black text-white hover:bg-neutral-800"
                      )}
                    >
                      {plan.id === "free" ? "Start Free Store" : `Choose ${plan.name}`}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAILED COMPARISON TABLE */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-32">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
              Detailed Plan Feature Comparison
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto">
              Compare features side by side to choose the best tier for your brand.
            </p>
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70">
                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-neutral-500 w-2/5">
                      Feature
                    </th>
                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-neutral-900 w-1/5">
                      Free (₹0)
                    </th>
                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-neutral-900 w-1/5">
                      Starter (₹399/mo)
                    </th>
                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-neutral-900 w-1/5">
                      Pro (₹899/mo)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {categories.map((category) => (
                    <React.Fragment key={category}>
                      <tr className="bg-neutral-100/60 font-bold text-neutral-900">
                        <td colSpan={4} className="py-3 px-6 text-xs uppercase tracking-wider">
                          {category}
                        </td>
                      </tr>
                      {COMPARISON_FEATURES.filter((f) => f.category === category).map((feat) => (
                        <tr key={feat.name} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3.5 px-6 text-xs font-medium text-neutral-800">
                            <span>{feat.name}</span>
                            {feat.tooltip && (
                              <span className="block text-[11px] text-neutral-400 mt-0.5">
                                {feat.tooltip}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-xs font-semibold text-neutral-700">
                            {typeof feat.free === "boolean" ? (
                              feat.free ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <X className="w-4 h-4 text-neutral-300" />
                              )
                            ) : (
                              <span>{feat.free}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-xs font-semibold text-neutral-700">
                            {typeof feat.starter === "boolean" ? (
                              feat.starter ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <X className="w-4 h-4 text-neutral-300" />
                              )
                            ) : (
                              <span>{feat.starter}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-xs font-bold text-neutral-950">
                            {typeof feat.pro === "boolean" ? (
                              feat.pro ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <X className="w-4 h-4 text-neutral-300" />
                              )
                            ) : (
                              <span>{feat.pro}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PRICING FAQS */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-24 sm:pt-32">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto">
              Everything you need to know about billing, UPI settlements, and plan features.
            </p>
          </div>

          <div className="space-y-3">
            {PRICING_FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-neutral-900 hover:text-black"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0",
                        isOpen ? "rotate-180 text-black" : ""
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-20">
          <div className="rounded-[28px] bg-neutral-950 text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5" />
                Start In 60 Seconds
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Ready to start selling online with 0% commission?
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                Join thousands of Indian social creators and brands selling directly to their buyers on Instagram and WhatsApp.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-100 transition-all shadow-lg inline-flex items-center gap-2"
                >
                  Start Selling for Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/themes"
                  className="px-5 py-3.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 border border-white/15 transition-colors"
                >
                  Browse 37 Themes
                </Link>
              </div>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none hidden lg:block" />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

