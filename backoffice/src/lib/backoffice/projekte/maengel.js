// Mängel aus drei Quellen zusammenführen (10-konzept-projekte.md § 5.11, § 3.6): PH Montage Mangel (Kind von
// PH Montageauftrag und PH Fremdgewerk) und PH Abnahme Position (zustand ≠ ok, nicht erledigt). Reines Modul.

/** „erledigt“ nach utils/maengel.ist_erledigt – Groß/klein egal („behoben“, „Behoben“, „Erledigt“). */
export function istErledigt(status) {
  const s = String(status || "").trim().toLowerCase();
  return s === "behoben" || s === "erledigt";
}

/** Tage über der Frist (0, wenn keine Frist oder nicht überfällig). */
export function tageUeberfaellig(frist, heute) {
  if (!frist) return 0;
  const f = new Date(`${String(frist).slice(0, 10)}T00:00:00`);
  const h = new Date(`${String(heute).slice(0, 10)}T00:00:00`);
  const d = Math.round((h - f) / 86400000);
  return d > 0 ? d : 0;
}

/**
 * @param {{montagen?:object[], abnahmen?:object[], gewerke?:object[], projekte?:Record<string,object>}} q  Docs mit Kindtabellen
 * @param {{heute:string, nurOffen?:boolean}} opts
 * @returns {Array<{id:string, quelle:"montage"|"abnahme"|"fremdgewerk", doctype:string, doc:string, zeile:string, projekt:string,
 *   beschreibung:string, foto?:string, frist?:string, verantwortlich?:string, verantwortlich_ref?:string, servicefall?:string,
 *   erledigt:boolean, ueberfaellig:number}>}
 */
export function maengelListe({ montagen = [], abnahmen = [], gewerke = [] } = {}, { heute, nurOffen = true } = {}) {
  const out = [];
  const add = (quelle, doctype, d, z, erledigt, text) => {
    if (nurOffen && erledigt) return;
    out.push({
      id: `${doctype}:${d.name}:${z.name}`,
      quelle,
      doctype,
      doc: d.name,
      zeile: z.name,
      projekt: d.projekt,
      beschreibung: text || z.beschreibung || z.bezeichnung || "",
      foto: z.foto || "",
      frist: z.frist || "",
      verantwortlich: z.verantwortlich || "",
      verantwortlich_ref: z.verantwortlich_ref || "",
      servicefall: z.servicefall_ref || "",
      erledigt,
      ueberfaellig: erledigt ? 0 : tageUeberfaellig(z.frist, heute),
    });
  };
  for (const m of montagen) for (const z of m.maengel || []) add("montage", "PH Montageauftrag", m, z, istErledigt(z.status));
  for (const a of abnahmen) for (const z of a.positionen || []) if (z.zustand && z.zustand !== "ok") add("abnahme", "PH Abnahme", a, z, !!Number(z.erledigt), z.beschreibung ? `${z.bezeichnung}: ${z.beschreibung}` : z.bezeichnung);
  for (const g of gewerke) for (const z of g.maengel || []) add("fremdgewerk", "PH Fremdgewerk", g, z, istErledigt(z.status));
  return out.sort((a, b) => b.ueberfaellig - a.ueberfaellig || String(a.frist || "9").localeCompare(String(b.frist || "9")));
}

/** Offene Mängel einer Abnahme (wie maengel_offen im Controller). */
export function offeneAbnahmeMaengel(abnahme) {
  return (abnahme?.positionen || []).filter((z) => z.zustand && z.zustand !== "ok" && !Number(z.erledigt)).length;
}
