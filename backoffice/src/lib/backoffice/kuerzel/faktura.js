// Kürzel – Bereich Faktura (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-FAK.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@faktura“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
// Quelle: 10-konzept-faktura § 2.2 (Umschalt+Buchstabe; Rückgängig ⌘Z kommt vom Fundament).

const d = { nurDialog: true };
const eintraege = [
  { kontext: "liste", taste: "shift+z", id: "faktura.zahlung", titel: "Zahlung erfassen", ...d },
  { kontext: "liste", taste: "shift+m", id: "faktura.mahnen", titel: "Mahnen", aussenwirkung: true, ...d },
  { kontext: "liste", taste: "shift+g", id: "faktura.gutschrift", titel: "Gutschrift", ...d },
  { kontext: "liste", taste: "shift+s", id: "faktura.senden", titel: "Senden", aussenwirkung: true, ...d },
  { kontext: "liste", taste: "shift+r", id: "faktura.pruefen", titel: "Sachlich prüfen", ...d },
  { kontext: "liste", taste: "shift+f", id: "faktura.freigeben", titel: "Freigeben (Leitung)" },
  { kontext: "liste", taste: "shift+i", id: "faktura.ignorieren", titel: "Ignorieren (Bank)", ...d },
  { kontext: "liste", taste: "shift+o", id: "faktura.oeffnen", titel: "Wieder öffnen (Bank)" },
  { kontext: "akte", taste: "shift+z", id: "faktura.akte-zahlung", titel: "Zahlung erfassen", ...d },
  { kontext: "akte", taste: "shift+m", id: "faktura.akte-mahnen", titel: "Mahnen", aussenwirkung: true, ...d },
  { kontext: "akte", taste: "shift+g", id: "faktura.akte-gutschrift", titel: "Gutschrift", ...d },
  { kontext: "akte", taste: "shift+s", id: "faktura.akte-senden", titel: "Senden", aussenwirkung: true, ...d },
  { kontext: "akte", taste: "shift+a", id: "faktura.auftrag", titel: "Auftrag öffnen" },
];

export default eintraege;
