"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Crop, Minus, Plus, RotateCw } from "lucide-react";

/**
 * Crop a photo before it is uploaded: drag to position it, zoom, pick a shape.
 *   const file = await cropImage(picked, { aspect: 16 / 9 })   // null when cancelled
 */

export const CROP_SHAPES = [
  { id: "original", label: "Original", ratio: 0 },
  { id: "square", label: "Square", ratio: 1 },
  { id: "portrait", label: "4:5", ratio: 4 / 5 },
  { id: "landscape", label: "3:2", ratio: 3 / 2 },
  { id: "wide", label: "16:9", ratio: 16 / 9 },
  { id: "banner", label: "Banner 3:1", ratio: 3 },
] as const;

type Req = { id: number; file: File; aspect?: number; resolve: (f: File | null) => void };
let push: ((r: Req) => void) | null = null;
let n = 1;

export function cropImage(file: File, opts: { aspect?: number } = {}): Promise<File | null> {
  // GIFs and SVGs aren't cropped (it would flatten them)
  if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/i.test(file.type)) return Promise.resolve(file);
  return new Promise((resolve) => {
    if (!push) return resolve(file);
    push({ id: n++, file, aspect: opts.aspect, resolve });
  });
}

export function ImageCropperHost() {
  const [req, setReq] = React.useState<Req | null>(null);
  React.useEffect(() => {
    push = (r) => setReq(r);
    return () => {
      push = null;
    };
  }, []);
  if (!req) return null;
  return createPortal(
    <Cropper
      key={req.id}
      file={req.file}
      aspect={req.aspect}
      onDone={(f) => {
        req.resolve(f);
        setReq(null);
      }}
    />,
    document.body
  );
}

function Cropper({ file, aspect, onDone }: { file: File; aspect?: number; onDone: (f: File | null) => void }) {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  const [url, setUrl] = React.useState("");
  const [ratio, setRatio] = React.useState<number>(aspect || 0);
  const [zoom, setZoom] = React.useState(1);
  const [rotate, setRotate] = React.useState(0);
  const [pos, setPos] = React.useState({ x: 0, y: 0 }); // offset of the photo's centre from the frame's centre, in frame px
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = React.useState(480);
  const drag = React.useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // the preview link is made and freed by the same effect, so it stays valid however often it runs
  React.useEffect(() => {
    const u = URL.createObjectURL(file);
    let live = true;
    const i = new Image();
    i.onload = () => {
      if (!live) return;
      setUrl(u);
      setImg(i);
      setError("");
    };
    i.onerror = () => live && setError("This photo couldn't be opened. Try a JPG or PNG.");
    i.src = u;
    return () => {
      live = false;
      URL.revokeObjectURL(u);
    };
  }, [file]);

  React.useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.clientWidth));
    ro.observe(el);
    setStageW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const turned = rotate % 180 !== 0;
  const natW = img ? (turned ? img.naturalHeight : img.naturalWidth) : 1;
  const natH = img ? (turned ? img.naturalWidth : img.naturalHeight) : 1;
  const r = ratio || natW / natH;
  const maxH = 380;
  let frameW = stageW;
  let frameH = frameW / r;
  if (frameH > maxH) {
    frameH = maxH;
    frameW = frameH * r;
  }
  // the photo covers the frame at zoom 1
  const cover = Math.max(frameW / natW, frameH / natH);
  const scale = cover * zoom;
  const shownW = natW * scale;
  const shownH = natH * scale;
  const limitX = Math.max(0, (shownW - frameW) / 2);
  const limitY = Math.max(0, (shownH - frameH) / 2);
  const clampPos = (p: { x: number; y: number }) => ({ x: Math.min(limitX, Math.max(-limitX, p.x)), y: Math.min(limitY, Math.max(-limitY, p.y)) });
  const at = clampPos(pos);

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: at.x, py: at.y };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos(clampPos({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y }));
  };
  const onUp = () => (drag.current = null);

  const save = async () => {
    if (!img) return;
    setBusy(true);
    try {
      // the frame in the (rotated) photo's own pixels
      const sx = (shownW / 2 - frameW / 2 - at.x) / scale;
      const sy = (shownH / 2 - frameH / 2 - at.y) / scale;
      const sw = frameW / scale;
      const sh = frameH / scale;
      const max = 2400;
      const k = Math.min(1, max / Math.max(sw, sh));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw * k);
      canvas.height = Math.round(sh * k);
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.scale(k, k);
      ctx.translate(-sx, -sy);
      // draw the photo rotated about the rotated photo's centre
      ctx.translate(natW / 2, natH / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.9));
      if (!blob) throw new Error("no blob");
      const name = file.name.replace(/\.[a-z0-9]+$/i, "") + (type === "image/png" ? ".png" : ".jpg");
      onDone(new File([blob], name, { type }));
    } catch {
      setError("Couldn't crop this photo. Use it as it is, or try another.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className="w-full max-w-[560px] rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-5 font-[Inter,sans-serif] text-neutral-900">
        <div className="flex items-center gap-2">
          <Crop className="h-4 w-4" />
          <p className="text-[15px] font-semibold">Crop photo</p>
          <span className="ml-auto text-xs text-neutral-500">Drag to move · zoom to fit</span>
        </div>

        <div ref={stageRef} className="mt-4 flex h-[380px] w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-900">
          {img && (
            <div
              className="relative cursor-grab touch-none overflow-hidden active:cursor-grabbing"
              style={{ width: frameW, height: frameH, boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: (turned ? shownH : shownW),
                  height: (turned ? shownW : shownH),
                  transform: `translate(calc(-50% + ${at.x}px), calc(-50% + ${at.y}px)) rotate(${rotate}deg)`,
                }}
              />
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
          )}
          {!img && !error && <span className="text-sm text-white/70">Opening photo…</span>}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))} className="rounded-lg border border-neutral-200 p-2 hover:border-black" aria-label="Zoom out">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-black" aria-label="Zoom" style={{ minHeight: 0 }} />
          <button type="button" onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))} className="rounded-lg border border-neutral-200 p-2 hover:border-black" aria-label="Zoom in">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => (setRotate((d) => (d + 90) % 360), setPos({ x: 0, y: 0 }))} className="rounded-lg border border-neutral-200 p-2 hover:border-black" aria-label="Rotate">
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {CROP_SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => (setRatio(s.ratio), setPos({ x: 0, y: 0 }))}
              className={`h-8 rounded-full border px-3 text-xs font-semibold ${Math.abs(ratio - s.ratio) < 0.001 ? "border-black bg-black text-white" : "border-neutral-200 hover:border-black"}`}
            >
              {s.label}
              {aspect && Math.abs(aspect - s.ratio) < 0.001 ? " · best fit" : ""}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => onDone(null)} className="h-10 rounded-xl px-4 text-sm font-semibold text-neutral-600 hover:text-black">
            Cancel
          </button>
          <button type="button" onClick={() => onDone(file)} className="h-10 rounded-xl border border-neutral-300 px-4 text-sm font-semibold hover:border-black">
            Use as it is
          </button>
          <button type="button" disabled={!img || busy} onClick={save} className="h-10 rounded-xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-40">
            {busy ? "Cropping…" : "Crop & use"}
          </button>
        </div>
      </div>
    </div>
  );
}
