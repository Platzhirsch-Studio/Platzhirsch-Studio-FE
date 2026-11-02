"use client";
// Zoom für die Herstellerfotos (QA R1 P3 / R2 P2-4: Pinch-Zoom).
// Das Bild selbst bleibt unverändert (Minotti-Regel: keine Veränderung) – vergrößert
// wird nur die Ansicht, wie beim Heranzoomen im Browser.
//   Touch: zwei Finger ziehen auf/zu, ein Finger verschiebt (nur vergrößert), Doppeltipp 1× ↔ 2,5×.
//   Maus: Doppelklick, Mausrad, Ziehen. Tastatur: + / − / 0, Pfeile wechseln das Bild (1×)
//   bzw. verschieben (vergrößert). Knöpfe für alles, ohne Geste bedienbar (WCAG 2.5.7).
// Modal nach Design-Bibel §6/§9: natives <dialog>, Esc schließt, Fokus kehrt zurück.
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { clampPan, zoomAt, ZOOM_MAX as MAX, ZOOM_MIN as MIN } from "@/lib/arviewer/zoom";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const STEP = 1.5;
const BTN = `grid h-11 w-11 place-items-center border border-line-strong bg-paper text-text hover:border-ink disabled:opacity-40 ${FOCUS}`;

export default function FotoZoom({ open, onClose, images, index, onIndex, alt, reducedMotion = false }) {
  const ref = useRef(null);
  const areaRef = useRef(null);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const [active, setActive] = useState(false);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef(0);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  // Bildwechsel oder neues Öffnen → zurück auf 1× (Zustand beim Rendern anpassen, kein Effekt)
  const viewKey = `${index}-${open}`;
  const [seenKey, setSeenKey] = useState(viewKey);
  if (seenKey !== viewKey) {
    setSeenKey(viewKey);
    setView({ s: 1, x: 0, y: 0 });
  }

  const size = () => {
    const r = areaRef.current?.getBoundingClientRect();
    return r ? { w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 } : { w: 1, h: 1, cx: 0, cy: 0 };
  };
  const zoomTo = useCallback((s, clientX, clientY) => {
    const { w, h, cx, cy } = size();
    const px = clientX == null ? 0 : clientX - cx;
    const py = clientY == null ? 0 : clientY - cy;
    setView((v) => zoomAt(v, s, px, py, w, h));
  }, []);

  const go = useCallback(
    (d) => {
      const n = index + d;
      if (n >= 0 && n < images.length) onIndex(n);
    },
    [index, images.length, onIndex]
  );

  const onPointerDown = (e) => {
    areaRef.current?.setPointerCapture?.(e.pointerId);
    setActive(true);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const [a, b] = pts;
      gesture.current = { kind: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: viewRef.current.s, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, v: viewRef.current };
    } else if (pts.length === 1) {
      gesture.current = { kind: "pan", x: e.clientX, y: e.clientY, v: viewRef.current, moved: false };
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const { w, h, cx, cy } = size();
    if (g.kind === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setView(zoomAt(g.v, (g.s * d) / g.d, g.mx - cx, g.my - cy, w, h));
    } else if (g.kind === "pan") {
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) g.moved = true;
      if (g.v.s > 1) setView({ s: g.v.s, ...clampPan(g.v.s, g.v.x + dx, g.v.y + dy, w, h) });
    }
  };
  const onPointerUp = (e) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (g?.kind === "pan" && pointers.current.size === 0) {
      const dx = e.clientX - g.x;
      // Wischen bei 1×: Bild wechseln
      if (g.v.s === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - g.y)) go(dx < 0 ? 1 : -1);
      else if (!g.moved && e.pointerType !== "mouse") {
        const now = Date.now();
        if (now - lastTap.current < 320) {
          zoomTo(viewRef.current.s > 1 ? 1 : 2.5, e.clientX, e.clientY);
          lastTap.current = 0;
        } else lastTap.current = now;
      }
    }
    gesture.current = pointers.current.size ? gesture.current : null;
    if (!pointers.current.size) setActive(false);
    if (pointers.current.size === 1 && g?.kind === "pinch") {
      const [p] = [...pointers.current.values()];
      gesture.current = { kind: "pan", x: p.x, y: p.y, v: viewRef.current, moved: true };
    }
  };
  const onWheel = (e) => {
    zoomTo(viewRef.current.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  };
  // Mausrad nicht an die Seite durchreichen (passive: false nur hier nötig)
  useEffect(() => {
    const el = areaRef.current;
    if (!el || !open) return undefined;
    const stop = (e) => e.preventDefault();
    el.addEventListener("wheel", stop, { passive: false });
    return () => el.removeEventListener("wheel", stop);
  }, [open]);

  const onKeyDown = (e) => {
    const v = viewRef.current;
    if (e.key === "+" || e.key === "=") zoomTo(v.s * STEP);
    else if (e.key === "-") zoomTo(v.s / STEP);
    else if (e.key === "0") setView({ s: 1, x: 0, y: 0 });
    else if (e.key.startsWith("Arrow") && v.s > 1) {
      const { w, h } = size();
      const d = 60;
      const dx = e.key === "ArrowLeft" ? d : e.key === "ArrowRight" ? -d : 0;
      const dy = e.key === "ArrowUp" ? d : e.key === "ArrowDown" ? -d : 0;
      setView({ s: v.s, ...clampPan(v.s, v.x + dx, v.y + dy, w, h) });
    } else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else return;
    e.preventDefault();
  };

  const src = images[index];
  const pct = Math.round(view.s * 100);

  return (
    <dialog
      ref={ref}
      aria-label={`Bild vergrößert: ${alt}`}
      onClose={onClose}
      onKeyDown={onKeyDown}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-paper p-0 text-text backdrop:bg-ink-deep/70"
      data-testid="arv-zoom"
    >
      {open && src && (
        <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <p className="min-w-0 truncate text-small text-text-soft">
              <span className="tabular-nums">
                Bild {index + 1} von {images.length}
              </span>
              <span className="hidden sm:inline"> · Herstellerfoto, unverändert</span>
            </p>
            <button type="button" onClick={onClose} className={`${BTN} border-transparent`} aria-label="Vergrößerung schließen">
              <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </button>
          </div>

          <div
            ref={areaRef}
            className={`relative touch-none select-none overflow-hidden ${view.s > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            onDoubleClick={(e) => zoomTo(viewRef.current.s > 1 ? 1 : 2.5, e.clientX, e.clientY)}
            data-testid="arv-zoom-flaeche"
            data-scale={view.s.toFixed(2)}
          >
            <div
              className={`absolute inset-0 ${reducedMotion || active ? "" : "transition-transform duration-150 ease-out"}`}
              style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})` }}
            >
              <Image src={src} alt={`${alt}, Bild ${index + 1} von ${images.length}`} fill sizes="100vw" quality={90} draggable={false} className="pointer-events-none object-contain p-[3%]" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line px-4 py-2">
            <button type="button" onClick={() => go(-1)} disabled={index === 0} className={BTN} aria-label="Vorheriges Bild">
              <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </button>
            <button type="button" onClick={() => zoomTo(view.s / STEP)} disabled={view.s <= MIN} className={BTN} aria-label="Verkleinern">
              <Minus aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </button>
            <output className="min-w-14 text-center text-small tabular-nums text-text" aria-live="polite" data-testid="arv-zoom-stufe">
              {pct} %
            </output>
            <button type="button" onClick={() => zoomTo(view.s * STEP)} disabled={view.s >= MAX} className={BTN} aria-label="Vergrößern">
              <Plus aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </button>
            <button type="button" onClick={() => setView({ s: 1, x: 0, y: 0 })} disabled={view.s === 1} className={BTN} aria-label="Zurücksetzen">
              <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </button>
            <button type="button" onClick={() => go(1)} disabled={index === images.length - 1} className={BTN} aria-label="Nächstes Bild">
              <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
