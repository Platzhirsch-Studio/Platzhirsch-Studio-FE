// Bereich Logistik – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-LOG.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// Pillen nach 10-konzept-logistik § 4.0: Übersicht · Lieferscheine · Sendungen · Touren · Bestand · Inventur · Mehr
// (Speditionen, Rücknahmen, Ausstellung, Kommission, Bewegungen, Nachbestellung, Berichte, Stammdaten).
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; /d/<slug>/… leitet mit 307 hierher.

const e = encodeURIComponent;
const route = (liste, akte) => (name) => (name ? akte(e(name)) : liste);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "logistik",
  titel: "Logistik",
  icon: "Truck",
  app: "ph_logistik",
  module: ["PH Logistik"],
  rollenName: "Logistik",
  startseite: "/logistik",
  doctypes: [
    "PH Lieferschein", "PH Sendung", "PH Tour", "PH Lagerbestand", "PH Lagerbewegung", "PH Lagerort", "PH Inventur", "PH Fahrzeug",
    "PH Speditionsauftrag", "PH Warenruecknahme", "PH Paketprofil", "PH Logistik Einstellungen", "PH Packplatz", "PH Inventurbewertung",
    "PH Meldebestand", "PH Bestellvorschlag",
  ],
  navigation: [
    { titel: "Übersicht", href: "/logistik", icon: "Truck" },
    { titel: "Lieferscheine", href: "/logistik/lieferscheine", icon: "FileText", doctype: "PH Lieferschein" },
    { titel: "Sendungen", href: "/logistik/sendungen", icon: "Package", doctype: "PH Sendung" },
    { titel: "Touren", href: "/logistik/touren", icon: "Truck", doctype: "PH Tour" },
    { titel: "Bestand", href: "/logistik/bestand", icon: "Layers", doctype: "PH Lagerbestand" },
    { titel: "Inventur", href: "/logistik/inventur", icon: "ScanBarcode", doctype: "PH Inventur" },
    { titel: "Speditionen", href: "/logistik/speditionen", icon: "Truck", doctype: "PH Speditionsauftrag" },
    { titel: "Rücknahmen", href: "/logistik/ruecknahmen", icon: "Undo2", doctype: "PH Warenruecknahme" },
    { titel: "Ausstellung", href: "/logistik/ausstellung", icon: "Store", doctype: "PH Lagerbestand" },
    { titel: "Kommission", href: "/logistik/kommission", icon: "Tag", doctype: "PH Lagerbestand" },
    { titel: "Bewegungen", href: "/logistik/bewegungen", icon: "History", doctype: "PH Lagerbewegung" },
    { titel: "Nachbestellung", href: "/logistik/nachbestellung", icon: "RefreshCw", doctype: "PH Bestellvorschlag" },
    { titel: "Berichte", href: "/logistik/berichte", icon: "ChartColumn", recht: "report" },
    { titel: "Stammdaten", href: "/logistik/stammdaten", icon: "Settings" },
  ],
  kanban: ["PH Lieferschein", "PH Tour", "PH Speditionsauftrag"],
  routen: {
    "PH Lieferschein": route("/logistik/lieferscheine", (n) => `/logistik/lieferscheine/${n}`),
    "PH Sendung": route("/logistik/sendungen", (n) => `/logistik/sendungen/${n}`),
    "PH Tour": route("/logistik/touren", (n) => `/logistik/touren/${n}`),
    "PH Speditionsauftrag": route("/logistik/speditionen", (n) => `/logistik/speditionen/${n}`),
    "PH Warenruecknahme": route("/logistik/ruecknahmen", (n) => `/logistik/ruecknahmen/${n}`),
    "PH Lagerbestand": route("/logistik/bestand", (n) => `/logistik/bestand/${n}`),
    "PH Lagerbewegung": route("/logistik/bewegungen", (n) => `/logistik/bewegungen?q=${n}`),
    "PH Inventur": route("/logistik/inventur", (n) => `/logistik/inventur/${n}`),
    "PH Inventurbewertung": route("/logistik/inventur/bewertung", (n) => `/logistik/inventur/bewertung/${n}`),
    "PH Lagerort": route("/logistik/stammdaten?tab=lagerorte", (n) => `/logistik/stammdaten?tab=lagerorte&name=${n}`),
    "PH Fahrzeug": route("/logistik/stammdaten?tab=fahrzeuge", (n) => `/logistik/stammdaten?tab=fahrzeuge&name=${n}`),
    "PH Paketprofil": route("/logistik/stammdaten?tab=paketprofile", (n) => `/logistik/stammdaten?tab=paketprofile&name=${n}`),
    "PH Packplatz": route("/logistik/stammdaten?tab=packplaetze", (n) => `/logistik/stammdaten?tab=packplaetze&name=${n}`),
    "PH Logistik Einstellungen": route("/logistik/stammdaten?tab=einstellungen", () => "/logistik/stammdaten?tab=einstellungen&name=1"),
    "PH Bestellvorschlag": route("/logistik/nachbestellung", (n) => `/logistik/nachbestellung?q=${n}`),
    "PH Meldebestand": route("/logistik/nachbestellung?tab=meldebestand", (n) => `/logistik/nachbestellung?tab=meldebestand&q=${n}`),
  },
};

export default eintrag;
