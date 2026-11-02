// Stil-Finder-Ergebnis: Statusmeldung (Kopieren/Merken) mit genau einem Timer
// (mobil-code-seo, fix-05). Quelltext-Prüfung; Verhalten im E2E-Smoke.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const s = readFileSync(new URL("../../src/components/Labs/Stilfinder/StilResult.js", import.meta.url), "utf8");

test("say(): alter Timer wird gelöscht, Timer beim Unmount aufgeräumt", () => {
  const body = s.slice(s.indexOf("const say = (msg) =>"), s.indexOf("const copy = async"));
  assert.match(body, /window\.clearTimeout\(sayTimer\.current\);\s*setStatus\(msg\);/);
  assert.match(body, /sayTimer\.current = window\.setTimeout\(/);
  assert.match(s, /useEffect\(\(\) => \(\) => window\.clearTimeout\(sayTimer\.current\), \[\]\)/);
});

test("Live-Region bleibt: sr-only role=status + sichtbare Zeile aria-hidden (keine Doppelansage)", () => {
  assert.match(s, /<p className="sr-only" role="status" aria-live="polite">\s*\{status\}/);
  assert.match(s, /aria-hidden="true">\s*\{status\}/);
});
