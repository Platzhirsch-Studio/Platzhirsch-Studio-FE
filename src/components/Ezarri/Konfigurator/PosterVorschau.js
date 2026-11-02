"use client";
// Ezarri-Konfigurator – schräge Vorschau ohne 3D (QM R2 P2-1): das Poster der 3D-Szene,
// eingefärbt mit der aktuellen Palette. Statt der flachen Draufsicht sieht man nach jeder
// Änderung ein Szenenbild, solange 3D lädt oder nicht läuft (kein WebGL, „Daten sparen“,
// reduzierte Bewegung).
//
// Verfahren: tools/poster.mjs rendert die Startszene zweimal, Mosaik schwarz (Basis) und
// weiß; gespeichert sind Basis und Differenz (Gain). Je Pixel gilt näherungsweise
// Ergebnis = Basis + Gain × Farbe (sRGB), weil der Renderer im Albedo linear ist und die
// sRGB-Kodierung der Farbe dem Gamma der Ausgabe entspricht. Die Steine sind als Raster
// angedeutet, das nach oben (Ferne) feiner wird. Gilt nur, solange Szene, Becken, Licht,
// Wasser und Kamera dem Startentwurf entsprechen (posterPasst()); sonst zeigt die Bühne
// weiter die 2D-Draufsicht.
import { useEffect, useRef, useState } from "react";
import { decodeState } from "@/lib/ezarri/konfigurator/state";

const GEO_FELDER = ["szene", "becken", "wasser", "zeit", "led", "wasserton", "kamera"];

/** Passt die Szene des Posters (Geometrie, Licht, Kamera) zum Zustand? Farben dürfen abweichen. */
export function posterPasst(state, poster) {
  if (!poster?.basis || !state) return false;
  const p = decodeState(poster.k);
  if (!p) return false;
  if (state.kanaele?.length || state.modus === "pattern") return false;
  return GEO_FELDER.every((f) => JSON.stringify(state[f]) === JSON.stringify(p[f]));
}

const cache = new Map();
function laden(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }),
    );
  }
  return cache.get(src);
}
function pixel(img, w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

const hex3 = (hex) => {
  const n = Number.parseInt(String(hex || "#888888").replace("#", "").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Gewichtete Farbliste aus Mischung (Anteil) und Ezarri-Palette je Mosaik. */
export function palette(state, index) {
  const out = [];
  for (const e of state.mix || []) {
    const ref = index?.resolveRef?.(e.id, state.format, { ref: e.ref });
    const pal = ref?.pal?.length ? ref.pal : [["#9fb4b8", 100]];
    const sum = pal.reduce((s, p) => s + p[1], 0) || 1;
    for (const [hex, w] of pal.slice(0, 6)) out.push({ rgb: hex3(hex), w: ((e.anteil || 0) / 100) * (w / sum) });
  }
  const total = out.reduce((s, x) => s + x.w, 0) || 1;
  let acc = 0;
  return out.map((x) => ({ rgb: x.rgb, bis: (acc += x.w / total) }));
}

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export default function PosterVorschau({ state, index, poster, className = "" }) {
  const ref = useRef(null);
  const [bereit, setBereit] = useState(false);
  const pal = palette(state, index);
  const palKey = JSON.stringify(pal) + state.fuge + state.seed;
  const fuge = hex3(index?.fuge?.(state.fuge)?.hex || "#ededed");

  useEffect(() => {
    let aus = false;
    const w = poster.maskeBreite;
    const h = poster.maskeHoehe;
    Promise.all([laden(poster.basis), laden(poster.gain)])
      .then(([b, g]) => {
        if (aus || !ref.current) return;
        const B = pixel(b, w, h);
        const G = pixel(g, w, h);
        const c = ref.current;
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        const out = ctx.createImageData(w, h);
        const o = out.data;
        const seed = state.seed || 7;
        for (let y = 0; y < h; y++) {
          // Steinraster: oben (Ferne) 2 px, unten 5 px
          const s = y < h * 0.4 ? 2 : y < h * 0.6 ? 3 : y < h * 0.8 ? 4 : 5;
          const sy = Math.floor(y / s) + s * 1000;
          const fy = y % s === 0;
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = hash(Math.floor(x / s) + seed * 131, sy);
            let col = pal[pal.length - 1].rgb;
            for (const p of pal)
              if (r < p.bis) {
                col = p.rgb;
                break;
              }
            const f = fy || x % s === 0 ? 0.5 : 0.04; // Fuge andeuten
            const j = 1 + (hash(sy, x + seed) - 0.5) * 0.08;
            for (let k = 0; k < 3; k++) {
              const cv = ((col[k] * (1 - f) + fuge[k] * f) * j) / 255;
              o[i + k] = B[i + k] + G[i + k] * cv;
            }
            o[i + 3] = 255;
          }
        }
        ctx.putImageData(out, 0, 0);
        setBereit(true);
      })
      .catch((e) => console.warn("PosterVorschau:", e?.message || e));
    return () => {
      aus = true;
    };
    // palKey fasst Palette, Fuge und Startwert zusammen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palKey, poster]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-ezk-vorschau={bereit ? "1" : "0"}
      className={`absolute inset-0 size-full object-cover transition-opacity duration-(--duration-swap) ease-quiet motion-reduce:transition-none ${bereit ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
