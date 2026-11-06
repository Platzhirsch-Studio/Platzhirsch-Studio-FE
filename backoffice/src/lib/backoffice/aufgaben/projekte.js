// Zu-tun-Quellen des Bereichs Projekte (G-11, MASTER § 3.5). Schreibt: Team B-PRJ.
// Die Importzeile in aufgaben/index.js (ZUTUN_BEREICHE) trägt P0-5/L0 ein; bis dahin nutzt die Projekte-Übersicht
// diese Liste direkt. Reines Modul (keine "@/"-Importe). Zahlen kommen nur aus echten Abfragen (keine Schätzung).

import { heuteIso } from "./index.js";
import { istOffeneRueckmeldung } from "../projekte/zaehler.js";
import { istErledigt, tageUeberfaellig } from "../projekte/maengel.js";

const sicher = async (fn, ersatz) => {
  try {
    return await fn();
  } catch {
    return ersatz;
  }
};

const anzahl = (n, eins, viele) => (n === 1 ? eins : viele.replace("{n}", n));

/** @type {Array<object>} */
const quellen = [
  {
    id: "projekte.rueckmeldungen",
    bereich: "projekte",
    icon: "MessageSquare",
    ton: "cognac",
    rang: 10,
    satz: (n) => anzahl(n, "1 Rückmeldung wartet auf Antwort", "{n} Rückmeldungen warten auf Antwort"),
    unter: "Pins, Sprachnotizen, Freigaben und Nachrichten aus dem Kundenportal",
    zaehle: async ({ client }) => {
      const [f, n, p, t] = await Promise.all([
        sicher(() => client.getList("PH Rendering Feedback", { fields: ["name", "von", "art", "status"], filters: [["status", "=", "Offen"]], limit: 500 }), []),
        sicher(() => client.getList("PH Projekt Nachricht", { fields: ["name", "richtung", "status"], filters: [["status", "=", "Ungelesen"]], limit: 500 }), []),
        sicher(() => client.getList("PH Planung", { fields: ["name", "status", "kunde_entscheidung"], filters: [["status", "=", "Kunde vorgelegt"]], limit: 500 }), []),
        sicher(() => client.getList("PH Nachtrag", { fields: ["name", "status", "uebernommen", "entscheidung_am"], filters: [["status", "in", ["Freigegeben", "Abgelehnt"]]], limit: 500 }), []),
      ]);
      // Gleiche Formel wie Inbox, Kennzahl und Glocke (§ 3.6): Rückmeldungen, Nachrichten, Planungs- und Nachtragsentscheidungen.
      return f.filter((x) => istOffeneRueckmeldung("feedback", x)).length + n.filter((x) => istOffeneRueckmeldung("nachricht", x)).length + p.filter((x) => istOffeneRueckmeldung("planung", x)).length + t.filter((x) => istOffeneRueckmeldung("nachtrag", x)).length;
    },
    knopf: { titel: "Beantworten", href: "/projekte/rueckmeldungen" },
  },
  {
    id: "projekte.montage-planen",
    bereich: "projekte",
    icon: "CalendarPlus",
    ton: "salbei",
    rang: 20,
    sichten: ["team"],
    satz: (n) => anzahl(n, "1 Projekt in Lieferung ohne Montage", "{n} Projekte in Lieferung ohne Montage"),
    unter: "Ware ist da oder kommt – Montage einplanen",
    zaehle: async ({ client }) => {
      const [p, m] = await Promise.all([
        sicher(() => client.getList("PH Projekt", { fields: ["name"], filters: [["status", "=", "Lieferung"]], limit: 500 }), []),
        sicher(() => client.getList("PH Montageauftrag", { fields: ["projekt"], filters: [["status", "!=", "Abgebrochen"]], limit: 1000 }), []),
      ]);
      const mit = new Set(m.map((x) => x.projekt));
      return p.filter((x) => !mit.has(x.name)).length;
    },
    knopf: { titel: "Planen", href: "/projekte/montagen#nicht-eingeplant" },
  },
  {
    id: "projekte.abnahme",
    bereich: "projekte",
    icon: "PenTool",
    ton: "eiche",
    rang: 30,
    satz: (n) => anzahl(n, "1 Montage fertig – Abnahme mit Kunde offen", "{n} Montagen fertig – Abnahme mit Kunde offen"),
    zaehle: async ({ client }) => (await sicher(() => client.getList("PH Montageauftrag", { fields: ["name"], filters: [["status", "=", "Erledigt"]], limit: 500 }), [])).length,
    knopf: { titel: "Ansehen", href: "/projekte/montagen?ansicht=liste&status=Erledigt" },
  },
  {
    id: "projekte.maengel",
    bereich: "projekte",
    icon: "TriangleAlert",
    ton: "ziegel",
    rang: 40,
    satz: (n) => anzahl(n, "1 Mangel über der Frist", "{n} Mängel über der Frist"),
    unter: "Montage-Mängel nach Frist",
    zaehle: async ({ client }) => {
      const namen = await sicher(() => client.getList("PH Montageauftrag", { fields: ["name"], filters: [["status", "!=", "Abgebrochen"]], limit: 300 }), []);
      const docs = await Promise.all(namen.map((x) => sicher(() => client.getDoc("PH Montageauftrag", x.name), null)));
      const heute = heuteIso();
      return docs.filter(Boolean).reduce((s, d) => s + (d.maengel || []).filter((z) => !istErledigt(z.status) && tageUeberfaellig(z.frist, heute) > 0).length, 0);
    },
    knopf: { titel: "Ansehen", href: "/projekte/maengel?ueberfaellig=1" },
  },
  {
    id: "projekte.aufgaben",
    bereich: "projekte",
    icon: "CheckSquare",
    ton: "see",
    rang: 50,
    sichten: ["mir"],
    satz: (n) => anzahl(n, "1 eigene Aufgabe ist fällig", "{n} eigene Aufgaben sind fällig"),
    zaehle: async ({ session, client }) => (await sicher(() => client.getList("PH Projekt Aufgabe", { fields: ["name"], filters: [["zugewiesen_an", "=", session?.user || "-"], ["status", "in", ["Offen", "In Arbeit"]], ["faellig", "<=", heuteIso()]], limit: 500 }), [])).length,
    knopf: { titel: "Öffnen", href: "/projekte/aufgaben?sicht=mir" },
  },
  {
    id: "projekte.nachtrag-ab",
    bereich: "projekte",
    icon: "Layers",
    ton: "messing",
    rang: 60,
    recht: { bereich: "projekte", aktion: "cancel" },
    satz: (n) => anzahl(n, "1 Nachtrag freigegeben – AB noch nicht angepasst", "{n} Nachträge freigegeben – AB noch nicht angepasst"),
    zaehle: async ({ client }) => (await sicher(() => client.getList("PH Nachtrag", { fields: ["name"], filters: [["status", "=", "Freigegeben"], ["uebernommen", "=", 0]], limit: 500 }), [])).length,
    knopf: { titel: "Ansehen", href: "/projekte/nachtraege?status=Freigegeben" },
  },
  {
    id: "projekte.referenzen",
    bereich: "projekte",
    icon: "Star",
    ton: "travertin",
    rang: 70,
    recht: { bereich: "projekte", aktion: "cancel" },
    satz: (n) => anzahl(n, "1 Referenz wartet auf Prüfung", "{n} Referenzen warten auf Prüfung"),
    zaehle: async ({ client }) => (await sicher(() => client.getList("PH Referenz", { fields: ["name"], filters: [["status", "=", "Eingereicht"]], limit: 200 }), [])).length,
    knopf: { titel: "Prüfen", href: "/projekte/referenzen?status=Eingereicht" },
  },
];

export default quellen;
