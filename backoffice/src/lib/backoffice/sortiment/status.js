// Bereich Sortiment – Status-Töne je DocType und Rohwert (10-konzept-sortiment § 2, 03 § 1.5).
// Töne des StatusBadge: grau · blau · tuerkis · orange · gruen · rot · lila (Form + Wort, nie Farbe allein).
// Reines Datenmodul.

import { anzeigeWert } from "./texte.js";

export const TOENE = Object.freeze({
  produkt: { Entwurf: "grau", Geprueft: "blau", Aktiv: "gruen", Pausiert: "orange", Ausgelaufen: "grau" },
  bestellung: { Entwurf: "grau", Gesendet: "blau", "AB erhalten": "blau", "AB geprueft": "tuerkis", Teilgeliefert: "orange", Geliefert: "gruen", Abgeschlossen: "grau", Storniert: "grau" },
  bewertung: { offen: "grau", ok: "gruen", pruefen: "orange", abgelehnt: "rot" },
  abMerker: { offen: "grau", bestaetigt: "gruen", abweichung: "orange", geklaert: "tuerkis" },
  we: { Offen: "grau", Teilweise: "orange", Vollstaendig: "gruen", Reklamiert: "rot" },
  weZustand: { ok: "gruen", beschaedigt: "rot", Transportschaden: "rot", falsch: "rot", fehlt: "orange" },
  preisliste: { Hochgeladen: "blau", Geprueft: "tuerkis", Uebernommen: "gruen", Verworfen: "grau" },
  haendler: { Keiner: "orange", "Anfrage laeuft": "blau", Haendler: "gruen", Vertragshaendler: "gruen", Exklusiv: "gruen", Partner: "gruen" },
  marke: { Aktiv: "gruen", Pausiert: "orange", Inaktiv: "grau" },
  bildFreigabe: { erteilt: "gruen", offen: "orange", abgelehnt: "rot" },
  uebermittlung: { Vorbereitet: "grau", Exportiert: "blau", Uebermittelt: "tuerkis", Bestaetigt: "gruen", Fehler: "rot" },
  vorschlag: { Offen: "blau", Bestellt: "tuerkis", Erledigt: "gruen", Verworfen: "grau" },
  aktivInaktiv: { Aktiv: "gruen", Inaktiv: "grau" },
});

/** Glossar-Gruppe je Ton-Gruppe (für die Anzeige). */
const GLOSSAR_GRUPPE = {
  produkt: "produktStatus",
  bestellung: "bestellStatus",
  bewertung: "bewertung",
  abMerker: "abMerker",
  we: "weStatus",
  weZustand: "weZustand",
  preisliste: "preislisteStatus",
  haendler: "haendlerstatus",
  marke: "markeStatus",
  bildFreigabe: "bildFreigabe",
  uebermittlung: "uebermittlungStatus",
  vorschlag: "vorschlagStatus",
  aktivInaktiv: "markeStatus",
};

/** { wert, text, ton } für StatusBadge. */
export function status(gruppe, wert) {
  const ton = TOENE[gruppe]?.[wert] || "grau";
  return { wert: wert || "", text: anzeigeWert(GLOSSAR_GRUPPE[gruppe], wert), ton };
}

/** Workflow-Reihenfolge für Kanban/Kette. */
export const PRODUKT_REIHENFOLGE = ["Entwurf", "Geprueft", "Aktiv", "Pausiert", "Ausgelaufen"];
export const BESTELL_REIHENFOLGE = ["Entwurf", "Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert", "Geliefert", "Abgeschlossen", "Storniert"];
export const OFFENE_BESTELLSTATUS = ["Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert"];
export const BESTELL_ENDE = ["Abgeschlossen", "Storniert"];

/** Segmente der Bestellliste → Status-Filter. */
export const BESTELL_SEGMENTE = Object.freeze({
  alle: null,
  entwurf: ["Entwurf"],
  unterwegs: ["Gesendet"],
  ab: ["AB erhalten"],
  lieferung: ["AB geprueft", "Teilgeliefert", "Geliefert"],
  fertig: ["Abgeschlossen", "Storniert"],
});
