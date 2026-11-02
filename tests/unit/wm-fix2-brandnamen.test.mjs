// QM wm-fix2: Schreibweise der Marken in der A–Z-Liste (/ueber-uns/marken) und
// Rhythmus der Gruppenköpfe im Katalog-Hub (/produkte).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const code = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("antoniolupi und next125 werden klein geschrieben angezeigt", () => {
  const src = code("src/lib/content/brands.js");
  const map = src.slice(src.indexOf("const BRAND_DISPLAY_NAMES"));
  assert.match(map, /antoniolupi:\s*"antoniolupi"/);
  assert.match(map, /next125:\s*"next125"/);
  // bestehende Schreibweisen bleiben
  assert.match(map, /schueller:\s*"Schüller"/);
  assert.match(map, /treca:\s*"Tréca"/);
});

test("Katalog-Hub: Anzahl auf dem Handy immer unter dem Gruppentitel", () => {
  const src = code("src/components/ShopCatalog/shopCategoryGrid.js");
  assert.match(src, /flex flex-col gap-y-2 sm:flex-row/);
});

test("Planen & Erleben: „So arbeiten wir“ steht in eigener Zeile", () => {
  const src = code("src/components/Reusable/PlanLinks.js");
  assert.doesNotMatch(src, /von Hand\.\{" "\}/);
});

test("Marken A–Z und Gruppen: alle Namen gleich groß (QM wm-fix3), lange Wörter mit Trennung", () => {
  const src = code("src/components/MarkenClient/Marken.js");
  assert.doesNotMatch(src, /name\.length/);
  // QM wm-r4 (bewusst geändert): eine Größe auch bei 1920 px, Markennamen ohne Silbentrennung.
  assert.match(src, /const NAME_SIZE = "[^"]*sm:text-\[2rem\]"/);
  assert.match(src, /NAME_SIZE = "[^"]*hyphens-manual/);
  assert.equal(src.match(/\$\{NAME_SIZE\}/g)?.length, 2);
});

test("Karriere: Listen ohne hängende Klammern (Safari)", () => {
  assert.match(code("src/components/Karriere/karriereposition.js"), /<dl className="[^"]*\[hanging-punctuation:none\]/);
  assert.equal(code("src/components/Karriere/JobDetail.js").match(/\[hanging-punctuation:none\]/g)?.length, 2);
});
