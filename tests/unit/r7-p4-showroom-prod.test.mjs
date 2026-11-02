// R7-P4 (Release-Rat R2, neuland P1-3 / Auftrag 8): Solange nur die synthetische
// Testszene im Manifest steht, ist der Showroom-Rundgang in Produktion aus (404),
// nicht in der Sitemap und von keiner Seite aus fest auf die Testszene verlinkt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MANIFEST, SHOWROOM_PUBLIC, manifestReady, showroomMode, showroomSitemapPaths } from "../../src/lib/showroom/config.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(f)) out.push(p);
  }
  return out;
}

test("nur Testszene → nicht öffentlich, Produktion 404 (off), keine Sitemap", () => {
  const onlyTest = (MANIFEST.zonen || []).every((z) => String(z.id).startsWith("_"));
  if (!onlyTest) return; // echte Aufnahme liegt vor – dann gilt manifestReady()
  assert.equal(manifestReady().ok, false);
  assert.equal(SHOWROOM_PUBLIC, false);
  assert.equal(showroomMode({ nodeEnv: "production", preview: undefined }), "off");
  assert.deepEqual(showroomSitemapPaths(), []);
});

test("kein Code verlinkt die Testszene direkt (nur das Manifest für die Vorschau)", () => {
  for (const p of [...walk(join(root, "src/app")), ...walk(join(root, "src/components"))]) {
    assert.doesNotMatch(readFileSync(p, "utf8"), /\/showroom\/_testszene/, p);
  }
});
