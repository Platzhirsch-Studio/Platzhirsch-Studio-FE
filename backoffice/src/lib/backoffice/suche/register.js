// Paletten-Register (G-01, MASTER § 3.5): setzt suche/<bereich>.js zusammen – Schnellaktionen,
// Nummernmuster, Hilfe-Artikel. Rein und browsertauglich (keine Server-Importe), damit ScanTor und
// codes.js Belegnummern auch im Client erkennen. Die serverseitige Suche liegt in suche/index.js.
// Bereiche schreiben NUR in ihre eigene Teildatei, nie hier.

import { BEREICH_SLUGS } from "../bereiche/index.js";
import { normalisiereMuster } from "./muster.js";
import zentrale from "./zentrale.js";
import crm from "./crm.js";
import projekte from "./projekte.js";
import faktura from "./faktura.js";
import shop from "./shop.js";
import sortiment from "./sortiment.js";
import logistik from "./logistik.js";
import service from "./service.js";
import kundenkarte from "./kundenkarte.js";
import marketing from "./marketing.js";
import personal from "./personal.js";
import kassa from "./kassa.js";
import ablage from "./ablage.js";
import posteingang from "./posteingang.js";

/**
 * @typedef {{id:string, titel:string, href:string, recht:{aktion:string, doctype?:string}, rang?:number, kuerzel?:string}} Schnellaktion
 * @typedef {{regex?:RegExp, serie?:string, doctype:string}} Nummernmuster
 * @typedef {{schnellaktionen?:Schnellaktion[], nummernmuster?:Nummernmuster[], hilfe?:Array<{titel:string, pfad:string}>}} SucheBereich
 */

/** Teildateien je Bereich (Schlüssel = Bereichs-Slug). */
export const SUCHE_BEREICHE = { zentrale, crm, projekte, faktura, shop, sortiment, logistik, service, kundenkarte, marketing, personal, kassa, ablage, posteingang };

/**
 * Schnellaktionen aller Bereiche, sortiert nach `rang` (gleicher Rang: Bereichsreihenfolge).
 * Form wie vor P0-1: {id, titel, href, bereich, aktion, doctype?, rang, kuerzel?}.
 */
export const SCHNELLAKTIONEN = BEREICH_SLUGS.flatMap((slug, bi) =>
  (SUCHE_BEREICHE[slug]?.schnellaktionen || []).map((a, i) => ({
    id: a.id,
    titel: a.titel,
    href: a.href,
    bereich: slug,
    aktion: a.recht?.aktion || "read",
    ...(a.recht?.doctype ? { doctype: a.recht.doctype } : {}),
    rang: a.rang ?? 1000 + bi * 100 + i,
    ...(a.kuerzel ? { kuerzel: a.kuerzel } : {}),
  }))
).sort((a, b) => a.rang - b.rang);

/** Nummernmuster aller Bereiche: {regex, doctype, bereich}. */
export const NUMMERNMUSTER = BEREICH_SLUGS.flatMap((slug) => (SUCHE_BEREICHE[slug]?.nummernmuster || []).map((m) => ({ ...normalisiereMuster(m), bereich: slug })));

/** Hilfe-Artikel aller Bereiche: {titel, pfad, bereich}. */
export const HILFE = BEREICH_SLUGS.flatMap((slug) => (SUCHE_BEREICHE[slug]?.hilfe || []).map((h) => ({ ...h, bereich: slug })));

/**
 * Belegnummer erkennen (Palette, ScanTor, codes.js): „re-2026-00114“ → { doctype:"PH Rechnung", name:"RE-2026-00114" }.
 * Groß-/Kleinschreibung egal, Leerzeichen am Rand egal. null, wenn kein Muster passt.
 */
export function nummerErkennen(text) {
  const t = String(text || "").trim().toUpperCase();
  if (!t || t.length > 40) return null;
  for (const m of NUMMERNMUSTER) {
    if (m.regex.test(t)) return { doctype: m.doctype, name: t, bereich: m.bereich };
  }
  return null;
}
