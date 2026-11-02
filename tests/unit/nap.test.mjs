// NAP-Inventur (tools/checks/check-nap.mjs). Run: node --test tests/unit/nap.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanNap, NAP_RULES, SOURCE_OF_TRUTH } from "../../tools/checks/check-nap.mjs";

const rules = (src) => scanNap(src).map((f) => f.rule);

test("Quelle der Wahrheit ist src/lib/site.js", () => {
  assert.equal(SOURCE_OF_TRUTH, "src/lib/site.js");
  assert.ok(NAP_RULES.length >= 8);
});

test("Hausnummer 9 und 11 in allen Schreibweisen", () => {
  const f = scanNap("Landstraße 9\nLandstrasse 11\nLandstra%C3%9Fe%209\nLandstraße+9,+6911+Lochau");
  const nums = f.filter((x) => x.rule === "hausnummer").map((x) => [x.line, x.number]);
  assert.deepEqual(nums, [[1, "9"], [2, "11"], [3, "9"], [4, "9"]]);
});

test("Straße ohne Nummer separat", () => {
  assert.deepEqual(rules("Lochau an der Landstraße, nahe Bregenz"), ["strasse"]);
});

test("PLZ + Ort", () => {
  assert.ok(rules("6911 Lochau").includes("plz-ort"));
  assert.ok(rules("A-6911 Lochau").includes("plz-ort"));
});

test("Telefon Platzhirsch in mehreren Formaten, nicht doppelt als 'sonst'", () => {
  for (const s of ["+43 5574 46255", "tel:+43557446255", "05574 46255", "+43 (0)5574 / 46 255", "0043 5574 46255"]) {
    const r = rules(s);
    assert.ok(r.includes("telefon"), s);
    assert.ok(!r.includes("telefon-sonst"), s);
  }
});

test("Andere Telefonnummer (z. B. Partner)", () => {
  assert.deepEqual(rules("Tel. +41 71 222 33 44"), ["telefon-sonst"]);
});

test("Öffnungszeiten in 4 Sprachen und im Schema", () => {
  const samples = [
    "Di–Fr 10–18 Uhr",
    "Dienstag bis Freitag von 10 bis 18 Uhr",
    "Tuesday to Friday 10:00–18:00",
    "du mardi au vendredi de 10 h à 18 h",
    "da martedì a venerdì dalle 10 alle 18",
    '"opens": "10:00"',
    "openingHoursSpecification",
  ];
  for (const s of samples) assert.ok(rules(s).includes("oeffnungszeiten"), s);
});

test("Keine Fehlalarme: fr-FR, Preise, Datumsangaben", () => {
  assert.deepEqual(rules('locale === "fr" ? "fr-FR" : "de-AT"'), []);
  assert.deepEqual(rules("Preis 7.210 € (Stand 26.10.2026)"), []);
});

test("E-Mail und Geo", () => {
  assert.deepEqual(rules("info@platzhirsch.studio"), ["email"]);
  assert.deepEqual(rules("latitude: 47.5302782, longitude: 9.7517183"), ["geo", "geo"]);
});
