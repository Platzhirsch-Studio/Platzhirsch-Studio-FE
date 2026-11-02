// R4-produkt (masterplan AP4 rest): dimension table + QuantitativeValue in the
// Product JSON-LD, manufacturer downloads (pdf_produkte, link only,
// file_download), category aliases, raw data without superlatives, mobile
// order of the product head, stage image quality, IT fallback sentence,
// brand × category breadcrumb.
// Run: node --test tests/unit/r4-produkt.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  dimensionsJsonLd,
  dimensionsSummaryMap,
  formatDimensionRows,
  parseDimensionTable,
  parseWeight,
} from "../../src/lib/shop/dimensions.js";
import { extractDownloads } from "../../src/lib/shop/downloads.js";
import { CATEGORY_ALIASES, categoryAlias } from "../../src/lib/shop/categoryAliases.js";
import { findClaims, toBrandSlug } from "../../src/lib/legal/claims.js";
import { BRAND_VAN_EGMOND_PRODUCTS } from "../../src/lib/data/importedProducts/brandVanEgmond.js";
import { NEXT125_PRODUCTS } from "../../src/lib/data/importedProducts/next125.js";
import { TRECA_PRODUCTS } from "../../src/lib/data/importedProducts/treca.js";
import { brandCategoryHref, buildBrandCategories, indexableBrandCategoryHref } from "../../src/lib/marken/brandCategory.js";

const read = (rel) => fs.readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");
const cm = (value) => ({ "@type": "QuantitativeValue", value, unitCode: "CMT", unitText: "cm" });

// ------------------------------------------------------------ dimensions

// Real backoffice formats (survey of all 1,765 products, 26.10.2026).
test("1 Maße: beschriftete Formate werden Tabelle und JSON-LD", () => {
  const cases = [
    ["W. 242 | D. 98 | H. 74 | SD. 60 | SW. 200 | SH. 40 | AH. 60 cm", { width: cm(242), depth: cm(98), height: cm(74) }, 7],
    ["Width: 242 cm · Depth: 98 cm · Height: 74 cm · Seat height: 40 cm", { width: cm(242), depth: cm(98), height: cm(74) }, 4],
    ["Length: 200 cm · Width: 90 cm · Height: 35 cm", { width: cm(90), height: cm(35) }, 3],
    ["Diameter: 40 cm · Height: 60 cm", { height: cm(60) }, 2],
    ["Ø 40 | H. 60 cm", { height: cm(60) }, 2],
    ["B 120 cm, T 80 cm, H 75 cm", { width: cm(120), depth: cm(80), height: cm(75) }, 3],
    ["B 120 x T 80 x H 75 cm", { width: cm(120), depth: cm(80), height: cm(75) }, 3],
    ["W 30 x D 20 cm (W 11.8 x D 7.9 in)", { width: cm(30), depth: cm(20) }, 2],
    ["Height : 70 cm | 28in", { height: cm(70) }, 1],
  ];
  for (const [raw, ld, rows] of cases) {
    const t = parseDimensionTable(raw);
    assert.ok(t, raw);
    assert.equal(t.rows.length, rows, raw);
    assert.deepEqual(dimensionsJsonLd(t), ld, raw);
  }
});

test("2 Maße: mm → cm exakt, Gewicht in kg (KGM), Text-Felder bleiben Text", () => {
  const t = parseDimensionTable("Gewicht (kg): 3.2 | Breite (mm): 450 | Länge (mm): 300 | Höhe (mm): 1200 | Kabellänge (mm): 2000 | Kabelfarbe: Black");
  assert.deepEqual(dimensionsJsonLd(t), {
    width: cm(45),
    height: cm(120),
    weight: { "@type": "QuantitativeValue", value: 3.2, unitCode: "KGM", unitText: "kg" },
  });
  assert.deepEqual(t.rows.find((r) => r.key === "cable colour"), { key: "cable colour", text: "Black", group: null });
  assert.deepEqual(parseWeight("3.3 kg"), { value: 3.3, unit: "kg" });
  assert.equal(parseWeight("ca. 3 kg"), null);
});

test("3 Maße: nichts erfinden – unbeschriftet, abgeschnitten oder unlesbar → Rohtext (null)", () => {
  for (const raw of [
    "220 x 98 x 74 cm", // order not stated
    "67 x 51 cm",
    "Ø 40 x 60 cm",
    "28 × 20 × 30 in",
    "Alle Maße in cm – siehe Maßzeichnung",
    "Maße/Konfigurationen: siehe technisches Produktdatenblatt (PDF) unter Downloads",
    "Kopfteil Victoire – Höhe: 100 cm | Kopfteil Victoire – Breite: Nennmaße + 27 cm | Füße Victoire – Höhe von…", // truncated in the backoffice
    "H 35 cm, 99 x 99 cm", // half labelled
    "",
    null,
  ]) {
    assert.equal(parseDimensionTable(raw), null, String(raw));
    assert.deepEqual(dimensionsJsonLd(parseDimensionTable(raw)), {});
  }
});

test("4 Maße: Varianten und Bauteile sind Gruppen und kommen nie ins JSON-LD", () => {
  const sizes = parseDimensionTable("S: L. 120 | W. 80 | H. 40 cm / L: L. 160 | W. 90 | H. 40 cm");
  assert.deepEqual([...new Set(sizes.rows.map((r) => r.group))], ["S", "L"]);
  assert.deepEqual(dimensionsJsonLd(sizes), {});
  assert.equal(dimensionsSummaryMap(sizes), null);

  // Lamp with shade: lamp-level width/height count, the shade's height not.
  const lamp = parseDimensionTable("W. 30 | max W. 40 | H. 50 cm / Shade: Bottom Ø 20 | Top Ø 15 | H. 25 cm");
  assert.deepEqual(dimensionsJsonLd(lamp), { width: cm(30), height: cm(50) });
  assert.deepEqual(
    lamp.rows.map((r) => r.key),
    ["width", "max width", "height", "bottom diameter", "top diameter", "height"]
  );

  const bed = parseDimensionTable("Club – Höhe: 120 cm | Club – Breite: Nennmaß + 24 cm | Club – Stärke: 20 cm");
  assert.deepEqual(bed.rows[1], { key: "width", unit: "cm", nominalPlus: 24, group: "Club" });
  assert.deepEqual(dimensionsJsonLd(bed), {});
  const list = parseDimensionTable("Moderne – Höhe: 71, 91, 101 oder 121 cm | Moderne – Stärke: 9,5 cm");
  assert.deepEqual(list.rows[0].values, [71, 91, 101, 121]);
  assert.equal(list.rows[1].value, 9.5);

  const note = parseDimensionTable("L. 200 | W. 300 cm | dimensions may vary by up to 5%");
  assert.deepEqual(note.notes, ["dimensions may vary by up to 5%"]);
});

test("5 Maße: Formatierung nach Sprache, Qualifier übersetzt", () => {
  const tc = (key, v) => (key === "atelier.dimQualifier.max" ? `${v.label} max.` : key === "atelier.dimNominalPlus" ? `Nennmaß + ${v.n} cm` : key);
  const dimLabel = (k) => ({ width: "Breite", depth: "Tiefe", height: "Höhe" })[k] || k;
  const rows = formatDimensionRows(parseDimensionTable("W. 15 | max W. 20.5 | D. 12.5 | H. 52 cm"), "de", tc, dimLabel);
  assert.deepEqual(rows, [
    { group: null, label: "Breite", value: "15 cm" },
    { group: null, label: "Breite max.", value: "20,5 cm" },
    { group: null, label: "Tiefe", value: "12,5 cm" },
    { group: null, label: "Höhe", value: "52 cm" },
  ]);
  assert.equal(formatDimensionRows(parseDimensionTable("D. 12.5 cm"), "en", tc, dimLabel)[0].value, "12.5 cm");
  assert.equal(formatDimensionRows(null, "de", tc, dimLabel), null);
});

test("6 Maße: Abdeckung auf den echten Formaten (Fixture) und Seite verdrahtet", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  // Runde 2 (seo P1-5): measures go into productSchema (ItemPage + Thing, as text).
  assert.match(page, /productSchema\(\{[\s\S]{0,300}measures,/);
  assert.match(page, /dimensionsJsonLd\(dimTable\)/);
  assert.doesNotMatch(page, /\boffers\s*:|"offers"|priceCurrency/, "kein offers, keine Preise");
  const tabs = read("src/components/ShopCatalog/productInfoTabs.js");
  assert.match(tabs, /<th scope="row"/);
  assert.match(tabs, /<caption className="sr-only">/);
});

// ------------------------------------------------------------- downloads

const tcDl = (key, v) =>
  ({
    "atelier.download2d": "Produktdatenblatt",
    "atelier.download3d": "3D-Daten",
    "atelier.downloadKatalog": "Katalog",
  })[key] ?? (key === "atelier.downloadFile" ? `${v.name} (PDF)` : key);

test("7 Downloads: Spalten 2d/3d/katalog, nur PDF, über /cmx verlinkt, ohne Doppel", () => {
  const detail = {
    pdf_produkte: [
      { "2d": "/files/ClassiCon-Wendingen-Rug-Product-Sheet.pdf", "3d": null, katalog: "/files/ClassiCon-katalog.pdf" },
      { "2d": null, "3d": "/files/model.dwg", katalog: "/files/ClassiCon-Brochure-Eileen-Gray-Rug-Collection.pdf" },
      { "2d": "/files/ClassiCon-Wendingen-Rug-Product-Sheet.pdf", "3d": null, katalog: null },
    ],
  };
  assert.deepEqual(extractDownloads(detail, tcDl), [
    { href: "/cmx/files/ClassiCon-Wendingen-Rug-Product-Sheet.pdf", fileName: "ClassiCon-Wendingen-Rug-Product-Sheet.pdf", label: "Produktdatenblatt (PDF)" },
    { href: "/cmx/files/ClassiCon-katalog.pdf", fileName: "ClassiCon-katalog.pdf", label: "Katalog: ClassiCon (PDF)" },
    {
      href: "/cmx/files/ClassiCon-Brochure-Eileen-Gray-Rug-Collection.pdf",
      fileName: "ClassiCon-Brochure-Eileen-Gray-Rug-Collection.pdf",
      label: "Katalog: ClassiCon Brochure Eileen Gray Rug Collection (PDF)",
    },
  ]);
  // Older row shape: any .pdf field, title field names it.
  assert.deepEqual(extractDownloads({ pdf_produkte: [{ datei: "/files/a_b.pdf", titel: "Pflegehinweise" }] }, tcDl), [
    { href: "/cmx/files/a_b.pdf", fileName: "a_b.pdf", label: "Pflegehinweise (PDF)" },
  ]);
  assert.deepEqual(extractDownloads({ pdf_produkte: [] }, tcDl), []);
  assert.deepEqual(extractDownloads(null, tcDl), []);
});

test("8 Downloads: Klick meldet file_download über trackEvent, Planungsdaten-Knopf mit Betreff", () => {
  const list = read("src/components/ShopCatalog/downloadList.js");
  assert.match(list, /^"use client";/);
  assert.match(list, /import \{ trackEvent \} from "@\/lib\/analytics";/);
  assert.match(list, /trackEvent\("file_download", \{/);
  assert.doesNotMatch(list, /download=/, "nur verlinken");
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  // Runde 4 P5 (ux P2-2): bewusst geändert – gleiches Format wie der Header-Link
  // (withContext + cleanText), Produkttext = H1 „Marke Name“.
  assert.match(page, /planningRequest = \{\s*href: withContext\(beratungBase, \{ produkt: cleanText\(`\$\{productHeading\} – \$\{tc\("atelier\.planningSubject"\)\}`, 120\) \}\)/);
  const msgs = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r4-produkt.json"));
  for (const l of ["de", "en", "fr", "it"]) {
    for (const k of ["planningCta", "planningSubject", "planningText", "download2d", "downloadKatalog", "downloadsNone", "newTab", "dimensionsCaption", "dimensionsUnlabelled"]) {
      assert.ok(msgs[l].shop.atelier[k], `${l}.${k}`);
    }
  }
});

// --------------------------------------------------------------- aliases

// The 31 category slugs with products (backoffice, 26.10.2026).
const LIVE_CATEGORIES = [
  "sofas-couches", "armchairs-stools", "coffee-tables", "dining-tables", "side-tables", "rugs", "dining-chairs", "beds", "mirrors",
  "sideboards-chests", "night-tables", "decor", "small-furniture", "shelves", "kitchen-accessories", "chaise-longues-daybeds", "lamps",
  "bedwear", "bar-stools", "garden-tables", "display-cabinets", "parasols", "kitchen", "wardrobes", "lounge-furniture-daybeds",
  "sun-loungers", "garden-chairs", "tv-low-units", "desk-chairs", "heaters", "candles",
];

test("9 Kategorie-Aliase: nur eindeutige Wortteile, Ziel existiert, kein echter Kategorie-Slug", () => {
  assert.equal(categoryAlias("sofas"), "sofas-couches");
  for (const [alias, target] of Object.entries(CATEGORY_ALIASES)) {
    assert.ok(LIVE_CATEGORIES.includes(target), `${alias} → ${target}`);
    assert.ok(!LIVE_CATEGORIES.includes(alias), `${alias} ist selbst Kategorie`);
    const matches = LIVE_CATEGORIES.filter((c) => `-${c}-`.includes(`-${alias}-`));
    assert.deepEqual(matches, [target], `${alias} mehrdeutig: ${matches}`);
  }
  for (const ambiguous of ["stools", "daybeds", "tables", "chairs"]) assert.equal(categoryAlias(ambiguous), null);
  const page = read("src/app/[locale]/produkte/[category]/page.js");
  assert.match(page, /if \(alias && \(await resolveCategory\(locale, alias\)\)\) \{\s*permanentRedirect\(/);
  assert.doesNotMatch(read("next.config.js"), /produkte\/sofas"/);
});

// --------------------------------------------------- raw data superlatives

test("10 Rohdaten ohne Superlative (check:claims-Wortliste) in brandVanEgmond, treca, next125, staticShopProducts", () => {
  const texts = (value, out = []) => {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach((v) => texts(v, out));
    else if (value && typeof value === "object") Object.values(value).forEach((v) => texts(v, out));
    return out;
  };
  for (const p of [...BRAND_VAN_EGMOND_PRODUCTS, ...NEXT125_PRODUCTS, ...TRECA_PRODUCTS]) {
    for (const t of texts(p)) assert.deepEqual(findClaims(t, { brandSlug: toBrandSlug(p.brand), brands: [p.brand] }), [], `${p.id}: ${t.slice(0, 100)}`);
  }
  const extra = /\b(unique|perfect(ly)?|ultimate|unrivall?ed|unparalleled|finest|utmost|the only one|most (respected|acclaimed|iconic|prestigious|precious|exquisite|exceptional|eccentric)|world'?s leading|leading (name|architects|italian))\b/i;
  for (const file of ["importedProducts/brandVanEgmond.js", "importedProducts/treca.js", "importedProducts/next125.js", "staticShopProducts.js"]) {
    const src = read(`src/lib/data/${file}`)
      .split("\n")
      .filter((l) => !/^\s*\/\//.test(l))
      .join("\n");
    assert.doesNotMatch(src, extra, file);
  }
  // The render filter stays (second line of defence).
  assert.match(read("src/lib/data/staticShopProducts.js"), /from "\.\.\/shop\/manufacturerText\.js"/);
});

// ------------------------------------------------- page: head, image, IT

test("11 Produktkopf mobil: H1 vor der Galerie im DOM, Primärknopf direkt danach", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  const h1 = page.indexOf('<Heading id="product-title" level={1}');
  const gallery = page.indexOf("<ProductGallery");
  const actions = page.indexOf("<ProductActions");
  assert.ok(h1 > 0 && h1 < gallery && gallery < actions, "Reihenfolge H1 → Galerie → Aktionen");
  // QM wm-r4: Spalten über den Seiten-Container (rem → bei 200 % Text einspaltig).
  assert.match(page, /@5xl\/page:col-start-8 @5xl\/page:row-start-1/);
  const gallerySrc = read("src/components/ShopCatalog/productGallery.js");
  assert.match(gallerySrc, /const STAGE_QUALITY = 75;/);
  assert.match(gallerySrc, /hidden gap-2 overflow-x-auto pb-1 sm:flex/);
});

test("12 IT-Satz und Brotkrume Marke × Kategorie", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  // R9-P5 (recht P1-1): IT is "voi" throughout like it.json — no Lei, no tu.
  assert.match(page, /Vi offriamo consulenza su questo pezzo/);
  assert.match(page, /lo progettiamo per il vostro spazio/);
  assert.doesNotMatch(page, /Le offriamo|il Suo spazio|\bLei\b/);
  // R5-produkt: the crumb goes through the shared loader (src/lib/marken owns the rule).
  assert.match(page, /import \{ getIndexableBrandCategoryHref \} from "@\/lib\/marken\/brandCategoryLoader";/);
  // Only indexable combinations get a crumb.
  // Runde 4 P5: indexable from 4 models (own name + image).
  const img = (s) => ({ produkt_name: `Sofa ${s}`, bild_anhangen: [{ bild_anhangen: `/files/${s}.webp` }] });
  const rows = ["a", "b", "c", "d"].map((s) => ({ marken: "Minotti", kategories: "sofas-couches", path_field: `sofa-${s}`, status: "Aktiv", ...img(s) }));
  const [summary] = buildBrandCategories([...rows, { marken: "Minotti", kategories: "beds", path_field: "bed-a", status: "Aktiv" }]);
  const sofas = summary.categories.find((c) => c.slug === "sofas-couches");
  const beds = summary.categories.find((c) => c.slug === "beds");
  assert.equal(sofas.indexable, true);
  assert.equal(beds.indexable, false);
  assert.equal(brandCategoryHref("Minotti", sofas, "de"), "/ueber-uns/marken/minotti/sofas-couches");
  assert.equal(indexableBrandCategoryHref(summary.categories, "Minotti", "sofas-couches", "de"), "/ueber-uns/marken/minotti/sofas-couches");
  assert.equal(indexableBrandCategoryHref(summary.categories, "Minotti", "beds", "de"), null);
});

// ------------------------------------------------- QM-Fix (feedback R4-produkt)

test("13 Fix P2-1: Telefon – kompakte Brotkrume, Bühne max. 28svh, Knopf im ersten Bildschirm", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /<Breadcrumbs items=\{crumbs\.slice\(-2\)\} className="sm:hidden" \/>/);
  assert.match(page, /<Breadcrumbs items=\{crumbs\} className="max-sm:hidden" \/>/);
  const gallery = read("src/components/ShopCatalog/productGallery.js");
  assert.match(gallery, /aspect-\[3\/2\] min-w-0 shrink-0 grow-0 basis-full max-sm:max-h-\[28svh\]/);
});

test("14 Fix P2-4/P3: IT duzt (R5), sr-Zusatz ohne doppeltes PDF, Hinweis bei Maßen ohne Achsen", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.doesNotMatch(page, /Le offriamo|il Suo spazio/);
  assert.match(page, /\? \[tc\("atelier\.dimensionsUnlabelled"\)\]/);
  // R5-i18n: messages-r4-produkt.json is taken over; the live source is src/messages.
  const msgs = Object.fromEntries(["de", "en", "fr", "it"].map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
  for (const l of ["de", "en", "fr", "it"]) {
    assert.doesNotMatch(msgs[l].shop.atelier.newTab, /PDF/, `${l}.newTab`);
  }
  assert.doesNotMatch(JSON.stringify(msgs.it.shop.atelier), /\b(Lei|Le offriamo|La preghiamo|Suo|Sua|Suoi)\b/);
});
