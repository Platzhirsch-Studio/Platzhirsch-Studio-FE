// tests/unit/shop-liste-pdp-quelltext.test.mjs — Quelltext-Regeln der Shop-Liste
// und Shop-Produktseite (Accessoire-Welt): Händlersatz nur über den Claim-Guard,
// Herstellerbilder unverändert, keine Bewertungen/Lagerangaben im JSON-LD,
// Client-Inseln ohne Server-Module (Preise/Modus/Katalogdaten).
// Run: node --test tests/unit/shop-liste-pdp-quelltext.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const K = "src/components/Katalog";

test("Händlersatz nur über dealerStatement und nur bei marke.dealer", () => {
  for (const f of ["AccessoiresListe.js", "ShopProduktDetail.js"]) {
    const src = read(`${K}/${f}`);
    assert.match(src, /dealerStatement\(marke\.name, locale\)/, f);
    assert.match(src, /marke\.dealer \?|marke\?\.dealer \?/, f);
    const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/marke\??\.dealer|dealerStatement|dealerLine|data-kat-dealer/g, "");
    assert.doesNotMatch(code, /händler|dealer|revendeur|rivenditore/i, f);
  }
});

test("Herstellerbilder unverändert: Kachelbild object-contain, nur das Hover-Raumbild object-cover; Bildquelle sichtbar", () => {
  for (const f of ["ShopKachel.js", "ZuletztAngesehen.js"]) {
    const src = read(`${K}/${f}`);
    assert.match(src, /object-contain/, f);
    // Optik-QA r2: das Hover-Bild ist ein Raumbild (kachelBilder) und füllt den Rahmen per CSS-Beschnitt
    // (wie die Markenseiten, QM wm-fix3) – das Kachelbild selbst bleibt unbeschnitten.
    const code = src.replace(/^\s*\/\/.*$/gm, "");
    assert.equal((code.match(/object-cover/g) || []).length, f === "ShopKachel.js" ? 1 : 0, f);
    if (f === "ShopKachel.js") assert.ok(src.includes("className={`hidden object-cover opacity-0"), "nur das Hover-Bild");
    assert.match(src, /TileImage/, f); // TileImage setzt data-pin-nopin
  }
  const pdp = read(`${K}/ShopProduktDetail.js`);
  assert.match(pdp, /produkt\.bildQuelle/);
  assert.match(pdp, /ProductGallery/);
});

test("JSON-LD: Offer nur über preisOffer (pausiert → null), nie Bewertung/Lagerstand", () => {
  const pdp = read(`${K}/ShopProduktDetail.js`).replace(/^\s*\/\/.*$/gm, "");
  assert.match(pdp, /preisOffer\(preis,/);
  assert.match(pdp, /anzeigePreis\(p\)/);
  assert.doesNotMatch(pdp, /aggregateRating|"review"|availability|InStock|ratingValue/);
});

test("Client-Inseln laden keine Server-Module (Preise, Modus, Katalogdaten)", () => {
  for (const f of ["ShopGrid.js", "KaufBox.js", "ZuletztAngesehen.js", "ShopKachel.js"]) {
    const src = read(`${K}/${f}`);
    assert.doesNotMatch(src, /lib\/shop\/(mode|handlers|server|catalog|cart|copy)["']/, f);
    assert.doesNotMatch(src, /lib\/katalog["']|lib\/katalog\/(index|shopIndex|schema)["']/, f);
    assert.doesNotMatch(src, /useTranslations\(["']katalog["']\)/, f);
  }
  assert.match(read(`${K}/ShopGrid.js`), /^"use client";/);
  assert.match(read(`${K}/KaufBox.js`), /^"use client";/);
  // Warenkorb bekommt weiterhin nur slug/variante/menge (Preise rechnet der Server)
  assert.match(read(`${K}/KaufBox.js`), /addItem\(slug, variante, menge\)/);
});

test("Routen der Accessoire-Welt nutzen Shop-Liste und Shop-Produktseite, Seitenregeln bleiben", () => {
  const base = "src/app/[locale]/accessoires";
  for (const f of ["produkte/page.js", "kategorie/[kategorie]/page.js", "kategorie/[kategorie]/seite/[seite]/page.js", "marke/[marke]/page.js", "marke/[marke]/seite/[seite]/page.js"]) {
    const src = read(`${base}/${f}`);
    assert.match(src, /<AccessoiresListe \{\.\.\.p\} \/>/, f);
    assert.match(src, /export const dynamicParams = false/, f);
    assert.match(src, /export const revalidate = 86400/, f);
  }
  assert.match(read(`${base}/produkte/[slug]/page.js`), /<ShopProduktDetail \{\.\.\.p\} \/>/);
  const api = read("src/app/api/katalog/accessoires/route.js");
  assert.match(api, /export const dynamic = "force-static"/);
  assert.doesNotMatch(api, /backoffice/i);
});

test("Keine Fremdaufrufe: Shop-Liste lädt nur den eigenen Index", () => {
  const grid = read(`${K}/ShopGrid.js`);
  assert.doesNotMatch(grid, /https?:\/\//);
  assert.match(read(`${K}/AccessoiresListe.js`), /indexUrl="\/api\/katalog\/accessoires"/);
});
