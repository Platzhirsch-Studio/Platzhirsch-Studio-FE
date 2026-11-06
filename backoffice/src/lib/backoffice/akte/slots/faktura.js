// Akte-Slots des Bereichs Faktura (Slot-API v1, akte/slots.js). Schreibt: Team B-FAK. Importzeile in
// akte/slots/index.js trägt L0 ein. Kundenakte („Projekte & Belege“) und Auftragsmappe („Belege & Lieferung“):
// Angebote, Aufträge, Rechnungen mit Status, offenem Betrag und Link in die Faktura-Akte.
// Komponente ohne Hooks (server-tauglich, createElement – node --test lädt die Datei), Texte aus faktura/texte.js.

import { createElement as h } from "react";
import { darf } from "../../auth/rechte.js";
import { cent } from "../../format.js";
import { statusAnzeige } from "../../faktura/status.js";

const ZIEL = { "PH Angebot": "angebote", "PH Auftragsbestaetigung": "auftraege", "PH Rechnung": "rechnungen" };

function Belege({ daten }) {
  const zeilen = daten?.zeilen || [];
  return h(
    "ul",
    { className: "flex flex-col gap-1" },
    zeilen.map((z) =>
      h(
        "li",
        { key: `${z.doctype}:${z.name}` },
        h(
          "a",
          { href: `/faktura/${ZIEL[z.doctype]}/${encodeURIComponent(z.name)}`, className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] px-3 py-2.5 hover:bg-bo-fill" },
          h("span", { className: "min-w-0" }, h("span", { className: "block truncate text-[15px] font-semibold" }, `${z.art} ${z.nummer}`), h("span", { className: "block truncate text-[13px] text-bo-text-soft" }, `${statusAnzeige(z.doctype, z.status, { mahnstufe: z.mahnstufe }).text}${z.offen_cent ? ` · offen ${cent(z.offen_cent)}` : ""}`)),
          h("span", { className: "text-[15px] tabular-nums" }, cent(z.brutto_cent))
        )
      )
    )
  );
}

async function lade(feld, id, client) {
  const f = [[feld, "=", id]];
  const [an, ab, re] = await Promise.all([
    client.getList("PH Angebot", { fields: ["name", "status", "brutto_cent"], filters: f, limit: 10 }).catch(() => []),
    client.getList("PH Auftragsbestaetigung", { fields: ["name", "status", "auftragswert_cent", "offen_cent"], filters: f, limit: 10 }).catch(() => []),
    client.getList("PH Rechnung", { fields: ["name", "status", "art", "brutto_cent", "offen_cent", "docstatus", "mahnstufe"], filters: f, limit: 20 }).catch(() => []),
  ]);
  return {
    zeilen: [
      ...an.map((x) => ({ doctype: "PH Angebot", name: x.name, nummer: x.status === "Entwurf" ? "Entwurf" : x.name, art: "Angebot", status: x.status, brutto_cent: x.brutto_cent })),
      ...ab.map((x) => ({ doctype: "PH Auftragsbestaetigung", name: x.name, nummer: x.name, art: "Auftrag", status: x.status, brutto_cent: x.auftragswert_cent, offen_cent: x.offen_cent })),
      ...re.map((x) => ({ doctype: "PH Rechnung", name: x.name, nummer: Number(x.docstatus) === 0 ? "Entwurf" : x.name, art: x.art || "Rechnung", status: x.status, brutto_cent: x.brutto_cent, offen_cent: x.offen_cent, mahnstufe: x.mahnstufe })),
    ],
  };
}

const SLOTS = [
  {
    id: "faktura.belege-kunde",
    bereich: "faktura",
    akte: "kunde",
    tab: "projekte-belege",
    reihenfolge: 20,
    titel: "Belege",
    recht: (session) => darf(session, "faktura"),
    lade: async (session, id, { client }) => lade("kontakt", id, client),
    Komponente: Belege,
    breite: "voll",
    leer: (d) => !d?.zeilen?.length,
    leerText: "Noch keine Angebote oder Rechnungen.",
  },
  {
    id: "faktura.belege-projekt",
    bereich: "faktura",
    akte: "projekt",
    tab: "belege-lieferung",
    reihenfolge: 10,
    titel: "Angebote, Aufträge und Rechnungen",
    recht: (session) => darf(session, "faktura"),
    lade: async (session, id, { client }) => lade("projekt", id, client),
    Komponente: Belege,
    breite: "voll",
    leer: (d) => !d?.zeilen?.length,
    leerText: "Noch keine Belege zu diesem Projekt.",
  },
];

export default SLOTS;
