// QA-Routen – Bereich Sortiment (Q-M3, MASTER § 3.5). Schreibt: Team B-SOR.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/sortiment.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).
// Akten mit festen Namen aus dem Sortiment-Seed (mock/seed/sortiment.js, deterministisch).

const eintraege = [
  { pfad: "/sortiment/produkte?ansicht=kacheln", titel: "Sortiment – Produkte Kacheln", rang: 600 },
  { pfad: "/sortiment/produkte?ansicht=kanban", titel: "Sortiment – Produkte Kanban", rang: 601 },
  { pfad: "/sortiment/produkte?sicht=veraltet", titel: "Sortiment – Produkte Preis veraltet", rang: 602, kern: false },
  { pfad: "/sortiment/produkte?q=gibtesnicht", titel: "Sortiment – Produkte leer (gefiltert)", rang: 603, kern: false },
  { pfad: "/sortiment/produkte?neu=produkt", titel: "Sortiment – Schnellanlage", rang: 604 },
  { pfad: "/sortiment/produkte/sofa-modul-240", titel: "Sortiment – Produktakte", rang: 605 },
  { pfad: "/sortiment/produkte/sofa-modul-240?tab=preise", titel: "Sortiment – Produktakte Preise", rang: 606 },
  { pfad: "/sortiment/produkte/sofa-modul-240?tab=ausfuehrungen", titel: "Sortiment – Produktakte Ausführungen", rang: 607, kern: false },
  { pfad: "/sortiment/produkte/sofa-modul-240?tab=texte", titel: "Sortiment – Produktakte Texte", rang: 608, kern: false },
  { pfad: "/sortiment/produkte/gibt-es-nicht", titel: "Sortiment – Produkt nicht gefunden", rang: 609, kern: false },
  { pfad: "/sortiment/marken/Bora", titel: "Sortiment – Markenakte", rang: 610 },
  { pfad: "/sortiment/marken?ansicht=logos", titel: "Sortiment – Marken Logos", rang: 611, kern: false },
  { pfad: "/sortiment/lieferanten/Ezarri%20Vertrieb%20%C3%96sterreich", titel: "Sortiment – Lieferantenakte", rang: 612 },
  { pfad: "/sortiment/bestellungen?ansicht=kanban", titel: "Sortiment – Bestellungen Kanban", rang: 613 },
  { pfad: "/sortiment/bestellungen/neu", titel: "Sortiment – Bestellung erfassen", rang: 614 },
  { pfad: "/sortiment/bestellungen/HB-2026-00013?tab=ab", titel: "Sortiment – Bestellakte AB-Abgleich", rang: 615 },
  { pfad: "/sortiment/bestellungen/HB-2026-00011?tab=uebermittlung", titel: "Sortiment – Bestellakte Übermittlung (EDI)", rang: 616 },
  { pfad: "/sortiment/bestellungen/HB-2026-00012?tab=uebermittlung", titel: "Sortiment – Bestellakte Übermittlung (IWOfurn)", rang: 617, kern: false },
  { pfad: "/sortiment/bestellungen/HB-2026-00013", titel: "Sortiment – Bestellakte Positionen", rang: 618 },
  { pfad: "/sortiment/bestellungen/HB-2026-00011/ab", titel: "Sortiment – AB einlesen", rang: 619 },
  { pfad: "/sortiment/wareneingang/neu", titel: "Sortiment – Wareneingang suchen", rang: 620 },
  { pfad: "/sortiment/wareneingang/neu?bestellung=HB-2026-00016", titel: "Sortiment – Wareneingang buchen", rang: 621 },
  { pfad: "/sortiment/wareneingang/kiosk", titel: "Sortiment – Wareneingang Kiosk", rang: 622 },
  { pfad: "/sortiment/wareneingang/WE-2026-00007", titel: "Sortiment – Wareneingangsakte Reklamation", rang: 623 },
  { pfad: "/sortiment/freigaben?art=preise", titel: "Sortiment – Freigaben Preise", rang: 624 },
  { pfad: "/sortiment/freigaben?art=lieferzeiten", titel: "Sortiment – Freigaben Lieferzeiten", rang: 625, kern: false },
  { pfad: "/sortiment/preislisten/PH-PLI-2026-0007", titel: "Sortiment – Preislisten-Lauf", rang: 626 },
  { pfad: "/sortiment/preislisten/neu", titel: "Sortiment – Preisliste einlesen", rang: 627, kern: false },
];

export default eintraege;
