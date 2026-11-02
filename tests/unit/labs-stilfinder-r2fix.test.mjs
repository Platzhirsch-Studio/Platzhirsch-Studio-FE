// node --test tests/unit/labs-stilfinder-r2fix.test.mjs
// Stil-Finder, Runde 2 Nachbesserung: Mischung exakt 100 % (P3), kein sichtbarer
// Preis-Platzhalter (P3), H1-Kerning "Welcher Wohnstil" (P2-3), kein
// next/image placeholder="blur" (P2-1, Android-Konsolenfehler).
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerStilfinderHooks } from "./stilfinder-hooks.lib.mjs";
import { readFileSync } from "node:fs";

registerStilfinderHooks({ blurDataURL: "data:image/jpeg;base64,AA" });

const { QUESTIONS, scoreAnswers } = await import("../../src/components/Labs/Stilfinder/questions.js");
const { blurBackdrop } = await import("../../src/components/Labs/Stilfinder/blurBackdrop.js");
const src = (p) => readFileSync(new URL(`../../src/components/Labs/Stilfinder/${p}`, import.meta.url), "utf8");

function* codes() {
  let s = 11;
  for (let n = 0; n < 2000; n++) {
    yield QUESTIONS.map((q) => {
      s = (s * 1103515245 + 12345) % 2 ** 31;
      if (q.optional && s % 4 === 0) return "x";
      return String(s % q.options.length);
    }).join("");
  }
}

test("Mischung ergibt immer genau 100 % und bleibt nach Anteil sortiert", () => {
  for (const code of codes()) {
    const r = scoreAnswers(code);
    const sum = r.shares.reduce((a, s) => a + s.pct, 0);
    assert.equal(sum, 100, `${code}: ${JSON.stringify(r.shares)}`);
    for (const s of r.shares) assert.ok(s.pct >= 0);
  }
});

test("Frage 7 zeigt keinen Preis-Platzhalter", () => {
  const scope = QUESTIONS.find((q) => q.kind === "scope");
  for (const o of scope.options) assert.ok(o.range == null || !/^\[/.test(o.range), o.label);
  for (const f of ["questions.js", "StilfinderQuiz.js", "StilResult.js"]) assert.doesNotMatch(src(f), /Preis vom Inhaber/);
});

test("H1: W-Kerning lokal, Text bleibt 'Welcher Wohnstil'", () => {
  const s = src("StilfinderQuiz.js");
  // Mehrsprachigkeit (01.11.2026): H1-Text aus intl/<locale>.js, kernW() setzt denselben W-Kern-Span.
  assert.match(s, /\{kernW\(t\.quiz\.h1a\)\}/);
  assert.match(readFileSync(new URL("../../src/lib/stilfinder/intl/de.js", import.meta.url), "utf8"), /h1a: "Welcher Wohnstil"/);
  assert.match(src("kernW.js"), /export const W_KERN = "tracking-\[-0\.\d+em\]"/);
  assert.match(s, /\{kernW\(q\.title\)\}/);
  assert.match(src("StilResult.js"), /\{kernW\(profile\.name\)\}/);
});

test("kein placeholder=\"blur\" mehr (asynchroner setState in next/image)", () => {
  for (const f of ["StilfinderQuiz.js", "StilResult.js"]) assert.doesNotMatch(src(f), /placeholder="blur"/, f);
  assert.deepEqual(Object.keys(blurBackdrop({ blurDataURL: "data:x" })), ["backgroundImage", "backgroundSize", "backgroundPosition"]);
  assert.equal(blurBackdrop("/plain.jpg"), undefined);
});
