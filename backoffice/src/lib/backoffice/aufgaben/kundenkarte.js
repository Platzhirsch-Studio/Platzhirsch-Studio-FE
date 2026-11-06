// Zu-tun-Quellen – Bereich Kundenkarte (G-11, Konzept § 3.1 „Zu tun“). Schreibt: Team B-KKA.
// Default-Export: Array von Definitionen nach aufgaben/index.js. Die Importzeile in ZUTUN_BEREICHE trägt P0-5/L0 ein.
// Reines Modul (keine "@/"-Importe), Zählung über den übergebenen Client (Mock oder Frappe).

const KARTE = "PH Kundenkarte";
const ANTRAG = "PH Kundenkarte Antrag";

function vor(tage) {
  const d = new Date();
  d.setDate(d.getDate() - tage);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

const quellen = [
  {
    id: "kundenkarte.antraege",
    bereich: "kundenkarte",
    icon: "Inbox",
    ton: "cognac",
    satz: (n) => `${n} ${n === 1 ? "Kartenantrag wartet" : "Kartenanträge warten"} auf eine Entscheidung`,
    rang: 40,
    zaehle: async ({ client }) => (await client.count(ANTRAG, { filters: [["status", "=", "Bestaetigt"]] })) + (await client.count(ANTRAG, { filters: [["status", "=", "Neu"], ["doi_noetig", "=", 0]] })),
    knopf: { titel: "Entscheiden", href: "/kundenkarte/antraege?reiter=entscheiden" },
  },
  {
    id: "kundenkarte.ohne-berater",
    bereich: "kundenkarte",
    icon: "UserPlus",
    ton: "see",
    satz: (n) => `${n} ${n === 1 ? "Kundenkarte" : "Kundenkarten"} ohne Berater`,
    rang: 41,
    zaehle: async ({ client }) => client.count(KARTE, { filters: [["status", "=", "Aktiv"], ["persoenlicher_berater", "is", "not set"]] }),
    knopf: { titel: "Zuweisen", href: "/kundenkarte/karten?reiter=ohneBerater" },
  },
  {
    id: "kundenkarte.uebergabe",
    bereich: "kundenkarte",
    icon: "Hourglass",
    ton: "eiche",
    satz: (n) => `${n} ${n === 1 ? "Kundenkarte wartet" : "Kundenkarten warten"} seit über 7 Tagen auf Übergabe`,
    rang: 42,
    zaehle: async ({ client }) => client.count(KARTE, { filters: [["status", "=", "Beantragt"], ["creation", "<", vor(7)]] }),
    knopf: { titel: "Öffnen", href: "/kundenkarte/karten?reiter=uebergabe" },
  },
];

export default quellen;
