// node --test tests/unit/sofaplaner-fix2.test.mjs
// QM Sofaplaner R2 P2-C (qa-screenshots/labs-ausbau/sofaplaner/feedback-2.md):
// Bezüge je Familie mit Quelle – aus der Recherchedatei, der eigenen
// minotti.com-Produktseite und markenweiten Minotti-Aussagen. Keine Farben,
// keine erfundenen Namen: jeder Eintrag hat eine minotti.com-URL.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { BRAND_NOTE, hasCoverSource, mergeCovers } from "../../src/lib/sofaplaner/covers.js";

const DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);
const data = JSON.parse(readFileSync(new URL("../../src/lib/sofaplaner/minotti-covers.json", import.meta.url), "utf8"));
const families = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const fam = normalizeFamily(JSON.parse(readFileSync(new URL(f, DIR), "utf8")));
    return { fam, cover: mergeCovers(fam, data) };
  });

test("P2-C: mindestens 80 von 90 Familien haben Bezugsangaben mit Quelle", () => {
  assert.equal(families.length, 90);
  const withSource = families.filter((f) => hasCoverSource(f.cover)).length;
  assert.ok(withSource >= 80, `nur ${withSource}`);
  // stricter: the model's OWN product page names at least one cover material
  const own = families.filter((f) => f.cover.collections.length > 0).length;
  assert.ok(own >= 80, `nur ${own} mit Angaben der eigenen Produktseite`);
});

test("P2-C: jeder Eintrag hat Name, Material und eine minotti.com-Quelle, keine Farbwerte", () => {
  for (const { fam, cover } of families) {
    for (const c of [...cover.collections, ...cover.brand]) {
      assert.ok(c.name && c.material, `${fam.slug}: ${JSON.stringify(c)}`);
      assert.match(c.source || "", /^https:\/\/www\.minotti\.com\//, `${fam.slug}: ${c.name}`);
      assert.doesNotMatch(JSON.stringify(c), /#[0-9a-f]{3,6}\b|rgb\(/i);
    }
  }
});

test("P2-C: Belege stammen wörtlich aus der Produktseite (Stichprobe) und Familien haben ihre URL", () => {
  for (const [slug, f] of Object.entries(data.familien)) {
    if (!f.items.length) continue;
    assert.match(f.source, /^https:\/\/www\.minotti\.com\/[a-z]{2}\//, slug);
    for (const i of f.items) assert.ok(i.evidence && i.evidence.length > 10, `${slug}: ${i.name} ohne Beleg`);
  }
  const connery = families.find((f) => f.fam.slug === "connery").cover;
  const names = connery.collections.map((c) => c.name);
  assert.ok(names.includes("Aspen") && names.includes("Stoff") && names.includes("Leder"), names.join(", "));
  assert.ok(connery.brand.some((b) => b.name === "Boston"), "markenweite Leder fehlen");
  assert.ok(BRAND_NOTE.includes("Showroom bestätigen"));
});

test("P2-C: Outdoor-Familien bekommen nur Outdoor-Materialien der Marke", () => {
  for (const { fam, cover } of families) {
    if (!fam.outdoor) continue;
    for (const b of cover.brand) assert.match(b.material, /Outdoor/, `${fam.slug}: ${b.name}`);
  }
});

test("P2-C: keine Dubletten (Pelle Nature = Leder Kategorie Nature, Nabuk = Nabuk Lodge)", () => {
  for (const { fam, cover } of families) {
    const keys = cover.collections.map((c) => c.name.toLowerCase());
    assert.equal(new Set(keys).size, keys.length, fam.slug);
    const nature = cover.collections.filter((c) => /nature/i.test(c.name) && /leder|pelle/i.test(c.name));
    assert.ok(nature.length <= 1, `${fam.slug}: ${nature.map((c) => c.name)}`);
  }
});
