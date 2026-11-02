// src/lib/shop/suggestions.js
// Vorschläge im leeren Warenkorb. Kuratiert der Inhaber (LEER_VORSCHLAEGE:
// Slugs in Wunschreihenfolge), gelten genau diese; sonst je Marke der erste
// verkaufbare Artikel (Abwechslung statt dreimal dieselbe Marke).
// Preise ausschließlich aus dem Katalog (sellableOf, Stand ≤ 3 Monate);
// Testartikel nie (sie haben keine Produktseite). Leer → keine Vorschläge.
// Rein, ohne "@/"-Importe.
import { sellableList } from "./catalog.js";
import { textOf } from "../katalog/schema.js";

/** Vom Inhaber gepflegt (Slugs). Heute leer → automatische Auswahl. */
export const LEER_VORSCHLAEGE = Object.freeze([]);

/**
 * @param {{ heute: string, mode: string, locale?: string, produkte?: object[], kuratiert?: string[], max?: number }} o
 * → [{ slug, name, markeName, abCent, mehrere, bild, href }]
 */
export function leerVorschlaege({ heute, mode, locale = "de", produkte, kuratiert = LEER_VORSCHLAEGE, max = 3 }) {
  if (mode === "off") return [];
  const list = sellableList({ heute, mode, ...(produkte ? { produkte } : {}), testartikel: [] }).filter((x) => !x.test);
  let pick = kuratiert.map((s) => list.find((x) => x.slug === s)).filter(Boolean);
  if (!pick.length) {
    const marken = new Set();
    for (const x of list) {
      if (marken.has(x.marke)) continue;
      marken.add(x.marke);
      pick.push(x);
    }
  }
  return pick.slice(0, max).map((x) => ({
    slug: x.slug,
    name: textOf(x.name, locale) || String(x.name),
    markeName: x.markeName,
    abCent: Math.min(...x.varianten.map((v) => v.cent)),
    mehrere: new Set(x.varianten.map((v) => v.cent)).size > 1,
    bild: x.bild,
    href: `/accessoires/produkte/${x.slug}`,
  }));
}
