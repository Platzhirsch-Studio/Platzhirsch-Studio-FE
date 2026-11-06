// Druck des Bereichs CRM (10-konzept-crm § 8). Druckformate kommen aus den App-Fixtures (druck/index.js
// DRUCKFORMATE, ph_crm/fixtures/print_format.json); hier steht nur, welches Format die CRM-Seiten als Standard
// anbieten und welche Browser-Druckseiten noch fehlen (§ 17.1 /druck/crm/… – Route liegt bei Zentrale/L0).
// Reines Modul.

/** DocType → Standardformat in den CRM-Akten (DruckKnopf/DruckPanel). */
export const CRM_DRUCK = Object.freeze({
  "PH Anfrage": "PH Anfrage Übersicht",
  "PH Termin": "PH Termin Bestätigung",
  "PH Beratungsgespraech": "PH Beratungsgespraech Protokoll",
  "PH Kontakt": "PH Kontakt DSGVO-Auskunft",
});

/** Browser-Druckseiten laut Konzept, noch ohne Route (Fähigkeit „ausstehend“, nie als Schein-Knopf). */
export const CRM_DRUCKSEITEN_AUSSTEHEND = Object.freeze(["wochenplan", "tagesliste", "portalbrief", "brief"]);

export default CRM_DRUCK;
