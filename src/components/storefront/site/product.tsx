"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Heart, RotateCcw, Share2, ShieldCheck, Star, Truck } from "lucide-react";
import { storeService, type ProductData } from "@/lib/store-service";
import { canUseReviews } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { activeCategories, discountPercent, productsInCategory, rupees, useSite, visibleProducts } from "./context";
import { Container, Crumbs, EmptyState, Price, ProductSlider, QtyStepper, Stars } from "./ui";

function Accordion({ title, children, open: startOpen = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = React.useState(startOpen);
  return (
    <div className="m-line border-b">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="m-cap flex w-full items-center justify-between py-5 text-left text-[length:calc(12px*var(--m-scale))] font-semibold tracking-[0.12em]">
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="m-muted pb-6 text-[length:calc(14px*var(--m-scale))] leading-relaxed">{children}</div>}
    </div>
  );
}

function Gallery({ product }: { product: ProductData }) {
  const images = product.images?.length ? product.images : [""];
  const [active, setActive] = React.useState(0);
  const strip = React.useRef<HTMLDivElement>(null);
  return (
    <div>
      {/* phones: swipe through the photos */}
      <div className="relative md:hidden">
        <div
          ref={strip}
          className="m-scroll -mx-4 flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((src, i) => (
            <div key={i} className="m-panel relative aspect-[4/5] w-full shrink-0 snap-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {src && <img src={src} alt={i === 0 ? product.title : ""} className="absolute inset-0 h-full w-full object-cover" />}
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full bg-black/70 transition-all", i === active ? "w-5" : "w-1.5 opacity-40")} />
            ))}
          </div>
        )}
      </div>
      {/* wider screens: photos in a grid, the first one large */}
      <div className="hidden gap-2 md:grid md:grid-cols-2">
        {images.map((src, i) => (
          <div key={i} className={cn("m-panel m-card relative aspect-[4/5] overflow-hidden", i === 0 && images.length % 2 === 1 && "col-span-2 aspect-[5/5]")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src && <img src={src} alt={i === 0 ? product.title : ""} loading={i > 1 ? "lazy" : undefined} className="absolute inset-0 h-full w-full object-cover" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Reviews({ product }: { product: ProductData }) {
  const { store, editing, demo, showToast, orderTokens } = useSite();
  const reviews = (store.reviews || []).filter((r) => r.productId === product.id && r.status === "approved");
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const [writing, setWriting] = React.useState(false);
  const [name, setName] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  return (
    <section className="m-line border-t py-14 sm:py-20" id="reviews">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="m-h t-section">Reviews</h2>
            {reviews.length > 0 && (
              <p className="mt-3 flex items-center gap-2 text-[length:calc(14px*var(--m-scale))]">
                <Stars value={avg} /> {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          {!writing && (
            <button type="button" onClick={() => setWriting(true)} className="m-btn m-btn-outline">
              Write a review
            </button>
          )}
        </div>
        {writing && (
          <form
            className="m-soft mt-8 grid max-w-xl gap-3 rounded-2xl p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (editing || !name.trim() || !comment.trim()) return;
              const done = () => {
                setWriting(false);
                setName("");
                setComment("");
                showToast("Thanks for your review");
              };
              if (demo) return done();
              storeService
                .addReview(store.subdomain, { productId: product.id, customerName: name.trim(), rating, comment: comment.trim(), orderTokens })
                .then(done)
                .catch((err) => showToast(err instanceof Error ? err.message : "Couldn't post your review."));
            }}
          >
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRating(i)} className="p-1">
                  <Star className={cn("h-6 w-6", i <= rating ? "fill-current" : "opacity-25")} />
                </button>
              ))}
            </div>
            <input className="m-field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
            <textarea className="m-field" rows={4} placeholder="What did you think?" value={comment} onChange={(e) => setComment(e.target.value)} required maxLength={1000} />
            <div className="flex gap-2">
              <button type="submit" className="m-btn">
                Post review
              </button>
              <button type="button" onClick={() => setWriting(false)} className="m-btn m-btn-outline">
                Cancel
              </button>
            </div>
          </form>
        )}
        {reviews.length ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {reviews.slice(0, 12).map((r) => (
              <div key={r.id} className="m-soft rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={r.rating} />
                  <span className="m-faint text-[length:calc(12px*var(--m-scale))]">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
                <p className="mt-2 text-[length:calc(14px*var(--m-scale))] leading-relaxed">{r.comment}</p>
                <p className="m-muted mt-3 flex items-center gap-1.5 text-[length:calc(12px*var(--m-scale))]">
                  {r.customerName}
                  {r.verifiedPurchase && (
                    <>
                      · <Check className="h-3 w-3" /> Verified buyer
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          !writing && <p className="m-muted mt-6 text-[length:calc(14px*var(--m-scale))]">No reviews yet. Be the first to share what you think.</p>
        )}
      </Container>
    </section>
  );
}

/** Desktop thumbnails under or beside a big photo. */
function Thumbs({ images, active, onPick, className }: { images: string[]; active: number; onPick: (i: number) => void; className?: string }) {
  if (images.length < 2) return null;
  return (
    <div className={cn("flex gap-2", className)}>
      {images.map((src, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          aria-label={`Photo ${i + 1}`}
          aria-pressed={i === active}
          className={cn("m-panel relative h-20 w-16 min-h-0 shrink-0 overflow-hidden rounded-md border-2 transition", i === active ? "border-[var(--m-text)]" : "border-transparent opacity-70 hover:opacity-100")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        </button>
      ))}
    </div>
  );
}

/** "stack": one big photo with thumbnails under it (phones swipe as usual). */
function StackGallery({ product }: { product: ProductData }) {
  const images = product.images?.length ? product.images : [""];
  const [active, setActive] = React.useState(0);
  return (
    <div>
      <div className="md:hidden">
        <Gallery product={product} />
      </div>
      <div className="hidden md:block">
        <div className="m-panel m-card relative aspect-[4/5] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {images[active] && <img key={active} src={images[active]} alt={product.title} className="m-page absolute inset-0 h-full w-full object-cover" />}
        </div>
        <Thumbs images={images} active={active} onPick={setActive} className="mt-3" />
      </div>
    </div>
  );
}

/** "centered": the photo in the middle of a soft band, thumbnails under it. */
function CenterGallery({ product }: { product: ProductData }) {
  const images = product.images?.length ? product.images : [""];
  const [active, setActive] = React.useState(0);
  return (
    <div>
      <div className="md:hidden">
        <Gallery product={product} />
      </div>
      <div className="m-panel m-card hidden flex-col items-center px-8 py-10 md:flex">
        <div className="relative aspect-square w-full max-w-[540px] overflow-hidden rounded-[calc(var(--m-card)*0.6)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {images[active] && <img key={active} src={images[active]} alt={product.title} className="m-page absolute inset-0 h-full w-full object-cover" />}
        </div>
        <Thumbs images={images} active={active} onPick={setActive} className="mt-5 justify-center" />
      </div>
    </div>
  );
}

/** "split": the photo fills the left half of the screen. */
function SplitGallery({ product }: { product: ProductData }) {
  const images = product.images?.length ? product.images : [""];
  const [active, setActive] = React.useState(0);
  return (
    <>
      <div className="px-[var(--g)] md:hidden">
        <Gallery product={product} />
      </div>
      <div className="m-panel relative hidden h-full min-h-[560px] overflow-hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {images[active] && <img key={active} src={images[active]} alt={product.title} className="m-page absolute inset-0 h-full w-full object-cover" />}
        <Thumbs images={images} active={active} onPick={setActive} className="absolute bottom-5 left-5" />
      </div>
    </>
  );
}

export function SiteProduct({ slug }: { slug: string }) {
  const { store, content, look, addToBag, wishlist, toggleWish, href, showToast } = useSite();
  const router = useRouter();
  const product = visibleProducts(store).find((p) => p.slug === slug || p.id === slug);
  const [choice, setChoice] = React.useState<Record<string, string>>({});
  const [qty, setQty] = React.useState(1);
  const [missing, setMissing] = React.useState(false);

  React.useEffect(() => {
    setChoice({});
    setQty(1);
    setMissing(false);
  }, [slug]);

  if (!product) {
    return (
      <Container>
        <EmptyState title="Product not found" text="It may be sold out or no longer available." action={{ label: "See all products", to: "/catalog" }} />
      </Container>
    );
  }

  const cats = activeCategories(store);
  const category = cats.find((c) => c.name.toLowerCase() === product.category.toLowerCase() || c.slug === product.category.toLowerCase());
  const related = (category ? productsInCategory(store, category) : visibleProducts(store)).filter((p) => p.id !== product.id).slice(0, 10);
  const options = (product.options || []).filter((o) => o.options?.length);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;
  const off = discountPercent(product);
  const wished = wishlist.includes(product.id);
  const showReviews = canUseReviews(store.planId);
  const reviewList = (store.reviews || []).filter((r) => r.productId === product.id && r.status === "approved");
  const avg = reviewList.length ? reviewList.reduce((n, r) => n + r.rating, 0) / reviewList.length : 0;

  const variantName = options.map((o) => `${o.name}: ${choice[o.name]}`).join(" / ");
  const ready = options.every((o) => choice[o.name]);
  const add = (thenCheckout: boolean) => {
    if (!ready) {
      setMissing(true);
      return;
    }
    addToBag(product, qty, options.length ? variantName : undefined);
    if (thenCheckout) router.push(href("/checkout"));
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.title, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied");
      }
    } catch {}
  };

  const details = [
    product.details?.fabric && ["Fabric", product.details.fabric],
    product.details?.fit && ["Fit", product.details.fit],
    product.details?.care && ["Care", product.details.care],
  ].filter(Boolean) as [string, string][];

  // the details and buy buttons, and the description and policies, placed by the theme's product layout
  const layout = look.productLayout || "grid";
  const buyBox = (
    <>
      {category && <p className="m-muted m-cap text-[length:calc(11px*var(--m-scale))] tracking-[0.16em]">{category.name}</p>}
      <h1 className="m-h mt-3 t-product [overflow-wrap:anywhere]">{product.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Price product={product} className="text-[length:calc(20px*var(--m-scale))]" />
        {off > 0 && <span className="m-cap bg-[var(--m-accent)] px-2 py-1 text-[length:calc(10px*var(--m-scale))] font-bold tracking-wider text-[var(--m-accent-text)]">Save {off}%</span>}
      </div>
      {store.pricesIncludeTax !== false && <p className="m-faint mt-1 text-[length:calc(12px*var(--m-scale))]">Inclusive of all taxes</p>}
      {showReviews && reviewList.length > 0 && (
        <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[length:calc(14px*var(--m-scale))]">
          <Stars value={avg} /> <span className="m-muted underline underline-offset-4">{reviewList.length} review{reviewList.length === 1 ? "" : "s"}</span>
        </a>
      )}

      {options.map((o) => {
        const isColour = /colou?r|shade/i.test(o.name);
        return (
          <fieldset key={o.id || o.name} className="mt-7">
            <legend className="m-cap text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.14em]">
              {o.name}
              {choice[o.name] && <span className="m-muted ml-2 normal-case tracking-normal">{choice[o.name]}</span>}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {o.options.map((v) => {
                const on = choice[o.name] === v;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setChoice((c) => ({ ...c, [o.name]: v }));
                      setMissing(false);
                    }}
                    className={cn(
                      "m-line min-w-[3.25rem] rounded-full border px-4 py-2.5 text-[length:calc(13px*var(--m-scale))] font-medium transition-colors",
                      on ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "hover:border-[var(--m-text)]",
                      isColour && "capitalize"
                    )}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      {missing && <p className="mt-3 text-[length:calc(13px*var(--m-scale))] font-medium text-red-600">Choose {options.filter((o) => !choice[o.name]).map((o) => o.name.toLowerCase()).join(" and ")} first.</p>}

      <div className="mt-8 flex items-center gap-3">
        {!soldOut && <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} max={product.stock} />}
        <button type="button" onClick={() => toggleWish(product.id)} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} className="m-line flex h-12 w-12 items-center justify-center rounded-full border">
          <Heart className={cn("h-[18px] w-[18px]", wished && "fill-current")} />
        </button>
        <button type="button" onClick={share} aria-label="Share" className="m-line flex h-12 w-12 items-center justify-center rounded-full border">
          <Share2 className="h-[18px] w-[18px]" />
        </button>
      </div>
      {lowStock && <p className="mt-3 text-[length:calc(13px*var(--m-scale))] font-medium">Only {product.stock} left</p>}

      <div className="mt-6 grid gap-2">
        <button type="button" disabled={soldOut} onClick={() => add(false)} className="m-btn h-12 w-full">
          {soldOut ? "Sold out" : "Add to bag"}
        </button>
        {!soldOut && (
          <button type="button" onClick={() => add(true)} className="m-btn m-btn-outline h-12 w-full">
            Buy now
          </button>
        )}
      </div>

      <ul className="m-soft mt-6 space-y-3 rounded-2xl p-5 text-[length:calc(13px*var(--m-scale))]">
        <li className="flex items-center gap-3">
          <Truck className="h-4 w-4 shrink-0" />
          {!(store.standardDeliveryFee > 0)
            ? "Free delivery on every order"
            : store.freeDeliveryThreshold > 0
              ? `Free delivery on orders over ${rupees(store.freeDeliveryThreshold)}`
              : `Delivery ${rupees(store.standardDeliveryFee)} per order`}
        </li>
        {store.codEnabled && (
          <li className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Cash on delivery available
          </li>
        )}
        <li className="flex items-center gap-3">
          <RotateCcw className="h-4 w-4 shrink-0" />
          Easy exchanges, see our returns policy
        </li>
      </ul>
    </>
  );
  const infoBox = (
    <>
      <div className="mt-6">
        <Accordion title="Description" open>
          <p className="whitespace-pre-line">{product.description || "No description yet."}</p>
        </Accordion>
        {details.length > 0 && (
          <Accordion title="Details">
            <dl className="grid grid-cols-[6rem_1fr] gap-y-2">
              {details.map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt className="font-medium text-[var(--m-text)]">{k}</dt>
                  <dd>{v}</dd>
                </React.Fragment>
              ))}
            </dl>
          </Accordion>
        )}
        <Accordion title={content.pages.shipping.title}>
          <p className="whitespace-pre-line">{content.pages.shipping.body}</p>
        </Accordion>
        <Accordion title={content.pages.returns.title}>
          <p className="whitespace-pre-line">{content.pages.returns.body}</p>
        </Accordion>
      </div>
    </>
  );

  return (
    <div>
      <Container className="pt-6 sm:pt-8">
        <Crumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Catalog", to: "/catalog" },
            ...(category ? [{ label: category.name, to: `/category/${category.slug}` }] : []),
            { label: product.title },
          ]}
        />
      </Container>
      {layout === "split" ? (
        <div className="grid pb-16 pt-5 md:grid-cols-2 md:pt-0">
          <div className="md:sticky md:top-[var(--hh)] md:h-[calc(100svh-var(--hh))] md:self-start">
            <SplitGallery product={product} />
          </div>
          <div className="px-[var(--g)] pt-8 md:bg-[color-mix(in_srgb,var(--m-panel)_45%,var(--m-bg))] md:px-[clamp(28px,4vw,72px)] md:py-14">
            <div className="max-w-xl">
              {buyBox}
              {infoBox}
            </div>
          </div>
        </div>
      ) : layout === "centered" ? (
        <>
          <Container className="pt-5">
            <CenterGallery product={product} />
          </Container>
          <Container className="grid gap-6 pb-16 pt-8 md:grid-cols-2 md:gap-16 md:pt-12">
            <div>{buyBox}</div>
            <div>{infoBox}</div>
          </Container>
        </>
      ) : (
        <Container className="grid gap-8 pb-16 pt-5 md:grid-cols-[1.25fr_1fr] md:gap-12 lg:gap-16">
          {layout === "stack" ? <StackGallery product={product} /> : <Gallery product={product} />}
          <div className="md:sticky md:top-28 md:self-start">
            {buyBox}
            {infoBox}
          </div>
        </Container>
      )}

      {showReviews && <Reviews product={product} />}

      {related.length > 0 && (
        <section className="m-line border-t py-14 sm:py-20">
          <Container>
            <h2 className="m-h mb-8 t-section sm:mb-12">You may also like</h2>
            <ProductSlider products={related} />
          </Container>
        </section>
      )}

      {/* phones: keep the buy button in reach */}
      {!soldOut && (
        <div className="m-line fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-[var(--m-bg)] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[length:calc(13px*var(--m-scale))] font-medium">{product.title}</p>
            <Price product={product} className="text-[length:calc(14px*var(--m-scale))]" />
          </div>
          <button type="button" onClick={() => add(false)} className="m-btn h-12 shrink-0 px-6">
            Add to bag
          </button>
        </div>
      )}
      {!soldOut && <div className="h-20 md:hidden" />}
    </div>
  );
}
