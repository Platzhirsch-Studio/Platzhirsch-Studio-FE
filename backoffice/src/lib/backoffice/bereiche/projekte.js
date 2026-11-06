// Bereich Projekte – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-PRJ.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// 10-konzept-projekte.md § 3.1: Übersicht · Projekte · Rückmeldungen · Montagen · Aufgaben · Mängel · Mehr (Nachträge,
// Zeiten, Fremdgewerke, Dokumente, Produktpässe, Referenzen, Berichte, Einstellungen nur Leitung).
// Planung, Rendering, Aufmaß und Nachtrag liegen unter dem Projekt; ihre Akten erreicht man ohne Projektnamen über
// /projekte/objekt/<art>/<name> (schlägt das Projekt nach und leitet weiter).

const n = (name) => encodeURIComponent(name);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "projekte",
  titel: "Projekte",
  icon: "Hammer",
  app: "ph_projekte",
  module: ["PH Projekte"],
  rollenName: "Projekte",
  startseite: "/projekte",
  doctypes: [
    "PH Projekt", "PH Planung", "PH Montageauftrag", "PH Abnahme", "PH Rendering", "PH Referenz", "PH Produktpass",
    "PH Aufmass", "PH Nachtrag", "PH Fremdgewerk", "PH Projekt Aufgabe", "PH Projektzeit", "PH Projekt Dokument",
    "PH Tagebuch Foto", "PH Projekt Nachricht", "PH Rendering Feedback", "PH Projekt Nachkalkulation", "PH Projekte Einstellungen",
  ],
  navigation: [
    { titel: "Übersicht", href: "/projekte", icon: "LayoutDashboard" },
    { titel: "Projekte", href: "/projekte/liste", icon: "FolderKanban", doctype: "PH Projekt" },
    { titel: "Rückmeldungen", href: "/projekte/rueckmeldungen", icon: "MessageSquare", doctype: "PH Rendering Feedback" },
    { titel: "Montagen", href: "/projekte/montagen", icon: "CalendarDays", doctype: "PH Montageauftrag" },
    { titel: "Aufgaben", href: "/projekte/aufgaben", icon: "CheckSquare", doctype: "PH Projekt Aufgabe" },
    { titel: "Mängel", href: "/projekte/maengel", icon: "TriangleAlert" },
    { titel: "Nachträge", href: "/projekte/nachtraege", icon: "Layers", doctype: "PH Nachtrag" },
    { titel: "Zeiten", href: "/projekte/zeiten", icon: "Clock", doctype: "PH Projektzeit" },
    { titel: "Fremdgewerke", href: "/projekte/fremdgewerke", icon: "Wrench", doctype: "PH Fremdgewerk" },
    { titel: "Dokumente", href: "/projekte/dokumente", icon: "FileText", doctype: "PH Projekt Dokument" },
    { titel: "Produktpässe", href: "/projekte/produktpaesse", icon: "BadgeCheck", doctype: "PH Produktpass" },
    { titel: "Referenzen", href: "/projekte/referenzen", icon: "Star", doctype: "PH Referenz" },
    { titel: "Berichte", href: "/projekte/berichte/uebersicht", icon: "ChartColumn", recht: "report" },
    { titel: "Einstellungen", href: "/projekte/einstellungen", icon: "Settings", recht: "cancel" },
  ],
  kanban: ["PH Projekt", "PH Montageauftrag", "PH Fremdgewerk", "PH Projekt Aufgabe"],
  routen: {
    "PH Projekt": (name) => (name ? `/projekte/${n(name)}` : "/projekte/liste"),
    "PH Montageauftrag": (name) => (name ? `/projekte/montagen/${n(name)}` : "/projekte/montagen"),
    "PH Abnahme": (name) => (name ? `/projekte/abnahmen/${n(name)}` : "/projekte/maengel?quelle=abnahme"),
    "PH Planung": (name) => (name ? `/projekte/objekt/planung/${n(name)}` : "/projekte/dokumente?kategorie=Plan"),
    "PH Rendering": (name) => (name ? `/projekte/objekt/renderings/${n(name)}` : "/projekte/dokumente?kategorie=Rendering"),
    "PH Aufmass": (name) => (name ? `/projekte/objekt/aufmass/${n(name)}` : "/projekte/dokumente?kategorie=Aufmass"),
    "PH Nachtrag": (name) => (name ? `/projekte/objekt/nachtraege/${n(name)}` : "/projekte/nachtraege"),
    "PH Fremdgewerk": (name) => (name ? `/projekte/fremdgewerke?gewerk=${n(name)}` : "/projekte/fremdgewerke"),
    "PH Projekt Aufgabe": (name) => (name ? `/projekte/aufgaben?aufgabe=${n(name)}` : "/projekte/aufgaben"),
    "PH Projektzeit": (name) => (name ? `/projekte/zeiten?zeit=${n(name)}` : "/projekte/zeiten"),
    "PH Projekt Dokument": (name) => (name ? `/projekte/dokumente?dokument=${n(name)}` : "/projekte/dokumente"),
    "PH Produktpass": (name) => (name ? `/projekte/produktpaesse/${n(name)}` : "/projekte/produktpaesse"),
    "PH Referenz": (name) => (name ? `/projekte/referenzen/${n(name)}` : "/projekte/referenzen"),
    "PH Rendering Feedback": (name) => (name ? `/projekte/rueckmeldungen?eintrag=${n(name)}` : "/projekte/rueckmeldungen"),
    "PH Projekte Einstellungen": () => "/projekte/einstellungen",
  },
};

export default eintrag;
