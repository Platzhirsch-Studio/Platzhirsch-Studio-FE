"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MoveHorizontal } from "lucide-react";
import TagebuchBild from "./TagebuchBild";
import { tagebuchT } from "./texte";

// Vorher/Nachher mit Schieberegler: Ziehen (Maus, Touch, Stift) oder der
// Bereichsregler darunter (Pfeile, Pos1/Ende, Bild auf/ab). Bildpaare nach
// Reihenfolge (1. Vorher ↔ 1. Nachher …). Basis: Planung/BeforeAfter.js.

export default function VorherNachher({ projektId, vorher = [], nachher = [], urlArt = "privat", freigabeId = "" }) {
  const s = tagebuchT(useTranslations());
  const [pos, setPos] = useState(50);
  const [paar, setPaar] = useState(0);
  const box = useRef(null);
  const dragging = useRef(false);
  const anzahl = Math.min(vorher.length, nachher.length);
  if (anzahl === 0) return <p className="bg-bone px-4 py-3 text-sm text-ink/75">{s("beforeAfterEmpty")}</p>;
  const v = vorher[Math.min(paar, anzahl - 1)];
  const n = nachher[Math.min(paar, anzahl - 1)];
  const url = (fotoId) => (datei) =>
    urlArt === "referenz" ? `/api/portal/tagebuch/referenz/${freigabeId}/${fotoId}-${datei}` : `/api/portal/tagebuch/${encodeURIComponent(projektId)}/bild/${fotoId}-${datei}`;

  const fromEvent = (e) => {
    const r = box.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <div>
      {anzahl > 1 && (
        <div className="mb-3">
          <label htmlFor="tb-paar" className="mb-1 block text-sm font-semibold text-ink">
            {s("beforeAfterPick")}
          </label>
          <select id="tb-paar" value={paar} onChange={(e) => setPaar(Number(e.target.value))} className="min-h-11 border border-pebble bg-white px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            {Array.from({ length: anzahl }, (_, i) => (
              <option key={i} value={i}>
                {i + 1}: {nachher[i].titel || s("phase_nachher")}
              </option>
            ))}
          </select>
        </div>
      )}
      <div
        ref={box}
        className="relative touch-pan-y select-none overflow-hidden bg-stone"
        style={{ aspectRatio: `${n.breite} / ${n.hoehe}` }}
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
          <TagebuchBild foto={n} url={url(n.id)} alt={`${s("phase_nachher")}: ${n.titel || ""}`} sizes="(min-width: 1024px) 900px, 100vw" fill />
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <TagebuchBild foto={v} url={url(v.id)} alt={`${s("phase_vorher")}: ${v.titel || ""}`} sizes="(min-width: 1024px) 900px, 100vw" fill />
        </div>
        <span className="pointer-events-none absolute top-3 left-3 bg-white px-2.5 py-1 text-xs font-semibold text-ink">{s("phase_vorher")}</span>
        <span className="pointer-events-none absolute top-3 right-3 bg-ink px-2.5 py-1 text-xs font-semibold text-white">{s("phase_nachher")}</span>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-ink/20 bg-white text-ink">
            <MoveHorizontal size={20} aria-hidden="true" />
          </span>
        </div>
      </div>
      <label className="mt-3 block text-sm text-ink/80">
        <span className="sr-only">{s("beforeAfterSlider")}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-valuetext={s("beforeAfterValue", { wert: Math.round(pos) })}
          className="h-11 w-full accent-ink"
        />
      </label>
    </div>
  );
}
