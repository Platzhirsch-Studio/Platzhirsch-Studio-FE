// QA-Routen – Bereich CRM (Q-M3, MASTER § 3.5). Schreibt: Team B-CRM.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/crm.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Die ersten drei Einträge stehen im Fundament-Test in fester Reihenfolge; /d/PH%20Anfrage leitet seit B-CRM mit
// 307 auf /crm/anfragen weiter (prüft damit zugleich die Umleitung). /posteingang trägt das Register E-Mails ein.

const eintraege = [
  { pfad: "/d/PH%20Anfrage", titel: "Anfragen – Liste", rang: 40 },
  { pfad: "/d/PH%20Anfrage?ansicht=kanban", titel: "Anfragen – Kanban", rang: 50 },
  { pfad: null, ersterDatensatz: "PH Anfrage", titel: "Anfrage – Akte (erster Datensatz)", rang: 60 },
  { pfad: "/crm/anfragen?ansicht=kanban", titel: "Anfragen – Kanban (CRM)", rang: 1100 },
  { pfad: "/crm/anfragen?sicht=neu", titel: "Anfragen – Neue", rang: 1101 },
  { pfad: "/crm/anfragen?q=gibtesnicht", titel: "Anfragen – gefiltert leer", rang: 1102 },
  { pfad: null, ersterDatensatz: "PH Kontakt", titel: "Kundenakte (erster Datensatz)", rang: 1103 },
  { pfad: null, ersterDatensatz: "PH Termin", titel: "Termin – Akte (erster Datensatz)", rang: 1104 },
  { pfad: null, ersterDatensatz: "PH Beratungsgespraech", titel: "Gesprächsprotokoll (erster Datensatz)", rang: 1105 },
  { pfad: null, ersterDatensatz: "PH Datenschutzanfrage", titel: "Datenschutzanfrage (erster Datensatz)", rang: 1106 },
  { pfad: "/crm/termine?ansicht=liste", titel: "Termine – Liste", rang: 1107 },
  { pfad: "/crm/termine?ansicht=liste&sicht=ohne-protokoll", titel: "Termine – ohne Protokoll", rang: 1108 },
  { pfad: "/crm/termine/neu", titel: "Termin anlegen (Assistent)", rang: 1109 },
  { pfad: "/crm/einstellungen?tab=terminarten", titel: "Einstellungen – Terminarten", rang: 1110 },
  { pfad: "/crm/einstellungen?tab=automationen", titel: "Einstellungen – Automationen", rang: 1111 },
];

export default eintraege;
