// tests/unit/katalog-leitbild.test.mjs – Leitbild und Hero der Katalogprodukte (Inhaber 03.11.2026):
//   leitbild(p)   = Kachelbild der Listen (auch Merkliste, Kaufbox, og:image/Sitemap der Listen)
//   detailBild(p) = Hero der Produktseite: Raumbild > Freisteller > bilder[0] (Shop-Welt: Freisteller
//                   zuerst wie Kachel); og:image, JSON-LD image[0] und Sitemap der Produktseite folgen ihm.
// Dornbracht TARA: Kachel tara-2 (Freisteller), Seite tara-3 („So wirkt es im Raum“) = og:image.
// node --test tests/unit/katalog-leitbild.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const { kachelBild, leitbild, mitLeitbild, detailBild, mitDetailBild } = await import("../../src/components/Katalog/kachelBild.js");
const { kachelBilder } = await import("../../src/lib/katalog/shopIndex.js");
const { bildSrc } = await import("../../src/lib/katalog/shopListe.js");
const { produktSchema } = await import("../../src/components/Katalog/katalogSchema.js");
const { katalogImages } = await import("../../src/lib/seo/sitemap/images.js");
const { shopGalerie } = await import("../../src/components/Katalog/shopGalerie.js");
const aus = await import("../../src/lib/katalog/ausfuehrung.js");
const katalog = await import("../../src/lib/katalog/index.js");

const b = (src, typ, width = 1600, height = 1200) => ({ src, width, height, typ });
const dorn = { welt: "bad-wellness", marke: "dornbracht", bilder: [b("neon", "freisteller"), b("frei", "freisteller"), b("raum", "ambiente")] };

test("leitbild (Kachel): Katalog-Welten = kachelBild (Dornbracht-Freisteller), Shop-Welt = Freisteller > Raumbild > bilder[0]", () => {
  assert.equal(leitbild(dorn).src, "frei");
  assert.equal(leitbild(dorn), kachelBild(dorn));
  assert.equal(leitbild({ welt: "kuechengeraete", marke: "quooker", bilder: [b("q1", "freisteller"), b("q2", "ambiente")] }).src, "q1");
  assert.equal(leitbild({ welt: "accessoires", marke: "zalto", bilder: [b("raum", "ambiente", 1600, 700), b("frei", "freisteller", 1000, 1600)] }).src, "frei");
  assert.equal(leitbild({ welt: "accessoires", bilder: [b("det", "detail"), b("raum", "ambiente")] }).src, "raum");
  assert.equal(leitbild({ welt: "accessoires", bilder: [b("det", "detail")] }).src, "det");
  assert.equal(leitbild({ bilder: [] }), null);
  assert.equal(leitbild(null), null);
});

test("detailBild (Hero): Raumbild > Freisteller > bilder[0]; Shop-Welt wie Kachel (Freisteller zuerst)", () => {
  assert.equal(detailBild(dorn).src, "raum");
  assert.equal(detailBild({ welt: "bad-wellness", marke: "dornbracht", bilder: [b("det", "detail"), b("frei", "freisteller")] }).src, "frei");
  assert.equal(detailBild({ welt: "kuechengeraete", marke: "quooker", bilder: [b("q1", "freisteller"), b("q2", "freisteller")] }).src, "q1");
  assert.equal(detailBild({ welt: "bad-wellness", bilder: [b("det", "detail")] }).src, "det");
  // Shop: Zalto eröffnet nicht mit dem 16:7-Szenenfoto
  assert.equal(detailBild({ welt: "accessoires", marke: "zalto", bilder: [b("raum", "ambiente", 1600, 700), b("frei", "freisteller", 1000, 1600)] }).src, "frei");
  assert.equal(detailBild({ bilder: [] }), null);
  assert.equal(detailBild(undefined), null);
  // Produkte ohne Raumbild: Hero wie bisher (erster Freisteller, sonst erstes Bild)
  for (const p of katalog.ALLE_PRODUKTE) {
    if (p.welt === "accessoires" || !p.bilder.length) continue;
    const g = aus.galerie(p);
    const bisher = g.ambiente[0] || g.freisteller[0] || g.detail[0];
    assert.equal(detailBild(p).src, bisher.src, `${p.slug}: Hero`);
  }
});

test("mitLeitbild / mitDetailBild: Startbild zuerst, Rest in bisheriger Reihenfolge ohne Doppelung", () => {
  assert.deepEqual(mitLeitbild(dorn).map((x) => x.src), ["frei", "neon", "raum"]);
  assert.deepEqual(mitDetailBild(dorn).map((x) => x.src), ["raum", "neon", "frei"]);
  assert.deepEqual(mitDetailBild(dorn, [b("frei", "freisteller"), b("neon", "freisteller")]).map((x) => x.src), ["raum", "frei", "neon"]);
  assert.deepEqual(mitLeitbild({ bilder: [] }), []);
  assert.deepEqual(mitDetailBild(undefined), []);
  for (const p of katalog.ALLE_PRODUKTE) {
    for (const [name, fn, wahl] of [["mitLeitbild", mitLeitbild, leitbild], ["mitDetailBild", mitDetailBild, detailBild]]) {
      const list = fn(p);
      assert.equal(list.length, p.bilder.length, `${p.slug} ${name}: alle Bilder, keine Doppelung`);
      assert.equal(new Set(list.map((x) => x.src)).size, list.length, `${p.slug} ${name}: eindeutig`);
      assert.equal(list[0]?.src, wahl(p)?.src, `${p.slug} ${name}: Startbild zuerst`);
    }
  }
});

test("Dornbracht TARA: Kachel tara-2, Seite/og:image tara-3, Galerie ohne Doppelung", () => {
  const p = katalog.produktBySlug("dornbracht-tara");
  assert.ok(p, "Produkt vorhanden");
  assert.match(leitbild(p).src, /dornbracht-tara-2\.webp$/);
  assert.match(detailBild(p).src, /dornbracht-tara-3\.webp$/);
  assert.deepEqual(
    mitDetailBild(p).map((x) => x.src.replace(/.*\//, "")),
    ["dornbracht-tara-3.webp", "dornbracht-tara-1.webp", "dornbracht-tara-2.webp"]
  );
});

test("Shop-Welt: Leitbild = Bild der ShopKachel (kachelBilder) = Hero = erstes Bild der shopGalerie", () => {
  for (const p of katalog.produkteByWelt("accessoires")) {
    if (!p.bilder.length) continue;
    const leit = leitbild(p);
    assert.equal(bildSrc({ m: p.marke, s: p.slug }, kachelBilder(p).i[0]), leit.src, `${p.slug}: wie ShopKachel`);
    assert.equal(detailBild(p).src, leit.src, `${p.slug}: Hero = Kachel`);
    assert.equal(mitDetailBild(p, shopGalerie(aus.galerie(p)))[0].src, shopGalerie(aus.galerie(p))[0].src, `${p.slug}: Galerie unverändert`);
  }
});

test("JSON-LD image[] und Sitemap der Produktseite beginnen mit dem Hero; Sitemap-Listen mit dem Kachelbild", () => {
  for (const p of katalog.ALLE_PRODUKTE) {
    if (!p.bilder.length) continue;
    const ld = produktSchema(p, katalog.markeBySlug(p.marke), "de", "X", null);
    assert.equal(ld.image[0], `https://platzhirsch.studio${detailBild(p).src}`, `${p.slug}: JSON-LD`);
    assert.equal(ld.image.length, p.bilder.length, `${p.slug}: alle Bilder im JSON-LD`);
    const sm = katalogImages({ typ: "produkt", slug: p.slug, welt: p.welt });
    assert.equal(sm[0], detailBild(p).src, `${p.slug}: Sitemap`);
    assert.equal(sm.length, p.bilder.length, `${p.slug}: Sitemap alle Bilder`);
  }
  const dorn = katalog.produkteByMarke("dornbracht", "bad-wellness");
  assert.deepEqual(katalogImages({ typ: "marke", marke: "dornbracht", welt: "bad-wellness", seite: 1 }).slice(0, 3), dorn.slice(0, 3).map((p) => leitbild(p).src));
});

test("Quelltext: Hero/og:image/JSON-LD = detailBild, Kachel/Merkliste/Kaufbox/Listen = leitbild", () => {
  const pd = read("src/components/Katalog/ProduktDetail.js");
  assert.match(pd, /const leit = detailBild\(p\)/);
  assert.match(pd, /const hauptSrc = leit\?\.src \|\| null/);
  assert.match(pd, /image: leitbild\(p\)\?\.src \|\| null/);
  assert.doesNotMatch(pd.replace(/^\s*\/\/.*$/gm, ""), /p\.bilder\[0\]/);
  // Hero zuerst (vorgeladen); Raumbild-Block danach nur, wenn der Hero kein Raumbild ist
  assert.ok(pd.indexOf("{erstes && <Bild b={erstes}") < pd.indexOf("{raumBlock && ("));
  const spd = read("src/components/Katalog/ShopProduktDetail.js");
  assert.match(spd, /mitDetailBild\(p, shopGalerie\(g\)\)/);
  assert.match(spd, /studioFassung\(leit\?\.src, p\.marke, "frei"\)/);
  const routes = read("src/components/Katalog/katalogRoutes.js");
  assert.match(routes, /function bildMeta\(list, locale, wahl = leitbild\)/);
  assert.match(routes, /bildMeta\(\[p\], locale, detailBild\)/);
  assert.match(read("src/components/Katalog/ReservierenSlot.js"), /const roh = leitbild\(p\)\?\.src/);
  assert.match(read("src/app/[locale]/accessoires/produkte/[slug]/page.js"), /const bild = detailBild\(p\)/);
  const sm = read("src/lib/seo/sitemap/images.js");
  assert.match(sm, /const firstImage = \(p\) => leitbild\(p\)\?\.src/);
  assert.match(sm, /mitDetailBild\(produktBySlug\(entry\.slug\)\)/);
  // Minotti ist nicht Teil des statischen Katalogs (keine Markendatei) – Regeln greifen dort nicht.
  assert.ok(!fs.existsSync(new URL("../../src/lib/katalog/marken/minotti.js", import.meta.url)));
  assert.ok(!katalog.ALLE_PRODUKTE.some((p) => p.marke === "minotti"));
});
