// Kürzel – Bereich Logistik (G-02, Q-F5, MASTER § 3.5). Schreibt: Team B-LOG.
// Einträge {kontext, taste, id, titel, aussenwirkung?, nurDialog?}. kontext = Grundkontext (liste, akte, karten,
// zentrale, kiosk-…); das Register hängt „@logistik“ an. Backoffice: nur Umschalt+Buchstabe; Mail, Geld oder
// Außenwirkung höchstens als Dialog-Öffner (nurDialog). Kiosk: F-Tasten, keine Einzelbuchstaben (Q-F7).
// Belegung prüft tests/unit/backoffice-register.test.mjs (keine Doppelbelegung je Kontext).
// Quelle: 10-konzept-logistik.md § 3.4 (Backoffice, E16: Einzeltasten öffnen nur Dialoge) und § 6.6 (Kiosk).

const eintraege = [
  // Kiosk Packtisch (§ 6.6) – jede Taste hat eine sichtbare Schaltfläche; F12/Strg+Enter = kiosk.primaer (Fundament)
  { kontext: "kiosk-packtisch", taste: "f2", id: "logistik.scanfeld", titel: "Scanfeld" },
  { kontext: "kiosk-packtisch", taste: "f3", id: "logistik.naechster", titel: "Nächster Lieferschein" },
  { kontext: "kiosk-packtisch", taste: "f4", id: "logistik.etikett", titel: "Etikett" },
  { kontext: "kiosk-packtisch", taste: "f6", id: "logistik.paket-schliessen", titel: "Paket schließen" },
  { kontext: "kiosk-packtisch", taste: "f7", id: "logistik.paket-neu", titel: "Paket hinzufügen" },
  { kontext: "kiosk-packtisch", taste: "f9", id: "logistik.problem", titel: "Problem melden" },
  // Backoffice – öffnen nur Dialoge/Popover, nie eine Buchung (E16)
  { kontext: "akte", taste: "shift+w", id: "logistik.pack-ansicht", titel: "Pack-Ansicht öffnen" },
  { kontext: "akte", taste: "shift+m", id: "logistik.problem-dialog", titel: "Problem melden …", nurDialog: true },
  { kontext: "karten", taste: "shift+n", id: "logistik.tour-neu", titel: "Neue Tour …", nurDialog: true },
  { kontext: "karten", taste: "shift+h", id: "logistik.heute", titel: "Plantafel: heute" },
  { kontext: "zentrale", taste: "shift+u", id: "logistik.umlagern", titel: "Umlagern …", nurDialog: true },
];

export default eintraege;
