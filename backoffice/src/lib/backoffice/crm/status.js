// Statustöne und Anzeige des CRM (10-konzept-crm § 2.2). Reines Modul.
// Töne = StatusBadge-Töne (grau|blau|tuerkis|orange|gruen|rot|lila); Werte bleiben unverändert gespeichert,
// angezeigt wird das Wort aus texte.js (Qualifiziert → „Angenommen“, Bestaetigt → „Bestätigt“ …).

import { CRM_TEXTE as T } from "./texte.js";

const TOENE = {
  anfrage: { Neu: "blau", Qualifiziert: "tuerkis", "Termin vereinbart": "tuerkis", Angebot: "orange", Gewonnen: "gruen", Verloren: "grau", Spam: "rot", entfallen: "orange" },
  termin: { Unbestaetigt: "orange", Bestaetigt: "tuerkis", Erledigt: "gruen", "Nicht erschienen": "grau", Storniert: "rot", Abgelehnt: "rot", verfallen: "grau" },
  kontakt: { Interessent: "blau", Kunde: "gruen", Inaktiv: "grau", Gesperrt: "rot" },
  gespraech: { Offen: "blau", "Planung beauftragt": "tuerkis", Angebot: "orange", Abgeschlossen: "gruen" },
  aufgabe: { Offen: "blau", "In Arbeit": "orange", Erledigt: "gruen", Verworfen: "grau" },
  datenschutz: { Offen: "blau", "In Arbeit": "orange", Erledigt: "gruen", Abgelehnt: "grau" },
};

export const OBJEKTE = Object.freeze(Object.keys(TOENE));

/** Website-Reservierung ohne E-Mail-Bestätigung (Task setzt Abgelehnt + Grund) → „Verfallen“. */
export function istVerfallen(termin) {
  return termin?.status === "Abgelehnt" && /E-Mail nicht bestätigt/i.test(String(termin?.storno_grund || ""));
}

/**
 * Anzeige eines Status.
 * @param {"anfrage"|"termin"|"kontakt"|"gespraech"|"aufgabe"|"datenschutz"} objekt
 * @param {string} wert gespeicherter Wert
 * @returns {{wert:string, text:string, ton:string}}
 */
export function statusAnzeige(objekt, wert) {
  const w = String(wert || "");
  const text = T.status[objekt]?.[w] ?? w;
  const ton = TOENE[objekt]?.[w] ?? "grau";
  return { wert: w, text: text || "–", ton };
}

/** Termin mit Sonderfall „Verfallen“. */
export function terminStatus(termin) {
  if (istVerfallen(termin)) return statusAnzeige("termin", "verfallen");
  return statusAnzeige("termin", termin?.status);
}

/** Alle Töne eines Objekts als {wert: ton} (für Filterleisten/Kanban). */
export function toeneFuer(objekt) {
  return { ...(TOENE[objekt] || {}) };
}

/** Offene Anfrage-Status (nicht End-Zustände). */
export const ANFRAGE_OFFEN = Object.freeze(["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"]);
export const ANFRAGE_ENDE = Object.freeze(["Gewonnen", "Verloren", "Spam"]);
export const TERMIN_AKTIV = Object.freeze(["Unbestaetigt", "Bestaetigt"]);

/** Material einer Pille für Kanal/Art ohne Statusbedeutung. */
export function materialFuerModus(modus) {
  return { Showroom: "cognac", "Vor Ort": "eiche", Video: "see", Telefon: "salbei" }[modus] || "stein";
}
