// QM content-legal r2: scrollspy of the Ratgeber table of contents and the
// first calendar week of the appointment picker.
// Run: node --test tests/unit/content-legal-r2.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { activeTocId } from "../../src/lib/ratgeber/tocSpy.js";
import { firstBookableMonday } from "../../src/lib/booking/time.js";

test("activeTocId: last heading above the reading line", () => {
  const tops = [
    { id: "a", top: -400 },
    { id: "b", top: 120 },
    { id: "c", top: 700 },
  ];
  assert.equal(activeTocId(tops, 250), "b");
  assert.equal(activeTocId(tops, 100), "a");
});

test("activeTocId: before the first heading and missing elements", () => {
  assert.equal(activeTocId([{ id: "a", top: 500 }], 250), null);
  assert.equal(activeTocId([{ id: "a", top: Infinity }, { id: "b", top: 10 }], 250), "b");
  assert.equal(activeTocId([], 250), null);
});

test("firstBookableMonday: a Sunday starts with the coming week (24 h lead time)", () => {
  assert.equal(firstBookableMonday("2026-11-01"), "2026-11-02");
});

test("firstBookableMonday: weekdays keep their own week", () => {
  assert.equal(firstBookableMonday("2026-11-04"), "2026-11-02");
  assert.equal(firstBookableMonday("2026-11-06"), "2026-11-02");
  assert.equal(firstBookableMonday("2026-11-07"), "2026-11-09");
  assert.equal(firstBookableMonday("2026-11-02"), "2026-11-02");
});
