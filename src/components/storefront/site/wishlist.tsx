"use client";

import * as React from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { productsFromSource, rupees, useSite, visibleProducts } from "./context";
import { Container, Crumbs, MLink, ProductGrid, ProductSlider } from "./ui";

/** The buyer's saved products on a page of their own (/wishlist), drawn in the shop's theme. */
export function SiteWishlist() {
  const { store, content, wishlist, toggleWish, addToBag, showToast } = useSite();
  const title = content.header.wishlistLabel || "Wishlist";
  const saved = visibleProducts(store).filter((p) => wishlist.includes(p.id));
  // products saved earlier that the shop has since removed or hidden
  const gone = wishlist.filter((id) => !saved.some((p) => p.id === id));
  // these can go straight into the bag; the rest need a size or colour picked on their page first
  const ready = saved.filter((p) => p.stock > 0 && !(p.options || []).some((o) => o.options?.length));
  const total = saved.reduce((n, p) => n + p.price, 0);
  const ideas = productsFromSource(store, "bestsellers", 10).filter((p) => !wishlist.includes(p.id));

  return (
    <div className="pb-24">
      <Container className="pt-6 sm:pt-10">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: title }]} />
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="m-h t-title">{title}</h1>
            <p className="m-muted mt-2 text-[length:calc(14px*var(--m-scale))]">
              {saved.length ? `${saved.length} saved ${saved.length === 1 ? "piece" : "pieces"} · ${rupees(total)} in all` : "Tap the heart on any product to keep it here."}
            </p>
          </div>
          {saved.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ready.length > 0 && (
                <button
                  type="button"
                  className="m-btn min-h-11 px-6"
                  onClick={() => {
                    ready.forEach((p) => addToBag(p));
                    showToast(`${ready.length} ${ready.length === 1 ? "piece" : "pieces"} added to your bag`, true);
                  }}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add {ready.length === saved.length ? "all" : ready.length} to bag
                </button>
              )}
              <button
                type="button"
                className="m-btn-outline m-btn min-h-11 px-5"
                onClick={() => [...wishlist].forEach((id) => toggleWish(id))}
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>
          )}
        </div>
        {ready.length > 0 && ready.length < saved.length && (
          <p className="m-faint mt-3 text-[length:calc(12.5px*var(--m-scale))]">Pieces with sizes or colours, or that are sold out, are added from their own page.</p>
        )}
      </Container>

      <Container className="mt-8">
        {saved.length ? (
          <ProductGrid products={saved} />
        ) : (
          <div className="m-soft flex flex-col items-center rounded-[var(--m-card)] px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--m-bg)]">
              <Heart className="h-7 w-7" strokeWidth={1.5} />
            </span>
            <p className="m-h mt-5 text-[length:calc(20px*var(--m-scale))]">Nothing saved yet</p>
            <p className="m-muted mt-2 max-w-sm text-[length:calc(14px*var(--m-scale))]">Save the pieces you love and come back to them any time. They stay on this device.</p>
            <MLink to="/catalog" className="m-btn mt-6 min-h-11 px-7">
              Browse products
            </MLink>
          </div>
        )}
        {gone.length > 0 && (
          <p className="m-faint mt-6 text-[length:calc(12.5px*var(--m-scale))]">
            {gone.length} saved {gone.length === 1 ? "piece is" : "pieces are"} no longer in the shop.{" "}
            <button type="button" className="underline underline-offset-2" onClick={() => gone.forEach((id) => toggleWish(id))}>
              Remove {gone.length === 1 ? "it" : "them"}
            </button>
          </p>
        )}
      </Container>

      {ideas.length > 0 && (
        <Container className="mt-[clamp(48px,7vw,96px)]">
          <h2 className="m-h t-section mb-[clamp(18px,2.4vw,32px)]">{saved.length ? "You might also like" : "Popular right now"}</h2>
          <ProductSlider products={ideas} />
        </Container>
      )}
    </div>
  );
}
