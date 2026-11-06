// Texte für Formular, Speicherleiste (G-09), useAutosave, Kindtabelle, WorkflowLeiste, Zeitleiste
// (Team P0-5b). Reines Modul.

export const SPEICHERN = {
  speichern: "Speichern",
  anlegen: "Anlegen",
  speichert: "Speichert …",
  verwerfen: "Verwerfen",
  abbrechen: "Abbrechen",
  zurListe: "Zur Liste",
  ungespeichert: "Ungespeichert",
  ungespeichertLang: "Ungespeicherte Änderungen",
  keineAenderungen: "Keine Änderungen",
  gespeichert: (zeit) => (zeit ? `Gespeichert ${zeit}` : "Gespeichert"),
  nichtGespeichert: "Nicht gespeichert",
  fehler: "Nicht gespeichert – erneut versuchen",
  erneut: "Erneut",
  stand: (zeit) => `Stand ${zeit}`,
  kuerzel: "Strg S",
  pruefen: "Bitte die markierten Felder prüfen.",
  angelegt: (art, name) => `${art} ${name} angelegt`,
  gespeichertToast: "Gespeichert",
  verworfen: "Änderungen verworfen",
};

export const FORMULAR = {
  abschnitte: "Abschnitte",
  zeile: "Zeile",
  zeilen: (n) => `${n} ${n === 1 ? "Zeile" : "Zeilen"}`,
  zeileNeu: "Zeile",
  zeileEntfernen: (i) => `Zeile ${i} entfernen`,
  keineZeilen: "Noch keine Zeilen.",
  nichtBearbeitbar: "Diese Positionen lassen sich hier nicht bearbeiten; sie bleiben unverändert.",
  oeffnen: "öffnen",
};

export const VORGANG = {
  status: "Status",
  gebucht: "gebucht",
  storniert: "storniert",
  buchen: "Buchen",
  buchenText: "Gebuchte Dokumente lassen sich nicht mehr ändern, nur stornieren.",
  gebuchtToast: "Gebucht",
  stornieren: "Stornieren",
  stornierenText: "Das Dokument wird storniert. Es bleibt mit Nummer erhalten.",
  storniertToast: "Storniert",
  drucken: "Drucken",
  loeschen: "Löschen",
  geloescht: "Gelöscht",
  setztStatus: (aktion, ziel) => `„${aktion}“ setzt den Status auf „${ziel}“.`,
  ausgefuehrt: (t) => `${t} ausgeführt`,
  wirdAusgefuehrt: (t) => `„${t}“ wird ausgeführt.`,
  loeschenText: (art, name) => `${art} ${name} wird unwiderruflich gelöscht.`,
};

export const VERLAUF = {
  titel: "Verlauf",
  unter: "Kommentare, Änderungen und Anhänge an einem Ort",
  kommentar: "Kommentar",
  platzhalter: "Kommentar schreiben …",
  senden: "Senden",
  leer: "Noch keine Einträge.",
  arten: { Version: "Änderung", Workflow: "Ablauf", Attachment: "Anhang", Comment: "Kommentar" },
  angelegt: "Angelegt",
  datei: (n) => `Datei: ${n}`,
};
