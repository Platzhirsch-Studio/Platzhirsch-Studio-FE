// Static demo catalog for the /produkte/shop filter page.
//
// This is placeholder content, not CMS data: color, material and designer are not
// fields the product API exposes today (only brand/category come from the real
// backend, and color/material live per-variant on the product-detail page, not in
// the bulk list). This file exists to build and demo the Silvera-style sidebar
// filter UI against a fixed dataset until/unless the backend grows those fields.
//
// The hand-authored products below (p01-p33) are illustrative examples. The
// products in src/lib/data/importedProducts/ are different: real catalog content
// extracted from the CSV exports in public/Produkts/ (Brand van Egmond, Next125,
// Tréca Paris) via a one-off generation script, so every field — description,
// dimensions, specifications, finishes — is genuine manufacturer copy, not
// invented. See each importedProducts/*.js file's header for its own notes
// (source file, language policy). Regenerate by re-running that script if the
// CSVs in public/Produkts are ever refreshed; nothing at runtime reads that
// folder directly.
import { BRAND_VAN_EGMOND_PRODUCTS } from "./importedProducts/brandVanEgmond";
import { NEXT125_PRODUCTS } from "./importedProducts/next125";
import { TRECA_PRODUCTS } from "./importedProducts/treca";
// Manufacturer copy in this file and in importedProducts/*: the superlatives
// of the source texts were rewritten neutrally at the source in R4-produkt
// (check:claims: 0 findings in src/lib/data). If the generator is re-run on
// fresh CSVs, they come back – then rewrite again. The central render-time
// filter stays as the second line of defence: every accessor below returns
// the copy through it; render only via these accessors.
import { filterInfoBio, filterManufacturerProduct, filterManufacturerText } from "../shop/manufacturerText.js";
import { localizedBio } from "./designerBios.js";

export const COLOR_I18N = {
  anthracite: { de: "Anthrazit", en: "Anthracite", fr: "Anthracite", it: "Antracite" },
  beige: { de: "Beige", en: "Beige", fr: "Beige", it: "Beige" },
  black: { de: "Schwarz", en: "Black", fr: "Noir", it: "Nero" },
  white: { de: "Weiß", en: "White", fr: "Blanc", it: "Bianco" },
  grey: { de: "Grau", en: "Grey", fr: "Gris", it: "Grigio" },
  brown: { de: "Braun", en: "Brown", fr: "Marron", it: "Marrone" },
  cognac: { de: "Cognac", en: "Cognac", fr: "Cognac", it: "Cognac" },
  sand: { de: "Sand", en: "Sand", fr: "Sable", it: "Sabbia" },
  gold: { de: "Gold", en: "Gold", fr: "Doré", it: "Oro" },
  // Added for the Brand van Egmond lighting import (metal frame finishes).
  nickel: { de: "Nickel", en: "Nickel", fr: "Nickel", it: "Nichel" },
  copper: { de: "Kupfer", en: "Copper", fr: "Cuivre", it: "Rame" },
};

export const MATERIAL_I18N = {
  leather: { de: "Leder", en: "Leather", fr: "Cuir", it: "Pelle" },
  fabric: { de: "Stoff", en: "Fabric", fr: "Tissu", it: "Tessuto" },
  wood: { de: "Holz", en: "Wood", fr: "Bois", it: "Legno" },
  metal: { de: "Metall", en: "Metal", fr: "Métal", it: "Metallo" },
  marble: { de: "Marmor", en: "Marble", fr: "Marbre", it: "Marmo" },
  glass: { de: "Glas", en: "Glass", fr: "Verre", it: "Vetro" },
  velvet: { de: "Samt", en: "Velvet", fr: "Velours", it: "Velluto" },
  lacquer: { de: "Lack", en: "Lacquer", fr: "Laque", it: "Laccato" },
  wax: { de: "Wachs", en: "Wax", fr: "Cire", it: "Cera" },
  // Added for the Next125 kitchen import (src/lib/data/importedProducts/next125.js).
  laminate: { de: "Laminat", en: "Laminate", fr: "Stratifié", it: "Laminato" },
  linoleum: { de: "Linoleum", en: "Linoleum", fr: "Linoléum", it: "Linoleum" },
  ceramic: { de: "Keramik", en: "Ceramic", fr: "Céramique", it: "Ceramica" },
};

// Type variants a category can be split into — e.g. Chandeliers → round / oval /
// hanging, Beds → single / double / box spring. This works the same way for every
// category: only products that actually set `subCategoryKey` get a subcategory
// filter (see FilterSection's empty-options guard), so a category with no known
// subtypes yet just shows none — you don't need to fill in every category's full
// model list up front. To add a subtype for a category that doesn't have one yet:
// 1) add a key here (with its de/en/fr/it label), 2) set `subCategoryKey` on the
// relevant products below. Keys are shared across all categories, so keep them
// specific enough not to collide (e.g. "boxspring", not a bare "large").
export const SUBCATEGORY_I18N = {
  // Chandeliers
  round: { de: "Rund", en: "Round", fr: "Rond", it: "Rotondo" },
  oval: { de: "Oval", en: "Oval", fr: "Ovale", it: "Ovale" },
  hanging: { de: "Hängend", en: "Hanging", fr: "Suspendu", it: "Sospeso" },
  // Beds
  single: { de: "Einzelbett", en: "Single Bed", fr: "Lit simple", it: "Letto singolo" },
  double: { de: "Doppelbett", en: "Double Bed", fr: "Lit double", it: "Letto matrimoniale" },
  boxspring: { de: "Boxspringbett", en: "Box Spring Bed", fr: "Lit boxspring", it: "Letto boxspring" },
  mattress: { de: "Matratze", en: "Mattress", fr: "Matelas", it: "Materasso" },
  // Brand van Egmond lighting (src/lib/data/importedProducts/brandVanEgmond.js) —
  // one subtype per source CSV category, shared across the "chandeliers" and
  // "lamps" categoryKeys the same way round/oval/hanging already are.
  conical: { de: "Konisch", en: "Conical", fr: "Conique", it: "Conico" },
  vertical: { de: "Vertikal", en: "Vertical", fr: "Vertical", it: "Verticale" },
  elements: { de: "Elemente", en: "Elements", fr: "Éléments", it: "Elementi" },
  ceiling: { de: "Deckenleuchte", en: "Ceiling", fr: "Plafonnier", it: "Soffitto" },
  tableFloorWall: { de: "Tisch-, Steh- & Wandleuchte", en: "Table, Floor & Wall", fr: "Table, sol et applique", it: "Tavolo, terra e parete" },
  sculptural: { de: "Skulptural", en: "Sculptural", fr: "Sculptural", it: "Scultoreo" },
};

export const SWATCHES = {
  anthracite: "#3b3f42",
  beige: "#e3d5b8",
  black: "#111111",
  white: "#f5f5f5",
  grey: "#9a9a9a",
  brown: "#6b4a34",
  cognac: "#9a5b32",
  sand: "#d8c6a1",
  gold: "#c9a94f",
  // Added for the Brand van Egmond lighting import (metal frame finishes).
  nickel: "#c7c9cb",
  copper: "#b56a4d",
};

// "About the brand" / "About the designer" cards on the product detail page.
// `image` is a placeholder from the existing image set (no real brand/designer
// photography in this repo yet) — swap for the real asset whenever available,
// nothing else needs to change. `bio` is the English source; the DE/FR/IT
// translations live in ./designerBios.js (Runde 9, P5, r5-recht-inhalt P1-3) –
// a locale without a translation shows no bio, never the English text. Only covers the
// brands/designers behind this file's curated example products; a product whose
// brand or designer isn't listed here just doesn't get that section — see
// getBrandInfo/getDesignerInfo.
export const BRAND_INFO = {
  "Minotti": { image: "/Images/Outdoor/bannerImage4.jpg", founded: "1948", country: "Italy", bio: "Founded in 1948 in Meda, Italy, by Alberto Minotti, the company began as a small artisan workshop producing traditional wooden furniture. Over more than seventy years it has grown into an established name in contemporary Italian design, known for a refined, understated aesthetic and careful craftsmanship. Today Minotti makes indoor and outdoor furniture and works with well-known designers." },
  "Poliform": { image: "/Images/Outdoor/bannerImage5.jpg", founded: "1970", country: "Italy", bio: "An Italian furniture house founded in 1970 in Inverigo, near Como, Poliform built its early reputation on precision-engineered wardrobe and storage systems. It has since expanded into a full living collection, recognized for modular architecture, meticulous joinery and a design language that favors quiet, architectural rigor over decoration." },
  "Flexform": { image: "/Images/Kuche/bannerImageKuche2.jpg", founded: "1959", country: "Italy", bio: "Operating since 1959 in Meda, the heart of the Brianza furniture district, Flexform is celebrated for timeless, comfort-driven design rooted in traditional Italian upholstery craft. Its collections favor soft, enveloping volumes and natural materials over trend-driven statements, built to age well in a home over decades." },
  "B&B Italia": { image: "/Images/Kuche/bannerImageKuche3.jpg", founded: "1966", country: "Italy", bio: "An Italian design company since 1966, B&B Italia has shaped contemporary living with technologically advanced, research-driven furniture developed in its own in-house laboratories. It was among the first furniture companies to industrialize polyurethane foam upholstery, and continues to pair that engineering culture with international architects and designers." },
  "Cassina": { image: "/Images/Accessories/bannerImageAccessories1.jpg", founded: "1927", country: "Italy", bio: "Founded in 1927, Cassina is one of Italy's most historic furniture makers, and the first to bring industrial manufacturing to fine cabinetmaking. Alongside its own contemporary collections, Cassina holds the exclusive rights to reissue works by masters like Le Corbusier, Charlotte Perriand and Gio Ponti, blending design history with new production." },
  "Living Divani": { image: "/Images/Accessories/bannerImageAccessories2.jpg", founded: "1969", country: "Italy", bio: "Established in 1969 and long guided by art director Piero Lissoni, Living Divani is known for understated, research-led seating that favors quiet elegance over ornamentation. The brand's collections are defined by clean geometry, soft palettes and a deliberate restraint that lets proportion and material carry the design." },
  "Molteni&C": { image: "/Images/Accessories/bannerImageAccessories3.jpg", founded: "1934", country: "Italy", bio: "An Italian family-run company since 1934, Molteni&C is celebrated for combining fine cabinetmaking heritage with contemporary design. Now in its third generation of family leadership, the brand pairs an in-house research center with collaborations with architects to produce furniture built for long service life." },
  "Rimadesio": { image: "/Images/Arbeiten/bannerImageArbeiten2.jpg", founded: "1956", country: "Italy", bio: "Founded in 1956 near Como, Rimadesio specializes in architectural sliding doors, walk-in wardrobes and room-dividing systems in glass and aluminum. Since the 1980s its identity has been shaped by long-time art director Giuseppe Bavuso, whose precise, technical language turns structural hardware into a visible design feature rather than hiding it." },
  "Flos": { image: "/Images/Arbeiten/bannerImageArbeiten3.jpg", founded: "1962", country: "Italy", bio: "An Italian lighting company since 1962, Flos has produced well-known lamps of the 20th and 21st centuries, working with designers from Achille Castiglioni to Philippe Starck. Many of its pieces are held in permanent design-museum collections, including MoMA in New York." },
};

export const DESIGNER_INFO = {
  "Rodolfo Dordoni": { image: "/Images/Wohnen/bannerImage1.jpg", bio: "Born in Milan in 1954, Rodolfo Dordoni trained as an architect before turning to product and furniture design. Since 1998 he has served as Minotti's art director, shaping the brand's identity through collections defined by clean lines, tailored proportions and a quiet sense of luxury. His work spans furniture, lighting and interiors for several Italian design houses." },
  "Patricia Urquiola": { image: "/Images/Wohnen/bannerImage2.jpg", bio: "Born in Oviedo, Spain in 1961 and based in Milan since the 1990s, Urquiola is celebrated for sculptural, research-driven furniture developed for Italian design brands. Her work is known for combining technical experimentation — new materials, weaving and molding techniques — with an emotional, handcrafted sensibility." },
  "Vincent Van Duysen": { image: "/Images/Wohnen/bannerImage3.jpg", bio: "A Belgian architect and designer born in 1962, Van Duysen is known for a restrained, material-honest approach across architecture and furniture design. Since 2016 he has also served as Molteni&C's creative director, extending his minimalist architectural language into the brand's furniture collections." },
  "Achille Castiglioni": { image: "/Images/Wohnen/bannerImage4.jpg", bio: "One of Italy's most influential 20th-century designers (1918–2002), Castiglioni was renowned for witty, functional object and lighting design that turned everyday engineering — a tractor seat, a fishing-rod joint — into design icons. He designed extensively for Flos from the 1960s onward, and pieces like the Arco and Taraxacum lamps remain in production today." },
  "Giuseppe Bavuso": { image: "/Images/Wohnen/bannerImage5.jpg", bio: "An Italian architect and Rimadesio's long-time art director since the 1980s, Bavuso is known for precise, minimal systems in glass and metal. His work has defined the brand's entire product language, from sliding doors to modular walk-in wardrobes and bookcases." },
  "Jean-Marie Massaud": { image: "/Images/Wohnen/bannerImage6.jpg", bio: "A French designer and architect born in 1966, Massaud is known for organic, sculptural forms across furniture, yachts and architecture. His practice, Studio Massaud, works across scales — from small objects to entire buildings — always returning to a fluid, nature-inspired vocabulary of form." },
  "Antonio Citterio": { image: "/Images/Wohnen/bannerImage7.jpg", bio: "An Italian architect and designer born in 1950, Citterio has shaped the identity of several major Italian furniture brands through restrained, livable design. Alongside product design, his practice, Antonio Citterio Patricia Viel, works internationally on architecture and interiors for hotels, offices and residential buildings." },
  "Piero Lissoni": { image: "/Images/Wohnen/bannerImage8.jpg", bio: "An Italian architect and designer born in 1956, Lissoni is known for a minimalist, monochrome aesthetic across furniture and interior design. As long-time art director of Living Divani and B&B Italia's outdoor line, he has been influential in defining a distinctly quiet, contemporary strand of Italian design." },
};

// Bio in the page language, filtered for display (null if no sentence
// survives the claim filter or the locale has no translation).
function localizedInfo(name, info, locale, ctx) {
  if (!info) return null;
  const source = filterInfoBio(info, ctx);
  if (!source || locale === "en") return source;
  const bio = localizedBio(name, source.bio, locale);
  return bio ? filterInfoBio({ ...info, bio }, ctx) : null;
}

export function getBrandInfo(brand, locale = "de") {
  return localizedInfo(brand, BRAND_INFO[brand], locale, { brand });
}

export function getDesignerInfo(designer, locale = "de") {
  if (!designer) return null;
  return localizedInfo(designer, DESIGNER_INFO[designer], locale, {});
}

export function localizeAttribute(map, key, locale = "de") {
  const hit = map[key];
  if (!hit) return key;
  return hit[locale] || hit.de || key;
}

// --- Product detail fields (Structure / Padding / Covers / Base, etc.) -------
// Modeled on how Minotti actually structures a product page: they never show the
// same field set for every category — a sofa gets Structure/Padding/Covers/Base,
// a table gets Top/Base/Structure, a light gets Light Source/Dimmable/Material/
// Finish. CATEGORY_DETAIL_FIELDS is that per-category template (which fields
// apply); each product then fills in only the ones it actually has content for
// via its own `details` object (see e.g. "Yang" below). A field with no content
// — either because the category doesn't use it or the product hasn't been
// written up yet — is simply omitted, never shown blank or duplicated across
// unrelated categories.
export const CATEGORY_DETAIL_FIELDS = {
  sofas: ["structure", "padding", "covers", "base"],
  armchairs: ["structure", "padding", "covers", "base"],
  "dining chairs": ["structure", "padding", "covers", "base"],
  beds: ["structure", "covers", "base"],
  "dining tables": ["top", "base", "structure"],
  "coffee tables": ["top", "base", "structure"],
  shelves: ["structure", "finish"],
  chandeliers: ["lightSource", "dimmable", "material", "finish"],
  lamps: ["lightSource", "dimmable", "material", "finish"],
  parasols: ["frame", "canopy", "mechanism", "dimensions"],
  heaters: ["powerOutput", "coverage", "technology", "rating"],
  kitchen: ["fronts", "carcass", "countertop", "hardware"],
  doors: ["frame", "panel", "finish", "hardware"],
  candles: ["wax", "scent", "burnTime", "size"],
  accessories: ["material", "dimensions", "finish"],
};

// Ordered {key, value} pairs for a product's detail section. CATEGORY_DETAIL_FIELDS
// is the baseline reference for what a category typically covers, but the actual
// order shown always follows the product's own `details` object — real brand
// copy (see "Yang" below) often needs its own extra fields (e.g. a sofa with a
// Headrest section) or a different sequence than the category baseline, and this
// lets a product say so just by how it orders its own `details` keys.
//
// A field's value can be authored as a single string (short products) or an
// array of strings (each its own paragraph, for a field with more to say) —
// this always normalizes to an array so the UI never needs to branch on shape.
export function getProductDetailFields(product) {
  const details = product.details || {};
  const ctx = { brand: product.brand };
  return Object.entries(details)
    .map(([key, value]) => [key, (Array.isArray(value) ? value : [value]).map((v) => filterManufacturerText(v, ctx)).filter(Boolean)])
    .filter(([, value]) => value.length)
    .map(([key, value]) => ({ key, value }));
}

// A handful of products (e.g. "Tréca Paris") genuinely cover several distinct
// named models under one listing — those hand-author a `variants` array (name +
// specifications/compositions/finishes per model) for a comparison table. Most
// products have exactly one model, described instead via `details` above.
export function getProductVariants(product) {
  return Array.isArray(product.variants) ? filterManufacturerProduct({ brand: product.brand, variants: product.variants }).variants : [];
}

// Every product's own `image` stays the single cover shot used everywhere except
// the detail page (cards, hub tiles, related-products strips only ever need one
// image). A product can optionally add `images: [...]` for the detail-page
// gallery (main image + thumbnails + prev/next); this returns that array, or
// falls back to the single `image` so every product works with the gallery
// component whether or not it has extra shots.
export function getProductImages(product) {
  if (Array.isArray(product.images) && product.images.length) return product.images;
  return product.image ? [product.image] : [];
}

// categoryKey must match a key in src/lib/seo/productCategories.js so labels stay
// consistent with the rest of the site.
export const STATIC_SHOP_PRODUCTS = [
  {
    id: "p01", name: "Yang", brand: "Minotti", designer: "Rodolfo Dordoni", categoryKey: "sofas", colorKey: "sand", materialKey: "fabric",
    image: "/Images/Wohnen/bannerImage1.jpg", images: ["/Images/Wohnen/bannerImage1.jpg", "/Images/Wohnen/bannerImage2.jpg", "/Images/Wohnen/bannerImage3.jpg"],
    dimensions: "Width: 242 cm · Depth: 98 cm · Height: 74 cm · Seat height: 40 cm",
    colorOptions: ["sand", "grey", "beige", "anthracite"],
    // Real Minotti editorial + technical copy (paraphrased from minotti.com/en/yang_2)
    // — kept at its real length on purpose, as a reference for how much text a
    // fully-described product actually carries versus the shorter placeholder
    // entries elsewhere in this file. English-only for now, like Tréca.
    longDescription: [
      "A young, dynamic seating system where geometric lines form an original mix of soft volumes in an unconventional rhythm of full and empty spaces.",
      "The Yang seating system emphasizes streamlined aesthetics combined with flexible arrangement options. Designed for a young public, it creates soft, cozy domestic islands where you can spend your leisure time indulging in your favorite pastimes or enjoying all-out relaxation. A defining feature of Yang is its particular \"Offset\" elements, with the backrest offset from the seat, which — together with its ottomans and Close side tables — add to its versatility.",
      "The system allows for multiple configuration possibilities through mobile ottomans that can extend the seating or function as table surfaces. Its architectural rigor is reinforced by a Pewter-colored aluminum base that adapts to various interior styles. The headrest provides vertical support and encourages proper reading posture, while fine \"Cambré\" stitching creates both functional and aesthetic value.",
    ],
    // Each field below is an array of paragraphs rather than one line — Yang is
    // the reference product for "how much text a fully-written-up field can
    // carry" elsewhere in this file, same role as longDescription above.
    details: {
      structure: [
        "The Yang seating system is built on a multiply wood frame, engineered for structural rigidity without adding unnecessary weight to the piece.",
        "Seat suspension relies on elastic straps with a high rubber content, which flex under weight to absorb pressure evenly across the frame and return to shape over years of daily use — the same suspension technique used across Minotti's seating collections.",
      ],
      seatPreparation: [
        "Comfort begins with high-resilience, variable-density polyurethane foam, shaped with a concave contour so the cushion cradles the body rather than resisting it.",
        "Armrests and backrests add a layer of temperature-sensitive memory foam, wrapped in breathable, heat-bonded fiber and finished with a hypoallergenic cotton casing — a construction chosen for how it ages, staying supportive long after the first season of use.",
      ],
      headrest: [
        "The headrest is engineered as a semi-rigid element: firm enough to provide real neck and shoulder support, yet flexible enough to move naturally with the body.",
        "It is fully removable for cleaning or reupholstering, and finished with the signature \"Cambré\" matelassé stitching — a detail that is as much structural quilting as it is decoration, reinforcing the seams while giving the headrest its distinctive silhouette.",
      ],
      cushions: [
        "Backrest cushions are filled with certified goose down (Assopiuma gold label), prized for how it redistributes weight and continuously reshapes itself around the body rather than compacting into flat, worn patches.",
        "At the center of each cushion sits a polyurethane foam core, which keeps the silhouette from collapsing over time. Seat cushions are completely reversible, so wear is distributed evenly across both faces over the life of the piece.",
      ],
      covers: [
        "Every cover on the Yang system — structure, seat and backrest alike — is fully removable, in both fabric and leather versions, for cleaning or eventual reupholstering.",
        "This is a deliberate long-term design decision: rather than treating the fabric as permanently bonded to the frame, Minotti builds the whole system so its appearance can be refreshed years into ownership without replacing the piece itself.",
      ],
      base: [
        "The base is machined from extruded aluminum and finished in a high-gloss Pewter color, chosen to read as a quiet architectural line beneath the soft volumes of the seating above it.",
        "Nylon slide rests protect both the base and the floor beneath it, letting the piece be repositioned without scuffing hardwood or stone flooring — a small detail, but one that matters over years of everyday use in a home.",
      ],
    },
    // Category-native "how you can get this" tab — for a modular sofa system
    // like Yang, that's its seating configurations (per the real Minotti copy
    // in longDescription above); a bed's equivalent would be sizes, a table's
    // would be extension options, and so on per category.
    configurations: [
      {
        name: "2-Seater",
        description: "The base module on its own — a compact, self-contained composition for smaller rooms or as a starting point to expand later.",
      },
      {
        name: "3-Seater with Offset backrest",
        description: "The signature Yang composition: the backrest offset from the seat in an asymmetric rhythm of full and empty spaces, rather than a uniform straight line.",
      },
      {
        name: "Corner / Chaise with mobile ottoman",
        description: "A corner or chaise-longue composition paired with a mobile ottoman that can be pushed in to extend the seating, or pulled out to function as a table surface.",
      },
    ],
  },
  {
    id: "p02", name: "Torii", brand: "Minotti", designer: "Rodolfo Dordoni", categoryKey: "armchairs", colorKey: "cognac", materialKey: "leather", image: "/Images/Wohnen/bannerImage2.jpg",
    dimensions: "Width: 78 cm · Depth: 84 cm · Height: 76 cm",
    colorOptions: ["cognac", "black", "sand"],
    details: {
      structure: "Solid wood frame, seat structure in molded high-resilience foam over elastic straps.",
      padding: "Backrest and armrests in soft polyurethane foam with a fibre wrap for a rounded silhouette.",
      covers: "Full-grain leather upholstery, hand-stitched seams, removable cushion covers.",
      base: "Swivel base in polished metal with Cognac-matched stitching.",
    },
  },
  { id: "p03", name: "Mad Queen", brand: "Poliform", designer: "Jean-Marie Massaud", categoryKey: "armchairs", colorKey: "beige", materialKey: "velvet", image: "/Images/Wohnen/bannerImage3.jpg" },
  {
    id: "p04", name: "Bristol", brand: "Poliform", designer: "Jean-Marie Massaud", categoryKey: "dining chairs", colorKey: "black", materialKey: "leather", image: "/Images/Wohnen/bannerImage4.jpg",
    details: {
      structure: "Solid oak frame, steam-bent backrest for ergonomic support.",
      padding: "Seat pad in high-density foam for all-day comfort.",
      covers: "Leather upholstery with double-stitched edges.",
      base: "Tapered solid-oak legs, matte black lacquer finish.",
    },
  },
  { id: "p05", name: "Groundpiece", brand: "Flexform", designer: "Antonio Citterio", categoryKey: "sofas", colorKey: "grey", materialKey: "fabric", image: "/Images/Wohnen/bannerImage5.jpg" },
  { id: "p06", name: "Feel Good", brand: "Flexform", designer: "Antonio Citterio", categoryKey: "armchairs", colorKey: "white", materialKey: "fabric", image: "/Images/Wohnen/bannerImage6.jpg" },
  { id: "p07", name: "Husk", brand: "B&B Italia", designer: "Patricia Urquiola", categoryKey: "armchairs", colorKey: "anthracite", materialKey: "leather", image: "/Images/Wohnen/bannerImage7.jpg" },
  {
    id: "p08", name: "Tobi-Ishi", brand: "B&B Italia", designer: "Patricia Urquiola", categoryKey: "dining tables", colorKey: "white", materialKey: "marble", image: "/Images/Wohnen/bannerImage8.jpg",
    dimensions: "Width: 240 cm · Depth: 110 cm · Height: 73 cm",
    colorOptions: ["white", "black", "grey"],
    details: {
      top: "White marble top, 20 mm thick, honed finish with a beveled edge.",
      base: "Powder-coated steel base in matte white, cross-braced for stability.",
      structure: "Modular composition of geometric volumes assembled without visible fixings.",
    },
  },
  { id: "p09", name: "Sity", brand: "Cassina", designer: "Antonio Citterio", categoryKey: "sofas", colorKey: "brown", materialKey: "leather", image: "/Images/Wohnen/bannerImage9.jpg" },
  {
    id: "p10", name: "Aspen", brand: "Cassina", designer: "Piero Lissoni", categoryKey: "coffee tables", colorKey: "black", materialKey: "wood", image: "/Images/Wohnen/bannerImage10.jpg",
    details: {
      top: "Solid wood top, 30 mm thick, black open-pore lacquer finish.",
      base: "Sculpted solid-wood legs in the same finish as the top.",
      structure: "One-piece sculptural silhouette, hand-finished joins.",
    },
  },
  { id: "p11", name: "Frog", brand: "Living Divani", designer: "Piero Lissoni", categoryKey: "sofas", colorKey: "beige", materialKey: "fabric", image: "/Images/Arbeiten/bannerImageArbeiten1.jpg" },
  { id: "p12", name: "Extrasoft", brand: "Living Divani", designer: "Piero Lissoni", categoryKey: "armchairs", colorKey: "grey", materialKey: "velvet", image: "/Images/Arbeiten/bannerImageArbeiten2.jpg" },
  {
    id: "p13", name: "Gliss Master", brand: "Molteni&C", designer: "Vincent Van Duysen", categoryKey: "beds", subCategoryKey: "double", colorKey: "sand", materialKey: "fabric", image: "/Images/Arbeiten/bannerImageArbeiten3.jpg",
    dimensions: "Width: 180 cm · Length: 200 cm · Height: 106 cm",
    colorOptions: ["sand", "grey", "beige"],
    details: {
      structure: "Free-standing bed frame in engineered wood, designed for an optional box-spring or slatted base.",
      covers: "Headboard and frame fully upholstered in a removable fabric cover with quick-release coupling.",
      base: "Low-profile feet in brushed metal, Sand-matched finish.",
    },
  },
  { id: "p14", name: "D.552.1", brand: "Molteni&C", designer: "Gio Ponti", categoryKey: "dining chairs", colorKey: "cognac", materialKey: "leather", image: "/Images/Kuche/bannerImageKuche1.jpg" },
  {
    id: "p15", name: "Random", brand: "Rimadesio", designer: "Giuseppe Bavuso", categoryKey: "shelves", colorKey: "anthracite", materialKey: "metal", image: "/Images/Accessories/bannerImageAccessories1.jpg",
    details: {
      structure: "Modular aluminum frame with sliding glass or lacquered-panel doors.",
      finish: "Available in Anthracite, Bronze or Chrome anodized aluminum, with glass, mirrored or lacquered panel options.",
    },
  },
  { id: "p16", name: "Zenit", brand: "Rimadesio", designer: "Giuseppe Bavuso", categoryKey: "coffee tables", colorKey: "black", materialKey: "glass", image: "/Images/Accessories/bannerImageAccessories2.jpg" },
  { id: "p17", name: "Charles", brand: "B&B Italia", designer: "Antonio Citterio", categoryKey: "sofas", colorKey: "beige", materialKey: "leather", image: "/Images/Accessories/bannerImageAccessories3.jpg" },
  { id: "p18", name: "Cestone", brand: "Flexform", designer: "Antonio Citterio", categoryKey: "sofas", colorKey: "white", materialKey: "fabric", image: "/Images/Outdoor/bannerImage1.jpg" },
  { id: "p19", name: "Cloud", brand: "Poliform", designer: "Jean-Marie Massaud", categoryKey: "sofas", colorKey: "grey", materialKey: "fabric", image: "/Images/Outdoor/bannerImage2.jpg" },
  { id: "p20", name: "Botero", brand: "Minotti", designer: "Rodolfo Dordoni", categoryKey: "dining tables", colorKey: "brown", materialKey: "wood", image: "/Images/Outdoor/bannerImage3.jpg" },
  // Chandeliers — demonstrates the subcategory facet (round / oval / hanging).
  {
    id: "p21", name: "Taraxacum", brand: "Flos", designer: "Achille Castiglioni", categoryKey: "chandeliers", subCategoryKey: "round", colorKey: "white", materialKey: "metal",
    image: "/Images/Wohnen/bannerImage1.jpg", images: ["/Images/Wohnen/bannerImage1.jpg", "/Images/Accessories/bannerImageAccessories1.jpg", "/Images/Outdoor/bannerImage1.jpg"],
    dimensions: "Diameter: 60 cm · Height: 48 cm",
    colorOptions: ["white", "black"],
    details: {
      lightSource: "E27 LED bulb compatible, max 60W, warm white 2700K recommended.",
      dimmable: "Yes — compatible with standard trailing-edge dimmers.",
      material: "Spun aluminum diffuser over a powder-coated steel frame.",
      finish: "Available in White or matte Black.",
    },
  },
  { id: "p22", name: "Randoo", brand: "Flos", designer: "Ioana Vautrin", categoryKey: "chandeliers", subCategoryKey: "round", colorKey: "white", materialKey: "metal", image: "/Images/Wohnen/bannerImage2.jpg" },
  { id: "p23", name: "Arrangements", brand: "Flos", designer: "Michael Anastassiades", categoryKey: "chandeliers", subCategoryKey: "oval", colorKey: "black", materialKey: "metal", image: "/Images/Wohnen/bannerImage3.jpg" },
  { id: "p24", name: "Aim", brand: "Flos", designer: "Ronan & Erwan Bouroullec", categoryKey: "chandeliers", subCategoryKey: "hanging", colorKey: "black", materialKey: "metal", image: "/Images/Wohnen/bannerImage4.jpg" },
  // More beds — demonstrates the subcategory facet also applies here (single / double / box spring).
  { id: "p25", name: "Dorsoduro", brand: "Poliform", designer: "Carlo Colombo", categoryKey: "beds", subCategoryKey: "single", colorKey: "grey", materialKey: "fabric", image: "/Images/Wohnen/bannerImage5.jpg" },
  { id: "p26", name: "Tayo", brand: "Flexform", designer: "Antonio Citterio", categoryKey: "beds", subCategoryKey: "boxspring", colorKey: "beige", materialKey: "leather", image: "/Images/Wohnen/bannerImage6.jpg" },
  // Tréca Paris — demonstrates the `variants` spec table (Specifications /
  // Compositions / Finishes and Options) on the product detail page. Variant copy
  // is real manufacturer wording, currently English-only (not yet translated
  // de/fr/it) — shown as-is on every locale until translated content is supplied.
  {
    id: "p27",
    name: "Tréca Paris",
    brand: "Tréca Paris",
    designer: "",
    categoryKey: "beds",
    subCategoryKey: "mattress",
    colorKey: "sand",
    materialKey: "fabric",
    image: "/Images/Wohnen/bannerImage7.jpg",
    images: ["/Images/Wohnen/bannerImage7.jpg", "/Images/Arbeiten/bannerImageArbeiten1.jpg", "/Images/Kuche/bannerImageKuche1.jpg"],
    variants: [
      {
        name: "Tréca Paris Hommage",
        description: "Handcrafted luxury mattress blending tradition and modern comfort",
        specifications: "Height: 3.1 in",
        compositions: "Merino d'Arles wool, wool and camel wool, linen-silk-cashmere, and wool",
        finishes: "Embroideries and handles included",
      },
      {
        name: "Tréca Paris Vendôme",
        description: "Luxury handcrafted mattress with superior support and refined design",
        specifications: "Height: 11.4 in · Comfort: Dynamic · Tension: Medium, firm or extra-firm · Suspension: Air Spring® pocket spring and 2 layers of mini pocket-spring",
        compositions: "Wool and camel wool, wool and polyester, linen-silk-cashmere, and French wool",
        finishes: "Integral tufting, embroideries, handles and aerators",
      },
      {
        name: "Tréca Paris Vendôme (Box Spring)",
        description: "Luxury handcrafted mattress with superior support and refined design",
        specifications: "Height: 8.6 – 10.2 – 11.8 in (standard: 8.6 in) · Tension: Supple",
        compositions: "Spring and pine wood",
        finishes: "Traditional shell frame, quilted flat strip, choice of decorative fabric",
      },
    ],
  },
  // One example product per newly added brand/category — proves the
  // CATEGORY_DETAIL_FIELDS template holds up outside furniture too (lighting,
  // outdoor shade, heating, kitchens, doors, home fragrance). Real model names,
  // detail copy paraphrased from each brand's own published specifications.
  {
    id: "p28", name: "Louise", brand: "Brand van Egmond", designer: "Brand van Egmond", categoryKey: "lamps", colorKey: "gold", materialKey: "metal",
    image: "/Images/Outdoor/bannerImage4.jpg",
    details: {
      lightSource: "E27 bulb compatible, max 40W, warm white recommended.",
      dimmable: "Yes — compatible with standard dimmers.",
      material: "Hand-forged brass structure with hand-blown glass shade.",
      finish: "Available in Gold or Nickel finish.",
    },
  },
  {
    id: "p29", name: "Eclipsum", brand: "Umbrosa", designer: "", categoryKey: "parasols", colorKey: "sand", materialKey: "metal",
    image: "/Images/Outdoor/bannerImage5.jpg",
    details: {
      frame: "Naturally anodized aluminum mast and ribs.",
      canopy: "Premium solution-dyed acrylic (Sunbrella), tear- and UV-resistant.",
      mechanism: "Smooth tilt-and-rotation mechanism, central pole.",
      dimensions: "Diameter: 300 cm · Height: 250–290 cm (adjustable).",
    },
  },
  {
    id: "p30", name: "Dome", brand: "Heatsail", designer: "", categoryKey: "heaters", colorKey: "anthracite", materialKey: "metal",
    image: "/Images/Accessories/bannerImageAccessories2.jpg",
    details: {
      powerOutput: "1,500 W / 1,720 W, up to 3.22 kW far-infrared output.",
      coverage: "Comfortable warmth up to 5 m radius.",
      technology: "100% electric far-infrared heating with integrated LED lighting.",
      rating: "IP43, marine-grade stainless steel hood and frame.",
    },
  },
  // The old "p31" placeholder ("nx501", made-up spec copy) was removed here —
  // NEXT125_PRODUCTS below now includes the real nx501 with genuine Next125
  // copy, and the two shared the same id/category/name slug.
  {
    id: "p32", name: "Zenit", brand: "Rimadesio", designer: "Giuseppe Bavuso", categoryKey: "doors", colorKey: "anthracite", materialKey: "glass",
    image: "/Images/Kuche/bannerImageKuche3.jpg",
    details: {
      frame: "Wall-mounted aluminum structure, anodized finish.",
      panel: "Lacquered or transparent glass panels, 22 available colors.",
      finish: "Available in Bronze, Titanium or matte Black.",
      hardware: "Die-cast aluminum handles, magnetic closure.",
    },
  },
  {
    id: "p33", name: "Feathers", brand: "Baobab Collection", designer: "", categoryKey: "candles", colorKey: "white", materialKey: "wax",
    image: "/Images/Accessories/bannerImageAccessories3.jpg",
    details: {
      wax: "Refined mineral (paraffin-family) wax, hand-poured in multiple phases.",
      scent: "Floral olfactory family, crafted in Grasse, France.",
      burnTime: "MAX16: approx. 150 hours total burn time.",
      size: "16 cm diameter, 4 wicks, 2.2 kg.",
    },
  },
  ...BRAND_VAN_EGMOND_PRODUCTS,
  ...NEXT125_PRODUCTS,
  ...TRECA_PRODUCTS,
];

// The catalog for display: every manufacturer text field filtered (computed
// once, on first use). STATIC_SHOP_PRODUCTS above stays the raw source.
let filteredProducts = null;
export function getStaticShopProducts() {
  if (!filteredProducts) filteredProducts = STATIC_SHOP_PRODUCTS.map(filterManufacturerProduct);
  return filteredProducts;
}

// Distinct categories present in `products`, each with a product count and a
// representative image (the first product found in that category) — used to build
// the /produkte/shop category-hub grid and to validate a /produkte/shop/[category]
// slug. Order follows first appearance in the source list.
export function getShopCategories(products = STATIC_SHOP_PRODUCTS) {
  const byKey = new Map();
  for (const p of products) {
    if (!p.categoryKey) continue;
    const existing = byKey.get(p.categoryKey);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(p.categoryKey, { categoryKey: p.categoryKey, count: 1, image: p.image });
    }
  }
  return [...byKey.values()];
}
