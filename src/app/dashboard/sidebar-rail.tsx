"use client";

import * as React from "react";
import { Bell, ChevronsUpDown, Lock, LogOut, UserRound } from "lucide-react";
import { ShopperMark, ShopperWordmark } from "@/components/brand/shopper-logo";

export type RailItem<T extends string> = {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** a count, "dot" (needs attention), "lock" (paid feature) or "active" (switched on) */
  badge?: number | "dot" | "lock" | "active";
};

export type RailGroup<T extends string> = { label: string; items: RailItem<T>[] };

/** Width of the desktop rail; the dashboard content is offset by the same amount. */
export const RAIL_WIDTH = 88;
/** Width of the rail while it's open on hover; the dashboard slides aside to make room (see `--dash-rail`). */
export const RAIL_OPEN_WIDTH = 236;

/**
 * The desktop dashboard rail, in black: the Shopersite mark at the top, the pages as icons (on hover the rail opens and
 * every name shows beside its icon), and notifications and the profile at the bottom. The profile opens a card with the store, plan usage and
 * Log out. Phones keep the top bar and bottom bar instead.
 */
export function SidebarRail<T extends string>({
  store,
  stores,
  onSwitchStore,
  groups,
  active,
  onSelect,
  onHome,
  hasUnread,
  onNotifications,
  notificationsActive,
  onProfile,
  productsUsed,
  productsMax,
  ownerName,
  ownerInitials,
  email,
  onSignOut,
  onUpgrade,
}: {
  store: { name: string; planId: string; subdomain: string };
  stores: { name: string; subdomain: string }[];
  onSwitchStore: (subdomain: string) => void;
  groups: RailGroup<T>[];
  active: T;
  onSelect: (id: T) => void;
  onHome: () => void;
  hasUnread: boolean;
  onNotifications: () => void;
  notificationsActive: boolean;
  onProfile: () => void;
  productsUsed: number;
  productsMax: number;
  ownerName: string;
  ownerInitials: string;
  email?: string | null;
  onSignOut: () => void;
  onUpgrade: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // close the profile card on a click outside it or Escape
  React.useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const unlimited = productsMax >= 9999;
  const share = unlimited ? Math.min(1, productsUsed / 100) : Math.min(1, productsUsed / Math.max(1, productsMax));

  // The rail opens over the content while the cursor is on it (or keyboard focus is inside), so every page name sits
  // beside its icon. A short delay each way keeps it from flickering when the cursor only passes over the edge.
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const hoverTimer = React.useRef<number | undefined>(undefined);
  const hoverTo = (next: boolean) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHovered(next), next ? 70 : 160);
  };
  React.useEffect(() => () => window.clearTimeout(hoverTimer.current), []);
  const open = hovered || focused || menuOpen;
  // the dashboard panel reads this to slide aside in step with the rail, without re-rendering the page on hover
  React.useEffect(() => {
    document.documentElement.style.setProperty("--dash-rail", `${open ? RAIL_OPEN_WIDTH : RAIL_WIDTH}px`);
  }, [open]);
  React.useEffect(() => () => void document.documentElement.style.removeProperty("--dash-rail"), []);

  const rowBtn = (on: boolean, ownHover = false) =>
    `group/nav relative z-[1] flex h-11 w-full shrink-0 items-center rounded-[14px] text-left [@media(max-height:900px)]:h-9 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/70 ${
      on ? "bg-white/[0.12] text-white" : `text-white/45 hover:text-white ${ownHover ? "hover:bg-white/[0.07]" : ""}`
    }`;
  // the icon leans a few pixels towards the cursor, like it's being pulled by a magnet
  const magnet = (e: React.PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.querySelector<HTMLElement>("[data-rail-icon]");
    if (!box || e.pointerType === "touch") return;
    const r = box.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-4, Math.min(4, v));
    box.style.setProperty("--mx", `${clamp(((e.clientX - r.left) / r.width - 0.5) * 8)}px`);
    box.style.setProperty("--my", `${clamp(((e.clientY - r.top) / r.height - 0.5) * 8)}px`);
  };
  const unmagnet = (e: React.PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.querySelector<HTMLElement>("[data-rail-icon]");
    box?.style.setProperty("--mx", "0px");
    box?.style.setProperty("--my", "0px");
  };
  const pull = { onPointerMove: magnet, onPointerLeave: unmagnet };
  const iconBox = "flex h-full w-11 shrink-0 items-center justify-center";
  const iconCls =
    "h-[19px] w-[19px] translate-x-[var(--mx,0px)] translate-y-[var(--my,0px)] transition-[translate,scale,rotate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/nav:scale-110";
  // names fade and slide in just after the rail starts to open, and leave at once when it closes
  const label =
    "flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap pr-3 text-[13.5px] font-medium tracking-[-0.005em] opacity-0 -translate-x-1.5 transition-[opacity,translate] duration-200 group-data-[open=true]/rail:translate-x-0 group-data-[open=true]/rail:opacity-100 group-data-[open=true]/rail:delay-100 group-data-[open=true]/rail:duration-[400ms]";
  const tag = "ml-auto shrink-0 text-[11px] font-medium text-white/45 tabular-nums";

  // a soft wash that slides from row to row as the cursor moves down the rail
  const [hoverPill, setHoverPill] = React.useState<{ top: number; height: number; on: boolean }>({ top: 0, height: 44, on: false });
  const bar = <span aria-hidden className="absolute -left-[22px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-white" />;

  return (
    <aside
      data-open={open}
      className="group/rail fixed inset-y-0 left-0 z-40 hidden flex-col rounded-r-[28px] bg-[#0a0a0a] px-[22px] py-6 text-white transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex [@media(max-height:900px)]:py-4"
      style={{ width: open ? RAIL_OPEN_WIDTH : RAIL_WIDTH }}
      aria-label="Dashboard"
      onPointerEnter={(e) => e.pointerType !== "touch" && hoverTo(true)}
      onPointerLeave={(e) => e.pointerType !== "touch" && hoverTo(false)}
      onFocus={(e) => e.target.matches(":focus-visible") && setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false)}
    >
      {/* the Shopersite mark (and name, when open) takes you back to the overview */}
      <button
        type="button"
        onClick={onHome}
        aria-label="Shopersite overview"
        className="flex h-12 w-full shrink-0 items-center rounded-[14px] text-left text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {/* the logo stays put: the bag sits on the same column as the page icons and the lettering only fades in */}
        <span className="flex h-12 w-11 shrink-0 items-center justify-center">
          <ShopperMark className="h-7 w-auto" />
        </span>
        <span className="-ml-1 flex min-w-0 flex-1 items-center overflow-hidden opacity-0 transition-opacity duration-200 group-data-[open=true]/rail:opacity-100 group-data-[open=true]/rail:delay-100 group-data-[open=true]/rail:duration-[400ms]">
          <ShopperWordmark className="h-7 w-auto shrink-0" />
        </span>
      </button>

      {/* pages, a hairline between Store, Marketing and Setup */}
      <nav
        className="relative my-6 flex w-full flex-1 flex-col justify-center gap-1 [@media(max-height:900px)]:my-3 [@media(max-height:900px)]:gap-0"
        onPointerOver={(e) => {
          const btn = (e.target as HTMLElement).closest("button");
          if (btn) setHoverPill({ top: btn.offsetTop, height: btn.offsetHeight, on: true });
        }}
        onPointerLeave={() => setHoverPill((p) => ({ ...p, on: false }))}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 z-0 rounded-[14px] bg-white/[0.08] transition-[top,height,opacity,scale] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${hoverPill.on ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
          style={{ top: hoverPill.top, height: hoverPill.height }}
        />
        {groups.map((group, gi) => (
          <React.Fragment key={group.label}>
            {gi > 0 && (
              <span
                aria-hidden
                className="mx-2.5 my-3 h-px w-6 shrink-0 bg-white/15 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[open=true]/rail:w-[calc(100%-20px)] [@media(max-height:900px)]:my-2"
              />
            )}
            {group.items.map(({ id, label: name, icon: Icon, badge }) => {
              const on = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(id)}
                  aria-label={name}
                  aria-current={on ? "page" : undefined}
                  className={rowBtn(on)}
                  {...pull}
                >
                  {on && bar}
                  <span data-rail-icon className={`relative ${iconBox}`}>
                    <Icon className={iconCls} />
                    {badge === "dot" && <span className="dash-rail-pulse absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-white transition-[scale] duration-300 group-data-[open=true]/rail:scale-0" />}
                  </span>
                  <span className={label}>
                    <span className="truncate">{name}</span>
                    {typeof badge === "number" && <span className={`${tag} rounded-full bg-white/10 px-1.5 py-px text-white/75`}>{badge}</span>}
                    {badge === "dot" && (
                      <span className={`${tag} inline-flex items-center gap-1.5`}>
                        <span className="dash-rail-pulse h-1.5 w-1.5 rounded-full bg-white" />
                        New
                      </span>
                    )}
                    {badge === "lock" && (
                      <span className={`${tag} inline-flex items-center gap-1`}>
                        <Lock className="h-3 w-3" /> Paid
                      </span>
                    )}
                    {badge === "active" && <span className={tag}>On</span>}
                  </span>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* notifications and the profile */}
      <div className="flex w-full shrink-0 flex-col gap-3">
        <button
          type="button"
          onClick={onNotifications}
          aria-label="Notifications"
          aria-current={notificationsActive ? "page" : undefined}
          className={rowBtn(notificationsActive, true)}
          {...pull}
        >
          {notificationsActive && bar}
          <span data-rail-icon className={`relative ${iconBox}`}>
            <Bell className={`${iconCls} group-hover/nav:rotate-[14deg]`} />
            {hasUnread && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-white ring-2 ring-[#0a0a0a]" />}
          </span>
          <span className={label}>
            Notifications
            {hasUnread && <span className={tag}>New</span>}
          </span>
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Your profile"
            aria-expanded={menuOpen}
            className="group/nav flex h-11 w-full items-center rounded-full text-left outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold tracking-[0.04em] transition-colors ${
                menuOpen ? "border-white bg-white text-black" : "border-white/40 group-hover/nav:border-white"
              }`}
            >
              {ownerInitials}
            </span>
            <span className={label}>
              <span className="min-w-0 flex-1 pl-1">
                <span className="block truncate text-[13px] font-semibold leading-tight text-white">{ownerName}</span>
                <span className="block truncate text-[11px] font-normal leading-tight text-white/45">{store.name}</span>
              </span>
            </span>
            <ChevronsUpDown className="mr-1 h-3.5 w-3.5 shrink-0 text-white/40 opacity-0 transition-opacity duration-300 group-data-[open=true]/rail:opacity-100" />
          </button>

          {menuOpen && (
            <div className="absolute bottom-0 left-full z-50 ml-[30px] w-[272px] overflow-hidden rounded-[18px] bg-white text-neutral-950 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 origin-bottom-left">
              <div className="flex items-center gap-3 border-b border-neutral-100 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[12px] font-semibold text-white">{ownerInitials}</span>
                <div className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold">{ownerName}</span>
                  <span className="block truncate text-[12px] text-neutral-500">{email}</span>
                </div>
              </div>

              <div className="space-y-3 border-b border-neutral-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Store</span>
                    <span className="block truncate text-[13px] font-semibold">{store.name}</span>
                  </span>
                  <span className="shrink-0 rounded-[6px] border border-neutral-300 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-neutral-600">{store.planId}</span>
                </div>
                {stores.length > 1 && (
                  <label className="relative flex items-center">
                    <span className="sr-only">Switch store</span>
                    <select
                      value={store.subdomain}
                      onChange={(e) => {
                        setMenuOpen(false);
                        onSwitchStore(e.target.value);
                      }}
                      className="h-9 w-full cursor-pointer appearance-none rounded-[10px] border border-neutral-200 bg-white pl-3 pr-8 text-[12.5px] font-medium outline-none transition hover:border-neutral-400 focus:border-black"
                    >
                      {stores.map((s) => (
                        <option key={s.subdomain} value={s.subdomain}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronsUpDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-neutral-400" />
                  </label>
                )}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                    <span className="text-neutral-500">Products</span>
                    <span className="font-semibold tabular-nums">
                      {productsUsed} / {unlimited ? "∞" : productsMax}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div className="h-full rounded-full bg-black transition-all" style={{ width: `${Math.max(3, share * 100)}%` }} />
                  </div>
                </div>
                {store.planId === "free" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onUpgrade();
                    }}
                    className="h-9 w-full rounded-[10px] bg-black text-[12px] font-semibold text-white transition-opacity hover:opacity-85"
                  >
                    Upgrade plan
                  </button>
                )}
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onProfile();
                  }}
                  className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-[13px] font-medium transition-colors hover:bg-neutral-100"
                >
                  <UserRound className="h-4 w-4 text-neutral-500" />
                  Your profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
