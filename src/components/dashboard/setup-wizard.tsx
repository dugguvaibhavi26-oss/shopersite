"use client";

import { useState } from "react";
import { ArrowLeft, Check, ImageIcon, PartyPopper, UploadCloud, X } from "lucide-react";
import { storeService, type StoreData } from "@/lib/store-service";

type StepId = "logo" | "products" | "upi" | "banner" | "discount" | "instagram";

export const SETUP_STEPS: { id: StepId; title: string; hint: string }[] = [
  { id: "logo", title: "Add your store logo", hint: "Shown at the top of your store and on order messages." },
  { id: "products", title: "Add 5 products", hint: "A photo, a name and a price is all you need to start." },
  { id: "upi", title: "Set up UPI payments", hint: "Buyers pay straight to this UPI ID. We never hold the money." },
  { id: "banner", title: "Upload a storefront banner", hint: "The big image buyers see first on your store." },
  { id: "discount", title: "Create a discount code", hint: "Give first-time buyers a reason to order today." },
  { id: "instagram", title: "Link your Instagram", hint: "Buyers can find and follow you from your store." },
];

export function isSetupStepDone(store: StoreData, id: StepId): boolean {
  switch (id) {
    case "logo":
      return Boolean(store.logoUrl);
    case "products":
      return store.products.length >= 5;
    case "upi":
      return Boolean(store.upiId?.trim());
    case "banner":
      return store.banners.length > 0;
    case "discount":
      return (store.discounts?.length || 0) > 0;
    case "instagram":
      return Boolean(store.instagramHandle?.trim());
  }
}

const readImage = (file: File, done: (url: string) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => e.target?.result && done(e.target.result as string);
  reader.readAsDataURL(file);
};

function ImagePicker({ value, onChange, label, wide = false }: { value: string; onChange: (v: string) => void; label: string; wide?: boolean }) {
  return (
    <label className="block cursor-pointer">
      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], onChange)} />
      <span
        className={`relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          value ? "border-transparent" : "border-neutral-300 bg-neutral-50 hover:border-neutral-900"
        } ${wide ? "aspect-[2/1]" : "h-36"}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={`absolute inset-0 w-full h-full ${wide ? "object-cover" : "object-contain p-3"}`} />
        ) : (
          <>
            <UploadCloud className="w-6 h-6 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-700">{label}</span>
            <span className="text-[11px] text-neutral-400">PNG or JPG</span>
          </>
        )}
      </span>
    </label>
  );
}

function Field({ label, prefix, ...props }: { label: string; prefix?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{label}</span>
      <span className="flex items-center rounded-[10px] border border-neutral-300 bg-white focus-within:border-neutral-900">
        {prefix && <span className="pl-3 text-sm text-neutral-400">{prefix}</span>}
        <input {...props} className="h-11 w-full bg-transparent px-3 text-sm outline-none" />
      </span>
    </label>
  );
}

/**
 * Centred, one-step-at-a-time store setup. Each step can be finished right here or skipped.
 * Opens at `startAt` (the step the seller tapped) and walks forward through the rest.
 */
export function SetupWizard({
  store,
  startAt,
  onClose,
  onChanged,
}: {
  store: StoreData;
  startAt: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [index, setIndex] = useState(startAt);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  // one value bag for the current step's fields
  const [logo, setLogo] = useState(store.logoUrl || "");
  const [upi, setUpi] = useState(store.upiId || "");
  const [insta, setInsta] = useState((store.instagramHandle || "").replace(/^@/, ""));
  const [pImage, setPImage] = useState("");
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [bImage, setBImage] = useState("");
  const [bCategory, setBCategory] = useState(store.categories.find((c) => !c.isParent)?.name || store.categories[0]?.name || "");
  const [dCode, setDCode] = useState("WELCOME10");
  const [dPercent, setDPercent] = useState("10");

  const step = SETUP_STEPS[index];
  const done = isSetupStepDone(store, step.id);

  const next = () => {
    setError("");
    setNote("");
    if (index + 1 < SETUP_STEPS.length) setIndex(index + 1);
    else setFinished(true);
  };
  const back = () => {
    setError("");
    setNote("");
    setIndex(Math.max(0, index - 1));
  };

  /** Saves the step. Returns true when the wizard should move on. */
  const save = (): boolean => {
    setError("");
    const sub = store.subdomain;
    switch (step.id) {
      case "logo":
        if (!logo) return setError("Upload your logo first."), false;
        storeService.updateStore(sub, { logoUrl: logo });
        break;
      case "upi": {
        const v = upi.trim();
        if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(v)) return setError("Enter a UPI ID like yourname@okaxis."), false;
        storeService.updateStore(sub, { upiId: v });
        break;
      }
      case "instagram": {
        const handle = insta.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
        if (!/^[\w.]{1,30}$/.test(handle)) return setError("Enter your Instagram username, like roxtenn.store."), false;
        storeService.updateStore(sub, { instagramHandle: handle });
        break;
      }
      case "products": {
        const price = parseFloat(pPrice);
        if (!pName.trim()) return setError("Give the product a name."), false;
        if (!(price > 0)) return setError("Enter a price in rupees."), false;
        const res = storeService.addProduct(sub, {
          title: pName.trim(),
          slug: `${pName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36).slice(-4)}`,
          description: "",
          price: Math.round(price * 100),
          stock: 10,
          category: store.categories.find((c) => !c.isParent)?.name || "General",
          images: pImage ? [pImage] : [],
          status: "published",
        });
        if (!res.success) return setError(res.error || "Couldn't add the product."), false;
        onChanged();
        setPImage("");
        setPName("");
        setPPrice("");
        const count = store.products.length + 1;
        // stay on this step until five are in, so the seller can keep adding
        if (count < 5) {
          setNote(`Added. ${count} of 5 done, add another or continue.`);
          return false;
        }
        break;
      }
      case "banner": {
        if (!bImage) return setError("Upload a banner image first."), false;
        storeService.saveBanners(sub, [
          ...store.banners,
          {
            id: `banner-${Date.now().toString(36)}`,
            storeId: store.id,
            title: bCategory ? `${bCategory} Collection` : "Hero Banner",
            imageUrl: bImage,
            ctaLink: bCategory ? `/s/${sub}?category=${encodeURIComponent(bCategory)}` : `/s/${sub}`,
            targetType: bCategory ? "category" : "custom",
            targetValue: bCategory || undefined,
            position: store.banners.length,
            isActive: true,
          },
        ]);
        break;
      }
      case "discount": {
        const code = dCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        const pct = parseFloat(dPercent);
        if (code.length < 3) return setError("Use a code of at least 3 letters or numbers."), false;
        if (!(pct >= 1 && pct <= 90)) return setError("Pick a discount between 1% and 90%."), false;
        storeService.addDiscount(sub, { code, type: "percentage", value: Math.round(pct), minOrderValue: 0, isActive: true });
        break;
      }
    }
    onChanged();
    return true;
  };

  const doneCount = SETUP_STEPS.filter((st) => isSetupStepDone(store, st.id)).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-backdrop-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Set up your store"
        className="relative w-full max-w-md max-h-[calc(100vh-32px)] overflow-y-auto rounded-[24px] bg-white shadow-[0_40px_80px_-24px_rgba(0,0,0,0.45)] animate-sheet-up"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {finished ? (
          <div className="px-6 pt-10 pb-6 text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PartyPopper className="w-6 h-6" />
            </span>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              {doneCount === SETUP_STEPS.length ? "Your store is fully set up" : "Nice progress"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {doneCount} of {SETUP_STEPS.length} steps done.
              {doneCount < SETUP_STEPS.length && " Pick up the skipped ones from your overview anytime."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full h-11 rounded-[12px] bg-neutral-950 text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="px-6 pt-6 pb-5">
            {/* progress */}
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Step {index + 1} of {SETUP_STEPS.length}
            </span>
            <div className="mt-2 mr-10 grid grid-cols-6 gap-1.5">
              {SETUP_STEPS.map((st, i) => (
                <span
                  key={st.id}
                  className={`h-1.5 rounded-full transition-colors duration-300 ${
                    i === index ? "bg-neutral-950" : isSetupStepDone(store, st.id) ? "bg-emerald-500" : "bg-neutral-200"
                  }`}
                />
              ))}
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{step.hint}</p>

            <div key={step.id} className="mt-5 space-y-4 animate-enter-blur">
              {done && step.id !== "products" ? (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                  Already done. You can change it in Settings.
                </div>
              ) : step.id === "logo" ? (
                <ImagePicker value={logo} onChange={(v) => (setLogo(v), setError(""))} label="Upload logo" />
              ) : step.id === "upi" ? (
                <Field label="UPI ID" value={upi} onChange={(e) => (setUpi(e.target.value), setError(""))} placeholder="yourname@okaxis" autoFocus />
              ) : step.id === "instagram" ? (
                <Field label="Instagram username" prefix="@" value={insta} onChange={(e) => (setInsta(e.target.value), setError(""))} placeholder="roxtenn.store" autoFocus />
              ) : step.id === "products" ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-600">{Math.min(store.products.length, 5)} of 5 added</span>
                    {done && <span className="font-semibold text-emerald-600">Goal reached</span>}
                  </div>
                  <div className="grid grid-cols-[96px_1fr] gap-3">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], setPImage)} />
                      <span className="relative flex h-[96px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-900 transition-colors">
                        {pImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-neutral-400" />
                        )}
                      </span>
                    </label>
                    <div className="space-y-2.5">
                      <Field label="Product name" value={pName} onChange={(e) => (setPName(e.target.value), setError(""))} placeholder="Oversized cotton tee" />
                      <Field label="Price" prefix="₹" inputMode="decimal" value={pPrice} onChange={(e) => (setPPrice(e.target.value), setError(""))} placeholder="799" />
                    </div>
                  </div>
                </>
              ) : step.id === "banner" ? (
                <>
                  <ImagePicker value={bImage} onChange={(v) => (setBImage(v), setError(""))} label="Upload banner image" wide />
                  {store.categories.length > 0 && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Opens this collection</span>
                      <select
                        value={bCategory}
                        onChange={(e) => setBCategory(e.target.value)}
                        className="h-11 w-full rounded-[10px] border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900"
                      >
                        {store.categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-[1fr_110px] gap-3">
                  <Field label="Code" value={dCode} onChange={(e) => (setDCode(e.target.value.toUpperCase()), setError(""))} placeholder="WELCOME10" />
                  <Field label="Discount" prefix="%" inputMode="numeric" value={dPercent} onChange={(e) => (setDPercent(e.target.value), setError(""))} placeholder="10" />
                </div>
              )}
              {note && <p className="text-xs font-medium text-emerald-700">{note}</p>}
              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
            </div>

            {/* actions */}
            <div className="mt-6 flex items-center gap-2">
              {index > 0 && (
                <button
                  type="button"
                  onClick={back}
                  aria-label="Back"
                  className="w-11 h-11 shrink-0 rounded-[12px] border border-neutral-200 flex items-center justify-center hover:border-neutral-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="h-11 px-4 rounded-[12px] text-sm font-semibold text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
              >
                {done ? "Next" : "Skip"}
              </button>
              {!(done && step.id !== "products") && (
                <button
                  type="button"
                  onClick={() => save() && next()}
                  className="ml-auto h-11 px-5 rounded-[12px] bg-neutral-950 text-white text-sm font-semibold hover:bg-black transition-colors"
                >
                  {step.id === "products" ? "Add product" : "Save & continue"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
