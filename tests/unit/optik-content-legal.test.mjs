// Optik QA content-legal: German micro-typography for news copy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { newsTypo } from "../../src/components/News/newsTypo.js";

test("newsTypo closes mixed quotes and keeps day + month together (DE only)", () => {
  assert.equal(newsTypo('Vernissage „Birds Zyklus" von M. Fohn', "de"), "Vernissage „Birds Zyklus“ von M. Fohn");
  assert.equal(newsTypo('Die Serie "Lyngby"', "de"), "Die Serie „Lyngby“");
  assert.equal(newsTypo("Am Freitag, 4. September 2026", "de"), "Am Freitag, 4.\u00a0September 2026");
  assert.equal(newsTypo("um 17:00 Uhr, 30 cm", "de"), "um 17:00 Uhr, 30\u00a0cm");
  assert.equal(newsTypo('the "Birds" cycle', "en"), 'the "Birds" cycle');
  assert.equal(newsTypo("", "de"), "");
  assert.equal(newsTypo(undefined, "de"), undefined);
});
