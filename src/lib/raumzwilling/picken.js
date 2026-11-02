// src/lib/raumzwilling/picken.js — Punkt im Splat unter einem Sehstrahl (rein).
// Trainierte Splats bestehen zu großen Teilen aus halbtransparenten Gaussians
// (im Testlauf 88 % unter 13 % Deckkraft). Deshalb nicht „erster deckender
// Splat“, sondern wie beim Rendern: entlang des Strahls die Deckkraft
// aufsummieren, bis die Fläche zu `deckung` (Standard 50 %) sichtbar ist.
// Genutzt vom Team-Werkzeug (SplatSzene.picke) und von pruefe-massstab.mjs.

/**
 * @param {{anzahl:number, positionen:Float32Array, skalen:Float32Array, farben:Uint8Array}} s  Modell-Koordinaten
 * @param {number[]} o  Strahl-Ursprung (Modell)
 * @param {number[]} d  Richtung (normiert, Modell)
 * @returns {{ index:number, t:number, punkt:number[] } | null}
 */
export function pickeStrahl(s, o, d, { kegel = 0.008, deckung = 0.5 } = {}) {
  const kandidaten = [];
  for (let i = 0; i < s.anzahl; i++) {
    const a0 = s.farben[i * 4 + 3] / 255;
    if (a0 < 0.02) continue;
    const vx = s.positionen[i * 3] - o[0];
    const vy = s.positionen[i * 3 + 1] - o[1];
    const vz = s.positionen[i * 3 + 2] - o[2];
    const t = vx * d[0] + vy * d[1] + vz * d[2];
    if (t <= 0) continue;
    const qx = vx - d[0] * t;
    const qy = vy - d[1] * t;
    const qz = vz - d[2] * t;
    const quer2 = qx * qx + qy * qy + qz * qz;
    const sigma = Math.max(s.skalen[i * 3], s.skalen[i * 3 + 1], s.skalen[i * 3 + 2], (kegel * t) / 2);
    if (quer2 > 9 * sigma * sigma) continue;
    const a = a0 * Math.exp((-0.5 * quer2) / (sigma * sigma));
    if (a > 0.01) kandidaten.push([t, a, i]);
  }
  if (!kandidaten.length) return null;
  kandidaten.sort((x, y) => x[0] - y[0]);
  let durch = 1;
  for (const [t, a, i] of kandidaten) {
    durch *= 1 - Math.min(0.99, a);
    if (1 - durch >= deckung) return { index: i, t, punkt: [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t] };
  }
  return null;
}
