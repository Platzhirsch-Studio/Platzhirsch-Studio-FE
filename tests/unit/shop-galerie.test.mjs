// tests/unit/shop-galerie.test.mjs
// Shop-Produktseite: Freisteller zuerst (Zalto Gravitas Omega eröffnete mit einem 16:7-Szenenfoto).
// node --test tests/unit/shop-galerie.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { shopGalerie } = await import("../../src/components/Katalog/shopGalerie.js");
const aus = await import("../../src/lib/katalog/ausfuehrung.js");
const katalog = await import("../../src/lib/katalog/index.js");

const b = (src, typ) => ({ src, width: 1, height: 1, ...(typ ? { typ } : {}) });

test("Reihenfolge: Freisteller, dann Raumbilder, dann Details (stabil)", () => {
  const p = { bilder: [b("raum1", "ambiente"), b("frei1"), b("det", "detail"), b("raum2", "ambiente"), b("frei2")] };
  assert.deepEqual(shopGalerie(aus.galerie(p)).map((x) => x.src), ["frei1", "frei2", "raum1", "raum2", "det"]);
});

test("leer/fehlend → leere Liste", () => {
  assert.deepEqual(shopGalerie(undefined), []);
  assert.deepEqual(shopGalerie(aus.galerie({ bilder: [] })), []);
});

test("Zalto Gravitas Omega: erstes Galeriebild ist der Freisteller", () => {
  const p = katalog.produktBySlug("zalto-gravitas-omega");
  assert.ok(p, "Produkt vorhanden");
  const erstes = shopGalerie(aus.galerie(p))[0];
  assert.match(erstes.src, /zalto-gravitas-omega-1\.webp$/);
  assert.ok(erstes.height > erstes.width, "Hochformat-Freisteller, kein Szenenfoto");
});

test("Shop-Produktseite nutzt shopGalerie", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../../src/components/Katalog/ShopProduktDetail.js", import.meta.url), "utf8");
  // 03.11.2026: Hero zuerst (kachelBild.js mitDetailBild; Shop-Welt = Freisteller), Rest in shopGalerie-Reihenfolge.
  assert.match(src, /const bilder = mitDetailBild\(p, shopGalerie\(g\)\)/);
});
