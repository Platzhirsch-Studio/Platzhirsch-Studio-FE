// Bereich Personal – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-PER.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// Konzept § 3.1: Übersicht · Stellen · Bewerbungen · Gespräche · Team sichtbar, „Mehr“ mit Mein Bereich, Löschfristen,
// Berichte, Einstellungen (die Shell zeigt höchstens sechs Reiter; Mein Bereich ist über die Stempelpille zwei Klicks
// entfernt, für reinen Selbstservice ist es der einzige Reiter). `recht: "report"` blendet die Fachseiten für reinen Selbstservice aus (Selbstservice hat
// nur read/write/create). Rollen-Ausschlüsse (Backoffice-Admin ohne Bewerbungen/Gespräche) kann das Register nicht
// ausdrücken – die Seiten leiten dann auf /kein-zugriff (Wunsch an P0-1 im Übergabeprotokoll B-PER).
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; /d/<slug>/… leitet mit 307 hierher.

const n = (name) => encodeURIComponent(name);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "personal",
  titel: "Personal",
  icon: "BadgeCheck",
  app: "ph_personal",
  module: ["PH Personal"],
  rollenName: "Personal",
  startseite: "/personal",
  doctypes: ["PH Bewerbung", "PH Stelle", "PH Mitarbeiter", "PH Bewerbungsgespraech", "PH Abwesenheit", "PH Zeiterfassung", "PH Krankmeldung"],
  navigation: [
    { titel: "Übersicht", href: "/personal", icon: "LayoutDashboard", recht: "report" },
    { titel: "Stellen", href: "/personal/stellen", icon: "Megaphone", doctype: "PH Stelle", recht: "report" },
    { titel: "Bewerbungen", href: "/personal/bewerbungen", icon: "Inbox", doctype: "PH Bewerbung", recht: "report" },
    { titel: "Gespräche", href: "/personal/gespraeche", icon: "MessageSquare", doctype: "PH Bewerbungsgespraech", recht: "report" },
    { titel: "Team", href: "/personal/team", icon: "Users", doctype: "PH Mitarbeiter", recht: "report" },
    { titel: "Mein Bereich", href: "/personal/meins", icon: "User" },
    { titel: "Löschfristen", href: "/personal/datenschutz", icon: "Shield", recht: "cancel" },
    { titel: "Berichte", href: "/personal/berichte", icon: "ChartColumn", recht: "report" },
    { titel: "Einstellungen", href: "/personal/einstellungen", icon: "Settings", recht: "report" },
  ],
  kanban: ["PH Bewerbung"],
  routen: {
    "PH Stelle": (name) => (name ? `/personal/stellen/${n(name)}` : "/personal/stellen"),
    "PH Bewerbung": (name) => (name ? `/personal/bewerbungen/${n(name)}` : "/personal/bewerbungen"),
    "PH Bewerbungsgespraech": (name) => (name ? `/personal/gespraeche?panel=${n(name)}` : "/personal/gespraeche"),
    "PH Mitarbeiter": (name) => (name ? `/personal/mitarbeiter/${n(name)}` : "/personal/team?ansicht=personen"),
    "PH Abwesenheit": () => "/personal/team?ansicht=antraege",
    "PH Zeiterfassung": () => "/personal/team?ansicht=buchungen",
    "PH Krankmeldung": () => "/personal/team?ansicht=antraege",
  },
};

export default eintrag;
