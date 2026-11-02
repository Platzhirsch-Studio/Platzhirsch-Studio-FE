// tests/unit/shop-bestaetigung.test.mjs — Bestellbestätigung: Datum,
// Zahlungsart, „Wie es weitergeht“, Rechtstexte, Weiter einkaufen; orderView
// gibt das Anlagedatum, aber keine Kundendaten/Adresse heraus.
// Run: node --test tests/unit/shop-bestaetigung.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { orderView } from "../../src/lib/shop/handlers.js";
import { createMemoryOrderAdapter } from "../../src/lib/shop/orderStore.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("orderView: angelegt ja, Kunde/Adresse/Token nein", async () => {
  const store = createMemoryOrderAdapter();
  const o = { id: "PH-S-261031-A1B2C3", token: "a".repeat(36), status: "reserviert", testmodus: true, lieferart: "abholung", zahlung: "vorort", kunde: { name: "X", email: "x@example.invalid" }, adresse: null, zeilen: [], summen: { warenCent: 0, versandCent: 0, gesamtCent: 0, mwstCent: 0 }, angelegt: "2026-10-31T10:00:00.000Z" };
  await store.put("bestellungen", o.id, o);
  const v = await orderView({ store }, o.id, o.token);
  assert.equal(v.angelegt, "2026-10-31T10:00:00.000Z");
  assert.equal(v.zahlung, "vorort");
  for (const k of ["kunde", "adresse", "token"]) assert.ok(!(k in v), k);
  assert.equal(await orderView({ store }, o.id, "b".repeat(36)), null);
});

test("Seite: Titel je Sprache, Zahlungsart, nächste Schritte, Rechts-Slots, Weiter einkaufen", () => {
  const p = read("src/app/[locale]/shop/bestellung/page.js");
  assert.match(p, /export async function generateMetadata/);
  assert.doesNotMatch(p, /title: "Bestellung \| /);
  assert.match(p, /data-shop-zahlart=\{o\.zahlung\}/);
  assert.match(p, /c\.confirmPending/);
  assert.match(p, /o\.zahlung === "vorort" \? ` \$\{c\.payOnSiteInfo\}`/, "Zahlung vor Ort nur, wenn gewählt");
  assert.match(p, /SHOP_LEGAL\.map/);
  assert.match(p, /\{c\.continueShopping\}/);
  assert.match(p, /<ClearCartOnMount orderId=\{o\.id\} \/>|<ClearCartOnMount \/>/);
  assert.doesNotMatch(p, /Werktag|deliveryDays/, "keine Lieferzeit auf der Bestätigung");
});
