// src/lib/ezarri/rechner/mischung.js – Mischregeln für Custom Mix (Team C).
//
// Gleiche Namen und Signaturen wie der Vertrag §7.4 Nr. 4 (Team B, mix.js):
//   normalizeMix(mix) · canMix(palette, ids) · cellAssignment(seed, mix, w, h)
// Solange src/lib/ezarri/konfigurator/mix.js nicht existiert, nutzt das
// Mischpult diese Fassung; danach kann es 1:1 umgestellt werden.
//
// Regeln (Ezarri-Konfigurator):
//   - höchstens 4 Mosaike je Mischung (data.MAX_MIX)
//   - gemischt werden nur Mosaike mit `mischbar: true`
//   - Summe der Anteile immer 100, ganze Prozent, je Mosaik mindestens 1 %
//
// Verteilung auf der Fläche: exakte Stückzahlen je Mosaik (größter Rest), dann
// gemischt mit einem Zufallsgenerator mit festem Startwert (Mulberry32). Gleicher
// Startwert = gleiches Bild, deshalb steht er im Teilen-Link.
//
// Rein, keine Imports.

export const MAX_MIX = 4;

/** Ganze Prozent, Summe genau 100 (größter Rest). Leere/ungültige Einträge fallen weg. */
export function normalizeMix(mix, max = MAX_MIX) {
  const list = (Array.isArray(mix) ? mix : [])
    .filter((x) => x && x.id !== undefined && x.id !== null && Number(x.anteil) > 0)
    .slice(0, max)
    .map((x) => ({ id: String(x.id), anteil: Number(x.anteil) }));
  if (!list.length) return [];
  const sum = list.reduce((s, x) => s + x.anteil, 0);
  const raw = list.map((x) => (x.anteil / sum) * 100);
  const floor = raw.map((v) => Math.max(1, Math.floor(v)));
  let rest = 100 - floor.reduce((s, v) => s + v, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) floor[order[k][1]] += 1;
  // Mindestanteil 1 % kann die Summe über 100 heben → beim größten Anteil abziehen.
  while (rest < 0) {
    const i = floor.indexOf(Math.max(...floor));
    floor[i] -= 1;
    rest += 1;
  }
  return list.map((x, i) => ({ id: x.id, anteil: floor[i] }));
}

/**
 * Darf diese Auswahl gemischt werden?
 * @param {Array<{id:string, mischbar:boolean}>} palette
 * @param {string[]} ids
 * @returns {{ok: boolean, grund?: "zu_viele"|"nicht_mischbar"|"unbekannt", ids?: string[]}}
 */
export function canMix(palette, ids, max = MAX_MIX) {
  const by = new Map((palette || []).map((p) => [String(p.id), p]));
  const list = (ids || []).map(String);
  const unbekannt = list.filter((id) => !by.has(id));
  if (unbekannt.length) return { ok: false, grund: "unbekannt", ids: unbekannt };
  if (list.length > max) return { ok: false, grund: "zu_viele" };
  if (list.length <= 1) return { ok: true };
  const nicht = list.filter((id) => !by.get(id).mischbar);
  if (nicht.length) return { ok: false, grund: "nicht_mischbar", ids: nicht };
  return { ok: true };
}

/**
 * Einen Anteil setzen; die übrigen Anteile werden im bisherigen Verhältnis
 * angepasst, damit die Summe 100 bleibt (Anteilsband, ±-Knöpfe, Zahlenfeld).
 */
export function setAnteil(mix, id, wert) {
  const list = normalizeMix(mix);
  if (list.length <= 1) return list.map((x) => ({ ...x, anteil: 100 }));
  const i = list.findIndex((x) => x.id === String(id));
  if (i < 0) return list;
  const min = 1;
  const v = Math.round(Math.min(100 - min * (list.length - 1), Math.max(min, Number(wert) || min)));
  const others = list.filter((_, j) => j !== i);
  const restAlt = others.reduce((s, x) => s + x.anteil, 0);
  const restNeu = 100 - v;
  // Proportional verteilen, je mindestens 1 %, Summe exakt.
  const raw = others.map((x) => (restAlt > 0 ? (x.anteil / restAlt) * restNeu : restNeu / others.length));
  const fl = raw.map((r) => Math.max(min, Math.floor(r)));
  let rest = restNeu - fl.reduce((s, x) => s + x, 0);
  const order = raw.map((r, j) => [r - Math.floor(r), j]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) fl[order[k][1]] += 1;
  while (rest < 0) {
    const j = fl.indexOf(Math.max(...fl));
    fl[j] -= 1;
    rest += 1;
  }
  let o = 0;
  return list.map((x, j) => (j === i ? { id: x.id, anteil: v } : { id: x.id, anteil: fl[o++] }));
}

/** Mosaik hinzufügen (gleichmäßig neu verteilt) bzw. entfernen. */
export function addToMix(mix, id, max = MAX_MIX) {
  const list = normalizeMix(mix);
  if (list.some((x) => x.id === String(id)) || list.length >= max) return list;
  const n = list.length + 1;
  return normalizeMix([...list.map((x) => ({ id: x.id, anteil: (x.anteil * (n - 1)) / n })), { id: String(id), anteil: 100 / n }]);
}

export function removeFromMix(mix, id) {
  return normalizeMix(normalizeMix(mix).filter((x) => x.id !== String(id)));
}

/** Mulberry32: kleiner, schneller PRNG mit 32-bit-Startwert. Liefert () => [0,1). */
export function rng(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Neuer Startwert (1 … 999 999 999). */
export function newSeed(random = Math.random) {
  return 1 + Math.floor(random() * 999_999_998);
}

/**
 * Zuteilung Zelle → Mosaik-Index (Reihenfolge wie `mix`). Exakte Stückzahlen
 * (größter Rest), zufällig verteilt (Fisher-Yates mit festem Startwert).
 * @returns {Uint8Array} Länge w·h, Werte 0 … mix.length−1
 */
export function cellAssignment(seed, mix, w, h) {
  const list = normalizeMix(mix);
  const n = Math.max(0, Math.floor(w) * Math.floor(h));
  const out = new Uint8Array(n);
  if (!list.length || !n) return out;
  const counts = stueckzahlen(list, n);
  let pos = 0;
  counts.forEach((c, i) => {
    out.fill(i, pos, pos + c);
    pos += c;
  });
  const r = rng(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

/** Stückzahlen je Mosaik für n Steine (größter Rest, Summe = n). */
export function stueckzahlen(mix, n) {
  const list = normalizeMix(mix);
  const raw = list.map((x) => (x.anteil / 100) * n);
  const fl = raw.map(Math.floor);
  let rest = n - fl.reduce((s, x) => s + x, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; rest > 0 && order.length; k = (k + 1) % order.length, rest--) fl[order[k][1]] += 1;
  return fl;
}

/**
 * Steine pro m² je Format, aus dem Blatt laut Ezarri-Produktdaten:
 * 25 mm 12 × 19 Steine auf 31,2 × 49,5 cm, 50 mm 6 × 9 auf 31,2 × 47 cm,
 * Hexa 10 × 13 auf 31,5 × 47,2 cm.
 */
export function steineProM2(format) {
  if (format === "50") return Math.round(54 / (0.312 * 0.47)); // 368
  if (format === "hexa") return Math.round(130 / (0.315 * 0.472)); // 874
  return Math.round(228 / (0.312 * 0.495)); // 1476
}
