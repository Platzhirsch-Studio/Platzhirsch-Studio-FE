// Akte-Slots des Bereichs Sortiment (Slot-API v1, G-14). Schreibt: Team B-SOR.
// Eintrag in akte/slots/index.js (L0): `import sortiment from "./sortiment.js";` und `...sortiment` in SLOTS.
// Herstellerbestellungen erscheinen nur, wenn sie ausdrücklich auf die Akte verweisen (bezug_name, Q-A11).

import SlotBestellungen from "../../../../components/Backoffice/Sortiment/SlotBestellungen.js";
import { darf } from "../../auth/rechte.js";

const FELDER = ["name", "lieferant", "status", "bestaetigter_termin", "kommission"];

const eintraege = [
  {
    id: "sortiment.bestellungen-projekt",
    bereich: "sortiment",
    akte: "projekt",
    tab: "belege-lieferung",
    reihenfolge: 40,
    titel: "Herstellerbestellungen",
    recht: (session) => darf(session, "sortiment") || darf(session, "projekte"),
    lade: async (session, id, { client }) => client.getList("PH Herstellerbestellung", { fields: FELDER, filters: [["bezug_name", "=", id]], orderBy: "datum desc", limit: 20 }),
    Komponente: SlotBestellungen,
    breite: "halb",
    leer: (d) => !d?.length,
    leerText: "Keine Herstellerbestellung zu diesem Projekt.",
    zeitlimitMs: 4000,
  },
  {
    id: "sortiment.bestellungen-auftrag",
    bereich: "sortiment",
    akte: "kunde",
    tab: "projekte-belege",
    reihenfolge: 60,
    titel: "Herstellerbestellungen",
    recht: (session) => darf(session, "sortiment"),
    lade: async (session, id, { client }) => {
      // Kundenakte: Bestellungen über die Auftragsbestätigungen des Kontakts (Bezug Auftrag).
      const auftraege = await client.getList("PH Auftragsbestaetigung", { fields: ["name"], filters: [["kontakt", "=", id]], limit: 50 }).catch(() => []);
      if (!auftraege.length) return [];
      return client.getList("PH Herstellerbestellung", { fields: FELDER, filters: [["bezug_doctype", "=", "PH Auftragsbestaetigung"], ["bezug_name", "in", auftraege.map((a) => a.name)]], orderBy: "datum desc", limit: 20 });
    },
    Komponente: SlotBestellungen,
    breite: "halb",
    leer: (d) => !d?.length,
    leerText: "Keine Herstellerbestellung zu Aufträgen dieses Kunden.",
    zeitlimitMs: 4000,
  },
];

export default eintraege;
