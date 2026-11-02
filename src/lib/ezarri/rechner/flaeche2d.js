// src/lib/ezarri/rechner/flaeche2d.js – 2D-Mosaikfläche auf <canvas> (Custom Mix, Team C).
//
// Gleiche Idee wie preview2d.drawMosaic() aus dem Vertrag §7.4 Nr. 4 (Team B):
// Mischung + Palette + Format + Fuge → gemischte Fläche. Diese Fassung zeichnet
// zusätzlich jeden Stein mit einem der gemessenen Töne seines Mosaiks (tones.json)
// und einer kleinen Helligkeitsstreuung, weil Glas nie ganz einfarbig ist.
//
// Rein: bekommt einen CanvasRenderingContext2D, keine DOM-Abfragen, kein React.
import { cellAssignment, rng } from "./mischung.js";

/** Rastermaß (Stein + Fuge) in mm je Format, für den Maßstab der Vorschau. */
export const RASTER_MM = Object.freeze({ 25: 25.8, 50: 51.8, hexa: 34.5 });

const hexToRgb = (hex) => {
  const h = String(hex || "#999999").replace("#", "");
  const n = Number.parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
const rgb = (c, f = 1) => `rgb(${clamp(c[0] * f)} ${clamp(c[1] * f)} ${clamp(c[2] * f)})`;

/** Gewichtete Auswahl eines Tons. */
function pickTone(tones, r) {
  const total = tones.reduce((s, t) => s + t[1], 0) || 1;
  let x = r * total;
  for (const t of tones) {
    x -= t[1];
    if (x <= 0) return t[0];
  }
  return tones[tones.length - 1][0];
}

/**
 * Anzahl Spalten/Zeilen für eine Fläche in Metern.
 * @returns {{cols:number, rows:number}}
 */
export function rasterFuer(format, breiteM, hoeheM) {
  const mm = RASTER_MM[format] || RASTER_MM[25];
  if (format === "hexa") return { cols: Math.ceil((breiteM * 1000) / mm) + 1, rows: Math.ceil((hoeheM * 1000) / (mm * 0.866)) + 1 };
  return { cols: Math.ceil((breiteM * 1000) / mm), rows: Math.ceil((hoeheM * 1000) / mm) };
}

/**
 * Zeichnet die Fläche.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} o
 * @param {number} o.width   Pixelbreite der Zeichenfläche
 * @param {number} o.height  Pixelhöhe
 * @param {number} o.cols    Steine je Zeile
 * @param {number} o.rows    Zeilen
 * @param {"25"|"50"|"hexa"} o.format
 * @param {Array<{id:string, anteil:number}>} o.mix
 * @param {Record<string, Array<[string, number]>>} o.toene  Töne je Mosaik-ID
 * @param {string} o.fuge    Hex der Fugenfarbe
 * @param {number} o.seed
 * @param {boolean} [o.wasser] Wasserlasur (Pool gefüllt)
 * @returns {number[]} tatsächliche Stückzahl je Mischungs-Eintrag
 */
export function drawMosaic(ctx, { width, height, cols, rows, format = "25", mix, toene, fuge = "#ededed", seed = 1, wasser = false }) {
  const n = cols * rows;
  const assign = cellAssignment(seed, mix, cols, rows);
  const counts = new Array(mix.length).fill(0);
  const r = rng((seed ^ 0x9e3779b9) >>> 0);
  ctx.save();
  ctx.fillStyle = fuge;
  ctx.fillRect(0, 0, width, height);

  const tonesFor = mix.map((x) => (toene[x.id]?.length ? toene[x.id] : [["#9a9c9e", 100]]).map(([h, w]) => [hexToRgb(h), w]));

  if (format === "hexa") {
    // Sechsecke mit Spitze oben; Schlüsselweite = Zellbreite.
    const cw = width / (cols - 0.5);
    const rad = cw / Math.sqrt(3);
    const rh = rad * 1.5;
    const gap = Math.max(0.6, cw * 0.06);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        if (i >= n) break;
        const k = assign[i];
        counts[k] += 1;
        const cx = col * cw + (row % 2 ? cw / 2 : 0);
        const cy = row * rh + rad * 0.5;
        hexPath(ctx, cx, cy, rad - gap / 2);
        stone(ctx, tonesFor[k], r, null);
      }
    }
  } else {
    const cw = width / cols;
    const ch = height / rows;
    const gap = Math.max(0.6, cw * (format === "50" ? 0.025 : 0.045));
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const k = assign[i];
        counts[k] += 1;
        const x = col * cw + gap / 2;
        const y = row * ch + gap / 2;
        const w = cw - gap;
        const h = ch - gap;
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        stone(ctx, tonesFor[k], r, { x, y, w, h });
      }
    }
  }

  if (wasser) waterGlaze(ctx, width, height, seed);
  ctx.restore();
  return counts;
}

function stone(ctx, tones, r, box) {
  const pick = pickTone(tones.map(([c, w]) => [c, w]), r());
  const f = 0.96 + r() * 0.08; // ±4 % Helligkeit
  ctx.fillStyle = rgb(pick, f);
  ctx.fill();
  if (box && box.w > 5) {
    // Glaskante: Licht oben links, Schatten unten rechts (dezent)
    ctx.fillStyle = "rgb(255 255 255 / 0.16)";
    ctx.fillRect(box.x, box.y, box.w, Math.max(0.6, box.h * 0.08));
    ctx.fillStyle = "rgb(0 0 0 / 0.10)";
    ctx.fillRect(box.x, box.y + box.h * 0.92, box.w, box.h * 0.08);
  }
}

function hexPath(ctx, cx, cy, rad) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + rad * Math.cos(a);
    const y = cy + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Wasserlasur: Absorption (türkis, multiply) + ruhige Lichtnetz-Bänder (screen). Statisch. */
function waterGlaze(ctx, width, height, seed) {
  ctx.globalCompositeOperation = "multiply";
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, "rgb(170 222 226)");
  g.addColorStop(1, "rgb(120 182 196)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "screen";
  const r = rng(seed + 17);
  ctx.lineWidth = Math.max(1, width / 220);
  ctx.strokeStyle = "rgb(255 255 255 / 0.13)";
  for (let i = 0; i < 26; i++) {
    const y0 = r() * height;
    ctx.beginPath();
    ctx.moveTo(-10, y0);
    const amp = height * (0.02 + r() * 0.03);
    for (let x = 0; x <= width + 20; x += width / 12) ctx.lineTo(x, y0 + Math.sin(x / (width / (3 + r() * 4)) + i) * amp);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}
