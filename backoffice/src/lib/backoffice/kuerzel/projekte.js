// Kürzel – Bereich Projekte (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-PRJ.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@projekte“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).

// Quelle: 10-konzept-projekte.md § 3.7 (E12) – Aktionen Umschalt+Buchstabe, Tabs Alt+1…6 (Fundament), Primär Strg/⌘+Enter (Fundament).
const eintraege = [
  { kontext: "akte", taste: "shift+h", id: "projekte.zeit-buchen", titel: "Zeit buchen …", nurDialog: true },
  { kontext: "akte", taste: "shift+a", id: "projekte.aufgabe", titel: "Aufgabe anlegen …", nurDialog: true },
  { kontext: "akte", taste: "shift+d", id: "projekte.aktivitaet", titel: "Aktivität ein/aus" },
  { kontext: "akte", taste: "shift+m", id: "projekte.nachricht", titel: "Nachricht an Kunden …", nurDialog: true, aussenwirkung: true },
  { kontext: "liste", taste: "shift+e", id: "projekte.erledigt", titel: "Rückmeldung erledigt" },
  { kontext: "liste", taste: "shift+r", id: "projekte.ins-rendering", titel: "Ins Rendering" },
  { kontext: "liste", taste: "shift+u", id: "projekte.ungelesen", titel: "Als ungelesen" },
  { kontext: "karten", taste: "shift+t", id: "projekte.heute", titel: "Kalender: heute" },
];

export default eintraege;
