// tests/unit/tempo-sofaplaner.test.mjs — Tempo-Runde 30.10.2026, Team Sofaplaner
// (qa-screenshots/tempo/sofaplaner.md): Planer-Code erst nach dem ersten Malen,
// zod/mini im Browser, gleiche Prüfregeln wie vorher.
// Run: node --test tests/unit/tempo-sofaplaner.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readFileSync } from "node:fs";
import { z as classic } from "zod";
import { planFor, planSchema } from "../../src/components/Labs/Sofaplaner/model.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { UI_EN } from "../../src/lib/sofaplaner/copy/ui-en.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const raw = JSON.parse(readFileSync(new URL("../../src/lib/sofaplaner/minotti/connery.json", import.meta.url), "utf8"));
const fam = normalizeFamily(raw);
const family = { ...fam, templates: buildTemplates(fam) };

test("Seite bindet den Planer über PlannerGate ein, nicht direkt", () => {
  const page = read("src/app/[locale]/sofaplaner/page.js");
  assert.match(page, /import Planner from "@\/components\/Labs\/Sofaplaner\/PlannerGate";/);
  assert.doesNotMatch(page, /from "@\/components\/Labs\/Sofaplaner\/Planner";/);
});

test("PlannerGate: Planer nur per import(), Server-HTML bleibt bei der Hydrierung stehen", () => {
  const g = read("src/components/Labs/Sofaplaner/PlannerGate.js");
  assert.match(g, /^"use client";/);
  assert.match(g, /import\("\.\/Planner"\)/);
  assert.doesNotMatch(g, /^import [^\n]*from "\.\/Planner"/m, "kein statischer Import (sonst wieder im ersten Bundle)");
  assert.match(g, /dangerouslySetInnerHTML=\{\{ __html: "" \}\} suppressHydrationWarning/);
  // keine eigene Suspense-Grenze: React würde den großen Block sonst ans Dokumentende auslagern
  assert.doesNotMatch(g, /<Suspense/);
  // spät laden: nach load im Leerlauf oder bei Interaktion; Klick und Fokus werden übertragen
  assert.match(g, /requestIdleCallback\(go, \{ timeout: 2000 \}\)/);
  assert.match(g, /addEventListener\("load", idle/);
  for (const k of ["pointerdown", "touchstart", "keydown", "focusin"]) assert.ok(g.includes(`"${k}"`), k);
  assert.match(g, /startTransition\(\(\) => setReady\(true\)\)/);
  assert.match(g, /c\.click\(\)/);
  assert.match(g, /f\.focus\(\{ preventScroll: true \}\)/);
});

test("Planer bleibt Client-Komponente mit Hydrierungs-Merkmal (Tests warten darauf)", () => {
  const p = read("src/components/Labs/Sofaplaner/Planner.js");
  assert.match(p, /^"use client";/);
  assert.match(p, /setAttribute\("data-hydrated", "true"\)/);
});

test("planSchema (zod/mini): gültiger Plan, Standardwerte, Transformation, Grenzen", () => {
  const plan = planFor(family);
  const ok = planSchema.safeParse(JSON.parse(JSON.stringify(plan)));
  assert.ok(ok.success);
  const { name, grid, ...rest } = JSON.parse(JSON.stringify(plan));
  const d = planSchema.parse({ ...rest, look: { material: plan.look.material, tone: plan.look.tone } });
  assert.equal(d.name, "Mein Sofa");
  assert.equal(d.grid, 10);
  assert.deepEqual([d.look.back, d.look.arm, d.look.cushions], [[], "", []]);
  assert.equal(planSchema.parse({ ...plan, name: "  Ecke  " }).name, "Ecke");
  assert.equal(planSchema.safeParse({ ...plan, name: "x".repeat(61) }).success, false);
  assert.equal(planSchema.safeParse({ ...plan, room: { w: 149, d: 400 } }).success, false);
  assert.equal(planSchema.safeParse({ ...plan, family: "Connery" }).success, false);
  assert.equal(planSchema.safeParse({ ...plan, grid: 15 }).success, false);
  assert.equal(planSchema.safeParse({ ...plan, look: { ...plan.look, cushions: [{ id: "a", q: 1.5 }] } }).success, false);
  assert.equal(planSchema.safeParse({ ...plan, items: Array(41).fill(plan.items[0]) }).success, false);
  // Transformation läuft weiter: Elemente werden in den Raum gerückt
  const far = { ...plan, items: plan.items.map((i) => ({ ...i, x: 2100 })) };
  const moved = planSchema.parse(JSON.parse(JSON.stringify(far)));
  assert.ok(moved.items.every((i) => i.x < plan.room.w));
});

test("planSchema passt weiter in klassische zod-Objekte (Teilen-Route)", () => {
  const body = classic.object({ plan: planSchema });
  const plan = planFor(family);
  assert.equal(body.safeParse({ plan: JSON.parse(JSON.stringify(plan)) }).success, true);
  assert.equal(body.safeParse({ plan: { ...plan, v: 1 } }).success, false);
});

test("Anfrage: Längengrenzen mit eigener Meldung, auch auf Englisch", () => {
  const src = read("src/components/Labs/Sofaplaner/ResultPanel.js");
  assert.match(src, /Bitte höchstens \$\{max\} Zeichen\./);
  for (const n of [80, 4000]) assert.ok(UI_EN[`Bitte höchstens ${n} Zeichen.`], String(n));
});
