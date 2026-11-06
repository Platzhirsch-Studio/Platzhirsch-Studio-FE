// Druck – Bereich Sortiment (§ 12). Schreibt: Team B-SOR. Die Formate selbst stehen in druck/index.js
// (DRUCKFORMATE, gegen Backend-Import abgeglichen); hier nur, wo der Bereich welches Format anbietet.
// Regeln: Bestellung ohne VK, Datenblatt nur mit freigegebenen Bildern und gültigem Preis, Wareneingang A4.

import { druckHref } from "./index.js";

export const SORTIMENT_DRUCK = Object.freeze({
  "PH Herstellerbestellung": [
    { format: "PH Herstellerbestellung Standard", titel: "Bestellung", wo: "Bestellakte · Menü" },
    { format: "PH AB Abgleich Protokoll", titel: "AB-Abgleich-Protokoll", wo: "Bestellakte · Reiter AB-Abgleich" },
  ],
  "PH Wareneingang": [{ format: "PH Wareneingang Protokoll", titel: "Wareneingangsprotokoll", wo: "Wareneingangsakte" }],
  "PH Produkt": [{ format: "PH Produkt Datenblatt", titel: "Datenblatt", wo: "Produktakte · Menü, Massenaktion" }],
});

/** Druck-Link eines Sortiment-Dokuments (Standardformat = erstes). */
export function sortimentDruckHref(doctype, name, format) {
  const f = format || SORTIMENT_DRUCK[doctype]?.[0]?.format;
  return druckHref(doctype, name, f);
}

export default SORTIMENT_DRUCK;
