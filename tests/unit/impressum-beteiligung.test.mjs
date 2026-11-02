// Beteiligungsverhältnisse (§ 25 Abs 2 MedienG), eingetragen 30.10.2026.
// Kammer und Blattlinie bleiben leer, bis der Wortlaut vorliegt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../../src/components/Impressum/impressum.js", import.meta.url), "utf8");

test("Impressum nennt beide Gesellschafter mit je 50 %", () => {
  assert.match(src, /name: "Susanne Messmer", share: "50 %"/);
  assert.match(src, /name: "Andreas Wegscheider", share: "50 %"/);
  assert.match(src, /\{shareholders\}/);
});

test("WKO-Kammer belegt, Blattlinie nicht geschätzt", () => {
  assert.match(src, /source: "WKO Firmen A–Z/);
  assert.match(src, /text: null/);
});
