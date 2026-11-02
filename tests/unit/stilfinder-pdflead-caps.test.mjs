// node --test tests/unit/stilfinder-pdflead-caps.test.mjs
// pdf-lead fix-04: Tageslimits je IP und für die ganze Website (Mail-Bombing an
// fremde Adressen, Absender-Reputation, Provider-Kontingent).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { createSendCaps } = await import("../../src/lib/stilfinder/limits.js");
const { LIMITS } = await import("../../src/lib/stilfinder/config.js");
const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), "utf8");

test("Tageslimit je IP: nach LIMITS.ipDaily ist Schluss, andere IPs nicht betroffen, nach 24 h wieder frei", () => {
  const caps = createSendCaps();
  const now = Date.now();
  for (let i = 0; i < LIMITS.ipDaily.max; i++) assert.ok(caps.take("203.0.113.7", now + i).ok);
  const r = caps.take("203.0.113.7", now + 100);
  assert.equal(r.ok, false);
  assert.equal(r.scope, "ip");
  assert.ok(r.retryAfter > 0);
  assert.ok(caps.take("203.0.113.8", now + 100).ok, "andere IP");
  assert.ok(caps.take("203.0.113.7", now + LIMITS.ipDaily.windowMs + 1).ok);
  assert.ok(LIMITS.ipDaily.max < 24 * 6 * LIMITS.send.max, "enger als das 10-Minuten-Fenster über den Tag");
});

test("Tageslimit gesamt: greift über alle IPs, abgelehnte Anfragen verbrauchen nichts", () => {
  const caps = createSendCaps({ ipDaily: { max: 2, windowMs: 864e5 }, globalDaily: { max: 3, windowMs: 864e5 } });
  const now = Date.now();
  assert.ok(caps.take("a", now).ok);
  assert.ok(caps.take("a", now).ok);
  assert.equal(caps.take("a", now).scope, "ip");
  assert.ok(caps.take("b", now).ok, "IP-Ablehnung hat das Gesamtlimit nicht verbraucht");
  const g = caps.take("c", now);
  assert.equal(g.ok, false);
  assert.equal(g.scope, "global");
  assert.equal(caps.take(null, now).scope, "global", "ohne IP zählt nur das Gesamtlimit");
});

test("Route: Tageslimits vor dem Adress-Limit, Formular kennt den Fehlercode", () => {
  const route = src("app/api/labs/stilfinder/moodboard/route.js");
  assert.ok(route.indexOf("sendCaps.take(") > 0 && route.indexOf("sendCaps.take(") < route.indexOf("emailLimiter.take("));
  assert.match(src("components/Labs/Stilfinder/MoodboardPdfForm.js"), /daily_cap:/);
});
