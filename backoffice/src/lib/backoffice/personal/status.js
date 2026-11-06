// Status-Anzeige und Töne je Objekt (Konzept § 3.3, Glossar § 3.2). Rohwerte aus den Fixtures („Gespraech“,
// „Zurueckgezogen“, „Durchgefuehrt“) erscheinen nie in der Oberfläche. Töne laut StatusBadge
// (grau|blau|tuerkis|orange|gruen|rot|lila) – im Lounge-Stil auf Materialien abgebildet. Reines Modul.

export const STATUS = Object.freeze({
  stelle: {
    Entwurf: { text: "Entwurf", ton: "grau" },
    Aktiv: { text: "Aktiv", ton: "gruen" },
    Pausiert: { text: "Pausiert", ton: "orange" },
    Besetzt: { text: "Besetzt", ton: "gruen" },
    Archiviert: { text: "Archiviert", ton: "grau" },
  },
  bewerbung: {
    Eingegangen: { text: "Eingegangen", ton: "blau" },
    Gesichtet: { text: "Gesichtet", ton: "tuerkis" },
    Gespraech: { text: "Gespräch", ton: "tuerkis" },
    Angebot: { text: "Angebot", ton: "orange" },
    Eingestellt: { text: "Eingestellt", ton: "gruen" },
    Abgesagt: { text: "Abgesagt", ton: "grau" },
    Zurueckgezogen: { text: "Zurückgezogen", ton: "grau" },
  },
  gespraech: {
    Geplant: { text: "Geplant", ton: "blau" },
    Durchgefuehrt: { text: "Durchgeführt", ton: "gruen" },
    Abgesagt: { text: "Termin abgesagt", ton: "grau" },
    "Nicht erschienen": { text: "Nicht erschienen", ton: "grau" },
  },
  abwesenheit: {
    Beantragt: { text: "Beantragt", ton: "orange" },
    Genehmigt: { text: "Genehmigt", ton: "gruen" },
    Abgelehnt: { text: "Abgelehnt", ton: "rot" },
    Storniert: { text: "Storniert", ton: "grau" },
  },
  // PH Krankmeldung (Backend-Lauf 2): keine Genehmigung – Gemeldet → Bestätigt → Beendet. Nie Rot.
  krank: {
    Gemeldet: { text: "Gemeldet", ton: "orange" },
    Bestaetigt: { text: "Bestätigung liegt vor", ton: "gruen" },
    Beendet: { text: "Beendet", ton: "grau" },
    Storniert: { text: "Storniert", ton: "grau" },
  },
  buchung: {
    Offen: { text: "Offen", ton: "orange" },
    Erfasst: { text: "Erfasst", ton: "grau" },
    Korrigiert: { text: "Korrigiert", ton: "blau" },
  },
  mitarbeiter: {
    Aktiv: { text: "Aktiv", ton: "gruen" },
    Karenz: { text: "Karenz", ton: "orange" },
    Ausgetreten: { text: "Ausgetreten", ton: "grau" },
  },
});

export function statusText(objekt, wert) {
  return STATUS[objekt]?.[wert]?.text || String(wert || "–");
}

export function statusTon(objekt, wert) {
  return STATUS[objekt]?.[wert]?.ton || "grau";
}

/** Alle Werte eines Objekts in Anzeige-Reihenfolge. */
export function statusWerte(objekt) {
  return Object.keys(STATUS[objekt] || {});
}

/** Rolle intern (Select-Wert) → Anzeige. */
export const ROLLE_INTERN = Object.freeze({ Geschaeftsfuehrung: "Geschäftsführung", Verkauf: "Verkauf", Planung: "Planung", Montage: "Montage", Verwaltung: "Verwaltung", Lehrling: "Lehrling" });
export const rolleInternText = (w) => ROLLE_INTERN[w] || String(w || "–");

/** Beschäftigungsart (Select-Wert) → Anzeige. */
export const AUSMASS = Object.freeze({ Vollzeit: "Vollzeit", Teilzeit: "Teilzeit", "Vollzeit oder Teilzeit": "Vollzeit oder Teilzeit", Lehre: "Lehre", Praktikum: "Praktikum", Geringfuegig: "Geringfügig" });
export const ausmassText = (w) => AUSMASS[w] || String(w || "–");

/** Abwesenheitsarten (Select-Werte PH Abwesenheit) → Anzeige. */
export const ART = Object.freeze({
  Urlaub: "Urlaub",
  Zeitausgleich: "Zeitausgleich",
  Pflegefreistellung: "Pflegefreistellung",
  Sonderurlaub: "Sonderurlaub",
  Fortbildung: "Fortbildung",
  Berufsschule: "Berufsschule",
  Unbezahlt: "Unbezahlter Urlaub",
  Karenz: "Karenz",
  Mutterschutz: "Mutterschutz",
  "Zivil-/Praesenzdienst": "Zivil-/Präsenzdienst",
  Krankenstand: "Krankenstand",
  abwesend: "abwesend",
});
export const artText = (w) => ART[w] || String(w || "–");

/** Zeitbuchungsarten. */
export const BUCHUNG_ART = Object.freeze({ Arbeit: "Arbeit", Montage: "Montage", Fortbildung: "Fortbildung", Zeitausgleich: "Zeitausgleich" });
