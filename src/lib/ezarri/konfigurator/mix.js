// src/lib/ezarri/konfigurator/mix.js – Mischregeln und Zuteilung pro Steinchen (Team B).
//
// Vertrag §7.4 Nr. 4: normalizeMix, canMix, cellAssignment(seed, mix, w, h).
// Regeln laut Ezarri-Konfigurator (ezarri-analyse.md §1.3):
//   - bis zu 4 Referenzen je Mischung, Anteile in ganzen Prozent, Summe 100
//   - „nicht mischbar“ (mezclable = 0) darf nur allein stehen
// Unsere Erweiterung: Anteilsband mit ziehbaren Grenzen (setBoundary) und eine
// deterministische Zuteilung (gleicher Seed → gleiches Bild in 2D, 3D, Druck).
//
// Rein: nur ./state.js. Läuft in Server, Browser und node --test.
import { MAX_MIX, sanitizeMix, to100 } from "./state.js";

export { MAX_MIX };

/** Mindestanteil je Referenz in einer Mischung (Prozent). */
export const MIN_ANTEIL = 1;

/** Mischung säubern (IDs, Dubletten, max. 4, Summe 100). */
export function normalizeMix(mix, max = MAX_MIX) {
  return sanitizeMix(mix, max);
}

/**
 * Dürfen diese Referenzen zusammen gemischt werden?
 * @param {Array<{id:string}>|string[]} mix
 * @param {(id:string)=>boolean} isMixable
 * @returns {{ok:boolean, grund?:"zu-viele"|"nicht-mischbar", id?:string}}
 */
export function canMix(mix, isMixable, max = MAX_MIX) {
  const ids = (mix || []).map((e) => (typeof e === "string" ? e : e.id));
  if (ids.length > max) return { ok: false, grund: "zu-viele" };
  if (ids.length <= 1) return { ok: true };
  const bad = ids.find((id) => !isMixable(id));
  return bad ? { ok: false, grund: "nicht-mischbar", id: bad } : { ok: true };
}

/**
 * Referenz zur Mischung hinzufügen.
 * - Nicht mischbar (neu oder vorhanden) → die neue Referenz steht allein (Hinweis).
 * - Schon 4 Referenzen → unverändert (Hinweis).
 * - Sonst: neuer Eintrag mit gleichem Anteil (100/n), die übrigen behalten ihr Verhältnis.
 * @returns {{mix: Array, hinweis: null|"allein"|"voll"|"vorhanden"}}
 */
export function addToMix(mix, id, isMixable, { ref, max = MAX_MIX } = {}) {
  const list = normalizeMix(mix, max);
  if (list.some((e) => e.id === id)) return { mix: list, hinweis: "vorhanden" };
  const entry = ref ? { id, anteil: 100, ref } : { id, anteil: 100 };
  if (!isMixable(id) || list.some((e) => !isMixable(e.id))) return { mix: [entry], hinweis: list.length ? "allein" : null };
  if (list.length >= max) return { mix: list, hinweis: "voll" };
  const n = list.length + 1;
  const neu = Math.round(100 / n);
  const shares = to100([...list.map((e) => e.anteil * (100 - neu)), neu * 100]);
  return { mix: [...list, entry].map((e, i) => ({ ...e, anteil: shares[i] })), hinweis: null };
}

/** Referenz entfernen; die übrigen werden auf 100 hochgerechnet. Die letzte bleibt immer stehen. */
export function removeFromMix(mix, id) {
  const list = normalizeMix(mix).filter((e) => e.id !== id);
  if (!list.length) return normalizeMix(mix);
  const shares = to100(list.map((e) => e.anteil));
  return list.map((e, i) => ({ ...e, anteil: shares[i] }));
}

/** Referenz austauschen (gleicher Anteil). */
export function replaceInMix(mix, oldId, id, ref) {
  return normalizeMix(
    mix.map((e) => {
      if (e.id !== oldId) return e;
      const next = { id, anteil: e.anteil };
      if (ref) next.ref = ref;
      return next;
    }),
  );
}

/**
 * Anteil eines Eintrags setzen; die übrigen teilen sich den Rest im alten Verhältnis.
 * Jeder Eintrag behält mindestens 1 %.
 */
export function setShare(mix, index, value) {
  const list = normalizeMix(mix);
  const n = list.length;
  if (n <= 1 || index < 0 || index >= n) return list;
  const v = Math.round(Math.min(100 - MIN_ANTEIL * (n - 1), Math.max(MIN_ANTEIL, Number(value) || 0)));
  const others = list.map((e, i) => (i === index ? 0 : e.anteil));
  const otherSum = others.reduce((a, b) => a + b, 0);
  const rest = 100 - v;
  const scaled = others.map((a, i) => (i === index ? 0 : otherSum > 0 ? (a / otherSum) * rest : rest / (n - 1)));
  // auf ganze Zahlen mit Mindestwert, Summe exakt rest
  const ints = scaled.map((x, i) => (i === index ? 0 : Math.max(MIN_ANTEIL, Math.floor(x))));
  let diff = rest - ints.reduce((a, b) => a + b, 0);
  const order = scaled.map((x, i) => [x - Math.floor(x), i]).filter(([, i]) => i !== index).sort((a, b) => b[0] - a[0]);
  let k = 0;
  while (diff > 0 && order.length) {
    ints[order[k % order.length][1]] += 1;
    diff -= 1;
    k += 1;
  }
  while (diff < 0) {
    let big = -1;
    ints.forEach((x, i) => {
      if (i !== index && x > MIN_ANTEIL && (big < 0 || x > ints[big])) big = i;
    });
    if (big < 0) break;
    ints[big] -= 1;
    diff += 1;
  }
  return list.map((e, i) => ({ ...e, anteil: i === index ? v : ints[i] }));
}

/** Grenzen des Anteilsbands (kumulierte Prozent, ohne 0 und 100): [70] bei 70/30. */
export function boundaries(mix) {
  const out = [];
  let acc = 0;
  for (let i = 0; i < mix.length - 1; i++) {
    acc += mix[i].anteil;
    out.push(acc);
  }
  return out;
}

/**
 * Grenze j (zwischen Eintrag j und j+1) auf Position pos (0–100) ziehen.
 * Nur die beiden Nachbarn ändern sich; jeder behält ≥ 1 %.
 */
export function setBoundary(mix, j, pos) {
  const list = normalizeMix(mix);
  if (j < 0 || j >= list.length - 1) return list;
  const before = list.slice(0, j).reduce((a, e) => a + e.anteil, 0);
  const pair = list[j].anteil + list[j + 1].anteil;
  const left = Math.round(Math.min(before + pair - MIN_ANTEIL, Math.max(before + MIN_ANTEIL, Number(pos) || 0)) - before);
  return list.map((e, i) => (i === j ? { ...e, anteil: left } : i === j + 1 ? { ...e, anteil: pair - left } : e));
}

// ---------------------------------------------------------------------------
// Zuteilung pro Steinchen

/** Ganzzahl-Hash (x, y, seed) → [0, 1). Gleiche Eingabe, gleiches Ergebnis (32 bit, ohne Float-Abhängigkeit). */
export function hash01(x, y, seed = 1) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Kumulierte Anteile 0–1: [0.7, 1] bei 70/30. */
export function cumulative(mix) {
  const total = mix.reduce((a, e) => a + (e.anteil || 0), 0) || 1;
  let acc = 0;
  return mix.map((e) => {
    acc += (e.anteil || 0) / total;
    return acc;
  });
}

/** Index in der Mischung für eine Zufallszahl r ∈ [0,1). */
export function pickIndex(r, cum) {
  for (let i = 0; i < cum.length; i++) if (r < cum[i]) return i;
  return cum.length - 1;
}

/**
 * Zuteilung für ein Raster w × h: Uint8Array mit dem Mischungs-Index je Stein
 * (Zeile für Zeile). Gleicher Seed → gleiche Fläche.
 */
export function cellAssignment(seed, mix, w, h) {
  const list = normalizeMix(mix);
  const cum = cumulative(list);
  const out = new Uint8Array(Math.max(0, w * h));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = pickIndex(hash01(x, y, seed), cum);
  return out;
}

/** Tatsächliche Stückzahlen je Eintrag in einer Zuteilung (für Prüfung und Druckblatt). */
export function countAssignment(assignment, n) {
  const counts = new Array(n).fill(0);
  for (const v of assignment) counts[v] += 1;
  return counts;
}
