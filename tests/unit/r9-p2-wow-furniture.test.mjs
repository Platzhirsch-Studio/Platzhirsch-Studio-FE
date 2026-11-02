// R5-fix P2 (technik P1-2): the "Pause" hero draws no line over the armchairs
// (probably Minotti) until the written image sign-off.
//   node --test tests/unit/r9-p2-wow-furniture.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAUSE_PATHS } from "../../src/lib/wow/pause-paths.js";
import { inkStrokes } from "../../src/lib/wow/ink.js";
import { stageStrokes, isFurniture, furnitureSignedOff } from "../../src/lib/wow/strokes.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STROKES = inkStrokes(PAUSE_PATHS);

test("ohne Freigabe: UNDER, Stift und Ruhe-Linie enthalten keine Möbel-Pfade", () => {
  const { under, pens, rest } = stageStrokes(STROKES, false);
  for (const [name, list] of Object.entries({ under, pens, rest })) {
    assert.ok(list.length > 0, `${name} leer`);
    const furniture = list.filter(isFurniture).map((p) => p.id);
    assert.deepEqual(furniture, [], `${name} zieht Möbel nach: ${furniture.join(", ")}`);
  }
  assert.deepEqual(under.map((p) => p.id).sort(), ["fireplace", "room", "wall-top"]);
});

test("Möbel-Pfade existieren in den Daten (Test greift wirklich)", () => {
  assert.ok(STROKES.filter(isFurniture).length >= 2);
});

test("Freigabe nur explizit mit NEXT_PUBLIC_WOW_OVERLAY=1, auch nicht im Dev-Default", () => {
  assert.equal(furnitureSignedOff({}), false);
  assert.equal(furnitureSignedOff({ NODE_ENV: "development" }), false);
  assert.equal(furnitureSignedOff({ NEXT_PUBLIC_WOW_OVERLAY: "0" }), false);
  assert.equal(furnitureSignedOff({ NEXT_PUBLIC_WOW_OVERLAY: "1" }), true);
  assert.ok(stageStrokes(STROKES, true).under.some(isFurniture));
});

test("WowStage nutzt die Auswahl (kein UNDER = PENS mehr)", () => {
  const src = fs.readFileSync(path.join(root, "src/components/Wow/WowStage.js"), "utf8");
  assert.match(src, /stageStrokes\(STROKES\)/);
  assert.doesNotMatch(src, /UNDER\s*=\s*PENS/);
  assert.doesNotMatch(src, /filter\(\(p\) => p\.kind !== "guide"\)/);
});
