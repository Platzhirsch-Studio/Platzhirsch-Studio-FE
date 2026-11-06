// Service – Statuswerte ↔ UI-Text, Töne (StatusBadge), Phasen, Kanäle (10-konzept-service §2.2, §3.1, N9).
// Gespeichert wird immer der App-Wert („Entscheidung“, „Geprueft“); angezeigt wird der UI-Text („Entschieden“).
// Reines Modul (keine "@/"-Importe).

/** PH Servicefall.status → { text, ton } */
export const FALL_STATUS = Object.freeze({
  Gemeldet: { text: "Gemeldet", ton: "blau" },
  Geprueft: { text: "Geprüft", ton: "tuerkis" },
  Entscheidung: { text: "Entschieden", ton: "tuerkis" },
  "In Bearbeitung": { text: "In Bearbeitung", ton: "orange" },
  "Einsatz geplant": { text: "Einsatz geplant", ton: "orange" },
  Erledigt: { text: "Erledigt", ton: "gruen" },
  Geschlossen: { text: "Geschlossen", ton: "grau" },
  Abgelehnt: { text: "Abgelehnt", ton: "rot" },
});

/** Offene Status (Kennzahl „Offene Servicefälle“, Reiter). */
export const OFFEN = Object.freeze(["Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant"]);

/** Sechs Phasen der Akte (Einsatz geplant ist Unterzeile von „In Bearbeitung“). */
export const PHASEN = Object.freeze([
  { id: "Gemeldet", titel: "Gemeldet" },
  { id: "Geprueft", titel: "Geprüft" },
  { id: "Entscheidung", titel: "Entschieden" },
  { id: "In Bearbeitung", titel: "In Bearbeitung" },
  { id: "Erledigt", titel: "Erledigt" },
  { id: "Geschlossen", titel: "Geschlossen" },
]);

/** Index der Phase eines Status (Einsatz geplant → In Bearbeitung). Abgelehnt → -1. */
export function phaseIndex(status) {
  if (status === "Einsatz geplant") return 3;
  return PHASEN.findIndex((p) => p.id === status);
}

export const EINSATZ_STATUS = Object.freeze({
  Geplant: { text: "Geplant", ton: "blau" },
  Bestaetigt: { text: "Bestätigt", ton: "tuerkis" },
  Unterwegs: { text: "Unterwegs", ton: "orange" },
  "In Arbeit": { text: "In Arbeit", ton: "orange" },
  Erledigt: { text: "Erledigt", ton: "gruen" },
  "Nicht angetroffen": { text: "Nicht angetroffen", ton: "rot" },
  Abgebrochen: { text: "Abgebrochen", ton: "grau" },
});
export const EINSATZ_LAUFEND = Object.freeze(["Unterwegs", "In Arbeit"]);
export const EINSATZ_OFFEN = Object.freeze(["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"]);
export const EINSATZ_PHASEN = Object.freeze(["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit", "Erledigt"]);

export const BESTELLUNG_STATUS = Object.freeze({
  Entwurf: { text: "Entwurf", ton: "grau" },
  Gesendet: { text: "Gesendet", ton: "blau" },
  Bestaetigt: { text: "Bestätigt", ton: "tuerkis" },
  Teilgeliefert: { text: "Teilgeliefert", ton: "orange" },
  Geliefert: { text: "Geliefert", ton: "gruen" },
  Storniert: { text: "Storniert", ton: "grau" },
});

export const REGRESS_STATUS = Object.freeze({
  Offen: { text: "Offen", ton: "grau" },
  Gemeldet: { text: "Gemeldet", ton: "blau" },
  Anerkannt: { text: "Anerkannt", ton: "tuerkis" },
  Abgelehnt: { text: "Abgelehnt", ton: "rot" },
  Verrechnet: { text: "Verrechnet", ton: "gruen" },
});

export const ABGLEICH = Object.freeze({
  Offen: { text: "Offen", ton: "grau" },
  Ausgeglichen: { text: "Ausgeglichen", ton: "gruen" },
  Unterdeckung: { text: "Unterdeckung", ton: "orange" },
  Ueberdeckung: { text: "Überdeckung", ton: "orange" },
  Ausgebucht: { text: "Ausgebucht", ton: "grau" },
});

export const PFLEGE_STATUS = Object.freeze({
  Angefragt: { text: "Angefragt", ton: "blau" },
  Angeboten: { text: "Angeboten", ton: "lila" },
  Aktiv: { text: "Aktiv", ton: "gruen" },
  Pausiert: { text: "Pausiert", ton: "orange" },
  Gekuendigt: { text: "Gekündigt", ton: "grau" },
  Beendet: { text: "Beendet", ton: "grau" },
});
export const PFLEGE_PHASEN = Object.freeze(["Angefragt", "Angeboten", "Aktiv", "Gekuendigt", "Beendet"]);

export const AUFTRAG_STATUS = Object.freeze({
  Angefragt: { text: "Angefragt", ton: "blau" },
  Angeboten: { text: "Angeboten", ton: "lila" },
  Beauftragt: { text: "Beauftragt", ton: "tuerkis" },
  Abgeholt: { text: "Abgeholt", ton: "orange" },
  Eingelagert: { text: "Eingelagert", ton: "orange" },
  "In Arbeit": { text: "In Arbeit", ton: "orange" },
  Zurueckgebracht: { text: "Zurückgebracht", ton: "gruen" },
  Abgerechnet: { text: "Abgerechnet", ton: "grau" },
  Storniert: { text: "Storniert", ton: "grau" },
});
export const AUFTRAG_PHASEN = Object.freeze(["Angefragt", "Angeboten", "Beauftragt", "Abgeholt", "Eingelagert", "In Arbeit", "Zurueckgebracht"]);

export const ERSATZTEIL_ZEILE = Object.freeze({
  Benoetigt: { text: "Benötigt", material: "eiche" },
  "Aus Bestand": { text: "Aus Bestand", material: "see" },
  Bestellt: { text: "Bestellt", material: "cognac" },
  Eingetroffen: { text: "Eingetroffen", material: "salbei" },
  Verbaut: { text: "Verbaut", material: "stein" },
  Storniert: { text: "Storniert", material: "stein" },
});

/** Erstreaktions-Kanäle der App (erstreaktion_erfassen); „Showroom“ ist keiner (→ „Vor Ort“). */
export const ERSTREAKTION_KANAELE = Object.freeze(["Telefon", "Vor Ort", "Rückruf"]);
export const ARTEN = Object.freeze(["Mangel", "Transportschaden", "Montagefehler", "Garantie", "Kulanz", "Pflegefrage", "Serviceauftrag"]);
export const ARTEN_HAUPT = Object.freeze(["Mangel", "Transportschaden", "Montagefehler"]);
export const KANAELE = Object.freeze(["Telefon", "E-Mail", "Portal", "Website", "Showroom", "Montage", "Wareneingang", "Intern"]);
export const PRIORITAETEN = Object.freeze(["Niedrig", "Normal", "Hoch", "Dringend"]);
export const KUNDENWUENSCHE = Object.freeze(["Offen", "Verbesserung", "Austausch", "Preisminderung", "Wandlung", "Beratung"]);
/** Entscheidungen in VGG-Reihenfolge (S2 Teil 2). */
export const ENTSCHEIDUNGEN = Object.freeze(["Verbesserung", "Austausch", "Preisminderung", "Wandlung", "Kulanz", "Abgelehnt"]);
export const URSACHEN = Object.freeze(["Material", "Verarbeitung", "Transport", "Montage", "Bedienung", "Verschleiss", "Unbekannt"]);
export const ABLEHNUNGSGRUENDE = Object.freeze(["Kein Mangel (Gebrauchsspur)", "Bedienungsfehler", "Frist abgelaufen", "Fremdeinwirkung", "Nicht reproduzierbar", "Sonstiges"]);
export const EINSATZ_ARTEN = Object.freeze(["Besichtigung", "Reparatur", "Austausch", "Nacharbeit", "Wartung", "Pflege"]);
export const EINSATZ_ERGEBNISSE = Object.freeze(["Behoben", "Teilweise behoben", "Nicht behoben", "Weiterer Einsatz noetig", "Ersatzteil noetig", "Kein Mangel festgestellt"]);
export const UNTERSCHRIFT_ARTEN = Object.freeze(["Unterschrift", "Name bestätigt", "Kunde abwesend", "Verweigert"]);
export const KOSTENTRAEGER = Object.freeze(["Gewaehrleistung", "Garantie", "Kulanz", "Kunde", "Intern"]);
export const REGRESS_FORMEN = Object.freeze(["Gutschrift", "Ersatzlieferung kostenlos", "Reparatur durch Hersteller", "Verrechnung mit Rechnung", "Sonstiges"]);
export const REGRESS_ABLEHNUNG = Object.freeze(["Frist abgelaufen", "Kein Produktionsfehler", "Bedienungsfehler", "Transportschaden nicht gemeldet", "Kulanz des Händlers", "Sonstiges"]);
export const BEWEGUNGSARTEN = Object.freeze(["Zugang", "Verbrauch", "Inventur"]);

/** Umschriebene App-Werte → Anzeige (Umlaute, „noetig“ → „nötig“). */
const ANZEIGE = {
  Geprueft: "Geprüft",
  Entscheidung: "Entschieden",
  Bestaetigt: "Bestätigt",
  Benoetigt: "Benötigt",
  Gekuendigt: "Gekündigt",
  Zurueckgebracht: "Zurückgebracht",
  Ueberdeckung: "Überdeckung",
  Gewaehrleistung: "Gewährleistung",
  Gefaehrdet: "gefährdet",
  Erfuellt: "erfüllt",
  Verschleiss: "Verschleiß",
  "Weiterer Einsatz noetig": "Weiterer Einsatz nötig",
  "Ersatzteil noetig": "Ersatzteil nötig",
  "Nicht noetig": "Nicht nötig",
  "Jaehrlich im Voraus": "Jährlich im Voraus",
  "Jaehrlich nachtraeglich": "Jährlich nachträglich",
  "Pflege Jahres-Abo": "Pflege Jahres-Abo",
};

/** App-Wert → UI-Text (unbekannte Werte unverändert). */
export function text(wert) {
  if (wert === null || wert === undefined) return "";
  return ANZEIGE[wert] ?? String(wert);
}

/** Status-Pille eines Falls inkl. Zusatz „· wartet auf Freigabe“. */
export function fallStatus(fall) {
  const s = FALL_STATUS[fall?.status] || { text: text(fall?.status), ton: "grau" };
  const zusatz = fall?.status === "Entscheidung" && fall?.kulanz_freigabe_status === "Angefordert" ? "wartet auf Freigabe" : null;
  return { ...s, zusatz };
}

/** Töne-Map je Statusliste für StatusBadge/Kanban: { wert: ton }. */
export function toene(map) {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.ton]));
}
