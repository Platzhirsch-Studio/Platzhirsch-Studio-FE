// Reine Regeln des Akte-Gerüsts (G-14, Team P0-5a): höchstens 6 Reiter, höchstens 1 Band,
// höchstens 4 Glas-Kacheln im Hero, Reiter-Adresse in der URL (?tab=, Q-B7). Ohne React, unit-getestet.

export const MAX_TABS = 6;
export const MAX_KACHELN = 4;
export const BAND_TOENE = Object.freeze(["gefahr", "warnung", "info", "neutral"]);

/**
 * Höchstens ein Band (Q-B6): das mit dem kleinsten `rang` (Rangfolge je Bereich, 1 = wichtigste).
 * Kandidaten ohne `aktiv !== false` und ohne Text fallen heraus. Gleichstand: Reihenfolge der Liste.
 * @param {Array<{rang:number, ton?:string, titel?:string, text?:string, aktiv?:boolean}>} kandidaten
 */
export function waehleBand(kandidaten = []) {
  let best = null;
  for (const k of Array.isArray(kandidaten) ? kandidaten : []) {
    if (!k || k.aktiv === false || !(k.titel || k.text)) continue;
    const r = Number.isFinite(k.rang) ? k.rang : 99;
    if (!best || r < best.r) best = { r, k };
  }
  return best ? { ...best.k, ton: BAND_TOENE.includes(best.k.ton) ? best.k.ton : "info" } : null;
}

/** Reiter auf 6 begrenzen (überzählige werden gemeldet, nie still verworfen: `rest`). */
export function begrenzeTabs(tabs = []) {
  const liste = (Array.isArray(tabs) ? tabs : []).filter((t) => t && t.id && t.titel);
  return { tabs: liste.slice(0, MAX_TABS), rest: liste.slice(MAX_TABS) };
}

/** Glas-Kacheln auf 4 begrenzen (2 × 2 wie im Entwurf). */
export function begrenzeKacheln(kacheln = []) {
  const liste = (Array.isArray(kacheln) ? kacheln : []).filter(Boolean);
  return { kacheln: liste.slice(0, MAX_KACHELN), rest: liste.slice(MAX_KACHELN) };
}

/**
 * Adresse eines Reiters: übrige Parameter bleiben (Filter, Panel), `tab` wird ersetzt; der erste
 * Reiter steht ohne Parameter (kanonische Adresse der Akte).
 * @param {string} basis     Pfad der Akte („/projekte/PRJ-2026-021“)
 * @param {string} tabId
 * @param {Record<string,string|string[]|undefined>|URLSearchParams} [params]
 * @param {string} [ersterTab]
 * @param {string} [param]   Name des Suchparameters (Standard „tab“; eingebettet z. B. „reiter“)
 */
export function tabHref(basis, tabId, params = {}, ersterTab, param = "tab") {
  const sp = new URLSearchParams();
  const eintraege = params instanceof URLSearchParams ? [...params.entries()] : Object.entries(params || {});
  for (const [k, v] of eintraege) {
    if (k === param || v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)));
    else sp.append(k, String(v));
  }
  if (tabId && tabId !== ersterTab) sp.set(param, tabId);
  const q = sp.toString();
  return q ? `${basis}?${q}` : basis;
}

/** Gültiger Reiter aus der URL, sonst der erste. */
export function aktiverTab(tabs = [], wert) {
  const ids = tabs.map((t) => t.id);
  return ids.includes(wert) ? wert : ids[0] || null;
}

/** Anteil 0…1 sicher begrenzen (Balken in Glas-Kacheln, Beträge). */
export function anteil(wert) {
  const n = Number(wert);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
