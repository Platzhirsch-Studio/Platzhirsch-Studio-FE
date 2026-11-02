// src/lib/marken/indexGroups.js
// Statische Gruppen der Marken-Übersicht (/ueber-uns/marken, alle vier
// Sprachen), ohne Backoffice (Inhaber-Entscheidungen Nr. 18–21):
//   - „Bad & Wellness“: Agape, Dornbracht, antoniolupi, Starpool, Soleum,
//     Fabio Alemanno, Aquavia Spa, Naggura (Daten: src/lib/wellness/marken.js)
//   - „Küchengeräte“: Gaggenau, Miele, V-ZUG, BORA, Liebherr, Quooker (Daten:
//     src/lib/kueche/geraete.js). Seit Nr. 24 (31.10.2026) Händlermarken mit
//     Bildfreigabe; Bilder liefert das Daten-Team später (Feld image in
//     geraete.js) – bis dahin bleiben die Kacheln typografisch.
// Die Datenquellen werden nur gelesen. Händler-Sätze stehen hier nicht: die
// liefert ausschließlich der Claim-Guard (src/lib/legal/claims.js,
// dealerStatementList) – Agape nie.
//
// Rein und ohne "@/..."-Importe (node --test, tests/unit/marken-erweitert.test.mjs).
import { ALLE_MARKEN, BAD_WELLNESS_PATH, markeAnchor, markeKey } from "../wellness/marken.js";
import { GERAETE_MARKEN, GERAETE_PATH, geraetAnchor, geraetKey } from "../kueche/geraete.js";
import { brandNodeId } from "../seo/brandSchema.js";

/**
 * Eigene Markenseiten unter /bad-wellness/marke/<slug> (baut ein anderes
 * Team). Solange die Route noch 404 liefert, verlinkt die Übersicht auf den
 * Anker der Marke auf /bad-wellness (#marke-<slug>). Umschalten: true.
 */
export const BW_BRAND_PAGES_LIVE = false;

const DE_MARKEN_PATH = "/ueber-uns/marken";

/**
 * Ziel einer Bad-&-Wellness-Marke (Pfad ohne Locale). Agape: bestehende
 * Markenseite im Pfad der Sprache (markenPath, z. B. /about-us/brands).
 */
export function wellnessHref(marke, { markenPath = DE_MARKEN_PATH, live = BW_BRAND_PAGES_LIVE } = {}) {
  if (marke.brandPage) return marke.brandPage.replace(DE_MARKEN_PATH, markenPath || DE_MARKEN_PATH);
  return live ? `${BAD_WELLNESS_PATH}/marke/${marke.id}` : `${BAD_WELLNESS_PATH}#${markeAnchor(marke.id)}`;
}

/**
 * Eigene Seiten unter /kuechengeraete/marke/<slug> (Route entsteht gerade).
 * Bis dahin: Anker der Marke auf /kuechengeraete (#geraet-<slug>). Umschalten: true.
 */
export const GERAETE_BRAND_PAGES_LIVE = false;

/** Ziel einer Küchengeräte-Marke (Pfad ohne Locale). */
export function geraetHref(marke, { live = GERAETE_BRAND_PAGES_LIVE } = {}) {
  return live ? `${GERAETE_PATH}/marke/${marke.id}` : `${GERAETE_PATH}#${geraetAnchor(marke.id)}`;
}

const byName = (locale) => (a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" });

/** Bad & Wellness, A–Z wie die übrige Liste. */
export function wellnessEntries(locale = "de", opts = {}) {
  return ALLE_MARKEN.map((m) => ({
    id: m.id,
    key: markeKey(m.id),
    name: m.name,
    href: wellnessHref(m, opts),
    origin: m.origin || null,
    originIsDesign: Boolean(m.originIsDesign),
    groups: [...(m.groups || [])],
    dealer: Boolean(m.dealer),
    objektOnly: Boolean(m.objektOnly),
    image: m.image || null,
  })).sort(byName(locale));
}

/** Küchengeräte, A–Z. Bild optional (noch keins in geraete.js). Ob ein
 *  Händler-Satz erscheint, entscheidet allein der Claim-Guard (CLAIM_REGISTER). */
export function geraeteEntries(locale = "de", opts = {}) {
  return GERAETE_MARKEN.map((m) => ({
    id: m.id,
    key: geraetKey(m.id),
    name: m.name,
    href: geraetHref(m, { live: opts.geraeteLive }),
    origin: m.origin || null,
    groups: [...(m.groups || [])],
    image: m.image || null,
  })).sort(byName(locale));
}

/**
 * ItemList-Einträge der Übersicht: Backoffice-Marken (A–Z), danach die beiden
 * statischen Gruppen. Jede Marke genau einmal (über die @id – antoniolupi und
 * Agape stehen auch im Backoffice); Brand-@id über brandNodeId(slug), dieselbe
 * @id wie Markenseiten, Startseite und /bad-wellness.
 * @param {Array<{slug:string,name:string,url:string}>} backoffice
 * @param {(path:string)=>string} absolute  Pfad ohne Locale → absolute URL
 * @param {string} [locale]
 * @param {{markenPath?:string, live?:boolean, geraeteLive?:boolean}} [opts]
 */
export function itemListElements(backoffice, absolute, locale = "de", opts = {}) {
  const seen = new Set();
  const rows = [];
  const push = (slug, name, url) => {
    const id = brandNodeId(slug);
    if (seen.has(id)) return;
    seen.add(id);
    rows.push({ name, url, item: { "@type": "Brand", "@id": id, name } });
  };
  for (const b of backoffice || []) push(b.slug, b.name, b.url);
  for (const m of wellnessEntries(locale, opts)) push(m.id, m.name, absolute(m.href));
  for (const m of geraeteEntries(locale, opts)) push(m.id, m.name, absolute(m.href));
  return rows.map((r, i) => ({ "@type": "ListItem", position: i + 1, ...r }));
}
