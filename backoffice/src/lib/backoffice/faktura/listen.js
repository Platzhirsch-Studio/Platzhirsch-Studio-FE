// Listenmodell für die Faktura-Listen (rein): Reiter mit Zählern, Filter aus der URL, Sortierung, Blättern.
// Filter, Sortierung, Seite und Ansicht stehen in der URL (§ 2.1, Q-B7).

import { filtere, blaettern, sortiere } from "./zeilen.js";

export const GROESSE = 25;

/**
 * @param {{ daten:object[], reiter:Array<{id:string,titel:string,leitung?:boolean,hinweis?:string}>, regeln:Record<string,Function>,
 *   params:Record<string,string>, standard:string, zeile:(x:object)=>object, suchFelder:(x:object)=>any[], datumFeld?:string,
 *   sortFeld?:string|((r:string)=>string), richtung?:"asc"|"desc"|((r:string)=>string), extra?:object, rolle?:object, zaehlerFuer?:string[] }} o
 */
export function listenModell(o) {
  const { daten, reiter, regeln, params, standard, zeile, suchFelder, datumFeld = "datum", extra = {}, rolle = {}, zaehlerFuer = [] } = o;
  const sichtbareReiter = reiter.filter((r) => !r.leitung || rolle.leitung);
  const aktiv = sichtbareReiter.some((r) => r.id === params.r) ? params.r : standard;
  const regel = regeln[aktiv] || (() => true);
  const imReiter = daten.filter((x) => regel(x, extra.heute, extra.user));
  const gefiltert = filtere(imReiter, params, { suchFelder, datumFeld });
  const sf = typeof o.sortFeld === "function" ? o.sortFeld(aktiv) : o.sortFeld || "modified";
  const ri = typeof o.richtung === "function" ? o.richtung(aktiv) : o.richtung || "desc";
  const sortiert = sortiere(gefiltert, params.sort || sf, params.dir || ri);
  const seite = blaettern(sortiert, params.seite, GROESSE);
  return {
    aktiv,
    reiter: sichtbareReiter.map((r) => ({ ...r, anzahl: zaehlerFuer.includes(r.id) ? daten.filter((x) => (regeln[r.id] || (() => true))(x, extra.heute, extra.user)).length : undefined })),
    alleGefiltert: sortiert,
    zeilen: seite.zeilen.map(zeile),
    gesamt: seite.gesamt,
    seite: seite.seite,
    seiten: seite.seiten,
  };
}

/** URL-Parameter aus Next-searchParams (nur Strings, bekannte Schlüssel). */
export function paramsAus(sp = {}) {
  const erlaubt = ["r", "q", "status", "art", "von", "bis", "seite", "sort", "dir", "ansicht", "alter", "gruppe", "tab", "cockpit", "monat", "aktion", "panel", "konto", "richtung"];
  return Object.fromEntries(Object.entries(sp).filter(([k, v]) => erlaubt.includes(k) && v !== undefined).map(([k, v]) => [k, String(Array.isArray(v) ? v[0] : v).slice(0, 120)]));
}
