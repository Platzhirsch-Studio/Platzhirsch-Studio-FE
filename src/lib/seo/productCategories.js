// src/lib/seo/productCategories.js
// Localized furniture-category labels for product <title>/<h1>/breadcrumb.
//
// The CMS `kategories` field is stored mostly in English (some entries already in
// German), so every locale's product page rendered an IDENTICAL title/H1 —
// "Minotti West Sofas" on de/en/fr/it alike. The Sistrix crawl flagged 741 duplicate
// titles + 811 duplicate H1s from exactly this, and German pages carried the wrong
// keyword ("Sofas" not "Sofa", "Tables" not "Tische"). That is the single biggest
// blocker to ranking the it/fr/en versions.
//
// This map localizes the category word per locale so each language gets its real
// search term ("Minotti Divani" for it, "Minotti Canapés" for fr) and the four
// versions differ. Keyed by the lowercased source label (English AND the German
// spellings that also occur, so both are corrected). Only unambiguous furniture
// categories are mapped; anything not found — product-line names (Pearls, Feathers,
// Beem …) or context-dependent single words (Flos's "Table"/"Floor"/"Wall", which are
// lamp types, not furniture) — falls back to the raw label unchanged, never
// mistranslated. The slug/URL is unaffected; only visible/structured text changes.

export const CATEGORY_I18N = {
  // Tables
  "tables": { de: "Tische", en: "Tables", fr: "Tables", it: "Tavoli" },
  "tische": { de: "Tische", en: "Tables", fr: "Tables", it: "Tavoli" },
  "dining tables": { de: "Esstische", en: "Dining Tables", fr: "Tables à manger", it: "Tavoli da pranzo" },
  "coffee tables": { de: "Couchtische", en: "Coffee Tables", fr: "Tables basses", it: "Tavolini da caffè" },
  "side tables": { de: "Beistelltische", en: "Side Tables", fr: "Tables d'appoint", it: "Tavolini" },
  "small tables": { de: "Beistelltische", en: "Small Tables", fr: "Petites tables", it: "Tavolini" },
  "night tables": { de: "Nachttische", en: "Night Tables", fr: "Tables de chevet", it: "Comodini" },
  "console tables": { de: "Konsolen", en: "Console Tables", fr: "Consoles", it: "Consolle" },
  "consoles": { de: "Konsolen", en: "Consoles", fr: "Consoles", it: "Consolle" },
  "konsole": { de: "Konsolen", en: "Consoles", fr: "Consoles", it: "Consolle" },

  // Seating
  "chairs": { de: "Stühle", en: "Chairs", fr: "Chaises", it: "Sedie" },
  "stühle": { de: "Stühle", en: "Chairs", fr: "Chaises", it: "Sedie" },
  "dining chairs": { de: "Esszimmerstühle", en: "Dining Chairs", fr: "Chaises de salle à manger", it: "Sedie da pranzo" },
  "work chairs": { de: "Arbeitsstühle", en: "Work Chairs", fr: "Chaises de bureau", it: "Sedie da lavoro" },
  "armchairs": { de: "Sessel", en: "Armchairs", fr: "Fauteuils", it: "Poltrone" },
  "lounge chairs": { de: "Loungesessel", en: "Lounge Chairs", fr: "Fauteuils lounge", it: "Poltrone lounge" },
  "lounge chair": { de: "Loungesessel", en: "Lounge Chair", fr: "Fauteuil lounge", it: "Poltrona lounge" },
  "little armchairs and stools": { de: "Kleine Sessel & Hocker", en: "Little Armchairs & Stools", fr: "Petits fauteuils et tabourets", it: "Poltroncine e sgabelli" },
  "seating furniture": { de: "Sitzmöbel", en: "Seating Furniture", fr: "Sièges", it: "Sedute" },
  "suspended seats": { de: "Hängesitze", en: "Suspended Seats", fr: "Sièges suspendus", it: "Sedute sospese" },
  "sofas": { de: "Sofas", en: "Sofas", fr: "Canapés", it: "Divani" },
  "sofa": { de: "Sofas", en: "Sofas", fr: "Canapés", it: "Divani" },
  "benches": { de: "Bänke", en: "Benches", fr: "Bancs", it: "Panche" },
  "stools": { de: "Hocker", en: "Stools", fr: "Tabourets", it: "Sgabelli" },
  "barstools": { de: "Barhocker", en: "Bar Stools", fr: "Tabourets de bar", it: "Sgabelli da bar" },
  "bar & counter stools": { de: "Barhocker", en: "Bar & Counter Stools", fr: "Tabourets de bar", it: "Sgabelli da bar" },
  "chaise longue": { de: "Chaiselongues", en: "Chaise Longues", fr: "Chaises longues", it: "Chaise longue" },
  "chaise longues": { de: "Chaiselongues", en: "Chaise Longues", fr: "Chaises longues", it: "Chaise longue" },
  "chaise lounge": { de: "Chaiselongues", en: "Chaise Lounges", fr: "Chaises longues", it: "Chaise longue" },
  "upholstered": { de: "Polstermöbel", en: "Upholstered Furniture", fr: "Meubles rembourrés", it: "Imbottiti" },

  // Bedroom
  "beds": { de: "Betten", en: "Beds", fr: "Lits", it: "Letti" },
  "betten": { de: "Betten", en: "Beds", fr: "Lits", it: "Letti" },
  "headboards": { de: "Kopfteile", en: "Headboards", fr: "Têtes de lit", it: "Testiere" },
  "bedwear": { de: "Bettwäsche", en: "Bedwear", fr: "Linge de lit", it: "Biancheria da letto" },
  "schlafzimmermöbel": { de: "Schlafzimmermöbel", en: "Bedroom Furniture", fr: "Meubles de chambre", it: "Mobili da camera" },

  // Storage
  "kommoden": { de: "Kommoden", en: "Chests of Drawers", fr: "Commodes", it: "Cassettiere" },
  "drawer units": { de: "Schubladenelemente", en: "Drawer Units", fr: "Caissons à tiroirs", it: "Cassettiere" },
  "cabinets": { de: "Schränke", en: "Cabinets", fr: "Armoires", it: "Armadi" },
  "bookcases and sideboards": { de: "Bücherregale & Sideboards", en: "Bookcases & Sideboards", fr: "Bibliothèques et buffets", it: "Librerie e credenze" },
  "glass cabinets and display cases": { de: "Vitrinen", en: "Glass Cabinets & Display Cases", fr: "Vitrines", it: "Vetrine" },
  "shelves": { de: "Regale", en: "Shelves", fr: "Étagères", it: "Scaffali" },
  "shelves & consoles": { de: "Regale & Konsolen", en: "Shelves & Consoles", fr: "Étagères et consoles", it: "Scaffali e consolle" },
  "desks": { de: "Schreibtische", en: "Desks", fr: "Bureaux", it: "Scrivanie" },
  "screens": { de: "Paravents", en: "Screens", fr: "Paravents", it: "Paraventi" },
  "mirrors": { de: "Spiegel", en: "Mirrors", fr: "Miroirs", it: "Specchi" },
  "spiegelschränke": { de: "Spiegelschränke", en: "Mirror Cabinets", fr: "Armoires à miroir", it: "Armadi a specchio" },

  // Lighting
  "lamps": { de: "Leuchten", en: "Lamps", fr: "Lampes", it: "Lampade" },
  "wall lamps": { de: "Wandleuchten", en: "Wall Lamps", fr: "Appliques", it: "Lampade da parete" },
  "ceiling lamps": { de: "Deckenleuchten", en: "Ceiling Lamps", fr: "Plafonniers", it: "Lampade da soffitto" },
  "hanging lamps": { de: "Hängeleuchten", en: "Hanging Lamps", fr: "Suspensions", it: "Lampade a sospensione" },
  "floor lamps": { de: "Stehleuchten", en: "Floor Lamps", fr: "Lampadaires", it: "Lampade da terra" },
  "chandeliers": { de: "Kronleuchter", en: "Chandeliers", fr: "Lustres", it: "Lampadari" },
  "pendant": { de: "Pendelleuchten", en: "Pendant Lamps", fr: "Suspensions", it: "Lampade a sospensione" },

  // Floor & textiles
  "rugs": { de: "Teppiche", en: "Rugs", fr: "Tapis", it: "Tappeti" },
  "carpets": { de: "Teppiche", en: "Carpets", fr: "Tapis", it: "Tappeti" },
  "throw": { de: "Decken", en: "Throws", fr: "Plaids", it: "Plaid" },

  // Kitchen
  "kitchen": { de: "Küchen", en: "Kitchens", fr: "Cuisines", it: "Cucine" },

  // Outdoor
  "outdoor": { de: "Outdoor", en: "Outdoor", fr: "Extérieur", it: "Outdoor" },
  "parasols": { de: "Sonnenschirme", en: "Parasols", fr: "Parasols", it: "Ombrelloni" },
  "round parasols": { de: "Sonnenschirme rund", en: "Round Parasols", fr: "Parasols ronds", it: "Ombrelloni rotondi" },
  "square parasols": { de: "Sonnenschirme eckig", en: "Square Parasols", fr: "Parasols carrés", it: "Ombrelloni quadrati" },
  "cantilever parasols": { de: "Ampelschirme", en: "Cantilever Parasols", fr: "Parasols déportés", it: "Ombrelloni a braccio" },
  "wall mounted parasols": { de: "Wandschirme", en: "Wall-Mounted Parasols", fr: "Parasols muraux", it: "Ombrelloni a parete" },
  "center post parasols": { de: "Mittelstockschirme", en: "Center-Post Parasols", fr: "Parasols à mât central", it: "Ombrelloni a palo centrale" },
  "heaters": { de: "Heizstrahler", en: "Heaters", fr: "Chauffages", it: "Riscaldatori" },
  "doors": { de: "Türen", en: "Doors", fr: "Portes", it: "Porte" },
  "candles": { de: "Kerzen", en: "Candles", fr: "Bougies", it: "Candele" },

  // Generic groupings
  "accessories": { de: "Accessoires", en: "Accessories", fr: "Accessoires", it: "Accessori" },
  "collection": { de: "Kollektion", en: "Collection", fr: "Collection", it: "Collezione" },

  // Remaining real categories (max coverage). Product-line proper nouns — Baobab
  // scents ("Pearls", "Arabian Nights", "Les Prestigieuses") and Heatsail models
  // ("Beem", "Disc", "Glow", "Dome", "Leaf") — stay unmapped on purpose: they are
  // names, not furniture types, and must not be "translated".
  "sessel, chaiselongues": { de: "Sessel & Chaiselongues", en: "Armchairs & Chaise Longues", fr: "Fauteuils et chaises longues", it: "Poltrone e chaise longue" },
  "sun lounge": { de: "Sonnenliegen", en: "Sun Loungers", fr: "Bains de soleil", it: "Lettini prendisole" },
  "sunloungers": { de: "Sonnenliegen", en: "Sun Loungers", fr: "Bains de soleil", it: "Lettini prendisole" },
  "sleeping systems": { de: "Schlafsysteme", en: "Sleeping Systems", fr: "Systèmes de couchage", it: "Sistemi letto" },
  "legs": { de: "Beine", en: "Legs", fr: "Pieds", it: "Gambe" },
  "podiums": { de: "Podeste", en: "Podiums", fr: "Podiums", it: "Podi" },
  "vase": { de: "Vasen", en: "Vases", fr: "Vases", it: "Vasi" },
  "lounge": { de: "Loungemöbel", en: "Lounge", fr: "Lounge", it: "Lounge" },
  "folding screen": { de: "Paravents", en: "Folding Screens", fr: "Paravents", it: "Paraventi" },
  "suspended lamps": { de: "Hängeleuchten", en: "Suspended Lamps", fr: "Suspensions", it: "Lampade a sospensione" },
  // Flos / Quasar lighting: the bare type word IS the lamp category (data-verified:
  // these singulars occur only for lighting brands), so map to lamp types.
  "table": { de: "Tischleuchten", en: "Table Lamps", fr: "Lampes de table", it: "Lampade da tavolo" },
  "floor": { de: "Stehleuchten", en: "Floor Lamps", fr: "Lampadaires", it: "Lampade da terra" },
  "wall": { de: "Wandleuchten", en: "Wall Lamps", fr: "Appliques", it: "Lampade da parete" },
  "ceiling": { de: "Deckenleuchten", en: "Ceiling Lamps", fr: "Plafonniers", it: "Lampade da soffitto" },
  "suspension": { de: "Pendelleuchten", en: "Suspension Lamps", fr: "Suspensions", it: "Lampade a sospensione" },
  "cushion": { de: "Kissen", en: "Cushions", fr: "Coussins", it: "Cuscini" },
  "side table": { de: "Beistelltisch", en: "Side Table", fr: "Table d'appoint", it: "Tavolino" },
  "home & standing desks": { de: "Schreibtische", en: "Home & Standing Desks", fr: "Bureaux", it: "Scrivanie" },
};

// Return the category label localized for `locale`. Unknown labels (product-line
// names, ambiguous single words) are returned unchanged — never mistranslated.
export function localizeCategory(rawLabel, locale = "de") {
  if (!rawLabel || typeof rawLabel !== "string") return rawLabel || "";
  const hit = CATEGORY_I18N[rawLabel.trim().toLowerCase()];
  if (!hit) return rawLabel;
  return hit[locale] || hit.de || rawLabel;
}

// Produkte.kategories is stored as "{Category}-{Brand}" (e.g. "Betten-Poliform").
// Strip the trailing brand suffix to get back the raw category label ("Betten").
// Shared by every place that needs that split (product-detail <title>/<h1>,
// brand-listing intros, and the /produkte taxonomy below) so the same
// regex isn't reimplemented per call site.
export function stripBrandFromKategorie(kategorienRaw, marken) {
  let label = (kategorienRaw || "").trim();
  if (!label) return "";
  const marke = (marken || "").trim();
  if (marke) {
    const escaped = marke.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    label = label.replace(new RegExp(`[\\s-]*${escaped}\\s*$`, "i"), "");
  }
  return label.replace(/[-\s]+$/g, "").trim();
}

// Lowercased, brand-suffix-stripped category key derived from a real product's
// `kategories` field. Matches CATEGORY_I18N's keys (for the localized label)
// and, for most brands, the Kategorien doctype's `category_key` (see
// src/lib/api/fetchKategorien.js) — both are keyed off the same raw CMS
// category words. Used to group real Produkte rows into the /produkte
// category taxonomy without a static per-product categoryKey.
export function deriveCategoryKey(kategorienRaw, marken) {
  return stripBrandFromKategorie(kategorienRaw, marken).toLowerCase();
}
