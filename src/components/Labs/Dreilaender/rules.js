// Länder-Infos für Karte und Rechner. NUR Aussagen aus
// Marktresearch/18-schweiz-recht-steuer-logistik.md (Stand 26.10.2026).
// Alles, was dort nicht belegt ist (Lieferkosten DE/AT, Montage-Abwicklung,
// verzollter Komplettpreis), steht hier bewusst als "klären wir persönlich".

export const PERSONAL = "Das klären wir persönlich.";

export const COUNTRIES = {
  CH: {
    code: "CH",
    name: "Schweiz",
    inName: "in der Schweiz",
    forName: "für die Schweiz",
    flag: "CH",
    vat: 0.081,
    currency: "CHF",
    headline: "8,1 % Schweizer MWST statt 20 % österreichischer USt",
    steuer: [
      "Möbel sind seit 01.01.2024 zollfrei. Eine Zollanmeldung bleibt trotzdem Pflicht.",
      "Bei der Einfuhr fallen 8,1 % Schweizer MWST an. Die österreichische USt entfällt bei der Ausfuhr.",
      "Gegenüber dem österreichischen Bruttopreis liegt die Steuer rechnerisch rund 9,9 % tiefer (1,081 ÷ 1,20).",
    ],
    lieferung: [
      "Selbstabholung mit Ausfuhrbeleg: nur, wenn Sie die Ware selbst ausführen – im eigenen Auto, Mietbus oder Anhänger. Mit einem Spediteur geht es nicht.",
      "Zollstelle Lustenau/Au bestätigt die Ausfuhr rund um die Uhr, Höchst/St. Margrethen Mo–Fr 8–16 Uhr.",
      "Lieferung ohne Einbau: Sie sind Importeur. Der Spediteur meldet die Einfuhr an, MWST und Verzollungsgebühr zahlen Sie beim Empfang.",
    ],
    montage: [
      "Reine Lieferung ohne Montage ist für Monteure nicht meldepflichtig.",
      "Für Küchen und Einbauschränke gilt in der Schweiz eine Meldepflicht ab dem ersten Tag mit 8 Tagen Vorlauf.",
      `Küche oder Einbau mit Montage: ${PERSONAL}`,
    ],
  },
  FL: {
    code: "FL",
    name: "Liechtenstein",
    inName: "in Liechtenstein",
    forName: "für Liechtenstein",
    flag: "LI",
    vat: 0.081,
    currency: "CHF",
    headline: "Schweizer Zoll- und MWST-Gebiet: 8,1 % MWST",
    steuer: [
      "Liechtenstein gehört zum Schweizer Zoll- und MWST-Gebiet: 8,1 % MWST, die gleichen Wege wie in der Schweiz.",
      "Mit Wohnsitz in Liechtenstein gilt die Ausfuhr aus Österreich als steuerfrei (Wohnsitz außerhalb der EU).",
    ],
    lieferung: [
      "Selbstabholung mit Ausfuhrbeleg wie in der Schweiz – nur bei Transport durch Sie selbst.",
      "Zollstelle Tisis/Schaanwald: Mo–Fr 7.30–16.30 Uhr. Lustenau/Au ist rund um die Uhr besetzt.",
    ],
    montage: [
      "Liechtenstein ist EWR-Mitglied: Für Monteure gilt ein eigenes Meldeverfahren, ohne 8-Tage-Wartefrist.",
      `Termine und Ablauf der Montage: ${PERSONAL}`,
    ],
  },
  DE: {
    code: "DE",
    name: "Deutschland",
    inName: "in Deutschland",
    forName: "für Deutschland",
    flag: "DE",
    vat: 0.19,
    currency: "EUR",
    headline: "Abholung mit 20 % AT-USt. Bei Lieferung gelten 19 % DE-USt nur bei Abrechnung über die EU-OSS – Hinweis unten.",
    steuer: [
      "Abholung in Lochau: Es gilt die österreichische USt von 20 %.",
      "Lieferung loser Möbel nach Deutschland: 19 % deutsche USt nur, wenn Platzhirsch über die EU-OSS abrechnet (EU-weite Schwelle von 10.000 € netto überschritten), sonst 20 % österreichische USt. Welcher Fall gilt, steht verbindlich im Angebot.",
    ],
    lieferung: [`Lieferkosten nach Deutschland: ${PERSONAL}`],
    montage: [
      "Küchen und Einbau mit Montage in Deutschland laufen nicht über die OSS.",
      `Küche oder Einbau mit Montage: ${PERSONAL}`,
    ],
  },
  AT: {
    code: "AT",
    name: "Österreich",
    inName: "in Österreich",
    forName: "für Österreich",
    flag: "AT",
    vat: 0.2,
    currency: "EUR",
    headline: "Inlandspreis mit 20 % USt",
    steuer: ["In Österreich gilt der ausgewiesene Bruttopreis inklusive 20 % USt."],
    lieferung: [`Lieferung innerhalb Österreichs: ${PERSONAL}`],
    montage: [`Montage: ${PERSONAL}`],
  },
};

export const COUNTRY_ORDER = ["CH", "FL", "DE", "AT"];

// Öffentliche Quellen hinter den Aussagen (aus Bericht 18).
export const SOURCES = [
  { label: "WKO – Touristenexport", href: "https://www.wko.at/aussenwirtschaft/exporthandbuch/touristenexport" },
  { label: "WKO Vorarlberg – Zollstellen", href: "https://www.wko.at/vlbg/handel/oeffnungszeiten-zollstellen.pdf" },
  { label: "WKO – FAQ EU-OSS", href: "https://www.wko.at/oe/faq-eu-oss-fuer-den-handel" },
  { label: "SECO – Entsendung", href: "https://www.seco.admin.ch/de/entsendung-kosten-und-sanktionen" },
  { label: "LLV – Dienstleistungen in Liechtenstein", href: "https://www.llv.li/de/landesverwaltung/auslaender-und-passamt/dienstleistungserbringung-gdl-/unternehmen-mit-sitz-in-eu-ewr/bis-90-tage" },
  { label: "EZB – Referenzkurse", href: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html" },
];
