// Bereich CRM – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-CRM.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// 10-konzept-crm § 3: Übersicht · Anfragen · Kunden & Kontakte · Termine · Gespräche · Mehr (Berichte, Datenschutz,
// Einstellungen, Aufgaben). Die Reiter zeigen höchstens sechs, der Rest steht unter „Mehr“.
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; /d/<slug>/… leitet mit 307 hierher
// (Admin behält die generische Seite mit ?generisch=1).

const n = (name) => encodeURIComponent(name);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "crm",
  titel: "CRM",
  icon: "Contact",
  app: "ph_crm",
  module: ["PH CRM"],
  rollenName: "CRM",
  startseite: "/crm",
  doctypes: ["PH Anfrage", "PH Kontakt", "PH Termin", "PH Beratungsgespraech", "PH Aufgabe", "PH Terminart", "PH Verfuegbarkeit", "PH Datenschutzanfrage"],
  navigation: [
    { titel: "Übersicht", href: "/crm", icon: "LayoutDashboard" },
    { titel: "Anfragen", href: "/crm/anfragen", icon: "Inbox", doctype: "PH Anfrage" },
    { titel: "Kunden & Kontakte", href: "/crm/kontakte", icon: "Users", doctype: "PH Kontakt" },
    { titel: "Termine", href: "/crm/termine", icon: "CalendarDays", doctype: "PH Termin" },
    { titel: "Gespräche", href: "/crm/gespraeche", icon: "MessageSquare", doctype: "PH Beratungsgespraech" },
    { titel: "Berichte", href: "/crm/berichte", icon: "ChartColumn" },
    { titel: "Datenschutz", href: "/crm/datenschutz", icon: "Shield", doctype: "PH Datenschutzanfrage" },
    { titel: "Einstellungen", href: "/crm/einstellungen", icon: "Settings" },
  ],
  kanban: ["PH Anfrage", "PH Termin"],
  routen: {
    "PH Anfrage": (name) => (name ? `/crm/anfragen/${n(name)}` : "/crm/anfragen"),
    "PH Kontakt": (name) => (name ? `/kunden/${n(name)}` : "/crm/kontakte"),
    "PH Termin": (name) => (name ? `/crm/termine/${n(name)}` : "/crm/termine"),
    "PH Beratungsgespraech": (name) => (name ? `/crm/gespraeche/${n(name)}` : "/crm/gespraeche"),
    "PH Datenschutzanfrage": (name) => (name ? `/crm/datenschutz/${n(name)}` : "/crm/datenschutz"),
  },
};

export default eintrag;
