// Regeln der ErgebnisKarte (G-16, Team P0-5a) – ohne React, unit-getestet.

export const MAX_KNOEPFE = 3;

/**
 * Knöpfe in Anzeigereihenfolge: Nebenaktionen links, „Weiter mit …“ zuletzt (rechts, Primär).
 * Höchstens 3 insgesamt; „Weiter“ hat Vorrang vor Nebenaktionen. Einträge ohne Titel oder Ziel fallen weg.
 * @param {{weiter?:object, aktionen?:object[]}} p
 * @returns {Array<{titel:string, href?:string, onClick?:Function, icon?:string, kuerzel?:string, art:"weiter"|"neben"}>}
 */
export function ergebnisKnoepfe({ weiter, aktionen = [] } = {}) {
  const gueltig = (k) => k && typeof k.titel === "string" && k.titel.trim() && (k.href || typeof k.onClick === "function");
  const w = gueltig(weiter) ? [{ ...weiter, art: "weiter" }] : [];
  const platz = MAX_KNOEPFE - w.length;
  const neben = (Array.isArray(aktionen) ? aktionen : []).filter(gueltig).slice(0, platz).map((k) => ({ ...k, art: "neben" }));
  return [...neben, ...w];
}
