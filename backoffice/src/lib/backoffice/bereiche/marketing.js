// Bereich Marketing – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-MAR.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// 10-konzept-marketing § 2.0.1: Übersicht · Newsletter · Social · Events · Kampagnen · Empfänger · Mehr (Kundenreisen,
// Zielgruppen, Empfehlungen, Einblicke, Berichte, Vorlagen und Einstellungen nur Leitung). Die Reiter der Shell zeigen
// höchstens sechs, der Rest steht unter „Mehr“. Kanban nur für Social (E7).
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; sobald eingetragen, leitet /d/<slug>/… mit 307 hierher.

const n = (name) => encodeURIComponent(name);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "marketing",
  titel: "Marketing",
  icon: "Megaphone",
  app: "ph_marketing",
  module: ["PH Marketing"],
  rollenName: "Marketing",
  startseite: "/marketing",
  doctypes: ["PH Newsletter Ausgabe", "PH Newsletter Abo", "PH Event", "PH Event Anmeldung", "PH Kampagne", "PH Empfehlung", "PH Social Beitrag", "PH Kundenreise", "PH Einwilligung", "PH Segment", "PH Mail Vorlage"],
  navigation: [
    { titel: "Übersicht", href: "/marketing", icon: "LayoutDashboard" },
    { titel: "Newsletter", href: "/marketing/newsletter", icon: "Mail", doctype: "PH Newsletter Ausgabe" },
    { titel: "Social", href: "/marketing/social", icon: "Share2", doctype: "PH Social Beitrag" },
    { titel: "Events", href: "/marketing/events", icon: "Ticket", doctype: "PH Event" },
    { titel: "Kampagnen", href: "/marketing/kampagnen", icon: "Megaphone", doctype: "PH Kampagne" },
    { titel: "Empfänger", href: "/marketing/empfaenger", icon: "Users", doctype: "PH Newsletter Abo" },
    { titel: "Kundenreisen", href: "/marketing/kundenreisen", icon: "RefreshCw", doctype: "PH Kundenreise" },
    { titel: "Zielgruppen", href: "/marketing/zielgruppen", icon: "Filter", doctype: "PH Segment" },
    { titel: "Empfehlungen", href: "/marketing/empfehlungen", icon: "Gift", doctype: "PH Empfehlung" },
    { titel: "Einblicke", href: "/marketing/einblicke", icon: "Eye" },
    { titel: "Berichte", href: "/marketing/berichte/newsletter-entwicklung", icon: "ChartColumn", recht: "report" },
    { titel: "Vorlagen", href: "/marketing/vorlagen", icon: "FileText", recht: "delete" },
    { titel: "Einstellungen", href: "/marketing/einstellungen", icon: "Settings", recht: "delete" },
  ],
  kanban: ["PH Social Beitrag"],
  routen: {
    "PH Newsletter Ausgabe": (name) => (name ? `/marketing/newsletter/${n(name)}` : "/marketing/newsletter"),
    "PH Newsletter Abo": (name) => (name ? `/marketing/empfaenger/${n(name)}` : "/marketing/empfaenger"),
    "PH Einwilligung": (name) => (name ? `/marketing/einwilligungen/${n(name)}` : "/marketing/empfaenger?ansicht=einwilligungen"),
    "PH Event": (name) => (name ? `/marketing/events/${n(name)}` : "/marketing/events"),
    "PH Kampagne": (name) => (name ? `/marketing/kampagnen/${n(name)}` : "/marketing/kampagnen"),
    "PH Social Beitrag": (name) => (name ? `/marketing/social/${n(name)}` : "/marketing/social"),
    "PH Empfehlung": (name) => (name ? `/marketing/empfehlungen/${n(name)}` : "/marketing/empfehlungen"),
    "PH Kundenreise": (name) => (name ? `/marketing/kundenreisen/${n(name)}` : "/marketing/kundenreisen"),
    "PH Segment": (name) => (name ? `/marketing/zielgruppen/${n(name)}` : "/marketing/zielgruppen"),
    "PH Mail Vorlage": (name) => (name ? `/marketing/vorlagen?vorlage=${n(name)}` : "/marketing/vorlagen"),
  },
};

export default eintrag;
