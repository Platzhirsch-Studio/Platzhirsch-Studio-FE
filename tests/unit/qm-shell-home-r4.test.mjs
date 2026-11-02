// QM shell-home r4: the open concierge side panel and a late cookie bar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { yieldToConsent } from "../../src/components/Concierge/flags.js";

test("no cookie bar: the panel stays open", () => {
  assert.equal(yieldToConsent({ barH: 0, vh: 390, headerH: 64 }), false);
});

test("tall screens: the panel shrinks above the bar and stays open", () => {
  // iPad landscape 1194 × 834, bar ≈ 100 px
  assert.equal(yieldToConsent({ barH: 100, vh: 834, headerH: 72 }), false);
  // laptop 1280 × 800, bar ≈ 90 px
  assert.equal(yieldToConsent({ barH: 90, vh: 800, headerH: 72 }), false);
});

test("short screens: the panel minimises instead of a sliver above the bar", () => {
  // phone landscape 844 × 390, bar ≈ 220 px
  assert.equal(yieldToConsent({ barH: 220, vh: 390, headerH: 64 }), true);
  // laptop 1366 × 768 with a three-line bar of 260 px
  assert.equal(yieldToConsent({ barH: 260, vh: 768, headerH: 72 }), true);
});
