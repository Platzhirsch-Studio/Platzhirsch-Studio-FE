// node --test tests/unit/kuechenplaner-ecke-haengeschrank.test.mjs
// Hängeschränke in der Ecke (Bugreport Inhaber, L-Form 3D): Die Hängeschränke der
// Nachbarzeile begannen mit dem Unterschrank-Abstand (60 cm) statt mit der
// Hängeschrank-Tiefe (35 cm) – über der Ecke blieb ein 25-cm-Spalt mit nackter Wand,
// während die Tür des Eck-Hängeschranks der Besitzerzeile hinter der Nachbarzeile lag.
// Jetzt: Besitzerzeile läuft mit Eck-Hängeschrank (Blindecke) in die Ecke, die andere
// Zeile beginnt bei der Hängeschrank-Tiefe – kein Spalt, keine Überschneidung.
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { runChecks, quadsOverlap } from "../../src/lib/kuechenplaner/checks.js";
import { buildBom } from "../../src/lib/kuechenplaner/bom.js";
import { runExtent } from "../../src/lib/kuechenplaner/room.js";

function freePlan(ang) {
  const p = defaultPlan("frei");
  p.room.poly = [{ l: 420, a: ang }, { l: 400, a: 90 }, { l: 300, a: 90 }];
  const base = (n) => Array.from({ length: n }, () => ({ t: "unterschrank", w: 60 }));
  p.runs.a = base(5);
  p.runs.b = base(4);
  p.runs.c = [];
  // Zeile A bündig bis in die Ecke zu B
  p.runs.a[0].g = Math.round((runExtent(p, "a").length - 300) * 10) / 10;
  return p;
}

function segDist(p, a, b) {
  const [dx, dz] = [b[0] - a[0], b[1] - a[1]];
  const l2 = dx * dx + dz * dz || 1e-12;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}
/** Abstand zweier konvexer Vierecke (0, wenn sie sich berühren oder schneiden). */
function quadDist(A, B) {
  if (quadsOverlap(A, B, -0.0005)) return 0;
  let best = Infinity;
  for (const [P, Q] of [[A, B], [B, A]]) for (const p of P) for (let i = 0; i < 4; i++) best = Math.min(best, segDist(p, Q[i], Q[(i + 1) % 4]));
  return best;
}

const cabinets = (k, wall) => k.mods.filter((m) => m.kind === "upper" && m.wall === wall && m.t !== "wandbord").sort((a, b) => a.x0 - b.x0);

function checkCorners(name, plan, only = null) {
  const k = buildKitchen(plan);
  assert.ok(k.corners.length > 0, `${name}: keine Ecke`);
  for (const c of k.corners) {
    if (only && !only.includes(c.other)) continue;
    const own = cabinets(k, c.owner);
    const oth = cabinets(k, c.other);
    assert.ok(own.length && oth.length, `${name}: Hängeschränke an beiden Wänden`);
    const ownCorner = c.ownerAt === "start" ? own[0] : own[own.length - 1];
    const othFirst = oth[0];
    // 1) keine Überschneidung zwischen den Hängeschränken beider Wände
    for (const a of own) for (const b of oth) assert.ok(!quadsOverlap(a.quad, b.quad, 0.005), `${name}: ${a.id} überschneidet ${b.id}`);
    // 2) kein Spalt über 1 cm in der Ecke
    // (bei spitzem Winkel beginnt die Nachbarzeile mit einer Passblende ohne Tür)
    const blenden = k.parts.filter((q) => q.id.startsWith(`${c.other}-`) && /-u?b\d+-filler(Body)?$/.test(q.id)).map((q) => q.quad);
    for (const q of blenden) for (const a of own) assert.ok(!quadsOverlap(a.quad, q, 0.005), `${name}: Passblende überschneidet ${a.id}`);
    const gap = Math.min(...[othFirst.quad, ...blenden].map((q) => quadDist(ownCorner.quad, q)));
    assert.ok(gap <= 0.01, `${name} Ecke ${c.owner}/${c.other}: Spalt ${(gap * 100).toFixed(1)} cm zwischen ${ownCorner.id} und ${othFirst.id}`);
    // 3) Tür des Eck-Hängeschranks schlägt nicht gegen die Nachbarzeile
    assert.equal(ownCorner.corner, c.ownerAt, `${name}: ${ownCorner.id} ist als Eck-Hängeschrank markiert`);
    if (ownCorner.frontQuad) for (const b of oth) assert.ok(!quadsOverlap(ownCorner.frontQuad, b.quad, 0.01), `${name}: Tür von ${ownCorner.id} stößt an ${b.id}`);
    // 4) Prüfung meldet keine Kollision der Hängeschränke
    const errs = runChecks(plan, k).items.filter((x) => x.level === "error" && x.ids.some((id) => k.mods.find((m) => m.id === id)?.kind === "upper"));
    assert.deepEqual(errs.map((e) => e.text), [], `${name}: Kollisionen`);
  }
  return k;
}

test("L-Form: Hängeschränke treffen sich in der Ecke ohne Spalt und ohne Überschneidung", () => {
  const plan = defaultPlan("l");
  const k = checkCorners("L", plan);
  // Wand B beginnt bei der Hängeschrank-Tiefe (35 cm), nicht beim Unterschrank-Abstand (60 cm)
  assert.ok(Math.abs(cabinets(k, "b")[0].x0 - 35) < 0.05, `B beginnt bei ${cabinets(k, "b")[0].x0} cm`);
  const corner = cabinets(k, "a")[0];
  assert.ok(Math.abs(corner.blind - 35) < 0.05, "Blindecke 35 cm");
  // Stückliste: Eck-Hängeschrank mit Blindecke erscheint, Maße passen
  const bom = buildBom(plan, k);
  const row = bom.rows.find((r) => r.id === corner.id);
  assert.match(row.label, /Eck-Hängeschrank/);
  assert.match(row.detail, /Blindecke 35 cm/);
  const rowB = bom.rows.find((r) => r.id === cabinets(k, "b")[0].id);
  assert.match(rowB.size, /^85 ×/);
});

test("U-Form: beide Ecken sauber", () => {
  // Vorlage: an Wand B steht der Kühlschrank in der Ecke – geprüft wird hier die Ecke A/C
  checkCorners("U", defaultPlan("u"), ["c"]);
  const p = defaultPlan("u");
  p.runs.b = [{ t: "unterschrank", w: 60 }, { t: "kochfeld", w: 60 }, { t: "unterschrank", w: 60 }];
  p.runs.c = [{ t: "unterschrank", w: 60 }, { t: "unterschrank", w: 60 }];
  checkCorners("U (B ohne Hochschrank)", p);
});

test("U-Form mit Hochschrank an der Ecke: Eck-Hängeschrank mit Blindecke bis zur Hochschrank-Seite", () => {
  const p = defaultPlan("u");
  const k = buildKitchen(p);
  const tall = k.mods.find((x) => x.wall === "b" && x.kind === "tall" && x.i === 0);
  assert.ok(tall, "Vorlage: Hochschrank in der Ecke an Wand B");
  // Kein Hängeschrank der Wand B ragt in den Hochschrank
  for (const m of cabinets(k, "b")) assert.ok(!quadsOverlap(m.quad, tall.quad, 0.005), m.id);
  // Tür des Eck-Hängeschranks (Wand A) schlägt nicht an den Hochschrank: Blindecke 60 cm
  const corner = cabinets(k, "a")[0];
  assert.equal(corner.corner, "start");
  assert.ok(Math.abs(corner.blind - 60) < 0.05, `Blindecke ${corner.blind}`);
  assert.ok(!quadsOverlap(corner.frontQuad, tall.quad, 0.01));
  const errs = runChecks(p, k).items.filter((x) => x.level === "error");
  assert.deepEqual(errs.map((e) => e.text), []);
});

test("Prüfung: Tür eines Hängeschranks, die in der Ecke an die Nachbarzeile schlägt, ist ein Fehler", () => {
  const p = defaultPlan("l");
  const k = buildKitchen(p);
  // Blindecke künstlich entfernen: Tür liegt hinter den Hängeschränken der Wand B
  const m = cabinets(k, "a")[0];
  m.frontQuad = [m.quad[3], m.quad[2], [m.quad[2][0], m.quad[2][1] + 0.4], [m.quad[3][0], m.quad[3][1] + 0.4]];
  const errs = runChecks(p, k).items.filter((x) => x.level === "error" && x.ids.includes(m.id));
  assert.ok(errs.some((e) => /Tür von .* stößt an/.test(e.text)), JSON.stringify(errs));
});

test("Freie Raumform: 90°-, 135°- und 60°-Ecke ohne Spalt und ohne Überschneidung", () => {
  const k90 = checkCorners("frei 90°", freePlan(90));
  assert.ok(Math.abs(cabinets(k90, "b")[0].x0 - 35) < 0.05);
  const k135 = checkCorners("frei 135°", freePlan(135));
  // 135°: Wand B beginnt bei 35 · sin 135° ≈ 24,7 cm
  assert.ok(Math.abs(cabinets(k135, "b")[0].x0 - 24.7) < 0.1, `B beginnt bei ${cabinets(k135, "b")[0].x0}`);
  // Spitz (60°): Fronten treffen sich auf der Winkelhalbierenden; die schräge Nachbarzeile
  // engt den Öffnungsraum ein → breitere Blindecke (40,4 + 40 / tan 60° ≈ 63,5 cm)
  const p60 = freePlan(60);
  p60.runs.a = [{ t: "unterschrank", w: 60 }, { t: "unterschrank", w: 60 }, { t: "unterschrank", w: 60 }, { t: "unterschrank", w: 120 }];
  p60.runs.a[0].g = Math.round((runExtent(p60, "a").length - 300) * 10) / 10;
  const k60 = checkCorners("frei 60°", p60);
  const c60 = cabinets(k60, "a").at(-1);
  assert.ok(Math.abs(c60.blind - 63.5) < 0.2, `Blindecke ${c60.blind}`);
});

test("Eigene Hängeschränke: Ecke wird genauso geschlossen", () => {
  const p = defaultPlan("l");
  p.up = { a: { m: "frei", r: [{ t: "haengeschrank", w: 60 }, { t: "haengeschrank", w: 60 }, { t: "haengeschrank", w: 60 }] }, b: { m: "frei", r: [{ t: "haengeschrank", w: 60 }, { t: "luefterhs", w: 60 }] } };
  checkCorners("L eigene", p);
});

test("Karussell-Eckschrank: Lücke über dem Karussell-Schenkel wird mit eigenem Hängeschrank geschlossen", () => {
  const p = defaultPlan("l");
  p.runs.a = [{ t: "eckschrank", w: 90, o: "mk" }, ...p.runs.a.slice(1)];
  const k = checkCorners("L Karussell", p);
  const b = cabinets(k, "b");
  assert.ok(Math.abs(b[0].x0 - 35) < 0.05);
  // Wand B beginnt (Unterschränke) bei 90 cm: Lücke 55 cm → eigener Hängeschrank, kein 115-cm-Ungetüm
  assert.ok(b[0].w <= 60.01, `erster Hängeschrank B ${b[0].w} cm`);
});
