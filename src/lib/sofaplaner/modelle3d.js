// Sofaplaner 3D – Zuordnung Planelement → Original-3D-Modell (Minotti).
//
// Die Modelle selbst kommen NICHT aus dem Repo: der Inhaber lädt Minottis
// offizielle 3D-Dateien im Händlerbereich herunter (urheberrechtlich geschützt,
// öffentliche Nutzung nur mit schriftlicher Freigabe), legt sie in
// Herstellermaterial/Minotti/3d/ ab und konvertiert sie mit
// tools/sofaplaner-3d/convert.mjs nach public/labs/sofaplaner/modelle/ –
// siehe docs/sofaplaner-3d-modelle.md. Das Manifest dort ist die einzige
// Quelle dieses Moduls.
//
// Konvention der konvertierten GLBs (identisch mit der Element-Herkunft des
// Planers, model.js/geometry.js): Ursprung = Mitte der Grundfläche auf
// Bodenhöhe, Breite entlang X, Front +Z (Sitzseite), Rücken −Z, Einheit Meter
// (glTF). SX = Armlehne/Abschluss links (−X, vom Sitzenden aus rechts), wie
// topology() in geometry.js.
//
// Reines Modul ohne three.js – Preview3D und die Unit-Tests nutzen es.

export const MODEL_BASE = "/labs/sofaplaner/modelle";
export const MANIFEST_URL = `${MODEL_BASE}/manifest.json`;
export const LICENCE_NOTE = "Minotti S.p.A. – Nutzung mit Freigabe";

const SIDE_RE = /-(SX|DX)$/;

/** Research code of a planner element (planner codes of derived sides carry an extra -SX/-DX). */
export function sourceCode(el) {
  if (!el?.code) return null;
  const code = String(el.code);
  if (el.sideDerived && el.side && code.endsWith(`-${el.side}`)) return code.slice(0, -(el.side.length + 1));
  return code;
}

/** Same code for the other hand (…-SX ↔ …-DX), or null when the code carries no side. */
export function otherSideCode(code) {
  const m = SIDE_RE.exec(String(code || ""));
  if (!m) return null;
  return String(code).replace(SIDE_RE, m[1] === "SX" ? "-DX" : "-SX");
}

/** Planner tier → model level of detail. */
export function lodFor(tier) {
  return tier === "low" ? "mobile" : "desktop";
}

/**
 * Index of a manifest. Only usable when the owner confirmed the written
 * permission (manifest.freigabe === true) and only entries whose bounding box
 * matched the published measures (ok === true) – everything else stays
 * schematic.
 */
export function indexManifest(manifest) {
  const map = new Map();
  if (!manifest || manifest.freigabe !== true || !Array.isArray(manifest.models)) return map;
  for (const m of manifest.models) {
    if (!m || m.ok !== true || !m.family || !m.code || !m.file) continue;
    const key = `${m.family}|${m.code}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  return map;
}

function pickLod(list, lod) {
  return list.find((m) => m.lod === lod) || list.find((m) => m.lod === "desktop") || list[0] || null;
}

/** Entry with its side of the element: same side first, then a side-neutral model, then the other hand. */
function bestFor(list, wanted) {
  if (!list?.length) return null;
  if (!wanted) return { list, side: list[0].side || null };
  const same = list.filter((m) => m.side === wanted);
  if (same.length) return { list: same, side: wanted };
  const neutral = list.filter((m) => !m.side);
  if (neutral.length) return { list: neutral, side: null };
  return { list, side: list[0].side };
}

/**
 * Original model for one plan element.
 * @param {Map} index  from indexManifest()
 * @param {string} family  plan.family (slug)
 * @param {object} el  planner element (lookup(item.code)): code, side, sideDerived
 * @param {{lod?: "desktop"|"mobile"}} [opt]
 * @returns {null | {url:string, file:string, lod:string, mirrored:boolean, entry:object}}
 *   mirrored = the model shows the other hand and must be mirrored on X.
 */
export function findModel(index, family, el, opt = {}) {
  if (!index?.size || !family || !el) return null;
  const lod = opt.lod || "desktop";
  const src = sourceCode(el);
  const wanted = el.side || null;
  // 1) same research code (side-neutral code, or the matching hand)
  let hit = bestFor(index.get(`${family}|${src}`), wanted);
  let viaOther = false;
  // 2) explicit other-hand code (…-SX for a …-DX element): mirror it
  if (!hit) {
    const other = otherSideCode(src);
    if (other) {
      hit = bestFor(index.get(`${family}|${other}`), null);
      viaOther = !!hit;
    }
  }
  if (!hit) return null;
  const entry = pickLod(hit.list, lod);
  if (!entry) return null;
  const mirrored = viaOther ? true : Boolean(wanted && hit.side && hit.side !== wanted);
  return {
    url: `${MODEL_BASE}/${entry.file}`,
    file: entry.file,
    lod: entry.lod,
    mirrored,
    entry,
  };
}

/** Counts for the 3D legend: how many plan elements are shown as original model vs. schematic. */
export function modelCoverage(index, family, items, lookup) {
  let real = 0,
    schematic = 0;
  for (const it of items || []) {
    const el = lookup(it.code);
    if (!el) continue;
    if (findModel(index, family, el)) real += 1;
    else schematic += 1;
  }
  return { real, schematic };
}
