// node --test tests/unit/kp-lead-eckdaten.test.mjs
// Lead-Übergabe (Küchenplaner-Team, fix-07): freiwillige Eckdaten für die
// Beratung (Projekt, Zeitraum, Gerätewunsch; ?geraet= wertet page.js aus – Geräte-Anbindung,
// Grundriss/Fotos) als eine Zeile hinter der Planung; nichts im Teilen-Link.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BUDGET_AKTIV, EMPTY_ECKDATEN, GERAETE_WAHL, eckdatenLines, normalizeEckdaten } from "../../src/lib/kuechenplaner/eckdaten.js";
import { GERAETE_MARKEN } from "../../src/lib/kueche/geraete.js";
import { handoffProdukt, handoffSummary } from "../../src/lib/kuechenplaner/handoff.js";
import { hasUnprovenClaim } from "../../src/lib/legal/claims.js";

test("Nichts gewählt → keine Zeile", () => {
  assert.deepEqual(eckdatenLines(EMPTY_ECKDATEN), []);
  assert.deepEqual(eckdatenLines({}), []);
});

test("Eine Zeile mit festen Labels, unbekannte Werte fallen weg", () => {
  const [line, ...rest] = eckdatenLines({ projekt: "neubau", zeitraum: "3-6", geraete: ["gaggenau", "bora", "<script>"], unterlagen: true, budget: "ab-100" });
  assert.equal(rest.length, 0);
  assert.equal(line, "Eckdaten: Projekt Neubau · Umsetzung in 3–6 Monaten · Gerätewunsch Gaggenau, BORA · Grundriss/Fotos vorhanden");
  assert.equal(normalizeEckdaten({ projekt: "villa", zeitraum: "morgen" }).projekt, "");
  // Budget erst nach Inhaber-Freigabe
  assert.equal(BUDGET_AKTIV, false);
  assert.doesNotMatch(line, /Budget|€/);
  assert.equal(hasUnprovenClaim(line), false);
});

test("Gerätewunsch: nur die sechs Gerätemarken, Hinweis optional", () => {
  assert.deepEqual(GERAETE_WAHL.map((g) => g.id), GERAETE_MARKEN.map((m) => m.id));
  assert.deepEqual(eckdatenLines(EMPTY_ECKDATEN, { hint: "quooker" }), ["Eckdaten: Gerätewunsch Quooker"]);
  // Wer die Vorauswahl abwählt (geraete: []), hat keinen Wunsch mehr
  assert.deepEqual(eckdatenLines({ ...EMPTY_ECKDATEN, geraete: [] }, { hint: "quooker" }), []);
});

test("Eckdaten reisen im Übergabe-Text, der Kurztext ?produkt= bleibt die Grundform", () => {
  const lines = ["Grundform: L-Form · Raster 60 cm", ...eckdatenLines({ zeitraum: "0-3" })];
  assert.match(handoffSummary({ lines }), /Eckdaten: Umsetzung in den nächsten 3 Monaten/);
  assert.equal(handoffProdukt(lines), "3D-Küchenplaner: L-Form");
});

test("ResultPanel hängt die Eckdaten an die Planungszeilen und zeigt die Fragen außerhalb des Formulars", () => {
  const src = readFileSync(new URL("../../src/components/Labs/Kuechenplaner/ResultPanel.js", import.meta.url), "utf8");
  assert.match(src, /const linesDe = \[\.\.\.summaryLines\(plan, geraete\), \.\.\.eckdatenLines\(\{ \.\.\.eck, geraete: eckGeraete \}\)\];/);
  // ?geraet= gehört der Geräte-Anbindung (page.js) – das Panel liest die Adresszeile dafür nicht
  assert.doesNotMatch(src, /geraetFromSearch/);
  const fieldset = src.indexOf("data-kp-eckdaten");
  const form = src.indexOf("<form ref={formRef}");
  assert.ok(fieldset > 0 && form > fieldset, "Eckdaten stehen vor (und außerhalb) des Formulars");
});
