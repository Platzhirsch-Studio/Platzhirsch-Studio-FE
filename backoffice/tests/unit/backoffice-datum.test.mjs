// Deutsches Datumsfeld: Eingabe TT.MM.JJJJ ↔ ISO, Kurzformen, Raster.
import test from "node:test";
import assert from "node:assert/strict";
import { isoZuDeutsch, monatsRaster, parseDatum, parseZeit, verschiebe } from "../../src/lib/backoffice/datum.js";

const HEUTE = new Date(2026, 10, 4, 9, 0);

test("parseDatum: deutsche Schreibweisen und Kurzformen", () => {
  assert.equal(parseDatum("04.11.2026", HEUTE), "2026-11-04");
  assert.equal(parseDatum("4.11.26", HEUTE), "2026-11-04");
  assert.equal(parseDatum("4.11.", HEUTE), "2026-11-04");
  assert.equal(parseDatum("24.12", HEUTE), "2026-12-24");
  assert.equal(parseDatum("041126", HEUTE), "2026-11-04");
  assert.equal(parseDatum("2026-11-04", HEUTE), "2026-11-04");
  assert.equal(parseDatum("heute", HEUTE), "2026-11-04");
  assert.equal(parseDatum("+3", HEUTE), "2026-11-07");
  assert.equal(parseDatum("-4", HEUTE), "2026-10-31");
  assert.equal(parseDatum("", HEUTE), "");
  assert.equal(parseDatum("31.02.2026", HEUTE), null);
  assert.equal(parseDatum("abc", HEUTE), null);
});

test("isoZuDeutsch, parseZeit, verschiebe", () => {
  assert.equal(isoZuDeutsch("2026-11-04"), "04.11.2026");
  assert.equal(isoZuDeutsch("2026-11-04 13:30:00"), "04.11.2026");
  assert.equal(isoZuDeutsch(""), "");
  assert.equal(parseZeit("930"), "09:30");
  assert.equal(parseZeit("9"), "09:00");
  assert.equal(parseZeit("14:05"), "14:05");
  assert.equal(parseZeit("25:00"), null);
  assert.equal(verschiebe("2026-01-31", { monate: 1 }), "2026-02-28");
  assert.equal(verschiebe("2026-11-04", { tage: -7 }), "2026-10-28");
});

test("monatsRaster: 42 Tage, Wochenstart Montag", () => {
  const r = monatsRaster(2026, 10); // November 2026 beginnt an einem Sonntag
  assert.equal(r.length, 42);
  assert.equal(r[0].iso, "2026-10-26");
  assert.equal(r[6].iso, "2026-11-01");
  assert.equal(r[6].imMonat, true);
});
