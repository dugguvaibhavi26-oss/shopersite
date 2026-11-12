"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import { ShopperLogo, ShopperWordmark } from "@/components/brand/shopper-logo";
import { BookOpen, ChevronDown, Compass, FileText, LayoutGrid, LifeBuoy, Megaphone, Menu, MessageCircle, Package, Palette, QrCode, Store, X } from "lucide-react";

/**
 * The marketing site's floating header and dark footer, shared by the homepage and the theme marketplace. Links
 * point at the homepage sections ("/#pricing") so they work from any page.
 */

const PRODUCT_MENU = [
  { icon: Store, title: "Free online store", text: "Launch a real store on the ₹0 plan", href: "/free-online-store-builder" },
  { icon: Package, title: "Ecommerce website", text: "Cart, checkout, orders and stock", href: "/free-ecommerce-website-builder" },
  { icon: Megaphone, title: "For Instagram & WhatsApp", text: "Turn DMs into orders you can track", href: "/instagram-store-builder" },
  { icon: QrCode, title: "Made for India", text: "COD, UPI, GST and Indian couriers", href: "/online-store-builder-india" },
];

const RESOURCES_MENU = [
  { icon: Compass, title: "Explore", text: "Guides, tools and a festival calendar", href: "/explore" },
  { icon: BookOpen, title: "Theme marketplace", text: "Browse every storefront design", href: "/themes" },
  { icon: FileText, title: "Documentation", text: "Setup guides, payments & integrations", href: "/docs" },
  { icon: LifeBuoy, title: "Help & FAQ", text: "Answers to common questions", href: "/#faq" },
];

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function SiteHeader({ user, onSignOut }: { user: boolean; onSignOut: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // Floating glass bar; it tightens and gains a stronger shadow once you scroll
    <header className="sticky top-0 z-50 px-8 pt-3 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto relative mx-auto rounded-[17px] border backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled || mobileOpen
            ? "max-w-5xl bg-white/85 border-neutral-200/80 shadow-[0_14px_40px_-14px_rgba(0,0,0,0.3)]"
            : "max-w-7xl bg-white/60 border-white/70 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.18)]"
        )}
      >
      <div className="px-3 sm:px-4 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="group/logo flex items-center">
            <ShopperLogo
              className="text-[20px]"
              markClassName="origin-bottom transition-transform duration-500 group-hover/logo:-rotate-12 group-hover/logo:scale-110"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-neutral-700">
            <NavDropdown label="Product" items={PRODUCT_MENU} />
            <Link href="/themes" className="px-3 py-2 rounded-[14px] hover:bg-neutral-100 transition-colors">Themes</Link>
            <Link href="/pricing" className="px-3 py-2 rounded-[14px] hover:bg-neutral-100 transition-colors">Pricing</Link>
            <NavDropdown label="Resources" items={RESOURCES_MENU} />
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-black"
              >
                Sign out
              </button>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-[14px] bg-black text-white text-sm font-semibold hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
              >
                My Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-black">
                Log in
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-[14px] bg-black text-white text-sm font-semibold hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
              >
                Start for free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <span key={mobileOpen ? "x" : "m"} className="animate-in zoom-in-95">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </span>
        </button>
      </div>

      {/* Reading progress, drawn along the bar's bottom edge */}
      <div aria-hidden className="absolute left-4 right-4 -bottom-px h-[2px] rounded-full overflow-hidden">
        <div
          className="scroll-progress h-full w-full bg-black"
          style={{ "--progress": progress } as React.CSSProperties}
        />
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-in slide-in-from-top-2 lg:hidden border-t border-neutral-200 max-h-[calc(100svh-6rem)] overflow-y-auto rounded-b-[17px]">
          <div className="px-5 pt-2 pb-4">
            {[
              { label: "Product", items: PRODUCT_MENU.map(({ title, href }) => ({ title, href })) },
              { label: "Resources", items: [...RESOURCES_MENU.map(({ title, href }) => ({ title, href })), { title: "Pricing", href: "/pricing" }] },
            ].map((group, g) => (
              <div key={group.label} className="pt-4">
                <div className="pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{group.label}</div>
                {group.items.map(({ title, href }, i) => (
                  <a
                    key={title}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    style={{ animationDelay: `${(g * 4 + i) * 35}ms` }}
                    className="hero-rise group/m flex items-center justify-between border-b border-neutral-100 py-2.5 text-[17px] font-medium tracking-[-0.01em] text-neutral-900 last:border-b-0 active:text-neutral-500"
                  >
                    {title}
                    <span aria-hidden className="text-neutral-300 transition-transform group-active/m:translate-x-1">→</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="px-5 pb-5 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <button type="button" onClick={onSignOut} className="py-3 rounded-[14px] border border-neutral-300 text-sm font-semibold">
                  Sign out
                </button>
                <Link href="/dashboard" className="py-3 rounded-[14px] bg-black text-white text-sm font-semibold text-center">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="py-3 rounded-[14px] border border-neutral-300 text-sm font-semibold text-center">
                  Log in
                </Link>
                <Link href="/register" className="py-3 rounded-[14px] bg-black text-white text-sm font-semibold text-center">
                  Start for free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </header>
  );
}

function NavDropdown({ label, items }: { label: string; items: typeof PRODUCT_MENU }) {
  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-2 rounded-[14px] hover:bg-neutral-100 transition-colors"
      >
        {label}
        <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
      </button>
      <div className="absolute left-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
        <div className="w-80 rounded-[11px] bg-white border border-neutral-200 shadow-xl p-2">
          {items.map(({ icon: Icon, title, text, href }) => (
            <a key={title} href={href} className="group/item flex gap-3 p-3 rounded-[8px] hover:bg-neutral-100 transition-colors">
              <span className="w-9 h-9 rounded-[6px] bg-neutral-100 flex items-center justify-center shrink-0 transition-all duration-300 group-hover/item:bg-black group-hover/item:text-white group-hover/item:scale-105">
                <Icon className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-black">{title}</span>
                <span className="block text-xs text-neutral-500 mt-0.5">{text}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

const FOOTER_COLUMNS = [
  {
    title: "Sell online",
    links: [
      { label: "Free online store builder", href: "/free-online-store-builder" },
      { label: "Free ecommerce website builder", href: "/free-ecommerce-website-builder" },
      { label: "Build a store for free", href: "/build-online-store-for-free" },
      { label: "Online store builder India", href: "/online-store-builder-india" },
      { label: "For Instagram sellers", href: "/instagram-store-builder" },
      { label: "For WhatsApp sellers", href: "/whatsapp-selling-website" },
      { label: "For small businesses", href: "/website-builder-for-small-business" },
      { label: "Free business website", href: "/free-website-for-small-business" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "All Themes", href: "/themes" },
      { label: "On the homepage", href: "/#themes" },
      { label: "Guides for sellers", href: "/explore" },
      { label: "Seller tools", href: "/explore/tools" },
      { label: "Festival calendar", href: "/explore/festival-calendar" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { label: "Start for free", href: "/register" },
      { label: "Log in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "About Shopersite", href: "/about" },
      { label: "Documentation", href: "/docs" },
      { label: "FAQ", href: "/#faq" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Contact us", href: "/legal/contact" },
      { label: "Grievance redressal", href: "/legal/grievance" },
      { label: "Report a shop", href: "/legal/acceptable-use#report" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Refunds & Cancellations", href: "/legal/refunds" },
      { label: "Payments", href: "/legal/payments" },
      { label: "Buyer Terms", href: "/legal/buyer-terms" },
      { label: "Delete account", href: "/delete-account" },
      { label: "All policies", href: "/legal" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-10">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center text-white">
              <ShopperLogo className="text-[22px]" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              The store builder for social sellers. Launch, sell and get paid directly — with zero commission.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="link-underline hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-xs">
          <span>© {new Date().getFullYear()} Roxten Studios Pvt Ltd. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" />
            <span>{siteConfig.domain}</span>
            <span className="mx-2">·</span>
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Made for social sellers in India</span>
          </div>
        </div>
      </div>

      {/* Oversized wordmark */}
      <div className="overflow-hidden select-none" aria-hidden>
        <ShopperWordmark className="mx-auto -mb-[2vw] block h-auto w-[92vw] text-white/[0.06]" />
      </div>
    </footer>
  );
}
