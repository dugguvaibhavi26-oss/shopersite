"use client";
import { cropImage } from "@/components/ui/image-cropper";
import { Tour, type TourStep } from "@/components/ui/tour";
import type { ProbeReport } from "@/components/storefront/site/field-probe";
import { POLICY_IDS, POLICY_INFO, type PolicyId } from "@/lib/policies";
import { appAlert, appConfirm, appPrompt } from "@/components/ui/app-dialog";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  ImageIcon,
  Type,
  Layers,
  Loader2,
  Monitor,
  Palette,
  Paintbrush,
  PanelTop,
  Plus,
  RotateCcw,
  Smartphone,
  Trash2,
  Upload,
  X,
  ExternalLink,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { storeService, type StoreData } from "@/lib/store-service";
import { cheapestPlanWith } from "@/lib/plans";
import { canEditTheme, canUseTheme } from "@/lib/theme-pricing";
import { getTheme } from "@/lib/themes";
import {
  SITE_BODY_FONTS,
  SITE_CONDENSED_FONTS,
  SITE_HEADING_FONTS,
  SITE_PAGE_IDS,
  SITE_SECTION_TYPES,
  SITE_COLOR_KEYS,
  SITE_THEME_SLUGS,
  themeKeyOf,
  toSiteTheme,
  SITE_THEME_STYLE,
  removedThemeSections,
  restoreThemeSection,
  fontStack,
  getDefaultSiteContent,
  resolveSiteContent,
  themeOptionFields,
  themeOptionDefaults,
  type SiteContent,
  type ThemeOptionField,
  type SectionField,
  type SitePageId,
  type SiteSection,
  type SiteSettings,
} from "@/lib/site-content";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { ShopperMark } from "@/components/brand/shopper-logo";
import { cn } from "@/lib/utils";

export default function ThemeEditorPage() {
  return (
    <Suspense fallback={<Hold text="Opening the editor…" />}>
      <ThemeEditor />
    </Suspense>
  );
}

function Hold({ text }: { text: string }) {
  return (
    <div className="home-sans fixed inset-0 flex flex-col items-center justify-center gap-5 bg-white px-6 font-[Inter,sans-serif]">
      <ShopperMark className="h-12 w-auto animate-pulse text-black" />
      <p className="text-[15px] font-medium text-neutral-500" role="status">
        {text}
      </p>
    </div>
  );
}

type Panel = "sections" | "theme" | "media";
type Selection =
  | { kind: "style" }
  | { kind: "header" }
  | { kind: "footer" }
  | { kind: "page"; id: SitePageId }
  | { kind: "section"; id: string }
  | { kind: "options"; group: string }
  | null;

const PREVIEW_PAGES: { path: string; label: string }[] = [
  { path: "", label: "Home" },
  { path: "/catalog", label: "Catalog" },
  { path: "/wishlist", label: "Wishlist" },
  { path: "/cart", label: "Bag" },
  { path: "/account", label: "Account" },
  { path: "/pages/about", label: "About page" },
  { path: "/pages/contact", label: "Contact page" },
];

const input =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 outline-none transition-colors focus:border-neutral-900";
const label = "mb-1.5 block text-[12px] font-semibold text-neutral-600";

function ThemeEditor() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [store, setStore] = useState<StoreData | null>(null);
  const [ready, setReady] = useState(storeService.isCloudSynced());
  const [content, setContent] = useState<SiteContent | null>(null);
  const [savedJson, setSavedJson] = useState("");
  const [panel, setPanel] = useState<Panel>("sections");
  const [selection, setSelection] = useState<Selection>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewPath, setPreviewPath] = useState("");
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  // which settings each section reads in this theme (reported by the preview); only those are offered
  const [usedFields, setUsedFields] = useState<Record<string, string[]>>({});
  // which fields this theme actually puts on the page (the preview's hidden marker test)
  const [probe, setProbe] = useState<ProbeReport | null>(null);
  const [textTip, setTextTip] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const edTour = useRef<(() => void) | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?redirect=/dashboard/editor");
  }, [authLoading, user, router]);

  useEffect(() => storeService.subscribe(() => setReady(storeService.isCloudSynced())), []);

  // the seller's shop (the one picked with ?store=, or their first)
  useEffect(() => {
    if (!user) return;
    const load = () => {
      const mine = storeService.getUserStores(user.uid, user.email || undefined);
      const wanted = search.get("store");
      setStore((wanted && mine.find((s) => s.subdomain === wanted)) || mine[0] || null);
    };
    load();
    return storeService.subscribe(load);
  }, [user, search]);

  // the theme being edited: ?theme=, or the shop's live theme
  const themeSlug = themeKeyOf(search.get("theme") || store?.activeThemeSlug);

  // start from the saved content once the shop has loaded, and again when switching theme
  const loadedFor = useRef("");
  useEffect(() => {
    if (!store) return;
    const key = `${store.subdomain}:${themeSlug}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;
    const resolved = resolveSiteContent(store.themeContent?.[themeSlug], themeSlug, store.name);
    setContent(resolved);
    setSavedJson(JSON.stringify(resolved));
    setSelection(null);
    setUsedFields({});
    setProbe(null);
  }, [store, themeSlug]);

  const dirty = !!content && JSON.stringify(content) !== savedJson;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      // already confirmed in our own dialog: don't ask a second time with the browser's box
      if (leaving.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Free plan: only the Media section (change the theme's photos); Growth and Pro get the full editor
  const mediaOnly = !!store && !canEditTheme(store, themeSlug) && canUseTheme(store, themeSlug);
  const mediaOnlyRef = useRef(mediaOnly);
  mediaOnlyRef.current = mediaOnly;
  useEffect(() => {
    if (mediaOnly) setPanel("media");
  }, [mediaOnly]);

  // send the unsaved content to the preview whenever it changes
  const post = useCallback((msg: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ source: "shopersite-editor", ...msg }, window.location.origin);
  }, []);
  useEffect(() => {
    if (content) post({ type: "content", content });
  }, [content, post]);
  useEffect(() => {
    post({ type: "select", id: selection?.kind === "section" ? selection.id : undefined, scroll: true });
  }, [selection, post]);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.source !== "shopersite-preview") return;
      if (e.data.type === "ready" && content) {
        post({ type: "content", content });
        if (selection?.kind === "section") post({ type: "select", id: selection.id });
      }
      if (e.data.type === "select") {
        if (mediaOnlyRef.current) return;
        setPanel("sections");
        setSelection({ kind: "section", id: e.data.id });
        setMobilePane("edit");
      }
      if (e.data.type === "fields" && typeof e.data.id === "string" && Array.isArray(e.data.keys)) {
        const keys = (e.data.keys as unknown[]).filter((k): k is string => typeof k === "string").slice(0, 200);
        // the latest report replaces the last one (fields read by an older draw don't stay)
        setUsedFields((u) => {
          const before = u[e.data.id] || [];
          return before.length === keys.length && keys.every((k) => before.includes(k)) ? u : { ...u, [e.data.id]: keys };
        });
      }
      if (!mediaOnlyRef.current && e.data.type === "text" && typeof e.data.id === "string" && typeof e.data.key === "string" && typeof e.data.value === "string") {
        const { id, key, value } = e.data as { id: string; key: string; value: string };
        setContent((c) =>
          c ? { ...c, sections: c.sections.map((x) => (x.id === id && key in x.settings ? { ...x, settings: { ...x.settings, [key]: value.slice(0, 4000) } } : x)) } : c
        );
        setTextTip("");
      }
      if (e.data.type === "probe" && e.data.report && typeof e.data.report === "object") {
        const r = e.data.report as ProbeReport;
        if (r.sections && Array.isArray(r.header) && Array.isArray(r.footer)) setProbe(r);
      }
      if (e.data.type === "text-miss") setTextTip("That text comes from your products or settings. Change it there, or pick the section to edit its fields.");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [content, selection, post]);

  if (authLoading || !user || (!store && !ready)) return <Hold text="Opening the editor…" />;
  if (!store) {
    return <Hold text="Create a shop first to edit its website." />;
  }

  const dashboardHref = `/dashboard?tab=themes&store=${store.subdomain}`;

  if (!canEditTheme(store, themeSlug) && !mediaOnly) {
    const plan = cheapestPlanWith("themeEditor");
    return (
      <div className="home-sans min-h-screen bg-neutral-100 px-4 py-6 font-[Inter,sans-serif] sm:py-12">
        <div className="mx-auto max-w-xl">
          <Link href={dashboardHref} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-black">
            <ArrowLeft className="h-4 w-4" /> Back to themes
          </Link>
          <LockedFeature
            title="Edit your website"
            text="Change every heading, photo, button and colour on your shop, move sections around and write your own pages. Buy this theme to edit it on any plan, or edit every theme you use on a paid plan."
            planLabel={`${plan?.name || "Growth"} and Pro`}
            perks={[
              { icon: Paintbrush, title: "Your words and photos", text: "Edit the hero, collections, banners and more" },
              { icon: Layers, title: "Arrange your homepage", text: "Add, hide and reorder sections" },
              { icon: Palette, title: "Colours and fonts", text: "Match the shop to your brand" },
            ]}
            preview={
              <div className="grid h-full grid-cols-[110px_1fr] gap-3">
                <div className="space-y-2 rounded-xl bg-white/10 p-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-5 rounded bg-white/20" />
                  ))}
                </div>
                <div className="rounded-xl bg-white/80" />
              </div>
            }
            ctaLabel={`Upgrade to ${plan?.name || "Growth"}`}
            onUpgrade={() => router.push(`/dashboard?tab=billing&store=${store.subdomain}`)}
          />
        </div>
      </div>
    );
  }

  if (!content) return <Hold text="Opening the editor…" />;

  const isLive = themeKeyOf(store.activeThemeSlug) === themeSlug;
  const sections = content.sections;
  const selectedSection = selection?.kind === "section" ? sections.find((s) => s.id === selection.id) : undefined;

  const update = (fn: (c: SiteContent) => SiteContent) => setContent((c) => (c ? fn(c) : c));
  const setSection = (id: string, fn: (s: SiteSection) => SiteSection) =>
    update((c) => ({ ...c, sections: c.sections.map((s) => (s.id === id ? fn(s) : s)) }));
  const move = (from: number, to: number) =>
    update((c) => {
      if (to < 0 || to >= c.sections.length) return c;
      const list = [...c.sections];
      const [it] = list.splice(from, 1);
      list.splice(to, 0, it);
      return { ...c, sections: list };
    });
  // only the theme's own sections that were removed can be added back
  const removed = removedThemeSections(content, themeSlug, store.name);
  // settings only this theme has, one sidebar row per group
  const optionGroups: { group: string; fields: ThemeOptionField[] }[] = [];
  for (const f of themeOptionFields(themeSlug)) {
    const g = optionGroups.find((x) => x.group === f.group) || (optionGroups.push({ group: f.group, fields: [] }), optionGroups[optionGroups.length - 1]);
    g.fields.push(f);
  }
  const addSection = (id: string) => {
    update((c) => restoreThemeSection(c, themeSlug, id, store.name));
    setSelection({ kind: "section", id });
    setAdding(false);
  };

  const save = () => {
    setSaving(true);
    try {
      storeService.updateStore(store.subdomain, {
        themeContent: { ...(store.themeContent || {}), [themeSlug]: JSON.parse(JSON.stringify(content)) },
      });
      setSavedJson(JSON.stringify(content));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  const makeLive = () => {
    const res = storeService.setStoreTheme(store.subdomain, themeSlug);
    if (!res.success) appAlert(res.error);
  };

  const previewSrc = `/s/${store.subdomain}${previewPath}?preview_theme=${themeSlug}&editor=1`;

  return (
    <div className="home-sans fixed inset-0 flex flex-col bg-neutral-100 font-[Inter,sans-serif] text-neutral-900">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-2 sm:px-4">
        <Link
          href={dashboardHref}
          onClick={(e) => {
            if (dirty) {
              e.preventDefault();
              const href = (e.currentTarget as HTMLAnchorElement).href;
              appConfirm("Your changes aren't saved yet. Leave without saving?", { title: "Unsaved changes", okLabel: "Leave", cancelLabel: "Stay", danger: true }).then((go) => {
                if (!go) return;
                leaving.current = true;
                window.location.href = href;
              });
            }
          }}
          className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Exit</span>
        </Link>
        <div className="min-w-0 border-l border-neutral-200 pl-3">
          <p className="truncate text-[13px] font-semibold leading-tight">{store.name}</p>
          <select
            data-tour="ed-theme"
            value={themeSlug}
            aria-label="Theme to edit"
            onChange={async (e) => {
              if (dirty && !(await appConfirm("Your changes to this theme aren't saved yet. Switch without saving?", { title: "Unsaved changes", okLabel: "Switch", cancelLabel: "Stay" }))) return;
              router.replace(`/dashboard/editor?store=${store.subdomain}&theme=${e.target.value}`);
            }}
            className="-ml-1 max-w-[11rem] truncate bg-transparent text-[11px] text-neutral-500 outline-none"
          >
            {SITE_THEME_SLUGS.map((t) => (
              <option key={t} value={t}>
                {getTheme(t).name}
                {toSiteTheme(store.activeThemeSlug) === t ? " (live)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mx-auto hidden items-center gap-2 md:flex">
          <select
            data-tour="ed-page"
            value={previewPath}
            onChange={(e) => setPreviewPath(e.target.value)}
            aria-label="Page to preview"
            className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-[13px] font-medium outline-none"
          >
            {PREVIEW_PAGES.map((p) => (
              <option key={p.path} value={p.path}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl bg-neutral-100 p-1" data-tour="ed-device">
            {(
              [
                ["desktop", Monitor, "Desktop"],
                ["mobile", Smartphone, "Phone"],
              ] as const
            ).map(([d, Icon, name]) => (
              <button
                key={d}
                type="button"
                aria-label={`${name} preview`}
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={cn("flex h-7 w-9 items-center justify-center rounded-lg", device === d ? "bg-white shadow-sm" : "text-neutral-500")}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <a
            href={`/s/${store.subdomain}?preview_theme=${themeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 sm:flex"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View
          </a>
          <button
            type="button"
            onClick={() => edTour.current?.()}
            aria-label="Show me how the editor works"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-tour="ed-save"
            onClick={save}
            disabled={!dirty || saving}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-black px-4 text-[13px] font-semibold text-white transition-opacity disabled:opacity-35"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : justSaved ? <Check className="h-3.5 w-3.5" /> : null}
            {justSaved ? "Saved" : "Save"}
          </button>
        </div>
      </header>
      <Tour id="theme-editor" startRef={edTour} steps={EDITOR_TOUR} />

      {!isLive && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-50 px-4 py-2 text-center text-[12px] text-amber-900">
          {getTheme(themeSlug).name} isn&apos;t your live theme yet. You can edit and save it now.
          <button type="button" onClick={makeLive} className="font-semibold underline underline-offset-2">
            Make it live
          </button>
        </div>
      )}

      {/* phones: switch between editing and the preview */}
      <div className="flex shrink-0 gap-1 border-b border-neutral-200 bg-white p-1.5 md:hidden">
        {(["edit", "preview"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setMobilePane(p)}
            className={cn("h-9 flex-1 rounded-lg text-[13px] font-semibold", mobilePane === p ? "bg-black text-white" : "text-neutral-500")}
          >
            {p === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* sidebar */}
        <aside className={cn("flex w-full shrink-0 flex-col border-r border-neutral-200 bg-white md:flex md:w-[360px]", mobilePane === "edit" ? "flex" : "hidden")}>
          <nav className="flex shrink-0 gap-1 border-b border-neutral-200 p-2" aria-label="Editor panels" data-tour="ed-panels">
            {(mediaOnly
              ? ([["media", ImageIcon, "Media"]] as const)
              : ([
                  ["sections", Layers, "Sections"],
                  ["theme", Palette, "Theme colours"],
                ] as const)
            ).map(([id, Icon, name]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPanel(id);
                  setSelection(null);
                }}
                className={cn(
                  "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold",
                  panel === id ? "bg-neutral-100 text-black" : "text-neutral-500 hover:text-black"
                )}
              >
                <Icon className="h-4 w-4" /> {name}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {panel === "media" && (
              <div className="space-y-5 p-4">
                <div className="rounded-xl bg-neutral-950 p-3.5 text-white">
                  <p className="text-[13px] font-semibold">Change your theme&apos;s photos</p>
                  <p className="mt-0.5 text-[12px] text-white/60">Edit text, sections and colours on Growth.</p>
                  <button type="button" onClick={() => router.push(`/dashboard?tab=billing&store=${store.subdomain}`)} className="mt-2.5 h-8 rounded-lg bg-white px-3 text-[12px] font-semibold text-neutral-950">
                    Try Growth free
                  </button>
                </div>
                {sections
                  .filter((sec) => !sec.hidden)
                  .map((sec) => {
                    const images = SITE_SECTION_TYPES[sec.type].fields.filter((f) => f.kind === "image" && !f.design && fieldShown(f, sec.id, probe, usedFields));
                    if (!images.length) return null;
                    return (
                      <div key={sec.id}>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{SITE_SECTION_TYPES[sec.type].label}</p>
                        <SectionFields
                          fields={images}
                          settings={sec.settings}
                          store={store}
                          onChange={(patch) => setSection(sec.id, (x) => ({ ...x, settings: { ...x.settings, ...patch } }))}
                        />
                      </div>
                    );
                  })}
                {!sections.some((sec) => !sec.hidden && SITE_SECTION_TYPES[sec.type].fields.some((f) => f.kind === "image" && !f.design)) && (
                  <p className="text-[13px] text-neutral-500">This theme takes its photos from your products. Add product photos in Products.</p>
                )}
              </div>
            )}

            {panel === "sections" && !selection && (
              <div className="p-3">
                <SidebarRow icon={Type} title="Text, buttons & photos" subtitle={`Text size ${content.settings.textSize}% · ${content.settings.headingFont}`} onClick={() => setSelection({ kind: "style" })} />
                <SidebarRow icon={PanelTop} title="Header" subtitle="Announcement and menu" onClick={() => setSelection({ kind: "header" })} />
                {optionGroups.map((g) => (
                  <SidebarRow
                    key={g.group}
                    icon={Paintbrush}
                    title={g.group}
                    subtitle={`Only in ${getTheme(themeSlug).name}`}
                    onClick={() => {
                      setSelection({ kind: "options", group: g.group });
                      // settings for one page (About, Contact) show that page in the preview
                      const page = g.fields.find((f) => f.page)?.page;
                      if (page) setPreviewPath(page);
                    }}
                  />
                ))}
                <p className="px-2 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Homepage</p>
                <ul className="space-y-1">
                  {sections.map((s, i) => (
                    <SectionRow
                      key={s.id}
                      section={s}
                      index={i}
                      count={sections.length}
                      onOpen={() => setSelection({ kind: "section", id: s.id })}
                      onMove={move}
                      onToggle={() => setSection(s.id, (x) => ({ ...x, hidden: !x.hidden }))}
                    />
                  ))}
                </ul>
                {adding && removed.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-neutral-200 p-2">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <p className="text-[13px] font-semibold">Add back a section</p>
                      <button type="button" aria-label="Close" onClick={() => setAdding(false)} className="text-neutral-400 hover:text-black">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {removed.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => addSection(r.id)}
                        className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-neutral-50"
                      >
                        <span className="block text-[13px] font-semibold">{SITE_SECTION_TYPES[r.type].label}</span>
                        <span className="block truncate text-[12px] text-neutral-500">
                          {(r.settings.heading?.split("\n")[0] || r.settings.text?.slice(0, 40) || SITE_SECTION_TYPES[r.type].description).replace(/\*/g, "")}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : removed.length === 0 ? (
                  <p className="mt-3 px-2 text-[12px] text-neutral-400">Sections you remove from this theme can be added back here.</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 text-[13px] font-semibold text-neutral-600 hover:border-black hover:text-black"
                  >
                    <Plus className="h-4 w-4" /> Add section
                  </button>
                )}
                <div className="mt-5">
                  <SidebarRow icon={PanelTop} title="Footer" subtitle="About text and newsletter" onClick={() => setSelection({ kind: "footer" })} />
                </div>
                <p className="px-2 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Pages</p>
                {SITE_PAGE_IDS.map((id) => (
                  <SidebarRow
                    key={id}
                    icon={FileText}
                    title={content.pages[id].title}
                    subtitle={content.pages[id].body.split("\n")[0]}
                    onClick={() => {
                      setSelection({ kind: "page", id });
                      setPreviewPath(`/pages/${id}`);
                    }}
                  />
                ))}
                <p className="px-2 pt-5 text-[12px] leading-relaxed text-neutral-400">
                  Products, categories, banners and coupons come from your dashboard. Tap a section in the preview to edit it.
                </p>
              </div>
            )}

            {panel === "sections" && selection?.kind === "header" && (
              <Pane title="Header" onBack={() => setSelection(null)}>
                {(!probe || probe.header.includes("announcement")) && (
                  <Field label="Announcement bar" help="Leave empty to use the announcement from Settings, or none.">
                    <input className={input} value={content.announcement} maxLength={200} onChange={(e) => update((c) => ({ ...c, announcement: e.target.value }))} />
                  </Field>
                )}
                {(
                  [
                    ["homeLabel", "Home menu name"],
                    ["catalogLabel", "Catalog menu name"],
                    ["saleLabel", "Sale menu name"],
                    ["shopAllLabel", "All products menu name"],
                    ["aboutLabel", "About menu name"],
                    ["contactLabel", "Contact menu name"],
                    ["searchLabel", "Search button word"],
                    ["bagLabel", "Bag button word"],
                    ["accountLabel", "Account button word"],
                    ["wishlistLabel", "Wishlist button and page name"],
                    ["ordersLabel", "Orders menu name"],
                    ["searchPlaceholder", "Search box text"],
                    ["ctaLabel", "Highlighted menu link (optional)"],
                  ] as const
                ).filter(([k]) => !probe || probe.header.includes(k)).map(([k, l]) => (
                  <Field key={k} label={l}>
                    <input className={input} value={content.header[k]} maxLength={40} onChange={(e) => update((c) => ({ ...c, header: { ...c.header, [k]: e.target.value } }))} />
                  </Field>
                ))}
                {content.header.ctaLabel && (!probe || probe.header.includes("ctaLink")) && (
                  <LinkField label="Highlighted link goes to" store={store} value={content.header.ctaLink} onChange={(v) => update((c) => ({ ...c, header: { ...c.header, ctaLink: v } }))} />
                )}
                <p className="text-[12px] text-neutral-400">Your shop name and logo come from Settings.</p>
              </Pane>
            )}

            {panel === "sections" && selection?.kind === "options" && (
              <Pane title={selection.group} onBack={() => setSelection(null)}>
                <ThemeOptions
                  fields={optionGroups.find((g) => g.group === selection.group)?.fields || []}
                  values={content.options}
                  onChange={(key, value) => update((c) => ({ ...c, options: { ...c.options, [key]: value } }))}
                />
                <button
                  type="button"
                  onClick={() =>
                    update((c) => {
                      const d = themeOptionDefaults(themeSlug);
                      const keys = (optionGroups.find((g) => g.group === selection.group)?.fields || []).map((f) => f.key);
                      return { ...c, options: { ...c.options, ...Object.fromEntries(keys.map((k) => [k, d[k]])) } };
                    })
                  }
                  className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-black"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Back to the theme&apos;s settings
                </button>
              </Pane>
            )}

            {panel === "sections" && selection?.kind === "footer" && (
              <Pane title="Footer" onBack={() => setSelection(null)}>
                {(!probe || probe.footer.includes("about")) && (
                  <Field label="About your shop">
                    <textarea className={input} rows={4} value={content.footer.about} maxLength={400} onChange={(e) => update((c) => ({ ...c, footer: { ...c.footer, about: e.target.value } }))} />
                  </Field>
                )}
                {(!probe || probe.footer.includes("newsletterHeading")) && (
                  <Field label="Newsletter heading">
                    <input className={input} value={content.footer.newsletterHeading} maxLength={60} onChange={(e) => update((c) => ({ ...c, footer: { ...c.footer, newsletterHeading: e.target.value } }))} />
                  </Field>
                )}
                {(!probe || probe.footer.includes("copyright")) && (
                  <Field label="Copyright line">
                    <input className={input} value={content.footer.copyright} maxLength={80} onChange={(e) => update((c) => ({ ...c, footer: { ...c.footer, copyright: e.target.value } }))} />
                  </Field>
                )}
                <p className="text-[12px] text-neutral-400">Instagram, WhatsApp and email links come from Settings.</p>
              </Pane>
            )}

            {panel === "sections" && selectedSection && (
              <Pane title={SITE_SECTION_TYPES[selectedSection.type].label} onBack={() => setSelection(null)}>
                {(() => {
                  const all = SITE_SECTION_TYPES[selectedSection.type].fields.filter((f) => !f.design);
                  const shown = all.filter((f) => fieldShown(f, selectedSection.id, probe, usedFields));
                  return (
                    <>
                      {shown.length < all.length && (
                        <p className="rounded-xl bg-neutral-50 px-3 py-2.5 text-[12px] leading-relaxed text-neutral-500">
                          Showing only what this theme shows. Tip: double-click any text in the preview to type over it.
                        </p>
                      )}
                      {shown.length === 0 && <p className="text-[13px] text-neutral-500">This section fills itself from your products and categories.</p>}
                    </>
                  );
                })()}
                <SectionFields
                  key={selectedSection.id}
                  fields={SITE_SECTION_TYPES[selectedSection.type].fields.filter((f) => !f.design && fieldShown(f, selectedSection.id, probe, usedFields))}
                  settings={selectedSection.settings}
                  store={store}
                  onChange={(patch) => setSection(selectedSection.id, (s) => ({ ...s, settings: { ...s.settings, ...patch } }))}
                />
                <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setSection(selectedSection.id, (s) => ({ ...s, hidden: !s.hidden }))}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 text-[13px] font-medium hover:border-black"
                  >
                    {selectedSection.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {selectedSection.hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!(await appConfirm("You can add it back later with Add section.", { title: "Remove this section?", okLabel: "Remove", danger: true }))) return;
                      update((c) => ({ ...c, sections: c.sections.filter((s) => s.id !== selectedSection.id) }));
                      setSelection(null);
                    }}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 text-[13px] font-medium text-red-600 hover:border-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </Pane>
            )}

            {panel === "sections" && selection?.kind === "style" && (
              <Pane title="Text, buttons & photos" onBack={() => setSelection(null)}>
                <TextStyle settings={content.settings} onChange={(next) => update((c) => ({ ...c, settings: next }))} />
                <button
                  type="button"
                  onClick={() =>
                    update((c) => {
                      const d = getDefaultSiteContent(themeSlug, store.name).settings;
                      return {
                        ...c,
                        settings: { ...c.settings, textSize: d.textSize, headingFont: d.headingFont, displayFont: d.displayFont, bodyFont: d.bodyFont, buttonShape: d.buttonShape, uppercaseHeadings: d.uppercaseHeadings, productPhotos: d.productPhotos },
                      };
                    })
                  }
                  className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-black"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Back to the theme&apos;s text style
                </button>
              </Pane>
            )}

            {panel === "sections" && selection?.kind === "page" && (
              <Pane title={content.pages[selection.id].title || "Page"} onBack={() => setSelection(null)}>
                {(POLICY_IDS as readonly string[]).includes(selection.id) ? (
                  <div className="space-y-3">
                    <p className="text-[13px] leading-relaxed text-neutral-600">
                      Your shop&apos;s {POLICY_INFO[selection.id as PolicyId].title.toLowerCase()} is written in Dashboard → Policies, with a ready template. What you write there shows on this page in every theme.
                    </p>
                    <Link href={`/dashboard?tab=policies&store=${store.subdomain}`} className="inline-flex h-9 items-center rounded-xl bg-black px-4 text-[13px] font-semibold text-white">
                      Open Policies
                    </Link>
                  </div>
                ) : (
                <>
                <Field label="Title">
                  <input
                    className={input}
                    value={content.pages[selection.id].title}
                    maxLength={80}
                    onChange={(e) => {
                      const id = selection.id;
                      update((c) => ({ ...c, pages: { ...c.pages, [id]: { ...c.pages[id], title: e.target.value } } }));
                    }}
                  />
                </Field>
                <Field label="Text" help="Leave an empty line between paragraphs.">
                  <textarea
                    className={input}
                    rows={12}
                    value={content.pages[selection.id].body}
                    maxLength={8000}
                    onChange={(e) => {
                      const id = selection.id;
                      update((c) => ({ ...c, pages: { ...c.pages, [id]: { ...c.pages[id], body: e.target.value } } }));
                    }}
                  />
                </Field>
                {/* only the page styles that draw a photo (banner, split, card) */}
                {(selection.id === "about" || selection.id === "contact") && ["banner", "split", "card"].includes(SITE_THEME_STYLE[toSiteTheme(themeSlug)]?.pageStyle || "plain") && (
                  <ImageField
                    label="Photo"
                    help="Shows on themes whose pages have a photo."
                    store={store}
                    value={content.pages[selection.id].image || ""}
                    onChange={(v) => {
                      const id = selection.id;
                      update((c) => ({ ...c, pages: { ...c.pages, [id]: { ...c.pages[id], image: v } } }));
                    }}
                  />
                )}
                <p className="text-[12px] text-neutral-400">This page is linked from your shop&apos;s menu and footer.</p>
                </>
                )}
              </Pane>
            )}

            {panel === "theme" && (
              <ThemeColours
                settings={content.settings}
                onChange={(next) => update((c) => ({ ...c, settings: next }))}
                onReset={() =>
                  update((c) => {
                    const d = getDefaultSiteContent(themeSlug, store.name).settings;
                    const colours = Object.fromEntries(SITE_COLOR_KEYS.map((k) => [k, d[k]]));
                    return { ...c, settings: { ...c.settings, ...colours } };
                  })
                }
              />
            )}
          </div>
        </aside>

        {/* live preview */}
        <section className={cn("min-w-0 flex-1 items-start justify-center overflow-auto p-0 md:flex md:p-6", mobilePane === "preview" ? "flex" : "hidden")} aria-label="Preview">
          <div
            className={cn(
              "h-full overflow-hidden bg-white md:rounded-2xl md:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] md:ring-1 md:ring-black/5",
              device === "mobile" ? "w-full md:h-[min(100%,844px)] md:w-[390px]" : "w-full"
            )}
          >
            <iframe ref={frame} key={previewSrc} src={previewSrc} title="Shop preview" className="h-full w-full border-0" data-tour="preview" />
          </div>
          {textTip && (
            <div className="fixed bottom-5 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-start gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-[13px] text-white shadow-xl">
              <span>{textTip}</span>
              <button type="button" onClick={() => setTextTip("")} className="ml-2 font-semibold text-white/70 hover:text-white">
                OK
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SidebarRow({ icon: Icon, title, subtitle, onClick }: { icon: typeof PanelTop; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-neutral-50">
      <Icon className="h-5 w-5 shrink-0 text-neutral-900" />
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold">{title}</span>
        <span className="block truncate text-[12px] text-neutral-500">{subtitle}</span>
      </span>
    </button>
  );
}

function SectionRow({
  section,
  index,
  count,
  onOpen,
  onMove,
  onToggle,
}: {
  section: SiteSection;
  index: number;
  count: number;
  onOpen: () => void;
  onMove: (from: number, to: number) => void;
  onToggle: () => void;
}) {
  const [over, setOver] = useState(false);
  const meta = SITE_SECTION_TYPES[section.type];
  const name = (section.settings.heading?.split("\n")[0] || section.settings.text?.slice(0, 40) || meta.description).replace(/\*/g, "");
  return (
    <li
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const from = Number(e.dataTransfer.getData("text/plain"));
        if (!Number.isNaN(from)) onMove(from, index);
      }}
      className={cn("group flex items-center gap-1 rounded-xl pr-1 hover:bg-neutral-50", over && "ring-2 ring-blue-500", section.hidden && "opacity-50")}
    >
      <span className="hidden cursor-grab pl-1.5 text-neutral-300 sm:block" aria-hidden>
        <GripVertical className="h-4 w-4" />
      </span>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 px-2 py-2.5 text-left">
        <span className="block text-[13px] font-semibold">{meta.label}</span>
        <span className="block truncate text-[12px] text-neutral-500">{name}</span>
      </button>
      <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)} className="flex h-8 w-7 items-center justify-center text-neutral-400 hover:text-black disabled:opacity-20">
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(index, index + 1)} className="flex h-8 w-7 items-center justify-center text-neutral-400 hover:text-black disabled:opacity-20">
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label={section.hidden ? "Show section" : "Hide section"} onClick={onToggle} className="flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-black">
        {section.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </li>
  );
}

function Pane({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-100 bg-white px-2 py-2">
        <button type="button" onClick={onBack} aria-label="Back to sections" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-[14px] font-semibold">{title}</p>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

function Field({ label: text, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{text}</span>
      {children}
      {help && <span className="mt-1 block text-[12px] text-neutral-400">{help}</span>}
    </label>
  );
}

const plural = (w: string) => (/[^aeiou]y$/i.test(w) ? `${w.slice(0, -1)}ies` : /(s|x|ch|sh)$/i.test(w) ? `${w}es` : `${w}s`);

/** "Weave 2: photo" → item "Weave", number 2, short label "Photo". */
function splitItemLabel(label: string): { family: string; n: number; short: string } | null {
  const m = label.match(/^(.+?)\s(\d+):\s*(.+)$/);
  if (!m) return null;
  return { family: m[1], n: Number(m[2]), short: m[3].charAt(0).toUpperCase() + m[3].slice(1) };
}

/**
 * A section's fields, kept short: the section's own fields first, then repeated items (Weave 1,
 * Weave 2… / Slide 1, Slide 2…) as a compact list. One item opens at a time, showing only its own fields.
 */
function SectionFields({
  fields,
  settings,
  store,
  onChange,
}: {
  fields: SectionField[];
  settings: Record<string, string>;
  store: StoreData;
  onChange: (patch: Record<string, string>) => void;
}) {
  const general: SectionField[] = [];
  const families: { family: string; items: { n: number; fields: (SectionField & { short: string })[] }[] }[] = [];
  for (const f of fields) {
    const it = splitItemLabel(f.label);
    if (!it) {
      general.push(f);
      continue;
    }
    let fam = families.find((x) => x.family === it.family);
    if (!fam) families.push((fam = { family: it.family, items: [] }));
    let item = fam.items.find((x) => x.n === it.n);
    if (!item) fam.items.push((item = { n: it.n, fields: [] }));
    item.fields.push({ ...f, short: it.short });
  }
  for (const fam of families) fam.items.sort((a, b) => a.n - b.n);
  const [open, setOpen] = useState<string | null>(null);
  // empty slots the seller just added (shown so they can fill them in)
  const [added, setAdded] = useState<string[]>([]);
  const filled = (item: { fields: SectionField[] }) => item.fields.some((f) => (settings[f.key] || "").trim());

  /** Clears an item and moves the ones after it up a place, so the list has no gaps. */
  const removeItem = async (fam: (typeof families)[number], n: number) => {
    const name = `${fam.family} ${n}`;
    if (!(await appConfirm(`${name} will be removed from this section. The ones after it move up.`, { title: `Remove ${name.toLowerCase()}?`, okLabel: "Remove", danger: true }))) return;
    const items = fam.items;
    const at = items.findIndex((x) => x.n === n);
    const suffixOf = (f: SectionField & { short: string }) => f.key.replace(/^[a-z]+\d+/, "");
    const patch: Record<string, string> = {};
    for (let i = at; i < items.length; i++) {
      const nextItem = items[i + 1];
      for (const f of items[i].fields) {
        const from = nextItem?.fields.find((g) => suffixOf(g) === suffixOf(f));
        patch[f.key] = from ? settings[from.key] || "" : "";
      }
    }
    onChange(patch);
    setOpen(null);
    setAdded((a) => a.filter((x) => !x.startsWith(`${fam.family}-`)));
  };

  return (
    <div className="space-y-4">
      {general.map((f) => (
        <SettingField key={f.key} field={f} store={store} value={settings[f.key] || ""} onChange={(v) => onChange({ [f.key]: v })} />
      ))}
      {families.map((fam) => {
        const shown = fam.items.filter((item) => filled(item) || added.includes(`${fam.family}-${item.n}`));
        const free = fam.items.find((item) => !shown.includes(item));
        return (
          <div key={fam.family}>
            <p className="mb-1.5 text-[12px] font-semibold text-neutral-600">
              {plural(fam.family)}{" "}
              <span className="font-normal text-neutral-400">
                · {shown.length} of {fam.items.length}
              </span>
            </p>
            {shown.length > 0 && (
              <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
                {shown.map((item, idx) => {
                  const id = `${fam.family}-${item.n}`;
                  const isOpen = open === id;
                  const photo = item.fields.find((f) => f.kind === "image");
                  const titleField = item.fields.find((f) => f.kind === "text" || f.kind === "textarea");
                  const title = (titleField && settings[titleField.key]?.split("\n")[0]) || "";
                  return (
                    <div key={id} className={isOpen ? "bg-neutral-50/60" : ""}>
                      <div className="flex items-center gap-1 pr-1.5">
                        <button type="button" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 text-[12px] font-semibold text-neutral-500">
                            {photo && settings[photo.key] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={settings[photo.key]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              idx + 1
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-neutral-900">{title || `New ${fam.family.toLowerCase()}`}</span>
                            <span className="block text-[11px] text-neutral-400">
                              {fam.family} {idx + 1}
                              {!filled(item) && " · fill it in to show it"}
                            </span>
                          </span>
                          <ChevronDown className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform", isOpen && "rotate-180")} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(fam, item.n)}
                          aria-label={`Remove ${fam.family} ${idx + 1}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="space-y-3 px-3 pb-3.5 pt-1">
                          {item.fields.map((f) => (
                            <SettingField key={f.key} field={{ ...f, label: f.short }} store={store} value={settings[f.key] || ""} onChange={(v) => onChange({ [f.key]: v })} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {free ? (
              <button
                type="button"
                onClick={() => {
                  const id = `${fam.family}-${free.n}`;
                  setAdded((a) => [...a, id]);
                  setOpen(id);
                }}
                className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 text-[13px] font-semibold text-neutral-600 hover:border-black hover:text-black"
              >
                <Plus className="h-3.5 w-3.5" /> Add {fam.family.toLowerCase()}
              </button>
            ) : (
              <p className="mt-1.5 text-[11px] text-neutral-400">
                This theme has room for {fam.items.length} {fam.items.length === 1 ? fam.family.toLowerCase() : plural(fam.family).toLowerCase()}.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettingField({ field, store, value, onChange }: { field: SectionField; store: StoreData; value: string; onChange: (v: string) => void }) {
  if (field.kind === "image") return <ImageField label={field.label} help={field.help} store={store} value={value} onChange={onChange} aspect={/^slide\d/.test(field.key) ? 3 : undefined} />;
  if (field.kind === "link") return <LinkField label={field.label} store={store} value={value} onChange={onChange} />;
  if (field.kind === "source") {
    const cats = (store.categories || []).filter((c) => c.isActive ?? true);
    return (
      <Field label={field.label}>
        <select className={input} value={value || "bestsellers"} onChange={(e) => onChange(e.target.value)}>
          <option value="bestsellers">Best sellers</option>
          <option value="newest">Newest</option>
          <option value="sale">On sale</option>
          <option value="all">All products</option>
          {cats.length > 0 && (
            <optgroup label="Category">
              {cats.map((c) => (
                <option key={c.id} value={`category:${c.slug}`}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </Field>
    );
  }
  if (field.kind === "select") {
    return (
      <Field label={field.label} help={field.help}>
        <select className={input} value={value || field.options?.[0]?.value} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  if (field.kind === "textarea") {
    return (
      <Field label={field.label} help={field.help}>
        <textarea className={input} rows={3} value={value} maxLength={1200} onChange={(e) => onChange(e.target.value)} />
      </Field>
    );
  }
  return (
    <Field label={field.label} help={field.help}>
      <input className={input} value={value} maxLength={160} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

const EDITOR_TOUR: TourStep[] = [
  { title: "Edit your website", text: "Here's how the editor works. It takes a few seconds. Replay it any time with the ? button." },
  { target: '[data-tour="ed-panels"]', title: "Sections and colours", text: "Your homepage is made of sections. Pick one to change its words and photos, drag to reorder, or hide it. Theme colours sets the colours and fonts." },
  { target: '[data-tour="preview"]', title: "Edit right on the page", text: "Click a section in the preview to open it. Double-click any heading or text to type over it, then press Enter." },
  { target: '[data-tour="ed-page"]', title: "Other pages", text: "Preview your catalog, product page, bag and policy pages too." },
  { target: '[data-tour="ed-device"]', title: "Phone or desktop", text: "Most buyers shop on their phone. Check both before you save." },
  { target: '[data-tour="ed-theme"]', title: "Switch theme", text: "Edit another theme without changing your live shop." },
  { target: '[data-tour="ed-save"]', title: "Save", text: "Nothing changes on your shop until you save. Leaving with unsaved changes asks you first." },
];

/**
 * A field is offered only if this theme shows it. Text, photos and links: the preview's hidden marker
 * test says whether the field's value ends up on the page. Choices (which products, sizes): offered
 * if this theme's section uses them. Until the preview has reported, the code's reads decide.
 */
function fieldShown(f: SectionField, sectionId: string, probe: ProbeReport | null, used: Record<string, string[]>): boolean {
  const probed = probe?.sections[sectionId];
  const reads = used[sectionId];
  if (f.kind === "select" || f.kind === "source") {
    if (f.key === "headingSize") return probe ? !!probed?.includes("heading") : !reads || reads.includes("heading");
    return !reads || reads.includes(f.key);
  }
  if (probe) return !!probed?.includes(f.key);
  return !reads || reads.includes(f.key);
}

function ImageField({ label: text, help, store, value, onChange, aspect }: { label: string; help?: string; store: StoreData; value: string; onChange: (v: string) => void; aspect?: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className={label}>{text}</span>
      {/* small thumbnail beside its buttons, so a photo takes one line, not half the panel */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label={value ? "Replace photo" : "Upload photo"}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 hover:border-black"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-neutral-300">
              <ImageIcon className="h-5 w-5" />
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          )}
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-black px-2.5 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            <Upload className="h-3.5 w-3.5" /> {value ? "Replace" : "Upload"}
          </button>
          <button type="button" onClick={() => setShowUrl((v) => !v)} className="h-8 rounded-lg px-2 text-[12px] font-medium text-neutral-500 hover:text-black">
            Link
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="h-8 rounded-lg px-2 text-[12px] font-medium text-neutral-500 hover:text-red-600">
              Remove
            </button>
          )}
        </div>
      </div>
      {showUrl && <input className={cn(input, "mt-2")} placeholder="https://…" value={value} onChange={(e) => onChange(e.target.value.trim())} />}
      {help && <p className="mt-1 text-[12px] text-neutral-400">{help}</p>}
      {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > 12 * 1024 * 1024) {
            setError("Choose a photo under 12 MB.");
            return;
          }
          const cropped = await cropImage(file, { aspect });
          if (!cropped) return;
          setBusy(true);
          setError("");
          try {
            onChange(await storeService.uploadStoreImage(store.subdomain, cropped));
          } catch {
            setError("Couldn't upload this photo. Try another one.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function LinkField({ label: text, store, value, onChange }: { label: string; store: StoreData; value: string; onChange: (v: string) => void }) {
  const options = useMemo(() => {
    const list: { value: string; label: string; group: string }[] = [
      { value: "/", label: "Home", group: "Pages" },
      { value: "/catalog", label: "All products", group: "Pages" },
      { value: "/account", label: "Account", group: "Pages" },
      ...SITE_PAGE_IDS.map((id) => ({ value: `/pages/${id}`, label: id[0].toUpperCase() + id.slice(1), group: "Pages" })),
      ...(store.categories || []).filter((c) => c.isActive ?? true).map((c) => ({ value: `/category/${c.slug}`, label: c.name, group: "Categories" })),
      ...(store.products || [])
        .filter((p) => p.status === "published")
        .slice(0, 80)
        .map((p) => ({ value: `/products/${p.slug || p.id}`, label: p.title, group: "Products" })),
    ];
    return list;
  }, [store]);
  const known = options.some((o) => o.value === value);
  const [custom, setCustom] = useState(!!value && !known);
  const groups = ["Pages", "Categories", "Products"];
  return (
    <Field label={text}>
      <select
        className={input}
        value={custom ? "__custom" : value || "/catalog"}
        onChange={(e) => {
          if (e.target.value === "__custom") {
            setCustom(true);
            onChange("https://");
          } else {
            setCustom(false);
            onChange(e.target.value);
          }
        }}
      >
        {groups.map((g) => {
          const items = options.filter((o) => o.group === g);
          return items.length ? (
            <optgroup key={g} label={g}>
              {items.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : null;
        })}
        <option value="__custom">Another website…</option>
      </select>
      {custom && <input className={cn(input, "mt-2")} value={value} placeholder="https://…" onChange={(e) => onChange(e.target.value.trim())} />}
    </Field>
  );
}

const COLOUR_NAMES: Record<(typeof SITE_COLOR_KEYS)[number], string> = {
  background: "Background",
  text: "Text",
  accent: "Buttons",
  accentText: "Button text",
  panel: "Photo panels",
};

function ThemeColours({ settings, onChange, onReset }: { settings: SiteSettings; onChange: (s: SiteSettings) => void; onReset: () => void }) {
  return (
    <div className="space-y-4 p-4">
      <p className="text-[13px] text-neutral-500">Colours for your whole shop. Words, photos and text size are under Sections.</p>
      <div className="space-y-2">
        {SITE_COLOR_KEYS.map((k) => (
          <div key={k} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2 pr-3">
            <input
              type="color"
              value={settings[k]}
              onChange={(e) => onChange({ ...settings, [k]: e.target.value })}
              aria-label={COLOUR_NAMES[k]}
              className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-neutral-200 bg-white p-0.5"
            />
            <span className="flex-1 text-[13px] font-medium">{COLOUR_NAMES[k]}</span>
            <input
              value={settings[k]}
              onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange({ ...settings, [k]: e.target.value })}
              aria-label={`${COLOUR_NAMES[k]} hex code`}
              maxLength={7}
              className="w-[5.5rem] rounded-lg border border-neutral-200 px-2 py-1.5 font-mono text-[12px] uppercase outline-none focus:border-black"
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-black">
        <RotateCcw className="h-3.5 w-3.5" /> Back to the theme&apos;s colours
      </button>
    </div>
  );
}

/** Settings only this theme has: colours as a picker plus hex code, words as a text box. */
function ThemeOptions({ fields, values, onChange }: { fields: ThemeOptionField[]; values: Record<string, string>; onChange: (key: string, value: string) => void }) {
  return (
    <div className="space-y-3">
      {fields.map((f) =>
        f.kind === "select" ? (
          <div key={f.key}>
            <p className={label}>{f.label}</p>
            <div className="space-y-2">
              {(f.options || []).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={(values[f.key] || f.default) === o.value}
                  onClick={() => onChange(f.key, o.value)}
                  className={cn("block w-full rounded-xl border p-3 text-left", (values[f.key] || f.default) === o.value ? "border-black ring-1 ring-black" : "border-neutral-200")}
                >
                  <span className="block text-[13px] font-semibold">{o.label}</span>
                  {o.help && <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500">{o.help}</span>}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-neutral-400">The editor preview shows everything at once. Open View in a new tab to see the effects.</p>
          </div>
        ) : f.kind === "color" ? (
          <div key={f.key}>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2 pr-3">
              <input
                type="color"
                value={values[f.key] || f.default}
                onChange={(e) => onChange(f.key, e.target.value)}
                aria-label={f.label}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-neutral-200 bg-white p-0.5"
              />
              <span className="flex-1 text-[13px] font-medium">{f.label}</span>
              <HexInput label={f.label} value={values[f.key] || f.default} onChange={(v) => onChange(f.key, v)} />
            </div>
            {f.help && <p className="mt-1 px-1 text-[12px] text-neutral-400">{f.help}</p>}
          </div>
        ) : (
          <Field key={f.key} label={f.label} help={f.help}>
            <input className={input} value={values[f.key] ?? ""} maxLength={f.max || 60} placeholder={f.default} onChange={(e) => onChange(f.key, e.target.value)} />
          </Field>
        )
      )}
    </div>
  );
}

/** A hex box that lets the seller type freely and only passes on complete colours (#RRGGBB). */
function HexInput({ label: name, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      value={draft}
      onChange={(e) => {
        const v = e.target.value;
        if (!/^#?[0-9a-fA-F]{0,6}$/.test(v)) return;
        setDraft(v);
        const full = v.startsWith("#") ? v : `#${v}`;
        if (/^#[0-9a-fA-F]{6}$/.test(full)) onChange(full);
      }}
      onBlur={() => setDraft(value)}
      aria-label={`${name} hex code`}
      maxLength={7}
      className="w-[5.5rem] rounded-lg border border-neutral-200 px-2 py-1.5 font-mono text-[12px] uppercase outline-none focus:border-black"
    />
  );
}

function TextStyle({ settings, onChange }: { settings: SiteSettings; onChange: (s: SiteSettings) => void }) {
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => onChange({ ...settings, [k]: v });
  const size = Number(settings.textSize) || 100;
  const setSize = (n: number) => set("textSize", String(Math.min(130, Math.max(80, n))));
  return (
    <>
      <div>
        <p className={label}>Text size</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Smaller text"
            onClick={() => setSize(size - 5)}
            disabled={size <= 80}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-[13px] font-semibold hover:border-black disabled:opacity-30"
          >
            A−
          </button>
          <input type="range" min={80} max={130} step={5} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Text size" className="min-w-0 flex-1 accent-black" />
          <button
            type="button"
            aria-label="Larger text"
            onClick={() => setSize(size + 5)}
            disabled={size >= 130}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-[15px] font-semibold hover:border-black disabled:opacity-30"
          >
            A+
          </button>
        </div>
        <p className="mt-1 text-[12px] text-neutral-400">{size}% of normal. Each section also has its own heading size.</p>
      </div>
      <Field label="Heading font">
        <select className={input} value={settings.headingFont} onChange={(e) => set("headingFont", e.target.value)} style={{ fontFamily: fontStack(settings.headingFont) }}>
          {[...SITE_HEADING_FONTS, ...SITE_CONDENSED_FONTS].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Big headline font" help="Used for the hero heading and big offer text. Tall narrow fonts give a poster look.">
        <select className={input} value={settings.displayFont} onChange={(e) => set("displayFont", e.target.value)} style={{ fontFamily: fontStack(settings.displayFont) }}>
          <optgroup label="Tall & narrow">
            {SITE_CONDENSED_FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </optgroup>
          <optgroup label="Same style as headings">
            {SITE_HEADING_FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>
      <Field label="Body font">
        <select className={input} value={settings.bodyFont} onChange={(e) => set("bodyFont", e.target.value)}>
          {SITE_BODY_FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3">
        <span className="text-[13px] font-medium">Capital letters for headings</span>
        <input type="checkbox" className="h-5 w-5 accent-black" checked={settings.uppercaseHeadings === "yes"} onChange={(e) => set("uppercaseHeadings", e.target.checked ? "yes" : "no")} />
      </label>
      <div>
        <p className={label}>Product photos</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["fit", "Whole product", "Best for photos on white"],
              ["fill", "Fill the card", "Best for photos with a scene"],
            ] as const
          ).map(([v, name, help]) => (
            <button
              key={v}
              type="button"
              aria-pressed={settings.productPhotos === v}
              onClick={() => set("productPhotos", v)}
              className={cn("rounded-xl border p-3 text-left", settings.productPhotos === v ? "border-black ring-1 ring-black" : "border-neutral-200")}
            >
              <span className="block text-[13px] font-semibold">{name}</span>
              <span className="block text-[11px] text-neutral-500">{help}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className={label}>Button shape</p>
        <div className="grid grid-cols-3 gap-2">
          {(["pill", "rounded", "square"] as const).map((shape) => (
            <button
              key={shape}
              type="button"
              aria-pressed={settings.buttonShape === shape}
              onClick={() => set("buttonShape", shape)}
              className={cn("flex h-12 items-center justify-center rounded-xl border", settings.buttonShape === shape ? "border-black ring-1 ring-black" : "border-neutral-200")}
            >
              <span className={cn("bg-black px-3 py-1.5 text-[11px] font-semibold text-white", shape === "pill" ? "rounded-full" : shape === "rounded" ? "rounded-md" : "")}>
                {shape === "pill" ? "Pill" : shape === "rounded" ? "Soft" : "Square"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
