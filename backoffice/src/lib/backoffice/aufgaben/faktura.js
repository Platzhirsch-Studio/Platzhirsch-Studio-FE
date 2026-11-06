// Zu-tun-Quellen des Bereichs Faktura für die Zentrale (G-11; 10-konzept-faktura § 3.1, § 15.3 „Zentrale: Einbindung
// faktura/zuTun.js“). Schreibt: Team B-FAK. Import-Zeile in aufgaben/index.js trägt P0-5/L0 ein.
// Nur echte Zahlen aus vorhandenen Feldern; die Faktura-Startseite zeigt dieselben Regeln als Zeilen (zuTun.js).

const lese = async (client, doctype, filters) => {
  try {
    return await client.getList(doctype, { fields: ["name"], filters, limit: 500 });
  } catch {
    return [];
  }
};

/** @type {Array<object>} */
const quellen = [
  {
    id: "faktura.bank-sicher",
    bereich: "faktura",
    icon: "Banknote",
    ton: "see",
    satz: (n) => `${n} ${n === 1 ? "Bankeingang" : "Bankeingänge"} mit sicherem Vorschlag`,
    recht: { bereich: "faktura", aktion: "cancel" },
    rang: 20,
    zaehle: async ({ client }) => (await lese(client, "PH Bankumsatz", [["status", "=", "Offen"], ["vorschlag_sicherheit", ">=", 100], ["vorschlag_doctype", "=", "PH Rechnung"]])).length,
    knopf: { titel: "Zuordnen", href: "/faktura/bank?r=offen" },
  },
  {
    id: "faktura.ueberfaellig",
    bereich: "faktura",
    icon: "TriangleAlert",
    ton: "eiche",
    satz: (n) => `${n} ${n === 1 ? "Rechnung überfällig" : "Rechnungen überfällig"}`,
    recht: { bereich: "faktura", aktion: "write" },
    rang: 30,
    zaehle: async ({ client }) => (await lese(client, "PH Rechnung", [["status", "in", ["Ueberfaellig", "Gemahnt"]]])).length,
    knopf: { titel: "Mahnen", href: "/faktura/rechnungen?r=ueberfaellig" },
  },
  {
    id: "faktura.er-freigabe",
    bereich: "faktura",
    icon: "Clock",
    ton: "cognac",
    satz: (n) => `${n} ${n === 1 ? "Eingangsrechnung wartet" : "Eingangsrechnungen warten"} auf Freigabe`,
    recht: { bereich: "faktura", aktion: "cancel" },
    rang: 40,
    zaehle: async ({ client }) => (await lese(client, "PH Eingangsrechnung", [["status", "=", "Sachlich geprueft"]])).length,
    knopf: { titel: "Freigeben", href: "/faktura/eingangsrechnungen?r=freigabe" },
  },
  {
    id: "faktura.kosten-offen",
    bereich: "faktura",
    icon: "Layers",
    ton: "stein",
    satz: (n) => `${n} ${n === 1 ? "Eingangsrechnung" : "Eingangsrechnungen"} ohne Kostenzuordnung`,
    recht: { bereich: "faktura", aktion: "write" },
    rang: 45,
    zaehle: async ({ client }) => (await lese(client, "PH Eingangsrechnung", [["zuordnung_status", "=", "Offen"], ["status", "!=", "Abgelehnt"]])).length,
    knopf: { titel: "Zuordnen", href: "/faktura/eingangsrechnungen?r=kosten" },
  },
  {
    id: "faktura.entwuerfe",
    bereich: "faktura",
    icon: "FileText",
    ton: "stein",
    satz: (n) => `${n} ${n === 1 ? "Rechnungsentwurf" : "Rechnungsentwürfe"} nicht gestellt`,
    recht: { bereich: "faktura", aktion: "write" },
    rang: 60,
    zaehle: async ({ client }) => (await lese(client, "PH Rechnung", [["docstatus", "=", 0]])).length,
    knopf: { titel: "Ansehen", href: "/faktura/rechnungen?r=entwuerfe" },
  },
];

export default quellen;
