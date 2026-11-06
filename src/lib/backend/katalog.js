// src/lib/backend/katalog.js – lesende Gruppen „katalog“ (ph_sortiment) und
// „karriere“ (ph_personal): Methodenbasis je Generation plus Antwort-Mapping.
//
// ph_sortiment.api hat dieselben Methodennamen und dieselbe Antwortform wie
// die heutigen platzhirsch_studio-Methoden (Backend-Import/ph_sortiment/README.md
// „Website-Umstellung“, im Code geprüft): get_produkte_by_kategorie,
// get_produkte_by_marke_api, search_produkte, get_all_kategorien,
// get_kategorien_by_marke, get_collections, get_produkt_by_path_field_api,
// get_produkte_paths, related_products, marken_data, get_all_kategorien_api,
// get_all_sub_kategorien_api, get_all_farben_api, get_all_materialien_api
// (alle allow_guest GET). Deshalb tauscht die Website nur die Basis; für die
// Detailseite ergänzt mapPhProduktDetail() Material/Farbe aus `merkmale`.
// Alle Lesemethoden sind Guest: es wird KEIN Token gesendet (Data Cache wie heute).
//
// Rein (keine "@/"-Importe).
import { resolveBackend } from "./config.js";

const ALT_PREFIX = "platzhirsch_studio.platzhirsch_studio.doctype.";

/** Alte Doctype-Module des Katalogs → alle in ph_sortiment.api. */
export const KATALOG_MODULE = Object.freeze(["produkte_new.api", "marken.api", "produkte_kategorie.api", "sub_kategorie.api", "produkte_farbe.api", "produkte_material.api"]);

/**
 * Basis der Katalogmethoden. Alt exakt wie bisher
 * `${altBase}platzhirsch_studio.platzhirsch_studio.doctype.<modul>`,
 * ph `${BACKEND_PH_URL}/api/method/ph_sortiment.api`.
 * @param {string} modul  z. B. "produkte_new.api"
 * @param {string} altBase  NEW_API_BASE_URL (endet auf /api/method/)
 */
export function katalogApi(modul, altBase, env = process.env) {
  if (!KATALOG_MODULE.includes(modul)) throw new Error(`Unbekanntes Katalogmodul "${modul}"`);
  const r = resolveBackend("katalog", env);
  if (r.generation === "ph" && r.ph) return `${r.ph.url}/api/method/ph_sortiment.api`;
  return `${altBase}${ALT_PREFIX}${modul}`;
}

/** Vollständige Methoden-URL (Modul + Methode). */
export function katalogMethod(modul, method, altBase, env = process.env) {
  return `${katalogApi(modul, altBase, env)}.${method}`;
}

/** Server der Katalogdateien (/files/…, /cmx-Proxy, Bildgrößen). */
export function katalogFileServer(altServer, env = process.env) {
  const r = resolveBackend("katalog", env);
  return r.generation === "ph" && r.ph ? r.ph.url : altServer;
}

export const isKatalogPh = (env = process.env) => resolveBackend("katalog", env).generation === "ph";

/** Stellenliste: karriere.api.karriere_data → ph_personal.api.karriere_data (gleiches message-Format). */
export function karriereUrl(altBase, env = process.env) {
  const r = resolveBackend("karriere", env);
  if (r.generation === "ph" && r.ph) return `${r.ph.url}/api/method/ph_personal.api.karriere_data`;
  return `${altBase}${ALT_PREFIX}karriere.api.karriere_data`;
}

const MATERIAL_GRUPPEN = new Set(["Material", "Oberflaeche", "Stoff", "Leder", "Holz"]);

function merkmalText(merkmale, pred) {
  const seen = new Set();
  for (const m of merkmale || []) {
    if (!m || !pred(m.gruppe)) continue;
    const t = String(m.de || "").trim();
    if (t) seen.add(t);
  }
  return seen.size ? [...seen].join(", ") : null;
}

/**
 * ph-Detail → Detail wie heute. Unterschied zum alten Endpunkt:
 * additional_information[0] hat dort material/farbe (Freitext); ph_sortiment
 * liefert nur dimensions/gewicht und die Merkmale separat. Die Website liest
 * materialRaw/colorRaw aus additional_information[0] (shopProducts.js) –
 * deshalb werden sie hier aus `merkmale` (deutsch) gebildet.
 * Alles andere bleibt unverändert; {} / null → wie geliefert.
 */
export function mapPhProduktDetail(d) {
  if (!d || typeof d !== "object" || Array.isArray(d) || !Object.keys(d).length) return d;
  const material = merkmalText(d.merkmale, (g) => MATERIAL_GRUPPEN.has(g));
  const farbe = merkmalText(d.merkmale, (g) => g === "Farbe");
  if (!material && !farbe) return d;
  const rows = Array.isArray(d.additional_information) ? d.additional_information.slice() : [];
  const first = { ...(rows[0] || {}) };
  if (material && !first.material) first.material = material;
  if (farbe && !first.farbe) first.farbe = farbe;
  rows[0] = first;
  return { ...d, additional_information: rows };
}
