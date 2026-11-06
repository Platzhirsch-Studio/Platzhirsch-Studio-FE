// Kürzel – Bereich Ablage. Schreibt: Team B-ABL (G-02, Q-F5, MASTER § 3.5).
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@ablage“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
//
// Konzept 10-konzept-ablage §2.3. Vorschau (Leertaste), Öffnen (Enter), Auswahl (X), Primär (Strg/⌘+Enter),
// Rückgängig (Strg/⌘+Z) kommen aus dem Fundament. Teilen öffnet nur den Dialog (Außenwirkung).

const eintraege = [
  { kontext: "liste", taste: "shift+u", id: "ablage.hochladen", titel: "Dateien hochladen", nurDialog: true },
  { kontext: "liste", taste: "shift+o", id: "ablage.neuer-ordner", titel: "Neuer Ordner", nurDialog: true },
  { kontext: "liste", taste: "shift+v", id: "ablage.ansicht", titel: "Raster oder Liste" },
  { kontext: "liste", taste: "shift+l", id: "ablage.teilen", titel: "Teilen …", nurDialog: true, aussenwirkung: true },
  { kontext: "liste", taste: "shift+h", id: "ablage.herunterladen", titel: "Herunterladen" },
  { kontext: "akte", taste: "shift+l", id: "ablage.akte-teilen", titel: "Teilen …", nurDialog: true, aussenwirkung: true },
  { kontext: "akte", taste: "shift+h", id: "ablage.akte-herunterladen", titel: "Herunterladen" },
  { kontext: "akte", taste: "shift+r", id: "ablage.umbenennen", titel: "Umbenennen …", nurDialog: true },
  { kontext: "akte", taste: "shift+a", id: "ablage.auschecken", titel: "Auschecken oder einchecken" },
];

export default eintraege;
