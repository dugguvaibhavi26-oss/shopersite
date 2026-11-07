"use client";

import * as React from "react";
import { FolderPlus, X } from "lucide-react";
import type { CategoryData } from "@/lib/store-service";

/** Money as typed: digits and one dot, at most 2 decimals, never a minus sign. */
export function moneyInput(v: string): string {
  const clean = v.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = clean.split(".");
  const out = rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
  return out.slice(0, 10);
}

/** A web-safe slug for a product name that no other product in the shop uses. */
export function uniqueSlug(title: string, taken: string[]): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "product";
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let i = 2; i < 1000; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Category for a product: pick one of the shop's categories, or make a new one right here. With no
 * categories yet, the seller names the first one (products always sit in a category).
 */
export function ProductCategoryField({
  categories,
  value,
  onChange,
  adding,
  onAdding,
  newName,
  onNewName,
  error,
}: {
  categories: CategoryData[];
  value: string;
  onChange: (v: string) => void;
  adding: boolean;
  onAdding: (on: boolean) => void;
  newName: string;
  onNewName: (v: string) => void;
  error?: string;
}) {
  const none = categories.length === 0;
  // a product saved earlier under a category that has since been deleted still shows its name
  const known = !value || categories.some((c) => c.name === value);
  return (
    <div className="space-y-1.5">
      <label className="font-bold block text-xs text-neutral-800">Category *</label>
      {adding ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
              <FolderPlus className="h-3.5 w-3.5" />
              {none ? "Create your first category" : "New category"}
            </span>
            {!none && (
              <button type="button" onClick={() => onAdding(false)} className="rounded p-1 text-neutral-500 hover:bg-neutral-200" aria-label="Cancel new category">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <input
            value={newName}
            onChange={(e) => onNewName(e.target.value)}
            maxLength={40}
            placeholder="e.g. T-Shirts, Earrings, Candles"
            className={`mt-2 h-9 w-full rounded-lg border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black ${error ? "border-red-500" : "border-neutral-300"}`}
            autoFocus
          />
          <p className="mt-1.5 text-[10px] text-neutral-500">
            {none ? "Products go inside categories. This one is created when you save the product." : "Created when you save the product. Add its photo later in Categories."}
          </p>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => (e.target.value === "__new" ? onAdding(true) : onChange(e.target.value))}
          className={`h-9 w-full rounded-lg border bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-black ${error ? "border-red-500" : "border-neutral-300"}`}
        >
          <option value="">Choose a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
          {!known && <option value={value}>{value} (deleted)</option>}
          <option value="__new">+ New category…</option>
        </select>
      )}
      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  );
}
