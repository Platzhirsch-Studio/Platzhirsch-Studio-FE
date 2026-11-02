// node --test tests/unit/kuechenplaner-gs-nische.test.mjs
// Planungslogik Fix 03: Nischenhöhe des Geschirrspülers (Sockel + Korpus) prüfen.
// Vorgabe 15 + 78 = 93 cm liegt über 92,5 cm (Bosch-Beispiel für hohe Nischen) → Tipp, Gerät prüfen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPlan, switchRaster } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";
import { RULES } from "../../src/lib/kuechenplaner/norms.js";

const gs = (plan) => runChecks(plan, buildKitchen(plan)).items.filter((i) => /^Geschirrspüler(: | im 55)/.test(i.text));
const withErgo = (plinth, carcass) => {
  const p = defaultPlan("zeile");
  p.ergo = { ...p.ergo, plinth, carcass };
  return p;
};

test("Regeln mit Quelle (Herstellerbeispiel), Bereiche schlüssig", () => {
  for (const r of [RULES.dwNiche, RULES.dwNicheHigh]) assert.ok(r.source?.url?.startsWith("https://"));
  assert.ok(RULES.dwNiche.min < RULES.dwNicheHigh.min && RULES.dwNiche.max < RULES.dwNicheHigh.max);
});

test("Sockel 10 + Korpus 72 = 82 cm → passt zu Standardgeräten", () => {
  const [i] = gs(withErgo(10, 72));
  assert.equal(i.level, "ok");
  assert.match(i.text, /Nische 82 cm/);
});

test("Sockel 12 + Korpus 78 = 90 cm → Gerät für hohe Nischen nötig", () => {
  const [i] = gs(withErgo(12, 78));
  assert.equal(i.level, "hint");
  assert.match(i.text, /hohe Nischen \(Beispiel 86,5–92,5 cm\)/);
});

test("Vorgabe 15 + 78 = 93 cm → Tipp (hint) mit Vorschlag Sockel senken", () => {
  const [i] = gs(defaultPlan("zeile"));
  assert.equal(i.level, "hint");
  assert.match(i.text, /Nische 93 cm hoch/);
  assert.match(i.text, /Sockel um 1 cm senken/);
});

test("Sockel 6 + Korpus 72 = 78 cm → zu niedrig", () => {
  const [i] = gs(withErgo(6, 72));
  assert.equal(i.level, "warn");
  assert.match(i.text, /nur 78 cm/);
});

test("55-cm-Raster (SMS): kein EU-Gerätemaß, nur Abgleich mit dem SMS-Gerät", () => {
  const [i] = gs(switchRaster(defaultPlan("zeile"), 55));
  assert.equal(i.level, "hint");
  assert.match(i.text, /SMS/);
});

test("ohne Geschirrspüler keine Meldung", () => {
  const p = defaultPlan("zeile");
  p.runs.a = p.runs.a.filter((m) => m.t !== "geschirrspueler");
  assert.equal(gs(p).length, 0);
});
