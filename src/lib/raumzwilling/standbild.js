// src/lib/raumzwilling/standbild.js
// Kleiner CPU-Renderer für Splats (rein, ohne WebGL). Er erzeugt
//   - die Standbilder des synthetischen Testraums (Demo ohne echte Aufnahme)
//   - Prüfbilder im Job-Runner, wenn kein Browser zur Hand ist.
// Bei echten Aufnahmen kommen die Standbilder aus dem Video selbst
// (tools/raumzwilling/frames.mjs), nicht aus diesem Renderer.
// Näherung: jeder Splat als runde Gauß-Scheibe (Mittel der zwei größten
// Achsen), Rückwärts-Sortierung, Über-Blending.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * @param {{anzahl:number, positionen:Float32Array, skalen:Float32Array, farben:Uint8Array}} s  Welt-Koordinaten
 * @param {{auge:number[], ziel:number[], fovGrad?:number, breite:number, hoehe:number, hintergrund?:number[]}} k
 * @returns {Uint8Array} RGB
 */
export function rendereStandbild(s, k) {
  const { breite: W, hoehe: H } = k;
  const vorne = norm(sub(k.ziel, k.auge));
  const rechts = norm(cross(vorne, [0, 1, 0]));
  const oben = cross(rechts, vorne);
  const f = H / 2 / Math.tan(((k.fovGrad || 60) * Math.PI) / 360);
  const n = s.anzahl;
  const tiefe = new Float32Array(n);
  const reihenfolge = [];
  for (let i = 0; i < n; i++) {
    const p = [s.positionen[i * 3] - k.auge[0], s.positionen[i * 3 + 1] - k.auge[1], s.positionen[i * 3 + 2] - k.auge[2]];
    const zt = dot(p, vorne);
    if (zt < 0.05) continue;
    tiefe[i] = zt;
    reihenfolge.push(i);
  }
  reihenfolge.sort((a, b) => tiefe[b] - tiefe[a]);

  const bg = k.hintergrund || [0.93, 0.92, 0.9];
  const acc = new Float32Array(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    acc[i * 3] = bg[0];
    acc[i * 3 + 1] = bg[1];
    acc[i * 3 + 2] = bg[2];
  }
  for (const i of reihenfolge) {
    const p = [s.positionen[i * 3] - k.auge[0], s.positionen[i * 3 + 1] - k.auge[1], s.positionen[i * 3 + 2] - k.auge[2]];
    const zt = tiefe[i];
    const sx = W / 2 + (dot(p, rechts) * f) / zt;
    const sy = H / 2 - (dot(p, oben) * f) / zt;
    const sc = [s.skalen[i * 3], s.skalen[i * 3 + 1], s.skalen[i * 3 + 2]].sort((a, b) => b - a);
    const sigma = Math.max(0.6, (((sc[0] + sc[1]) / 2) * f) / zt);
    const r = Math.ceil(sigma * 2.5);
    if (sx + r < 0 || sx - r >= W || sy + r < 0 || sy - r >= H) continue;
    const a0 = s.farben[i * 4 + 3] / 255;
    const cr = s.farben[i * 4] / 255;
    const cg = s.farben[i * 4 + 1] / 255;
    const cb = s.farben[i * 4 + 2] / 255;
    const inv = -0.5 / (sigma * sigma);
    const xa = Math.max(0, Math.floor(sx - r));
    const xb = Math.min(W - 1, Math.ceil(sx + r));
    const ya = Math.max(0, Math.floor(sy - r));
    const yb = Math.min(H - 1, Math.ceil(sy + r));
    for (let y = ya; y <= yb; y++) {
      const dy = y + 0.5 - sy;
      for (let x = xa; x <= xb; x++) {
        const dx = x + 0.5 - sx;
        const a = a0 * Math.exp((dx * dx + dy * dy) * inv);
        if (a < 0.004) continue;
        const o = (y * W + x) * 3;
        acc[o] += (cr - acc[o]) * a;
        acc[o + 1] += (cg - acc[o + 1]) * a;
        acc[o + 2] += (cb - acc[o + 2]) * a;
      }
    }
  }
  const out = new Uint8Array(W * H * 3);
  for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(acc[i] * 255)));
  return out;
}

/** Splat-Daten in Welt-Koordinaten bringen (für Standbilder und Grundriss). */
export function inWelt(s, anwenden, faktor) {
  const n = s.anzahl;
  const positionen = new Float32Array(n * 3);
  const skalen = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const w = anwenden([s.positionen[i * 3], s.positionen[i * 3 + 1], s.positionen[i * 3 + 2]]);
    positionen[i * 3] = w[0];
    positionen[i * 3 + 1] = w[1];
    positionen[i * 3 + 2] = w[2];
    for (let k = 0; k < 3; k++) skalen[i * 3 + k] = s.skalen[i * 3 + k] * faktor;
  }
  return { ...s, positionen, skalen };
}
