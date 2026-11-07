"use client";

import * as React from "react";
import { ArrowRight, CreditCard, LayoutDashboard, Menu, Package, ShoppingBag, Tag, X } from "lucide-react";

/** A notice from the dashboard's bell: an order, a stock alert or a plan payment update. */
export type DockNotice = {
  id: string;
  type: string;
  title: string;
  /** the one-liner shown in the floating chip, e.g. "New order · ₹1,240" */
  short?: string;
  /** when it happened (ms); older events never pop a chip */
  at?: number;
  unread: boolean;
};

type DockTab = "overview" | "orders" | "discounts" | "products" | "billing";

// where tapping a chip takes you, and which icon it wears
const NOTICE_TAB: Record<string, DockTab> = { order: "orders", stock: "products", plan: "billing" };
const NOTICE_ICON: Record<string, React.ComponentType<{ className?: string }>> = { order: ShoppingBag, stock: Package, plan: CreditCard };

// notices that arrive while the store is still syncing are old news, not events
const SETTLE_MS = 8000;
const FRESH_MS = 30 * 60 * 1000;
const CHIP_MS = 5000;

const dot = "absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-black";

/**
 * The phone dashboard's bottom bar: Home, Orders, Discounts and Menu, with a small red dot on any section that has
 * something unseen (Menu stands in for the pages inside it). When something new happens, say an order comes in, a
 * chip springs up above the bar for a few seconds; tapping it opens that page.
 */
export function MobileDock({
  storeKey,
  active,
  onSelect,
  menuOpen,
  onToggleMenu,
  notices,
  onSeen,
}: {
  storeKey: string;
  active: string;
  onSelect: (tab: DockTab) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  notices: DockNotice[];
  onSeen: (ids: string[]) => void;
}) {
  const unread = notices.filter((n) => n.unread);
  const ordersDot = unread.some((n) => n.type === "order");
  const menuDot = unread.some((n) => n.type === "stock" || n.type === "plan");

  // opening a section counts as seeing its notices, so its dot clears
  const seenRef = React.useRef(onSeen);
  seenRef.current = onSeen;
  const unseenHere = unread.filter((n) => NOTICE_TAB[n.type] === active && n.type !== "plan").map((n) => n.id);
  const unseenKey = unseenHere.join("|");
  React.useEffect(() => {
    if (unseenKey) seenRef.current(unseenKey.split("|"));
  }, [unseenKey]);

  // the chip: shows the newest notice that appeared since the dashboard opened
  const [chip, setChip] = React.useState<DockNotice | null>(null);
  const [chipOn, setChipOn] = React.useState(false);
  const known = React.useRef<Set<string>>(new Set());
  const since = React.useRef(0);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    known.current = new Set();
    since.current = Date.now();
    setChipOn(false);
  }, [storeKey]);
  const unreadKey = unread.map((n) => n.id).join("|");
  React.useEffect(() => {
    const settling = Date.now() - since.current < SETTLE_MS;
    const fresh = unread.find((n) => !known.current.has(n.id) && (n.at === undefined || Date.now() - n.at < FRESH_MS));
    notices.forEach((n) => known.current.add(n.id));
    if (settling || !fresh) return;
    setChip(fresh);
    setChipOn(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setChipOn(false), CHIP_MS);
    // only a change in the unread set matters here
  }, [unreadKey]);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const tab = (on: boolean) =>
    `relative flex flex-col items-center gap-1 py-1 px-3 rounded-full transition-all ${on ? "text-white font-bold" : "text-neutral-400 hover:text-neutral-200"}`;
  const ChipIcon = (chip && NOTICE_ICON[chip.type]) || ShoppingBag;

  return (
    <div className="md:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] inset-x-0 mx-auto w-[92%] max-w-sm z-[60]">
      {/* the chip that springs up when something happens */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full mb-3 flex justify-center">
        <button
          type="button"
          tabIndex={chipOn ? 0 : -1}
          aria-hidden={!chipOn}
          onClick={() => {
            if (!chip) return;
            setChipOn(false);
            onSelect(NOTICE_TAB[chip.type] || "overview");
          }}
          className={`flex max-w-full items-center gap-2 rounded-[14px] bg-black py-1.5 pl-1.5 pr-1.5 text-[12px] font-medium text-white shadow-[0_14px_34px_-12px_rgba(0,0,0,0.55)] transition-[opacity,translate,scale] duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            chipOn && !menuOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-90 opacity-0"
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-white text-black">
            <ChipIcon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate">{chip?.short || chip?.title}</span>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
            <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      </div>

      <div className="bg-black text-white rounded-[18px] px-3 py-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] flex items-center justify-around">
        <button onClick={() => onSelect("overview")} className={tab(active === "overview")}>
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px]">Home</span>
        </button>

        <button onClick={() => onSelect("orders")} className={tab(active === "orders")} aria-label={ordersDot ? "Orders, new" : undefined}>
          <span className="relative">
            <ShoppingBag className="w-4 h-4" />
            {ordersDot && <span className={dot} />}
          </span>
          <span className="text-[10px]">Orders</span>
        </button>

        <button onClick={() => onSelect("discounts")} className={tab(active === "discounts")}>
          <Tag className="w-4 h-4" />
          <span className="text-[10px]">Discounts</span>
        </button>

        <button
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-full transition-all ${
            menuOpen ? "text-white font-bold" : "text-neutral-400 hover:text-white"
          }`}
        >
          <span className="relative w-4 h-4">
            <Menu className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${menuOpen ? "rotate-90 scale-0 opacity-0" : ""}`} />
            <X className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${menuOpen ? "" : "-rotate-90 scale-0 opacity-0"}`} />
            {menuDot && !menuOpen && <span className={dot} />}
          </span>
          <span className="text-[10px]">{menuOpen ? "Close" : "Menu"}</span>
        </button>
      </div>
    </div>
  );
}
