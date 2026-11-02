// src/lib/ezarri/konfigurator/preview2d.js – 2D-Vorschau ohne WebGL (Team B, auch für Team C).
//
// Vertrag §7.4 Nr. 4: drawMosaic(ctx, {mix, palette, format, fuge, kanaele, wasser}).
// Dazu drawPlan(ctx, {state, index, …}): Draufsicht auf Becken/Fläche mit Mosaik,
// Wassertiefe als Lasur (Beer-Lambert, wie im 3D-Shader), Treppe, Bank, Kanälen,
// Pattern und Vorher/Nachher-Teilung.
//
// Gerechnet wird pro Pixel (ImageData): Stein-Raster aus Format und Fuge, Steinfarbe
// aus den gemessenen Farben der Referenz (Flächenanteile), Mischung per Hash je Stein
// (mix.js), ±3 % Helligkeit je Stein (Glas ist nie einfarbig), Fase als Lichtkante.
//
// Rein bis auf das übergebene Canvas-2D-Kontextobjekt; kein DOM-Zugriff, kein React.
import { cumulative, hash01, pickIndex } from "./mix.js";
import { bench, depthAt, outline, steps, waterLevel, polygonArea, edgeVisible } from "./geometry.js";

/** Rastermaß (Stein + Fuge) in m und Fugenbreite (Ezarri: 1,1 mm). */
export const PITCH = Object.freeze({ 25: 0.0258, 50: 0.0518, hexa: 0.0345 });
export const FUGE_M = 0.0011;

/** Lichtschwächung im Wasser je Meter (R, G, B) und Streulicht – sichtbarer Wasserton. */
export const WASSER_TON = Object.freeze({
  klar: { absorb: [0.45, 0.07, 0.035], scatter: [0.03, 0.16, 0.2] },
  naturpool: { absorb: [0.5, 0.1, 0.16], scatter: [0.05, 0.16, 0.1] },
  salz: { absorb: [0.42, 0.06, 0.03], scatter: [0.02, 0.17, 0.23] },
});

export function hexToRgb(hex) {
  const h = String(hex || "#888888").replace("#", "");
  const n = Number.parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toLin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
// linear → sRGB über Tabelle (4096 Stufen), schnell genug für ImageData pro Pixel
const SRGB_LUT = new Uint8ClampedArray(4096);
for (let i = 0; i < 4096; i++) {
  const c = i / 4095;
  SRGB_LUT[i] = Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
}
const toSrgb = (v) => SRGB_LUT[v <= 0 ? 0 : v >= 1 ? 4095 : (v * 4095) | 0];

/** Mischungseintrag → Malvorlage: Farben (linear) mit kumulierten Anteilen, Glanz, Zeichnung. */
function entryOf(ref) {
  const pal = ref?.pal?.length ? ref.pal : [["#9fb4b8", 100]];
  const total = pal.reduce((s, p) => s + p[1], 0) || 1;
  let acc = 0;
  const cols = pal.map(([hex, w]) => {
    acc += w / total;
    return { lin: hexToRgb(hex).map(toLin), cum: acc };
  });
  return { cols, glanz: ref?.fin?.[0] ?? 0.5, art: ref?.fin?.[2] ?? "glanz", gez: Boolean(ref?.gez) };
}

/**
 * Materialsatz eines Zustands: Mischung, Kanäle, Pattern, Fuge.
 * @param {object} state  Zustand (state.js)
 * @param {object} index  buildIndex(katalog)
 */
export function materialSet(state, index) {
  const ref = (e) => index.resolveRef(e.id, state.format, { ref: e.ref });
  const mix = state.mix.map((e) => entryOf(ref(e)));
  const fuge = hexToRgb(index.fuge(state.fuge)?.hex || "#ededed").map(toLin);
  const kanaele = state.kanaele.map((k) => ({ ...k, entry: entryOf(ref(k)) }));
  let pattern = null;
  if (state.modus === "pattern" && state.pattern) {
    const p = (index.katalog?.patterns || []).find((x) => x.id === state.pattern.id);
    if (p?.maske) pattern = { w: p.w, h: p.h, maske: p.maske, entries: state.pattern.ids.map((id) => entryOf(index.resolveRef(id, state.format))) };
  }
  return { mix, cum: cumulative(state.mix), fuge, kanaele, pattern, format: state.format, seed: state.seed || 7, wasserton: state.wasserton || "klar" };
}

// ---------------------------------------------------------------------------
// Steinraster

/** Quadrat-Raster: Zelle und Abstand zur Steinkante (m). */
function squareCell(u, v, pitch) {
  const cx = Math.floor(u / pitch);
  const cy = Math.floor(v / pitch);
  const fx = u / pitch - cx;
  const fy = v / pitch - cy;
  const edge = Math.min(fx, 1 - fx, fy, 1 - fy) * pitch;
  return { cx, cy, edge, fx, fy };
}

/** Sechseck-Raster (spitze Seite oben): Zelle (axial) und Abstand zur Kante (m). */
function hexCell(u, v, pitch) {
  const size = pitch / Math.sqrt(3); // Inkreis-Durchmesser = pitch
  const q = ((Math.sqrt(3) / 3) * u - (1 / 3) * v) / size;
  const r = ((2 / 3) * v) / size;
  // kubisch runden
  let x = q;
  let z = r;
  let y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  const cxw = size * Math.sqrt(3) * (rx + rz / 2);
  const cyw = size * 1.5 * rz;
  const px = u - cxw;
  const py = v - cyw;
  // Abstand zur Kante: Inkreisradius minus größte Projektion auf die 3 Normalen
  const n = Math.max(Math.abs(px), Math.abs(px * 0.5 + py * 0.8660254), Math.abs(-px * 0.5 + py * 0.8660254));
  const edge = pitch / 2 - n;
  return { cx: rx, cy: rz, edge, fx: 0.5 + px / pitch, fy: 0.5 + py / pitch };
}

function cellAt(u, v, format) {
  const pitch = PITCH[format] || PITCH[25];
  return format === "hexa" ? hexCell(u, v, pitch) : squareCell(u, v, pitch);
}

/** Wertrauschen 0–1 (für gezeichnete Serien). */
function vnoise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash01(xi, yi, seed);
  const b = hash01(xi + 1, yi, seed);
  const c = hash01(xi, yi + 1, seed);
  const d = hash01(xi + 1, yi + 1, seed);
  return a + (b - a) * s(fx) + (c - a) * s(fy) + (a - b - c + d) * s(fx) * s(fy);
}

/** Farbe eines Steins (linear RGB) für einen Materialeintrag. */
function stoneLin(entry, cx, cy, seed, fx, fy) {
  const r = hash01(cx + 7919, cy - 31, seed);
  const cols = entry.cols;
  let k = 0;
  while (k < cols.length - 1 && r >= cols[k].cum) k++;
  let c = cols[k].lin;
  if (entry.gez && cols.length > 1) {
    // Zeichnung im Stein: weiche Wolke der zweiten Farbe
    const n = vnoise(cx * 3 + fx * 2.6, cy * 3 + fy * 2.6, seed + 17);
    const other = cols[(k + 1) % cols.length].lin;
    const t = Math.max(0, Math.min(1, (n - 0.55) * 3));
    c = [c[0] + (other[0] - c[0]) * t, c[1] + (other[1] - c[1]) * t, c[2] + (other[2] - c[2]) * t];
  }
  const j = 1 + (hash01(cx, cy + 104729, seed) - 0.5) * 0.06;
  return [c[0] * j, c[1] * j, c[2] * j];
}

/**
 * Farbe (linear RGB) eines Punkts (u, v in m) der Fläche.
 * @param {object} set  materialSet()
 * @param {{kanal?: object|null, tiefe?: number|null, licht?: number}} [opt]
 */
export function sampleLin(set, u, v, { kanal = null, tiefe = null, licht = 1, klein = false } = {}) {
  const c = cellAt(u, v, set.format);
  // Bei < 4 px je Stein wird die Fuge nicht getroffen, sondern anteilig beigemischt (kein Moiré)
  const grout = !klein && c.edge < FUGE_M / 2;
  let col;
  let glanz = 0.4;
  if (grout) {
    col = set.fuge;
  } else {
    let entry;
    if (kanal) entry = kanal.entry;
    else if (set.pattern) {
      const p = set.pattern;
      const mx = ((c.cx % p.w) + p.w) % p.w;
      const my = ((c.cy % p.h) + p.h) % p.h;
      const ch = Number(p.maske[my * p.w + mx]) || 0;
      entry = p.entries[Math.min(ch, p.entries.length - 1)] || p.entries[0];
    } else entry = set.mix[pickIndex(hash01(c.cx, c.cy, set.seed), set.cum)] || set.mix[0];
    col = stoneLin(entry, c.cx, c.cy, set.seed, c.fx, c.fy);
    glanz = entry.glanz;
    // Fase: Lichtkante oben links, Schatten unten rechts (nur in der Nahansicht sichtbar)
    const bevel = Math.min(1, c.edge / (PITCH[set.format] * 0.12));
    const sh = (c.fx - c.fy) * 0.04 * (1 - bevel);
    col = col.map((x) => x * (1 - sh));
    if (entry.art === "perlmutt") {
      const t = hash01(c.cx, c.cy, 99);
      col = [col[0] * (0.95 + 0.1 * t), col[1] * (0.97 + 0.05 * (1 - t)), col[2] * (0.95 + 0.1 * (1 - t))];
    }
  }
  if (klein && !grout) {
    const g = (2 * FUGE_M) / (PITCH[set.format] || PITCH[25]);
    col = col.map((x, i) => x * (1 - g) + set.fuge[i] * g);
  }
  col = col.map((x) => x * licht);
  if (tiefe != null && tiefe > 0) col = throughWater(col, tiefe, set.wasserton);
  return { col, grout, glanz };
}

/** Farbe durch Wasser gesehen (Weg hin und zurück ≈ 2 × Tiefe), linear RGB. */
export function throughWater(lin, tiefe, ton = "klar") {
  const w = WASSER_TON[ton] || WASSER_TON.klar;
  const path = tiefe * 2;
  return lin.map((c, i) => {
    const t = Math.exp(-w.absorb[i] * path);
    return c * t + w.scatter[i] * (1 - t);
  });
}

// ---------------------------------------------------------------------------
// Zeichnen

/**
 * Mosaikfläche (Nahansicht) in ein Rechteck zeichnen.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{state?:object, index?:object, set?:object, x?:number, y?:number, width:number, height:number,
 *          stonePx?:number, wasser?:number|null}} o  `wasser` = Wassertiefe in m (Lasur) oder null
 */
export function drawMosaic(ctx, o) {
  const set = o.set || materialSet(o.state, o.index);
  const W = Math.max(1, Math.round(o.width));
  const H = Math.max(1, Math.round(o.height));
  const pxPerM = (o.stonePx || 14) / (PITCH[set.format] || PITCH[25]);
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const bands = (o.kanaele ?? set.kanaele).filter((k) => k.lage === "wasserlinie" || k.lage === "bahnen");
  for (let y = 0; y < H; y++) {
    const v = y / pxPerM;
    // Kanäle als Streifen am oberen Rand (Wasserlinie) bzw. mittig (Bahn)
    let kanal = null;
    for (const k of bands) {
      const bw = (k.breite / 100) * pxPerM;
      if (k.lage === "wasserlinie" && y < bw) kanal = k;
      if (k.lage === "bahnen" && Math.abs(y - H * 0.62) < bw / 2) kanal = k;
    }
    for (let x = 0; x < W; x++) {
      const { col } = sampleLin(set, x / pxPerM, v, { kanal, tiefe: o.wasser ?? null });
      const i = (y * W + x) * 4;
      d[i] = toSrgb(col[0]);
      d[i + 1] = toSrgb(col[1]);
      d[i + 2] = toSrgb(col[2]);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, o.x || 0, o.y || 0);
  return set;
}

/** Spannen [x0, x1] einer Polygonzeile (Scanline) für z. */
function spans(pts, z) {
  const xs = [];
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    if ((z1 <= z && z2 > z) || (z2 <= z && z1 > z)) xs.push(x1 + ((z - z1) / (z2 - z1)) * (x2 - x1));
  }
  xs.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
  return out;
}
const inSpans = (sp, x) => sp.some(([a, b]) => x >= a && x <= b);

function distToEdges(prism, x, z) {
  let best = Infinity;
  for (let i = 0; i < prism.pts.length; i++) {
    if (!edgeVisible(prism, i)) continue;
    const [x1, z1] = prism.pts[i];
    const [x2, z2] = prism.pts[(i + 1) % prism.pts.length];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - x1 - t * dx, z - z1 - t * dz));
  }
  return best;
}

function distToOutline(pts, x, z) {
  let best = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - x1 - t * dx, z - z1 - t * dz));
  }
  return best;
}

/** Bahnmarkierung: Streifen entlang der Länge, je 2,5 m Bahnbreite einer, ab 0,5 m vor den Stirnwänden. */
export function laneCenters(becken) {
  const n = Math.max(1, Math.floor(becken.b / 2.5));
  const step = becken.b / n;
  return Array.from({ length: n }, (_, i) => -becken.b / 2 + step * (i + 0.5));
}

/**
 * Draufsicht (Pool, Whirlpool) bzw. Ansicht der Wand (Bad, Küche).
 * @param {CanvasRenderingContext2D} ctx
 * @param {{state:object, index:object, width:number, height:number, vorher?:object|null, split?:number}} o
 *   vorher: zweiter Zustand für Vorher/Nachher (links), split 0–1 Position der Teilung
 */
export function drawPlan(ctx, o) {
  const { state, index } = o;
  const W = Math.max(2, Math.round(o.width));
  const H = Math.max(2, Math.round(o.height));
  const sets = [materialSet(state, index)];
  if (o.vorher) sets.push(materialSet(o.vorher, index));
  const split = o.vorher ? Math.round(W * (o.split ?? 0.5)) : -1;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const sz = state.szene;
  const b = state.becken;

  if (sz === "bad" || sz === "kueche") {
    // Wandansicht: Breite l × Höhe tTief, unten (Bad) ein Bodenstreifen
    const wallH = b.tTief;
    const floorH = sz === "bad" ? Math.min(b.b, 0.6) : 0;
    const scale = Math.min((W * 0.9) / b.l, (H * 0.9) / (wallH + floorH));
    const ox = (W - b.l * scale) / 2;
    const oy = (H - (wallH + floorH) * scale) / 2;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const set = x < split ? sets[1] : sets[0];
        const u = (x - ox) / scale;
        const v = (y - oy) / scale;
        let col;
        if (u < 0 || u > b.l || v < 0 || v > wallH + floorH) col = [0.86, 0.83, 0.79];
        else {
          const licht = v > wallH ? 0.82 : 1 - (v / wallH) * 0.12;
          col = sampleLin(set, u, v, { licht }).col;
        }
        const i = (y * W + x) * 4;
        d[i] = toSrgb(col[0]);
        d[i + 1] = toSrgb(col[1]);
        d[i + 2] = toSrgb(col[2]);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (split >= 0) drawSplit(ctx, split, H);
    return { scale, ox, oy };
  }

  const pts = outline(b, sz);
  const xs = pts.map((p) => p[0]);
  const zs = pts.map((p) => p[1]);
  const minX = Math.min(...xs) - 0.9;
  const maxX = Math.max(...xs) + 0.9;
  const minZ = Math.min(...zs) - 0.9;
  const maxZ = Math.max(...zs) + 0.9;
  const scale = Math.min(W / (maxX - minX), H / (maxZ - minZ));
  const ox = (W - (maxX - minX) * scale) / 2 - minX * scale;
  const oz = (H - (maxZ - minZ) * scale) / 2 - minZ * scale;
  const st = steps(b, sz);
  const bk = bench(b, sz);
  const leer = state.wasser === "leer";
  const wl = waterLevel(b, sz) ?? 0;
  const lanes = laneCenters(b);
  const coping = 0.3;

  const klein = (PITCH[state.format] || PITCH[25]) * scale < 4;
  const brauchtRand = sets.some((s) => s.kanaele.some((k) => k.lage === "wasserlinie"));
  const nahSpan = (sp, x, r) => sp.some(([a, c]) => x >= a - r && x <= c + r);
  const spanRand = (sp, x) => {
    let m = Infinity;
    for (const [a, c] of sp) if (x >= a && x <= c) m = Math.min(x - a, c - x);
    return m;
  };
  for (let y = 0; y < H; y++) {
    const z = (y - oz) / scale;
    const sp = spans(pts, z);
    const spOben = spans(pts, z - coping);
    const spUnten = spans(pts, z + coping);
    const spO2 = spans(pts, z - 0.35);
    const spU2 = spans(pts, z + 0.35);
    const stepSpans = st.map((s) => spans(s.pts, z));
    const benchSpans = bk.map((s) => spans(s.pts, z));
    for (let x = 0; x < W; x++) {
      const wx = (x - ox) / scale;
      const set = x < split ? sets[1] : sets[0];
      let col;
      if (inSpans(sp, wx)) {
        // Oberfläche: Stufe, Bank oder Boden
        let tiefe = depthAt(b, wx, sz);
        let prism = null;
        for (let k = 0; k < st.length; k++) {
          if (inSpans(stepSpans[k], wx)) {
            tiefe = -st[k].yTop;
            prism = st[k];
            break;
          }
        }
        if (!prism) {
          for (let k = 0; k < bk.length; k++) {
            if (inSpans(benchSpans[k], wx)) {
              tiefe = -bk[k].yTop;
              prism = bk[k];
              break;
            }
          }
        }
        let kanal = null;
        for (const kn of set.kanaele) {
          const bw = kn.breite / 100;
          if (kn.lage === "bahnen" && sz === "pool" && !prism && lanes.some((c) => Math.abs(z - c) < bw / 2) && Math.abs(wx) < b.l / 2 - 0.5) kanal = kn;
          if (kn.lage === "wasserlinie" && brauchtRand && distToOutline(pts, wx, z) < bw * 0.6) kanal = kn;
          if (kn.lage === "stufen" && prism && distToEdges(prism, wx, z) < bw) kanal = kn;
        }
        // Licht: Wand-Nähe etwas dunkler (Schatten der Kante), Tiefe über Wasser
        // Abstand zum Rand (Näherung über Nachbarzeilen, schnell)
        const near = !inSpans(spO2, wx) || !inSpans(spU2, wx) ? 0.12 : 0.35;
        const rand = Math.min(1, Math.min(spanRand(sp, wx), near) / 0.35);
        const licht = 0.86 + 0.14 * rand;
        const w = leer ? null : Math.max(0, tiefe + wl);
        col = sampleLin(set, wx, z, { kanal, tiefe: w, licht, klein }).col;
      } else {
        // Beckenkopf und Terrasse
        if (nahSpan(sp, wx, coping) || nahSpan(spOben, wx, coping) || nahSpan(spUnten, wx, coping)) col = [0.76, 0.73, 0.68];
        else {
          const jx = Math.abs(((wx * 1.6) % 1) + 1) % 1;
          const jz = Math.abs(((z * 1.6) % 1) + 1) % 1;
          const joint = jx < 0.012 || jz < 0.012;
          const t = hash01(Math.floor(wx * 1.6), Math.floor(z * 1.6), 3);
          const base = 0.6 + t * 0.05;
          col = joint ? [0.42, 0.41, 0.39] : [base, base * 0.96, base * 0.9];
        }
      }
      const i = (y * W + x) * 4;
      d[i] = toSrgb(col[0]);
      d[i + 1] = toSrgb(col[1]);
      d[i + 2] = toSrgb(col[2]);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Konturen: Beckenrand und Stufenkanten
  ctx.save();
  ctx.lineWidth = Math.max(1, scale * 0.02);
  ctx.strokeStyle = "rgba(31,37,43,0.55)";
  const path = (p) => {
    ctx.beginPath();
    p.forEach(([x, z], i) => (i ? ctx.lineTo(x * scale + ox, z * scale + oz) : ctx.moveTo(x * scale + ox, z * scale + oz)));
    ctx.closePath();
    ctx.stroke();
  };
  path(pts);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  for (const s of [...st, ...bk]) {
    for (let i = 0; i < s.pts.length; i++) {
      if (!edgeVisible(s, i)) continue;
      const [x1, z1] = s.pts[i];
      const [x2, z2] = s.pts[(i + 1) % s.pts.length];
      ctx.beginPath();
      ctx.moveTo(x1 * scale + ox, z1 * scale + oz);
      ctx.lineTo(x2 * scale + ox, z2 * scale + oz);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (split >= 0) drawSplit(ctx, split, H);
  return { scale, ox, oz, area: Math.abs(polygonArea(pts)) };
}

function drawSplit(ctx, x, H) {
  ctx.save();
  ctx.fillStyle = "rgba(250,248,244,0.95)";
  ctx.fillRect(x - 1, 0, 2, H);
  ctx.restore();
}
