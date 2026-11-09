"use client";

import * as React from "react";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { storeService } from "@/lib/store-service";
import { DISCOVER_DEFAULTS, DISCOVER_IDS, EXPLORE_IDS, cleanLink, type DiscoverCard, type DiscoverId } from "@/lib/discover";
import { saveDiscoverCards, useDiscoverCards } from "@/lib/discover-client";
import { HeroSlidesSettings } from "./hero-slides-settings";

/** Admin → Discover cards: the five cards on every seller's Home (image, text, link). */
export function DiscoverSettings({ myEmail }: { myEmail: string }) {
  const live = useDiscoverCards();
  const [form, setForm] = React.useState<Record<DiscoverId, DiscoverCard> | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState<DiscoverId | null>(null);

  // start from what's saved (once it arrives)
  React.useEffect(() => {
    setForm((f) => f ?? live);
  }, [live]);
  if (!form)
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );

  const set = (id: DiscoverId, patch: Partial<DiscoverCard>) => setForm({ ...form, [id]: { ...form[id], ...patch } });
  const dirty = JSON.stringify(form) !== JSON.stringify(live);

  const upload = async (id: DiscoverId, file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > 8 * 1024 * 1024) return setError("That image is over 8 MB.");
    setError("");
    setUploading(id);
    try {
      set(id, { imageUrl: await storeService.uploadPlatformImage(file, `discover-${id}`) });
    } catch {
      setError("Couldn't upload that image. Try again.");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    for (const id of DISCOVER_IDS) {
      if (form[id].link && !cleanLink(form[id].link)) return setError(`The link for "${DISCOVER_DEFAULTS[id].name}" must start with https:// or /`);
    }
    setSaving(true);
    setError("");
    try {
      await saveDiscoverCards(form, myEmail);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Couldn't save. Check that you're signed in as an admin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <HeroSlidesSettings myEmail={myEmail} />
      <hr className="border-neutral-200" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Discover cards</h2>
          <p className="text-sm text-neutral-500">The Discover cards on every seller&apos;s Home: image cards under &ldquo;Picked for you&rdquo; (the first three switched on are shown) and four cards under &ldquo;Explore more&rdquo;. Change the words and link each one to a guide. Empty fields use the built-in content.</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {DISCOVER_IDS.map((id) => {
          const c = form[id];
          const d = DISCOVER_DEFAULTS[id];
          return (
            <div key={id} className={`overflow-hidden rounded-2xl border bg-white ${c.enabled ? "border-neutral-200" : "border-dashed border-neutral-300 opacity-70"}`}>
              {/* image (the Explore cards use an icon instead) */}
              {!(EXPLORE_IDS as readonly string[]).includes(id) && (
              <label className="group relative block h-36 cursor-pointer bg-neutral-100">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-1 text-xs text-neutral-500">
                    <ImagePlus className="h-5 w-5" /> Add an image (16:9, about 1200×675)
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                  {uploading === id ? <Loader2 className="h-5 w-5 animate-spin" /> : c.imageUrl ? "Change image" : ""}
                </span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(id, e.target.files?.[0])} />
              </label>
              )}

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{d.name}</p>
                  <span className="flex items-center gap-3">
                    {c.imageUrl && (
                      <button type="button" onClick={() => set(id, { imageUrl: "" })} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" /> Image
                      </button>
                    )}
                    <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
                      <input type="checkbox" checked={c.enabled} onChange={(e) => set(id, { enabled: e.target.checked })} className="accent-neutral-900" /> Show
                    </label>
                  </span>
                </div>
                <label className="block">
                  <span className="text-xs text-neutral-500">Title</span>
                  <input
                    value={c.title}
                    onChange={(e) => set(id, { title: e.target.value })}
                    maxLength={80}
                    placeholder={id === "season" ? "Automatic: changes every month" : d.title}
                    className="mt-1 h-9 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500">Text</span>
                  <textarea
                    value={c.text}
                    onChange={(e) => set(id, { text: e.target.value })}
                    maxLength={200}
                    rows={2}
                    placeholder={id === "season" ? "Automatic: this month's selling tip" : d.text}
                    className="mt-1 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                  />
                </label>
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <label className="block">
                    <span className="text-xs text-neutral-500">Link (guide or page)</span>
                    <input
                      value={c.link}
                      onChange={(e) => set(id, { link: e.target.value })}
                      placeholder="https://docs.shopersite.in/… or /legal"
                      className="mt-1 h-9 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500">Button text</span>
                    <input
                      value={c.linkLabel}
                      onChange={(e) => set(id, { linkLabel: e.target.value })}
                      maxLength={30}
                      placeholder="Read guide"
                      className="mt-1 h-9 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-neutral-400">{(EXPLORE_IDS as readonly string[]).includes(id) ? "Explore more card. No link: opens its built-in tab." : "No link: the card opens Shopersite’s built-in tips."}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
