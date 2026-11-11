"use client";

import * as React from "react";
import { Ban, CheckCircle2, Loader2, Mail, MessageCircle, RotateCcw, Undo2, XCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { canUseEmail } from "@/lib/plans";
import { storeService, type OrderData, type StoreData } from "@/lib/store-service";
import { appAlert, appConfirm, appPrompt } from "@/components/ui/app-dialog";

const rupees = (p: number) => `₹${(p / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const PAID = new Set(["paid", "verified"]);
const restock = (products: StoreData["products"], order: OrderData) =>
  products.map((p) => {
    const qty = order.items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.quantity, 0);
    return qty ? { ...p, stock: (p.stock ?? 0) + qty } : p;
  });

type Message = { subject: string; text: string };

/**
 * Seller tools for one order: cancel it with a reason, answer a return request, record a refund,
 * then tell the buyer by email (from the shop's Gmail) or WhatsApp.
 */
export function OrderActions({ store, order, onChange }: { store: StoreData; order: OrderData; onChange: (o: OrderData) => void }) {
  const [message, setMessage] = React.useState<Message | null>(null);
  const [sending, setSending] = React.useState(false);
  const [sentTo, setSentTo] = React.useState("");

  const save = (next: OrderData, alsoRestock = false) => {
    const orders = store.orders.map((o) => (o.id === next.id ? next : o));
    storeService.updateStore(store.subdomain, alsoRestock ? { orders, products: restock(store.products, order) } : { orders });
    onChange(next);
  };
  const now = () => new Date().toISOString();

  const cancel = async () => {
    const reason = await appPrompt("The buyer sees this reason on their order page.", {
      title: `Cancel order ${order.number}?`,
      placeholder: "e.g. This item is out of stock",
      okLabel: "Cancel order",
      cancelLabel: "Keep order",
      danger: true,
    });
    if (!reason) return;
    const owed = PAID.has(order.paymentStatus);
    save(
      {
        ...order,
        fulfilmentStatus: "cancelled",
        cancelledAt: now(),
        cancelledBy: "seller",
        cancelReason: reason.slice(0, 500),
        ...(owed ? { refund: { status: "due", amount: order.total } } : {}),
        updatedAt: now(),
      },
      true
    );
    setSentTo("");
    setMessage({
      subject: `Your order ${order.number} was cancelled`,
      text: `Hi ${order.customer.name.split(" ")[0]},\n\nWe're sorry, we had to cancel your order ${order.number}.\n\nReason: ${reason}${owed ? `\n\nWe'll refund ${rupees(order.total)} to you within 5–7 working days.` : ""}\n\n${store.name}`,
    });
  };

  const answerReturn = async (approve: boolean) => {
    const note = await appPrompt(approve ? "Tell the buyer how to send it back (address, packing, pickup)." : "Tell the buyer why the return isn't accepted.", {
      title: approve ? "Accept this return" : "Decline this return",
      placeholder: approve ? "e.g. Our courier will pick it up in 2 days. Pack it in the original box." : "e.g. The item has been used",
      okLabel: approve ? "Accept return" : "Decline return",
      danger: !approve,
    });
    if (!note || !order.returnRequest) return;
    save({ ...order, returnRequest: { ...order.returnRequest, status: approve ? "approved" : "declined", note: note.slice(0, 500), answeredAt: now() }, updatedAt: now() });
    setSentTo("");
    setMessage({
      subject: approve ? `Return accepted for order ${order.number}` : `About your return for order ${order.number}`,
      text: `Hi ${order.customer.name.split(" ")[0]},\n\n${approve ? "We've accepted your return." : "We can't accept this return."}\n\n${note}\n\n${store.name}`,
    });
  };

  const markReceived = async () => {
    if (!order.returnRequest) return;
    if (!(await appConfirm("Mark the returned item as received? A refund will be due to the buyer.", { title: "Return received", okLabel: "Mark received" }))) return;
    save({
      ...order,
      returnRequest: { ...order.returnRequest, status: "received", answeredAt: now() },
      refund: order.refund?.status === "refunded" ? order.refund : { status: "due", amount: order.total - (order.delivery || 0) },
      updatedAt: now(),
    });
  };

  const markRefunded = async () => {
    const ref = await appPrompt(`Enter the UPI / bank reference of the ${rupees(order.refund?.amount || order.total)} refund. The buyer sees it.`, {
      title: "Mark as refunded",
      placeholder: "12-digit UPI reference",
      okLabel: "Mark refunded",
    });
    if (!ref) return;
    const reference = ref.replace(/[^0-9A-Za-z-]/g, "").slice(0, 40);
    save({ ...order, refund: { status: "refunded", amount: order.refund?.amount || order.total, reference, refundedAt: now() }, updatedAt: now() });
    setSentTo("");
    setMessage({
      subject: `Refund sent for order ${order.number}`,
      text: `Hi ${order.customer.name.split(" ")[0]},\n\nWe've sent your refund of ${rupees(order.refund?.amount || order.total)}.\nReference: ${reference}\n\nIt can take 1–3 working days to show in your account.\n\n${store.name}`,
    });
  };

  const sendEmail = async () => {
    if (!message) return;
    setSending(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in again.");
      const res = await fetch("/api/orders/notify", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ store: store.subdomain, orderId: order.id, subject: message.subject, message: message.text }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't send the email.");
      setSentTo(body.to);
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Couldn't send the email.", { danger: true });
    } finally {
      setSending(false);
    }
  };

  const shippedOrDone = ["shipped", "delivered", "cancelled"].includes(order.fulfilmentStatus);
  const rr = order.returnRequest;
  const waDigits = order.customer.phone.replace(/\D/g, "").slice(-10);
  const canEmail = canUseEmail(store.planId) && !!order.customer.email;
  const card = "rounded-[24px] bg-white ring-1 ring-black/[0.04] p-4 sm:p-5";

  return (
    <div className="space-y-4">
      {order.fulfilmentStatus === "cancelled" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-red-800">
            <Ban className="h-4 w-4" /> Cancelled {order.cancelledBy === "buyer" ? "by the buyer" : order.cancelledBy === "seller" ? "by you" : ""}
          </p>
          {order.cancelReason && <p className="mt-1 text-red-700">Reason: {order.cancelReason}</p>}
        </div>
      )}

      {rr && (
        <div className={card}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <RotateCcw className="h-4 w-4" /> Return {rr.status === "requested" ? "requested" : rr.status}
          </h3>
          <p className="mt-2 text-sm text-neutral-700">“{rr.reason}”</p>
          <p className="mt-1 text-xs text-neutral-500">Asked {new Date(rr.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          {rr.note && <p className="mt-2 rounded-lg bg-neutral-50 p-2.5 text-xs text-neutral-600">Your reply: {rr.note}</p>}
          {rr.status === "requested" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => answerReturn(true)} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-neutral-950 text-xs font-semibold text-white hover:bg-black">
                <CheckCircle2 className="h-3.5 w-3.5" /> Accept
              </button>
              <button type="button" onClick={() => answerReturn(false)} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-xs font-semibold hover:border-red-600 hover:text-red-600">
                <XCircle className="h-3.5 w-3.5" /> Decline
              </button>
            </div>
          )}
          {rr.status === "approved" && (
            <button type="button" onClick={markReceived} className="mt-3 h-10 w-full rounded-xl border border-neutral-200 text-xs font-semibold hover:border-neutral-900">
              I&apos;ve received the item back
            </button>
          )}
        </div>
      )}

      {order.refund && (
        <div className={card}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Undo2 className="h-4 w-4" /> Refund {order.refund.status === "refunded" ? "sent" : "due"} · {rupees(order.refund.amount)}
          </h3>
          {order.refund.status === "refunded" ? (
            <p className="mt-1 text-xs text-neutral-500">Reference {order.refund.reference}</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-neutral-500">Send it from your UPI app to the buyer, then record the reference here.</p>
              <button type="button" onClick={markRefunded} className="mt-3 h-10 w-full rounded-xl bg-neutral-950 text-xs font-semibold text-white hover:bg-black">
                Mark as refunded
              </button>
            </>
          )}
        </div>
      )}

      {!shippedOrDone && (
        <button type="button" onClick={cancel} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-red-600 hover:border-red-600">
          <Ban className="h-3.5 w-3.5" /> Cancel order
        </button>
      )}

      {message && (
        <div className={card}>
          <h3 className="text-sm font-semibold">Tell the buyer</h3>
          <input
            value={message.subject}
            onChange={(e) => setMessage({ ...message, subject: e.target.value.slice(0, 150) })}
            className="mt-3 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900"
            aria-label="Subject"
          />
          <textarea
            value={message.text}
            onChange={(e) => setMessage({ ...message, text: e.target.value.slice(0, 3000) })}
            rows={6}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-neutral-900"
            aria-label="Message"
          />
          {sentTo ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Emailed to {sentTo}
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {canEmail ? (
                <button type="button" disabled={sending} onClick={sendEmail} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-neutral-950 text-xs font-semibold text-white disabled:opacity-50">
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />} Send email
                </button>
              ) : order.customer.email ? (
                <a
                  href={`mailto:${encodeURIComponent(order.customer.email)}?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.text)}`}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-xs font-semibold hover:border-neutral-900"
                >
                  <Mail className="h-3.5 w-3.5" /> Open email app
                </a>
              ) : (
                <span className="flex h-10 items-center justify-center rounded-xl bg-neutral-50 px-2 text-center text-[11px] text-neutral-500">No email on this order</span>
              )}
              <a
                href={`https://wa.me/91${waDigits}?text=${encodeURIComponent(message.text)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-xs font-semibold text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          )}
          <button type="button" onClick={() => setMessage(null)} className="mt-2 text-xs font-medium text-neutral-500 hover:text-black">
            Done
          </button>
        </div>
      )}
    </div>
  );
}
