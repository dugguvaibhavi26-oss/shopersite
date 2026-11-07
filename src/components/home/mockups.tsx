"use client";

import * as React from "react";
import { siteConfig } from "@/lib/config/site";
import { Check, Search, ShoppingBag, MessageCircle, Package, Truck, TrendingUp, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export const unsplash = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const MOCK_PRODUCTS = [
  { name: "Classic Watch", price: "₹4,999", img: "photo-1523275335684-37898b6baf30" },
  { name: "Studio Headphones", price: "₹3,499", img: "photo-1505740420928-5e560c06d30e" },
  { name: "Glow Skincare Set", price: "₹1,299", img: "photo-1556228720-195a672e8a03" },
  { name: "Smart Watch", price: "₹6,999", img: "photo-1546868871-7041f2a55e12" },
];

/**
 * Browser-window mockup of a live storefront.
 * `autoplay` walks a highlight across the products (and fills the bag) so the
 * hover effects play on touch screens too.
 */
export function StoreMockup({ className, autoplay = false }: { className?: string; autoplay?: boolean }) {
  const [active, setActive] = React.useState(-1);
  const [bag, setBag] = React.useState(0);

  React.useEffect(() => {
    if (!autoplay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % MOCK_PRODUCTS.length);
      setBag((b) => (b + 1) % 10);
    }, 2200);
    return () => clearInterval(id);
  }, [autoplay]);

  return (
    <div className={cn("rounded-[11px] bg-white border border-neutral-200 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] overflow-hidden", className)}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 h-10 border-b border-neutral-200 bg-neutral-50">
        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
        <div className="ml-3 flex-1 max-w-xs h-6 rounded-[4px] bg-white border border-neutral-200 text-[11px] text-neutral-500 flex items-center px-2.5 truncate">
          lume.{siteConfig.domain}
        </div>
      </div>

      {/* Store header */}
      <div className="flex items-center justify-between px-5 sm:px-7 h-12 border-b border-neutral-100">
        <span className="font-bold tracking-tight text-sm">LUME</span>
        <div className="hidden sm:flex gap-5 text-[11px] text-neutral-500">
          <span>New In</span>
          <span>Accessories</span>
          <span>Beauty</span>
          <span>Sale</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-700">
          <Search className="w-3.5 h-3.5" />
          <span className="relative">
            <ShoppingBag className="w-3.5 h-3.5" />
            {bag > 0 && (
              <span
                key={bag}
                className="animate-pill-pop absolute -top-2 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center"
              >
                {bag}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Store hero banner */}
      <div className="group/banner relative h-36 sm:h-48 overflow-hidden cursor-pointer">
        <img
          src={unsplash("photo-1490481651871-ab68de25d43d", 1200)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover/banner:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent transition-colors duration-500 group-hover/banner:from-black/75" />
        <div className="relative h-full flex flex-col justify-center px-5 sm:px-7 text-white">
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">Autumn Edit</span>
          <span className="text-xl sm:text-3xl font-bold tracking-tight mt-1 transition-transform duration-500 group-hover/banner:translate-x-1">The New Season</span>
          <span className="mt-3 inline-flex w-fit text-[10px] font-semibold bg-white text-black px-3 py-1.5 rounded-[7px] transition-all duration-300 hover:bg-black hover:text-white hover:scale-105">
            Shop now
          </span>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6">
        {MOCK_PRODUCTS.map((p, i) => (
          <div
            key={p.name}
            data-on={i === active}
            className="group/prod cursor-pointer rounded-[8px] p-1.5 -m-1.5 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)] data-[on=true]:-translate-y-1.5 data-[on=true]:bg-white data-[on=true]:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]"
          >
            <div className="relative aspect-[4/5] rounded-[6px] overflow-hidden bg-neutral-100">
              <img
                src={unsplash(p.img, 400)}
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/prod:scale-110 group-data-[on=true]/prod:scale-110"
                loading="lazy"
              />
              <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 scale-75 transition-all duration-300 group-hover/prod:opacity-100 group-hover/prod:scale-100 group-data-[on=true]/prod:opacity-100 group-data-[on=true]/prod:scale-100 hover:bg-black hover:text-white">
                <Heart className="w-3.5 h-3.5" />
              </span>
              <span className="absolute inset-x-2 bottom-2 h-8 rounded-[6px] bg-black text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 translate-y-[140%] transition-transform duration-300 ease-out group-hover/prod:translate-y-0 group-data-[on=true]/prod:translate-y-0">
                <ShoppingBag className="w-3 h-3" />
                Add to bag
              </span>
            </div>
            <div className="mt-2 text-[11px] font-medium text-neutral-900 truncate underline-offset-2 group-hover/prod:underline group-data-[on=true]/prod:underline">{p.name}</div>
            <div className="text-[11px] text-neutral-500">{p.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Floating "payment received" notification card. */
export function PaymentCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[11px] bg-white border border-neutral-200 shadow-xl p-4 w-60 transition-[scale,box-shadow] duration-300 hover:scale-105 hover:shadow-2xl", className)}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-neutral-500">UPI payment received</div>
          <div className="text-lg font-bold tracking-tight">₹4,999.00</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between text-[11px] text-neutral-500">
        <span>Direct to your bank</span>
        <span className="font-semibold text-black">0% fee</span>
      </div>
    </div>
  );
}

/** Floating "new order" card. */
export function OrderCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[11px] bg-black text-white shadow-xl p-4 w-64 transition-[scale,box-shadow] duration-300 hover:scale-105 hover:shadow-2xl", className)}>
      <div className="flex items-center justify-between text-[11px] text-neutral-400">
        <span>New order #1042</span>
        <span>just now</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <img src={unsplash(MOCK_PRODUCTS[1].img, 120)} alt="" className="w-11 h-11 rounded-[6px] object-cover" />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{MOCK_PRODUCTS[1].name}</div>
          <div className="text-[11px] text-neutral-400">Qty 1 · Mumbai, MH</div>
        </div>
        <div className="ml-auto text-sm font-bold">{MOCK_PRODUCTS[1].price}</div>
      </div>
    </div>
  );
}

/** Small sales chart card. */
export function SalesChart({ className, dark = false }: { className?: string; dark?: boolean }) {
  const bars = [32, 45, 38, 56, 50, 68, 62, 80, 74, 92];
  return (
    <div
      className={cn(
        "rounded-[11px] p-5 w-full",
        dark ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200 shadow-xl",
        className
      )}
    >
      <div className={cn("text-[11px]", dark ? "text-neutral-400" : "text-neutral-500")}>Total sales · this month</div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight">₹1,84,250</div>
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          <TrendingUp className="w-3.5 h-3.5" />
          +24%
        </div>
      </div>
      <div className="mt-4 h-20 flex items-end gap-1.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-[3px]", dark ? "bg-white" : "bg-black", i < bars.length - 1 && "opacity-25")}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** UPI QR checkout panel. */
export function UpiMockup({ className }: { className?: string }) {
  // Deterministic pseudo-QR pattern
  const cells = Array.from({ length: 121 }, (_, i) => ((i * 7919) % 13) % 3 !== 0);
  return (
    <div className={cn("rounded-[11px] bg-white border border-neutral-200 shadow-xl p-5 w-64", className)}>
      <div className="text-[11px] text-neutral-500">Pay with any UPI app</div>
      <div className="text-xl font-bold tracking-tight">₹1,299.00</div>
      <div className="mt-4 mx-auto w-36 h-36 grid grid-cols-11 gap-[2px] p-2 border border-neutral-200 rounded-[6px]">
        {cells.map((on, i) => (
          <span key={i} className={on ? "bg-black rounded-[1px]" : ""} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[10px] font-medium text-neutral-600">
        {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
          <span key={app} className="px-2 py-1 rounded-[7px] bg-neutral-100">{app}</span>
        ))}
      </div>
    </div>
  );
}

/** WhatsApp-style order chat. */
export function ChatMockup({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[11px] bg-white border border-neutral-200 shadow-xl p-4 w-72 space-y-2.5", className)}>
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs font-semibold">Order updates</span>
      </div>
      <div className="max-w-[85%] rounded-[11px] rounded-tl-sm bg-neutral-100 px-3 py-2 text-[11px] text-neutral-800">
        Hi! I&apos;d like to order the Classic Watch 🙌
      </div>
      <div className="ml-auto max-w-[85%] rounded-[11px] rounded-tr-sm bg-black text-white px-3 py-2 text-[11px]">
        Order #1042 confirmed ✓ Pay via UPI at checkout.
      </div>
      <div className="ml-auto max-w-[85%] rounded-[11px] rounded-tr-sm bg-black text-white px-3 py-2 text-[11px]">
        Shipped! Track it here: /orders/a8f…
      </div>
    </div>
  );
}

/** Order pipeline list for the dashboard visual. */
export function OrdersMockup({ className }: { className?: string }) {
  const rows = [
    { id: "#1042", name: "Ananya R.", amount: "₹3,499", status: "Paid", icon: Check },
    { id: "#1041", name: "Rahul M.", amount: "₹1,299", status: "Shipped", icon: Truck },
    { id: "#1040", name: "Priya S.", amount: "₹4,999", status: "Packed", icon: Package },
    { id: "#1039", name: "Karan D.", amount: "₹6,999", status: "Delivered", icon: Check },
  ];
  return (
    <div className={cn("rounded-[11px] bg-white border border-neutral-200 shadow-xl overflow-hidden w-full", className)}>
      <div className="flex items-center justify-between px-5 h-12 border-b border-neutral-100">
        <span className="text-sm font-semibold">Orders</span>
        <span className="text-[11px] text-neutral-500">Today</span>
      </div>
      {rows.map(({ id, name, amount, status, icon: Icon }) => (
        <div key={id} className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100 last:border-0 text-xs">
          <span className="font-mono text-neutral-500 w-12">{id}</span>
          <span className="flex-1 font-medium truncate">{name}</span>
          <span className="font-semibold">{amount}</span>
          <span className="inline-flex items-center gap-1 rounded-[7px] bg-neutral-100 px-2 py-1 text-[10px] font-semibold w-[84px] justify-center">
            <Icon className="w-3 h-3" />
            {status}
          </span>
        </div>
      ))}
    </div>
  );
}
