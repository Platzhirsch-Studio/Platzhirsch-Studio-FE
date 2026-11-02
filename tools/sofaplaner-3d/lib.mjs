// Sofaplaner 3D – Konvertierungs-Pipeline (reiner Node-Teil, ohne Blender).
//
// Blender (blender_export.py) wandelt nur das Format (FBX/OBJ/3DS/DAE/…) in ein
// rohes GLB. Alles Weitere passiert hier und ist damit ohne Blender testbar
// (tests/unit/sofaplaner-3d-pipeline.test.mjs mit dem Test-Dummy aus
// tests/fixtures/sofaplaner-3d/):
//   1. Datei → Familie + Element (Ordnername, Dateiname, zuordnung.json)
//   2. Szene einlesen, Welt-Transformationen backen, Teile klassifizieren:
//      upholstery (Polster/Korpus), base (Sockel/Füße), piping (Keder)
//   3. Einheit erkennen (m/cm/mm/inch/ft) anhand der Herstellermaße der JSON,
//      Drehung (Breite entlang X, Rücken −Z, Front +Z), Ursprung = Mitte der
//      Grundfläche auf Bodenhöhe – wie die Element-Herkunft des Planers
//   4. Hand (SX/DX) aus Dateiname oder Geometrie (höhere Armlehne links = SX)
//   5. Bounding Box gegen JSON-Breite/-Tiefe/-Höhe (±2 cm), sonst Flag ok:false
//   6. Box-UVs in Metern für die Bezugstexturen, LODs (desktop ≤120k, mobile
//      ≤30k Dreiecke) mit dem meshopt-Simplifier, meshopt-Kompression
//   7. Manifest-Einträge
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Document, Logger, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression, EXTTextureWebP } from "@gltf-transform/extensions";
import { cloneDocument, dedup, meshopt, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { LICENCE_NOTE } from "../../src/lib/sofaplaner/modelle3d.js";

export const TOLERANCE_CM = 2;
export const LODS = {
  desktop: { max: 120_000, target: 100_000 },
  mobile: { max: 30_000, target: 25_000 },
};
export const FORMATS = {
  direct: [".glb", ".gltf"],
  blender: [".fbx", ".obj", ".3ds", ".dae", ".stl", ".ply", ".blend", ".usd", ".usdc", ".usdz", ".abc"],
  skip: {
    ".dwg": "DWG ist eine 2D-/CAD-Zeichnung ohne nutzbares Polstermodell – bitte die 3D-Variante (FBX/OBJ/3DS) herunterladen.",
    ".dxf": "DXF ist eine CAD-Zeichnung – bitte die 3D-Variante (FBX/OBJ/3DS) herunterladen.",
    ".skp": "SketchUp (.skp) kann Blender ohne Zusatz-Add-on nicht lesen – bitte FBX/OBJ wählen oder in SketchUp als FBX exportieren.",
    ".max": "3ds-Max-Szene (.max) ist ein geschlossenes Format – bitte die FBX-/OBJ-Variante herunterladen oder aus 3ds Max als FBX exportieren.",
    ".rfa": "Revit-Familie – bitte FBX/OBJ wählen.",
    ".3dm": "Rhino (.3dm) – bitte als FBX/OBJ exportieren.",
    ".pdf": "PDF ist kein 3D-Modell.",
  },
};

// --- Katalog ------------------------------------------------------------------
export const slugify = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/["'“”„]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** All research families: slug → { fam (normalised), raw (JSON) }. */
export function loadFamilies(dataDir) {
  const out = new Map();
  for (const f of readdirSync(dataDir).filter((x) => x.endsWith(".json"))) {
    const raw = JSON.parse(readFileSync(path.join(dataDir, f), "utf8"));
    const fam = normalizeFamily(structuredClone(raw));
    out.set(fam.slug, { fam, raw, file: f });
  }
  return out;
}

/** Family of a folder (or file) name: exact slug, then the longest slug/name contained in it. */
export function matchFamily(name, families) {
  const s = slugify(name);
  if (families.has(s)) return s;
  let best = null;
  for (const [slug, { fam }] of families) {
    for (const key of [slug, slugify(fam.name)]) {
      if (key && (s === key || s.startsWith(`${key}-`) || s.includes(`-${key}-`) || s.endsWith(`-${key}`)) && (!best || key.length > best.len)) best = { slug, len: key.length };
    }
  }
  return best?.slug || null;
}

// --- Datei → Element ------------------------------------------------------------
const STOP = new Set(["CM", "WITH", "AND", "THE", "OF", "X", "A", "1", "SX", "DX", "LEFT", "RIGHT", "MINOTTI", "3D", "MODEL", "MESH", "FBX", "OBJ", "MAX", "HIGH", "LOW", "POLY"]);
const SIDE_LEFT = /(?:^|[^A-Z])(SX|LEFT|SINISTR[OA]?|LINKS)(?=[^A-Z]|$)/;
const SIDE_RIGHT = /(?:^|[^A-Z])(DX|RIGHT|DESTR[OA]?|RECHTS)(?=[^A-Z]|$)/;

const upper = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[_\-.()[\]/\\,;:+"'“”„]+/g, " ");

export function sideHint(name) {
  const u = upper(name);
  const l = SIDE_LEFT.test(u),
    r = SIDE_RIGHT.test(u);
  return l && !r ? "SX" : r && !l ? "DX" : null;
}

const words = (s) =>
  new Set(
    upper(s)
      .split(/\s+/)
      .filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w))
  );
const numbers = (s) =>
  (
    upper(s)
      .replace(/(\d)X(\d)/g, "$1 $2")
      .match(/\d{2,3}(?:[.,]\d)?/g) || []
  ).map((n) => Number(n.replace(",", ".")));

/** Research code without the hand (…-SX → …). */
export const baseCode = (code) => String(code).replace(/-(SX|DX)$/, "");

/** Elements of a family grouped by research code without hand: groupKey → { els:[planner elements], codes:[srcCode] }. */
function groups(fam) {
  const g = new Map();
  for (const el of fam.elements) {
    if (el.role === "acc") continue;
    const key = baseCode(el.srcCode ?? el.code);
    if (!g.has(key)) g.set(key, { key, els: [], codes: new Set() });
    g.get(key).els.push(el);
    g.get(key).codes.add(el.srcCode ?? el.code);
  }
  return [...g.values()].map((x) => ({ ...x, codes: [...x.codes] }));
}

/**
 * Element group of a file name inside one family.
 * Score: width in the name (+5), depth (+1), shared type words (+4 × Jaccard).
 * @returns {{group, score, ambiguous:boolean} | null}
 */
export function matchElement(fileName, fam) {
  const fw = words(fileName);
  const nums = numbers(fileName);
  const scored = groups(fam)
    .map((g) => {
      const el = g.els[0];
      const ew = words(`${el.labelEn || ""} ${el.art || ""}`);
      const inter = [...ew].filter((w) => fw.has(w)).length;
      const union = new Set([...ew, ...fw]).size || 1;
      let score = (inter / union) * 4;
      if (el.w != null && nums.includes(Math.round(el.w))) score += 5;
      if (el.d != null && nums.includes(Math.round(el.d))) score += 1;
      return { group: g, score, inter };
    })
    .filter((x) => x.inter > 0 && x.score >= 5)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  const ambiguous = scored.length > 1 && scored[1].score >= scored[0].score - 1e-6;
  return { ...scored[0], ambiguous };
}

/** Minotti's model name from cad.modelle_3d for an element (side-free comparison), else the English element name. */
export function modelNameFor(el, raw) {
  const norm = (s) => upper(s).replace(SIDE_LEFT, " ").replace(SIDE_RIGHT, " ").replace(/\s+/g, " ").trim();
  const want = norm(el.labelEn || el.label);
  const list = Array.isArray(raw?.cad?.modelle_3d) ? raw.cad.modelle_3d : [];
  return list.find((m) => norm(m) === want) || el.labelEn || el.label;
}

// --- Geometrie ------------------------------------------------------------------
const UPH = /fabric|tessut|leather|pelle|cuoio|cushion|cuscin|seat|sedut|back(?!ground)|schienal|upholst|imbott|velvet|velluto|boucl|textile|stoff|leder|polster|kissen|bracciol|armrest|cloth/;
const PIPING = /piping|bordin|keder|welt|cording|profil[eo]?\b|passepoil/;
const BASE =
  /base|basament|feet|foot|piedi|piede|\bleg|gamb|metal|alumin|allumin|chrom|steel|acciaio|wood|legno|frassin|\bash\b|oak|rovere|walnut|noce|eucalipt|teak|iroko|marble|marmo|glass|vetro|plastic|glide|slider|lacc|vernic|bronz|brass|ottone|pewter|moka|brandy|sockel|fuss|füße|plinth|zoccol/;

/** Class of a part by its material/mesh/node names, null = decide by geometry later. */
export function classifyName(name) {
  const n = String(name || "").toLowerCase();
  if (PIPING.test(n)) return "piping";
  if (BASE.test(n) && !UPH.test(n)) return "base";
  if (UPH.test(n)) return "upholstery";
  if (BASE.test(n)) return "base";
  return null;
}

const mul = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
const mulDir = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];
const det3 = (m) => m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);

/** Reads a glTF document into flat parts in world space: { cls, pos:Float64Array, nrm?, uv?, idx:Uint32Array, matName, texture? }. */
export function readParts(doc) {
  const parts = [];
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const nodes = [];
  scene?.traverse((n) => n.getMesh() && nodes.push(n));
  for (const node of nodes) {
    const m = node.getWorldMatrix();
    const flip = det3(m) < 0;
    const mesh = node.getMesh();
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMode() !== 4) continue; // triangles only
      const P = prim.getAttribute("POSITION");
      if (!P) continue;
      const N = prim.getAttribute("NORMAL");
      const T = prim.getAttribute("TEXCOORD_0");
      const count = P.getCount();
      const pos = new Float64Array(count * 3);
      const nrm = N ? new Float64Array(count * 3) : null;
      const uv = T ? new Float32Array(count * 2) : null;
      const e = [0, 0, 0];
      for (let i = 0; i < count; i++) {
        P.getElement(i, e);
        const p = mul(m, e[0], e[1], e[2]);
        pos.set(p, i * 3);
        if (N) {
          N.getElement(i, e);
          const d = mulDir(m, e[0], e[1], e[2]);
          const l = Math.hypot(...d) || 1;
          nrm.set([d[0] / l, d[1] / l, d[2] / l], i * 3);
        }
        if (T) {
          T.getElement(i, e);
          uv[i * 2] = e[0];
          uv[i * 2 + 1] = e[1];
        }
      }
      let idx;
      const I = prim.getIndices();
      if (I) idx = Uint32Array.from(I.getArray());
      else idx = Uint32Array.from({ length: count }, (_, i) => i);
      if (flip) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
      const mat = prim.getMaterial();
      const matName = mat?.getName() || "";
      const label = `${matName} ${mesh.getName() || ""} ${node.getName() || ""}`;
      parts.push({
        cls: classifyName(matName) || classifyName(label),
        pos,
        nrm,
        uv,
        idx,
        matName,
        color: mat ? mat.getBaseColorFactor() : [0.8, 0.8, 0.8, 1],
        texture: mat?.getBaseColorTexture() || null,
      });
    }
  }
  return parts;
}

function extentOf(parts) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    for (let i = 0; i < p.pos.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = p.pos[i + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
      }
    }
  }
  return { min, max, size: max.map((v, k) => v - min[k]) };
}

export const UNIT_FACTORS = [
  { unit: "m", cm: 100 },
  { unit: "cm", cm: 1 },
  { unit: "mm", cm: 0.1 },
  { unit: "dm", cm: 10 },
  { unit: "inch", cm: 2.54 },
  { unit: "ft", cm: 30.48 },
];

/**
 * Unit of the raw model: the factor whose footprint (either orientation) and
 * height come closest to the published measures.
 * @param {number[]} size raw [x, y(up), z]
 * @param {{w:number,d:number,h:number|null}} expected cm
 */
export function detectUnit(size, expected) {
  const [sx, sy, sz] = size;
  let best = null;
  for (const f of UNIT_FACTORS) {
    const a = Math.abs(sx * f.cm - expected.w) + Math.abs(sz * f.cm - expected.d);
    const b = Math.abs(sz * f.cm - expected.w) + Math.abs(sx * f.cm - expected.d);
    const err = Math.min(a, b) + (expected.h != null ? Math.abs(sy * f.cm - expected.h) : 0);
    if (!best || err < best.err) best = { ...f, err };
  }
  return best;
}

function rotateY(parts, quarter) {
  if (!quarter) return;
  const a = (quarter * Math.PI) / 2;
  const c = Math.round(Math.cos(a)),
    s = Math.round(Math.sin(a));
  for (const p of parts) {
    for (const arr of [p.pos, p.nrm]) {
      if (!arr) continue;
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i],
          z = arr[i + 2];
        arr[i] = x * c + z * s;
        arr[i + 2] = -x * s + z * c;
      }
    }
  }
}

function scaleAndPlace(parts, k) {
  // k: metres per raw unit; afterwards: centre of the footprint at x=z=0, floor at y=0
  const ext0 = extentOf(parts);
  const cx = (ext0.min[0] + ext0.max[0]) / 2,
    cz = (ext0.min[2] + ext0.max[2]) / 2,
    y0 = ext0.min[1];
  for (const p of parts) {
    for (let i = 0; i < p.pos.length; i += 3) {
      p.pos[i] = (p.pos[i] - cx) * k;
      p.pos[i + 1] = (p.pos[i + 1] - y0) * k;
      p.pos[i + 2] = (p.pos[i + 2] - cz) * k;
    }
  }
}

/** Top-surface height grid (max y per cell), from vertices and triangle centroids. */
function heightGrid(parts, n = 16) {
  const { min, size } = extentOf(parts);
  const g = new Float64Array(n * n).fill(NaN);
  const put = (x, y, z) => {
    const i = Math.min(n - 1, Math.max(0, Math.floor(((x - min[0]) / (size[0] || 1)) * n)));
    const j = Math.min(n - 1, Math.max(0, Math.floor(((z - min[2]) / (size[2] || 1)) * n)));
    const k = j * n + i;
    if (!(g[k] >= y)) g[k] = y;
  };
  for (const p of parts) {
    const P = p.pos;
    for (let t = 0; t < p.idx.length; t += 3) {
      const a = p.idx[t] * 3,
        b = p.idx[t + 1] * 3,
        c = p.idx[t + 2] * 3;
      put(P[a], P[a + 1], P[a + 2]);
      put(P[b], P[b + 1], P[b + 2]);
      put(P[c], P[c + 1], P[c + 2]);
      // a few interior samples so large flat faces cover their cells
      for (const [u, v] of [
        [1 / 3, 1 / 3],
        [0.5, 0.25],
        [0.25, 0.5],
        [0.5, 0.5],
        [0.8, 0.1],
        [0.1, 0.8],
      ]) {
        const w = 1 - u - v;
        put(P[a] * w + P[b] * u + P[c] * v, P[a + 1] * w + P[b + 1] * u + P[c + 1] * v, P[a + 2] * w + P[b + 2] * u + P[c + 2] * v);
      }
    }
  }
  return { g, n };
}

const meanCells = ({ g, n }, pick) => {
  let s = 0,
    c = 0;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const v = g[j * n + i];
      if (pick(i / (n - 1), j / (n - 1)) && v === v) {
        s += v;
        c++;
      }
    }
  return c ? s / c : 0;
};

/**
 * Turns the parts so that the width runs along X and the backrest stands at −Z
 * (footprint ratio first, then the higher back zone). Returns the quarter turns.
 * @param {string} kind planner kind ("ecke" = corner piece with a second back)
 * @param {"SX"|"DX"|null} wantSide side of a corner element (back on that side)
 */
export function orient(parts, expected, kind, wantSide) {
  const { size } = extentOf(parts);
  const footprintErr = (q) => {
    const [x, z] = q % 2 ? [size[2], size[0]] : [size[0], size[2]];
    const r = x / (z || 1),
      er = expected.w / (expected.d || 1);
    return Math.abs(Math.log(r / er));
  };
  let best = null;
  for (let q = 0; q < 4; q++) {
    rotateY(parts, q);
    const hg = heightGrid(parts);
    // back at small z (−Z): rows near j=0
    let score = meanCells(hg, (u, v) => v < 0.3) - meanCells(hg, (u, v) => v > 0.7);
    if (kind === "ecke" && wantSide) {
      const sideBack = wantSide === "DX" ? meanCells(hg, (u) => u > 0.7) - meanCells(hg, (u) => u < 0.3) : meanCells(hg, (u) => u < 0.3) - meanCells(hg, (u) => u > 0.7);
      score += sideBack;
    }
    rotateY(parts, (4 - q) % 4);
    const fe = footprintErr(q);
    if (!best || fe < best.fe - 0.04 || (Math.abs(fe - best.fe) <= 0.04 && score > best.score)) best = { q, fe, score };
  }
  rotateY(parts, best.q);
  return best.q;
}

/** Hand of an end element from the geometry: the armrest side is higher in the front half. */
export function detectSide(parts) {
  const hg = heightGrid(parts);
  const front = (u, v) => v > 0.45;
  const left = meanCells(hg, (u, v) => u < 0.12 && front(u, v));
  const right = meanCells(hg, (u, v) => u > 0.88 && front(u, v));
  const { size } = extentOf(parts);
  const tol = size[1] * 0.08;
  if (left - right > tol) return "SX";
  if (right - left > tol) return "DX";
  return null;
}

/** Box-projected UVs in metres (same real-world scale on every surface – the cover textures rely on it). */
function boxUv(part) {
  const { pos, nrm } = part;
  const uv = new Float32Array((pos.length / 3) * 2);
  for (let i = 0, v = 0; i < pos.length; i += 3, v += 2) {
    const ax = Math.abs(nrm[i]),
      ay = Math.abs(nrm[i + 1]),
      az = Math.abs(nrm[i + 2]);
    if (ay >= ax && ay >= az) [uv[v], uv[v + 1]] = [pos[i], pos[i + 2]];
    else if (ax >= az) [uv[v], uv[v + 1]] = [pos[i + 2], pos[i + 1]];
    else [uv[v], uv[v + 1]] = [pos[i], pos[i + 1]];
  }
  return uv;
}

function vertexNormals(part) {
  const { pos, idx } = part;
  const n = new Float64Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3,
      b = idx[t + 1] * 3,
      c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a],
      uy = pos[b + 1] - pos[a + 1],
      uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a],
      vy = pos[c + 1] - pos[a + 1],
      vz = pos[c + 2] - pos[a + 2];
    const fx = uy * vz - uz * vy,
      fy = uz * vx - ux * vz,
      fz = ux * vy - uy * vx;
    for (const k of [a, b, c]) {
      n[k] += fx;
      n[k + 1] += fy;
      n[k + 2] += fz;
    }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l;
    n[i + 1] /= l;
    n[i + 2] /= l;
  }
  return n;
}

/** Parts without a class by name: low and close to the floor → base, else upholstery. */
function resolveClasses(parts) {
  for (const p of parts) {
    if (p.cls) continue;
    const e = extentOf([p]);
    p.cls = e.max[1] < 0.14 ? "base" : "upholstery";
  }
}

const CLASS_COLOR = {
  upholstery: [0.82, 0.8, 0.76, 1],
  piping: [0.7, 0.68, 0.64, 1],
  base: [0.18, 0.17, 0.16, 1],
};

/** New document with one mesh per class (upholstery, base, piping) under the root node "element". */
function buildDocument(parts) {
  const doc = new Document();
  doc.setLogger(new Logger(Logger.Verbosity.WARN));
  const buffer = doc.createBuffer();
  const scene = doc.createScene("sofaplaner");
  const root = doc.createNode("element");
  scene.addChild(root);
  for (const cls of ["upholstery", "base", "piping"]) {
    const list = parts.filter((p) => p.cls === cls);
    if (!list.length) continue;
    let vCount = 0,
      iCount = 0;
    for (const p of list) {
      vCount += p.pos.length / 3;
      iCount += p.idx.length;
    }
    const pos = new Float32Array(vCount * 3),
      nrm = new Float32Array(vCount * 3),
      uv = new Float32Array(vCount * 2);
    const idx = new Uint32Array(iCount);
    let vo = 0,
      io = 0;
    const textured = cls === "base" ? list.find((p) => p.texture && p.uv) : null;
    for (const p of list) {
      p.nrm ||= vertexNormals(p);
      const puv = cls === "base" && textured ? p.uv || new Float32Array((p.pos.length / 3) * 2) : boxUv(p);
      pos.set(p.pos, vo * 3);
      nrm.set(p.nrm, vo * 3);
      uv.set(puv, vo * 2);
      for (let i = 0; i < p.idx.length; i++) idx[io + i] = p.idx[i] + vo;
      vo += p.pos.length / 3;
      io += p.idx.length;
    }
    const mat = doc
      .createMaterial(cls)
      .setRoughnessFactor(cls === "base" ? 0.45 : 0.85)
      .setMetallicFactor(0);
    mat.setBaseColorFactor(cls === "base" ? list[0].color || CLASS_COLOR.base : CLASS_COLOR[cls]);
    if (textured) {
      const src = textured.texture;
      const tex = doc
        .createTexture(src.getName())
        .setImage(src.getImage())
        .setMimeType(src.getMimeType() || "image/png");
      mat.setBaseColorTexture(tex).setBaseColorFactor([1, 1, 1, 1]);
    }
    const prim = doc
      .createPrimitive()
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(pos).setBuffer(buffer))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(nrm).setBuffer(buffer))
      .setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(uv).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(idx).setBuffer(buffer))
      .setMaterial(mat);
    const mesh = doc.createMesh(cls).addPrimitive(prim);
    root.addChild(doc.createNode(cls).setMesh(mesh));
  }
  return doc;
}

export function triangleCount(doc) {
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const p of mesh.listPrimitives()) {
      const I = p.getIndices();
      n += Math.floor((I ? I.getCount() : p.getAttribute("POSITION").getCount()) / 3);
    }
  }
  return n;
}

export function boundsCm(doc) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const p of mesh.listPrimitives()) {
      const P = p.getAttribute("POSITION");
      const lo = P.getMin([]),
        hi = P.getMax([]);
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], lo[k]);
        max[k] = Math.max(max[k], hi[k]);
      }
    }
  }
  const r = (v) => Math.round(v * 1000) / 10;
  return {
    w: r(max[0] - min[0]),
    h: r(max[1] - min[1]),
    d: r(max[2] - min[2]),
  };
}

export function createIO() {
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
}

/**
 * Normalises one raw model (glTF document) for one planner element.
 * @param {Document} input
 * @param {{w:number,d:number,h:number|null, kind?:string, side?:string|null}} expected (cm)
 * @returns {{doc:Document, unit, quarterTurns:number, side:string|null, bbox, deviation, ok:boolean}}
 */
export function normalizeModel(input, expected) {
  const parts = readParts(input);
  if (!parts.length) throw new Error("keine Dreiecksgeometrie gefunden");
  const unit = detectUnit(extentOf(parts).size, expected);
  scaleAndPlace(parts, unit.cm / 100);
  const quarterTurns = orient(parts, expected, expected.kind, expected.side || null);
  scaleAndPlace(parts, 1); // re-centre after the turn
  resolveClasses(parts);
  const side = detectSide(parts);
  const doc = buildDocument(parts);
  const bbox = boundsCm(doc);
  const deviation = {
    w: Math.round((bbox.w - expected.w) * 10) / 10,
    d: Math.round((bbox.d - expected.d) * 10) / 10,
    h: expected.h != null ? Math.round((bbox.h - expected.h) * 10) / 10 : null,
  };
  const ok = Math.abs(deviation.w) <= TOLERANCE_CM && Math.abs(deviation.d) <= TOLERANCE_CM && (deviation.h == null || Math.abs(deviation.h) <= TOLERANCE_CM);
  return { doc, unit: unit.unit, quarterTurns, side, bbox, deviation, ok };
}

/** One LOD: weld, simplify to the target if above the cap, meshopt-compress. */
export async function buildLod(doc, lod) {
  const out = cloneDocument(doc);
  out.setLogger(new Logger(Logger.Verbosity.ERROR)); // quantize warns about metre UVs outside [0,1] – expected
  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;
  await out.transform(weld(), dedup());
  const tris = triangleCount(out);
  const cap = LODS[lod];
  if (tris > cap.max) {
    await out.transform(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: cap.target / tris,
        error: 0.01,
        lockBorder: false,
      })
    );
  }
  if (out.getRoot().listTextures().length) {
    // KTX2 needs the KTX-Software CLI (toktx); without it WebP keeps the textures small
    out.createExtension(EXTTextureWebP).setRequired(true);
    await out.transform(
      textureCompress({
        targetFormat: "webp",
        resize: lod === "mobile" ? [512, 512] : [1024, 1024],
      })
    );
  }
  // keepAttributes: the box UVs are used by the cover textures at runtime, not by a glTF texture
  await out.transform(prune({ keepAttributes: true }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  out.createExtension(EXTMeshoptCompression).setRequired(true);
  return { doc: out, tris: triangleCount(out) };
}

/** File name of a model in the public folder (relative to MODEL_BASE). */
export function modelFile(family, code, side, lod) {
  const withSide = side && !String(code).endsWith(`-${side}`) ? `${code}-${side}` : code;
  return `${family}/${withSide}.${lod}.glb`;
}

/**
 * Converts one raw glTF/GLB file for one element group and writes the LODs.
 * @returns manifest entries (one per LOD)
 */
export async function convertOne({ io, inputPath, family, fam, raw, group, side: sideFromName, outDir, source, writeFile }) {
  const el = group.els[0];
  // corner pieces: the hand decides where the second back goes – from the name, else SX
  const cornerSide = el.kind === "ecke" ? sideFromName || (group.els.length === 1 ? el.side : null) || "SX" : null;
  const expected = {
    w: el.w,
    d: el.d,
    h: el.h ?? null,
    kind: el.kind,
    side: cornerSide,
  };
  await MeshoptDecoder.ready; // sources may already be meshopt-compressed GLBs
  const input = await io.read(inputPath);
  const norm = normalizeModel(input, expected);
  // hand of the model: file name > geometry > element data
  const side = cornerSide || sideFromName || (group.els.some((e) => e.side) ? norm.side || (group.els.length === 1 ? el.side : null) || null : null);
  // concrete research code: the group's code of that hand, else the side-free code
  const code = group.codes.find((c) => side && c.endsWith(`-${side}`)) || group.codes.find((c) => !/-(SX|DX)$/.test(c)) || group.codes[0];
  const entries = [];
  for (const lod of Object.keys(LODS)) {
    const { doc, tris } = await buildLod(norm.doc, lod);
    const file = modelFile(family, code, side, lod);
    const bytes = await io.writeBinary(doc);
    await writeFile(path.join(outDir, file), bytes);
    entries.push({
      family,
      familyName: fam.name,
      code,
      side: side || null,
      modelName: modelNameFor(el, raw),
      file,
      lod,
      bbox: norm.bbox,
      expected: { w: expected.w, d: expected.d, h: expected.h },
      deviation: norm.deviation,
      ok: norm.ok,
      unit: norm.unit,
      quarterTurns: norm.quarterTurns,
      tris,
      bytes: bytes.byteLength,
      source,
      licence: LICENCE_NOTE,
    });
  }
  return entries;
}
