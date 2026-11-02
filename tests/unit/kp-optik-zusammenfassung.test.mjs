// node --test tests/unit/kp-optik-zusammenfassung.test.mjs
// Optik-QA planer-tools: Die Klartext-Zusammenfassung schreibt Spüle und Rückwand
// mit den Katalog-Labels (Substantive groß) statt komplett kleingeschrieben
// („kante sichtbar“, „wie arbeitsplatte“).
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { summaryLines } from "../../src/components/Labs/Kuechenplaner/pricing.js";
import { SINK_MOUNTS, SPLASHES } from "../../src/components/Labs/Kuechenplaner/catalog.js";

test("Arbeitsplatten-Zeile übernimmt die Labels unverändert", () => {
  for (const sink of Object.keys(SINK_MOUNTS)) {
    for (const splash of Object.keys(SPLASHES)) {
      const line = summaryLines({ ...defaultPlan(), sink, splash }).find((l) => l.startsWith("Arbeitsplatte:"));
      assert.ok(line.includes(`Spüle: ${SINK_MOUNTS[sink].label}`), line);
      assert.ok(line.includes(`Rückwand: ${SPLASHES[splash].label}`), line);
    }
  }
});

test("Keine kleingeschriebenen Substantive mehr", () => {
  const line = summaryLines({ ...defaultPlan(), sink: "unterbau", splash: "platte" }).find((l) => l.startsWith("Arbeitsplatte:"));
  assert.ok(!/kante sichtbar|wie arbeitsplatte/.test(line), line);
});
