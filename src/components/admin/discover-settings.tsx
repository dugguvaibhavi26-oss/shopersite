"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Check, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { storeService } from "@/lib/store-service";
import { DISCOVER_BUTTONS, DISCOVER_DEFAULTS, DISCOVER_IDS, MAX_CUSTOM_CARDS, cleanLink, type CustomCard, type DiscoverCard, type DiscoverId } from "@/lib/discover";
import { saveDiscoverCards, useDiscoverData } from "@/lib/discover-client";
import { getFeature } from "@/lib/dashboard-features";
import { FeaturePicker } from "./feature-picker";

const field = "mt-1 h-9 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900";
const hint = "text-xs text-neutral-500";

/** The picture at the top of a card editor: click to upload (16:9). */
function CardImage({ url, busy, onPick }: { url: string; busy: boolean; onPick: (file?: File | null) => void }) {
  return (
    <label className="group relative block aspect-[16/9] cursor-pointer bg-neutral-100">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full flex-col items-center justify-center gap-1 text-xs text-neutral-500">
          <ImagePlus className="h-5 w-5" /> Add an image (1200 × 675)
        </span>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : url ? "Change image" : ""}
      </span>
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
    </label>
  );
}

/**
 * Admin → Discover cards: the one grid of cards on every seller's Home. The admin adds their own
 * cards (image, title, sub title, button, and the feature the button opens) and can reword or hide
 * the built-in ones.
 */
export function DiscoverSettings({ myEmail }: { myEmail: string }) {
  const { cards: live, custom: liveCustom, loaded } = useDiscoverData();
  const [form, setForm] = React.useState<Record<DiscoverId, DiscoverCard> | null>(null);
  const [own, setOwn] = React.useState<CustomCard[] | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState<string | null>(null);

  // start from what's saved (once it arrives)
  React.useEffect(() => {
    if (!loaded) return;
    setForm((f) => f ?? live);
    setOwn((o) => o ?? liveCustom);
  }, [loaded, live, liveCustom]);
  if (!form || !own)
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );

  const set = (id: DiscoverId, patch: Partial<DiscoverCard>) => setForm({ ...form, [id]: { ...form[id], ...patch } });
  const setCard = (i: number, patch: Partial<CustomCard>) => setOwn(own.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...own];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    setOwn(next);
  };
  const add = () => setOwn([{ id: `card-${Date.now().toString(36)}`, title: "", text: "", imageUrl: "", buttonLabel: "", feature: "", link: "", enabled: true }, ...own]);
  const dirty = JSON.stringify(form) !== JSON.stringify(live) || JSON.stringify(own) !== JSON.stringify(liveCustom);

  const upload = async (key: string, file: File | null | undefined, done: (url: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > 8 * 1024 * 1024) return setError("That image is over 8 MB.");
    setError("");
    setUploading(key);
    try {
      done(await storeService.uploadPlatformImage(file, `discover-${key}`));
    } catch {
      setError("Couldn't upload that image. Try again.");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    for (const c of own) {
      const name = c.title.trim() || "your new card";
      if (!c.title.trim()) return setError("Every card you add needs a title (or delete the empty one).");
      if (!c.feature && !c.link.trim()) return setError(`Choose what "${name}" opens: pick a feature, or add a web link.`);
      if (c.link && !cleanLink(c.link)) return setError(`The web link on "${name}" must start with https:// or /`);
    }
    for (const id of DISCOVER_IDS) {
      if (form[id].link && !cleanLink(form[id].link)) return setError(`The web link for "${DISCOVER_DEFAULTS[id].name}" must start with https:// or /`);
    }
    setSaving(true);
    setError("");
    try {
      await saveDiscoverCards(form, own, myEmail);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Couldn't save. Check that you're signed in as an admin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold tracking-tight">Discover cards</h2>
          <p className="text-sm text-neutral-500">
            The cards under &ldquo;Discover&rdquo; on every seller&apos;s Home. Each one has a picture, a title, a sub title and a button that opens a feature. Your own cards show first, then the built-in ones.
          </p>
        </div>
        <div className="flex gap-2">
          {own.length < MAX_CUSTOM_CARDS && (
            <button type="button" onClick={add} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold hover:border-neutral-900">
              <Plus className="h-4 w-4" /> Add card
            </button>
          )}
          <button type="button" onClick={save} disabled={!dirty || saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* ---- the admin's own cards ---- */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Your cards ({own.length} of {MAX_CUSTOM_CARDS})</h3>
        {!own.length && (
          <button type="button" onClick={add} className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed border-neutral-300 px-4 py-8 text-sm text-neutral-500 hover:border-neutral-900 hover:text-neutral-900">
            <Plus className="h-5 w-5" />
            Add your first card, e.g. &ldquo;Take payments online&rdquo; with a button that opens Payments
          </button>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {own.map((c, i) => (
            <div key={c.id} className={`rounded-2xl border bg-white ${c.enabled ? "border-neutral-200" : "border-dashed border-neutral-300"}`}>
              <div className={`overflow-hidden rounded-t-2xl ${c.enabled ? "" : "opacity-60"}`}>
                <CardImage url={c.imageUrl} busy={uploading === c.id} onPick={(f) => upload(c.id, f, (url) => setCard(i, { imageUrl: url }))} />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Card {i + 1}</p>
                  <span className="flex items-center gap-1">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier" style={{ minHeight: 0 }} className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" disabled={i === own.length - 1} onClick={() => move(i, 1)} aria-label="Move later" style={{ minHeight: 0 }} className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <label className="ml-2 inline-flex items-center gap-1.5 text-xs text-neutral-600">
                      <input type="checkbox" checked={c.enabled} onChange={(e) => setCard(i, { enabled: e.target.checked })} className="accent-neutral-900" /> Show
                    </label>
                    <button type="button" onClick={() => setOwn(own.filter((_, j) => j !== i))} aria-label="Delete card" style={{ minHeight: 0 }} className="ml-1 rounded-md p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                <label className="block">
                  <span className={hint}>Title</span>
                  <input value={c.title} onChange={(e) => setCard(i, { title: e.target.value })} maxLength={80} placeholder="Take payments online" className={field} />
                </label>
                <label className="block">
                  <span className={hint}>Sub title</span>
                  <textarea value={c.text} onChange={(e) => setCard(i, { text: e.target.value })} maxLength={200} rows={2} placeholder="Connect Razorpay so buyers can pay by UPI, card or netbanking." className="mt-1 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className={hint}>Button opens</span>
                    <div className="mt-1">
                      <FeaturePicker value={c.feature} onChange={(id) => setCard(i, { feature: id })} noneLabel="A web link (below)" />
                    </div>
                  </div>
                  <label className="block">
                    <span className={hint}>Button name</span>
                    <input value={c.buttonLabel} onChange={(e) => setCard(i, { buttonLabel: e.target.value })} maxLength={30} placeholder={getFeature(c.feature)?.button || "Open"} className={field} />
                  </label>
                </div>
                {!c.feature && (
                  <label className="block">
                    <span className={hint}>Web link (only when no feature is chosen)</span>
                    <input value={c.link} onChange={(e) => setCard(i, { link: e.target.value })} placeholder="https://docs.shopersite.in/…" className={field} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-neutral-200" />

      {/* ---- the built-in cards ---- */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Built-in cards</h3>
          <p className="text-sm text-neutral-500">Always available. Empty fields use the built-in words and picture. Untick &ldquo;Show&rdquo; to hide one.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {DISCOVER_IDS.map((id) => {
            const c = form[id];
            const d = DISCOVER_DEFAULTS[id];
            return (
              <div key={id} className={`rounded-2xl border bg-white ${c.enabled ? "border-neutral-200" : "border-dashed border-neutral-300"}`}>
                <div className={`overflow-hidden rounded-t-2xl ${c.enabled ? "" : "opacity-60"}`}>
                  <CardImage url={c.imageUrl} busy={uploading === id} onPick={(f) => upload(id, f, (url) => set(id, { imageUrl: url }))} />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{d.name}</p>
                    <span className="flex items-center gap-3">
                      {c.imageUrl && (
                        <button type="button" onClick={() => set(id, { imageUrl: "" })} style={{ minHeight: 0 }} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" /> Image
                        </button>
                      )}
                      <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
                        <input type="checkbox" checked={c.enabled} onChange={(e) => set(id, { enabled: e.target.checked })} className="accent-neutral-900" /> Show
                      </label>
                    </span>
                  </div>
                  <label className="block">
                    <span className={hint}>Title</span>
                    <input value={c.title} onChange={(e) => set(id, { title: e.target.value })} maxLength={80} placeholder={id === "season" ? "Automatic: changes every month" : d.title} className={field} />
                  </label>
                  <label className="block">
                    <span className={hint}>Sub title</span>
                    <textarea value={c.text} onChange={(e) => set(id, { text: e.target.value })} maxLength={200} rows={2} placeholder={id === "season" ? "Automatic: this month's selling tip" : d.text} className="mt-1 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className={hint}>Button opens</span>
                      <div className="mt-1">
                        <FeaturePicker value={c.feature} onChange={(f) => set(id, { feature: f })} noneLabel="Its own built-in page" />
                      </div>
                    </div>
                    <label className="block">
                      <span className={hint}>Button name</span>
                      <input value={c.linkLabel} onChange={(e) => set(id, { linkLabel: e.target.value })} maxLength={30} placeholder={getFeature(c.feature)?.button || DISCOVER_BUTTONS[id]} className={field} />
                    </label>
                  </div>
                  {!c.feature && (
                    <label className="block">
                      <span className={hint}>Web link (optional, opens instead of the built-in page)</span>
                      <input value={c.link} onChange={(e) => set(id, { link: e.target.value })} placeholder="https://docs.shopersite.in/…" className={field} />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
