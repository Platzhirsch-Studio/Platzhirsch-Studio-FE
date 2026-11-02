// tests/unit/concierge-retry.test.mjs — QA2 P2-2/P2-4 (KI-Concierge seitenweit).
// Run: node --test tests/unit/concierge-retry.test.mjs
// Retry pass: the silent second attempt of the browser (same rid) is counted
// against IP/session only once. Appointment target lands at the form (#anfrage).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRetryPass } from "../../src/lib/concierge/limiter.js";
import { buildHref, checkAction } from "../../src/lib/concierge/actionKinds.js";

const NOW = Date.parse("2026-10-28T10:00:00Z");

test("Retry pass: einmal je rid, nur wenn vorher gezählt, nur innerhalb von 2 min", () => {
  const pass = createRetryPass();
  assert.equal(pass.isRetry("S1:r1", NOW), false, "unbekannte rid zählt normal");
  pass.remember("S1:r1", NOW);
  assert.equal(pass.isRetry("S1:r1", NOW + 600), true, "zweiter Versuch: nicht erneut zählen");
  assert.equal(pass.isRetry("S1:r1", NOW + 900), false, "nur EIN freier Versuch je rid");
  assert.equal(pass.isRetry("S2:r1", NOW + 900), false, "rid gilt nur für die eigene Sitzung");
  pass.remember("S1:r2", NOW);
  assert.equal(pass.isRetry("S1:r2", NOW + 2 * 60 * 1000), false, "nach 2 min verfallen");
});

test("Retry pass: Speicher bleibt begrenzt", () => {
  const pass = createRetryPass({ max: 10 });
  for (let i = 0; i < 50; i++) pass.remember(`S:r${i}`, NOW + i);
  pass.remember("S:last", NOW + 60);
  assert.ok(pass.size <= 11, `size ${pass.size}`);
  assert.equal(pass.isRetry("S:last", NOW + 61), true);
});

test("Termin-Ziel: direkt beim Formular (#anfrage), Prüfung im Browser besteht", () => {
  for (const locale of ["de", "en", "fr", "it"]) {
    const action = { kind: "appointment_form", id: "a_abcdefgh12", sig: "abcdefghijklmnop", exp: NOW + 60_000, params: { note: "Sofa ansehen" } };
    const href = buildHref(action, locale);
    assert.match(href, /\?quelle=concierge&anliegen=Sofa\+ansehen#anfrage$/);
    const check = checkAction(action, { locale, now: NOW });
    assert.equal(check.ok, true, locale);
    assert.equal(check.href, href);
  }
});
