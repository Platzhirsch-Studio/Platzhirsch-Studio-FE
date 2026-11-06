// Reine Logik der BerichtSeite (MASTER G-13, T8; Team P0-5b) – ohne JSX, testbar mit node --test.

import { mitZeitlimit } from "../../../lib/backoffice/aufgaben/index.js";
import { alsCsv } from "../../../lib/backoffice/csv.js";

export const BERICHT_ZEITLIMIT_MS = 8000;
const ZAHL_TYPEN = ["Int", "Float", "Currency", "Percent"];

/** Spalte wird summiert: Beträge (cent) und Zahlen, außer `summe: false`; Prozent nie. */
export function summierbar(s) {
  if (!s || s.summe === false) return false;
  if (s.summe === true) return true;
  return !!s.cent || (ZAHL_TYPEN.includes(s.fieldtype) && s.fieldtype !== "Percent");
}

/** Summen je summierbarer Spalte → { fieldname: zahl }. Leere Werte zählen 0, Nicht-Zahlen werden übersprungen. */
export function summen(spalten = [], zeilen = []) {
  const out = {};
  for (const s of spalten) {
    if (!summierbar(s)) continue;
    let summe = 0;
    for (const z of zeilen) {
      const n = Number(z?.[s.fieldname]);
      if (Number.isFinite(n)) summe += n;
    }
    out[s.fieldname] = s.cent ? Math.round(summe) : Math.round(summe * 1000) / 1000;
  }
  return out;
}

/**
 * Bericht laden mit Zeitlimit (8 s): → { status: "ok", zeilen } | { status: "zeitlimit" } | { status: "fehler", code }.
 * Wirft nie (Q-E1).
 */
export async function ladeBericht(laden, { zeitlimitMs = BERICHT_ZEITLIMIT_MS } = {}) {
  let p;
  try {
    p = laden();
  } catch (fehler) {
    return { status: "fehler", code: fehler?.code || "unavailable" };
  }
  const r = await mitZeitlimit(p, zeitlimitMs);
  if (r.status === "zeitlimit") return { status: "zeitlimit" };
  if (r.status === "fehler") return { status: "fehler", code: r.fehler?.code || "unavailable" };
  return { status: "ok", zeilen: Array.isArray(r.wert) ? r.wert : [] };
}

/** CSV des Berichts inkl. Summenzeile (Excel-tauglich, wie lib/backoffice/csv.js). */
export function berichtCsv(spalten = [], zeilen = [], { summeText = "Summe", mitSumme = true } = {}) {
  const sum = summen(spalten, zeilen);
  const extra = mitSumme && Object.keys(sum).length ? [{ ...Object.fromEntries(spalten.map((s, i) => [s.fieldname, i === 0 ? summeText : ""])), ...sum }] : [];
  return alsCsv(spalten, [...zeilen, ...extra]);
}

/** Dateiname „<bericht>-<von>-<bis>.csv“ (nur a–z, 0–9, Bindestrich). */
export function berichtDateiname(bericht, { von, bis } = {}) {
  const teil = (t) => String(t || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${[teil(bericht) || "bericht", teil(von), teil(bis)].filter(Boolean).join("-")}.csv`;
}
