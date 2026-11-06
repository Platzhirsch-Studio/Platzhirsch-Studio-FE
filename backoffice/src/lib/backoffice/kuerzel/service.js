// Kürzel – Bereich Service (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-SER.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@service“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
// Quelle: 10-konzept-service § 2.0.3 (E3: Zentrale-Register gilt; weitere Aktionen der Akte über die Palette).

const eintraege = [
  { kontext: "liste", taste: "shift+m", id: "service.melden", titel: "Servicefall melden" },
  { kontext: "akte", taste: "shift+t", id: "service.telefonat", titel: "Telefonat erfassen" },
  { kontext: "akte", taste: "shift+e", id: "service.pruefen", titel: "Prüfen & entscheiden" },
  { kontext: "akte", taste: "shift+i", id: "service.informieren", titel: "Kunde informieren", aussenwirkung: true, nurDialog: true },
  { kontext: "kiosk-mobil", taste: "f5", id: "service.technik-aktualisieren", titel: "Aktualisieren" },
];

export default eintraege;
