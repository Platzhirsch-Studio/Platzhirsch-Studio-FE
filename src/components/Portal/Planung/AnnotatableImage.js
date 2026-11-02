"use client";
import { useEffect, useRef } from "react";
import VariantImage from "./VariantImage";
import { focusRing } from "./client";

// Rendering with numbered pins. In "annotating" mode a tap/click sets the
// pending pin; the pending pin can be moved with the arrow keys
// (Shift = bigger steps), so the feature works without a pointer.

export default function AnnotatableImage({ variant, pins, annotating, pending, onPending, selectedId, onSelect }) {
  const box = useRef(null);
  const pendingRef = useRef(null);

  useEffect(() => {
    if (pending) pendingRef.current?.focus({ preventScroll: true });
  }, [pending]);

  const place = (e) => {
    const r = box.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    onPending({ x: Math.round(Math.min(98, Math.max(2, x)) * 10) / 10, y: Math.round(Math.min(97, Math.max(3, y)) * 10) / 10 });
  };

  const nudge = (e) => {
    const step = e.shiftKey ? 5 : 1;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    onPending({ x: Math.min(98, Math.max(2, pending.x + d[0])), y: Math.min(97, Math.max(3, pending.y + d[1])) });
  };

  return (
    <div ref={box} className={`relative aspect-16/10 overflow-hidden bg-stone ${annotating ? "cursor-crosshair" : ""}`}>
      <VariantImage variant={variant} priority />
      {annotating && (
        <div className="absolute inset-0 bg-ink/10" onClick={place} aria-hidden="true">
          {!pending && (
            <p className="pointer-events-none absolute inset-x-3 bottom-3 bg-white/95 px-3 py-2 text-center text-sm text-ink shadow">
              Tippen Sie auf die Stelle, die Sie kommentieren möchten.
            </p>
          )}
        </div>
      )}
      {pins.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id === selectedId ? null : p.id)}
          aria-pressed={p.id === selectedId}
          aria-label={`Markierung ${p.n}: ${p.body}`}
          className={`absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${focusRing} ${p.id === selectedId ? "z-10" : ""}`}
          style={{ left: `${p.point.x}%`, top: `${p.point.y}%` }}
        >
          {/* 44 px hit area, 32 px visible pin */}
          <span
            aria-hidden="true"
            className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-md ${
              p.id === selectedId ? "bg-gold text-ink-deep" : p.from === "studio" ? "bg-walnut text-white" : "bg-ink text-white"
            }`}
          >
            {p.n}
          </span>
        </button>
      ))}
      {pending && (
        <button
          ref={pendingRef}
          type="button"
          onKeyDown={nudge}
          aria-label={`Neue Markierung bei ${Math.round(pending.x)} % horizontal, ${Math.round(pending.y)} % vertikal. Mit Pfeiltasten verschieben.`}
          className={`absolute z-20 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-gold text-sm font-bold text-ink-deep shadow-lg ring-4 ring-gold/40 ${focusRing}`}
          style={{ left: `${pending.x}%`, top: `${pending.y}%` }}
        >
          +
        </button>
      )}
    </div>
  );
}
