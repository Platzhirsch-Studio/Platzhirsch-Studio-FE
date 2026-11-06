// QA-Routen – Bereich Service (Q-M3, MASTER § 3.5). Schreibt: Team B-SER.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/service.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Datensatznamen aus dem festen Mock-Seed (mock/seed/service.js, Bezugstag 04.11.2026).

const eintraege = [
  { pfad: "/technik", titel: "Kiosk Technik", rang: 100 },
  { pfad: "/technik/einsatz/PH-SRE-2026-00010", titel: "Kiosk Technik Einsatz", rang: 3001 },
  { pfad: "/service/faelle?ansicht=kanban", titel: "Service Fälle Kanban", rang: 3010 },
  { pfad: "/service/faelle/neu", titel: "Service Fall melden vollständig", rang: 3011 },
  { pfad: "/service/faelle/PH-SRV-2026-00013", titel: "Service Akte Fall gemeldet", rang: 3012 },
  { pfad: "/service/faelle/PH-SRV-2026-00018", titel: "Service Akte Fall Kulanz", rang: 3013 },
  { pfad: "/service/faelle/PH-SRV-2026-00023", titel: "Service Akte Fall erledigt", rang: 3014 },
  { pfad: "/service/einsaetze?ansicht=kanban", titel: "Service Einsätze Kanban", rang: 3015 },
  { pfad: "/service/einsaetze?ansicht=liste", titel: "Service Einsätze Liste", rang: 3016 },
  { pfad: "/service/einsaetze/neu?fall=PH-SRV-2026-00020", titel: "Service Einsatz planen", rang: 3017 },
  { pfad: "/service/einsaetze/PH-SRE-2026-00007", titel: "Service Einsatz Akte", rang: 3018 },
  { pfad: "/service/ersatzteile?ansicht=bestellungen", titel: "Service Bestellungen", rang: 3019 },
  { pfad: "/service/ersatzteile/PH-ET-00008", titel: "Service Ersatzteil Akte", rang: 3020 },
  { pfad: "/service/ersatzteile/bestellungen/PH-ETB-2026-00008", titel: "Service Bestellung Akte", rang: 3021 },
  { pfad: "/service/regress/PH-REG-2026-00009", titel: "Service Regress Akte", rang: 3022 },
  { pfad: "/service/vertraege?art=auftraege", titel: "Service Serviceaufträge", rang: 3023 },
  { pfad: "/service/vertraege/pflege/PFL-2026-00007", titel: "Service Pflegevertrag Akte", rang: 3024 },
  { pfad: "/service/vertraege/auftraege/PH-SA-2026-00009", titel: "Service Serviceauftrag Akte", rang: 3025 },
  { pfad: "/service/berichte/fristen", titel: "Service Bericht Fristen", rang: 3026 },
];

export default eintraege;
