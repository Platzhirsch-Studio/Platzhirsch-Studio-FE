// Zusatz-Zustand der Mosaik-Übersicht neben facets.js (QM Runde 1):
//   bild  – „Projektbild aus …“ (Galerie-Arten, Karte.projekte), getrennt von
//           der Eignung laut Datenblatt (Karte.einsatz, P1-3)
//   sort  – Sortierung (empfohlen | name | kollektion | hell, P2-2)
//   Standard-Art – ohne Art-Filter und ohne Suche nur Basis-Mosaike (P2-5)
// Rein (keine Hooks, kein "use client"): Server-Seite, Insel und node --test.
import { EINSATZ, facetsFor } from "@/lib/ezarri/facets";

/** Projektbild-Arten in Anzeige-Reihenfolge (IDs wie data.PROJEKT_EINSAETZE). */
export const PROJEKT_ARTEN = Object.freeze(
  ["pool-privat", "pool-oeffentlich", "wellness", "bad", "kueche"].map((id) => ({ id, label: EINSATZ.find((e) => e.id === id)?.label ?? id }))
);
/** Projektbild-Arten mit Labels in der Sprache der Seite (Welle 2). */
export function projektArtenFor(locale = "de") {
  const { EINSATZ: E } = facetsFor(locale);
  return PROJEKT_ARTEN.map((p) => ({ id: p.id, label: E.find((e) => e.id === p.id)?.label ?? p.id }));
}
export const SORTS = Object.freeze(["empfohlen", "name", "kollektion", "hell"]);
export const DEFAULT_SORT = "empfohlen";

const split = (v) =>
  String(Array.isArray(v) ? v.join(",") : v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function read(source, key) {
  if (!source) return undefined;
  if (typeof source.get === "function") return source.get(key) ?? undefined;
  return source[key];
}

/** URL → {bild: string[], sort: string}. Ungültiges fällt weg. */
export function parseExtras(source) {
  const ids = new Set(PROJEKT_ARTEN.map((p) => p.id));
  const bild = [...new Set(split(read(source, "bild")).filter((v) => ids.has(v)))];
  const s = String(read(source, "sort") ?? "");
  return { bild, sort: SORTS.includes(s) ? s : DEFAULT_SORT };
}

/** Zusatz-Parameter für die URL (leer bei Standardwerten). */
export function extraEntries(x = {}) {
  const out = [];
  if (x.bild?.length) out.push(["bild", x.bild.join(",")]);
  if (x.sort && x.sort !== DEFAULT_SORT) out.push(["sort", x.sort]);
  return out;
}

/** Gilt die Standard-Art (nur Basis-Mosaike)? Nicht bei Art-Filter oder Suche (Codes von Safe/Corner finden). */
export const defaultTypActive = (f = {}) => !f.typ?.length && !f.q;

/** Passt eine Karte zu Projektbild-Filter und Standard-Art? */
export function matchesExtras(card, x = {}, f = {}) {
  if (defaultTypActive(f) && card.typ !== "mosaik") return false;
  if (x.bild?.length && !x.bild.some((b) => (card.projekte || []).includes(b))) return false;
  return true;
}

/** Reiner Code als Name („25001-C 25“, „2503-D“): kommt in „Empfohlen“ nach hinten. */
export const isCodeName = (name) => /^\d/.test(String(name || "").trim());

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

const collator = new Intl.Collator("de", { numeric: true, sensitivity: "base" });

/** Punkte für „Empfohlen“: Projektbilder und Wasserwirkung. */
function score(c) {
  return Math.min(c.bilder || 0, 12) * 4 + ((c.projekte || []).length ? 30 : 0) + ((c.wasserfarbe || []).length ? 20 : 0);
}

/** Je Kollektion abwechselnd, Kollektionen nach ihrer besten Karte (deterministisch). */
function interleave(list) {
  const groups = new Map();
  for (const c of list) {
    if (!groups.has(c.kollektion)) groups.set(c.kollektion, []);
    groups.get(c.kollektion).push(c);
  }
  const queues = [...groups.values()];
  const out = [];
  for (let round = 0; out.length < list.length; round++) {
    for (const q of queues) if (q[round]) out.push(q[round]);
  }
  return out;
}

/**
 * Sortiert Karten (neue Liste). „empfohlen“: benannte Mosaike mit Projektbild und
 * Wasserwirkung zuerst, je Kollektion abwechselnd, reine Codes zuletzt.
 */
export function sortCards(cards, sort = DEFAULT_SORT) {
  const list = cards.map((c, i) => ({ c, i }));
  const byIndex = (a, b) => a.i - b.i;
  if (sort === "name") return list.sort((a, b) => collator.compare(a.c.name, b.c.name) || byIndex(a, b)).map((x) => x.c);
  if (sort === "kollektion")
    return list.sort((a, b) => collator.compare(a.c.kollektionName, b.c.kollektionName) || collator.compare(a.c.name, b.c.name) || byIndex(a, b)).map((x) => x.c);
  if (sort === "hell")
    return list
      .map((x) => ({ ...x, l: luminance(x.c.hex) }))
      .sort((a, b) => (a.l === null) - (b.l === null) || (b.l ?? 0) - (a.l ?? 0) || byIndex(a, b))
      .map((x) => x.c);
  const ranked = list.map((x) => ({ ...x, s: score(x.c) })).sort((a, b) => b.s - a.s || byIndex(a, b)).map((x) => x.c);
  // Stufen: benannt mit Bild → Code mit Bild → ohne Bild; innerhalb je Kollektion abwechselnd.
  const tier = (c) => (!c.bild ? 2 : isCodeName(c.name) ? 1 : 0);
  return [0, 1, 2].flatMap((t) => interleave(ranked.filter((c) => tier(c) === t)));
}

/** Anzahl aktiver Zusatzfilter (Sortierung zählt nicht als Filter). */
export const countExtras = (x = {}) => x.bild?.length || 0;
