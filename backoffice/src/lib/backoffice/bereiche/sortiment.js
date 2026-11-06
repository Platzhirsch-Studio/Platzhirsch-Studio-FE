// Bereich Sortiment – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-SOR.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// 10-konzept-sortiment § 3.0: Übersicht · Produkte · Marken · Bestellungen · Wareneingang · Freigaben · Mehr
// (Bestellvorschläge, Lieferanten, Preislisten, Kategorien, Merkmale, Berichte, Katalog-Import, Einstellungen).
// Die Reiter der Shell zeigen höchstens sechs, der Rest steht unter „Mehr“.
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; /d/<slug>/… leitet mit 307 hierher.

const n = (name) => encodeURIComponent(name);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "sortiment",
  titel: "Sortiment",
  icon: "Package",
  app: "ph_sortiment",
  module: ["PH Sortiment"],
  rollenName: "Sortiment",
  startseite: "/sortiment",
  doctypes: ["PH Produkt", "PH Marke", "PH Kategorie", "PH Lieferant", "PH Herstellerbestellung", "PH Wareneingang", "PH Preisliste Import", "PH Merkmal"],
  navigation: [
    { titel: "Übersicht", href: "/sortiment", icon: "LayoutDashboard" },
    { titel: "Produkte", href: "/sortiment/produkte", icon: "Package", doctype: "PH Produkt" },
    { titel: "Marken", href: "/sortiment/marken", icon: "Tag", doctype: "PH Marke" },
    { titel: "Bestellungen", href: "/sortiment/bestellungen", icon: "ScrollText", doctype: "PH Herstellerbestellung" },
    { titel: "Wareneingang", href: "/sortiment/wareneingang", icon: "PackageCheck", doctype: "PH Wareneingang" },
    { titel: "Freigaben", href: "/sortiment/freigaben", icon: "BadgeCheck" },
    { titel: "Bestellvorschläge", href: "/sortiment/bestellvorschlaege", icon: "RefreshCw" },
    { titel: "Lieferanten", href: "/sortiment/lieferanten", icon: "Truck", doctype: "PH Lieferant" },
    { titel: "Preislisten", href: "/sortiment/preislisten", icon: "Receipt", doctype: "PH Preisliste Import" },
    { titel: "Kategorien", href: "/sortiment/kategorien", icon: "Layers", doctype: "PH Kategorie" },
    { titel: "Merkmale", href: "/sortiment/merkmale", icon: "SlidersHorizontal", doctype: "PH Merkmal" },
    { titel: "Berichte", href: "/sortiment/berichte", icon: "ChartColumn", recht: "report" },
    { titel: "Katalog-Import", href: "/sortiment/import", icon: "Download", recht: "delete" },
    { titel: "Einstellungen", href: "/sortiment/einstellungen", icon: "Settings" },
  ],
  kanban: ["PH Produkt", "PH Herstellerbestellung"],
  routen: {
    "PH Produkt": (name) => (name ? `/sortiment/produkte/${n(name)}` : "/sortiment/produkte"),
    "PH Marke": (name) => (name ? `/sortiment/marken/${n(name)}` : "/sortiment/marken"),
    "PH Lieferant": (name) => (name ? `/sortiment/lieferanten/${n(name)}` : "/sortiment/lieferanten"),
    "PH Herstellerbestellung": (name) => (name ? `/sortiment/bestellungen/${n(name)}` : "/sortiment/bestellungen"),
    "PH Wareneingang": (name) => (name ? `/sortiment/wareneingang/${n(name)}` : "/sortiment/wareneingang"),
    "PH Preisliste Import": (name) => (name ? `/sortiment/preislisten/${n(name)}` : "/sortiment/preislisten"),
    "PH Kategorie": (name) => (name ? `/sortiment/kategorien?kategorie=${n(name)}` : "/sortiment/kategorien"),
    "PH Merkmal": (name) => (name ? `/sortiment/merkmale?merkmal=${n(name)}` : "/sortiment/merkmale"),
  },
};

export default eintrag;
