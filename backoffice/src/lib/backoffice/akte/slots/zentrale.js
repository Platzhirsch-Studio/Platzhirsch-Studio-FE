// Akte-Slots der Zentrale (G-14, SLOT-API v1). Schreibt: Team B-ZEN.
// „Aufgaben“ zum Kunden bzw. Projekt: offene PH Aufgabe mit Bezug auf die Akte (referenz_doctype/_name bzw. kontakt).
// Einbindung in akte/slots/index.js trägt P0-5/L0 ein. Komponente: components/Backoffice/Zentrale/AufgabenSlot.js.

import AufgabenSlot from "../../../../components/Backoffice/Zentrale/AufgabenSlot.js";

async function lade(session, id, { client, akte }) {
  const filters = [["status", "in", ["Offen", "In Arbeit"]]];
  if (akte === "kunde") filters.push(["kontakt", "=", id]);
  else filters.push(["referenz_doctype", "=", "PH Projekt"], ["referenz_name", "=", id]);
  const zeilen = await client.getList("PH Aufgabe", { fields: ["name", "titel", "status", "faellig", "zugewiesen_an"], filters, orderBy: "faellig asc", limit: 20 });
  return { zeilen };
}

const slots = [
  { id: "zentrale.aufgaben-kunde", bereich: "zentrale", akte: "kunde", tab: "uebersicht", reihenfolge: 40, titel: "Offene Aufgaben", lade, Komponente: AufgabenSlot, breite: "halb", leer: (d) => !d?.zeilen?.length, leerText: "Keine offenen Aufgaben zu diesem Kunden." },
  { id: "zentrale.aufgaben-projekt", bereich: "zentrale", akte: "projekt", tab: "uebersicht", reihenfolge: 40, titel: "Offene Aufgaben", lade, Komponente: AufgabenSlot, breite: "halb", leer: (d) => !d?.zeilen?.length, leerText: "Keine offenen Aufgaben zu diesem Projekt." },
];

export default slots;
