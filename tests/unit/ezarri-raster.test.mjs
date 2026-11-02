import { test } from "node:test";
import assert from "node:assert/strict";
import { spurenDreier } from "../../src/lib/ezarri/raster.js";

const zeilen = (n) => {
  const out = [];
  let summe = 0;
  let zeile = [];
  for (let i = 0; i < n; i++) {
    const s = spurenDreier(i, n);
    zeile.push(s);
    summe += s;
    if (summe === 6) {
      out.push(zeile);
      zeile = [];
      summe = 0;
    }
  }
  assert.equal(summe, 0, `n=${n}: letzte Zeile nicht bündig`);
  return out;
};

test("jede Zeile füllt die 6 Spuren genau", () => {
  for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20]) zeilen(n);
});

test("7 Kacheln: 3 + 2 + 2, 11 Kacheln: 3 + 3 + 3 + 2", () => {
  assert.deepEqual(zeilen(7).map((z) => z.length), [3, 2, 2]);
  assert.deepEqual(zeilen(11).map((z) => z.length), [3, 3, 3, 2]);
  assert.deepEqual(zeilen(3).map((z) => z.length), [3]);
});
