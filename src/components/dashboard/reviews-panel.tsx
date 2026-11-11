"use client";

import * as React from "react";
import { BadgeCheck, Clock, Copy, Eye, EyeOff, Search, Star, Trash2, X } from "lucide-react";
import { IQuote } from "@/components/icons";
import { storeService, type StoreData } from "@/lib/store-service";
import { appConfirm } from "@/components/ui/app-dialog";
import { CARD, EmptyState, Segmented, StatStrip } from "./ui-kit";

/** Reviews: the rating on a dark summary card, filters, and every review as a card with approve / hide / delete. */
export function ReviewsPanel({ store, onChanged, onShare, shareLabel }: { store: StoreData; onChanged: () => void; onShare: () => void; shareLabel: string }) {
  const [status, setStatus] = React.useState<"all" | "pending" | "approved">("all");
  const [stars, setStars] = React.useState(0);
  const [productId, setProductId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<"new" | "old" | "high" | "low">("new");

  const reviews = store.reviews || [];
  if (!reviews.length)
    return (
      <EmptyState
        section="reviews"
        icon={IQuote}
        title="No reviews yet, they're on their way"
        text="When buyers receive their order they can rate it from their order page. You approve each one before it goes live."
        action={{ label: shareLabel, onClick: onShare, icon: Copy }}
      />
    );

  const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
  const pending = reviews.filter((r) => r.status !== "approved").length;
  const verified = reviews.filter((r) => r.verifiedPurchase).length;
  const product = (id: string) => store.products.find((p) => p.id === id);
  const reviewed = Array.from(new Set(reviews.map((r) => r.productId)))
    .map((id) => product(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .sort((a, b) => a.title.localeCompare(b.title));

  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = reviews
    .filter((r) => status === "all" || (status === "pending" ? r.status !== "approved" : r.status === "approved"))
    .filter((r) => !stars || Math.round(r.rating) === stars)
    .filter((r) => !productId || r.productId === productId)
    .filter((r) => {
      if (!words.length) return true;
      const hay = `${r.title || ""} ${r.comment || ""} ${r.customerName || ""} ${product(r.productId)?.title || ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) =>
      sort === "high" ? b.rating - a.rating : sort === "low" ? a.rating - b.rating : sort === "old" ? (a.createdAt || "").localeCompare(b.createdAt || "") : (b.createdAt || "").localeCompare(a.createdAt || "")
    );
  const filtersOn = status !== "all" || !!stars || !!productId || !!words.length;

  const setReviewStatus = (id: string, next: "approved" | "pending") => {
    storeService.updateReviewStatus(store.subdomain, id, next);
    onChanged();
  };
  const remove = async (id: string) => {
    if (!(await appConfirm("This review is removed from your store. This can't be undone.", { title: "Delete this review?", okLabel: "Delete", danger: true }))) return;
    storeService.deleteReview(store.subdomain, id);
    onChanged();
  };
  const select = "h-10 min-w-0 rounded-full bg-white px-4 text-sm font-medium outline-none ring-1 ring-black/[0.05] focus:ring-neutral-900";

  return (
    <div className="space-y-4">
      {/* summary */}
      <StatStrip
        stats={[
          {
            label: "Average rating",
            value: (
              <span className="inline-flex items-center gap-2">
                {avg.toFixed(1)} <Star className="h-6 w-6 fill-amber-300 text-amber-300" />
              </span>
            ),
            icon: Star,
            section: "reviews",
            hint: `from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`,
          },
          { label: "Verified buyers", value: `${Math.round((verified / reviews.length) * 100)}%`, icon: BadgeCheck, section: "reviews", progress: verified / reviews.length },
          { label: "Waiting for you", value: pending, icon: Clock, section: "reviews", hint: pending ? "Approve to show them" : "All checked" },
        ]}
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-black/[0.05] focus-within:ring-neutral-900">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search words, buyer or product" className="w-full bg-transparent text-sm outline-none" />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" style={{ minHeight: 0 }} className="text-neutral-400 hover:text-neutral-900">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            items={[
              { id: "all" as const, label: "All", count: reviews.length },
              { id: "pending" as const, label: "Waiting", count: pending },
              { id: "approved" as const, label: "Live", count: reviews.length - pending },
            ]}
            value={status}
            onChange={setStatus}
          />
          <select value={stars} onChange={(e) => setStars(Number(e.target.value))} aria-label="Filter by stars" className={select}>
            <option value={0}>All stars</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"} ({reviews.filter((r) => Math.round(r.rating) === n).length})
              </option>
            ))}
          </select>
          {reviewed.length > 1 && (
            <select value={productId} onChange={(e) => setProductId(e.target.value)} aria-label="Filter by product" className={`${select} max-w-[12rem]`}>
              <option value="">All products</option>
              {reviewed.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort reviews" className={select}>
            <option value="new">Newest</option>
            <option value="old">Oldest</option>
            <option value="high">Highest rated</option>
            <option value="low">Lowest rated</option>
          </select>
        </div>
      </div>
      {filtersOn && (
        <p className="-mt-1 text-xs text-neutral-500">
          Showing {shown.length} of {reviews.length} ·{" "}
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setStars(0);
              setProductId("");
              setSearch("");
            }}
            style={{ minHeight: 0 }}
            className="font-semibold text-neutral-900 underline underline-offset-2"
          >
            Clear filters
          </button>
        </p>
      )}

      {/* list */}
      {shown.length === 0 ? (
        <p className={`p-8 text-center text-sm text-neutral-500 ${CARD}`}>No reviews match.</p>
      ) : (
        <ul className={`divide-y divide-neutral-100 overflow-hidden ${CARD}`}>
          {shown.map((r) => {
            const p = product(r.productId);
            const live = r.status === "approved";
            return (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50/70 sm:px-5">
                {p?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="mt-0.5 h-9 w-9 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
                    <Star className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="flex text-amber-400" aria-label={`${r.rating} stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-3 w-3 ${n <= r.rating ? "fill-current" : "text-neutral-200"}`} />
                      ))}
                    </span>
                    <span className="truncate text-[13px] font-semibold">{r.customerName}</span>
                    {r.verifiedPurchase && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-label="Verified buyer" />}
                    <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{live ? "Live" : "Waiting"}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-neutral-700">
                    {r.title && <b className="font-semibold">{r.title}. </b>}
                    {r.comment}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                    {p ? p.title : "Removed product"}
                    {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReviewStatus(r.id, live ? "pending" : "approved")}
                    style={{ minHeight: 0 }}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ${live ? "border border-neutral-200 hover:border-neutral-900" : "bg-neutral-950 text-white hover:bg-black"}`}
                  >
                    {live ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{live ? "Hide" : "Approve"}</span>
                  </button>
                  <button type="button" onClick={() => remove(r.id)} aria-label="Delete review" style={{ minHeight: 0 }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
