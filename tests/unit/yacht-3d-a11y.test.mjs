// Werfthalle 3D, Runde 3: reduced motion live, keyboard walk through zones.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { yachtUi } from "../../src/lib/yacht/ui.js";

const hall = readFileSync(new URL("../../src/components/Yacht/Werfthalle.js", import.meta.url), "utf8");

test("reduced motion follows the system setting and data-motion live", () => {
  assert.match(hall, /addEventListener\?\.\("change", sync\)/);
  assert.match(hall, /attributeFilter: \["data-motion"\]/);
  assert.match(hall, /removeEventListener\?\.\("change", sync\)/);
});

test("PageDown/PageUp walk the zones, Home/Escape = overview; label says so (DE + EN)", () => {
  assert.match(hall, /e\.key === "PageDown" \|\| e\.key === "PageUp"/);
  assert.match(hall, /e\.key === "Escape" \|\| e\.key === "Home"/);
  assert.match(yachtUi("de").stageLabel, /Bild ab und Bild auf/);
  assert.match(yachtUi("en").stageLabel, /Page down and page up/);
});
