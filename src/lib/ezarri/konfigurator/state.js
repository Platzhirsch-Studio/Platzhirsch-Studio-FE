// src/lib/ezarri/konfigurator/state.js – Zustand des Ezarri-Konfigurators (Team B).
//
// Vertrag §7.4 Nr. 1 (Marktresearch/digital/features/ezarri-konzept.md):
//   encodeState(state) → string, decodeState(string) → state | null, DEFAULT_STATE
//   Schema v1: {v:1, szene, becken:{form,l,b,tFlach,tTief,treppe,bank,rand},
//     format, mix:[{id, anteil}], kanaele:[{id, lage, breite}], fuge,
//     spezial:{corner, cove}, wasser, zeit, led}
//   Felder dürfen nur dazukommen. Umbenennung → v erhöhen, alter Decoder bleibt.
//
// Kodierung ?k=: base64url(JSON) – lesbar für Team C (rechner/url.js →
// fromKonfigurator) ohne Abhängigkeit von diesem Modul. Ziel ≤ 600 Zeichen.
//
// IDs in mix/kanaele/pattern:
//   - `id`  = Konfigurator-Mosaik-ID ("38") – Ezarris Mosaik-Nummer, gilt für
//     alle Formate; das Format steht einmal im Zustand (`format`).
//   - Referenzen ohne Konfigurator-Daten (z. B. Gemma Hematite, Standard Pixel)
//     tragen ihre Referenz-ID ("hematite") als `id`.
//   - `ref` (optional, dazugekommen in v1) = genau gewählte Referenz, z. B. die
//     Safe-Ausführung "2508-a-safe". Ohne `ref` gilt die Basis-Referenz im Format.
//
// Dazugekommene Felder (v1, additiv): modus, pattern, wasserton, kamera, seed,
//   spezial.cornerId, spezial.coveId, mix[].ref.
//
// Rein: keine Imports, kein React. Läuft in Server, Browser und node --test.

export const STATE_VERSION = 1;

export const SZENEN = Object.freeze(["pool", "whirlpool", "bad", "kueche"]);
/** Formen je Szene (erste = Standard). */
export const FORMEN = Object.freeze({
  pool: Object.freeze(["rechteck", "radius", "rund", "l"]),
  whirlpool: Object.freeze(["kreis", "quadrat"]),
  bad: Object.freeze(["nische"]),
  kueche: Object.freeze(["rueckwand"]),
});
export const TREPPEN = Object.freeze(["roemisch", "eck", "voll", "keine"]);
export const RAENDER = Object.freeze(["skimmer", "ueberlauf", "infinity"]);
export const FORMATE = Object.freeze(["25", "50", "hexa"]);
export const WASSER = Object.freeze(["bewegt", "ruhig", "leer"]);
export const WASSERTOENE = Object.freeze(["klar", "naturpool", "salz"]);
export const ZEITEN = Object.freeze(["morgen", "mittag", "abend", "nacht"]);
export const LEDS = Object.freeze(["aus", "weiss", "blau", "tuerkis", "warm"]);
export const LAGEN = Object.freeze(["bahnen", "wasserlinie", "stufen"]);
export const MODI = Object.freeze(["mosaik", "mix", "rezept", "pattern"]);
export const KAMERAS = Object.freeze(["uebersicht", "treppe", "wasserlinie", "unterwasser", "vogel", "nah"]);
export const FUGEN = Object.freeze(["1", "2", "3", "4", "5", "6", "7"]);

/** Höchstzahl Referenzen je Mischung (Ezarri: 4) und Kanäle (Ezarri: 3). */
export const MAX_MIX = 4;
export const MAX_KANAELE = 3;

/**
 * Grenzen je Szene in Metern. Bedeutung der Felder:
 *   pool/whirlpool: l Länge, b Breite, tFlach/tTief Wassertiefe flach/tief
 *   bad:            l Wandbreite, b Tiefe der Nische, tTief Raumhöhe (Fliesenhöhe)
 *   kueche:         l Breite der Rückwand, tTief Höhe der Rückwand
 */
export const GRENZEN = Object.freeze({
  pool: Object.freeze({ l: [2, 25], b: [1.5, 12], tFlach: [0.8, 2.5], tTief: [0.8, 2.5] }),
  whirlpool: Object.freeze({ l: [1.6, 4], b: [1.6, 4], tFlach: [0.6, 1.2], tTief: [0.6, 1.2] }),
  bad: Object.freeze({ l: [0.8, 6], b: [0.8, 4], tFlach: [0, 0], tTief: [2, 3] }),
  kueche: Object.freeze({ l: [0.6, 6], b: [0.6, 0.6], tFlach: [0, 0], tTief: [0.4, 1.2] }),
});

/** Breite eines Kanals in cm (Bahnmarkierung 20–30 cm, Wasserlinie 5–30 cm). */
export const KANAL_BREITE = Object.freeze([5, 40]);

/** Start-Becken je Szene. */
export const BECKEN_START = Object.freeze({
  pool: Object.freeze({ form: "rechteck", l: 8, b: 4, tFlach: 1.2, tTief: 1.8, treppe: "roemisch", bank: false, rand: "skimmer" }),
  whirlpool: Object.freeze({ form: "kreis", l: 2.2, b: 2.2, tFlach: 0.9, tTief: 0.9, treppe: "keine", bank: true, rand: "ueberlauf" }),
  bad: Object.freeze({ form: "nische", l: 1.8, b: 1.2, tFlach: 0, tTief: 2.4, treppe: "keine", bank: false, rand: "skimmer" }),
  kueche: Object.freeze({ form: "rueckwand", l: 3, b: 0.6, tFlach: 0, tTief: 0.6, treppe: "keine", bank: false, rand: "skimmer" }),
});

/** Startzustand: Rechteckbecken 8 × 4 m (wie Ezarris Becken), Niebla 2508-A (Wasser laut Ezarri türkisblau). */
export const DEFAULT_STATE = Object.freeze({
  v: STATE_VERSION,
  szene: "pool",
  becken: BECKEN_START.pool,
  format: "25",
  mix: Object.freeze([Object.freeze({ id: "38", anteil: 100 })]),
  kanaele: Object.freeze([]),
  fuge: "1",
  spezial: Object.freeze({ corner: false, cove: false }),
  wasser: "bewegt",
  zeit: "mittag",
  led: "aus",
  modus: "mosaik",
  pattern: null,
  wasserton: "klar",
  kamera: "uebersicht",
  seed: 7,
});

// ---------------------------------------------------------------------------
// Hilfen

const oneOf = (list, v, fallback) => (list.includes(v) ? v : fallback);
const num = (v, fallback) => {
  const n = typeof v === "string" ? Number.parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const clamp = (v, [min, max]) => Math.min(max, Math.max(min, v));
const round2 = (v) => Math.round(v * 100) / 100;
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const validId = (id) => typeof id === "string" && ID_RE.test(id);

/** Anteile ganzzahlig auf Summe 100 bringen (größter Rest). Mindestens 1 % je Eintrag. */
export function to100(values) {
  const n = values.length;
  if (!n) return [];
  const pos = values.map((v) => Math.max(0, Number(v) || 0));
  const sum = pos.reduce((a, b) => a + b, 0);
  const raw = sum > 0 ? pos.map((v) => (v / sum) * 100) : pos.map(() => 100 / n);
  const floor = raw.map((v) => Math.max(1, Math.floor(v)));
  let rest = 100 - floor.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  let k = 0;
  while (rest > 0) {
    floor[order[k % n][1]] += 1;
    rest -= 1;
    k += 1;
  }
  // zu viel (wegen Mindestwert 1): beim größten abziehen
  while (rest < 0) {
    const i = floor.indexOf(Math.max(...floor));
    floor[i] -= 1;
    rest += 1;
  }
  return floor;
}

/** Becken einer Szene säubern (Grenzen, Formen, tTief ≥ tFlach). */
export function sanitizeBecken(raw, szene = "pool") {
  const start = BECKEN_START[szene] || BECKEN_START.pool;
  const g = GRENZEN[szene] || GRENZEN.pool;
  const b = raw && typeof raw === "object" ? raw : {};
  const out = {
    form: oneOf(FORMEN[szene] || FORMEN.pool, b.form, start.form),
    l: round2(clamp(num(b.l, start.l), g.l)),
    b: round2(clamp(num(b.b, start.b), g.b)),
    tFlach: round2(clamp(num(b.tFlach, start.tFlach), g.tFlach)),
    tTief: round2(clamp(num(b.tTief, start.tTief), g.tTief)),
    treppe: szene === "pool" ? oneOf(TREPPEN, b.treppe, start.treppe) : "keine",
    bank: szene === "pool" || szene === "whirlpool" ? Boolean(b.bank) : false,
    rand: szene === "pool" ? oneOf(RAENDER, b.rand, start.rand) : start.rand,
  };
  if (szene === "pool" || szene === "whirlpool") {
    if (out.tTief < out.tFlach) out.tTief = out.tFlach;
  }
  if (szene === "whirlpool") out.tFlach = out.tTief;
  // Runde Enden brauchen Länge ≥ Breite
  if (out.form === "rund" && out.l < out.b) out.l = out.b;
  if (szene === "whirlpool" && out.form === "kreis") out.b = out.l;
  return out;
}

/** Mischung säubern: gültige IDs, ohne Dubletten, max. `max`, Summe 100. */
export function sanitizeMix(raw, max = MAX_MIX) {
  const seen = new Set();
  const list = [];
  for (const e of Array.isArray(raw) ? raw : []) {
    if (!e || typeof e !== "object") continue;
    const id = String(e.id ?? "");
    if (!validId(id) || seen.has(id)) continue;
    seen.add(id);
    const item = { id, anteil: num(e.anteil, 0) };
    if (validId(e.ref)) item.ref = e.ref;
    list.push(item);
    if (list.length >= max) break;
  }
  const shares = to100(list.map((e) => e.anteil));
  return list.map((e, i) => ({ ...e, anteil: shares[i] }));
}

function sanitizeKanaele(raw) {
  const out = [];
  for (const k of Array.isArray(raw) ? raw : []) {
    if (!k || typeof k !== "object") continue;
    const id = String(k.id ?? "");
    if (!validId(id)) continue;
    const item = { id, lage: oneOf(LAGEN, k.lage, "bahnen"), breite: Math.round(clamp(num(k.breite, 20), KANAL_BREITE)) };
    if (validId(k.ref)) item.ref = k.ref;
    out.push(item);
    if (out.length >= MAX_KANAELE) break;
  }
  return out;
}

function sanitizePattern(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id ?? "");
  if (!/^\d{1,3}$/.test(id)) return null;
  const ids = (Array.isArray(raw.ids) ? raw.ids : []).map(String).filter(validId).slice(0, 3);
  if (!ids.length) return null;
  return { id, ids };
}

/**
 * Beliebigen (auch fremden/alten) Zustand in einen gültigen v1-Zustand bringen.
 * @param {object} raw
 * @param {{isKnown?: (id:string)=>boolean}} [opts] filtert unbekannte Mosaik-IDs
 */
export function sanitizeState(raw, { isKnown } = {}) {
  const s = raw && typeof raw === "object" ? raw : {};
  const szene = oneOf(SZENEN, s.szene, DEFAULT_STATE.szene);
  const known = (e) => !isKnown || isKnown(e.id);
  let mix = sanitizeMix(s.mix).filter(known);
  if (!mix.length) mix = DEFAULT_STATE.mix.map((e) => ({ ...e }));
  mix = sanitizeMix(mix);
  const sp = s.spezial && typeof s.spezial === "object" ? s.spezial : {};
  const spezial = { corner: Boolean(sp.corner), cove: Boolean(sp.cove) };
  if (validId(sp.cornerId)) spezial.cornerId = sp.cornerId;
  if (validId(sp.coveId)) spezial.coveId = sp.coveId;
  let pattern = sanitizePattern(s.pattern);
  if (pattern && isKnown) pattern = pattern.ids.every(isKnown) ? pattern : null;
  const modus = oneOf(MODI, s.modus, mix.length > 1 ? "mix" : "mosaik");
  return {
    v: STATE_VERSION,
    szene,
    becken: sanitizeBecken(s.becken, szene),
    format: oneOf(FORMATE, String(s.format ?? ""), DEFAULT_STATE.format),
    mix,
    kanaele: sanitizeKanaele(s.kanaele).filter(known),
    fuge: oneOf(FUGEN, String(s.fuge ?? ""), DEFAULT_STATE.fuge),
    spezial,
    wasser: oneOf(WASSER, s.wasser, DEFAULT_STATE.wasser),
    zeit: oneOf(ZEITEN, s.zeit, DEFAULT_STATE.zeit),
    led: oneOf(LEDS, s.led, DEFAULT_STATE.led),
    modus: modus === "pattern" && !pattern ? (mix.length > 1 ? "mix" : "mosaik") : modus,
    pattern,
    wasserton: oneOf(WASSERTOENE, s.wasserton, DEFAULT_STATE.wasserton),
    kamera: oneOf(KAMERAS, s.kamera, DEFAULT_STATE.kamera),
    seed: Math.round(clamp(num(s.seed, DEFAULT_STATE.seed), [1, 99999])),
  };
}

// ---------------------------------------------------------------------------
// Codec ?k=

function b64urlEncode(str) {
  if (typeof Buffer !== "undefined" && typeof window === "undefined") return Buffer.from(str, "utf8").toString("base64url");
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  if (typeof atob === "function") {
    const bin = atob(b64);
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

const B64URL = /^[A-Za-z0-9_-]{8,2000}$/;

/**
 * Zustand → kompakter Link-Parameter. Felder mit Startwert, die nicht zum
 * Vertrag gehören (kamera, seed, wasserton, modus, pattern=null), entfallen.
 */
export function encodeState(state) {
  const s = sanitizeState(state);
  const out = {
    v: s.v,
    szene: s.szene,
    becken: s.becken,
    format: s.format,
    mix: s.mix,
    kanaele: s.kanaele,
    fuge: s.fuge,
    spezial: s.spezial,
    wasser: s.wasser,
    zeit: s.zeit,
    led: s.led,
  };
  if (s.modus !== "mosaik") out.modus = s.modus;
  if (s.pattern) out.pattern = s.pattern;
  if (s.wasserton !== DEFAULT_STATE.wasserton) out.wasserton = s.wasserton;
  if (s.kamera !== DEFAULT_STATE.kamera) out.kamera = s.kamera;
  if (s.seed !== DEFAULT_STATE.seed) out.seed = s.seed;
  return b64urlEncode(JSON.stringify(out));
}

/**
 * Link-Parameter → Zustand oder null (ungültig, fremde Version).
 * @param {string} k
 * @param {{isKnown?: (id:string)=>boolean}} [opts]
 */
export function decodeState(k, opts) {
  if (typeof k !== "string" || !B64URL.test(k)) return null;
  let raw;
  try {
    raw = JSON.parse(b64urlDecode(k));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || raw.v !== 1) return null;
  return sanitizeState(raw, opts);
}

// ---------------------------------------------------------------------------
// Rückgängig / Wiederholen (50 Schritte)

export const HISTORY_LIMIT = 50;

/** Neuer Verlauf mit einem Startzustand. */
export function createHistory(present) {
  return { past: [], present, future: [] };
}

/** Neuer Zustand in den Verlauf (gleiche Zustände werden nicht doppelt gespeichert). */
export function pushHistory(h, next, limit = HISTORY_LIMIT) {
  if (next === h.present || JSON.stringify(next) === JSON.stringify(h.present)) return h;
  const past = [...h.past, h.present];
  return { past: past.length > limit ? past.slice(past.length - limit) : past, present: next, future: [] };
}

export function undo(h) {
  if (!h.past.length) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
}

export function redo(h) {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
}

// ---------------------------------------------------------------------------
// Änderungen (rein, für useReducer)

/** Szene wechseln: Becken auf Startwerte der Szene, Kamera auf Übersicht. */
export function withSzene(state, szene) {
  if (!SZENEN.includes(szene) || szene === state.szene) return state;
  const next = { ...state, szene, becken: { ...BECKEN_START[szene] }, kamera: "uebersicht" };
  if (szene !== "pool") next.kanaele = state.kanaele.filter((k) => k.lage === "wasserlinie" && szene === "whirlpool");
  return sanitizeState(next);
}

/** Ein Becken-Feld setzen (mit Grenzen). */
export function withBecken(state, patch) {
  return { ...state, becken: sanitizeBecken({ ...state.becken, ...patch }, state.szene) };
}
