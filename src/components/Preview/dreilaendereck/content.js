// Statische Inhalte des Prototyps "Dreiländereck".
// Regel: nur belegte Fakten (Adresse, Telefon, Öffnungszeiten aus
// src/messages/de.json bzw. dem Site-Schema in [locale]/layout.js, Fläche aus
// Marktresearch 23). Fahrzeiten sind Richtwerte und als solche gekennzeichnet.

export const BASE = "/de/preview/dreilaendereck";

export const HOUSE = {
  name: "Platzhirsch Home Living",
  street: "Landstraße 11",
  city: "6911 Lochau",
  region: "Vorarlberg, Österreich",
  phone: "+43 5574 46255",
  phoneHref: "tel:+43557446255",
  email: "info@platzhirsch.studio",
  mapsHref: "https://maps.google.com/?cid=10377983053407187294",
  hours: [
    { days: "Montag", time: "Ruhetag" },
    { days: "Dienstag – Freitag", time: "10 – 18 Uhr" },
    { days: "Samstag", time: "10 – 14 Uhr" },
  ],
  hoursNote: "Außerhalb der Öffnungszeiten nach Vereinbarung.",
};

// Ziele der Prototyp-Links: echte Seiten der heutigen Website.
export const LINKS = {
  termin: "/de/beratung",
  kontakt: "/de/kontakt",
  newsletter: "/de/newsletter",
  produkte: "/de/produkte",
  kueche: "/de/kuechen-vorarlberg",
  wohnen: "/de/wohnzimmer-einrichten-vorarlberg",
  outdoor: "/de/produkte/garden-chairs",
  marken: "/de/ueber-uns/marken",
  vernissage: "/de/news/vernissage-platzhirsch-home-living-kaja-el-attar",
};

export const NAV = [
  { label: "Wohnen", href: "#raeume" },
  { label: "Küche", href: "#kueche" },
  { label: "Outdoor", href: "#raeume" },
  { label: "Marken", href: "#marken" },
  { label: "Das Haus", href: "#haus" },
  { label: "Abende", href: "#abende" },
  { label: "Anfahrt", href: "#dreilaendereck" },
];

// Fahrzeiten ab Lochau mit dem Auto, ohne Verkehr. Quellen: Texte der
// heutigen Regionsseiten (St. Gallen, Ravensburg, Kempten) und Marktresearch
// 19/23 (Lindau, Dornbirn, Schaan). Friedrichshafen und Bregenz: Schätzung
// nach Kartenlage. Vor dem Livegang mit einem Routenplaner prüfen.
export const CITIES = [
  { id: "lindau", name: "Lindau", country: "DE", lat: 47.546, lon: 9.684, time: "ca. 5 Min.", href: "/de/designermoebel-lindau", labelPos: "left" },
  { id: "bregenz", name: "Bregenz", country: "AT", lat: 47.503, lon: 9.747, time: "ca. 10 Min.", href: "/de/designermoebel-bregenz", labelPos: "right" },
  { id: "dornbirn", name: "Dornbirn", country: "AT", lat: 47.414, lon: 9.742, time: "ca. 20 Min.", href: "/de/designermoebel-dornbirn", labelPos: "right" },
  { id: "friedrichshafen", name: "Friedrichshafen", country: "DE", lat: 47.654, lon: 9.479, time: "ca. 30–35 Min.", href: "/de/designermoebel-friedrichshafen", labelPos: "top" },
  { id: "stgallen", name: "St. Gallen", country: "CH", lat: 47.424, lon: 9.377, time: "ca. 30–45 Min.", href: "/de/designermoebel-st-gallen", labelPos: "left" },
  { id: "ravensburg", name: "Ravensburg", country: "DE", lat: 47.782, lon: 9.612, time: "ca. 35–45 Min.", href: null, labelPos: "right" },
  { id: "vaduz", name: "Vaduz", country: "FL", lat: 47.141, lon: 9.521, time: "ca. 40–45 Min.", href: null, labelPos: "left" },
  { id: "kempten", name: "Kempten", country: "DE", lat: 47.726, lon: 10.315, time: "ca. 50 Min.", href: null, labelPos: "left" },
];

export const LOCHAU = { lat: 47.5303, lon: 9.7517 };

// Was wir je Land heute zusagen können (Stand Website-FAQ in
// src/lib/content/homeSeo.js). Keine Festpreis- oder CHF-Zusage, solange der
// Dreiländer-Service aus dem Masterkonzept nicht steht.
export const COUNTRIES = [
  {
    code: "AT",
    name: "Österreich",
    text: "Beratung, Planung, Lieferung und Montage in Vorarlberg und ganz Österreich.",
  },
  {
    code: "DE",
    name: "Deutschland",
    text: "Lindau liegt fünf Minuten entfernt. Lieferung und Montage klären wir für Ihre Adresse persönlich.",
  },
  {
    code: "CH",
    name: "Schweiz",
    text: "Für Projekte in der Schweiz besprechen wir Lieferung, Montage und Verzollung im ersten Termin.",
  },
  {
    code: "FL",
    name: "Liechtenstein",
    text: "Über das Rheintal schnell erreichbar. Wir stimmen Liefertermin und Montage mit Ihnen ab.",
  },
];

// Marken, die die heutige Website im Site-Schema als Marken des Showrooms
// nennt (src/app/[locale]/layout.js). Herkunft, Gründungsjahr und Bild kommen
// zur Laufzeit aus dem Marken-Doctype (fetchRawMarkenData).
export const BRAND_LIST = [
  { name: "Minotti", slug: "minotti" },
  { name: "Poliform", slug: "poliform" },
  { name: "Rimadesio", slug: "rimadesio" },
  { name: "Paola Lenti", slug: "paola-lenti" },
  { name: "Flos", slug: "flos" },
  { name: "Tonon", slug: "tonon" },
  { name: "ClassiCon", slug: "classicon" },
  { name: "Tom Dixon", slug: "tom-dixon" },
  { name: "Tréca", slug: "treca" },
  { name: "Gloster", slug: "gloster" },
  { name: "Tuuci", slug: "tuuci" },
  { name: "next125", slug: "next125" },
];
