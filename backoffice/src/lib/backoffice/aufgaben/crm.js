// Zu-tun-Quellen des Bereichs CRM (G-11, Register aufgaben/index.js – Importzeile trägt P0-5/L0 ein).
// Gleiche Definitionen wie „Zu erledigen“ in /crm (10-konzept-crm § 3.1), als zählende Zeilen für Zentrale und
// Bereichsstart. Reines Modul (keine "@/"-Importe), läuft unter node --test.

const offen = ["Offen", "In Arbeit"];
const heute = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const jetzt = () => `${heute()} ${new Date().toTimeString().slice(0, 8)}`;
const zaehle = (doctype, filters) => async ({ client }) => client.count(doctype, { filters });

/** @type {Array<object>} */
const quellen = [
  {
    id: "crm.neue-anfragen", bereich: "crm", icon: "Inbox", ton: "cognac", rang: 10,
    satz: (n) => (n === 1 ? "1 neue Anfrage wartet auf den Erstkontakt" : `${n} neue Anfragen warten auf den Erstkontakt`),
    zaehle: zaehle("PH Anfrage", [["status", "=", "Neu"]]),
    knopf: { titel: "Ansehen", href: "/crm/anfragen?sicht=neu" },
  },
  {
    id: "crm.termine-bestaetigen", bereich: "crm", icon: "CalendarDays", ton: "eiche", rang: 20,
    satz: (n) => (n === 1 ? "1 Termin ist zu bestätigen" : `${n} Termine sind zu bestätigen`),
    unter: "E-Mail vom Kunden bestätigt",
    zaehle: zaehle("PH Termin", [["status", "=", "Unbestaetigt"], ["email_verifiziert", "=", 1]]),
    knopf: { titel: "Bestätigen", href: "/crm/termine?ansicht=liste&sicht=bestaetigen" },
  },
  {
    id: "crm.ohne-protokoll", bereich: "crm", icon: "PenTool", ton: "see", rang: 30,
    satz: (n) => (n === 1 ? "1 Termin ohne Protokoll" : `${n} Termine ohne Protokoll`),
    zaehle: ({ client }) => client.count("PH Termin", { filters: [["status", "=", "Bestaetigt"], ["ende", "<", jetzt()]] }),
    knopf: { titel: "Schreiben", href: "/crm/termine?ansicht=liste&sicht=ohne-protokoll" },
  },
  {
    id: "crm.nachfassen", bereich: "crm", icon: "Clock", ton: "eiche", rang: 40, sichten: ["mir"],
    satz: (n) => (n === 1 ? "1 Anfrage nachfassen" : `${n} Anfragen nachfassen`),
    zaehle: ({ session, client }) => client.count("PH Aufgabe", { filters: [["referenz_doctype", "=", "PH Anfrage"], ["status", "in", offen], ["faellig", "<=", heute()], ["zugewiesen_an", "=", session.user]] }),
    knopf: { titel: "Öffnen", href: "/crm" },
  },
  {
    id: "crm.datenschutz-frist", bereich: "crm", icon: "Shield", ton: "ziegel", rang: 50, recht: { bereich: "crm", aktion: "cancel" },
    satz: (n) => (n === 1 ? "1 Datenschutzanfrage mit Frist in 7 Tagen" : `${n} Datenschutzanfragen mit Frist in 7 Tagen`),
    zaehle: ({ client }) => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const bis = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return client.count("PH Datenschutzanfrage", { filters: [["status", "in", offen], ["frist", "<=", bis]] });
    },
    knopf: { titel: "Öffnen", href: "/crm/datenschutz?sicht=frist" },
  },
];

export default quellen;
