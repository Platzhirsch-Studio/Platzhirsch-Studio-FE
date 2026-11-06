// Akte-Slots – Bereich Shop (Slot-API v1, G-14). Schreibt: Team B-SHO. Einbindung: eine Zeile in akte/slots/index.js
// (Besitzer P0-5a/L0): `import shop from "./shop.js"; export const SLOTS = [...shop];`.
import { darf } from "../../auth/rechte.js";
import BestellungenSlot from "../../../../components/Backoffice/Shop/BestellungenSlot.js";

const eintraege = [
  {
    id: "shop.bestellungen",
    bereich: "shop",
    akte: "kunde",
    tab: "vorgaenge",
    reihenfolge: 40,
    titel: "Bestellungen (Shop)",
    recht: (session) => darf(session, "shop", "read"),
    lade: async (session, id, { client }) => client.getList("PH Bestellung", { fields: ["name", "status", "angelegt", "lieferart", "gesamt_cent", "erstattet_cent", "betrag_bezahlt_cent"], filters: [["kontakt", "=", id]], orderBy: "angelegt desc", limit: 10 }),
    Komponente: BestellungenSlot,
    breite: "voll",
    leer: (d) => !d?.length,
    leerText: "Noch keine Shop-Bestellungen.",
    zeitlimitMs: 4000,
  },
];

export default eintraege;
