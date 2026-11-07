"use client";

import React, { useEffect, useState } from "react";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import {
  PLATFORM_PLANS,
  PLAN_IDS,
  UNLIMITED,
  getAllPlanAccess,
  getAllPlanDetails,
  type PlanAccess,
  type PlanDetails,
  type PlanId,
} from "@/lib/plans";
import { storeService } from "@/lib/store-service";

type FeatureKey = "coupons" | "reviews" | "email" | "customDomain" | "themeEditor";
const FEATURES: { key: FeatureKey; label: string }[] = [
  { key: "coupons", label: "Discount coupons" },
  { key: "reviews", label: "Customer reviews" },
  { key: "email", label: "Email integration" },
  { key: "customDomain", label: "Custom domain" },
  { key: "themeEditor", label: "Theme editor" },
];

const field =
  "w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-sm outline-none focus:border-neutral-900 transition-colors disabled:bg-neutral-50 disabled:text-neutral-400";

/** Admin: one card per plan, each with its own editor (name, price, text, features, limits, access). */
export function PlansManager({ storesByPlan }: { storesByPlan: Record<PlanId, number> }) {
  const [, setTick] = useState(0);
  const [editing, setEditing] = useState<PlanId | null>(null);
  const [savedId, setSavedId] = useState<PlanId | null>(null);

  // Re-render when plans are changed (here or on another device)
  useEffect(() => storeService.subscribe(() => setTick((t) => t + 1)), []);

  const details = getAllPlanDetails();
  const access = getAllPlanAccess();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLAN_IDS.map((id) =>
        editing === id ? (
          <PlanEditor
            key={id}
            id={id}
            details={details[id]}
            access={access[id]}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              setSavedId(id);
              setTimeout(() => setSavedId(null), 2500);
            }}
          />
        ) : (
          <PlanCard
            key={id}
            id={id}
            stores={storesByPlan[id]}
            access={access[id]}
            saved={savedId === id}
            onEdit={() => setEditing(id)}
          />
        )
      )}
    </div>
  );
}

function PlanCard({
  id,
  stores,
  access,
  saved,
  onEdit,
}: {
  id: PlanId;
  stores: number;
  access: PlanAccess;
  saved: boolean;
  onEdit: () => void;
}) {
  const plan = PLATFORM_PLANS[id];
  const limit = (n: number) => (n >= UNLIMITED ? "Unlimited" : n.toLocaleString("en-IN"));
  return (
    <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-base font-semibold text-neutral-950">{plan.name}</span>
          <span className="block text-xs text-neutral-500">
            {stores} store{stores === 1 ? "" : "s"}
          </span>
        </div>
        {saved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Saved
          </span>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-800 hover:border-neutral-900"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-3xl font-semibold tracking-tight text-neutral-950">{plan.priceFormatted.split(" ")[0]}</span>
        {plan.originalPriceFormatted && (
          <span className="text-base text-neutral-400 line-through">{plan.originalPriceFormatted.split(" ")[0]}</span>
        )}
        <span className="text-sm text-neutral-500">/month</span>
      </p>
      <p className="mt-1 text-sm text-neutral-500">{plan.description}</p>

      <ul className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm text-neutral-700">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-1.5 border-t border-neutral-100 pt-4">
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
            {limit(access.maxProducts)} products
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
            {limit(access.maxBanners)} banner{access.maxBanners === 1 ? "" : "s"}
          </span>
          {FEATURES.filter((f) => access[f.key]).map((f) => (
            <span key={f.key} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              {f.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanEditor({
  id,
  details,
  access,
  onCancel,
  onSaved,
}: {
  id: PlanId;
  details: PlanDetails;
  access: PlanAccess;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(details.name);
  const [price, setPrice] = useState(String(details.priceRupees));
  const [original, setOriginal] = useState(details.originalPriceRupees ? String(details.originalPriceRupees) : "");
  const [description, setDescription] = useState(details.description);
  const [features, setFeatures] = useState(details.features.join("\n"));
  const [acc, setAcc] = useState<PlanAccess>(access);
  const [error, setError] = useState("");
  const isFree = id === "free";

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(price);
    const originalNum = original.trim() ? Number(original) : 0;
    if (!name.trim()) return setError("Give the plan a name.");
    if (!isFree && (!Number.isFinite(priceNum) || priceNum < 1)) return setError("Enter a price of at least ₹1.");
    if (original.trim() && (!Number.isFinite(originalNum) || (!isFree && originalNum <= priceNum)))
      return setError("The original price should be higher than the price, or left empty.");
    const list = features.split("\n").map((f) => f.trim()).filter(Boolean);
    if (list.length === 0) return setError("Add at least one feature.");

    storeService.savePlan(
      id,
      {
        name: name.trim(),
        priceRupees: isFree ? 0 : Math.round(priceNum),
        originalPriceRupees: isFree ? 0 : Math.round(originalNum),
        description: description.trim() || details.description,
        features: list,
      },
      acc
    );
    onSaved();
  };

  const reset = () => {
    if (!window.confirm(`Put ${details.name} back to its original name, price, features and limits?`)) return;
    storeService.resetPlan(id);
    onSaved();
  };

  const unlimitedProducts = acc.maxProducts >= UNLIMITED;

  return (
    <form onSubmit={save} className="flex flex-col rounded-2xl border-2 border-neutral-950 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold">Edit {details.name}</span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close editor"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-700">Plan name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={`mt-1.5 ${field}`} />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-semibold text-neutral-700">Price (₹/month)</span>
            <input
              inputMode="numeric"
              value={isFree ? "0" : price}
              disabled={isFree}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
              className={`mt-1.5 ${field}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-neutral-700">Was (₹, optional)</span>
            <input
              inputMode="numeric"
              value={isFree ? "" : original}
              disabled={isFree}
              placeholder={isFree ? "—" : "e.g. 499"}
              onChange={(e) => setOriginal(e.target.value.replace(/[^0-9]/g, ""))}
              className={`mt-1.5 ${field}`}
            />
          </label>
        </div>
        {isFree && <p className="text-[11px] text-neutral-500">The Free plan always costs ₹0.</p>}

        <label className="block">
          <span className="text-xs font-semibold text-neutral-700">Short description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className={`mt-1.5 ${field}`} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-neutral-700">Features (one per line)</span>
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={6}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white p-3.5 text-sm leading-relaxed outline-none focus:border-neutral-900"
          />
          <span className="mt-1 block text-[11px] text-neutral-500">The &ldquo;Up to … products&rdquo; line follows the product limit below.</span>
        </label>

        <div className="rounded-xl bg-neutral-50 p-4">
          <span className="text-xs font-semibold text-neutral-700">Limits</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[11px] text-neutral-500">Products</span>
              <input
                inputMode="numeric"
                value={unlimitedProducts ? "" : String(acc.maxProducts)}
                placeholder={unlimitedProducts ? "Unlimited" : ""}
                disabled={unlimitedProducts}
                onChange={(e) => setAcc({ ...acc, maxProducts: Math.min(UNLIMITED - 1, Number(e.target.value.replace(/[^0-9]/g, "")) || 0) })}
                className={`mt-1 ${field}`}
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-neutral-500">Homepage banners</span>
              <input
                inputMode="numeric"
                value={String(acc.maxBanners)}
                onChange={(e) => setAcc({ ...acc, maxBanners: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                className={`mt-1 ${field}`}
              />
            </label>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              checked={unlimitedProducts}
              onChange={(e) => setAcc({ ...acc, maxProducts: e.target.checked ? UNLIMITED : 100 })}
              className="h-4 w-4 accent-neutral-900"
            />
            Unlimited products
          </label>

          <span className="mt-4 block text-xs font-semibold text-neutral-700">Unlocks</span>
          <div className="mt-2 space-y-2">
            {FEATURES.map((f) => {
              const on = acc[f.key];
              return (
                <div key={f.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-neutral-800">{f.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${f.label} on ${details.name}`}
                    onClick={() => setAcc({ ...acc, [f.key]: !on })}
                    style={{ minHeight: 0, height: 24 }}
                    className={`relative w-11 shrink-0 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-neutral-300"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:border-neutral-900"
        >
          Cancel
        </button>
        <button type="submit" className="h-11 rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black">
          Save {details.name}
        </button>
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset to original
      </button>
    </form>
  );
}
