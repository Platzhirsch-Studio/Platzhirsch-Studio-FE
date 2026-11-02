// node --test tests/unit/kuechenplaner-a11y-fix04.test.mjs
// Mobil-A11y fix-04: Zahlenfelder – Minus auf dem iPhone eintippbar, 44-px-Ziele.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const K = "src/components/Labs/Kuechenplaner/";

const app = read(`${K}KuechenplanerApp.js`);

test("fix-04: inputmode numeric nur ohne negative Werte (iOS-Ziffernblock ohne Minus)", () => {
  assert.match(app, /inputMode=\{min < 0 \? undefined : "numeric"\}/);
  assert.match(app, /enterKeyHint="done"/);
});

test("fix-04: Zahlenfeld und Schieberegler 44 px hoch", () => {
  assert.match(app, /className=\{`h-11 w-20 border bg-paper px-2 text-right text-base text-ink/);
  assert.match(app, /type="range"[^\n]*className="h-11 w-full accent-ink"/);
});

test("fix-04: es gibt weiterhin ein Feld mit negativem Minimum (sonst ist der Test sinnlos)", async () => {
  const { LIMITS } = await import(new URL(`../../${K}catalog.js`, import.meta.url));
  assert.ok(LIMITS.islandShift.min < 0);
});
