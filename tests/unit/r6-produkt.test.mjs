// R6-produkt-perf: catalogue and product page hydrate less (TBT ≤ 200 ms
// mobile), the catalogue keeps its URL state, links stay in the HTML, prices
// stay "on request", products without a photo keep the neutral surface and a
// JSON-LD without image, a backoffice timeout still ends in error.js.
// Run: node --test tests/unit/r6-produkt.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  MAX_PAGE,
  PAGE_PARAM,
  PRODUCTS_PER_PAGE,
  buildQuery,
  emptySelection,
  pageFromQuery,
  queryObject,
  selectionFromQuery,
} from "../../src/lib/shop/catalogQuery.js";
import { fetchProduktDetail } from "../../src/lib/api/produktDetail.js";
import { BackofficeError } from "../../src/lib/api/http.js";

const read = (rel) => fs.readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");
const exists = (rel) => fs.existsSync(new URL(`../../${rel}`, import.meta.url));

const GROUPS = [
  { key: "brand", param: "marke", options: [{ value: "Minotti" }, { value: "Flos" }, { value: "Brand van Egmond" }] },
  { key: "subCategory", param: "typ", options: [{ value: "modulsofa" }, { value: "Ecksofa" }] },
];
const ALL = [...GROUPS, { key: "designer", param: "designer" }];

// ------------------------------------------------------------- URL state

test("1 URL → Auswahl: Slugs, mehrere Werte, unbekannte Werte fallen weg", () => {
  const s = selectionFromQuery(queryObject("?marke=minotti,brand-van-egmond,gibts-nicht&typ=ecksofa&utm_source=x"), GROUPS, ALL);
  assert.deepEqual([...s.brand].sort(), ["Brand van Egmond", "Minotti"]);
  assert.deepEqual([...s.subCategory], ["Ecksofa"]);
  // Groups without options (designer here) still get their empty Set.
  assert.deepEqual([...s.designer], []);
  assert.deepEqual(Object.keys(emptySelection(ALL)), ["brand", "subCategory", "designer"]);
});

test("2 ?seite: 1 … 50, alles andere 1", () => {
  assert.equal(PAGE_PARAM, "seite");
  assert.equal(PRODUCTS_PER_PAGE, 24);
  for (const [q, n] of [["", 1], ["seite=2", 2], ["seite=0", 1], ["seite=-3", 1], ["seite=abc", 1], ["seite=9999", MAX_PAGE]]) {
    assert.equal(pageFromQuery(queryObject(q)), n, q);
  }
});

test("3 Auswahl → Query: sortiert, Kommas lesbar, fremde Parameter bleiben, Seite 1 ohne Parameter", () => {
  const sel = { brand: new Set(["Minotti", "Brand van Egmond"]), subCategory: new Set() };
  assert.equal(buildQuery("?utm_source=x&marke=alt", GROUPS, sel, 3), "?utm_source=x&marke=brand-van-egmond,minotti&seite=3");
  assert.equal(buildQuery("", GROUPS, { brand: new Set(), subCategory: new Set() }, 1), "");
  // Round trip.
  const back = selectionFromQuery(queryObject(buildQuery("", GROUPS, sel, 2)), GROUPS, ALL);
  assert.deepEqual([...back.brand].sort(), ["Brand van Egmond", "Minotti"]);
});

// ------------------------------------------------------------- hydration cost

test("3b Katalog-Nutzlast ohne leere Felder (compactShopProduct)", () => {
  const src = read("src/lib/shop/shopProducts.js");
  assert.match(src, /export function compactShopProduct\(p\)/);
  assert.match(src, /value == null \|\| value === "" \|\| \(Array\.isArray\(value\) && value\.length === 0\)/);
  // Every optional field is read with a fallback in the catalogue.
  const catalog = read("src/components/ShopCatalog/shopCatalog.js");
  for (const k of ["subCategoryKeys", "materialKeys", "colorKeys"]) assert.match(catalog, new RegExp(`p\\.${k} \\|\\| \\[\\]`), k);
});

test("3c Keine <Suspense> um Seiteninhalt (React 19 lagert große Grenzen aus <main> aus, ohne JS leer)", () => {
  for (const rel of [
    "src/app/[locale]/produkte/page.js",
    "src/app/[locale]/produkte/[category]/page.js",
    "src/app/[locale]/produkte/[category]/[product]/page.js",
    "src/components/MarkenItems/markenitems.js",
    "src/components/BrandCategory/BrandCategoryPage.js",
  ]) {
    assert.doesNotMatch(read(rel), /<Suspense[\s>]|import \{ Suspense \}/, rel);
  }
});

test("4 Katalog: kein Suspense/useSearchParams-Bailout, Query über useSyncExternalStore (Server-Snapshot leer)", () => {
  const page = read("src/app/[locale]/produkte/[category]/page.js");
  assert.doesNotMatch(page, /ShopCatalogFromUrl|useSearchParams\(/);
  // The catalogue sits directly in the page, no boundary, no fallback catalogue.
  assert.match(page, /\n\s*<ShopCatalog \{\.\.\.catalogProps\} \/>/);
  assert.match(page, /products: products\.map\(compactShopProduct\)/);
  assert.equal(exists("src/components/ShopCatalog/shopCatalogFromUrl.js"), false);
  const catalog = read("src/components/ShopCatalog/shopCatalog.js");
  assert.doesNotMatch(catalog, /useSearchParams\(|usePathname\(/);
  assert.match(catalog, /useSyncExternalStore\(noSubscribe, readSearch, serverSearch\)/);
  assert.match(catalog, /const serverSearch = \(\) => "";/);
  // State written back with replaceState only after an own change.
  assert.match(catalog, /if \(!own\) return;/);
  assert.match(catalog, /window\.history\.replaceState\(/);
  // Real "?seite=n+1" link stays.
  assert.match(catalog, /href=\{nextPageHref\}/);
});

test("5 Filterblatt: eigener Chunk, erst beim ersten Öffnen gemountet, Vorladen bei Hover/Fokus", () => {
  const catalog = read("src/components/ShopCatalog/shopCatalog.js");
  assert.match(catalog, /const FilterSheet = dynamic\(loadFilterSheet, \{ ssr: false \}\);/);
  assert.match(catalog, /\{groups\.length > 0 && sheetRequest && \(\s*<FilterSheet/);
  assert.match(catalog, /onPointerOver=\{warmFilters\} onFocus=\{warmFilters\}/);
  assert.doesNotMatch(catalog, /type="checkbox"|<dialog\s/);
  const sheet = read("src/components/ShopCatalog/filterSheet.js");
  assert.match(sheet, /^"use client";/);
  assert.match(sheet, /dialog\.showModal\(\)/);
  assert.match(sheet, /type="checkbox"/);
  assert.match(sheet, /aria-labelledby="catalog-filter-title"/);
});

test("6 Kacheln ohne Client-Komponente je Foto/Link: getImageProps-<img>, <a href=/{locale}…>, delegierte Navigation", () => {
  const img = read("src/components/ShopCatalog/tileImage.js");
  assert.match(img, /import \{ getImageProps \} from "next\/image";/);
  assert.match(img, /fill: true/);
  assert.doesNotMatch(img, /"use client"/);
  for (const rel of ["src/components/ShopCatalog/catalogTile.js", "src/components/MarkenItems/brandTile.js"]) {
    const src = read(rel);
    assert.doesNotMatch(src, /from "next\/image"|from "@\/i18n\/navigation"|"use client"/, rel);
    assert.match(src, /TileImage/, rel);
  }
  assert.match(read("src/components/ShopCatalog/catalogTile.js"), /href=\{`\/\$\{locale\}\$\{href\}`\}/);
  // Containers delegate clicks/prefetch with one listener.
  assert.match(read("src/components/ShopCatalog/shopCatalog.js"), /\{\.\.\.delegate\}/);
  assert.match(read("src/app/[locale]/produkte/[category]/[product]/page.js"), /<LinkDelegate as="ul"/);
  assert.match(read("src/components/ShopCatalog/shopCategoryGrid.js"), /<Container as=\{LinkDelegate\}/);
  assert.match(read("src/components/MarkenItems/markenitems.js"), /<LinkDelegate className="bg-surface text-text">/);
  assert.match(read("src/components/BrandCategory/BrandCategoryPage.js"), /<LinkDelegate className="bg-surface text-text">/);
  for (const rel of ["src/components/MarkenItems/markenitems.js", "src/components/BrandCategory/BrandCategoryPage.js"]) {
    assert.doesNotMatch(read(rel), /<ProductCard|<SmartLink|<Link\b/, rel);
  }
  // The hub keeps the preload of its first (LCP) picture as <Image>.
  assert.match(read("src/components/ShopCatalog/shopCategoryGrid.js"), /sectionIndex === 0 && tileIndex === 0 \? \(\s*<Image/);
});

test("7 Kollektionen auf der Produktseite: natives Scroll-Snap statt Embla, reduced motion springt", () => {
  const slider = read("src/components/ShopCatalog/collectionSlider.js");
  assert.doesNotMatch(slider, /from "embla-carousel-react"|useEmblaCarousel/);
  assert.match(slider, /snap-x snap-mandatory overflow-x-auto/);
  assert.match(slider, /behavior: prefersReducedMotion\(\) \? "auto" : "smooth"/);
  assert.match(slider, /disabled=\{!canPrev\}/);
  // Gallery stays as in R5 (no Embla, lightbox lazy).
  const gallery = read("src/components/ShopCatalog/productGallery.js");
  assert.doesNotMatch(gallery, /useEmblaCarousel/);
  assert.match(gallery, /const ProductLightbox = dynamic\(loadLightbox, \{ ssr: false \}\);/);
});

// ------------------------------------------------------------- unchanged contracts

test("8 „Catalogo prodotti“ (IT, Kleinschreibung), keine Großschreibung mehr", () => {
  const hub = read("src/app/[locale]/produkte/page.js");
  assert.match(hub, /case "it": return "Catalogo prodotti";/);
  assert.doesNotMatch(hub, /Catalogo Prodotti/);
});

test("9 Preise bleiben „auf Anfrage“, kein offers/Preis im Produkt-JSON-LD", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /value: tc\("atelier\.priceValue"\)/);
  assert.doesNotMatch(page, /"offers"|offers:|priceCurrency|"price":/);
  const msg = { de: /^Auf Anfrage/, en: /^On request/, fr: /^Sur demande/, it: /^Su richiesta/ };
  for (const [locale, re] of Object.entries(msg)) {
    const m = JSON.parse(read(`src/messages/${locale}.json`));
    assert.match(m.shop.atelier.priceValue, re, locale);
  }
});

test("10 Ohne Foto: neutrale Fläche bleibt, JSON-LD ohne image, kein Fremdfoto", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /<NoPhoto\s+label=\{noPhotoLabel\(locale, t\)\}/);
  const tile = read("src/components/ShopCatalog/catalogTile.js");
  assert.match(tile, /<NoPhoto label=\{noPhotoText \|\| noPhotoLabel\(locale\)\} className="absolute inset-0" \/>/);
  for (const rel of ["src/components/ShopCatalog/catalogTile.js", "src/components/ShopCatalog/shopCatalog.js", "src/components/MarkenItems/brandTile.js"]) {
    assert.doesNotMatch(read(rel), /fallback-banner|aboutHome/, rel);
  }
  assert.match(read("src/lib/seo/structuredData.js"), /\.\.\.\(images\.length \? \{ image: images \} : \{\}\)/);
});

test("11 Timeout/5xx → BackofficeError (error.js), nicht null (404)", async () => {
  const url = "https://backoffice.example/api/method/x?path_field=y&lang=de";
  const timeout = Object.assign(new Error("aborted"), { name: "TimeoutError" });
  await assert.rejects(
    fetchProduktDetail(url, {
      fetcher: async () => {
        throw timeout;
      },
    }),
    (e) => e instanceof BackofficeError
  );
  await assert.rejects(fetchProduktDetail(url, { fetcher: async () => new Response("x", { status: 503 }) }), (e) => e instanceof BackofficeError);
  assert.equal(await fetchProduktDetail(url, { fetcher: async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } }) }), null);
});
