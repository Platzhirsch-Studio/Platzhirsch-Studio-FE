// Druckregeln des Bereichs Faktura (10-konzept-faktura § 8). Schreibt: Team B-FAK.
// Die Formate selbst kommen aus den ph_faktura-Fixtures (print_format.json) und stehen im Fundament-Register
// DRUCKFORMATE (druck/index.js). Hier nur die Faktura-Regeln für Vorschau und Versand.

export const FAKTURA_DRUCK = Object.freeze({
  "PH Rechnung": { standard: "PH Rechnung Standard", anzahlung: "PH Rechnung Anzahlung", fixiertBei: "stellen", wasserzeichenEntwurf: "ENTWURF – keine Rechnung" },
  "PH Gutschrift": { standard: "PH Gutschrift Standard", drucktitel: "Rechnungskorrektur", fixiertBei: "stellen" },
  "PH Angebot": { standard: "PH Angebot Standard", fixiertBei: "senden" },
  "PH Auftragsbestaetigung": { standard: "PH Auftragsbestaetigung Standard", fixiertBei: "senden" },
  "PH Mahnung": { standard: "PH Mahnung Standard", fixiertBei: "senden" },
});

/** Format je Beleg: Anzahlungsrechnung → eigenes Format (Hinweis Anzahlungs-USt). */
export function formatFuer(doctype, doc = {}) {
  const r = FAKTURA_DRUCK[doctype];
  if (!r) return null;
  if (doctype === "PH Rechnung" && doc.art === "Anzahlungsrechnung") return r.anzahlung;
  return r.standard;
}

export default FAKTURA_DRUCK;
