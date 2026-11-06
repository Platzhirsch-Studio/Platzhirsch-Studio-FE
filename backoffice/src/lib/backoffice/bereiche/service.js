// Bereich Service – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-SER.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// Ohne `navigation` zeigt die Seitenleiste die generischen Listen der ersten sechs DocTypes.
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; sobald eingetragen, leitet /d/<slug>/… mit 307 hierher.
// Unterbereiche nach 10-konzept-service § 2.0.2 (Pillen; „Mehr“: Fehlerkatalog · Berichte · Einstellungen nur Leitung).

const enc = (n) => encodeURIComponent(n);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "service",
  titel: "Service",
  icon: "Wrench",
  app: "ph_service",
  module: ["PH Service"],
  rollenName: "Service",
  startseite: "/service",
  doctypes: ["PH Servicefall", "PH Serviceauftrag", "PH Serviceeinsatz", "PH Pflege Abo", "PH Ersatzteil", "PH Ersatzteilbestellung", "PH Lieferantenregress", "PH Fehlercode", "PH Fehlerbereich"],
  kanban: ["PH Servicefall", "PH Serviceeinsatz", "PH Lieferantenregress"],
  navigation: [
    { titel: "Übersicht", href: "/service", icon: "Wrench" },
    { titel: "Servicefälle", href: "/service/faelle", icon: "ScrollText", doctype: "PH Servicefall" },
    { titel: "Einsätze", href: "/service/einsaetze", icon: "CalendarDays", doctype: "PH Serviceeinsatz" },
    { titel: "Ersatzteile", href: "/service/ersatzteile", icon: "Package", doctype: "PH Ersatzteil" },
    { titel: "Regress", href: "/service/regress", icon: "Banknote", doctype: "PH Lieferantenregress" },
    { titel: "Verträge", href: "/service/vertraege", icon: "FileText", doctype: "PH Pflege Abo" },
    { titel: "Fehlerkatalog", href: "/service/fehlerkatalog", icon: "Layers", doctype: "PH Fehlercode" },
    { titel: "Berichte", href: "/service/berichte/quote", icon: "ChartColumn", recht: "report" },
    { titel: "Einstellungen", href: "/service/einstellungen", icon: "Settings", recht: "cancel" },
  ],
  routen: {
    "PH Servicefall": (name) => (name ? `/service/faelle/${enc(name)}` : "/service/faelle"),
    "PH Serviceeinsatz": (name) => (name ? `/service/einsaetze/${enc(name)}` : "/service/einsaetze?ansicht=liste"),
    "PH Ersatzteil": (name) => (name ? `/service/ersatzteile/${enc(name)}` : "/service/ersatzteile"),
    "PH Ersatzteilbestellung": (name) => (name ? `/service/ersatzteile/bestellungen/${enc(name)}` : "/service/ersatzteile?ansicht=bestellungen"),
    "PH Lieferantenregress": (name) => (name ? `/service/regress/${enc(name)}` : "/service/regress"),
    "PH Pflege Abo": (name) => (name ? `/service/vertraege/pflege/${enc(name)}` : "/service/vertraege?art=pflege"),
    "PH Serviceauftrag": (name) => (name ? `/service/vertraege/auftraege/${enc(name)}` : "/service/vertraege?art=auftraege"),
    "PH Fehlercode": () => "/service/fehlerkatalog",
  },
};

export default eintrag;
