// node --test tests/unit/kuechenplaner-a11y-fix03.test.mjs
// Mobil-A11y fix-03: Prüfergebnis als gebündelte Statusmeldung (WCAG 4.1.3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const K = "src/components/Labs/Kuechenplaner/";

const app = read(`${K}KuechenplanerApp.js`);

test("fix-03: eigener, immer vorhandener Live-Bereich für das Prüfergebnis", () => {
  assert.match(app, /<p className="sr-only" role="status" aria-live="polite" data-kp-check-note="">\{checkNote\}<\/p>/);
  assert.match(app, /setTimeout\(\(\) => \{\s*lastCounts\.current = countKey;/);
  assert.match(app, /\}, 700\);/);
});

test("fix-03: Hinweiskasten unter dem Panel ist kein Live-Bereich mehr", () => {
  const box = app.slice(app.indexOf("tab !== \"ergebnis\" && tab !== \"pruefen\" && problems.length > 0"));
  const first = box.slice(0, box.indexOf("</p>"));
  assert.match(first, /data-kp-problems=""/);
  assert.doesNotMatch(first, /role="status"/);
});
