// Freigaben – Bereich Service (G-15, 10-konzept-service §4.9). Schreibt: Team B-SER.
// Kulanz über der Schwelle (kulanz_freigabe_status = Angefordert) gibt die Service-Leitung frei – Vier Augen:
// der Antragsteller (entschieden_von bzw. verantwortlich) kann nicht selbst freigeben. Geldwirksam → Bestätigen-Dialog.
// Einbindung: Import-Zeile in freigaben/index.js (FREIGABE_BEREICHE.service) – trägt P0-7/L0 ein.
// Reines Modul (keine "@/"-Importe).

import { methode } from "../service/dienst.js";
import { sichereServiceSeed } from "../service/mock.js";

/** @type {Array<object>} */
const arten = [
  {
    art: "service.kulanz",
    bereich: "service",
    titel: "Kulanz",
    geldwirksam: true,
    folge: "Die Entscheidung wird wirksam; der Fall kann in Bearbeitung gehen.",
    laden: async (session, client) => {
      sichereServiceSeed(client);
      const liste = await client.getList("PH Servicefall", { fields: ["name", "kunde_name", "produkt_name", "kulanz_cent", "entschieden_von", "verantwortlich", "entscheidung_begruendung", "kulanz_angefordert_am", "modified"], filters: [["kulanz_freigabe_status", "=", "Angefordert"]], limit: 50 });
      return liste.map((f) => ({
        name: f.name,
        titel: `Kulanz ${f.kunde_name || f.name}`,
        objekt: { titel: `${f.name} · ${f.produkt_name || ""}`.trim(), href: `/service/faelle/${encodeURIComponent(f.name)}` },
        antragsteller: { user: f.entschieden_von || f.verantwortlich || "", name: f.entschieden_von || f.verantwortlich || "" },
        betragCent: Number(f.kulanz_cent) || 0,
        grund: f.entscheidung_begruendung || "",
        zeit: f.kulanz_angefordert_am || f.modified,
        token: f.modified,
      }));
    },
    freigeben: async (session, client, { name }) => {
      const f = await client.getDoc("PH Servicefall", name);
      await methode(client, "PH Servicefall", name, "kulanz_freigeben", { betrag_cent: f.kulanz_cent });
    },
    ablehnen: async (session, client, { name, grund }) => {
      await methode(client, "PH Servicefall", name, "kulanz_ablehnen", { grund });
    },
  },
];

export default arten;
