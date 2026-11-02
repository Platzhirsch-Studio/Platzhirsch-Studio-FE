// tests/unit/shop-startseite-seite.test.mjs — Shop-Startseite /<locale>/accessoires (Seite + Komponenten):
// statisch je Sprache, buildPageMetadata, CollectionPage/ItemList ohne Offers,
// Händlersatz nur über den Claim-Guard, Server Components (Client-Budget).
// Run: node --test tests/unit/shop-startseite-seite.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    let file;
    if (specifier.startsWith("@/")) file = path.join(ROOT, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.includes("/src/") && !path.extname(specifier)) {
      file = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    } else return nextResolve(specifier, context);
    const cand = [file, `${file}.js`, path.join(file, "index.js")].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    return nextResolve(pathToFileURL(cand || `${file}.js`).href, context);
  },
});

const katalog = await import("../../src/lib/katalog/index.js");
const start = await import("../../src/lib/shop/shopStart.js");
const { startCopy } = await import("../../src/lib/shop/startCopy.js");
const { shopStartSchema } = await import("../../src/components/ShopStart/shopStartSchema.js");

const WELT = "accessoires";
const pfade = new Set(katalog.katalogPfade().map((e) => e.path));

test("Marken: genau die Marken mit Produkten, Händlersatz nur über den Claim-Guard", () => {
  const m = start.shopMarken();
  assert.deepEqual(m.map((x) => x.slug), katalog.markenMitProdukten(WELT).map((x) => x.slug));
  for (const x of m) assert.ok(pfade.has(x.href), x.href);
  const src = read("src/components/ShopStart/ShopStartseite.js");
  assert.match(src, /dealerStatementList\(/);
  assert.doesNotMatch(src, /Vertragshändler|Händler von|dealer of|revendeur|rivenditore/i);
});

test("JSON-LD: CollectionPage + ItemList der Kategorien, keine Offers/Ratings", () => {
  const gruppen = start.abteilungen().map((g) => ({ ...g, label: startCopy("en").abteilung[g.id] || g.id }));
  const ld = shopStartSchema({ locale: "en", name: "x", description: "y", gruppen });
  assert.equal(ld["@type"], "CollectionPage");
  assert.equal(ld.url, "https://platzhirsch.studio/en/accessoires");
  assert.equal(ld.mainEntity["@type"], "ItemList");
  assert.equal(ld.mainEntity.numberOfItems, gruppen.length);
  assert.equal(ld.mainEntity.itemListElement[0].url, `https://platzhirsch.studio/en${gruppen[0].href}`);
  assert.doesNotMatch(JSON.stringify(ld), /offers|aggregateRating|review|price/i);
  assert.equal(shopStartSchema({ locale: "de", name: "x", description: "y", gruppen: [] }).inLanguage, "de-AT");
});

test("Seite: statisch je Sprache, Metadaten mit Canonical/hreflang, Café-Bild nur mit Nachweis", () => {
  const page = read("src/app/[locale]/accessoires/page.js");
  assert.match(page, /dynamicParams = false/);
  assert.match(page, /revalidate = 86400/);
  assert.ok(page.includes("buildPageMetadata("));
  assert.match(page, /pathByLocale: SHOP_START_PATH/);
  assert.ok(page.includes("m.credit"), "Café-Foto nur mit Bildnachweis");
  assert.ok(page.includes("const mode = shopMode(process.env)") && page.includes("serviceLeiste(mode, LAENDER, locale)") && page.includes("mode={mode}"), "Serviceleiste und Kachel-Badges aus demselben Shop-Modus");
});

test("Komponenten: Server Components, Shop-Texte nicht in src/messages", () => {
  for (const l of LOCALES) assert.doesNotMatch(read(`src/messages/${l}.json`), /"navTitle"|"editTischLead"/);
  for (const f of ["ShopStartseite.js", "ServiceLeiste.js", "shopStartSchema.js"]) assert.doesNotMatch(read(`src/components/ShopStart/${f}`), /^"use client"/, f);
  const src = read("src/components/ShopStart/ShopStartseite.js");
  assert.match(src, /fetchPriority="high"/, "LCP-Bild priorisiert");
  assert.match(src, /object-contain/, "Herstellerbild unbeschnitten");
  assert.ok(src.includes("bildVon(hero.markeName)"), "Bildnachweis");
  assert.match(src, /<ShopKachel /, "gleiche Kachel wie Liste und Produktseite (Preise über shopIndex/preisAktiv)");
  assert.ok(src.includes("eintragVon(p, kachelOpts)"), "Kachel-Daten aus eintragVon (Badges je Shop-Modus)");
  // Optik-QA r3: Spalten per Container-Query (RASTER_4: 1 / 2 / 4) – bei 200 % Textzoom einspaltig.
  assert.match(src, /grid \$\{RASTER_4\}/, "Edits mobil zweispaltig wie die Listen");
  assert.match(read("src/components/Katalog/ShopKachel.js"), /RASTER_4 = "grid-cols-1 @min-\[17rem\]:grid-cols-2 @min-\[40rem\]:grid-cols-4"/);
});
