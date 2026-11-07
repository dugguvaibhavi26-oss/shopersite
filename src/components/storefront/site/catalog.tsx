"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import type { CategoryData, ProductData } from "@/lib/store-service";
import { cn } from "@/lib/utils";
import { activeCategories, discountPercent, productsInCategory, unitsSold, useSite, visibleProducts } from "./context";
import { Container, Crumbs, EmptyState, MLink, ProductGrid } from "./ui";

type Sort = "featured" | "newest" | "price-asc" | "price-desc";

const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

/** The full catalogue, one category (`slug`) or search results (`query`). */
export function SiteCatalog({ slug, query }: { slug?: string; query?: string }) {
  const { store, look } = useSite();
  // "chips": pills above the grid; "sidebar": a category list on the left on wide screens; "banner": a coloured title
  // banner with round category tiles
  const layout = look.catalogLayout || "chips";
  const [sort, setSort] = React.useState<Sort>("featured");
  const [saleOnly, setSaleOnly] = React.useState(false);
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sale") === "1") setSaleOnly(true);
  }, []);
  const [inStock, setInStock] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const all = activeCategories(store);
  const category: CategoryData | null = slug ? all.find((c) => c.slug === slug) || null : null;
  const parent = category?.parentId ? all.find((c) => c.id === category.parentId) || null : null;
  const children = category ? all.filter((c) => c.parentId === category.id) : [];
  // chips: the category's children, its siblings, or every top-level category
  const chips = children.length ? children : parent ? all.filter((c) => c.parentId === parent.id) : all.filter((c) => !c.parentId);

  const products = React.useMemo(() => {
    let list: ProductData[] = category ? productsInCategory(store, category) : visibleProducts(store);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q));
    }
    if (saleOnly) list = list.filter((p) => discountPercent(p) > 0);
    if (inStock) list = list.filter((p) => p.stock > 0);
    const sold = unitsSold(store);
    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    else if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || (sold[b.id] || 0) - (sold[a.id] || 0));
    return sorted;
  }, [store, category, query, saleOnly, inStock, sort]);

  if (slug && !category) {
    return (
      <Container>
        <EmptyState title="Category not found" text="This category may have been renamed or removed." action={{ label: "See all products", to: "/catalog" }} />
      </Container>
    );
  }

  const title = query !== undefined ? (query ? `“${query}”` : "Search") : category ? category.name : "Catalog";
  const filterCount = Number(saleOnly) + Number(inStock);

  return (
    <div className="pb-20">
      {category?.imageUrl && !query && layout !== "banner" && (
        <div className="m-panel relative h-[34vh] min-h-[220px] overflow-hidden sm:h-[46vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={category.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      {layout === "banner" && (
        <div className="m-panel">
          <Container className="pb-[clamp(28px,4vw,56px)] pt-[clamp(20px,3vw,40px)] text-center">
            <Crumbs
              items={[
                { label: "Home", to: "/" },
                ...(category || query !== undefined ? [{ label: "Catalog", to: "/catalog" }] : []),
                { label: query !== undefined ? "Search" : category ? category.name : "Catalog" },
              ]}
            />
            <h1 className="m-h m-display t-hero m-rise mt-[clamp(18px,3vw,40px)] [overflow-wrap:anywhere]">{title}</h1>
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
            ...(category || query !== undefined ? [{ label: "Catalog", to: "/catalog" }] : []),
            ...(parent ? [{ label: parent.name, to: `/category/${parent.slug}` }] : []),
            { label: query !== undefined ? "Search" : category ? category.name : "Catalog" },
          ]}
        />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <h1 className="m-h t-title [overflow-wrap:anywhere]">{title}</h1>
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
          <button type="button" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} className={cn("m-cap flex items-center gap-2 text-[length:calc(12px*var(--m-scale))] font-semibold tracking-wider", layout === "sidebar" && "lg:invisible")}>
            <SlidersHorizontal className="h-4 w-4" />
            Filter{filterCount ? ` (${filterCount})` : ""}
          </button>
          <label className="flex items-center gap-2 text-[length:calc(13px*var(--m-scale))]">
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
        {filtersOpen && (
          <div className="flex flex-wrap gap-2 pt-4">
            {[
              { on: saleOnly, set: setSaleOnly, label: "On sale" },
              { on: inStock, set: setInStock, label: "In stock" },
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                aria-pressed={f.on}
                onClick={() => f.set(!f.on)}
                className={cn("m-line rounded-full border px-4 py-2 text-[length:calc(13px*var(--m-scale))]", f.on && "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]")}
              >
                {f.label}
              </button>
            ))}
            {filterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSaleOnly(false);
                  setInStock(false);
                }}
                className="m-muted px-2 text-[length:calc(13px*var(--m-scale))] underline underline-offset-4"
              >
                Clear
              </button>
            )}
          </div>
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
