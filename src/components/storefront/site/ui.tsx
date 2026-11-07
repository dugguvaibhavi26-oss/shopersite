"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronLeft, ChevronRight, Eye, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import type { ProductData } from "@/lib/store-service";
import { canUseReviews } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { discountPercent, rupees, unitsSold, useSite } from "./context";

/** A link inside the shop (paths like "/catalog" or full URLs, which open in a new tab). */
export function MLink({
  to,
  className,
  children,
  onClick,
  ...rest
}: { to: string; className?: string; children: React.ReactNode; onClick?: () => void } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  const { href } = useSite();
  const external = /^https?:\/\//.test(to);
  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href(to || "/")} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i <= Math.round(value) ? "fill-current" : "opacity-25")} />
      ))}
    </span>
  );
}

export function Price({ product, className }: { product: ProductData; className?: string }) {
  const off = discountPercent(product);
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className="font-semibold">{rupees(product.price)}</span>
      {off > 0 && <span className="m-faint text-[0.85em] line-through">{rupees(product.compareAtPrice!)}</span>}
    </span>
  );
}

/** Theme 03's card: rounded grey box, heart and sale tag on the photo, quick-add bag button by the price. */
function BoxedCard({ product, className }: { product: ProductData; className?: string }) {
  const { wishlist, toggleWish, content, addToBag, href } = useSite();
  const router = useRouter();
  const off = discountPercent(product);
  const soldOut = product.stock <= 0;
  const wished = wishlist.includes(product.id);
  const fit = content.settings.productPhotos === "fit";
  const needsChoice = (product.options || []).some((o) => o.options?.length);
  const to = `/products/${product.slug || product.id}`;
  return (
    <div className={cn("group relative min-w-0", className)}>
      <MLink to={to} className="m-panel m-card relative block aspect-[4/5] overflow-hidden">
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full transition duration-700",
              fit ? "object-contain p-[12%] mix-blend-multiply group-hover:scale-[1.05]" : "object-cover group-hover:scale-[1.03]"
            )}
          />
        )}
        {(soldOut || off > 0) && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-white/85 px-2 py-0.5 text-[length:calc(10px*var(--m-scale))] font-medium text-neutral-500 backdrop-blur">
            {soldOut ? "Sold out" : `−${off}%`}
          </span>
        )}
      </MLink>
      <button
        type="button"
        onClick={() => toggleWish(product.id)}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wished}
        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-sm"
      >
        <Heart className={cn("h-4 w-4", wished && "fill-red-500 text-red-500")} strokeWidth={1.6} />
      </button>
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <MLink to={to} className="min-w-0">
          <span className="block truncate text-[length:calc(12.5px*var(--m-scale))]">{product.title}</span>
          <span className="block text-[length:calc(13px*var(--m-scale))] font-semibold">
            {rupees(product.price)}
            {off > 0 && <span className="m-faint ml-1.5 font-normal line-through">{rupees(product.compareAtPrice!)}</span>}
          </span>
        </MLink>
        {!soldOut && (
          <button
            type="button"
            aria-label={needsChoice ? `Choose options for ${product.title}` : `Add ${product.title} to bag`}
            onClick={() => (needsChoice ? router.push(href(to)) : addToBag(product))}
            className="m-line flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-[var(--m-text)] hover:text-[var(--m-bg)]"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.7} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Theme 04's card: rounded photo that shows Add to cart / Buy now when pointed at; name and price on one line. */
function HoverCard({ product, className }: { product: ProductData; className?: string }) {
  const { addToBag, href, content } = useSite();
  const router = useRouter();
  const off = discountPercent(product);
  const soldOut = product.stock <= 0;
  const fit = content.settings.productPhotos === "fit";
  const needsChoice = (product.options || []).some((o) => o.options?.length);
  const to = `/products/${product.slug || product.id}`;
  return (
    <div className={cn("group relative min-w-0", className)}>
      <div className="m-panel m-card relative aspect-[4/5] overflow-hidden">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt=""
              loading="lazy"
              className={cn("absolute inset-0 h-full w-full transition duration-700", fit ? "object-contain p-[10%] mix-blend-multiply" : "object-cover group-hover:scale-[1.03]")}
            />
          )}
        </MLink>
        {(soldOut || off > 0) && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 bg-[var(--m-text)] px-2 py-0.5 text-[length:calc(10px*var(--m-scale))] font-medium text-[var(--m-bg)]">
            {soldOut ? "Sold out" : `−${off}%`}
          </span>
        )}
        {!soldOut && (
          <div className="pointer-events-none absolute inset-0 hidden flex-col items-center justify-center gap-2 bg-black/35 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 sm:flex">
            <button
              type="button"
              onClick={() => (needsChoice ? router.push(href(to)) : addToBag(product))}
              className="h-9 min-w-[7.5rem] border border-white/80 px-4 text-[length:calc(12px*var(--m-scale))] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              {needsChoice ? "Choose size" : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (needsChoice) {
                  router.push(href(to));
                  return;
                }
                addToBag(product);
                router.push(href("/checkout"));
              }}
              className="h-9 min-w-[7.5rem] bg-white px-4 text-[length:calc(12px*var(--m-scale))] font-semibold text-black"
            >
              Buy now
            </button>
          </div>
        )}
      </div>
      <MLink to={to} className="mt-2.5 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <span className="truncate text-[length:calc(12px*var(--m-scale))] font-semibold">{product.title}</span>
        <span className="shrink-0 whitespace-nowrap text-[length:calc(12.5px*var(--m-scale))] font-semibold">
          {off > 0 && <span className="m-faint mr-1.5 font-normal line-through">{rupees(product.compareAtPrice!)}</span>}
          {rupees(product.price)}
        </span>
      </MLink>
    </div>
  );
}

/** Theme 05's card: badge, photo, stars, name, price, a line of description and colour dots. */
function DetailedCard({ product, className }: { product: ProductData; className?: string }) {
  const { store, content, wishlist, toggleWish } = useSite();
  const off = discountPercent(product);
  const soldOut = product.stock <= 0;
  const fit = content.settings.productPhotos === "fit";
  const wished = wishlist.includes(product.id);
  const reviews = canUseReviews(store.planId) ? (store.reviews || []).filter((r) => r.productId === product.id && r.status === "approved") : [];
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const sold = unitsSold(store);
  const isBestseller = (sold[product.id] || 0) > 0 && Object.values(sold).sort((a, b) => b - a).slice(0, 3).includes(sold[product.id]);
  const isNew = Date.now() - new Date(product.createdAt || 0).getTime() < 30 * 86400000;
  const badge = soldOut ? "Sold out" : off > 0 ? `${off}% off` : isBestseller ? "Bestseller" : isNew ? "New" : "";
  const colours = product.colorSwatches || [];
  const colourOption = (product.options || []).find((o) => /colou?r|shade/i.test(o.name));
  const colourCount = colours.length || colourOption?.options.length || 0;
  const to = `/products/${product.slug || product.id}`;
  return (
    <div className={cn("group relative min-w-0", className)}>
      <MLink to={to} className="m-panel m-card relative block aspect-[1/1.12] overflow-hidden">
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            className={cn("absolute inset-0 h-full w-full transition duration-700", fit ? "object-contain p-[8%] mix-blend-multiply group-hover:scale-[1.04]" : "object-cover group-hover:scale-[1.03]")}
          />
        )}
        {badge && <span className="absolute left-2 top-2 rounded bg-white px-1.5 py-0.5 text-[length:calc(10px*var(--m-scale))] font-semibold text-black shadow-sm">{badge}</span>}
      </MLink>
      <button
        type="button"
        onClick={() => toggleWish(product.id)}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wished}
        data-on={wished}
        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center transition-opacity sm:opacity-0 sm:group-hover:opacity-100 data-[on=true]:opacity-100"
      >
        <Heart className={cn("h-4 w-4", wished && "fill-current")} strokeWidth={1.6} />
      </button>
      <MLink to={to} className="mt-2.5 block">
        {reviews.length > 0 && (
          <span className="flex items-center gap-1 text-[length:calc(11px*var(--m-scale))]">
            <Stars value={avg} className="[&_svg]:h-3 [&_svg]:w-3" /> <span className="m-muted">({reviews.length})</span>
          </span>
        )}
        <span className="mt-1 block truncate text-[length:calc(13.5px*var(--m-scale))] font-medium tracking-[-0.01em]">{product.title}</span>
        <span className="block text-[length:calc(13px*var(--m-scale))]">
          {rupees(product.price)}
          {off > 0 && <span className="m-faint ml-1.5 line-through">{rupees(product.compareAtPrice!)}</span>}
        </span>
        {product.description && <span className="m-muted mt-1.5 block truncate text-[length:calc(12px*var(--m-scale))]">{product.description.split(/[.\n]/)[0]}</span>}
        {colours.length > 0 ? (
          <span className="mt-2 flex items-center gap-1">
            {colours.slice(0, 6).map((c) => (
              <span key={c} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }} />
            ))}
          </span>
        ) : colourCount > 1 ? (
          <span className="m-muted mt-1 block text-[length:calc(12px*var(--m-scale))]">{colourCount} colours</span>
        ) : null}
      </MLink>
    </div>
  );
}

/** E01's card: tinted panel, the price in a cut-out corner, a Buy button on the photo, stars under the name. */
function NotchCard({ product, className }: { product: ProductData; className?: string }) {
  const { store, content, wishlist, toggleWish, addToBag, href } = useSite();
  const router = useRouter();
  const off = discountPercent(product);
  const soldOut = product.stock <= 0;
  const fit = content.settings.productPhotos === "fit";
  const wished = wishlist.includes(product.id);
  const needsChoice = (product.options || []).some((o) => o.options?.length);
  const reviews = canUseReviews(store.planId) ? (store.reviews || []).filter((r) => r.productId === product.id && r.status === "approved") : [];
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const isNew = Date.now() - new Date(product.createdAt || 0).getTime() < 30 * 86400000;
  const badge = soldOut ? "Sold out" : off > 0 ? `${off}% off` : isNew ? "New" : "";
  const to = `/products/${product.slug || product.id}`;
  const buy = () => (needsChoice ? router.push(href(to)) : addToBag(product));
  return (
    <div className={cn("group relative min-w-0", className)}>
      <div className="m-panel m-card relative aspect-[1/1.04] overflow-hidden">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt=""
              loading="lazy"
              className={cn(
                "absolute inset-0 h-full w-full transition duration-700",
                fit ? "object-contain p-[13%] mix-blend-multiply group-hover:scale-[1.05]" : "object-cover group-hover:scale-[1.03]"
              )}
            />
          )}
        </MLink>
        {badge && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-[#F26B3A] px-2.5 py-1 text-[length:calc(10.5px*var(--m-scale))] font-semibold leading-none text-white">
            {badge}
          </span>
        )}
        <span className="m-notch pointer-events-none px-3 pb-1.5 pt-1 text-[length:calc(13px*var(--m-scale))] font-semibold sm:px-3.5 sm:pb-2 sm:pt-1.5 sm:text-[length:calc(14px*var(--m-scale))]">
          {rupees(product.price)}
        </span>
        {!soldOut && (
          <button
            type="button"
            onClick={buy}
            aria-label={needsChoice ? `Choose a size for ${product.title}` : `Add ${product.title} to bag`}
            className="absolute bottom-2 right-2 flex h-9 min-h-0 w-9 items-center justify-center gap-1.5 rounded-full bg-white text-[length:calc(12px*var(--m-scale))] font-semibold text-black shadow-[0_6px_20px_-8px_rgba(0,0,0,0.35)] transition duration-300 lg:inset-x-2.5 lg:bottom-2.5 lg:w-auto lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
          >
            <Plus className="h-4 w-4 lg:h-3.5 lg:w-3.5" strokeWidth={2.4} />
            <span className="hidden lg:inline">{needsChoice ? "Choose size" : "Add to bag"}</span>
          </button>
        )}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-2 px-0.5">
        <MLink to={to} className="min-w-0">
          <span className="block truncate text-[length:calc(13.5px*var(--m-scale))] font-medium">{product.title}</span>
          {reviews.length > 0 ? (
            <span className="mt-1 flex items-center gap-1 text-[length:calc(11px*var(--m-scale))]">
              <Stars value={avg} className="text-[#F5A524] [&_svg]:h-3 [&_svg]:w-3" />
              <span className="m-muted">({reviews.length})</span>
            </span>
          ) : (
            off > 0 && <span className="m-faint mt-0.5 block text-[length:calc(12px*var(--m-scale))] line-through">{rupees(product.compareAtPrice!)}</span>
          )}
        </MLink>
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="-mr-1.5 -mt-1 flex h-9 min-h-0 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[var(--m-panel)]"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-[var(--m-accent)] text-[var(--m-accent)]")} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}

/**
 * F01's card. On phones: the photo first, then the name, price and a round bag button. From sm up: the name and a
 * tag, two lines of description, the price and Buy now, then the photo with rating and category chips.
 */
function SpecCard({ product, className }: { product: ProductData; className?: string }) {
  const { store, content, wishlist, toggleWish, addToBag, href } = useSite();
  const router = useRouter();
  const off = discountPercent(product);
  const soldOut = product.stock <= 0;
  const fit = content.settings.productPhotos === "fit";
  const wished = wishlist.includes(product.id);
  const needsChoice = (product.options || []).some((o) => o.options?.length);
  const reviews = canUseReviews(store.planId) ? (store.reviews || []).filter((r) => r.productId === product.id && r.status === "approved") : [];
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const sold = unitsSold(store);
  const isBestseller = (sold[product.id] || 0) > 0 && Object.values(sold).sort((a, b) => b - a).slice(0, 3).includes(sold[product.id]);
  const isNew = Date.now() - new Date(product.createdAt || 0).getTime() < 30 * 86400000;
  const tag = soldOut ? "sold out" : off > 0 ? `${off}% off` : isBestseller ? "bestseller" : isNew ? "new" : "";
  const cat = (store.categories || []).find((c) => c.slug === product.category || c.name.toLowerCase() === (product.category || "").toLowerCase());
  const to = `/products/${product.slug || product.id}`;
  const buy = () => (needsChoice ? router.push(href(to)) : addToBag(product));
  const chip = "rounded-full bg-white/85 px-2 py-0.5 text-[length:calc(10.5px*var(--m-scale))] leading-tight text-[#1b1b1a] backdrop-blur";
  return (
    <div
      className={cn(
        "group flex min-w-0 flex-col rounded-[var(--m-card)] bg-white p-1.5 text-[#1b1b1a] transition duration-500 sm:p-3 lg:hover:-translate-y-1 lg:hover:shadow-[0_30px_60px_-36px_rgba(0,0,0,0.55)]",
        className
      )}
      style={{ "--m-text": "#1b1b1a", "--m-bg": "#ffffff", "--m-accent": "var(--m-ink)", "--m-accent-text": "var(--m-ink-text)" } as React.CSSProperties}
    >
      <div className="order-2 flex flex-1 flex-col px-1.5 pb-1.5 pt-2.5 sm:order-1 sm:px-1.5 sm:pb-0 sm:pt-1">
        <div className="flex items-start justify-between gap-3">
          <MLink to={to} className="line-clamp-2 min-w-0 text-[length:calc(13px*var(--m-scale))] font-medium leading-snug tracking-[-0.01em] sm:line-clamp-1 sm:text-[length:calc(clamp(15px,1.25vw,18px)*var(--m-scale))]">
            {product.title}
          </MLink>
          {tag && <span className="mt-0.5 hidden shrink-0 rounded-full border border-black/15 px-2.5 py-0.5 text-[length:calc(10.5px*var(--m-scale))] leading-tight text-black/55 sm:inline-block">{tag}</span>}
        </div>
        {product.description && (
          <p className="mt-1.5 hidden min-h-[2.7em] text-[length:calc(12.5px*var(--m-scale))] leading-[1.35] text-black/55 sm:line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2 sm:items-center sm:pb-3.5 sm:pt-4">
          <span className="min-w-0">
            <span className="block text-[length:calc(14px*var(--m-scale))] font-semibold tracking-[-0.01em] sm:text-[length:calc(clamp(17px,1.5vw,21px)*var(--m-scale))] sm:font-medium">
              {rupees(product.price)}
            </span>
            {off > 0 && <span className="block text-[length:calc(11px*var(--m-scale))] text-black/35 line-through">{rupees(product.compareAtPrice!)}</span>}
          </span>
          {!soldOut && (
            <button
              type="button"
              onClick={buy}
              aria-label={needsChoice ? `Choose options for ${product.title}` : `Add ${product.title} to bag`}
              className="flex h-9 min-h-0 w-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--m-accent)] text-[length:calc(12px*var(--m-scale))] font-medium text-[var(--m-accent-text)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-12px_rgba(0,0,0,0.6)] sm:w-auto sm:px-5"
            >
              <ShoppingBag className="h-4 w-4 sm:hidden" strokeWidth={1.8} />
              <span className="hidden sm:inline">{needsChoice ? "Choose" : "Buy now"}</span>
            </button>
          )}
        </div>
      </div>
      {/* the photo: first on phones, at the bottom of the card from sm up so photos line up across a row */}
      <div className="relative order-1 aspect-square overflow-hidden rounded-[calc(var(--m-card)-6px)] bg-[#ECEBE6] sm:order-2 sm:aspect-[4/3.4]">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt=""
              loading="lazy"
              className={cn("absolute inset-0 h-full w-full transition duration-700", fit ? "object-contain p-[10%] mix-blend-multiply group-hover:scale-[1.05]" : "object-cover group-hover:scale-[1.05]")}
            />
          )}
        </MLink>
        {tag && <span className={cn(chip, "pointer-events-none absolute left-2 top-2 sm:hidden")}>{tag}</span>}
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2 top-2 flex h-8 min-h-0 w-8 items-center justify-center rounded-full bg-white/85 backdrop-blur transition-opacity lg:opacity-0 lg:group-hover:opacity-100 data-[on=true]:opacity-100"
          data-on={wished}
        >
          <Heart className={cn("h-[15px] w-[15px]", wished && "fill-current")} strokeWidth={1.7} />
        </button>
        <span className="pointer-events-none absolute inset-x-2 bottom-2 hidden items-center justify-between gap-1.5 sm:flex">
          {reviews.length > 0 ? <span className={chip}>{avg.toFixed(1)} ★</span> : <span />}
          {cat && <span className={cn(chip, "truncate")}>{cat.name.toLowerCase()}</span>}
        </span>
      </div>
    </div>
  );
}

/**
 * A quiet photo card for F02 and Themes 07–09. The theme's look decides the details: name and price side by side or
 * stacked, centred or left, the name in the accent colour, the category above it, and a bag button.
 */
function LineCard({ product, className, aspect }: { product: ProductData; className?: string; aspect?: string }) {
  const { store, look, content, wishlist, toggleWish, addToBag, href } = useSite();
  const router = useRouter();
  const off = discountPercent(product);
  const soldOut = product.stock <= 0;
  const fit = content.settings.productPhotos === "fit";
  const wished = wishlist.includes(product.id);
  const needsChoice = (product.options || []).some((o) => o.options?.length);
  const second = product.images?.[1];
  const row = look.lineLayout === "row";
  const center = look.lineAlign === "center";
  const cat = look.lineCategory ? (store.categories || []).find((c) => c.slug === product.category || c.name.toLowerCase() === (product.category || "").toLowerCase()) : undefined;
  const to = `/products/${product.slug || product.id}`;
  const buy = () => (needsChoice ? router.push(href(to)) : addToBag(product));
  const icon = "flex h-8 min-h-0 w-8 items-center justify-center rounded-full transition hover:bg-[color-mix(in_srgb,var(--m-text)_7%,transparent)]";
  const photo = cn("absolute inset-0 h-full w-full transition duration-700", fit ? "object-contain p-[9%] mix-blend-multiply" : "object-cover");
  const price = (
    <span className="whitespace-nowrap tabular-nums">
      {off > 0 && <span className="m-faint mr-1.5 font-normal line-through">{rupees(product.compareAtPrice!)}</span>}
      {rupees(product.price)}
    </span>
  );
  const cart = look.lineCart && !soldOut && (
    <button type="button" onClick={buy} aria-label={needsChoice ? `Choose options for ${product.title}` : `Add ${product.title} to bag`} className={cn(icon, "shrink-0")}>
      <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />
    </button>
  );
  return (
    <div className={cn("group relative min-w-0", className)}>
      <div className="m-panel m-card relative overflow-hidden" style={{ aspectRatio: aspect || look.lineAspect || "1/1" }}>
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" loading="lazy" className={cn(photo, second ? "group-hover:opacity-0" : "group-hover:scale-[1.04]")} />
          )}
          {second && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={second} alt="" loading="lazy" className={cn(photo, "opacity-0 group-hover:opacity-100")} />
          )}
        </MLink>
        {(soldOut || off > 0) && (
          <span className="pointer-events-none absolute left-2 top-2 bg-[var(--m-bg)] px-1.5 py-0.5 text-[length:calc(10px*var(--m-scale))] font-medium">{soldOut ? "Sold out" : `−${off}%`}</span>
        )}
        {/* a soft circle behind the icons keeps them readable on dark photos */}
        <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 [&>button]:bg-[color-mix(in_srgb,var(--m-bg)_78%,transparent)] [&>button]:backdrop-blur-sm">
          <button type="button" onClick={() => toggleWish(product.id)} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wished} className={icon}>
            <Heart className={cn("h-4 w-4", wished && "fill-current")} strokeWidth={1.6} />
          </button>
          {row && cart}
        </div>
      </div>
      {row ? (
        <div className="mt-2.5">
          {cat && <p className="m-muted truncate text-[length:calc(11px*var(--m-scale))]">{cat.name}</p>}
          <div className="mt-0.5 flex flex-col gap-0.5 text-[length:calc(12.5px*var(--m-scale))] sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <MLink to={to} className="min-h-0 truncate hover:text-[var(--m-accent)]">
              {product.title}
            </MLink>
            {price}
          </div>
        </div>
      ) : (
        <div className={cn("mt-2.5", center && "text-center")}>
          <div className={cn("flex items-start gap-2", center ? "justify-center" : "justify-between")}>
            <MLink to={to} className={cn("min-h-0 min-w-0 text-[length:calc(13px*var(--m-scale))] font-medium leading-snug", look.lineAccentName && "text-[var(--m-accent)]", center ? "line-clamp-2" : "truncate")}>
              {product.title}
            </MLink>
            {!center && cart && <span className="-mr-1.5 -mt-1.5">{cart}</span>}
          </div>
          <p className={cn("mt-1 text-[length:calc(12.5px*var(--m-scale))]", look.lineAccentName ? "font-semibold" : "m-muted")}>{price}</p>
        </div>
      )}
    </div>
  );
}

/** Shared bits of the Theme 13–16 cards: where the card links, and what its buy button does. */
function useCardBuy(product: ProductData) {
  const { addToBag, href } = useSite();
  const router = useRouter();
  const needsChoice = (product.options || []).some((o) => o.options?.length);
  const to = `/products/${product.slug || product.id}`;
  const buy = (qty = 1) => (needsChoice ? router.push(href(to)) : addToBag(product, qty));
  return { to, buy, needsChoice, soldOut: product.stock <= 0, off: discountPercent(product) };
}

/** Theme 13: a thin-bordered box, the price in the accent colour, a line of description and a square + button. */
function TileCard({ product, className }: { product: ProductData; className?: string }) {
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  return (
    <div className={cn("m-line group flex min-w-0 flex-col border bg-[var(--m-bg)] p-2 transition duration-300 sm:p-2.5 lg:hover:-translate-y-1 lg:hover:border-[var(--m-accent)]", className)}>
      <MLink to={to} className="m-panel relative block aspect-square overflow-hidden" aria-label={product.title}>
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:rotate-[4deg] group-hover:scale-[1.06]" />
        )}
        {(soldOut || off > 0) && (
          <span className="absolute left-2 top-2 bg-[var(--m-accent)] px-1.5 py-0.5 text-[length:calc(10px*var(--m-scale))] font-semibold text-[var(--m-accent-text)]">{soldOut ? "Sold out" : `−${off}%`}</span>
        )}
      </MLink>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3 sm:px-1.5">
        <div className="flex items-start justify-between gap-2">
          <MLink to={to} className="m-cap min-h-0 min-w-0 text-[length:calc(11.5px*var(--m-scale))] font-semibold leading-snug tracking-[0.03em] hover:text-[var(--m-accent)] sm:text-[length:calc(12.5px*var(--m-scale))]">
            {product.title}
          </MLink>
          <span className="m-h shrink-0 text-[length:calc(14px*var(--m-scale))] text-[var(--m-accent)] tabular-nums sm:text-[length:calc(16px*var(--m-scale))]">{rupees(product.price)}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {product.description ? <p className="m-muted m-cap line-clamp-2 text-[length:calc(10.5px*var(--m-scale))] leading-snug tracking-[0.02em]">{product.description}</p> : <span />}
          {!soldOut && (
            <button
              type="button"
              onClick={() => buy()}
              aria-label={needsChoice ? `Choose options for ${product.title}` : `Add ${product.title} to bag`}
              className="m-line flex h-8 min-h-0 w-8 shrink-0 items-center justify-center border transition-colors hover:border-[var(--m-accent)] hover:bg-[var(--m-accent)] hover:text-[var(--m-accent-text)]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Theme 14: a rounded outlined card with the name written big above the photo, a quantity stepper and an add button with the price. */
function JarCard({ product, className }: { product: ProductData; className?: string }) {
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const [qty, setQty] = React.useState(1);
  return (
    <div className={cn("group relative flex min-w-0 flex-col rounded-[var(--m-card)] border-[1.5px] border-[var(--m-text)] p-3 transition duration-300 sm:p-4 lg:hover:-translate-y-1 lg:hover:shadow-[6px_6px_0_var(--m-text)]", className)}>
      {off > 0 && (
        <span className="t-flower absolute -right-2 -top-3 z-[1] flex h-12 w-12 items-center justify-center text-center text-[length:calc(10px*var(--m-scale))] font-bold uppercase leading-none text-[#141414] sm:-right-3 sm:h-14 sm:w-14">
          −{off}%
        </span>
      )}
      <MLink to={to} className="m-h block min-h-0 truncate text-center text-[length:calc(clamp(18px,2.6vw,38px)*var(--m-scale))] leading-tight">
        {product.title}
      </MLink>
      <MLink to={to} className="relative mt-3 block aspect-square overflow-hidden rounded-[calc(var(--m-card)*0.55)]" aria-label={product.title}>
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
        )}
      </MLink>
      {soldOut ? (
        <p className="m-muted mt-4 text-center text-[length:calc(13px*var(--m-scale))]">Sold out</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:mt-4">
          {!needsChoice && (
            <div className="m-line hidden h-10 items-center justify-between rounded-full border border-[var(--m-text)] px-1 sm:flex">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 min-h-0 w-8 items-center justify-center rounded-full hover:bg-black/5">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-[length:calc(13px*var(--m-scale))] tabular-nums" aria-live="polite">
                {qty}
              </span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))} className="flex h-8 min-h-0 w-8 items-center justify-center rounded-full hover:bg-black/5">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              buy(qty);
              setQty(1);
            }}
            className="flex h-10 min-h-0 items-center justify-center rounded-full bg-[var(--m-ink)] px-3 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.03em] text-[var(--m-ink-text)] transition hover:opacity-85 sm:text-[length:calc(12.5px*var(--m-scale))]"
          >
            {needsChoice ? "Choose options" : <>Add to cart<span className="hidden sm:inline">&nbsp;– {rupees(product.price * qty)}</span></>}
          </button>
        </div>
      )}
    </div>
  );
}

// Theme 15's flavour cards each take a colour of their own
const FLAVOR_COLOURS = ["#1E88C8", "#13995A", "#F06A1D", "#E2526B", "#7B4BC4", "#C99A0E"];

function flavourColour(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FLAVOR_COLOURS[h % FLAVOR_COLOURS.length];
}

/** Theme 15: a coloured card with a label band, the name in its colour, stars, a description, Add to cart and Shop now. */
function FlavorCard({ product, className }: { product: ProductData; className?: string }) {
  const { store } = useSite();
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const colour = flavourColour(product.id);
  const reviews = canUseReviews(store.planId) ? (store.reviews || []).filter((r) => r.productId === product.id && r.status === "approved") : [];
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const sold = unitsSold(store);
  const top = (sold[product.id] || 0) > 0 && Object.values(sold).sort((a, b) => b - a).slice(0, 3).includes(sold[product.id]);
  const label = soldOut ? "Sold out" : off > 0 ? `${off}% off!` : top ? "Best seller!" : Date.now() - new Date(product.createdAt || 0).getTime() < 30 * 86400000 ? "New flavour!" : "Fan favourite!";
  return (
    <div className={cn("group flex min-w-0 flex-col border-2 bg-[#FFFDF8] transition duration-300 lg:hover:-translate-y-1.5 lg:hover:rotate-[-0.6deg]", className)} style={{ borderColor: colour }}>
      <p className="truncate bg-[#FFE14D] px-2.5 py-1 text-[length:calc(10px*var(--m-scale))] font-bold uppercase tracking-[0.06em] text-[#2A2320]">{label}</p>
      <MLink to={to} className="relative block aspect-[4/3.2] overflow-hidden" aria-label={product.title}>
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        )}
      </MLink>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <MLink to={to} className="m-h block min-h-0 text-[length:calc(clamp(16px,1.45vw,21px)*var(--m-scale))] leading-[1.02] [overflow-wrap:anywhere]" style={{ color: colour }}>
          {product.title}
        </MLink>
        {reviews.length > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[length:calc(11px*var(--m-scale))]" style={{ color: colour }}>
            <Stars value={avg} className="[&_svg]:h-3 [&_svg]:w-3" />
            <span className="opacity-80">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </p>
        )}
        {product.description && <p className="m-muted mt-2 line-clamp-3 text-[length:calc(12px*var(--m-scale))] leading-snug">{product.description}</p>}
        <div className="mt-auto flex flex-col gap-1.5 pt-3">
          <span className="text-[length:calc(13px*var(--m-scale))] font-semibold tabular-nums">
            {off > 0 && <span className="m-faint mr-1.5 font-normal line-through">{rupees(product.compareAtPrice!)}</span>}
            {rupees(product.price)}
          </span>
          {!soldOut && (
            <button type="button" onClick={() => buy()} className="flex h-9 min-h-0 items-center justify-center text-[length:calc(11px*var(--m-scale))] font-bold uppercase tracking-[0.06em] text-white transition hover:opacity-85" style={{ background: colour }}>
              {needsChoice ? "Choose options" : "Add to cart"}
            </button>
          )}
          <MLink to={to} className="flex h-9 min-h-0 items-center justify-center border-2 text-[length:calc(11px*var(--m-scale))] font-bold uppercase tracking-[0.06em] transition hover:bg-black/5" style={{ borderColor: colour, color: colour }}>
            Shop now
          </MLink>
        </div>
      </div>
    </div>
  );
}

/** Theme 16: the photo on a soft rounded panel with a heart and Quick view, a serif name, stars and a pill button. */
function SoftCard({ product, className }: { product: ProductData; className?: string }) {
  const { store, wishlist, toggleWish } = useSite();
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const wished = wishlist.includes(product.id);
  const reviews = canUseReviews(store.planId) ? (store.reviews || []).filter((r) => r.productId === product.id && r.status === "approved") : [];
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const cat = (store.categories || []).find((c) => c.slug === product.category);
  return (
    <div className={cn("group flex min-w-0 flex-col", className)}>
      <div className="m-panel m-card relative aspect-[4/4.6] overflow-hidden">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
          )}
        </MLink>
        {(soldOut || off > 0) && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-[var(--m-bg)] px-2 py-0.5 text-[length:calc(10.5px*var(--m-scale))] font-medium">{soldOut ? "Sold out" : `−${off}%`}</span>
        )}
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2.5 top-2.5 flex h-8 min-h-0 w-8 items-center justify-center rounded-full bg-[var(--m-bg)] text-[var(--m-accent)] shadow-sm"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-current")} strokeWidth={1.7} />
        </button>
        <MLink
          to={to}
          className="absolute bottom-2.5 right-2.5 flex h-7 min-h-0 items-center gap-1 rounded-full bg-[var(--m-bg)] px-2.5 text-[length:calc(10.5px*var(--m-scale))] font-medium shadow-sm transition lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.7} /> Quick view
        </MLink>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <MLink to={to} className="m-h min-h-0 min-w-0 text-[length:calc(clamp(14px,1.3vw,17px)*var(--m-scale))] leading-snug hover:text-[var(--m-accent)]">
          {product.title}
        </MLink>
        <span className="mt-0.5 shrink-0 text-[length:calc(12.5px*var(--m-scale))] font-semibold tabular-nums">{rupees(product.price)}</span>
      </div>
      {reviews.length > 0 ? (
        <Stars value={avg} className="mt-1.5 text-[var(--m-accent)] [&_svg]:h-3 [&_svg]:w-3" />
      ) : (
        cat && <p className="m-muted mt-1 text-[length:calc(11.5px*var(--m-scale))]">{cat.name}</p>
      )}
      {/* buttons line up across a row whether or not a card has stars */}
      {!soldOut && (
        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={() => buy()}
            className="flex h-10 min-h-0 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--m-accent)] text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] text-[var(--m-accent-text)] transition hover:opacity-85"
          >
            {needsChoice ? "Choose options" : "Add to bag"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Theme 18: a white card with a soft shadow, a rounded photo, the name and a bold price; a bag button shows on hover. */
function ShadowCard({ product, className }: { product: ProductData; className?: string }) {
  const { wishlist, toggleWish } = useSite();
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const wished = wishlist.includes(product.id);
  return (
    <div
      className={cn(
        "group flex min-w-0 flex-col rounded-[var(--m-card)] bg-white p-2 text-[#1A1A2E] shadow-[0_10px_30px_-18px_rgba(30,20,60,0.35)] transition duration-300 sm:p-2.5 lg:hover:-translate-y-1 lg:hover:shadow-[0_24px_44px_-22px_rgba(30,20,60,0.45)]",
        className
      )}
    >
      <div className="m-panel relative aspect-square overflow-hidden rounded-[calc(var(--m-card)-4px)]">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
          )}
        </MLink>
        {(soldOut || off > 0) && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[length:calc(10.5px*var(--m-scale))] font-semibold">{soldOut ? "Sold out" : `−${off}%`}</span>
        )}
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2 top-2 flex h-8 min-h-0 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-current text-[var(--m-accent)]")} strokeWidth={1.7} />
        </button>
        {!soldOut && (
          <button
            type="button"
            onClick={() => buy()}
            aria-label={needsChoice ? `Choose options for ${product.title}` : `Add ${product.title} to bag`}
            className="absolute bottom-2 right-2 flex h-9 min-h-0 w-9 items-center justify-center rounded-full bg-[var(--m-accent)] text-[var(--m-accent-text)] shadow-md transition lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
          </button>
        )}
      </div>
      <div className="px-1 pb-1.5 pt-3">
        <MLink to={to} className="block min-h-0 truncate text-[length:calc(13px*var(--m-scale))]">
          {product.title}
        </MLink>
        <p className="mt-1 text-[length:calc(14px*var(--m-scale))] font-bold tabular-nums">
          {rupees(product.price)}
          {off > 0 && <span className="ml-1.5 text-[length:calc(12px*var(--m-scale))] font-normal text-black/35 line-through">{rupees(product.compareAtPrice!)}</span>}
        </p>
      </div>
    </div>
  );
}

/** Theme 24: a light rounded photo with a sale tag, the name, price, colour dots and an outlined Add to cart. */
function TechCard({ product, className }: { product: ProductData; className?: string }) {
  const { wishlist, toggleWish } = useSite();
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const wished = wishlist.includes(product.id);
  const swatches = (product.colorSwatches || []).slice(0, 4);
  return (
    <div className={cn("group flex min-w-0 flex-col rounded-[var(--m-card)] border border-[color-mix(in_srgb,var(--m-text)_8%,transparent)] bg-[var(--m-bg)] p-2 transition duration-300 lg:hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)]", className)}>
      <div className="m-panel relative aspect-square overflow-hidden rounded-[calc(var(--m-card)-4px)]">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
          )}
        </MLink>
        {(soldOut || off > 0) && (
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-[#F05A4A] px-2 py-0.5 text-[length:calc(10.5px*var(--m-scale))] font-semibold text-white">{soldOut ? "Sold out" : `−${off}%`}</span>
        )}
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute left-2 top-2 flex h-8 min-h-0 w-8 items-center justify-center rounded-full bg-white/90 opacity-100 shadow-sm transition lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-current")} strokeWidth={1.7} />
        </button>
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <MLink to={to} className="line-clamp-2 min-h-0 text-[length:calc(12.5px*var(--m-scale))] leading-snug hover:underline">
          {product.title}
        </MLink>
        <p className="mt-1 text-[length:calc(13px*var(--m-scale))] font-semibold tabular-nums">
          {off > 0 && <span className="m-faint mr-1.5 font-normal line-through">{rupees(product.compareAtPrice!)}</span>}
          <span className={cn(off > 0 && "text-[#E5483B]")}>{rupees(product.price)}</span>
        </p>
        {swatches.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {swatches.map((c, i) => (
              <span key={i} className="h-3.5 w-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: c }} />
            ))}
          </div>
        )}
        {!soldOut && (
          <div className="mt-auto pt-3">
            <button
              type="button"
              onClick={() => buy()}
              className="m-line flex h-9 min-h-0 w-full items-center justify-center rounded-full border text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] transition-colors hover:border-[var(--m-text)] hover:bg-[var(--m-text)] hover:text-[var(--m-bg)]"
            >
              {needsChoice ? "Choose options" : "Add to cart"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// a few hand-drawn-looking shapes for the menu cards, used in turn
const BLOB_SHAPES = ["44% 56% 48% 52% / 54% 46% 54% 46%", "52% 48% 40% 60% / 46% 56% 44% 54%", "38% 62% 56% 44% / 52% 40% 60% 48%", "58% 42% 50% 50% / 44% 58% 42% 56%"];

/** Theme 25: the product on a round plate inside a soft organic colour shape, the name, a line and a round add button. */
function BlobCard({ product, className }: { product: ProductData; className?: string }) {
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  let h = 0;
  for (const ch of product.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <div
      className={cn("group relative flex min-w-0 flex-col items-center px-4 pb-6 pt-5 text-center text-white transition duration-300 lg:hover:-translate-y-1.5 lg:hover:rotate-[-1deg]", className)}
      style={{ background: "var(--m-panel)", borderRadius: BLOB_SHAPES[h % BLOB_SHAPES.length] }}
    >
      {off > 0 && <span className="m-burst absolute left-3 top-3 z-[1] px-3 py-2 text-[length:calc(10px*var(--m-scale))] font-bold text-[#2B2118]">−{off}%</span>}
      <MLink to={to} className="relative block aspect-square w-[78%] overflow-hidden rounded-full border-[6px] border-white/85 shadow-[0_18px_30px_-18px_rgba(0,0,0,0.5)]" aria-label={product.title}>
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.08] group-hover:rotate-[4deg]" />
        )}
      </MLink>
      <MLink to={to} className="m-h mt-4 block min-h-0 text-[length:calc(clamp(15px,1.4vw,19px)*var(--m-scale))] leading-tight">
        {product.title}
      </MLink>
      {product.description && <p className="mt-1.5 line-clamp-2 max-w-[16rem] text-[length:calc(12px*var(--m-scale))] leading-snug text-white/80">{product.description}</p>}
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[length:calc(15px*var(--m-scale))] font-bold tabular-nums">{rupees(product.price)}</span>
        {!soldOut && (
          <button
            type="button"
            onClick={() => buy()}
            aria-label={needsChoice ? `Choose options for ${product.title}` : `Add ${product.title} to bag`}
            className="flex h-9 min-h-0 w-9 items-center justify-center rounded-full bg-[var(--m-accent)] text-[var(--m-accent-text)] transition hover:scale-110"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Theme 28: a tall photo with a heart, the category in small capitals, the name, and the saving in the accent colour. */
function EthnicCard({ product, className }: { product: ProductData; className?: string }) {
  const { store, wishlist, toggleWish } = useSite();
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const wished = wishlist.includes(product.id);
  const label = (store.categories || []).find((c) => c.slug === product.category)?.name || store.name;
  return (
    <div className={cn("group flex min-w-0 flex-col", className)}>
      <div className="m-panel m-card relative aspect-[3/4] overflow-hidden">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
          )}
        </MLink>
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className={cn("absolute right-2 top-2 flex h-8 min-h-0 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition", wished ? "text-[var(--m-accent)]" : "text-[#555]")}
        >
          <Heart className={cn("h-4 w-4", wished && "fill-current")} strokeWidth={1.7} />
        </button>
        {soldOut ? (
          <span className="absolute left-2 top-2 rounded bg-[#222] px-2 py-0.5 text-[length:calc(10px*var(--m-scale))] font-semibold text-white">Sold out</span>
        ) : (
          <button
            type="button"
            onClick={() => buy()}
            className="absolute inset-x-2 bottom-2 flex h-9 min-h-0 items-center justify-center gap-1.5 rounded-[calc(var(--m-card)-2px)] bg-white/95 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] text-[var(--m-accent)] shadow-sm transition duration-300 lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2} />
            {needsChoice ? "Choose size" : "Add to bag"}
          </button>
        )}
      </div>
      <div className="pt-3">
        <p className="m-faint truncate text-[length:calc(9.5px*var(--m-scale))] font-medium uppercase tracking-[0.1em]">{label}</p>
        <MLink to={to} className="mt-1 line-clamp-1 min-h-0 text-[length:calc(12.5px*var(--m-scale))] leading-snug hover:text-[var(--m-accent)]">
          {product.title}
        </MLink>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[length:calc(13.5px*var(--m-scale))] tabular-nums">
          <span className="font-semibold">{rupees(product.price)}</span>
          {off > 0 && (
            <>
              <span className="m-faint text-[length:calc(11.5px*var(--m-scale))] line-through">{rupees(product.compareAtPrice!)}</span>
              <span className="text-[length:calc(11px*var(--m-scale))] font-semibold text-[var(--m-accent)]">({off}% OFF)</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Theme 29: a framed photo with a gold corner, the name centred in the heading font and a price pill that adds to the bag. */
function DrapeCard({ product, className }: { product: ProductData; className?: string }) {
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  return (
    <div className={cn("group flex min-w-0 flex-col items-center text-center", className)}>
      <MLink to={to} className="t-drape relative block aspect-[4/5] w-full overflow-hidden bg-[var(--m-panel)]" aria-label={product.title}>
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        )}
        {off > 0 && !soldOut && (
          <span className="absolute left-0 top-3 bg-[var(--m-accent)] px-2.5 py-1 text-[length:calc(10px*var(--m-scale))] font-semibold tracking-[0.06em] text-[var(--m-accent-text)]">{off}% OFF</span>
        )}
      </MLink>
      <MLink to={to} className="m-h mt-3 line-clamp-2 min-h-0 px-1 text-[length:calc(clamp(14px,1.15vw,17px)*var(--m-scale))] normal-case leading-tight tracking-normal hover:opacity-70">
        {product.title}
      </MLink>
      {soldOut ? (
        <span className="m-faint mt-2.5 text-[length:calc(12px*var(--m-scale))]">Sold out</span>
      ) : (
        <button
          type="button"
          onClick={() => buy()}
          aria-label={needsChoice ? `Choose options for ${product.title}` : `Add ${product.title} to bag, ${rupees(product.price)}`}
          className="mt-2.5 inline-flex h-8 min-h-0 items-center gap-1.5 rounded-full border border-[#C8963E] bg-[color-mix(in_srgb,#C8963E_16%,var(--m-bg))] px-3.5 text-[length:calc(12px*var(--m-scale))] font-semibold tabular-nums transition-colors hover:bg-[var(--m-accent)] hover:text-[var(--m-accent-text)]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
          {rupees(product.price)}
        </button>
      )}
    </div>
  );
}

/** Theme 30: a white card with a heart, the name, price, stars with the review count and a full-width Add to cart. */
function RatedCard({ product, className }: { product: ProductData; className?: string }) {
  const { wishlist, toggleWish, store } = useSite();
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const wished = wishlist.includes(product.id);
  const reviews = canUseReviews(store.planId) && (product.reviewCount || 0) > 0;
  return (
    <div className={cn("group flex min-w-0 flex-col overflow-hidden rounded-[var(--m-card)] bg-white text-[#2A1A28] shadow-[0_10px_30px_-22px_rgba(42,26,40,0.55)] transition duration-300 lg:hover:-translate-y-1", className)}>
      <div className="relative aspect-[4/4.3] overflow-hidden bg-[var(--m-panel)]">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
          )}
        </MLink>
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2.5 top-2.5 flex h-8 min-h-0 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-[var(--m-accent)] text-[var(--m-accent)]")} strokeWidth={1.7} />
        </button>
        {off > 0 && <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--m-accent)] px-2 py-0.5 text-[length:calc(10px*var(--m-scale))] font-semibold text-white">−{off}%</span>}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <MLink to={to} className="line-clamp-2 min-h-0 text-[length:calc(12.5px*var(--m-scale))] font-medium leading-snug hover:text-[var(--m-accent)]">
          {product.title}
        </MLink>
        <p className="mt-1 text-[length:calc(13px*var(--m-scale))] font-semibold tabular-nums">
          {rupees(product.price)}
          {off > 0 && <span className="ml-1.5 font-normal text-[#2A1A28]/45 line-through">{rupees(product.compareAtPrice!)}</span>}
        </p>
        {reviews && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[#C58B2A]">
            <Stars value={product.rating || 5} className="[&_svg]:h-3 [&_svg]:w-3" />
            <span className="text-[length:calc(11px*var(--m-scale))] text-[#2A1A28]/55">({product.reviewCount})</span>
          </p>
        )}
        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={() => buy()}
            disabled={soldOut}
            className="flex h-9 min-h-0 w-full items-center justify-center rounded-[calc(var(--m-card)-4px)] bg-[#2A1A28] text-[length:calc(11.5px*var(--m-scale))] font-medium text-white transition-colors hover:bg-[var(--m-accent)] disabled:opacity-40"
          >
            {soldOut ? "Sold out" : needsChoice ? "Choose options" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** A steady number for a product, so its tile colour doesn't change between visits. */
function productHash(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

const PASTELS = ["#F9CDD3", "#CFE0F2", "#FBE3D2", "#F3E6D6"];

/** Theme 32: the product on a pastel tile, a heart, the name in serif, the price and a round + button. */
function PastelCard({ product, className }: { product: ProductData; className?: string }) {
  const { wishlist, toggleWish } = useSite();
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const wished = wishlist.includes(product.id);
  return (
    <div className={cn("group flex min-w-0 flex-col overflow-hidden rounded-[var(--m-card)] bg-white/80 transition duration-300 lg:hover:-translate-y-1 lg:hover:shadow-[0_18px_36px_-26px_rgba(80,20,10,0.5)]", className)}>
      <div className="relative aspect-[1/1.02] overflow-hidden" style={{ background: PASTELS[productHash(product.id) % PASTELS.length] }}>
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply transition duration-700 group-hover:scale-[1.05]" />
          )}
        </MLink>
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2 top-2 flex h-8 min-h-0 w-8 items-center justify-center rounded-full text-[var(--m-accent)]"
        >
          <Heart className={cn("h-[17px] w-[17px]", wished && "fill-current")} strokeWidth={1.6} />
        </button>
        {off > 0 && <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--m-accent)] px-2 py-0.5 text-[length:calc(10px*var(--m-scale))] font-semibold text-[var(--m-accent-text)]">−{off}%</span>}
      </div>
      <div className="flex items-end justify-between gap-2 px-3 pb-3 pt-2.5">
        <div className="min-w-0">
          <MLink to={to} className="m-h block min-h-0 truncate text-[length:calc(clamp(14px,1.2vw,17px)*var(--m-scale))] leading-tight hover:text-[var(--m-accent)]">
            {product.title}
          </MLink>
          <p className="mt-1 text-[length:calc(13px*var(--m-scale))] font-semibold tabular-nums text-[var(--m-accent)]">{rupees(product.price)}</p>
        </div>
        {!soldOut && (
          <button
            type="button"
            onClick={() => buy()}
            aria-label={needsChoice ? `Choose options for ${product.title}` : `Add ${product.title} to bag`}
            className="flex h-8 min-h-0 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--m-accent)] text-[var(--m-accent-text)] transition hover:scale-110"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Theme 33: the product framed like a print on a white or pink tile, the name in capitals over an orange line. */
function PrintCard({ product, className }: { product: ProductData; className?: string }) {
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const pink = productHash(product.id) % 2 === 0;
  return (
    <div className={cn("group flex min-w-0 flex-col items-center text-center", className)}>
      <MLink to={to} className={cn("relative flex aspect-square w-full items-center justify-center overflow-hidden transition duration-300", pink ? "bg-[var(--m-panel)]" : "bg-white")} aria-label={product.title}>
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt=""
            loading="lazy"
            className="aspect-[3/4] w-[58%] border-[6px] border-white object-cover shadow-[4px_6px_14px_-4px_rgba(40,30,40,0.35)] transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-1.5deg]"
          />
        )}
        {off > 0 && <span className="absolute left-3 top-3 bg-[#E8772E] px-2 py-0.5 text-[length:calc(10px*var(--m-scale))] font-bold uppercase text-white">Sale</span>}
      </MLink>
      <MLink to={to} className="mt-3 min-h-0 border-b-[3px] border-[#E8772E] pb-0.5 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] hover:opacity-70">
        {product.title}
      </MLink>
      <p className="mt-1.5 text-[length:calc(12.5px*var(--m-scale))] tabular-nums">
        {off > 0 && <span className="m-faint mr-1.5 line-through">{rupees(product.compareAtPrice!)}</span>}
        {rupees(product.price)}
      </p>
      {!soldOut && (
        <button
          type="button"
          onClick={() => buy()}
          className="mt-2 h-8 min-h-0 bg-[var(--m-accent)] px-4 text-[length:calc(10.5px*var(--m-scale))] font-bold uppercase tracking-[0.06em] text-[var(--m-accent-text)] shadow-[3px_3px_0_#E8772E] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_#E8772E] lg:opacity-0 lg:group-hover:opacity-100"
        >
          {needsChoice ? "Choose" : "Add to basket"}
        </button>
      )}
    </div>
  );
}

/** Theme 35: a bordered card with sale and Hot badges, the product, stars, a centred name and the price. */
function PetCard({ product, className }: { product: ProductData; className?: string }) {
  const { store } = useSite();
  const { to, buy, needsChoice, soldOut, off } = useCardBuy(product);
  const hot = (product.reviewCount || 0) >= 8;
  const reviews = canUseReviews(store.planId) && (product.reviewCount || 0) > 0;
  return (
    <div className={cn("group flex min-w-0 flex-col rounded-[var(--m-card)] border border-[color-mix(in_srgb,var(--m-text)_9%,transparent)] bg-white p-2.5 transition duration-300 lg:hover:border-[var(--m-accent)] lg:hover:shadow-[0_16px_34px_-24px_rgba(0,0,0,0.4)] sm:p-3", className)}>
      <div className="relative aspect-square overflow-hidden rounded-[calc(var(--m-card)-4px)] bg-[var(--m-panel)]">
        <MLink to={to} className="absolute inset-0" aria-label={product.title}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" />
          )}
        </MLink>
        {off > 0 && <span className="absolute left-2 top-2 rounded bg-[#E9483B] px-1.5 py-0.5 text-[length:calc(10px*var(--m-scale))] font-bold text-white">−{off}%</span>}
        {hot && <span className="absolute right-2 top-2 rounded bg-[var(--m-accent)] px-1.5 py-0.5 text-[length:calc(10px*var(--m-scale))] font-bold text-white">Hot</span>}
        {!soldOut && (
          <button
            type="button"
            onClick={() => buy()}
            className="absolute inset-x-2 bottom-2 flex h-9 min-h-0 items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] text-[length:calc(11.5px*var(--m-scale))] font-semibold text-white transition duration-300 hover:bg-[var(--m-accent)] lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {needsChoice ? "Choose options" : "Add to cart"}
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center px-1 pb-1 pt-3 text-center">
        {reviews && (
          <p className="flex items-center gap-1 text-[#F5A623]">
            <Stars value={product.rating || 5} className="[&_svg]:h-3 [&_svg]:w-3" />
            <span className="m-faint text-[length:calc(10.5px*var(--m-scale))]">({product.reviewCount})</span>
          </p>
        )}
        <MLink to={to} className="mt-1.5 line-clamp-2 min-h-0 text-[length:calc(12.5px*var(--m-scale))] font-medium leading-snug hover:text-[var(--m-accent)]">
          {product.title}
        </MLink>
        <p className="mt-auto pt-1.5 text-[length:calc(13.5px*var(--m-scale))] font-semibold tabular-nums text-[var(--m-accent)]">
          {off > 0 && <span className="m-faint mr-1.5 font-normal line-through">{rupees(product.compareAtPrice!)}</span>}
          {rupees(product.price)}
        </p>
      </div>
    </div>
  );
}

export function ProductCard({ product, className, aspect }: { product: ProductData; className?: string; aspect?: string }) {
  const { wishlist, toggleWish, content, look } = useSite();
  if (look.card === "boxed") return <BoxedCard product={product} className={className} />;
  if (look.card === "hover") return <HoverCard product={product} className={className} />;
  if (look.card === "detailed") return <DetailedCard product={product} className={className} />;
  if (look.card === "notch") return <NotchCard product={product} className={className} />;
  if (look.card === "spec") return <SpecCard product={product} className={className} />;
  if (look.card === "line") return <LineCard product={product} className={className} aspect={aspect} />;
  if (look.card === "tile") return <TileCard product={product} className={className} />;
  if (look.card === "jar") return <JarCard product={product} className={className} />;
  if (look.card === "flavor") return <FlavorCard product={product} className={className} />;
  if (look.card === "soft") return <SoftCard product={product} className={className} />;
  if (look.card === "shadow") return <ShadowCard product={product} className={className} />;
  if (look.card === "tech") return <TechCard product={product} className={className} />;
  if (look.card === "blob") return <BlobCard product={product} className={className} />;
  if (look.card === "ethnic") return <EthnicCard product={product} className={className} />;
  if (look.card === "drape") return <DrapeCard product={product} className={className} />;
  if (look.card === "rated") return <RatedCard product={product} className={className} />;
  if (look.card === "pastel") return <PastelCard product={product} className={className} />;
  if (look.card === "print") return <PrintCard product={product} className={className} />;
  if (look.card === "pet") return <PetCard product={product} className={className} />;
  const off = discountPercent(product);
  const soldOut = product.stock <= 0;
  const wished = wishlist.includes(product.id);
  const second = product.images?.[1];
  // "fit": the whole product sits on the grey panel (photos on white blend into it); "fill": photo covers the card
  const fit = content.settings.productPhotos === "fit";
  const photo = cn(
    "absolute inset-0 h-full w-full transition duration-700",
    fit ? "object-contain p-[9%] mix-blend-multiply group-hover:scale-[1.04]" : "object-cover group-hover:scale-[1.03]"
  );
  return (
    <div className={cn("group relative min-w-0", className)}>
      <MLink to={`/products/${product.slug || product.id}`} className="block">
        <div className="m-panel m-card relative aspect-[2/3] overflow-hidden">
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.title} loading="lazy" className={cn(photo, second && "group-hover:opacity-0")} />
          )}
          {second && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={second} alt="" loading="lazy" className={cn(photo, "opacity-0 group-hover:opacity-100")} />
          )}
          {soldOut && (
            <span className="m-cap absolute left-0 top-0 bg-[var(--m-text)] px-2 py-1 text-[length:calc(10px*var(--m-scale))] font-medium tracking-wider text-[var(--m-bg)]">
              Sold out
            </span>
          )}
        </div>
        {/* name above the price on phones, side by side from sm up */}
        <div className="mt-2.5 flex flex-col gap-0.5 text-[length:calc(11.5px*var(--m-scale))] leading-snug sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <span className="m-cap truncate font-medium tracking-[0.04em]">{product.title}</span>
          <span className="shrink-0 whitespace-nowrap">
            {off > 0 && <span className="m-faint mr-1.5 line-through">{rupees(product.compareAtPrice!)}</span>}
            {rupees(product.price)}
          </span>
        </div>
      </MLink>
      <button
        type="button"
        onClick={() => toggleWish(product.id)}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wished}
        data-on={wished}
        className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center transition-opacity sm:opacity-0 sm:group-hover:opacity-100 data-[on=true]:opacity-100"
      >
        <Heart className={cn("h-[17px] w-[17px]", wished && "fill-current")} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function ProductGrid({ products, extra }: { products: ProductData[]; extra?: React.ReactNode }) {
  const { look } = useSite();
  return (
    <div
      className={cn(
        "m-stagger grid grid-cols-2",
        look.card === "spec" || look.card === "jar" || look.card === "blob" || look.card === "print" ? "lg:grid-cols-3" : look.card === "drape" ? "md:grid-cols-3 lg:grid-cols-5" : "md:grid-cols-3 lg:grid-cols-4",
        look.card === "plain" ? "gap-x-1.5 gap-y-7 sm:gap-x-2" : look.card === "notch" ? "gap-x-2.5 gap-y-6 sm:gap-x-4 sm:gap-y-8" : look.card === "spec" ? "gap-2.5 sm:gap-4" : look.card === "line" ? "gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-9" : look.card === "jar" ? "gap-3 sm:gap-5 lg:gap-7" : look.card === "tile" || look.card === "flavor" ? "gap-2.5 sm:gap-3.5" : look.card === "soft" ? "gap-x-3 gap-y-8 sm:gap-x-5" : look.card === "shadow" || look.card === "tech" ? "gap-2.5 sm:gap-4" : look.card === "blob" ? "gap-4 sm:gap-6" : look.card === "drape" ? "gap-x-3 gap-y-8 sm:gap-x-5" : look.card === "ethnic" ? "gap-x-3 gap-y-7 sm:gap-x-4" : look.card === "rated" || look.card === "pastel" || look.card === "pet" ? "gap-3 sm:gap-4" : look.card === "print" ? "gap-x-4 gap-y-8 sm:gap-x-6" : "gap-x-3 gap-y-6 sm:gap-x-4"
      )}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
      {extra}
    </div>
  );
}

/** Six products in a mixed grid: two small and a wide one, then a wide one and two small (Theme 10). */
export function BentoGrid({ products }: { products: ProductData[] }) {
  return (
    <div className="m-stagger grid grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-3 sm:gap-y-8 lg:grid-cols-4">
      {products.slice(0, 6).map((p, i) => {
        const wide = i === 2 || i === 3;
        return <ProductCard key={p.id} product={p} aspect={wide ? "2.05/1" : undefined} className={wide ? "col-span-2" : undefined} />;
      })}
    </div>
  );
}

/** Row of four products that slides, with thin arrows in the page margin on wide screens. */
export function ProductSlider({ products }: { products: ProductData[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { look } = useSite();
  const [edges, setEdges] = React.useState({ start: true, end: false });
  // how much of the row is visible and how far it has scrolled, for the bar under it
  const [bar, setBar] = React.useState({ size: 1, at: 0 });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    const size = Math.min(1, el.clientWidth / Math.max(1, el.scrollWidth));
    setBar({ size, at: el.scrollWidth > el.clientWidth ? (el.scrollLeft / (el.scrollWidth - el.clientWidth)) * (1 - size) : 0 });
  };
  React.useEffect(update, [products.length]);
  const move = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: "smooth" });
  const arrow = "absolute top-[40%] hidden h-10 w-[var(--g)] items-center justify-center transition-opacity disabled:opacity-20 md:flex";
  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={update}
        className={cn(
          "m-stagger m-scroll -mx-[var(--g)] flex snap-x snap-mandatory overflow-x-auto px-[var(--g)] scroll-px-[var(--g)] md:mx-0 md:px-0 md:scroll-px-0",
          look.card === "spec" || look.card === "jar" ? "gap-2.5 sm:gap-4" : look.card === "tile" || look.card === "flavor" || look.card === "soft" || look.card === "shadow" || look.card === "tech" ? "gap-2.5 sm:gap-3.5" : look.card === "blob" ? "gap-4" : look.card === "ethnic" || look.card === "drape" ? "gap-3 sm:gap-4" : look.card === "rated" ? "gap-3 pb-3 sm:gap-4" : look.card === "pastel" || look.card === "pet" || look.card === "print" ? "gap-3 sm:gap-4" : "gap-1.5 sm:gap-2"
        )}
      >
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            className={cn(
              "shrink-0 snap-start",
              look.card === "spec" || look.card === "jar"
                ? "w-[46%] sm:w-[40%] md:w-[calc((100%-2rem)/3)]"
                : look.card === "ethnic" || look.card === "rated" || look.card === "pastel" || look.card === "pet" || look.card === "print"
                  ? "w-[46%] sm:w-[31%] md:w-[calc((100%-3rem)/4)]"
                  : "w-[44%] sm:w-[31%] md:w-[calc((100%-1.5rem)/4)]"
            )}
          />
        ))}
      </div>
      {(look.card === "detailed" || look.sliderBar) && bar.size < 1 && (
        <div className="m-line relative mt-6 h-px border-t" aria-hidden>
          <span className="absolute -top-px h-[2px] bg-[var(--m-text)] transition-[left] duration-150" style={{ width: `${bar.size * 100}%`, left: `${bar.at * 100}%` }} />
        </div>
      )}
      {products.length > 4 && look.roundArrows && (
        <>
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d < 0 ? "Previous products" : "Next products"}
              onClick={() => move(d as 1 | -1)}
              disabled={d < 0 ? edges.start : edges.end}
              className={cn(
                "absolute top-[36%] z-[2] hidden h-10 min-h-0 w-10 items-center justify-center rounded-full shadow-md transition disabled:opacity-0 md:flex",
                d < 0 ? "left-0 -translate-x-1/2 bg-white text-[#333]" : "right-0 translate-x-1/2 bg-[var(--m-accent)] text-[var(--m-accent-text)]"
              )}
            >
              {d < 0 ? <ChevronLeft className="h-5 w-5" strokeWidth={1.8} /> : <ChevronRight className="h-5 w-5" strokeWidth={1.8} />}
            </button>
          ))}
        </>
      )}
      {products.length > 4 && !look.roundArrows && (
        <>
          <button type="button" aria-label="Previous products" onClick={() => move(-1)} disabled={edges.start} className={cn(arrow, "right-full")}>
            <ChevronLeft className="h-6 w-6" strokeWidth={1.2} />
          </button>
          <button type="button" aria-label="Next products" onClick={() => move(1)} disabled={edges.end} className={cn(arrow, "left-full")}>
            <ChevronRight className="h-6 w-6" strokeWidth={1.2} />
          </button>
        </>
      )}
    </div>
  );
}

export function QtyStepper({
  value,
  onChange,
  max = 99,
  small,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  small?: boolean;
}) {
  return (
    <div className={cn("m-line inline-flex items-center rounded-full border", small ? "h-9" : "h-12")}>
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(value - 1)} className={cn("flex h-full items-center justify-center", small ? "w-9" : "w-12")}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn("text-center text-[length:calc(14px*var(--m-scale))] font-semibold tabular-nums", small ? "w-6" : "w-8")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn("flex h-full items-center justify-center disabled:opacity-30", small ? "w-9" : "w-12")}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  // --g is the page margin, about 6% of the screen like the reference layout
  return <div className={cn("mx-auto w-full max-w-[1680px] px-[var(--g)]", className)}>{children}</div>;
}

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="m-muted m-cap flex flex-wrap items-center gap-1.5 text-[length:calc(11px*var(--m-scale))] tracking-wider">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="m-faint">/</span>}
          {it.to ? (
            <MLink to={it.to} className="min-h-0 hover:text-[var(--m-text)]">
              {it.label}
            </MLink>
          ) : (
            <span className="text-[var(--m-text)]">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: { label: string; to: string } }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <h2 className="m-h text-[length:calc(24px*var(--m-scale))] sm:text-[length:calc(28px*var(--m-scale))]">{title}</h2>
      <p className="m-muted mt-3 max-w-sm text-[length:calc(14px*var(--m-scale))] leading-relaxed">{text}</p>
      {action && (
        <MLink to={action.to} className="m-btn mt-8">
          {action.label}
        </MLink>
      )}
    </div>
  );
}
