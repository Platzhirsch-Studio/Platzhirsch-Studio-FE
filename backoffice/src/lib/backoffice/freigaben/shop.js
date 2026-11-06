// Freigaben – Bereich Shop (G-15, Q-C7; 10-konzept-shop § 3.4): Erstattung über der Vier-Augen-Grenze, Freigabe
// durch die Geschäftsführung. Schreibt: Team B-SHO. Einbindung: Importzeile in freigaben/index.js (Besitzer P0-7/L0).
// Mock-Pfad über shop/backend.js (Wirkung wie ph_shop: erstattung_freigeben/erstattung_ablehnen).
import { methode } from "../shop/backend.js";

const GF = ["PH Geschäftsführung", "System Manager", "Administrator"];

const eintraege = [
  {
    art: "shop.erstattung",
    bereich: "shop",
    titel: "Erstattung über der Grenze",
    geldwirksam: true,
    folge: "Die Erstattung wird ausgeführt (Stripe bzw. Gegenbuchung).",
    recht: { bereich: "zentrale", aktion: "read" },
    laden: async (session, client) => {
      if (!(session.roles || []).some((r) => GF.includes(r))) return [];
      const zs = await client.getList("PH Zahlung", { fields: ["name", "bezug", "erstattung_angefordert_cent", "erstattung_grund", "erstattung_angefordert_von", "erstattung_angefordert_am", "modified"], filters: [["status", "=", "Erstattung angefordert"]], limit: 20 });
      return zs.map((z) => ({ name: z.name, titel: `Erstattung ${z.bezug || z.name}`, objekt: { titel: z.name, href: `/shop/zahlungen/${encodeURIComponent(z.name)}` }, antragsteller: { user: z.erstattung_angefordert_von, name: String(z.erstattung_angefordert_von || "").split("@")[0] }, betragCent: Number(z.erstattung_angefordert_cent) || 0, grund: z.erstattung_grund || "", zeit: z.erstattung_angefordert_am, token: z.modified }));
    },
    freigeben: async (session, client, { name }) => {
      await methode(client, "PH Zahlung", name, "erstattung_freigeben", {});
    },
    ablehnen: async (session, client, { name, grund }) => {
      await methode(client, "PH Zahlung", name, "erstattung_ablehnen", { grund });
    },
  },
];

export default eintraege;
