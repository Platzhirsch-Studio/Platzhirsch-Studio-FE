// Statustöne des Bereichs Projekte (10-konzept-projekte.md § 3.3) für StatusBadge (Töne grau|blau|tuerkis|orange|gruen|rot|lila;
// im Lounge-Stil auf Materialien abgebildet: blau→Cognac, tuerkis→See, orange→Eiche, gruen→Salbei, lila→Messing, rot→Ziegel).
// Farbe ist nie allein: StatusBadge zeigt immer das Wort (statusText) und eine Form. Reines Modul.

import { PHASEN, statusText } from "./texte.js";

const TOENE = Object.freeze({
  "PH Projekt": { Anfrage: "blau", Planung: "blau", Angebot: "lila", Auftrag: "lila", Bestellung: "tuerkis", Lieferung: "tuerkis", Montage: "orange", Uebergabe: "gruen", Abgeschlossen: "gruen", Abgebrochen: "rot" },
  "PH Montageauftrag": { Geplant: "blau", Unterwegs: "tuerkis", "In Arbeit": "orange", Erledigt: "gruen", Abgenommen: "gruen", Abgebrochen: "rot" },
  "PH Abnahme": { Entwurf: "grau", Unterzeichnet: "gruen", "Mit Maengeln": "orange", Abgeschlossen: "gruen" },
  "PH Nachtrag": { Entwurf: "grau", Vorgelegt: "blau", Freigegeben: "gruen", Abgelehnt: "rot", Storniert: "grau" },
  "PH Planung": { Entwurf: "grau", "Kunde vorgelegt": "blau", "Aenderung gewuenscht": "orange", Freigegeben: "gruen", Verworfen: "grau" },
  "PH Rendering": { Entwurf: "grau", Vorgelegt: "blau", "Feedback offen": "orange", Freigegeben: "gruen", Verworfen: "grau" },
  "PH Fremdgewerk": { Offen: "grau", Angefragt: "blau", Geplant: "tuerkis", "In Arbeit": "orange", Erledigt: "gruen", Abgesagt: "grau" },
  "PH Projekt Aufgabe": { Offen: "blau", "In Arbeit": "orange", Erledigt: "gruen", Verworfen: "grau" },
  "PH Projektzeit": { Offen: "blau", Abgerechnet: "gruen", "Nicht abrechenbar": "grau" },
  "PH Produktpass": { Aktiv: "gruen", "Garantie abgelaufen": "orange", Verkauft: "grau", Entsorgt: "grau" },
  "PH Referenz": { Eingereicht: "blau", Veroeffentlicht: "gruen", Abgelehnt: "rot", Widerrufen: "grau" },
  "PH Aufmass": { Entwurf: "grau", Erfasst: "blau", Geprueft: "gruen" },
  "PH Projekt Dokument": { Entwurf: "grau", Freigegeben: "gruen", Archiviert: "grau" },
  "PH Rendering Feedback": { Offen: "blau", Beantwortet: "tuerkis", Erledigt: "gruen" },
  "PH Projekt Nachricht": { Ungelesen: "blau", Gelesen: "grau" },
});

/** Ton für StatusBadge. */
export function statusTon(doctype, wert) {
  return TOENE[doctype]?.[wert] || "grau";
}

/** Durchgestrichen (Storniert/Abgebrochen bei Montage, Konzept § 3.3). */
export function statusDurchgestrichen(doctype, wert) {
  return (doctype === "PH Montageauftrag" && wert === "Abgebrochen") || (doctype === "PH Nachtrag" && wert === "Storniert");
}

/** Alles, was StatusBadge braucht: { wert, ton, text, storniert }. */
export function statusBadge(doctype, wert) {
  return { wert, ton: statusTon(doctype, wert), text: statusText(doctype, wert), storniert: statusDurchgestrichen(doctype, wert) };
}

/** Töne aller Werte eines DocTypes (für DataTable/Kanban: `statusTon`-Map Wert → Ton). */
export function tonKarte(doctype) {
  return { ...(TOENE[doctype] || {}) };
}

/** Lieferstatus-Pille: Material + Text. */
export function lieferstatusMaterial(s) {
  return { offen: "stein", bestellt: "cognac", bestaetigt: "see", teilgeliefert: "eiche", geliefert: "salbei", montiert: "salbei", storniert: "stein" }[s] || "stein";
}

/** Index der Phase (0–8), Abgebrochen = -1. */
export function phasenIndex(status) {
  return PHASEN.indexOf(status);
}

export const LAUFEND = Object.freeze(["Anfrage", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe"]);
export const istLaufend = (status) => LAUFEND.includes(status);
