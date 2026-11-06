// Akte-Slots – Bereich Service (Slot-API v1, G-14). Schreibt: Team B-SER.
// Kundenakte, Reiter „service“: Servicefälle des Kontakts (Status) und Pflegeverträge.
// Einbindung: Import-Zeile in akte/slots/index.js – trägt L0 ein. Die Komponente bekommt nur Daten, nie die Sitzung.
import { darf } from "../../auth/rechte.js";
import { sichereServiceSeed } from "../../service/mock.js";
import ServiceSlot from "../../../../components/Backoffice/Service/ServiceSlot.js";

const slots = [
  {
    id: "service.faelle",
    bereich: "service",
    akte: "kunde",
    tab: "service",
    reihenfolge: 10,
    titel: "Servicefälle",
    recht: (session) => darf(session, "service", "read"),
    lade: async (session, id, { client }) => {
      sichereServiceSeed(client);
      const [faelle, pflege] = await Promise.all([
        client.getList("PH Servicefall", { fields: ["name", "status", "art", "produkt_name", "gemeldet_am", "kulanz_freigabe_status"], filters: [["kontakt", "=", id]], orderBy: "gemeldet_am desc", limit: 20 }),
        client.getList("PH Pflege Abo", { fields: ["name", "status", "art", "bereich", "naechster_termin"], filters: [["kontakt", "=", id]], limit: 10 }),
      ]);
      return { faelle, pflege };
    },
    Komponente: ServiceSlot,
    breite: "voll",
    leer: (d) => !d.faelle.length && !d.pflege.length,
    leerText: "Noch keine Servicefälle und keine Pflegeverträge.",
    zeitlimitMs: 4000,
  },
];

export default slots;
