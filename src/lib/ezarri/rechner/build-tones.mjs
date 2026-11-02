// src/lib/ezarri/rechner/build-tones.mjs – misst die Farbtöne jedes
// Konfigurator-Mosaiks aus Ezarris Vorschaubild (public/ezarri/konfigurator/*-600.webp)
// und schreibt src/lib/ezarri/rechner/tones.json (Custom-Mix-Vorschau).
//
//   node src/lib/ezarri/rechner/build-tones.mjs
//
// Warum: Die Konfigurator-Daten haben bei 57 Mosaiken keinen Hex-Wert und bei
// den übrigen nur eine Grundfarbe für Ezarris Shader (z. B. Niebla 2521-B
// "#ffffff"). Glasmosaik ist nie einfarbig: Jedes Mosaik hat 2–4 Töne. Die
// Vorschau färbt jeden Stein mit einem dieser Töne, gewichtet nach Häufigkeit.
//
// Verfahren: Bild auf 48 × 48 verkleinern, k-means (k = 5) in CIELAB, Cluster
// unter 5 % verwerfen, die helle, unbunte Fugen-Farbe verwerfen, wenn sie nicht
// die einzige Farbe ist. Ergebnis je Mosaik: bis zu 4 Töne mit Gewicht (Summe 100).
// Daten: Ezarri, ezarri.com (Vorschaubilder des Konfigurators), Stand 28.10.2026.
// Nur Werkzeug: wird von der App nicht importiert.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const CONF = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/ezarri/configurator.json"), "utf8"));
const OUT = path.join(ROOT, "src/lib/ezarri/rechner/tones.json");

const toLin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
function lab([r, g, b]) {
  const R = toLin(r), G = toLin(g), B = toLin(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

function kmeans(px, k) {
  const labs = px.map(lab);
  // Start: Quantile der Helligkeit (deterministisch)
  const order = labs.map((l, i) => [l[0], i]).sort((a, b) => a[0] - b[0]);
  let cent = Array.from({ length: k }, (_, j) => labs[order[Math.floor(((j + 0.5) / k) * order.length)][1]].slice());
  let assign = new Array(px.length).fill(0);
  for (let it = 0; it < 20; it++) {
    assign = labs.map((l) => {
      let best = 0, bd = Infinity;
      cent.forEach((c, j) => {
        const d = d2(l, c);
        if (d < bd) (bd = d), (best = j);
      });
      return best;
    });
    cent = cent.map((c, j) => {
      const mem = labs.filter((_, i) => assign[i] === j);
      if (!mem.length) return c;
      return [0, 1, 2].map((q) => mem.reduce((s, m) => s + m[q], 0) / mem.length);
    });
  }
  return cent.map((_, j) => {
    const mem = px.filter((__, i) => assign[i] === j);
    const rgb = mem.length ? [0, 1, 2].map((q) => mem.reduce((s, m) => s + m[q], 0) / mem.length) : [0, 0, 0];
    return { rgb, lab: lab(rgb), n: mem.length };
  });
}

async function tonesOf(file) {
  const { data, info } = await sharp(file).resize(48, 48, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += info.channels) px.push([data[i], data[i + 1], data[i + 2]]);
  let cl = kmeans(px, 5).filter((c) => c.n / px.length >= 0.05);
  // Fuge: hell und unbunt, nicht der einzige/größte Ton
  const chroma = (c) => Math.hypot(c.lab[1], c.lab[2]);
  const isGrout = (c) => c.lab[0] > 82 && chroma(c) < 9;
  const rest = cl.filter((c) => !isGrout(c));
  if (rest.length && rest.reduce((s, c) => s + c.n, 0) / px.length > 0.4) cl = rest;
  // nah beieinander liegende Töne zusammenlegen
  cl.sort((a, b) => b.n - a.n);
  const merged = [];
  for (const c of cl) {
    const near = merged.find((m) => d2(m.lab, c.lab) < 36);
    if (near) {
      const n = near.n + c.n;
      near.rgb = near.rgb.map((v, q) => (v * near.n + c.rgb[q] * c.n) / n);
      near.lab = lab(near.rgb);
      near.n = n;
    } else merged.push({ ...c });
  }
  const top = merged.slice(0, 4);
  const sum = top.reduce((s, c) => s + c.n, 0);
  let w = top.map((c) => Math.max(1, Math.round((c.n / sum) * 100)));
  w[0] += 100 - w.reduce((s, x) => s + x, 0);
  return top.map((c, i) => [hex(c.rgb), w[i]]);
}

const out = { stand: CONF.stand, quelle: "Ezarri-Konfigurator, Vorschaubilder (ezarri.com)", toene: {} };
for (const m of CONF.mosaike) {
  const base = m.thumbs?.["50"] || m.thumbs?.["25"] || m.thumbs?.hexa || Object.values(m.thumbs || {})[0];
  const file = base && path.join(ROOT, "public", `${base}-600.webp`);
  if (!file || !fs.existsSync(file)) {
    if (m.farbe_hex) out.toene[m.id] = [[m.farbe_hex.toLowerCase(), 100]];
    continue;
  }
  out.toene[m.id] = await tonesOf(file);
}
fs.writeFileSync(OUT, JSON.stringify(out) + "\n");
console.log(`tones.json: ${Object.keys(out.toene).length} Mosaike, ${fs.statSync(OUT).size} Bytes`);
