// Akte-Slots des Bereichs Projekte (G-14, SLOT-API v1). Schreibt: Team B-PRJ.
// Die Zeile in akte/slots/index.js (`import projekte from "./projekte.js"`) trägt P0-5/L0 ein.
// Kundenakte · Reiter „Projekte & Belege“: Projekte des Kontakts (nur mit Leserecht Projekte).

import { darf } from "../../auth/rechte.js";
import KundenProjekteSlot from "../../../../components/Backoffice/Projekte/KundenProjekteSlot.js";

const slots = [
  {
    id: "projekte.kunde-projekte",
    bereich: "projekte",
    akte: "kunde",
    tab: "projekte-belege",
    reihenfolge: 10,
    titel: "Projekte",
    recht: (session) => darf(session, "projekte", "read"),
    lade: async (_session, id, { client }) => client.getList("PH Projekt", { fields: ["name", "titel", "status", "projektart", "objekt_ort", "eingang"], filters: [["kontakt", "=", id]], orderBy: "eingang desc", limit: 20 }),
    Komponente: KundenProjekteSlot,
    breite: "voll",
    leer: (d) => !d?.length,
    leerText: "Noch keine Projekte.",
    zeitlimitMs: 4000,
  },
];

export default slots;
