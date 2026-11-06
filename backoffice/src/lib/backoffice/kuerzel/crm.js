// Kürzel – Bereich CRM (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-CRM.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@crm“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).

// Quelle: 10-konzept-crm § 2.5 (nur Umschalt+Buchstabe; Mail/Außenwirkung öffnen höchstens einen Dialog).
const eintraege = [
  { kontext: "liste", taste: "shift+w", id: "crm.annehmen", titel: "Anfrage annehmen" },
  { kontext: "akte", taste: "shift+t", id: "crm.termin", titel: "Termin anlegen", nurDialog: true },
  { kontext: "akte", taste: "shift+a", id: "crm.aufgabe", titel: "Aufgabe anlegen", nurDialog: true },
  { kontext: "akte", taste: "shift+m", id: "crm.mail", titel: "E-Mail schreiben", aussenwirkung: true, nurDialog: true },
  { kontext: "akte", taste: "shift+b", id: "crm.bestaetigen", titel: "Termin bestätigen", aussenwirkung: true, nurDialog: true },
  { kontext: "akte", taste: "shift+u", id: "crm.umbuchen", titel: "Termin verschieben", nurDialog: true },
  { kontext: "akte", taste: "shift+x", id: "crm.absagen", titel: "Termin absagen", aussenwirkung: true, nurDialog: true },
];

export default eintraege;
