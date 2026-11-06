// Kürzel – Bereich Marketing (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-MAR.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@marketing“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
// 10-konzept-marketing § 2.0.5 (E3): Bereichsaktionen nur mit Shift; nie löst ein Kürzel eine Mail oder Freigabe
// direkt aus – es öffnet höchstens den Dialog.

const eintraege = [
  // Listen
  { kontext: "liste", taste: "shift+a", id: "marketing.anmeldung-erfassen", titel: "Anmeldung erfassen (Event)", aussenwirkung: true, nurDialog: true },
  { kontext: "liste", taste: "shift+k", id: "marketing.kennzahl", titel: "Kennzahl erfassen (Kampagne)" },
  // Akten
  { kontext: "akte", taste: "shift+t", id: "marketing.testmail", titel: "Testmail (Dialog)", aussenwirkung: true, nurDialog: true },
  { kontext: "akte", taste: "shift+m", id: "marketing.akte-kennzahl", titel: "Kennzahl erfassen (Kampagne)" },
  { kontext: "akte", taste: "shift+c", id: "marketing.text-kopieren", titel: "Text kopieren (Social)" },
  { kontext: "akte", taste: "shift+w", id: "marketing.keine-werbung", titel: "Keine Werbung mehr (Dialog)", aussenwirkung: true, nurDialog: true },
  { kontext: "akte", taste: "shift+a", id: "marketing.akte-anmeldung", titel: "Anmeldung erfassen (Event)", aussenwirkung: true, nurDialog: true },
  { kontext: "akte", taste: "shift+n", id: "marketing.akte-nachruecken", titel: "Nachrücken (Dialog)", aussenwirkung: true, nurDialog: true },
  // Check-in am Eingang (Kiosk, ohne Einzelbuchstaben): F2 Suche · F7 Code scannen · F9 Gast ohne Anmeldung
  { kontext: "kiosk-mobil", taste: "f2", id: "marketing.checkin-suche", titel: "Suche (Check-in)" },
  { kontext: "kiosk-mobil", taste: "f7", id: "marketing.checkin-code", titel: "Code scannen (Check-in)" },
  { kontext: "kiosk-mobil", taste: "f9", id: "marketing.checkin-gast", titel: "Gast ohne Anmeldung (Check-in)" },
];

export default eintraege;
