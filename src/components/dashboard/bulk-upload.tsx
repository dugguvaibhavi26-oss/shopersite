"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { storeService, type ProductData, type StoreData } from "@/lib/store-service";
import { canAddProduct } from "@/lib/plans";
import { checkPrices, checkStock } from "@/lib/validation";
import { uniqueSlug } from "./product-fields";

const COLUMNS = ["title", "category", "price", "mrp", "stock", "description", "image_url"] as const;
const MAX_ROWS = 500;

const TEMPLATE = [
  COLUMNS.join(","),
  `Classic Cotton Tee,T-Shirts,699,999,25,"Soft 180 GSM cotton, regular fit",https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800`,
  `Linen Shirt,Shirts,1499,,10,Breathable linen for summer,`,
].join("\n");

/** Reads CSV text (Excel / Google Sheets export): quoted fields, commas and new lines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

type Row = { line: number; data: Omit<ProductData, "id" | "storeId" | "createdAt"> | null; title: string; errors: string[] };

/** Checks every row of the sheet the same way the product form does. */
export function checkRows(cells: string[][], store: Pick<StoreData, "products">): { rows: Row[]; headerError?: string } {
  if (!cells.length) return { rows: [], headerError: "The file is empty." };
  const header = cells[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: (typeof COLUMNS)[number]) => header.indexOf(name);
  for (const need of ["title", "category", "price", "stock"] as const) {
    if (col(need) < 0) return { rows: [], headerError: `The first row must name the columns. "${need}" is missing. Download the template to see the layout.` };
  }
  const body = cells.slice(1);
  if (body.length > MAX_ROWS) return { rows: [], headerError: `Upload up to ${MAX_ROWS} products at a time.` };
  const slugs = store.products.map((p) => p.slug);
  const titles = new Set(store.products.map((p) => p.title.trim().toLowerCase()));
  const rows: Row[] = body.map((r, i) => {
    const get = (name: (typeof COLUMNS)[number]) => (col(name) >= 0 ? (r[col(name)] || "").trim() : "");
    const errors: string[] = [];
    const title = get("title").replace(/\s+/g, " ");
    if (title.length < 2) errors.push("Name is missing");
    else if (title.length > 120) errors.push("Name is over 120 characters");
    else if (titles.has(title.toLowerCase())) errors.push("A product with this name already exists");
    const category = get("category").replace(/\s+/g, " ");
    if (!category) errors.push("Category is missing");
    else if (category.length > 40) errors.push("Category is over 40 characters");
    const priceText = get("price").replace(/[₹,\s]/g, "");
    const mrpText = get("mrp").replace(/[₹,\s]/g, "");
    const prices = checkPrices(priceText, mrpText);
    if (prices.price) errors.push(prices.price);
    if (prices.mrp) errors.push(prices.mrp);
    const stockErr = checkStock(get("stock"));
    if (stockErr) errors.push(stockErr);
    const description = get("description").slice(0, 3000);
    const image = get("image_url");
    if (image && !/^https:\/\/[^\s"'<>]+$/i.test(image)) errors.push("Image link must start with https://");
    if (errors.length) return { line: i + 2, data: null, title, errors };
    titles.add(title.toLowerCase());
    const slug = uniqueSlug(title, slugs);
    slugs.push(slug);
    const mrp = mrpText ? Math.round(Number(mrpText) * 100) : undefined;
    return {
      line: i + 2,
      title,
      errors,
      data: {
        title,
        slug,
        category,
        description,
        price: Math.round(Number(priceText) * 100),
        ...(mrp ? { compareAtPrice: mrp } : {}),
        stock: Number(get("stock")),
        images: image ? [image] : [],
        status: "published",
        rating: 5,
        reviewCount: 0,
      },
    };
  });
  return { rows };
}

export function BulkUploadPanel({ store, onClose, onDone }: { store: StoreData; onClose: () => void; onDone: (added: number) => void }) {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const quota = canAddProduct(store.products.length, store.planId);
  const room = Number.isFinite(quota.limit) ? Math.max(0, quota.limit - store.products.length) : Infinity;

  const good = rows?.filter((r) => r.data) || [];
  const bad = rows?.filter((r) => !r.data) || [];

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(["﻿" + TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const readFile = async (file: File) => {
    setError("");
    setRows(null);
    if (!/\.csv$/i.test(file.name)) return setError("Upload a .csv file. In Excel or Google Sheets: File → Download / Save as → CSV.");
    if (file.size > 2 * 1024 * 1024) return setError("The file is over 2 MB. Split it into smaller files.");
    setFileName(file.name);
    const result = checkRows(parseCsv(await file.text()), store);
    if (result.headerError) return setError(result.headerError);
    if (!result.rows.length) return setError("No products found under the column names.");
    setRows(result.rows);
  };

  const importRows = () => {
    if (!good.length) return;
    if (good.length > room) return setError(`Your plan has room for ${room} more product${room === 1 ? "" : "s"}. Remove some rows or upgrade.`);
    setSaving(true);
    const res = storeService.addProductsBulk(store.subdomain, good.map((r) => r.data!));
    setSaving(false);
    if (!res.success) return setError(res.error || "Couldn't add the products.");
    onDone(res.added || 0);
  };

  return (
    <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Upload products in bulk</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Fill the template in Excel or Google Sheets, save it as CSV and upload it.
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Close bulk upload">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        <li className="rounded-lg border border-neutral-200 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Step 1</span>
          <p className="mt-1 text-sm font-semibold text-neutral-900">Get the template</p>
          <p className="mt-1 text-xs text-neutral-500">Columns: title, category, price, mrp, stock, description, image_url. Prices in rupees.</p>
          <button type="button" onClick={downloadTemplate} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-xs font-semibold hover:border-black">
            <Download className="h-3.5 w-3.5" /> Download template
          </button>
        </li>
        <li className="rounded-lg border border-neutral-200 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Step 2</span>
          <p className="mt-1 text-sm font-semibold text-neutral-900">Upload your sheet</p>
          <p className="mt-1 text-xs text-neutral-500">Up to {MAX_ROWS} products per file. {Number.isFinite(room) ? `Your plan has room for ${room} more.` : "No product limit on your plan."}</p>
          <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
          <button type="button" onClick={() => input.current?.click()} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-black px-3 text-xs font-semibold text-white hover:bg-neutral-800">
            <Upload className="h-3.5 w-3.5" /> Choose CSV file
          </button>
        </li>
      </ol>

      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-800">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}

      {rows && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <FileSpreadsheet className="h-4 w-4 text-neutral-500" />
            <span className="font-semibold text-neutral-900">{fileName}</span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">{good.length} ready</span>
            {bad.length > 0 && <span className="rounded bg-red-50 px-2 py-0.5 font-semibold text-red-700">{bad.length} need fixing</span>}
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-neutral-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Row</th>
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} className="border-t border-neutral-100 align-top">
                    <td className="px-3 py-2 text-neutral-400">{r.line}</td>
                    <td className="px-3 py-2 font-medium text-neutral-900">
                      {r.title || <span className="text-neutral-400">(no name)</span>}
                      {r.data && (
                        <span className="block font-normal text-neutral-500">
                          {r.data.category} · ₹{(r.data.price / 100).toLocaleString("en-IN")} · {r.data.stock} in stock
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {r.data ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                        </span>
                      ) : (
                        <span className="text-red-700">{r.errors.join(" · ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bad.length > 0 && <p className="text-xs text-neutral-500">Rows that need fixing are skipped. Fix them in your sheet and upload it again to add them.</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-neutral-300 px-4 text-xs font-semibold hover:border-black">
              Cancel
            </button>
            <button
              type="button"
              disabled={!good.length || saving}
              onClick={importRows}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-black px-4 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add {good.length} product{good.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
