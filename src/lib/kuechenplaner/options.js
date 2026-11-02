// Küchenplaner – Modul-Optionen als kompakte Zeichenkette ("f3hl" = Front 3, Anschlag links).
// Jede Option ist genau ein Schlüsselzeichen plus ein Wertzeichen. Fehlt eine
// Option, gilt der Standard aus dem Katalog. Reine Funktionen (Server, Client, Tests).
import { MODULES } from "../../components/Labs/Kuechenplaner/catalog.js";

export function parseOpts(s) {
  const out = {};
  if (typeof s !== "string") return out;
  for (let i = 0; i + 1 < s.length; i += 2) out[s[i]] = s[i + 1];
  return out;
}

/** Wert einer Option (mit Katalog-Standard). */
export function opt(m, key) {
  const v = parseOpts(m?.o)[key];
  if (v !== undefined) return v;
  return MODULES[m?.t]?.opts?.[key]?.def;
}

/** Setzt eine Option; Standardwerte werden weggelassen, damit der Link kurz bleibt. */
export function withOpt(m, key, value) {
  const o = parseOpts(m.o);
  const def = MODULES[m.t]?.opts?.[key]?.def;
  if (value === def || value === undefined || value === null) delete o[key];
  else o[key] = String(value)[0];
  const s = Object.entries(o)
    .filter(([k]) => MODULES[m.t]?.opts?.[k])
    .map(([k, v]) => k + v)
    .join("");
  const next = { ...m };
  if (s) next.o = s;
  else delete next.o;
  return next;
}

/** Entfernt Optionen, die der Modultyp nicht kennt (nach Typwechsel). */
export function cleanOpts(m) {
  const o = parseOpts(m.o);
  const keep = Object.entries(o).filter(([k, v]) => MODULES[m.t]?.opts?.[k]?.values?.[v] !== undefined && MODULES[m.t].opts[k].def !== v);
  const next = { ...m };
  if (keep.length) next.o = keep.map(([k, v]) => k + v).join("");
  else delete next.o;
  return next;
}

/** Klartext der gesetzten Optionen („LeMans, Anschlag links“). */
export function optLabels(m) {
  const def = MODULES[m.t];
  if (!def?.opts) return [];
  return Object.entries(def.opts)
    .map(([k, o]) => o.values[opt(m, k)])
    .filter(Boolean);
}
