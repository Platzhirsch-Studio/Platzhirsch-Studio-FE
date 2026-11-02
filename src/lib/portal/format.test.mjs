// Unit tests for the portal date helpers. Run: node --test src/lib/portal/format.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { greeting, viennaHour } from "./format.js";

// Vienna is UTC+1 in winter (CET) and UTC+2 in summer (CEST).
test("viennaHour liest die Stunde als Zahl (kein NaN bei '06 Uhr')", () => {
  assert.equal(viennaHour(new Date("2026-01-15T05:00:00Z")), 6);
  assert.equal(viennaHour(new Date("2026-01-15T23:30:00Z")), 0);
  assert.equal(viennaHour(new Date("2026-07-15T04:00:00Z")), 6);
});

test("greeting um 06, 12 und 20 Uhr Wiener Zeit", () => {
  assert.equal(greeting(new Date("2026-01-15T05:00:00Z")), "Guten Morgen"); // 06:00 CET
  assert.equal(greeting(new Date("2026-01-15T11:00:00Z")), "Guten Tag"); // 12:00 CET
  assert.equal(greeting(new Date("2026-01-15T19:00:00Z")), "Guten Abend"); // 20:00 CET
  assert.equal(greeting(new Date("2026-07-15T04:00:00Z")), "Guten Morgen"); // 06:00 CEST
  assert.equal(greeting(new Date("2026-07-15T10:00:00Z")), "Guten Tag"); // 12:00 CEST
  assert.equal(greeting(new Date("2026-07-15T18:00:00Z")), "Guten Abend"); // 20:00 CEST
});
