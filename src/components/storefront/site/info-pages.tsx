"use client";

import * as React from "react";
import { ArrowRight, ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Package, Phone, RotateCcw, Timer, Truck } from "lucide-react";
import type { SitePage } from "@/lib/site-content";
import { activeCategories, productsFromSource, useSite, whatsappLink } from "./context";
import { Container, InstagramIcon, MLink } from "./ui";

/**
 * Theme 3's own About and Contact pages: richer than the shared page layouts, and different from each other.
 * Their extra words (numbers, values, opening hours…) are Theme 3 settings in the editor ("About page", "Contact page").
 */

function useParagraphs(page: SitePage) {
  return page.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/** "bold": black bands (Theme 3); "soft": the accent and panel colours (E01) */
type PageTone = "bold" | "soft" | "editorial";

export function RichAbout({ page, tone = "bold" }: { page: SitePage; tone?: PageTone }) {
  const { store, content } = useSite();
  const soft = tone === "soft";
  const editorial = tone === "editorial";
  const o = content.options;
  const [lead, ...rest] = useParagraphs(page);
  const stats = [1, 2, 3].map((n) => ({ value: o[`aboutStat${n}Value`], label: o[`aboutStat${n}Label`] })).filter((x) => x.value);
  const values = [1, 2, 3].map((n) => ({ title: o[`aboutValue${n}Title`], text: o[`aboutValue${n}Text`] })).filter((x) => x.title);
  // a row of the shop's own photos: its categories first, then products
  const photos = [
    ...activeCategories(store)
      .filter((c) => !c.parentId && c.imageUrl)
      .map((c) => ({ key: c.id, image: c.imageUrl!, label: c.name, to: `/category/${c.slug}` })),
    ...productsFromSource(store, "bestsellers", 6)
      .filter((p) => p.images?.[0])
      .map((p) => ({ key: p.id, image: p.images[0], label: p.title, to: `/products/${p.slug || p.id}` })),
  ].slice(0, 3);

  return (
    <div className="t-about pb-24">
      {/* the photo across the page, the title and opening line on it */}
      <section className="relative flex min-h-[clamp(380px,52vw,640px)] items-end overflow-hidden bg-[#141414] text-white">
        {page.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10"
          style={soft ? { background: "linear-gradient(to top, color-mix(in srgb, var(--m-accent) 82%, black) 0%, color-mix(in srgb, var(--m-accent) 35%, transparent) 55%, transparent 100%)" } : undefined}
        />
        <Container className="m-rise relative pb-[clamp(28px,5vw,72px)] pt-32">
          {o.aboutEyebrow && <p className="m-cap text-[length:calc(11.5px*var(--m-scale))] font-semibold tracking-[0.18em] text-white/70">{o.aboutEyebrow}</p>}
          <h1 className="m-h m-display t-hero mt-3 [overflow-wrap:anywhere]">{page.title}</h1>
          {lead && <p className="mt-4 max-w-xl text-[length:calc(clamp(15px,1.4vw,19px)*var(--m-scale))] leading-relaxed text-white/85">{lead}</p>}
        </Container>
      </section>

      {/* the rest of the story beside a small label */}
      {rest.length > 0 && (
        <Container className="grid gap-6 py-[clamp(48px,7vw,110px)] md:grid-cols-[1fr_2fr] md:gap-16">
          <div>
            <p className="m-cap m-muted text-[length:calc(11.5px*var(--m-scale))] font-semibold tracking-[0.18em]">{o.aboutStoryLabel || "The story"}</p>
            <span className="mt-4 block h-[3px] w-12 bg-[var(--m-accent)]" />
          </div>
          <div className="space-y-5">
            {rest.map((p, i) => (
              <p key={i} className={i === 0 ? "m-h text-[length:calc(clamp(20px,2.2vw,30px)*var(--m-scale))] leading-snug" : "m-muted whitespace-pre-line text-[length:calc(16px*var(--m-scale))] leading-relaxed"}>
                {p}
              </p>
            ))}
          </div>
        </Container>
      )}

      {/* numbers on a black band */}
      {stats.length > 0 && (
        <section className={editorial ? "" : soft ? "bg-[var(--m-panel)]" : "t-dark-band bg-[#0f0f0f] text-white"}>
          <Container className={editorial ? "m-line grid divide-y divide-[color-mix(in_srgb,var(--m-text)_12%,transparent)] border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" : soft ? "grid gap-3 py-[clamp(20px,3vw,40px)] sm:grid-cols-3" : "grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0"}>
            {stats.map((x, i) => (
              <div key={i} className={soft ? "relative rounded-[18px] bg-[var(--m-bg)] px-4 py-[clamp(22px,3vw,40px)] text-center" : "px-2 py-[clamp(28px,4vw,56px)] text-center sm:px-6"}>
                <p className={editorial ? "m-h m-display text-[length:calc(clamp(48px,6vw,92px)*var(--m-scale))] italic leading-none" : soft ? "m-h text-[length:calc(clamp(38px,4.6vw,64px)*var(--m-scale))] leading-none text-[var(--m-accent)]" : "m-h m-display text-[length:calc(clamp(44px,5.5vw,84px)*var(--m-scale))] leading-none"}>{x.value}</p>
                {x.label && <p className={soft || editorial ? "m-muted mt-3 text-[length:calc(13.5px*var(--m-scale))]" : "mt-3 text-[length:calc(13.5px*var(--m-scale))] text-white/70"}>{x.label}</p>}
              </div>
            ))}
          </Container>
        </section>
      )}

      {/* what the shop stands for */}
      {values.length > 0 && (
        <Container className="py-[clamp(48px,7vw,110px)]">
          {o.aboutValuesHeading && <h2 className="m-h t-section mb-[clamp(24px,3.4vw,48px)] text-center">{o.aboutValuesHeading}</h2>}
          <div className="m-stagger grid gap-3 sm:grid-cols-3 sm:gap-4">
            {values.map((v, i) => (
              <div key={i} className={editorial ? "m-line flex flex-col border-t pt-5" : soft ? "m-line relative flex flex-col rounded-[18px] border p-[clamp(22px,2.6vw,36px)]" : "m-panel m-card flex flex-col p-[clamp(22px,2.6vw,36px)]"}>
                <span className={editorial ? "m-h m-display text-[length:calc(34px*var(--m-scale))] italic leading-none" : soft ? "flex h-11 w-11 items-center justify-center rounded-full bg-[var(--m-panel)] text-[length:calc(14px*var(--m-scale))] font-semibold text-[var(--m-accent)]" : "m-h m-display text-[length:calc(40px*var(--m-scale))] leading-none opacity-20"}>{String(i + 1).padStart(2, "0")}</span>
                <p className="m-h mt-6 text-[length:calc(clamp(18px,1.6vw,22px)*var(--m-scale))]">{v.title}</p>
                {v.text && <p className="m-muted mt-2 text-[length:calc(14px*var(--m-scale))] leading-relaxed">{v.text}</p>}
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* the shop's own photos */}
      {photos.length > 0 && (
        <Container className={values.length ? "" : "pt-[clamp(48px,7vw,110px)]"}>
          <div className="m-stagger grid grid-cols-3 gap-2 sm:gap-4">
            {photos.map((ph) => (
              <MLink key={ph.key} to={ph.to} className="group block">
                <span className="m-panel m-card relative block aspect-[3/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                </span>
                <span className="mt-2 flex items-center justify-between gap-2 text-[length:calc(12.5px*var(--m-scale))] font-medium">
                  <span className="truncate">{ph.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </MLink>
            ))}
          </div>
        </Container>
      )}

      {/* the way back to the shop */}
      {o.aboutCtaHeading && (
        <Container className="pt-[clamp(48px,7vw,110px)]">
          <div className="m-card flex flex-col items-center gap-5 rounded-[clamp(18px,2vw,28px)] bg-[var(--m-accent)] px-6 py-[clamp(40px,6vw,88px)] text-center text-[var(--m-accent-text)]">
            <h2 className="m-h m-display t-section max-w-2xl">{o.aboutCtaHeading}</h2>
            <MLink to="/catalog" className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--m-accent-text)] px-8 text-[length:calc(13px*var(--m-scale))] font-semibold text-[var(--m-accent)] transition-[gap] hover:gap-3">
              {o.aboutCtaButton || "Shop now"}
              <ArrowRight className="h-4 w-4" />
            </MLink>
          </div>
        </Container>
      )}
    </div>
  );
}

export function RichContact({ page, tone = "bold" }: { page: SitePage; tone?: PageTone }) {
  const { store, content, editing, demo } = useSite();
  const soft = tone === "soft";
  const editorial = tone === "editorial";
  const o = content.options;
  const paragraphs = useParagraphs(page);
  const handle = (store.instagramHandle || "").replace(/^@/, "");
  const address = (store.businessAddress || "").trim();
  const real = [
    store.contactPhone && { icon: <MessageCircle className="h-5 w-5" />, label: "WhatsApp", value: store.contactPhone, href: whatsappLink(store.contactPhone, `Hi ${store.name}!`), external: true },
    store.contactPhone && { icon: <Phone className="h-5 w-5" />, label: "Call", value: store.contactPhone, href: `tel:${store.contactPhone.replace(/[^0-9+]/g, "")}`, external: false },
    store.contactEmail && { icon: <Mail className="h-5 w-5" />, label: "Email", value: store.contactEmail, href: `mailto:${store.contactEmail}`, external: false },
    handle && { icon: <InstagramIcon className="h-5 w-5" />, label: "Instagram", value: `@${handle}`, href: `https://instagram.com/${handle}`, external: true },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string; external: boolean }[];
  // theme previews and the editor show example rows until the shop adds its own details in Settings
  const sample = !real.length && (demo || editing);
  const ways = sample
    ? [
        { icon: <MessageCircle className="h-5 w-5" />, label: "WhatsApp", value: "+91 98765 43210", href: "#", external: false },
        { icon: <Mail className="h-5 w-5" />, label: "Email", value: `hello@${store.subdomain || "yourshop"}.in`, href: "#", external: false },
        { icon: <InstagramIcon className="h-5 w-5" />, label: "Instagram", value: `@${store.subdomain || "yourshop"}`, href: "#", external: false },
      ]
    : real;

  const topics = ["An order", "A product", "Returns or exchange", "Something else"];
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
  const field = "m-field w-full rounded-[12px] px-4";

  return (
    <div className="t-contact pb-24">
      {/* words on the left, every way to reach the shop on a black card */}
      <Container className="grid gap-8 pt-[clamp(32px,5vw,72px)] md:grid-cols-[1.1fr_1fr] md:gap-14">
        <div className="m-rise md:py-6">
          {o.contactEyebrow && <p className="m-cap m-muted text-[length:calc(11.5px*var(--m-scale))] font-semibold tracking-[0.18em]">{o.contactEyebrow}</p>}
          <h1 className="m-h m-display t-hero mt-3 [overflow-wrap:anywhere]">{page.title}</h1>
          <div className="mt-5 max-w-lg space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="m-muted whitespace-pre-line text-[length:calc(16px*var(--m-scale))] leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
        <div
          className={editorial ? "t-ink-card m-card flex flex-col rounded-[6px] border-2 border-[var(--m-text)] p-[clamp(20px,3vw,40px)]" : soft ? "m-card flex flex-col rounded-[clamp(18px,2vw,28px)] p-[clamp(20px,3vw,40px)] text-[var(--m-accent-text)]" : "t-dark-band m-card flex flex-col rounded-[clamp(18px,2vw,28px)] bg-[#0f0f0f] p-[clamp(20px,3vw,40px)] text-white"}
          style={soft ? { background: "linear-gradient(150deg, var(--m-accent), color-mix(in srgb, var(--m-accent) 55%, #ffffff))" } : undefined}
        >
          <p className="m-h text-[length:calc(clamp(20px,1.8vw,26px)*var(--m-scale))]">{o.contactCardTitle || "Reach us"}</p>
          {ways.length ? (
            <div className="mt-5 divide-y divide-white/10">
              {ways.map((w) => (
                <a key={w.label} href={w.href} onClick={sample ? (e) => e.preventDefault() : undefined} target={w.external ? "_blank" : undefined} rel={w.external ? "noopener noreferrer" : undefined} className="group flex items-center gap-4 py-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-white group-hover:text-black">{w.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="m-cap block text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.12em] text-white/55">{w.label}</span>
                    <span className="block truncate text-[length:calc(15px*var(--m-scale))] font-medium">{w.value}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[length:calc(14px*var(--m-scale))] text-white/60">
              {editing || demo ? "Your WhatsApp number, email and Instagram from Settings show here." : "Send us a message with the form below."}
            </p>
          )}
          {address && (
            <div className="mt-auto flex items-start gap-3 border-t border-white/10 pt-5">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white/60" />
              <p className="whitespace-pre-line text-[length:calc(14px*var(--m-scale))] text-white/80">{address}</p>
            </div>
          )}
        </div>
      </Container>

      {/* a wide photo between the two halves */}
      {page.image && (
        <Container className="pt-[clamp(32px,5vw,72px)]">
          <div className="m-card relative aspect-[16/9] overflow-hidden sm:aspect-[21/8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </Container>
      )}

      {/* a message form beside the opening hours and quick help */}
      <Container className="grid gap-4 pt-[clamp(32px,5vw,72px)] md:grid-cols-[1.4fr_1fr]">
        <form onSubmit={send} className="m-panel m-card p-[clamp(20px,3vw,40px)]">
          <p className="m-h text-[length:calc(clamp(20px,1.8vw,26px)*var(--m-scale))]">{o.contactFormTitle || "Send us a message"}</p>
          {sent ? (
            <p className="mt-6 text-[length:calc(15px*var(--m-scale))]">Thanks! Your message is ready to send. We&apos;ll get back to you soon.</p>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input className={field} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Your name" />
              <input className={field} placeholder="Phone or email" value={form.reply} onChange={(e) => setForm({ ...form, reply: e.target.value })} aria-label="Phone or email" />
              <select className={`${field} sm:col-span-2`} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} aria-label="What is it about?">
                {topics.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <textarea
                className={`${field} min-h-32 py-3 sm:col-span-2`}
                placeholder="How can we help?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                aria-label="Your message"
                required
              />
              <button type="submit" disabled={!canSend && !demo && !editing} className="m-btn min-h-12 sm:col-span-2 disabled:opacity-40">
                {store.contactPhone ? <MessageCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {o.contactFormButton || "Send message"}
              </button>
              <p className="m-faint text-[length:calc(12px*var(--m-scale))] sm:col-span-2">
                {store.contactPhone ? "Opens WhatsApp with your message filled in." : store.contactEmail ? "Opens your email app with your message filled in." : "Messages open WhatsApp or email once the shop adds them."}
              </p>
            </div>
          )}
        </form>
        <div className="grid gap-4">
          <div className="m-line m-card flex gap-4 border p-[clamp(18px,2.4vw,28px)]">
            <Clock className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="m-h text-[length:calc(16px*var(--m-scale))]">{o.contactHoursTitle || "Opening hours"}</p>
              <p className="m-muted mt-1 whitespace-pre-line text-[length:calc(14px*var(--m-scale))]">{o.contactHours}</p>
            </div>
          </div>
          <div className="m-line m-card flex gap-4 border p-[clamp(18px,2.4vw,28px)]">
            <Timer className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="m-h text-[length:calc(16px*var(--m-scale))]">{o.contactReplyTitle || "Reply time"}</p>
              <p className="m-muted mt-1 text-[length:calc(14px*var(--m-scale))]">{o.contactReply}</p>
            </div>
          </div>
          <div className="m-line m-card border p-[clamp(18px,2.4vw,28px)]">
            <p className="m-h text-[length:calc(16px*var(--m-scale))]">Quick help</p>
            <div className="mt-3 grid gap-1">
              {[
                { to: "/account", icon: <Package className="h-4 w-4" />, label: "Track your order" },
                { to: "/pages/shipping", icon: <Truck className="h-4 w-4" />, label: content.pages.shipping.title },
                { to: "/pages/returns", icon: <RotateCcw className="h-4 w-4" />, label: content.pages.returns.title },
              ].map((l) => (
                <MLink key={l.to} to={l.to} className="group flex min-h-0 items-center gap-3 rounded-lg py-2 text-[length:calc(14px*var(--m-scale))]">
                  {l.icon}
                  <span className="flex-1">{l.label}</span>
                  <ArrowRight className="h-4 w-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </MLink>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
