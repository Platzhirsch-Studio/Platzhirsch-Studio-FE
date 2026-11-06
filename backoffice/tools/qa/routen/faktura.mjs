// QA-Routen – Bereich Faktura (Q-M3, MASTER § 3.5). Schreibt: Team B-FAK.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/faktura.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Akten mit festen Mock-Nummern (mock/seed/faktura.js) – jeder Status und jeder Leer-/Fehlerfall ist im Bestand.

const eintraege = [
  { pfad: "/faktura?cockpit=vertrieb", titel: "Faktura · Cockpit Vertrieb", rang: 400 },
  { pfad: "/faktura/rechnungen?r=offene-posten", titel: "Rechnungen · Offene Posten", rang: 401 },
  { pfad: "/faktura/rechnungen?r=entwuerfe", titel: "Rechnungen · Entwürfe", rang: 402 },
  { pfad: "/faktura/angebote?ansicht=kanban", titel: "Angebote · Kanban", rang: 403 },
  { pfad: "/faktura/eingangsrechnungen?ansicht=kanban", titel: "Eingangsrechnungen · Kanban", rang: 404 },
  { pfad: "/faktura/eingangsrechnungen?r=kosten", titel: "Eingangsrechnungen · Kosten offen", rang: 405 },
  { pfad: "/faktura/rechnungen/RE-2026-00042", titel: "Rechnung gemahnt, teilbezahlt, exportiert", rang: 410 },
  { pfad: "/faktura/rechnungen/RE-2026-00042?tab=zahlung", titel: "Rechnung · Zahlung und Mahnung", rang: 411 },
  { pfad: "/faktura/rechnungen/ENTW-2026-00009", titel: "Rechnungsentwurf Ausfuhr mit Montage CH", rang: 412 },
  { pfad: "/faktura/rechnungen/ENTW-2026-00006", titel: "Rechnungsentwurf Unternehmer ohne UID", rang: 413 },
  { pfad: "/faktura/rechnungen/RE-2026-00051", titel: "Rechnung storniert", rang: 414 },
  { pfad: "/faktura/angebote/AN-2026-00088", titel: "Angebot gesendet", rang: 420 },
  { pfad: "/faktura/angebote/AN-2026-00084?tab=positionen", titel: "Angebot Entwurf · Positionen", rang: 421 },
  { pfad: "/faktura/auftraege/AB-2026-00017", titel: "Auftrag in Bestellung", rang: 430 },
  { pfad: "/faktura/auftraege/AB-2026-00012", titel: "Auftrag mit Kassa-Datenfehler", rang: 431 },
  { pfad: "/faktura/auftraege/AB-2026-00015/abrechnen?art=schluss", titel: "Schlussrechnung in Schritten", rang: 432 },
  { pfad: "/faktura/auftraege/AB-2026-00016/abrechnen?art=teil", titel: "Teilrechnung in Schritten", rang: 433 },
  { pfad: "/faktura/gutschriften/GU-2026-00003", titel: "Gutschrift mit offener Rückzahlung", rang: 440 },
  { pfad: "/faktura/mahnungen/MA-2026-00021", titel: "Mahnung Stufe 1", rang: 441 },
  { pfad: "/faktura/eingangsrechnungen/ER-2026-00021?tab=kosten", titel: "Eingangsrechnung · Kosten anteilig", rang: 450 },
  { pfad: "/faktura/eingangsrechnungen/ER-2026-00026?tab=kosten", titel: "Eingangsrechnung · Kosten unvollständig", rang: 451 },
  { pfad: "/faktura/eingangsrechnungen/ER-2026-00023?tab=kosten", titel: "Eingangsrechnung · Umbuchen nach Freigabe", rang: 452 },
  { pfad: "/faktura/export/EX-2026-0010", titel: "Export-Lauf bestätigt", rang: 460 },
  { pfad: "/faktura/bank/importe", titel: "Bank · Importe", rang: 461 },
  { pfad: "/faktura/berichte/projektkosten", titel: "Bericht Projektkosten", rang: 470 },
  { pfad: "/faktura/stammdaten?tab=mahnwesen", titel: "Stammdaten · Mahnwesen", rang: 471 },
];

export default eintraege;
