// Sofaplaner – one model family in English (Welle 2, team EN-Yacht-Sofa).
//
// Source of the English wording, in this order:
//  1. Element names: Minotti's own English names (labelEn = "name" in
//     src/lib/sofaplaner/minotti/*.json, taken from minotti.com/en product
//     pages and technical sheets – the URLs are in each family's `sources`).
//     Only reformatted: ALL CAPS → sentence case, "cm 214" → "214 cm",
//     side codes SX/DX dropped (the planner names the side itself).
//  2. Start shapes, kinds, measures: the planner's own interface (./ui-en.js).
//  3. Option names and specifications: ./glossary-en.js – translated only when
//     fully covered, otherwise the German original stays, flagged `de: true`
//     (the components render it with lang="de").
//  4. Character line on the model card: built from the published facts
//     (designer, year, modular/fixed, outdoor), no free text.
// Pure module, no React, usable on server and client.
import { UI_EN } from "./ui-en.js";
import { specEn } from "./glossary-en.js";

const KEEP_UPPER = /^(SX|DX|TOP|MOD\.?|[A-H]|HD|HR|PU|XL|XS|II|III|IV|LED|US|UK|EU)$/;

/** Sentence case for an ALL-CAPS manufacturer name; codes stay upper case. */
function sentenceCase(t) {
  if (t !== t.toUpperCase() || !/[A-Z]/.test(t)) return t;
  let first = true;
  return t
    .split(/(\s+|[-–/()"“”])/)
    .map((w) => {
      if (!/[A-Za-z]/.test(w)) return w;
      if (KEEP_UPPER.test(w)) return w;
      const low = w.toLowerCase();
      if (first) {
        first = false;
        return low.charAt(0).toUpperCase() + low.slice(1);
      }
      return low;
    })
    .join("")
    .replace(/\btop ([a-h])\b/gi, (m, l) => `Top ${l.toUpperCase()}`);
}

/** Minotti's English element name, tidied for the customer view. */
export function enElementLabel(el) {
  const src = String(el?.labelEn || "").trim();
  if (!src) return el?.label || el?.code || "";
  let t = sentenceCase(src);
  t = t
    .replace(/\bcm\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/gi, "$1 × $2 cm")
    .replace(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/gi, "$1 × $2 cm")
    .replace(/\bcm\s*(\d+(?:[.,]\d+)?)/gi, "$1 cm")
    .replace(/(\d)\s*CM\b/g, "$1 cm")
    .replace(/\s*[-–]?\s*\b(SX|DX)\b\s*$/i, "")
    .replace(/\s+\b(SX|DX)\b(?=\s|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return t.replace(/^./, (c) => c.toUpperCase());
}

const tr = (s) => (s == null ? s : UI_EN[s] ?? s);

/** Names and designers: English quotation marks, "mit"/"und" between designers. */
export const quotesEn = (s) => (s == null ? s : String(s).replace(/„([^“”"]*)[“”"]/g, "“$1”"));
export const designerEn = (s) => (s == null ? s : quotesEn(s).replace(/ mit /g, " with ").replace(/ und /g, " and "));

function optionEn(o) {
  const l = specEn(o.label);
  const d = o.detail ? specEn(o.detail) : { text: o.detail, de: false };
  return { ...o, label: l.text, labelDe: o.label, de: l.de || undefined, detail: d.text, detailDe: d.de || undefined };
}

const listEn = (list) => (list || []).map((x) => specEn(x));

/** Cover collection: name, material, category – English where fully covered, else German flagged. */
function collectionEn(c) {
  const n = specEn(c.name);
  const m = specEn(c.material);
  const k = c.category ? specEn(c.category) : { text: c.category, de: false };
  const de = n.de || m.de || k.de;
  return de ? { ...c, de: true } : { ...c, name: n.text, material: m.text, category: k.text };
}

/** Character line of a model card from published facts only. */
export function characterEn(f) {
  const parts = [];
  parts.push(f.modular ? "Modular seating system" : "Sofa in a fixed size");
  if (f.outdoor) parts.push("for outdoors");
  if (f.sofabed) parts.push("with sleeping function");
  return parts.join(" ");
}

/** One client family (catalog.server clientFamily) in English. Idempotent. */
export function localizeFamily(fam) {
  if (!fam || fam.lang === "en") return fam;
  const o = fam.options || {};
  const cover = o.cover || {};
  const coverList = (k) => listEn(cover[k]);
  const types = coverList("types");
  const variants = coverList("variants");
  return {
    ...fam,
    lang: "en",
    name: quotesEn(fam.name),
    designer: designerEn(fam.designer),
    character: characterEn(fam),
    typDe: fam.typ,
    elements: (fam.elements || []).map((e) => ({ ...e, label: enElementLabel(e), labelDe: e.label })),
    templates: (fam.templates || []).map((t) => ({ ...t, label: tr(t.label), hint: tr(t.hint) })),
    options: {
      ...o,
      back: (o.back || []).map(optionEn),
      arm: (o.arm || []).map(optionEn),
      base: (o.base || []).map(optionEn),
      cushions: (o.cushions || []).map(optionEn),
      padding: (o.padding || []).map(optionEn),
      cover: {
        ...cover,
        categories: coverList("categories").map((x) => x.text),
        categoriesDe: coverList("categories").some((x) => x.de) || undefined,
        // types/variants are stored in the plan as their text: keep the German
        // value as id, show the English text (LookPanel strOpts)
        types: cover.types,
        variants: cover.variants,
        typesEn: types.map((x) => x.text),
        variantsEn: variants.map((x) => x.text),
        typesDe: types.map((x) => x.de),
        variantsDe: variants.map((x) => x.de),
        notes: coverList("notes").map((x) => x.text),
        notesDe: coverList("notes").map((x) => x.de),
        collections: (cover.collections || []).map(collectionEn),
        brand: (cover.brand || []).map(collectionEn),
      },
    },
  };
}

/** Model picker index entries in English (character line only). */
export function localizeIndex(index) {
  return (index || []).map((f) => ({ ...f, name: quotesEn(f.name), designer: designerEn(f.designer), character: characterEn(f) }));
}
