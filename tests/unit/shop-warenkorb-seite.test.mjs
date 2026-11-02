// tests/unit/shop-warenkorb-seite.test.mjs — Warenkorb/Kasse mit Shop-Feeling:
// Stepper, Rückgängig, aria-live, Lade-/Fehlerzustand, Auto-Versandberechnung,
// Schritte, Zahlungsart, mobile Summenleiste OHNE Bestell-Button,
// Vorschläge im leeren Warenkorb nur aus Katalogpreisen.
// Run: node --test tests/unit/shop-warenkorb-seite.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { leerVorschlaege } from "../../src/lib/shop/suggestions.js";
import { SHOP_COPY } from "../../src/lib/shop/copy.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const cart = read("src/components/Shop/ShopCart.js");
const HEUTE = "2026-10-31";
const basis = (o) => ({ bereich: "accessoires", kurz: { de: "a", en: "a", fr: "a", it: "a" }, merkmale: [], bilder: [{ src: "/x.webp" }], herstellerUrl: "https://x.example/p", quellen: ["https://x.example/p"], stand: HEUTE, ...o });
const P = (slug, marke, preis) => basis({ slug, marke, kategorie: "duftkerze", name: slug, preis: { art: "verkaufspreis", stand: "2026-10-15", quelle: "https://x.example/q", ...preis } });

test("Vorschläge: je Marke einer, Katalogpreis, nie Testartikel, kuratierte Liste hat Vorrang", () => {
  const produkte = [P("b-1", "baobab-collection", { betrag: 79 }), P("b-2", "baobab-collection", { betrag: 99 }), P("r-1", "riedel", { varianten: [{ name: "S", betrag: 30 }, { name: "L", betrag: 45 }] }), P("t-1", "cire-trudon", { betrag: 120 })];
  const v = leerVorschlaege({ heute: HEUTE, mode: "test", produkte });
  assert.deepEqual(v.map((x) => x.slug), ["b-1", "r-1", "t-1"]);
  assert.equal(v[1].abCent, 3000);
  assert.equal(v[1].mehrere, true);
  assert.equal(v[0].href, "/accessoires/produkte/b-1");
  assert.ok(v.every((x) => !x.slug.startsWith("testartikel")));
  assert.deepEqual(leerVorschlaege({ heute: HEUTE, mode: "test", produkte, kuratiert: ["t-1", "gibt-es-nicht"] }).map((x) => x.slug), ["t-1"]);
  assert.deepEqual(leerVorschlaege({ heute: HEUTE, mode: "off", produkte }), []);
  assert.deepEqual(leerVorschlaege({ heute: HEUTE, mode: "test", produkte: [] }), [], "leerer Katalog → keine Vorschläge, nichts erfunden");
});

test("Stepper, Entfernen mit Rückgängig, Ansage über aria-live", () => {
  assert.match(cart, /aria-label=\{c\.qtyLess\}/);
  assert.match(cart, /aria-label=\{c\.qtyMore\}/);
  assert.match(cart, /disabled=\{z\.menge <= 1\}/);
  assert.match(cart, /disabled=\{z\.menge >= MAX_QTY\}/);
  assert.match(cart, /const r = removeItem\(z\.slug, z\.variante\);/);
  assert.match(cart, /restoreItem\(undo\.removed\)/);
  assert.match(cart, /aria-live="polite" className="sr-only"/);
  assert.match(cart, /setLive\(fill\(c\.qtyChanged/);
});

test("Bepreisung: Ladezustand, Fehler mit „Erneut versuchen“, Bestellen gesperrt solange veraltet", () => {
  assert.match(cart, /c\.loadingPrices/);
  assert.match(cart, /setPricingFailed\(true\)/);
  assert.match(cart, /setAttempt\(\(n\) => n \+ 1\)/);
  assert.match(cart, /const blockiert = busy \|\| !zeilen\.length \|\| !fresh/);
});

test("Versand automatisch bei vollständiger Adresse; gesperrter Button erklärt sich", () => {
  assert.match(cart, /adresseKomplett\(adresse\)/);
  assert.match(cart, /setTimeout\(berechnen, 700\)/);
  assert.match(cart, /aria-describedby=\{warum \? `\$\{id\}-warum` : undefined\}/);
  assert.match(cart, /data-shop-versand-berechnen/, "manueller Rückfall bleibt (E2E)");
});

test("Schritte, Gast, Zahlungsart (Testhinweis nur im Test), Pflicht-Button unverändert", () => {
  assert.match(cart, /aria-current=\{i \+ 1 === schritt \? "step" : undefined\}/);
  assert.match(cart, /\{c\.guest\}/);
  assert.match(cart, /\{test && effZahlung === "online" && <p className="text-small text-text">\{c\.payStripeTest\}<\/p>\}/);
  assert.match(cart, /effZahlung === "vorort" \? c\.reserveSubmit : c\.buy/);
  assert.equal(SHOP_COPY.de.steps.length, 4);
  assert.match(read("src/app/[locale]/shop/warenkorb/page.js"), /test=\{mode === "test"\}/);
});

test("mobile Summenleiste: nur < lg, springt zur Übersicht, KEIN Submit (Button-Lösung)", () => {
  const leiste = cart.slice(cart.indexOf("data-shop-mobilleiste"));
  assert.match(cart, /fixed inset-x-0 bottom-0 z-\(--z-sticky\)[^"]*lg:hidden/);
  assert.doesNotMatch(leiste, /type="submit"/);
  assert.match(leiste, /scrollIntoView/);
  assert.match(read("src/components/Reusable/MobileCtaBar.js"), /"concierge", "shop"\]/);
});

test("E2E-Selektoren bleiben erhalten", () => {
  for (const sel of ["data-shop-cart", "data-shop-zeilen", "data-shop-zeile", "data-shop-menge", "data-shop-lieferart", "data-shop-zahlung", "data-shop-land", "data-shop-versand=", "data-shop-summe-gesamt", "data-shop-recht-slot", "data-shop-bestellen", "data-shop-meldung", "data-shop-leer"]) assert.ok(cart.includes(sel), sel);
});
