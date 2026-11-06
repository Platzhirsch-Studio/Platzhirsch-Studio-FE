// Akte-Slots Logistik (Slot-API v1, G-14). Schreibt: Team B-LOG. Eine Zeile in akte/slots/index.js trägt L0 ein.
// Kundenakte Reiter „Projekte & Belege“: Lieferungen des Kunden (W17 „Liefertermin nennen“, Verkauf liest nur).
// Auftragsmappe Reiter „Belege & Lieferung“: Lieferscheine, Touren und Kommissionsware des Projekts.
// Reines Modul; die Komponente ist ohne JSX geschrieben, damit Unit-Tests das Modul laden können.

import LieferungenSlot from "../../../../components/Backoffice/Logistik/LieferungenSlot.js";

const FELDER = ["name", "status", "lieferart", "wunschtermin", "datum", "uebergeben_am", "zugestellt_am", "tour", "kunde_name"];

const slots = [
  {
    id: "logistik.lieferungen",
    bereich: "logistik",
    akte: "kunde",
    tab: "projekte-belege",
    reihenfolge: 40,
    titel: "Lieferungen",
    lade: async (session, id, { client }) => client.getList("PH Lieferschein", { fields: FELDER, filters: [["kontakt", "=", id], ["status", "!=", "Storniert"]], orderBy: "datum desc", limit: 10 }),
    Komponente: LieferungenSlot,
    breite: "halb",
    leer: (d) => !d?.length,
    leerText: "Noch keine Lieferungen.",
    zeitlimitMs: 4000,
  },
  {
    id: "logistik.projekt-lieferungen",
    bereich: "logistik",
    akte: "projekt",
    tab: "belege-lieferung",
    reihenfolge: 20,
    titel: "Lieferungen und Kommission",
    lade: async (session, id, { client }) => {
      const [ls, kom] = await Promise.all([
        client.getList("PH Lieferschein", { fields: FELDER, filters: [["projekt", "=", id], ["status", "!=", "Storniert"]], orderBy: "datum desc", limit: 20 }),
        client.count("PH Lagerbestand", { filters: [["kommission", "=", id], ["menge", ">", 0]] }).catch(() => 0),
      ]);
      return Object.assign(ls, { kommission: kom, projekt: id });
    },
    Komponente: LieferungenSlot,
    breite: "voll",
    leer: (d) => !d?.length && !d?.kommission,
    leerText: "Noch keine Lieferungen zu diesem Projekt.",
    zeitlimitMs: 4000,
  },
];

export default slots;
