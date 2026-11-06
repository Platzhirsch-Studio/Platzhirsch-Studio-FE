// QA-Routen – Bereich Kundenkarte (Q-M3, MASTER § 3.5). Schreibt: Team B-KKA.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/kundenkarte.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Datensätze aus dem festen Mock-Seed (mock/seed/kundenkarte.js); ?sim=leer|fehler nur im Mock (Leer-/Fehlerbilder).

const eintraege = [
  { pfad: "/kundenkarte/karten/KK-7K3QX9", titel: "Kundenkarte – Karten-Akte (aktiv, Plus)", rang: 900 },
  { pfad: "/kundenkarte/karten/KK-7K3QX9?tab=verlauf", titel: "Kundenkarte – Akte Verlauf", rang: 901 },
  { pfad: "/kundenkarte/karten/KK-7K3QX9?tab=einkaeufe", titel: "Kundenkarte – Akte Einkäufe", rang: 902 },
  { pfad: "/kundenkarte/karten/KK-4HRW7C?tab=details", titel: "Kundenkarte – Akte Details (Privé)", rang: 903 },
  { pfad: "/kundenkarte/karten/KK-B6TS8E", titel: "Kundenkarte – Akte gesperrt (Verlust)", rang: 904 },
  { pfad: "/kundenkarte/karten/KK-9M2PT4", titel: "Kundenkarte – Akte beantragt", rang: 905 },
  { pfad: "/kundenkarte/karten/KK-R2LJ9A", titel: "Kundenkarte – Akte ersetzt", rang: 906 },
  { pfad: "/kundenkarte/karten/neu", titel: "Kundenkarte – Neue Karte", rang: 907 },
  { pfad: "/kundenkarte/karten?reiter=dubletten", titel: "Kundenkarte – Mögliche Dubletten", rang: 908 },
  { pfad: "/kundenkarte/antraege?reiter=mail", titel: "Kundenkarte – Anträge wartet auf Mail", rang: 909 },
  { pfad: "/kundenkarte/antraege/PH-KKA-2026-00027", titel: "Kundenkarte – Antrag (gleiche E-Mail, anderer Name)", rang: 910 },
  { pfad: "/kundenkarte/antraege/PH-KKA-2026-00024", titel: "Kundenkarte – Antrag abgelehnt", rang: 911 },
  { pfad: "/kundenkarte/einloesungen/PH-KKE-2026-00001", titel: "Kundenkarte – Einlösung", rang: 912 },
  { pfad: "/kundenkarte/berichte/kundenwert", titel: "Kundenkarte – Bericht Kundenwert", rang: 913 },
  { pfad: "/kundenkarte/berichte/ohne-einkauf", titel: "Kundenkarte – Bericht Karten ohne Einkauf", rang: 914 },
  { pfad: "/kundenkarte/berichte/vorteile", titel: "Kundenkarte – Bericht Vorteile Nutzung", rang: 915 },
  { pfad: "/kundenkarte?sim=leer", titel: "Kundenkarte – Übersicht leer", rang: 916 },
  { pfad: "/kundenkarte/karten?sim=fehler", titel: "Kundenkarte – Karten Fehler", rang: 917 },
];

export default eintraege;
