// QA-Routen – Bereich Personal (Q-M3, MASTER § 3.5). Schreibt: Team B-PER.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/personal.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Leer-/Fehlerzustände über ?sim=leer|fehler (nur Mock), Detailseiten mit festen Namen aus dem Seed.

const eintraege = [
  { pfad: "/personal/meins/zeiten", titel: "Personal – Meine Zeiten", rang: 400 },
  { pfad: "/personal/meins/urlaub", titel: "Personal – Meine Abwesenheiten", rang: 401 },
  { pfad: "/personal/meins/daten", titel: "Personal – Meine Daten", rang: 402 },
  { pfad: "/personal/meins?sheet=urlaub", titel: "Personal – Urlaub beantragen (Sheet)", rang: 403, kern: false },
  { pfad: "/personal/stellen?ansicht=kanban", titel: "Personal – Stellen Kanban", rang: 410 },
  { pfad: "/personal/stellen/cad-planer-in-m-w-d", titel: "Personal – Stellenakte aktiv", rang: 411 },
  { pfad: "/personal/stellen/installateur-sanitaer-heizung", titel: "Personal – Stellenakte Entwurf (Checkliste)", rang: 412 },
  { pfad: "/personal/bewerbungen?ansicht=liste", titel: "Personal – Bewerbungen Liste", rang: 420 },
  { pfad: "/personal/bewerbungen/PH-BEW-2026-00011", titel: "Personal – Bewerberakte", rang: 421 },
  { pfad: "/personal/bewerbungen/PH-BEW-2026-00011?modus=sichten", titel: "Personal – Sichtungsmodus", rang: 422 },
  { pfad: "/personal/bewerbungen/PH-BEW-2026-00011?tab=datenschutz", titel: "Personal – Bewerberakte Datenschutz", rang: 423 },
  { pfad: "/personal/bewerbungen/PH-BEW-2026-00022?tab=bewertung", titel: "Personal – Bewerberakte Bewertung", rang: 424 },
  { pfad: "/personal/gespraeche?ansicht=liste", titel: "Personal – Gespräche Liste", rang: 430 },
  { pfad: "/personal/gespraeche?planen=1", titel: "Personal – Gespräch planen", rang: 431, kern: false },
  { pfad: "/personal/team?zeitraum=monat", titel: "Personal – Team Monat", rang: 440 },
  { pfad: "/personal/team?ansicht=personen", titel: "Personal – Team Personen", rang: 441 },
  { pfad: "/personal/team?ansicht=buchungen", titel: "Personal – Team Buchungen", rang: 442 },
  { pfad: "/personal/team?ansicht=antraege", titel: "Personal – Team Anträge", rang: 443 },
  { pfad: "/personal/mitarbeiter/PH-MA-0002", titel: "Personal – Personalakte Zeiten", rang: 450 },
  { pfad: "/personal/mitarbeiter/PH-MA-0002?tab=stammdaten", titel: "Personal – Personalakte Stammdaten", rang: 451 },
  { pfad: "/personal/mitarbeiter/PH-MA-0010?tab=abwesenheit", titel: "Personal – Personalakte Abwesenheit", rang: 452 },
  { pfad: "/personal/berichte/bewerbungsstatistik", titel: "Personal – Bericht Bewerbungsstatistik", rang: 460 },
  { pfad: "/personal/berichte/monatsstunden", titel: "Personal – Bericht Monatsstunden", rang: 461 },
  { pfad: "/personal/berichte/abwesenheiten", titel: "Personal – Bericht Abwesenheiten", rang: 462 },
  { pfad: "/personal?sim=leer", titel: "Personal – Übersicht leer", rang: 470, kern: false },
  { pfad: "/personal/bewerbungen?sim=leer", titel: "Personal – Bewerbungen leer", rang: 471, kern: false },
  { pfad: "/personal/stellen?sim=fehler", titel: "Personal – Stellen Fehler", rang: 472, kern: false },
];

export default eintraege;
