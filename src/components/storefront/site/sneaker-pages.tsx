"use client";

import * as React from "react";
import { ArrowRight, ArrowUpRight, Footprints, Mail, MapPin, MessageCircle, Package, Phone, RotateCcw, Truck } from "lucide-react";
import type { SitePage } from "@/lib/site-content";
import { productsFromSource, useSite, whatsappLink } from "./context";
import { Container, InstagramIcon, MLink } from "./ui";

/**
 * Theme 5's own About and Contact pages, unlike any other theme's, built around a sneaker box:
 * About has a lime title band, the shop's numbers printed as a shoe-box size label, its values as a walk of footprints
 * and a dark closing card with pairs fanned out. Contact has big tap tiles for each way to reach the shop and a
 * tear-off ticket for writing in. Their words are Theme 5 settings ("About page", "Contact page").
 */

const MARK = "var(--mark,#d4f56a)";

function paragraphs(page: SitePage) {
  return page.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export function SneakerAbout({ page }: { page: SitePage }) {
  const { content, store } = useSite();
  const o = content.options;
  const [lead, ...rest] = paragraphs(page);
  const stats = [1, 2, 3].map((n) => ({ value: o[`aboutStat${n}Value`], label: o[`aboutStat${n}Label`] })).filter((x) => x.value);
  const values = [1, 2, 3].map((n) => ({ title: o[`aboutValue${n}Title`], text: o[`aboutValue${n}Text`] })).filter((x) => x.title);
  const pairs = productsFromSource(store, "bestsellers", 3);

  return (
    <div className="t-about t-about-sneaker pb-[clamp(48px,7vw,110px)]">
      {/* a lime band with the title, the photo resting over its bottom edge */}
      <section className="pb-[clamp(90px,14vw,190px)] pt-[clamp(32px,5vw,80px)]" style={{ background: MARK }}>
        <Container className="text-[#111111]">
          {o.aboutEyebrow && (
            <p className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-3 py-1.5 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] text-white">
              <Footprints className="h-3.5 w-3.5" /> {o.aboutEyebrow}
            </p>
          )}
          <h1 className="m-h mt-4 max-w-4xl text-[length:calc(clamp(36px,6.4vw,92px)*var(--m-scale))] leading-[0.95] [overflow-wrap:anywhere]">{page.title}</h1>
          {lead && <p className="mt-5 max-w-xl text-[length:calc(clamp(15px,1.4vw,18px)*var(--m-scale))] leading-relaxed text-[#111111]/75">{lead}</p>}
        </Container>
      </section>
      {page.image && (
        <Container className="-mt-[clamp(70px,11vw,160px)]">
          <div className="m-panel relative aspect-[16/10] overflow-hidden rounded-[clamp(20px,2.4vw,32px)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] sm:aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </Container>
      )}

      {/* the story beside the shop's numbers, printed like the label on a shoe box */}
      <Container className="grid gap-8 pt-[clamp(40px,6vw,96px)] md:grid-cols-[1.2fr_1fr] md:gap-14">
        <div>
          {o.aboutStoryLabel && <p className="m-cap m-faint text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.16em]">{o.aboutStoryLabel}</p>}
          <div className="mt-3 space-y-4">
            {rest.map((p, i) => (
              <p key={i} className="whitespace-pre-line text-[length:calc(15.5px*var(--m-scale))] leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
        {stats.length > 0 && (
          <div className="t-box-label self-start rounded-[10px] border-2 border-dashed border-[var(--m-text)] bg-[var(--m-bg)] p-4">
            <div className="flex items-center justify-between border-b-2 border-[var(--m-text)] pb-2 text-[length:calc(10.5px*var(--m-scale))] font-bold uppercase tracking-[0.16em]">
              <span>{store.name}</span>
              <span>Size label</span>
            </div>
            <dl>
              {stats.map((x, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 border-b border-[color-mix(in_srgb,var(--m-text)_18%,transparent)] py-3 last:border-b-0">
                  <dt className="m-muted text-[length:calc(12.5px*var(--m-scale))]">{x.label}</dt>
                  <dd className="m-h text-[length:calc(clamp(24px,2.6vw,34px)*var(--m-scale))] tabular-nums">{x.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 flex items-end gap-3">
              <span
                className="h-10 flex-1"
                aria-hidden
                style={{ background: "repeating-linear-gradient(90deg, var(--m-text) 0 2px, transparent 2px 4px, var(--m-text) 4px 5px, transparent 5px 8px, var(--m-text) 8px 11px, transparent 11px 13px)" }}
              />
              <span className="text-[length:calc(10px*var(--m-scale))] font-semibold tabular-nums tracking-[0.12em]">EST · {o.aboutStat1Value || "—"}</span>
            </div>
          </div>
        )}
      </Container>

      {/* values as a walk: numbered footprints along a dotted path */}
      {values.length > 0 && (
        <Container className="pt-[clamp(48px,7vw,110px)]">
          {o.aboutValuesHeading && <h2 className="m-h t-section max-w-xl">{o.aboutValuesHeading}</h2>}
          <ol className="t-walk relative mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
            <span aria-hidden className="absolute bottom-6 left-[19px] top-6 border-l-2 border-dotted border-[color-mix(in_srgb,var(--m-text)_35%,transparent)] md:bottom-auto md:left-6 md:right-6 md:top-[19px] md:border-l-0 md:border-t-2" />
            {values.map((v, i) => (
              <li key={i} className={`relative flex gap-4 md:block ${i === 1 ? "md:mt-10" : i === 2 ? "md:mt-20" : ""}`}>
                <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#111111] ${i % 2 ? "rotate-[14deg]" : "-rotate-[14deg]"}`} style={{ background: MARK }}>
                  <Footprints className="h-4 w-4" />
                </span>
                <div className="md:mt-4">
                  <p className="m-faint text-[length:calc(11px*var(--m-scale))] font-semibold tabular-nums tracking-[0.12em]">STEP {String(i + 1).padStart(2, "0")}</p>
                  <p className="m-h mt-1 text-[length:calc(clamp(18px,1.6vw,22px)*var(--m-scale))]">{v.title}</p>
                  {v.text && <p className="m-muted mt-1.5 max-w-xs text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{v.text}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Container>
      )}

      {/* a dark closing card with a few pairs fanned out */}
      {o.aboutCtaHeading && (
        <Container className="pt-[clamp(48px,7vw,110px)]">
          <div className="relative grid items-center gap-8 overflow-hidden rounded-[clamp(20px,2.4vw,32px)] bg-[#111111] p-[clamp(24px,4vw,56px)] text-white md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="m-h text-[length:calc(clamp(26px,3.2vw,44px)*var(--m-scale))] leading-[1.02]">{o.aboutCtaHeading}</p>
              {o.aboutCtaButton && (
                <MLink to="/catalog" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full px-6 text-[length:calc(13.5px*var(--m-scale))] font-semibold text-[#111111]" style={{ background: MARK }}>
                  {o.aboutCtaButton} <ArrowRight className="h-4 w-4" />
                </MLink>
              )}
            </div>
            {pairs.length > 0 && (
              <div className="relative mx-auto h-[clamp(150px,18vw,220px)] w-full max-w-[340px]">
                {pairs.map((p, i) => (
                  <MLink
                    key={p.id}
                    to={`/products/${p.slug || p.id}`}
                    className="absolute top-1/2 aspect-square w-[46%] -translate-y-1/2 overflow-hidden rounded-[16px] border-4 border-[#111111] bg-white shadow-xl transition hover:z-10 hover:-translate-y-[56%]"
                    style={{ left: `${i * 27}%`, rotate: `${(i - 1) * 9}deg`, zIndex: i === 1 ? 2 : 1 }}
                  >
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </MLink>
                ))}
              </div>
            )}
          </div>
        </Container>
      )}
    </div>
  );
}

export function SneakerContact({ page }: { page: SitePage }) {
  const { store, content, editing, demo } = useSite();
  const o = content.options;
  const [lead, ...rest] = paragraphs(page);
  const handle = (store.instagramHandle || "").replace(/^@/, "");
  const address = (store.businessAddress || "").trim();
  type Way = { icon: React.ReactNode; label: string; value: string; href: string; external: boolean };
  const real = [
    store.contactPhone && { icon: <MessageCircle className="h-5 w-5" />, label: "WhatsApp", value: store.contactPhone, href: whatsappLink(store.contactPhone, `Hi ${store.name}!`), external: true },
    store.contactEmail && { icon: <Mail className="h-5 w-5" />, label: "Email", value: store.contactEmail, href: `mailto:${store.contactEmail}`, external: false },
    handle && { icon: <InstagramIcon className="h-5 w-5" />, label: "Instagram", value: `@${handle}`, href: `https://instagram.com/${handle}`, external: true },
    store.contactPhone && { icon: <Phone className="h-5 w-5" />, label: "Call", value: store.contactPhone, href: `tel:${store.contactPhone.replace(/[^0-9+]/g, "")}`, external: false },
  ].filter(Boolean) as Way[];
  // theme previews and the editor show example tiles until the shop adds its own details in Settings
  const sample = !real.length && (demo || editing);
  const ways: Way[] = sample
    ? [
        { icon: <MessageCircle className="h-5 w-5" />, label: "WhatsApp", value: "+91 98765 43210", href: "#", external: false },
        { icon: <Mail className="h-5 w-5" />, label: "Email", value: `hello@${store.subdomain || "yourshop"}.in`, href: "#", external: false },
        { icon: <InstagramIcon className="h-5 w-5" />, label: "Instagram", value: `@${store.subdomain || "yourshop"}`, href: "#", external: false },
      ]
    : real;

  const topics = ["Sizing", "An order", "Swap or return", "Something else"];
  const [form, setForm] = React.useState({ name: "", reply: "", topic: topics[0], message: "" });
  const [sent, setSent] = React.useState(false);
  const canSend = !!(store.contactPhone || store.contactEmail);
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing || !form.message.trim()) return;
    const text = `Hi ${store.name}! ${form.name ? `I'm ${form.name}. ` : ""}About: ${form.topic}.\n\n${form.message.trim()}${form.reply ? `\n\nReach me at: ${form.reply}` : ""}`;
    const to = store.contactPhone ? whatsappLink(store.contactPhone, text) : `mailto:${store.contactEmail}?subject=${encodeURIComponent(`${form.topic} – ${store.name}`)}&body=${encodeURIComponent(text)}`;
    if (!demo && to) window.open(to, "_blank", "noopener,noreferrer");
    setSent(true);
  };
  const field = "w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 text-[length:calc(14.5px*var(--m-scale))] text-white outline-none placeholder:text-white/40 focus:border-[var(--mark,#d4f56a)]";

  return (
    <div className="t-contact t-contact-sneaker pb-[clamp(48px,7vw,110px)]">
      {/* title with a round photo, and two chips for hours and reply time */}
      <Container className="pt-[clamp(32px,5vw,72px)]">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            {o.contactEyebrow && <p className="m-cap m-faint text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.16em]">{o.contactEyebrow}</p>}
            <h1 className="m-h mt-2 text-[length:calc(clamp(34px,5.6vw,80px)*var(--m-scale))] leading-[0.98] [overflow-wrap:anywhere]">{page.title}</h1>
          </div>
          {page.image && (
            <span className="relative mt-2 block h-[clamp(76px,11vw,150px)] w-[clamp(76px,11vw,150px)] shrink-0 overflow-hidden rounded-full ring-4" style={{ ["--tw-ring-color" as string]: "var(--mark,#d4f56a)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </span>
          )}
        </div>
        {lead && <p className="m-muted mt-4 max-w-xl text-[length:calc(15px*var(--m-scale))] leading-relaxed">{lead}</p>}
        {rest.map((p, i) => (
          <p key={i} className="m-muted mt-3 max-w-xl whitespace-pre-line text-[length:calc(15px*var(--m-scale))] leading-relaxed">
            {p}
          </p>
        ))}
        <div className="mt-5 flex flex-wrap gap-2 text-[length:calc(12px*var(--m-scale))]">
          {o.contactHours && (
            <span className="m-panel inline-flex items-center gap-2 rounded-full px-3.5 py-2">
              <span className="h-2 w-2 rounded-full bg-[#22a35a]" /> <b className="font-semibold">{o.contactHoursTitle || "Open"}</b> {o.contactHours}
            </span>
          )}
          {o.contactReply && (
            <span className="m-panel inline-flex items-center gap-2 rounded-full px-3.5 py-2">
              <b className="font-semibold">{o.contactReplyTitle || "Reply time"}</b> {o.contactReply}
            </span>
          )}
        </div>
      </Container>

      {/* every way to reach the shop as a big tile; the first one in the highlight colour */}
      <Container className="pt-[clamp(28px,4vw,56px)]">
        {o.contactCardTitle && <p className="m-cap m-faint mb-3 text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.16em]">{o.contactCardTitle}</p>}
        {ways.length ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {ways.map((w, i) => (
              <a
                key={w.label}
                href={w.href}
                onClick={sample ? (e) => e.preventDefault() : undefined}
                target={w.external ? "_blank" : undefined}
                rel={w.external ? "noopener noreferrer" : undefined}
                className={`t-way group flex aspect-[1/0.82] flex-col justify-between rounded-[18px] p-4 transition hover:-translate-y-1 ${i === 0 ? "text-[#111111]" : "m-panel"}`}
                style={i === 0 ? { background: MARK } : undefined}
              >
                <span className="flex items-center justify-between">
                  {w.icon}
                  <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.12em] opacity-60">{w.label}</span>
                  <span className="mt-0.5 block truncate text-[length:calc(14px*var(--m-scale))] font-semibold">{w.value}</span>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="m-muted text-[length:calc(14px*var(--m-scale))]">Send us a message with the form below.</p>
        )}
        {address && (
          <p className="m-muted mt-4 flex items-start gap-2 text-[length:calc(13.5px*var(--m-scale))]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> <span className="whitespace-pre-line">{address}</span>
          </p>
        )}
      </Container>

      {/* a tear-off ticket for writing in */}
      <Container className="pt-[clamp(32px,5vw,72px)]">
        <form onSubmit={send} className="t-ticket relative overflow-hidden rounded-[22px] bg-[#111111] text-white">
          <div className="flex items-center justify-between border-b-2 border-dashed border-white/20 px-[clamp(20px,3vw,40px)] py-4">
            <p className="m-h text-[length:calc(clamp(18px,1.8vw,24px)*var(--m-scale))]">{o.contactFormTitle || "Send us a message"}</p>
            <span className="hidden text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.16em] text-white/45 sm:block">Ticket · {store.name}</span>
          </div>
          {/* the notches where the ticket tears */}
          <span aria-hidden className="absolute -left-3 top-[54px] h-6 w-6 rounded-full bg-[var(--m-bg)]" />
          <span aria-hidden className="absolute -right-3 top-[54px] h-6 w-6 rounded-full bg-[var(--m-bg)]" />
          <div className="p-[clamp(20px,3vw,40px)]">
            {sent ? (
              <p className="text-[length:calc(15px*var(--m-scale))]">Thanks! Your message is ready to send. We&apos;ll get back to you soon.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-wrap gap-2 sm:col-span-2" role="radiogroup" aria-label="What is it about?">
                  {topics.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={form.topic === t}
                      onClick={() => setForm({ ...form, topic: t })}
                      className={`rounded-full border px-3.5 py-2 text-[length:calc(12px*var(--m-scale))] font-medium transition ${form.topic === t ? "border-transparent text-[#111111]" : "border-white/25 text-white/80 hover:border-white/60"}`}
                      style={form.topic === t ? { background: MARK } : undefined}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input className={field} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Your name" />
                <input className={field} placeholder="Phone or email" value={form.reply} onChange={(e) => setForm({ ...form, reply: e.target.value })} aria-label="Phone or email" />
                <textarea
                  className={`${field} min-h-24 resize-none sm:col-span-2`}
                  placeholder="Tell us your size, order number or question"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  aria-label="Your message"
                  required
                />
                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={!canSend && !demo && !editing}
                    className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-[length:calc(13.5px*var(--m-scale))] font-semibold text-[#111111] disabled:opacity-40"
                    style={{ background: MARK }}
                  >
                    {store.contactPhone ? <MessageCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    {o.contactFormButton || "Send message"}
                  </button>
                  <p className="text-[length:calc(11.5px*var(--m-scale))] text-white/45">
                    {store.contactPhone ? "Opens WhatsApp with your message filled in." : store.contactEmail ? "Opens your email app with your message filled in." : "Messages open WhatsApp or email once the shop adds them."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </Container>

      {/* quick help as chips */}
      <Container className="pt-[clamp(24px,3vw,40px)]">
        <div className="flex flex-wrap gap-2">
          {[
            { to: "/account", icon: <Package className="h-4 w-4" />, label: "Track your order" },
            { to: "/pages/shipping", icon: <Truck className="h-4 w-4" />, label: content.pages.shipping.title },
            { to: "/pages/returns", icon: <RotateCcw className="h-4 w-4" />, label: content.pages.returns.title },
          ].map((l) => (
            <MLink key={l.to} to={l.to} className="m-line inline-flex min-h-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[length:calc(13px*var(--m-scale))] transition hover:border-[var(--m-text)]">
              {l.icon}
              {l.label}
              <ArrowRight className="h-3.5 w-3.5 opacity-50" />
            </MLink>
          ))}
        </div>
      </Container>
    </div>
  );
}
