"use client";
import { appAlert, appConfirm, appPrompt } from "@/components/ui/app-dialog";

import * as React from "react";
import { CheckCircle2, ExternalLink, Loader2, Mail, Send, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { storeService, type StoreData } from "@/lib/store-service";

type Status = {
  connected: boolean;
  email: string | null;
  usage: { month: number; day: number; perMonth: number | null; perDay: number; left: number };
  campaigns: { subject: string; sent: number; failed: number; at: string }[];
};

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", Authorization: `Bearer ${await user.getIdToken()}`, ...(init.headers || {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body as T;
}

const TEMPLATES = [
  { label: "New arrivals", subject: "New pieces just landed", message: "Our newest pieces are live on the store. Take a look before your size sells out." },
  { label: "Back in stock", subject: "Back in stock", message: "Your favourites are back. They went fast last time, so don't wait too long." },
  { label: "Offer", subject: "A little something for you", message: "Thanks for being on our list. Here's an offer just for subscribers this week." },
];

/** Plugins › Email: connect the seller's Gmail and email their subscribers (real sending, plan limits). */
export function EmailPanel({ store, storeWebDomain, onRemoveSubscriber }: { store: StoreData; storeWebDomain: string; onRemoveSubscriber: (email: string) => void }) {
  const subs = store.subscribers || [];
  const [status, setStatus] = React.useState<Status | null>(null);
  const [loadError, setLoadError] = React.useState("");
  const refresh = React.useCallback(async () => {
    try {
      setStatus(await api<Status>(`/api/email/status?store=${store.subdomain}`));
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Couldn't load email settings.");
    }
  }, [store.subdomain]);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // connect
  const [gmail, setGmail] = React.useState(store.contactEmail || store.ownerEmail || "");
  const [appPassword, setAppPassword] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);
  const [connectError, setConnectError] = React.useState("");
  const [showSteps, setShowSteps] = React.useState(true);
  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError("");
    setConnecting(true);
    try {
      await api("/api/email/connect", { method: "POST", body: JSON.stringify({ store: store.subdomain, email: gmail, appPassword }) });
      setAppPassword("");
      await refresh();
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Couldn't connect Gmail.");
    } finally {
      setConnecting(false);
    }
  };
  const disconnect = async () => {
    if (!(await appConfirm("You can connect it again any time.", { title: "Disconnect Gmail?", okLabel: "Disconnect", danger: true }))) return;
    await api(`/api/email/connect?store=${store.subdomain}`, { method: "DELETE" }).catch(() => null);
    await refresh();
  };

  // test
  const [testing, setTesting] = React.useState(false);
  const [testMsg, setTestMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const sendTest = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const r = await api<{ to: string }>("/api/email/test", { method: "POST", body: JSON.stringify({ store: store.subdomain }) });
      setTestMsg({ ok: true, text: `Test email sent to ${r.to}. Check your inbox.` });
      refresh();
    } catch (err) {
      setTestMsg({ ok: false, text: err instanceof Error ? err.message : "Couldn't send the test." });
    } finally {
      setTesting(false);
    }
  };

  // alerts toggle (saved with the store)
  const alertsOn = !!store.pluginsConfig?.gmailIntegration?.autoSendNewDropAlerts;
  const setAlerts = (on: boolean) => {
    storeService.updatePluginsConfig(store.subdomain, {
      gmailIntegration: { ...(store.pluginsConfig?.gmailIntegration || { isConnected: true }), isConnected: true, autoSendNewDropAlerts: on },
    });
  };

  // compose
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sendMsg, setSendMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendMsg(null);
    if (!subject.trim() || !message.trim()) return setSendMsg({ ok: false, text: "Add a subject and a message." });
    if (!(await appConfirm(`It goes to ${subs.length} subscriber${subs.length === 1 ? "" : "s"} from your Gmail.`, { title: "Send this email?", okLabel: "Send" }))) return;
    setSending(true);
    try {
      const r = await api<{ sent: number; failed: number; total: number }>("/api/email/send", {
        method: "POST",
        body: JSON.stringify({ store: store.subdomain, subject, message }),
      });
      setSendMsg({ ok: true, text: `Sent to ${r.sent} of ${r.total} subscriber${r.total === 1 ? "" : "s"}${r.failed ? ` (${r.failed} couldn't be delivered)` : ""}.` });
      setSubject("");
      setMessage("");
      refresh();
    } catch (err) {
      setSendMsg({ ok: false, text: err instanceof Error ? err.message : "Couldn't send." });
    } finally {
      setSending(false);
    }
  };

  const u = status?.usage;
  const monthPct = u && u.perMonth ? Math.min(100, Math.round((u.month / u.perMonth) * 100)) : 0;
  const fmt = (n: number) => n.toLocaleString("en-IN");

  return (
    <div className="space-y-4">
      {/* status + usage */}
      <div className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-base font-semibold">Email to subscribers</h3>
            <p className="mt-0.5 text-sm text-neutral-500">Sent from your own Gmail, with an unsubscribe link in every email.</p>
          </div>
          {status && (
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.connected ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.connected ? "bg-emerald-500" : "bg-neutral-400"}`} />
              {status.connected ? "Gmail connected" : "Not connected"}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-1 divide-y divide-neutral-100 border-t border-neutral-100 text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-3.5 sm:px-6">
            <dt className="text-xs text-neutral-500">Subscribers</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{fmt(subs.length)}</dd>
          </div>
          <div className="px-5 py-3.5 sm:px-6">
            <dt className="text-xs text-neutral-500">This month</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {u ? (u.perMonth === null ? `${fmt(u.month)} sent · no monthly limit` : `${fmt(u.month)} of ${fmt(u.perMonth)}`) : "…"}
            </dd>
            {u && u.perMonth !== null && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100">
                <div className={`h-full rounded-full ${monthPct >= 90 ? "bg-amber-500" : "bg-neutral-900"}`} style={{ width: `${Math.max(2, monthPct)}%` }} />
              </div>
            )}
          </div>
          <div className="px-5 py-3.5 sm:px-6">
            <dt className="text-xs text-neutral-500">Today</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{u ? `${fmt(u.day)} of ${fmt(u.perDay)}` : "…"}</dd>
          </div>
        </dl>
        {loadError && <p className="border-t border-neutral-100 px-5 py-3 text-sm text-red-600 sm:px-6">{loadError}</p>}
      </div>

      {status && !status.connected && (
        <form onSubmit={connect} className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold">Connect your Gmail</h3>
          <p className="mt-0.5 text-sm text-neutral-500">Gmail needs an App Password (not your normal password). It takes about 2 minutes.</p>

          <button type="button" onClick={() => setShowSteps((v) => !v)} style={{ minHeight: 0 }} className="mt-3 text-[13px] font-medium text-neutral-700 underline underline-offset-2">
            {showSteps ? "Hide steps" : "How to get an App Password"}
          </button>
          {showSteps && (
            <ol className="mt-3 space-y-2 rounded-xl bg-neutral-50 p-4 text-[13px] leading-relaxed text-neutral-700">
              <li>
                1. Turn on <b>2-Step Verification</b> for your Google account:{" "}
                <a href="https://myaccount.google.com/signinoptions/twosv" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium underline">
                  open <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                2. Open{" "}
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium underline">
                  App Passwords <ExternalLink className="h-3 w-3" />
                </a>
                , type a name like <b>Shopersite</b> and tap <b>Create</b>.
              </li>
              <li>3. Copy the 16-letter password Google shows and paste it below.</li>
              <li className="text-neutral-500">It only lets Shopersite send email. You can remove it from your Google account any time.</li>
            </ol>
          )}

          <label htmlFor="gmail-addr" className="mt-4 block text-sm font-medium">Gmail address</label>
          <input
            id="gmail-addr"
            type="email"
            value={gmail}
            onChange={(e) => setGmail(e.target.value)}
            placeholder="yourstore@gmail.com"
            className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm outline-none focus:border-neutral-900"
          />
          <label htmlFor="gmail-app-pw" className="mt-3 block text-sm font-medium">App Password</label>
          <input
            id="gmail-app-pw"
            type="password"
            autoComplete="off"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder="abcd efgh ijkl mnop"
            className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm tracking-wider outline-none focus:border-neutral-900"
          />
          <p className="mt-1.5 text-xs text-neutral-500">Saved encrypted. Shopersite never shows it again.</p>
          {connectError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{connectError}</p>}
          <button type="submit" disabled={connecting} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
            {connecting && <Loader2 className="h-4 w-4 animate-spin" />}
            {connecting ? "Checking with Gmail…" : "Connect Gmail"}
          </button>
        </form>
      )}

      {status?.connected && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* sender */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h3 className="text-base font-semibold">Sending from</h3>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-neutral-400" /> {status.email}
            </p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-neutral-50 p-4">
              <span className="min-w-0">
                <span className="block text-sm font-medium">New product alerts</span>
                <span className="block text-xs text-neutral-500">Email subscribers when you add a product</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={alertsOn}
                aria-label="New product alerts"
                onClick={() => setAlerts(!alertsOn)}
                style={{ minHeight: 0, height: 24 }}
                className={`relative w-11 shrink-0 rounded-full transition-colors ${alertsOn ? "bg-emerald-500" : "bg-neutral-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${alertsOn ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={sendTest} disabled={testing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 px-4 text-sm font-medium hover:border-neutral-900 disabled:opacity-60">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send test email
              </button>
              <button type="button" onClick={disconnect} className="h-10 rounded-xl px-3 text-sm text-neutral-500 hover:text-red-600">
                Disconnect
              </button>
            </div>
            {testMsg && <p className={`mt-3 text-sm ${testMsg.ok ? "text-emerald-700" : "text-red-600"}`}>{testMsg.text}</p>}
          </div>

          {/* compose */}
          <form onSubmit={send} className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h3 className="text-base font-semibold">New email</h3>
            <p className="mt-0.5 text-sm text-neutral-500">Goes to all {fmt(subs.length)} subscriber{subs.length === 1 ? "" : "s"}.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setSubject(t.subject);
                    setMessage(t.message);
                  }}
                  style={{ minHeight: 0 }}
                  className="h-8 rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-700 hover:border-neutral-900"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label htmlFor="em-subject" className="mt-4 block text-sm font-medium">Subject</label>
            <input
              id="em-subject"
              value={subject}
              maxLength={150}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm outline-none focus:border-neutral-900"
            />
            <label htmlFor="em-message" className="mt-3 block text-sm font-medium">Message</label>
            <textarea
              id="em-message"
              rows={5}
              maxLength={5000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3.5 text-sm leading-relaxed outline-none focus:border-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-500">The email includes your store name, a &quot;Shop now&quot; button and an unsubscribe link.</p>
            <button
              type="submit"
              disabled={sending || subs.length === 0}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending… keep this page open" : `Send to ${fmt(subs.length)} subscriber${subs.length === 1 ? "" : "s"}`}
            </button>
            {subs.length === 0 && <p className="mt-2 text-center text-xs text-neutral-500">You can send once someone subscribes on your store.</p>}
            {sendMsg && (
              <p className={`mt-3 flex items-start gap-1.5 text-sm ${sendMsg.ok ? "text-emerald-700" : "text-red-600"}`}>
                {sendMsg.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                {sendMsg.text}
              </p>
            )}
          </form>
        </div>
      )}

      {status?.campaigns && status.campaigns.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white">
          <h3 className="px-5 pt-5 text-base font-semibold sm:px-6">Sent emails</h3>
          <ul className="mt-3 divide-y divide-neutral-100 border-t border-neutral-100">
            {status.campaigns.map((c, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3 text-sm sm:px-6">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.subject}</span>
                  <span className="block text-xs text-neutral-500">
                    {new Date(c.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-neutral-600 tabular-nums">
                  {c.sent} sent{c.failed ? ` · ${c.failed} failed` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* subscribers */}
      <div className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between gap-3 p-5 sm:px-6">
          <div>
            <h3 className="text-base font-semibold">Subscribers</h3>
            <p className="mt-0.5 text-sm text-neutral-500">People who signed up in your store&apos;s footer.</p>
          </div>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-neutral-700">{subs.length}</span>
        </div>
        {subs.length === 0 ? (
          <p className="border-t border-neutral-100 px-6 py-8 text-center text-sm text-neutral-500">
            No subscribers yet. Shoppers can sign up in the footer of {storeWebDomain}.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
            {subs.map((sub) => (
              <li key={sub.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{sub.email}</span>
                  <span className="block text-xs text-neutral-500">
                    Joined {new Date(sub.subscribedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSubscriber(sub.email)}
                  aria-label={`Remove ${sub.email}`}
                  style={{ minHeight: 0 }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** After a product is added: emails subscribers if the seller turned on new product alerts. */
export async function sendNewProductAlert(store: StoreData, product: { id: string; title: string; price?: number }) {
  if (!store.pluginsConfig?.gmailIntegration?.autoSendNewDropAlerts) return;
  try {
    await api("/api/email/send", {
      method: "POST",
      body: JSON.stringify({
        store: store.subdomain,
        subject: `New at ${store.name}: ${product.title}`.slice(0, 150),
        message: `${product.title} just arrived${product.price ? ` for ₹${(product.price / 100).toLocaleString("en-IN")}` : ""}. Take a look before it's gone.`,
        productId: product.id,
      }),
    });
  } catch (err) {
    console.warn("[email] new product alert not sent:", err instanceof Error ? err.message : err);
  }
}
