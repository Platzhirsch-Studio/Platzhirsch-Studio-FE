// Texte für DataTable und Filterleiste (Team P0-5b). Reines Modul.

export const LISTE = {
  eintraege: (n) => `${n} ${n === 1 ? "Eintrag" : "Einträge"}`,
  gewaehlt: (n) => `${n} gewählt`,
  aufheben: "Aufheben",
  spalten: "Spalten",
  spaltenTitel: "Sichtbare Spalten",
  csv: "CSV",
  csvExportiert: (datei) => `CSV exportiert (${datei})`,
  massenTeil: (ok, nein) => `${ok} erledigt, ${nein} nicht möglich`,
  massenOk: (n) => `${n} ${n === 1 ? "Datensatz" : "Datensätze"} aktualisiert`,
  leerTitel: "Nichts gefunden",
  leerText: "Keine Datensätze für diese Auswahl.",
  seiten: "Seiten",
  bereich: (von, bis, gesamt) => `${von}–${bis} von ${gesamt}`,
  seiteVon: (s, n) => `, Seite ${s} von ${n}`,
  zurueck: "Zurück",
  weiter: "Weiter",
  alleWaehlen: "Alle auswählen",
  waehlen: (n) => `${n} auswählen`,
  ja: "ja",
  nein: "nein",
  laedt: "Lädt",
  sortieren: "Sortieren",
};

export const FILTER = {
  status: "Status",
  suche: "Suche",
  suchePlatzhalter: "Nummer, Name …",
  zeitraum: "Zeitraum",
  von: "von",
  bis: "bis",
  anwenden: "Anwenden",
  zuruecksetzen: "Zurücksetzen",
  filtern: "Filtern",
  gesetzt: ", gesetzt",
};
