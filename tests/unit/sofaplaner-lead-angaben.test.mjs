// lead-mobil-i18n fix-04: Zeitrahmen und Lieferland (freiwillig) gehen mit dem
// Plantext in die Übergabe – das Studio sieht vor dem Termin, wann und wohin.
// Keine Kontaktdaten, nur Auswahlwerte; unbekannte Werte fallen weg.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LEAD_LAND, LEAD_ZEIT, leadLines, leadOptions } from "../../src/lib/sofaplaner/handoff.js";
import { UI_EN } from "../../src/lib/sofaplaner/copy/ui-en.js";

const src = readFileSync(new URL("../../src/components/Labs/Sofaplaner/ResultPanel.js", import.meta.url), "utf8");

test("leadLines: DE/EN, leere und fremde Werte fallen weg", () => {
  assert.deepEqual(leadLines({}), []);
  assert.deepEqual(leadLines({ zeit: "mittel", land: "CH" }), ["Zeitrahmen: in 3–6 Monaten", "Lieferung nach: Schweiz"]);
  assert.deepEqual(leadLines({ zeit: "bald", land: "AT" }, "en"), ["Timeframe: within the next 3 months", "Delivery to: Austria"]);
  assert.deepEqual(leadLines({ zeit: "<script>", land: "US" }), []);
});

test("Auswahl: AT/DE/CH/FL + anderes Land, vier Zeitrahmen, Texte je Sprache", () => {
  assert.deepEqual(LEAD_LAND.map((r) => r[0]), ["AT", "DE", "CH", "FL", "X"]);
  assert.equal(LEAD_ZEIT.length, 4);
  for (const loc of ["de", "en"]) for (const [, label] of [...leadOptions(LEAD_ZEIT, loc), ...leadOptions(LEAD_LAND, loc)]) assert.ok(label);
  assert.doesNotMatch(leadOptions(LEAD_LAND, "en").map((r) => r[1]).join(" "), /[äöü]|Schweiz|Deutschland/);
});

test("ResultPanel: Angaben im Übergabeblock, Plantext und Übergabe nutzen sie", () => {
  assert.match(src, /data-sofa-lead=""/);
  assert.match(src, /leadLines\(lead, T\.locale\)/);
  assert.match(src, /storeHandoff\(storage, \{ text: planText\(plan, family, (?:shareUrl|link)\)/); // katalog fix-05: Variable heißt jetzt `link`
  for (const k of ["Für das Gespräch (freiwillig, geht mit dem Plantext mit)", "Zeitrahmen", "Lieferung nach"]) assert.ok(UI_EN[k], k);
});
