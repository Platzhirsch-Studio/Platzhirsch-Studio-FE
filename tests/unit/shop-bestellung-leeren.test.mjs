// tests/unit/shop-bestellung-leeren.test.mjs — Bestätigungsseite leert den
// Warenkorb nur nach der EIGENEN, frischen Bestellung (Bug: jeder Aufruf
// eines bezahlten Bestätigungslinks leerte den aktuellen Warenkorb).
// Run: node --test tests/unit/shop-bestellung-leeren.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PENDING_MAX_AGE_MS, pendingValue, shouldClearFor } from "../../src/lib/shop/pendingOrder.js";

const ID = "PH-S-261031-A1B2C3";
const NOW = Date.parse("2026-10-31T10:00:00Z");
const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("nur dieselbe, frische Bestellung leert", () => {
  const v = pendingValue(ID, NOW);
  assert.equal(shouldClearFor(v, ID, NOW + 60_000), true);
  assert.equal(shouldClearFor(v, "PH-S-261031-FFFFFF", NOW), false, "fremde Bestellung");
  assert.equal(shouldClearFor(v, ID, NOW + PENDING_MAX_AGE_MS + 1), false, "zu alt");
  assert.equal(shouldClearFor(null, ID, NOW), false, "nichts markiert (anderes Gerät, alter Link)");
  assert.equal(shouldClearFor("{kaputt", ID, NOW), false);
  assert.equal(pendingValue("<script>", NOW), null);
});

test("Verdrahtung: ShopCart markiert vor der Weiterleitung, Seite übergibt die Bestellnummer", () => {
  const cart = read("src/components/Shop/ShopCart.js");
  assert.match(cart, /pendingValue\(data\.bestellung/);
  assert.match(cart, /localStorage\.setItem\(PENDING_ORDER_KEY/);
  assert.match(read("src/app/[locale]/shop/bestellung/page.js"), /<ClearCartOnMount orderId=\{o\.id\} \/>/);
  const clear = read("src/components/Shop/ClearCartOnMount.js");
  assert.match(clear, /shouldClearFor\(raw, orderId, Date\.now\(\)\)/);
  assert.match(clear, /try \{\s*raw = window\.localStorage\.getItem/);
});
