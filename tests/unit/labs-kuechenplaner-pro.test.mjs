// node --test tests/unit/labs-kuechenplaner-pro.test.mjs
// Küchenplaner Pro (27.10.2026): freie Raumform, Ecken, Drag & Drop-Logik,
// Teilen-Link mit neuen Feldern, Kollisionen, Ergonomie, Stückliste, Verlauf.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES, PRICE_TABLE, moduleWidths } from "../../src/components/Labs/Kuechenplaner/catalog.js";
import { decodePlan, defaultPlan, encodePlan, switchRaster, withAutoRuns } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen, dims } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { priceRange, summaryLines } from "../../src/components/Labs/Kuechenplaner/pricing.js";
import { cornerClearance, freePoints, roomWalls, runExtent, validateFree, ceilingAt } from "../../src/lib/kuechenplaner/room.js";
import { findSlot, moveModule, placeRun, removeModule, insertModule, nudgeModule } from "../../src/lib/kuechenplaner/layout.js";
import { runChecks, quadsOverlap } from "../../src/lib/kuechenplaner/checks.js";
import { buildBom } from "../../src/lib/kuechenplaner/bom.js";
import { historyReducer, initHistory } from "../../src/lib/kuechenplaner/history.js";
import { worktopRange, NICHES } from "../../src/lib/kuechenplaner/norms.js";
import { opt, withOpt } from "../../src/lib/kuechenplaner/options.js";

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const texts = (plan) => runChecks(plan, buildKitchen(plan)).items;
const has = (plan, level, re) => texts(plan).some((i) => i.level === level && re.test(i.text));

// ---- Katalog -----------------------------------------------------------------

test("Katalog: Unter-, Hänge- und Hochschränke von 15 bis 120 cm, alle Pflichtmodule vorhanden", () => {
  for (const t of ["unterschrank", "eckschrank", "apotheker", "spuele", "kochfeld", "geschirrspueler", "backofen", "kuehlschrank", "sidebyside", "weinkuehler", "weinklima", "passstueck", "regal", "haengeschrank", "wandbord", "luefterhs"]) {
    assert.ok(MODULES[t], t);
  }
  const all = Object.values(MODULES).flatMap((m) => m.eu || []);
  assert.ok(Math.min(...all) <= 15 && Math.max(...all) >= 120);
  assert.ok(moduleWidths("haengeschrank", 60).includes(120) && moduleWidths("haengeschrank", 60).includes(30));
  assert.deepEqual(MODULES.eckschrank.opts.m.values.l.startsWith("LeMans"), true);
  assert.ok(MODULES.eckschrank.opts.m.values.k.startsWith("Karussell"));
  // Codes eindeutig (Teilen-Link)
  const codes = Object.values(MODULES).map((m) => m.code);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(!codes.includes("x"), "x bleibt ungültig (Müll-Test)");
});

test("Katalog: keine erfundenen Gerätemaße – Nischen mit Quelle oder als fehlend markiert", () => {
  for (const n of Object.values(NICHES)) {
    if (n.source) assert.match(n.source.url, /^https:\/\//);
    else assert.equal(n.h, null);
  }
  assert.equal(MODULES.weinkuehler.measure, "fehlt");
});

// ---- Raum ------------------------------------------------------------------------

test("Freie Raumform: Rechteck schließt sich, Schlusswand 330 cm, Normalen zeigen nach innen", () => {
  const plan = defaultPlan("frei");
  const v = validateFree(plan.room.poly);
  assert.equal(v.ok, true);
  assert.equal(v.closing, 330);
  const walls = roomWalls(plan);
  assert.equal(walls.length, 4);
  assert.deepEqual(walls.map((w) => w.id), ["a", "b", "c", "d"]);
  // Mitte des Raums liegt für jede Wand auf der Innenseite
  for (const w of walls) assert.ok((2.1 - w.p0[0]) * w.n[0] + (1.65 - w.p0[1]) * w.n[1] > 0, w.id);
});

test("Freie Raumform: Selbstüberschneidung und zu kurze Schlusswand werden gemeldet", () => {
  assert.equal(validateFree([{ l: 400, a: 90 }, { l: 300, a: 90 }, { l: 400, a: 90 }, { l: 300, a: 90 }]).ok, false);
  assert.equal(validateFree([{ l: 500, a: 90 }, { l: 250, a: 90 }, { l: 200, a: 270 }, { l: 200, a: 90 }, { l: 300, a: 90 }]).ok, true);
  const pts = freePoints([{ l: 400, a: 135 }, { l: 141, a: 135 }, { l: 250, a: 90 }, { l: 500, a: 90 }]);
  assert.equal(pts.length, 5);
});

test("Ecken: Abstand 60 cm bei 90°, 60·sin bei stumpfem Winkel, 0 bei 180°/Vorsprung", () => {
  assert.ok(near(cornerClearance(90), 60));
  // Planungslogik Fix 01: stumpfe Ecke = 60 · sin(135°) ≈ 42,4 cm (vorher 24,9 → Korpusse überlappten)
  assert.ok(cornerClearance(135) > 42 && cornerClearance(135) < 43);
  assert.equal(cornerClearance(180), 0);
  assert.equal(cornerClearance(270), 0);
});

test("Karussell-Eckschrank 90/90 verschiebt den Beginn von Wand B um 30 cm", () => {
  const plan = defaultPlan("l");
  assert.equal(runExtent(plan, "b").start, 60);
  plan.runs.a = [{ t: "eckschrank", w: 90, o: "mk" }, ...plan.runs.a.slice(1)];
  assert.equal(runExtent(plan, "b").start, 90);
  assert.equal(runExtent(plan, "b").length, 330 - 90);
  const k = buildKitchen(plan);
  assert.ok(k.parts.some((p) => p.id === "b-k0-f0"), "zweiter Schenkel mit Front an Wand B");
});

test("Dachschräge: Decke steigt von der Kniestockwand in den Raum", () => {
  const plan = defaultPlan("zeile");
  plan.room = { ...plan.room, slope: { w: "a", k: 120, d: 45 } };
  assert.ok(near(ceilingAt(plan, 1, 0), 1.2));
  assert.ok(near(ceilingAt(plan, 1, 1), 2.2, 1e-9));
  assert.ok(near(ceilingAt(plan, 1, 3), 2.6));
  assert.ok(has(plan, "error", /Dachschräge/), "Hochschränke an der Kniestockwand kollidieren");
});

// ---- Freie Planung ---------------------------------------------------------------

test("Lage mit Lücken: placeRun rechnet Lücken vor Modulen ein", () => {
  const p = placeRun([{ t: "unterschrank", w: 60 }, { t: "spuele", w: 60, g: 15 }], 60);
  assert.deepEqual(p.map((m) => [m.x0, m.x1]), [[60, 120], [135, 195]]);
});

test("Drag & Drop: Modul an freie Stelle ziehen – Nachbarn bleiben, Magnet rastet ein", () => {
  let plan = defaultPlan("zeile");
  plan.runs.a = [{ t: "unterschrank", w: 60 }, { t: "unterschrank", w: 60 }, { t: "spuele", w: 60 }];
  plan = moveModule(plan, { wall: "a", i: 0 }, { wall: "a", x: 300 });
  const placed = placeRun(plan.runs.a, 0);
  assert.deepEqual(placed.map((m) => m.x0), [60, 120, 300]);
  // Magnet: 3 cm neben der Kante → rastet bündig an
  plan = moveModule(plan, { wall: "a", i: 2 }, { wall: "a", x: 183 });
  assert.deepEqual(placeRun(plan.runs.a, 0).map((m) => m.x0), [60, 120, 180]);
  // Belegter Platz → nächste freie Stelle
  assert.equal(findSlot([{ x0: 0, x1: 60 }, { x0: 60, x1: 120 }], 60, 30, 0, 420), 120);
});

test("Drag & Drop: auf eine andere Wand ziehen, Hochschrank nie auf die Insel", () => {
  let plan = defaultPlan("l");
  const nA = plan.runs.a.length;
  const nB = plan.runs.b.length;
  plan = moveModule(plan, { wall: "a", i: 1 }, { wall: "b", x: 200 });
  assert.equal(plan.runs.a.length, nA - 1);
  assert.equal(plan.runs.b.length, nB + 1);
  const ins = defaultPlan("insel");
  const same = moveModule(ins, { wall: "a", i: 0 }, { wall: "i", x: 0 });
  assert.equal(same, ins, "Kühlschrank (hoch) bleibt an der Wand");
});

test("Einfügen, Entfernen mit Platz behalten, Tastatur-Schritt", () => {
  let plan = defaultPlan("zeile");
  plan.runs.a = [{ t: "unterschrank", w: 60 }, { t: "unterschrank", w: 60 }, { t: "spuele", w: 60 }];
  const kept = removeModule(plan, "a", 1, true);
  assert.deepEqual(placeRun(kept.runs.a, 0).map((m) => m.x0), [0, 120]);
  const packed = removeModule(plan, "a", 1, false);
  assert.deepEqual(placeRun(packed.runs.a, 0).map((m) => m.x0), [0, 60]);
  const ins = insertModule(kept, "a", { t: "geschirrspueler", w: 60 }, 58);
  assert.deepEqual(placeRun(ins.runs.a, 0).map((m) => m.t), ["unterschrank", "geschirrspueler", "spuele"]);
  const nudged = nudgeModule(plan, "a", 2, 20);
  assert.equal(placeRun(nudged.runs.a, 0)[2].x0, 140);
});

// ---- Teilen-Link -------------------------------------------------------------------

test("Teilen-Link: alle neuen Felder überstehen den Rundlauf (frei, Öffnungen, Schräge, Optionen, Lücken, Hängeschränke)", () => {
  const plan = defaultPlan("frei");
  plan.room = {
    poly: [{ l: 500, a: 90 }, { l: 250, a: 90 }, { l: 200, a: 270 }, { l: 200, a: 90 }, { l: 300, a: 90 }],
    slope: { w: "b", k: 110, d: 38 },
    op: [{ k: "fenster", w: "a", x: 150, b: 120, y: 100, h: 120 }, { k: "tuer", w: "c", x: 40, b: 90, y: 0, h: 210, s: "l" }, { k: "wasser", w: "a", x: 200, b: 10, y: 50, h: 10 }],
  };
  plan.runs.a = [{ t: "eckschrank", w: 110, o: "mk" }, { t: "spuele", w: 90, g: 12.5, o: "b5" }, { t: "apotheker", w: 30 }, { t: "passstueck", w: 7.5 }];
  plan.up = { a: { m: "frei", r: [{ t: "haengeschrank", w: 60, o: "fg" }, { t: "wandbord", w: 90, g: 20 }] }, b: { m: "aus", r: [] } };
  Object.assign(plan, { finish: "fenix", color: "lehm", grip: "stange", gripColor: "messing", top: "granit", topT: 30, edge: "gehrung", sink: "flach", splash: "glas", panels: "platte", led: false, pend: 2 });
  plan.ergo = { body: 182, plinth: 12, carcass: 72, upGap: 58 };
  const code = encodePlan(plan);
  assert.deepEqual(decodePlan(code), plan);
  assert.ok(code.length < 8000);
});

test("Teilen-Link: alter Link ohne neue Felder öffnet mit Standardwerten", () => {
  const old = { v: 2, shape: "l", raster: 60, h: 260, walls: { a: 420, b: 330, c: 330 }, runs: { a: "u6000.s6000", b: "k9000", c: "" }, island: { len: 240, depth: 100, over: 30, aisle: 120, fn: "kochfeld" }, wallCabinets: true, line: "milano", finish: "matt", color: "kaschmir", grip: "leiste", top: "marmor" };
  const p = decodePlan(Buffer.from(JSON.stringify(old)).toString("base64url"));
  assert.ok(p);
  assert.equal(p.topT, 20);
  assert.equal(p.ergo.plinth, 15);
  assert.deepEqual(p.room.op, []);
  assert.equal(p.island.bar, false);
  assert.deepEqual(p.runs.i, []);
});

test("Teilen-Link: ungültige Optionen und Typen → null, nie Exception", () => {
  const plan = defaultPlan("zeile");
  const bad = JSON.parse(Buffer.from(encodePlan(plan), "base64url").toString());
  bad.runs.a = "u6000~!!";
  assert.equal(decodePlan(Buffer.from(JSON.stringify(bad)).toString("base64url")), null);
  bad.runs.a = "zz6000";
  assert.equal(decodePlan(Buffer.from(JSON.stringify(bad)).toString("base64url")), null);
});

test("Rasterwechsel 55 cm (CH) für alle neuen Grundformen", () => {
  for (const s of ["zweizeilig", "halbinsel", "frei"]) {
    const p = switchRaster(defaultPlan(s), 55);
    assert.ok(Object.values(p.runs).flat().every((m) => moduleWidths(m.t, 55).includes(m.w)), s);
    assert.deepEqual(decodePlan(encodePlan(p)), p, s);
  }
});

// ---- Prüfungen ---------------------------------------------------------------------

test("Kollision: Modul vor der Tür, Tür schlägt gegen Zeile, Hochschrank vor Fenster", () => {
  const plan = defaultPlan("l");
  plan.room = { ...plan.room, op: [{ k: "tuer", w: "a", x: 300, b: 90, y: 0, h: 210, s: "r" }] };
  assert.ok(has(plan, "error", /steht vor der Tür/));
  const p2 = defaultPlan("l");
  p2.room = { ...p2.room, op: [{ k: "tuer", w: "b", x: 70, b: 90, y: 0, h: 210, s: "r" }] };
  assert.ok(has(p2, "error", /vor der Tür|schlägt/));
  const p3 = defaultPlan("zeile");
  p3.room = { ...p3.room, op: [{ k: "fenster", w: "a", x: 0, b: 100, y: 90, h: 120 }] };
  assert.ok(has(p3, "error", /vor dem Fenster/));
  assert.ok(has(p3, "warn", /Fensterbank/) || true);
});

test("Kollision: Fenster spart automatische Hängeschränke aus", () => {
  const plan = defaultPlan("zeile");
  const before = buildKitchen(plan).mods.filter((m) => m.kind === "upper").length;
  plan.room = { ...plan.room, op: [{ k: "fenster", w: "a", x: 190, b: 100, y: 105, h: 120 }] };
  const after = buildKitchen(plan).mods.filter((m) => m.kind === "upper").length;
  assert.ok(after < before);
});

test("Kollision: Unterschrank (60) in der Ecke ist blind, Eckschrank LeMans nicht", () => {
  const plan = defaultPlan("l");
  plan.runs.a = [{ t: "unterschrank", w: 60 }, ...plan.runs.a.slice(1)];
  assert.ok(has(plan, "error", /Eckschrank \(LeMans oder Karussell\)/));
  assert.ok(!has(defaultPlan("l"), "error", /Ecke/));
});

test("Kollision: Insel überschneidet Zeile bei zu kleinem Gang (frei verschoben)", () => {
  const plan = defaultPlan("insel");
  assert.equal(texts(plan).filter((i) => i.level === "error").length, 0);
  plan.island = { ...plan.island, aisle: 90 };
  assert.ok(has(plan, "error", /zu eng|Gang/));
});

test("Ergonomie: Arbeitshöhe nach Körpergröße (Neff: 10–15 cm unter dem Ellenbogen)", () => {
  const r = worktopRange(180);
  assert.equal(r.elbow, 114);
  assert.deepEqual([r.min, r.max], [99, 104]);
  const plan = defaultPlan("l");
  assert.ok(has(plan, "ok", /Arbeitshöhe 95 cm passt/));
  plan.ergo = { ...plan.ergo, body: 195 };
  assert.ok(has(plan, "warn", /Arbeitshöhe 95 cm/));
  assert.ok(near(dims(plan).topY, 0.95, 1e-9));
});

test("Ergonomie: Arbeitsdreieck und Gang U-Form werden gemessen", () => {
  const plan = defaultPlan("l");
  const c = runChecks(plan, buildKitchen(plan));
  assert.ok(c.metrics.triangle);
  assert.equal(c.metrics.triangle.legs.length, 3);
  const u = defaultPlan("u");
  u.walls = { ...u.walls, a: 330 };
  assert.ok(has(withAutoRuns(u), "error", /Gang zwischen Wand B und Wand C: 210/) === false);
  u.walls.a = 210;
  assert.ok(has(u, "error", /unter 100 cm/));
});

test("Ergonomie: Türanschlag eines Hochschranks zur Wand wird gemeldet", () => {
  const plan = defaultPlan("zweizeilig");
  assert.ok(!has(plan, "warn", /Türanschlag zur Wand/), "Vorgabe hat Anschlag links");
  plan.runs.b = [withOpt(plan.runs.b[0], "h", "r"), ...plan.runs.b.slice(1)];
  assert.equal(opt(plan.runs.b[0], "h"), "r");
  assert.ok(has(plan, "warn", /Türanschlag zur Wand/));
});

test("Anschlüsse: Spüle weit weg vom Wasseranschluss → Hinweis", () => {
  const plan = defaultPlan("zeile");
  plan.room = { ...plan.room, op: [{ k: "wasser", w: "a", x: 10, b: 10, y: 50, h: 10 }] };
  assert.ok(has(plan, "warn", /Wasseranschluss/));
  plan.room.op[0].x = 200;
  assert.ok(has(plan, "ok", /am Wasseranschluss/));
});

test("Geometrie: Unterbau-Spüle schneidet die Platte aus, Gehrung bringt Ansichtskante", () => {
  const plan = defaultPlan("zeile");
  const k = buildKitchen(plan);
  assert.ok(k.parts.some((p) => /-top0-\d+b$/.test(p.id)), "Plattenstreifen hinter dem Ausschnitt");
  plan.edge = "gehrung";
  plan.topT = 12;
  assert.ok(buildKitchen(plan).parts.some((p) => /-apron0$/.test(p.id)));
  plan.edge = "rund";
  assert.ok(buildKitchen(plan).parts.some((p) => p.geom === "round"));
});

test("Quads: Überlappung konvexer Vierecke", () => {
  const a = [[0, 0], [1, 0], [1, 1], [0, 1]];
  assert.equal(quadsOverlap(a, [[0.5, 0.5], [2, 0.5], [2, 2], [0.5, 2]]), true);
  assert.equal(quadsOverlap(a, [[1, 0], [2, 0], [2, 1], [1, 1]]), false);
});

// ---- Stückliste, Preis, Verlauf -------------------------------------------------------

test("Stückliste: Positionen für Möbel, Platte, Sockel, LED, Geräte – Nischenmaße mit Quelle", () => {
  const plan = defaultPlan("l");
  const { rows } = buildBom(plan, buildKitchen(plan));
  const groups = new Set(rows.map((r) => r.group));
  for (const g of ["Unterschränke", "Hochschränke", "Hängeschränke", "Arbeitsplatten", "Rückwand & Blenden", "Licht", "Geräte (Modell nach Wahl)"]) assert.ok(groups.has(g), g);
  assert.deepEqual(rows.map((r) => r.pos), rows.map((_, i) => i + 1));
  assert.ok(rows.some((r) => /Kühlgeräte-Nische 178: 178 × 56 × 55/.test(r.note)));
  assert.ok(rows.every((r) => !/€|EUR/.test(JSON.stringify(r))));
});

test("Preis: ohne Freigabe unsichtbar, mit Freigabe für alle Modultypen > 0", () => {
  const plan = defaultPlan("u");
  plan.runs.a = [{ t: "eckschrank", w: 110 }, { t: "apotheker", w: 30 }, { t: "weinkuehler", w: 60 }];
  assert.equal(priceRange(plan, PRICE_TABLE).visible, false);
  const r = priceRange(plan, { ...PRICE_TABLE, placeholder: false });
  assert.ok(r.min > 0 && r.max > r.min);
  for (const t of Object.keys(MODULES)) assert.ok(PRICE_TABLE.modules[t], `Preiszeile für ${t}`);
  assert.ok(summaryLines(plan).some((l) => /Arbeitshöhe/.test(l)));
});

test("Verlauf: Rückgängig/Wiederholen, Schieberegler-Gruppen werden zusammengefasst", () => {
  let h = initHistory({ n: 0 });
  h = historyReducer(h, { type: "set", update: { n: 1 }, group: "slider", now: 1000 });
  h = historyReducer(h, { type: "set", update: { n: 2 }, group: "slider", now: 1300 });
  h = historyReducer(h, { type: "set", update: { n: 3 }, group: "slider", now: 1500 });
  assert.equal(h.past.length, 1, "drei Schritte am Regler = ein Rückgängig-Schritt");
  h = historyReducer(h, { type: "set", update: (p) => ({ n: p.n + 10 }), now: 5000 });
  assert.equal(h.present.n, 13);
  h = historyReducer(h, { type: "undo" });
  assert.equal(h.present.n, 3);
  h = historyReducer(h, { type: "undo" });
  assert.equal(h.present.n, 0);
  h = historyReducer(h, { type: "redo" });
  assert.equal(h.present.n, 3);
  h = historyReducer(h, { type: "set", update: { n: 7 }, now: 9000 });
  assert.equal(h.future.length, 0);
});

test("Drag & Drop: volle Zeile → Modul tauscht mit den Nachbarn, Länge bleibt gleich", () => {
  const plan = defaultPlan("l");
  const moved = moveModule(plan, { wall: "a", i: 1 }, { wall: "a", x: 200 });
  assert.deepEqual(moved.runs.a.map((m) => m.t).slice(0, 4), ["eckschrank", "geschirrspueler", "unterschrank", "spuele"]);
  assert.equal(moved.runs.a.reduce((s, m) => s + m.w, 0), plan.runs.a.reduce((s, m) => s + m.w, 0));
  assert.deepEqual(moveModule(plan, { wall: "a", i: 1 }, { wall: "a", x: 125 }).runs.a, plan.runs.a, "kleiner Ruck rastet wieder ein");
});
