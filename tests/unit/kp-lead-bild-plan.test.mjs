// node --test tests/unit/kp-lead-bild-plan.test.mjs
// Lead-Übergabe (Küchenplaner-Team, fix-04): Das mitgesendete Bild gehört zur
// gesendeten Planung (kein veraltetes Bild nach Weiterplanen), und ein zweiter
// Sendeversuch derselben Planung speichert sie nicht erneut auf dem Server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../../src/components/Labs/Kuechenplaner/ResultPanel.js", import.meta.url), "utf8");

test("Bild nur wiederverwenden, wenn es zum aktuellen Teilen-Code gehört", () => {
  assert.match(src, /shotCode\.current = code;/);
  assert.match(src, /shot && shotCode\.current === code \? shot : capture\(\)/);
  assert.doesNotMatch(src, /view3dReady \? shot \|\| capture\(\)/);
});

test("Planung je Teilen-Code nur einmal speichern", () => {
  assert.match(src, /if \(!dry && savedPlan\.current\.code === code\) ref = savedPlan\.current\.ref;/);
  assert.match(src, /savedPlan\.current = \{ code, ref \};/);
});
