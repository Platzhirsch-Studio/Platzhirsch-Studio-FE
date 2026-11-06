// Bereich Marketing – Status-Töne (10-konzept-marketing § 2.0.4, MASTER Q-G2). Ton-Namen wie StatusBadge:
// grau (neutral) · blau (info) · tuerkis (progress) · orange (warning) · rot (danger) · gruen (success).
// Regel: Rot nur für Abbruch/Problem; ein Widerruf ist das Recht des Kunden und daher grau. Reines Datenmodul.

import { statusText } from "./texte.js";

export const TOENE = Object.freeze({
  ausgabe: { Entwurf: "grau", Freigabe: "orange", Geplant: "blau", "Wird versendet": "tuerkis", Versendet: "gruen", Abgebrochen: "rot" },
  abo: { "Angemeldet unbestaetigt": "orange", Aktiv: "gruen", Abgemeldet: "grau", Bounce: "orange", Beschwerde: "rot" },
  einwilligung: { Offen: "blau", Bestaetigt: "gruen", Widerrufen: "grau", Abgelaufen: "grau" },
  event: { Geplant: "blau", Offen: "blau", Ausgebucht: "orange", Durchgefuehrt: "gruen", Abgesagt: "grau" },
  anmeldung: { angemeldet: "blau", bestaetigt: "gruen", warteliste: "orange", abgesagt: "grau", erschienen: "gruen", "nicht erschienen": "grau" },
  kampagne: { Entwurf: "grau", Aktiv: "gruen", Pausiert: "orange", Beendet: "grau" },
  social: { Idee: "grau", Entwurf: "grau", Wartet: "orange", Freigegeben: "tuerkis", Geplant: "blau", Veroeffentlicht: "gruen", Verworfen: "grau" },
  empfehlung: { "Code ausgegeben": "blau", "Anfrage eingegangen": "blau", "Auftrag erteilt": "blau", "Geliefert und bezahlt": "tuerkis", "Gutschein faellig": "orange", "Gutschein ausgegeben": "gruen", Verfallen: "grau", Abgelehnt: "grau" },
  reise: { Entwurf: "grau", Aktiv: "gruen", AktivWartet: "orange", Pausiert: "orange" },
  segment: { Aktiv: "gruen", Archiviert: "grau" },
  versand: { geplant: "blau", gesendet: "tuerkis", verzoegert: "orange", zugestellt: "gruen", fehler: "rot", uebersprungen: "grau", bounce: "orange", bounce_weich: "orange", bounce_hart: "orange", beschwerde: "rot", abgemeldet: "grau" },
  reiseVersand: { geplant: "blau", gesendet: "gruen", uebersprungen: "grau", fehler: "rot" },
});

/** Ton eines Status; Event „Abgesagt“ mit Teilnehmern ist rot (Problem), ohne grau. */
export function ton(gruppe, wert, { mitTeilnehmern = false } = {}) {
  if (gruppe === "event" && wert === "Abgesagt") return mitTeilnehmern ? "rot" : "grau";
  return TOENE[gruppe]?.[wert] || "grau";
}

/** { wert, ton, text } für StatusBadge. */
export function statusFuer(gruppe, wert, opts) {
  return { wert, ton: ton(gruppe, wert, opts), text: statusText(gruppe, wert) };
}

/** Anzeige-Status eines Social-Beitrags: Entwurf mit offener Freigabe-Aufgabe → „Wartet“. */
export function socialStatus(beitrag, { wartet = false } = {}) {
  if (beitrag?.status === "Entwurf" && wartet) return "Wartet";
  return beitrag?.status || "Idee";
}

/** Anzeige-Status einer Kundenreise: Aktiv ohne Automatik → „Aktiv · wartet auf Automatik“. */
export function reiseStatus(reise, { automatik = false } = {}) {
  if (reise?.status === "Aktiv" && !automatik) return "AktivWartet";
  return reise?.status || "Entwurf";
}

/** Reihenfolge der Status-Chips je Liste (Konzept-Reihenfolge, Endzustände hinten). */
export const CHIP_REIHE = Object.freeze({
  ausgabe: ["Entwurf", "Freigabe", "Geplant", "Wird versendet", "Versendet", "Abgebrochen"],
  abo: ["Aktiv", "Angemeldet unbestaetigt", "Abgemeldet", "Bounce", "Beschwerde"],
  einwilligung: ["Offen", "Bestaetigt", "Widerrufen", "Abgelaufen"],
  event: ["Geplant", "Offen", "Ausgebucht", "Durchgefuehrt", "Abgesagt"],
  kampagne: ["Entwurf", "Aktiv", "Pausiert", "Beendet"],
  social: ["Idee", "Entwurf", "Wartet", "Freigegeben", "Geplant", "Veroeffentlicht", "Verworfen"],
  empfehlung: ["Code ausgegeben", "Anfrage eingegangen", "Auftrag erteilt", "Gutschein faellig", "Gutschein ausgegeben", "Verfallen", "Abgelehnt"],
  reise: ["Aktiv", "Pausiert", "Entwurf"],
  anmeldung: ["angemeldet", "bestaetigt", "warteliste", "erschienen", "nicht erschienen", "abgesagt"],
});

/** Endzustände je Liste (unten einsortiert). */
export const ENDE = Object.freeze({
  ausgabe: new Set(["Versendet", "Abgebrochen"]),
  event: new Set(["Durchgefuehrt", "Abgesagt"]),
  kampagne: new Set(["Beendet"]),
  empfehlung: new Set(["Gutschein ausgegeben", "Verfallen", "Abgelehnt"]),
});
