// node --test tests/unit/labs-arviewer-r2fix.test.mjs
// 3D/AR-Viewer, Runde 2 Nachbesserung (P2-2): Maß-Labels in der Seitenschrift,
// kräftiger Kontrast, Maßlinien laufen nicht durch die Labels.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../src/components/Labs/ArViewer/${p}`, import.meta.url), "utf8");

test("kein --font-montserrat mehr im AR-Viewer", () => {
  for (const f of ["ArViewer.module.css", "ModelStage.js", "ArViewerApp.js"]) assert.doesNotMatch(read(f), /font-montserrat/, f);
  const css = read("ArViewer.module.css");
  const dim = css.slice(css.indexOf(".dim {"), css.indexOf("}", css.indexOf(".dim {")));
  assert.match(dim, /var\(--font-sans/);
  assert.match(dim, /background: #fff;/);
  assert.match(dim, /color: #1f252b;/);
});

test("Maßlinien liegen unter einer Maske mit Aussparung je Label", () => {
  const s = read("ModelStage.js");
  assert.match(s, /<mask id=\{maskId\}/);
  assert.match(s, /<g mask=\{`url\(#\$\{maskId\}\)`\}>/);
  assert.match(s, /rect\[data-dim-hole\]/);
  assert.match(s, /hole\.setAttribute\("width", show \?/);
});
