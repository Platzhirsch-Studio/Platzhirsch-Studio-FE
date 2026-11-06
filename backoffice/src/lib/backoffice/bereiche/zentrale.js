// Bereich Zentrale – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-ZEN.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// Ohne `navigation` zeigt die Seitenleiste die generischen Listen der ersten sechs DocTypes.
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; sobald eingetragen, leitet /d/<slug>/… mit 307 hierher.

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "zentrale",
  titel: "Zentrale",
  icon: "LayoutDashboard",
  app: "ph_core",
  module: ["PH Core", "Core"],
  rollenName: null,
  startseite: "/",
  doctypes: ["PH Aufgabe", "PH Einstellungen", "PH Firma", "PH API Protokoll", "PH Betriebsruhe"],
  // Konzept § 2.2: höchstens drei Einträge; Verwaltung nur mit Schreibrecht in der Zentrale (Admin, GF).
  navigation: [
    { titel: "Dashboard", href: "/", icon: "LayoutDashboard" },
    { titel: "Aufgaben", href: "/aufgaben", icon: "CheckSquare" },
    { titel: "Verwaltung", href: "/verwaltung", icon: "Settings", recht: "write" },
  ],
  routen: {
    "PH Aufgabe": (name) => (name ? `/aufgaben/${encodeURIComponent(name)}` : "/aufgaben"),
    "PH API Protokoll": () => "/protokoll?tab=api",
  },
  // Feste Zentrale-Seiten (Ziele der Gehe-zu-Kürzel G A/B/D/E/W, K-10). null = Seite gibt es noch nicht →
  // kein Kürzel (nie ein Ziel, das ins Leere führt). Zentrale trägt die Route ein, sobald die Seite steht.
  seiten: {
    aufgaben: "/aufgaben",
    benachrichtigungen: null, // Seite steht (B-ZEN); Eintrag mit angepasstem Register-Test (G B)
    einstellungen: "/einstellungen",
    druck: null, // Seite steht (B-ZEN); Eintrag mit angepasstem Register-Test (G D)
    // /verwaltung steht (B-ZEN); Eintrag folgt mit dem angepassten Register-Test (erwartet heute noch null).
    verwaltung: null,
  },
};

export default eintrag;
