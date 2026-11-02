#!/usr/bin/env node
// AR-Viewer Stufe 2b „Raumbedarf in Originalgröße“ erzeugen – ganz ohne Herstellerbild.
//
// Für jedes Produkt mit Herstellermaßen (src/lib/arviewer/dims.json):
//   GLB  Grundfläche B × T am Boden (Haarlinie, Maße) + halbtransparenter Quader bis H
//        (fünf Flächen mit Haarlinien-Kanten, Bone-Ton, KHR_materials_unlit), auf der
//        Vorderseite Marke, Produkt und B × T × H als Text-Label. Alles innerhalb des
//        Quaders, damit die Bounding Box exakt den Herstellermaßen entspricht.
//   USDZ dieselbe Geometrie für AR Quick Look (iPhone/iPad), fertig auf dem Server
//   WebP Poster: maßstäbliche Axonometrie des Quaders mit Maßen (kein Foto)
//   Eintrag in src/lib/arviewer/raumbedarf.json
// Da kein Bild verwendet oder verändert wird, gilt das auch für Marken mit
// Bearbeitungsverbot (Minotti, Poliform …); im Rechte-Register als
// „raumbedarf: ohne Bildnutzung“ vermerkt.
//
//   node scripts/arviewer/raumbedarf.mjs [--only <path_field>] [--names <cache-dir>] [--snapshot <sortiment-snapshot.json>]
//   --snapshot     Namen aus dem letzten vollständigen Sortiment-Stand des AR-Viewers (ohne Netz)
// QA R2 P2-1: Profil aus Datenblatt-Werten (profilWerte/profilBlocks) und weitere Größen je Familie.
//   --names <dir>  Produkt- und Markennamen aus einer Inventur (brands/*.json) statt live (GET)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { writeGlb, writeUsdz } from "./lib/glb-usdz.mjs";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const BASE = (process.env.BACKOFFICE || "https://backoffice.platzhirsch.studio").replace(/\/$/, "");
const API = `${BASE}/api/method/platzhirsch_studio.platzhirsch_studio.doctype`;
const OUT = path.join(ROOT, "public/labs/ar-viewer/raum");
const REG = path.join(ROOT, "src/lib/arviewer/raumbedarf.json");

const INK = "#30373e";
const INK_DEEP = "#1f252b";
const BONE = "#f7f5f1";
const FONT = "Instrument Sans, Segoe UI, Helvetica, Arial, sans-serif";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const fmtCm = (v) => `${Number.isInteger(v) ? v : String(Math.round(v * 10) / 10).replace(".", ",")}`;

// ---------------------------------------------------------------------------
// Geometrie (rein, getestet)
// ---------------------------------------------------------------------------
/** Quader B × T × H (cm) → fünf Flächen + Boden, Mitte der Grundfläche im Ursprung. */
export function boxFaces({ w, d, h }) {
  const x = w / 200, z = d / 200, y = h / 100;
  const q = (pos, nrm) => ({ pos, nrm: [...nrm, ...nrm, ...nrm, ...nrm], uv: [0, 1, 1, 1, 1, 0, 0, 0], idx: [0, 1, 2, 0, 2, 3] });
  return {
    boden: q([-x, 0.002, z, x, 0.002, z, x, 0.002, -z, -x, 0.002, -z], [0, 1, 0]),
    front: q([-x, 0, z, x, 0, z, x, y, z, -x, y, z], [0, 0, 1]),
    back: q([x, 0, -z, -x, 0, -z, -x, y, -z, x, y, -z], [0, 0, -1]),
    links: q([-x, 0, -z, -x, 0, z, -x, y, z, -x, y, -z], [-1, 0, 0]),
    rechts: q([x, 0, z, x, 0, -z, x, y, -z, x, y, z], [1, 0, 0]),
    oben: q([-x, y, z, x, y, z, x, y, -z, -x, y, -z], [0, 1, 0]),
  };
}

// ---------------------------------------------------------------------------
// Profil aus Datenblatt-Werten (QA R2 P2-1) – nur Geometrie, kein Bild, nichts geschätzt
// ---------------------------------------------------------------------------
const num = (v) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);

/**
 * Profilwerte eines Elements aus dem Sofaplaner-Datensatz. Nur Werte, die am Element
 * selbst stehen (null = im Datenblatt nicht eindeutig → bleibt null, keine Übernahme
 * von Familien-Standardwerten, keine Schätzung).
 */
export function profilWerte(el, { w, d, h }) {
  if (!el) return null;
  const sitzhoehe = num(el.sitzhoehe_cm);
  const sitztiefe = num(el.sitztiefe_cm);
  const armlehnenhoehe = num(el.armlehnenhoehe_cm);
  const innen = num(el.sitzbreite_innen_cm) ?? num(el.innen_sitzbreite_cm);
  const ok = (v, max) => v !== null && v < max;
  const p = {
    sitzhoehe: ok(sitzhoehe, h) ? sitzhoehe : null,
    sitztiefe: ok(sitztiefe, d) ? sitztiefe : null,
    armlehnenhoehe: ok(armlehnenhoehe, h + 0.01) ? armlehnenhoehe : null,
    armlehnenbreite: innen !== null && innen < w ? Math.round(((w - innen) / 2) * 10) / 10 : null,
  };
  if (!p.sitzhoehe && !p.armlehnenhoehe) return null;
  // „stufen“: echte Sitz-/Rücken-(/Armlehnen-)Blöcke, nur wenn Sitzhöhe UND Sitztiefe belegt sind.
  // Sonst „linien“: der Quader bleibt, Sitz- und Armlehnenhöhe als Linien auf den Seiten.
  p.art = p.sitzhoehe && p.sitztiefe ? "stufen" : "linien";
  return p;
}

/** Quader zwischen zwei Ecken (cm, Ursprung: Mitte der Grundfläche, +Z = vorne). */
export function blockFaces([x0, y0, z0], [x1, y1, z1], { boden = false } = {}) {
  const X0 = x0 / 100, X1 = x1 / 100, Y0 = y0 / 100, Y1 = y1 / 100, Z0 = z0 / 100, Z1 = z1 / 100;
  const q = (pos, nrm) => ({ pos, nrm: [...nrm, ...nrm, ...nrm, ...nrm], uv: [0, 1, 1, 1, 1, 0, 0, 0], idx: [0, 1, 2, 0, 2, 3] });
  const f = {
    front: q([X0, Y0, Z1, X1, Y0, Z1, X1, Y1, Z1, X0, Y1, Z1], [0, 0, 1]),
    back: q([X1, Y0, Z0, X0, Y0, Z0, X0, Y1, Z0, X1, Y1, Z0], [0, 0, -1]),
    links: q([X0, Y0, Z0, X0, Y0, Z1, X0, Y1, Z1, X0, Y1, Z0], [-1, 0, 0]),
    rechts: q([X1, Y0, Z1, X1, Y0, Z0, X1, Y1, Z0, X1, Y1, Z1], [1, 0, 0]),
    oben: q([X0, Y1, Z1, X1, Y1, Z1, X1, Y1, Z0, X0, Y1, Z0], [0, 1, 0]),
  };
  if (boden) f.boden = q([X0, 0.002, Z1, X1, 0.002, Z1, X1, 0.002, Z0, X0, 0.002, Z0], [0, 1, 0]);
  return f;
}

/** Blöcke des Stufenprofils in cm: Sitz (volle Fläche bis Sitzhöhe), Rücken (hinten), Armlehnen. */
export function profilBlocks({ w, d, h, profil }) {
  const x = w / 2, z = d / 2;
  if (!profil || profil.art !== "stufen") return [{ rolle: "quader", a: [-x, 0, -z], b: [x, h, z] }];
  const sh = profil.sitzhoehe, rueck = d - profil.sitztiefe;
  const out = [
    { rolle: "sitz", a: [-x, 0, -z], b: [x, sh, z] },
    { rolle: "ruecken", a: [-x, sh, -z], b: [x, h, -z + rueck] },
  ];
  const ah = profil.armlehnenhoehe, aw = profil.armlehnenbreite;
  if (ah && aw && ah > sh && aw * 2 < w) {
    out.push({ rolle: "arm-links", a: [-x, sh, -z + rueck], b: [-x + aw, ah, z] });
    out.push({ rolle: "arm-rechts", a: [x - aw, sh, -z + rueck], b: [x, ah, z] });
  }
  return out;
}

const PX_PER_M = 360;
const texSize = (aCm, bCm) => {
  const s = Math.min(1, 1024 / (Math.max(aCm, bCm) / 100 * PX_PER_M));
  return [Math.max(96, Math.round((aCm / 100) * PX_PER_M * s)), Math.max(96, Math.round((bCm / 100) * PX_PER_M * s))];
};

function faceSvg(W, H, { label = null, rund = false, fill = 0.34 } = {}) {
  const lw = Math.max(2, Math.round(Math.min(W, H) / 110));
  const shape = rund
    ? `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2 - lw}" ry="${H / 2 - lw}" fill="${BONE}" fill-opacity="${fill}" stroke="${INK}" stroke-opacity="0.8" stroke-width="${lw}"/>
       <rect x="${lw / 2}" y="${lw / 2}" width="${W - lw}" height="${H - lw}" fill="none" stroke="${INK}" stroke-opacity="0.28" stroke-width="${Math.max(1, lw / 2)}" stroke-dasharray="${lw * 4} ${lw * 3}"/>`
    : `<rect x="0" y="0" width="${W}" height="${H}" fill="${BONE}" fill-opacity="${fill}"/>
       <rect x="${lw / 2}" y="${lw / 2}" width="${W - lw}" height="${H - lw}" fill="none" stroke="${INK}" stroke-opacity="0.8" stroke-width="${lw}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shape}${label || ""}</svg>`;
}

async function png(svg) {
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toBuffer();
}

/** Höhenlinien (Sitz-/Armlehnenhöhe) auf einer senkrechten Fläche W × H px, die hCm hoch ist. */
function hoehenLinien(W, H, hCm, profil, { text = true } = {}) {
  if (!profil || profil.art !== "linien") return "";
  const fs = Math.max(11, Math.min(W / 16, H / 11));
  const lw = Math.max(2, Math.round(Math.min(W, H) / 120));
  return [
    [profil.sitzhoehe, "Sitzhöhe"],
    [profil.armlehnenhoehe, "Armlehne"],
  ]
    .filter(([v]) => v && v < hCm)
    .map(([v, t]) => {
      const y = H - (v / hCm) * H;
      return `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="${INK}" stroke-opacity="0.85" stroke-width="${lw}" stroke-dasharray="${lw * 5} ${lw * 3}"/>${
        text
          ? `<text x="${(fs * 0.6).toFixed(1)}" y="${(y - fs * 0.45).toFixed(1)}" font-family="${FONT}" font-size="${fs.toFixed(1)}" font-weight="600" fill="${INK_DEEP}">${t} ${fmtCm(v)} cm</text>`
          : ""
      }`;
    })
    .join("");
}

/**
 * Beschriftung vorne, senkrecht (QA R2 P2-1.3): Marke, Produkt, B × T × H auf einer fast
 * deckenden Bone-Fläche, damit sie in AR auch im Gegenlicht lesbar bleibt.
 */
function frontLabel(fw, fh, p, { mitte = 0.5 } = {}) {
  const fs1 = Math.max(12, Math.min(fw / 12, fh / 6.2));
  const lines = [
    [p.brand.toUpperCase(), fs1 * 0.62, 600, 0.8, "0.14em"],
    [p.name, fs1, 600, 1, "0"],
    [`B ${fmtCm(p.w)} × T ${fmtCm(p.d)} × H ${fmtCm(p.h)} cm`, fs1 * 0.66, 500, 0.95, "0"],
  ];
  const total = lines.reduce((a, l) => a + l[1] * 1.35, 0);
  const plateH = total + fs1 * 0.9;
  const plateW = Math.min(fw * 0.92, Math.max(...lines.map(([t, s]) => String(t).length * s * 0.56)) + fs1 * 1.6);
  const cy = Math.min(fh - plateH / 2 - 4, Math.max(plateH / 2 + 4, fh * (1 - mitte)));
  let y = cy - total / 2 + lines[0][1];
  const text = lines
    .map(([t, size, weight, op, ls]) => {
      const out = `<text x="${fw / 2}" y="${y.toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-size="${size.toFixed(1)}" font-weight="${weight}" letter-spacing="${ls}" fill="${INK_DEEP}" fill-opacity="${op}">${esc(t)}</text>`;
      y += size * 1.35;
      return out;
    })
    .join("");
  return `<rect x="${(fw - plateW) / 2}" y="${(cy - plateH / 2).toFixed(1)}" width="${plateW.toFixed(1)}" height="${plateH.toFixed(1)}" fill="${BONE}" fill-opacity="0.92"/>${text}`;
}

/** Texturen: Front mit Marke/Produkt/Maßen, Boden mit Breite und Tiefe, Seiten mit Höhenlinien. */
export async function textures(p) {
  const { w, d, h } = p;
  const [fw, fh] = texSize(w, h);
  const [bw, bd] = texSize(w, d);
  const fsb = Math.max(11, Math.min(bw, bd) / 9);
  const pad = fsb * 0.7;
  const bodenLabel = `
    <text x="${bw / 2}" y="${bd - pad}" text-anchor="middle" font-family="${FONT}" font-size="${fsb.toFixed(1)}" font-weight="600" fill="${INK_DEEP}">${p.rund ? "Ø " : ""}${fmtCm(w)} cm</text>
    ${p.rund ? "" : `<text transform="translate(${bw - pad} ${bd / 2}) rotate(-90)" text-anchor="middle" font-family="${FONT}" font-size="${fsb.toFixed(1)}" font-weight="600" fill="${INK_DEEP}">${fmtCm(d)} cm</text>`}`;
  const [sw, sh] = texSize(d, h);
  const [tw, td] = texSize(w, d);
  // Bei Höhenlinien steht die Beschriftung über der Sitzhöhe, sonst auf halber Höhe.
  const mitte = p.profil?.art === "linien" && p.profil.sitzhoehe ? Math.min(0.78, (p.profil.sitzhoehe / h + 1) / 2) : 0.5;
  return {
    front: await png(faceSvg(fw, fh, { label: hoehenLinien(fw, fh, h, p.profil, { text: false }) + frontLabel(fw, fh, p, { mitte }), fill: 0.42 })),
    back: await png(faceSvg(fw, fh, { label: hoehenLinien(fw, fh, h, p.profil, { text: false }) })),
    seite: await png(faceSvg(sw, sh, { label: hoehenLinien(sw, sh, h, p.profil) })),
    oben: await png(faceSvg(tw, td, { rund: p.rund })),
    boden: await png(faceSvg(bw, bd, { label: bodenLabel, rund: p.rund, fill: 0.55 })),
  };
}

/** Stufenprofil: je Block eigene Haarlinien-Texturen, Beschriftung vorne am Sitz. */
async function stufenMeshes(p) {
  const blocks = profilBlocks(p);
  const meshes = [];
  const [bw, bd] = texSize(p.w, p.d);
  const fsb = Math.max(11, Math.min(bw, bd) / 9);
  const pad = fsb * 0.7;
  const bodenLabel = `
    <text x="${bw / 2}" y="${bd - pad}" text-anchor="middle" font-family="${FONT}" font-size="${fsb.toFixed(1)}" font-weight="600" fill="${INK_DEEP}">${fmtCm(p.w)} cm</text>
    <text transform="translate(${bw - pad} ${bd / 2}) rotate(-90)" text-anchor="middle" font-family="${FONT}" font-size="${fsb.toFixed(1)}" font-weight="600" fill="${INK_DEEP}">${fmtCm(p.d)} cm</text>`;
  const sitz = blocks.find((b) => b.rolle === "sitz");
  const fb = blockFaces(sitz.a, sitz.b, { boden: true });
  meshes.push({ name: "Grundflaeche", ...fb.boden, png: await png(faceSvg(bw, bd, { label: bodenLabel, fill: 0.55 })) });
  // Reihenfolge: hinten zuerst, Front des Sitzes (mit Beschriftung) zuletzt
  const order = ["ruecken", "arm-links", "arm-rechts", "sitz"];
  for (const rolle of order) {
    const b = blocks.find((x) => x.rolle === rolle);
    if (!b) continue;
    const bw2 = b.b[0] - b.a[0], bh = b.b[1] - b.a[1], bdp = b.b[2] - b.a[2];
    const f = blockFaces(b.a, b.b);
    const [fw, fh] = texSize(bw2, bh);
    const [sw, sh] = texSize(bdp, bh);
    const [tw, td] = texSize(bw2, bdp);
    const N = rolle.replace(/-/g, "_");
    let frontLbl = null;
    if (rolle === "sitz") frontLbl = frontLabel(fw, fh, p);
    if (rolle === "ruecken") {
      const fs = Math.max(11, Math.min(fw / 16, fh / 6));
      frontLbl = `<text x="${fw / 2}" y="${(fh / 2 + fs * 0.35).toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-size="${fs.toFixed(1)}" font-weight="600" fill="${INK_DEEP}" fill-opacity="0.85">Höhe ${fmtCm(p.h)} cm</text>`;
    }
    const sideLbl =
      rolle === "sitz"
        ? (() => {
            const fs = Math.max(11, Math.min(sw / 12, sh / 4.5));
            return `<text x="${(sw / 2).toFixed(1)}" y="${(sh / 2 + fs * 0.35).toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-size="${fs.toFixed(1)}" font-weight="600" fill="${INK_DEEP}">Sitzhöhe ${fmtCm(p.profil.sitzhoehe)} cm</text>`;
          })()
        : null;
    const fill = rolle === "sitz" ? 0.46 : 0.36;
    meshes.push({ name: `${N}_hinten`, ...f.back, png: await png(faceSvg(fw, fh, { fill })) });
    meshes.push({ name: `${N}_links`, ...f.links, png: await png(faceSvg(sw, sh, { fill, label: sideLbl })) });
    meshes.push({ name: `${N}_rechts`, ...f.rechts, png: await png(faceSvg(sw, sh, { fill, label: sideLbl })) });
    meshes.push({ name: `${N}_oben`, ...f.oben, png: await png(faceSvg(tw, td, { fill })) });
    meshes.push({ name: `${N}_vorne`, ...f.front, png: await png(faceSvg(fw, fh, { fill: rolle === "sitz" ? 0.5 : fill, label: frontLbl })) });
  }
  return meshes;
}

export async function buildRaumbedarf(p) {
  let meshes;
  if (p.profil?.art === "stufen") {
    meshes = await stufenMeshes(p);
  } else {
    const f = boxFaces(p);
    const t = await textures(p);
    // Reihenfolge: undurchsichtigste zuletzt (Alpha-Sortierung in model-viewer je Objekt)
    meshes = [
      { name: "Grundflaeche", ...f.boden, png: t.boden },
      { name: "Rueckseite", ...f.back, png: t.back },
      { name: "Links", ...f.links, png: t.seite },
      { name: "Rechts", ...f.rechts, png: t.seite },
      { name: "Oben", ...f.oben, png: t.oben },
      { name: "Vorderseite", ...f.front, png: t.front },
    ];
  }
  return { glb: writeGlb(meshes, { generator: "platzhirsch scripts/arviewer/raumbedarf.mjs" }), usdz: writeUsdz(meshes, { name: `${p.brand} ${p.name}` }) };
}

/** Poster: Axonometrie (30°) mit Maßketten, 900 × 900, transparent; Profil/Höhenlinien, wenn belegt. */
export function posterSvg({ w, d, h, rund, profil = null }) {
  const S = 900;
  const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
  const P = (x, y, z) => [(x - z) * c, -(y) + (x + z) * s];
  const pts = [];
  for (const x of [0, w]) for (const y of [0, h]) for (const z of [0, d]) pts.push(P(x, y, z));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = (S * 0.62) / Math.max(maxX - minX, maxY - minY);
  const ox = S / 2 - ((minX + maxX) / 2) * k, oy = S * 0.5 - ((minY + maxY) / 2) * k;
  const T = (x, y, z) => P(x, y, z).map((v, i) => (i ? oy + v * k : ox + v * k).toFixed(1)).join(",");
  const poly = (a, op, fill) => `<polygon points="${a.map((p) => T(...p)).join(" ")}" fill="${fill}" fill-opacity="${op}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  const floor = rund
    ? (() => {
        const e = [];
        for (let i = 0; i < 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          e.push(T(w / 2 + (Math.cos(a) * w) / 2, 0, d / 2 + (Math.sin(a) * d) / 2));
        }
        return `<polygon points="${e.join(" ")}" fill="${INK}" fill-opacity="0.08" stroke="${INK}" stroke-width="2.4"/>`;
      })()
    : poly([[0, 0, 0], [w, 0, 0], [w, 0, d], [0, 0, d]], 0.08, INK);
  const label = (x1, y1, z1, x2, y2, z2, text, dx, dy) => {
    const [ax, ay] = T(x1, y1, z1).split(",").map(Number);
    const [bx, by] = T(x2, y2, z2).split(",").map(Number);
    const mx = (ax + bx) / 2 + dx, my = (ay + by) / 2 + dy;
    return `<line x1="${ax + dx * 0.55}" y1="${ay + dy * 0.55}" x2="${bx + dx * 0.55}" y2="${by + dy * 0.55}" stroke="${INK}" stroke-opacity="0.55" stroke-width="1.6"/>
      <text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-size="30" font-weight="600" fill="${INK_DEEP}">${text}</text>`;
  };
  // Körper: Quader oder Stufenblöcke (Poster-Koordinaten: Ursprung hinten links, z nach vorne)
  const box = (x0, y0, z0, x1, y1, z1) =>
    [
      poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], 0.5, BONE),
      poly([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], 0.32, BONE),
      poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], 0.7, BONE),
    ].join("");
  let body;
  let extra = "";
  if (profil?.art === "stufen") {
    const blocks = profilBlocks({ w, d, h, profil });
    const order = ["sitz", "ruecken", "arm-links", "arm-rechts"];
    body = order
      .map((r) => blocks.find((b) => b.rolle === r))
      .filter(Boolean)
      .map((b) => box(b.a[0] + w / 2, b.a[1], b.a[2] + d / 2, b.b[0] + w / 2, b.b[1], b.b[2] + d / 2))
      .join("");
    extra = label(w, 0, d, w, profil.sitzhoehe, d, `${fmtCm(profil.sitzhoehe)}`, 40, 0);
  } else {
    body = box(0, 0, 0, w, h, d);
    if (profil?.art === "linien") {
      extra = [profil.sitzhoehe, profil.armlehnenhoehe]
        .filter((v) => v && v < h)
        .map(
          (v) =>
            `<polyline points="${T(0, v, d)} ${T(w, v, d)} ${T(w, v, 0)}" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="10 7" stroke-opacity="0.85"/>` +
            (() => {
              const [x, y] = T(w, v, 0).split(",").map(Number);
              return `<text x="${x + 12}" y="${y}" dominant-baseline="middle" font-family="${FONT}" font-size="26" font-weight="600" fill="${INK_DEEP}">${fmtCm(v)}</text>`;
            })()
        )
        .join("");
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${floor}
    ${body}
    ${extra}
    ${label(0, 0, d, w, 0, d, `${rund ? "Ø " : ""}${fmtCm(w)} cm`, -34, 46)}
    ${rund ? "" : label(w, 0, d, w, 0, 0, `${fmtCm(d)} cm`, 52, 40)}
    ${label(0, 0, d, 0, h, d, `${fmtCm(h)} cm`, -96, 0)}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Lauf
// ---------------------------------------------------------------------------
const MAX_GROESSEN = 4; // je Produkt höchstens 4 weitere Größen als eigene AR-Datei (Budget)
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function names() {
  const dir = opt("--names");
  const snap = opt("--snapshot");
  const rows = [];
  if (snap) {
    // letzter vollständiger Stand des AR-Viewers (.data/ar-viewer/sortiment-snapshot.json)
    for (const list of Object.values(JSON.parse(fs.readFileSync(snap, "utf8")).rows || {})) rows.push(...list);
  } else if (dir) {
    for (const f of fs.readdirSync(path.join(dir, "brands"))) rows.push(...(JSON.parse(fs.readFileSync(path.join(dir, "brands", f), "utf8")).message || []));
  } else {
    const marken = (await (await fetch(`${API}.marken.api.marken_data`)).json()).message;
    for (const m of marken.filter((x) => x.status === "Aktiv")) {
      const r = await fetch(`${API}.produkte_new.api.get_produkte_by_marke_api?marken=${encodeURIComponent(m.name)}`);
      rows.push(...((await r.json()).message || []));
    }
  }
  return new Map(rows.filter((p) => p.status === "Aktiv").map((p) => [p.path_field, p]));
}

// Gleiche Bereinigung wie src/lib/content/brands.js (ohne Server-Import)
const cleanName = (name) =>
  String(name || "")
    .replace(/\s*\((?:[A-Za-zÄÖÜäöüß& ]+?)(?: \d+)?\)\s*$/u, "")
    .replace(/\s*\((?:variant|variante)\s*\d*\)\s*$/iu, "")
    .trim() || String(name || "").trim();

const docCache = new Map();
function elementFor(d, { code = null, modell = null } = {}) {
  if (!d.dokument || !/\.json$/.test(d.dokument)) return null;
  if (!docCache.has(d.dokument)) {
    const file = path.join(ROOT, d.dokument);
    docCache.set(d.dokument, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null);
  }
  const doc = docCache.get(d.dokument);
  const els = doc?.elemente || [];
  if (code) return els.find((e) => e.code === code) || null;
  if (modell) return els.find((e) => e.name === modell || e.name_de === modell || e.name_hersteller === modell) || null;
  return null;
}

async function run() {
  const DIMS = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/arviewer/dims.json"), "utf8")).produkte;
  const old = fs.existsSync(REG) ? JSON.parse(fs.readFileSync(REG, "utf8")) : { produkte: {} };
  const only = opt("--only");
  const cat = await names();
  fs.mkdirSync(OUT, { recursive: true });
  const reg = { $note: "", stand: "", produkte: {} };
  const log = [];
  let bytes = 0;
  for (const [pf, d] of Object.entries(DIMS)) {
    if (only && pf !== only) continue;
    const prod = cat.get(pf);
    // Name aus dem Katalog; ist das Produkt dort gerade nicht, aus dem letzten Register-Eintrag.
    if (!prod && !old.produkte[pf]?.name) {
      log.push([pf, "nicht (mehr) im Katalog"]);
      continue;
    }
    const brand = prod ? (prod.marken === "Paola Lenti" ? "Paola Lenti" : prod.marken) : old.produkte[pf].marke;
    const name = prod ? cleanName(prod.produkt_name) : old.produkte[pf].name;
    const el = elementFor(d, { code: d.element });
    const p = { w: d.w, d: d.d, h: d.h, rund: Boolean(d.rund), brand, name, profil: d.rund ? null : profilWerte(el, d) };
    const { glb, usdz } = await buildRaumbedarf(p);
    const poster = await sharp(Buffer.from(posterSvg(p))).webp({ quality: 88, alphaQuality: 95 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${pf}.glb`), glb);
    fs.writeFileSync(path.join(OUT, `${pf}.usdz`), usdz);
    fs.writeFileSync(path.join(OUT, `${pf}.webp`), poster);
    bytes += glb.length + usdz.length + poster.length;
    // Weitere Größen (QA R2 P2-1.2): eigene GLB/USDZ je Größe, gleiche Familie, Maße aus dims.json.
    const groessen = [];
    const seen = new Set([`${d.w}x${d.d}x${d.h}`]);
    for (const a of (d.alternativen || []).filter((x) => num(x.w) && num(x.d) && num(x.h))) {
      const key = `${a.w}x${a.d}x${a.h}`;
      if (seen.has(key) || groessen.length >= MAX_GROESSEN) continue;
      seen.add(key);
      const ael = elementFor(d, { modell: a.modell });
      const ap = { ...p, w: a.w, d: a.d, h: a.h, profil: d.rund ? null : profilWerte(ael, a) };
      const id = `${pf}--${slug(a.modell) || key}`;
      const out = await buildRaumbedarf(ap);
      fs.writeFileSync(path.join(OUT, `${id}.glb`), out.glb);
      fs.writeFileSync(path.join(OUT, `${id}.usdz`), out.usdz);
      bytes += out.glb.length + out.usdz.length;
      groessen.push({
        modell: a.modell,
        w: a.w,
        d: a.d,
        h: a.h,
        glb: `/labs/ar-viewer/raum/${id}.glb`,
        usdz: `/labs/ar-viewer/raum/${id}.usdz`,
        profil: ap.profil ? ap.profil.art : undefined,
      });
    }
    reg.produkte[pf] = {
      glb: `/labs/ar-viewer/raum/${pf}.glb`,
      usdz: `/labs/ar-viewer/raum/${pf}.usdz`,
      poster: `/labs/ar-viewer/raum/${pf}.webp`,
      w: d.w,
      d: d.d,
      h: d.h,
      rund: p.rund || undefined,
      marke: brand,
      name,
      modell: d.modell || null,
      profil: p.profil ? { ...p.profil, quelle: d.quelle } : undefined,
      groessen: groessen.length ? groessen : undefined,
      bildnutzung: "keine",
      erzeugt: new Date().toISOString().slice(0, 10),
    };
    log.push([pf, `${p.profil?.art || "quader"} · GLB ${Math.round(glb.length / 1024)} KB, USDZ ${Math.round(usdz.length / 1024)} KB, Poster ${Math.round(poster.length / 1024)} KB, Größen ${groessen.length}`]);
  }
  if (only) reg.produkte = { ...old.produkte, ...reg.produkte };
  reg.$note =
    "Erzeugt von scripts/arviewer/raumbedarf.mjs. Stufe 2b: Grundfläche + halbtransparenter Quader in Originalgröße aus dims.json (Herstellermaße mit Quelle), ohne Herstellerbild. profil.art = stufen (Sitz/Rücken/Armlehnen aus Datenblatt-Werten des Elements) bzw. linien (Sitz-/Armlehnenhöhe als Linien); ohne Werte bleibt der Quader. groessen = weitere Größen der Familie als eigene AR-Dateien. GLB für model-viewer/Scene Viewer, USDZ für AR Quick Look, Poster = Axonometrie.";
  reg.stand = new Date().toISOString().slice(0, 10);
  reg.produkte = Object.fromEntries(Object.entries(reg.produkte).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(REG, JSON.stringify(reg, null, 2) + "\n");
  for (const l of log) console.log(l.join(" – "));
  console.log(`${Object.keys(reg.produkte).length} Produkte im Register, ${Math.round(bytes / 1024)} KB Dateien.`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/arviewer/raumbedarf.mjs")) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
