// node --test tests/unit/yacht-concepttabs-locale.test.mjs
// Yacht team (anfrage-mobil-code, 31.10.2026): ConceptTabs caches the lazily
// loaded concept panels per locale. Before, one module-level promise kept the
// first language for the whole session (client navigation EN → DE showed
// English panels on /de/yacht-interior).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import concepts from "../../src/lib/yacht/concepts.json" with { type: "json" };
import renders from "../../src/lib/yacht/renders.json" with { type: "json" };
import { buildConcepts } from "../../src/lib/yacht/model.js";
import { localizeConcepts } from "../../src/lib/yacht/concepts-en.js";

// same as src/lib/yacht/conceptPanels.js (that file uses bundler-only imports)
const panelConcepts = (locale) => localizeConcepts(buildConcepts(concepts, renders).filter((c) => c.model !== "superyacht"), locale);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = fs.readFileSync(path.join(ROOT, "src/components/Yacht/ConceptTabs.js"), "utf8");

test("ConceptTabs: Cache je Sprache, Fehler verwirft nur den Eintrag dieser Sprache", () => {
  assert.doesNotMatch(src, /let panelsPromise\b/, "kein sprachunabhängiger Cache mehr");
  assert.match(src, /const panelsPromises = new Map\(\);/);
  assert.match(src, /panelsPromises\.set\(locale, import\("@\/lib\/yacht\/conceptPanels"\)\.then\(\(m\) => m\.panelConcepts\(locale\)\)\)/);
  assert.match(src, /panelsPromises\.delete\(locale\);/);
});

test("Die Panels unterscheiden sich wirklich je Sprache (sonst wäre der Cache egal)", () => {
  const de = panelConcepts("de");
  const en = panelConcepts("en");
  assert.equal(de.length, en.length);
  assert.ok(de.some((c, i) => c.title !== en[i].title || c.motto !== en[i].motto), "DE und EN haben eigene Texte");
});
