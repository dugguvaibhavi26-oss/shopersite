"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { MessageCircle, Store } from "lucide-react";
import { storeService, type StoreData } from "@/lib/store-service";

export const DEFAULT_CLOSED_MESSAGE = "We're taking a short break and not taking orders right now. Please check back soon.";

/**
 * When the seller switches their shop off from the dashboard, every storefront page shows this
 * card on top (it can't be dismissed) and orders are refused. Updates live: switching the shop
 * back on removes the card without a reload.
 */
export function StoreClosedGate() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = String(params?.subdomain || "").toLowerCase();
  const [store, setStore] = React.useState<StoreData | null>(null);

  React.useEffect(() => {
    if (!subdomain) return;
    const sync = () => setStore(storeService.getStore(subdomain));
    sync();
    return storeService.subscribe(sync);
  }, [subdomain]);

  const closed = !!store?.isClosed;

  React.useEffect(() => {
    if (!closed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [closed]);

  if (!store || !closed) return null;

  const phone = (store.contactPhone || "").replace(/[^0-9]/g, "");
  const whatsapp = phone ? `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}` : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-closed-title"
      className="home-sans fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 backdrop-blur-md sm:items-center font-[Inter,sans-serif]"
    >
      <div className="hero-rise w-full max-w-sm rounded-[28px] bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-neutral-950 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] sm:pb-6">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logoUrl} alt="" className="mx-auto h-14 w-14 rounded-2xl border border-neutral-200 object-cover" />
        ) : (
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-black">
            <Store className="h-6 w-6" />
          </span>
        )}
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
          Closed
        </p>
        <h2 id="store-closed-title" className="mt-3 text-[1.5rem] font-semibold leading-tight tracking-[-0.02em]">
          {store.name} is currently unavailable
        </h2>
        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600">
          {store.closedMessage?.trim() || DEFAULT_CLOSED_MESSAGE}
        </p>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-black text-[15px] font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <MessageCircle className="h-4 w-4" />
            Message the shop
          </a>
        )}
      </div>
    </div>
  );
}
