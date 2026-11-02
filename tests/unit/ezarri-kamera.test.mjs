// tests/unit/ezarri-kamera.test.mjs – Kameraführung und Qualitätsstufen der Ezarri-3D-Bühne
// (src/components/Ezarri/Konfigurator/kamera.js). Run: node --test tests/unit/ezarri-kamera.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const base = path.join(SRC, specifier.slice(2));
      const file = [base, `${base}.js`, path.join(base, "index.js")].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
      if (file) return next(pathToFileURL(file).href, context);
    }
    return next(specifier, context);
  },
});

const K = await import(pathToFileURL(path.join(SRC, "components/Ezarri/Konfigurator/kamera.js")).href);
const G = await import(pathToFileURL(path.join(SRC, "lib/ezarri/konfigurator/geometry.js")).href);
const POOL = { form: "rechteck", l: 8, b: 4, tFlach: 1.2, tTief: 1.8, treppe: "roemisch", bank: false, rand: "skimmer" };

test("kamera.js bleibt eager-tauglich (kein three/R3F)", () => {
  const src = fs.readFileSync(path.join(SRC, "components/Ezarri/Konfigurator/kamera.js"), "utf8");
  assert.doesNotMatch(src, /from "three|@react-three/);
});

test("Kamerapunkte: Übersicht, Wasserlinie, Unter Wasser, Von oben vorhanden; Wasserlinie knapp über dem Spiegel", () => {
  const p = K.buehnenPresets(POOL, "pool");
  for (const id of ["uebersicht", "wasserlinie", "unterwasser", "vogel", "nah"]) assert.ok(p[id], id);
  assert.deepEqual(Object.keys(p).slice(0, 4), ["uebersicht", "wasserlinie", "unterwasser", "vogel"]);
  const wl = G.waterLevel(POOL, "pool");
  assert.ok(p.wasserlinie.pos[1] > wl && p.wasserlinie.pos[1] < wl + 0.15, "Wasserlinie über dem Spiegel");
  assert.equal(p.wasserlinie.modus, "ueber");
  assert.equal(p.unterwasser.modus, "unter");
  // Übersicht unverändert aus geometry (Poster-Deckung)
  assert.deepEqual(p.uebersicht.pos, G.cameraPresets(POOL, "pool").uebersicht.pos);
  // Innenräume ohne Wasser-Begrenzung
  assert.equal(K.buehnenPresets({ form: "nische", l: 1.8, b: 1.2, tFlach: 0, tTief: 2.4 }, "bad").uebersicht.modus, "innen");
});

test("Begrenzung: über Wasser nie unter den Spiegel, unter Wasser im Becken über dem Boden", () => {
  const r = K.kameraRahmen(POOL, "pool");
  const wl = r.wl;
  // im Becken unter den Spiegel gezoomt → auf Spiegel + Abstand
  const a = K.begrenzeKamera([0, -0.6, 0], "ueber", r);
  assert.ok(a[1] >= wl + K.ABSTAND.ueberWasser - 1e-9);
  // außerhalb unter das Gelände → darüber
  const b = K.begrenzeKamera([10, -1, 0], "ueber", r);
  assert.ok(b[1] >= K.ABSTAND.gelaende);
  // unter Wasser: aus der Wand zurück ins Becken, unter den Spiegel, über den Boden
  const c = K.begrenzeKamera([6, 0.5, 0], "unter", r);
  assert.ok(c[0] <= POOL.l / 2 - K.ABSTAND.wand + 1e-6, `x ${c[0]}`);
  assert.ok(c[1] <= wl - K.ABSTAND.unterWasser + 1e-9);
  const d = K.begrenzeKamera([0, -5, 0], "unter", r);
  assert.ok(d[1] >= -G.depthAt(POOL, 0, "pool") + K.ABSTAND.boden - 1e-9);
  // Vorgaben liegen selbst im erlaubten Raum
  for (const [id, p] of Object.entries(K.buehnenPresets(POOL, "pool"))) {
    const q = K.begrenzeKamera(p.pos, p.modus, r);
    assert.ok(Math.hypot(q[0] - p.pos[0], q[1] - p.pos[1], q[2] - p.pos[2]) < 1e-6, `${id} unverändert`);
  }
});

test("Flugpfad: weich (Start/Ende exakt), Tauchgang über Wegpunkt im Becken", () => {
  const p = K.buehnenPresets(POOL, "pool");
  const wl = G.waterLevel(POOL, "pool");
  const f = K.flugPfad(p.uebersicht, p.wasserlinie, { wl });
  assert.ok(f.dauer >= 850 && f.dauer <= 2000);
  const s = f.at(0);
  const e = f.at(1);
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(s.pos[i] - p.uebersicht.pos[i]) < 1e-6);
    assert.ok(Math.abs(e.pos[i] - p.wasserlinie.pos[i]) < 1e-6);
  }
  const t = K.flugPfad(p.uebersicht, p.unterwasser, { wl, modusVon: "ueber", modusNach: "unter" });
  const mid = t.at(0.5).pos;
  assert.ok(Math.abs(mid[1] - (wl + 0.4)) < 1e-6, "Mitte über dem Wasser");
  assert.ok(Math.abs(t.at(1).pos[1] - p.unterwasser.pos[1]) < 1e-6);
  assert.equal(K.flugPfad(p.uebersicht, p.vogel, { dauer: 2600 }).dauer, 2600);
  // Einflug startet höher und weiter weg
  const i0 = K.introStart(p.uebersicht, 8);
  assert.ok(i0.pos[1] > p.uebersicht.pos[1]);
});

test("Qualität: Stufen absteigend, Startstufe je Gerät, Wächter (Median > 22 ms über 40 Bilder)", () => {
  assert.deepEqual(K.STUFEN.map((s) => s.id), ["hoch", "mittel", "niedrig"]);
  for (let i = 1; i < K.STUFEN.length; i++) assert.ok(K.STUFEN[i].dpr <= K.STUFEN[i - 1].dpr);
  assert.equal(K.startStufe({ touch: false }), 0);
  assert.equal(K.startStufe({ touch: true }), 1);
  assert.equal(K.startStufe({ touch: true, speicher: 2 }), 2);
  assert.equal(K.STUFEN[K.startStufe({ touch: true })].dpr, 1.25, "Touch bleibt bei dpr 1,25");
  const w = K.createWaechter({ fenster: 40, grenze: 22 });
  for (let i = 0; i < 39; i++) assert.equal(w.push(30), false);
  assert.equal(w.push(30), true, "40. langsames Bild → abstufen");
  for (let i = 0; i < 60; i++) assert.equal(w.push(16.7), false, "flüssig → bleibt");
  for (let i = 0; i < 100; i++) assert.equal(w.push(1000), false, "Pausen (> 250 ms) zählen nicht");
});
