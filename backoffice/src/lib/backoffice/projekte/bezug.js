// Fremdbelege mit expliziten Bezugsfiltern (10-konzept-projekte.md E8, § 11.2; MASTER Q-A11). Reines Modul.
// Fehlt ein Filterfeld in der Meta → „nicht verknüpft“ (nie ungefiltert). Jede Zeile mit kontakt ≠ Projektkontakt
// wird verworfen (DSGVO Art. 5 Abs. 1 lit. f) – gezählt, ohne Personendaten.

/** Abschnitt → { doctype, filter(projekt) als Liste [feld, op, wert], felder, kontaktFeld?, nurLeitungFelder? } */
export const FREMDBELEGE = Object.freeze({
  termine: { doctype: "PH Termin", filterFelder: ["ph_projekte_projekt"], filter: (p) => [["ph_projekte_projekt", "=", p]], felder: ["name", "terminart", "start", "ende", "status", "titel"], kontaktFeld: "kontakt", sort: "start asc" },
  angebote: { doctype: "PH Angebot", filterFelder: ["projekt"], filter: (p) => [["projekt", "=", p], ["docstatus", "<", 2]], felder: ["name", "datum", "status", "brutto_cent", "gueltig_bis", "docstatus", "waehrung"], kontaktFeld: "kontakt", sort: "datum desc" },
  auftraege: { doctype: "PH Auftragsbestaetigung", filterFelder: ["projekt"], filter: (p) => [["projekt", "=", p]], felder: ["name", "datum", "status", "auftragswert_cent", "anzahlung_soll_cent", "anzahlung_ist_cent", "offen_cent", "liefertermin_bestaetigt", "docstatus", "waehrung", "fagg_frist_ende"], kontaktFeld: "kontakt", sort: "datum desc" },
  rechnungen: { doctype: "PH Rechnung", filterFelder: ["projekt"], filter: (p) => [["projekt", "=", p], ["docstatus", "<", 2]], felder: ["name", "art", "datum", "status", "brutto_cent", "bezahlt_cent", "offen_cent", "faellig", "docstatus", "waehrung"], kontaktFeld: "kontakt", sort: "datum desc" },
  herstellerbestellungen: { doctype: "PH Herstellerbestellung", filterFelder: ["bezug_doctype", "bezug_name"], filter: (p) => [["bezug_doctype", "=", "PH Projekt"], ["bezug_name", "=", p], ["docstatus", "<", 2]], felder: ["name", "lieferant", "datum", "status", "bestaetigter_termin", "liefertermin_ist"], kontaktFeld: null, sort: "datum desc" },
  lieferscheine: { doctype: "PH Lieferschein", filterFelder: ["projekt"], filter: (p) => [["projekt", "=", p], ["docstatus", "<", 2]], felder: ["name", "datum", "status", "docstatus"], kontaktFeld: "kontakt", sort: "datum desc" },
  servicefaelle: { doctype: "PH Servicefall", filterFelder: ["projekt"], filter: (p) => [["projekt", "=", p]], felder: ["name", "titel", "status", "modified"], kontaktFeld: "kontakt", sort: "modified desc" },
});

/** Felder, die nur Leitung sieht (Beträge). */
export const istBetragsfeld = (f) => /_cent$/.test(f);

/**
 * Prüft, ob die Meta die Filterfelder hat. meta = { fields:[{fieldname}] } | null (App fehlt).
 * @returns {"ok"|"app-fehlt"|"nicht-verknuepft"}
 */
export function bezugStatus(def, meta) {
  if (!meta) return "app-fehlt";
  const da = new Set((meta.fields || []).map((f) => f.fieldname));
  return def.filterFelder.every((f) => da.has(f)) ? "ok" : "nicht-verknuepft";
}

/** Felder, die es in der Meta gibt (+ Standardfelder); Beträge nur mit Leitung. */
export function erlaubteFelder(def, meta, { leitung = false } = {}) {
  const da = new Set([...(meta?.fields || []).map((f) => f.fieldname), "name", "docstatus", "modified", "creation"]);
  const felder = def.felder.filter((f) => da.has(f) && (leitung || !istBetragsfeld(f)));
  if (def.kontaktFeld && da.has(def.kontaktFeld)) felder.push(def.kontaktFeld);
  return [...new Set(felder)];
}

/**
 * Verwirft Zeilen mit fremdem Kontakt (wo das Feld existiert). Liefert { zeilen, verworfen }.
 * Beträge werden für Nicht-Leitung zusätzlich entfernt (auch wenn der Server sie mitliefert).
 */
export function verwirftFremdeKontakte(zeilen = [], { kontakt, kontaktFeld = "kontakt", leitung = false } = {}) {
  let verworfen = 0;
  const out = [];
  for (const z of zeilen) {
    if (kontaktFeld && z[kontaktFeld] && kontakt && z[kontaktFeld] !== kontakt) {
      verworfen++;
      continue;
    }
    const kopie = { ...z };
    if (!leitung) for (const k of Object.keys(kopie)) if (istBetragsfeld(k)) delete kopie[k];
    out.push(kopie);
  }
  return { zeilen: out, verworfen };
}

/** Mehrere Währungen → keine Summe (QA 17). */
export function waehrungen(zeilen = []) {
  return [...new Set(zeilen.map((z) => z.waehrung || "EUR"))];
}
