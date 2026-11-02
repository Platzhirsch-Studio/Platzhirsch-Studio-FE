"use client";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import VariantImage from "./VariantImage";
import { focusRing } from "./client";

// Full-screen view of a rendering with zoom (buttons, wheel, pinch, keys
// +/-/0) and pan (drag, arrow keys). Native <dialog>: focus trap from the
// browser. Lifecycle: the parent mounts this component only while a variant
// is shown; it opens itself once on mount and reports every native close
// (Esc, close button, form) through onClose, so the parent state can never
// stay "open" while the dialog is closed (QA Runde 1, P2-5).

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export default function Lightbox({ variant, onClose }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // Only a close that really happened (Esc, close button, form) reaches the
    // parent. The cleanup must NOT call d.close(): under reactStrictMode the
    // effect runs mount -> cleanup -> mount, and the asynchronously dispatched
    // "close" event of a cleanup close() reached the re-registered listener,
    // so the parent unmounted the viewer right after opening it (QA R2, N1).
    // On a real unmount React removes the <dialog> from the document, which
    // also takes it out of the top layer - no close() needed.
    const handleClose = () => {
      if (!d.open && d.isConnected) onCloseRef.current?.();
    };
    const handleCancel = (e) => {
      // Esc: close through the parent state, not only natively.
      e.preventDefault();
      d.close();
    };
    d.addEventListener("close", handleClose);
    d.addEventListener("cancel", handleCancel);
    if (!d.open) d.showModal();
    return () => {
      d.removeEventListener("close", handleClose);
      d.removeEventListener("cancel", handleCancel);
    };
  }, []);

  const zoom = (f) => setView((v) => ({ ...v, z: clamp(v.z * f, 1, 5), ...(v.z * f <= 1 ? { x: 0, y: 0 } : {}) }));
  const pan = (dx, dy) => setView((v) => (v.z <= 1 ? v : { ...v, x: v.x + dx, y: v.y + dy }));

  const onKey = (e) => {
    const step = 60;
    const map = {
      "+": () => zoom(1.25),
      "=": () => zoom(1.25),
      "-": () => zoom(0.8),
      0: () => setView({ z: 1, x: 0, y: 0 }),
      ArrowLeft: () => pan(step, 0),
      ArrowRight: () => pan(-step, 0),
      ArrowUp: () => pan(0, step),
      ArrowDown: () => pan(0, -step),
    };
    if (map[e.key] && !(e.target instanceof HTMLButtonElement && (e.key === "Enter" || e.key === " "))) {
      e.preventDefault();
      map[e.key]();
    }
  };

  return (
    <dialog
      ref={ref}
      onKeyDown={onKey}
      aria-label={`${variant?.title || "Planung"} – Vollbild`}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink-deep p-0 text-white backdrop:bg-black/80"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5">
          <p className="min-w-0 truncate text-sm">
            {variant?.letter && <span className="mr-2 font-semibold text-gold">Variante {variant.letter}</span>}
            {variant?.title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => zoom(0.8)} className={`flex size-11 items-center justify-center hover:bg-white/10 ${focusRing}`} aria-label="Verkleinern">
              <Minus size={18} aria-hidden="true" />
            </button>
            <span className="w-12 text-center text-xs tabular-nums" aria-live="polite">
              {Math.round(view.z * 100)} %
            </span>
            <button type="button" onClick={() => zoom(1.25)} className={`flex size-11 items-center justify-center hover:bg-white/10 ${focusRing}`} aria-label="Vergrößern">
              <Plus size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setView({ z: 1, x: 0, y: 0 })} className={`flex size-11 items-center justify-center hover:bg-white/10 ${focusRing}`} aria-label="Ansicht zurücksetzen">
              <RotateCcw size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => ref.current?.close()} className={`flex size-11 items-center justify-center hover:bg-white/10 ${focusRing}`} aria-label="Vollbild schließen">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          className="relative flex-1 touch-none overflow-hidden"
          onWheel={(e) => zoom(e.deltaY < 0 ? 1.1 : 0.9)}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          }}
          onPointerMove={(e) => {
            const prev = pointers.current.get(e.pointerId);
            if (!prev) return;
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            const pts = [...pointers.current.values()];
            if (pts.length === 2) {
              const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
              if (pinch.current) zoom(d / pinch.current);
              pinch.current = d;
            } else {
              pan(e.clientX - prev.x, e.clientY - prev.y);
            }
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            pinch.current = null;
          }}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            pinch.current = null;
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "center" }}
          >
            <div className="aspect-16/10 w-full max-h-full max-w-[calc((100dvh-60px)*1.6)]">{variant && <VariantImage variant={variant} priority />}</div>
          </div>
        </div>
        <p className="px-4 pb-3 text-center text-xs text-white/70">Ziehen zum Verschieben · Zwei Finger oder Mausrad zum Zoomen · Tasten + / − / 0 und Pfeiltasten</p>
      </div>
    </dialog>
  );
}
