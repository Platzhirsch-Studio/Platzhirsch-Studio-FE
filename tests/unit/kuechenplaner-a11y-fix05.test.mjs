// node --test tests/unit/kuechenplaner-a11y-fix05.test.mjs
// Mobil-A11y fix-05: 3D – Drehen ohne Wischgeste auch mobil, Name enthält sichtbares „2D“,
// Fokus geht beim Wechsel 2D/3D nicht verloren.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const K = "src/components/Labs/Kuechenplaner/";

const v = read(`${K}Viewer.js`);

test("fix-05: mobile Leiste (sm:hidden) hat Drehknöpfe", () => {
  const bar = v.slice(v.indexOf('aria-label={tr("Ansicht, Licht und Foto")}'), v.indexOf('aria-label={tr("Foto dieser Ansicht speichern")}'));
  assert.match(bar, /rotate\(-1\)[\s\S]*aria-label=\{tr\("Nach links drehen"\)\}/);
  assert.match(bar, /rotate\(1\)[\s\S]*aria-label=\{tr\("Nach rechts drehen"\)\}/);
});

test("fix-05: Label in Name – „2D-Plan“ statt „Plan“", () => {
  assert.match(v, /\["2d", "2D-Plan", "2D"\]/);
  assert.doesNotMatch(v, /\["2d", "Plan", "2D"\]/);
});

test("fix-05: Fokus-Übergabe beim Wechsel zwischen Grundriss und 3D", () => {
  assert.match(v, /ref=\{editorRef\}/);
  assert.match(v, /ref=\{id === "3d" \? btn3dRef : undefined\}/);
  assert.match(v, /ref=\{rail3dRef\}/);
  assert.match(v, /btn3dRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
});
