"use client";

import * as React from "react";
import type { StoreData } from "@/lib/store-service";
import { SITE_CONDENSED_FONTS, fontStack, themeKeyOf, toSiteTheme } from "@/lib/site-content";
import { getTheme } from "@/lib/themes";
import { demoStoreFor } from "@/lib/demo-store";
import { SiteProvider, useSite } from "./context";
import { SiteFooter, SiteHeader, SiteToast } from "./shell";
import { SiteHome } from "./home";
import { SiteCatalog } from "./catalog";
import { SiteProduct } from "./product";
import { SiteCart, SiteCheckout } from "./checkout";
import { SiteAccount, SiteInfoPage, SiteOrder } from "./account";
import { Container, EmptyState } from "./ui";

export type SiteView =
  | { name: "home" }
  | { name: "catalog"; slug?: string; query?: string }
  | { name: "product"; slug: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "order"; token: string }
  | { name: "account" }
  | { name: "page"; id: string }
  | { name: "missing" };

/** Which page of the theme a path inside the shop ("/products/tee", "/cart"…) shows. */
export function siteViewFor(path: string, query: string | null): SiteView {
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const [a, b] = parts;
  if (!a) return { name: "home" };
  if (a === "catalog" || (a === "category" && (!b || b === "all" || b === "shop"))) return { name: "catalog" };
  if (a === "category" && b) return { name: "catalog", slug: b };
  if (a === "search") return { name: "catalog", query: query || "" };
  if (a === "products" && b) return { name: "product", slug: b };
  if (a === "cart" || a === "bag") return { name: "cart" };
  if (a === "checkout") return { name: "checkout" };
  if (a === "order" && b) return { name: "order", token: b };
  if (a === "account") return { name: "account" };
  if (a === "pages" && b) return { name: "page", id: b };
  return { name: "missing" };
}

function View({ view, selectedId }: { view: SiteView; selectedId?: string }) {
  switch (view.name) {
    case "home":
      return <SiteHome selectedId={selectedId} />;
    case "catalog":
      return <SiteCatalog key={`${view.slug}-${view.query}`} slug={view.slug} query={view.query} />;
    case "product":
      return <SiteProduct slug={view.slug} />;
    case "cart":
      return <SiteCart />;
    case "checkout":
      return <SiteCheckout />;
    case "order":
      return <SiteOrder token={view.token} />;
    case "account":
      return <SiteAccount />;
    case "page":
      return <SiteInfoPage id={view.id} />;
    default:
      return (
        <Container>
          <EmptyState title="Page not found" text="This page doesn't exist or has moved." action={{ label: "Go to the shop", to: "/" }} />
        </Container>
      );
  }
}

function PreviewBar() {
  const { themeKey, store } = useSite();
  const live = themeKeyOf(store.activeThemeSlug) === themeKey;
  return (
    <div className="flex items-center justify-center gap-3 bg-[#2563eb] px-4 py-2 text-center text-[12px] font-medium text-white">
      Previewing {getTheme(themeKey).name} with sample products
      {live ? " (your live theme)" : ", buyers still see your current theme"}
      <a href={`/dashboard?tab=themes&store=${store.subdomain}`} className="rounded-full bg-white/20 px-3 py-1 font-semibold hover:bg-white/30">
        Back to themes
      </a>
    </div>
  );
}

function Frame({ view, selectedId, previewBar }: { view: SiteView; selectedId?: string; previewBar: boolean }) {
  const { content, store, editing, look, theme } = useSite();
  const s = content.settings;
  const first = content.sections.find((x) => !x.hidden);
  const overHero =
    look.header === "overlay" && view.name === "home" && first?.type === "hero" && !!first.settings.image && first.settings.imageLayout !== "column";
  const style = {
    "--m-bg": s.background,
    "--m-text": s.text,
    "--m-accent": s.accent,
    "--m-accent-text": s.accentText,
    "--m-panel": s.panel,
    // the shop's button colours, kept for cards that sit inside bands that swap the colours
    "--m-ink": s.accent,
    "--m-ink-text": s.accentText,
    "--m-head": fontStack(s.headingFont),
    "--m-display": fontStack(s.displayFont || s.headingFont),
    "--m-body": fontStack(s.bodyFont),
    "--m-radius": s.buttonShape === "square" ? "0px" : s.buttonShape === "rounded" ? "12px" : "999px",
    "--m-card": look.cardRadius,
    "--m-hw": String(look.headingWeight || 600),
    "--m-scale": String((Number(s.textSize) || 100) / 100),
  } as React.CSSProperties;

  React.useEffect(() => {
    document.title = store.name;
  }, [store.name]);

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  // sections rise in as they scroll into view; the editor shows everything at once
  const sectionCount = content.sections.length;
  React.useEffect(() => {
    if (editing) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".site [data-reveal]:not([data-shown])"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-shown", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-shown", "");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [view, editing, sectionCount]);

  return (
    <div className="site flex min-h-screen flex-col" style={style} data-theme={theme} data-upper={s.uppercaseHeadings} data-head={s.headingFont} data-display={s.displayFont} data-condensed={SITE_CONDENSED_FONTS.includes(s.displayFont) ? "yes" : "no"} data-head-condensed={SITE_CONDENSED_FONTS.includes(s.headingFont) ? "yes" : "no"} data-editing={editing}>
      {previewBar && <PreviewBar />}
      <SiteHeader overHero={overHero} />
      <main key={JSON.stringify(view)} className="m-page flex-1">
        <View view={view} selectedId={selectedId} />
      </main>
      <SiteFooter />
      <SiteToast />
    </div>
  );
}

/**
 * A shop's storefront in one of the themes. Inside the theme editor (`?editor=1` in a frame) it shows the
 * editor's unsaved content and reports clicks on sections back to the editor.
 */
export function SiteApp({
  store,
  theme,
  base,
  path,
  query,
  previewQuery,
  previewing,
  editing,
  sellerBar = true,
}: {
  store: StoreData;
  /** a built-in slug or an uploaded theme's own slug */
  theme: string;
  base: string;
  path: string;
  query: string | null;
  previewQuery: string;
  previewing: boolean;
  editing: boolean;
  /** the blue "Back to themes" bar a seller sees while previewing; the public theme marketplace has its own */
  sellerBar?: boolean;
}) {
  const [draft, setDraft] = React.useState<unknown>(undefined);
  const [selectedId, setSelectedId] = React.useState<string | undefined>();
  const view = React.useMemo(() => siteViewFor(path, query), [path, query]);
  // a dashboard preview shows the theme with its sample products; the editor and live shop use the real ones
  const shown = React.useMemo(() => (previewing ? demoStoreFor(store, toSiteTheme(theme)) : store), [previewing, store, theme]);

  React.useEffect(() => {
    if (!editing) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.source !== "shopersite-editor") return;
      if (e.data.type === "content") setDraft(e.data.content);
      if (e.data.type === "select") {
        setSelectedId(e.data.id);
        if (e.data.scroll) document.querySelector(`[data-editor-section="${CSS.escape(e.data.id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ source: "shopersite-preview", type: "ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [editing]);

  React.useEffect(() => {
    if (editing) window.parent.postMessage({ source: "shopersite-preview", type: "page", view: view.name }, window.location.origin);
  }, [editing, view.name]);

  return (
    <SiteProvider store={shown} theme={theme} base={base} draft={draft} editing={editing} demo={previewing} previewQuery={previewQuery}>
      <Frame view={view} selectedId={selectedId} previewBar={previewing && sellerBar} />
    </SiteProvider>
  );
}
