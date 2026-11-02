// node --test tests/unit/labs-sofaplaner.test.mjs
// Sofaplaner (Labs): Raum verkleinern/vergrößern ohne Überlappung (R2 Restpunkt 1),
// Laden alter Pläne, Aufbewahrung der Teilen-Pläne (Restpunkt 2).
// Seit dem Umbau auf die Minotti-Modelle laufen die Raumtests mit echten
// Connery-Elementen (Startform „U-Form“).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkPlan, fitItemsToRoom, footprint, makeLookup, overlappingPairs, planFor, planSchema, separateItems } from "../../src/components/Labs/Sofaplaner/model.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { DEFAULT_TTL_DAYS, MAX_PLANS, isExpired, plansToPrune, ttlMs } from "../../src/components/Labs/Sofaplaner/server/retention.js";

const DAY = 86_400_000;
const raw = JSON.parse(readFileSync(new URL("../../src/lib/sofaplaner/minotti/connery.json", import.meta.url), "utf8"));
const fam = normalizeFamily(raw);
const family = { ...fam, templates: buildTemplates(fam) };
const lookup = makeLookup(family);
const inside = (items, room) =>
  items.every((i) => {
    const r = footprint(i);
    return r.x >= -0.5 && r.y >= -0.5 && r.x + r.w <= room.w + 0.5 && r.y + r.h <= room.d + 0.5;
  });
const overlaps = (items) => overlappingPairs(items).length;
const uPlan = () => planFor(family, "u", { w: 560, d: 440 });

test("Restpunkt 1: kleiner, aber Sofa passt noch → Block verschiebt sich, keine Überlappung", () => {
  const plan = uPlan();
  assert.equal(overlaps(plan.items), 0);
  const shifted = plan.items.map((i) => ({ ...i, x: i.x + 40, y: i.y + 20 }));
  const box = shifted.map(footprint).reduce((b, r) => ({ w: Math.max(b.w, r.x + r.w), h: Math.max(b.h, r.y + r.h) }), { w: 0, h: 0 });
  const small = { w: box.w - 30, d: box.h - 15 };
  const fitted = fitItemsToRoom(shifted, small);
  assert.ok(inside(fitted, small));
  assert.equal(overlaps(fitted), 0);
});

// Geändert mit QM Sofaplaner R1 P1-4: ein zu kleiner Raum schiebt die Elemente
// NICHT mehr ineinander. Das Sofa bleibt als Block erhalten, der Konflikt
// „Sofa … ist breiter/tiefer als der Raum“ ist sichtbar.
test("P1-4: Raum zu klein → Sofa bleibt unverändert (keine Überlappung), Konflikt mit Maßen sichtbar", () => {
  const plan = uPlan();
  const tiny = { w: 300, d: 220 };
  const kept = fitItemsToRoom(plan.items, tiny);
  assert.equal(overlaps(kept), 0, "Elemente werden nie ineinandergeschoben");
  const rel = (items) => items.map((i) => [i.x - items[0].x, i.y - items[0].y, i.rot]);
  assert.deepEqual(rel(kept), rel(plan.items), "Komposition bleibt in sich unverändert");
  const errs = checkPlan({ ...plan, room: tiny, items: kept }, lookup).filter((c) => c.level === "error");
  assert.ok(errs.some((c) => c.kind === "roomsize" && /ist breiter als der Raum \(300 cm\)/.test(c.text)));
  assert.ok(errs.some((c) => c.kind === "roomsize" && /ist tiefer als der Raum \(220 cm\)/.test(c.text)));
  const restored = fitItemsToRoom(kept, plan.room);
  assert.equal(overlaps(restored), 0);
  assert.ok(inside(restored, plan.room));
});

test("Restpunkt 1: alter Entwurf mit Überlappung → separateItems löst sie auf", () => {
  const plan = planFor(family, "ecke-links");
  const squeezed = plan.items.map((i, k) => (k === 1 ? { ...i, x: plan.items[0].x + 20, y: plan.items[0].y + 20 } : i));
  assert.ok(overlaps(squeezed) > 0);
  const big = { w: 700, d: 600 };
  const fixed = separateItems(squeezed, big);
  assert.equal(overlaps(fixed), 0);
  assert.ok(inside(fixed, big));
});

test("separateItems lässt überlappungsfreie Pläne unverändert", () => {
  const plan = uPlan();
  assert.equal(separateItems(plan.items, plan.room), plan.items);
});

test("Laden: alter Plan aus größerem Raum wird als Block eingepasst (keine neue Überlappung)", () => {
  const plan = planFor(family, "ecke-links");
  const moved = { ...plan, room: { w: 480, d: 400 }, items: plan.items.map((i) => ({ ...i, x: i.x + 100 })) };
  const parsed = planSchema.parse(JSON.parse(JSON.stringify(moved)));
  assert.ok(inside(parsed.items, parsed.room));
  assert.equal(overlaps(parsed.items), 0);
});

test("Restpunkt 2: TTL – Standard 180 Tage, per Umgebung einstellbar, Grenzen", () => {
  assert.equal(ttlMs({}), DEFAULT_TTL_DAYS * DAY);
  assert.equal(ttlMs({ SOFAPLANER_TTL_DAYS: "30" }), 30 * DAY);
  assert.equal(ttlMs({ SOFAPLANER_TTL_DAYS: "0" }), DEFAULT_TTL_DAYS * DAY);
  assert.equal(ttlMs({ SOFAPLANER_TTL_DAYS: "9999" }), DEFAULT_TTL_DAYS * DAY);
  const now = Date.parse("2026-10-26T12:00:00Z");
  assert.equal(isExpired("2026-10-01T00:00:00Z", now, 30 * DAY), false);
  assert.equal(isExpired("2026-08-01T00:00:00Z", now, 30 * DAY), true);
  assert.equal(isExpired("kein Datum", now), true);
});

test("Restpunkt 2: Aufräumen löscht abgelaufene und die ältesten über der Obergrenze", () => {
  const now = 1_000 * DAY;
  const entries = [
    { name: "alt.json", time: now - 200 * DAY },
    { name: "a.json", time: now - 3 * DAY },
    { name: "b.json", time: now - 2 * DAY },
    { name: "c.json", time: now - 1 * DAY },
  ];
  assert.deepEqual(plansToPrune(entries, { now, ttl: 180 * DAY, max: 2 }), ["alt.json", "a.json"]);
  assert.deepEqual(plansToPrune(entries, { now, ttl: 180 * DAY, max: MAX_PLANS }), ["alt.json"]);
  assert.deepEqual(plansToPrune([], { now }), []);
});
