// QA-Routen – Bereich Marketing (Q-M3, MASTER § 3.5). Schreibt: Team B-MAR.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/marketing.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Die Namen stammen aus dem fachlichen Seed (mock/seed/marketing.js) und sind stabil.

const eintraege = [
  { pfad: "/marketing/newsletter/PH-NL-2026-004", titel: "Ausgabe – wartet auf Freigabe", rang: 410 },
  { pfad: "/marketing/newsletter/PH-NL-2026-004?dialog=freigeben", titel: "Ausgabe – Freigabe-Dialog", rang: 411 },
  { pfad: "/marketing/newsletter/PH-NL-2026-006", titel: "Ausgabe – Entwurf, nicht bereit", rang: 412 },
  { pfad: "/marketing/newsletter/PH-NL-2026-004?tab=versand", titel: "Ausgabe – Empfänger und Versand", rang: 413 },
  { pfad: "/marketing/newsletter/PH-NL-2026-003?tab=protokoll", titel: "Ausgabe – Protokoll mit Teilfehler", rang: 414 },
  { pfad: "/marketing/newsletter/PH-NL-2026-001", titel: "Ausgabe – abgebrochen", rang: 415 },
  { pfad: "/marketing/newsletter?status=Geplant", titel: "Newsletter – Filter Geplant", rang: 416 },
  { pfad: "/marketing/empfaenger?ansicht=einwilligungen", titel: "Empfänger – Einwilligungen", rang: 420 },
  { pfad: "/marketing/empfaenger?status=Angemeldet+unbestaetigt", titel: "Empfänger – unbestätigt", rang: 421 },
  { pfad: "/marketing/empfaenger?q=gibtesnicht", titel: "Empfänger – Filter ohne Treffer", rang: 422 },
  { pfad: "/marketing/empfaenger/maria.muster%40beispiel.invalid", titel: "Personen-Akte", rang: 423 },
  { pfad: "/marketing/empfaenger?dialog=anmeldung", titel: "Newsletter-Anmeldung (Dialog)", rang: 424 },
  { pfad: "/marketing/events/designabend-licht", titel: "Event heute – Check-in", rang: 430 },
  { pfad: "/marketing/events/kuechenabend-2026", titel: "Event ausgebucht mit Warteliste", rang: 431 },
  { pfad: "/marketing/events/adventsabend-2026?tab=eckdaten", titel: "Event geplant ohne Uhrzeit", rang: 432 },
  { pfad: "/marketing/events/herbstabend-2026", titel: "Event durchgeführt", rang: 433 },
  { pfad: "/checkin/designabend-licht", titel: "Check-in am Eingang (Kiosk)", rang: 434 },
  { pfad: "/marketing/social?ansicht=kanban", titel: "Social – Kanban", rang: 440 },
  { pfad: "/marketing/social?ansicht=liste", titel: "Social – Liste", rang: 441 },
  { pfad: "/marketing/social/PH-SOC-2026-0002", titel: "Beitrag – wartet auf Freigabe", rang: 442 },
  { pfad: "/marketing/social/PH-SOC-2026-0002?tab=bild", titel: "Beitrag – Bild und Bildrechte", rang: 443 },
  { pfad: "/marketing/kampagnen/PH-KAM-2026-0001", titel: "Kampagne – aktiv", rang: 450 },
  { pfad: "/marketing/kampagnen/PH-KAM-2026-0001?tab=kennzahlen", titel: "Kampagne – Kennzahlen", rang: 451 },
  { pfad: "/marketing/kampagnen/PH-KAM-2026-0003?tab=auswertung", titel: "Kampagne – Auswertung", rang: 452 },
  { pfad: "/marketing/empfehlungen/EMP-7K3QX9", titel: "Empfehlung – Gutschein fällig", rang: 460 },
  { pfad: "/marketing/zielgruppen", titel: "Zielgruppen", rang: 461 },
  { pfad: "/marketing/zielgruppen/kueche-bodensee", titel: "Zielgruppe – Regel-Editor", rang: 462 },
  { pfad: "/marketing/kundenreisen/outdoor?tab=grundlage", titel: "Kundenreise – Rechtsgrundlage", rang: 463 },
  { pfad: "/marketing/kundenreisen/danke", titel: "Kundenreise – Regel", rang: 464 },
  { pfad: "/marketing/einstellungen", titel: "Marketing-Einstellungen", rang: 465 },
  { pfad: "/marketing/berichte/kampagnen-roi", titel: "Bericht Kampagnen-ROI", rang: 466 },
];

export default eintraege;
