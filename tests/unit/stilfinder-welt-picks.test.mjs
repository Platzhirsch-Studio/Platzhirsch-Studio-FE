// node --test tests/unit/stilfinder-welt-picks.test.mjs
// Stil-Finder, Profil-Kuratierung (31.10.2026): Empfehlungen aus dem statischen
// Herstellerkatalog (Bad & Wellness, Küchengeräte, Accessoires) je Stilprofil.
// Prüft: echte Slugs der richtigen Welt, Bild vorhanden (Datei in public/),
// Vielfalt (Marke einmal je Profil, Kategorie einmal je Welt, kein Slug in zwei
// Profilen), Marken-Credit = MARKE.name, Händler-Flag nur über den Claim-Guard,
// keine Händler-/Superlativ-Wörter und keine Preise in den Begründungen,
// Minotti nicht berührt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const { WELT_PICKS, WELT_ORDER, PICKS_PER_WELT, weltEmpfehlungen } = await import("../../src/lib/stilfinder/weltPicks.js");
const { ALLE_PRODUKTE, markeBySlug } = await import("../../src/lib/katalog/index.js");
const { isVerifiedDealerBrand, hasUnprovenClaim } = await import("../../src/lib/legal/claims.js");
const { SUPERLATIVE_WORDS } = await import("../../src/lib/katalog/schema.js");

const PROFILE_ORDER = ["ruhe", "warm", "see", "salon", "klar"];
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const onDisk = (src) => src.startsWith("/") && existsSync(path.join(ROOT, "public", src));

test("jedes Profil hat Picks für alle drei Welten, je PICKS_PER_WELT", () => {
  assert.deepEqual(Object.keys(WELT_PICKS).sort(), [...PROFILE_ORDER].sort());
  for (const k of PROFILE_ORDER) for (const w of WELT_ORDER) assert.equal(WELT_PICKS[k][w]?.length, PICKS_PER_WELT, `${k}/${w}`);
});

test("alle Slugs existieren in der richtigen Welt und haben ein Bild auf der Platte", () => {
  for (const k of PROFILE_ORDER)
    for (const w of WELT_ORDER)
      for (const [slug] of WELT_PICKS[k][w]) {
        const p = ALLE_PRODUKTE.find((x) => x.slug === slug);
        assert.ok(p, `${k}/${w}: ${slug} fehlt im Katalog`);
        assert.equal(p.welt, w, `${slug}: Welt ${p.welt}`);
        const img = (p.bilder || []).find((b) => b?.src);
        assert.ok(img, `${slug}: kein Bild`);
        assert.ok(onDisk(img.src), `${slug}: ${img.src} fehlt in public/`);
      }
});

test("Vielfalt: Marke einmal je Profil, Kategorie einmal je Welt, kein Slug doppelt", () => {
  const allSlugs = [];
  for (const k of PROFILE_ORDER) {
    const brands = [];
    for (const w of WELT_ORDER) {
      const cats = WELT_PICKS[k][w].map(([s]) => ALLE_PRODUKTE.find((x) => x.slug === s).kategorie);
      assert.equal(new Set(cats).size, cats.length, `${k}/${w}: Kategorie doppelt ${cats}`);
      for (const [s] of WELT_PICKS[k][w]) {
        brands.push(ALLE_PRODUKTE.find((x) => x.slug === s).marke);
        allSlugs.push(s);
      }
    }
    assert.equal(new Set(brands).size, brands.length, `${k}: Marke doppelt ${brands}`);
  }
  assert.equal(new Set(allSlugs).size, allSlugs.length, "ein Produkt in zwei Profilen");
});

test("weltEmpfehlungen: vollständige Kacheln, Credit = MARKE.name, Händler nur per Claim-Guard", () => {
  for (const k of PROFILE_ORDER) {
    const out = weltEmpfehlungen(k, { imageExists: onDisk });
    assert.deepEqual(
      out.map((g) => g.welt),
      WELT_ORDER,
    );
    for (const g of out) {
      assert.equal(g.items.length, PICKS_PER_WELT, `${k}/${g.welt}`);
      for (const it of g.items) {
        assert.equal(it.brand, markeBySlug(it.brandSlug).name);
        assert.equal(it.dealer, isVerifiedDealerBrand(it.brandSlug));
        assert.match(it.href, new RegExp(`^/de/${g.welt}/produkte/${it.slug}$`));
        assert.ok(it.image && it.alt && it.why && it.name, JSON.stringify(it));
      }
    }
  }
  // Agape, Spiegelau, Nachtmann are not verified dealers: if ever picked, dealer stays false
  assert.equal(isVerifiedDealerBrand("agape"), false);
});

test("deterministisch, fehlende Bilder werden ausgelassen statt ersetzt, unbekanntes Profil leer", () => {
  assert.deepEqual(weltEmpfehlungen("salon"), weltEmpfehlungen("salon"));
  const none = weltEmpfehlungen("klar", { imageExists: () => false });
  assert.ok(none.every((g) => g.items.length === 0));
  assert.deepEqual(weltEmpfehlungen("nope"), []);
});

test("Begründungen: keine Händler-Claims, keine Superlative, keine Preise, kein Minotti", () => {
  for (const k of PROFILE_ORDER)
    for (const w of WELT_ORDER)
      for (const [slug, why] of WELT_PICKS[k][w]) {
        assert.equal(hasUnprovenClaim(why), false, `${slug}: ${why}`);
        assert.doesNotMatch(why, /händler|partner|offiziell/i, slug);
        assert.doesNotMatch(why, SUPERLATIVE_WORDS, slug);
        assert.doesNotMatch(why, /€|\beur\b|preis|uvp/i, slug);
        assert.doesNotMatch(slug, /minotti/i);
      }
});
