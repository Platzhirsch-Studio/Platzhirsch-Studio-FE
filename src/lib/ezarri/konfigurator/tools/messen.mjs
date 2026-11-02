// src/lib/ezarri/konfigurator/tools/messen.mjs – misst Steinfarben und Pattern-Masken
// aus den Ezarri-Produktbildern (einmalig, Ergebnis wird eingecheckt).
//
//   node src/lib/ezarri/konfigurator/tools/messen.mjs
//
// Schreibt:
//   src/lib/ezarri/konfigurator/measured-colors.json
//     { stand, quelle, methode, farben: { <referenzId>: [["#rrggbb", anteil%], …] } }
//     Je Referenz bis zu 5 Steinfarben mit Flächenanteil, gemessen im Mosaik-
//     Nahbild (public/ezarri/<kollektion>/mos-…-600.webp). Methode: 200 px,
//     Median 5 px (entfernt die 1–2 px breiten Fugen), k-means k = 6 in CIELAB
//     (deterministischer Start), Cluster mit ΔE < 9 zusammengelegt, < 4 % verworfen.
//   src/lib/ezarri/konfigurator/patterns.json
//     { <patternId>: { w, h, kanaele, maske: "0102…" } } – Steinraster der 20
//     Ezarri-Patterns (Kanal 0 hell, 1 dunkel, 2 mittel), aus den Pattern-
//     Vorschaubildern (Herstellermaterial, 296 px) abgelesen und auf die kleinste Wiederholung gekürzt.
//
// Nur Node + sharp (installiert). Liest nur lokale Dateien.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../../..");
const REFS = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/ezarri/references.json"), "utf8"));
const KONF = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/ezarri/configurator.json"), "utf8"));

// --- Farbraum -------------------------------------------------------------
const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function rgbToLab([r, g, b]) {
  const R = srgbToLin(r / 255), G = srgbToLin(g / 255), B = srgbToLin(b / 255);
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
function labToRgb([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const x = inv(fx) * 0.95047, y = inv(fy), z = inv(fz) * 1.08883;
  const R = 3.2406 * x - 1.5372 * y - 0.4986 * z;
  const G = -0.9689 * x + 1.8758 * y + 0.0415 * z;
  const B = 0.0557 * x - 0.204 * y + 1.057 * z;
  return [R, G, B].map((c) => Math.round(Math.min(1, Math.max(0, linToSrgb(c))) * 255));
}
const hex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;

function kmeans(points, k, iters = 14) {
  // deterministischer k-means++-Start: erster Punkt = Median-Helligkeit, dann jeweils der fernste
  const sorted = [...points].sort((p, q) => p[0] - q[0]);
  const centers = [sorted[Math.floor(sorted.length / 2)].slice()];
  while (centers.length < k) {
    let best = null, bestD = -1;
    for (let i = 0; i < points.length; i += 3) {
      const dm = Math.min(...centers.map((c) => d2(c, points[i])));
      if (dm > bestD) { bestD = dm; best = points[i]; }
    }
    if (!best || bestD < 4) break;
    centers.push(best.slice());
  }
  const assign = new Int32Array(points.length);
  for (let it = 0; it < iters; it++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    points.forEach((p, i) => {
      let bi = 0, bd = Infinity;
      centers.forEach((c, j) => { const d = d2(c, p); if (d < bd) { bd = d; bi = j; } });
      assign[i] = bi;
      const s = sums[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3] += 1;
    });
    sums.forEach((s, j) => { if (s[3]) centers[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  const counts = centers.map(() => 0);
  for (const a of assign) counts[a] += 1;
  return centers.map((c, j) => ({ lab: c, n: counts[j] })).filter((c) => c.n > 0);
}

async function palette(file, freigestellt = false) {
  const { data, info } = await sharp(file).resize(200, 200, { fit: "cover" }).median(5).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pts = [];
  for (let i = 0; i < info.width * info.height; i++) {
    const lab = rgbToLab([data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]);
    // Corner/Cove/Safe-Step-Fotos sind freigestellt: weißen Hintergrund nicht mitzählen
    if (freigestellt && lab[0] > 92 && Math.hypot(lab[1], lab[2]) < 5) continue;
    pts.push(lab);
  }
  if (pts.length < 200) return null;
  let cl = kmeans(pts, 6);
  // zusammenlegen (ΔE76 < 9)
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) {
      if (Math.sqrt(d2(cl[i].lab, cl[j].lab)) < 9) {
        const n = cl[i].n + cl[j].n;
        cl[i] = { lab: cl[i].lab.map((v, t) => (v * cl[i].n + cl[j].lab[t] * cl[j].n) / n), n };
        cl.splice(j, 1);
        merged = true;
        break outer;
      }
    }
  }
  const total = cl.reduce((s, c) => s + c.n, 0);
  // Hauptfarben ≥ 4 %; seltene Akzentsteine (z. B. Gold in Space) ab 1,5 %, wenn sie sich deutlich abheben (ΔE > 25)
  cl.sort((p, q) => q.n - p.n);
  const main = cl.filter((c) => c.n / total >= 0.04);
  const accents = cl.filter((c) => c.n / total >= 0.015 && c.n / total < 0.04 && main.every((m) => Math.sqrt(d2(m.lab, c.lab)) > 25));
  cl = [...main.slice(0, 5 - Math.min(1, accents.length)), ...accents.slice(0, 1)];
  const t2 = cl.reduce((s, c) => s + c.n, 0);
  const out = cl.map((c) => [hex(labToRgb(c.lab)), Math.round((c.n / t2) * 100)]);
  // Summe exakt 100
  const diff = 100 - out.reduce((s, c) => s + c[1], 0);
  out[0][1] += diff;
  return out;
}

// --- Patterns -------------------------------------------------------------
async function patternMask(file) {
  // Originalbild (296 px) statt der hochskalierten Web-Fassung: schärfere Fugen.
  const { data, info } = await sharp(file).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const L = (x, y) => data[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  // Fugen-Profil: zweite Ableitung quer zur Fuge (Fuge ist auf Weiß dunkler, auf Schwarz heller)
  const gx = new Float64Array(W), gy = new Float64Array(H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    gx[x] += Math.abs(2 * L(x, y) - L(x - 2, y) - L(x + 2, y));
    gy[y] += Math.abs(2 * L(x, y) - L(x, y - 2) - L(x, y + 2));
  }
  const at = (g, t) => { const i = Math.floor(t), f = t - i; return (g[i] ?? 0) * (1 - f) + (g[i + 1] ?? 0) * f; };
  const fit = (g, len) => {
    let best = null;
    for (let p = 6; p <= 24; p += 0.01) {
      for (let ph = 0; ph < p; ph += 0.25) {
        let s = 0, n = 0;
        for (let t = ph; t < len - 1; t += p) { s += at(g, t); n++; }
        // gegen Vielfache absichern: Mittelwert zwischen den Fugen abziehen
        let m = 0, k = 0;
        for (let t = ph + p / 2; t < len - 1; t += p) { m += at(g, t); k++; }
        const score = s / n - (k ? m / k : 0);
        if (!best || score > best.score) best = { p, ph, score };
      }
    }
    return best;
  };
  const fx = fit(gx, W), fy = fit(gy, H);
  const p = (fx.p + fy.p) / 2;
  const cols = Math.floor((W - fx.ph) / p), rows = Math.floor((H - fy.ph) / p);
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const x0 = fx.ph + c * p, y0 = fy.ph + r * p, vals = [];
      for (let yy = 0.3; yy <= 0.7; yy += 0.1) for (let xx = 0.3; xx <= 0.7; xx += 0.1) vals.push(L(Math.round(x0 + xx * p), Math.round(y0 + yy * p)));
      vals.sort((a, b) => a - b);
      const v = vals[Math.floor(vals.length / 2)];
      row.push(v > 175 ? 0 : v < 80 ? 1 : 2);
    }
    grid.push(row);
  }
  // kleinste Wiederholung in x und y (≥ 97 % gleiche Steine), sonst ganzes Raster
  const periodX = () => {
    for (let q = 2; q <= cols / 2; q++) {
      let same = 0, all = 0;
      for (const row of grid) for (let i = 0; i + q < cols; i++) { all++; if (row[i] === row[i + q]) same++; }
      if (same / all >= 0.97) return q;
    }
    return cols;
  };
  const periodY = () => {
    for (let q = 2; q <= rows / 2; q++) {
      let same = 0, all = 0;
      for (let i = 0; i + q < rows; i++) for (let x = 0; x < cols; x++) { all++; if (grid[i][x] === grid[i + q][x]) same++; }
      if (same / all >= 0.97) return q;
    }
    return rows;
  };
  const px = periodX(), py = periodY();
  const tile = grid.slice(0, py).map((row) => row.slice(0, px));
  const kanaele = new Set(tile.flat()).size;
  return { w: px, h: py, kanaele, raster: cols, maske: tile.map((r) => r.join("")).join("") };
}

async function main() {
  const nurPatterns = process.argv.includes("--nur-patterns");
  const farben = {};
  let i = 0;
  for (const r of nurPatterns ? [] : REFS.referenzen) {
    const web = r.bilder?.mosaik?.[0]?.web;
    if (!web) continue;
    const file = path.join(ROOT, "public", `${web}-600.webp`);
    if (!fs.existsSync(file)) continue;
    const pal = await palette(file, r.typ === "corner" || r.typ === "cove");
    if (pal) farben[r.id] = pal;
    if (++i % 50 === 0) console.log(`${i} Referenzen gemessen`);
  }
  const out = {
    stand: REFS.stand,
    quelle: "Ezarri-Mosaik-Nahbilder (Bild: Ezarri, ezarri.com), gemessen mit tools/messen.mjs",
    methode: "200 px, Median 5 px, k-means k=6 in CIELAB, ΔE<9 zusammengelegt, Anteile <4 % verworfen, max. 5 Farben",
    farben,
  };
  if (!nurPatterns) fs.writeFileSync(path.join(HERE, "../measured-colors.json"), JSON.stringify(out));
  console.log(`measured-colors.json: ${Object.keys(farben).length} Referenzen`);

  const patterns = {};
  for (const p of KONF.patterns) {
    const file = p.bild?.original && path.join(ROOT, p.bild.original);
    if (!file || !fs.existsSync(file)) continue;
    patterns[p.id] = await patternMask(file);
    console.log(`Pattern ${p.id} ${p.name}: Raster ${patterns[p.id].raster}, Kachel ${patterns[p.id].w}×${patterns[p.id].h}, Kanäle ${patterns[p.id].kanaele}`);
  }
  fs.writeFileSync(path.join(HERE, "../patterns.json"), JSON.stringify(patterns));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
