// Akte-Slots des Bereichs Marketing (Slot-API v1, G-14). Schreibt: Team B-MAR.
// Eintrag in akte/slots/index.js (L0): `import marketing from "./marketing.js";` und `...marketing` in SLOTS.
// Kundenakte (10-konzept-marketing § 3.2): Newsletter, Einwilligungen, Events, Empfehlungen der Kontakt-Adresse –
// nur über den expliziten Bezug (E-Mail des Kontakts bzw. kontakt-Feld, Q-A11).

import SlotMarketing from "../../../../components/Backoffice/Marketing/SlotMarketing.js";
import { darf } from "../../auth/rechte.js";

const eintraege = [
  {
    id: "marketing.kundenakte",
    bereich: "marketing",
    akte: "kunde",
    tab: "mehr",
    reihenfolge: 30,
    titel: "Marketing",
    recht: (session) => darf(session, "marketing") || darf(session, "crm"),
    lade: async (session, id, { client }) => {
      const k = await client.getDoc("PH Kontakt", id).catch(() => null);
      const email = String(k?.email || "").toLowerCase();
      const [abo, einwilligungen, empfehlungen] = await Promise.all([
        email ? client.getDoc("PH Newsletter Abo", email).catch(() => null) : null,
        client.getList("PH Einwilligung", { fields: ["name", "zweck", "status"], orFilters: [["kontakt", "=", id], ...(email ? [["email", "=", email]] : [])], limit: 20 }).catch(() => []),
        email ? client.getList("PH Empfehlung", { fields: ["name", "code", "status"], orFilters: [["empfehler_email", "=", email], ["empfohlen_email", "=", email]], limit: 10 }).catch(() => []) : [],
      ]);
      return { email, abo: abo ? { status: abo.status } : null, einwilligungen, events: [], empfehlungen, gesperrt: !!Number(k?.nicht_kontaktieren || 0) };
    },
    Komponente: SlotMarketing,
    breite: "halb",
    leer: (d) => !d || (!d.abo && !d.einwilligungen.length && !d.empfehlungen.length),
    leerText: "Kein Newsletter, keine Einwilligung.",
    zeitlimitMs: 4000,
  },
];

export default eintraege;
