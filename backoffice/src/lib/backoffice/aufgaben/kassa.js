// Zu-tun-Quellen – Bereich Kassa (Team B-KAS, G-11). Importzeile in aufgaben/index.js trägt P0-5/L0 ein:
//   import kassa from "./kassa.js";  … ZUTUN_BEREICHE = { …, kassa };
// Jede Quelle zählt im Backend (count) – nie Beträge, nur Fälle.

const heute = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const quellen = [
  {
    id: "kassa.abschluss-gezaehlt",
    bereich: "kassa",
    icon: "ScrollText",
    ton: "eiche",
    satz: (n) => (n === 1 ? "1 Tagesabschluss ist gezählt und wartet auf die Leitung" : `${n} Tagesabschlüsse sind gezählt und warten auf die Leitung`),
    recht: { bereich: "kassa", aktion: "cancel" },
    rang: 20,
    zaehle: ({ client }) => client.count("PH Kassenabschluss", { filters: [["status", "=", "Gezaehlt"]] }),
    knopf: { titel: "Abschließen", href: "/kassa/verwaltung/abschluesse" },
  },
  {
    id: "kassa.abschluss-offen",
    bereich: "kassa",
    icon: "CalendarDays",
    ton: "eiche",
    satz: (n) => (n === 1 ? "1 Tag ist noch nicht abgeschlossen" : `${n} Tage sind noch nicht abgeschlossen`),
    unter: "Abschluss nachholen – sonst fehlt der Tag im Kassenbuch.",
    recht: { bereich: "kassa", aktion: "cancel" },
    rang: 25,
    zaehle: ({ client }) => client.count("PH Kassenabschluss", { filters: [["status", "in", ["Offen", "Korrigiert"]], ["datum", "<", heute()]] }),
    knopf: { titel: "Ansehen", href: "/kassa/verwaltung/abschluesse" },
  },
  {
    id: "kassa.meldung-finanzonline",
    bereich: "kassa",
    icon: "ShieldAlert",
    ton: "ziegel",
    satz: (n) => (n === 1 ? "1 Ausfall muss an FinanzOnline gemeldet werden" : `${n} Ausfälle müssen an FinanzOnline gemeldet werden`),
    unter: "Ausfälle über 48 Stunden (RKSV).",
    recht: { bereich: "kassa", aktion: "cancel" },
    rang: 10,
    zaehle: ({ client }) => client.count("PH Kassa Ereignis", { filters: [["status", "=", "Offen"], ["meldung_finanzonline_noetig", "=", 1]] }),
    knopf: { titel: "Öffnen", href: "/kassa/verwaltung/ereignisse" },
  },
  {
    id: "kassa.dep-archivieren",
    bereich: "kassa",
    icon: "Download",
    ton: "stein",
    satz: (n) => (n === 1 ? "1 DEP-Export ist noch nicht archiviert" : `${n} DEP-Exporte sind noch nicht archiviert`),
    recht: { bereich: "kassa", aktion: "cancel" },
    rang: 60,
    zaehle: ({ client }) => client.count("PH DEP Export", { filters: [["status", "=", "Erstellt"]] }),
    knopf: { titel: "Ansehen", href: "/kassa/verwaltung/dep" },
  },
];

export default quellen;
