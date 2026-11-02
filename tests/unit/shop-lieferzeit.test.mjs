// tests/unit/shop-lieferzeit.test.mjs — Lieferzeit-Mechanik des Shops
// (src/lib/shop/lieferzeit.js): Entwurfs-Vorschläge nur im Testmodus mit
// Marker, live nur Freigegebenes, sonst „auf Anfrage“; kuratierte Lagerliste
// für „Sofort lieferbar“; Mock-Laufzeit nie angezeigt.
// Run: node --test --test-reporter=tap tests/unit/shop-lieferzeit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LIEFERZEIT, LIEFERZEIT_META, LIEFERZEIT_STATUS, SOFORT_LIEFERBAR, bestandOf, istSofortLieferbar, lagerListeFehler, lieferzeitFreigegeben, lieferzeitFuer, lieferzeitOffen, lieferzeitText } from "../../src/lib/shop/lieferzeit.js";
import { SHOP_COPY } from "../../src/lib/shop/copy.js";
import { liveBlockers } from "../../src/lib/shop/mode.js";
import { ALLE_PRODUKTE } from "../../src/lib/katalog/index.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const frei = (e) => ({ ...e, vorschlag: false, freigegeben: true, freigabe: { datum: "2026-11-15", durch: "Inhaber", beleg: "Mail" } });
const LAGER = ["glas-a", "kerze-b"];

test("Entwurf: Status ehrlich, nichts freigegeben, konservative Vorschläge", () => {
  assert.equal(LIEFERZEIT_META.status, LIEFERZEIT_STATUS.ENTWURF);
  assert.match(LIEFERZEIT_META.hinweis, /Entwurf von KI-Agenten, Kanzlei-Durchsicht empfohlen/);
  assert.deepEqual(lieferzeitOffen(), ["versand.AT.lager", "versand.AT.bestellware", "versand.DE.lager", "versand.DE.bestellware", "abholung.lager", "abholung.bestellware"]);
  assert.deepEqual([LIEFERZEIT.versand.AT.lager.min, LIEFERZEIT.versand.AT.lager.max], [3, 5]);
  assert.deepEqual([LIEFERZEIT.versand.DE.lager.min, LIEFERZEIT.versand.DE.lager.max], [4, 7]);
  for (const z of [LIEFERZEIT.versand.AT, LIEFERZEIT.versand.DE]) {
    assert.equal(z.bestellware.min, undefined, "keine erfundene Herstellerlieferzeit");
    assert.equal(z.bestellware.key, "deliveryOnRequest");
  }
  assert.equal(SOFORT_LIEFERBAR.length, 0, "Lagerliste ist leer, bis der Inhaber sie füllt");
  assert.ok(Object.isFrozen(LIEFERZEIT.versand.AT.lager));
});

test("Freigabe zählt nur mit Datum und Person", () => {
  const e = LIEFERZEIT.versand.AT.lager;
  assert.equal(lieferzeitFreigegeben(e), false);
  assert.equal(lieferzeitFreigegeben({ ...e, freigegeben: true }), false);
  assert.equal(lieferzeitFreigegeben({ ...e, freigegeben: true, freigabe: { datum: "15.11.2026", durch: "X" } }), false);
  assert.equal(lieferzeitFreigegeben({ ...e, freigegeben: true, freigabe: { datum: "2026-11-15", durch: " " } }), false);
  assert.equal(lieferzeitFreigegeben(frei(e)), true);
});

test("Bestand: Lager nur, wenn ALLE Artikel auf der Lagerliste stehen", () => {
  assert.equal(bestandOf([], LAGER), "bestellware");
  assert.equal(bestandOf(["glas-a"], LAGER), "lager");
  assert.equal(bestandOf(["glas-a", "kerze-b"], LAGER), "lager");
  assert.equal(bestandOf(["glas-a", "andere"], LAGER), "bestellware", "gemischt → längere Frist");
  assert.equal(bestandOf(["glas-a"]), "bestellware", "Standardliste leer");
  assert.equal(istSofortLieferbar("glas-a", LAGER), true);
  assert.equal(istSofortLieferbar("glas-a"), false);
  assert.equal(istSofortLieferbar(undefined, LAGER), false);
});

test("TEST: Vorschläge mit Entwurf-Marker", () => {
  const at = lieferzeitFuer({ land: "AT", slugs: ["glas-a"], mode: "test", lager: LAGER });
  assert.deepEqual(at, { key: "deliveryWorkdays", vars: { min: 3, max: 5 }, entwurf: true, bestand: "lager" });
  assert.equal(lieferzeitText(at, SHOP_COPY.de), "3–5 Werktage");
  const de = lieferzeitFuer({ land: "DE", slugs: ["glas-a"], mode: "test", lager: LAGER });
  assert.equal(lieferzeitText(de, SHOP_COPY.de), "4–7 Werktage");
  const best = lieferzeitFuer({ land: "AT", slugs: ["x"], mode: "test", lager: LAGER });
  assert.equal(best.entwurf, true);
  assert.equal(lieferzeitText(best, SHOP_COPY.de), "Liefertermin nennen wir innerhalb von 1 Werktag – spätestens 30 Tage nach Vertragsschluss");
  const ab = lieferzeitFuer({ lieferart: "abholung", slugs: ["glas-a"], mode: "test", lager: LAGER });
  assert.equal(lieferzeitText(ab, SHOP_COPY.de), "abholbereit nach Bestätigungsmail");
  assert.equal(ab.entwurf, true);
  const abB = lieferzeitFuer({ lieferart: "abholung", slugs: ["x"], mode: "test", lager: LAGER });
  assert.equal(abB.key, "pickupOnRequest");
});

test("LIVE: nur Freigegebenes, sonst neutral „auf Anfrage“ ohne Versprechen", () => {
  const live = lieferzeitFuer({ land: "AT", slugs: ["glas-a"], mode: "live", lager: LAGER });
  assert.deepEqual(live, { key: "deliveryOnRequestPlain", vars: {}, entwurf: false, bestand: "lager" });
  assert.equal(lieferzeitText(live, SHOP_COPY.de), "Lieferzeit auf Anfrage");
  assert.equal(lieferzeitFuer({ lieferart: "abholung", mode: "live" }).key, "pickupOnRequestPlain");
  const cfg = { ...LIEFERZEIT, versand: { ...LIEFERZEIT.versand, AT: { ...LIEFERZEIT.versand.AT, lager: frei(LIEFERZEIT.versand.AT.lager) } } };
  const ok = lieferzeitFuer({ land: "AT", slugs: ["glas-a"], mode: "live", lager: LAGER, config: cfg });
  assert.deepEqual(ok, { key: "deliveryWorkdays", vars: { min: 3, max: 5 }, entwurf: false, bestand: "lager" });
  // DE nicht freigegeben → weiter auf Anfrage
  assert.equal(lieferzeitFuer({ land: "DE", slugs: ["glas-a"], mode: "live", lager: LAGER, config: cfg }).key, "deliveryOnRequestPlain");
  // Freigegeben → im Test ohne Marker
  assert.equal(lieferzeitFuer({ land: "AT", slugs: ["glas-a"], mode: "test", lager: LAGER, config: cfg }).entwurf, false);
});

test("OFF → nichts; unbekanntes Land (CH) → auf Anfrage", () => {
  assert.equal(lieferzeitFuer({ mode: "off" }), null);
  assert.equal(lieferzeitFuer({ mode: "quatsch" }), null);
  assert.equal(lieferzeitText(null, SHOP_COPY.de), "");
  assert.equal(lieferzeitFuer({ land: "CH", slugs: ["glas-a"], mode: "test", lager: LAGER }).key, "deliveryOnRequestPlain");
});

test("liveBlockers enthält jede nicht freigegebene Lieferzeit", () => {
  const b = liveBlockers({});
  for (const id of lieferzeitOffen()) assert.ok(b.includes(`lieferzeit:${id}`), id);
});

test("Lagerliste: gültiges Format, keine Doppelten, nur echte Katalog-Slugs", () => {
  assert.deepEqual(lagerListeFehler(), []);
  assert.deepEqual(lagerListeFehler(["ok-slug", "Groß", "ok-slug"]), ["format:Groß", "doppelt:ok-slug"]);
  const slugs = new Set(ALLE_PRODUKTE.map((p) => p.slug));
  for (const s of SOFORT_LIEFERBAR) assert.ok(slugs.has(s), `${s} gibt es nicht im Katalog`);
});

test("Texte: alle Sprachen, gleiche Platzhalter", () => {
  const keys = ["deliveryWorkdays", "deliveryOnRequest", "deliveryOnRequestPlain", "pickupReady", "pickupOnRequest", "pickupOnRequestPlain", "draftMark", "draftMarkTitle", "inStock"];
  const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
  for (const [loc, c] of Object.entries(SHOP_COPY)) {
    for (const k of keys) {
      assert.ok(typeof c[k] === "string" && c[k].length > 0, `${loc}.${k}`);
      assert.equal(vars(c[k]), vars(SHOP_COPY.de[k]), `${loc}.${k}`);
      if (loc !== "de") assert.notEqual(c[k], SHOP_COPY.de[k], `${loc}.${k} übersetzt`);
    }
    assert.doesNotMatch(c.deliveryOnRequestPlain + c.pickupOnRequestPlain, /\d/, "Live-Rückfall ohne Zahlen-Versprechen");
  }
});

test("Verdrahtung: ShopCart nutzt lieferzeit.js, Mock-Laufzeit nie, Marker nur bei Entwurf; Badge nur über Lagerliste", () => {
  const cart = read("src/components/Shop/ShopCart.js");
  assert.match(cart, /lieferzeitFuer\(\{ lieferart, land: adresse\.land, slugs: cart\.map\(\(i\) => i\.slug\), mode: test \? "test" : "live" \}\)/);
  assert.match(cart, /versand\?\.quelle !== "mock" && versand\?\.dienst\?\.tage/);
  assert.match(cart, /\{lieferzeit\.entwurf && \(/);
  assert.doesNotMatch(cart, /deliveryTimePending|pickupTime/, "alte Platzhalter nicht mehr angezeigt");
  const slot = read("src/components/Katalog/ReservierenSlot.js");
  assert.match(slot, /sofortLieferbar=\{istSofortLieferbar\(item\.slug\)\}/);
  const box = read("src/components/Katalog/KaufBox.js");
  assert.match(box, /\{sofortLieferbar && copy\.inStock && \(/);
  assert.match(box, /sofortLieferbar = false/);
});

test("Quellen im Code dokumentiert (FAGG § 4 Abs 1 Z 7, EGBGB, EUR-Lex)", () => {
  const src = read("src/lib/shop/lieferzeit.js");
  assert.match(src, /FAGG § 4 Abs 1 Z 7/);
  assert.match(src, /ris\.bka\.gv\.at.*20008847/);
  assert.match(src, /art_246a__1/);
  assert.match(src, /eur-lex\.europa\.eu\/eli\/dir\/2011\/83/);
});
