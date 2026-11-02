// tests/unit/r6-release.test.mjs — Release-Tor Runde 6 (R6-release).
// Prüft nur Dateien, kein Netz, kein Server.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));

test("framer-motion: exakt 12.43.0 in dependencies, gleich Lockfile und motion", () => {
  assert.equal(pkg.dependencies["framer-motion"], "12.43.0");
  assert.equal(lock.packages[""].dependencies["framer-motion"], "12.43.0");
  assert.equal(lock.packages["node_modules/framer-motion"].version, "12.43.0");
  assert.equal(lock.packages["node_modules/motion"].version, lock.packages["node_modules/framer-motion"].version);
  assert.equal(lock.packages["node_modules/motion/node_modules/framer-motion"], undefined);
});

// Geändert in Runde 3 (P4-technik): Der Prod-Build läuft bereits auf Next 16.4.1
// (Sicherheitsupdate). Repo und Prod-Build müssen dieselbe Version haben, sonst misst
// die Abnahme etwas anderes als ausgeliefert wird. Daher exakt 16.4.1 statt 16.3.8.
// 16.4.3 (Sicherheitsfix, Expertenrat-P0) erschien am 23.10.2026 und ist jünger als die
// 14-Tage-Regel → Anhebung frühestens ab 06.11.2026, dann diese Erwartung mitziehen.
test("Next exakt 16.4.1 wie im Prod-Build: package.json, eslint-config-next und Lockfile gleich", () => {
  assert.equal(pkg.dependencies.next, "16.4.1");
  assert.equal(pkg.devDependencies["eslint-config-next"], "16.4.1");
  assert.equal(lock.packages["node_modules/next"].version, "16.4.1");
});

test("source-map-js >= 1.2.2 (GHSA-68fv-2mgg-jv7q) per overrides und im Lockfile", () => {
  assert.equal(pkg.overrides["source-map-js"], "^1.2.2");
  const [maj, min, pat] = lock.packages["node_modules/source-map-js"].version.split(".").map(Number);
  assert.ok(maj > 1 || (maj === 1 && (min > 2 || (min === 2 && pat >= 2))));
});

test("check:facts als Skript, in check:prod (Schritt facts) und in der CI", () => {
  assert.equal(pkg.scripts["check:facts"], "node tools/content/check-facts.mjs --strict");
  const prod = read("tools/qa/prod-check.mjs");
  // Erwartung bewusst ergänzt (Rat 9,5 B3): Schritt "dse" (DSE-Sperre) nach probe.
  assert.match(prod, /"copy,build,manifest,start,probe,dse,tests,claims,nap,facts,perf,logscan"/);
  assert.match(prod, /\["facts", stepFacts, false\]/);
  assert.match(read(".github/workflows/ci.yml"), /run: npm run check:facts/);
});

test("ESLint-Schutzregeln stehen auf error, keine warn-Stufe mehr", () => {
  const cfg = read("eslint.config.mjs");
  assert.doesNotMatch(cfg, /"no-restricted-syntax":\s*\["warn"/);
  assert.equal((cfg.match(/"no-restricted-syntax":\s*\["error"/g) || []).length, 3);
});

test("/cmx: 404 der Route mit Cache-Control no-store, Proxy lässt /cmx durch", () => {
  const route = read("src/app/cmx/[...path]/route.js");
  assert.match(route, /const notFound = \(\) => new NextResponse\("Not found", \{ status: 404, headers: \{ "Cache-Control": "no-store" \} \}\);/);
  assert.match(read("src/proxy.js"), /revalidate\/\|cmx\/\|/);
  assert.match(read("tools/qa/prod-check.mjs"), /CMX_404_NO_STORE/);
});

test("check-claims: Vorschauseiten nur mit gesetztem Schalter", async () => {
  const { previewPaths } = await import("../../tools/checks/check-claims.mjs");
  assert.deepEqual(previewPaths({ args: {}, env: {} }), []);
  assert.deepEqual(previewPaths({ args: { "commerce-preview": true }, env: {} }), ["/de/preview/commerce"]);
  assert.deepEqual(previewPaths({ args: {}, env: { FREIGABE_PREVIEW: "1" } }), ["/de/preview/freigaben"]);
  assert.deepEqual(previewPaths({ args: {}, env: { COMMERCE_PREVIEW: "1", FREIGABE_PREVIEW: "1" } }), ["/de/preview/commerce", "/de/preview/freigaben"]);
  const src = read("tools/checks/check-claims.mjs");
  for (const p of ["/de/einkaufen-aus-der-schweiz", "/de/projekte"]) assert.ok(src.includes(`"${p}"`), p);
});

test("Schweiz-Spec: eindeutiger Locator für „nicht eingerechnet“", () => {
  assert.match(read("tests/e2e/r5-schweiz.spec.js"), /getByText\("nicht eingerechnet", \{ exact: true \}\)/);
});

test("Schlussabnahme-Liste enthält die R6-Seiten", () => {
  const list = read("tools/qa/abnahme-urls.txt");
  for (const line of ["/de/einkaufen-aus-der-schweiz 200", "/de/projekte 200", "/de/preview/freigaben 404", "/de/preview/commerce 404"]) {
    assert.ok(list.includes(line), line);
  }
});

test("TBT /kontakt: Formularblock mit content-visibility:auto und gemessener Ersatzhöhe (R6-release fix)", () => {
  const src = read("src/components/Kontakt/kontakt.js");
  const section = src.match(/<Section\s+id="nachricht"[\s\S]*?>/);
  assert.ok(section, "Section #nachricht fehlt");
  assert.match(section[0], /\[content-visibility:auto\]/);
  assert.match(section[0], /\[contain-intrinsic-size:auto_\d+px\]/);
  // the visit block (first screen) must stay rendered immediately
  assert.doesNotMatch(src.match(/<Section tone="band"[^>]*>/)[0], /content-visibility/);
});

test("perf.mjs: weist TBT ab FCP zusätzlich aus, das Tor bleibt alle Long Tasks", () => {
  const perf = read("tools/qa/perf.mjs");
  assert.match(perf, /tbtFcp/);
  assert.match(perf, /row\.tbt <= BUDGET\.tbt/);
});
