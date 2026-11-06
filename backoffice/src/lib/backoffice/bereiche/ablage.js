// Bereich Ablage – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-ABL (Dateien, App ph_ablage).
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// Dateien und Ordner wie ein Drive im Backoffice; die Bytes liegen im austauschbaren Speicher von ph_ablage
// (lokal, S3, Google Drive, OneDrive), den niemand sieht. Bezüge (Kontakt, Projekt, Lieferant, Mitarbeiter,
// Servicefall) sind optional.
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; sobald eingetragen, leitet /d/<slug>/… mit 307 hierher.

const n = (name) => encodeURIComponent(name);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "ablage",
  titel: "Ablage",
  icon: "FileText",
  app: "ph_ablage",
  module: ["PH Ablage"],
  rollenName: "Ablage",
  // Weitere Rollen mit Zugriff laut permissions von PH Datei / PH Ordner (Backend-Import, nur gelesen):
  // Fachrollen legen Dateien an ihren eigenen Vorgängen ab. Die Ordnerrechte (intern/team/leitung) prüft Frappe.
  rollen: {
    "PH CRM Mitarbeiter": "mitarbeiter",
    "PH CRM Leitung": "mitarbeiter",
    "PH Projekte Mitarbeiter": "mitarbeiter",
    "PH Projekte Leitung": "mitarbeiter",
    "PH Sortiment Mitarbeiter": "mitarbeiter",
    "PH Sortiment Leitung": "mitarbeiter",
    "PH Service Mitarbeiter": "mitarbeiter",
    "PH Service Leitung": "mitarbeiter",
    "PH Personal Leitung": "mitarbeiter",
  },
  startseite: "/ablage",
  doctypes: ["PH Datei", "PH Ordner", "PH Datei Freigabelink", "PH Ablage Ereignis", "PH Ablage Einstellungen"],
  // Eigene Seiten (B-ABL, Konzept 10-konzept-ablage §2.1). Generische Listen /d/ph-datei usw. leiten über `routen`
  // mit 307 hierher (Admin behält ?generisch=1). Bericht und Einstellungen nur Leitung/GF/Admin („export“).
  navigation: [
    { titel: "Dateien", href: "/ablage", icon: "FileText" },
    { titel: "Zuletzt", href: "/ablage/zuletzt", icon: "Clock" },
    { titel: "Freigaben", href: "/ablage/freigaben", icon: "Share2" },
    { titel: "Papierkorb", href: "/ablage/papierkorb", icon: "Trash2" },
    { titel: "Bericht", href: "/ablage/bericht", icon: "ChartColumn", recht: "export" },
    { titel: "Einstellungen", href: "/ablage/einstellungen", icon: "Settings", recht: "export" },
    // Verlauf lesen laut DocType nur Ablage-Leitung, Geschäftsführung, Admin – generische Liste bleibt.
    { titel: "Verlauf", href: "/d/ph-ablage-ereignis", doctype: "PH Ablage Ereignis", recht: "export" },
  ],
  routen: {
    "PH Datei": (name) => (name ? `/ablage/datei/${n(name)}` : "/ablage/zuletzt"),
    "PH Ordner": (name) => (name ? `/ablage?ordner=${n(name)}` : "/ablage"),
    "PH Datei Freigabelink": () => "/ablage/freigaben",
  },
};

export default eintrag;
