"use client";

import * as React from "react";
import { ArrowRight, ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Package, RotateCcw, Truck } from "lucide-react";
import type { SitePage } from "@/lib/site-content";
import { useSite, whatsappLink } from "./context";
import { Container, InstagramIcon, MLink } from "./ui";

/**
 * Theme 21's own About and Contact pages, unlike any other theme's, in the manner of a jewellery house:
 * About is the atelier: a framed photo, the materials as metal swatches, the shop's numbers between gold diamonds and
 * its promises on hang tags. Contact lists every way to write in, then the store with its photo, address and hours.
 * Their words are Theme 21 settings ("About page", "Contact page").
 */

const GOLD = "var(--gold,#B08D57)";
// the metal swatches: gold, silver, pearl
const METALS = [
  "radial-gradient(circle at 32% 28%, #fff6dc 0%, #e6c77e 28%, #b08d57 62%, #7a5b2e 100%)",
  "radial-gradient(circle at 32% 28%, #ffffff 0%, #dfe2e6 30%, #a9afb7 65%, #6f757d 100%)",
  "radial-gradient(circle at 32% 28%, #ffffff 0%, #f7f1e8 38%, #e5d9c6 72%, #c9b79c 100%)",
];

function paragraphs(page: SitePage) {
  return page.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/** a thin gold rule with a small diamond in the middle */
function Rule({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1" style={{ background: GOLD, opacity: 0.5 }} />
      <span className="h-2 w-2 rotate-45" style={{ background: GOLD }} />
      <span className="h-px flex-1" style={{ background: GOLD, opacity: 0.5 }} />
    </span>
  );
}

export function JewelAbout({ page }: { page: SitePage }) {
  const { content } = useSite();
  const o = content.options;
  const [lead, ...rest] = paragraphs(page);
  const metals = [1, 2, 3].map((n) => ({ title: o[`aboutMat${n}Title`], text: o[`aboutMat${n}Text`] })).filter((x) => x.title);
  const stats = [1, 2, 3].map((n) => ({ value: o[`aboutStat${n}Value`], label: o[`aboutStat${n}Label`] })).filter((x) => x.value);
  const tags = [1, 2, 3].map((n) => ({ title: o[`aboutValue${n}Title`], text: o[`aboutValue${n}Text`] })).filter((x) => x.title);

  return (
    <div className="t-about t-about-jewel pb-[clamp(48px,7vw,110px)]">
      {/* a quiet centred opening */}
      <Container className="pt-[clamp(36px,6vw,96px)] text-center">
        {o.aboutEyebrow && <p className="text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.24em]" style={{ color: GOLD }}>{o.aboutEyebrow}</p>}
        <h1 className="m-h mx-auto mt-3 max-w-3xl text-[length:calc(clamp(28px,4.4vw,60px)*var(--m-scale))] leading-[1.02] [overflow-wrap:anywhere]">{page.title}</h1>
        {lead && <p className="m-muted mx-auto mt-5 max-w-xl text-[length:calc(clamp(14.5px,1.3vw,17px)*var(--m-scale))] leading-relaxed">{lead}</p>}
        <Rule className="mx-auto mt-8 max-w-[220px]" />
      </Container>

      {/* the photo in a mount, like a piece in its box */}
      {page.image && (
        <Container className="pt-[clamp(28px,4vw,56px)]">
          <div className="t-mount mx-auto max-w-5xl bg-[var(--m-panel)] p-[clamp(10px,1.6vw,22px)]" style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${GOLD} 45%, transparent)` }}>
            <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[21/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </Container>
      )}

      {/* the rest of the story beside the materials as metal swatches */}
      {(rest.length > 0 || metals.length > 0) && (
        <Container className="grid gap-10 pt-[clamp(44px,6vw,96px)] md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div className="space-y-4">
            {rest.map((p, i) => (
              <p key={i} className="whitespace-pre-line text-[length:calc(15px*var(--m-scale))] leading-relaxed">
                {p}
              </p>
            ))}
          </div>
          {metals.length > 0 && (
            <div>
              {o.aboutMaterialsHeading && <p className="text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>{o.aboutMaterialsHeading}</p>}
              <ul className="mt-4 divide-y divide-[color-mix(in_srgb,var(--m-text)_10%,transparent)]">
                {metals.map((m, i) => (
                  <li key={i} className="flex items-center gap-4 py-4">
                    <span className="t-metal h-12 w-12 shrink-0 rounded-full shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)]" style={{ background: METALS[i % METALS.length] }} />
                    <span className="min-w-0">
                      <span className="block text-[length:calc(14px*var(--m-scale))] font-semibold uppercase tracking-[0.06em]">{m.title}</span>
                      {m.text && <span className="m-muted mt-0.5 block text-[length:calc(13px*var(--m-scale))] leading-snug">{m.text}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      )}

      {/* numbers between gold diamonds */}
      {stats.length > 0 && (
        <Container className="pt-[clamp(44px,6vw,96px)]">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-0">
            {stats.map((x, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden className="hidden h-2 w-2 rotate-45 sm:mx-[clamp(24px,5vw,72px)] sm:block" style={{ background: GOLD }} />}
                <div className="text-center">
                  <p className="m-h text-[length:calc(clamp(30px,3.6vw,48px)*var(--m-scale))] leading-none">{x.value}</p>
                  {x.label && <p className="m-muted mt-2 text-[length:calc(12px*var(--m-scale))] uppercase tracking-[0.12em]">{x.label}</p>}
                </div>
              </React.Fragment>
            ))}
          </div>
        </Container>
      )}

      {/* promises on hang tags */}
      {tags.length > 0 && (
        <Container className="pt-[clamp(48px,7vw,110px)]">
          {o.aboutValuesHeading && <h2 className="m-h t-section text-center">{o.aboutValuesHeading}</h2>}
          <div className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-5">
            {tags.map((t, i) => (
              <div key={i} className={`t-tag relative mx-auto w-full max-w-[300px] pt-6 ${i === 1 ? "sm:mt-6" : ""}`}>
                {/* the string the tag hangs from */}
                <span aria-hidden className="absolute left-1/2 top-0 h-7 w-px -translate-x-1/2" style={{ background: GOLD }} />
                <div className="relative rounded-[6px_6px_14px_14px] bg-[var(--m-panel)] px-5 pb-6 pt-8 text-center" style={{ clipPath: "polygon(18% 0, 82% 0, 100% 12%, 100% 100%, 0 100%, 0 12%)" }}>
                  <span aria-hidden className="absolute left-1/2 top-3 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--m-bg)]" style={{ boxShadow: `0 0 0 1.5px ${GOLD}` }} />
                  <p className="mt-2 text-[length:calc(13.5px*var(--m-scale))] font-semibold uppercase tracking-[0.1em]">{t.title}</p>
                  {t.text && <p className="m-muted mt-2 text-[length:calc(13px*var(--m-scale))] leading-relaxed">{t.text}</p>}
                </div>
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* a quiet close */}
      {o.aboutCtaHeading && (
        <Container className="pt-[clamp(48px,7vw,110px)] text-center">
          <Rule className="mx-auto mb-8 max-w-[220px]" />
          <p className="m-h mx-auto max-w-xl text-[length:calc(clamp(22px,2.6vw,34px)*var(--m-scale))] leading-tight">{o.aboutCtaHeading}</p>
          {o.aboutCtaButton && (
            <MLink to="/catalog" className="mt-6 inline-flex h-12 items-center gap-2 border px-7 text-[length:calc(12.5px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] transition hover:bg-[var(--m-text)] hover:text-[var(--m-bg)]" style={{ borderColor: GOLD }}>
              {o.aboutCtaButton} <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </Container>
      )}
    </div>
  );
}

export function JewelContact({ page }: { page: SitePage }) {
  const { store, content, editing, demo } = useSite();
  const o = content.options;
  const paras = paragraphs(page);
  const handle = (store.instagramHandle || "").replace(/^@/, "");
  const address = (store.businessAddress || "").trim();
  type Way = { icon: React.ReactNode; label: string; value: string; href: string; external: boolean };
  const real = [
    store.contactPhone && { icon: <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />, label: "WhatsApp", value: store.contactPhone, href: whatsappLink(store.contactPhone, `Hi ${store.name}!`), external: true },
    store.contactEmail && { icon: <Mail className="h-[18px] w-[18px]" strokeWidth={1.5} />, label: "Email", value: store.contactEmail, href: `mailto:${store.contactEmail}`, external: false },
    handle && { icon: <InstagramIcon className="h-[18px] w-[18px]" />, label: "Instagram", value: `@${handle}`, href: `https://instagram.com/${handle}`, external: true },
  ].filter(Boolean) as Way[];
  const sample = !real.length && (demo || editing);
  const ways: Way[] = sample
    ? [
        { icon: <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />, label: "WhatsApp", value: "+91 98765 43210", href: "#", external: false },
        { icon: <Mail className="h-[18px] w-[18px]" strokeWidth={1.5} />, label: "Email", value: `hello@${store.subdomain || "yourshop"}.in`, href: "#", external: false },
        { icon: <InstagramIcon className="h-[18px] w-[18px]" />, label: "Instagram", value: `@${store.subdomain || "yourshop"}`, href: "#", external: false },
      ]
    : real;

  // a short note that opens WhatsApp (or email) with the words filled in
  const topics = (o.contactTopics || "A gift / An order / Sizing / Something else").split("/").map((t) => t.trim()).filter(Boolean);
  const [note, setNote] = React.useState({ name: "", reply: "", topic: topics[0] || "", message: "" });
  const [sent, setSent] = React.useState(false);
  const canSend = !!(store.contactPhone || store.contactEmail);
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing || !note.message.trim()) return;
    const text = `Hi ${store.name}! ${note.name ? `I'm ${note.name}. ` : ""}${note.topic ? `About: ${note.topic}.` : ""}\n\n${note.message.trim()}${note.reply ? `\n\nReach me at: ${note.reply}` : ""}`;
    const to = store.contactPhone ? whatsappLink(store.contactPhone, text) : `mailto:${store.contactEmail}?subject=${encodeURIComponent(`${note.topic || "A note"} – ${store.name}`)}&body=${encodeURIComponent(text)}`;
    if (!demo && to) window.open(to, "_blank", "noopener,noreferrer");
    setSent(true);
  };
  const line = "w-full border-0 border-b border-[color-mix(in_srgb,var(--m-text)_18%,transparent)] bg-transparent px-0 py-3 text-[length:calc(14px*var(--m-scale))] outline-none placeholder:text-[color-mix(in_srgb,var(--m-text)_40%,transparent)] focus:border-[var(--gold,#B08D57)]";
  const small = "text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.22em]";

  return (
    <div className="t-contact t-contact-jewel pb-[clamp(48px,7vw,110px)]">
      {/* a quiet centred opening, like the About page */}
      <Container className="pt-[clamp(36px,6vw,96px)] text-center">
        {o.contactEyebrow && <p className={small} style={{ color: GOLD }}>{o.contactEyebrow}</p>}
        <h1 className="m-h mx-auto mt-3 max-w-3xl text-[length:calc(clamp(28px,4.4vw,60px)*var(--m-scale))] leading-[1.02] [overflow-wrap:anywhere]">{page.title}</h1>
        {paras.map((p, i) => (
          <p key={i} className="m-muted mx-auto mt-4 max-w-xl whitespace-pre-line text-[length:calc(clamp(14.5px,1.3vw,17px)*var(--m-scale))] leading-relaxed">
            {p}
          </p>
        ))}
        <Rule className="mx-auto mt-8 max-w-[220px]" />
      </Container>

      {/* every way to write in, as framed cards */}
      {ways.length > 0 && (
        <Container className="pt-[clamp(28px,4vw,56px)]">
          {o.contactWaysHeading && <p className={`${small} text-center`}>{o.contactWaysHeading}</p>}
          <div className="mx-auto mt-5 grid max-w-4xl gap-3 sm:grid-cols-3 sm:gap-4">
            {ways.map((w) => (
              <a
                key={w.label}
                href={w.href}
                onClick={sample ? (e) => e.preventDefault() : undefined}
                target={w.external ? "_blank" : undefined}
                rel={w.external ? "noopener noreferrer" : undefined}
                className="t-way group flex items-center gap-4 bg-[var(--m-panel)] p-4 transition-shadow sm:flex-col sm:gap-3 sm:p-7 sm:text-center"
                style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${GOLD} 40%, transparent)` }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--m-bg)] transition-colors group-hover:bg-[var(--m-text)] group-hover:text-[var(--m-bg)]" style={{ boxShadow: `0 0 0 1px ${GOLD}`, color: GOLD }}>
                  {w.icon}
                </span>
                <span className="min-w-0 flex-1 sm:flex-none">
                  <span className={`${small} block`}>{w.label}</span>
                  <span className="m-muted mt-1 block truncate text-[length:calc(13.5px*var(--m-scale))]">{w.value}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 opacity-40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:hidden" />
              </a>
            ))}
          </div>
        </Container>
      )}

      {/* a note card: a double gold border like stationery, topic chips and lined fields */}
      <Container className="pt-[clamp(40px,6vw,88px)]">
        <form onSubmit={send} className="t-note mx-auto max-w-2xl bg-[var(--m-bg)] p-2" style={{ boxShadow: `inset 0 0 0 1px ${GOLD}` }}>
          <div className="p-[clamp(18px,3.4vw,44px)]" style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${GOLD} 45%, transparent)` }}>
            <div className="text-center">
              <span aria-hidden className="mx-auto block h-2 w-2 rotate-45" style={{ background: GOLD }} />
              <p className="m-h mt-3 text-[length:calc(clamp(19px,2vw,26px)*var(--m-scale))]">{o.contactNoteTitle || "Write us a note"}</p>
            </div>
            {sent ? (
              <p className="m-muted mt-6 text-center text-[length:calc(14.5px*var(--m-scale))]">{o.contactNoteThanks || "Thank you. Your note is ready to send, and we'll reply soon."}</p>
            ) : (
              <>
                {topics.length > 0 && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="What is it about?">
                    {topics.map((t) => {
                      const on = note.topic === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setNote({ ...note, topic: t })}
                          className={`border px-3.5 py-2 text-[length:calc(11px*var(--m-scale))] font-medium uppercase tracking-[0.1em] transition ${on ? "border-[var(--m-text)] bg-[var(--m-text)] text-[var(--m-bg)]" : "m-line hover:border-[var(--m-text)]"}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 grid gap-x-6 sm:grid-cols-2">
                  <input className={line} placeholder="Your name" value={note.name} onChange={(e) => setNote({ ...note, name: e.target.value })} aria-label="Your name" />
                  <input className={line} placeholder="Phone or email" value={note.reply} onChange={(e) => setNote({ ...note, reply: e.target.value })} aria-label="Phone or email" />
                  <textarea className={`${line} min-h-24 resize-none sm:col-span-2`} placeholder="Your note" value={note.message} onChange={(e) => setNote({ ...note, message: e.target.value })} aria-label="Your note" required />
                </div>
                <div className="mt-6 text-center">
                  <button type="submit" disabled={!canSend && !demo && !editing} className="inline-flex h-12 items-center gap-2 bg-[var(--m-text)] px-8 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] text-[var(--m-bg)] transition hover:opacity-85 disabled:opacity-40">
                    {o.contactNoteButton || "Send note"} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <p className="m-faint mt-3 text-[length:calc(11px*var(--m-scale))]">
                    {store.contactPhone ? "Opens WhatsApp with your note filled in." : store.contactEmail ? "Opens your email app with your note filled in." : "Notes open WhatsApp or email once the shop adds them."}
                  </p>
                </div>
              </>
            )}
          </div>
        </form>
      </Container>

      {/* the store: its photo in a mount beside the address and hours */}
      <Container className="grid items-center gap-8 pt-[clamp(48px,7vw,110px)] md:grid-cols-[1.1fr_1fr] md:gap-14">
        {page.image && (
          <div className="bg-[var(--m-panel)] p-[clamp(10px,1.4vw,18px)]" style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${GOLD} 45%, transparent)` }}>
            <div className="relative aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        )}
        <div className="text-center md:text-left">
          {o.contactVisitTitle && <p className="m-h t-section">{o.contactVisitTitle}</p>}
          <span aria-hidden className="mx-auto mt-4 flex w-fit items-center gap-2 md:mx-0">
            <span className="h-px w-10" style={{ background: GOLD }} />
            <span className="h-1.5 w-1.5 rotate-45" style={{ background: GOLD }} />
          </span>
          <div className="mt-5 space-y-3 text-[length:calc(14px*var(--m-scale))]">
            {address && (
              <p className="flex items-start justify-center gap-3 md:justify-start">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOLD }} />
                <span className="whitespace-pre-line">{address}</span>
              </p>
            )}
            {o.contactHours && (
              <p className="flex items-start justify-center gap-3 md:justify-start">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOLD }} />
                <span className="whitespace-pre-line">{o.contactHours}</span>
              </p>
            )}
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 md:justify-start">
            {[
              { to: "/account", icon: <Package className="h-3.5 w-3.5" />, label: "Track your order" },
              { to: "/pages/shipping", icon: <Truck className="h-3.5 w-3.5" />, label: content.pages.shipping.title },
              { to: "/pages/returns", icon: <RotateCcw className="h-3.5 w-3.5" />, label: content.pages.returns.title },
            ].map((l) => (
              <MLink key={l.to} to={l.to} className="inline-flex min-h-0 items-center gap-2 border-b border-current pb-0.5 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.12em] hover:opacity-70">
                {l.icon}
                {l.label}
              </MLink>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
