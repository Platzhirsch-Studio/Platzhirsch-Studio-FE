// Runde 4, Fix-Team P2 Sprache: Italienisch ist jetzt einheitlich in der
// voi-Form (tools/i18n/patches/r4-p2-it-voi.json, gesamtwerk P1-3, recht P1-5).
// Ältere Tests vergleichen it.json Schlüssel für Schlüssel mit historischen
// Vorschlagsdateien (messages-r*.json) in der tu-Form. Diese Hilfe erlaubt
// genau eine Abweichung: Der Vorschlag war der Wert vor der Umstellung, und
// it.json hat jetzt den dokumentierten voi-Wert. Jede andere Abweichung
// bleibt ein Fehler. Kein Test (kein *.test.mjs), nur Hilfsmodul.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const PATCH = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/i18n/patches/r4-p2-it-voi.json"), "utf8"));

// Runde 9 (P5, recht P1-1): zweite, dokumentierte Stufe – Cookie-Knöpfe vom
// Infinitiv in die voi-Form (tests/unit/r9-p5-it-voi.json). Sie gilt nur, wenn
// der Wert nach Stufe 1 genau der dort notierte Vorher-Wert ist.
const R9 = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/unit/r9-p5-it-voi.json"), "utf8"));
const step2 = (key, v) => (R9._vorher[key] === v && key in R9.it ? R9.it[key] : v);

export const VOI = Object.freeze(Object.fromEntries(Object.entries(PATCH.it).map(([k, v]) => [k, step2(k, v)])));
export const TU_BEFORE = Object.freeze(PATCH._vorher);

/** Expected IT value today for a key whose (older) proposal is `proposal`. */
export function itExpected(key, proposal) {
  return step2(key, TU_BEFORE[key] === proposal && key in VOI ? VOI[key] : proposal);
}

/** Same for any locale: only IT is mapped. */
export function expectedFor(locale, key, proposal) {
  return locale === "it" ? itExpected(key, proposal) : proposal;
}

/** Maps a whole proposal subtree (object of leaves) for IT, prefix = its key path. */
export function itExpectedTree(prefix, value) {
  if (typeof value === "string") return itExpected(prefix, value);
  if (Array.isArray(value)) return value.map((v, i) => itExpectedTree(`${prefix}.${i}`, v));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, itExpectedTree(prefix ? `${prefix}.${k}` : k, v)]));
  return value;
}

/** Old tu value → new voi value (for tests that pinned a literal tu string). */
export function voiOf(tuValue) {
  for (const [k, v] of Object.entries(TU_BEFORE)) if (v === tuValue) return VOI[k];
  for (const [k, v] of Object.entries(R9._vorher)) if (v === tuValue) return R9.it[k];
  return tuValue;
}
