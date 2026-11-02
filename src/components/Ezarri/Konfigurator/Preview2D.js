"use client";
// Ezarri-Konfigurator – 2D-Vorschau (Canvas 2D): Draufsicht bzw. Wandansicht und
// Nahansicht des Mosaiks. Läuft ohne WebGL, ist Platzhalter bis 3D geladen ist
// und Rückfall bei Kontextverlust. Gerechnet wird mit preview2d.js (wie Team C).
import { useEffect, useRef } from "react";
import { useKonfCopy } from "./useKonfCopy";
import { drawMosaic, drawPlan } from "@/lib/ezarri/konfigurator/preview2d";
import { treppeFuerForm } from "@/lib/ezarri/konfigurator/geometry";

// Legende zur Treppe in der Draufsicht (QM R1/R2 P3)
const TREPPE_LEGENDE = { roemisch: "Halbkreise links: römische Treppe", eck: "Viertelkreis links: Ecktreppe", voll: "Streifen links: Treppe über die ganze Breite" };
const TREPPE_LEGENDE_EN = { roemisch: "Semicircles on the left: Roman steps", eck: "Quarter circle on the left: corner steps", voll: "Band on the left: steps across the full width" };

/** Interne Auflösung: höchstens 720 px breit (Rechenzeit), CSS skaliert. */
const MAX_W = 720;

export default function Preview2D({ state, index, vorher = null, split = 0.5, showSwatch = true, className = "" }) {
  const { en, t, X } = useKonfCopy();
  const legende = X?.treppeLegende ?? (en ? TREPPE_LEGENDE_EN : TREPPE_LEGENDE);
  const planRef = useRef(null);
  const swatchRef = useRef(null);
  const job = useRef(0);

  useEffect(() => {
    const canvas = planRef.current;
    if (!canvas) return undefined;
    const id = ++job.current;
    const run = () => {
      if (id !== job.current) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(160, Math.min(MAX_W, Math.round(rect.width * dpr)));
      const h = Math.max(120, Math.round((w * rect.height) / Math.max(1, rect.width)));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      try {
        drawPlan(ctx, { state, index, width: w, height: h, vorher, split });
      } catch {
        // Daten noch unvollständig (Teilkatalog) – nächster Lauf zeichnet
      }
    };
    const t = setTimeout(() => requestAnimationFrame(run), 60);
    return () => clearTimeout(t);
  }, [state, index, vorher, split]);

  useEffect(() => {
    const c = swatchRef.current;
    if (!c || !showSwatch) return;
    const w = 168;
    const h = 168;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    try {
      // trocken, wie das Muster auf dem Tisch
      drawMosaic(ctx, { state, index, width: w, height: h, stonePx: state.format === "50" ? 26 : 14, wasser: null });
    } catch {
      /* Teilkatalog */
    }
  }, [state, index, showSwatch]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <canvas ref={planRef} className="block h-full w-full" aria-hidden="true" />
      {state.szene === "pool" && !vorher && legende[treppeFuerForm(state.becken)] && (
        <p className="pointer-events-none absolute bottom-3 left-3 hidden bg-paper/90 px-2 py-1 text-small text-text sm:block" aria-hidden="true" data-ezk-legende="">
          {legende[treppeFuerForm(state.becken)]}, {t("flaches Ende", "shallow end")}
        </p>
      )}
      {showSwatch && (
        <figure className="pointer-events-none absolute bottom-3 right-3 m-0 hidden w-24 border border-paper bg-paper sm:block md:w-28" aria-hidden="true">
          <canvas ref={swatchRef} className="block aspect-square w-full" />
          <figcaption className="px-1.5 py-1 text-[0.75rem] leading-tight text-text-soft">{t("Nahansicht", "Close-up")}</figcaption>
        </figure>
      )}
    </div>
  );
}
