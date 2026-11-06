// Zu-tun-Quellen – Bereich Ablage (G-11, Konzept 10-konzept-ablage §8). Schreibt: Team B-ABL.
// Default-Export: Array von Definitionen nach aufgaben/index.js. Die Importzeile in ZUTUN_BEREICHE trägt P0-5/L0 ein.
// Reines Modul (keine "@/"-Importe), Zählung über den übergebenen Client (Mock oder Frappe) – nur echte Zahlen.

const DATEI = "PH Datei";
const LINK = "PH Datei Freigabelink";

function zeit(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
}
function tag(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const inTagen = (n) => new Date(Date.now() + n * 86_400_000);

const quellen = [
  {
    id: "ablage.ausgecheckt",
    bereich: "ablage",
    icon: "Lock",
    ton: "see",
    satz: (n) => `${n} ${n === 1 ? "Datei ist" : "Dateien sind"} von dir ausgecheckt`,
    unter: "Andere können sie bis zum Einchecken nicht ändern.",
    rang: 70,
    zaehle: async ({ client, session }) => client.count(DATEI, { filters: [["status", "=", "Aktiv"], ["gesperrt_von", "=", session.user], ["gesperrt_bis", ">", zeit(new Date())]] }),
    knopf: { titel: "Ansehen", href: "/ablage/zuletzt?filter=ausgecheckt" },
  },
  {
    id: "ablage.links-laufen-ab",
    bereich: "ablage",
    icon: "Share2",
    ton: "eiche",
    satz: (n) => `${n} ${n === 1 ? "Freigabelink läuft" : "Freigabelinks laufen"} in den nächsten 3 Tagen ab`,
    rang: 71,
    zaehle: async ({ client }) => client.count(LINK, { filters: [["status", "=", "Aktiv"], ["ablauf", "between", [zeit(new Date()), zeit(inTagen(3))]]] }),
    knopf: { titel: "Prüfen", href: "/ablage/freigaben" },
  },
  {
    id: "ablage.papierkorb-frist",
    bereich: "ablage",
    icon: "Trash2",
    ton: "stein",
    satz: (n) => `${n} ${n === 1 ? "Datei wird" : "Dateien werden"} diese Woche endgültig gelöscht`,
    unter: "Papierkorb nach 30 Tagen.",
    sichten: ["team"],
    rang: 72,
    recht: { bereich: "ablage", aktion: "export" },
    zaehle: async ({ client }) => client.count(DATEI, { filters: [["status", "=", "Papierkorb"], ["papierkorb_bis", "<=", tag(inTagen(7))]] }),
    knopf: { titel: "Papierkorb", href: "/ablage/papierkorb" },
  },
];

export default quellen;
