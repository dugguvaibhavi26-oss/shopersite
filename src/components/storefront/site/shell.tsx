"use client";

import * as React from "react";
import { effectivePlan } from "@/lib/subscription";
import { planHas } from "@/lib/plans";
import { useRouter } from "next/navigation";
import { Check, Heart, Menu, MessageCircle, Plus, Search, ShoppingBag, User, X, ChevronDown, Mail } from "lucide-react";
import { storeService } from "@/lib/store-service";
import { cn } from "@/lib/utils";
import { activeCategories, useSite, whatsappLink } from "./context";
import { Container, InstagramIcon, MLink } from "./ui";

function Logo({ className }: { className?: string }) {
  const { store } = useSite();
  return (
    <MLink to="/" className={cn("flex min-w-0 items-center gap-2.5", className)} aria-label={`${store.name} home`}>
      {store.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : null}
      <span className="m-h m-brand truncate text-[length:calc(clamp(15px,1.55vw,22px)*var(--m-scale))]">{store.name}</span>
    </MLink>
  );
}

function SearchBox({ onDone, autoFocus, className }: { onDone?: () => void; autoFocus?: boolean; className?: string }) {
  const { content, href } = useSite();
  const router = useRouter();
  const [q, setQ] = React.useState("");
  return (
    <form
      role="search"
      className={cn("flex items-center gap-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(href(term ? `/search?q=${encodeURIComponent(term)}` : "/catalog"));
        onDone?.();
      }}
    >
      <Search className="h-4 w-4 shrink-0" strokeWidth={1.6} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={content.header.searchPlaceholder}
        aria-label="Search products"
        autoFocus={autoFocus}
        className="w-full min-w-0 bg-transparent text-[length:calc(13px*var(--m-scale))] outline-none placeholder:text-[color-mix(in_srgb,var(--m-text)_40%,transparent)]"
      />
    </form>
  );
}

export function SiteHeader({ overHero = false }: { overHero?: boolean }) {
  const { store, content, bagCount, wishlist, look } = useSite();
  // see-through header: turns solid once the page scrolls past the top
  const [solid, setSolid] = React.useState(false);
  React.useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  // the bag icon gives a little bump when something is added
  const [bump, setBump] = React.useState(false);
  const lastCount = React.useRef(bagCount);
  React.useEffect(() => {
    const grew = bagCount > lastCount.current;
    lastCount.current = bagCount;
    if (!grew) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 600);
    return () => window.clearTimeout(t);
  }, [bagCount]);
  const cats = activeCategories(store).filter((c) => !c.parentId);
  const announcement = content.announcement || store.announcementText || "";

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const cell =
    "m-line flex h-full min-w-[clamp(76px,8.6vw,136px)] items-center justify-center border-r px-3 text-[length:calc(11.5px*var(--m-scale))] tracking-[0.04em] transition-colors hover:bg-[color-mix(in_srgb,var(--m-text)_4%,transparent)]";

  return (
    <>
      {announcement && (
        <div className="t-announce m-cap bg-[var(--m-accent)] px-4 py-2 text-center text-[length:calc(11px*var(--m-scale))] font-medium tracking-[0.14em] text-[var(--m-accent-text)]">
          {announcement}
        </div>
      )}
      <div className="contents" data-bump={bump || undefined}>
      {look.header === "split" ? (
        <header
          className={cn("m-line sticky top-0 z-40 border-b bg-[var(--m-bg)]", look.headerTone === "accent" && "border-transparent text-[var(--m-text)]")}
          style={
            look.headerTone === "accent"
              ? ({ "--m-bg": "var(--m-ink)", "--m-text": "var(--m-ink-text)", "--m-accent": "var(--m-ink-text)", "--m-accent-text": "var(--m-ink)", "--m-panel": "color-mix(in srgb, var(--m-ink-text) 14%, var(--m-ink))" } as React.CSSProperties)
              : undefined
          }
        >
          <div className="mx-auto grid h-[var(--hh)] max-w-[1680px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-[var(--g)]">
            <div className="flex items-center">
              <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden">
                <Menu className="h-5 w-5" strokeWidth={1.6} />
              </button>
              <nav className="m-cap hidden items-center gap-[clamp(18px,2.4vw,40px)] text-[length:calc(11.5px*var(--m-scale))] font-medium tracking-[0.04em] lg:flex" aria-label="Main">
                <MLink to="/" className="hover:opacity-60">
                  Home
                </MLink>
                <div className="group relative">
                  <MLink to="/catalog" className="flex items-center gap-1 py-6 hover:opacity-60">
                    {content.header.catalogLabel}
                  </MLink>
                  {cats.length > 0 && (
                    <div className="m-line invisible absolute left-0 top-full z-50 min-w-[220px] border bg-[var(--m-bg)] py-2 normal-case tracking-normal opacity-0 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] transition-all group-hover:visible group-hover:opacity-100">
                      {cats.map((c) => (
                        <MLink key={c.id} to={`/category/${c.slug}`} className="block px-5 py-2.5 hover:bg-[color-mix(in_srgb,var(--m-text)_5%,transparent)]">
                          {c.name}
                        </MLink>
                      ))}
                    </div>
                  )}
                </div>
                <MLink to="/catalog?sale=1" className="hover:opacity-60">
                  Sale
                </MLink>
                <MLink to="/pages/about" className="hover:opacity-60">
                  {content.header.aboutLabel}
                </MLink>
              </nav>
            </div>
            <Logo className="justify-center" />
            <div className="flex items-center justify-end gap-1">
              <button type="button" aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center hover:opacity-60">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </button>
              <MLink to="/account" aria-label="Your account" className="hidden h-10 w-10 items-center justify-center hover:opacity-60 sm:flex">
                <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </MLink>
              <MLink to="/account?tab=wishlist" aria-label="Wishlist" className="hidden h-10 w-10 items-center justify-center hover:opacity-60 sm:flex">
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </MLink>
              <MLink to="/cart" aria-label={`Bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`} className="relative flex h-10 w-10 items-center justify-center hover:opacity-60">
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} />
                {bagCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{bagCount}</span>
                )}
              </MLink>
            </div>
          </div>
          {searchOpen && (
            <div className="m-line border-t px-[var(--g)] py-3">
              <SearchBox autoFocus onDone={() => setSearchOpen(false)} className="mx-auto h-10 max-w-xl" />
            </div>
          )}
        </header>
      ) : look.header === "overlay" ? (
        <header
          className={cn(
            "sticky top-0 z-40 transition-[background-color,color,box-shadow] duration-300",
            // over the homepage photo it is see-through with white text, solid once the page scrolls
            overHero && "-mb-[var(--hh)]",
            overHero && !solid ? "bg-transparent text-white" : "m-line border-b bg-[var(--m-bg)] text-[var(--m-text)]"
          )}
        >
          <div className="mx-auto flex h-[var(--hh)] max-w-[1680px] items-center gap-6 px-[var(--g)]">
            <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden">
              <Menu className="h-5 w-5" strokeWidth={1.6} />
            </button>
            <Logo />
            <nav className="ml-6 hidden items-center gap-7 text-[length:calc(13px*var(--m-scale))] font-medium lg:flex" aria-label="Main">
              <div className="group relative">
                <MLink to="/catalog" className="flex items-center gap-1 py-6 hover:opacity-70">
                  {content.header.catalogLabel}
                  {cats.length > 0 && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                </MLink>
                {cats.length > 0 && (
                  <div className="m-line invisible absolute left-0 top-full z-50 min-w-[220px] rounded-2xl border bg-[var(--m-bg)] p-2 text-[var(--m-text)] opacity-0 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] transition-all group-hover:visible group-hover:opacity-100">
                    {cats.map((c) => (
                      <MLink key={c.id} to={`/category/${c.slug}`} className="block rounded-xl px-4 py-2.5 hover:bg-[color-mix(in_srgb,var(--m-text)_5%,transparent)]">
                        {c.name}
                      </MLink>
                    ))}
                  </div>
                )}
              </div>
              <MLink to="/catalog" className="hover:opacity-70">
                Shop all
              </MLink>
              <MLink to="/pages/about" className="hover:opacity-70">
                {content.header.aboutLabel}
              </MLink>
              <MLink to="/pages/contact" className="hover:opacity-70">
                {content.header.contactLabel}
              </MLink>
            </nav>
            <div className="ml-auto flex items-center gap-1 text-[length:calc(13px*var(--m-scale))] font-medium sm:gap-4">
              <button type="button" onClick={() => setSearchOpen((v) => !v)} className="flex h-10 items-center gap-1.5 px-1.5 hover:opacity-70" aria-label="Search">
                <Search className="h-[17px] w-[17px]" strokeWidth={1.7} />
                <span className="hidden sm:inline">Search</span>
              </button>
              <MLink to="/cart" aria-label={`Bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`} className="flex h-10 items-center gap-1.5 px-1.5 hover:opacity-70">
                <ShoppingBag className="h-[17px] w-[17px]" strokeWidth={1.7} />
                <span>
                  <span className="hidden sm:inline">Bag </span>({bagCount})
                </span>
              </MLink>
              <MLink to="/account" className="hidden h-10 items-center gap-1.5 px-1.5 hover:opacity-70 sm:flex">
                <User className="h-[17px] w-[17px]" strokeWidth={1.7} />
                Account
              </MLink>
            </div>
          </div>
          {searchOpen && (
            <div className="m-line border-t bg-[var(--m-bg)] px-[var(--g)] py-3 text-[var(--m-text)]">
              <SearchBox autoFocus onDone={() => setSearchOpen(false)} className="mx-auto h-10 max-w-xl" />
            </div>
          )}
        </header>
      ) : look.header === "bar" ? (
        <header className="sticky top-0 z-40 bg-[var(--m-bg)]/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-2 px-[max(8px,calc(var(--g)-8px))] lg:h-[72px] lg:gap-8 lg:px-[var(--g)]">
            <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center lg:hidden">
              <Menu className="h-5 w-5" strokeWidth={1.7} />
            </button>
            <Logo className="min-w-0" />
            {look.headerSearch && (
              <SearchBox className={cn("m-line hidden h-10 w-[min(300px,22vw)] shrink-0 rounded-full border px-4 lg:flex", look.categoryRow && "mx-auto w-auto max-w-[560px] flex-1 bg-[var(--m-panel)]")} />
            )}
            <nav className={cn("hidden items-center gap-7 text-[length:calc(13.5px*var(--m-scale))] font-medium lg:flex", look.headerSearch && "ml-auto", look.categoryRow && "lg:hidden")} aria-label="Main">
              <div className="group relative">
                <MLink to="/catalog" className="flex items-center gap-1 py-6 hover:opacity-60">
                  {content.header.catalogLabel}
                  {cats.length > 0 && <ChevronDown className="h-3.5 w-3.5 opacity-50" />}
                </MLink>
                {cats.length > 0 && (
                  <div className="m-line invisible absolute left-0 top-full z-50 min-w-[230px] rounded-2xl border bg-[var(--m-bg)] p-2 opacity-0 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] transition-all group-hover:visible group-hover:opacity-100">
                    {cats.map((c) => (
                      <MLink key={c.id} to={`/category/${c.slug}`} className="block rounded-xl px-4 py-2.5 hover:bg-[var(--m-panel)]">
                        {c.name}
                      </MLink>
                    ))}
                  </div>
                )}
              </div>
              <MLink to="/pages/about" className="hover:opacity-60">
                {content.header.aboutLabel}
              </MLink>
              <MLink to="/account" className="hover:opacity-60">
                Orders
              </MLink>
              <MLink to="/pages/contact" className="hover:opacity-60">
                {content.header.contactLabel}
              </MLink>
            </nav>
            <div className={cn("flex shrink-0 items-center gap-0.5 sm:gap-1", look.headerSearch ? "ml-auto lg:ml-2" : "ml-auto")}>
              <button type="button" aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className={cn("flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--m-panel)]", look.headerSearch && "lg:hidden")}>
                <Search className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </button>
              <MLink to="/account" aria-label="Your account" className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--m-panel)] sm:flex">
                <User className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </MLink>
              <MLink to="/account?tab=wishlist" aria-label="Wishlist" className="relative hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--m-panel)] md:flex">
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.7} />
                {wishlist.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--m-accent)]" />}
              </MLink>
              <MLink to="/cart" aria-label={`Bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--m-panel)]">
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
                {bagCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--m-text)] px-1 text-[10px] font-semibold leading-none text-[var(--m-bg)]">
                    {bagCount}
                  </span>
                )}
              </MLink>
              {content.header.ctaLabel && (
                <MLink to={content.header.ctaLink || "/catalog"} className="m-btn ml-1.5 hidden min-h-10 gap-1 px-5 sm:inline-flex">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {content.header.ctaLabel}
                </MLink>
              )}
            </div>
          </div>
          {look.categoryRow && (
            <nav className="m-line hidden border-t lg:block" aria-label="Categories">
              <div className="mx-auto flex max-w-[1680px] items-center justify-center gap-[clamp(16px,2vw,32px)] px-[var(--g)] text-[length:calc(12.5px*var(--m-scale))] font-medium">
                <MLink to="/catalog" className="py-3 text-[var(--m-accent)] hover:opacity-70">
                  New arrivals
                </MLink>
                {cats.slice(0, 7).map((c) => (
                  <MLink key={c.id} to={`/category/${c.slug}`} className="py-3 hover:text-[var(--m-accent)]">
                    {c.name}
                  </MLink>
                ))}
                <MLink to="/pages/about" className="py-3 hover:text-[var(--m-accent)]">
                  {content.header.aboutLabel}
                </MLink>
                <MLink to="/pages/contact" className="py-3 hover:text-[var(--m-accent)]">
                  {content.header.contactLabel}
                </MLink>
              </div>
            </nav>
          )}
          {searchOpen && (
            <div className="m-line border-t px-4 py-3">
              <SearchBox autoFocus onDone={() => setSearchOpen(false)} className="mx-auto h-10 max-w-xl" />
            </div>
          )}
        </header>
      ) : look.header === "crest" ? (
        <header className="sticky top-0 z-40 bg-[var(--m-bg)]">
          {/* the shop name centred like a crest, the menu in divided cells on a band of the accent colour */}
          <div className="mx-auto grid h-[clamp(60px,6.4vw,92px)] max-w-[1680px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-[var(--g)]">
            <div className="flex items-center">
              <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden">
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <button type="button" aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className="hidden h-10 w-10 items-center justify-center hover:opacity-60 lg:flex">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </div>
            <Logo className="t-crest justify-center" />
            <div className="flex items-center justify-end gap-0.5">
              <button type="button" aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center hover:opacity-60 lg:hidden">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
              <MLink to="/account" aria-label="Your account" className="hidden h-10 w-10 items-center justify-center hover:opacity-60 sm:flex">
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </MLink>
              <MLink to="/account?tab=wishlist" aria-label="Wishlist" className="hidden h-10 w-10 items-center justify-center hover:opacity-60 sm:flex">
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </MLink>
              <MLink to="/cart" aria-label={`Bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`} className="relative flex h-10 w-10 items-center justify-center hover:opacity-60">
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {bagCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--m-accent)] px-1 text-[10px] font-semibold text-[var(--m-accent-text)]">{bagCount}</span>
                )}
              </MLink>
            </div>
          </div>
          <nav
            className={cn("t-band hidden lg:block", look.bandColor ? "text-[var(--m-text)]" : "bg-[var(--m-accent)] text-[var(--m-accent-text)]")}
            style={look.bandColor ? { background: look.bandColor } : undefined}
            data-soft={look.bandColor ? "" : undefined}
            aria-label="Main"
          >
            <div className="m-cap mx-auto flex max-w-[1100px] items-stretch justify-center border-x border-[#C8963E]/45 text-[length:calc(11.5px*var(--m-scale))] font-medium tracking-[0.14em]">
              <MLink to="/" className="border-r border-[#C8963E]/45 px-[clamp(14px,1.6vw,26px)] py-3 hover:bg-white/10">
                Home
              </MLink>
              <div className="group relative flex border-r border-[#C8963E]/45">
                <MLink to="/catalog" className="flex items-center gap-1 px-[clamp(14px,1.6vw,26px)] py-3 hover:bg-white/10">
                  {content.header.catalogLabel}
                  {cats.length > 0 && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
                </MLink>
                {cats.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 min-w-[220px] border border-[#C8963E]/50 bg-[var(--m-bg)] py-2 normal-case tracking-normal text-[var(--m-text)] opacity-0 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] transition-all group-hover:visible group-hover:opacity-100">
                    {cats.map((c) => (
                      <MLink key={c.id} to={`/category/${c.slug}`} className="block px-5 py-2.5 hover:bg-[var(--m-panel)]">
                        {c.name}
                      </MLink>
                    ))}
                  </div>
                )}
              </div>
              {cats.slice(0, 3).map((c) => (
                <MLink key={c.id} to={`/category/${c.slug}`} className="border-r border-[#C8963E]/45 px-[clamp(14px,1.6vw,26px)] py-3 hover:bg-white/10">
                  {c.name}
                </MLink>
              ))}
              <MLink to="/pages/about" className="border-r border-[#C8963E]/45 px-[clamp(14px,1.6vw,26px)] py-3 hover:bg-white/10">
                {content.header.aboutLabel}
              </MLink>
              <MLink to="/pages/contact" className="px-[clamp(14px,1.6vw,26px)] py-3 hover:bg-white/10">
                {content.header.contactLabel}
              </MLink>
            </div>
          </nav>
          {searchOpen && (
            <div className="m-line border-t px-[var(--g)] py-3">
              <SearchBox autoFocus onDone={() => setSearchOpen(false)} className="mx-auto h-10 max-w-xl" />
            </div>
          )}
        </header>
      ) : look.header === "simple" ? (
        <header className="m-line sticky top-0 z-40 border-b bg-[var(--m-bg)]/95 backdrop-blur">
          <div className="mx-auto grid h-16 max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-2 sm:px-6 lg:h-[72px] lg:px-10">
            <div className="flex items-center">
              <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="flex h-11 w-11 items-center justify-center lg:hidden">
                <Menu className="h-5 w-5" strokeWidth={1.6} />
              </button>
              <Logo className="hidden lg:flex" />
            </div>
            <Logo className="lg:hidden" />
            <nav className="hidden items-center gap-8 text-[length:calc(14px*var(--m-scale))] font-medium lg:flex" aria-label="Main">
              <div className="group relative">
                <MLink to="/catalog" className="flex items-center gap-1 py-6 hover:opacity-60">
                  {content.header.catalogLabel}
                  {cats.length > 0 && <ChevronDown className="h-3.5 w-3.5 opacity-50" />}
                </MLink>
                {cats.length > 0 && (
                  <div className="m-line invisible absolute left-1/2 top-full z-50 min-w-[220px] -translate-x-1/2 rounded-2xl border bg-[var(--m-bg)] p-2 opacity-0 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] transition-all group-hover:visible group-hover:opacity-100">
                    {cats.map((c) => (
                      <MLink key={c.id} to={`/category/${c.slug}`} className="block rounded-xl px-4 py-2.5 hover:bg-[color-mix(in_srgb,var(--m-text)_5%,transparent)]">
                        {c.name}
                      </MLink>
                    ))}
                  </div>
                )}
              </div>
              <MLink to="/pages/about" className="hover:opacity-60">
                {content.header.aboutLabel}
              </MLink>
              <MLink to="/account" className="hover:opacity-60">
                Orders
              </MLink>
              <MLink to="/pages/contact" className="hover:opacity-60">
                {content.header.contactLabel}
              </MLink>
              {content.header.ctaLabel && (
                <MLink to={content.header.ctaLink || "/catalog"} className="rounded-full bg-[color-mix(in_srgb,#3b82f6_14%,var(--m-bg))] px-3.5 py-1.5 hover:opacity-80">
                  {content.header.ctaLabel}
                </MLink>
              )}
            </nav>
            <div className="flex items-center justify-end gap-0.5">
              <button type="button" aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--m-text)_5%,transparent)]">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </button>
              <MLink to="/account?tab=wishlist" aria-label="Wishlist" className="relative hidden h-11 w-11 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--m-text)_5%,transparent)] sm:flex">
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.6} />
                {wishlist.length > 0 && <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--m-text)]" />}
              </MLink>
              <MLink to="/account" aria-label="Your account" className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--m-text)_5%,transparent)] lg:flex">
                <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </MLink>
              <MLink
                to="/cart"
                aria-label={`Bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`}
                className="ml-1 flex h-10 items-center gap-2 rounded-full bg-[var(--m-accent)] px-3.5 text-[length:calc(13px*var(--m-scale))] font-semibold text-[var(--m-accent-text)]"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
                {bagCount}
              </MLink>
            </div>
          </div>
          {searchOpen && (
            <div className="m-line border-t px-4 py-3">
              <SearchBox autoFocus onDone={() => setSearchOpen(false)} className="mx-auto h-10 max-w-xl" />
            </div>
          )}
        </header>
      ) : (
      <header className="m-line sticky top-0 z-40 border-b bg-[var(--m-bg)]">
        {/* logo | divided menu cells | search | wishlist square | black bag square, like a lookbook site */}
        <div className="mx-auto flex h-[var(--hh)] max-w-[1680px] items-stretch">
          <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="flex w-[var(--hh)] shrink-0 items-center justify-center md:hidden">
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center md:w-[29%] md:flex-none md:justify-start md:pl-[var(--g)]">
            <Logo />
          </div>

          <nav className="m-cap hidden items-stretch md:flex" aria-label="Main">
            <div className="group relative flex">
              <MLink to="/catalog" className={cn(cell, "border-l")}>
                {content.header.catalogLabel}
              </MLink>
              {cats.length > 0 && (
                <div className="m-line invisible absolute left-0 top-full z-50 min-w-[220px] border bg-[var(--m-bg)] py-2 opacity-0 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] transition-all group-hover:visible group-hover:opacity-100">
                  {cats.map((c) => (
                    <MLink key={c.id} to={`/category/${c.slug}`} className="block px-5 py-2.5 text-[length:calc(12px*var(--m-scale))] tracking-wide hover:bg-[color-mix(in_srgb,var(--m-text)_5%,transparent)]">
                      {c.name}
                    </MLink>
                  ))}
                  <MLink to="/catalog" className="m-muted block px-5 py-2.5 text-[length:calc(12px*var(--m-scale))] tracking-wide hover:text-[var(--m-text)]">
                    View all
                  </MLink>
                </div>
              )}
            </div>
            <MLink to="/pages/about" className={cell}>
              {content.header.aboutLabel}
            </MLink>
            <div className="group relative flex">
              <MLink to="/account" className={cn(cell, "gap-1")}>
                Customers <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={1.5} />
              </MLink>
              <div className="m-line invisible absolute left-0 top-full z-50 min-w-[200px] border bg-[var(--m-bg)] py-2 opacity-0 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] transition-all group-hover:visible group-hover:opacity-100">
                {[
                  { to: "/account", label: "Track your order" },
                  { to: "/account?tab=wishlist", label: "Wishlist" },
                  { to: "/pages/shipping", label: content.pages.shipping.title },
                  { to: "/pages/returns", label: content.pages.returns.title },
                ].map((l) => (
                  <MLink key={l.to} to={l.to} className="block px-5 py-2.5 text-[length:calc(12px*var(--m-scale))] tracking-wide hover:bg-[color-mix(in_srgb,var(--m-text)_5%,transparent)]">
                    {l.label}
                  </MLink>
                ))}
              </div>
            </div>
            <MLink to="/pages/contact" className={cell}>
              {content.header.contactLabel}
            </MLink>
          </nav>

          <div className="ml-auto flex items-stretch">
            <SearchBox className="hidden w-[clamp(150px,13vw,220px)] px-4 text-[length:calc(11px*var(--m-scale))] lg:flex" />
            <button type="button" aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className="flex w-[var(--hh)] items-center justify-center lg:hidden">
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <MLink to="/account?tab=wishlist" aria-label="Wishlist" className="m-line relative hidden w-[var(--hh)] items-center justify-center border-l sm:flex">
              <Heart className="h-[19px] w-[19px]" strokeWidth={1.4} />
              {wishlist.length > 0 && <span className="absolute right-[30%] top-[30%] h-1.5 w-1.5 rounded-full bg-[var(--m-text)]" />}
            </MLink>
            <MLink
              to="/cart"
              aria-label={`Bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`}
              className="relative flex w-[var(--hh)] items-center justify-center bg-[var(--m-accent)] text-[var(--m-accent-text)]"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.4} />
              {bagCount > 0 && (
                <span className="absolute right-[22%] top-[22%] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--m-accent-text)] px-1 text-[10px] font-semibold text-[var(--m-accent)]">
                  {bagCount}
                </span>
              )}
            </MLink>
          </div>
        </div>
        {searchOpen && (
          <div className="m-line border-t px-[var(--g)] py-3 lg:hidden">
            <SearchBox autoFocus onDone={() => setSearchOpen(false)} className="h-10" />
          </div>
        )}
      </header>
      )}
      </div>

      {menuOpen && (
        <div className={cn("fixed inset-0 z-[60] flex flex-col bg-[var(--m-bg)]", look.header === "cells" ? "md:hidden" : "lg:hidden")} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="m-line flex h-16 items-center justify-between border-b pl-4">
            <Logo />
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="flex h-16 w-14 items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-10" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}>
            <SearchBox className="m-line mt-4 h-12 rounded-full border px-4" onDone={() => setMenuOpen(false)} />
            <p className="m-faint m-cap mt-8 text-[length:calc(11px*var(--m-scale))] tracking-[0.16em]">{content.header.catalogLabel}</p>
            <ul className="mt-2">
              <li>
                <MLink to="/catalog" className="m-h m-line block border-b py-4 text-[length:calc(20px*var(--m-scale))]">
                  All products
                </MLink>
              </li>
              {cats.map((c) => (
                <li key={c.id}>
                  <MLink to={`/category/${c.slug}`} className="m-h m-line block border-b py-4 text-[length:calc(20px*var(--m-scale))]">
                    {c.name}
                  </MLink>
                </li>
              ))}
            </ul>
            <div className="m-cap mt-8 grid grid-cols-2 gap-2 text-[length:calc(12px*var(--m-scale))] font-medium tracking-wide">
              {[
                { to: "/account", label: "Your orders" },
                { to: "/account?tab=wishlist", label: "Wishlist" },
                { to: "/pages/about", label: content.header.aboutLabel },
                { to: "/pages/contact", label: content.header.contactLabel },
                { to: "/pages/shipping", label: "Shipping" },
                { to: "/pages/returns", label: "Returns" },
              ].map((l) => (
                <MLink key={l.to} to={l.to} className="m-soft rounded-xl px-4 py-3.5">
                  {l.label}
                </MLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FooterNewsletter() {
  const { store, content, editing, demo } = useSite();
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);
  return done ? (
    <p className="flex items-center gap-2 text-[length:calc(14px*var(--m-scale))]">
      <Check className="h-4 w-4" /> You're on the list.
    </p>
  ) : (
    <form
      className="flex h-12 items-center rounded-full border border-[color-mix(in_srgb,var(--f-fg)_25%,transparent)] pl-5 pr-1.5 focus-within:border-[var(--f-fg)]"
      onSubmit={(e) => {
        e.preventDefault();
        if (editing || !/^\S+@\S+\.\S+$/.test(email.trim())) return;
        if (!demo) storeService.addSubscriber(store.subdomain, email);
        setDone(true);
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        aria-label={content.footer.newsletterHeading}
        className="min-w-0 flex-1 bg-transparent text-[length:calc(14px*var(--m-scale))] text-[var(--f-fg)] outline-none placeholder:text-[color-mix(in_srgb,var(--f-fg)_40%,transparent)]"
      />
      <button type="submit" className="m-cap h-9 rounded-full bg-[var(--f-fg)] px-4 text-[length:calc(11px*var(--m-scale))] font-bold tracking-wider text-[var(--f-bg)]">
        Join
      </button>
    </form>
  );
}

export function SiteFooter() {
  const { store, content, look } = useSite();
  const cats = activeCategories(store).filter((c) => !c.parentId).slice(0, 6);
  const wa = whatsappLink(store.contactPhone);
  const col = "m-cap text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.16em] text-[color-mix(in_srgb,var(--f-fg)_45%,transparent)]";
  const link = "block min-h-0 py-1.5 text-[length:calc(13px*var(--m-scale))] text-[color-mix(in_srgb,var(--f-fg)_80%,transparent)] transition-colors hover:text-[var(--f-fg)] sm:py-1.5";
  return (
    <footer
      className="mt-auto bg-[var(--f-bg)] text-[var(--f-fg)]"
      style={
        (look.footer === "dark"
          ? { "--f-bg": "#0c0c0c", "--f-fg": "#ffffff" }
          : { "--f-bg": "color-mix(in srgb, var(--m-text) 4%, var(--m-bg))", "--f-fg": "var(--m-text)" }) as React.CSSProperties
      }
    >
      <Container className="py-12 sm:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.4fr_1fr_1fr_1.4fr] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <p className="m-h text-[length:calc(24px*var(--m-scale))]">{store.name}</p>
            <p className="mt-4 max-w-xs whitespace-pre-line text-[length:calc(13px*var(--m-scale))] leading-relaxed text-[color-mix(in_srgb,var(--f-fg)_55%,transparent)]">{content.footer.about}</p>
            <div className="mt-6 flex gap-2">
              {store.instagramHandle && (
                <a
                  href={`https://instagram.com/${store.instagramHandle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--f-fg)_20%,transparent)] hover:border-[var(--f-fg)]"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--f-fg)_20%,transparent)] hover:border-[var(--f-fg)]">
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
              {store.contactEmail && (
                <a href={`mailto:${store.contactEmail}`} aria-label="Email" className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--f-fg)_20%,transparent)] hover:border-[var(--f-fg)]">
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          <div>
            <p className={col}>Shop</p>
            <div className="mt-4">
              <MLink to="/catalog" className={link}>
                All products
              </MLink>
              {cats.map((c) => (
                <MLink key={c.id} to={`/category/${c.slug}`} className={link}>
                  {c.name}
                </MLink>
              ))}
            </div>
          </div>
          <div>
            <p className={col}>Help</p>
            <div className="mt-4">
              <MLink to="/account" className={link}>
                Track your order
              </MLink>
              {(["shipping", "returns", "contact", "about", "privacy", "terms"] as const).map((id) => (
                <MLink key={id} to={`/pages/${id}`} className={link}>
                  {content.pages[id].title}
                </MLink>
              ))}
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className={col}>{content.footer.newsletterHeading}</p>
            <div className="mt-4">
              <FooterNewsletter />
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t sm:mt-14 border-[color-mix(in_srgb,var(--f-fg)_10%,transparent)] pt-6 text-[length:calc(12px*var(--m-scale))] text-[color-mix(in_srgb,var(--f-fg)_40%,transparent)] sm:flex-row sm:justify-between">
          <span>{content.footer.copyright}</span>
          {/* Shopersite branding on Free and Growth; Pro can remove it */}
          {!planHas(effectivePlan(store).planId, "removeBranding") && (
            <a href="https://shopersite.in" target="_blank" rel="noopener noreferrer" className="hover:text-[color-mix(in_srgb,var(--f-fg)_70%,transparent)]">
              Made with Shopersite
            </a>
          )}
        </div>
        {look.footerWordmark && (
          <p aria-hidden className={cn("m-h m-display pointer-events-none mt-10 select-none overflow-hidden whitespace-nowrap text-center text-[length:calc(clamp(64px,17vw,280px)*var(--m-scale))] leading-[0.8]", look.footerWordmarkTone === "accent" ? "text-[var(--m-accent)]" : "text-[color-mix(in_srgb,var(--f-fg)_9%,transparent)]")}>
            {store.name}
          </p>
        )}
      </Container>
    </footer>
  );
}

export function SiteToast() {
  const { toast, href } = useSite();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4">
      <div className="m-rise pointer-events-auto flex items-center gap-4 rounded-full bg-[#111] py-2 pl-5 pr-2 text-[length:calc(13px*var(--m-scale))] text-white shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]" role="status">
        <Check className="h-4 w-4" />
        <span className={toast.bag ? "" : "pr-3"}>{toast.text}</span>
        {toast.bag && (
          <a href={href("/cart")} className="m-cap rounded-full bg-white px-4 py-2 text-[length:calc(11px*var(--m-scale))] font-bold tracking-wider text-black">
            View bag
          </a>
        )}
      </div>
    </div>
  );
}
