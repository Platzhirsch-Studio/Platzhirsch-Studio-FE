// Kürzel – Bereich Sortiment (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-SOR.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@sortiment“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
// Quelle: 10-konzept-sortiment § 6 (Belegung). Entscheidungstasten 1/2/3 im Abgleich-Raster und in den
// Freigaben sind lokal am `role="grid"` gebunden (wirken nur mit Fokus im Raster) und stehen deshalb nicht hier.

const eintraege = [
  // Listen (Produkte, Bestellungen)
  { kontext: "liste", taste: "shift+p", id: "sortiment.preis-erfassen", titel: "Preis erfassen" },
  { kontext: "liste", taste: "shift+b", id: "sortiment.bestellvorschlag", titel: "Bestellvorschläge öffnen" },
  // Akten
  { kontext: "akte", taste: "shift+s", id: "sortiment.akte-senden", titel: "Bestellung senden (Dialog)", aussenwirkung: true, nurDialog: true },
  { kontext: "akte", taste: "shift+a", id: "sortiment.akte-ab", titel: "AB einlesen" },
  { kontext: "akte", taste: "shift+w", id: "sortiment.akte-eingang", titel: "Wareneingang buchen" },
  { kontext: "akte", taste: "shift+e", id: "sortiment.akte-export", titel: "Exportdatei erzeugen (IWOfurn/EDI/CSV)" },
  { kontext: "akte", taste: "shift+r", id: "sortiment.akte-preis", titel: "Preis erfassen" },
  // Kiosk Wareneingang am Packtisch (§ 13): F2 suchen · F6 buchen (F7 Foto, F8 Problem folgen mit dem Packtisch der Logistik)
  { kontext: "kiosk-packtisch", taste: "f2", id: "sortiment.we-suchen", titel: "Bestellung suchen" },
  { kontext: "kiosk-packtisch", taste: "f6", id: "sortiment.we-buchen", titel: "Wareneingang buchen" },
];

export default eintraege;
