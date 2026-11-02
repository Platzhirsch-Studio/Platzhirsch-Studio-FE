// src/lib/seo/legacyProductMap.js – feste Zuordnung alter Produkt-URLs.
// Die Seite vor dem heutigen Stand nutzte /{locale}/produkte/{marke}/{alter-slug}.
// Der Abgleich über den alten Doctype "Produkte" geht nicht mehr: dessen API gibt es
// im Backoffice nicht mehr ("No module named …", geprüft 30.10.2026). Ohne
// Zuordnung landen diese URLs nur auf der Markenseite und verlieren ihre Plätze.
//
// Quelle der Einträge: SISTRIX-Rankings von platzhirsch.studio (AT/DE/CH, Stand
// 26.10.2026), abgeglichen mit search_produkte im neuen Katalog, je von Hand
// gewählt (gleiche Marke, gleiches Produkt). Nicht mehr im Katalog und daher
// bewusst ohne Eintrag (→ Markenseite): solpuri/classic-esstisch-tables-solpuri,
// classicon/orbis-desk-lamp-lamps-classicon, tom-dixon/fat-dining-chair-dining-chairs-tom-dixon,
// desalto/riga-outdoor-chairs-desalto.
//
// Schlüssel "marke/alter-slug" → [Kategorie, path_field] des neuen Katalogs.
export const LEGACY_PRODUCT_MAP = Object.freeze({
  "poliform/jacqueline-betten-poliform": ["beds", "beds-jacqueline"],
  "rimadesio/sixty-coffee-table-coffee-tables-rimadesio": ["coffee-tables", "coffee-tables-sixty-coffee-table"],
  "rimadesio/manta-tables-rimadesio": ["dining-tables", "dining-tables-manta-tische"],
  "rimadesio/long-island-tables-rimadesio": ["dining-tables", "dining-tables-long-island"],
  "flos/aim-pendant-flos": ["lamps", "chandeliers-aim"],
  "flos/parentesi-pendant-flos": ["lamps", "lamps-parentesi"],
  "brand-van-egmond/linea-element-chandeliers-brand-van-egmond": ["lamps", "chandeliers-linea-element"],
  "classicon/adjustable-table-e1027-side-tables-classicon": ["side-tables", "side-tables-adjustable-table-e1027"],
  "classicon/cypris-mirror-2-mirrors-classicon": ["mirrors", "mirrors-cypris-mirror"],
  "classicon/bell-side-table-side-tables-classicon": ["side-tables", "side-tables-bell-side-table"],
  "minotti/darren-night-storage-units-night-tables-minotti": ["night-tables", "drawer-units-darren-night-storage-units"],
});

export function mappedLegacyProduct(brandSlug, oldSlug) {
  const hit = LEGACY_PRODUCT_MAP[`${brandSlug}/${oldSlug}`];
  return hit ? { categoryKey: hit[0], pathField: hit[1] } : null;
}
