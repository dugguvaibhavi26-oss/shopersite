"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

/**
 * The site's own pop-ups, used in place of the browser's alert / confirm / prompt (the grey
 * "shopersite.in says…" boxes). Call them from anywhere:
 *   await appAlert("Saved.")
 *   if (await appConfirm("Delete this?", { danger: true })) …
 *   const why = await appPrompt("Why?", { defaultValue: "…" })  // null when cancelled
 */

type Tone = "info" | "success" | "danger";
type Request = {
  id: number;
  kind: "alert" | "confirm" | "prompt";
  title?: string;
  message: string;
  okLabel?: string;
  cancelLabel?: string;
  tone: Tone;
  defaultValue?: string;
  placeholder?: string;
  resolve: (v: boolean | string | null) => void;
};

type Opts = { title?: string; okLabel?: string; cancelLabel?: string; danger?: boolean; tone?: Tone };

let push: ((r: Request) => void) | null = null;
const waiting: Request[] = [];
let nextId = 1;

function open(r: Omit<Request, "id" | "resolve">): Promise<boolean | string | null> {
  return new Promise((resolve) => {
    const req = { ...r, id: nextId++, resolve };
    if (push) push(req);
    else waiting.push(req);
  });
}

export function appAlert(message: string | undefined, opts: Opts = {}): Promise<void> {
  return open({ kind: "alert", message: message || "Something went wrong. Please try again.", title: opts.title, okLabel: opts.okLabel || "OK", tone: opts.tone || (opts.danger ? "danger" : "info") }).then(() => undefined);
}

export function appConfirm(message: string, opts: Opts = {}): Promise<boolean> {
  return open({
    kind: "confirm",
    message,
    title: opts.title,
    okLabel: opts.okLabel || (opts.danger ? "Delete" : "Continue"),
    cancelLabel: opts.cancelLabel || "Cancel",
    tone: opts.danger ? "danger" : opts.tone || "info",
  }).then((v) => v === true);
}

export function appPrompt(message: string, opts: Opts & { defaultValue?: string; placeholder?: string } = {}): Promise<string | null> {
  return open({
    kind: "prompt",
    message,
    title: opts.title,
    okLabel: opts.okLabel || "OK",
    cancelLabel: opts.cancelLabel || "Cancel",
    tone: opts.danger ? "danger" : opts.tone || "info",
    defaultValue: opts.defaultValue,
    placeholder: opts.placeholder,
  }).then((v) => (typeof v === "string" ? v : null));
}

/** Mounted once in the root layout. */
export function AppDialogHost() {
  const [queue, setQueue] = React.useState<Request[]>([]);
  const [value, setValue] = React.useState("");
  const okRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    push = (r) => setQueue((q) => [...q, r]);
    if (waiting.length) setQueue((q) => [...q, ...waiting.splice(0)]);
    return () => {
      push = null;
    };
  }, []);

  const current = queue[0];
  React.useEffect(() => {
    if (!current) return;
    setValue(current.defaultValue || "");
    const t = window.setTimeout(() => (current.kind === "prompt" ? inputRef.current?.focus() : okRef.current?.focus()), 30);
    return () => window.clearTimeout(t);
  }, [current]);

  const close = React.useCallback(
    (result: boolean | string | null) => {
      if (!current) return;
      current.resolve(result);
      setQueue((q) => q.slice(1));
    },
    [current]
  );

  React.useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(current.kind === "alert" ? true : current.kind === "prompt" ? null : false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, close]);

  if (!mounted || !current) return null;
  const Icon = current.tone === "danger" ? AlertTriangle : current.tone === "success" ? CheckCircle2 : Info;
  const ok = () => close(current.kind === "prompt" ? value.trim() : true);

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && current.kind !== "prompt" && close(current.kind === "alert" ? true : false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`app-dialog-${current.id}`}
        className="w-full max-w-[400px] rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] animate-enter-scale"
        style={{ fontFamily: "inherit" }}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              current.tone === "danger" ? "bg-red-50 text-red-600" : current.tone === "success" ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p id={`app-dialog-${current.id}`} className="text-[15px] font-semibold leading-snug">
              {current.title || (current.kind === "confirm" ? "Are you sure?" : current.kind === "prompt" ? "One more thing" : current.tone === "danger" ? "Something needs fixing" : "Note")}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-neutral-600">{current.message}</p>
            {current.kind === "prompt" && (
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={current.placeholder}
                className="mt-3 w-full resize-none rounded-lg border border-neutral-300 p-2.5 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {current.kind !== "alert" && (
            <button type="button" onClick={() => close(current.kind === "prompt" ? null : false)} className="h-10 rounded-xl border border-neutral-300 px-4 text-sm font-semibold hover:border-black">
              {current.cancelLabel}
            </button>
          )}
          <button
            ref={okRef}
            type="button"
            onClick={ok}
            disabled={current.kind === "prompt" && !value.trim()}
            className={`h-10 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-40 ${current.tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-neutral-950 hover:bg-black"}`}
          >
            {current.okLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
