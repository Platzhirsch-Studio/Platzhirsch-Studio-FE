// lead-mobil-i18n fix-03: WCAG 2.2 AA 2.5.7 (Ziehbewegungen) und 4.1.3
// (Statusmeldungen). Ein Element ließ sich am Handy nur durch Ziehen
// verschieben; jetzt gibt es Pfeilknöpfe in der Auswahlleiste (gleicher
// Rasterschritt und dasselbe Andocken wie die Pfeiltasten), und jeder Schritt
// sagt die neue Lage an. Reiner Quelltext-Test wie die übrigen Planer-Tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { UI_EN } from "../../src/lib/sofaplaner/copy/ui-en.js";
import { makeT } from "../../src/lib/sofaplaner/copy/t.js";

const src = readFileSync(new URL("../../src/components/Labs/Sofaplaner/Planner.js", import.meta.url), "utf8");

test("Auswahlleiste: Knopf „Verschieben“ öffnet vier Pfeilknöpfe und „Fertig“", () => {
  assert.match(src, /data-sel-move-open/);
  assert.match(src, /role="group" aria-label=\{T\("Element verschieben"\)\}/);
  for (const dir of ["Nach links", "Nach oben", "Nach unten", "Nach rechts"]) assert.ok(src.includes(`"${dir}"`), dir);
  assert.match(src, /onClick=\{\(\) => nudge\(selected, dx, dy\)\}/);
  assert.match(src, /data-sel-move-done/);
});

test("Pfeiltasten und Pfeilknöpfe teilen sich nudge() (Andocken, Ansage der Lage)", () => {
  assert.match(src, /const nudge = \(it, dx, dy\) =>/);
  assert.match(src, /nudge\(it, dx, dy\);/);
  const body = src.slice(src.indexOf("const nudge = "), src.indexOf("const onKey = "));
  assert.match(body, /snapDock\(/);
  assert.match(body, /setAnnounce\(/);
});

test("neue Texte haben eine englische Fassung", () => {
  const keys = ["Verschieben", "Verschieben ohne Ziehen (auch Pfeiltasten)", "Element verschieben", "Nach links", "Nach oben", "Nach unten", "Nach rechts", "{dir} verschieben ({n} cm)", "{x} cm von der linken Wand, {y} cm von der oberen Wand."];
  for (const k of keys) assert.ok(UI_EN[k], k);
  const en = makeT("en");
  assert.equal(en("{dir} verschieben ({n} cm)", { dir: en("Nach links"), n: 10 }), "Move left (10 cm)");
  assert.equal(makeT("de")("{dir} verschieben ({n} cm)", { dir: "Nach links", n: 10 }), "Nach links verschieben (10 cm)");
});
