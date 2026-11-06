// QA-Routen – Bereich Projekte (Q-M3, MASTER § 3.5). Schreibt: Team B-PRJ.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/projekte.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Feste Namen aus dem Mock-Seed (mock/seed/projekte.js, Nachlauf): PH-PRJ-2026-0001 Küche am See (Lieferung),
// -0002 Haus am See (Montage), -0004 Penthouse (Planung mit Rückmeldungen), -0008 Masterbad (Übergabe, Mängel).

const eintraege = [
  { pfad: "/montage", titel: "Kiosk Montage", rang: 90 },
  { pfad: "/montage?ansicht=woche", titel: "Kiosk Montage – Woche", rang: 1091 },
  { pfad: "/projekte/liste?ansicht=kanban", titel: "Projekte – Kanban", rang: 1100 },
  { pfad: "/projekte/liste?ansicht=zeitplan", titel: "Projekte – Zeitplan", rang: 1101 },
  { pfad: "/projekte/neu", titel: "Projekt anlegen", rang: 1102 },
  { pfad: "/projekte/PH-PRJ-2026-0001", titel: "Auftragsmappe – Lieferung", rang: 1103 },
  { pfad: "/projekte/PH-PRJ-2026-0002", titel: "Auftragsmappe – Montage", rang: 1104 },
  { pfad: "/projekte/PH-PRJ-2026-0002?tab=belege-lieferung&ansicht=kalkulation", titel: "Auftragsmappe – Nachkalkulation", rang: 1105 },
  { pfad: "/projekte/PH-PRJ-2026-0004?tab=planung", titel: "Auftragsmappe – Planung", rang: 1106 },
  { pfad: "/projekte/PH-PRJ-2026-0001?tab=positionen", titel: "Auftragsmappe – Positionen", rang: 1107 },
  { pfad: "/projekte/PH-PRJ-2026-0002?tab=montage", titel: "Auftragsmappe – Montage-Reiter", rang: 1108 },
  { pfad: "/projekte/PH-PRJ-2026-0001?tab=dateien&ansicht=fotos", titel: "Auftragsmappe – Fotos", rang: 1109 },
  { pfad: "/projekte/PH-PRJ-2026-0011", titel: "Auftragsmappe – Abgebrochen", rang: 1110 },
  { pfad: "/projekte/montagen?ansicht=kanban", titel: "Montagen – Kanban", rang: 1111 },
  { pfad: "/projekte/montagen?ansicht=liste", titel: "Montagen – Liste", rang: 1112 },
  { pfad: null, ersterDatensatz: "PH Montageauftrag", titel: "Montageauftrag – Akte (erster Datensatz)", rang: 1113 },
  { pfad: null, ersterDatensatz: "PH Abnahme", titel: "Abnahme – Akte (erster Datensatz)", rang: 1114 },
  { pfad: null, ersterDatensatz: "PH Produktpass", titel: "Produktpass – Akte (erster Datensatz)", rang: 1115 },
  { pfad: null, ersterDatensatz: "PH Referenz", titel: "Referenz – Prüfseite (erster Datensatz)", rang: 1116 },
  { pfad: "/projekte/berichte/projektstatus", titel: "Bericht Projektstatus", rang: 1117 },
  { pfad: "/projekte/berichte/nachkalkulation", titel: "Bericht Nachkalkulation", rang: 1118 },
];

export default eintraege;
