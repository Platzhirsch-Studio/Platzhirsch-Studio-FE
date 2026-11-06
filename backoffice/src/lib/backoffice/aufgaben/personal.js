// Zu-tun-Quellen – Bereich Personal (G-11, Konzept § 5.1 „Zu erledigen“). Schreibt: Team B-PER.
// Default-Export: Array von Definitionen nach aufgaben/index.js – für die Zentrale („Zu tun“) und den generischen
// Bereichsstart. Die Personal-Übersicht zeigt die ausführliche Fassung mit Inline-Aktionen (daten.ladeZuErledigen).
// Die Importzeile in ZUTUN_BEREICHE trägt P0-5/L0 ein. Reines Modul (keine "@/"-Importe), Zählung über den Client.

const LEITUNG = { bereich: "personal", aktion: "cancel" };
const heute = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const quellen = [
  {
    id: "personal.antraege",
    bereich: "personal",
    icon: "CalendarDays",
    ton: "eiche",
    satz: (n) => (n === 1 ? "1 Abwesenheitsantrag wartet auf eine Entscheidung" : `${n} Abwesenheitsanträge warten auf eine Entscheidung`),
    recht: LEITUNG,
    rang: 50,
    zaehle: async ({ client }) => client.count("PH Abwesenheit", { filters: [["status", "=", "Beantragt"]] }),
    knopf: { titel: "Entscheiden", href: "/personal/team?ansicht=antraege" },
  },
  {
    id: "personal.bewerbungen-neu",
    bereich: "personal",
    icon: "Inbox",
    ton: "cognac",
    satz: (n) => (n === 1 ? "1 neue Bewerbung" : `${n} neue Bewerbungen`),
    recht: { bereich: "personal", aktion: "report" },
    rang: 51,
    zaehle: async ({ client }) => client.count("PH Bewerbung", { filters: [["status", "=", "Eingegangen"]] }),
    knopf: { titel: "Sichten", href: "/personal/bewerbungen" },
  },
  {
    id: "personal.gehen-fehlt",
    bereich: "personal",
    icon: "Clock",
    ton: "eiche",
    satz: (n) => (n === 1 ? "Bei 1 Buchung fehlt „Gehen“" : `Bei ${n} Buchungen fehlt „Gehen“`),
    recht: LEITUNG,
    rang: 52,
    zaehle: async ({ client }) => client.count("PH Zeiterfassung", { filters: [["status", "=", "Offen"], ["datum", "<", heute()]] }),
    knopf: { titel: "Nachtragen", href: "/personal/team?ansicht=buchungen&status=Offen" },
  },
  {
    id: "personal.korrekturen",
    bereich: "personal",
    icon: "Pencil",
    ton: "see",
    satz: (n) => (n === 1 ? "1 Korrektur einer Zeitbuchung beantragt" : `${n} Korrekturen von Zeitbuchungen beantragt`),
    recht: LEITUNG,
    rang: 53,
    zaehle: async ({ client }) => client.count("PH Zeiterfassung", { filters: [["korrektur_status", "=", "Beantragt"]] }),
    knopf: { titel: "Prüfen", href: "/personal" },
  },
];

export default quellen;
