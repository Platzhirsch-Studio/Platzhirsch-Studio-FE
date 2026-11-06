// Akte-Slots des Bereichs CRM (Slot-API v1, akte/slots.js). Importzeile in akte/slots/index.js trägt L0 ein.
// Auftragsmappe (akte „projekt“, Reiter Übersicht): „Kunde & Gespräch“ – Kontaktwege, Berater und letztes
// Gesprächsprotokoll des Projektkunden. Die Kundenakte selbst baut der CRM-Bereich (/kunden/[kontakt]).
// Komponente ohne Hooks (server-tauglich), Texte aus crm/texte.js.

import { createElement as h } from "react";
import { darf } from "../../auth/rechte.js";
import { CRM_TEXTE as T } from "../../crm/texte.js";

function KundeGespraech({ daten }) {
  if (!daten?.kontakt) return h("p", { className: "text-[14px] text-bo-text-soft" }, "Kein Kunde verknüpft.");
  const k = daten.kontakt;
  const g = daten.gespraech;
  return h("div", { className: "grid gap-3" },
    h("a", { href: `/kunden/${encodeURIComponent(k.name)}`, className: "rounded-[16px] bg-bo-surface-2 px-4 py-3 hover:bg-bo-fill-2" },
      h("span", { className: "block text-[15px] font-semibold" }, k.titel || k.name),
      h("span", { className: "block text-[13px] text-bo-text-soft" }, [k.email, k.telefon].filter(Boolean).join(" · ") || "–")),
    g ? h("a", { href: `/crm/gespraeche/${encodeURIComponent(g.name)}`, className: "px-1 text-[14px] hover:underline" },
      `${T.akte.gespraechsstand}: ${(g.raeume || []).map((r) => T.raum[r.raum] || r.raum).join(", ") || g.name}`) : h("p", { className: "px-1 text-[14px] text-bo-text-soft" }, T.akte.keinGespraech));
}

const slots = [
  {
    id: "crm.kunde-gespraech",
    bereich: "crm",
    akte: "projekt",
    tab: "uebersicht",
    reihenfolge: 15,
    titel: "Kunde & Gespräch",
    recht: (session) => darf(session, "crm"),
    lade: async (session, id, { client }) => {
      const p = await client.getDoc("PH Projekt", id);
      if (!p?.kontakt) return { kontakt: null };
      const [kontakt, gespraeche] = await Promise.all([
        client.getDoc("PH Kontakt", p.kontakt),
        client.getList("PH Beratungsgespraech", { fields: ["name", "datum", "status"], filters: [["kontakt", "=", p.kontakt]], orderBy: "datum desc", limit: 1 }),
      ]);
      const gespraech = gespraeche[0] ? await client.getDoc("PH Beratungsgespraech", gespraeche[0].name) : null;
      return { kontakt: { name: kontakt.name, titel: kontakt.titel, email: kontakt.email, telefon: kontakt.telefon }, gespraech: gespraech ? { name: gespraech.name, raeume: gespraech.raeume || [] } : null };
    },
    Komponente: KundeGespraech,
    breite: "halb",
    leer: (d) => !d?.kontakt,
    leerText: "Kein Kunde verknüpft.",
    zeitlimitMs: 4000,
  },
];

export default slots;
