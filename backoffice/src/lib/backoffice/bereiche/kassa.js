// Bereich Kassa – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-KAS.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// Ohne `navigation` zeigt die Seitenleiste die generischen Listen der ersten sechs DocTypes.
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; sobald eingetragen, leitet /d/<slug>/… mit 307 hierher.
// Konzept 10-konzept-kassa.md §2.1: Kiosk unter /kassa (KioskShell), Verwaltung unter /kassa/verwaltung/*.

const V = "/kassa/verwaltung";
const enc = (n) => encodeURIComponent(n);
const LEITUNG = { aktion: "cancel", bereich: "kassa" };

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "kassa",
  titel: "Kassa",
  icon: "Wallet",
  app: "ph_kassa",
  module: ["PH Kassa"],
  rollenName: "Kassa",
  startseite: V,
  doctypes: ["PH Kassenbeleg", "PH Kasse", "PH Kassenabschluss", "PH Kassenbuch", "PH Terminal", "PH DEP Export", "PH Kassa Ereignis", "PH Signatureinheit"],
  navigation: [
    { titel: "Übersicht", href: V, icon: "LayoutDashboard" },
    { titel: "Belege", href: `${V}/belege`, icon: "Receipt", doctype: "PH Kassenbeleg" },
    { titel: "Abschlüsse", href: `${V}/abschluesse`, icon: "ScrollText", doctype: "PH Kassenabschluss" },
    { titel: "Kassenbuch", href: `${V}/kassenbuch`, icon: "Wallet", doctype: "PH Kassenbuch" },
    { titel: "Berichte", href: `${V}/berichte`, icon: "ChartColumn", recht: "report" },
    { titel: "Kassen", href: `${V}/kassen`, icon: "Store", doctype: "PH Kasse" },
    { titel: "Terminals", href: `${V}/terminals`, icon: "CreditCard", doctype: "PH Terminal", recht: LEITUNG },
    { titel: "Ereignisse", href: `${V}/ereignisse`, icon: "ShieldAlert", doctype: "PH Kassa Ereignis" },
    { titel: "DEP-Export", href: `${V}/dep`, icon: "Download", doctype: "PH DEP Export" },
    { titel: "Einstellungen", href: `${V}/einstellungen`, icon: "Settings", recht: LEITUNG },
    { titel: "Bediener", href: `${V}/bediener`, icon: "Users", recht: LEITUNG },
  ],
  routen: {
    "PH Kassenbeleg": (name) => (name ? `${V}/belege/${enc(name)}` : `${V}/belege`),
    "PH Kassenabschluss": (name) => (name ? `${V}/abschluesse/${enc(name)}` : `${V}/abschluesse`),
    "PH Kasse": (name) => (name ? `${V}/kassen/${enc(name)}` : `${V}/kassen`),
    "PH Kassenbuch": () => `${V}/kassenbuch`,
    "PH Terminal": () => `${V}/terminals`,
    "PH Kassa Ereignis": () => `${V}/ereignisse`,
    "PH DEP Export": () => `${V}/dep`,
  },
};

export default eintrag;
