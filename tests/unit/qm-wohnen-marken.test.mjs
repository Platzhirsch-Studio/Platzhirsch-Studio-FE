// tests/unit/qm-wohnen-marken.test.mjs — Visual-QA Wohnen & Marken (01.11.2026)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { withoutSpecDuplicates } from "../../src/components/ShopCatalog/descriptionBlocks.js";
import { splitBrandHyphens } from "../../src/components/UberUns/brandHyphen.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("withoutSpecDuplicates drops a field the spec already lists (case/space-insensitive)", () => {
  const fields = [
    { key: "weight", label: "Gewicht", value: ["3,3 kg"] },
    { key: "color", label: "Farbe", value: ["Schwarz"] },
  ];
  const spec = [{ title: "", items: [{ label: " gewicht ", html: "3.3 kg" }], extra: [] }];
  assert.deepEqual(withoutSpecDuplicates(fields, spec).map((f) => f.key), ["color"]);
  assert.deepEqual(withoutSpecDuplicates(fields, []).map((f) => f.key), ["weight", "color"]);
  assert.deepEqual(withoutSpecDuplicates(undefined, spec), []);
});

test("splitBrandHyphens isolates V-ZUG, joined text unchanged", () => {
  const s = "Händler von Gaggenau, Miele, V-ZUG, BORA und Quooker.";
  const parts = splitBrandHyphens(s);
  assert.equal(parts.join(""), s);
  assert.deepEqual(parts.filter((_, i) => i % 2), ["V-ZUG"]);
  assert.deepEqual(splitBrandHyphens("Ohne Marke"), ["Ohne Marke"]);
  assert.deepEqual(splitBrandHyphens("Outdoor-Möbel"), ["Outdoor-Möbel"]);
});

test("cover-cropped 3:2 photos request ~1.9× the frame width", () => {
  assert.match(read("src/components/UberUns/PageHeader.js"), /\(min-width: 1024px\) 900px/);
  // QM wm-r4 (bewusst geändert): 3:2-Fotos in 3:2-Rahmen – kein Beschnitt mehr.
  assert.match(read("src/components/UberUns/uberuns.js"), /ratio="3\/2"\n\s+sizes=\{i === 2 \? "\(min-width: 1440px\) 420px/);
});

test("product weight is locale-formatted", () => {
  const src = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(src, /parseWeight\(product\.weightRaw\)/);
  assert.match(src, /Intl\.NumberFormat\(locale/);
});

test("withoutRepeatedParagraphs drops a paragraph the guide already shows", async () => {
  const { withoutRepeatedParagraphs } = await import("../../src/components/MarkenItems/copy.js");
  const stmt = "Minotti hat das Studio 2019 eröffnet.";
  assert.deepEqual(withoutRepeatedParagraphs([stmt, "Sie finden das Studio."], [`${stmt} Das Studio liegt in Lochau.`]), ["Sie finden das Studio."]);
  assert.deepEqual(withoutRepeatedParagraphs([stmt], undefined), [stmt]);
});

test("brand meta lists bind the separator to the preceding word", () => {
  const src = read("src/components/MarkenClient/Marken.js");
  const bs = String.fromCharCode(92); // backslash: the source holds the escape, not the character
  assert.equal(src.split(`join("${bs}u00a0· ")`).length - 1, 2);
});
