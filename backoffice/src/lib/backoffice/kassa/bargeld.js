// Kassa – Bargeld in der Lade (Team B-KAS, Konzept §3.7, E5–E8). Eine Zahl „Bargeld in der Lade“:
//   Anfang des Tages + Bar-Einnahmen − Bar-Ausgaben + Einlagen − Entnahmen (Fach-Formel §3.7.2).
// Tagesstart-Wert (E6): bargeld_ende_cent des letzten Abschlusses (Fähigkeit `anfang_server`), sonst
// bargeld_ist_cent des letzten Abschlusses + Einlagen − Entnahmen seit geschlossen_am. Reines Modul.

import { KassenFehler } from "./betraege.js";

/** Zwecke beim Einlegen/Entnehmen (§3.7.2). `art` = Kassenbuch-Art, `projekt` = Projektbezug sinnvoll. */
export const ZWECKE = Object.freeze([
  { id: "bank", titel: "Geldtransit Bank", art: "Entnahme" },
  { id: "tresor", titel: "Geldtransit Tresor", art: "Entnahme" },
  { id: "ausgabe", titel: "Ausgabe", art: "Entnahme", projekt: true, beleg: true },
  { id: "privat", titel: "Privatentnahme", art: "Entnahme" },
  { id: "wechselgeld", titel: "Wechselgeld", art: "Einlage" },
  { id: "tresor-ein", titel: "Aus dem Tresor", art: "Einlage" },
  { id: "privat-ein", titel: "Privateinlage", art: "Einlage" },
]);

export function zweckeFuer(art) {
  return ZWECKE.filter((z) => z.art === art);
}

export function zweck(id) {
  return ZWECKE.find((z) => z.id === id) || null;
}

/**
 * Text für `grund` (Übergang ohne Fähigkeit `kassenbuch_zweck`): Zweck als Präfix, Projekt als Klammer.
 * „Ausgabe: Porto (Projekt PRJ-2026-0007)“
 */
export function grundText({ zweckId, grund = "", projekt = "" }) {
  const z = zweck(zweckId);
  const kopf = z ? z.titel : "";
  const teile = [kopf && grund ? `${kopf}: ${grund.trim()}` : kopf || grund.trim()];
  if (projekt) teile.push(`(Projekt ${projekt})`);
  return teile.filter(Boolean).join(" ").slice(0, 280);
}

/** Bargeld in der Lade jetzt. */
export function inDerLade({ anfang = 0, barEinnahmen = 0, barAusgaben = 0, einlagen = 0, entnahmen = 0 }) {
  return Math.trunc(anfang) + Math.trunc(barEinnahmen) - Math.trunc(barAusgaben) + Math.trunc(einlagen) - Math.trunc(entnahmen);
}

/**
 * Tagesstart-Vorschlag (E6).
 * @param {{letzter?:{bargeld_ende_cent?:number, bargeld_ist_cent?:number, geschlossen_am?:string}|null,
 *   buchungenSeit?:Array<{art:string, betrag_cent:number, zeitpunkt:string}>, anfangServer?:boolean}} p
 * @returns {{wert:number, quelle:"server"|"formel"|"leer"}}
 */
export function tagesstart({ letzter = null, buchungenSeit = [], anfangServer = false }) {
  if (!letzter) return { wert: 0, quelle: "leer" };
  if (anfangServer && Number.isFinite(Number(letzter.bargeld_ende_cent))) return { wert: Math.trunc(letzter.bargeld_ende_cent), quelle: "server" };
  let wert = Math.trunc(Number(letzter.bargeld_ist_cent) || 0);
  for (const b of buchungenSeit) {
    if (letzter.geschlossen_am && String(b.zeitpunkt) <= String(letzter.geschlossen_am)) continue;
    if (b.art === "Einlage") wert += Math.trunc(b.betrag_cent);
    if (b.art === "Entnahme") wert -= Math.trunc(b.betrag_cent);
  }
  return { wert, quelle: "formel" };
}

/**
 * Prüfung einer Bargeld-Buchung vor dem Senden (§3.7.2, E8).
 * @returns {{fehler:string|null, warnung:string|null}}
 */
export function pruefeBuchung({ art, betragCent, zweckId, grund = "", bestandCent = null, stoppAbBestand = false }) {
  if (!["Einlage", "Entnahme"].includes(art)) return { fehler: "art", warnung: null };
  if (!(Math.trunc(betragCent) > 0)) return { fehler: "betrag", warnung: null };
  if (!zweck(zweckId) || zweck(zweckId).art !== art) return { fehler: "zweck", warnung: null };
  if (zweckId === "ausgabe" && !String(grund).trim()) return { fehler: "grund", warnung: null };
  if (art === "Entnahme" && bestandCent !== null && betragCent > bestandCent) {
    return stoppAbBestand ? { fehler: "ueberBestand", warnung: null } : { fehler: null, warnung: "ueberBestand" };
  }
  return { fehler: null, warnung: null };
}

/** Kassenbuch-Zeile → Bewegung mit Vorzeichen (für Listen). */
export function bewegung(zeile) {
  const b = Math.trunc(Number(zeile.betrag_cent) || 0);
  if (["Entnahme", "Barausgabe"].includes(zeile.art)) return -Math.abs(b);
  if (zeile.art === "Differenz") return b;
  if (!["Anfangsbestand", "Einlage", "Bareinnahme"].includes(zeile.art)) throw new KassenFehler(`Unbekannte Art ${zeile.art}`);
  return Math.abs(b);
}
