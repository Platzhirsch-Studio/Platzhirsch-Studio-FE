// node --test tests/unit/yacht-hero-3d-link.test.mjs
// Yacht team (anfrage-mobil-code, 31.10.2026): the hero link "Boot in 3D
// ansehen" / "See the boat in 3D" (#werfthalle) carries the same words as the
// stage button (yachtUi.start3d). Same name → same action (WCAG 2.4.4, 3.2.4):
// following the link starts the 3D stage. three.js still loads only on this
// explicit request (or the existing desktop auto-start), never on page load.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_EN } from "../../src/lib/yacht/content-en.js";
import { YACHT_UI } from "../../src/lib/yacht/ui.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("Hero-Link und Bühnen-Knopf heißen gleich und zielen auf die Werfthalle", () => {
  assert.equal(CONTENT_EN.hero.secondary.href, "#werfthalle");
  assert.equal(CONTENT_EN.hero.secondary.label, YACHT_UI.en.start3d);
  const de = read("src/app/[locale]/yacht-interior/page.js");
  assert.match(de, /secondary: \{ href: "#werfthalle", label: "Boot in 3D ansehen" \}/);
  assert.equal(YACHT_UI.de.start3d, "Boot in 3D ansehen");
  assert.match(read("src/components/Yacht/YachtPage.js"), /id="werfthalle"/);
});

test("Werfthalle startet 3D beim Sprung auf #werfthalle (hashchange), sonst wie bisher", () => {
  const w = read("src/components/Yacht/Werfthalle.js");
  assert.match(w, /window\.addEventListener\("hashchange", onHash\)/);
  assert.match(w, /if \(window\.location\.hash === "#werfthalle"\) start3d\(\);/);
  assert.match(w, /return \(\) => window\.removeEventListener\("hashchange", onHash\);/);
  // three.js stays a dynamic chunk without SSR
  assert.match(w, /const Stage3D = dynamic\(\(\) => import\("\.\/Stage3D"\), \{ ssr: false/);
  // no start on mount just because the URL already has the hash
  assert.doesNotMatch(w, /useEffect\(\(\) => \{\s*if \(window\.location\.hash === "#werfthalle"\)/);
});
