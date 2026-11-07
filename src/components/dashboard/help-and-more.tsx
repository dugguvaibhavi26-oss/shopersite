"use client";

import type { ReactNode } from "react";
import { BookOpen, ChevronRight, FileText, Mail, MessageCircle, ReceiptText, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

type Row = { label: string; note: string; icon: ReactNode; href: string; tone: string };

// Lucide 1.x ships no brand logos, so the social marks are drawn here.
const SOCIAL: { key: keyof typeof siteConfig.social; label: string; icon: ReactNode }[] = [
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
        <path d="M14 8.5V6.8c0-.8.5-1.3 1.3-1.3H17V2.2h-2.6C11.6 2.2 10 4 10 6.6v1.9H7.5v3.3H10V22h4V11.8h2.8l.5-3.3H14z" />
      </svg>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
        <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.6 2.6 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" />
      </svg>
    ),
  },
  {
    key: "x",
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
      </svg>
    ),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[17px] h-[17px]">
        <path d="M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v12H3V9zm6 0h2.9v1.7h.1c.4-.8 1.4-1.9 3.1-1.9 3.3 0 3.9 2.2 3.9 5V21h-3v-6.4c0-1.5 0-3.5-2.1-3.5s-2.5 1.7-2.5 3.4V21H9V9z" />
      </svg>
    ),
  },
];

function LinkRow({ row }: { row: Row }) {
  const ready = Boolean(row.href);
  const inner = (
    <>
      <span className={`w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${row.tone}`}>
        {row.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-neutral-900">{row.label}</span>
        <span className="block text-xs text-neutral-500 truncate">{row.note}</span>
      </span>
      {ready ? (
        <ChevronRight className="w-4 h-4 text-neutral-300 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-neutral-600" />
      ) : (
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">Soon</span>
      )}
    </>
  );
  const cls = "group flex items-center gap-3 px-4 sm:px-5 py-3.5 transition-colors";
  return ready ? (
    <a
      href={row.href}
      target={row.href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noreferrer"
      className={`${cls} hover:bg-neutral-50`}
    >
      {inner}
    </a>
  ) : (
    <div className={`${cls} cursor-default`}>{inner}</div>
  );
}

/** End-of-overview menu: support channels, legal pages and the platform's social profiles. */
export function HelpAndMore({ storeName }: { storeName: string }) {
  const wa = siteConfig.supportWhatsApp.replace(/\D/g, "");
  const support: Row[] = [
    {
      label: "Chat with support",
      note: "WhatsApp, usually replies within hours",
      icon: <MessageCircle className="w-[18px] h-[18px]" />,
      href: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I need help with my store ${storeName}`)}` : "",
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Email support",
      note: siteConfig.supportEmail,
      icon: <Mail className="w-[18px] h-[18px]" />,
      href: `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(`Help with ${storeName}`)}`,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Help centre",
      note: "Guides for running your store",
      icon: <BookOpen className="w-[18px] h-[18px]" />,
      href: siteConfig.helpCenterUrl,
      tone: "bg-violet-50 text-violet-600",
    },
  ];
  const legal: Row[] = [
    { label: "Terms and conditions", note: "Rules for using " + siteConfig.name, icon: <FileText className="w-[18px] h-[18px]" />, href: siteConfig.legal.terms, tone: "bg-neutral-100 text-neutral-700" },
    { label: "Privacy policy", note: "How we handle your data", icon: <ShieldCheck className="w-[18px] h-[18px]" />, href: siteConfig.legal.privacy, tone: "bg-neutral-100 text-neutral-700" },
    { label: "Refund policy", note: "Plans, billing and refunds", icon: <ReceiptText className="w-[18px] h-[18px]" />, href: siteConfig.legal.refunds, tone: "bg-neutral-100 text-neutral-700" },
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Help and support", rows: support },
          { title: "Legal", rows: legal },
        ].map((group) => (
          <div key={group.title}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{group.title}</h2>
            <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
              {group.rows.map((row) => (
                <LinkRow key={row.label} row={row} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="block text-sm font-medium text-neutral-900">Follow {siteConfig.name}</span>
          <span className="block text-xs text-neutral-500">Tips, seller stories and new features</span>
        </div>
        <div className="flex items-center gap-2">
          {SOCIAL.map((sn) => {
            const href = siteConfig.social[sn.key];
            const cls = "w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300";
            return href ? (
              <a
                key={sn.key}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={sn.label}
                className={`${cls} border-neutral-200 text-neutral-700 hover:bg-neutral-900 hover:border-neutral-900 hover:text-white hover:-translate-y-0.5`}
              >
                {sn.icon}
              </a>
            ) : (
              <span key={sn.key} aria-label={`${sn.label} (coming soon)`} title={`${sn.label}: coming soon`} className={`${cls} border-dashed border-neutral-200 text-neutral-300`}>
                {sn.icon}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
