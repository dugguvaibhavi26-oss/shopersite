"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CreditCard, Lock, MessageCircle, Smartphone, Tag, Trash2, Wallet, X } from "lucide-react";
import { evaluateCoupon, storeService } from "@/lib/store-service";
import { canUseCoupons } from "@/lib/plans";
import {
  createOnlinePayment,
  createRazorpayPayment,
  fetchOnlineAvailability,
  openCashfreeCheckout,
  openRazorpayCheckout,
  verifyRazorpayPayment,
  type OnlineAvailability,
} from "@/lib/payments/client";
import { cn } from "@/lib/utils";
import { checkoutRulesOf, codAllowedFor, codLimitText, minOrderProblem } from "@/lib/checkout-rules";
import { BuyerAuth } from "./buyer-auth";
import { amountToFreeDelivery, deliveryFee } from "@/lib/delivery";
import { INDIA_STATES } from "@/lib/india-states";
import { useAuth } from "@/lib/auth-context";
import { lookupPincode } from "@/lib/pincode-client";
import { checkEmail, checkPersonName, checkPhone, checkPincode, checkPlace, checkStreet, cleanPhone, onlyDigits, phoneInput } from "@/lib/validation";
import { giftNoteKey, rupees, useSite, whatsappLink, type BagLine, type SavedDetails } from "./context";
import { Container, EmptyState, MLink, QtyStepper } from "./ui";

const STATES = INDIA_STATES;

/** Live prices for the bag, so the bag, checkout and the saved order show the same numbers. */
type PayMethod = "online" | "cod";

function useTotals(paymentMethod?: PayMethod) {
  const { store, bag, coupon } = useSite();
  // use today's price and stock, not the ones saved in the bag
  const lines: (BagLine & { available: number })[] = bag.map((l) => {
    const p = store.products.find((x) => x.id === l.productId && x.status === "published");
    return { ...l, price: p?.price ?? l.price, available: p ? p.stock : 0 };
  });
  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
  const couponResult = coupon ? evaluateCoupon(store, coupon, subtotal) : null;
  const discount = couponResult?.ok ? couponResult.amount : 0;
  const delivery = deliveryFee(store, subtotal);
  const codFee = paymentMethod === "cod" ? store.codFee || 0 : 0;
  const total = Math.max(0, subtotal - discount) + delivery + codFee;
  const unavailable = lines.filter((l) => l.available < l.quantity);
  return { lines, subtotal, couponResult, discount, delivery, codFee, total, unavailable };
}

function Summary({ paymentMethod, compact }: { paymentMethod?: PayMethod; compact?: boolean }) {
  const { store, coupon, setCoupon } = useSite();
  const t = useTotals(paymentMethod);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const couponsOn = canUseCoupons(store.planId) && (store.discounts || []).some((d) => d.isActive);
  const row = "flex items-center justify-between gap-4 text-[length:calc(14px*var(--m-scale))]";
  return (
    <div className="m-soft rounded-3xl p-5 sm:p-7">
      {compact && (
        <ul className="m-line mb-5 space-y-4 border-b pb-5">
          {t.lines.map((l) => (
            <li key={l.key} className="flex gap-3">
              <div className="m-panel m-card relative h-16 w-14 shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.image && <img src={l.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center bg-[var(--m-accent)] px-1 text-[length:calc(10px*var(--m-scale))] font-bold text-[var(--m-accent-text)]">{l.quantity}</span>
              </div>
              <div className="min-w-0 flex-1 text-[length:calc(13px*var(--m-scale))]">
                <p className="truncate font-medium">{l.title}</p>
                {l.variantName && <p className="m-muted truncate text-[length:calc(12px*var(--m-scale))]">{l.variantName}</p>}
              </div>
              <span className="text-[length:calc(13px*var(--m-scale))] font-medium">{rupees(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
      )}
      <h2 className="m-h text-[length:calc(18px*var(--m-scale))]">Order summary</h2>
      <div className="mt-5 space-y-3">
        <div className={row}>
          <span className="m-muted">Subtotal</span>
          <span>{rupees(t.subtotal)}</span>
        </div>
        {t.discount > 0 && t.couponResult?.ok && (
          <div className={row}>
            <span className="m-muted flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> {t.couponResult.discount.code}
            </span>
            <span>−{rupees(t.discount)}</span>
          </div>
        )}
        <div className={row}>
          <span className="m-muted">Delivery</span>
          <span>{t.delivery ? rupees(t.delivery) : "Free"}</span>
        </div>
        {t.codFee > 0 && (
          <div className={row}>
            <span className="m-muted">Cash on delivery fee</span>
            <span>{rupees(t.codFee)}</span>
          </div>
        )}
      </div>
      {t.delivery > 0 && amountToFreeDelivery(store, t.subtotal) > 0 && (
        <div className="mt-4">
          <p className="m-muted text-[length:calc(12px*var(--m-scale))]">Add {rupees(amountToFreeDelivery(store, t.subtotal))} more for free delivery</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--m-text)_10%,transparent)]">
            <div className="h-full bg-[var(--m-text)]" style={{ width: `${Math.min(100, (t.subtotal / store.freeDeliveryThreshold) * 100)}%` }} />
          </div>
        </div>
      )}

      {couponsOn &&
        (coupon && t.couponResult?.ok ? (
          <div className="m-line mt-5 flex items-center justify-between rounded-xl border border-dashed px-4 py-3 text-[length:calc(13px*var(--m-scale))]">
            <span className="flex items-center gap-2 font-medium">
              <Check className="h-4 w-4" /> {t.couponResult.discount.code} applied
            </span>
            <button type="button" aria-label="Remove coupon" onClick={() => setCoupon("")} className="m-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              const r = evaluateCoupon(store, code, t.subtotal);
              if (r.ok) {
                setCoupon(r.discount.code);
                setError("");
                setCode("");
              } else setError(r.error);
            }}
          >
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" aria-label="Coupon code" className="m-field h-12 uppercase" />
              <button type="submit" className="m-btn m-btn-outline min-h-12 shrink-0 px-5">
                Apply
              </button>
            </div>
            {(error || (coupon && t.couponResult && !t.couponResult.ok)) && (
              <p className="mt-2 text-[length:calc(13px*var(--m-scale))] text-red-600">{error || (t.couponResult && !t.couponResult.ok ? t.couponResult.error : "")}</p>
            )}
          </form>
        ))}

      <div className="m-line mt-5 flex items-baseline justify-between border-t pt-5">
        <span className="m-h text-[length:calc(16px*var(--m-scale))]">Total</span>
        <span className="text-[length:calc(20px*var(--m-scale))] font-semibold">{rupees(t.total)}</span>
      </div>
    </div>
  );
}

export function SiteCart() {
  const { bag, setQuantity, removeLine, href } = useSite();
  const router = useRouter();
  const t = useTotals();
  if (!bag.length) {
    return (
      <Container>
        <EmptyState title="Your bag is empty" text="Find something you like and it will wait for you here." action={{ label: "Start shopping", to: "/catalog" }} />
      </Container>
    );
  }
  return (
    <Container className="pb-20 pt-8 sm:pt-12">
      <h1 className="m-h t-title">Bag</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <ul className="m-line border-t">
          {t.lines.map((l) => {
            const p = l.available;
            return (
              <li key={l.key} className="m-line flex gap-4 border-b py-5 sm:gap-6">
                <MLink to={`/products/${l.productId}`} className="m-panel m-card relative aspect-[4/5] w-24 shrink-0 overflow-hidden sm:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.image && <img src={l.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                </MLink>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <MLink to={`/products/${l.productId}`} className="m-cap line-clamp-2 text-[length:calc(13px*var(--m-scale))] font-semibold tracking-wide">
                        {l.title}
                      </MLink>
                      {l.variantName && <p className="m-muted mt-1 text-[length:calc(13px*var(--m-scale))]">{l.variantName}</p>}
                      <p className="mt-1 text-[length:calc(13px*var(--m-scale))]">{rupees(l.price)}</p>
                    </div>
                    <p className="shrink-0 text-[length:calc(14px*var(--m-scale))] font-semibold">{rupees(l.price * l.quantity)}</p>
                  </div>
                  {p < l.quantity && (
                    <p className="mt-2 text-[length:calc(13px*var(--m-scale))] font-medium text-red-600">{p <= 0 ? "Sold out, please remove it" : `Only ${p} left`}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QtyStepper small value={l.quantity} onChange={(n) => setQuantity(l.key, n)} max={Math.max(1, p)} />
                    <button type="button" onClick={() => removeLine(l.key)} className="m-muted flex items-center gap-1.5 text-[length:calc(13px*var(--m-scale))] hover:text-[var(--m-text)]">
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Summary />
          <button type="button" disabled={t.unavailable.length > 0} onClick={() => router.push(href("/checkout"))} className="m-btn mt-4 h-12 w-full">
            <Lock className="h-4 w-4" /> Checkout
          </button>
          <MLink to="/catalog" className="m-muted mt-4 block text-center text-[length:calc(13px*var(--m-scale))] underline underline-offset-4">
            Continue shopping
          </MLink>
        </div>
      </div>
    </Container>
  );
}

type Step = "details" | "payment";

export function SiteCheckout() {
  const { store, bag, details, saveDetails, coupon, clearBag, rememberOrder, href, editing, demo } = useSite();
  const router = useRouter();
  const { user } = useAuth();
  const [onlineAvail, setOnlineAvail] = React.useState<OnlineAvailability>({ online: false, provider: null });
  const onlineOn = onlineAvail.online;
  // asked again once sign-in is known: a shop on test keys offers online payment only to its owner
  React.useEffect(() => {
    if (demo || editing) return;
    let live = true;
    fetchOnlineAvailability(store.subdomain).then((avail) => live && setOnlineAvail(avail));
    return () => {
      live = false;
    };
  }, [store.subdomain, demo, editing, user?.uid]);
  // payment options: online (Growth and Pro with a gateway) and Cash on Delivery. Without online
  // payment, Cash on Delivery is always offered so buyers can still order.
  const codOn = store.codEnabled || !onlineOn;
  const [step, setStep] = React.useState<Step>("details");
  const [form, setForm] = React.useState<SavedDetails>(details);
  const [errors, setErrors] = React.useState<Partial<Record<keyof SavedDetails, string>>>({});
  const [method, setMethod] = React.useState<PayMethod>("cod");
  React.useEffect(() => {
    if (onlineOn) setMethod("online");
  }, [onlineOn]);
  const [note, setNote] = React.useState("");
  // a gift note written on the homepage (Theme 34) starts the order note
  React.useEffect(() => {
    try {
      const gift = sessionStorage.getItem(giftNoteKey(store.subdomain));
      if (gift) setNote((n) => n || `Gift note: ${gift}`.slice(0, 200));
    } catch {
      // no session storage: nothing to bring over
    }
  }, [store.subdomain]);
  const [placing, setPlacing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pinBusy, setPinBusy] = React.useState(false);
  const [pinAreas, setPinAreas] = React.useState<string[]>([]);
  const [agreed, setAgreed] = React.useState(false);
  // opt-in (unticked) to one reminder email if the checkout isn't finished
  const [remindOk, setRemindOk] = React.useState(false);
  const [agreeError, setAgreeError] = React.useState("");
  const t = useTotals(method);
  // the seller's checkout rules (Settings → Checkout); the server checks the same ones
  const rules = checkoutRulesOf(store);
  const minIssue = minOrderProblem(store, Math.max(0, t.subtotal - t.discount));
  const codTotal = t.total - t.codFee + (store.codFee || 0);
  const codUsable = codOn && codAllowedFor(store, codTotal, onlineOn);
  const loginNeeded = rules.requireLogin && !user && !demo && !editing;
  React.useEffect(() => {
    if (method === "cod" && !codUsable && onlineOn) setMethod("online");
  }, [method, codUsable, onlineOn]);

  // a signed-in buyer's name and email start the form
  React.useEffect(() => {
    if (!user || demo || editing) return;
    setForm((f) => ({ ...f, name: f.name || user.displayName || "", email: f.email || user.email || "" }));
  }, [user, demo, editing]);

  // the saved address loads after the first render
  const filled = React.useRef(false);
  React.useEffect(() => {
    if (!filled.current && details.name) {
      filled.current = true;
      setForm(details);
    }
  }, [details]);

  if (!bag.length) {
    return (
      <Container>
        <EmptyState title="Your bag is empty" text="Add something to your bag to check out." action={{ label: "Start shopping", to: "/catalog" }} />
      </Container>
    );
  }

  const set = (k: keyof SavedDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (k === "phone") v = phoneInput(v);
    if (k === "pincode") v = onlyDigits(v, 6);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    if (k === "pincode") fillFromPin(v);
  };

  /** A full PIN code fills in the city and state (from this device's earlier lookups, or India Post). */
  const fillFromPin = async (pin: string) => {
    setPinAreas([]);
    if (pin.length !== 6) return;
    setPinBusy(true);
    try {
      const info = await lookupPincode(pin);
      if (!info) {
        setErrors((er) => ({ ...er, pincode: "We couldn't find this PIN code. Check it." }));
        return;
      }
      setForm((f) => (f.pincode !== pin ? f : { ...f, city: info.city || f.city, state: info.state || f.state }));
      setErrors((er) => ({ ...er, city: undefined, state: undefined }));
      setPinAreas(info.areas);
    } catch {
      // lookup unavailable: the buyer types the city and state
    } finally {
      setPinBusy(false);
    }
  };

  const validate = () => {
    const er: typeof errors = {};
    const pick = (k: keyof SavedDetails, msg: string) => msg && (er[k] = msg);
    pick("name", checkPersonName(form.name, "full name"));
    pick("phone", checkPhone(form.phone));
    if (rules.email !== "hidden") pick("email", checkEmail(form.email, { required: rules.email === "required" }));
    pick("street", checkStreet(form.street));
    pick("city", checkPlace(form.city, "city"));
    if (!form.state) er.state = "Choose your state";
    pick("pincode", checkPincode(form.pincode));
    if (!agreed) setAgreeError("Please agree to the shop's terms to continue.");
    setErrors(er);
    return Object.keys(er).length === 0 && agreed;
  };

  /** Lets the shop see (and, if the buyer agreed, remind) a checkout that isn't finished. Best effort. */
  const noteCheckoutStarted = () => {
    if (demo || editing) return;
    const phone = cleanPhone(form.phone);
    fetch("/api/checkout/started", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store: store.subdomain,
        name: form.name.trim(),
        phone,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        consent: remindOk && !!form.email.trim(),
        items: t.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, ...(l.variantName ? { variantName: l.variantName } : {}) })),
      }),
      keepalive: true,
    }).catch(() => {});
  };

  const orderInput = () => {
    const phone = cleanPhone(form.phone);
    return {
      phone,
      body: {
        items: t.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, ...(l.variantName ? { variantName: l.variantName } : {}) })),
        customer: { name: form.name.trim(), phone, ...(form.email.trim() ? { email: form.email.trim() } : {}) },
        address: { street: form.street.trim(), city: form.city.trim(), state: form.state, pincode: form.pincode.trim() },
        ...(coupon ? { couponCode: coupon } : {}),
        ...(note.trim() ? { notes: note.trim() } : {}),
      },
    };
  };

  /** Saves a Cash on Delivery order through the server (it sets the prices). */
  const submitOrder = async (m: "cod") => {
    const { phone, body } = orderInput();
    const order = await storeService.createOrder(store.subdomain, { method: m, ...body });
    saveDetails({ ...form, phone });
    rememberOrder(order.token);
    clearBag();
    router.push(href(`/order/${order.token}?placed=1`));
  };

  const place = async () => {
    if (editing) return;
    setError("");
    if (demo) {
      setError("This is a theme preview with sample products, so orders can't be placed here.");
      return;
    }
    if (t.unavailable.length) {
      setError("Some items in your bag are no longer available. Go back to your bag to update it.");
      return;
    }
    if (minIssue) {
      setError(minIssue);
      return;
    }
    setPlacing(true);
    if (method === "online") {
      payOnline();
      return;
    }
    try {
      await submitOrder("cod");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't place the order. Please try again.");
      setPlacing(false);
    }
  };

  /** Starts online payment via Cashfree or Razorpay based on which the seller has configured. */
  const payOnline = async () => {
    try {
      const phone = cleanPhone(form.phone);
      const back = new URL(href("/order/"), window.location.origin);
      const orderPayload = {
        store: store.subdomain,
        items: t.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, ...(l.variantName ? { variantName: l.variantName } : {}) })),
        ...(coupon ? { couponCode: coupon } : {}),
        customer: { name: form.name.trim(), phone, ...(form.email.trim() ? { email: form.email.trim() } : {}) },
        address: { street: form.street.trim(), city: form.city.trim(), state: form.state, pincode: form.pincode.trim() },
        ...(note.trim() ? { notes: note.trim() } : {}),
        returnBase: `${back.origin}${back.pathname}`,
      };

      if (onlineAvail.provider === "razorpay") {
        const res = await createRazorpayPayment(orderPayload);
        if (res.total !== t.total) console.info("[checkout] amount updated by the server", t.total, res.total);
        saveDetails({ ...form, phone });
        rememberOrder(res.token);
        const payment = await openRazorpayCheckout({
          keyId: res.keyId,
          rzOrderId: res.rzOrderId,
          amount: res.total,
          storeName: store.name,
          prefill: { name: form.name.trim(), contact: phone, email: form.email.trim() || undefined },
        });
        // Razorpay has taken the money by now. Whatever happens next, go to the order page (it re-checks
        // with Razorpay) rather than staying here, where the buyer might pay a second time.
        const orderPage = `${href("/order/")}${res.token}`;
        const result = await verifyRazorpayPayment(
          store.subdomain,
          res.token,
          payment.razorpay_payment_id,
          payment.razorpay_order_id,
          payment.razorpay_signature
        ).catch(() => null);
        if (result?.status === "paid") clearBag();
        router.push(result?.status === "paid" ? `${orderPage}?placed=1` : orderPage);
      } else {
        const res = await createOnlinePayment(orderPayload);
        if (res.total !== t.total) console.info("[checkout] amount updated by the server", t.total, res.total);
        saveDetails({ ...form, phone });
        rememberOrder(res.token);
        await openCashfreeCheckout(res.paymentSessionId, res.mode);
        // Cashfree now takes over this tab and returns the buyer to the order page
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the payment. Please try again.");
      setPlacing(false);
    }
  };

  const field = (k: keyof SavedDetails, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-[length:calc(13px*var(--m-scale))] font-medium">{label}</span>
      <input value={form[k]} onChange={set(k)} className={cn("m-field", errors[k] && "!border-red-500")} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <span className="mt-1 block text-[length:calc(12px*var(--m-scale))] text-red-600">{errors[k]}</span>}
    </label>
  );

  return (
    <Container className="pb-20 pt-8 sm:pt-12">
      <MLink to="/cart" className="m-muted inline-flex items-center gap-1.5 text-[length:calc(13px*var(--m-scale))]">
        <ArrowLeft className="h-4 w-4" /> Back to bag
      </MLink>
      <h1 className="m-h mt-4 t-title">Checkout</h1>
      <ol className="m-cap mt-6 flex items-center gap-3 text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.14em]">
        {(["details", "payment"] as Step[]).map((s, i) => (
          <li key={s} className={cn("flex items-center gap-2", step !== s && "m-faint")}>
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-[length:calc(11px*var(--m-scale))]", step === s ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "m-line")}>
              {step === "payment" && s === "details" ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {s === "details" ? "Delivery" : "Payment"}
            {i === 0 && <span className="m-faint ml-1">—</span>}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
        {/* delivery → payment → UPI screen fade into each other instead of jumping */}
        <div key={step === "details" ? "details" : "payment"} className="swap-enter">
          {step === "details" && loginNeeded ? (
            /* the seller asks buyers to sign in before ordering (Settings → Customer accounts) */
            <div className="grid gap-4">
              <div className="m-soft rounded-2xl p-5 text-[length:calc(14px*var(--m-scale))]">
                <p className="font-semibold">Sign in to place your order</p>
                <p className="m-muted mt-1">{store.name} asks buyers to sign in first, so you can see your orders on any device.</p>
              </div>
              <BuyerAuth />
            </div>
          ) : step === "details" ? (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (minIssue) return;
                if (validate()) {
                  noteCheckoutStarted();
                  setStep("payment");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="grid gap-4"
            >
              {minIssue && (
                <div className="reveal-in rounded-2xl bg-amber-50 px-4 py-3 text-[length:calc(13px*var(--m-scale))] text-amber-900">
                  {minIssue}{" "}
                  <MLink to="/catalog" className="font-semibold underline underline-offset-2">
                    Keep shopping
                  </MLink>
                </div>
              )}
              <h2 className="m-h text-[length:calc(18px*var(--m-scale))]">Contact</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("name", "Full name", { autoComplete: "name", maxLength: 80 })}
                {field("phone", "Mobile number", { autoComplete: "tel-national", inputMode: "tel", placeholder: "10-digit number" })}
              </div>
              {rules.email !== "hidden" &&
                field("email", rules.email === "required" ? "Email (for order updates)" : "Email (optional, for order updates)", { type: "email", autoComplete: "email", maxLength: 200 })}
              {rules.email !== "hidden" && form.email.trim() && (
                <label className="reveal-in -mt-1 flex items-start gap-3 text-[length:calc(12.5px*var(--m-scale))]">
                  <input
                    type="checkbox"
                    checked={remindOk}
                    onChange={(e) => setRemindOk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--m-text)]"
                    style={{ minHeight: 0, minWidth: 0 }}
                  />
                  <span className="m-muted">Email me a reminder if I don&apos;t finish my order</span>
                </label>
              )}
              <h2 className="m-h mt-4 text-[length:calc(18px*var(--m-scale))]">Delivery address</h2>
              <div>
                {field("pincode", pinBusy ? "PIN code · finding your city…" : "PIN code", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6, placeholder: "6-digit PIN code" })}
                {pinAreas.length > 0 && !errors.pincode && (
                  <span className="m-muted mt-1 block text-[length:calc(12px*var(--m-scale))]">
                    {form.city}, {form.state} · {pinAreas.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
              {field("street", "House no., street, area", { autoComplete: "street-address", maxLength: 200 })}
              <div className="grid gap-4 sm:grid-cols-2">
                {field("city", "City", { autoComplete: "address-level2", maxLength: 60 })}
                <label className="block">
                  <span className="mb-1.5 block text-[length:calc(13px*var(--m-scale))] font-medium">State</span>
                  <select value={form.state} onChange={set("state")} className={cn("m-field", errors.state && "!border-red-500")} autoComplete="address-level1">
                    <option value="">Choose</option>
                    {STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <span className="mt-1 block text-[length:calc(12px*var(--m-scale))] text-red-600">{errors.state}</span>}
                </label>
              </div>
              {rules.orderNotes && (
                <label className="block">
                  <span className="mb-1.5 block text-[length:calc(13px*var(--m-scale))] font-medium">Note for the shop (optional)</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="m-field" placeholder="Landmark, gift message…" />
                </label>
              )}
              <label className="flex items-start gap-3 text-[length:calc(13px*var(--m-scale))]">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => (setAgreed(e.target.checked), setAgreeError(""))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--m-text)]"
                  style={{ minHeight: 0, minWidth: 0 }}
                />
                <span>
                  I agree to the shop&apos;s{" "}
                  <MLink to="/pages/terms" className="underline underline-offset-2">terms</MLink>,{" "}
                  <MLink to="/pages/returns" className="underline underline-offset-2">returns &amp; refunds</MLink>,{" "}
                  <MLink to="/pages/shipping" className="underline underline-offset-2">shipping</MLink> and{" "}
                  <MLink to="/pages/privacy" className="underline underline-offset-2">privacy</MLink> policies.
                </span>
              </label>
              {agreeError && <span className="-mt-2 block text-[length:calc(12px*var(--m-scale))] text-red-600">{agreeError}</span>}
              <button type="submit" disabled={!!minIssue} className="m-btn mt-4 h-12 w-full disabled:opacity-50 sm:w-auto sm:px-12">
                Continue to payment
              </button>
            </form>
          ) : (
            <div className="grid gap-4">
              <div className="m-soft flex items-start justify-between gap-4 rounded-2xl p-5 text-[length:calc(14px*var(--m-scale))]">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {form.name} · {form.phone}
                  </p>
                  <p className="m-muted mt-1">
                    {form.street}, {form.city}, {form.state} {form.pincode}
                  </p>
                </div>
                <button type="button" onClick={() => setStep("details")} className="shrink-0 text-[length:calc(13px*var(--m-scale))] font-medium underline underline-offset-4">
                  Change
                </button>
              </div>

              <h2 className="m-h mt-4 text-[length:calc(18px*var(--m-scale))]">Payment</h2>
              {!onlineOn && !codUsable && (
                <div className="m-soft rounded-2xl p-5 text-[length:calc(14px*var(--m-scale))]">
                  <p>Online payment isn't set up for this shop yet. Message the shop to complete your order.</p>
                  {whatsappLink(store.contactPhone) && (
                    <a href={whatsappLink(store.contactPhone, `Hi! I'd like to order from ${store.name}.`)} target="_blank" rel="noopener noreferrer" className="m-btn mt-4">
                      <MessageCircle className="h-4 w-4" /> Message the shop
                    </a>
                  )}
                </div>
              )}
              <div className="grid gap-3" role="radiogroup" aria-label="Payment method">
                {onlineOn && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={method === "online"}
                    onClick={() => setMethod("online")}
                    className={cn("m-line flex items-center gap-4 rounded-2xl border p-5 text-left", method === "online" && "border-[var(--m-text)] ring-1 ring-[var(--m-text)]")}
                  >
                    <CreditCard className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[length:calc(14px*var(--m-scale))] font-semibold">Pay online</span>
                      <span className="m-muted block text-[length:calc(13px*var(--m-scale))]">
                        UPI, cards, net banking and wallets · secured by {onlineAvail.provider === "cashfree" ? "Cashfree" : "Razorpay"}
                      </span>
                      {onlineAvail.testMode && (
                        <span className="mt-1.5 block rounded-lg bg-amber-100 px-2 py-1 text-[length:calc(12px*var(--m-scale))] font-medium text-amber-900">
                          Test mode: only you (the shop owner) can see this. Use Razorpay&apos;s test card; no real money moves.
                        </span>
                      )}
                    </span>
                    <span className={cn("h-5 w-5 rounded-full border-2", method === "online" ? "border-[6px] border-[var(--m-text)]" : "m-line")} />
                  </button>
                )}
                {codUsable && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={method === "cod"}
                    onClick={() => setMethod("cod")}
                    className={cn("m-line flex items-center gap-4 rounded-2xl border p-5 text-left", method === "cod" && "border-[var(--m-text)] ring-1 ring-[var(--m-text)]")}
                  >
                    <Wallet className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[length:calc(14px*var(--m-scale))] font-semibold">Cash on delivery</span>
                      <span className="m-muted block text-[length:calc(13px*var(--m-scale))]">{store.codFee ? `${rupees(store.codFee)} extra, pay when it arrives` : "Pay when it arrives"}</span>
                    </span>
                    <span className={cn("h-5 w-5 rounded-full border-2", method === "cod" ? "border-[6px] border-[var(--m-text)]" : "m-line")} />
                  </button>
                )}
              </div>

              {codOn && !codUsable && <p className="m-muted text-[length:calc(13px*var(--m-scale))]">{codLimitText(store)}</p>}
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[length:calc(13px*var(--m-scale))] text-red-700">{error}</p>}
              {(onlineOn || codUsable) && (
                <button type="button" disabled={placing} onClick={place} className="m-btn mt-2 h-12 w-full">
                  <Lock className="h-4 w-4" />
                  {placing
                    ? method === "online"
                      ? "Opening secure payment…"
                      : "Placing order…"
                    : method === "online"
                      ? `Pay ${rupees(t.total)} securely`
                      : `Place order · ${rupees(t.total)}`}
                </button>
              )}
              <p className="m-faint text-center text-[length:calc(12px*var(--m-scale))]">Your details are sent securely and only shared with {store.name} to deliver your order.</p>
            </div>
          )}
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Summary paymentMethod={step === "payment" ? method : undefined} compact />
        </div>
      </div>
    </Container>
  );
}
