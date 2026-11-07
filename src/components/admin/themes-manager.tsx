"use client";
import { appAlert, appConfirm, appPrompt } from "@/components/ui/app-dialog";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, EyeOff, FileArchive, Loader2, Search, Trash2, Upload } from "lucide-react";
import { storeService, type StoreData } from "@/lib/store-service";
import { getTheme, PLATFORM_THEMES, themeThumb, type ThemeDefinition } from "@/lib/themes";
import { buildThemeZip, readThemePackage, themeZipName } from "@/lib/theme-package";
import { ALL_THEMES_FREE, defaultThemePlan, defaultThemePrice, formatThemePrice, getThemePlan, getThemePrice, type ThemePlan } from "@/lib/theme-pricing";
import type { CustomThemeDef } from "@/lib/site-content";

/** Admin: every theme sellers can use, a download of each as a zip, and uploading new or edited theme zips. */
export function ThemesManager({ stores }: { stores: StoreData[] }) {
  const [uploaded, setUploaded] = useState<CustomThemeDef[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "built-in" | "uploaded">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // an upload whose name matches a theme already uploaded waits for "replace" or "add as new"
  const [pending, setPending] = useState<{ theme: CustomThemeDef; existing: CustomThemeDef } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => setUploaded([...storeService.getPlatformThemes()]);
    sync();
    return storeService.subscribe(sync);
  }, []);

  // how many shops use each theme right now
  const usage = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of stores) counts[s.activeThemeSlug || "classic-bloom"] = (counts[s.activeThemeSlug || "classic-bloom"] || 0) + 1;
    return counts;
  }, [stores]);
  // how many shops bought each theme
  const owners = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of stores) for (const slug of s.ownedThemes || []) counts[slug] = (counts[slug] || 0) + 1;
    return counts;
  }, [stores]);

  const rows = useMemo(() => {
    const builtIn = Object.values(PLATFORM_THEMES).map((t) => ({ theme: t, custom: undefined as CustomThemeDef | undefined }));
    const mine = uploaded.map((d) => ({ theme: getTheme(d.slug), custom: d }));
    const all = filter === "built-in" ? builtIn : filter === "uploaded" ? mine : [...mine, ...builtIn];
    const q = query.trim().toLowerCase();
    return q ? all.filter(({ theme }) => `${theme.name} ${theme.slug} ${theme.category} ${theme.tagline}`.toLowerCase().includes(q)) : all;
  }, [uploaded, filter, query]);

  const previewStore = stores.find((s) => s.status !== "suspended")?.subdomain || stores[0]?.subdomain;

  const download = (slug: string) => {
    const bytes = buildThemeZip(slug);
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = themeZipName(slug);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const save = (theme: CustomThemeDef, replacing?: CustomThemeDef) => {
    const final = replacing ? { ...theme, slug: replacing.slug, enabled: replacing.enabled } : theme;
    storeService.addPlatformTheme(final);
    setPending(null);
    setNotice(replacing ? `“${final.name}” was updated. Shops using it see the new version.` : `“${final.name}” was added and is now in every seller's theme list.`);
  };

  const upload = async (file?: File | null) => {
    setError("");
    setNotice("");
    setPending(null);
    if (!file) return;
    if (!/\.(zip|json)$/i.test(file.name)) return setError("Choose a theme .zip (or its theme.json).");
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const res = readThemePackage(bytes, file.name, uploaded.map((t) => t.slug));
      if (!res.ok) return setError(res.error);
      const existing = uploaded.find((t) => t.name.toLowerCase() === res.theme.name.toLowerCase());
      if (existing) setPending({ theme: res.theme, existing });
      else save(res.theme);
    } catch (e) {
      console.error(e);
      setError("Couldn't read that file. Try downloading a theme and uploading it again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">Themes</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Every theme sellers can pick. Download any theme as a zip, edit its theme.json (name, colours, fonts, sections and page text), and upload it back as a new theme.
        </p>
      </div>

      {/* Upload */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files?.[0]);
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center text-neutral-500 transition-colors hover:border-neutral-500 cursor-pointer"
        >
          {busy ? <Loader2 className="w-7 h-7 animate-spin" /> : <FileArchive className="w-7 h-7" />}
          <span className="text-sm font-medium text-neutral-700">{busy ? "Reading the theme…" : "Click or drop a theme .zip to upload"}</span>
          <span className="text-xs text-neutral-400">A zip you downloaded here (edited or not), or its theme.json. Up to 2 MB.</span>
          <input ref={inputRef} type="file" accept=".zip,.json,application/zip,application/json" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        {notice && <p className="text-xs font-medium text-emerald-700">{notice}</p>}
        {pending && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-amber-900">
              You already uploaded a theme called <b>{pending.existing.name}</b>
              {usage[pending.existing.slug] ? `, used by ${usage[pending.existing.slug]} shop${usage[pending.existing.slug] === 1 ? "" : "s"}` : ""}.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => save(pending.theme, pending.existing)} className="h-9 rounded-lg bg-neutral-900 px-4 text-xs font-semibold text-white">
                Replace it
              </button>
              <button type="button" onClick={() => save(pending.theme)} className="h-9 rounded-lg border border-neutral-300 bg-white px-4 text-xs font-semibold text-neutral-800">
                Add as new
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All themes */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-neutral-900">
            All themes ({Object.keys(PLATFORM_THEMES).length} built-in, {uploaded.length} uploaded)
          </h3>
          <div className="flex gap-2">
            <span className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 sm:w-56 sm:flex-none">
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search themes" className="w-full bg-transparent text-xs outline-none" />
            </span>
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-9 rounded-lg border border-neutral-200 bg-white px-2 text-xs">
              <option value="all">All</option>
              <option value="built-in">Built-in</option>
              <option value="uploaded">Uploaded</option>
            </select>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            {filter === "uploaded" && !query ? "No uploaded themes yet. Download one above, change its theme.json and upload it." : "No themes match that search."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ theme, custom }) => (
              <ThemeCard
                key={theme.slug}
                theme={theme}
                custom={custom}
                shops={usage[theme.slug] || 0}
                bought={owners[theme.slug] || 0}
                previewHref={previewStore ? `/s/${previewStore}?preview_theme=${theme.slug}` : undefined}
                onDownload={() => download(theme.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  custom,
  shops,
  bought,
  previewHref,
  onDownload,
}: {
  theme: ThemeDefinition;
  custom?: CustomThemeDef;
  shops: number;
  bought: number;
  previewHref?: string;
  onDownload: () => void;
}) {
  const hidden = custom && !custom.enabled;
  return (
    <div className={`overflow-hidden rounded-xl border border-neutral-200 bg-white ${hidden ? "opacity-70" : ""}`}>
      <div className="relative aspect-[16/9] bg-neutral-100">
        {themeThumb(theme) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={themeThumb(theme)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 flex">
            {theme.previewColors.map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${custom ? "bg-violet-600 text-white" : "bg-white/90 text-neutral-800"}`}>
          {custom ? "Uploaded" : "Built-in"}
        </span>
        {hidden && <span className="absolute right-2 top-2 rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">Hidden from sellers</span>}
      </div>
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-neutral-900">{theme.name}</p>
            <p className="truncate text-xs text-neutral-500">{theme.tagline || theme.category}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {theme.previewColors.slice(0, 3).map((c, i) => (
              <span key={i} className="h-4 w-4 rounded-full border border-black/10" style={{ background: c }} />
            ))}
          </div>
        </div>
        <p className="text-[11px] text-neutral-400">
          <span className="font-mono">{theme.slug}</span>
          {custom && <> · layout of {getTheme(custom.base).name}</>} · {shops} shop{shops === 1 ? "" : "s"} using it
          {bought > 0 && <> · bought by {bought}</>}
        </p>
        <PriceField slug={theme.slug} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onDownload} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-black">
            <Download className="h-3.5 w-3.5" /> Download zip
          </button>
          {previewHref && (
            <a href={previewHref} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-800 hover:border-neutral-900">
              <Eye className="h-3.5 w-3.5" /> Preview
            </a>
          )}
          {custom && (
            <>
              <button
                type="button"
                onClick={() => storeService.setPlatformThemeEnabled(custom.slug, !custom.enabled)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-800 hover:border-neutral-900"
              >
                {custom.enabled ? <EyeOff className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                {custom.enabled ? "Hide" : "Show to sellers"}
              </button>
              <button
                type="button"
                aria-label={`Delete ${theme.name}`}
                onClick={() => {
                  const msg = shops
                    ? `${shops} shop${shops === 1 ? " uses" : "s use"} “${theme.name}”. Deleting it moves ${shops === 1 ? "it" : "them"} back to the default theme. Delete anyway?`
                    : `Delete “${theme.name}”?`;
                  appConfirm(msg, { title: "Delete this theme?", danger: true }).then((ok) => ok && storeService.deletePlatformTheme(custom.slug));
                }}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A theme's one-time price in rupees (0 makes it free) and the plan it comes with. A bought theme is the shop's for
 * good, editing included; a plan theme lasts only while that plan is paid for.
 */
function PriceField({ slug }: { slug: string }) {
  if (ALL_THEMES_FREE) return <p className="text-[11px] font-medium text-neutral-500">Free on every plan</p>;
  return <PriceFieldEditor slug={slug} />;
}

function PriceFieldEditor({ slug }: { slug: string }) {
  const current = getThemePrice(slug);
  const plan = getThemePlan(slug);
  const [draft, setDraft] = useState(String(current / 100));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(String(current / 100)), [current]);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };
  const save = () => {
    const rupees = Number(draft.replace(/[,₹\s]/g, ""));
    if (!Number.isFinite(rupees) || rupees < 0) {
      setError("Enter an amount in rupees, or 0 for free.");
      return;
    }
    const paise = Math.round(rupees * 100);
    if (paise === current) return;
    const res = storeService.setThemePricing(slug, { price: paise });
    if (!res.success) {
      setError(res.error || "Couldn't save the price.");
      return;
    }
    setError("");
    flash();
  };

  return (
    <div className="space-y-2 rounded-lg bg-neutral-50 p-2.5">
      <div className="flex items-center gap-2">
        <span className="w-[70px] shrink-0 text-[11px] font-semibold text-neutral-600">Price once</span>
        <label className="flex h-8 flex-1 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs focus-within:border-neutral-900">
          <span className="text-neutral-400">₹</span>
          <span className="sr-only">Price</span>
          <input
            inputMode="decimal"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError("");
            }}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            className="w-full min-w-0 bg-transparent font-semibold text-neutral-900 outline-none"
          />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-[70px] shrink-0 text-[11px] font-semibold text-neutral-600">Comes with</span>
        <select
          value={plan || ""}
          disabled={current === 0}
          onChange={(e) => {
            storeService.setThemePricing(slug, { plan: (e.target.value || null) as ThemePlan });
            flash();
          }}
          className="h-8 flex-1 rounded-lg border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-900 outline-none focus:border-neutral-900 disabled:text-neutral-400"
        >
          <option value="">No plan</option>
          <option value="starter">Growth and Pro</option>
          <option value="pro">Pro only</option>
        </select>
      </div>
      <p className="text-[11px] text-neutral-500">
        {saved
          ? "Saved"
          : current === 0
            ? "Free for every shop"
            : `${formatThemePrice(current)} to own${plan ? `, or included while on ${plan === "pro" ? "Pro" : "Growth or Pro"}` : ""}`}
        {!saved && (current !== defaultThemePrice(slug) || plan !== defaultThemePlan(slug)) && " · changed"}
      </p>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
