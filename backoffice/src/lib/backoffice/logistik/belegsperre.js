// Belegsperre Lieferschein (10-konzept-logistik § 3.2, E13; BAO §§ 131/132): ab „Übergeben“ ist der
// Lieferschein ein Beleg – nur Notiz intern und Fotos. Löschen nirgends im UI. Server-Sperre fehlt
// (Anfrage A6) – deshalb prüft jede Action vor `save`. Reines Modul.

const ADRESSE = ["liefer_name", "liefer_firma", "liefer_strasse", "liefer_hausnr", "liefer_zusatz", "liefer_plz", "liefer_ort", "liefer_land"];
const GEPACKT = ["wunschtermin", "lieferhinweis", "liefer_telefon", "kunde_telefon", "notiz_intern"];
const BELEG = ["notiz_intern"];
const NIE = ["name", "status", "docstatus", "doctype", "naming_series", "workflow_state"];
const TECHNISCH = new Set(["modified", "name", "doctype"]);

export const BELEG_TEXT = "Beleg – Änderungen nur über Storno oder Warenrücknahme";

/**
 * Änderbare Felder je Status. `"alle"` = alle Felder außer Status (Entwurf).
 * @param {{status:string, lieferart?:string}} doc
 * @returns {"alle"|Set<string>}
 */
export function aenderbareFelder(doc) {
  switch (doc?.status) {
    case "Entwurf":
      return "alle";
    case "Gepackt": {
      const s = new Set(GEPACKT);
      // Adresse bei Eigenlieferung/Spedition (Tour wird aktualisiert); bei Versand nur über die Sendung.
      if (doc.lieferart === "Eigenlieferung" || doc.lieferart === "Spedition") for (const f of ADRESSE) s.add(f);
      return s;
    }
    default:
      return new Set(BELEG);
  }
}

/**
 * Prüft eine beabsichtigte Änderung gegen die Belegsperre.
 * @param {object} doc  aktueller Stand
 * @param {Record<string, any>} werte  zu speichernde Felder
 * @returns {{ok:true}|{ok:false, code:"forbidden", message:string, felder:string[]}}
 */
export function pruefeAenderung(doc, werte = {}) {
  const erlaubt = aenderbareFelder(doc);
  const verboten = [];
  for (const k of Object.keys(werte)) {
    if (TECHNISCH.has(k)) continue;
    if (NIE.includes(k)) {
      verboten.push(k);
      continue;
    }
    if (k === "positionen" && doc?.status === "Entwurf" && (doc.auftrag || doc.bestellung)) {
      verboten.push(k); // Positionen kommen aus der Quelle – Mengen dort ändern
      continue;
    }
    if (erlaubt !== "alle" && !erlaubt.has(k)) verboten.push(k);
  }
  if (!verboten.length) return { ok: true };
  const text = doc?.status === "Gepackt" ? "Nach dem Packen sind nur Termin, Hinweis, Telefon, Notiz und Adresse (Eigenlieferung/Spedition) änderbar." : BELEG_TEXT;
  return { ok: false, code: "forbidden", message: text, felder: verboten };
}

/** Storno nur in Entwurf (laut Workflow Leitung) und Gepackt (Leitung); ab Übergeben nie (A16). */
export function stornoMoeglich(doc, { leitung = false } = {}) {
  if (!doc) return { moeglich: false, grund: "" };
  if (doc.teilrechnung) return { moeglich: false, grund: `Teilrechnung ${doc.teilrechnung} existiert – zuerst Gutschrift in Faktura` };
  if (doc.status === "Entwurf") return leitung ? { moeglich: true } : { moeglich: false, grund: "Stornieren darf die Leitung" };
  if (doc.status === "Gepackt") return leitung ? { moeglich: true } : { moeglich: false, grund: "Nach dem Packen storniert die Leitung" };
  return { moeglich: false, grund: BELEG_TEXT };
}
