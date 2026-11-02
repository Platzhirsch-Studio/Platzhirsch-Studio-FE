// Runde 5 (neuland P1-3): perspektivische Fotomontage im Ezarri-Konfigurator.
// Prüft die Homographie (Rechteck → vier Eckpunkte), die CSS-matrix3d-Ausgabe
// und die Konvexitäts-Sperre gegen überkreuzte Ecken.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  START_ECKEN,
  abbilden,
  alsMatrix3d,
  dreieckAffin,
  dreiecksNetz,
  eckeSetzen,
  flaechenTransform,
  inPixel,
  istKonvex,
  perspektivischZeichnen,
  quadratAufViereck,
  rechteckAufViereck,
} from "../../src/lib/ezarri/konfigurator/homographie.js";

const nah = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("Einheitsquadrat auf sich selbst ist die Identität", () => {
  const m = quadratAufViereck([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]);
  assert.deepEqual(m, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
});

test("Rechteck-Ecken landen exakt auf den vier Zielpunkten (Trapez)", () => {
  const q = [{ x: 30, y: 50 }, { x: 270, y: 40 }, { x: 390, y: 300 }, { x: 5, y: 280 }];
  const m = rechteckAufViereck(480, 320, q);
  const src = [[0, 0], [480, 0], [480, 320], [0, 320]];
  src.forEach(([x, y], i) => {
    const p = abbilden(m, x, y);
    nah(p.x, q[i].x);
    nah(p.y, q[i].y);
  });
});

test("Perspektive: Mitte des Rechtecks liegt im Schnittpunkt der Diagonalen", () => {
  const q = [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 400, y: 300 }, { x: 0, y: 300 }];
  const m = rechteckAufViereck(200, 100, q);
  const mitte = abbilden(m, 100, 50);
  // Diagonalen (100,100)-(400,300) und (300,100)-(0,300) schneiden sich bei y = 100 + 200·t, x = 100 + 300·t
  // mit 100 + 300t = 300 − 300s, 100 + 200t = 100 + 200s → t = s = 1/3.
  nah(mitte.x, 200);
  nah(mitte.y, 100 + 200 / 3);
});

test("Parallelogramm ergibt affine Abbildung (keine Perspektivzeile)", () => {
  const m = quadratAufViereck([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 1 }, { x: 1, y: 1 }]);
  assert.equal(m[6], 0);
  assert.equal(m[7], 0);
});

test("matrix3d ist spaltenweise mit 16 Werten und bildet die Ecken ab", () => {
  const q = inPixel(START_ECKEN, 400, 300);
  const m = rechteckAufViereck(480, 320, q);
  const css = alsMatrix3d(m);
  const werte = css.replace(/^matrix3d\(|\)$/g, "").split(",").map(Number);
  assert.equal(werte.length, 16);
  assert.ok(werte.every(Number.isFinite));
  // Spaltenweise: (x, y, 0, 1) · M → Translation steht in Spalte 4 (Index 12/13).
  nah(werte[12], q[0].x, 1e-6);
  nah(werte[13], q[0].y, 1e-6);
  assert.match(flaechenTransform(START_ECKEN, 480, 320, 400, 300), /^matrix3d\(/);
  assert.equal(flaechenTransform(START_ECKEN, 480, 320, 0, 300), "none");
});

test("Startlage ist konvex; überkreuzte oder entartete Vierecke nicht", () => {
  assert.ok(istKonvex(START_ECKEN));
  assert.equal(istKonvex([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }]), false);
  assert.equal(istKonvex([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }]), false);
});

test("eckeSetzen klemmt auf 0–100 % und weist Überkreuzen ab", () => {
  const a = eckeSetzen(START_ECKEN, 0, -20, 130);
  // −20/130 geklemmt auf 0/100 würde links unten über die Ecke „unten links“ hinausragen → bleibt konvex?
  if (a !== START_ECKEN) {
    assert.ok(a[0].x >= 0 && a[0].y <= 100);
    assert.ok(istKonvex(a));
  }
  const b = eckeSetzen(START_ECKEN, 1, 30, 40);
  assert.deepEqual(b[1], { x: 30, y: 40 });
  assert.notEqual(b, START_ECKEN);
  // Ecke oben links rechts an „oben rechts“ vorbei ziehen → überkreuzt → unverändert.
  const c = eckeSetzen(START_ECKEN, 0, 99, 95);
  assert.equal(c, START_ECKEN);
});

test("dreieckAffin legt Quell- exakt auf Zieldreieck", () => {
  const s = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }];
  const d = [{ x: 3, y: 4 }, { x: 23, y: 8 }, { x: 1, y: 19 }];
  const [a, b, c, dd, e, f] = dreieckAffin(s, d);
  s.forEach((p, i) => {
    nah(a * p.x + c * p.y + e, d[i].x);
    nah(b * p.x + dd * p.y + f, d[i].y);
  });
  assert.equal(dreieckAffin(s, d) && dreieckAffin([s[0], s[0], s[1]], d), null);
});

test("dreiecksNetz: 2·n² Dreiecke, Netz-Ecken liegen auf dem Viereck", () => {
  const q = inPixel(START_ECKEN, 400, 300);
  const m = rechteckAufViereck(480, 320, q);
  const netz = dreiecksNetz(m, 480, 320, 10);
  assert.equal(netz.length, 200);
  nah(netz[0].d[0].x, q[0].x);
  nah(netz[0].d[0].y, q[0].y);
  const letzte = netz[netz.length - 2];
  nah(letzte.d[2].x, q[2].x);
  nah(letzte.d[2].y, q[2].y);
});

test("perspektivischZeichnen ruft drawImage je Dreieck mit passender Transform", () => {
  const calls = [];
  const ctx = new Proxy({}, { get: (_, k) => (...args) => calls.push([k, args]) });
  const ok = perspektivischZeichnen(ctx, {}, 480, 320, inPixel(START_ECKEN, 400, 300), { dpr: 2, n: 4 });
  assert.equal(ok, true);
  assert.equal(calls.filter(([k]) => k === "drawImage").length, 32);
  const t = calls.find(([k, a]) => k === "setTransform" && a[0] !== 2);
  assert.ok(t && t[1].every(Number.isFinite));
});
