// Kürzel – Bereich Zentrale (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-ZEN.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@zentrale“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).

// Quelle 10-konzept-zentrale § 2.4 (Zentrale „R“ neu laden), auf Umschalt+Buchstabe gemäß Q-F5 umgestellt.
const eintraege = [
  { kontext: "zentrale", taste: "shift+r", id: "zentrale.neu-laden", titel: "Kacheln neu laden" },
  { kontext: "zentrale", taste: "shift+a", id: "zentrale.aufgabe-neu", titel: "Aufgabe hinzufügen (Eingabe fokussieren)" },
  { kontext: "zentrale", taste: "shift+l", id: "zentrale.aufgaben-liste", titel: "Alle Aufgaben öffnen" },
];

export default eintraege;
