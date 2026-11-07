"use client";

import * as React from "react";
import { Check, Loader2, Mail, MessageCircle, Package, Truck, X, ExternalLink } from "lucide-react";
import { orderPolicyOf } from "@/lib/policies";
import { checkEmail, checkPersonName, checkPhone, checkPincode, cleanPhone } from "@/lib/validation";
import { BuyerAuth, useAccountOrders } from "./buyer-auth";
import { findOrderToken, openCashfreeCheckout, requestOrderChange, trackOrders, verifyOnlinePayment, type VerifyResponse } from "@/lib/payments/client";
import type { OrderData } from "@/lib/store-service";
import { SITE_PAGE_IDS, type SitePageId } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { POLICY_IDS, POLICY_INFO, type PolicyId } from "@/lib/policies";
import { EMPTY_DETAILS, rupees, useSite, visibleProducts, whatsappLink, type SavedDetails } from "./context";
import { Container, InstagramIcon, EmptyState, MLink, ProductGrid } from "./ui";

const STEPS: { id: OrderData["fulfilmentStatus"]; label: string }[] = [
  { id: "placed", label: "Placed" },
  { id: "confirmed", label: "Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

const PAYMENT_TEXT: Record<OrderData["paymentStatus"], string> = {
  awaiting_verification: "Payment being checked by the shop",
  verified: "Payment received",
  paid: "Payment received",
  cod_pending: "Pay on delivery",
  rejected: "Payment couldn't be confirmed, the shop will contact you",
};

const dateText = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Buyers' orders aren't public, so they're fetched from the server with the order tokens this
 * device holds. Refreshes every 30 seconds so the buyer sees the shop confirm payment / ship.
 */
function useTrackedOrders(tokens: string[]) {
  const { store } = useSite();
  const [orders, setOrders] = React.useState<OrderData[] | null>(null);
  const key = tokens.join(",");
  React.useEffect(() => {
    let live = true;
    const list = key ? key.split(",") : [];
    const load = () =>
      trackOrders(store.subdomain, list)
        .then((o) => live && setOrders(o))
        .catch(() => live && setOrders((prev) => prev ?? []));
    load();
    const t = window.setInterval(load, 30_000);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, [store.subdomain, key]);
  return orders;
}

/** Online (Cashfree) orders join the store's list only once paid, so the order page asks the server. */
function useOnlinePayment(token: string, known: boolean) {
  const { store } = useSite();
  const [result, setResult] = React.useState<VerifyResponse | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [error, setError] = React.useState("");
  const online = /^tok_sh_[a-f0-9]{24}$/.test(token);

  const check = React.useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      setResult(await verifyOnlinePayment(store.subdomain, token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check the payment.");
    } finally {
      setChecking(false);
    }
  }, [store.subdomain, token]);

  React.useEffect(() => {
    if (online && !known) check();
  }, [online, known, check]);

  return { online, result, checking, error, check };
}

export function SiteOrder({ token }: { token: string }) {
  const { store, rememberOrder, clearBag } = useSite();
  const tracked = useTrackedOrders([token]);
  const saved = tracked?.find((o) => o.token === token);
  // until the server answers, don't start the online-payment check
  const pay = useOnlinePayment(token, tracked === null || !!saved);
  // after the buyer cancels or asks for a return, the answer from the server is shown at once
  const [changed, setChanged] = React.useState<OrderData | null>(null);
  const order = (changed && changed.token === token ? changed : null) || saved || (pay.result?.status === "paid" ? pay.result.order : undefined);
  const [placed, setPlaced] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);
  React.useEffect(() => {
    const justPlaced = new URLSearchParams(window.location.search).get("placed") === "1";
    setPlaced(justPlaced);
    if (order) rememberOrder(order.token);
    // the bag is kept while an online payment is open, and emptied once it is paid
    if (order && justPlaced && order.paymentMethod === "cashfree") clearBag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.token]);

  if (!order && tracked === null) {
    return (
      <Container>
        <div className="flex flex-col items-center py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="m-muted mt-4 text-[length:calc(14px*var(--m-scale))]">Loading your order…</p>
        </div>
      </Container>
    );
  }

  if (!order && pay.online && (pay.checking || !pay.result) && !pay.error) {
    return (
      <Container>
        <div className="flex flex-col items-center py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="m-h mt-5 text-[length:calc(18px*var(--m-scale))]">Confirming your payment…</p>
          <p className="m-muted mt-2 text-[length:calc(14px*var(--m-scale))]">Please don&apos;t close this page.</p>
        </div>
      </Container>
    );
  }

  if (!order && pay.online && (pay.error || pay.result?.status === "pending" || pay.result?.status === "failed")) {
    const r = pay.result;
    const failed = r?.status === "failed";
    const title = pay.error ? "We couldn't check your payment" : failed ? "Payment not completed" : r?.status === "pending" && r.lastAttemptFailed ? "Payment failed" : "Payment not finished yet";
    const text = pay.error
      ? pay.error
      : failed
        ? r.reason
        : "No money has been taken for this order. You can try paying again, or go back to your bag.";
    return (
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--m-text)_8%,transparent)]">
            <X className="h-6 w-6" />
          </span>
          <h1 className="m-h mt-5 text-[length:calc(22px*var(--m-scale))]">{title}</h1>
          <p className="m-muted mt-2 text-[length:calc(14px*var(--m-scale))]">{text}</p>
          <div className="mt-6 flex w-full flex-col gap-3">
            {r?.status === "pending" && (
              <button
                type="button"
                disabled={retrying}
                onClick={async () => {
                  setRetrying(true);
                  try {
                    await openCashfreeCheckout(r.paymentSessionId, r.mode);
                  } catch {
                    setRetrying(false);
                  }
                }}
                className="m-btn h-12 w-full"
              >
                {retrying ? "Opening payment…" : "Try paying again"}
              </button>
            )}
            <button type="button" onClick={pay.check} disabled={pay.checking} className="m-btn m-btn-outline h-12 w-full">
              {pay.checking ? "Checking…" : "I've paid, check again"}
            </button>
            <MLink to="/cart" className="m-muted text-[length:calc(13px*var(--m-scale))] underline underline-offset-4">
              Back to bag
            </MLink>
          </div>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container>
        <EmptyState title="Order not found" text="Check the link, or find your order with your phone number." action={{ label: "Find my order", to: "/account" }} />
      </Container>
    );
  }

  const cancelled = order.fulfilmentStatus === "cancelled";
  const reached = STEPS.findIndex((s) => s.id === order.fulfilmentStatus);
  const wa = whatsappLink(
    store.contactPhone,
    `Hi ${store.name}! About my order ${order.number} (${rupees(order.total)}).`
  );

  return (
    <Container className="max-w-4xl pb-20 pt-8 sm:pt-12">
      {placed && (
        <div className="m-rise mb-10 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--m-accent)] text-[var(--m-accent-text)]">
            <Check className="h-7 w-7" />
          </span>
          <h1 className="m-h mt-6 t-title">Thank you, {order.customer.name.split(" ")[0]}</h1>
          <p className="m-muted mx-auto mt-3 max-w-md text-[length:calc(15px*var(--m-scale))]">
            Your order {order.number} is placed. {order.paymentMethod === "cashfree" ? "Your payment was received." : order.paymentMethod === "upi" ? "We've sent your UPI reference to the shop. They'll confirm your payment shortly." : "The shop will confirm it shortly."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-muted m-cap text-[length:calc(11px*var(--m-scale))] tracking-[0.16em]">Order</p>
          <p className={cn("m-h mt-1", placed ? "text-[length:calc(24px*var(--m-scale))]" : "t-title")}>{order.number}</p>
        </div>
        <p className="m-muted text-[length:calc(14px*var(--m-scale))]">Placed {dateText(order.createdAt)}</p>
      </div>

      <div className="m-soft mt-6 rounded-3xl p-5 sm:p-7">
        {cancelled ? (
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <X className="h-4 w-4" /> {order.cancelledBy === "buyer" ? "You cancelled this order" : order.cancelledBy === "seller" ? `${store.name} cancelled this order` : "This order was cancelled"}
            </p>
            {order.cancelReason && <p className="m-muted mt-2 text-[length:calc(14px*var(--m-scale))]">Reason: {order.cancelReason}</p>}
          </div>
        ) : (
          <ol className="grid grid-cols-5 gap-1">
            {STEPS.map((s, i) => (
              <li key={s.id} className="min-w-0">
                <div className={cn("h-1 rounded-full", i <= reached ? "bg-[var(--m-text)]" : "bg-[color-mix(in_srgb,var(--m-text)_12%,transparent)]")} />
                <p className={cn("mt-2 truncate text-[length:calc(11px*var(--m-scale))] font-medium sm:text-[length:calc(13px*var(--m-scale))]", i > reached && "m-faint")}>{s.label}</p>
              </li>
            ))}
          </ol>
        )}
        <p className="m-muted mt-5 text-[length:calc(14px*var(--m-scale))]">{PAYMENT_TEXT[order.paymentStatus]}</p>
        {order.returnRequest && (
          <div className="m-line mt-5 border-t pt-5 text-[length:calc(14px*var(--m-scale))]">
            <p className="font-semibold">
              {order.returnRequest.status === "requested"
                ? "Return requested: the shop will reply soon"
                : order.returnRequest.status === "approved"
                  ? "Return accepted"
                  : order.returnRequest.status === "received"
                    ? "Return received by the shop"
                    : "Return not accepted"}
            </p>
            {order.returnRequest.note && <p className="m-muted mt-1">{order.returnRequest.note}</p>}
          </div>
        )}
        {order.refund && (
          <p className="m-line mt-5 border-t pt-5 text-[length:calc(14px*var(--m-scale))] font-semibold">
            {order.refund.status === "refunded"
              ? `Refund of ${rupees(order.refund.amount)} sent${order.refund.reference ? ` · ref ${order.refund.reference}` : ""}`
              : `Refund of ${rupees(order.refund.amount)} due from the shop`}
          </p>
        )}
        {order.trackingNumber && (
          <div className="m-line mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[length:calc(14px*var(--m-scale))]">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {order.courierName ? `${order.courierName} · ` : ""}
              {order.trackingNumber}
            </span>
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4">
                Track parcel <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <OrderChange order={order} onChanged={setChanged} />

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
        <ul className="m-line border-t">
          {order.items.map((it, i) => (
            <li key={i} className="m-line flex gap-4 border-b py-4">
              <div className="m-panel m-card relative h-20 w-16 shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image && <img src={it.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-[length:calc(14px*var(--m-scale))]">
                <p className="font-medium">{it.title}</p>
                {it.variantName && <p className="m-muted text-[length:calc(13px*var(--m-scale))]">{it.variantName}</p>}
                <p className="m-muted text-[length:calc(13px*var(--m-scale))]">Qty {it.quantity}</p>
              </div>
              <span className="text-[length:calc(14px*var(--m-scale))] font-medium">{rupees(it.price * it.quantity)}</span>
            </li>
          ))}
          <li className="space-y-2 py-4 text-[length:calc(14px*var(--m-scale))]">
            <div className="flex justify-between">
              <span className="m-muted">Subtotal</span>
              <span>{rupees(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="m-muted">Discount</span>
                <span>−{rupees(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="m-muted">Delivery</span>
              <span>{order.delivery ? rupees(order.delivery) : "Free"}</span>
            </div>
            {order.codFee > 0 && (
              <div className="flex justify-between">
                <span className="m-muted">Cash on delivery fee</span>
                <span>{rupees(order.codFee)}</span>
              </div>
            )}
            <div className="m-line flex justify-between border-t pt-3 text-[length:calc(16px*var(--m-scale))] font-semibold">
              <span>Total</span>
              <span>{rupees(order.total)}</span>
            </div>
          </li>
        </ul>
        <div className="space-y-4 text-[length:calc(14px*var(--m-scale))]">
          <div>
            <p className="m-cap m-muted text-[length:calc(11px*var(--m-scale))] tracking-[0.14em]">Delivering to</p>
            <p className="mt-2 font-medium">{order.customer.name}</p>
            <p className="m-muted mt-1 leading-relaxed">
              {order.address.street}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="m-btn w-full">
              <MessageCircle className="h-4 w-4" /> Message the shop
            </a>
          )}
          <MLink to="/catalog" className="m-btn m-btn-outline w-full">
            Continue shopping
          </MLink>
        </div>
      </div>
    </Container>
  );
}

/** Cancel (before shipping) or ask for a return (after delivery), when the shop allows it. */
function OrderChange({ order, onChanged }: { order: OrderData; onChanged: (o: OrderData) => void }) {
  const { store } = useSite();
  const policy = orderPolicyOf(store);
  const [open, setOpen] = React.useState<"cancel" | "return" | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const canCancel = policy.cancelEnabled && ["placed", "confirmed", "packed"].includes(order.fulfilmentStatus);
  const deliveredAt = new Date(order.deliveredAt || order.updatedAt).getTime();
  const daysLeft = Math.ceil((deliveredAt + policy.returnDays * 86400000 - Date.now()) / 86400000);
  const canReturn = policy.returnEnabled && order.fulfilmentStatus === "delivered" && daysLeft > 0 && (!order.returnRequest || order.returnRequest.status === "declined");
  if (!canCancel && !canReturn) return null;

  const send = async () => {
    if (!open) return;
    if (reason.trim().length < 5) return setError("Tell the shop why, in a few words.");
    setBusy(true);
    setError("");
    try {
      onChanged(await requestOrderChange(store.subdomain, order.token, open, reason.trim()));
      setOpen(null);
      setReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="m-line mt-4 rounded-3xl border p-5 sm:p-6 text-[length:calc(14px*var(--m-scale))]">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-muted">
            {canCancel ? "Changed your mind? You can cancel until the order ships." : `You can ask for a return for ${daysLeft} more day${daysLeft === 1 ? "" : "s"}.`}
          </p>
          <button type="button" onClick={() => setOpen(canCancel ? "cancel" : "return")} className="m-btn m-btn-outline h-11 px-6">
            {canCancel ? "Cancel order" : "Request a return"}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="m-h text-[length:calc(17px*var(--m-scale))]">{open === "cancel" ? "Cancel this order?" : "Request a return"}</p>
          <label className="block">
            <span className="mb-1.5 block font-medium">{open === "cancel" ? "Why are you cancelling?" : "What's wrong with the order?"}</span>
            <textarea value={reason} onChange={(e) => (setReason(e.target.value.slice(0, 500)), setError(""))} rows={3} className="m-field !h-auto py-3" placeholder={open === "cancel" ? "e.g. Ordered the wrong size" : "e.g. The colour is different from the photo"} />
          </label>
          {open === "cancel" && (order.paymentStatus === "paid" || order.paymentStatus === "verified" || order.paymentUtr) && (
            <p className="m-muted text-[length:calc(13px*var(--m-scale))]">The shop will refund {rupees(order.total)} to you as per its refund policy.</p>
          )}
          {error && <p className="text-[length:calc(13px*var(--m-scale))] text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={send} className="m-btn h-11 px-6">
              {busy ? "Sending…" : open === "cancel" ? "Yes, cancel order" : "Send request"}
            </button>
            <button type="button" onClick={() => (setOpen(null), setError(""))} className="m-btn m-btn-outline h-11 px-6">
              {open === "cancel" ? "Keep my order" : "Back"}
            </button>
          </div>
          <MLink to="/pages/returns" className="m-muted text-[length:calc(13px*var(--m-scale))] underline underline-offset-4">
            Read the returns &amp; refunds policy
          </MLink>
        </div>
      )}
    </div>
  );
}

type Tab = "orders" | "wishlist" | "details";

export function SiteAccount() {
  const { store, orderTokens, rememberOrder, wishlist, details, saveDetails, showToast } = useSite();
  const [tab, setTab] = React.useState<Tab>("orders");
  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "wishlist" || t === "details" || t === "orders") setTab(t);
  }, []);
  const tracked = useTrackedOrders(orderTokens);
  const deviceOrders = orderTokens.map((t) => (tracked || []).find((o) => o.token === t)).filter(Boolean) as OrderData[];
  // orders from the buyer's account (any device), plus the ones saved on this device
  const accountOrders = useAccountOrders();
  const orders = [...deviceOrders, ...(accountOrders || []).filter((o) => !deviceOrders.some((d) => d.token === o.token))].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
  const wished = visibleProducts(store).filter((p) => wishlist.includes(p.id));

  const [phone, setPhone] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [findError, setFindError] = React.useState("");
  const [form, setForm] = React.useState<SavedDetails>(details);
  React.useEffect(() => setForm(details), [details]);

  const find = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/[^0-9]/g, "").slice(-10);
    const num = number.trim().replace(/^#?/, "#");
    // the server checks both match, so nobody can look up someone else's orders by phone alone
    try {
      const token = await findOrderToken(store.subdomain, num, digits);
      setFindError("");
      rememberOrder(token);
      setPhone("");
      setNumber("");
    } catch (err) {
      setFindError(err instanceof Error ? err.message : "We couldn't find an order with that number and phone.");
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "orders", label: "Orders" },
    { id: "wishlist", label: `Wishlist${wishlist.length ? ` (${wished.length})` : ""}` },
    { id: "details", label: "My details" },
  ];

  return (
    <Container className="pb-20 pt-8 sm:pt-12">
      <h1 className="m-h t-title">Account</h1>
      <p className="m-muted mt-3 text-[length:calc(15px*var(--m-scale))]">Your orders, wishlist and delivery details. Sign in to see your orders on any device.</p>
      <div className="mt-6 max-w-xl">
        <BuyerAuth />
      </div>
      <div className="m-line m-cap mt-8 flex gap-6 border-b text-[length:calc(12px*var(--m-scale))] font-semibold tracking-[0.12em]">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-pressed={tab === t.id} className={cn("-mb-px border-b-2 pb-3", tab === t.id ? "border-[var(--m-text)]" : "m-faint border-transparent")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            {orders.length ? (
              <ul className="grid gap-3">
                {orders.map((o) => (
                  <li key={o.token}>
                    <MLink to={`/order/${o.token}`} className="m-soft flex items-center gap-4 rounded-2xl p-4 transition-opacity hover:opacity-80">
                      <div className="m-panel m-card relative h-16 w-14 shrink-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {o.items[0]?.image ? <img src={o.items[0].image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Package className="m-faint m-auto mt-5 h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1 text-[length:calc(14px*var(--m-scale))]">
                        <p className="font-semibold">
                          {o.number} · {rupees(o.total)}
                        </p>
                        <p className="m-muted text-[length:calc(13px*var(--m-scale))]">
                          {dateText(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                        </p>
                      </div>
                      <span className="m-cap rounded-full border m-line px-3 py-1 text-[length:calc(10px*var(--m-scale))] font-semibold tracking-wider">{o.fulfilmentStatus}</span>
                    </MLink>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="m-soft rounded-2xl p-6 text-[length:calc(14px*var(--m-scale))]">
                <p className="font-semibold">No orders on this device yet</p>
                <p className="m-muted mt-1">Orders you place here show up automatically. Ordered on another phone? Find it with your order number.</p>
              </div>
            )}
          </div>
          <form onSubmit={find} className="m-line h-fit rounded-3xl border p-5 sm:p-6">
            <h2 className="m-h text-[length:calc(18px*var(--m-scale))]">Find an order</h2>
            <div className="mt-4 grid gap-3">
              <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Order number, e.g. #1004" aria-label="Order number" className="m-field" required />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number used" aria-label="Phone number" inputMode="numeric" className="m-field" required />
              {findError && <p className="text-[length:calc(13px*var(--m-scale))] text-red-600">{findError}</p>}
              <button type="submit" className="m-btn">
                Find order
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "wishlist" && (
        <div className="mt-8">
          {wished.length ? (
            <ProductGrid products={wished} />
          ) : (
            <EmptyState title="Nothing saved yet" text="Tap the heart on any product to keep it here." action={{ label: "Browse products", to: "/catalog" }} />
          )}
        </div>
      )}

      {tab === "details" && (
        <form
          className="mt-8 grid max-w-2xl gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const wrong =
              (form.name && checkPersonName(form.name, "full name")) ||
              (form.phone && checkPhone(form.phone)) ||
              (form.email && checkEmail(form.email)) ||
              (form.pincode && checkPincode(form.pincode)) ||
              "";
            if (wrong) return showToast(wrong);
            saveDetails({ ...form, phone: form.phone ? cleanPhone(form.phone) : "" });
            showToast("Details saved");
          }}
        >
          <p className="m-muted text-[length:calc(14px*var(--m-scale))]">Saved details fill in checkout for you.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["name", "Full name"],
                ["phone", "Mobile number"],
                ["email", "Email"],
                ["street", "House no., street, area"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "PIN code"],
              ] as [keyof SavedDetails, string][]
            ).map(([k, label]) => (
              <label key={k} className={cn("block", k === "street" && "sm:col-span-2")}>
                <span className="mb-1.5 block text-[length:calc(13px*var(--m-scale))] font-medium">{label}</span>
                <input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className="m-field" />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="m-btn">
              Save details
            </button>
            <button
              type="button"
              onClick={() => {
                saveDetails(EMPTY_DETAILS);
                showToast("Details removed from this device");
              }}
              className="m-btn m-btn-outline"
            >
              Forget my details
            </button>
          </div>
        </form>
      )}
    </Container>
  );
}

/** WhatsApp, email and Instagram as cards on the Contact page. */
function ContactLinks() {
  const { store } = useSite();
  const wa = whatsappLink(store.contactPhone, `Hi ${store.name}!`);
  const handle = (store.instagramHandle || "").replace(/^@/, "");
  const links = [
    wa && { href: wa, icon: <MessageCircle className="h-5 w-5" />, label: "WhatsApp", value: store.contactPhone, external: true },
    store.contactEmail && { href: `mailto:${store.contactEmail}`, icon: <Mail className="h-5 w-5" />, label: "Email", value: store.contactEmail, external: false },
    handle && { href: `https://instagram.com/${handle}`, icon: <InstagramIcon className="h-5 w-5" />, label: "Instagram", value: `@${handle}`, external: true },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; value: string; external: boolean }[];
  if (!links.length) return null;
  return (
    <div className="m-stagger mt-10 grid gap-3 sm:grid-cols-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target={l.external ? "_blank" : undefined}
          rel={l.external ? "noopener noreferrer" : undefined}
          className="m-line m-card group flex items-center gap-4 border bg-[var(--m-bg)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--m-text)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--m-accent)] text-[var(--m-accent-text)]">{l.icon}</span>
          <span className="min-w-0">
            <span className="m-cap m-muted block text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.1em]">{l.label}</span>
            <span className="block truncate text-[length:calc(14px*var(--m-scale))] font-medium">{l.value}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

/**
 * About, Contact and the policy pages, laid out the theme's way: a plain text column, a photo banner with the title
 * on it, the photo beside the text, or a big centred title over a soft card.
 */
export function SiteInfoPage({ id }: { id: string }) {
  const { content, look, store } = useSite();
  if (!SITE_PAGE_IDS.includes(id as SitePageId)) {
    return (
      <Container>
        <EmptyState title="Page not found" text="This page doesn't exist." action={{ label: "Go to the shop", to: "/" }} />
      </Container>
    );
  }
  // the seller's own policy (Dashboard → Policies) takes the place of the theme's sample text
  const own = (POLICY_IDS as readonly string[]).includes(id) ? store.policies?.[id as PolicyId] : undefined;
  const page = own?.body?.trim()
    ? { ...content.pages[id as SitePageId], title: POLICY_INFO[id as PolicyId].title, body: own.body }
    : content.pages[id as SitePageId];
  const paragraphs = page.body.split(/\n{2,}/).filter((p) => p.trim());
  const photo = id === "about" || id === "contact" ? page.image || "" : "";
  const style = photo ? look.pageStyle || "plain" : look.pageStyle === "card" ? "card" : "plain";
  const text = (list: string[]) => (
    <div className="space-y-5 text-[length:calc(16px*var(--m-scale))] leading-relaxed">
      {list.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
  const contact = id === "contact" ? <ContactLinks /> : null;
  const img = (className: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" className={className} />
  );

  if (style === "banner") {
    const [lead, ...rest] = paragraphs;
    return (
      <div className="pb-24">
        <div className="relative flex h-[clamp(260px,34vw,480px)] items-end overflow-hidden bg-[#1f1d1b] text-white">
          {img("absolute inset-0 h-full w-full object-cover")}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
          <Container className="m-rise relative pb-[clamp(22px,3.4vw,52px)]">
            <h1 className="m-h m-display t-hero [overflow-wrap:anywhere]">{page.title}</h1>
          </Container>
        </div>
        <Container className="grid gap-8 pt-[clamp(32px,5vw,72px)] md:grid-cols-[1fr_1.3fr] md:gap-16">
          {lead && <p className="m-h text-[length:calc(clamp(20px,2.2vw,30px)*var(--m-scale))] normal-case leading-snug tracking-normal">{lead}</p>}
          <div>
            {rest.length > 0 && text(rest)}
            {contact}
          </div>
        </Container>
      </div>
    );
  }

  if (style === "split") {
    return (
      <Container className="grid gap-8 pb-24 pt-8 sm:pt-12 md:grid-cols-2 md:gap-14">
        <div className="m-panel m-card relative aspect-[4/5] overflow-hidden md:sticky md:top-24 md:self-start">{img("absolute inset-0 h-full w-full object-cover")}</div>
        <div className="m-rise md:py-10">
          <h1 className="m-h t-title [overflow-wrap:anywhere]">{page.title}</h1>
          <span className="mt-6 block h-[3px] w-12 bg-[var(--m-accent)]" />
          <div className="mt-8">{text(paragraphs)}</div>
          {contact}
        </div>
      </Container>
    );
  }

  if (style === "card") {
    return (
      <Container className="pb-24 pt-10 sm:pt-16">
        <h1 className="m-h m-display t-hero m-rise text-center [overflow-wrap:anywhere]">{page.title}</h1>
        {photo && <div className="m-card relative mx-auto mt-8 aspect-[16/9] max-w-5xl overflow-hidden sm:aspect-[21/9]">{img("absolute inset-0 h-full w-full object-cover")}</div>}
        <div className={cn("m-panel m-card relative mx-auto max-w-3xl p-[clamp(22px,4vw,56px)]", photo ? "-mt-10 sm:-mt-16" : "mt-8")}>
          {text(paragraphs)}
          {contact}
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl pb-24 pt-10 sm:pt-16">
      <h1 className="m-h t-title">{page.title}</h1>
      <div className="mt-8">{text(paragraphs)}</div>
      {contact}
    </Container>
  );
}
