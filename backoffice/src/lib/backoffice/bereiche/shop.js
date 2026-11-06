// Bereich Shop – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-SHO.
// Navigation, Kanban, kanonische Routen und Startseite dieses Bereichs. Reines Datenmodul.
// 10-konzept-shop § 2.1: Übersicht · Bestellungen · Zahlungen · Gutscheine · Widerruf & Retouren · Anzahlungen ·
// Mehr (Stripe – Leitung, Berichte, Einstellungen – Leitung). Die Reiter zeigen höchstens sechs, Rest unter „Mehr“.
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; /d/<slug>/… leitet mit 307 hierher.

const n = (name) => encodeURIComponent(name);

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "shop",
  titel: "Shop",
  icon: "ShoppingBag",
  app: "ph_shop",
  module: ["PH Shop"],
  rollenName: "Shop",
  startseite: "/shop",
  doctypes: ["PH Bestellung", "PH Zahlung", "PH Gutschein", "PH Retoure", "PH Widerruf", "PH Anzahlung", "PH Stripe Ereignis", "PH Gutschein Bestellung", "PH Stripe Auszahlung"],
  navigation: [
    { titel: "Übersicht", href: "/shop", icon: "LayoutDashboard" },
    { titel: "Bestellungen", href: "/shop/bestellungen", icon: "ShoppingBag", doctype: "PH Bestellung" },
    { titel: "Zahlungen", href: "/shop/zahlungen", icon: "Wallet", doctype: "PH Zahlung" },
    { titel: "Gutscheine", href: "/shop/gutscheine", icon: "Ticket", doctype: "PH Gutschein" },
    { titel: "Widerruf & Retouren", href: "/shop/widerrufe", icon: "Undo2", doctype: "PH Widerruf" },
    { titel: "Anzahlungen", href: "/shop/anzahlungen", icon: "Banknote", doctype: "PH Anzahlung" },
    { titel: "Stripe", href: "/shop/stripe", icon: "CreditCard", doctype: "PH Stripe Ereignis", recht: "cancel" },
    { titel: "Berichte", href: "/shop/berichte/uebersicht", icon: "ChartColumn" },
    { titel: "Einstellungen", href: "/shop/einstellungen", icon: "Settings", recht: "cancel" },
  ],
  kanban: ["PH Bestellung", "PH Widerruf", "PH Retoure"],
  routen: {
    "PH Bestellung": (name) => (name ? `/shop/bestellungen/${n(name)}` : "/shop/bestellungen"),
    "PH Zahlung": (name) => (name ? `/shop/zahlungen/${n(name)}` : "/shop/zahlungen"),
    "PH Gutschein": (name) => (name ? `/shop/gutscheine/${n(name)}` : "/shop/gutscheine"),
    "PH Gutschein Bestellung": (name) => (name ? `/shop/gutscheinkaeufe/${n(name)}` : "/shop/gutscheine?tab=kaeufe"),
    "PH Widerruf": (name) => (name ? `/shop/widerrufe/${n(name)}` : "/shop/widerrufe"),
    "PH Retoure": (name) => (name ? `/shop/retouren/${n(name)}` : "/shop/widerrufe?segment=retouren"),
    "PH Anzahlung": (name) => (name ? `/shop/anzahlungen/${n(name)}` : "/shop/anzahlungen"),
    "PH Stripe Ereignis": (name) => (name ? `/shop/stripe/ereignisse/${n(name)}` : "/shop/stripe"),
    "PH Stripe Auszahlung": (name) => (name ? `/shop/stripe/auszahlungen/${n(name)}` : "/shop/stripe?tab=auszahlungen"),
  },
};

export default eintrag;
