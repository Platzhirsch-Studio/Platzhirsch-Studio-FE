// tests/unit/shop-minicart.test.mjs — Mini-Warenkorb nach „In den Warenkorb“:
// lazy geladen, modal (Fokus bleibt im Panel), Fokus zurück, aria-live,
// Preise nur vom Server, keine erfundene Versandkosten-frei-Schwelle.
// Run: node --test tests/unit/shop-minicart.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ADD_TO_CART_KEYS, SHOP_COPY } from "../../src/lib/shop/copy.js";
import { versandHandler } from "../../src/lib/shop/handlers.js";
import { TESTARTIKEL } from "../../src/lib/shop/catalog.js";
import { createMemoryOrderAdapter } from "../../src/lib/shop/orderStore.js";
import { createMockShippingAdapter } from "../../src/lib/commerce/shipping/mock.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("AddToCart lädt MiniCart erst beim Klick und reicht das echte addItem-Ergebnis weiter", () => {
  const src = read("src/components/Shop/AddToCart.js");
  assert.match(src, /lazy\(\(\) => import\("\.\/MiniCart"\)\)/);
  assert.doesNotMatch(src, /^import MiniCart/m);
  assert.match(src, /const result = addItem\(slug, variante, menge\);\s*setDone\(result\.added > 0\);/);
});

test("MiniCart: modal, Esc/Hintergrund schließt, Fokus zurück, aria-live, Preise vom Server", () => {
  const src = read("src/components/Shop/MiniCart.js");
  assert.match(src, /showModal\(\)/);
  assert.match(src, /returnFocus\.focus\(\)/);
  assert.match(src, /aria-live="polite"/);
  assert.match(src, /aria-labelledby=/);
  assert.match(src, /e\.target === e\.currentTarget/);
  assert.match(src, /fetch\("\/api\/shop\/versand"/);
  assert.match(src, /data-shop-zum-warenkorb/);
  assert.match(src, /motion-reduce:transition-none/);
  assert.doesNotMatch(src, /versandkostenfrei|gratis|free shipping|frei ab/i, "keine Schwelle ohne Konfiguration");
  assert.doesNotMatch(src, /localStorage/, "Preise/Zeilen nicht aus dem Browser");
});

test("alle Insel-Texte existieren in allen Sprachen; Seiten reichen sie + locale weiter", () => {
  for (const [loc, c] of Object.entries(SHOP_COPY)) for (const k of ADD_TO_CART_KEYS) assert.ok(c[k], `${loc}.${k}`);
  for (const f of ["src/components/Katalog/ReservierenSlot.js", "src/app/[locale]/shop/testartikel/page.js"]) {
    const s = read(f);
    assert.match(s, /pickCopy\(locale, ADD_TO_CART_KEYS\)/, f);
    assert.match(s, /locale=\{locale\}/, f);
  }
});

test("Bepreisen ohne Ziel liefert Bild-Pfad, aber keinen Client-Preis", async () => {
  const ctx = { env: { NODE_ENV: "development" }, store: createMemoryOrderAdapter(), now: () => Date.parse("2026-10-31T10:00:00Z"), produkte: [], testartikel: TESTARTIKEL, shipping: createMockShippingAdapter() };
  const body = { cart: [{ slug: "testartikel-glas", variante: "standard", menge: 1, einzelCent: 1 }], locale: "de" };
  const res = await versandHandler(ctx)(new Request("http://localhost/api/shop/versand", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok("bild" in data.zeilen[0]);
  assert.equal(data.zeilen[0].einzelCent, 1200);
  assert.equal(data.summen.warenCent, 1200);
});
