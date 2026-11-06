// Kürzel – Bereich Personal (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-PER.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@personal“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
//
// Konzept § 3.5: kein Einzeltasten-Kürzel für Stempeln (E6). Primäraktion Strg/⌘+Enter, Speichern Strg/⌘+S,
// Druck Strg+P, Tabs Alt+1…6, Rückgängig Z/Strg+Z kommen aus dem Fundament. Absage senden = Außenwirkung → nur Dialog.

const eintraege = [
  { kontext: "karten", taste: "shift+g", id: "personal.gespraech-planen", titel: "Gespräch planen", nurDialog: true },
  { kontext: "karten", taste: "shift+n", id: "personal.neue-bewerbung", titel: "Bewerbung erfassen", nurDialog: true },
  { kontext: "akte", taste: "shift+g", id: "personal.akte-gespraech", titel: "Gespräch planen", nurDialog: true },
  { kontext: "akte", taste: "shift+x", id: "personal.akte-absage", titel: "Absage senden …", nurDialog: true, aussenwirkung: true },
  { kontext: "liste", taste: "shift+a", id: "personal.antrag-ablehnen", titel: "Antrag ablehnen …", nurDialog: true },
  { kontext: "liste", taste: "shift+u", id: "personal.urlaub", titel: "Urlaub beantragen", nurDialog: true },
];

export default eintraege;
