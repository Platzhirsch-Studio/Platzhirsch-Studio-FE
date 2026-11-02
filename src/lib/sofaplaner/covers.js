// Sofaplaner – Minotti cover materials per model (QM Sofaplaner R2 P2-C).
//
// Three sources, all with URL, none with colours or images:
//  1. names the family research file quotes (normalize.js → coverCollections)
//  2. names/materials the public minotti.com product page of the family states
//     (minotti-covers.json → familien, built by tools/build-covers.mjs)
//  3. brand-wide statements from Minotti news pages (minotti-covers.json →
//     markenweit), shown separately and marked "markenweit laut Hersteller,
//     Verfügbarkeit je Modell im Showroom bestätigen".
// Minotti's complete material library is dealer-only (login), so nothing
// beyond these public statements is listed.

export const BRAND_NOTE = "Markenweit laut Hersteller – Verfügbarkeit je Modell im Showroom bestätigen.";

const keyOf = (name) => {
  const n = String(name).toLowerCase();
  if (/nature|natur/.test(n) && /leder|pelle|kategorie/.test(n)) return "kat-nature";
  if (/extra/.test(n) && /leder|pelle|kategorie/.test(n)) return "kat-extra";
  if (/^nabuk/.test(n)) return "nabuk";
  if (/saddle|sattel/.test(n)) return "sattelleder";
  if (/pony/.test(n)) return "pony";
  return n.replace(/[^a-z0-9]+/g, "");
};

// named collections first, then leather categories, then generic families
const RANK = (c) => (c.name === "Stoff" || c.name === "Leder" ? 2 : /^Leder Kategorie/.test(c.name) ? 1 : 0);

/**
 * Merge the research-file collections with the product-page data.
 * @param {{slug:string, outdoor?:boolean, options:{cover:{collections?:Array}}}} fam
 * @param {{markenweit?:Array, familien?:Record<string,{source:string|null, items:Array}>}} data
 * @returns {{collections:Array, brand:Array, pageSource:string|null}}
 */
export function mergeCovers(fam, data) {
  const own = fam?.options?.cover?.collections || [];
  const page = data?.familien?.[fam?.slug] || { source: null, items: [] };
  const seen = new Set();
  const collections = [];
  const push = (c) => {
    const k = keyOf(c.name);
    if (seen.has(k)) return;
    seen.add(k);
    collections.push(c);
  };
  for (const c of own) push({ name: c.name, material: c.material, category: c.category, source: c.source || page.source || null });
  for (const c of page.items || []) if (page.source) push({ name: c.name, material: c.material, category: c.category, source: page.source });
  collections.sort((a, b) => RANK(a) - RANK(b));
  const scope = fam?.outdoor ? "outdoor" : "indoor";
  const brand = (data?.markenweit || [])
    .filter((b) => b.scope === scope || b.scope === "all")
    .filter((b) => !seen.has(keyOf(b.name)))
    .map((b) => ({ name: b.name, material: b.material, category: b.category, source: b.source }));
  return { collections, brand, pageSource: page.source || null };
}

/** True when the family has at least one cover entry with a source URL (model or brand-wide). */
export const hasCoverSource = (cover) => [...(cover?.collections || []), ...(cover?.brand || [])].some((c) => /^https:\/\//.test(c.source || ""));

/**
 * QM r5: Zusatzangaben einer Bezugskollektion ohne Wiederholung – „Stoff · Stoff ·
 * Stoffkollektion von Minotti“ wird zu „Stoffkollektion von Minotti“ (Name steht davor).
 */
export function coverMeta(c) {
  const seen = new Set([String(c?.name || "").trim().toLowerCase()]);
  const out = [];
  for (const v of [c?.material, c?.category]) {
    const t = String(v || "").trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}
