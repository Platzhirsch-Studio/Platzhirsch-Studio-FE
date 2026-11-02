import { test } from "node:test";
import assert from "node:assert/strict";
import { shelfSpans12 } from "../../src/lib/yacht/layout.js";

test("jede Zeile des 12er-Markenrasters endet bündig", () => {
  for (let n = 1; n <= 12; n++) {
    let sum = 0;
    for (const s of shelfSpans12(n)) {
      sum += s;
      assert.ok(sum <= 12, `n=${n}: Zeile läuft über`);
      if (sum === 12) sum = 0;
    }
    assert.equal(sum, 0, `n=${n}: letzte Zeile nicht bündig`);
  }
});

test("Gruppen der Yacht-Seite: 2 → 6+6, 3 → 4+4+4, 4 → 3×4", () => {
  assert.deepEqual(shelfSpans12(2), [6, 6]);
  assert.deepEqual(shelfSpans12(3), [4, 4, 4]);
  assert.deepEqual(shelfSpans12(4), [3, 3, 3, 3]);
});
