// Bereich Kundenkarte – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-KKA.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// 10-konzept-kundenkarte § 2.1: Übersicht · Anträge · Karten · Einlösungen · Stufen & Vorteile · Berichte;
// Einstellungen zusätzlich über das Zahnrad im Seitenkopf. Kein Kanban (Konzept P20, K4).
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; /d/<slug>/… leitet mit 307 hierher.

const n = (name) => encodeURIComponent(name);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "kundenkarte",
  titel: "Kundenkarte",
  icon: "CreditCard",
  app: "ph_kundenkarte",
  module: ["PH Kundenkarte"],
  rollenName: "Kundenkarte",
  startseite: "/kundenkarte",
  doctypes: ["PH Kundenkarte Antrag", "PH Kundenkarte", "PH Kundenkarte Stufe", "PH Kundenkarte Vorteil", "PH Kundenkarte Einloesung"],
  navigation: [
    { titel: "Übersicht", href: "/kundenkarte", icon: "LayoutDashboard" },
    { titel: "Anträge", href: "/kundenkarte/antraege", icon: "Inbox", doctype: "PH Kundenkarte Antrag" },
    { titel: "Karten", href: "/kundenkarte/karten", icon: "CreditCard", doctype: "PH Kundenkarte" },
    { titel: "Einlösungen", href: "/kundenkarte/einloesungen", icon: "CheckCheck", doctype: "PH Kundenkarte Einloesung" },
    { titel: "Stufen & Vorteile", href: "/kundenkarte/stufen", icon: "Layers", doctype: "PH Kundenkarte Stufe" },
    { titel: "Berichte", href: "/kundenkarte/berichte", icon: "ChartColumn" },
    { titel: "Einstellungen", href: "/kundenkarte/einstellungen", icon: "Settings" },
  ],
  kanban: [],
  routen: {
    "PH Kundenkarte Antrag": (name) => (name ? `/kundenkarte/antraege/${n(name)}` : "/kundenkarte/antraege"),
    "PH Kundenkarte": (name) => (name ? `/kundenkarte/karten/${n(name)}` : "/kundenkarte/karten"),
    "PH Kundenkarte Einloesung": (name) => (name ? `/kundenkarte/einloesungen/${n(name)}` : "/kundenkarte/einloesungen"),
    "PH Kundenkarte Stufe": () => "/kundenkarte/stufen",
    "PH Kundenkarte Vorteil": (name) => (name ? `/kundenkarte/vorteile/${n(name)}` : "/kundenkarte/vorteile"),
  },
};

export default eintrag;
