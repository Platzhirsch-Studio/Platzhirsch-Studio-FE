// Druck – Bereich Marketing (10-konzept-marketing § 6). Schreibt: Team B-MAR. Die Formate selbst stehen in
// druck/index.js (DRUCKFORMATE, gegen Backend-Import abgeglichen); hier nur, wo der Bereich welches Format anbietet.
// Kein Druck aus dem Check-in-Kiosk außer der Teilnehmerliste.

import { druckHref } from "./index.js";

export const MARKETING_DRUCK = Object.freeze({
  "PH Event": [
    { format: "PH Event Teilnehmerliste", titel: "Teilnehmerliste", wo: "Event-Akte · Kopf, Taste p, Absagen-Dialog" },
    { format: "PH Event Namensschilder", titel: "Namensschilder (85 × 54 mm)", wo: "Event-Akte · Menü" },
    { format: "PH Event Ticket", titel: "Ticket mit Code", wo: "Event-Akte · Zeilenmenü" },
  ],
  "PH Einwilligung": [{ format: "PH Einwilligung Nachweis", titel: "Einwilligungsnachweis", wo: "Personen-Akte, Einwilligungsliste (Sammel ≤ 50)" }],
  "PH Kampagne": [{ format: "PH Kampagnenbericht", titel: "Kampagnenbericht", wo: "Kampagnen-Akte · Auswertung, Massenaktion" }],
});

/** Druck-Link eines Marketing-Dokuments (Standardformat = erstes). */
export function marketingDruckHref(doctype, name, format) {
  const f = format || MARKETING_DRUCK[doctype]?.[0]?.format;
  return druckHref(doctype, name, f);
}

export default MARKETING_DRUCK;
