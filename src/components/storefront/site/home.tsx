"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUpRight, Award, Check, Clock, ChevronDown, ChevronLeft, ChevronRight, ChevronsRight, Copy, Flower2, Heart, ImageIcon, Lock, Minus, ShoppingBag, MessageCircle, Plus, RefreshCcw, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { storeService, type BannerData, type ProductData } from "@/lib/store-service";
import { SITE_SECTION_TYPES, headingScale, type SiteSection } from "@/lib/site-content";
import { canUseReviews } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { activeCategories, discountPercent, giftNoteKey, productsFromSource, productsInCategory, rupees, shoppableCategories, useSite, visibleProducts, whatsappLink } from "./context";
import { BentoGrid, Container, InstagramIcon, MLink, ProductCard, ProductGrid, ProductSlider, Stars } from "./ui";

/** Splits a heading on new lines so sellers can choose where it breaks. */
/** Heading text: new lines stay, and words between *stars* are set in the italic accent font. */
function Lines({ text }: { text: string }) {
  const lines = (text || "").split("\n");
  return (
    <>
      {lines.map((l, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {l.split(/\*([^*]+)\*/).map((part, j) =>
            j % 2 ? (
              <em key={j} className="m-em">
                {part}
              </em>
            ) : (
              part
            )
          )}
        </React.Fragment>
      ))}
    </>
  );
}

function Hero({ s }: { s: Record<string, string> }) {
  if (s.imageLayout === "notch") return <NotchHero s={s} />;
  if (s.imageLayout === "showcase") return <ShowcaseHero s={s} />;
  if (s.imageLayout === "banner") return <BannerHero s={s} />;
  if (s.imageLayout === "split-word") return <SplitWordHero s={s} />;
  if (s.imageLayout === "poster") return <PosterHero s={s} />;
  if (s.imageLayout === "bento") return <BentoHero s={s} />;
  if (s.imageLayout === "spec") return <SpecHero s={s} />;
  if (s.imageLayout === "duo") return <DuoHero s={s} />;
  if (s.imageLayout === "block") return <BlockHero s={s} />;
  if (s.imageLayout === "framed") return <FramedHero s={s} />;
  if (s.imageLayout === "pop") return <PopHero s={s} />;
  if (s.imageLayout === "checklist") return <ChecklistHero s={s} />;
  if (s.imageLayout === "blob") return <BlobHero s={s} />;
  if (s.imageLayout === "glow") return <GlowHero s={s} />;
  if (s.imageLayout === "carton") return <CartonHero s={s} />;
  if (s.imageLayout === "wordmark") return <WordmarkHero s={s} />;
  if (s.imageLayout === "look") return <LookHero s={s} />;
  if (s.imageLayout === "inset") return <InsetHero s={s} />;
  if (s.imageLayout === "peek") return <PeekHero s={s} />;
  if (s.imageLayout === "feast") return <FeastHero s={s} />;
  if (s.imageLayout === "fan") return <FanHero s={s} />;
  if (s.imageLayout === "maker") return <MakerHero s={s} />;
  if (s.imageLayout === "carousel") return <SlidesHero s={s} />;
  if (s.imageLayout === "numbered") return <SlidesHero s={s} numbered />;
  if (s.imageLayout === "arches") return <ArchesHero s={s} />;
  if (s.imageLayout === "boutique") return <BoutiqueHero s={s} />;
  if (s.imageLayout === "sparkle") return <SparkleHero s={s} />;
  if (s.imageLayout === "postcard") return <PostcardHero s={s} />;
  if (s.imageLayout === "archway") return <ArchwayHero s={s} />;
  if (s.imageLayout === "splash") return <SplashHero s={s} />;
  if (s.imageLayout === "panel") {
    // a rounded grey panel: tag, big headline and button on the left, the product photo on the right
    return (
      <section className="pt-[clamp(8px,1.2vw,16px)]">
        <div className="px-[clamp(8px,1vw,16px)]">
          <div className="m-panel relative grid min-h-[min(42vw,540px)] items-center gap-6 overflow-hidden p-[clamp(20px,4vw,64px)] md:grid-cols-[1fr_1fr]" style={{ borderRadius: "clamp(14px,1.6vw,24px)" }}>
            <div className="m-rise relative z-10 order-2 min-w-0 md:order-1">
              {s.tag && <span className="inline-flex rounded-full bg-[#d9f99d] px-2.5 py-1 text-[length:calc(11px*var(--m-scale))] font-semibold text-black">{s.tag}</span>}
              <h1 className="m-h m-display t-hero mt-4 [overflow-wrap:anywhere]">
                <Lines text={s.heading} />
              </h1>
              {s.subheading && <p className="mt-4 max-w-sm whitespace-pre-line text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
              {(s.buttonLabel || s.secondButtonLabel) && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {s.buttonLabel && (
                    <MLink to={s.buttonLink || "/catalog"} className="m-btn min-h-11 px-7">
                      {s.buttonLabel}
                    </MLink>
                  )}
                  {s.secondButtonLabel && (
                    <MLink to={s.secondButtonLink || "/catalog"} className="text-[length:calc(13px*var(--m-scale))] font-medium underline underline-offset-4">
                      {s.secondButtonLabel}
                    </MLink>
                  )}
                </div>
              )}
            </div>
            <div className="relative order-1 aspect-[4/3] md:order-2 md:aspect-auto md:h-full md:min-h-[320px]">
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-contain mix-blend-multiply" />
              ) : (
                <div className="m-faint flex h-full items-center justify-center">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }
  if (s.imageLayout === "split") {
    // huge heading and two buttons on the left, a big rounded photo on the right
    return (
      <section className="pt-[clamp(16px,2.4vw,36px)]">
        <Container className="grid items-center gap-8 md:grid-cols-[1fr_1.12fr] md:gap-6">
          <div className="m-rise relative z-10 order-2 min-w-0 md:order-1">
            <h1 className="m-h m-display t-hero [overflow-wrap:anywhere]">
              {(s.heading || "").split("\n").map((line, i) => (
                <span key={i} className={cn("block", i > 0 && "md:pl-[0.85em]")}>
                  {line}
                </span>
              ))}
            </h1>
            {s.subheading && <p className="m-muted mt-[clamp(14px,2vw,28px)] max-w-md whitespace-pre-line text-[length:calc(13px*var(--m-scale))] leading-relaxed md:ml-[clamp(0px,6vw,96px)]">{s.subheading}</p>}
            {(s.buttonLabel || s.secondButtonLabel) && (
              <div className="mt-6 flex flex-wrap gap-2.5 md:ml-[clamp(0px,6vw,96px)]">
                {s.buttonLabel && (
                  <MLink to={s.buttonLink || "/catalog"} className="m-btn min-h-11 px-6">
                    {s.buttonLabel}
                  </MLink>
                )}
                {s.secondButtonLabel && (
                  <MLink to={s.secondButtonLink || "/catalog"} className="m-btn m-btn-outline min-h-11 px-6">
                    {s.secondButtonLabel}
                  </MLink>
                )}
              </div>
            )}
          </div>
          <div className="m-panel relative order-1 aspect-[4/3.4] overflow-hidden rounded-[clamp(14px,1.6vw,24px)] md:order-2">
            {s.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="m-faint flex h-full items-center justify-center">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
          </div>
        </Container>
      </section>
    );
  }
  if (s.imageLayout === "center") {
    // photo across the whole width, darkened, with the heading and button centred over it
    return (
      <section className="relative overflow-hidden bg-[#1c1c1c] text-white">
        <div className="relative mx-auto flex min-h-[78svh] max-w-[1920px] md:h-[min(48vw,100svh)] md:min-h-[480px]">
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex w-full flex-col items-center px-[var(--g)] pb-[clamp(28px,4vw,56px)] pt-[calc(var(--hh)+32px)] text-center">
            <div className="m-rise flex flex-1 flex-col items-center justify-center">
              <h1 className="m-h m-display t-hero [overflow-wrap:anywhere]">
                <Lines text={s.heading} />
              </h1>
              {s.subheading && <p className="mt-4 max-w-xl whitespace-pre-line text-[length:calc(13px*var(--m-scale))] leading-relaxed text-white/85">{s.subheading}</p>}
            </div>
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn m-rise mt-8 min-h-10 !bg-white px-9 !text-black">
                {s.buttonLabel}
              </MLink>
            )}
          </div>
        </div>
      </section>
    );
  }
  // "column": a portrait photo stands in the middle of the panel; "full": the photo fills it, text in white
  const full = s.imageLayout === "full";
  const overlayText = full && !!s.image;
  return (
    <section className="m-panel relative overflow-hidden">
      {/* about 16:9 on laptops (the reference proportion), never taller than the screen */}
      <div className="relative mx-auto max-w-[1680px] md:h-[min(56vw,calc(100svh-var(--hh)))] md:min-h-[420px]">
        {s.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.image}
            alt=""
            className={cn(
              "aspect-square w-full object-cover md:absolute md:inset-y-0 md:aspect-auto md:h-full",
              full ? "md:inset-x-0" : "md:left-[33%] md:w-[40%]"
            )}
          />
        ) : (
          <div className="m-faint flex aspect-square items-center justify-center md:absolute md:inset-0 md:aspect-auto">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        {overlayText && <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-black/50 via-black/5 to-transparent md:block" />}
        <div
          className={cn(
            "relative flex flex-col gap-6 px-[var(--g)] pb-9 pt-7 md:absolute md:inset-x-0 md:top-[47%] md:flex-row md:items-end md:justify-between md:gap-10 md:p-0 md:px-[var(--g)]",
            overlayText && "md:text-white"
          )}
        >
          <div className="m-rise min-w-0 max-w-[60%] max-md:max-w-none">
            <h1 className="m-h m-display t-hero [overflow-wrap:anywhere]">
              <Lines text={s.heading} />
            </h1>
            {s.subheading && (
              <p className="mt-[clamp(14px,2vw,28px)] max-w-[20rem] whitespace-pre-line text-[length:calc(12px*var(--m-scale))] leading-relaxed">{s.subheading}</p>
            )}
          </div>
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="m-btn m-btn-lg m-rise shrink-0 self-start md:mb-[0.4em] md:self-end">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </div>
    </section>
  );
}

function CollectionSplit({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = shoppableCategories(store).slice(0, 14);
  const half = Math.ceil(cats.length / 2);
  const left = cats.slice(0, half);
  const right = cats.slice(half);
  const list = (items: typeof cats, align: "left" | "right") => (
    <ul className={cn("m-cap absolute top-[clamp(20px,4.4vw,64px)] hidden space-y-[0.6em] text-[length:calc(11.5px*var(--m-scale))] tracking-[0.04em] text-white sm:block", align === "left" ? "left-[var(--g)]" : "right-[var(--g)] text-right")}>
      {items.map((c) => (
        <li key={c.id}>
          <MLink to={`/category/${c.slug}`} className="opacity-90 drop-shadow transition-opacity hover:opacity-60">
            {c.name}
          </MLink>
        </li>
      ))}
    </ul>
  );
  const photo = (src: string) =>
    src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
    ) : (
      <div className="m-panel absolute inset-0" />
    );
  return (
    <section className="relative">
      <MLink to={s.link || "/catalog"} className="relative grid grid-cols-2" aria-label={s.heading.replace(/\*/g, "")}>
        <div className="relative aspect-[3/4] overflow-hidden md:aspect-[7/8]">{photo(s.leftImage)}</div>
        <div className="relative aspect-[3/4] overflow-hidden md:aspect-[7/8]">{photo(s.rightImage)}</div>
        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
          <h2 className="m-h t-title drop-shadow-[0_2px_18px_rgba(0,0,0,0.25)]"><Lines text={s.heading} /></h2>
          {s.subheading && <p className="mt-2 text-[length:calc(12px*var(--m-scale))] tracking-[0.3em] opacity-90 sm:text-[length:calc(14px*var(--m-scale))]">{s.subheading}</p>}
        </div>
      </MLink>
      {list(left, "left")}
      {list(right, "right")}
    </section>
  );
}

function bannerLink(b: BannerData): string {
  if (b.targetType === "category" && b.targetValue) return `/category/${b.targetValue.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (b.targetType === "product" && b.targetValue) return `/products/${b.targetValue}`;
  if (b.ctaLink && !b.ctaLink.startsWith("#")) return b.ctaLink;
  return "/catalog";
}

function Banners() {
  const { store, editing } = useSite();
  const banners = (store.banners || []).filter((b) => b.isActive && b.imageUrl).sort((a, b) => a.position - b.position);
  const [i, setI] = React.useState(0);
  const count = banners.length;
  React.useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % count), 5000);
    return () => window.clearInterval(id);
  }, [count]);
  if (!count) {
    return editing ? (
      <Container className="py-10">
        <div className="m-soft m-muted flex aspect-[3/1] items-center justify-center rounded-2xl text-center text-[length:calc(14px*var(--m-scale))]">
          Add banners in Dashboard → Banners and they slide here.
        </div>
      </Container>
    ) : null;
  }
  return (
    <section className="pb-12 pt-8 sm:py-12">
      <Container>
        <div className="m-card relative overflow-hidden">
          <div className="flex transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateX(-${(i % count) * 100}%)` }}>
            {banners.map((b, idx) => (
              <MLink key={b.id} to={bannerLink(b)} className="relative block aspect-[2/1] w-full shrink-0 md:aspect-[3/1]" aria-label={b.title || `Banner ${idx + 1}`} tabIndex={idx === i % count ? 0 : -1}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </MLink>
            ))}
          </div>
          {count > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {banners.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Show banner ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={cn("h-1.5 min-h-0 rounded-full bg-white transition-all", idx === i % count ? "w-6" : "w-1.5 opacity-60")}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function Categories({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = activeCategories(store).filter((c) => !c.parentId).slice(0, 8);
  if (!cats.length) return null;
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <h2 className="m-h mb-8 t-section sm:mb-12"><Lines text={s.heading} /></h2>
        {/* columns follow the count so no tile is left alone on the last row */}
        <div
          className={cn(
            "m-stagger m-lift-kids grid grid-cols-2 gap-3 sm:gap-4",
            cats.length === 3 || cats.length === 6 ? "lg:grid-cols-3" : cats.length === 5 ? "sm:grid-cols-3 lg:grid-cols-5" : "lg:grid-cols-4"
          )}
        >
          {cats.map((c) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group m-panel m-card relative block aspect-[3/4] overflow-hidden">
              {c.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white sm:p-5">
                <span className="m-h text-[length:calc(16px*var(--m-scale))] sm:text-[length:calc(20px*var(--m-scale))]">{c.name}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CategoryCircles({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = shoppableCategories(store).slice(0, 16);
  if (!cats.length) return null;
  return (
    <section className="t-circles py-10 sm:py-14">
      <Container>
        {s.heading && <h2 className="m-h t-section mb-6 sm:mb-8"><Lines text={s.heading} /></h2>}
        <div className="m-stagger m-scroll -mx-4 flex gap-4 overflow-x-auto px-4 sm:gap-7 md:mx-0 md:justify-center md:px-0">
          {cats.map((c) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group flex w-[76px] shrink-0 flex-col items-center gap-2.5 text-center sm:w-[104px]">
              <span className="m-panel relative block h-[76px] w-[76px] overflow-hidden rounded-full ring-1 ring-[color-mix(in_srgb,var(--m-text)_10%,transparent)] transition-transform group-hover:scale-[1.04] sm:h-[104px] sm:w-[104px]">
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                )}
                {!c.imageUrl && <span className="m-h absolute inset-0 flex items-center justify-center text-[length:calc(22px*var(--m-scale))]">{c.name.charAt(0)}</span>}
              </span>
              <span className="line-clamp-2 text-[length:calc(12px*var(--m-scale))] font-medium leading-tight sm:text-[length:calc(13px*var(--m-scale))]">{c.name}</span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Marquee({ s }: { s: Record<string, string> }) {
  const parts = (s.text || "").split("·").map((t) => t.trim()).filter(Boolean);
  if (!parts.length) return null;
  const run = (
    <div className="flex shrink-0 items-center">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center">
          <span className="m-h whitespace-nowrap px-6 text-[length:calc(14px*var(--m-scale))] sm:text-[length:calc(16px*var(--m-scale))]">{p}</span>
          <span className="opacity-40">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <section
      className="t-marquee overflow-hidden bg-[var(--m-accent)] py-4 text-[var(--m-accent-text)] sm:py-5"
      style={s.colour ? { background: s.colour, color: "#FFFFFF" } : undefined}
      aria-label={parts.join(", ")}
    >
      <div className="m-marquee flex w-max" aria-hidden>
        {run}
        {run}
        {run}
        {run}
      </div>
    </section>
  );
}

/** Section heading with optional text under it; centred or left, as the theme lays them out. */
function SectionHead({ s, action }: { s: Record<string, string>; action?: React.ReactNode }) {
  const { look } = useSite();
  if (look.headingRule) {
    return (
      <div className="m-line mb-[clamp(20px,3vw,40px)] flex items-end justify-between gap-4 border-b pb-2.5">
        <h2 className="m-h t-section min-w-0">
          <Lines text={s.heading} />
        </h2>
        {action}
      </div>
    );
  }
  if (look.headingAlign === "center") {
    return (
      <div className="mx-auto mb-[clamp(24px,3.4vw,48px)] max-w-2xl text-center">
        <h2 className="m-h t-section"><Lines text={s.heading} /></h2>
        {s.badge && <span className="m-burst m-cap mt-3 inline-block px-6 py-3 text-[length:calc(10.5px*var(--m-scale))] font-medium">{s.badge}</span>}
        {s.subheading && <p className="m-muted mt-3 text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
      </div>
    );
  }
  const sticker = s.badge ? <span className="m-burst m-cap inline-block rotate-[-8deg] px-6 py-3 text-[length:calc(10.5px*var(--m-scale))] font-medium leading-tight">{s.badge}</span> : null;
  return (
    <div className="mb-[clamp(24px,4.6vw,72px)] flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8">
      <div className="min-w-0">
        {look.eyebrowTag && s.tag && <p className="mb-2 text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.16em] text-[var(--m-accent)]">{s.tag}</p>}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <h2 className="m-h t-section"><Lines text={s.heading} /></h2>
          {sticker}
        </div>
        {s.subheading && action && <p className="m-muted mt-2 text-[length:calc(13px*var(--m-scale))]">{s.subheading}</p>}
      </div>
      {action || (s.subheading && <p className="m-muted max-w-md text-[length:calc(12.5px*var(--m-scale))] leading-relaxed md:text-right">{s.subheading}</p>)}
    </div>
  );
}

function ProductRow({ s }: { s: Record<string, string> }) {
  const { store, look } = useSite();
  const tabs = s.display === "tabs";
  const mosaic = s.display === "mosaic";
  const grid = s.display === "grid" || tabs;
  const tabCats = tabs ? activeCategories(store).filter((c) => !c.parentId && productsInCategory(store, c).length).slice(0, 6) : [];
  const lineTabs = look.card === "notch" || !!look.underlineTabs;
  const pills = tabs && !!look.pillTabs;
  // the underline and pill tabs start on "All"; the button tabs start on the first category
  const [tab, setTab] = React.useState("");
  const current = tabCats.find((c) => c.slug === tab) || (lineTabs || pills ? undefined : tabCats[0]);
  const promo = grid && !!s.promoImage;
  // three-a-row cards fill two rows with six
  const count = mosaic || pills ? 6 : grid ? (look.card === "spec" || look.card === "jar" || look.card === "blob" || look.card === "print" ? 6 : look.card === "drape" ? 10 : promo ? 7 : 8) : 12;
  const products = current ? productsInCategory(store, current).slice(0, count) : productsFromSource(store, s.source || "bestsellers", count);
  if (!products.length) return null;
  if (s.display === "beside") return <BesideRow s={s} products={products} />;
  const centred = look.headingAlign === "center";
  const dark = s.tone === "dark";
  const tabList =
    tabCats.length > 1 &&
    (lineTabs ? (
      <div className="m-scroll -mx-[var(--g)] flex gap-5 overflow-x-auto px-[var(--g)] md:mx-0 md:px-0 scroll-px-[var(--g)] md:scroll-px-0" role="tablist">
        {[{ id: "", slug: "", name: "All" }, ...tabCats].map((c) => {
          const on = (current?.id || "") === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(c.slug)}
              className={cn(
                "-mb-px shrink-0 border-b-2 pb-2.5 text-[length:calc(12.5px*var(--m-scale))] font-medium transition-colors",
                on ? "border-[var(--m-accent)] text-[var(--m-accent)]" : "border-transparent hover:text-[var(--m-accent)]"
              )}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    ) : null);
  return (
    <section
      className={cn("py-[clamp(40px,6vw,96px)]", dark && "bg-[#151514] py-[clamp(48px,7vw,110px)] text-[#F2F2EC]")}
      style={dark ? ({ "--m-text": "#F2F2EC", "--m-bg": "#151514", "--m-accent": "#F2F2EC", "--m-accent-text": "#151514" } as React.CSSProperties) : undefined}
    >
      <Container>
        {pills ? (
          <div className="m-line mb-[clamp(16px,2vw,26px)] flex flex-col gap-3 border-t pt-[clamp(20px,2.6vw,36px)] md:flex-row md:items-center md:justify-between">
            <h2 className="m-h t-section min-w-0">
              <Lines text={s.heading} />
            </h2>
            {tabCats.length > 1 && (
              <div className="m-scroll -mx-[var(--g)] flex gap-1.5 overflow-x-auto px-[var(--g)] scroll-px-[var(--g)] md:mx-0 md:px-0" role="tablist">
                {[{ id: "", slug: "", name: "All" }, ...tabCats].map((c) => {
                  const on = (current?.id || "") === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setTab(c.slug)}
                      className={cn(
                        "h-8 min-h-0 shrink-0 rounded-full border px-4 text-[length:calc(11px*var(--m-scale))] font-medium uppercase tracking-[0.06em] transition-colors",
                        on ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "m-line hover:border-[var(--m-text)]"
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : lineTabs ? (
          <div className="m-line mb-[clamp(16px,2vw,28px)] flex flex-col gap-4 border-b md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 pb-0 md:pb-3">
              <h2 className="m-h t-section">
                <Lines text={s.heading} />
              </h2>
              {s.subheading && <p className="m-muted mt-1.5 text-[length:calc(13px*var(--m-scale))]">{s.subheading}</p>}
            </div>
            {tabList ||
              (s.buttonLabel && (
                <MLink to={s.buttonLink || "/catalog"} className="mb-3 hidden items-center gap-1.5 text-[length:calc(12.5px*var(--m-scale))] font-semibold hover:opacity-70 sm:flex">
                  {s.buttonLabel} <ArrowRight className="h-4 w-4" />
                </MLink>
              ))}
            {!tabList && <span className="-mt-4 md:hidden" />}
          </div>
        ) : (
          <SectionHead
            s={s}
            action={
              s.buttonLabel &&
              (look.headingRule ? (
                <RuleLink to={s.buttonLink || "/catalog"} label={s.buttonLabel} />
              ) : look.smallLink ? (
                <MLink to={s.buttonLink || "/catalog"} className="min-h-0 shrink-0 self-start text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.1em] underline underline-offset-4 hover:text-[var(--m-accent)] md:self-auto">
                  {s.buttonLabel}
                </MLink>
              ) : (
                <MLink to={s.buttonLink || "/catalog"} className="m-btn m-btn-outline m-btn-lg hidden sm:inline-flex">
                  {s.buttonLabel}
                </MLink>
              ))
            }
          />
        )}
        {!lineTabs && !pills && tabCats.length > 1 && (
          <div className="m-scroll -mx-[var(--g)] mb-6 flex gap-2 overflow-x-auto px-[var(--g)] md:mx-0 md:px-0 scroll-px-[var(--g)] md:scroll-px-0" role="tablist">
            {tabCats.map((c) => {
              const on = current?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(c.slug)}
                  className={cn(
                    "h-9 shrink-0 border px-4 text-[length:calc(12px*var(--m-scale))] font-medium transition-colors",
                    on ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "m-line hover:border-[var(--m-text)]"
                  )}
                  style={{ borderRadius: "var(--m-radius)" }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
        {mosaic ? (
          <MosaicGrid products={products} />
        ) : pills ? (
          <BentoGrid products={products} />
        ) : grid ? (
          <ProductGrid products={products} extra={promo ? <PromoTile s={s} /> : undefined} />
        ) : (
          <ProductSlider products={products} />
        )}
        {s.buttonLabel && !look.headingRule && !look.smallLink && (
          <div className={cn("mt-8 flex justify-center", !centred && "sm:hidden")}>
            <MLink to={s.buttonLink || "/catalog"} className={cn("m-btn", centred ? "min-h-10 px-10" : "m-btn-outline w-full")}>
              {s.buttonLabel}
            </MLink>
          </div>
        )}
      </Container>
    </section>
  );
}

function ImageText({ s }: { s: Record<string, string> }) {
  const right = s.imageSide === "right";
  // with an offer ("50%") the photo takes most of the width, like a sale banner
  const offer = !!s.highlight || s.imageWidth === "wide";
  // a small wide photo beside a big heading, like a journal post (Theme 10)
  const small = !offer && s.imageWidth === "small";
  const dark = s.tone === "dark";
  return (
    <section className={cn("py-[clamp(40px,6vw,96px)]", dark && "bg-[#0e0e0e] text-white [--m-text:#ffffff] [--m-panel:#1f1f1f]")}>
      <Container>
        <div className={cn("grid items-center gap-8 md:gap-12", offer ? "md:grid-cols-[1.6fr_1fr]" : small ? "md:grid-cols-[1fr_1.15fr]" : "md:grid-cols-2 md:gap-16")}>
          <div className={cn("m-panel m-card relative overflow-hidden", offer ? (s.imageWidth === "wide" ? "aspect-[4/3]" : "aspect-[16/10]") : small ? "aspect-[16/11]" : "aspect-[4/5]", right && "md:order-2")}>
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="max-w-lg">
            <h2 className={cn("m-h", dark || small ? "t-title" : "t-section")}>
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="m-muted mt-5 whitespace-pre-line text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.text}</p>}
            {s.highlightLabel && <p className="mt-7 text-[length:calc(15px*var(--m-scale))] font-semibold">{s.highlightLabel}</p>}
            {s.highlight && <p className="m-h m-display t-hero mt-2 leading-none">{s.highlight}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/pages/about"} className={cn("m-btn", offer ? "mt-6 min-h-10 px-7" : "mt-9", dark && "!bg-white !text-black")}>
                {s.buttonLabel}
              </MLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Newsletter({ s }: { s: Record<string, string> }) {
  const { store, editing, demo } = useSite();
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);
  const band = !!s.image;
  return (
    <section className={cn("relative overflow-hidden", band ? "py-[clamp(56px,7vw,112px)] text-white" : "m-soft py-16 sm:py-24")}>
      {band && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </>
      )}
      <Container className="relative max-w-2xl text-center">
        <h2 className="m-h t-section"><Lines text={s.heading} /></h2>
        {s.text && <p className={cn("mx-auto mt-4 max-w-md text-[length:calc(14px*var(--m-scale))] leading-relaxed", band ? "text-white/75" : "m-muted")}>{s.text}</p>}
        {done ? (
          <p className="mt-8 inline-flex items-center gap-2 text-[length:calc(14px*var(--m-scale))] font-medium">
            <Check className="h-4 w-4" /> Thanks, you&apos;re on the list.
          </p>
        ) : (
          <form
            className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
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
              aria-label="Email"
              className={cn("m-field rounded-full px-6", band && "!border-white/40 !bg-transparent !text-white placeholder:!text-white/60 focus:!border-white")}
            />
            <button type="submit" className={cn("m-btn shrink-0", band && "!bg-white !text-black")}>
              Subscribe
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}

/** Category photos in a three-column mosaic; the first tall tile carries a line of text and a button. */
function CollectionGrid({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = activeCategories(store).filter((c) => !c.parentId);
  const list = (cats.length >= 3 ? cats : shoppableCategories(store)).slice(0, 6);
  if (!list.length) return null;
  // column by column: short + tall, tall + short, short + tall
  const columns = [list.filter((_, i) => i % 3 === 0), list.filter((_, i) => i % 3 === 1), list.filter((_, i) => i % 3 === 2)].filter((c) => c.length);
  const tall = (col: number, row: number) => (col === 1 ? row === 0 : row === 1);
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <SectionHead s={s} />
        <div className="m-stagger grid gap-2.5 sm:gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-2.5 sm:gap-4">
              {col.map((c, ri) => {
                const isTall = tall(ci, ri) || col.length === 1;
                const feature = ci === 0 && ri === 1;
                return (
                  <MLink key={c.id} to={`/category/${c.slug}`} className="group block">
                    <span className={cn("m-panel m-card relative block overflow-hidden", isTall ? "aspect-[4/5]" : "aspect-[4/3]")}>
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    ) : (
                      <span className="m-h m-faint absolute inset-0 flex items-center justify-center text-[length:calc(28px*var(--m-scale))]">{c.name.charAt(0)}</span>
                    )}
                    {/* on phones the name sits under the tile; on wider screens it is written on the photo */}
                    <span className="absolute inset-0 hidden bg-black/30 transition-colors group-hover:bg-black/40 sm:block" />
                    <span className="absolute inset-0 hidden flex-col items-center justify-center p-4 text-center text-white sm:flex">
                      <span className="m-h text-balance break-normal text-[length:calc(clamp(16px,1.9vw,28px)*var(--m-scale))] leading-tight">{c.name}</span>
                      {feature && s.featureText && <span className="mt-2 hidden max-w-[16rem] text-[length:calc(12px*var(--m-scale))] text-white/85 sm:block">{s.featureText}</span>}
                      {feature && s.featureButton && (
                        <span className="mt-4 hidden h-9 items-center rounded-full bg-white px-6 text-[length:calc(12px*var(--m-scale))] font-semibold text-black sm:inline-flex">
                          {s.featureButton}
                        </span>
                      )}
                    </span>
                    </span>
                    <span className="mt-2 block truncate text-center text-[length:calc(12.5px*var(--m-scale))] font-medium sm:hidden">{c.name}</span>
                  </MLink>
                );
              })}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Two tall photo cards with a white button, then two wide offer cards (small text, heading, button, photo). */
function PromoCards({ s }: { s: Record<string, string> }) {
  const tall = [1, 2].filter((i) => s[`c${i}Image`]);
  const wide = [3, 4].filter((i) => s[`c${i}Heading`] || s[`c${i}Image`]);
  if (!tall.length && !wide.length) return null;
  return (
    <section className="py-[clamp(32px,5vw,80px)]">
      <Container className="m-stagger m-lift-kids grid gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-2">
        {tall.map((i) => (
          <MLink key={i} to={s[`c${i}Link`] || "/catalog"} className="group m-panel m-card relative block aspect-[3/4] overflow-hidden md:row-span-2 md:aspect-auto md:min-h-[clamp(300px,30vw,480px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s[`c${i}Image`]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            {s[`c${i}Button`] && (
              <span className="m-btn absolute bottom-[clamp(12px,1.6vw,24px)] left-1/2 min-h-10 -translate-x-1/2 whitespace-nowrap !bg-white px-5 !text-black">
                {s[`c${i}Button`]}
              </span>
            )}
          </MLink>
        ))}
        {wide.map((i) => (
          <MLink key={i} to={s[`c${i}Link`] || "/catalog"} className="group m-panel m-card relative flex min-h-[clamp(150px,14vw,230px)] items-stretch overflow-hidden md:col-span-2">
            <div className="relative z-10 flex w-[58%] flex-col justify-center p-[clamp(16px,2vw,32px)]">
              {s[`c${i}Label`] && <p className="m-muted text-[length:calc(11px*var(--m-scale))]">{s[`c${i}Label`]}</p>}
              {s[`c${i}Heading`] && <p className="mt-2 text-[length:calc(clamp(15px,1.5vw,22px)*var(--m-scale))] font-semibold leading-snug">{s[`c${i}Heading`]}</p>}
              {s[`c${i}Button`] && (
                <span className="m-line mt-4 inline-flex h-8 w-fit items-center border px-3 text-[length:calc(11px*var(--m-scale))] font-medium transition-colors group-hover:bg-[var(--m-text)] group-hover:text-[var(--m-bg)]">
                  {s[`c${i}Button`]}
                </span>
              )}
            </div>
            {s[`c${i}Image`] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s[`c${i}Image`]} alt="" loading="lazy" className="absolute inset-y-0 right-0 h-full w-[46%] object-cover transition duration-700 group-hover:scale-[1.04]" />
            )}
          </MLink>
        ))}
      </Container>
    </section>
  );
}

/** A huge right-aligned heading with a short paragraph on the left. */
function Statement({ s }: { s: Record<string, string> }) {
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container className="grid items-end gap-6 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-12">
        {s.text && <p className="m-muted order-2 whitespace-pre-line text-[length:calc(13px*var(--m-scale))] leading-relaxed md:order-1">{s.text}</p>}
        <h2 className="m-h t-title order-1 md:order-2 md:text-right">
          <Lines text={s.heading} />
        </h2>
      </Container>
    </section>
  );
}

/** The shop's approved reviews in a sliding row (hidden until there are some). */
function Reviews({ s }: { s: Record<string, string> }) {
  const { store, editing } = useSite();
  const reviews = (store.reviews || []).filter((r) => r.status === "approved" && r.comment).slice(0, 12);
  if (!reviews.length) {
    return editing ? (
      <Container className="py-10">
        <div className="m-soft m-muted rounded-2xl p-8 text-center text-[length:calc(13px*var(--m-scale))]">Your customers&apos; reviews show here once you have some.</div>
      </Container>
    ) : null;
  }
  const productOf = (id: string) => store.products.find((p) => p.id === id);
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="mb-[clamp(20px,3vw,44px)] text-center">
          {s.subheading && <p className="text-[length:calc(16px*var(--m-scale))] tracking-[0.2em]">{s.subheading}</p>}
          <h2 className="m-h t-section mt-2"><Lines text={s.heading} /></h2>
        </div>
        <div className="m-stagger m-lift-kids m-scroll -mx-[var(--g)] flex snap-x gap-3 overflow-x-auto px-[var(--g)] pb-2 md:mx-0 md:px-0 scroll-px-[var(--g)] md:scroll-px-0">
          {reviews.map((r) => {
            const p = productOf(r.productId);
            return (
              <figure key={r.id} className="m-line flex w-[78%] shrink-0 snap-start flex-col rounded-2xl border bg-[var(--m-bg)] p-5 sm:w-[46%] lg:w-[calc((100%-2.25rem)/4)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2.5">
                    <span className="m-soft flex h-9 w-9 items-center justify-center rounded-full text-[length:calc(13px*var(--m-scale))] font-semibold">{r.customerName.charAt(0).toUpperCase()}</span>
                    <span>
                      <span className="block text-[length:calc(13px*var(--m-scale))] font-semibold">{r.customerName}</span>
                      {r.verifiedPurchase && <span className="m-muted block text-[length:calc(11px*var(--m-scale))]">Verified buyer</span>}
                    </span>
                  </span>
                  <Stars value={r.rating} />
                </div>
                <blockquote className="mt-4 flex-1 text-[length:calc(14px*var(--m-scale))] leading-relaxed">“{r.comment}”</blockquote>
                {p && (
                  <MLink to={`/products/${p.slug || p.id}`} className="m-line mt-4 flex items-center gap-3 border-t pt-3">
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" loading="lazy" className="m-panel h-10 w-10 shrink-0 rounded-md object-cover" />
                    )}
                    <span className="m-muted truncate text-[length:calc(12px*var(--m-scale))]">{p.title}</span>
                  </MLink>
                )}
              </figure>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/** Centred heading, a big photo, then points in two columns that open to show more. */
function Features({ s }: { s: Record<string, string> }) {
  const [open, setOpen] = React.useState<number | null>(null);
  const points = [1, 2, 3, 4, 5, 6].filter((i) => s[`f${i}Title`]);
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container className="max-w-[1100px]">
        <h2 className="m-h t-section mx-auto max-w-xl text-center">
          <Lines text={s.heading} />
        </h2>
        {s.image && (
          <div className="m-panel m-card relative mx-auto mt-[clamp(20px,3vw,40px)] aspect-[16/10] max-w-3xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        {points.length > 0 && (
          <div className="m-stagger mx-auto mt-8 grid max-w-3xl gap-x-10 sm:grid-cols-2">
            {points.map((i) => (
              <div key={i} className="m-line border-b">
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-[length:calc(13px*var(--m-scale))] font-medium">
                  {s[`f${i}Title`]}
                  <span className={cn("text-lg leading-none transition-transform", open === i && "rotate-45")}>+</span>
                </button>
                {open === i && s[`f${i}Text`] && <p className="m-muted pb-4 text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s[`f${i}Text`]}</p>}
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

/** Three photo cards, each with a title and a line of text, and a button under them. */
function FeatureCards({ s }: { s: Record<string, string> }) {
  const cards = [1, 2, 3].filter((i) => s[`d${i}Image`] || s[`d${i}Title`]);
  if (!cards.length) return null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="mb-[clamp(20px,3vw,44px)] text-center">
          {s.eyebrow && <p className="m-muted m-cap text-[length:calc(10.5px*var(--m-scale))] tracking-[0.2em] uppercase">{s.eyebrow}</p>}
          <h2 className="m-h t-section mt-2"><Lines text={s.heading} /></h2>
        </div>
        {/* a swipeable row on phones, three columns from sm up */}
        <div className="m-stagger m-lift-kids m-scroll -mx-[var(--g)] flex snap-x gap-3 overflow-x-auto px-[var(--g)] scroll-px-[var(--g)] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
          {cards.map((i) => (
            <div key={i} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <div className="m-panel m-card relative aspect-[4/3.3] overflow-hidden">
                {s[`d${i}Image`] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s[`d${i}Image`]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                )}
              </div>
              {s[`d${i}Title`] && <p className="mt-3 text-[length:calc(16px*var(--m-scale))] font-semibold">{s[`d${i}Title`]}</p>}
              {s[`d${i}Text`] && <p className="m-muted mt-1 text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s[`d${i}Text`]}</p>}
            </div>
          ))}
        </div>
        {s.buttonLabel && (
          <div className="mt-8 flex justify-center">
            <MLink to={s.buttonLink || "/pages/about"} className="m-btn min-h-10 px-8">
              {s.buttonLabel}
            </MLink>
          </div>
        )}
      </Container>
    </section>
  );
}

/** A sliding row of photos with captions, e.g. customers wearing the shop's pieces. */
function Gallery({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const photos = [1, 2, 3, 4, 5, 6].filter((i) => s[`g${i}Image`]);
  if (!photos.length) return null;
  const ig = store.instagramHandle ? `https://instagram.com/${store.instagramHandle.replace(/^@/, "")}` : "";
  const link = s.buttonLink || ig;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="mb-[clamp(16px,2.4vw,32px)] flex items-center justify-between gap-4">
          <h2 className="m-h t-section"><Lines text={s.heading} /></h2>
          {s.buttonLabel && link && (
            <MLink to={link} className="m-line inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-[length:calc(12px*var(--m-scale))] font-medium hover:border-[var(--m-text)]">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
        <div className="m-stagger m-lift-kids m-scroll -mx-[var(--g)] flex snap-x gap-2.5 overflow-x-auto px-[var(--g)] md:mx-0 md:px-0 scroll-px-[var(--g)] md:scroll-px-0">
          {photos.map((i) => (
            <figure key={i} className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[calc((100%-3.125rem)/5.2)]">
              <div className="m-panel m-card relative aspect-[3/4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s[`g${i}Image`]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              {s[`g${i}Caption`] && <figcaption className="mt-2 flex items-center gap-1.5 text-[length:calc(12px*var(--m-scale))]">{s[`g${i}Caption`]}</figcaption>}
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** A big quote on a grey panel, with names (press, partners) under it. */
function Quote({ s }: { s: Record<string, string> }) {
  const names = (s.names || "").split("·").map((n) => n.trim()).filter(Boolean);
  if (!s.text) return null;
  if (s.outlet) {
    return (
      <section className="py-[clamp(40px,6vw,96px)] text-center">
        <Container>
          <p className="m-h m-display text-[length:calc(clamp(44px,6vw,92px)*var(--m-scale))] leading-none">{s.outlet}</p>
          <p className="mx-auto mt-4 max-w-xl text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">
            <Lines text={s.text} />
          </p>
        </Container>
      </section>
    );
  }
  return (
    <section className="py-[clamp(24px,4vw,64px)]">
      <Container>
        <div className="m-soft m-card px-6 py-[clamp(40px,6vw,88px)] text-center" style={{ borderRadius: "max(var(--m-card), 16px)" }}>
          <p className="m-h m-display t-title mx-auto max-w-3xl">
            <Lines text={s.text} />
          </p>
          {names.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
              {names.map((n, i) => (
                <span key={i} className={cn("m-faint text-[length:calc(22px*var(--m-scale))]", i % 2 ? "font-[family-name:var(--m-display)] italic" : "font-[family-name:var(--m-display)] tracking-wide uppercase")}>
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Three panels: a photo, big white text on black, and a short story with a button. */
function StorySplit({ s }: { s: Record<string, string> }) {
  return (
    <section className="py-[clamp(24px,4vw,64px)]">
      <Container>
        <div className="m-stagger m-line grid overflow-hidden border md:grid-cols-3" style={{ borderRadius: "max(var(--m-card), 16px)" }}>
          <div className="m-panel relative aspect-[4/5] md:aspect-auto md:min-h-[clamp(320px,30vw,460px)]">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col items-center justify-center bg-[#0b0b0b] p-8 text-center text-white">
            {s.label && <span className="rounded-full bg-white px-2.5 py-0.5 text-[length:calc(10.5px*var(--m-scale))] font-semibold text-black">{s.label}</span>}
            {s.bigText && (
              <p className="t-story mt-3 text-[length:calc(clamp(26px,3.2vw,46px)*var(--m-scale))] font-bold uppercase leading-[0.95] tracking-tight">
                <Lines text={s.bigText} />
              </p>
            )}
          </div>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {s.text && (
              <p className="m-h m-display t-section max-w-xs">
                <Lines text={s.text} />
              </p>
            )}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/pages/about"} className="m-btn mt-6 min-h-10 px-7">
                {s.buttonLabel}
              </MLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** E01's hero: a big rounded photo with the shop name on it, a number in a cut-out corner and a product card. */
function NotchHero({ s }: { s: Record<string, string> }) {
  const { store, addToBag, href } = useSite();
  const router = useRouter();
  const spotlight = productsFromSource(store, "newest", 1)[0];
  const name = (s.heading || "").replace(/\*/g, "");
  // long shop names get a smaller wordmark so they still fit on one or two lines
  const fit = Math.min(1, 8 / Math.max(5, name.split("\n").reduce((n, l) => Math.max(n, l.length), 0)));
  const buySpotlight = () => {
    if (!spotlight) return;
    if ((spotlight.options || []).some((o) => o.options?.length)) router.push(href(`/products/${spotlight.slug || spotlight.id}`));
    else addToBag(spotlight);
  };
  const spotlightCard = spotlight && (
    <div className="flex h-full items-center gap-3 rounded-[16px] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--m-accent)_16%,#fff),color-mix(in_srgb,var(--m-accent)_42%,#fff))] p-2.5 md:flex-col md:gap-2 md:p-3">
      <MLink to={`/products/${spotlight.slug || spotlight.id}`} className="relative block aspect-square w-[72px] shrink-0 md:w-full">
        {spotlight.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={spotlight.images[0]} alt={spotlight.title} className="absolute inset-0 h-full w-full rounded-[10px] object-cover" />
        )}
      </MLink>
      <div className="min-w-0 flex-1 md:w-full md:text-center">
        <p className="truncate text-[length:calc(12px*var(--m-scale))] font-medium">{spotlight.title}</p>
        <button
          type="button"
          onClick={buySpotlight}
          className="mt-1.5 inline-flex h-8 items-center justify-center gap-1 rounded-full bg-white px-3.5 text-[length:calc(11.5px*var(--m-scale))] font-semibold text-black md:w-full"
        >
          <Plus className="h-3 w-3" strokeWidth={2.6} /> Buy {rupees(spotlight.price)}
        </button>
      </div>
    </div>
  );
  return (
    <section className="px-[clamp(8px,1vw,16px)] pt-[clamp(6px,0.8vw,12px)]">
      <div
        className="m-panel relative isolate min-h-[clamp(380px,44vw,660px)] overflow-hidden"
        style={{ borderRadius: "clamp(20px,2vw,30px)", "--nr": "clamp(16px,1.6vw,24px)" } as React.CSSProperties}
      >
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
        {s.stat && (
          <div className="m-notch px-[clamp(14px,1.6vw,24px)] pb-[clamp(10px,1.2vw,18px)] pt-[clamp(8px,1vw,14px)] text-right">
            <p className="m-h text-[length:calc(clamp(26px,3.2vw,46px)*var(--m-scale))] leading-none">{s.stat}</p>
            {s.statLabel && <p className="m-muted mt-1 text-[length:calc(11px*var(--m-scale))]">{s.statLabel}</p>}
          </div>
        )}
        <div className="m-rise absolute bottom-[clamp(18px,3vw,44px)] left-[clamp(18px,3.4vw,52px)] right-[clamp(18px,3vw,44px)] text-white md:right-[clamp(190px,19vw,280px)]">
          <h1 className="m-h m-display t-wordmark flex flex-wrap items-end gap-x-[0.18em] [overflow-wrap:anywhere] [text-shadow:0_2px_40px_rgba(40,10,90,0.22)]" style={{ "--fit": String(fit) } as React.CSSProperties}>
            <span>
              <Lines text={s.heading} />
            </span>
            {s.subheading && <span className="t-wordmark-sub pb-[0.12em]">{s.subheading}</span>}
          </h1>
          {(s.buttonLabel || s.secondButtonLabel) && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {s.buttonLabel && (
                <MLink to={s.buttonLink || "/catalog"} className="m-btn min-h-11 px-6">
                  {s.buttonLabel}
                </MLink>
              )}
              {s.secondButtonLabel && (
                <MLink to={s.secondButtonLink || "/catalog"} className="inline-flex min-h-11 items-center rounded-full bg-white/90 px-6 text-[length:calc(13px*var(--m-scale))] font-semibold text-black">
                  {s.secondButtonLabel}
                </MLink>
              )}
            </div>
          )}
        </div>
        {spotlightCard && <div className="m-notch m-notch-br hidden w-[clamp(170px,15vw,220px)] p-[clamp(8px,0.8vw,12px)] md:block">{spotlightCard}</div>}
      </div>
      {spotlightCard && <div className="mt-2 md:hidden">{spotlightCard}</div>}
    </section>
  );
}

/** Soft cards for the first categories, each with its photo, name and a round arrow in a cut-out corner. */
function CategoryCards({ s }: { s: Record<string, string> }) {
  const { store, content } = useSite();
  const fit = content.settings.productPhotos === "fit";
  const cats = activeCategories(store)
    .filter((c) => !c.parentId)
    .map((c) => ({ c, image: c.imageUrl || productsInCategory(store, c)[0]?.images?.[0] || "" }))
    .filter((x) => x.image)
    .slice(0, 4);
  if (!cats.length) return null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        <div className="m-line mb-[clamp(16px,2vw,28px)] flex items-end justify-between gap-4 border-b pb-[clamp(12px,1.4vw,18px)]">
          <div className="min-w-0">
            <h2 className="m-h t-section">
              <Lines text={s.heading} />
            </h2>
            {s.subheading && <p className="m-muted mt-1.5 text-[length:calc(13px*var(--m-scale))]">{s.subheading}</p>}
          </div>
          {s.buttonLabel && (
            <MLink to="/catalog" className="flex shrink-0 items-center gap-1.5 text-[length:calc(12.5px*var(--m-scale))] font-semibold hover:opacity-70">
              <span className="hidden sm:inline">{s.buttonLabel}</span>
              <span className="sm:hidden">See all</span>
              <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
        <div className="m-stagger m-lift-kids grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {cats.map(({ c, image }) => (
            <MLink
              key={c.id}
              to={`/category/${c.slug}`}
              className="m-panel m-card group relative block aspect-[1/1.08] overflow-hidden"
              style={{ "--nr": "14px" } as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                loading="lazy"
                className={cn(
                  "absolute transition duration-700",
                  fit
                    ? "inset-x-0 top-0 h-[78%] w-full object-contain p-[12%] pb-[4%] mix-blend-multiply group-hover:-translate-y-1 group-hover:scale-[1.04]"
                    : "inset-x-2 top-2 h-[calc(76%-8px)] w-[calc(100%-16px)] rounded-[calc(var(--m-card)-6px)] object-cover group-hover:scale-[1.02]"
                )}
              />
              <span className="m-notch p-1.5 sm:p-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--m-accent)_12%,var(--m-bg))] text-[var(--m-text)] transition-colors group-hover:bg-[var(--m-accent)] group-hover:text-[var(--m-accent-text)] sm:h-9 sm:w-9">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </span>
              <span className="absolute inset-x-2 bottom-[9%] text-center">
                <span className="block text-[length:calc(clamp(14px,1.4vw,20px)*var(--m-scale))] font-semibold leading-tight">{c.name}</span>
                {(c.subtitle || c.description) && (
                  <span className="m-muted mx-auto mt-1 hidden max-w-[16rem] text-[length:calc(11.5px*var(--m-scale))] leading-snug lg:line-clamp-2 lg:max-h-0 lg:opacity-0 lg:transition-all lg:duration-300 lg:group-hover:max-h-10 lg:group-hover:opacity-100">
                    {c.subtitle || c.description}
                  </span>
                )}
              </span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** A big photo beside a soft card with an offer and a button. */
function OfferSplit({ s }: { s: Record<string, string> }) {
  const dark = s.tone === "dark";
  const photoRight = s.imageSide === "right";
  return (
    <section className="py-[clamp(24px,4vw,64px)]">
      <Container>
        <div className={cn("m-stagger grid gap-2.5 sm:gap-4", dark ? "md:grid-cols-2" : photoRight ? "md:grid-cols-[1fr_1.75fr]" : "md:grid-cols-[1.75fr_1fr]")}>
          <div className={cn("m-panel m-card relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[clamp(300px,30vw,440px)]", photoRight && "md:order-2")}>
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div
            className={cn(
              "m-card relative flex min-h-[260px] flex-col overflow-hidden p-[clamp(22px,2.6vw,36px)]",
              dark ? "items-center justify-center bg-[#2E2A25] text-center" : "m-panel justify-between"
            )}
            style={dark ? ({ "--m-text": "#F1EDE4", color: "#F1EDE4" } as React.CSSProperties) : undefined}
          >
            {s.panelImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.panelImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            )}
            {dark && s.eyebrow && <p className="m-muted relative mb-5 text-[length:calc(11px*var(--m-scale))] uppercase tracking-[0.12em] sm:absolute sm:left-[clamp(18px,2.2vw,30px)] sm:top-[clamp(16px,2vw,26px)] sm:mb-0">{s.eyebrow}</p>}
            <div className="relative">
              {!dark && s.eyebrow && <p className="text-[length:calc(11.5px*var(--m-scale))] font-semibold text-[var(--m-accent)]">{s.eyebrow}</p>}
              <h2 className={cn("m-h t-title", !dark && "mt-3")}>
                <Lines text={s.heading} />
              </h2>
              {s.text && <p className={cn("m-muted mt-3 text-[length:calc(13px*var(--m-scale))] leading-relaxed", dark ? "mx-auto max-w-xs" : "max-w-sm")}>{s.text}</p>}
              {s.highlight && (
                <p className={cn("mt-4 flex items-baseline gap-2", dark && "justify-center")}>
                  {s.highlightLabel && <span className="text-[length:calc(13px*var(--m-scale))]">{s.highlightLabel}</span>}
                  <span className="m-h text-[length:calc(clamp(56px,7vw,112px)*var(--m-scale))] leading-none">{s.highlight}</span>
                </p>
              )}
              {s.note && <p className="m-faint mt-3 text-[length:calc(11px*var(--m-scale))]">{s.note}</p>}
            </div>
            {s.buttonLabel &&
              (dark ? (
                <MLink to={s.buttonLink || "/catalog"} className="relative mt-6 flex items-center gap-1.5 text-[length:calc(11.5px*var(--m-scale))] font-medium uppercase tracking-[0.1em] hover:opacity-70">
                  <ChevronsRight className="h-4 w-4" /> {s.buttonLabel}
                </MLink>
              ) : (
                <MLink to={s.buttonLink || "/catalog"} className="m-btn relative mt-6 min-h-11 self-start px-6">
                  {s.buttonLabel}
                  <ArrowRight className="h-4 w-4" />
                </MLink>
              ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

const PERK_ICONS = [Truck, ShieldCheck, RotateCcw, MessageCircle];

/** Four short shop promises with icons. */
function Perks({ s }: { s: Record<string, string> }) {
  const perks = [1, 2, 3, 4].filter((i) => s[`p${i}Title`]);
  if (!perks.length) return null;
  return (
    <section className="py-[clamp(24px,4vw,56px)]">
      <Container>
        <div className="m-stagger m-panel m-card grid grid-cols-2 gap-px overflow-hidden lg:grid-cols-4">
          {perks.map((i, n) => {
            const Icon = PERK_ICONS[n % PERK_ICONS.length];
            return (
              <div key={i} className="flex flex-col gap-3 p-[clamp(16px,2vw,28px)] sm:flex-row sm:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--m-bg)] text-[var(--m-accent)] sm:h-11 sm:w-11">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[length:calc(13.5px*var(--m-scale))] font-semibold">{s[`p${i}Title`]}</span>
                  {s[`p${i}Text`] && <span className="m-muted mt-0.5 block text-[length:calc(12px*var(--m-scale))] leading-snug">{s[`p${i}Text`]}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/** The last tile of a product row: a photo with a line of text and a button. */
function PromoTile({ s }: { s: Record<string, string> }) {
  return (
    <MLink to={s.promoLink || "/catalog"} className="m-card group relative block aspect-[1/1.04] overflow-hidden bg-[var(--m-panel)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.promoImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      <span className="absolute inset-x-3 bottom-3 text-white">
        {s.promoText && <span className="block text-[length:calc(clamp(14px,1.3vw,17px)*var(--m-scale))] font-semibold leading-snug">{s.promoText}</span>}
        {s.promoButton && (
          <span className="mt-2.5 flex h-9 items-center justify-center rounded-full bg-white text-[length:calc(12px*var(--m-scale))] font-semibold text-black">{s.promoButton}</span>
        )}
      </span>
    </MLink>
  );
}

/** F01's hero: the shop name written huge, a product photo over it, text and a button, and two dark link tiles. */
function ShowcaseHero({ s }: { s: Record<string, string> }) {
  const name = (s.heading || "").replace(/\*/g, "");
  const fit = Math.min(1, 9 / Math.max(5, name.split("\n").reduce((n, l) => Math.max(n, l.length), 0)));
  const tiles = [1, 2].filter((i) => s[`tile${i}Label`]);
  return (
    <section className="overflow-hidden pt-[clamp(12px,2.4vw,36px)]">
      <Container>
        <h1 className="m-h t-showcase m-rise text-center [overflow-wrap:anywhere]" style={{ "--fit": String(fit) } as React.CSSProperties}>
          <Lines text={s.heading} />
        </h1>
        {s.tag && <p className="m-rise mt-2 text-right text-[length:calc(clamp(15px,1.7vw,26px)*var(--m-scale))] leading-none tracking-[-0.02em]">{s.tag}</p>}
        <div className="mt-4 grid items-end gap-6 md:mt-0 md:grid-cols-[1fr_1.25fr_1fr] md:gap-4">
          <div className="relative order-1 md:order-2 md:-mt-[clamp(70px,9vw,170px)]">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.image}
                alt=""
                className="m-float mx-auto -my-[6%] aspect-square w-[min(66vw,520px)] object-contain md:my-0 mix-blend-multiply [mask-image:radial-gradient(closest-side,#000_62%,transparent)]"
              />
            )}
          </div>
          <div className="order-2 pb-2 md:order-1">
            {s.subheading && <p className="max-w-xs text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-6 min-h-11 w-full px-10 sm:w-auto">
                {s.buttonLabel}
              </MLink>
            )}
          </div>
          {tiles.length > 0 && (
            <div className="m-stagger order-3 grid grid-cols-2 gap-2.5 pb-2 md:justify-self-end">
              {tiles.map((i) => (
                <MLink
                  key={i}
                  to={s[`tile${i}Link`] || "/catalog"}
                  className="group block w-full rounded-[18px] bg-[#1b1b19] p-1.5 text-white transition-transform duration-500 hover:-translate-y-1 md:w-[clamp(130px,11vw,170px)]"
                >
                  <span className="relative block aspect-[1/0.82] overflow-hidden rounded-[13px] bg-white/10">
                    {s[`tile${i}Image`] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s[`tile${i}Image`]} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    )}
                  </span>
                  <span className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-[length:calc(12.5px*var(--m-scale))] font-medium">
                    {s[`tile${i}Label`]} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </MLink>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** A two-line heading with a label, a tall photo, a wide photo and the shop's story. */
function AboutSplit({ s }: { s: Record<string, string> }) {
  return (
    <section className="py-[clamp(44px,7vw,110px)]">
      <Container>
        <div className="mb-[clamp(20px,2.6vw,36px)] flex items-end justify-between gap-6">
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.label && <span className="m-muted hidden shrink-0 pb-1 text-[length:calc(clamp(15px,1.5vw,22px)*var(--m-scale))] sm:block">{s.label}</span>}
        </div>
        <div className="m-stagger grid gap-3 sm:gap-4 md:grid-cols-2">
          <div className="m-panel m-card relative aspect-[4/3.4] overflow-hidden md:aspect-auto md:min-h-[clamp(320px,34vw,540px)]">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-1000 hover:scale-[1.03]" />
            )}
          </div>
          <div className="flex flex-col">
            {s.image2 && (
              <div className="m-panel m-card relative aspect-[16/9.4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image2} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-1000 hover:scale-[1.03]" />
              </div>
            )}
            <div className="mt-5 max-w-lg space-y-3 px-0.5 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">
              {s.text && <p>{s.text}</p>}
              {s.text2 && <p>{s.text2}</p>}
            </div>
            {s.linkLabel && (
              <MLink to={s.linkLink || "/pages/about"} className="m-muted mt-6 inline-flex items-center gap-1.5 self-start text-[length:calc(13px*var(--m-scale))] font-medium hover:text-[var(--m-text)] md:mt-auto md:pt-6">
                {s.linkLabel} <ArrowRight className="h-4 w-4" />
              </MLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Longest line of a heading, for sizing wordmarks so long shop names still fit. */
function longestLine(text: string) {
  return (text || "").replace(/\*/g, "").split("\n").reduce((n, l) => Math.max(n, l.length), 0);
}

/** F02's hero: the shop name across the top, overlapping a wide photo, with quote lines and a link under it. */
function BannerHero({ s }: { s: Record<string, string> }) {
  const fit = Math.min(1, 7 / Math.max(4, longestLine(s.heading)));
  const lines = (s.subheading || "").split("\n").filter(Boolean);
  return (
    <section className="overflow-hidden pt-[clamp(8px,1.4vw,20px)]">
      <Container>
        <h1 className="m-h m-display t-banner-word m-rise relative z-10 text-[var(--m-accent)] [overflow-wrap:anywhere]" style={{ "--fit": String(fit) } as React.CSSProperties}>
          <Lines text={s.heading} />
        </h1>
        {s.image && (
          <div className="m-panel m-card relative -mt-[clamp(10px,1.8vw,30px)] aspect-[4/3] overflow-hidden sm:aspect-[16/8] lg:aspect-[16/7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        <div className="mt-[clamp(16px,2vw,28px)] flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            {lines.map((l, i) => (
              <p key={i} className={cn("flex items-center gap-4 text-[length:calc(clamp(14px,1.25vw,18px)*var(--m-scale))]", i > 0 && "md:pl-[clamp(80px,14vw,240px)]")}>
                {i > 0 && <span className="m-line hidden h-px w-[clamp(60px,12vw,200px)] border-t md:block" aria-hidden />}
                <span>
                  <Lines text={l} />
                </span>
              </p>
            ))}
          </div>
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="flex shrink-0 items-center gap-1.5 text-[length:calc(12px*var(--m-scale))] font-medium uppercase tracking-[0.08em] hover:text-[var(--m-accent)]">
              <ChevronsRight className="h-4 w-4" /> {s.buttonLabel}
            </MLink>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 07's hero: a small photo card and the shop name on the left, a tall photo on the right. */
function SplitWordHero({ s }: { s: Record<string, string> }) {
  const fit = Math.min(1, 7 / Math.max(4, longestLine(s.heading)));
  return (
    <section className="grid md:min-h-[clamp(440px,46vw,700px)] md:grid-cols-2">
      <div className="relative order-1 aspect-[4/3.6] overflow-hidden md:order-2 md:aspect-auto">
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
      <div className="order-2 flex flex-col justify-between gap-10 px-[var(--g)] py-[clamp(24px,3.4vw,52px)] md:order-1">
        {s.tile1Image && (
          <MLink to={s.tile1Link || "/catalog"} className="group block w-[clamp(128px,13vw,200px)] self-start md:ml-[16%]">
            <span className="m-panel relative block aspect-[4/5] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.tile1Image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            </span>
            {s.tile1Label && (
              <span className="mt-2 flex items-center justify-between text-[length:calc(11.5px*var(--m-scale))] font-medium text-[var(--m-accent)]">
                {s.tile1Label} <ArrowRight className="h-4 w-4" />
              </span>
            )}
            {s.tag && <span className="m-muted mt-2 block text-[length:calc(11px*var(--m-scale))] leading-snug">{s.tag}</span>}
          </MLink>
        )}
        <h1 className="m-h m-display t-split-word m-rise text-[var(--m-accent)]" style={{ "--fit": String(fit) } as React.CSSProperties}>
          <span className="relative inline-block">
            <Lines text={s.heading} />
            {s.subheading && <span className="t-split-sub absolute -top-[0.42em] right-0">{s.subheading}</span>}
          </span>
        </h1>
      </div>
    </section>
  );
}

/** Theme 08's hero: the shop name in tall letters on the left (split over two lines), a product photo on the right. */
function PosterHero({ s }: { s: Record<string, string> }) {
  // one long word reads as a poster when it breaks in the middle ("FOR / MA")
  const raw = s.heading || "";
  const heading = raw.includes("\n") || raw.includes(" ") || raw.length < 6 ? raw : `${raw.slice(0, Math.ceil(raw.length / 2))}\n${raw.slice(Math.ceil(raw.length / 2))}`;
  const fit = Math.min(1, 5 / Math.max(3, longestLine(heading)));
  return (
    <section className="overflow-hidden">
      <Container className="relative grid items-center gap-4 py-[clamp(16px,3vw,48px)] md:grid-cols-[1.15fr_1fr]">
        <div className="m-rise">
          <h1 className="m-h m-display t-poster text-[var(--m-accent)]" style={{ "--fit": String(fit) } as React.CSSProperties}>
            <Lines text={heading} />
          </h1>
          {s.tag && <p className="mt-4 text-[length:calc(clamp(13px,1.3vw,18px)*var(--m-scale))] font-medium uppercase tracking-[0.04em] text-[var(--m-accent)]">{s.tag}</p>}
        </div>
        <div className="relative flex flex-col items-center">
          {s.buttonLabel && (
            <MLink
              to={s.buttonLink || "/catalog"}
              className="order-2 mt-4 inline-flex h-12 items-center border-2 border-[var(--m-accent)] px-7 text-[length:calc(14px*var(--m-scale))] font-semibold text-[var(--m-accent)] transition-colors hover:bg-[var(--m-accent)] hover:text-[var(--m-accent-text)] md:absolute md:right-0 md:top-0 md:order-1 md:mt-0"
            >
              {s.buttonLabel}
            </MLink>
          )}
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="order-1 aspect-[4/4.6] w-full max-w-[460px] object-cover md:order-2 md:mt-16" />
          )}
        </div>
      </Container>
    </section>
  );
}

/** Each category on its own row: its name on the left and a few of its products on the right. */
function CategoryRows({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const rows = activeCategories(store)
    .filter((c) => !c.parentId)
    .map((c) => ({ c, all: productsInCategory(store, c) }))
    .filter((r) => r.all.length)
    .slice(0, 4);
  if (!rows.length) return null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <SectionHead s={s} action={s.buttonLabel ? <RuleLink to="/catalog" label={s.buttonLabel} /> : undefined} />
        <div className="space-y-[clamp(24px,3vw,44px)]">
          {rows.map(({ c, all }) => (
            <div key={c.id} className="grid gap-3 md:grid-cols-[1fr_2fr] md:gap-6">
              <MLink to={`/category/${c.slug}`} className="flex items-center gap-1.5 self-start text-[length:calc(12px*var(--m-scale))] font-medium uppercase tracking-[0.08em] hover:text-[var(--m-accent)] md:justify-end md:pt-2">
                <ChevronsRight className="h-4 w-4" /> {c.name} <span className="m-faint normal-case tracking-normal">({all.length})</span>
              </MLink>
              <div className="m-stagger m-lift-kids grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
                {all.slice(0, 3).map((p, i) => (
                  <MLink key={p.id} to={`/products/${p.slug || p.id}`} className={cn("m-panel m-card group relative block aspect-[1/0.9] overflow-hidden", i === 2 && "hidden sm:block")} aria-label={p.title}>
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    )}
                  </MLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** "» See all" at the end of a heading rule. */
function RuleLink({ to, label }: { to: string; label: string }) {
  return (
    <MLink to={to} className="flex shrink-0 items-center gap-1 text-[length:calc(11.5px*var(--m-scale))] font-medium uppercase tracking-[0.08em] hover:text-[var(--m-accent)]">
      <ChevronsRight className="h-4 w-4" /> {label}
    </MLink>
  );
}

/** Three tall photos of the categories, each with its name and an arrow under it. */
function CollectionTiles({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const tiles = activeCategories(store)
    .filter((c) => !c.parentId)
    .map((c) => ({ c, image: c.imageUrl || productsInCategory(store, c)[0]?.images?.[0] || "" }))
    .filter((t) => t.image)
    .slice(0, 3);
  if (!tiles.length) return null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="mb-[clamp(18px,2.4vw,32px)] grid gap-3 md:grid-cols-[1fr_1.2fr_auto] md:items-start md:gap-8">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted max-w-md text-[length:calc(12.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          {s.buttonLabel && (
            <MLink to="/catalog" className="flex items-center gap-2 text-[length:calc(12px*var(--m-scale))] font-medium text-[var(--m-accent)]">
              {s.buttonLabel} <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
        <div className="m-stagger m-scroll -mx-[var(--g)] flex snap-x gap-3 overflow-x-auto px-[var(--g)] scroll-px-[var(--g)] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
          {tiles.map(({ c, image }) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group block w-[74%] shrink-0 snap-start md:w-auto">
              <span className="m-panel relative block aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-[1.05]" />
              </span>
              <span className="mt-2.5 flex items-center justify-between text-[length:calc(11.5px*var(--m-scale))] font-medium uppercase tracking-[0.04em] text-[var(--m-accent)]">
                {c.name} <ArrowRight className="h-4 w-4" />
              </span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** A sign-up line: email on an underline and a button. */
function InlineSignup({ button }: { button: string }) {
  const { store, editing, demo } = useSite();
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);
  if (done) {
    return (
      <p className="mt-5 inline-flex items-center gap-2 text-[length:calc(13px*var(--m-scale))] font-medium">
        <Check className="h-4 w-4" /> Thanks, you&apos;re on the list.
      </p>
    );
  }
  return (
    <form
      className="mt-5 flex max-w-md items-end gap-3"
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
        aria-label="Your email"
        className="m-line min-w-0 flex-1 border-b bg-transparent py-2.5 text-[16px] outline-none placeholder:text-[color-mix(in_srgb,var(--m-text)_40%,transparent)] focus:border-[var(--m-text)]"
      />
      <button type="submit" className="m-btn min-h-11 shrink-0 px-5">
        {button || "Subscribe"}
      </button>
    </form>
  );
}

/** The brand's story beside a portrait, then a sign-up box beside a second photo. */
function BrandStory({ s }: { s: Record<string, string> }) {
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <h2 className="m-h t-section mb-[clamp(20px,3vw,44px)] text-center">
          <Lines text={s.heading} />
        </h2>
        <div className="m-stagger grid gap-6 md:grid-cols-2 md:items-center md:gap-12">
          <div className="m-panel relative aspect-[4/4.4] overflow-hidden">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          {s.text && <p className="max-w-md whitespace-pre-line text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
        </div>
        {(s.newsHeading || s.image2) && (
          <div className="m-stagger mt-8 grid gap-6 md:mt-0 md:grid-cols-2 md:items-end md:gap-12">
            <div className="order-2 md:order-1 md:pb-4">
              {s.newsHeading && (
                <>
                  <h3 className="m-h t-title">
                    <Lines text={s.newsHeading} />
                  </h3>
                  {s.newsText && <p className="m-muted mt-3 max-w-sm text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.newsText}</p>}
                  <InlineSignup button={s.newsButton} />
                </>
              )}
            </div>
            {s.image2 && (
              <div className="m-panel relative order-1 aspect-[4/3.3] overflow-hidden md:order-2 md:-mt-[14%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image2} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}

/** A photo beside the shop's phone, email, opening hours and social links (from Settings). */
function ContactBlock({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const wa = whatsappLink(store.contactPhone);
  const ig = store.instagramHandle ? `https://instagram.com/${store.instagramHandle.replace(/^@/, "")}` : "";
  const label = "text-[length:calc(12px*var(--m-scale))] font-semibold text-[var(--m-accent)]";
  const round = "m-line flex h-10 w-10 items-center justify-center rounded-full border hover:border-[var(--m-text)]";
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <h2 className="m-h t-section mb-[clamp(20px,3vw,44px)] text-center">
          <Lines text={s.heading} />
        </h2>
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:gap-12">
          <div className="m-panel relative aspect-[4/3.4] overflow-hidden">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="space-y-6 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">
            {s.text && <p>{s.text}</p>}
            {(store.contactEmail || store.contactPhone) && (
              <div>
                <p className={label}>Orders and delivery</p>
                {store.contactEmail && (
                  <a href={`mailto:${store.contactEmail}`} className="mt-1 block hover:underline">
                    {store.contactEmail}
                  </a>
                )}
                {store.contactPhone && (
                  <a href={`tel:${store.contactPhone}`} className="block hover:underline">
                    {store.contactPhone}
                  </a>
                )}
              </div>
            )}
            {s.hours && (
              <div>
                <p className={label}>Opening hours</p>
                <p className="mt-1 whitespace-pre-line">{s.hours}</p>
              </div>
            )}
            {(ig || wa) && (
              <div>
                <p className={label}>Follow us</p>
                <div className="mt-2 flex gap-2">
                  {ig && (
                    <a href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={round}>
                      <InstagramIcon className="h-4 w-4" />
                    </a>
                  )}
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={round}>
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A soft panel with one product, a few words and a link, beside a big photo. */
function CollectionFeature({ s }: { s: Record<string, string> }) {
  const left = s.imageSide === "left";
  return (
    <section className="py-[clamp(12px,2vw,28px)]">
      <Container>
        <div className="m-stagger grid gap-3 md:grid-cols-2 md:gap-4">
          <div className={cn("m-panel group flex flex-col items-center justify-between gap-6 px-6 py-[clamp(28px,3.6vw,56px)] text-center md:min-h-[clamp(400px,40vw,640px)]", left && "md:order-2")}>
            <h2 className="m-h t-section">
              <Lines text={s.heading} />
            </h2>
            {s.productImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.productImage}
                alt=""
                loading="lazy"
                className="aspect-[4/5] w-[min(52%,280px)] object-cover shadow-[0_30px_60px_-40px_rgba(0,0,0,0.5)] transition duration-700 group-hover:-translate-y-1"
              />
            )}
            <div>
              {s.text && <p className="mx-auto max-w-xs text-[length:calc(12.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
              {s.buttonLabel && (
                <MLink to={s.buttonLink || "/catalog"} className="mt-3 inline-flex items-center gap-1 text-[length:calc(12px*var(--m-scale))] font-medium underline-offset-4 hover:underline">
                  {s.buttonLabel} <ArrowRight className="h-3.5 w-3.5" />
                </MLink>
              )}
            </div>
          </div>
          <div className="m-panel relative aspect-[4/4.6] overflow-hidden md:aspect-auto">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-1000 hover:scale-[1.03]" />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** One big story and up to three smaller ones in a soft panel, like a journal. */
function Stories({ s }: { s: Record<string, string> }) {
  const items = [1, 2, 3, 4].filter((i) => s[`s${i}Title`]);
  if (!items.length) return null;
  const [first, ...rest] = items;
  const tag = "m-muted text-[length:calc(10.5px*var(--m-scale))] uppercase tracking-[0.08em]";
  const more = (
    <span className="mt-2 inline-flex items-center gap-1 text-[length:calc(11.5px*var(--m-scale))] font-medium">
      Read more <ArrowRight className="h-3.5 w-3.5" />
    </span>
  );
  return (
    <section className="py-[clamp(24px,4vw,64px)]">
      <Container>
        <div className="m-panel px-[clamp(16px,3vw,44px)] py-[clamp(20px,3vw,44px)]">
          <div className="m-line mb-[clamp(18px,2.4vw,32px)] flex items-end justify-between gap-4 border-b pb-4">
            <p className="m-h m-display text-[length:calc(clamp(26px,3vw,40px)*var(--m-scale))] leading-none">{s.heading}</p>
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/pages/about"} className="flex shrink-0 items-center gap-1 text-[length:calc(11.5px*var(--m-scale))] font-medium hover:underline">
                {s.buttonLabel} <ArrowRight className="h-3.5 w-3.5" />
              </MLink>
            )}
          </div>
          <div className="m-stagger grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-10">
            <MLink to={s[`s${first}Link`] || "/pages/about"} className="group grid gap-4 sm:grid-cols-[1fr_1.1fr]">
              <span className="order-2 sm:order-1">
                <span className={cn(tag, "block")}>{s[`s${first}Tag`]}</span>
                <span className="mt-1.5 block text-[length:calc(clamp(18px,1.7vw,24px)*var(--m-scale))] font-medium leading-snug">{s[`s${first}Title`]}</span>
                {more}
              </span>
              {s[`s${first}Image`] && (
                <span className="relative order-1 block aspect-[4/5] overflow-hidden sm:order-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s[`s${first}Image`]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-[1.04]" />
                </span>
              )}
            </MLink>
            <div>
              {rest.map((i) => (
                <MLink key={i} to={s[`s${i}Link`] || "/pages/about"} className="m-line group flex items-center justify-between gap-4 border-t py-4 first:border-t-0 first:pt-0">
                  <span className="min-w-0">
                    <span className={cn(tag, "block")}>{s[`s${i}Tag`]}</span>
                    <span className="mt-1 block text-[length:calc(14.5px*var(--m-scale))] font-medium leading-snug">{s[`s${i}Title`]}</span>
                    {more}
                  </span>
                  {s[`s${i}Image`] && (
                    <span className="relative block h-20 w-20 shrink-0 overflow-hidden sm:h-24 sm:w-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s[`s${i}Image`]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    </span>
                  )}
                </MLink>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Products in a mosaic: one big photo and smaller ones placed around it. */
function MosaicGrid({ products }: { products: ProductData[] }) {
  // where each of the six sits on a four-column grid (from md up)
  const spots = ["md:col-span-2 md:row-span-2 md:col-start-1 md:row-start-1", "md:col-start-3 md:row-start-1", "md:col-start-4 md:row-start-2", "md:col-start-1 md:row-start-3", "md:col-start-3 md:row-start-3", "md:col-start-4 md:row-start-3"];
  return (
    <div className="m-stagger grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-4 md:gap-y-8">
      {products.slice(0, 6).map((p, i) => (
        <ProductCard key={p.id} product={p} className={cn(spots[i], i === 0 && "col-span-2", i === 5 && "hidden md:block")} />
      ))}
    </div>
  );
}

/** Theme 10's hero: a big rounded photo with the heading and button on it, two photo tiles beside it. */
function BentoHero({ s }: { s: Record<string, string> }) {
  const tiles = [1, 2].map((n) => ({ image: s[`tile${n}Image`], label: s[`tile${n}Label`], link: s[`tile${n}Link`] })).filter((t) => t.image);
  return (
    <section className="pb-[clamp(16px,2.4vw,32px)] pt-[clamp(6px,1vw,14px)]">
      <Container>
        <div className={cn("grid gap-2.5 sm:gap-3", tiles.length > 0 && "md:grid-cols-[2.15fr_1fr]")}>
          <div className="m-card relative flex min-h-[clamp(440px,44vw,640px)] overflow-hidden bg-[#2b2b2b] text-white">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_30%]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/15 to-transparent" />
            <div className="m-rise relative flex max-w-md flex-col p-[clamp(22px,3.2vw,48px)]">
              <h1 className="m-h m-display t-hero">
                <Lines text={s.heading} />
              </h1>
              {s.subheading && <p className="mt-4 max-w-[19rem] text-[length:calc(13.5px*var(--m-scale))] leading-relaxed text-white/85">{s.subheading}</p>}
              {s.buttonLabel && (
                <MLink
                  to={s.buttonLink || "/catalog"}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-white px-6 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.07em] text-[#161616] transition-[gap] hover:gap-3"
                >
                  {s.buttonLabel}
                  <ArrowRight className="h-4 w-4" />
                </MLink>
              )}
            </div>
          </div>
          {tiles.length > 0 && (
            <div className="m-stagger grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-1 md:grid-rows-2">
              {tiles.map((t, i) => (
                <MLink key={i} to={t.link || "/catalog"} className="m-card group relative min-h-[200px] overflow-hidden bg-[#2b2b2b] text-white md:min-h-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
                  {t.label && (
                    <p className="m-h relative p-[clamp(14px,1.7vw,24px)] text-[length:calc(clamp(19px,2vw,30px)*var(--m-scale))] leading-[1.05]">
                      <Lines text={t.label} />
                    </p>
                  )}
                  <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#161616] transition-transform group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </MLink>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 11's hero: a product name in big letters, the photo over an outline word, and a row of details under it. */
function SpecHero({ s }: { s: Record<string, string> }) {
  const specs = [1, 2, 3, 4].map((n) => ({ label: s[`spec${n}Label`], value: s[`spec${n}Value`] })).filter((x) => x.label || x.value);
  return (
    <section className="m-panel overflow-hidden">
      <Container>
        <div className="grid items-center gap-4 py-[clamp(28px,5vw,80px)] md:grid-cols-[1fr_1.2fr] md:gap-8">
          <div className="m-rise relative z-10">
            <h1 className="m-h m-display t-spec">
              <Lines text={s.heading} />
            </h1>
            {s.subheading && <p className="m-muted mt-4 max-w-sm text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-7 min-h-11 px-6">
                {s.buttonLabel}
                <ChevronRight className="h-4 w-4" />
              </MLink>
            )}
          </div>
          <div className="relative flex items-center justify-center">
            {s.outline && (
              <span aria-hidden className="t-outline pointer-events-none absolute inset-0 flex select-none items-center justify-center">
                {s.outline}
              </span>
            )}
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="m-float t-soft relative aspect-[4/3] w-full max-w-[600px] object-cover mix-blend-multiply" />
            )}
          </div>
        </div>
        {specs.length > 0 && (
          <div className="m-line grid grid-cols-2 gap-x-6 gap-y-4 border-t py-[clamp(18px,2.4vw,30px)] sm:grid-cols-4 md:grid-cols-[repeat(4,1fr)_auto] md:items-center">
            {specs.map((x, i) => (
              <div key={i} className="min-w-0">
                <p className="m-h text-[length:calc(14px*var(--m-scale))] leading-tight">{x.label}</p>
                <p className="m-muted mt-1 truncate text-[length:calc(12.5px*var(--m-scale))]">{x.value}</p>
              </div>
            ))}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn m-btn-outline hidden min-h-10 px-5 md:inline-flex">
                {s.buttonLabel}
                <ChevronRight className="h-4 w-4" />
              </MLink>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}

/** Theme 12's hero: the shop's top product on a colour panel, and a big photo with the shop name across it. */
function DuoHero({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const top = productsFromSource(store, "bestsellers", 1)[0];
  // long shop names shrink so they stay on one line across the photo
  const fit = Math.min(1, 7 / Math.max(4, (s.heading || "").length));
  return (
    <section className="grid md:grid-cols-[1fr_1.15fr]">
      <div className="order-2 flex flex-col items-center justify-center bg-[var(--m-accent)] px-6 py-[clamp(36px,5vw,72px)] text-[var(--m-accent-text)] md:order-1">
        {top && (
          <MLink to={`/products/${top.slug || top.id}`} className="m-rise group block w-[min(290px,70%)] text-center">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-black/15 shadow-[0_34px_60px_-30px_rgba(0,0,0,0.55)]">
              {top.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={top.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
              )}
            </div>
            <p className="mt-4 text-[length:calc(13px*var(--m-scale))] font-medium">{top.title}</p>
            <p className="mt-1 text-[length:calc(13px*var(--m-scale))] font-semibold tabular-nums">{rupees(top.price)}</p>
          </MLink>
        )}
        {s.buttonLabel && (
          <MLink
            to={s.buttonLink || "/catalog"}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--m-accent-text)] px-6 text-[length:calc(12.5px*var(--m-scale))] font-semibold text-[var(--m-accent)] transition-[gap] hover:gap-3"
          >
            {s.buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </MLink>
        )}
      </div>
      <div className="relative order-1 min-h-[clamp(360px,48vw,680px)] overflow-hidden bg-[var(--m-panel)] md:order-2">
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
        <h1 className="m-h m-display t-duo m-rise absolute bottom-[0.04em] left-[clamp(14px,2vw,28px)] right-0 overflow-hidden whitespace-nowrap text-white" style={{ "--fit": String(fit) } as React.CSSProperties}>
          {s.heading}
        </h1>
      </div>
    </section>
  );
}

/** A heading and a few words beside two photo cards with captions. */
function LookCards({ s }: { s: Record<string, string> }) {
  const cards = [1, 2].map((n) => ({ image: s[`l${n}Image`], title: s[`l${n}Title`], link: s[`l${n}Link`] })).filter((c) => c.image);
  return (
    <section className="py-[clamp(28px,4vw,64px)]">
      <Container>
        <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:items-end md:gap-4">
          <div className="md:pb-2">
            <h2 className="m-h t-title">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="m-muted mt-4 max-w-xs text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.text}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn m-btn-outline mt-6 min-h-10 px-5">
                {s.buttonLabel}
              </MLink>
            )}
          </div>
          {cards.length > 0 && (
            <div className="m-stagger grid grid-cols-2 gap-2.5 sm:gap-3">
              {cards.map((c, i) => (
                <MLink key={i} to={c.link || "/catalog"} className="m-card group relative aspect-[4/4.6] overflow-hidden bg-[#2b2b2b] text-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  {c.title && (
                    <p className="m-h absolute bottom-0 left-0 p-[clamp(12px,1.6vw,22px)] text-[length:calc(clamp(17px,2vw,30px)*var(--m-scale))] leading-[1.05]">
                      <Lines text={c.title} />
                    </p>
                  )}
                  <ArrowUpRight className="absolute bottom-[clamp(12px,1.6vw,22px)] right-[clamp(12px,1.6vw,22px)] h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 sm:h-6 sm:w-6" />
                </MLink>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** "Red #E5604D" lines as round colour chips; each searches the shop for that colour. */
function ColourChips({ s }: { s: Record<string, string> }) {
  const chips = (s.colours || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.*?)\s*(#[0-9a-f]{3,8})?$/i);
      return { name: (m?.[1] || l).trim(), hex: m?.[2] || "" };
    })
    .filter((c) => c.name);
  if (!chips.length) return null;
  return (
    <section className="py-[clamp(28px,4vw,64px)]">
      <Container>
        <div className="m-line grid gap-5 border-t pt-[clamp(24px,3vw,44px)] md:grid-cols-[1fr_2fr] md:items-center">
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          <div className="m-stagger flex flex-wrap gap-2 md:justify-end">
            {chips.map((c) => (
              <MLink
                key={c.name}
                to={`/search?q=${encodeURIComponent(c.name.toLowerCase())}`}
                className="m-line flex h-10 min-h-0 items-center gap-2 rounded-full border bg-[var(--m-bg)] pl-1.5 pr-4 text-[length:calc(11.5px*var(--m-scale))] font-medium uppercase tracking-[0.05em] transition hover:-translate-y-0.5 hover:border-[var(--m-text)]"
              >
                <span className="h-7 w-7 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" style={{ background: c.hex || "var(--m-panel)" }} />
                {c.name}
              </MLink>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A customer's words over a wide photo. */
function Testimonial({ s }: { s: Record<string, string> }) {
  if (!s.heading && !s.text) return null;
  return (
    <section className="py-[clamp(28px,4vw,64px)]">
      <Container>
        <div className="m-card relative flex min-h-[clamp(400px,38vw,540px)] overflow-hidden bg-[#3b3530] text-white">
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
          <div className="relative flex max-w-xl flex-col justify-between gap-10 p-[clamp(22px,3.6vw,56px)]">
            <div>
              {s.label && <p className="text-[length:calc(13px*var(--m-scale))] text-white/70">{s.label}</p>}
              {s.heading && (
                <p className="m-h t-title mt-2">
                  <Lines text={s.heading} />
                </p>
              )}
              {s.text && <p className="mt-4 max-w-md text-[length:calc(13px*var(--m-scale))] leading-relaxed text-white/80">{s.text}</p>}
            </div>
            {s.name && (
              <div>
                <p className="text-[length:calc(14px*var(--m-scale))] font-semibold">{s.name}</p>
                {s.role && <p className="mt-0.5 text-[length:calc(12px*var(--m-scale))] text-white/65">{s.role}</p>}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A heading above a wide photo with three numbers on it. */
function WhyStats({ s }: { s: Record<string, string> }) {
  const stats = [1, 2, 3].map((n) => ({ value: s[`n${n}Value`], label: s[`n${n}Label`], text: s[`n${n}Text`] })).filter((x) => x.value || x.label);
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="mb-[clamp(20px,3vw,40px)] grid gap-4 md:grid-cols-2 md:items-end">
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted max-w-md text-[length:calc(13px*var(--m-scale))] leading-relaxed md:justify-self-end">{s.text}</p>}
        </div>
        <div className="relative">
          {s.image && (
            <div className="m-card m-panel relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          )}
          {stats.length > 0 && (
            <div className={cn("m-stagger grid gap-2 sm:grid-cols-3", s.image && "relative mx-3 -mt-12 sm:mx-6 lg:absolute lg:bottom-6 lg:right-6 lg:mx-0 lg:mt-0 lg:w-[64%]")}>
              {stats.map((x, i) => (
                <div key={i} className="m-card bg-[var(--m-bg)] p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)] sm:p-5">
                  <p className="m-faint text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.08em]">{x.label}</p>
                  <p className="m-h mt-2 text-[length:calc(clamp(26px,2.6vw,40px)*var(--m-scale))] leading-none">{x.value}</p>
                  {x.text && <p className="m-muted mt-1.5 text-[length:calc(12px*var(--m-scale))]">{x.text}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** The first three categories on soft coloured panels, each with a button. */
function CategoryPanels({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = activeCategories(store)
    .filter((c) => !c.parentId)
    .slice(0, 3);
  if (!cats.length) return null;
  const tints = ["var(--m-panel)", "color-mix(in srgb, #E06AB0 13%, var(--m-bg))", "color-mix(in srgb, var(--m-text) 6%, var(--m-bg))"];
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        {s.heading && <SectionHead s={s} />}
        <div className="m-stagger m-scroll -mx-[var(--g)] flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-[var(--g)] scroll-px-[var(--g)] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
          {cats.map((c, i) => (
            <MLink
              key={c.id}
              to={`/category/${c.slug}`}
              className="m-card group flex w-[74%] shrink-0 snap-start flex-col items-center px-5 pb-7 pt-5 text-center sm:w-auto sm:pb-9"
              style={{ background: tints[i % tints.length] }}
            >
              <div className="relative aspect-[4/3] w-full">
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" loading="lazy" className="t-soft absolute inset-0 h-full w-full object-cover mix-blend-multiply transition duration-500 group-hover:-translate-y-1.5 group-hover:scale-[1.04]" />
                )}
              </div>
              <p className="m-h mt-5 text-[length:calc(clamp(17px,1.6vw,22px)*var(--m-scale))]">{c.name}</p>
              {s.buttonLabel && (
                <span className="mt-3 inline-flex h-9 items-center gap-1 rounded-full border border-current px-4 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] transition-colors group-hover:bg-[var(--m-text)] group-hover:text-[var(--m-bg)]">
                  {s.buttonLabel}
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** A heading and text beside one big product, with three more under it. */
function FeaturedProduct({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const list = productsFromSource(store, s.source || "newest", 4);
  if (!list.length) return null;
  const [main, ...rest] = list;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="m-h t-title">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="m-muted mt-4 max-w-sm text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-6 min-h-10 px-5">
                {s.buttonLabel}
                <ChevronRight className="h-4 w-4" />
              </MLink>
            )}
          </div>
          <MLink to={`/products/${main.slug || main.id}`} className="group block">
            <div className="m-panel m-card relative aspect-[5/4] overflow-hidden">
              {main.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={main.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-[length:calc(13.5px*var(--m-scale))]">
              <p className="truncate font-medium">{main.title}</p>
              <p className="shrink-0 tabular-nums">{rupees(main.price)}</p>
            </div>
          </MLink>
        </div>
        {rest.length > 0 && (
          <div className="m-stagger mt-[clamp(32px,4.6vw,64px)] grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3">
            {rest.map((p, i) => (
              <ProductCard key={p.id} product={p} className={i === 2 ? "hidden md:block" : undefined} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

/** A wide photo with a big heading and a button on it. */
function PromoBanner({ s }: { s: Record<string, string> }) {
  if (!s.image && !s.heading) return null;
  return (
    <section className="py-[clamp(24px,4vw,64px)]">
      <Container>
        <MLink to={s.buttonLink || "/catalog"} className="m-card group relative flex min-h-[clamp(280px,32vw,460px)] items-center overflow-hidden bg-[#141414] text-white">
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-[1.2s] group-hover:scale-[1.04]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="relative p-[clamp(22px,4vw,64px)]">
            <h2 className="m-h m-display t-title">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="mt-3 max-w-xs text-[length:calc(13.5px*var(--m-scale))] leading-relaxed text-white/85">{s.text}</p>}
            {s.buttonLabel && (
              <span className="mt-6 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] text-[#141414] transition-[gap] group-hover:gap-2.5">
                {s.buttonLabel}
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </MLink>
      </Container>
    </section>
  );
}

// each brand name gets its own lettering, like a row of logos
const BRAND_FONTS: { family: string; weight: number; spacing?: string; upper?: boolean }[] = [
  { family: "'Syne', sans-serif", weight: 800, spacing: "-0.02em" },
  { family: "'Space Grotesk', sans-serif", weight: 500 },
  { family: "'Playfair Display', serif", weight: 600 },
  { family: "'Unbounded', sans-serif", weight: 600, spacing: "-0.03em" },
  { family: "'Bricolage Grotesque', sans-serif", weight: 700 },
  { family: "'Anton', sans-serif", weight: 400, spacing: "0.04em", upper: true },
  { family: "'Instrument Serif', serif", weight: 400 },
];

/** A row of brand names in different lettering. */
function BrandStrip({ s }: { s: Record<string, string> }) {
  const names = (s.names || "")
    .split("·")
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length) return null;
  return (
    <section className="py-[clamp(22px,3vw,44px)]">
      <Container>
        <div className="m-scroll -mx-[var(--g)] flex items-center gap-[clamp(32px,4vw,64px)] overflow-x-auto px-[var(--g)] md:mx-0 md:justify-between md:px-0">
          {names.map((n, i) => {
            const f = BRAND_FONTS[i % BRAND_FONTS.length];
            return (
              <span
                key={i}
                className="shrink-0 whitespace-nowrap text-[length:calc(clamp(18px,1.8vw,26px)*var(--m-scale))] opacity-75 transition-opacity hover:opacity-100"
                style={{ fontFamily: f.family, fontWeight: f.weight, letterSpacing: f.spacing, textTransform: f.upper ? "uppercase" : undefined }}
              >
                {n}
              </span>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/** A category name with one of its products on a soft panel, beside two photos. */
function CategorySpotlight({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const product = productsFromSource(store, s.source || "newest", 1)[0] || productsFromSource(store, "bestsellers", 1)[0];
  const photos = [s.image, s.image2].filter(Boolean);
  return (
    <section className="py-[clamp(28px,4vw,64px)]">
      <div className="m-stagger grid grid-cols-2 md:grid-cols-3">
        <div className="m-panel col-span-2 flex flex-col items-center justify-center px-6 py-[clamp(36px,5vw,64px)] text-center md:col-span-1">
          {s.heading && (
            <h2 className="m-h t-section">
              <Lines text={s.heading} />
            </h2>
          )}
          {product && (
            <MLink to={`/products/${product.slug || product.id}`} className="group mt-6 block w-[min(220px,62%)]">
              <div className="relative aspect-square overflow-hidden bg-[color-mix(in_srgb,var(--m-text)_6%,var(--m-bg))]">
                {product.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                )}
              </div>
              <p className="mt-3 text-[length:calc(13px*var(--m-scale))]">{product.title}</p>
              <span className="mx-auto my-1.5 block h-px w-4 bg-current opacity-40" />
              <p className="text-[length:calc(13px*var(--m-scale))] font-semibold tabular-nums">{rupees(product.price)}</p>
            </MLink>
          )}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-5 text-[length:calc(12.5px*var(--m-scale))] font-semibold underline underline-offset-4 hover:text-[var(--m-accent)]">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
        {photos.map((src, i) => (
          <div key={i} className={cn("relative aspect-square overflow-hidden md:aspect-auto md:min-h-[clamp(360px,34vw,520px)]", photos.length === 1 && "col-span-2")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Theme 13's hero: the shop name in heavy letters on a colour block, a photo beside it. */
function BlockHero({ s }: { s: Record<string, string> }) {
  // the heavy rounded face is wide, so longer names shrink to stay inside the block
  const fit = Math.min(1, 6 / Math.max(4, longestLine(s.heading || "")));
  return (
    <section className="m-line grid border-b md:grid-cols-2">
      <div className="flex flex-col justify-center bg-[color-mix(in_srgb,var(--m-accent)_38%,var(--m-bg))] px-[var(--g)] py-[clamp(40px,6vw,96px)]">
        <div className="m-rise">
          <h1 className="m-h m-display t-block" style={{ "--fit": String(fit) } as React.CSSProperties}>
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="m-cap mt-[clamp(18px,2.4vw,36px)] max-w-sm text-[length:calc(11.5px*var(--m-scale))] leading-relaxed tracking-[0.02em]">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink
              to={s.buttonLink || "/catalog"}
              className="m-cap mt-[clamp(22px,3vw,40px)] inline-flex h-11 min-w-[200px] items-center justify-center bg-[var(--m-bg)] px-8 text-[length:calc(12px*var(--m-scale))] font-medium tracking-[0.06em] shadow-[8px_8px_0_#FFE68A] transition hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_#FFE68A]"
            >
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </div>
      <div className="relative min-h-[clamp(340px,42vw,620px)] overflow-hidden bg-[var(--m-panel)]">
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
    </section>
  );
}

/** Theme 14's hero: a rounded colour panel with heavy capitals, a star sticker and a rounded photo inside. */
function FramedHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="pt-[clamp(8px,1.4vw,20px)]">
      <Container>
        <div className="m-panel relative grid items-center gap-6 overflow-hidden rounded-[clamp(20px,2.4vw,36px)] p-[clamp(18px,3vw,44px)] md:grid-cols-[1fr_1.45fr] md:gap-8">
          <div className="m-rise relative">
            <span aria-hidden className="t-star m-float absolute -top-2 right-[8%] h-[clamp(52px,7vw,104px)] w-[clamp(52px,7vw,104px)] bg-[#F2B632]" />
            <h1 className="m-h m-display t-hero relative pt-[clamp(28px,4vw,56px)]">
              <Lines text={s.heading} />
            </h1>
            {s.subheading && <p className="mt-4 max-w-sm text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-6 min-h-11 px-7">
                {s.buttonLabel}
              </MLink>
            )}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[clamp(16px,1.8vw,26px)] bg-black/10 md:aspect-[16/10]">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Theme 15's hero: a full photo with a chunky heading on the left. */
function PopHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="relative flex min-h-[clamp(480px,46vw,720px)] items-center overflow-hidden bg-[#2a2320] text-white">
      {s.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
      <div className="m-rise relative w-full px-[var(--g)] py-[clamp(40px,6vw,96px)]">
        <h1 className="m-h m-display t-pop max-w-[14ch]">
          <Lines text={s.heading} />
        </h1>
        {s.subheading && <p className="m-h mt-3 text-[length:calc(clamp(13px,1.3vw,18px)*var(--m-scale))]">{s.subheading}</p>}
        {s.buttonLabel && (
          <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-6 min-h-11 px-9">
            {s.buttonLabel}
          </MLink>
        )}
      </div>
    </section>
  );
}

/** Theme 16's hero: a colour panel with a serif heading and a ticked list, a photo with the top product on it. */
function ChecklistHero({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const top = productsFromSource(store, "bestsellers", 1)[0];
  const points = (s.points || "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <section className="grid bg-[var(--m-accent)] text-[var(--m-accent-text)] md:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col justify-center px-[var(--g)] py-[clamp(36px,5vw,80px)]">
        <div className="m-rise">
          <h1 className="m-h m-display t-title text-[#F3D9AE]">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="mt-4 max-w-md text-[length:calc(13px*var(--m-scale))] leading-relaxed opacity-85">{s.subheading}</p>}
          {points.length > 0 && (
            <ul className="m-stagger mt-5 space-y-2">
              {points.map((p, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[length:calc(13.5px*var(--m-scale))] font-medium">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--m-accent-text)] text-[var(--m-accent)]">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          )}
          {s.buttonLabel && (
            <MLink
              to={s.buttonLink || "/catalog"}
              className="mt-7 inline-flex h-11 items-center rounded-full bg-[var(--m-accent-text)] px-7 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] text-[var(--m-accent)] transition hover:opacity-90"
            >
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </div>
      <div className="relative min-h-[clamp(320px,40vw,600px)] overflow-hidden bg-[var(--m-panel)]">
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {top && (
          <MLink
            to={`/products/${top.slug || top.id}`}
            className="m-rise absolute bottom-[clamp(12px,2vw,28px)] right-[clamp(12px,2vw,28px)] flex w-[min(250px,70%)] items-center gap-3 rounded-[10px] bg-[var(--m-bg)] p-2 text-[var(--m-text)] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5"
          >
            <span className="m-panel relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
              {top.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={top.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
            </span>
            <span className="min-w-0">
              <span className="m-h block truncate text-[length:calc(14px*var(--m-scale))]">{top.title}</span>
              <span className="m-muted block text-[length:calc(12px*var(--m-scale))] tabular-nums">{rupees(top.price)}</span>
            </span>
          </MLink>
        )}
      </div>
    </section>
  );
}

/** Lists of choices (size, filling…) that buyers pick from; the button sends their choices to the shop on WhatsApp. */
function CustomOrder({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const lists = [1, 2, 3, 4]
    .map((n) => ({
      label: (s[`o${n}Label`] || "").trim(),
      options: (s[`o${n}Options`] || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    }))
    .filter((l) => l.label && l.options.length);
  const [picked, setPicked] = React.useState<Record<string, string>>({});
  const choice = (l: { label: string; options: string[] }) => picked[l.label] || l.options[0];
  const message = `Hi ${store.name}! I'd like a special order:\n${lists.map((l) => `${l.label}: ${choice(l)}`).join("\n")}`;
  const wa = whatsappLink(store.contactPhone, message);
  if (!lists.length) return null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="mb-[clamp(20px,3vw,40px)] grid gap-5 md:grid-cols-[1.3fr_1fr] md:items-end">
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {(s.note || s.noteLabel) && (
            <div className="max-w-sm">
              {s.noteLabel && <span className="m-burst m-cap inline-block px-6 py-2.5 text-[length:calc(10.5px*var(--m-scale))] font-medium">{s.noteLabel}</span>}
              {s.note && <p className="m-cap mt-3 text-[length:calc(11px*var(--m-scale))] leading-relaxed tracking-[0.02em]">{s.note}</p>}
            </div>
          )}
        </div>
        <div className="m-line grid border md:grid-cols-[2fr_1fr]">
          <div>
            {lists.map((l, i) => (
              <label key={l.label} className={cn("m-line grid grid-cols-[0.8fr_1fr] items-stretch sm:grid-cols-[1fr_1.1fr_56px]", i > 0 && "border-t")}>
                <span className="m-line m-cap flex items-center justify-center border-r px-3 py-4 text-center text-[length:calc(12.5px*var(--m-scale))] font-semibold tracking-[0.04em]">{l.label}</span>
                <span className="relative flex items-center">
                  <select
                    value={choice(l)}
                    onChange={(e) => setPicked((p) => ({ ...p, [l.label]: e.target.value }))}
                    className="m-cap h-full min-h-[52px] w-full appearance-none bg-transparent px-4 text-center text-[length:calc(11.5px*var(--m-scale))] outline-none sm:pr-4"
                  >
                    {l.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--m-accent)] sm:hidden" />
                </span>
                <span
                  aria-hidden
                  className="m-line hidden items-center justify-center border-l sm:flex"
                  style={{ background: `color-mix(in srgb, var(--m-accent) ${i % 2 ? 20 : 42}%, var(--m-bg))` }}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </label>
            ))}
          </div>
          <div className="m-line relative flex min-h-[220px] items-center justify-center border-t p-6 md:border-l md:border-t-0">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="m-float aspect-square w-[min(240px,70%)] rounded-full object-cover" />
            )}
            {s.buttonLabel && (
              <a
                href={wa || undefined}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!wa) e.preventDefault();
                }}
                aria-disabled={!wa}
                title={wa ? undefined : "Add your WhatsApp number in Settings to take special orders"}
                className="absolute bottom-3 right-3 flex h-10 min-h-0 items-center gap-1.5 bg-[var(--m-accent)] px-4 text-[length:calc(11.5px*var(--m-scale))] font-semibold text-[var(--m-accent-text)] transition hover:opacity-85 aria-disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                {s.buttonLabel}
              </a>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A row of boxed words about the products, slightly tilted. */
function ClaimsStrip({ s }: { s: Record<string, string> }) {
  const words = (s.text || "")
    .split("·")
    .map((w) => w.trim())
    .filter(Boolean);
  if (!words.length) return null;
  return (
    <section className="overflow-hidden py-[clamp(20px,3vw,40px)]">
      <div className="m-scroll -mx-2 flex -rotate-[1.2deg] overflow-x-auto border-y-2 border-[var(--m-accent)] bg-[var(--m-bg)]">
        {words.map((w, i) => (
          <span
            key={i}
            className="m-h shrink-0 grow whitespace-nowrap border-r-2 border-[var(--m-accent)] px-[clamp(16px,2.4vw,36px)] py-3 text-center text-[length:calc(clamp(13px,1.4vw,19px)*var(--m-scale))] text-[var(--m-accent)]"
          >
            {w}
          </span>
        ))}
      </div>
    </section>
  );
}

/** One product big: photo, stars, price, quantity, Add to cart, and tabs with its details and reviews. */
function ProductSpotlight({ s }: { s: Record<string, string> }) {
  const { store, addToBag, href, wishlist, toggleWish } = useSite();
  const router = useRouter();
  const product = productsFromSource(store, s.source || "bestsellers", 1)[0] || productsFromSource(store, "bestsellers", 1)[0];
  const [qty, setQty] = React.useState(1);
  const [tab, setTab] = React.useState<"about" | "reviews">("about");
  if (!product) return null;
  const to = `/products/${product.slug || product.id}`;
  const needsChoice = (product.options || []).some((o) => o.options?.length);
  const reviews = canUseReviews(store.planId) ? (store.reviews || []).filter((r) => r.productId === product.id && r.status === "approved") : [];
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const wished = wishlist.includes(product.id);
  const photo = s.image || product.images?.[0];
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="m-panel relative min-h-[clamp(340px,42vw,640px)] overflow-hidden">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => toggleWish(product.id)}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wished}
            className="absolute right-4 top-4 flex h-10 min-h-0 w-10 items-center justify-center rounded-full bg-[var(--m-bg)] text-[var(--m-accent)] shadow-sm"
          >
            <Heart className={cn("h-[18px] w-[18px]", wished && "fill-current")} strokeWidth={1.7} />
          </button>
        </div>
        <div className="flex flex-col justify-center px-[var(--g)] py-[clamp(28px,4vw,64px)] md:max-w-xl md:pl-[clamp(28px,5vw,80px)]">
          <MLink to={to} className="m-h t-title min-h-0 hover:text-[var(--m-accent)]">
            {product.title}
          </MLink>
          {reviews.length > 0 && <Stars value={avg} className="mt-3 text-[var(--m-accent)]" />}
          <p className="mt-3 text-[length:calc(18px*var(--m-scale))] font-semibold tabular-nums">
            {rupees(product.price)}
            {discountPercent(product) > 0 && <span className="m-faint ml-2 text-[length:calc(14px*var(--m-scale))] font-normal line-through">{rupees(product.compareAtPrice!)}</span>}
          </p>
          {product.stock > 0 ? (
            <div className="mt-5 flex max-w-sm flex-col gap-2.5">
              {!needsChoice && <QtyStepperWide value={qty} onChange={(n) => setQty(Math.max(1, Math.min(99, n)))} />}
              <button
                type="button"
                onClick={() => (needsChoice ? router.push(href(to)) : (addToBag(product, qty), setQty(1)))}
                className="flex h-12 min-h-0 items-center justify-center gap-2 rounded-full bg-[var(--m-accent)] text-[length:calc(13px*var(--m-scale))] font-semibold text-[var(--m-accent-text)] transition hover:opacity-85"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
                {needsChoice ? "Choose options" : "Add to cart"}
              </button>
            </div>
          ) : (
            <p className="m-muted mt-5">Sold out</p>
          )}
          <div className="m-line mt-8 flex gap-6 border-b" role="tablist">
            {(
              [
                ["about", "Learn more"],
                ["reviews", `All reviews${reviews.length ? ` (${reviews.length})` : ""}`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn("-mb-px min-h-0 border-b-2 pb-2.5 text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.06em]", tab === id ? "border-[var(--m-text)]" : "m-muted border-transparent")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 min-h-[5em] text-[length:calc(13px*var(--m-scale))] leading-relaxed">
            {tab === "about" ? (
              <p className="m-muted whitespace-pre-line">{product.description || "Details coming soon."}</p>
            ) : reviews.length ? (
              <ul className="space-y-3">
                {reviews.slice(0, 3).map((r) => (
                  <li key={r.id}>
                    <p className="flex items-center gap-2 font-medium">
                      {r.customerName} <Stars value={r.rating} className="text-[var(--m-accent)] [&_svg]:h-3 [&_svg]:w-3" />
                    </p>
                    {r.comment && <p className="m-muted mt-0.5">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-muted">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A full-width quantity stepper for the product spotlight. */
function QtyStepperWide({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="m-line flex h-12 items-center justify-between rounded-full border px-2">
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(value - 1)} className="flex h-9 min-h-0 w-9 items-center justify-center rounded-full hover:bg-black/5">
        <Minus className="h-4 w-4" />
      </button>
      <span className="text-[length:calc(14px*var(--m-scale))] font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(value + 1)} className="flex h-9 min-h-0 w-9 items-center justify-center rounded-full hover:bg-black/5">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Three or four numbered steps; with a photo they sit beside it, without one they run across the page. */
function Steps({ s }: { s: Record<string, string> }) {
  const steps = [1, 2, 3, 4].map((n) => ({ title: s[`s${n}Title`], text: s[`s${n}Text`] })).filter((x) => x.title);
  if (!steps.length) return null;
  const head = (
    <div>
      {s.eyebrow && <p className="m-cap text-[length:calc(11.5px*var(--m-scale))] font-semibold tracking-[0.12em] text-[var(--m-accent)]">{s.eyebrow}</p>}
      <h2 className="m-h t-title mt-2">
        <Lines text={s.heading} />
      </h2>
    </div>
  );
  const list = (
    <ol className={cn("m-stagger grid gap-x-6 gap-y-7", s.image ? "sm:grid-cols-2" : steps.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
      {steps.map((x, i) => (
        <li key={i} className="m-line border-t pt-4">
          <span className="m-h flex h-10 w-10 items-center justify-center rounded-full bg-[var(--m-accent)] text-[length:calc(15px*var(--m-scale))] text-[var(--m-accent-text)]">{i + 1}</span>
          <p className="m-h mt-4 text-[length:calc(clamp(16px,1.4vw,20px)*var(--m-scale))]">{x.title}</p>
          {x.text && <p className="m-muted mt-2 text-[length:calc(13px*var(--m-scale))] leading-relaxed">{x.text}</p>}
        </li>
      ))}
    </ol>
  );
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        {s.image ? (
          <div className="grid items-center gap-8 md:grid-cols-[1fr_1.2fr] md:gap-14">
            <div className="m-panel m-card relative aspect-[4/5] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="space-y-8">
              {head}
              {list}
            </div>
          </div>
        ) : (
          <div className="space-y-[clamp(24px,3.4vw,48px)]">
            {head}
            {list}
          </div>
        )}
      </Container>
    </section>
  );
}

/** Common questions that open to show the answer. */
function Faq({ s }: { s: Record<string, string> }) {
  const items = [1, 2, 3, 4, 5].map((n) => ({ q: s[`q${n}`], a: s[`a${n}`] })).filter((x) => x.q);
  const [open, setOpen] = React.useState(0);
  if (!items.length) return null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="grid gap-8 md:grid-cols-[1fr_1.6fr] md:gap-14">
          <div>
            <h2 className="m-h t-title">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="m-muted mt-4 max-w-xs text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          </div>
          <div className="m-line border-t">
            {items.map((x, i) => (
              <div key={i} className="m-line border-b">
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-[length:calc(15px*var(--m-scale))] font-medium"
                >
                  {x.q}
                  <Plus className={cn("h-4 w-4 shrink-0 transition-transform duration-300", open === i && "rotate-45")} />
                </button>
                <div className={cn("grid transition-[grid-template-rows] duration-300", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <p className="m-muted overflow-hidden pr-8 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">
                    <span className="block pb-5">{x.a}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Four photos with a title and a line each: ingredients, materials, origins. */
function Highlights({ s }: { s: Record<string, string> }) {
  const { look } = useSite();
  const items = [1, 2, 3, 4].map((n) => ({ image: s[`h${n}Image`], title: s[`h${n}Title`], text: s[`h${n}Text`] })).filter((x) => x.title);
  if (!items.length) return null;
  const centred = look.headingAlign === "center";
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className={cn("mb-[clamp(24px,3.4vw,48px)] max-w-2xl", centred && "mx-auto text-center")}>
          {s.eyebrow && <p className="m-cap text-[length:calc(11.5px*var(--m-scale))] font-semibold tracking-[0.12em] text-[var(--m-accent)]">{s.eyebrow}</p>}
          <h2 className="m-h t-title mt-2">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-4 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
        </div>
        <div className="m-stagger m-lift-kids grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 lg:grid-cols-4">
          {items.map((x, i) => (
            <div key={i} className={cn(centred && "text-center")}>
              <div className="m-panel m-card relative aspect-square overflow-hidden">
                {x.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.05]" />
                )}
              </div>
              <p className="m-h mt-3 text-[length:calc(clamp(15px,1.4vw,19px)*var(--m-scale))]">{x.title}</p>
              {x.text && <p className="m-muted mt-1 text-[length:calc(12.5px*var(--m-scale))] leading-snug">{x.text}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** A photo beside a list of facts (nutrition, tech specs, materials). */
function Facts({ s }: { s: Record<string, string> }) {
  const rows = (s.rows || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const at = l.indexOf(":");
      return at > 0 ? { k: l.slice(0, at).trim(), v: l.slice(at + 1).trim() } : { k: l, v: "" };
    });
  if (!rows.length) return null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="m-panel m-card grid overflow-hidden md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[clamp(380px,38vw,560px)]">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col justify-center p-[clamp(22px,3.6vw,56px)]">
            {s.eyebrow && <p className="m-cap text-[length:calc(11.5px*var(--m-scale))] font-semibold tracking-[0.12em] text-[var(--m-accent)]">{s.eyebrow}</p>}
            <h2 className="m-h t-title mt-2">
              <Lines text={s.heading} />
            </h2>
            <dl className="mt-6 border-t-2 border-[var(--m-text)]">
              {rows.map((r, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 border-b border-[color-mix(in_srgb,var(--m-text)_18%,transparent)] py-3 text-[length:calc(13.5px*var(--m-scale))]">
                  <dt className="font-semibold">{r.k}</dt>
                  <dd className="text-right">{r.v}</dd>
                </div>
              ))}
            </dl>
            {s.note && <p className="m-faint mt-3 text-[length:calc(11.5px*var(--m-scale))]">{s.note}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-6 min-h-11 self-start px-7">
                {s.buttonLabel}
              </MLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Theme 17's hero: the heading on the left with a highlighted word, the photo in a soft rounded shape on the right. */
function BlobHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="overflow-hidden">
      <Container className="grid items-center gap-8 py-[clamp(24px,4vw,64px)] md:grid-cols-[1fr_1.05fr]">
        <div className="m-rise">
          <h1 className="m-h m-display t-hero">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="m-muted mt-5 max-w-xs text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--m-text)] px-6 text-[length:calc(12.5px*var(--m-scale))] font-semibold text-[var(--m-bg)] transition-[gap] hover:gap-3">
              {s.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
        <div className="relative aspect-[1/0.92]">
          <span aria-hidden className="absolute -right-[6%] bottom-[2%] h-[46%] w-[46%] rounded-full bg-[color-mix(in_srgb,#8A8FF0_22%,var(--m-bg))]" />
          <span aria-hidden className="absolute inset-[6%_10%_2%_4%] rounded-[46%_54%_42%_58%/52%_44%_56%_48%] bg-[color-mix(in_srgb,var(--m-accent)_18%,var(--m-bg))]" />
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="m-float absolute inset-[2%_8%_0_8%] h-[98%] w-[84%] rounded-[46%_54%_42%_58%/52%_44%_56%_48%] object-cover" />
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 18's hero: a rounded photo with the heading, text and button on it. */
function GlowHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="pb-[clamp(16px,2.4vw,32px)] pt-[clamp(8px,1.4vw,20px)]">
      <Container>
        <div className="relative flex min-h-[clamp(400px,40vw,620px)] items-center overflow-hidden rounded-[clamp(18px,2vw,30px)] bg-[#9AA8D8] text-white">
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1b1f5a]/55 via-[#1b1f5a]/15 to-transparent" />
          <div className="m-rise relative max-w-2xl p-[clamp(22px,4vw,64px)]">
            <h1 className="m-h m-display t-hero">
              <Lines text={s.heading} />
            </h1>
            {s.subheading && <p className="mt-4 max-w-sm text-[length:calc(14px*var(--m-scale))] leading-relaxed text-white/90">{s.subheading}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-7 min-h-11 px-7">
                {s.buttonLabel}
              </MLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Theme 19's hero: a colour panel with a two-line heading, a floating product photo and a round spinning badge. */
function CartonHero({ s }: { s: Record<string, string> }) {
  const badge = `${s.buttonLabel || "Shop now"} · `.repeat(3);
  return (
    <section className="m-panel overflow-hidden">
      <Container className="relative grid items-center gap-6 pb-[clamp(36px,5vw,72px)] pt-[clamp(28px,4vw,56px)] md:grid-cols-[1.1fr_1fr]">
        <div className="m-rise">
          <h1 className="m-h m-display t-hero">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="mt-5 max-w-sm text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
          <MLink to={s.buttonLink || "/catalog"} className="group relative mt-[clamp(28px,5vw,72px)] inline-flex h-28 w-28 items-center justify-center" aria-label={s.buttonLabel || "Shop now"}>
            <svg viewBox="0 0 100 100" className="t-spin absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text className="fill-current text-[10.5px] font-semibold uppercase tracking-[0.16em]">
                <textPath href="#badge-circle">{badge}</textPath>
              </text>
            </svg>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--m-text)] text-[var(--m-bg)] transition group-hover:scale-110">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </MLink>
        </div>
        <div className="relative aspect-square">
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="m-float absolute inset-[4%] h-[92%] w-[92%] rounded-[38%] object-cover shadow-[0_40px_70px_-40px_rgba(60,20,10,0.6)]" />
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 20's hero: a big photo with the shop name written huge across the top, a line of text and pill links. */
function WordmarkHero({ s }: { s: Record<string, string> }) {
  // short names grow to fill the width, long ones shrink to stay on one line
  const fit = Math.min(1.35, 9 / Math.max(4, (s.heading || "").length));
  return (
    <section className="relative overflow-hidden bg-[#d9d9d7]">
      {s.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover grayscale" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/25" />
      <div className="relative flex min-h-[clamp(520px,62vw,900px)] flex-col justify-between px-[var(--g)] pb-[clamp(20px,3vw,44px)] pt-[clamp(10px,1.4vw,20px)]">
        <h1 className="m-h m-display t-word m-rise whitespace-nowrap text-white" style={{ "--fit": String(fit) } as React.CSSProperties}>
          {s.heading}
        </h1>
        <div className="m-rise flex flex-col gap-4 self-end text-white sm:max-w-xs">
          {s.subheading && <p className="text-[length:calc(14px*var(--m-scale))] leading-snug">{s.subheading}</p>}
          <div className="flex flex-wrap gap-2">
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="inline-flex h-9 min-h-0 items-center rounded-full bg-white px-4 text-[length:calc(12px*var(--m-scale))] font-medium text-[#111] transition hover:bg-white/80">
                {s.buttonLabel}
              </MLink>
            )}
            {s.secondButtonLabel && (
              <MLink to={s.secondButtonLink || "/catalog"} className="inline-flex h-9 min-h-0 items-center rounded-full border border-white/70 px-4 text-[length:calc(12px*var(--m-scale))] font-medium transition hover:bg-white hover:text-[#111]">
                {s.secondButtonLabel}
              </MLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// soft tints for category tiles, in turn
const TINTS = ["#FCE6CF", "#D5ECEA", "#FBE0D8", "#F7E3EC", "#E3E7FB", "#EAF3D9"];

/** The first four categories on soft colour tiles: the name and a link on the left, the photo on the right. */
function CategoryTints({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = activeCategories(store)
    .filter((c) => !c.parentId)
    .slice(0, 4);
  if (!cats.length) return null;
  return (
    <section className="py-[clamp(16px,2.4vw,32px)]">
      <Container>
        <div className="m-stagger grid gap-2.5 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-4">
          {cats.map((c, i) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="m-card group relative flex h-[clamp(120px,10vw,150px)] overflow-hidden" style={{ background: TINTS[i % TINTS.length] }}>
              <div className="relative z-[1] flex flex-col justify-between p-4 text-[#1b1b22]">
                <p className="m-h max-w-[8rem] text-[length:calc(15px*var(--m-scale))] leading-tight">{c.name}</p>
                <span className="flex items-center gap-1.5 text-[length:calc(12px*var(--m-scale))] font-medium">
                  {s.buttonLabel || "Shop"} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              {c.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-y-0 right-0 h-full w-[52%] object-cover transition duration-700 [mask-image:linear-gradient(to_right,transparent,#000_30%)] group-hover:scale-105" />
              )}
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** A soft rounded banner with an offer, a button and a product photo on a circle. */
function SaleBanner({ s }: { s: Record<string, string> }) {
  return (
    <section className="py-[clamp(24px,4vw,56px)]">
      <Container>
        <div className="m-card relative grid items-center gap-4 overflow-hidden bg-[color-mix(in_srgb,#8A8FF0_20%,var(--m-bg))] p-[clamp(22px,4vw,56px)] md:grid-cols-[1.2fr_1fr]">
          <div className="relative">
            <h2 className="m-h t-title">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="m-muted mt-3 text-[length:calc(13.5px*var(--m-scale))]">{s.text}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--m-text)] px-5 text-[length:calc(12px*var(--m-scale))] font-semibold text-[var(--m-bg)] transition-[gap] hover:gap-3">
                {s.buttonLabel}
                <ArrowRight className="h-4 w-4" />
              </MLink>
            )}
          </div>
          <div className="relative mx-auto aspect-square w-[min(300px,80%)]">
            <span aria-hidden className="absolute inset-0 rounded-full bg-white/55" />
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="m-float absolute inset-[8%] h-[84%] w-[84%] rounded-full object-cover" />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A big rounded photo with one button on it. */
function PhotoCta({ s }: { s: Record<string, string> }) {
  if (!s.image) return null;
  return (
    <section className="py-[clamp(16px,2.4vw,32px)]">
      <Container>
        <MLink to={s.buttonLink || "/catalog"} className="group relative block aspect-[4/3] overflow-hidden rounded-[clamp(18px,2vw,30px)] bg-[var(--m-panel)] sm:aspect-[16/8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-[1.2s] group-hover:scale-[1.03]" />
          {s.buttonLabel && <span className="m-btn absolute bottom-[clamp(16px,2.4vw,32px)] left-[clamp(16px,2.4vw,32px)] min-h-10 px-6">{s.buttonLabel}</span>}
        </MLink>
      </Container>
    </section>
  );
}

/** A short heading and a line of text on a soft colour fade. */
function GradientStatement({ s }: { s: Record<string, string> }) {
  if (!s.heading && !s.text) return null;
  return (
    <section className="py-[clamp(12px,2vw,24px)]">
      <Container>
        <div className="rounded-[clamp(14px,1.6vw,22px)] bg-gradient-to-r from-[#D9DCF2] via-[#E9D9EC] to-[#F7C6DB] px-6 py-[clamp(24px,3vw,40px)] text-center shadow-[0_14px_34px_-24px_rgba(60,30,90,0.45)]">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mx-auto mt-2 max-w-md text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.text}</p>}
        </div>
      </Container>
    </section>
  );
}

/** A huge word with a product photo over it and a small card in the corner. */
function WordmarkFeature({ s }: { s: Record<string, string> }) {
  return (
    <section className="overflow-hidden py-[clamp(40px,6vw,96px)]">
      <Container className="relative">
        {s.word && (
          <p aria-hidden className="m-h t-bigword select-none text-center">
            {s.word}
          </p>
        )}
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" loading="lazy" className="m-float relative z-[1] mx-auto -mt-[clamp(48px,9vw,150px)] aspect-square w-[min(520px,78%)] rounded-full object-cover shadow-[0_40px_70px_-40px_rgba(60,20,60,0.5)]" />
        )}
        {(s.label || s.text) && (
          <div className="relative z-[2] mx-auto -mt-10 max-w-xs rounded-2xl bg-white/90 p-4 text-[#1A1A2E] shadow-[0_20px_40px_-24px_rgba(0,0,0,0.4)] backdrop-blur md:absolute md:bottom-[8%] md:left-[var(--g)] md:mt-0">
            {s.label && <p className="text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.1em]">{s.label}</p>}
            {s.text && <p className="mt-1 text-[length:calc(13px*var(--m-scale))] leading-snug text-black/60">{s.text}</p>}
            {s.buttonLabel && (
              <MLink to={s.buttonLink || "/catalog"} className="mt-3 inline-flex items-center gap-1.5 text-[length:calc(12.5px*var(--m-scale))] font-semibold underline underline-offset-4">
                {s.buttonLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </MLink>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}

// tag colours for the moving rows: [background, text]
const TAG_COLOURS: [string, string][] = [
  ["#C75B39", "#FFF5EC"],
  ["#5A2A1C", "#FFF5EC"],
  ["#FBD3DA", "#5A2A1C"],
  ["#F4A21C", "#3B1A12"],
  ["#D92B3A", "#FFFFFF"],
  ["#F28A96", "#FFFFFF"],
  ["#C48A52", "#FFFFFF"],
  ["#FCE8D6", "#5A2A1C"],
];

/** Two moving rows of colourful tags, running in opposite directions. */
function TagCloud({ s }: { s: Record<string, string> }) {
  const tags = (s.text || "")
    .split("·")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!tags.length) return null;
  const row = (offset: number) => (
    <div className="flex shrink-0 gap-2 pr-2">
      {tags.map((t, i) => {
        const [bg, fg] = TAG_COLOURS[(i + offset) % TAG_COLOURS.length];
        return (
          <span key={i} className="m-h whitespace-nowrap rounded-full px-4 py-2 text-[length:calc(13px*var(--m-scale))]" style={{ background: bg, color: fg }}>
            {t}
          </span>
        );
      })}
    </div>
  );
  return (
    <section className="space-y-2 overflow-hidden py-4" aria-label={tags.join(", ")}>
      {[0, 3].map((offset, r) => (
        <div key={r} className={cn("m-marquee flex w-max", r === 1 && "[animation-direction:reverse]")} aria-hidden>
          {row(offset)}
          {row(offset)}
          {row(offset)}
        </div>
      ))}
    </section>
  );
}

/** Three colour cards with a benefit each, mixed with four photos in a grid. */
function BentoBenefits({ s }: { s: Record<string, string> }) {
  const card = (n: number, bg: string, fg: string, className?: string) =>
    s[`b${n}Title`] ? (
      <div className={cn("m-card flex flex-col items-center justify-center p-6 text-center", className)} style={{ background: bg, color: fg }}>
        <p className="m-h text-[length:calc(clamp(18px,1.7vw,24px)*var(--m-scale))] leading-tight">{s[`b${n}Title`]}</p>
        {s[`b${n}Text`] && <p className="mt-2 max-w-[18rem] text-[length:calc(12.5px*var(--m-scale))] leading-relaxed opacity-85">{s[`b${n}Text`]}</p>}
      </div>
    ) : null;
  const photo = (n: number, className?: string) =>
    s[`p${n}Image`] ? (
      <div className={cn("m-card relative min-h-[180px] overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s[`p${n}Image`]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.05]" />
      </div>
    ) : null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="mb-[clamp(24px,3.4vw,48px)] text-center">
          {s.eyebrow && <span className="m-line inline-block rounded-full border px-3 py-1 text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.12em]">{s.eyebrow}</span>}
          <h2 className="m-h t-title mt-4">
            <Lines text={s.heading} />
          </h2>
        </div>
        <div className="m-stagger grid auto-rows-[minmax(170px,auto)] grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3 md:auto-rows-[minmax(190px,auto)]">
          {card(1, "#6B2E1F", "#FFF1E6")}
          {card(2, "#F4A21C", "#3B1A12")}
          {photo(1, "row-span-2")}
          {photo(2, "row-span-2")}
          {photo(3)}
          {card(3, "#EF6F7C", "#FFFFFF")}
          {photo(4, "col-span-2 md:col-span-1")}
        </div>
      </Container>
    </section>
  );
}

/** A heading with a line of text beside it, then a sliding row of square category tiles. */
function CategoryStrip({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = activeCategories(store).filter((c) => !c.parentId);
  if (!cats.length) return null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        <div className="mb-6 grid gap-3 md:grid-cols-2 md:items-end">
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted max-w-sm text-[length:calc(13px*var(--m-scale))] leading-relaxed md:justify-self-end">{s.text}</p>}
        </div>
        <div className="m-stagger m-scroll -mx-[var(--g)] flex gap-2.5 overflow-x-auto px-[var(--g)] scroll-px-[var(--g)] snap-x">
          {cats.map((c) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group flex w-[clamp(120px,11vw,160px)] shrink-0 snap-start flex-col rounded-[var(--m-card)] bg-[var(--m-panel)] p-2.5 transition hover:-translate-y-1">
              <span className="relative aspect-square overflow-hidden rounded-[calc(var(--m-card)-6px)]">
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                )}
              </span>
              <span className="mt-2.5 truncate px-0.5 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.06em]">{c.name}</span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Product row "beside": the heading block on the left, four products beside it. */
function BesideRow({ s, products }: { s: Record<string, string>; products: ProductData[] }) {
  return (
    <section className="py-[clamp(32px,5vw,80px)]">
      <Container className="grid gap-6 lg:grid-cols-[minmax(220px,0.8fr)_3fr] lg:items-center lg:gap-10">
        <div>
          {s.tag && (
            <p className="flex items-center gap-2 text-[length:calc(12px*var(--m-scale))] font-semibold">
              <span className="h-0.5 w-6 bg-[var(--m-accent)]" />
              {s.tag}
            </p>
          )}
          <h2 className="m-h t-title mt-3">
            <Lines text={s.heading} />
          </h2>
          {s.subheading && <p className="m-muted mt-3 max-w-[16rem] text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--m-text)] px-5 text-[length:calc(12px*var(--m-scale))] font-semibold text-[var(--m-bg)] transition-[gap] hover:gap-3">
              {s.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
        <div className="m-stagger grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Theme 21's hero: a wide photo with the heading at the bottom left and a "Shop the look" button at the bottom right. */
function LookHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="relative flex min-h-[clamp(420px,46vw,680px)] items-end overflow-hidden bg-[#c9d6dc] text-white">
      {s.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_30%]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      <div className="relative flex w-full flex-col gap-5 px-[var(--g)] pb-[clamp(20px,3vw,44px)] sm:flex-row sm:items-end sm:justify-between">
        <div className="m-rise">
          <h1 className="m-h m-display t-title">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="mt-2 text-[length:calc(13px*var(--m-scale))] text-white/90">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-4 inline-block border-b border-white pb-0.5 text-[length:calc(12px*var(--m-scale))] font-medium hover:opacity-80">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
        {s.secondButtonLabel && (
          <MLink to={s.secondButtonLink || "/catalog"} className="m-rise inline-flex h-9 min-h-0 items-center gap-1.5 self-start rounded-full bg-white px-4 text-[length:calc(12px*var(--m-scale))] font-medium text-[#121212] transition hover:bg-white/85 sm:self-auto">
            <Plus className="h-3.5 w-3.5" />
            {s.secondButtonLabel}
          </MLink>
        )}
      </div>
    </section>
  );
}

/** Theme 23's hero: a serif heading on white beside a large photo that fills the right side. */
function InsetHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="grid md:grid-cols-[0.75fr_1.6fr]">
      <div className="m-panel flex flex-col justify-center px-[var(--g)] py-[clamp(36px,5vw,80px)] md:pr-[clamp(24px,3vw,48px)]">
        <div className="m-rise">
          <h1 className="m-h m-display t-title">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="m-muted mt-5 max-w-xs text-[length:calc(12.5px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-7 inline-block min-w-[6rem] border-b border-current pb-1 text-[length:calc(11.5px*var(--m-scale))] tracking-[0.04em] hover:opacity-70">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </div>
      <div className="relative min-h-[clamp(340px,40vw,620px)] overflow-hidden bg-[var(--m-panel)]">
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
    </section>
  );
}

/** Two to four tall photos side by side across the full width, each with a title and a link. */
function EdgeTiles({ s }: { s: Record<string, string> }) {
  const tiles = [1, 2, 3, 4]
    .map((n) => ({ image: s[`t${n}Image`], title: s[`t${n}Title`], button: s[`t${n}Button`], link: s[`t${n}Link`] }))
    .filter((t) => t.image);
  if (!tiles.length) return null;
  return (
    <section className="py-1">
      <div className={cn("m-stagger grid gap-1", tiles.length === 4 ? "grid-cols-2 lg:grid-cols-4" : tiles.length === 3 ? "sm:grid-cols-3" : "grid-cols-2")}>
        {tiles.map((t, i) => (
          <MLink
            key={i}
            to={t.link || "/catalog"}
            className={cn("group relative block overflow-hidden bg-[var(--m-panel)] text-white", tiles.length === 3 ? "aspect-[4/5] sm:aspect-[3/4.2]" : "aspect-[3/4]")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-[1.2s] group-hover:scale-[1.05]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-[clamp(12px,1.6vw,22px)]">
              {t.title && <p className="m-h text-[length:calc(clamp(13px,1.2vw,17px)*var(--m-scale))]">{t.title}</p>}
              {t.button && <p className="mt-1.5 inline-block border-b border-white/80 text-[length:calc(11.5px*var(--m-scale))] font-medium">{t.button}</p>}
            </div>
          </MLink>
        ))}
      </div>
    </section>
  );
}

/** Buyers type a few words and see them on the piece, then send them to the shop on WhatsApp. */
function Engraving({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const [words, setWords] = React.useState("");
  const shown = words.trim() || s.placeholder || "A + R";
  const wa = whatsappLink(store.contactPhone, `Hi ${store.name}! I'd like an engraving that says: "${shown}"`);
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className="m-panel relative aspect-square overflow-hidden">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <p
              aria-live="polite"
              className="t-engrave pointer-events-none absolute left-1/2 top-1/2 max-w-[80%] -translate-x-1/2 -translate-y-1/2 truncate rounded-md bg-white/55 px-4 py-1.5 text-center backdrop-blur-[2px]"
            >
              {shown}
            </p>
          </div>
          <div>
            <h2 className="m-h t-title">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="m-muted mt-4 max-w-md text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.text}</p>}
            <label className="mt-7 block max-w-md">
              <span className="m-cap text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.12em]">Your words</span>
              <input value={words} onChange={(e) => setWords(e.target.value.slice(0, 18))} placeholder={s.placeholder || "A + R"} className="m-field mt-2" maxLength={18} />
              <span className="m-faint mt-1.5 block text-[length:calc(11.5px*var(--m-scale))]">{18 - words.length} characters left</span>
            </label>
            {s.buttonLabel && (
              <a
                href={wa || undefined}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!wa) e.preventDefault();
                }}
                aria-disabled={!wa}
                className="m-btn mt-6 min-h-11 px-7 aria-disabled:opacity-40"
              >
                {s.buttonLabel}
              </a>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Big lines of type with a product photo set among them and two small notes. */
function TypeCollage({ s }: { s: Record<string, string> }) {
  return (
    <section className="overflow-hidden py-[clamp(48px,7vw,120px)]">
      <Container className="relative">
        <div className="grid gap-6 md:grid-cols-[1fr_3fr_1fr] md:items-center">
          {s.noteLeft ? <p className="m-muted max-w-[14rem] text-[length:calc(11.5px*var(--m-scale))] leading-relaxed md:self-start">{s.noteLeft}</p> : <span />}
          <div className="relative text-center text-[var(--m-accent)]">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="m-float mx-auto mb-[-0.6em] aspect-square w-[clamp(140px,18vw,260px)] rounded-full object-cover" />
            )}
            {s.line1 && (
              <p className="m-h t-collage relative">
                <Lines text={s.line1} />
              </p>
            )}
            {s.line2 && (
              <p className="m-h t-collage relative">
                <Lines text={s.line2} />
              </p>
            )}
            {s.line3 && (
              <p className="m-h t-collage relative">
                <Lines text={s.line3} />
              </p>
            )}
          </div>
          {s.noteRight ? <p className="m-muted max-w-[14rem] text-[length:calc(11.5px*var(--m-scale))] leading-relaxed md:self-end md:justify-self-end">{s.noteRight}</p> : <span />}
        </div>
      </Container>
    </section>
  );
}

/** A heading, a few words and a button on the left, products sliding on the right. */
function CollectionSlider({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const from = productsFromSource(store, s.source || "newest", 10);
  // a category that has gone falls back to the best sellers, so the section never sits empty
  const products = from.length ? from : productsFromSource(store, "bestsellers", 10);
  if (!products.length) return null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container className="grid gap-6 md:grid-cols-[1fr_2.3fr] md:gap-10">
        <div className="flex flex-col">
          <h2 className="m-h t-title text-[var(--m-accent)]">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-4 max-w-[16rem] text-[length:calc(12.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="m-line mt-6 inline-flex h-10 min-h-0 items-center gap-2 self-start border px-5 text-[length:calc(11px*var(--m-scale))] font-medium uppercase tracking-[0.08em] text-[var(--m-accent)] transition hover:bg-[var(--m-accent)] hover:text-[var(--m-accent-text)] md:mt-auto">
              {s.buttonLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </MLink>
          )}
        </div>
        {/* two big cards in view, the rest a swipe away */}
        <div className="m-stagger m-scroll -mx-[var(--g)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--g)] scroll-px-[var(--g)] md:mx-0 md:px-0 md:scroll-px-0 sm:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} className="w-[62%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-1rem)/2.3)]" />
          ))}
        </div>
      </Container>
    </section>
  );
}

/** A row of photo cards at different heights, each with a short title. */
function GuideRow({ s }: { s: Record<string, string> }) {
  const cards = [1, 2, 3, 4].map((n) => ({ image: s[`g${n}Image`], title: s[`g${n}Title`], link: s[`g${n}Link`] })).filter((c) => c.image);
  if (!cards.length) return null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        {s.heading && (
          <h2 className="m-h t-section mb-[clamp(20px,3vw,40px)] text-[var(--m-accent)]">
            <Lines text={s.heading} />
          </h2>
        )}
        <div className="m-stagger m-scroll -mx-[var(--g)] flex items-start gap-3 overflow-x-auto px-[var(--g)] scroll-px-[var(--g)] snap-x sm:gap-5">
          {cards.map((c, i) => (
            <MLink key={i} to={c.link || "/pages/about"} className={cn("group w-[72%] shrink-0 snap-start sm:w-[38%] lg:w-[31%]", i % 2 === 1 && "sm:mt-10")}>
              <span className={cn("relative block overflow-hidden bg-[var(--m-panel)]", i % 2 === 1 ? "aspect-[4/5]" : "aspect-[4/3]")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
              </span>
              {c.title && <span className="m-cap mt-3 block text-[length:calc(12px*var(--m-scale))] tracking-[0.08em]">{c.title}</span>}
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** A big photo card with a heading and a smaller photo card beside it. */
function DuoPromo({ s }: { s: Record<string, string> }) {
  const link = (to: string, label: string) => (
    <MLink to={to || "/catalog"} className="mt-4 inline-block min-w-[5rem] border-b border-current pb-1 text-[length:calc(11px*var(--m-scale))] tracking-[0.04em] hover:opacity-70">
      {label}
    </MLink>
  );
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container className="grid items-center gap-8 md:grid-cols-[2fr_1fr] md:gap-14">
        <div className="m-panel relative grid min-h-[clamp(300px,30vw,440px)] overflow-hidden sm:grid-cols-[1.3fr_1fr]">
          <div className="relative min-h-[240px]">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col justify-center p-[clamp(20px,3vw,40px)]">
            {s.eyebrow && <p className="text-[length:calc(10px*var(--m-scale))] font-semibold uppercase tracking-[0.14em]">{s.eyebrow}</p>}
            <h2 className="m-h t-section mt-3">
              <Lines text={s.heading} />
            </h2>
            {s.buttonLabel && link(s.buttonLink, s.buttonLabel)}
          </div>
        </div>
        {s.smallImage && (
          <div className="text-center">
            <div className="m-panel relative mx-auto aspect-[4/3.4] w-full max-w-[340px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.smallImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.04]" />
            </div>
            {s.smallTitle && <p className="m-h mt-4 text-[length:calc(18px*var(--m-scale))]">{s.smallTitle}</p>}
            {s.smallButton && link(s.smallLink, s.smallButton)}
          </div>
        )}
      </Container>
    </section>
  );
}

/** Two photos at different heights, each with a small label, a title and a link. */
function OffsetPair({ s }: { s: Record<string, string> }) {
  const items = (["a", "b"] as const)
    .map((k) => ({ image: s[`${k}Image`], eyebrow: s[`${k}Eyebrow`], title: s[`${k}Title`], button: s[`${k}Button`], link: s[`${k}Link`] }))
    .filter((x) => x.image);
  if (!items.length) return null;
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container className="m-stagger grid gap-10 sm:grid-cols-2 sm:gap-8">
        {items.map((x, i) => (
          <div key={i} className={cn(i === 1 && "sm:mt-16")}>
            <MLink to={x.link || "/catalog"} className="group relative block overflow-hidden bg-[var(--m-panel)]" aria-label={x.title}>
              <span className={cn("block", i === 0 ? "aspect-[4/3]" : "aspect-[5/3.3]")} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            </MLink>
            <div className={cn("mt-4 flex items-end justify-between gap-4", i === 1 && "flex-col items-center text-center")}>
              <div>
                {x.eyebrow && <p className="text-[length:calc(9.5px*var(--m-scale))] font-semibold uppercase tracking-[0.14em]">{x.eyebrow}</p>}
                {x.title && <p className="m-h mt-1 text-[length:calc(clamp(16px,1.5vw,20px)*var(--m-scale))]">{x.title}</p>}
              </div>
              {x.button && (
                <MLink to={x.link || "/catalog"} className="shrink-0 border-b border-current pb-0.5 text-[length:calc(11px*var(--m-scale))] hover:opacity-70">
                  {x.button}
                </MLink>
              )}
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

/** Buyers pick a mood and see the products that match it. */
function ScentQuiz({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const options = (s.options || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const at = l.indexOf(":");
      return at > 0 ? { label: l.slice(0, at).trim(), term: l.slice(at + 1).trim().toLowerCase() } : { label: l, term: l.toLowerCase() };
    });
  const [pick, setPick] = React.useState(0);
  if (!options.length) return null;
  const current = options[Math.min(pick, options.length - 1)];
  // whole words only ("fresh" or "woody" for "wood", but not "freshwater")
  const safe = current.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const word = new RegExp(`\\b${safe}(y|s)?\\b`, "i");
  const matches = visibleProducts(store)
    .filter((p) => word.test(`${p.title} ${p.description}`))
    .slice(0, 4);
  return (
    <section className="m-panel py-[clamp(48px,7vw,110px)]">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-3 text-[length:calc(13.5px*var(--m-scale))]">{s.text}</p>}
          <div className="mt-7 flex flex-wrap justify-center gap-2" role="tablist">
            {options.map((o, i) => (
              <button
                key={o.label}
                type="button"
                role="tab"
                aria-selected={i === pick}
                onClick={() => setPick(i)}
                className={cn(
                  "h-10 min-h-0 border px-5 text-[length:calc(12.5px*var(--m-scale))] transition-colors",
                  i === pick ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "border-[color-mix(in_srgb,var(--m-text)_25%,transparent)] bg-[var(--m-bg)] hover:border-[var(--m-text)]"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-[clamp(28px,4vw,52px)]">
          {matches.length ? (
            <div key={current.term} className="m-page grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-4">
              {matches.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="m-muted text-center text-[length:calc(13.5px*var(--m-scale))]">Nothing matches this one yet. Try another choice.</p>
          )}
          {s.buttonLabel && (
            <div className="mt-8 text-center">
              <MLink to={`/search?q=${encodeURIComponent(current.term)}`} className="inline-block border-b border-current pb-1 text-[length:calc(12px*var(--m-scale))] hover:opacity-70">
                {s.buttonLabel}: {current.label.toLowerCase()}
              </MLink>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 24's hero: rounded slides with the next ones peeking in at the sides; arrows and dots move between them. */
function PeekHero({ s }: { s: Record<string, string> }) {
  const slides = [
    { image: s.image, title: s.heading, text: s.subheading, button: s.buttonLabel, link: s.buttonLink },
    { image: s.tile1Image, title: s.tile1Label, text: "", button: s.buttonLabel, link: s.tile1Link },
    { image: s.tile2Image, title: s.tile2Label, text: "", button: s.buttonLabel, link: s.tile2Link },
  ].filter((x) => x.image);
  const [at, setAt] = React.useState(0);
  const n = slides.length;
  React.useEffect(() => {
    if (n < 2) return;
    const t = window.setInterval(() => setAt((i) => (i + 1) % n), 6000);
    return () => window.clearInterval(t);
  }, [n]);
  if (!n) return null;
  const go = (d: number) => setAt((i) => (i + d + n) % n);
  return (
    <section className="t-peek-wrap overflow-hidden pt-[clamp(8px,1.2vw,16px)]">
      <div className="relative">
        <div className="flex transition-transform duration-700 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]" style={{ transform: `translateX(calc(${-at} * (var(--peek-w) + var(--peek-gap)) + (100% - var(--peek-w)) / 2))` }}>
          {slides.map((x, i) => (
            <div key={i} className="t-peek relative shrink-0 overflow-hidden rounded-[clamp(16px,1.8vw,26px)] bg-[var(--m-panel)]" style={{ marginRight: "var(--peek-gap)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/10 to-transparent" />
              <div className={cn("relative flex flex-col items-center px-6 pt-[clamp(28px,4vw,56px)] text-center text-[#111] transition-opacity duration-500", i === at ? "opacity-100" : "opacity-0")}>
                {x.title && (
                  <h2 className="m-h m-display t-hero">
                    <Lines text={x.title} />
                  </h2>
                )}
                {x.text && <p className="mt-3 text-[length:calc(14px*var(--m-scale))]">{x.text}</p>}
                {x.button && (
                  <MLink to={x.link || "/catalog"} className="mt-5 inline-flex h-10 min-h-0 items-center gap-1.5 rounded-full border border-[#111] bg-white/70 px-5 text-[length:calc(12.5px*var(--m-scale))] font-medium backdrop-blur transition hover:bg-[#111] hover:text-white">
                    {x.button}
                    <ChevronRight className="h-4 w-4" />
                  </MLink>
                )}
              </div>
            </div>
          ))}
        </div>
        {n > 1 && (
          <>
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => go(d)}
                aria-label={d < 0 ? "Previous slide" : "Next slide"}
                className={cn("absolute top-1/2 flex h-10 min-h-0 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111] shadow-md transition hover:scale-105", d < 0 ? "left-[max(10px,calc((100%-var(--peek-w))/2-20px))]" : "right-[max(10px,calc((100%-var(--peek-w))/2-20px))]")}
              >
                {d < 0 ? <ChevronRight className="h-4 w-4 rotate-180" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
            <div className="mt-3 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => setAt(i)} aria-label={`Slide ${i + 1}`} className={cn("h-1.5 min-h-0 rounded-full transition-all", i === at ? "w-6 bg-[var(--m-text)]" : "w-1.5 bg-[color-mix(in_srgb,var(--m-text)_25%,transparent)]")} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Theme 25's hero: a full food photo with a big centred heading and a round sticker. */
function FeastHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="relative flex min-h-[clamp(460px,48vw,720px)] items-center justify-center overflow-hidden bg-[#2f4d36] text-white">
      {s.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/40" />
      <div className="m-rise relative px-[var(--g)] text-center">
        <h1 className="m-h m-display t-feast drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
          <Lines text={s.heading} />
        </h1>
        {s.subheading && <p className="mx-auto mt-4 max-w-md text-[length:calc(15px*var(--m-scale))] text-white/90">{s.subheading}</p>}
        {s.buttonLabel && (
          <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-7 min-h-12 px-9">
            {s.buttonLabel}
          </MLink>
        )}
      </div>
      {s.tag && (
        <span className="m-burst t-wobble absolute bottom-[12%] right-[8%] flex h-[clamp(84px,9vw,128px)] w-[clamp(84px,9vw,128px)] items-center justify-center px-3 text-center text-[length:calc(12px*var(--m-scale))] font-bold leading-tight !bg-white text-[var(--m-accent)]">
          {s.tag}
        </span>
      )}
    </section>
  );
}

/** Theme 26's hero: the shop's product photos fanned out in tilted cards; arrows turn the fan. */
function FanHero({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const products = productsFromSource(store, "bestsellers", 7).filter((p) => p.images?.[0]);
  const cards = products.length >= 3 ? products.map((p) => ({ image: p.images![0], to: `/products/${p.slug || p.id}`, title: p.title })) : [{ image: s.image, to: s.buttonLink || "/catalog", title: s.heading }];
  const [at, setAt] = React.useState(0);
  const n = cards.length;
  const go = (d: number) => setAt((i) => (i + d + n) % n);
  return (
    <section className="overflow-hidden py-[clamp(28px,4vw,64px)]">
      <div className="relative mx-auto flex h-[clamp(300px,34vw,480px)] max-w-[1400px] items-center justify-center">
        {cards.map((c, i) => {
          // offset from the card in the middle, wrapping round
          let off = i - at;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const far = Math.abs(off) > 2;
          return (
            <MLink
              key={i}
              to={c.to}
              aria-label={c.title}
              tabIndex={off === 0 ? 0 : -1}
              className="absolute block aspect-[3/4] w-[clamp(140px,16vw,230px)] overflow-hidden rounded-[22px] bg-[#1a1414] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] transition-all duration-700 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]"
              style={{
                transform: `translateX(${off * 108}%) translateY(${Math.abs(off) * 6}%) rotate(${off * 5}deg) scale(${off === 0 ? 1.08 : 1 - Math.abs(off) * 0.06})`,
                zIndex: 10 - Math.abs(off),
                opacity: far ? 0 : 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              {off === 0 && s.buttonLabel && <span className="absolute left-3 top-3 rounded-full bg-[var(--m-accent)] px-2.5 py-1 text-[length:calc(10.5px*var(--m-scale))] text-[var(--m-accent-text)]">{s.buttonLabel}</span>}
            </MLink>
          );
        })}
      </div>
      {n > 1 && (
        <div className="mt-[clamp(20px,3vw,40px)] flex justify-center gap-2">
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => go(d)}
              aria-label={d < 0 ? "Previous" : "Next"}
              className={cn("flex h-9 min-h-0 w-12 items-center justify-center rounded-full border transition", d > 0 ? "border-[var(--m-text)]" : "border-[color-mix(in_srgb,var(--m-text)_35%,transparent)] opacity-70 hover:opacity-100")}
            >
              <ArrowRight className={cn("h-4 w-4", d < 0 && "rotate-180")} />
            </button>
          ))}
        </div>
      )}
      <h1 className="sr-only">{s.heading}</h1>
    </section>
  );
}

/** Moving text in a strip (used under Theme 27's hero and in its mission band). */
function Ticker({ text, className }: { text: string; className?: string }) {
  const parts = text
    .split("·")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  const run = (
    <div className="flex shrink-0 items-center">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center">
          <span className="whitespace-nowrap px-5">{p}</span>
          <span aria-hidden className="opacity-60">
            ✿
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn("overflow-hidden py-3 text-[length:calc(12px*var(--m-scale))]", className)} aria-label={parts.join(", ")}>
      <div className="m-marquee flex w-max" aria-hidden>
        {run}
        {run}
        {run}
        {run}
      </div>
    </div>
  );
}

/** Theme 27's hero: a full photo with the heading at the bottom left and moving text under it. */
function MakerHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="relative bg-[#2b2421] text-white">
      <div className="relative flex min-h-[clamp(480px,50vw,760px)] items-end overflow-hidden">
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10" />
        <div className="m-rise relative w-full px-[var(--g)] pb-[clamp(28px,4vw,56px)] pt-[calc(var(--hh)+40px)]">
          {s.tag && <p className="text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] text-white/85">{s.tag}</p>}
          <h1 className="m-h m-display t-hero mt-3 max-w-4xl">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="mt-3 text-[length:calc(14px*var(--m-scale))] text-white/85">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-6 inline-flex h-11 min-h-0 min-w-[11rem] items-center justify-center rounded-full bg-[var(--m-accent-text)] px-7 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.08em] text-[var(--m-accent)] transition hover:opacity-90">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </div>
      {s.ticker && <Ticker text={s.ticker} className="bg-[var(--m-accent)] text-[var(--m-accent-text)]" />}
    </section>
  );
}

/** Time left until the next daily end time ("23:59"), as days, hours, minutes and seconds. */
function useCountdown(endsAt: string) {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  if (now === null) return null;
  const [h, m] = (endsAt || "23:59").split(":").map((x) => Number(x) || 0);
  const end = new Date(now);
  end.setHours(Math.min(23, h), Math.min(59, m), 59, 0);
  if (end.getTime() <= now) end.setDate(end.getDate() + 1);
  const left = Math.max(0, Math.floor((end.getTime() - now) / 1000));
  return { d: Math.floor(left / 86400), h: Math.floor((left % 86400) / 3600), m: Math.floor((left % 3600) / 60), s: left % 60 };
}

/** A row of deals with a clock counting down to the end of the day. */
function CountdownDeals({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const from = productsFromSource(store, s.source || "sale", 12);
  const products = from.length ? from : productsFromSource(store, "bestsellers", 12);
  const left = useCountdown(s.endsAt);
  if (!products.length) return null;
  const two = (v: number) => String(v).padStart(2, "0");
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        <div className="mb-[clamp(18px,2.4vw,32px)] flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#F05A4A]/40 bg-[#FDECEA] px-3.5 py-1.5 text-[length:calc(12px*var(--m-scale))] font-semibold tabular-nums text-[#D6392B]" aria-live="off">
            <Clock className="h-3.5 w-3.5" />
            {left ? `${left.d}D : ${two(left.h)}H : ${two(left.m)}M : ${two(left.s)}S` : "Ends tonight"}
          </span>
        </div>
        <ProductSlider products={products} />
      </Container>
    </section>
  );
}

/** Two big soft cards, each with a product photo, a title, a line and a link. */
function SpotlightCards({ s }: { s: Record<string, string> }) {
  const cards = [1, 2].map((n) => ({ image: s[`c${n}Image`], title: s[`c${n}Title`], text: s[`c${n}Text`], button: s[`c${n}Button`], link: s[`c${n}Link`] })).filter((c) => c.image);
  if (!cards.length) return null;
  return (
    <section className="py-[clamp(24px,4vw,56px)]">
      <Container className={cn("m-stagger grid gap-3 sm:gap-4", cards.length > 1 && "sm:grid-cols-2")}>
        {cards.map((c, i) => (
          <MLink key={i} to={c.link || "/catalog"} className="m-panel group relative block aspect-[4/3.6] overflow-hidden rounded-[clamp(14px,1.6vw,22px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-[1.2s] group-hover:scale-[1.05]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-[clamp(16px,2.4vw,32px)] text-white">
              {c.title && <p className="m-h text-[length:calc(clamp(20px,2.2vw,30px)*var(--m-scale))]">{c.title}</p>}
              {c.text && <p className="mt-1 text-[length:calc(12.5px*var(--m-scale))] text-white/85">{c.text}</p>}
              {c.button && (
                <span className="mt-3 inline-flex items-center gap-1 border-b border-white/80 text-[length:calc(12px*var(--m-scale))] font-medium">
                  {c.button}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              )}
            </div>
          </MLink>
        ))}
      </Container>
    </section>
  );
}

/** The shop's reviews one at a time on a dark band, with a photo beside them; a quote shows until there are reviews. */
function ReviewSpotlight({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const list = canUseReviews(store.planId) ? (store.reviews || []).filter((r) => r.status === "approved" && r.comment) : [];
  const items = list.length
    ? list.slice(0, 6).map((r) => ({ text: r.comment!, name: r.customerName, rating: r.rating, product: store.products.find((p) => p.id === r.productId) }))
    : s.text
      ? [{ text: s.text, name: s.name, rating: 5, product: undefined }]
      : [];
  const [at, setAt] = React.useState(0);
  if (!items.length) return null;
  const cur = items[at % items.length];
  const photo = cur.product?.images?.[0] || s.image;
  return (
    <section className="py-[clamp(24px,4vw,56px)]">
      <Container>
        <div className="grid items-center gap-6 overflow-hidden rounded-[clamp(16px,1.8vw,26px)] bg-[#1d1f24] p-[clamp(22px,4vw,56px)] text-white md:grid-cols-[1.6fr_1fr]">
          <div>
            {s.label && <p className="text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.12em] text-white/60">{s.label}</p>}
            <span aria-hidden className="mt-3 block text-[44px] leading-none text-white/30">“</span>
            <p key={at} className="m-page m-h -mt-3 text-[length:calc(clamp(18px,2vw,26px)*var(--m-scale))] leading-snug">
              {cur.text}
            </p>
            <div className="mt-6 flex items-center gap-3 text-[length:calc(13px*var(--m-scale))]">
              <Stars value={cur.rating} className="text-[#F5C451] [&_svg]:h-3.5 [&_svg]:w-3.5" />
              <span className="font-semibold">{cur.name}</span>
              {cur.product && <span className="truncate text-white/55">· {cur.product.title}</span>}
            </div>
            {items.length > 1 && (
              <div className="mt-6 flex gap-2">
                {[-1, 1].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAt((i) => (i + d + items.length) % items.length)}
                    aria-label={d < 0 ? "Previous review" : "Next review"}
                    className="flex h-9 min-h-0 w-9 items-center justify-center rounded-full border border-white/30 transition hover:bg-white hover:text-[#1d1f24]"
                  >
                    <ChevronRight className={cn("h-4 w-4", d < 0 && "rotate-180")} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {photo && (
            <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Categories as tabs, each listing its products like a menu, with dotted lines to the price and an add button. */
function MenuBoard({ s }: { s: Record<string, string> }) {
  const { store, addToBag, href } = useSite();
  const router = useRouter();
  const cats = activeCategories(store).filter((c) => !c.parentId && productsInCategory(store, c).length);
  const [tab, setTab] = React.useState("");
  const current = cats.find((c) => c.slug === tab) || cats[0];
  if (!current) return null;
  const items = productsInCategory(store, current).slice(0, 12);
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container className="max-w-4xl">
        <div className="text-center">
          <h2 className="m-h t-section text-[var(--m-accent)]">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-3 text-[length:calc(14px*var(--m-scale))]">{s.text}</p>}
        </div>
        <div className="m-scroll -mx-[var(--g)] mt-7 flex justify-start gap-2 overflow-x-auto px-[var(--g)] sm:justify-center" role="tablist">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === current.id}
              onClick={() => setTab(c.slug)}
              className={cn(
                "h-10 min-h-0 shrink-0 rounded-full border-2 px-5 text-[length:calc(13px*var(--m-scale))] font-semibold transition-colors",
                c.id === current.id ? "border-[var(--m-panel)] bg-[var(--m-panel)] text-white" : "border-[color-mix(in_srgb,var(--m-text)_20%,transparent)] hover:border-[var(--m-panel)]"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <ul key={current.id} className="m-page mt-8 grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
          {items.map((p) => {
            const needsChoice = (p.options || []).some((o) => o.options?.length);
            const to = `/products/${p.slug || p.id}`;
            return (
              <li key={p.id} className="flex items-center gap-3 border-b border-dashed border-[color-mix(in_srgb,var(--m-text)_18%,transparent)] py-3">
                <MLink to={to} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--m-panel)]" aria-label={p.title}>
                  {p.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                </MLink>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <MLink to={to} className="m-h min-h-0 min-w-0 truncate text-[length:calc(15px*var(--m-scale))]">
                      {p.title}
                    </MLink>
                    <span aria-hidden className="mb-1 min-w-4 flex-1 border-b-2 border-dotted border-[color-mix(in_srgb,var(--m-text)_25%,transparent)]" />
                    <span className="shrink-0 text-[length:calc(14px*var(--m-scale))] font-bold tabular-nums">{rupees(p.price)}</span>
                  </div>
                  {p.description && <p className="m-muted truncate text-[length:calc(12px*var(--m-scale))]">{p.description}</p>}
                </div>
                {p.stock > 0 && (
                  <button
                    type="button"
                    onClick={() => (needsChoice ? router.push(href(to)) : addToBag(p))}
                    aria-label={needsChoice ? `Choose options for ${p.title}` : `Add ${p.title} to bag`}
                    className="flex h-9 min-h-0 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--m-accent)] text-[var(--m-accent-text)] transition hover:scale-110"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {s.note && <p className="m-faint mt-6 text-center text-[length:calc(12px*var(--m-scale))]">{s.note}</p>}
      </Container>
    </section>
  );
}

/** Three photos set at slight angles, each with a sticker. */
function TiltGallery({ s }: { s: Record<string, string> }) {
  const photos = [1, 2, 3].map((n) => ({ image: s[`p${n}Image`], title: s[`p${n}Title`] })).filter((p) => p.image);
  if (!photos.length) return null;
  const tilt = ["-rotate-[3deg]", "rotate-[2deg] sm:translate-y-6", "-rotate-[1.5deg]"];
  const tint = ["#7EC8E3", "#FFFFFF", "#F6B8C8"];
  return (
    <section className="overflow-hidden py-[clamp(40px,6vw,96px)]">
      <Container>
        {s.heading && (
          <h2 className="m-h t-section mb-[clamp(24px,3.4vw,48px)] text-center text-[var(--m-accent)]">
            <Lines text={s.heading} />
          </h2>
        )}
        <div className="m-stagger grid gap-6 sm:grid-cols-3 sm:gap-5">
          {photos.map((p, i) => (
            <figure key={i} className={cn("relative rounded-[22px] p-2.5 shadow-[0_24px_40px_-26px_rgba(0,0,0,0.5)] transition duration-500 hover:rotate-0 hover:scale-[1.02]", tilt[i % 3])} style={{ background: tint[i % 3] }}>
              <div className="relative aspect-[4/3.2] overflow-hidden rounded-[16px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              {p.title && <figcaption className="m-burst absolute -left-2 -top-4 rotate-[-10deg] px-4 py-2.5 text-[length:calc(11px*var(--m-scale))] font-bold !bg-[var(--m-accent)] text-white">{p.title}</figcaption>}
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Buyers pick one product from each of three lists and add all three to the bag together. */
function ComboBuilder({ s }: { s: Record<string, string> }) {
  const { store, addToBag } = useSite();
  const steps = [1, 2, 3]
    .map((n) => {
      const ready = (list: ProductData[]) => list.filter((p) => p.stock > 0 && !(p.options || []).some((o) => o.options?.length));
      const from = ready(productsFromSource(store, s[`c${n}Source`] || "bestsellers", 6));
      // a category the shop doesn't have falls back to other products, so the picker still works
      return { label: s[`c${n}Label`] || `Step ${n}`, items: from.length ? from : ready(productsFromSource(store, n === 2 ? "newest" : "bestsellers", 6 * n)).slice(6 * (n - 1), 6 * n) };
    })
    .filter((x) => x.items.length);
  const [picked, setPicked] = React.useState<Record<number, string>>({});
  if (steps.length < 2) return null;
  const choice = (i: number) => steps[i].items.find((p) => p.id === picked[i]) || steps[i].items[0];
  const total = steps.reduce((n, _, i) => n + choice(i).price, 0);
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container>
        <div className="rounded-[clamp(22px,3vw,40px)] bg-[var(--m-panel)] p-[clamp(20px,4vw,56px)] text-white">
          <div className="text-center">
            <h2 className="m-h t-section">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="mt-3 text-[length:calc(14px*var(--m-scale))] text-white/85">{s.text}</p>}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {steps.map((st, i) => (
              // fieldsets grow to fit their content unless told otherwise, which pushed the page sideways
              <fieldset key={i} className="min-w-0">
                <legend className="m-h mb-3 text-[length:calc(15px*var(--m-scale))]">{st.label}</legend>
                <div className="m-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible">
                  {st.items.map((p) => {
                    const on = choice(i).id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPicked((x) => ({ ...x, [i]: p.id }))}
                        className={cn("w-[96px] min-h-0 shrink-0 rounded-2xl p-1.5 text-left transition lg:w-auto", on ? "bg-white text-[var(--m-text)] shadow-lg" : "bg-white/10 hover:bg-white/20")}
                      >
                        <span className="relative block aspect-square overflow-hidden rounded-xl bg-black/10">
                          {p.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                          )}
                        </span>
                        <span className="mt-1.5 block truncate px-0.5 text-[length:calc(11.5px*var(--m-scale))] font-semibold">{p.title}</span>
                        <span className="block px-0.5 text-[length:calc(11px*var(--m-scale))] opacity-75 tabular-nums">{rupees(p.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-black/15 p-4 sm:flex-row">
            <p className="text-center text-[length:calc(13.5px*var(--m-scale))] sm:text-left">
              {steps.map((_, i) => choice(i).title).join(" + ")}
              <span className="m-h ml-2 text-[length:calc(18px*var(--m-scale))] tabular-nums">{rupees(total)}</span>
            </p>
            <button
              type="button"
              onClick={() => steps.forEach((_, i) => addToBag(choice(i)))}
              className="m-btn min-h-11 shrink-0 px-7"
            >
              <ShoppingBag className="h-4 w-4" />
              {s.buttonLabel || "Add to bag"}
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A heading on the left, one product photo in the middle and a word on the right. */
function Stage({ s }: { s: Record<string, string> }) {
  return (
    <section className="overflow-hidden py-[clamp(48px,7vw,120px)]">
      <Container className="grid items-center gap-6 md:grid-cols-[1fr_1.4fr_1fr]">
        <div>
          <h2 className="m-h t-title text-[#D9B26F]">
            <Lines text={s.heading} />
          </h2>
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-4 inline-block border-b border-current text-[length:calc(12px*var(--m-scale))] hover:opacity-70">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt="" loading="lazy" className="m-float t-soft mx-auto aspect-square w-full max-w-[460px] object-cover" />
        )}
        {s.word && <p className="m-h text-center text-[length:calc(clamp(30px,3.6vw,52px)*var(--m-scale))] italic text-[#D9B26F] md:self-end md:text-right">{s.word}</p>}
      </Container>
    </section>
  );
}

/** A photo beside a coloured card with the shop's story. */
function StoryCard({ s }: { s: Record<string, string> }) {
  const paragraphs = (s.text || "").split(/\n{2,}/).filter((p) => p.trim());
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container className="grid gap-4 md:grid-cols-[1fr_2.6fr] md:gap-6">
        {s.image && (
          <div className="relative aspect-[4/4.4] overflow-hidden rounded-[22px] bg-[#1a1414] md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 hover:grayscale-0" />
          </div>
        )}
        <div className="rounded-[22px] bg-[var(--m-accent)] p-[clamp(22px,3.6vw,52px)] text-[var(--m-accent-text)]">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          <div className="mt-5 space-y-3 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed opacity-90">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/pages/about"} className="mt-6 inline-block border-b border-current pb-0.5 text-[length:calc(12.5px*var(--m-scale))] hover:opacity-75">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Four photos around a card with a collection name, a badge and a year. */
function CollectionCollage({ s }: { s: Record<string, string> }) {
  const photos = [1, 2, 3, 4].map((n) => s[`p${n}Image`]).filter(Boolean);
  const tile = (src: string | undefined, className: string) =>
    src ? (
      <div className={cn("relative overflow-hidden rounded-[18px] bg-[#1a1414]", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.05]" />
      </div>
    ) : null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container className="m-stagger grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
        {tile(photos[0], "row-span-2 aspect-[3/4] md:aspect-auto")}
        {tile(photos[1], "aspect-[4/3] md:aspect-auto")}
        <MLink to={s.buttonLink || "/catalog"} className="group relative flex min-h-[160px] min-w-0 flex-col justify-between rounded-[18px] border border-[color-mix(in_srgb,var(--m-text)_14%,transparent)] p-5 md:row-span-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="m-h t-section min-w-0 [overflow-wrap:anywhere]">
              <Lines text={s.heading} />
            </h2>
            {s.badge && <span className="shrink-0 rounded-full bg-[var(--m-accent)] px-3 py-1 text-[length:calc(12px*var(--m-scale))] text-[var(--m-accent-text)]">{s.badge}</span>}
          </div>
          <div className="flex items-end justify-between">
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            {s.year && <span className="m-h text-[length:calc(22px*var(--m-scale))]">{s.year}</span>}
          </div>
        </MLink>
        {tile(photos[2], "aspect-square md:aspect-auto md:row-span-2")}
        {tile(photos[3], "col-span-2 aspect-[16/7] md:col-span-2 md:aspect-auto")}
      </Container>
    </section>
  );
}

/** A coloured band with the shop's mission in big words, highlighted words and moving text under it. */
function MissionBand({ s }: { s: Record<string, string> }) {
  return (
    <section className="t-scallop relative mt-6 bg-[var(--m-accent)] text-[#F6EDE6]">
      <Container className="py-[clamp(40px,6vw,88px)] text-center">
        {s.eyebrow && <p className="text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] opacity-80">{s.eyebrow}</p>}
        <h2 className="m-h t-mission mx-auto mt-4 max-w-4xl">
          <Lines text={s.heading} />
        </h2>
      </Container>
      {s.ticker && <Ticker text={s.ticker} className="border-t border-white/15" />}
    </section>
  );
}

/** Three big numbers that count up from zero when they scroll into view. */
function Impact({ s }: { s: Record<string, string> }) {
  const stats = [1, 2, 3].map((n) => ({ value: s[`n${n}Value`] || "", label: s[`n${n}Label`] || "" })).filter((x) => x.value);
  const ref = React.useRef<HTMLDivElement>(null);
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return setT(1);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const k = Math.min(1, (now - start) / 1400);
          setT(1 - Math.pow(1 - k, 3));
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  // count the digits up, keep the rest ("₹", "L", "+", "%") as written
  const show = (v: string) => {
    const m = v.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!m) return v;
    const num = Number(m[2].replace(/,/g, ""));
    if (!Number.isFinite(num)) return v;
    const dec = (m[2].split(".")[1] || "").length;
    const cur = num * t;
    return `${m[1]}${dec ? cur.toFixed(dec) : Math.round(cur).toLocaleString("en-IN")}${m[3]}`;
  };
  if (!stats.length) return null;
  return (
    <section className="py-[clamp(48px,7vw,110px)]">
      <Container>
        <div className="mx-auto mb-[clamp(24px,3.4vw,48px)] max-w-xl text-center">
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-3 text-[length:calc(14px*var(--m-scale))]">{s.text}</p>}
        </div>
        <div ref={ref} className="grid gap-4 sm:grid-cols-3">
          {stats.map((x, i) => (
            <div key={i} className="m-panel rounded-[22px] px-6 py-8 text-center">
              <p className="m-h text-[length:calc(clamp(36px,4.4vw,64px)*var(--m-scale))] leading-none tabular-nums text-[var(--m-accent)]">{show(x.value)}</p>
              {x.label && <p className="mt-3 text-[length:calc(13px*var(--m-scale))]">{x.label}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Themes 28 and 30: full photo slides that fade into each other; arrows at the sides with dots ("carousel"), or numbers
 *  and arrows along the bottom ("numbered"). */
function SlidesHero({ s, numbered }: { s: Record<string, string>; numbered?: boolean }) {
  const slides = [
    { image: s.image, title: s.heading, text: s.subheading, link: s.buttonLink },
    { image: s.tile1Image, title: s.tile1Label, text: "", link: s.tile1Link },
    { image: s.tile2Image, title: s.tile2Label, text: "", link: s.tile2Link },
  ].filter((x) => x.image);
  const [at, setAt] = React.useState(0);
  const n = slides.length;
  React.useEffect(() => {
    if (n < 2) return;
    const t = window.setInterval(() => setAt((i) => (i + 1) % n), 6500);
    return () => window.clearInterval(t);
  }, [n, at]);
  if (!n) return null;
  const go = (d: number) => setAt((i) => (i + d + n) % n);
  const x = slides[Math.min(at, n - 1)];
  const touch = React.useRef(0);
  const arrow = (d: number, className: string) => (
    <button
      key={d}
      type="button"
      onClick={() => go(d)}
      aria-label={d < 0 ? "Previous slide" : "Next slide"}
      className={cn("flex h-10 min-h-0 w-10 items-center justify-center rounded-full transition hover:scale-105", className)}
    >
      {d < 0 ? <ChevronLeft className="h-5 w-5" strokeWidth={1.6} /> : <ChevronRight className="h-5 w-5" strokeWidth={1.6} />}
    </button>
  );
  return (
    <section
      className={cn("relative overflow-hidden bg-[#2a1d20] text-white", !numbered && "px-0 lg:px-[clamp(0px,1.4vw,24px)] lg:pt-[clamp(0px,1vw,16px)]")}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className={cn("relative flex min-h-[clamp(500px,46vw,720px)] items-center overflow-hidden", !numbered && "lg:rounded-[var(--m-card)]")}>
        {slides.map((sl, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={sl.image}
            alt=""
            className={cn("absolute inset-0 h-full w-full object-cover object-[70%_28%] transition-[opacity,transform] duration-[1200ms]", i === at ? "scale-100 opacity-100" : "scale-[1.04] opacity-0")}
          />
        ))}
        <div className={cn("absolute inset-0", numbered ? "bg-gradient-to-r from-black/70 via-black/35 to-black/5" : "bg-gradient-to-r from-black/65 via-black/25 to-transparent")} />
        <Container className={cn("relative w-full py-[clamp(88px,9vw,140px)]", !numbered && "lg:px-[calc(var(--g)+28px)]")}>
          <div key={at} className="m-rise max-w-xl">
            {s.tag && at === 0 && (
              <p className={cn("text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.18em]", numbered ? "text-white/80" : "flex items-center gap-2 text-white/85 before:block before:h-px before:w-8 before:bg-[var(--m-accent)]")}>{s.tag}</p>
            )}
            {x.title && (
              <h1 className="m-h m-display t-hero mt-4 [overflow-wrap:anywhere]">
                <Lines text={x.title} />
              </h1>
            )}
            {x.text && <p className="mt-4 max-w-md text-[length:calc(13.5px*var(--m-scale))] leading-relaxed text-white/85">{x.text}</p>}
            {s.buttonLabel && (
              <MLink to={x.link || s.buttonLink || "/catalog"} className="m-btn mt-7 min-h-11 gap-2 px-6">
                {s.buttonLabel}
                <ArrowRight className="h-4 w-4" />
              </MLink>
            )}
          </div>
        </Container>
        {n > 1 && !numbered && (
          <>
            {arrow(-1, "absolute left-3 top-1/2 hidden -translate-y-1/2 bg-white/85 text-[#222] shadow-md sm:left-[clamp(12px,2vw,32px)] sm:flex")}
            {arrow(1, "absolute right-3 top-1/2 hidden -translate-y-1/2 bg-white/85 text-[#222] shadow-md sm:right-[clamp(12px,2vw,32px)] sm:flex")}
            <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => setAt(i)} aria-label={`Slide ${i + 1}`} className={cn("h-2 min-h-0 rounded-full transition-all", i === at ? "w-7 bg-[var(--m-accent)]" : "w-2 bg-white/60")} />
              ))}
            </div>
          </>
        )}
        {n > 1 && numbered && (
          <Container className="absolute inset-x-0 bottom-[clamp(18px,3vw,40px)] flex items-end justify-between gap-4">
            <div className="flex gap-4 sm:gap-6">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => setAt(i)} aria-label={`Slide ${i + 1}`} aria-current={i === at} className="group min-h-0 text-left">
                  <span className={cn("block text-[length:calc(12px*var(--m-scale))] tabular-nums transition-colors", i === at ? "text-white" : "text-white/55 group-hover:text-white/80")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="mt-2 block h-px w-10 overflow-hidden bg-white/30 sm:w-14">
                    <span key={i === at ? `on-${at}` : "off"} className={cn("block h-full bg-white", i === at ? "t-progress" : "w-0")} />
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {arrow(-1, "border border-white/60 text-white hover:bg-white hover:text-[#222]")}
              {arrow(1, "border border-white/60 text-white hover:bg-white hover:text-[#222]")}
            </div>
          </Container>
        )}
      </div>
    </section>
  );
}

/** Theme 29: four photos in arched windows on the accent colour, the shop name in gold under them. */
function ArchesHero({ s }: { s: Record<string, string> }) {
  const photos = [s.image, s.tile1Image, s.tile2Image, s.tile3Image].filter(Boolean);
  return (
    <section className="t-arches relative overflow-hidden bg-[var(--m-accent)] text-[var(--m-accent-text)]">
      <Container className="relative pb-[clamp(36px,5vw,72px)] pt-[clamp(24px,4vw,56px)]">
        <div className={cn("m-stagger grid gap-[clamp(8px,1.6vw,24px)]", photos.length >= 4 ? "grid-cols-4" : photos.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {photos.map((src, i) => (
            <div key={i} className="t-arch relative aspect-[3/4.6] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] hover:scale-[1.05]" />
            </div>
          ))}
        </div>
        <div className="m-rise mx-auto mt-[clamp(20px,3vw,44px)] max-w-2xl text-center">
          <span aria-hidden className="mx-auto block h-px w-24 bg-gradient-to-r from-transparent via-[#D8B06A] to-transparent" />
          <h1 className="m-h m-display t-hero mt-4 text-[#E8C987] [overflow-wrap:anywhere]">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="mt-3 text-[length:calc(13px*var(--m-scale))] uppercase tracking-[0.22em] opacity-85">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D8B06A] px-7 text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.12em] text-[#F3DDAE] transition-colors hover:bg-[#D8B06A] hover:text-[var(--m-accent)]">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 31: a small tag, a heading with highlighted words, two pill buttons and a rounded photo with a sticker. */
function BoutiqueHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="pt-[clamp(20px,3.4vw,56px)]">
      <Container className="grid items-center gap-8 md:grid-cols-[1.05fr_1fr] md:gap-[clamp(24px,4vw,72px)]">
        <div className="m-rise order-2 min-w-0 md:order-1 md:pl-[clamp(0px,3vw,48px)]">
          {s.tag && <p className="text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.2em] text-[var(--m-accent)]">{s.tag}</p>}
          <h1 className="m-h m-display t-hero mt-4 [overflow-wrap:anywhere]">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="m-muted mt-5 max-w-sm text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.subheading}</p>}
          {(s.buttonLabel || s.secondButtonLabel) && (
            <div className="mt-7 flex flex-wrap gap-2.5">
              {s.buttonLabel && (
                <MLink to={s.buttonLink || "/catalog"} className="m-btn min-h-11 px-6">
                  {s.buttonLabel}
                </MLink>
              )}
              {s.secondButtonLabel && (
                <MLink to={s.secondButtonLink || "/catalog"} className="m-btn m-btn-outline min-h-11 px-6">
                  {s.secondButtonLabel}
                </MLink>
              )}
            </div>
          )}
        </div>
        <div className="relative order-1 md:order-2">
          <div className="m-panel relative aspect-[4/4.4] overflow-hidden rounded-[clamp(18px,2.4vw,32px)] md:aspect-[4/4.6]">
            {s.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="m-faint flex h-full items-center justify-center">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
          </div>
          {s.stat && (
            <span className="absolute -left-3 bottom-6 flex rotate-[-10deg] h-[clamp(78px,8vw,104px)] w-[clamp(78px,8vw,104px)] flex-col items-center justify-center rounded-full bg-[var(--m-accent)] text-center text-[var(--m-accent-text)] shadow-lg sm:-left-6">
              <span className="m-h text-[length:calc(clamp(15px,1.5vw,20px)*var(--m-scale))] italic leading-none">{s.stat}</span>
              {s.statLabel && <span className="mt-1 text-[length:calc(9.5px*var(--m-scale))] uppercase tracking-[0.1em]">{s.statLabel}</span>}
            </span>
          )}
        </div>
      </Container>
    </section>
  );
}

/** A heading with a small underlined link at the end of the row. */
function HeadWithLink({ s, align = "left" }: { s: Record<string, string>; align?: "left" | "center" }) {
  return (
    <div className={cn("mb-[clamp(18px,2.6vw,36px)] flex items-end gap-4", align === "center" ? "flex-col items-center text-center" : "justify-between")}>
      <div className="min-w-0">
        {s.eyebrow && <p className="mb-2 text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.16em] text-[var(--m-accent)]">{s.eyebrow}</p>}
        <h2 className="m-h t-section">
          <Lines text={s.heading} />
        </h2>
        {s.text && <p className="m-muted mt-2 max-w-xl text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.text}</p>}
      </div>
      {s.buttonLabel && (
        <MLink to={s.buttonLink || "/catalog"} className="min-h-0 shrink-0 text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.1em] underline underline-offset-4 hover:text-[var(--m-accent)]">
          {s.buttonLabel}
        </MLink>
      )}
    </div>
  );
}

/** Five occasion photos of different sizes: one tall, two wide and two small. */
function OccasionMosaic({ s }: { s: Record<string, string> }) {
  const tiles = [1, 2, 3, 4, 5].map((i) => ({ i, image: s[`o${i}Image`], title: s[`o${i}Title`], text: s[`o${i}Text`], link: s[`o${i}Link`] })).filter((t) => t.image);
  if (!tiles.length) return null;
  // where each tile sits on wide screens: tall, wide, small / small, wide
  const place = ["row-span-2 md:col-start-1 md:row-span-2", "md:col-span-2", "", "", "md:col-span-2"];
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        <HeadWithLink s={s} />
        <div className="m-stagger grid auto-rows-[clamp(150px,17vw,250px)] grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
          {tiles.map((t, n) => (
            <MLink key={t.i} to={t.link || "/catalog"} className={cn("group relative block overflow-hidden rounded-[var(--m-card)] bg-[var(--m-panel)]", place[n])}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-[clamp(12px,1.4vw,20px)] text-white">
                {t.title && <span className="m-h block text-[length:calc(clamp(15px,1.5vw,21px)*var(--m-scale))]">{t.title}</span>}
                {t.text && (
                  <span className="mt-1 flex items-center gap-1 text-[length:calc(9.5px*var(--m-scale))] font-semibold uppercase tracking-[0.12em] text-white/80">
                    {t.text}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

const PROMISE_ICONS = [Award, Sparkles, Truck, RefreshCcw, Lock];

/** Five promises in a row, each under a round icon. */
function PromiseIcons({ s }: { s: Record<string, string> }) {
  const items = [1, 2, 3, 4, 5].filter((i) => s[`i${i}Title`]);
  if (!items.length) return null;
  return (
    <section className="py-[clamp(32px,4.6vw,72px)]">
      <Container>
        <div className="m-stagger grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((i, n) => {
            const Icon = PROMISE_ICONS[n % PROMISE_ICONS.length];
            return (
              <div key={i} className={cn("flex flex-col items-center text-center", n === items.length - 1 && items.length % 2 === 1 && "col-span-2 sm:col-span-1")}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--m-panel)] text-[var(--m-accent)]">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <p className="mt-3 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.08em]">{s[`i${i}Title`]}</p>
                {s[`i${i}Text`] && <p className="m-muted mt-1.5 max-w-[15rem] text-[length:calc(11.5px*var(--m-scale))] leading-snug">{s[`i${i}Text`]}</p>}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/** "Label: search word" lines, as used by searches and price ranges. */
function labelledLines(text: string) {
  return (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const at = l.lastIndexOf(":");
      return at > 0 ? { label: l.slice(0, at).trim(), value: l.slice(at + 1).trim() } : { label: l, value: l };
    });
}

/** The searches customers use most, as a run of links. */
function PopularSearches({ s }: { s: Record<string, string> }) {
  const terms = labelledLines(s.terms);
  if (!terms.length) return null;
  return (
    <section className="pb-[clamp(28px,4vw,56px)]">
      <Container>
        <p className="m-line border-t pt-6 text-[length:calc(11.5px*var(--m-scale))] leading-[2]">
          {s.heading && <span className="mr-2 whitespace-nowrap font-semibold uppercase tracking-[0.06em]">{s.heading}:</span>}
          {terms.map((t, i) => (
            <React.Fragment key={t.label}>
              {/* spaces around the bar let the line wrap between links */}
              {i > 0 && <span className="m-faint whitespace-pre-wrap"> | </span>}
              <MLink to={`/search?q=${encodeURIComponent(t.value)}`} className="m-muted whitespace-nowrap hover:text-[var(--m-accent)] hover:underline">
                {t.label}
              </MLink>
            </React.Fragment>
          ))}
        </p>
      </Container>
    </section>
  );
}

/** Whole-word search over products' names and descriptions ("banarasi" finds "Banarasi Silk"). */
function productsMatching(products: ProductData[], term: string, limit: number) {
  const safe = term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!safe) return [];
  const word = new RegExp(`\\b${safe}(s)?\\b`, "i");
  return products.filter((p) => word.test(`${p.title} ${p.description}`)).slice(0, limit);
}

/** Theme 29: a tab for each weave with its photo in an arch, its story and the products woven that way. */
function WeaveGuide({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const weaves = [1, 2, 3, 4, 5].map((i) => ({ i, name: s[`w${i}Name`], image: s[`w${i}Image`], text: s[`w${i}Text`], term: s[`w${i}Term`] || s[`w${i}Name`] || "" })).filter((w) => w.name);
  const [pick, setPick] = React.useState(0);
  if (!weaves.length) return null;
  const w = weaves[Math.min(pick, weaves.length - 1)];
  const matches = productsMatching(visibleProducts(store), w.term, 3);
  return (
    <section className="m-panel py-[clamp(44px,6vw,100px)]">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-3 text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.text}</p>}
        </div>
        <div className="m-scroll -mx-[var(--g)] mt-7 flex justify-start gap-1 overflow-x-auto px-[var(--g)] sm:justify-center" role="tablist">
          {weaves.map((x, n) => (
            <button
              key={x.i}
              type="button"
              role="tab"
              aria-selected={n === pick}
              onClick={() => setPick(n)}
              className={cn(
                "m-h shrink-0 border-b-2 px-4 pb-2 text-[length:calc(clamp(15px,1.4vw,19px)*var(--m-scale))] transition-colors",
                n === pick ? "border-[#C8963E] text-[var(--m-accent)]" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {x.name}
            </button>
          ))}
        </div>
        <div key={w.i} className="m-page mt-[clamp(24px,3.4vw,48px)] grid items-center gap-[clamp(20px,4vw,64px)] md:grid-cols-[0.8fr_1.2fr]">
          {w.image && (
            <div className="t-arch relative mx-auto aspect-[3/4] w-full max-w-[250px] overflow-hidden sm:max-w-[360px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="m-h t-title">{w.name}</p>
            {w.text && <p className="mt-4 max-w-lg text-[length:calc(14px*var(--m-scale))] leading-relaxed">{w.text}</p>}
            {matches.length > 0 && (
              <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                {matches.map((p) => (
                  <MLink key={p.id} to={`/products/${p.slug || p.id}`} className="group flex items-center gap-3 rounded-full bg-[var(--m-bg)] p-1.5 pr-4 sm:flex-col sm:items-start sm:rounded-none sm:bg-transparent sm:p-0">
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover sm:aspect-[4/5] sm:h-auto sm:w-full sm:rounded-none" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-[length:calc(12.5px*var(--m-scale))] group-hover:underline">{p.title}</span>
                      <span className="block text-[length:calc(12px*var(--m-scale))] font-semibold">{rupees(p.price)}</span>
                    </span>
                  </MLink>
                ))}
              </div>
            )}
            <MLink to={`/search?q=${encodeURIComponent(w.term)}`} className="m-btn mt-7 min-h-11 px-7">
              Shop {w.name}
            </MLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Theme 29: a photo under a heading, the shop's story with three values, and a short form that opens WhatsApp. */
function HeritageTrio({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const [name, setName] = React.useState("");
  const [occasion, setOccasion] = React.useState("");
  const paragraphs = (s.text || "").split(/\n{2,}/).filter((p) => p.trim());
  const values = [1, 2, 3].filter((i) => s[`v${i}Title`]);
  const wa = (text: string) => whatsappLink(store.contactPhone, text);
  return (
    <section className="py-[clamp(44px,6vw,100px)]">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.5fr_1fr] lg:gap-0">
        <div className="lg:pr-[clamp(20px,2.6vw,40px)]">
          {s.heading && (
            <h2 className="m-h t-section">
              <Lines text={s.heading} />
            </h2>
          )}
          {s.image && (
            <div className="t-drape relative mt-5 aspect-[4/4.6] overflow-hidden bg-[var(--m-panel)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          )}
        </div>
        <div className="m-line text-center lg:border-x lg:px-[clamp(20px,3vw,48px)]">
          {s.storyHeading && <h3 className="m-h t-section text-[var(--m-accent)]">{s.storyHeading}</h3>}
          <div className="mx-auto mt-5 max-w-lg space-y-3 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {values.length > 0 && (
            <div className="m-line mt-8 grid grid-cols-3 border-t pt-6">
              {values.map((i, n) => (
                <div key={i} className={cn("px-2", n > 0 && "m-line border-l")}>
                  <Flower2 className="mx-auto h-5 w-5 text-[#C8963E]" strokeWidth={1.4} />
                  <p className="m-h mt-2 text-[length:calc(14px*var(--m-scale))]">{s[`v${i}Title`]}</p>
                  {s[`v${i}Text`] && <p className="m-muted mt-1 text-[length:calc(11px*var(--m-scale))] leading-snug">{s[`v${i}Text`]}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        {(s.formHeading || s.buttonLabel) && (
          <form
            className="flex flex-col justify-center lg:pl-[clamp(20px,2.6vw,40px)]"
            onSubmit={(e) => {
              e.preventDefault();
              const link = wa(`Hi ${store.name}! I'm ${name.trim() || "looking for a saree"}${occasion.trim() ? `, shopping for ${occasion.trim()}` : ""}. Could you help me choose?`);
              if (link) window.open(link, "_blank", "noopener,noreferrer");
            }}
          >
            {s.formHeading && (
              <h3 className="m-h t-section text-[var(--m-accent)]">
                <Lines text={s.formHeading} />
              </h3>
            )}
            {s.formText && <p className="m-muted mt-3 text-[length:calc(12.5px*var(--m-scale))] leading-relaxed">{s.formText}</p>}
            <label className="sr-only" htmlFor="ht-name">
              Your name
            </label>
            <input id="ht-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="m-line mt-5 h-11 rounded-full border bg-white/70 px-5 text-[length:calc(13px*var(--m-scale))] outline-none focus:border-[var(--m-accent)]" />
            <label className="sr-only" htmlFor="ht-occasion">
              Occasion
            </label>
            <input id="ht-occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Occasion, e.g. my sister's wedding" className="m-line mt-2.5 h-11 rounded-full border bg-white/70 px-5 text-[length:calc(13px*var(--m-scale))] outline-none focus:border-[var(--m-accent)]" />
            {store.contactPhone ? (
              <button type="submit" className="mt-4 flex h-11 min-h-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--m-accent)] to-[#B9853A] text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.1em] text-[#FFF6E6] transition hover:opacity-90">
                <MessageCircle className="h-4 w-4" />
                {s.buttonLabel || "Send"}
              </button>
            ) : (
              <MLink to="/pages/contact" className="mt-4 flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[var(--m-accent)] to-[#B9853A] text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.1em] text-[#FFF6E6]">
                Contact us
              </MLink>
            )}
          </form>
        )}
      </Container>
    </section>
  );
}

/** Theme 29: the years of the shop's story along a gold line. */
function CraftTimeline({ s }: { s: Record<string, string> }) {
  const steps = [1, 2, 3, 4].filter((i) => s[`t${i}Year`] || s[`t${i}Title`]);
  if (!steps.length) return null;
  return (
    <section className="py-[clamp(44px,6vw,100px)]">
      <Container>
        <h2 className="m-h t-section text-center">
          <Lines text={s.heading} />
        </h2>
        <ol className="relative mt-[clamp(28px,4vw,56px)] grid gap-8 border-l border-[#C8963E]/60 pl-6 md:grid-cols-4 md:gap-6 md:border-l-0 md:pl-0">
          <span aria-hidden className="absolute left-0 right-0 top-[3.1rem] hidden h-px bg-gradient-to-r from-transparent via-[#C8963E] to-transparent md:block" />
          {steps.map((i) => (
            <li key={i} className="relative md:text-center">
              <span className="m-h block text-[length:calc(clamp(26px,2.6vw,38px)*var(--m-scale))] text-[var(--m-accent)]">{s[`t${i}Year`]}</span>
              <span aria-hidden className="absolute -left-[31px] top-3 h-3 w-3 rotate-45 border border-[#C8963E] bg-[var(--m-bg)] md:static md:mx-auto md:mt-3 md:block" />
              <p className="m-h mt-2 text-[length:calc(16px*var(--m-scale))] md:mt-5">{s[`t${i}Title`]}</p>
              {s[`t${i}Text`] && <p className="m-muted mx-auto mt-1.5 max-w-[16rem] text-[length:calc(12.5px*var(--m-scale))] leading-relaxed md:mt-2">{s[`t${i}Text`]}</p>}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/** Theme 30: a heading, text and link on the left; the categories as round photos with a line under each. */
function CollectionCircles({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = shoppableCategories(store).slice(0, 8);
  if (!cats.length) return null;
  return (
    <section className="py-[clamp(40px,5.6vw,92px)]">
      <Container className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2.25fr)] lg:gap-12">
        <div>
          {s.eyebrow && <p className="text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.16em] text-[var(--m-accent)]">{s.eyebrow}</p>}
          <h2 className="m-h t-section mt-2">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-3 max-w-xs text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-5 inline-flex items-center gap-2 text-[length:calc(12.5px*var(--m-scale))] font-semibold text-[var(--m-accent)] transition-[gap] hover:gap-3">
              {s.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
        <div className="m-stagger m-scroll -mx-[var(--g)] flex gap-[clamp(14px,2vw,28px)] overflow-x-auto px-[var(--g)] pb-1 lg:mx-0 lg:justify-between lg:px-0">
          {cats.map((c) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group flex w-[clamp(88px,8.2vw,118px)] shrink-0 flex-col items-center text-center">
              <span className="relative block aspect-square w-full overflow-hidden rounded-full bg-[var(--m-panel)] ring-1 ring-[color-mix(in_srgb,var(--m-accent)_18%,transparent)] ring-offset-4 ring-offset-[var(--m-bg)] transition group-hover:ring-[var(--m-accent)]">
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.08]" />
                )}
              </span>
              <span className="mt-3 text-[length:calc(12.5px*var(--m-scale))] font-semibold leading-tight">{c.name}</span>
              {c.subtitle && <span className="m-muted mt-0.5 text-[length:calc(11px*var(--m-scale))]">{c.subtitle}</span>}
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Theme 30: a wide photo banner beside a banner in the accent colour. */
function FeatureDuo({ s }: { s: Record<string, string> }) {
  const button = (label: string, to: string) => (
    <MLink to={to || "/catalog"} className="mt-5 inline-flex h-9 min-h-0 items-center gap-1.5 rounded-full border border-white/70 px-4 text-[length:calc(11.5px*var(--m-scale))] font-medium text-white transition-colors hover:bg-white hover:text-[#2A1A28]">
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </MLink>
  );
  const eyebrow = (t: string) => t && <p className="text-[length:calc(9.5px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] text-white/75">{t}</p>;
  return (
    <section className="py-[clamp(24px,3.6vw,56px)]">
      <Container className="grid gap-3 sm:gap-4 md:grid-cols-[1.35fr_1fr]">
        <div className="relative flex min-h-[clamp(240px,26vw,380px)] items-center justify-end overflow-hidden rounded-[var(--m-card)] bg-[#4a3424] text-white">
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-left transition duration-[1200ms] hover:scale-[1.03]" />
          )}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3a2618]/60 to-[#3a2618]/95" />
          <div className="relative w-[58%] p-[clamp(18px,3vw,44px)] sm:w-1/2">
            {eyebrow(s.eyebrow)}
            <h2 className="m-h t-title mt-2">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="mt-2 text-[length:calc(12.5px*var(--m-scale))] text-white/80">{s.text}</p>}
            {s.buttonLabel && button(s.buttonLabel, s.buttonLink)}
          </div>
        </div>
        <div className="relative flex min-h-[clamp(220px,26vw,380px)] items-center overflow-hidden rounded-[var(--m-card)] bg-[var(--m-accent)] text-white">
          {s.image2 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image2} alt="" loading="lazy" className="absolute inset-y-0 right-0 h-full w-[62%] object-cover" />
          )}
          <span className="absolute inset-0 bg-gradient-to-r from-[var(--m-accent)] via-[var(--m-accent)]/85 to-transparent" />
          <div className="relative w-[64%] p-[clamp(18px,3vw,40px)]">
            {eyebrow(s.eyebrow2)}
            <h2 className="m-h t-title mt-2">
              <Lines text={s.heading2} />
            </h2>
            {s.text2 && <p className="mt-2 text-[length:calc(12.5px*var(--m-scale))] text-white/80">{s.text2}</p>}
            {s.buttonLabel2 && button(s.buttonLabel2, s.buttonLink2)}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Theme 30: an offer on a dark band with a code that copies when tapped, the photo fading in on the right. */
function CouponBanner({ s }: { s: Record<string, string> }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(s.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="py-[clamp(24px,3.6vw,56px)]">
      <Container>
        <div className="relative grid min-h-[clamp(200px,20vw,280px)] items-center overflow-hidden rounded-[var(--m-card)] bg-[color-mix(in_srgb,var(--m-accent)_55%,#120812)] text-white sm:grid-cols-[1.1fr_1fr]">
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" loading="lazy" className="t-fade-left absolute inset-y-0 right-0 h-full w-full object-cover opacity-50 sm:w-[55%] sm:opacity-100" />
          )}
          <div className="relative flex flex-col gap-5 p-[clamp(22px,3.6vw,52px)] sm:flex-row sm:items-center sm:gap-10">
            <div>
              {s.eyebrow && <p className="text-[length:calc(10px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] text-[#E6B7E8]">{s.eyebrow}</p>}
              <h2 className="m-h t-title mt-2">
                <Lines text={s.heading} />
              </h2>
            </div>
            {s.code && (
              <button
                type="button"
                onClick={copy}
                className="inline-flex h-10 min-h-0 shrink-0 items-center gap-2 self-start rounded-full border border-white/60 px-5 text-[length:calc(12px*var(--m-scale))] transition-colors hover:bg-white hover:text-[#2A1A28] sm:self-center"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : (
                  <>
                    Use code: <span className="font-semibold tracking-[0.06em]">{s.code}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Theme 30: four numbered photo cards, e.g. ways to drape a saree. */
function DrapeStyles({ s }: { s: Record<string, string> }) {
  const cards = [1, 2, 3, 4].filter((i) => s[`d${i}Image`] || s[`d${i}Title`]);
  if (!cards.length) return null;
  return (
    <section className="py-[clamp(40px,5.6vw,92px)]">
      <Container>
        <HeadWithLink s={{ eyebrow: s.eyebrow, heading: s.heading }} />
        <div className="m-stagger grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {cards.map((i, n) => (
            <MLink key={i} to={s[`d${i}Link`] || "/catalog"} className="group block">
              <span className="relative block aspect-[3/4] overflow-hidden rounded-[var(--m-card)] bg-[var(--m-panel)]">
                {s[`d${i}Image`] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s[`d${i}Image`]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                )}
                <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent" />
                <span className="m-h absolute left-3 top-2 text-[length:calc(clamp(26px,2.8vw,40px)*var(--m-scale))] italic text-white">{String(n + 1).padStart(2, "0")}</span>
              </span>
              <span className="m-h mt-3 block text-[length:calc(clamp(16px,1.5vw,20px)*var(--m-scale))]">{s[`d${i}Title`]}</span>
              {s[`d${i}Text`] && <span className="m-muted mt-1 block text-[length:calc(12px*var(--m-scale))] leading-snug">{s[`d${i}Text`]}</span>}
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Theme 31: the categories in small circles with a coloured ring, like stories. */
function StoryRings({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = shoppableCategories(store).slice(0, 10);
  if (!cats.length) return null;
  return (
    <section className="py-[clamp(24px,3.4vw,52px)]">
      <Container>
        {s.heading && (
          <h2 className="m-h t-section mb-6 text-center">
            <Lines text={s.heading} />
          </h2>
        )}
        <div className="m-stagger m-scroll -mx-[var(--g)] flex gap-4 overflow-x-auto px-[var(--g)] sm:justify-center sm:gap-6">
          {cats.map((c) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group flex w-[72px] shrink-0 flex-col items-center gap-2 text-center sm:w-[84px]">
              <span className="t-ring block rounded-full p-[3px] transition-transform group-hover:scale-105">
                <span className="block rounded-full bg-[var(--m-bg)] p-[3px]">
                  <span className="relative block h-[60px] w-[60px] overflow-hidden rounded-full bg-[var(--m-panel)] sm:h-[70px] sm:w-[70px]">
                    {c.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </span>
                </span>
              </span>
              <span className="text-[length:calc(11.5px*var(--m-scale))] lowercase">{c.name}</span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Theme 31: the categories as tall photos, each with a small white label. */
function LabelTiles({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = shoppableCategories(store)
    .filter((c) => c.imageUrl)
    .slice(0, 6);
  if (!cats.length) return null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        {s.heading && (
          <h2 className="m-h t-section mb-[clamp(16px,2.4vw,32px)]">
            <Lines text={s.heading} />
          </h2>
        )}
        <div className={cn("m-stagger grid grid-cols-2 gap-2.5 sm:gap-3.5", cats.length % 3 === 0 || cats.length > 4 ? "md:grid-cols-3" : "md:grid-cols-4")}>
          {cats.map((c) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group relative block aspect-[4/4.6] overflow-hidden rounded-[var(--m-card)] bg-[var(--m-panel)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[length:calc(11.5px*var(--m-scale))] lowercase text-[#2B1D17] shadow-sm transition-[padding] group-hover:pr-2.5">
                {c.name}
                <ArrowRight className="h-3 w-0 opacity-0 transition-all group-hover:w-3 group-hover:opacity-100" />
              </span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Theme 31: a rounded band in the accent colour with an offer and a white pill button. */
function OfferBand({ s }: { s: Record<string, string> }) {
  if (!s.heading) return null;
  return (
    <section className="py-[clamp(16px,2.6vw,40px)]">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 rounded-[clamp(16px,2vw,26px)] bg-[var(--m-accent)] px-[clamp(20px,3.6vw,52px)] py-[clamp(22px,3vw,40px)] text-[var(--m-accent-text)] sm:flex-row sm:items-center">
          <div>
            <h2 className="m-h t-title">{s.heading}</h2>
            {s.text && <p className="mt-1.5 text-[length:calc(11.5px*var(--m-scale))] opacity-85">{s.text}</p>}
          </div>
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="inline-flex h-10 min-h-0 shrink-0 items-center rounded-full bg-white px-5 text-[length:calc(12px*var(--m-scale))] font-medium text-[var(--m-accent)] transition hover:scale-[1.03]">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 31: price ranges as pills; the products in the chosen range show under them. */
function BudgetPicker({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const ranges = labelledLines(s.ranges).map((r) => {
    const [from, to] = r.value.split("-").map((x) => x.replace(/[^0-9]/g, ""));
    return { label: r.label, min: Number(from || 0) * 100, max: to ? Number(to) * 100 : Infinity };
  });
  const [pick, setPick] = React.useState(0);
  if (!ranges.length) return null;
  const r = ranges[Math.min(pick, ranges.length - 1)];
  const products = visibleProducts(store)
    .filter((p) => p.price >= r.min && p.price <= r.max)
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        {s.heading && (
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
        )}
        <div className="m-scroll -mx-[var(--g)] mt-5 flex gap-2 overflow-x-auto px-[var(--g)] sm:grid sm:grid-cols-4 sm:gap-3" role="tablist">
          {ranges.map((x, i) => (
            <button
              key={x.label}
              type="button"
              role="tab"
              aria-selected={i === pick}
              onClick={() => setPick(i)}
              className={cn(
                "h-10 min-h-0 shrink-0 rounded-full border px-5 text-[length:calc(12px*var(--m-scale))] transition-colors sm:w-full",
                i === pick ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "border-[color-mix(in_srgb,var(--m-text)_35%,transparent)] hover:border-[var(--m-text)]"
              )}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="mt-[clamp(20px,3vw,36px)]">
          {products.length ? (
            <div key={pick} className="m-page grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="m-muted py-6 text-center text-[length:calc(13px*var(--m-scale))]">Nothing in this range right now. Try another one.</p>
          )}
          {s.buttonLabel && (
            <div className="mt-8 text-center">
              <MLink to="/catalog" className="m-btn m-btn-outline min-h-10 px-7">
                {s.buttonLabel}
              </MLink>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 31: the sizes as round buttons; picking one shows its bust, waist and hip. */
function SizeFinder({ s }: { s: Record<string, string> }) {
  const sizes = labelledLines(s.sizes).map((x) => ({ size: x.label, parts: x.value.split("/").map((v) => v.trim()) }));
  const start = Math.max(0, sizes.findIndex((x) => x.size.toUpperCase() === "M"));
  const [pick, setPick] = React.useState(start);
  if (!sizes.length) return null;
  const cur = sizes[Math.min(pick, sizes.length - 1)];
  const names = ["Bust", "Waist", "Hip"];
  return (
    <section className="m-panel py-[clamp(44px,6vw,96px)]">
      <Container className="grid items-center gap-8 md:grid-cols-[1fr_1.2fr] md:gap-14">
        <div>
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-4 max-w-md text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-6 min-h-11 px-6">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
        <div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sizes">
            {sizes.map((x, i) => (
              <button
                key={x.size}
                type="button"
                role="tab"
                aria-selected={i === pick}
                onClick={() => setPick(i)}
                className={cn(
                  "flex h-12 min-h-0 min-w-12 items-center justify-center rounded-full border px-3 text-[length:calc(12.5px*var(--m-scale))] font-medium uppercase transition-colors",
                  i === pick ? "border-[var(--m-accent)] bg-[var(--m-accent)] text-[var(--m-accent-text)]" : "border-[color-mix(in_srgb,var(--m-text)_25%,transparent)] bg-[var(--m-bg)] hover:border-[var(--m-text)]"
                )}
              >
                {x.size}
              </button>
            ))}
          </div>
          <div key={pick} className="m-page mt-5 rounded-[var(--m-card)] bg-[var(--m-bg)] p-[clamp(18px,2.4vw,28px)]">
            <p className="m-muted text-[length:calc(12px*var(--m-scale))]">
              Size <span className="font-semibold uppercase text-[var(--m-text)]">{cur.size}</span> fits, in inches
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {names.map((n, i) => (
                <div key={n}>
                  <p className="m-h text-[length:calc(clamp(26px,3vw,40px)*var(--m-scale))] italic text-[var(--m-accent)]">{cur.parts[i] || "–"}″</p>
                  <p className="m-muted mt-1 text-[length:calc(11.5px*var(--m-scale))] lowercase">{n}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A four-point sparkle, drawn in the current colour. */
function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M12 0c.7 6.6 5.4 11.3 12 12-6.6.7-11.3 5.4-12 12-.7-6.6-5.4-11.3-12-12C6.6 11.3 11.3 6.6 12 0z" fill="currentColor" />
    </svg>
  );
}

/** Theme 32: the heading on a soft colour panel with a sparkle and a few dots, a rounded photo beside it. */
function SparkleHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="pt-[clamp(12px,1.8vw,28px)]">
      <Container className="grid gap-3 md:grid-cols-[1fr_1.05fr] md:gap-4">
        <div className="m-rise relative order-2 flex min-h-[clamp(300px,32vw,460px)] flex-col justify-center overflow-hidden rounded-[clamp(16px,1.8vw,26px)] bg-[var(--m-panel)] p-[clamp(24px,4vw,60px)] md:order-1">
          <Sparkle className="t-twinkle absolute right-[14%] top-[14%] h-[clamp(20px,2.4vw,34px)] w-[clamp(20px,2.4vw,34px)] text-[var(--m-accent)]" />
          <h1 className="m-h m-display t-hero text-[var(--m-accent)] [overflow-wrap:anywhere]">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="mt-4 max-w-xs whitespace-pre-line text-[length:calc(clamp(15px,1.4vw,19px)*var(--m-scale))] leading-snug">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="m-btn mt-7 min-h-11 gap-2 self-start px-6">
              {s.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
          <span aria-hidden className="absolute bottom-[10%] right-[10%] grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--m-accent)] opacity-60" />
            ))}
          </span>
        </div>
        <div className="relative order-1 min-h-[clamp(240px,32vw,460px)] overflow-hidden rounded-[clamp(16px,1.8vw,26px)] bg-[var(--m-panel)] md:order-2">
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 33: two photos side by side with a card in the middle; the arrows swap to the next pair. */
function PostcardHero({ s }: { s: Record<string, string> }) {
  const slides = [
    { left: s.image, right: s.tile1Image, title: s.heading, text: s.subheading, link: s.buttonLink },
    { left: s.tile2Image, right: s.tile3Image, title: s.tile2Label, text: "", link: s.tile2Link },
  ].filter((x) => x.left || x.right);
  const [at, setAt] = React.useState(0);
  const n = slides.length;
  if (!n) return null;
  const x = slides[Math.min(at, n - 1)];
  const go = (d: number) => setAt((i) => (i + d + n) % n);
  return (
    <section className="relative">
      <div key={at} className="m-page grid h-[clamp(300px,34vw,520px)] grid-cols-2">
        {[x.left, x.right].map((src, i) => (
          <div key={i} className={cn("relative overflow-hidden", i ? "bg-[var(--m-panel)]" : "bg-[#C9C3EF]")}>
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div key={`c${at}`} className="m-rise w-[min(420px,86%)] bg-white/85 px-[clamp(18px,3vw,40px)] py-[clamp(18px,2.6vw,34px)] text-center backdrop-blur-sm">
          {x.title && (
            <h1 className="m-h m-display t-title uppercase">
              <Lines text={x.title} />
            </h1>
          )}
          {x.text && <p className="mt-3 text-[length:calc(12.5px*var(--m-scale))] leading-relaxed">{x.text}</p>}
          {s.buttonLabel && (
            <MLink to={x.link || "/catalog"} className="mt-4 inline-flex h-9 min-h-0 items-center bg-[var(--m-accent)] px-4 text-[length:calc(10.5px*var(--m-scale))] font-bold uppercase tracking-[0.08em] text-[var(--m-accent-text)] shadow-[3px_3px_0_#E8772E]">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
      </div>
      {n > 1 && (
        <>
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => go(d)}
              aria-label={d < 0 ? "Previous slide" : "Next slide"}
              className={cn("absolute top-1/2 flex h-8 min-h-0 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3B3340] shadow", d < 0 ? "left-3" : "right-3")}
            >
              {d < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </>
      )}
    </section>
  );
}

/** Theme 34: a background photo, a framed photo on each side and an arch in the accent colour in the middle. */
function ArchwayHero({ s }: { s: Record<string, string> }) {
  const side = (src: string | undefined, className: string) =>
    src ? (
      <div className={cn("relative hidden aspect-[3/4] w-[clamp(140px,22vw,320px)] overflow-hidden border border-[var(--m-accent)]/40 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.6)] sm:block", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    ) : null;
  return (
    <section className="relative overflow-hidden bg-[var(--m-panel)]">
      {s.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.image} alt="" className="absolute inset-x-0 top-0 h-[78%] w-full object-cover" />
      )}
      <div className="relative mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-[clamp(12px,2vw,32px)] py-[clamp(28px,4vw,64px)]">
        {side(s.tile1Image, "self-start")}
        <div className="m-rise mx-auto flex min-h-[clamp(320px,30vw,440px)] w-[min(400px,88%)] flex-col items-center justify-center rounded-t-full bg-[var(--m-accent)] px-6 pb-10 pt-[clamp(56px,6vw,90px)] text-center text-[var(--m-accent-text)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
          {s.tag && <p className="text-[length:calc(10px*var(--m-scale))] uppercase tracking-[0.3em] opacity-80">{s.tag}</p>}
          <h1 className="m-h m-display t-hero mt-3 leading-[0.95]">
            <Lines text={s.heading} />
          </h1>
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-6 inline-flex h-9 min-h-0 items-center border border-current px-7 text-[length:calc(10.5px*var(--m-scale))] uppercase tracking-[0.2em] transition-colors hover:bg-[var(--m-accent-text)] hover:text-[var(--m-accent)]">
              {s.buttonLabel}
            </MLink>
          )}
          <ArrowDown className="mt-4 h-4 w-4 opacity-80" strokeWidth={1.4} />
        </div>
        {side(s.tile2Image, "self-end")}
      </div>
    </section>
  );
}

/** A paw print, drawn in the current colour. */
function Paw({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className} style={style}>
      <ellipse cx="32" cy="42" rx="14" ry="12" fill="currentColor" />
      <ellipse cx="14" cy="26" rx="6" ry="8" fill="currentColor" />
      <ellipse cx="26" cy="15" rx="6" ry="8" fill="currentColor" />
      <ellipse cx="40" cy="15" rx="6" ry="8" fill="currentColor" />
      <ellipse cx="51" cy="27" rx="6" ry="8" fill="currentColor" />
    </svg>
  );
}

/** Theme 35: a bright band with paw prints, a tall heading, the photo in a circle with a sticker, and a wavy edge. */
function SplashHero({ s }: { s: Record<string, string> }) {
  return (
    <section className="relative overflow-hidden bg-[var(--m-accent)] text-white">
      <Paw className="absolute -left-6 top-[38%] h-[clamp(90px,12vw,190px)] w-[clamp(90px,12vw,190px)] rotate-[-20deg] text-[#E8611A]" />
      <Paw className="absolute left-[44%] top-[8%] h-12 w-12 rotate-[18deg] text-[#E8611A]" />
      <Paw className="absolute bottom-[22%] right-[6%] h-14 w-14 rotate-[30deg] text-[#E8611A]" />
      <Container className="relative grid items-center gap-6 pb-[clamp(70px,8vw,120px)] pt-[clamp(28px,4vw,56px)] md:grid-cols-[1fr_1.05fr]">
        <div className="m-rise relative z-[1] text-center md:pl-[6%] md:text-left">
          {s.tag && <p className="m-h m-display text-[length:calc(clamp(22px,3vw,44px)*var(--m-scale))] italic leading-none">{s.tag}</p>}
          <h1 className="m-h m-display t-hero mt-1 -skew-x-6 italic [overflow-wrap:anywhere]">
            <Lines text={s.heading} />
          </h1>
          {s.subheading && <p className="mt-3 text-[length:calc(15px*var(--m-scale))] text-white/90">{s.subheading}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-6 inline-flex h-10 min-h-0 items-center rounded-full bg-[#1E1E1E] px-6 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] text-white transition hover:scale-[1.04]">
              {s.buttonLabel}
            </MLink>
          )}
        </div>
        <div className="relative mx-auto aspect-square w-[min(440px,82%)]">
          <span aria-hidden className="absolute inset-[-6%] rounded-full border-[3px] border-dashed border-white/40" />
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full rounded-full border-[8px] border-white/90 object-cover shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]" />
          )}
          {s.stat && (
            <span className="m-burst absolute -right-2 top-2 flex h-[clamp(76px,8vw,108px)] w-[clamp(76px,8vw,108px)] rotate-[12deg] flex-col items-center justify-center bg-[#F7A1A8] text-center text-white">
              <span className="m-h m-display text-[length:calc(clamp(22px,2.6vw,34px)*var(--m-scale))] italic leading-none">{s.stat}</span>
              {s.statLabel && <span className="m-h m-display text-[length:calc(14px*var(--m-scale))] uppercase italic">{s.statLabel}</span>}
            </span>
          )}
        </div>
      </Container>
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden className="absolute inset-x-0 bottom-[-1px] h-[clamp(36px,5vw,80px)] w-full text-[var(--m-bg)]">
        <path d="M0 50c180 40 360 40 540 10s360-60 540-30 270 50 360 40V90H0z" fill="currentColor" />
      </svg>
    </section>
  );
}

/** Theme 32: a big photo, a heading with text and a button, and a small photo beside them. */
function LookTrio({ s }: { s: Record<string, string> }) {
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container className="grid items-center gap-6 md:grid-cols-[1.15fr_1fr_0.62fr] md:gap-[clamp(20px,3vw,48px)]">
        {s.image && (
          <div className="relative aspect-[4/3.4] overflow-hidden rounded-[clamp(14px,1.6vw,22px)] bg-[var(--m-panel)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        <div className="relative">
          <h2 className="m-h t-title text-[var(--m-accent)]">
            <Lines text={s.heading} />
          </h2>
          <Sparkle className="t-twinkle absolute -top-2 right-[8%] h-6 w-6 text-[var(--m-accent)]" />
          {s.text && <p className="mt-4 max-w-sm text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="mt-6 inline-flex h-10 min-h-0 items-center gap-2 rounded-full border border-[var(--m-accent)] px-5 text-[length:calc(12.5px*var(--m-scale))] font-medium text-[var(--m-accent)] transition-colors hover:bg-[var(--m-accent)] hover:text-[var(--m-accent-text)]">
              {s.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
        {s.smallImage && (
          <div className="hidden md:block">
            <div className="relative aspect-[4/4.6] overflow-hidden rounded-[clamp(14px,1.6vw,22px)] bg-[var(--m-panel)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.smallImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span aria-hidden className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--m-accent)]" />
                ))}
              </span>
              <span aria-hidden className="h-9 w-7 rounded-t-full border-2 border-b-0 border-[var(--m-accent)]" />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

/** Theme 32: a room photo with numbered dots; tapping a dot shows that product in a little card. */
function RoomShop({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const products = productsFromSource(store, s.source || "bestsellers", 4);
  const dots = [1, 2, 3, 4]
    .map((i, n) => ({ i, x: Number(s[`h${i}X`]), y: Number(s[`h${i}Y`]), product: products[n] }))
    .filter((d) => d.product && Number.isFinite(d.x) && Number.isFinite(d.y));
  const [open, setOpen] = React.useState(0);
  if (!s.image) return null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        <div className="mb-[clamp(16px,2.4vw,32px)] flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted max-w-sm text-[length:calc(13px*var(--m-scale))]">{s.text}</p>}
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[clamp(14px,1.6vw,22px)] bg-[var(--m-panel)] sm:aspect-[16/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          {dots.map((d, n) => {
            const on = open === n;
            const p = d.product!;
            return (
              <div key={d.i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%` }}>
                <button
                  type="button"
                  onClick={() => setOpen(on ? -1 : n)}
                  aria-expanded={on}
                  aria-label={`${p.title}, ${rupees(p.price)}`}
                  className={cn("relative flex h-8 min-h-0 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[length:calc(11px*var(--m-scale))] font-bold shadow-lg transition", on ? "scale-110 bg-[var(--m-accent)] text-white" : "bg-white/90 text-[var(--m-accent)]")}
                >
                  {!on && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-white/60" />}
                  <span className="relative">{n + 1}</span>
                </button>
                {on && (
                  <MLink
                    to={`/products/${p.slug || p.id}`}
                    className={cn(
                      "m-rise absolute z-[2] flex w-[min(220px,60vw)] items-center gap-3 rounded-2xl bg-white p-2 pr-3 text-[#2a1a16] shadow-xl",
                      d.y > 60 ? "bottom-6" : "top-6",
                      d.x > 55 ? "right-0" : "left-0"
                    )}
                  >
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    )}
                    <span className="min-w-0">
                      <span className="m-h block truncate text-[length:calc(14px*var(--m-scale))]">{p.title}</span>
                      <span className="mt-0.5 block text-[length:calc(12.5px*var(--m-scale))] font-semibold text-[var(--m-accent)]">{rupees(p.price)}</span>
                    </span>
                  </MLink>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

const CIRCLE_TINTS = ["#D9D3F5", "#D99AAE", "#F28C3A", "#8FC3E6", "#F2C14E", "#B7D98B"];

/** Theme 33: the categories as photos in big circles of different colours. */
function CircleTints({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = shoppableCategories(store).slice(0, 6);
  if (!cats.length) return null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        {s.heading && (
          <h2 className="m-h t-section mb-[clamp(20px,3vw,40px)] text-center">
            <Lines text={s.heading} />
          </h2>
        )}
        <div className={cn("m-stagger grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3", cats.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          {cats.slice(0, cats.length >= 5 ? 5 : 4).map((c, i) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group flex flex-col items-center text-center">
              <span className="relative flex aspect-square w-full max-w-[200px] items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-[1.04]" style={{ background: CIRCLE_TINTS[i % CIRCLE_TINTS.length] }}>
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" loading="lazy" className="aspect-[3/4] w-[46%] rotate-[-4deg] border-[4px] border-white object-cover shadow-[3px_5px_12px_-4px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:rotate-[3deg]" />
                )}
              </span>
              <span className="mt-3 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.08em]">{c.name}</span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Theme 33: a photo beside a coloured panel with a title, text and button; arrows move between slides. */
function FeatureSlider({ s }: { s: Record<string, string> }) {
  const slides = [1, 2, 3].map((i) => ({ i, image: s[`f${i}Image`], title: s[`f${i}Title`], text: s[`f${i}Text`], button: s[`f${i}Button`], link: s[`f${i}Link`] })).filter((x) => x.image || x.title);
  const [at, setAt] = React.useState(0);
  const n = slides.length;
  if (!n) return null;
  const x = slides[Math.min(at, n - 1)];
  return (
    <section>
      <div key={at} className="m-page grid md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--m-panel)] md:aspect-auto md:min-h-[clamp(340px,34vw,520px)]">
          {x.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={x.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col items-center justify-center bg-[var(--m-panel)] px-6 py-[clamp(32px,5vw,72px)] text-center">
          {x.title && <h2 className="m-h t-title">{x.title}</h2>}
          {x.text && <p className="mt-3 max-w-sm text-[length:calc(13px*var(--m-scale))] leading-relaxed">{x.text}</p>}
          {x.button && (
            <MLink to={x.link || "/catalog"} className="mt-5 inline-flex h-9 min-h-0 items-center bg-white px-4 text-[length:calc(10.5px*var(--m-scale))] font-bold uppercase tracking-[0.08em] shadow-[3px_3px_0_#E8772E] transition hover:translate-x-px hover:translate-y-px">
              {x.button}
            </MLink>
          )}
          {n > 1 && (
            <div className="mt-[clamp(20px,3vw,40px)] flex gap-2">
              {[-1, 1].map((d) => (
                <button key={d} type="button" onClick={() => setAt((i) => (i + d + n) % n)} aria-label={d < 0 ? "Previous" : "Next"} className="flex h-8 min-h-0 w-8 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-110">
                  {d < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const SCALLOP_TILES = ["#F2D16B", "#9ED9D6", "#F08A6B"];

/** Theme 33: a lilac band with a scalloped top edge, a heading, text and three coloured tiles. */
function ScallopBand({ s }: { s: Record<string, string> }) {
  const tiles = [1, 2, 3].filter((i) => s[`t${i}Image`] || s[`t${i}Label`]);
  return (
    <section className="t-scallop-top relative mt-6 bg-[#EBC9EC] pb-[clamp(36px,5vw,72px)] pt-[clamp(40px,5vw,72px)]">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="mt-3 text-[length:calc(13px*var(--m-scale))] leading-relaxed">{s.text}</p>}
        </div>
        {tiles.length > 0 && (
          <div className="m-stagger mt-[clamp(20px,3vw,40px)] grid gap-3 sm:grid-cols-3 sm:gap-4">
            {tiles.map((i, n) => (
              <MLink key={i} to={s[`t${i}Link`] || "/catalog"} className="group block overflow-hidden" style={{ background: SCALLOP_TILES[n % SCALLOP_TILES.length] }}>
                <span className="relative block aspect-[4/3] overflow-hidden">
                  {s[`t${i}Image`] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s[`t${i}Image`]} alt="" loading="lazy" className="absolute inset-[10%] h-[80%] w-[80%] border-[5px] border-white object-cover shadow-md transition-transform duration-500 group-hover:rotate-[-2deg] group-hover:scale-[1.03]" />
                  )}
                </span>
                {s[`t${i}Label`] && <span className="block px-4 pb-4 text-center text-[length:calc(12px*var(--m-scale))] font-bold uppercase tracking-[0.08em]">{s[`t${i}Label`]}</span>}
              </MLink>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

/** Theme 34: three tall photos, each with a word in script and a small title. */
function EditorialTrio({ s }: { s: Record<string, string> }) {
  const items = [1, 2, 3].filter((i) => s[`e${i}Image`]);
  if (!items.length) return null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        {s.heading && (
          <h2 className="m-h t-section mb-[clamp(20px,3vw,40px)] text-center">
            <Lines text={s.heading} />
          </h2>
        )}
        <div className="m-stagger grid gap-3 sm:grid-cols-3 sm:gap-4">
          {items.map((i) => (
            <MLink key={i} to={s[`e${i}Link`] || "/catalog"} className="group relative block aspect-[3/4] overflow-hidden bg-[var(--m-panel)] sm:aspect-[3/4.4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s[`e${i}Image`]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] group-hover:scale-[1.05]" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#2a0610]/70 via-transparent to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-5 text-center text-white">
                {s[`e${i}Script`] && <span className="t-script block text-[length:calc(clamp(30px,3.2vw,46px)*var(--m-scale))] leading-none">{s[`e${i}Script`]}</span>}
                {s[`e${i}Title`] && <span className="mt-2 block text-[length:calc(10.5px*var(--m-scale))] uppercase tracking-[0.24em]">{s[`e${i}Title`]}</span>}
              </span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Theme 34: customers write a gift message and see it on a card; it goes into their order note at checkout. */
function GiftNote({ s }: { s: Record<string, string> }) {
  const { store, editing } = useSite();
  const [note, setNote] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    try {
      setNote(sessionStorage.getItem(giftNoteKey(store.subdomain)) || "");
    } catch {
      // private browsing: start empty
    }
  }, [store.subdomain]);
  return (
    <section className="py-[clamp(40px,6vw,96px)]">
      <Container className="grid items-center gap-8 md:grid-cols-2 md:gap-[clamp(28px,5vw,80px)]">
        {s.image && (
          <div className="relative aspect-[4/4.2] overflow-hidden bg-[var(--m-panel)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        <div>
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-3 max-w-md text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          <div className="relative mt-6 rotate-[-1.5deg] border border-[#e9d9d2] bg-[#FFFBF6] px-6 py-7 shadow-[0_18px_40px_-28px_rgba(60,10,20,0.6)]">
            <span aria-hidden className="absolute right-4 top-3 text-[var(--m-accent)]">✦</span>
            <p className="t-script min-h-[3.5rem] whitespace-pre-wrap text-[length:calc(clamp(22px,2.2vw,30px)*var(--m-scale))] leading-snug text-[var(--m-accent)]">{note || "Your words, written by hand…"}</p>
          </div>
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (editing) return;
              try {
                sessionStorage.setItem(giftNoteKey(store.subdomain), note.trim());
              } catch {
                // nothing to keep it in; the note still shows on the card
              }
              setSaved(true);
            }}
          >
            <label htmlFor="gift-note" className="sr-only">
              Your gift message
            </label>
            <textarea
              id="gift-note"
              value={note}
              maxLength={200}
              rows={3}
              onChange={(e) => {
                setNote(e.target.value);
                setSaved(false);
              }}
              placeholder="Happy birthday, love! Can't wait to celebrate…"
              className="m-line w-full resize-none border bg-white px-4 py-3 text-[16px] outline-none focus:border-[var(--m-accent)]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={!note.trim()} className="m-btn min-h-11 px-6 disabled:opacity-40">
                {s.buttonLabel || "Save my note"}
              </button>
              <span className="m-muted text-[length:calc(12px*var(--m-scale))]">
                {saved ? (
                  <span className="inline-flex items-center gap-1.5 text-[var(--m-accent)]">
                    <Check className="h-4 w-4" /> Saved. It&apos;s added to your order note at checkout.
                  </span>
                ) : (
                  `${note.length}/200`
                )}
              </span>
            </div>
          </form>
        </div>
      </Container>
    </section>
  );
}

/** Theme 34: a band in the accent colour with a wavy top edge, a heading in script and capitals, and an email sign-up. */
function WaveSignup({ s }: { s: Record<string, string> }) {
  const { store, editing, demo } = useSite();
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);
  return (
    <section className="t-wave-top relative mt-10 bg-[var(--m-accent)] pb-[clamp(44px,6vw,88px)] pt-[clamp(48px,6vw,96px)] text-[var(--m-accent-text)]">
      <Container className="text-center">
        <Sparkle className="mx-auto h-5 w-5" />
        {s.eyebrow && <p className="t-script mt-2 text-[length:calc(clamp(34px,4vw,56px)*var(--m-scale))] leading-none">{s.eyebrow}</p>}
        <h2 className="m-h m-display t-hero -mt-1 tracking-[0.04em]">
          <Lines text={s.heading} />
        </h2>
        <ArrowDown className="mx-auto mt-3 h-4 w-4 opacity-80" strokeWidth={1.4} />
        {s.text && <p className="mx-auto mt-5 max-w-md text-[length:calc(13px*var(--m-scale))] opacity-85">{s.text}</p>}
        {done ? (
          <p className="mt-6 inline-flex items-center gap-2 text-[length:calc(13px*var(--m-scale))]">
            <Check className="h-4 w-4" /> Welcome to the list.
          </p>
        ) : (
          <form
            className="mx-auto mt-6 flex max-w-sm items-center border border-current/60"
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
              placeholder="Email"
              aria-label="Your email"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] outline-none placeholder:text-current placeholder:opacity-60"
            />
            <button type="submit" aria-label="Join" className="flex h-11 min-h-0 w-11 shrink-0 items-center justify-center transition hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}

const PROMO_TINTS = ["#FFC56B", "#F1F1F1", "#E9E3FB"];

/** Theme 35: three soft-coloured cards, each with a small line, a heading, a button and a photo. */
function PromoTrio({ s }: { s: Record<string, string> }) {
  const cards = [1, 2, 3].filter((i) => s[`c${i}Title`]);
  if (!cards.length) return null;
  return (
    <section className="py-[clamp(24px,3.6vw,56px)]">
      <Container className="m-stagger grid gap-3 sm:gap-4 md:grid-cols-3">
        {cards.map((i, n) => (
          <MLink key={i} to={s[`c${i}Link`] || "/catalog"} className="group relative flex min-h-[clamp(180px,16vw,230px)] items-center overflow-hidden rounded-[var(--m-card)]" style={{ background: PROMO_TINTS[n % PROMO_TINTS.length] }}>
            {s[`c${i}Image`] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s[`c${i}Image`]} alt="" loading="lazy" className="absolute inset-y-0 right-0 h-full w-[52%] object-cover transition duration-700 [mask-image:linear-gradient(to_right,transparent,#000_35%)] group-hover:scale-[1.05]" />
            )}
            <div className="relative w-[58%] p-[clamp(16px,2vw,26px)] text-[#1E1E1E]">
              {s[`c${i}Eyebrow`] && <p className="text-[length:calc(9.5px*var(--m-scale))] font-semibold uppercase tracking-[0.08em]">{s[`c${i}Eyebrow`]}</p>}
              <p className="m-h mt-1.5 text-[length:calc(clamp(18px,1.8vw,24px)*var(--m-scale))] leading-tight">{s[`c${i}Title`]}</p>
              {s[`c${i}Button`] && <span className="mt-4 inline-flex h-8 items-center rounded-full bg-[var(--m-accent)] px-4 text-[length:calc(11px*var(--m-scale))] font-semibold text-[var(--m-accent-text)]">{s[`c${i}Button`]}</span>}
            </div>
          </MLink>
        ))}
      </Container>
    </section>
  );
}

/** Theme 35: round photo buttons for each pet; the products for the chosen one show under them. */
function PetPicker({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const pets = [1, 2, 3, 4].map((i) => ({ i, name: s[`p${i}Name`], image: s[`p${i}Image`], term: s[`p${i}Term`] || s[`p${i}Name`] || "" })).filter((p) => p.name);
  const [pick, setPick] = React.useState(0);
  if (!pets.length) return null;
  const cur = pets[Math.min(pick, pets.length - 1)];
  const catName = (slug: string) => (store.categories || []).find((c) => c.slug === slug)?.name || "";
  const safe = cur.term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const word = new RegExp(`\\b${safe}(s)?\\b`, "i");
  const products = safe ? visibleProducts(store).filter((p) => word.test(`${p.title} ${p.description} ${catName(p.category)}`)).slice(0, 4) : [];
  return (
    <section className="m-panel py-[clamp(40px,6vw,96px)]">
      <Container>
        <h2 className="m-h t-section text-center">
          <Lines text={s.heading} />
        </h2>
        <div className="mt-[clamp(18px,2.6vw,32px)] flex justify-center gap-[clamp(14px,3vw,40px)]" role="tablist">
          {pets.map((p, n) => (
            <button key={p.i} type="button" role="tab" aria-selected={n === pick} onClick={() => setPick(n)} className="group flex min-h-0 flex-col items-center gap-2">
              <span className={cn("relative block h-[clamp(64px,7vw,96px)] w-[clamp(64px,7vw,96px)] overflow-hidden rounded-full ring-offset-4 ring-offset-[var(--m-panel)] transition", n === pick ? "ring-[3px] ring-[var(--m-accent)]" : "opacity-75 ring-1 ring-black/10 group-hover:opacity-100")}>
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                )}
              </span>
              <span className={cn("text-[length:calc(13px*var(--m-scale))] font-semibold", n === pick && "text-[var(--m-accent)]")}>{p.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-[clamp(22px,3vw,40px)]">
          {products.length ? (
            <div key={pick} className="m-page grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="m-muted py-6 text-center text-[length:calc(13px*var(--m-scale))]">Nothing for {cur.name.toLowerCase()} just yet.</p>
          )}
          {s.buttonLabel && (
            <div className="mt-8 text-center">
              <MLink to={`/search?q=${encodeURIComponent(cur.term)}`} className="m-btn min-h-10 px-7">
                {s.buttonLabel}
              </MLink>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Theme 35: the categories on square tiles of soft colours, with the name under each. */
function PastelTiles({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const cats = shoppableCategories(store).slice(0, 6);
  if (!cats.length) return null;
  return (
    <section className="py-[clamp(36px,5vw,80px)]">
      <Container>
        {s.heading && (
          <h2 className="m-h t-section mb-[clamp(18px,2.6vw,36px)] text-center">
            <Lines text={s.heading} />
          </h2>
        )}
        <div className={cn("m-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4", cats.length === 6 ? "lg:grid-cols-6" : cats.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          {cats.map((c, i) => (
            <MLink key={c.id} to={`/category/${c.slug}`} className="group block text-center">
              <span className="relative block aspect-square overflow-hidden rounded-[var(--m-card)] p-3" style={{ background: TINTS[i % TINTS.length] }}>
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" loading="lazy" className="h-full w-full rounded-[calc(var(--m-card)-4px)] object-cover transition duration-500 group-hover:scale-[1.06]" />
                )}
              </span>
              <span className="mt-2.5 block text-[length:calc(13px*var(--m-scale))] font-semibold group-hover:text-[var(--m-accent)]">{c.name}</span>
            </MLink>
          ))}
        </div>
      </Container>
    </section>
  );
}

function SectionBody({ section }: { section: SiteSection }) {
  const s = section.settings;
  switch (section.type) {
    case "hero":
      return <Hero s={s} />;
    case "collection-split":
      return <CollectionSplit s={s} />;
    case "product-row":
      return <ProductRow s={s} />;
    case "banners":
      return <Banners />;
    case "categories":
      return <Categories s={s} />;
    case "category-circles":
      return <CategoryCircles s={s} />;
    case "collection-grid":
      return <CollectionGrid s={s} />;
    case "promo-cards":
      return <PromoCards s={s} />;
    case "statement":
      return <Statement s={s} />;
    case "reviews":
      return <Reviews s={s} />;
    case "features":
      return <Features s={s} />;
    case "feature-cards":
      return <FeatureCards s={s} />;
    case "gallery":
      return <Gallery s={s} />;
    case "quote":
      return <Quote s={s} />;
    case "story-split":
      return <StorySplit s={s} />;
    case "image-text":
      return <ImageText s={s} />;
    case "marquee":
      return <Marquee s={s} />;
    case "newsletter":
      return <Newsletter s={s} />;
    case "category-cards":
      return <CategoryCards s={s} />;
    case "offer-split":
      return <OfferSplit s={s} />;
    case "perks":
      return <Perks s={s} />;
    case "about-split":
      return <AboutSplit s={s} />;
    case "category-rows":
      return <CategoryRows s={s} />;
    case "collection-tiles":
      return <CollectionTiles s={s} />;
    case "brand-story":
      return <BrandStory s={s} />;
    case "contact-block":
      return <ContactBlock s={s} />;
    case "collection-feature":
      return <CollectionFeature s={s} />;
    case "stories":
      return <Stories s={s} />;
    case "look-cards":
      return <LookCards s={s} />;
    case "colour-chips":
      return <ColourChips s={s} />;
    case "testimonial":
      return <Testimonial s={s} />;
    case "why-stats":
      return <WhyStats s={s} />;
    case "category-panels":
      return <CategoryPanels s={s} />;
    case "featured-product":
      return <FeaturedProduct s={s} />;
    case "promo-banner":
      return <PromoBanner s={s} />;
    case "brand-strip":
      return <BrandStrip s={s} />;
    case "category-spotlight":
      return <CategorySpotlight s={s} />;
    case "custom-order":
      return <CustomOrder s={s} />;
    case "claims-strip":
      return <ClaimsStrip s={s} />;
    case "product-spotlight":
      return <ProductSpotlight s={s} />;
    case "steps":
      return <Steps s={s} />;
    case "faq":
      return <Faq s={s} />;
    case "highlights":
      return <Highlights s={s} />;
    case "facts":
      return <Facts s={s} />;
    case "category-tints":
      return <CategoryTints s={s} />;
    case "sale-banner":
      return <SaleBanner s={s} />;
    case "photo-cta":
      return <PhotoCta s={s} />;
    case "gradient-statement":
      return <GradientStatement s={s} />;
    case "wordmark-feature":
      return <WordmarkFeature s={s} />;
    case "tag-cloud":
      return <TagCloud s={s} />;
    case "bento-benefits":
      return <BentoBenefits s={s} />;
    case "category-strip":
      return <CategoryStrip s={s} />;
    case "edge-tiles":
      return <EdgeTiles s={s} />;
    case "engraving":
      return <Engraving s={s} />;
    case "type-collage":
      return <TypeCollage s={s} />;
    case "collection-slider":
      return <CollectionSlider s={s} />;
    case "guide-row":
      return <GuideRow s={s} />;
    case "duo-promo":
      return <DuoPromo s={s} />;
    case "offset-pair":
      return <OffsetPair s={s} />;
    case "scent-quiz":
      return <ScentQuiz s={s} />;
    case "countdown-deals":
      return <CountdownDeals s={s} />;
    case "spotlight-cards":
      return <SpotlightCards s={s} />;
    case "review-spotlight":
      return <ReviewSpotlight s={s} />;
    case "menu-board":
      return <MenuBoard s={s} />;
    case "tilt-gallery":
      return <TiltGallery s={s} />;
    case "combo-builder":
      return <ComboBuilder s={s} />;
    case "stage":
      return <Stage s={s} />;
    case "story-card":
      return <StoryCard s={s} />;
    case "collection-collage":
      return <CollectionCollage s={s} />;
    case "mission-band":
      return <MissionBand s={s} />;
    case "impact":
      return <Impact s={s} />;
    case "occasion-mosaic":
      return <OccasionMosaic s={s} />;
    case "promise-icons":
      return <PromiseIcons s={s} />;
    case "popular-searches":
      return <PopularSearches s={s} />;
    case "weave-guide":
      return <WeaveGuide s={s} />;
    case "heritage-trio":
      return <HeritageTrio s={s} />;
    case "craft-timeline":
      return <CraftTimeline s={s} />;
    case "collection-circles":
      return <CollectionCircles s={s} />;
    case "feature-duo":
      return <FeatureDuo s={s} />;
    case "coupon-banner":
      return <CouponBanner s={s} />;
    case "drape-styles":
      return <DrapeStyles s={s} />;
    case "story-rings":
      return <StoryRings s={s} />;
    case "label-tiles":
      return <LabelTiles s={s} />;
    case "offer-band":
      return <OfferBand s={s} />;
    case "budget-picker":
      return <BudgetPicker s={s} />;
    case "size-finder":
      return <SizeFinder s={s} />;
    case "look-trio":
      return <LookTrio s={s} />;
    case "room-shop":
      return <RoomShop s={s} />;
    case "circle-tints":
      return <CircleTints s={s} />;
    case "feature-slider":
      return <FeatureSlider s={s} />;
    case "scallop-band":
      return <ScallopBand s={s} />;
    case "editorial-trio":
      return <EditorialTrio s={s} />;
    case "gift-note":
      return <GiftNote s={s} />;
    case "wave-signup":
      return <WaveSignup s={s} />;
    case "promo-trio":
      return <PromoTrio s={s} />;
    case "pet-picker":
      return <PetPicker s={s} />;
    case "pastel-tiles":
      return <PastelTiles s={s} />;
  }
}

export function SiteHome({ selectedId }: { selectedId?: string }) {
  const { content, editing, store } = useSite();
  const sections = content.sections.filter((s) => !s.hidden);
  const hasProducts = store.products.some((p) => p.status === "published");
  return (
    <div>
      {sections.map((section, i) => (
        <div
          key={section.id}
          data-editor-section={section.id}
          data-reveal={i > 0 ? "" : undefined}
          data-selected={editing && selectedId === section.id}
          style={{ "--m-hs": String(headingScale(section.settings.headingSize)) } as React.CSSProperties}
          onClickCapture={
            editing
              ? (e) => {
                  // in the editor a click picks the section instead of following links
                  e.preventDefault();
                  e.stopPropagation();
                  window.parent.postMessage({ source: "shopersite-preview", type: "select", id: section.id }, window.location.origin);
                }
              : undefined
          }
          aria-label={editing ? SITE_SECTION_TYPES[section.type].label : undefined}
        >
          <SectionBody section={section} />
        </div>
      ))}
      {!hasProducts && !editing && (
        <Container className="py-16 text-center">
          <p className="m-muted text-[length:calc(14px*var(--m-scale))]">New products are coming soon.</p>
        </Container>
      )}
    </div>
  );
}
