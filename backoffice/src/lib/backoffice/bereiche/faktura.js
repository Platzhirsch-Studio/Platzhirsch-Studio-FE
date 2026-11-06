// Bereich Faktura – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-FAK.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// Ohne `navigation` zeigt die Seitenleiste die generischen Listen der ersten sechs DocTypes.
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; sobald eingetragen, leitet /d/<slug>/… mit 307 hierher.
// Unternavigation laut 10-konzept-faktura § 3: Übersicht · Angebote · Aufträge · Rechnungen · Bank (Leitung/StB) ·
// Eingangsrechnungen · Mehr (Gutschriften, Mahnungen, Zahllauf, Export, UVA, Monatsabschluss, Berichte, Journal,
// Stammdaten). Die Shell zeigt höchstens sechs Pillen, der Rest steht unter „Mehr“.

const enc = (n) => encodeURIComponent(n);
const route = (basis) => (name) => (name ? `/faktura/${basis}/${enc(name)}` : `/faktura/${basis}`);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "faktura",
  titel: "Faktura",
  icon: "Receipt",
  app: "ph_faktura",
  module: ["PH Faktura"],
  rollenName: "Faktura",
  startseite: "/faktura",
  doctypes: ["PH Angebot", "PH Auftragsbestaetigung", "PH Rechnung", "PH Gutschrift", "PH Mahnung", "PH Eingangsrechnung", "PH Bankumsatz", "PH Zahlungsplan", "PH Export Lauf", "PH UVA Auswertung"],
  kanban: ["PH Angebot", "PH Eingangsrechnung"],
  navigation: [
    { titel: "Übersicht", href: "/faktura", icon: "Receipt" },
    { titel: "Angebote", href: "/faktura/angebote", doctype: "PH Angebot" },
    { titel: "Aufträge", href: "/faktura/auftraege", doctype: "PH Auftragsbestaetigung" },
    { titel: "Rechnungen", href: "/faktura/rechnungen", doctype: "PH Rechnung" },
    { titel: "Bank", href: "/faktura/bank", doctype: "PH Bankumsatz", recht: "export" },
    { titel: "Eingangsrechnungen", href: "/faktura/eingangsrechnungen", doctype: "PH Eingangsrechnung" },
    { titel: "Gutschriften", href: "/faktura/gutschriften", doctype: "PH Gutschrift" },
    { titel: "Mahnungen", href: "/faktura/mahnungen", doctype: "PH Mahnung" },
    { titel: "Zahllauf", href: "/faktura/zahllauf", recht: "write" },
    { titel: "Export an Kanzlei", href: "/faktura/export", doctype: "PH Export Lauf", recht: "export" },
    { titel: "UVA", href: "/faktura/uva", doctype: "PH UVA Auswertung", recht: "export" },
    { titel: "Monatsabschluss", href: "/faktura/abschluss", recht: "cancel" },
    { titel: "Berichte", href: "/faktura/berichte/uebersicht", recht: "report" },
    { titel: "Journal", href: "/faktura/journal", recht: "report" },
    { titel: "Stammdaten", href: "/faktura/stammdaten", recht: "write" },
  ],
  routen: {
    "PH Angebot": route("angebote"),
    "PH Auftragsbestaetigung": route("auftraege"),
    "PH Rechnung": route("rechnungen"),
    "PH Gutschrift": route("gutschriften"),
    "PH Mahnung": route("mahnungen"),
    "PH Eingangsrechnung": route("eingangsrechnungen"),
    "PH Bankumsatz": () => "/faktura/bank",
    "PH Export Lauf": route("export"),
    "PH UVA Auswertung": route("uva"),
  },
};

export default eintrag;
