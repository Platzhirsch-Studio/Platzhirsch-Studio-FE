// Kürzel – Bereich Kassa (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-KAS.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@kassa“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
// Quelle: 10-konzept-kassa.md § 2.5 (Tastenbelegung). F12/Strg+Enter = kiosk.primaer (Fundament) → Kassieren.

const eintraege = [
  { kontext: "kiosk-kassa", taste: "f2", id: "kassa.kunde", titel: "Kunde suchen" },
  { kontext: "kiosk-kassa", taste: "f3", id: "kassa.tippen", titel: "Suchfeld, Tippmodus" },
  { kontext: "kiosk-kassa", taste: "f4", id: "kassa.freitext", titel: "Freitextposition" },
  { kontext: "kiosk-kassa", taste: "f5", id: "kassa.anzahlung", titel: "Anzahlung des Kunden" },
  { kontext: "kiosk-kassa", taste: "f6", id: "kassa.gutschein", titel: "Gutschein verkaufen" },
  { kontext: "kiosk-kassa", taste: "f7", id: "kassa.belege", titel: "Belege" },
  { kontext: "kiosk-kassa", taste: "f8", id: "kassa.bargeld", titel: "Bargeld" },
  { kontext: "kiosk-kassa", taste: "f9", id: "kassa.abschluss", titel: "Tagesabschluss" },
  { kontext: "kiosk-kassa", taste: "f10", id: "kassa.zahlart", titel: "Zahlart" },
  { kontext: "kiosk-kassa", taste: "shift+f4", id: "kassa.rabatt", titel: "Rabatt auf Zeile" },
  { kontext: "kiosk-kassa", taste: "shift+f6", id: "kassa.parken", titel: "Bon parken" },
  { kontext: "kiosk-kassa", taste: "shift+f7", id: "kassa.retoure", titel: "Zurücknehmen" },
  { kontext: "kiosk-kassa", taste: "shift+f10", id: "kassa.zeilenmenue", titel: "Zeilenmenü" },
  { kontext: "kiosk-kassa", taste: "arrowup", id: "kassa.zeile-hoch", titel: "Vorige Position" },
  { kontext: "kiosk-kassa", taste: "arrowdown", id: "kassa.zeile-runter", titel: "Nächste Position" },
  { kontext: "kiosk-kassa", taste: "enter", id: "kassa.zeile-oeffnen", titel: "Position öffnen" },
  { kontext: "kiosk-kassa", taste: "delete", id: "kassa.zeile-loeschen", titel: "Position entfernen" },
  { kontext: "kiosk-kassa", taste: "+", id: "kassa.menge-plus", titel: "Menge erhöhen" },
  { kontext: "kiosk-kassa", taste: "-", id: "kassa.menge-minus", titel: "Menge verringern" },
  { kontext: "kiosk-kassa", taste: "*", id: "kassa.mengenvorwahl", titel: "Mengenvorwahl" },
];

export default eintraege;
