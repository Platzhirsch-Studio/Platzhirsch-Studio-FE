// QA-Routen – Bereich Kassa (Q-M3, MASTER § 3.5). Schreibt: Team B-KAS.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/kassa.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).

const eintraege = [
  { pfad: "/kassa", titel: "Kiosk Kassa – Verkauf", rang: 70 },
  { pfad: "/kassa/belege", titel: "Kiosk Kassa – Belege heute", rang: 1071 },
  { pfad: "/kassa/bargeld", titel: "Kiosk Kassa – Bargeld", rang: 1072 },
  { pfad: "/kassa/abschluss", titel: "Kiosk Kassa – Tagesabschluss", rang: 1073 },
  { pfad: "/kassa/geparkt", titel: "Kiosk Kassa – Geparkte Bons", rang: 1074, kern: false },
  { pfad: "/kassa/retoure", titel: "Kiosk Kassa – Zurücknehmen", rang: 1075, kern: false },
  { pfad: "/kassa/display?vorschau=einkauf", titel: "Kundendisplay – Einkauf", rang: 1076 },
  { pfad: "/kassa/display?vorschau=danke", titel: "Kundendisplay – Danke", rang: 1077, kern: false },
  { pfad: "/kassa/verwaltung/belege/KASSE-LOCHAU-01-000001", titel: "Beleg-Akte (Startbeleg)", rang: 1080 },
  { pfad: null, ersterDatensatz: "PH Kassenabschluss", titel: "Abschluss-Akte", rang: 1081 },
  { pfad: "/kassa/verwaltung/kassen/KASSE-LOCHAU-01", titel: "Kassen-Akte", rang: 1082 },
  { pfad: "/kassa/verwaltung/berichte/tageslosung", titel: "Bericht Tageslosung", rang: 1083 },
  { pfad: "/kassa/verwaltung/berichte/steuersatz", titel: "Bericht Umsatz nach Steuersatz", rang: 1084, kern: false },
];

export default eintraege;
