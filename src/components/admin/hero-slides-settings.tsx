"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Check, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { storeService } from "@/lib/store-service";
import { MAX_SLIDES, cleanLink, type HeroSlide } from "@/lib/discover";
import { saveDiscoverSlides, useDiscoverData } from "@/lib/discover-client";

/** Admin → App banners → Top banner: the big rotating banner at the top of every seller's Home. */
export function HeroSlidesSettings({ myEmail }: { myEmail: string }) {
  const { slides: live, loaded } = useDiscoverData();
  const [form, setForm] = React.useState<HeroSlide[] | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (loaded) setForm((f) => f ?? live);
  }, [loaded, live]);
  if (!form)
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );

  const set = (i: number, patch: Partial<HeroSlide>) => setForm(form.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...form];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    setForm(next);
  };
  const add = () => setForm([...form, { id: `slide-${Date.now().toString(36)}`, title: "", text: "", imageUrl: "", tag: "", ctaLabel: "Learn more", link: "", enabled: true }]);
  const dirty = JSON.stringify(form) !== JSON.stringify(live);

  const upload = async (i: number, file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > 8 * 1024 * 1024) return setError("That image is over 8 MB.");
    setError("");
    setUploading(form[i].id);
    try {
      set(i, { imageUrl: await storeService.uploadPlatformImage(file, `hero-${form[i].id}`) });
    } catch {
      setError("Couldn't upload that image. Try again.");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    for (const s of form) {
      if (!s.title.trim()) return setError("Every slide needs a title (or delete the empty one).");
      if (s.link && !cleanLink(s.link)) return setError(`The link on "${s.title}" must start with https:// or /`);
    }
    setSaving(true);
    setError("");
    try {
      await saveDiscoverSlides(form, myEmail);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Couldn't save. Check that you're signed in as an admin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-black tracking-tight text-neutral-900 sm:text-2xl">Top banner</h3>
          <p className="text-sm text-neutral-500">The big rotating banner at the top of every seller&apos;s Home on computers. Upload 1600 × 600 px, the same size as the dashboard banners below. With no slides, sellers see the built-in ones.</p>
        </div>
        <div className="flex gap-2">
          {form.length < MAX_SLIDES && (
            <button type="button" onClick={add} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 px-4 text-sm font-semibold hover:border-neutral-900">
              <Plus className="h-4 w-4" /> Add slide
            </button>
          )}
          <button type="button" onClick={save} disabled={!dirty || saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved" : "Save slides"}
          </button>
        </div>
      </div>
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!form.length && <p className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">No slides yet. Sellers see the built-in banner.</p>}

      <div className="space-y-3">
        {form.map((s, i) => (
          <div key={s.id} className={`grid gap-4 rounded-2xl border bg-white p-4 md:grid-cols-[280px_1fr] ${s.enabled ? "border-neutral-200" : "border-dashed border-neutral-300 opacity-70"}`}>
            <label className="group relative block aspect-[8/3] cursor-pointer self-start overflow-hidden rounded-xl bg-neutral-100">
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full flex-col items-center justify-center gap-1 text-xs text-neutral-500">
                  <ImagePlus className="h-5 w-5" /> Add image (1600 × 600)
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                {uploading === s.id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Change image"}
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(i, e.target.files?.[0])} />
            </label>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Slide {i + 1}</p>
                <span className="flex items-center gap-1">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" disabled={i === form.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <label className="ml-2 inline-flex items-center gap-1.5 text-xs text-neutral-600">
                    <input type="checkbox" checked={s.enabled} onChange={(e) => set(i, { enabled: e.target.checked })} className="accent-neutral-900" /> Show
                  </label>
                  <button type="button" onClick={() => setForm(form.filter((_, j) => j !== i))} aria-label="Delete slide" className="ml-1 rounded-md p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                <input value={s.title} onChange={(e) => set(i, { title: e.target.value })} maxLength={80} placeholder="Title, e.g. Get ready for Diwali" className="h-9 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900" />
                <input value={s.tag} onChange={(e) => set(i, { tag: e.target.value })} maxLength={24} placeholder="Tag, e.g. New" className="h-9 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900" />
              </div>
              <textarea value={s.text} onChange={(e) => set(i, { text: e.target.value })} maxLength={180} rows={2} placeholder="One or two lines of text" className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900" />
              <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
                <input value={s.link} onChange={(e) => set(i, { link: e.target.value })} placeholder="Link: https://docs.shopersite.in/… or /dashboard?tab=plugins" className="h-9 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900" />
                <input value={s.ctaLabel} onChange={(e) => set(i, { ctaLabel: e.target.value })} maxLength={30} placeholder="Button text" className="h-9 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
