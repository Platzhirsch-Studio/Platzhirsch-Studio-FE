// src/lib/shop/dimensions.js
// Product dimensions from the backoffice field `additional_information[0].
// dimensions` (free text, ~110 formats across 961 of 1,765 products, survey
// 26.10.2026) → a table and, where the data is unambiguous, width/height/
// depth for the Product JSON-LD (R4-produkt, masterplan AP4).
//
// Principle: nothing is invented or guessed.
// - Only LABELLED values become table rows ("Width: 242 cm", "W. 242",
//   "B 120 cm", "Höhe (mm): 450", "Ø 40"). Unlabelled strings like
//   "220 x 98 x 74 cm" or "Ø 40 x 60 cm" have no stated order – they stay
//   as the raw text (null result), never mapped to width/depth/height.
// - If any part of the string cannot be read, the whole string falls back to
//   the raw text (null) – a half-read table would misstate the product.
// - mm are converted to cm (exact, /10); a trailing inch conversion
//   ("| 28in", "(W 30 x D 20 in)") is dropped when the cm values are there.
// - JSON-LD gets only width/height/depth that occur once, without a variant
//   or component group (sizes S/M/L, "Shade: …", "Kopfteil X – Höhe"),
//   as a single number in cm.
//
// Pure module (no "@/", no server-only): loaded by node --test
// (tests/unit/r4-produkt.test.mjs).

// Label → key. Keys match the dim.* translations (ShopCatalog/copy.js,
// messages-r4-produkt.json). Lower-case, trailing "." and ":" stripped.
const LABELS = new Map(
  Object.entries({
    width: "width", w: "width", breite: "width", b: "width", larghezza: "width", largeur: "width",
    depth: "depth", d: "depth", tiefe: "depth", t: "depth", profondità: "depth", profondeur: "depth",
    height: "height", h: "height", höhe: "height", höhen: "height", hoehe: "height", altezza: "height", hauteur: "height",
    length: "length", l: "length", länge: "length", laenge: "length", lunghezza: "length", longueur: "length",
    diameter: "diameter", ø: "diameter", durchmesser: "diameter", diametro: "diameter", diamètre: "diameter",
    "seat height": "seat height", sh: "seat height", sitzhöhe: "seat height",
    "seat depth": "seat depth", sd: "seat depth", sitztiefe: "seat depth",
    "seat width": "seat width", sw: "seat width", sitzbreite: "seat width",
    "arm height": "arm height", ah: "arm height", armhöhe: "arm height", "armrest height": "arm height",
    stärke: "thickness", thickness: "thickness",
    gewicht: "weight", weight: "weight",
    kabellänge: "cable length", "cable length": "cable length",
    "baldachin-länge": "canopy length", "canopy length": "canopy length",
  })
);
// Qualifiers in front of a label ("max W.", "min H.", "Bottom Ø").
const QUALIFIERS = new Set(["min", "max", "bottom", "top"]);
// Text-valued fields that may sit between the measures (cable colour …).
const TEXT_LABELS = new Map(
  Object.entries({ kabelfarbe: "cable colour", "cable colour": "cable colour", "canopy farbe": "canopy colour", "canopy colour": "canopy colour" })
);

const NUM = String.raw`\d+(?:[.,]\d+)?`;
const toNumber = (s) => Number(String(s).replace(",", "."));
const round1 = (n) => Math.round(n * 10) / 10;

function keyOf(label) {
  const words = String(label || "").toLowerCase().replace(/[.:]+$/g, "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  let qualifier = null;
  if (words.length > 1 && QUALIFIERS.has(words[0])) qualifier = words.shift();
  const base = LABELS.get(words.join(" ").replace(/\.$/, ""));
  if (!base) return null;
  return qualifier ? `${qualifier} ${base}` : base;
}

// "242", "12,5", "200-240", "200 bis 240" → { value } | { range }
function readValue(raw) {
  const s = raw.trim();
  let m = s.match(new RegExp(`^(${NUM})$`));
  if (m) return { value: toNumber(m[1]) };
  m = s.match(new RegExp(`^(${NUM})\\s*(?:-|–|bis|to)\\s*(${NUM})$`, "i"));
  if (m) return { range: [toNumber(m[1]), toNumber(m[2])] };
  // "120 oder 140", "71, 91, 101 oder 121", "13 und 26" → alternatives
  if (new RegExp(String.raw`^${NUM}(?:\s*(?:,|oder|und)\s*${NUM})+$`, "i").test(s)) {
    return { values: s.match(new RegExp(NUM, "g")).map(toNumber) };
  }
  // Bed headboards: "Nennmaß + 20" = nominal (mattress) width plus 20 cm
  m = s.match(new RegExp(String.raw`^Nennma(?:ß|ss)e?\s*\+\s*(${NUM})$`, "i"));
  if (m) return { nominalPlus: toNumber(m[1]) };
  return null;
}

function scale(v, unit) {
  const f = unit === "mm" ? 0.1 : 1;
  const out = { unit: unit === "mm" ? "cm" : unit };
  if (v.value != null) out.value = round1(v.value * f);
  if (v.range) out.range = v.range.map((n) => round1(n * f));
  if (v.values) out.values = v.values.map((n) => round1(n * f));
  if (v.nominalPlus != null) out.nominalPlus = round1(v.nominalPlus * f);
  return out;
}

// One token: "Width: 242 cm", "W. 242", "B 120", "Höhe (mm): 450", "Ø 40",
// "Height : 70 cm", "Höhe von 25 cm", "Kabelfarbe: Black". `unit` is the
// unit stated at the end of the part (applies to tokens without their own).
function readToken(token, partUnit) {
  // "Höhe von 25 cm" = "Höhe: 25 cm"
  const t = token.trim().replace(/\s+von\s+(?=\d)/i, ": ");
  if (!t) return { skip: true };
  // Text-valued field.
  const text = t.match(/^([A-Za-zÀ-ÿ -]+?)\s*:\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ -]*)$/);
  if (text && TEXT_LABELS.has(text[1].toLowerCase().trim())) {
    return { row: { key: TEXT_LABELS.get(text[1].toLowerCase().trim()), text: text[2].trim() } };
  }
  // Label (unit) : value [unit]
  const m = t.match(
    new RegExp(
      String.raw`^([A-Za-zÀ-ÿØø][A-Za-zÀ-ÿØø.-]*(?:\s[A-Za-zÀ-ÿØø][A-Za-zÀ-ÿØø.-]*)?)\s*(?:\((mm|cm|kg)\))?\s*(?::|=|von|–|-)?\s*(${NUM}(?:\s*(?:-|–|bis|,|oder|und)\s*${NUM})*|Nennma(?:ß|ss)e?\s*\+\s*${NUM})\s*(mm|cm|kg)?$`,
      "i"
    )
  );
  if (!m) return null;
  const key = keyOf(m[1]);
  if (!key) return null;
  const v = readValue(m[3]);
  if (!v) return null;
  const unit = (m[2] || m[4] || (key === "weight" ? "kg" : partUnit) || "").toLowerCase();
  if (!unit) return null;
  if (key === "weight" && unit !== "kg") return null;
  if (key !== "weight" && unit === "kg") return null;
  return { row: { key, ...scale(v, unit) } };
}

// One part of the string (between " / "), optionally with a group prefix
// ("S:", "Shade:", "Kopfteil Victoire – …").
function readPart(part) {
  let s = part.trim();
  // Leading variant/component name: "S: L. 120 | …", "Shade: Bottom Ø 40 | …"
  let group = null;
  const g = s.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ]{0,20}):\s+(?=[A-Za-zÀ-ÿØø])/);
  if (g && !TEXT_LABELS.has(g[1].toLowerCase().trim())) {
    group = g[1].trim();
    s = s.slice(g[0].length);
  }
  // Unit stated once at the end ("W. 242 | D. 98 | H. 74 cm").
  const end = s.match(/\b(cm|mm)\s*$/i);
  const partUnit = end ? end[1].toLowerCase() : null;
  const rows = [];
  for (const raw of s.split(/\s*\|\s*|\s*·\s*|,\s+(?=[A-Za-zÀ-ÿØø])|\s+x\s+(?=[A-Za-zÀ-ÿØø])/)) {
    let token = raw.trim();
    // "Kopfteil Victoire – Höhe: 25 cm" / "Trecaflex Box – Höhe – 30 cm"
    let tokenGroup = group;
    const comp = token.match(/^(.+?)\s+–\s+(?=[A-Za-zÀ-ÿØø].*\d)/);
    if (comp && !keyOf(comp[1]) && /^[A-Za-zÀ-ÿ]/.test(comp[1])) {
      tokenGroup = [group, comp[1].trim()].filter(Boolean).join(" · ");
      token = token.slice(comp[0].length);
    }
    const r = readToken(token, partUnit);
    if (!r) return null;
    if (r.skip) continue;
    rows.push({ ...r.row, group: tokenGroup });
  }
  return rows;
}

/**
 * @param {string|null} raw  backoffice dimensions text
 * @returns {null | { rows: Array<{key, value?, range?, text?, unit?, group}>, notes: string[] }}
 *   null = nothing labelled to show (or not readable) → render the raw text.
 */
export function parseDimensionTable(raw) {
  if (typeof raw !== "string" || !/\d/.test(raw)) return null;
  let s = raw.replace(/\s+/g, " ").trim();
  const notes = [];
  // "dimensions may vary by up to 5%" and similar remarks.
  s = s.replace(/\s*\|\s*([^|]*\d+\s*%[^|]*)$/i, (_, note) => {
    notes.push(note.trim());
    return "";
  });
  const hasCm = /\b(cm|mm)\b/i.test(s);
  // Inch conversions next to the cm values.
  if (hasCm) {
    s = s.replace(/\s*\((?:[^)]*\d[^)]*)\bin\)/gi, "").replace(/\s*\|\s*\d+(?:[.,]\d+)?\s*in\b/gi, "");
  }
  const rows = [];
  for (const part of s.split(/\s+\/\s+/)) {
    const r = readPart(part);
    if (!r) return null;
    rows.push(...r);
  }
  if (!rows.some((r) => r.value != null || r.range || r.values || r.nominalPlus != null)) return null;
  return { rows, notes };
}

// Flat { width: 242, depth: 98, height: 74, "seat height": 40 } of the
// ungrouped numeric cm rows (first occurrence), for the drawing and the
// one-line summary. Same shape as the old parseDimensions().
export function dimensionsSummaryMap(table) {
  if (!table) return null;
  const out = {};
  for (const r of table.rows) {
    if (r.group || r.value == null || r.unit !== "cm" || r.key in out) continue;
    out[r.key] = r.value;
  }
  return Object.keys(out).length ? out : null;
}

const JSON_LD_KEYS = ["width", "height", "depth"];

/**
 * Product JSON-LD properties width/height/depth as QuantitativeValue (cm,
 * UN/CEFACT code CMT) – only keys that occur exactly once, ungrouped, as a
 * single number. Also weight (KGM) under the same rule. {} when nothing fits.
 */
export function dimensionsJsonLd(table) {
  if (!table) return {};
  const out = {};
  for (const key of [...JSON_LD_KEYS, "weight"]) {
    // Grouped rows (variant S/M/L, component "Shade") never count; the
    // product-level value must be unique.
    const rows = table.rows.filter((r) => r.key === key && !r.group);
    if (rows.length !== 1) continue;
    const [r] = rows;
    if (r.value == null || r.range) continue;
    if (key === "weight" ? r.unit !== "kg" : r.unit !== "cm") continue;
    out[key] = { "@type": "QuantitativeValue", value: r.value, unitCode: key === "weight" ? "KGM" : "CMT", unitText: r.unit };
  }
  return out;
}

/** Weight from the separate backoffice field ("3.3 kg") as { value, unit } or null. */
export function parseWeight(raw) {
  const m = typeof raw === "string" ? raw.trim().match(new RegExp(`^(${NUM})\\s*kg$`, "i")) : null;
  return m ? { value: toNumber(m[1]), unit: "kg" } : null;
}

// Table rows for the "Maße" block: label and formatted value (locale number
// format, unit), group headers for sizes/components. null → raw text.
const DIM_QUALIFIERS = ["min", "max", "bottom", "top"];
export function formatDimensionRows(table, locale, tc, dimLabel) {
  if (!table?.rows?.length) return null;
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const fmt = (n) => nf.format(n);
  const label = (key) => {
    const [first, ...rest] = key.split(" ");
    if (rest.length && DIM_QUALIFIERS.includes(first)) return tc(`atelier.dimQualifier.${first}`, { label: dimLabel(rest.join(" ")) });
    return dimLabel(key);
  };
  return table.rows.map((r) => {
    let value;
    if (r.text != null) value = r.text;
    else if (r.nominalPlus != null) value = tc("atelier.dimNominalPlus", { n: fmt(r.nominalPlus) });
    else if (r.range) value = `${fmt(r.range[0])}–${fmt(r.range[1])} ${r.unit}`;
    else if (r.values) value = `${r.values.map(fmt).join(" / ")} ${r.unit}`;
    else value = `${fmt(r.value)} ${r.unit}`;
    return { group: r.group || null, label: label(r.key), value };
  });
}
