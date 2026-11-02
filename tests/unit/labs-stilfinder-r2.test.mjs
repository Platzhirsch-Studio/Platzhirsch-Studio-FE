// node --test tests/unit/labs-stilfinder-r2.test.mjs
// Stil-Finder (Labs), Runde 2: Mischbalken (Punkt 8), Zähler (Punkt 7),
// Hydration unter reduced motion (Punkt 5) und Scoring als Grundlage des Balkens.
// questions.js/profiles.js importieren Bilder (next/image) – ein kleiner
// Loader-Hook ersetzt sie hier durch Platzhalter und ergänzt ".js".
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerStilfinderHooks } from "./stilfinder-hooks.lib.mjs";
import { readFileSync } from "node:fs";

registerStilfinderHooks();

const { QUESTIONS, scoreAnswers, isValidCode, leadingProfile } = await import("../../src/components/Labs/Stilfinder/questions.js");
const { PROFILES, PROFILE_ORDER } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const src = (p) => readFileSync(new URL(`../../src/components/Labs/Stilfinder/${p}`, import.meta.url), "utf8");

// All valid codes are too many; a deterministic sample plus edge cases.
function* sampleCodes() {
  yield "0".repeat(QUESTIONS.length);
  for (let i = 0; i < 4; i++) yield QUESTIONS.map((q) => String(Math.min(i, q.options.length - 1))).join("");
  let s = 7;
  for (let n = 0; n < 300; n++) {
    yield QUESTIONS.map((q) => {
      s = (s * 1103515245 + 12345) % 2 ** 31;
      if (q.optional && s % 5 === 0) return "x";
      return String(s % q.options.length);
    }).join("");
  }
}

test("Mischbalken: Anteile ergeben 100 % und jedes sichtbare Segment hat Farbe", () => {
  for (const code of sampleCodes()) {
    assert.ok(isValidCode(code), code);
    const r = scoreAnswers(code);
    const visible = r.shares.filter((s) => s.pct > 0);
    const sum = visible.reduce((a, s) => a + s.pct, 0);
    // fix-04: seit der Restgrößen-Rundung genau 100 (wie labs-stilfinder-r2fix), nicht mehr 98–102.
    assert.equal(sum, 100, `${code}: Summe ${sum}`);
    for (const s of visible) assert.match(PROFILES[s.key].palette[2].hex, /^#[0-9a-f]{6}$/i);
    assert.equal(r.primary, r.shares[0].key);
  }
});

test("Ergebnis-Link der QA (italienische-ruhe?a=0000000) ist gültig", () => {
  const r = scoreAnswers("0000000");
  assert.ok(r);
  assert.ok(PROFILE_ORDER.includes(r.primary));
});

test("ungültige Codes werden abgelehnt", () => {
  for (const bad of ["", "000000", "00000000", "9000000", "<script>", null, "xxxxxxx"]) assert.equal(isValidCode(bad), false, String(bad));
});

test("leadingProfile ohne Antworten = null", () => {
  assert.equal(leadingProfile(Array(QUESTIONS.length).fill(null)), null);
});

test("Punkt 8: Balken serverseitig mit Endbreite, CSS-Animation nur bei motion-safe", () => {
  const s = src("StilResult.js");
  const comp = s.slice(s.indexOf("function Composition"));
  assert.match(comp, /style=\{\{ width: `\$\{s\.pct\}%`/);
  assert.match(comp, /motion-safe:animate-\[sf-mix-fill/);
  assert.doesNotMatch(comp, /initial=/, "keine JS-Startbreite 0 mehr");
});

test("Punkt 5: Ergebnisseite ohne useReducedMotion-abhängige Inline-Styles (Hydration)", () => {
  const s = src("StilResult.js");
  assert.doesNotMatch(s, /useReducedMotion\(|from "motion\/react"/);
  assert.match(s, /@keyframes sf-hero-settle/);
});

test("Punkt 7: Zähler folgt der angezeigten Frage, nicht dem Ziel-Schritt", () => {
  const s = src("StilfinderQuiz.js");
  assert.match(s, /<Progress step=\{shown\}/);
  assert.match(s, /useLayoutEffect\(\(\) => \{\s*onShown\?\.\(index\);/);
});
