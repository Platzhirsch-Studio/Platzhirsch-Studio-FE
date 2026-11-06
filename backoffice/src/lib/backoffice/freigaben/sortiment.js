// Freigabe-Arten des Bereichs Sortiment für Glocke „Für mich“ und Zentrale (G-15). Schreibt: Team B-SOR.
// Eintrag in freigaben/index.js (P0-7/L0): `import sortiment from "./sortiment.js";` → FREIGABE_BEREICHE.sortiment.
// Preise, die das Team erfasst hat (freigegeben = 0), gibt die Leitung frei; danach zeigt die Website sie.
// Reines Modul (relative Importe). Antragsteller = letzter Bearbeiter des Produkts (die Kindzeile kennt keinen Ersteller).

import { freigabeSetzen } from "../sortiment/methoden.js";

const eintraege = [
  {
    art: "sortiment.preis",
    bereich: "sortiment",
    titel: "Preis mit Stand",
    geldwirksam: false,
    folge: "Website und Shop zeigen den Preis nach dem Rückgängig-Fenster.",
    recht: { bereich: "sortiment", aktion: "delete" },
    laden: async (session, client) => {
      const produkte = await client.getList("PH Produkt", { fields: ["name"], filters: [["status", "!=", "Ausgelaufen"]], orderBy: "modified desc", limit: 60 });
      const docs = await Promise.all(produkte.map((p) => client.getDoc("PH Produkt", p.name).catch(() => null)));
      const out = [];
      for (const p of docs.filter(Boolean)) {
        for (const z of p.preise || []) {
          if (z.freigegeben) continue;
          out.push({
            name: `${p.name}::${z.name}`,
            titel: `${p.titel}: ${(Number(z.brutto_cent) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`,
            objekt: { titel: p.titel, href: `/sortiment/produkte/${encodeURIComponent(p.name)}?tab=preise` },
            antragsteller: { user: p.modified_by || p.owner, name: p.modified_by || p.owner },
            betragCent: z.brutto_cent,
            grund: `Stand ${String(z.stand || "").split("-").reverse().join(".")} · ${z.quelle || "Quelle offen"}`,
            zeit: p.modified,
            token: p.modified,
          });
        }
      }
      return out;
    },
    freigeben: async (session, client, { name }) => {
      const [produkt, zeile] = String(name).split("::");
      await freigabeSetzen(client, { art: "preis", ziele: [{ produkt, zeile }], entscheidung: "freigeben" });
    },
    ablehnen: async (session, client, { name, grund }) => {
      const [produkt, zeile] = String(name).split("::");
      await freigabeSetzen(client, { art: "preis", ziele: [{ produkt, zeile }], entscheidung: "ablehnen", grund });
    },
  },
];

export default eintraege;
