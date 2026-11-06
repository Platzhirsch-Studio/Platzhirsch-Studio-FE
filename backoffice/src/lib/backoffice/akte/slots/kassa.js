// Akte-Slots – Bereich Kassa (Team B-KAS, SLOT-API v1). Kundenakte › „Projekte & Belege“: die Kassenbelege des
// Kontakts (Konzept §5.4, Abhängigkeit CRM). Komponente ohne JSX (createElement), damit node --test die
// Register-Prüfung laden kann. Importzeile in akte/slots/index.js trägt L0/P0-5a ein:
//   import kassa from "./kassa.js";  export const SLOTS = [...kassa];

import { createElement as h } from "react";
import { darf } from "../../auth/rechte.js";
import { euro } from "../../kassa/betraege.js";

const zeit = (w) => String(w || "").slice(0, 16).replace(/^(\d{4})-(\d{2})-(\d{2})/, "$3.$2.$1");

function KassenbelegeSlot({ daten = [] }) {
  return h(
    "ul",
    { className: "-mx-2 flex flex-col", "data-testid": "slot-kassa-belege" },
    daten.map((b) =>
      h(
        "li",
        { key: b.name },
        h(
          "a",
          { href: `/kassa/verwaltung/belege/${encodeURIComponent(b.name)}`, className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] px-2 py-2.5 hover:bg-bo-fill" },
          h(
            "span",
            { className: "min-w-0" },
            h("span", { className: `block truncate text-[15px] font-medium${b.storniert_durch ? " line-through" : ""}` }, `${b.belegart === "Standard" ? "Kassenbeleg" : b.belegart} ${b.belegnummer}`),
            h("span", { className: "block text-[12px] tabular-nums text-bo-text-soft" }, `${zeit(b.datum_uhrzeit)}${b.trainings ? " · Training" : ""}`)
          ),
          h("span", { className: "text-[15px] font-semibold tabular-nums" }, euro(b.gesamt_cent))
        )
      )
    )
  );
}

const slots = [
  {
    id: "kassa.belege",
    bereich: "kassa",
    akte: "kunde",
    tab: "projekte-belege",
    reihenfolge: 60,
    titel: "Kassenbelege",
    recht: (session) => darf(session, "kassa", "read"),
    lade: async (session, id, ctx) =>
      ctx.client.getList("PH Kassenbeleg", { fields: ["name", "belegnummer", "belegart", "datum_uhrzeit", "gesamt_cent", "trainings", "storniert_durch"], filters: [["kontakt", "=", id], ["docstatus", "=", 1]], orderBy: "datum_uhrzeit desc", limit: 10 }),
    Komponente: KassenbelegeSlot,
    breite: "halb",
    leer: (daten) => !daten?.length,
    leerText: "Noch keine Kassenbelege.",
  },
];

export default slots;
