#!/usr/bin/env node
// AR-Viewer Stufe 2: „AR-Foto in Originalgröße“ erzeugen.
//
// Für jedes Produkt mit Herstellermaßen (src/lib/arviewer/dims.json) und ohne
// Veränderungsverbot (src/lib/arviewer/rights.json):
//   1. erstes Produktbild aus dem Backoffice laden (nur GET)
//   2. mit der lokalen GPU-Pipeline freistellen (BiRefNet, MIT-Lizenz;
//      ../platzhirsch-gpu-tools, siehe Marktresearch/daten/gpu-pipeline.md)
//   3. GLB bauen: senkrechte Foto-Fläche in echter Höhe (Breite folgt dem
//      Bildformat) + Grundfläche B × T am Boden mit Haarlinie und weichem
//      Kontaktschatten, Materialien unbeleuchtet (KHR_materials_unlit), PNG mit
//      Alpha (Kern-glTF, damit Scene Viewer und Quick Look es lesen)
//   4. Poster (WebP mit Alpha) und Eintrag in src/lib/arviewer/arfotos.json
//
//   node scripts/arviewer/ar-foto.mjs                    # Pilot: alle Einträge in dims.json
//   node scripts/arviewer/ar-foto.mjs --only <path_field> # ein Produkt
//   node scripts/arviewer/ar-foto.mjs --plan [--cache <inventur-dir>]
//        # Lauf für das ganze Sortiment planen: je Produkt Status + Grund,
//        # Ausgabe .data/ar-viewer/arfoto-plan.json und Zusammenfassung je Marke
//   node scripts/arviewer/ar-foto.mjs --nur-usdz          # nur USDZ aus den vorhandenen GLB neu schreiben
//   --intern   erlaubt Marken mit Verbot (Minotti …) – Ausgabe dann NUR nach
//              .data/ar-viewer/intern/ (gitignored), nie nach public/ und nie ins Register
//   --cpu      Freistellen ohne GPU (sehr langsam, ca. 2 min/Bild)
//   GPU_TOOLS=<Pfad> überschreibt ../platzhirsch-gpu-tools
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { readGlb, writeUsdz } from "./lib/glb-usdz.mjs";

const ROOT = process.cwd();
const BASE = (process.env.BACKOFFICE || "https://backoffice.platzhirsch.studio").replace(/\/$/, "");
const DETAIL = `${BASE}/api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api.get_produkt_by_path_field_api?path_field=`;
const TOOLS = process.env.GPU_TOOLS || path.resolve(ROOT, "..", "platzhirsch-gpu-tools");
const PY = path.join(TOOLS, ".venv", "Scripts", "python.exe");
const FREISTELLEN = path.join(TOOLS, "scripts", "freistellen.py");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const INTERN = flag("--intern");

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const DIMS = readJson("src/lib/arviewer/dims.json");
const RIGHTS = readJson("src/lib/arviewer/rights.json");
const REG_PATH = path.join(ROOT, "src/lib/arviewer/arfotos.json");

const OUT_PUBLIC = path.join(ROOT, "public/labs/ar-viewer/fotos");
const OUT_INTERN = path.join(ROOT, ".data/ar-viewer/intern");
const WORK = path.join(ROOT, ".data/ar-viewer/work");

export const MIN_EDGE_PX = 1000; // darunter reicht ein Foto nicht für eine Karte in Originalgröße
export const TEX_MAX = 1024; // Texturkante der Foto-Fläche

// ---------------------------------------------------------------------------
// Entscheidung je Produkt (auch für --plan)
// ---------------------------------------------------------------------------
export function eligibility({ brand, dims, imageEdge, hasImage, rights, intern = false }) {
  const v = rights?.veraenderung || "unklar";
  if (v === "nein" && !intern) return { ok: false, grund: "verbot", text: `${brand} untersagt Veränderung` };
  if (!hasImage) return { ok: false, grund: "kein_bild", text: "kein Bild im Backoffice" };
  if (!dims) return { ok: false, grund: "keine_herstellermasse", text: "keine Herstellermaße mit Quelle" };
  if (imageEdge && imageEdge < MIN_EDGE_PX) return { ok: false, grund: "bild_zu_klein", text: `Bild ${imageEdge} px < ${MIN_EDGE_PX} px` };
  return { ok: true, grund: v === "nein" ? "intern" : "ok", text: v === "ja" ? "freigegeben" : v === "nein" ? "nur intern" : "Labs (Freigabe ausstehend)" };
}

// ---------------------------------------------------------------------------
// GLB-Writer (Kern-glTF 2.0, zwei Meshes, eingebettete PNGs)
// ---------------------------------------------------------------------------
function quad({ x0, x1, y0, y1, z0, z1, floor }) {
  // floor: liegt in XZ (Normalen +Y), sonst senkrecht in XY (Normalen +Z)
  const pos = floor
    ? [x0, y0, z1, x1, y0, z1, x1, y0, z0, x0, y0, z0]
    : [x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0];
  const nrm = floor ? [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0] : [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
  const uv = floor ? [0, 1, 1, 1, 1, 0, 0, 0] : [0, 1, 1, 1, 1, 0, 0, 0];
  return { pos, nrm, uv, idx: [0, 1, 2, 0, 2, 3] };
}

export function buildGlb({ photoPng, photoW, photoH, footPng, footW, footD, name, photoZ = 0 }) {
  const chunks = [];
  let offset = 0;
  const bufferViews = [];
  const accessors = [];
  const push = (buf, target) => {
    const pad = (4 - (buf.length % 4)) % 4;
    const view = { buffer: 0, byteOffset: offset, byteLength: buf.length };
    if (target) view.target = target;
    bufferViews.push(view);
    chunks.push(buf, Buffer.alloc(pad));
    offset += buf.length + pad;
    return bufferViews.length - 1;
  };
  const f32 = (a) => Buffer.from(new Float32Array(a).buffer);
  const u16 = (a) => Buffer.from(new Uint16Array(a).buffer);
  const addQuad = (q) => {
    const minmax = (arr) => {
      const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < arr.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], arr[i + k]); mx[k] = Math.max(mx[k], arr[i + k]); }
      return { min: mn, max: mx };
    };
    const p = accessors.push({ bufferView: push(f32(q.pos), 34962), componentType: 5126, count: 4, type: "VEC3", ...minmax(q.pos) }) - 1;
    const n = accessors.push({ bufferView: push(f32(q.nrm), 34962), componentType: 5126, count: 4, type: "VEC3" }) - 1;
    const t = accessors.push({ bufferView: push(f32(q.uv), 34962), componentType: 5126, count: 4, type: "VEC2" }) - 1;
    const i = accessors.push({ bufferView: push(u16(q.idx), 34963), componentType: 5123, count: 6, type: "SCALAR" }) - 1;
    return { attributes: { POSITION: p, NORMAL: n, TEXCOORD_0: t }, indices: i };
  };
  const w2 = photoW / 2;
  const photo = addQuad(quad({ x0: -w2, x1: w2, y0: 0, y1: photoH, z0: photoZ, floor: false }));
  const fw = footW / 2, fd = footD / 2;
  const foot = addQuad(quad({ x0: -fw, x1: fw, y0: 0.002, z0: -fd, z1: fd, floor: true }));
  const img0 = push(photoPng);
  const img1 = push(footPng);
  const mat = (tex, label) => ({
    name: label,
    pbrMetallicRoughness: { baseColorTexture: { index: tex }, metallicFactor: 0, roughnessFactor: 1 },
    alphaMode: "BLEND",
    doubleSided: true,
    extensions: { KHR_materials_unlit: {} },
  });
  const json = {
    asset: { version: "2.0", generator: "platzhirsch scripts/arviewer/ar-foto.mjs" },
    extensionsUsed: ["KHR_materials_unlit"],
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [
      { mesh: 1, name: "Grundflaeche" },
      { mesh: 0, name: `Foto ${name}` },
    ],
    meshes: [
      { name: "foto", primitives: [{ ...photo, material: 0 }] },
      { name: "grundflaeche", primitives: [{ ...foot, material: 1 }] },
    ],
    materials: [mat(0, "foto"), mat(1, "grundflaeche")],
    textures: [{ source: 0, sampler: 0 }, { source: 1, sampler: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [
      { bufferView: img0, mimeType: "image/png" },
      { bufferView: img1, mimeType: "image/png" },
    ],
    accessors,
    bufferViews,
    buffers: [{ byteLength: offset }],
  };
  const bin = Buffer.concat(chunks);
  let js = Buffer.from(JSON.stringify(json));
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const ch = (len, type) => {
    const b = Buffer.alloc(8);
    b.writeUInt32LE(len, 0);
    b.writeUInt32LE(type, 4);
    return b;
  };
  return Buffer.concat([header, ch(js.length, 0x4e4f534a), js, ch(bin.length, 0x004e4942), bin]);
}

/**
 * Größe der Foto-Fläche in Metern. Ein Produktfoto ist eine Perspektive, kein
 * Aufriss: Bei Aufsicht (Hocker, Tische) bläht die sichtbare Oberseite die
 * Bildhöhe auf, bei Liegen mit aufgestellter Lehne stimmt die Datenblatt-Höhe
 * nicht mit dem Foto überein. Deshalb: Höhe = Herstellerhöhe, aber die Breite
 * nie kleiner als 90 % der längsten Grundseite (dann wächst die Höhe mit).
 * Exakt ist nur die Grundfläche B × T am Boden.
 */
export function photoSize({ w, d, h }, aspect) {
  const byHeight = (h / 100) * aspect;
  const minWidth = (0.9 * Math.max(w, d)) / 100;
  const photoW = Math.max(byHeight, minWidth);
  return { photoW, photoH: photoW / aspect };
}

/** Grundfläche: B entlang x, T entlang z – außer bei langen Möbeln (T > 1,5 × B), die seitlich fotografiert sind. */
export function footprintAxes({ w, d }) {
  const laengs = d > 1.5 * w;
  return { x: laengs ? d : w, z: laengs ? w : d, laengs };
}

// Grundfläche: Haarlinie (line-strong, 40 %) + sehr leichte Fläche + weicher Kontaktschatten.
// QA R1 P2-4: die frühere dunkle Umrandung (85 %) verstärkte den Scherenschnitt-Effekt.
export async function footprintPng(wCm, dCm) {
  const W = 512;
  const H = Math.max(64, Math.min(1024, Math.round((W * dCm) / wCm)));
  const line = Math.max(2, Math.round((W / wCm) * 0.4)); // ~0,4 cm breite Haarlinie
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><radialGradient id="s" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#1f252b" stop-opacity="0.30"/>
      <stop offset="0.7" stop-color="#1f252b" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#1f252b" stop-opacity="0"/></radialGradient></defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#30373e" fill-opacity="0.06"/>
    <ellipse cx="${W / 2}" cy="${H / 2}" rx="${W * 0.46}" ry="${H * 0.42}" fill="url(#s)"/>
    <rect x="${line / 2}" y="${line / 2}" width="${W - line}" height="${H - line}" fill="none" stroke="#30373e" stroke-opacity="0.4" stroke-width="${line}"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

// ---------------------------------------------------------------------------
// Backoffice + GPU
// ---------------------------------------------------------------------------
async function detail(pathField) {
  const r = await fetch(DETAIL + encodeURIComponent(pathField), { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Detail ${r.status}`);
  return (await r.json()).message;
}

async function download(url, file) {
  const r = await fetch(BASE + encodeURI(url), { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`Bild ${r.status} ${url}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}

function cutout(inDir, outDir) {
  if (!fs.existsSync(PY) || !fs.existsSync(FREISTELLEN)) {
    throw new Error(`GPU-Pipeline nicht gefunden: ${PY} / ${FREISTELLEN} (siehe Marktresearch/daten/gpu-pipeline.md)`);
  }
  const a = ["-I", FREISTELLEN, inDir, outDir, "--max-kante", "2000"];
  if (flag("--cpu")) a.push("--device", "cpu");
  else a.push("--fp16");
  const t = Date.now();
  const r = spawnSync(PY, a, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`freistellen.py beendet mit ${r.status}`);
  return (Date.now() - t) / 1000;
}

// ---------------------------------------------------------------------------
// Pilot-Lauf
// ---------------------------------------------------------------------------
async function run() {
  const only = opt("--only");
  const entries = Object.entries(DIMS.produkte).filter(([p]) => !only || p === only);
  const inDir = path.join(WORK, "in");
  const outDir = path.join(WORK, "out");
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(inDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const jobs = [];
  const log = [];
  for (const [p, dims] of entries) {
    let d;
    try {
      d = await detail(p);
    } catch (e) {
      log.push({ produkt: p, status: "fehler", grund: e.message });
      continue;
    }
    const brand = d?.marken || "?";
    const first = (d?.bild_anhangen || []).find((b) => b?.bild_anhangen)?.bild_anhangen || null;
    const el = eligibility({ brand, dims, hasImage: Boolean(first), rights: RIGHTS.marken[brand], intern: INTERN });
    if (!el.ok) {
      log.push({ produkt: p, marke: brand, status: "übersprungen", grund: el.text });
      continue;
    }
    const ext = path.extname(first).toLowerCase() || ".jpg";
    const file = path.join(inDir, `${p}${ext}`);
    await download(first, file);
    const meta = await sharp(file).metadata();
    const edge = Math.max(meta.width || 0, meta.height || 0);
    if (edge < MIN_EDGE_PX) {
      log.push({ produkt: p, marke: brand, status: "übersprungen", grund: `Bild ${edge} px` });
      fs.rmSync(file);
      continue;
    }
    jobs.push({ p, dims, brand, first, intern: el.grund === "intern", edge });
  }
  if (!jobs.length) {
    console.log("Nichts zu tun.", log);
    return;
  }
  const seconds = cutout(inDir, outDir);
  console.log(`Freigestellt: ${jobs.length} Bilder in ${seconds.toFixed(1)} s`);

  fs.mkdirSync(OUT_PUBLIC, { recursive: true });
  const reg = JSON.parse(fs.readFileSync(REG_PATH, "utf8"));
  for (const j of jobs) {
    const png = path.join(outDir, `${j.p}.png`);
    if (!fs.existsSync(png)) {
      log.push({ produkt: j.p, marke: j.brand, status: "fehler", grund: "keine Maske erzeugt" });
      continue;
    }
    // Ränder abschneiden (voll transparent), dann Textur begrenzen.
    const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    const { width: tw, height: th } = trimmed.info;
    const tex = await sharp(trimmed.data)
      .resize({ width: TEX_MAX, height: TEX_MAX, fit: "inside", withoutEnlargement: true })
      .png({ palette: true, quality: 92, effort: 10, compressionLevel: 9 })
      .toBuffer();
    const poster = await sharp(trimmed.data).resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toBuffer();
    const { photoW, photoH } = photoSize(j.dims, tw / th);
    const foot = footprintAxes(j.dims);
    const glb = buildGlb({
      photoPng: tex,
      photoW,
      photoH,
      // Lange Möbel (Liegen) sind seitlich fotografiert: Länge (T) dann quer zur Kamera.
      footPng: await footprintPng(foot.x, foot.z),
      footW: foot.x / 100,
      footD: foot.z / 100,
      name: j.p,
      // QA R1 P2-4: Unterkante des Fotos an der Vorderkante der Grundfläche, nicht in der Mitte.
      photoZ: foot.z / 200,
    });
    const dir = j.intern ? OUT_INTERN : OUT_PUBLIC;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${j.p}.glb`), glb);
    fs.writeFileSync(path.join(dir, `${j.p}.webp`), poster);
    fs.writeFileSync(path.join(dir, `${j.p}.usdz`), writeUsdz(readGlb(glb), { name: j.p }));
    const fotoBreiteCm = Math.round(photoW * 100);
    const fotoHoeheCm = Math.round(photoH * 100);
    if (!j.intern) {
      reg.produkte[j.p] = {
        glb: `/labs/ar-viewer/fotos/${j.p}.glb`,
        poster: `/labs/ar-viewer/fotos/${j.p}.webp`,
        usdz: `/labs/ar-viewer/fotos/${j.p}.usdz`,
        w: j.dims.w,
        d: j.dims.d,
        h: j.dims.h,
        fotoBreiteCm,
        fotoHoeheCm,
        laengs: foot.laengs,
        marke: j.brand,
        bildQuelle: j.first,
        werkzeug: "BiRefNet (MIT), platzhirsch-gpu-tools/freistellen.py --fp16",
        erzeugt: new Date().toISOString().slice(0, 10),
      };
    }
    log.push({
      produkt: j.p,
      marke: j.brand,
      status: j.intern ? "intern" : "erzeugt",
      glbKB: Math.round(glb.length / 1024),
      posterKB: Math.round(poster.length / 1024),
      foto: `${fotoBreiteCm}×${fotoHoeheCm}`,
      masse: `${j.dims.w}×${j.dims.d}×${j.dims.h}`,
    });
  }
  reg.stand = new Date().toISOString().slice(0, 10);
  reg.produkte = Object.fromEntries(Object.entries(reg.produkte).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2) + "\n");
  fs.mkdirSync(path.join(ROOT, ".data/ar-viewer"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, ".data/ar-viewer/arfoto-lauf.json"), JSON.stringify({ datum: new Date().toISOString(), sekundenFreistellen: seconds, log }, null, 1));
  console.table(log);
}

// ---------------------------------------------------------------------------
// Plan für das ganze Sortiment
// ---------------------------------------------------------------------------
async function plan() {
  const cacheDir = opt("--cache");
  let products;
  let sizes = {};
  if (cacheDir) {
    products = fs
      .readdirSync(path.join(cacheDir, "brands"))
      .flatMap((f) => JSON.parse(fs.readFileSync(path.join(cacheDir, "brands", f), "utf8")).message || []);
    const det = path.join(cacheDir, "details.json");
    if (fs.existsSync(det)) {
      for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(det, "utf8")))) if (v.img?.w) sizes[k] = Math.max(v.img.w, v.img.h);
    }
  } else {
    const API = `${BASE}/api/method/platzhirsch_studio.platzhirsch_studio.doctype`;
    const marken = (await (await fetch(`${API}.marken.api.marken_data`)).json()).message;
    products = [];
    for (const m of marken.filter((x) => x.status === "Aktiv")) {
      const r = await fetch(`${API}.produkte_new.api.get_produkte_by_marke_api?marken=${encodeURIComponent(m.name)}`);
      products.push(...((await r.json()).message || []));
    }
  }
  const seen = new Set();
  const rows = [];
  for (const p of products) {
    if (p?.status !== "Aktiv" || !p.path_field || seen.has(p.path_field)) continue;
    seen.add(p.path_field);
    const hasImage = (p.bild_anhangen || []).some((b) => b?.bild_anhangen);
    const el = eligibility({
      brand: p.marken,
      dims: DIMS.produkte[p.path_field] || null,
      imageEdge: sizes[p.path_field] || null,
      hasImage,
      rights: RIGHTS.marken[p.marken],
      intern: INTERN,
    });
    rows.push({ produkt: p.path_field, marke: p.marken, ...el });
  }
  const byBrand = {};
  for (const r of rows) {
    const b = (byBrand[r.marke] ??= { produkte: 0 });
    b.produkte++;
    b[r.grund] = (b[r.grund] || 0) + 1;
  }
  const total = rows.reduce((acc, r) => ((acc[r.grund] = (acc[r.grund] || 0) + 1), acc), {});
  fs.mkdirSync(path.join(ROOT, ".data/ar-viewer"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, ".data/ar-viewer/arfoto-plan.json"), JSON.stringify({ datum: new Date().toISOString(), intern: INTERN, total, byBrand, rows }, null, 1));
  console.log("Gesamt", rows.length, total);
  console.table(byBrand);
}

// ---------------------------------------------------------------------------
// Neu aufbauen aus den vorhandenen GLBs (ohne erneutes Freistellen):
// Foto an die Vorderkante, Haarlinie 40 %, fertiges USDZ für Quick Look.
// ---------------------------------------------------------------------------
async function rebuild() {
  const reg = JSON.parse(fs.readFileSync(REG_PATH, "utf8"));
  for (const [p, a] of Object.entries(reg.produkte)) {
    const file = path.join(ROOT, "public", a.glb);
    const meshes = readGlb(fs.readFileSync(file));
    const photo = meshes.find((m) => /^Foto/.test(m.name));
    if (!photo) throw new Error(`${p}: keine Foto-Fläche`);
    const xs = photo.pos.filter((_, i) => i % 3 === 0);
    const ys = photo.pos.filter((_, i) => i % 3 === 1);
    const foot = footprintAxes(a);
    const glb = buildGlb({
      photoPng: photo.png,
      photoW: Math.max(...xs) - Math.min(...xs),
      photoH: Math.max(...ys) - Math.min(...ys),
      footPng: await footprintPng(foot.x, foot.z),
      footW: foot.x / 100,
      footD: foot.z / 100,
      name: p,
      photoZ: foot.z / 200,
    });
    fs.writeFileSync(file, glb);
    fs.writeFileSync(file.replace(/\.glb$/, ".usdz"), writeUsdz(readGlb(glb), { name: p }));
    a.usdz = a.glb.replace(/\.glb$/, ".usdz");
    a.fotoVorderkante = true;
    console.log(p, Math.round(glb.length / 1024), "KB");
  }
  fs.writeFileSync(REG_PATH, JSON.stringify(reg, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Nur USDZ neu schreiben (QA R2 P1-2: MaterialBindingAPI + extent), GLB bleibt unverändert.
// ---------------------------------------------------------------------------
async function nurUsdz() {
  const reg = JSON.parse(fs.readFileSync(REG_PATH, "utf8"));
  for (const [p, a] of Object.entries(reg.produkte)) {
    const file = path.join(ROOT, "public", a.glb);
    fs.writeFileSync(file.replace(/\.glb$/, ".usdz"), writeUsdz(readGlb(fs.readFileSync(file)), { name: p }));
    console.log(p, "USDZ neu");
  }
}

const main = flag("--plan") ? plan : flag("--neu-aus-glb") ? rebuild : flag("--nur-usdz") ? nurUsdz : run;
if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/arviewer/ar-foto.mjs")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
