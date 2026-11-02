// R5 seo P2-3: Ezarri-Kollektionsseiten – Description an Satzgrenze (≤ 155,
// nie mitten im Wort) und sprechende H1 „Gea – Glasmosaik von Ezarri“.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import COLLECTIONS from "../../src/lib/ezarri/collections.json" with { type: "json" };
import REFERENCES from "../../src/lib/ezarri/references.json" with { type: "json" };
import { kollektionDescription, kollektionH1 } from "../../src/lib/ezarri/kollektionSeo.js";

const REF = new Map(REFERENCES.referenzen.map((r) => [r.id, r]));
const refsOf = (c) => (c.referenzen || []).map((id) => REF.get(id)).filter(Boolean);

test("alle 21 Descriptions ≤ 155 Zeichen, enden mit Satzende, beginnen mit Ezarri <Name>", () => {
  assert.equal(COLLECTIONS.kollektionen.length, 21);
  for (const c of COLLECTIONS.kollektionen) {
    const d = kollektionDescription(c, refsOf(c));
    assert.ok(d.length <= 155, `${c.id}: ${d.length}`);
    assert.ok(d.length >= 70, `${c.id} zu kurz: ${d}`);
    assert.match(d, /[.…]$/, `${c.id}: ${d}`);
    assert.ok(d.startsWith(`Ezarri ${c.name}:`), d);
    assert.doesNotMatch(d, /Loc$|Beratun$/);
  }
});

test("Gea: Schluss „Muster und Beratung in Lochau.“ bleibt erhalten", () => {
  const gea = COLLECTIONS.kollektionen.find((c) => c.id === "gea");
  const d = kollektionDescription(gea, refsOf(gea));
  assert.match(d, /Muster und Beratung in Lochau\.$/);
});

test("H1 sprechend; page.js nutzt Helfer statt .slice(0, 160)", () => {
  assert.equal(kollektionH1({ name: "Gea" }), "Gea – Glasmosaik von Ezarri");
  const page = fs.readFileSync("src/app/[locale]/ezarri/kollektionen/[kollektion]/page.js", "utf8");
  assert.doesNotMatch(page, /\.slice\(0, 160\)/);
  // Welle 2: Helfer mit Sprache (englisch „Gea – glass mosaic by Ezarri“).
  assert.match(page, /title=\{kollektionH1\(c, locale\)\}/);
  assert.match(page, /description: kollektionDescription\(c, refs, undefined, locale\)/);
  assert.equal(kollektionH1({ name: "Gea" }, "en"), "Gea – glass mosaic by Ezarri");
});
