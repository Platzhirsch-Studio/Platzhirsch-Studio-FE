// node --test tests/unit/kp-lead-aufbewahrung.test.mjs
// Lead-Übergabe/DSGVO (Küchenplaner-Team, fix-08): gespeicherte Planungen und
// Bilder werden nach 180 Tagen nie mehr ausgeliefert, auch wenn lange niemand
// speichert (prune lief bisher nur beim Speichern). store.js importiert
// "../catalog" ohne Endung und lässt sich darum nicht direkt laden – Prüfung am Quelltext.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../../src/components/Labs/Kuechenplaner/server/store.js", import.meta.url), "utf8");

test("Aufbewahrung 180 Tage wie im Einwilligungstext und in der Datenschutzerklärung", () => {
  assert.match(src, /const RETENTION_DAYS = 180;/);
  const ds = readFileSync(new URL("../../src/components/Datenschutz/datenschutz.js", import.meta.url), "utf8");
  assert.match(ds, /höchstens 180 Tagen gelöscht/);
});

test("Abruf prüft das Alter, löscht abgelaufene Planungen und räumt periodisch auf", () => {
  assert.match(src, /export function isExpired\(createdAt, now = Date\.now\(\)\)/);
  assert.match(src, /if \(isExpired\(rec\?\.createdAt\)\) \{\s+await removePlan\(id\);\s+return null;/);
  assert.match(src, /prunePeriodically\(\);/);
  // Bild nur, solange die Planung gilt
  assert.match(src, /if \(!\(await loadPlan\(id\)\)\) return null;/);
});

test("isExpired: Logik (nachgebaut aus dem Quelltext)", () => {
  const body = src.match(/export function isExpired\(createdAt, now = Date\.now\(\)\) \{([\s\S]*?)\r?\n\}/)[1];
  const isExpired = new Function("RETENTION_DAYS", `return function (createdAt, now = Date.now()) {${body}\n}`)(180);
  const now = Date.parse("2026-10-31T12:00:00Z");
  assert.equal(isExpired("2026-10-01T12:00:00Z", now), false);
  assert.equal(isExpired("2026-04-01T12:00:00Z", now), true);
  assert.equal(isExpired(undefined, now), true);
  assert.equal(isExpired("kaputt", now), true);
});
