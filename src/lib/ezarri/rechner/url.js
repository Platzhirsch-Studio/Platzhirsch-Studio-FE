// src/lib/ezarri/rechner/url.js – URL-Zustand von Rechner und Custom Mix (Team C).
//
// Rechner:    /de/ezarri/rechner?f=50&l=12&b=6&tf=1,2&tt=2&tr=roemisch …
//             Nur Werte, die vom Standard abweichen, stehen in der URL.
// Mischung:   m=37-70.38-30   (Konfigurator-Mosaik-ID "-" Anteil, "." trennt)
// Custom Mix: /de/ezarri/custom-mix?m=37-70.38-30&fu=1&f=25&s=4711&w=1
// Konfigurator-Übergabe (Team B, Vertrag §7.4 Nr. 1):  ?k=<base64url-JSON v1>
//             fromKonfigurator() übernimmt Becken, Format und Mischung.
//
// Rein, keine Imports außer den eigenen Modulen. Läuft in Server, Browser und node --test.
import { STANDARD } from "./flaechen.js";

/** Kurzschlüssel ↔ Feldname der Rechner-Eingabe. */
export const RECHNER_KEYS = Object.freeze({
  form: "fo",
  format: "f",
  l: "l",
  b: "b",
  lAus: "la",
  bAus: "ba",
  flaecheFrei: "fa",
  umfangFrei: "fu",
  ecken: "ek",
  tFlach: "tf",
  tTief: "tt",
  tMittel: "tm",
  marge: "mg",
  boden: "bo",
  waende: "wa",
  treppe: "tr",
  treppeBreite: "tb",
  stufen: "st",
  auftritt: "au",
  steigung: "sg",
  bankLaenge: "bl",
  bankTiefe: "bt",
  bankUnterWasser: "bw",
  rinne: "ri",
  rinneLfm: "rl",
  rinneAbwicklung: "ra",
  spezial: "sp",
});

const BOOL_FIELDS = new Set(["boden", "waende", "spezial"]);
const MAX_PARAM = 24;

const zahl = (v) => String(v).replace(".", ",");

/**
 * Rechner-Eingabe → URLSearchParams-String (ohne "?"). Leere Felder und
 * Standardwerte entfallen. `mix` (optional) hängt die Mischung an.
 */
export function encodeRechner(eingabe = {}, { mix } = {}) {
  const p = new URLSearchParams();
  for (const [field, key] of Object.entries(RECHNER_KEYS)) {
    const v = eingabe[field];
    if (v === undefined || v === null || v === "") continue;
    if (BOOL_FIELDS.has(field)) {
      if (v === false || v === "0") p.set(key, "0");
      continue;
    }
    const s = typeof v === "number" ? zahl(v) : String(v).trim();
    const def = STANDARD[field];
    if (def !== null && def !== undefined && (s === String(def) || s === zahl(def))) continue;
    p.set(key, s.slice(0, MAX_PARAM));
  }
  const m = encodeMix(mix);
  if (m) p.set("m", m);
  return p.toString();
}

/**
 * searchParams (URLSearchParams, Next-Objekt {key: string|string[]} oder String)
 * → Rechner-Eingabe (Strings, normalizeEingabe() prüft sie) und Mischung.
 */
export function decodeRechner(params) {
  const get = getter(params);
  const eingabe = {};
  for (const [field, key] of Object.entries(RECHNER_KEYS)) {
    const v = get(key);
    if (v === null || v === undefined || v === "") continue;
    if (BOOL_FIELDS.has(field)) eingabe[field] = v !== "0";
    else eingabe[field] = String(v).slice(0, MAX_PARAM);
  }
  return { eingabe, mix: decodeMix(get("m")) };
}

// ---------------------------------------------------------------------------
// Mischung

/** [{id:"37", anteil:70}, …] → "37-70.38-30" (leer → ""). */
export function encodeMix(mix) {
  if (!Array.isArray(mix)) return "";
  return mix
    .filter((x) => x && /^\d{1,4}$/.test(String(x.id)) && Number(x.anteil) > 0)
    .slice(0, 4)
    .map((x) => `${x.id}-${Math.round(Number(x.anteil))}`)
    .join(".");
}

/** "37-70.38-30" → [{id:"37", anteil:70}, …]; Unsinn wird verworfen, max. 4, doppelte IDs zusammengelegt. */
export function decodeMix(value) {
  if (!value || typeof value !== "string") return [];
  const out = new Map();
  for (const part of value.slice(0, 80).split(".")) {
    const m = part.match(/^(\d{1,4})-(\d{1,3})$/);
    if (!m) continue;
    const anteil = Math.min(100, Number(m[2]));
    if (anteil <= 0) continue;
    out.set(m[1], (out.get(m[1]) || 0) + anteil);
    if (out.size >= 4) break;
  }
  return [...out].map(([id, anteil]) => ({ id, anteil: Math.min(100, anteil) }));
}

// ---------------------------------------------------------------------------
// Custom Mix

/** Zustand des Mischpults → Query-String. */
export function encodeCustomMix({ mix, fuge, format, seed, wasser } = {}) {
  const p = new URLSearchParams();
  const m = encodeMix(mix);
  if (m) p.set("m", m);
  if (fuge && /^\d{1,2}$/.test(String(fuge))) p.set("fu", String(fuge));
  if (format && ["25", "50", "hexa"].includes(String(format)) && String(format) !== "25") p.set("f", String(format));
  if (Number.isInteger(seed) && seed > 0) p.set("s", String(seed % 1e9));
  if (wasser) p.set("w", "1");
  return p.toString();
}

/** Query → Zustand des Mischpults (ungeprüfte IDs; der Server gleicht mit der Palette ab). */
export function decodeCustomMix(params) {
  const get = getter(params);
  const seed = Number.parseInt(get("s") || "", 10);
  const format = String(get("f") || "25");
  return {
    mix: decodeMix(get("m")),
    fuge: /^\d{1,2}$/.test(get("fu") || "") ? get("fu") : null,
    format: ["25", "50", "hexa"].includes(format) ? format : "25",
    seed: Number.isInteger(seed) && seed > 0 ? seed % 1e9 : null,
    wasser: get("w") === "1",
  };
}

// ---------------------------------------------------------------------------
// Übergabe aus dem Konfigurator (Team B)

const B64URL = /^[A-Za-z0-9_-]{4,1200}$/;

function base64urlDecode(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

/**
 * ?k=<Konfig-Zustand> (Vertrag §7.4 Nr. 1, Schema v1) → Rechner-Eingabe + Mischung.
 * Liest nur, was der Rechner braucht; unbekannte Felder werden ignoriert.
 * Sobald Team B `decodeState` liefert, ist das Ergebnis identisch (gleiches Schema).
 * @returns {{eingabe: object, mix: Array<{id:string, anteil:number}>, hinweis?: string} | null}
 */
export function fromKonfigurator(k) {
  if (!k || typeof k !== "string" || !B64URL.test(k)) return null;
  let s;
  try {
    s = JSON.parse(base64urlDecode(k));
  } catch {
    return null;
  }
  if (!s || typeof s !== "object" || s.v !== 1) return null;
  const eingabe = {};
  let hinweis;
  const be = s.becken && typeof s.becken === "object" ? s.becken : {};
  const form = String(be.form || "").toLowerCase();
  if (/^l/.test(form)) eingabe.form = "l";
  else if (/rund|oval|kreis/.test(form) && !/enden|ecken/.test(form)) eingabe.form = "rund";
  else {
    eingabe.form = "rechteck";
    if (/enden|ecken|radius/.test(form)) hinweis = "Runde Enden und Eckradien rechnet der Rechner als Rechteck (etwas mehr Fläche, auf der sicheren Seite).";
  }
  const nums = { l: be.l, b: be.b, tFlach: be.tFlach, tTief: be.tTief };
  for (const [key, v] of Object.entries(nums)) if (Number.isFinite(Number(v))) eingabe[key] = Number(v);
  const treppe = String(be.treppe || "keine").toLowerCase();
  eingabe.treppe = /roem|röm/.test(treppe) ? "roemisch" : /eck/.test(treppe) ? "ecke" : /voll|gerade/.test(treppe) ? "gerade" : "keine";
  if (eingabe.treppe === "gerade" && Number.isFinite(Number(be.b))) eingabe.treppeBreite = Number(be.b);
  if (be.bank) eingabe.bankLaenge = Number.isFinite(Number(be.bank?.laenge)) ? Number(be.bank.laenge) : Math.min(3, Number(be.l) || 3);
  const rand = String(be.rand || "skimmer").toLowerCase();
  eingabe.rinne = /infin/.test(rand) ? "infinity" : /ueber|über|finn|rinne/.test(rand) ? "ueberlauf" : "skimmer";
  if (["25", "50", "hexa"].includes(String(s.format))) eingabe.format = String(s.format);
  if (s.spezial && typeof s.spezial === "object") eingabe.spezial = Boolean(s.spezial.corner || s.spezial.cove);
  const mix = Array.isArray(s.mix)
    ? s.mix
        .filter((x) => x && /^\d{1,4}$/.test(String(x.id)) && Number(x.anteil) > 0)
        .slice(0, 4)
        .map((x) => ({ id: String(x.id), anteil: Math.round(Number(x.anteil)) }))
    : [];
  return { eingabe, mix, ...(hinweis ? { hinweis } : {}) };
}

// ---------------------------------------------------------------------------

function getter(params) {
  if (!params) return () => null;
  if (typeof params === "string") {
    const p = new URLSearchParams(params.startsWith("?") ? params.slice(1) : params);
    return (k) => p.get(k);
  }
  if (typeof params.get === "function") return (k) => params.get(k);
  return (k) => {
    const v = params[k];
    return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
  };
}
