"use client";
import { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import VariantImage from "./VariantImage";

// Before/after slider: drag (mouse/touch/pen) anywhere on the image, or use
// the range input (keyboard: arrows, Home/End, PageUp/Down).

export default function BeforeAfter({ before, after }) {
  const [pos, setPos] = useState(50);
  const box = useRef(null);
  const dragging = useRef(false);

  const fromEvent = (e) => {
    const r = box.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <div>
      <div
        ref={box}
        className="relative aspect-16/10 touch-pan-y select-none overflow-hidden bg-stone"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromEvent(e);
        }}
        onPointerMove={(e) => dragging.current && fromEvent(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <div className="absolute inset-0">
          <VariantImage variant={after.variant} scene={after.scene} />
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <VariantImage variant={before.variant} scene={before.scene} className="grayscale-[35%]" />
        </div>
        <span className="pointer-events-none absolute left-3 top-3 bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink">Vorher</span>
        <span className="pointer-events-none absolute right-3 top-3 bg-ink/85 px-2.5 py-1 text-xs font-semibold text-white">Nachher</span>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white text-ink shadow-md">
            <MoveHorizontal size={20} aria-hidden="true" />
          </span>
        </div>
      </div>
      <label className="mt-3 block text-sm text-ink/80">
        <span className="sr-only">Vorher-Nachher-Regler</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-valuetext={`${Math.round(pos)} Prozent Vorher sichtbar`}
          className="h-11 w-full accent-gold-text"
        />
      </label>
      <p className="text-xs text-ink/75">
        Vorher: {before.label} · Nachher: {after.label}
      </p>
    </div>
  );
}
