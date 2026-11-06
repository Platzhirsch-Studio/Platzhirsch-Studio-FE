// QA-Routen – Bereich Zentrale (Q-M3, MASTER § 3.5). Schreibt: Team B-ZEN.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/zentrale.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).

const eintraege = [
  { pfad: "/login", titel: "Anmeldung", ohneSitzung: true, rang: 10 },
  { pfad: "/", titel: "Zentrale (Dashboard)", rang: 20 },
  { pfad: "/arbeitsplatz", titel: "Arbeitsplatz wählen", rang: 30 },
  { pfad: "/einstellungen", titel: "Einstellungen", rang: 110 },
  { pfad: "/benutzer", titel: "Benutzer", rang: 120 },
  { pfad: "/protokoll", titel: "Protokoll", rang: 130 },
  { pfad: "/geraet", titel: "Gerät registrieren", rang: 140 },
  { pfad: "/wechsel", titel: "Bedienerwechsel", rang: 150 },
  // Team B-ZEN (Welle 1) – Ränge ab 1100, damit die festen Seiten des Fundaments ihre Reihenfolge behalten.
  { pfad: "/aufgaben", titel: "Aufgaben", rang: 1101 },
  { pfad: "/aufgaben?ansicht=karten", titel: "Aufgaben (Karten)", rang: 1102 },
  { pfad: "/aufgaben/PH-AUF-2026-00001", titel: "Aufgabenakte", rang: 1103 },
  { pfad: "/benachrichtigungen", titel: "Benachrichtigungen", rang: 1104 },
  { pfad: "/suche?q=muster", titel: "Suche", rang: 1105 },
  { pfad: "/verwaltung", titel: "Verwaltung", rang: 1106 },
  { pfad: "/einstellungen?tab=allgemein", titel: "Einstellungen Allgemein", rang: 1107 },
  { pfad: "/einstellungen?tab=website", titel: "Einstellungen Website & API", rang: 1108 },
  { pfad: "/einstellungen?tab=kalender", titel: "Einstellungen Kalender", rang: 1109 },
  { pfad: "/einstellungen?tab=kalkulation", titel: "Einstellungen Kalkulation", rang: 1110 },
  { pfad: "/einstellungen?tab=microsoft", titel: "Einstellungen Microsoft", rang: 1111 },
  { pfad: "/einstellungen?tab=ablage", titel: "Einstellungen Ablage", rang: 1112 },
  { pfad: "/geraete", titel: "Geräte", rang: 1113 },
  { pfad: "/druck", titel: "Druck", rang: 1114 },
  { pfad: "/druck?tab=formate", titel: "Druckformate", rang: 1115 },
];

export default eintraege;
