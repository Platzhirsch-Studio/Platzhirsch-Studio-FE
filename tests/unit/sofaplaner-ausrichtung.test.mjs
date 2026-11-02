// node --test tests/unit/sofaplaner-ausrichtung.test.mjs
// Team katalog-modell-code (31.10.2026), fix-01: joined elements must meet at
// their backs. Before, a piece turned by 180° (seat against back) or dragged
// past the magnet (backs offset by 30+ cm) counted as a valid join.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { checkPlan, makeLookup } from "../../src/components/Labs/Sofaplaner/model.js";
import { analyzeJoins, findDock } from "../../src/lib/sofaplaner/geometry.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { NEUTRAL_FILES } from "../../src/lib/sofaplaner/neutral-data.js";
import { dynEn } from "../../src/lib/sofaplaner/copy/t.js";

const DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);
const minotti = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => normalizeFamily(JSON.parse(readFileSync(new URL(f, DIR), "utf8"))));
const neutral = NEUTRAL_FILES.map(([, raw]) => normalizeFamily(structuredClone(raw)));
const ROOM = { w: 2000, d: 1000 };

const neutralFam = neutral[0];
const lookup = makeLookup(neutralFam);
const el = (code) => neutralFam.elements.find((e) => e.code === code);
const at = (id, code, x, y, rot = 0) => ({ id, code, x, y, rot, w: el(code).w, d: el(code).d });

test("Startformen aller Familien (Minotti + neutral): jede Verbindung ist rückenbündig", () => {
  let joins = 0;
  for (const fam of [...minotti, ...neutral]) {
    const lk = makeLookup(fam);
    for (const t of buildTemplates(fam)) {
      for (const j of analyzeJoins(t.items, lk).joins) {
        joins += 1;
        assert.ok(!["align", "facing"].includes(j.issue?.code), `${fam.slug}/${t.key}: ${j.issue?.text}`);
      }
    }
  }
  assert.ok(joins > 400, `nur ${joins} Verbindungen geprüft`);
});

test("angedockte Elemente (findDock) sind immer rückenbündig", () => {
  const items = [at("a", "ENDE-2-SX", 300, 200)];
  const r = findDock(items, lookup, [el("SITZ-1")], { room: ROOM, makeId: () => "b" });
  assert.ok(r.item);
  const r2 = findDock([...items, r.item], lookup, [el("ENDE-1-DX")], { room: ROOM, makeId: () => "c" });
  const all = [...items, r.item, r2.item];
  assert.equal(analyzeJoins(all, lookup).joins.filter((j) => j.issue).length, 0);
});

test("um 180° gedrehtes Endelement (Sitz an Rücken) ist ein Fehler, kein gültiger Anschluss", () => {
  const a = at("a", "ENDE-2-SX", 300, 200, 0);
  // the same SX element turned by 180°: its open side now faces left and touches a's open right side
  const b = at("b", "ENDE-2-SX", 300 + a.w, 200, 180);
  const joins = analyzeJoins([a, b], lookup).joins;
  assert.equal(joins.length, 1, "Seiten berühren sich");
  assert.equal(joins[0].issue?.code, "facing");
  const errs = checkPlan({ room: ROOM, openings: [], items: [a, b] }, lookup).filter((c) => c.level === "error");
  assert.ok(errs.some((c) => c.kind === "join" && /gegeneinander verdreht/.test(c.text)), JSON.stringify(errs));
  assert.match(dynEn(errs.find((c) => c.kind === "join").text), / face opposite ways – their backs are on different sides. Turn one element.$/); // element names: localizeFamily on the EN page
});

test("versetzt angestelltes Element (am Magnet vorbei gezogen) wird als „Rücken nicht bündig“ gemeldet", () => {
  const a = at("a", "ENDE-2-SX", 300, 200);
  const b = at("b", "ENDE-2-DX", 300 + a.w / 2 + el("ENDE-2-DX").w / 2, 240);
  const warns = checkPlan({ room: ROOM, openings: [], items: [a, b] }, lookup).filter((c) => c.kind === "join");
  assert.equal(warns.length, 1, JSON.stringify(warns));
  assert.equal(warns[0].level, "warn");
  assert.match(warns[0].text, /Rücken nicht bündig \(40 cm versetzt\)/);
  assert.equal(dynEn(warns[0].text).includes("backs not flush (40 cm offset)"), true);
  // flush (offset ≤ 2 cm) stays silent
  const flush = { ...b, y: 201 };
  assert.equal(checkPlan({ room: ROOM, openings: [], items: [a, flush] }, lookup).filter((c) => c.kind === "join").length, 0);
});

test("ein schwererer Befund (andere Linie / Modulbreite) bleibt vor „nicht bündig“ stehen", () => {
  const other = neutral.find((f) => f.elements.find((e) => e.code === "SITZ-1").module !== el("SITZ-1").module);
  assert.ok(other, "zweiter neutraler Typ mit anderer Sitzbreite");
  const mixed = new Map([...neutralFam.elements.map((e) => [e.code, e]), ["X-SITZ", { ...other.elements.find((e) => e.code === "SITZ-1"), code: "X-SITZ" }]]);
  const lk = (c) => mixed.get(c) || null;
  const a = at("a", "ENDE-2-SX", 300, 200);
  const x = mixed.get("X-SITZ");
  const b = { id: "b", code: "X-SITZ", x: 300 + a.w / 2 + x.w / 2, y: 200 + 30 + (x.d - a.d) / 2, rot: 0, w: x.w, d: x.d };
  const j = analyzeJoins([a, b], lk).joins[0];
  assert.equal(j.issue.level, "error");
  assert.equal(j.issue.code, "module");
});
