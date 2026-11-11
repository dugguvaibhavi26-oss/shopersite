"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CategoryData, ProductData } from "@/lib/store-service";
import { cn } from "@/lib/utils";
import { activeCategories, discountPercent, productsInCategory, rupees, unitsSold, useSite, visibleProducts } from "./context";
import { Container, Crumbs, EmptyState, MLink, ProductGrid } from "./ui";

type Sort = "featured" | "newest" | "price-asc" | "price-desc";

const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

/** A round, easy-to-read price (in paise) near `paise`: 1,000, 2,500, 5,000… */
function nicePrice(paise: number): number {
  const r = paise / 100;
  const step = r >= 5000 ? 1000 : r >= 1000 ? 500 : r >= 200 ? 100 : 50;
  return Math.max(step, Math.round(r / step) * step) * 100;
}

/** Three price ranges that split the shop's own prices into roughly even groups. */
function priceRanges(products: ProductData[]): { id: string; label: string; min: number; max: number }[] {
  const prices = products.map((p) => p.price).sort((a, b) => a - b);
  if (prices.length < 3 || prices[0] === prices[prices.length - 1]) return [];
  const low = nicePrice(prices[Math.floor(prices.length / 3)]);
  const high = nicePrice(prices[Math.floor((prices.length * 2) / 3)]);
  if (high <= low) return [];
  return [
    { id: "low", label: `Under ${rupees(low)}`, min: 0, max: low - 1 },
    { id: "mid", label: `${rupees(low)} – ${rupees(high)}`, min: low, max: high },
    { id: "high", label: `Over ${rupees(high)}`, min: high + 1, max: Infinity },
  ];
}

/** The full catalogue, one category (`slug`) or search results (`query`). */
export function SiteCatalog({ slug, query }: { slug?: string; query?: string }) {
  const { store, look, content } = useSite();
  // "chips": pills above the grid; "sidebar": a category list on the left on wide screens; "banner": a coloured title
  // banner with round category tiles
  const layout = look.catalogLayout || "chips";
  const [sort, setSort] = React.useState<Sort>("featured");
  const [saleOnly, setSaleOnly] = React.useState(false);
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sale") === "1") setSaleOnly(true);
  }, []);
  const [inStock, setInStock] = React.useState(false);
  const [price, setPrice] = React.useState("");
  const [pick, setPick] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const all = activeCategories(store);
  const category: CategoryData | null = slug ? all.find((c) => c.slug === slug) || null : null;
  const parent = category?.parentId ? all.find((c) => c.id === category.parentId) || null : null;
  const children = category ? all.filter((c) => c.parentId === category.id) : [];
  // chips: the category's children, its siblings, or every top-level category
  const chips = children.length ? children : parent ? all.filter((c) => c.parentId === parent.id) : all.filter((c) => !c.parentId);

  // everything this page could show, before the buyer's filters
  const base = React.useMemo(() => {
    let list: ProductData[] = category ? productsInCategory(store, category) : visibleProducts(store);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q));
    }
    return list;
  }, [store, category, query]);
  const ranges = React.useMemo(() => priceRanges(base), [base]);
  // on the full catalogue (not a category page) the filter can narrow to one category
  const pickable = category ? [] : all.filter((c) => !c.parentId && productsInCategory(store, c).length);
  const picked = pickable.find((c) => c.slug === pick) || null;

  const products = React.useMemo(() => {
    let list = picked ? base.filter((p) => productsInCategory(store, picked).some((x) => x.id === p.id)) : base;
    const range = ranges.find((r) => r.id === price);
    if (range) list = list.filter((p) => p.price >= range.min && p.price <= range.max);
    if (saleOnly) list = list.filter((p) => discountPercent(p) > 0);
    if (inStock) list = list.filter((p) => p.stock > 0);
    const sold = unitsSold(store);
    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    else if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || (sold[b.id] || 0) - (sold[a.id] || 0));
    return sorted;
  }, [store, base, picked, ranges, price, saleOnly, inStock, sort]);

  if (slug && !category) {
    return (
      <Container>
        <EmptyState title="Category not found" text="This category may have been renamed or removed." action={{ label: "See all products", to: "/catalog" }} />
      </Container>
    );
  }

  const title = query !== undefined ? query || "Search" : category ? category.name : content.header.catalogLabel || "Catalog";
  const filterCount = Number(saleOnly) + Number(inStock) + Number(!!price && ranges.some((r) => r.id === price)) + Number(!!picked);
  const clearFilters = () => {
    setSaleOnly(false);
    setInStock(false);
    setPrice("");
    setPick("");
  };
  // what is switched on, as chips the buyer can remove one by one
  const active = [
    ...(picked ? [{ label: picked.name, off: () => setPick("") }] : []),
    ...ranges.filter((r) => r.id === price).map((r) => ({ label: r.label, off: () => setPrice("") })),
    ...(saleOnly ? [{ label: "On sale", off: () => setSaleOnly(false) }] : []),
    ...(inStock ? [{ label: "In stock", off: () => setInStock(false) }] : []),
  ];
  const option = (on: boolean) =>
    cn(
      "m-line min-h-0 rounded-full border px-4 py-2 text-[length:calc(13px*var(--m-scale))] transition-colors",
      on ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "hover:border-[var(--m-text)]"
    );
  const group = (title: string, children: React.ReactNode) => (
    <div>
      <p className="m-cap text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.14em]">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
  const panel = (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {pickable.length > 1 &&
        group(
          "Category",
          pickable.map((c) => (
            <button key={c.id} type="button" aria-pressed={pick === c.slug} onClick={() => setPick(pick === c.slug ? "" : c.slug)} className={option(pick === c.slug)}>
              {c.name}
            </button>
          ))
        )}
      {ranges.length > 0 &&
        group(
          "Price",
          ranges.map((r) => (
            <button key={r.id} type="button" aria-pressed={price === r.id} onClick={() => setPrice(price === r.id ? "" : r.id)} className={option(price === r.id)}>
              {r.label}
            </button>
          ))
        )}
      {group(
        "Availability",
        <button type="button" aria-pressed={inStock} onClick={() => setInStock(!inStock)} className={option(inStock)}>
          In stock only
        </button>
      )}
      {group(
        "Offers",
        <button type="button" aria-pressed={saleOnly} onClick={() => setSaleOnly(!saleOnly)} className={option(saleOnly)}>
          On sale
        </button>
      )}
    </div>
  );

  return (
    <div className="pb-20">
      {(category?.bannerUrl || category?.imageUrl) && !query && layout !== "banner" && (
        <div className="m-panel relative h-[34vh] min-h-[220px] overflow-hidden sm:h-[46vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={category.bannerUrl || category.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      {layout === "banner" && (
        <div className="m-panel">
          <Container className="pb-[clamp(28px,4vw,56px)] pt-[clamp(20px,3vw,40px)] text-center">
            <Crumbs
              items={[
                { label: "Home", to: "/" },
                ...(category || query !== undefined ? [{ label: content.header.catalogLabel || "Catalog", to: "/catalog" }] : []),
                { label: query !== undefined ? "Search" : category ? category.name : content.header.catalogLabel || "Catalog" },
              ]}
            />
            {query && <p className="m-cap m-muted mt-[clamp(18px,3vw,40px)] text-[length:calc(11.5px*var(--m-scale))] font-semibold tracking-[0.16em]">Search results for</p>}
            <h1 className={cn("m-h m-display t-hero m-rise [overflow-wrap:anywhere]", query ? "mt-2" : "mt-[clamp(18px,3vw,40px)]")}>{title}</h1>
            <p className="m-muted mt-3 text-[length:calc(14px*var(--m-scale))]">
              {products.length} {products.length === 1 ? "product" : "products"}
              {category?.description && !query ? ` · ${category.description}` : ""}
            </p>
            {chips.length > 0 && query === undefined && (
              <div className="m-scroll -mx-[var(--g)] mt-8 flex gap-4 overflow-x-auto px-[var(--g)] sm:justify-center sm:gap-6">
                {[{ id: "all", slug: "", name: "All", imageUrl: "" }, ...chips].map((c) => {
                  const on = c.slug ? category?.id === c.id : !category;
                  return (
                    <MLink key={c.id} to={c.slug ? `/category/${c.slug}` : "/catalog"} className="group flex w-20 shrink-0 flex-col items-center gap-2 sm:w-24">
                      <span
                        className={cn(
                          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-[var(--m-bg)] ring-2 ring-offset-2 ring-offset-[var(--m-panel)] transition",
                          on ? "ring-[var(--m-accent)]" : "ring-transparent group-hover:ring-[color-mix(in_srgb,var(--m-text)_25%,transparent)]"
                        )}
                      >
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <span className="m-h text-[length:calc(15px*var(--m-scale))]">All</span>
                        )}
                      </span>
                      <span className={cn("text-center text-[length:calc(12px*var(--m-scale))] leading-tight", on && "font-semibold")}>{c.name}</span>
                    </MLink>
                  );
                })}
              </div>
            )}
          </Container>
        </div>
      )}
      <Container className={layout === "banner" ? "pt-2" : "pt-8 sm:pt-12"}>
        {layout !== "banner" && (
          <>
        <Crumbs
          items={[
            { label: "Home", to: "/" },
            ...(category || query !== undefined ? [{ label: content.header.catalogLabel || "Catalog", to: "/catalog" }] : []),
            ...(parent ? [{ label: parent.name, to: `/category/${parent.slug}` }] : []),
            { label: query !== undefined ? "Search" : category ? category.name : content.header.catalogLabel || "Catalog" },
          ]}
        />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {query && <p className="m-cap m-muted mb-1.5 text-[length:calc(11.5px*var(--m-scale))] font-semibold tracking-[0.16em]">Search results for</p>}
            <h1 className="m-h t-title [overflow-wrap:anywhere]">{title}</h1>
          </div>
          <p className="m-muted pb-2 text-[length:calc(14px*var(--m-scale))]">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        {category?.description && !query && <p className="m-muted mt-4 max-w-xl text-[length:calc(15px*var(--m-scale))] leading-relaxed">{category.description}</p>}
          </>
        )}

        {chips.length > 0 && query === undefined && layout !== "banner" && (
          <div className={cn("m-scroll -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0", layout === "sidebar" && "lg:hidden")}>
            <MLink
              to={parent ? `/category/${parent.slug}` : category && children.length ? `/category/${category.slug}` : "/catalog"}
              className={cn(
                "m-cap m-line shrink-0 rounded-full border px-4 py-2.5 text-[length:calc(11px*var(--m-scale))] font-semibold tracking-wider",
                (!category || (children.length > 0 && !parent)) && "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]"
              )}
            >
              All
            </MLink>
            {chips.map((c) => (
              <MLink
                key={c.id}
                to={`/category/${c.slug}`}
                className={cn(
                  "m-cap m-line shrink-0 rounded-full border px-4 py-2.5 text-[length:calc(11px*var(--m-scale))] font-semibold tracking-wider",
                  category?.id === c.id && "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]"
                )}
              >
                {c.name}
              </MLink>
            ))}
          </div>
        )}

        <div className={cn(layout === "sidebar" && "lg:mt-10 lg:grid lg:grid-cols-[220px_1fr] lg:items-start lg:gap-12")}>
        {layout === "sidebar" && (
          <aside className="sticky top-28 hidden lg:block">
            <p className="m-cap text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.14em]">Categories</p>
            <ul className="mt-4 space-y-1">
              {[{ id: "all", slug: "", name: "All products" }, ...all.filter((c) => !c.parentId)].map((c) => {
                const on = c.slug ? category?.id === c.id || parent?.id === c.id : !category;
                return (
                  <li key={c.id}>
                    <MLink
                      to={c.slug ? `/category/${c.slug}` : "/catalog"}
                      className={cn("flex min-h-0 items-center justify-between rounded-md px-3 py-2 text-[length:calc(14px*var(--m-scale))] transition-colors", on ? "bg-[var(--m-text)] font-medium text-[var(--m-bg)]" : "hover:bg-[color-mix(in_srgb,var(--m-text)_6%,transparent)]")}
                    >
                      {c.name}
                      {c.slug && <span className="text-[length:calc(11px*var(--m-scale))] opacity-60">{productsInCategory(store, c as CategoryData).length}</span>}
                    </MLink>
                  </li>
                );
              })}
            </ul>
            <p className="m-cap mt-8 text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.14em]">Filter</p>
            <div className="mt-3 space-y-2.5 text-[length:calc(14px*var(--m-scale))]">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={saleOnly} onChange={(e) => setSaleOnly(e.target.checked)} className="h-4 min-h-0 w-4 accent-[var(--m-accent)]" />
                On sale
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 min-h-0 w-4 accent-[var(--m-accent)]" />
                In stock
              </label>
            </div>
          </aside>
        )}
        <div className="min-w-0">
        <div className={cn("m-line sticky top-16 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-y bg-[var(--m-bg)] px-4 py-3 sm:mx-0 sm:px-0 lg:top-[76px]", layout === "sidebar" && "lg:mt-0")}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className={cn(
                "m-cap flex h-10 min-h-0 shrink-0 items-center gap-2 rounded-full border px-4 text-[length:calc(12px*var(--m-scale))] font-semibold tracking-wider transition-colors",
                filtersOpen || filterCount ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "m-line hover:border-[var(--m-text)]",
                layout === "sidebar" && "lg:hidden"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {filterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--m-bg)] px-1 text-[10px] text-[var(--m-text)]">{filterCount}</span>}
            </button>
            <span className="m-muted hidden whitespace-nowrap text-[length:calc(13px*var(--m-scale))] sm:inline">
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>
          </div>
          <label className="m-line flex h-10 items-center gap-2 rounded-full border px-4 text-[length:calc(13px*var(--m-scale))]">
            <span className="m-muted hidden sm:inline">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent text-[length:calc(13px*var(--m-scale))] font-medium outline-none">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {active.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            {active.map((a) => (
              <button key={a.label} type="button" onClick={a.off} className="m-soft flex min-h-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[length:calc(12.5px*var(--m-scale))] font-medium">
                {a.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="m-muted min-h-0 px-2 text-[length:calc(12.5px*var(--m-scale))] underline underline-offset-4">
              Clear all
            </button>
          </div>
        )}
        {filtersOpen && (
          <>
            {/* wide screens: a panel under the bar */}
            <div className="m-line mt-4 hidden rounded-[var(--m-card)] border p-6 sm:block">
              {panel}
              <div className="m-line mt-6 flex items-center justify-between border-t pt-4">
                <button type="button" onClick={clearFilters} className="m-muted min-h-0 text-[length:calc(13px*var(--m-scale))] underline underline-offset-4">
                  Clear all
                </button>
                <button type="button" onClick={() => setFiltersOpen(false)} className="m-btn min-h-10 px-6">
                  Show {products.length} {products.length === 1 ? "product" : "products"}
                </button>
              </div>
            </div>
            {/* phones: a sheet from the bottom */}
            <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/40 sm:hidden" onClick={() => setFiltersOpen(false)}>
              <div role="dialog" aria-modal="true" aria-label="Filter" className="animate-sheet-up max-h-[85svh] overflow-y-auto rounded-t-[22px] bg-[var(--m-bg)] p-5 pb-[calc(20px+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <p className="m-h text-[length:calc(18px*var(--m-scale))]">Filter</p>
                  <button type="button" aria-label="Close" onClick={() => setFiltersOpen(false)} className="flex h-10 w-10 items-center justify-center">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {panel}
                <div className="m-line mt-6 flex items-center gap-3 border-t pt-4">
                  <button type="button" onClick={clearFilters} className="m-btn-outline m-btn min-h-11 flex-1">
                    Clear all
                  </button>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="m-btn min-h-11 flex-[2]">
                    Show {products.length}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="pt-8">
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyState
              title={query ? "Nothing found" : "No products yet"}
              text={query ? "Try a different word, or browse the whole catalogue." : filterCount ? "No products match these filters." : "New products are coming soon."}
              action={{ label: "See all products", to: "/catalog" }}
            />
          )}
        </div>
        </div>
        </div>
      </Container>
    </div>
  );
}
