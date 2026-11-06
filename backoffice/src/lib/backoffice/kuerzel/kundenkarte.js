// Kürzel – Bereich Kundenkarte (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-KKA.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@kundenkarte“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
//
// Konzept § 2.4 nach MASTER Q-F5 übertragen: Einzeltasten N/A/„.“ entfallen zugunsten von Umschalt+Buchstabe;
// Primäraktion (Strg/⌘+Enter), Tabs (Alt+1…4), Druck (Strg+P), Rückgängig (Strg/⌘+Z) kommen aus dem Fundament.
// Ablehnen, Doppelt, Stornieren, Sperren, Kündigen haben bewusst keine Taste.

const eintraege = [
  { kontext: "liste", taste: "shift+n", id: "kundenkarte.neue-karte", titel: "Neue Karte", nurDialog: true },
  { kontext: "akte", taste: "shift+e", id: "kundenkarte.einloesen", titel: "Vorteil einlösen", nurDialog: true },
  { kontext: "akte", taste: "shift+r", id: "kundenkarte.neu-berechnen", titel: "Einstufung neu berechnen" },
  { kontext: "akte", taste: "shift+c", id: "kundenkarte.kommentar", titel: "Kommentar schreiben" },
];

export default eintraege;
