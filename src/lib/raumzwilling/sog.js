// src/lib/raumzwilling/sog.js
// Packen und Entpacken von Gaussian Splats im SOG-Layout (Version 2, wie
// @playcanvas/splat-transform: meta.json + verlustfreie WebP-Texturen).
// Rein und isomorph: arbeitet auf RGBA-Byte-Arrays; das Lesen/Schreiben der
// WebP-Dateien macht der Aufrufer (Server/Tools: sharp, Browser: WebGL).
//
// Layout (je Splat ein Pixel, Zeilen von oben, Breite und Höhe Vielfache von 4):
//   means_l.webp / means_u.webp  untere / obere 8 Bit der 16-Bit-Position
//                                (RGB = x, y, z nach v' = sign(v)·ln(|v|+1),
//                                 auf [mins, maxs] normiert)
//   quats.webp                   „smallest three“: RGB = drei kleinere
//                                Komponenten, A = 252 + Index der größten
//                                (Reihenfolge w, x, y, z wie rot_0..3 im PLY)
//   scales.webp                  RGB = Index ins 256er-Codebuch (log-Skalen)
//   sh0.webp                     RGB = Index ins 256er-Codebuch (f_dc),
//                                A = Deckkraft 0..255 (nach Sigmoid)
// Geprüft (28.10.2026): entpackeSog liest die Ausgabe von splat-transform
// v3.10.1 (… meta.json) korrekt (Position < 0,05 mm, Skala, Rotation, Farbe);
// der Unit-Test prüft zusätzlich den Hin- und Rückweg des eigenen Packers.

export const SH_C0 = 0.28209479177387814;
export const SOG_DATEIEN = Object.freeze(["means_l.webp", "means_u.webp", "quats.webp", "scales.webp", "sh0.webp"]);

export function texturGroesse(anzahl) {
  const breite = Math.max(4, Math.ceil(Math.sqrt(anzahl) / 4) * 4);
  const hoehe = Math.max(4, Math.ceil(anzahl / breite / 4) * 4);
  return { breite, hoehe };
}

const logT = (v) => Math.sign(v) * Math.log(Math.abs(v) + 1);
const expT = (v) => Math.sign(v) * (Math.exp(Math.abs(v)) - 1);
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/** 256er-Codebuch über Quantile (deterministisch, ohne k-means). */
export function codebuch(werte) {
  const s = Float64Array.from(werte).sort();
  const cb = new Array(256);
  for (let i = 0; i < 256; i++) cb[i] = s.length ? s[Math.min(s.length - 1, Math.round((i / 255) * (s.length - 1)))] : 0;
  for (let i = 1; i < 256; i++) if (cb[i] < cb[i - 1]) cb[i] = cb[i - 1];
  return cb.map((v) => Math.fround(v));
}

function naechster(cb, v) {
  let lo = 0;
  let hi = 255;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cb[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(cb[lo - 1] - v) <= Math.abs(cb[lo] - v)) return lo - 1;
  return lo;
}

/**
 * @param {{anzahl:number, positionen:Float32Array, skalenLog:Float32Array,
 *          rotationen:Float32Array, farbeDc:Float32Array, deckkraftLogit:Float32Array}} s
 *   rotationen je Splat (w, x, y, z), skalenLog = ln(σ), farbeDc = f_dc_0..2
 * @returns {{ meta:object, bilder:Record<string,{breite:number,hoehe:number,rgba:Uint8Array}> }}
 */
export function packeSog(s) {
  const n = s.anzahl;
  const { breite, hoehe } = texturGroesse(n);
  const leer = () => {
    const a = new Uint8Array(breite * hoehe * 4);
    for (let i = 3; i < a.length; i += 4) a[i] = 255;
    return a;
  };
  const ml = leer();
  const mu = leer();
  const qu = leer();
  const sc = leer();
  const sh = new Uint8Array(breite * hoehe * 4);

  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) {
      const v = logT(s.positionen[i * 3 + k]);
      if (v < mins[k]) mins[k] = v;
      if (v > maxs[k]) maxs[k] = v;
    }
  }
  for (let k = 0; k < 3; k++) if (!(maxs[k] > mins[k])) maxs[k] = mins[k] + 1e-6;

  const skalenCb = codebuch(s.skalenLog);
  const farbCb = codebuch(s.farbeDc);

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    for (let k = 0; k < 3; k++) {
      const t = (logT(s.positionen[i * 3 + k]) - mins[k]) / (maxs[k] - mins[k]);
      const q = Math.max(0, Math.min(65535, Math.round(t * 65535)));
      ml[o + k] = q & 255;
      mu[o + k] = q >> 8;
      sc[o + k] = naechster(skalenCb, s.skalenLog[i * 3 + k]);
      sh[o + k] = naechster(farbCb, s.farbeDc[i * 3 + k]);
    }
    sh[o + 3] = Math.max(0, Math.min(255, Math.round(sigmoid(s.deckkraftLogit[i]) * 255)));

    let q = [s.rotationen[i * 4], s.rotationen[i * 4 + 1], s.rotationen[i * 4 + 2], s.rotationen[i * 4 + 3]];
    const l = Math.hypot(...q) || 1;
    q = q.map((v) => v / l);
    let gross = 0;
    for (let k = 1; k < 4; k++) if (Math.abs(q[k]) > Math.abs(q[gross])) gross = k;
    if (q[gross] < 0) q = q.map((v) => -v);
    let j = 0;
    for (let k = 0; k < 4; k++) {
      if (k === gross) continue;
      qu[o + j++] = Math.max(0, Math.min(255, Math.round((q[k] * Math.SQRT2 * 0.5 + 0.5) * 255)));
    }
    qu[o + 3] = 252 + gross;
  }

  const meta = {
    version: 2,
    count: n,
    means: { mins, maxs, files: ["means_l.webp", "means_u.webp"] },
    scales: { codebook: skalenCb, files: ["scales.webp"] },
    quats: { files: ["quats.webp"] },
    sh0: { codebook: farbCb, files: ["sh0.webp"] },
  };
  const bild = (rgba) => ({ breite, hoehe, rgba });
  return {
    meta,
    bilder: { "means_l.webp": bild(ml), "means_u.webp": bild(mu), "quats.webp": bild(qu), "scales.webp": bild(sc), "sh0.webp": bild(sh) },
  };
}

/** Prüft meta.json (Server, bevor sie ausgeliefert wird; Browser vor dem Laden). */
export function pruefeMeta(meta) {
  const ok =
    meta &&
    meta.version === 2 &&
    Number.isInteger(meta.count) &&
    meta.count > 0 &&
    meta.count <= 8_000_000 &&
    Array.isArray(meta.means?.mins) &&
    meta.means.mins.length === 3 &&
    Array.isArray(meta.means?.maxs) &&
    Array.isArray(meta.scales?.codebook) &&
    meta.scales.codebook.length === 256 &&
    Array.isArray(meta.sh0?.codebook) &&
    meta.sh0.codebook.length === 256;
  if (!ok) return false;
  const dateien = [...meta.means.files, ...meta.scales.files, ...meta.quats.files, ...meta.sh0.files];
  return dateien.every((f) => SOG_DATEIEN.includes(f));
}

/**
 * Entpackt in die Form, die der Viewer braucht.
 * @param {object} meta
 * @param {(name:string)=>Uint8Array} rgbaVon RGBA-Bytes der Textur
 * @returns {{anzahl:number, positionen:Float32Array, skalen:Float32Array, quats:Float32Array, farben:Uint8Array}}
 *   skalen linear (σ), quats (x, y, z, w) normiert, farben RGBA 0..255
 */
export function entpackeSog(meta, rgbaVon) {
  const n = meta.count;
  const ml = rgbaVon("means_l.webp");
  const mu = rgbaVon("means_u.webp");
  const qu = rgbaVon("quats.webp");
  const sc = rgbaVon("scales.webp");
  const sh = rgbaVon("sh0.webp");
  const { mins, maxs } = meta.means;
  const scb = meta.scales.codebook;
  const fcb = meta.sh0.codebook;

  const positionen = new Float32Array(n * 3);
  const skalen = new Float32Array(n * 3);
  const quats = new Float32Array(n * 4);
  const farben = new Uint8Array(n * 4);
  const r = [0, 0, 0, 0];

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    for (let k = 0; k < 3; k++) {
      const q = ml[o + k] | (mu[o + k] << 8);
      positionen[i * 3 + k] = expT(mins[k] + (q / 65535) * (maxs[k] - mins[k]));
      skalen[i * 3 + k] = Math.exp(scb[sc[o + k]]);
      farben[o + k] = Math.max(0, Math.min(255, Math.round((0.5 + SH_C0 * fcb[sh[o + k]]) * 255)));
    }
    farben[o + 3] = sh[o + 3];

    const gross = Math.min(3, Math.max(0, qu[o + 3] - 252));
    let summe = 0;
    let j = 0;
    for (let k = 0; k < 4; k++) {
      if (k === gross) continue;
      const v = ((qu[o + j++] / 255 - 0.5) * 2) / Math.SQRT2;
      r[k] = v;
      summe += v * v;
    }
    r[gross] = Math.sqrt(Math.max(0, 1 - summe));
    // (w, x, y, z) → (x, y, z, w)
    quats[o] = r[1];
    quats[o + 1] = r[2];
    quats[o + 2] = r[3];
    quats[o + 3] = r[0];
  }
  return { anzahl: n, positionen, skalen, quats, farben };
}
