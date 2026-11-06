// QA-Routen – Bereich Shop (Q-M3, MASTER § 3.5). Schreibt: Team B-SHO.
// Feste Seiten mit eigenem Layout (kern). Startseite und Navigation des Bereichs kommen automatisch aus
// src/lib/backoffice/bereiche/shop.js. Felder: pfad (oder null + ersterDatensatz), titel, ohneSitzung?,
// kern? (Standard true), rang? (Reihenfolge im Lauf, Standard 1000).

const eintraege = [
  { pfad: "/shop/bestellungen?ansicht=zu-packen", titel: "Bestellungen – Zu packen", rang: 510 },
  { pfad: "/shop/bestellungen?ansicht=kanban", titel: "Bestellungen – Kanban", rang: 511 },
  { pfad: "/shop/bestellungen?panel=PH-S-261104-00012", titel: "Bestellungen – Vorschau", rang: 512 },
  { pfad: "/shop/bestellungen?neu=telefon", titel: "Neue Telefonbestellung", rang: 513 },
  { pfad: "/shop/bestellungen?q=keinTreffer", titel: "Bestellungen – gefiltert leer", rang: 514, kern: false },
  { pfad: "/shop/bestellungen/PH-S-261104-00012", titel: "Bestellung – Versand bezahlt mit Risiko", rang: 515 },
  { pfad: "/shop/bestellungen/PH-S-261103-00009", titel: "Bestellung – Reservierung teilbezahlt", rang: 516 },
  { pfad: "/shop/bestellungen/PH-S-261103-00007", titel: "Bestellung – Prüfen", rang: 517, kern: false },
  { pfad: "/shop/bestellungen/PH-S-261018-00011", titel: "Bestellung – storniert, Freigabe offen", rang: 518, kern: false },
  { pfad: "/shop/bestellungen/PH-S-261028-00005?tab=kunde", titel: "Bestellung – B2B Steuerfall", rang: 519, kern: false },
  { pfad: "/shop/zahlungen/PH-ZAH-2026-00069", titel: "Zahlung – Freigabe angefordert", rang: 521 },
  { pfad: "/shop/zahlungen/PH-ZAH-2026-00087", titel: "Zahlung – Zahlungsstreit", rang: 522, kern: false },
  { pfad: "/shop/gutscheine?tab=kaeufe", titel: "Gutscheinkäufe", rang: 531, kern: false },
  { pfad: "/shop/gutscheine/PH-GS-2026-00031", titel: "Gutschein – teilweise eingelöst", rang: 532 },
  { pfad: "/shop/gutscheine/PH-GS-2026-00019", titel: "Gutschein – abgelaufen mit Rest", rang: 533, kern: false },
  { pfad: "/shop/gutscheinkaeufe/GB-2026-0012", titel: "Gutscheinkauf", rang: 534, kern: false },
  { pfad: "/shop/widerrufe?ansicht=kanban", titel: "Widerrufe – Kanban", rang: 541, kern: false },
  { pfad: "/shop/widerrufe?segment=retouren", titel: "Retouren", rang: 542, kern: false },
  { pfad: "/shop/widerrufe/PH-WID-2026-00007", titel: "Widerruf – Teilwiderruf mit Retoure", rang: 543 },
  { pfad: "/shop/widerrufe/PH-WID-2026-00008", titel: "Widerruf – ohne Zustellnachweis", rang: 544, kern: false },
  { pfad: "/shop/retouren/PH-RET-2026-00003", titel: "Retoure – eingegangen", rang: 545 },
  { pfad: "/shop/anzahlungen/ANZ-2026-0002", titel: "Anzahlung – doppelt bezahlt", rang: 551, kern: false },
  { pfad: "/shop/stripe?tab=auszahlungen", titel: "Stripe – Auszahlungen", rang: 561, kern: false },
  { pfad: "/shop/stripe/ereignisse/evt_test_000097", titel: "Stripe-Ereignis – Fehler", rang: 562, kern: false },
  { pfad: "/shop/stripe/auszahlungen/po_test_1011", titel: "Auszahlung – mit Differenz", rang: 563, kern: false },
  { pfad: "/shop/berichte/umsatz-ust", titel: "Bericht – USt (Entwurf)", rang: 571, kern: false },
  { pfad: "/shop/berichte/eu-versand", titel: "Bericht – EU-Versand", rang: 572, kern: false },
  { pfad: "/shop/abholung", titel: "Abholung (Kiosk)", rang: 590 },
];

export default eintraege;
