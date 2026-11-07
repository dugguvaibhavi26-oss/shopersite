"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, Upload, X } from "lucide-react";
import { storeService, type PlatformBanner } from "@/lib/store-service";

/** Admin: upload image banners (with a redirect path) shown on every seller's dashboard. */
export function PlatformBannersManager() {
  const [banners, setBanners] = useState<PlatformBanner[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => setBanners([...storeService.getPlatformBanners()]);
    sync();
    return storeService.subscribe(sync);
  }, []);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f?: File | null) => {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Choose an image file (PNG, JPG or WebP).");
    if (f.size > 5 * 1024 * 1024) return setError("That image is over 5 MB. Try a smaller one.");
    setFile(f);
  };

  const publish = async () => {
    if (!file) return setError("Choose a banner image first.");
    const target = link.trim();
    if (target && !target.startsWith("/") && !/^https?:\/\//.test(target)) {
      return setError("Use a path starting with / or a full https:// link.");
    }
    setSaving(true);
    try {
      await storeService.addPlatformBanner(file, target);
      setFile(null);
      setLink("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setError("Couldn't publish the banner. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">Dashboard banners</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Images shown on every seller&apos;s dashboard overview. Upload 1600 × 800 px (2:1): phones show the whole image,
          desktop shows the middle band inside the dashed outline, so keep text and logos there.
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
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`relative aspect-[2/1] w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
            preview ? "border-transparent" : "border-neutral-300 hover:border-neutral-500 bg-neutral-50"
          }`}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
              {/* the band desktop shows (3:1 out of the 2:1 image) */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[66.7%] border-y-2 border-dashed border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"
              />
              <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                Desktop shows the outlined band
              </span>
              <button
                type="button"
                aria-label="Remove image"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500">
              <ImagePlus className="w-7 h-7" />
              <span className="text-sm font-medium">Click or drop a banner image</span>
              <span className="text-xs text-neutral-400">PNG, JPG or WebP, up to 5 MB</span>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Redirect path (optional)</span>
            <span className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 focus-within:border-neutral-900">
              <Link2 className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError("");
                }}
                placeholder="/dashboard?tab=themes"
                className="h-10 w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>
          <button
            type="button"
            onClick={publish}
            disabled={saving}
            className="sm:self-end h-10 px-5 rounded-lg bg-neutral-900 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {saving ? "Publishing…" : "Publish banner"}
          </button>
        </div>
        <p className="text-xs text-neutral-400">
          Paths inside the dashboard switch tabs in place: /dashboard?tab=products, themes, discounts, billing, settings…
        </p>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>

      {/* Live banners */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">Live banners ({banners.length})</h3>
        {banners.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            No banners yet. Sellers see an empty image placeholder until you publish one. Every banner slides in the carousel and opens its redirect path when tapped.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {banners.map((b) => (
              <BannerRow key={b.id} banner={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BannerRow({ banner }: { banner: PlatformBanner }) {
  const [link, setLink] = useState(banner.link ?? "");
  const dirty = link.trim() !== (banner.link ?? "");

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt="" className="aspect-[2/1] w-full object-cover bg-neutral-100" />
      <div className="p-3 flex items-center gap-2">
        <span className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-200 px-2.5">
          <Link2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="No redirect"
            className="h-9 w-full bg-transparent text-xs outline-none"
          />
        </span>
        {dirty && (
          <button
            type="button"
            onClick={() => storeService.updatePlatformBannerLink(banner.id, link)}
            className="h-9 px-3 rounded-lg bg-neutral-900 text-white text-xs font-semibold"
          >
            Save
          </button>
        )}
        <button
          type="button"
          aria-label="Delete banner"
          onClick={() => {
            if (confirm("Delete this banner from every seller dashboard?")) storeService.deletePlatformBanner(banner.id);
          }}
          className="h-9 w-9 rounded-lg border border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className="px-3 pb-3 -mt-1 text-[11px] text-neutral-400">
        Added {new Date(banner.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}
