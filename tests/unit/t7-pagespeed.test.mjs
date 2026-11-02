// T7 (umsetzung95, 30.10.2026): lokaler PageSpeed-Test als fester Projektbestandteil.
// Prüft, dass tools/qa/pagespeed.mjs dieselben Einstellungen wie Google
// PageSpeed Insights nutzt (verglichen mit den Lighthouse-Konstanten selbst),
// dass lighthouserc.json die vereinbarten Budgets enthält und dass die
// Werkzeuge exakt gepinnt sind. Dazu: jsbytes.mjs zählt noModule-Skripte nicht.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PSI_PROFILES,
  DEFAULT_ROUTES,
  DEFAULT_BASE,
  CATEGORIES,
  parseArgs,
  normalizeRoute,
  looksLikeDevServer,
  checkSettings,
  readCiConfig,
} from "../../tools/qa/pagespeed.mjs";
import { scriptRefs, hasThree } from "../../tools/qa/jsbytes.mjs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const json = (p) => JSON.parse(read(p));

test("mobil = Lighthouse-Standard (Moto G Power, langsames 4G, 4× CPU) wie PSI", async () => {
  const c = await import("lighthouse/core/config/constants.js");
  const m = PSI_PROFILES.mobile;
  assert.equal(m.formFactor, "mobile");
  assert.equal(m.throttlingMethod, "simulate");
  assert.equal(m.throttling.rttMs, c.throttling.mobileSlow4G.rttMs);
  assert.equal(m.throttling.throughputKbps, c.throttling.mobileSlow4G.throughputKbps);
  assert.equal(m.throttling.cpuSlowdownMultiplier, c.throttling.mobileSlow4G.cpuSlowdownMultiplier);
  assert.equal(m.throttling.cpuSlowdownMultiplier, 4);
  for (const k of ["mobile", "width", "height", "deviceScaleFactor"]) assert.equal(m.screenEmulation[k], c.screenEmulationMetrics.mobile[k], k);
  assert.deepEqual(m.cliArgs, [], "mobil ohne Preset = Lighthouse-Standard");
});

test("desktop = Lighthouse-Preset desktop", async () => {
  const c = await import("lighthouse/core/config/constants.js");
  const d = PSI_PROFILES.desktop;
  assert.deepEqual(d.cliArgs, ["--preset=desktop"]);
  assert.equal(d.throttling.rttMs, c.throttling.desktopDense4G.rttMs);
  assert.equal(d.throttling.throughputKbps, c.throttling.desktopDense4G.throughputKbps);
  assert.equal(d.throttling.cpuSlowdownMultiplier, c.throttling.desktopDense4G.cpuSlowdownMultiplier);
  for (const k of ["mobile", "width", "height", "deviceScaleFactor"]) assert.equal(d.screenEmulation[k], c.screenEmulationMetrics.desktop[k], k);
});

test("Standard: Prod-Server 3100, 3 Läufe, beide Geräte, alle vier Kategorien", () => {
  const o = parseArgs([]);
  assert.equal(DEFAULT_BASE, "http://localhost:3100");
  assert.equal(o.base, DEFAULT_BASE);
  assert.equal(o.runs, 3);
  assert.deepEqual(o.forms, ["mobile", "desktop"]);
  assert.deepEqual(o.routes, DEFAULT_ROUTES);
  assert.deepEqual(CATEGORIES, ["performance", "accessibility", "best-practices", "seo"]);
  assert.deepEqual(parseArgs(["--mobile-only", "--runs=5", "/de/kontakt"]).forms, ["mobile"]);
  assert.equal(parseArgs(["--runs=5"]).runs, 5);
});

test("Git-Bash-Pfadumwandlung wird zurückgeführt", () => {
  assert.equal(normalizeRoute("C:/Program Files/Git/de/produkte"), "/de/produkte");
  assert.equal(normalizeRoute("de/kontakt"), "/de/kontakt");
  assert.equal(normalizeRoute("/de"), "/de");
});

test("Dev-Server wird erkannt und abgelehnt", () => {
  assert.equal(looksLikeDevServer({ hmrStatus: 200, html: "" }), true);
  assert.equal(looksLikeDevServer({ hmrStatus: 426, html: "" }), true);
  assert.equal(looksLikeDevServer({ hmrStatus: 404, html: '<script src="/_next/static/chunks/react-refresh.js">' }), true);
  assert.equal(looksLikeDevServer({ hmrStatus: 404, html: '<script src="/_next/static/chunks/0cz1d0mv5g_q7.js" noModule="">' }), false);
  assert.match(read("tools/qa/pagespeed.mjs"), /assertProdServer\(opt\.base\)/);
});

test("Einstellungsprüfung meldet Abweichungen vom PSI-Profil", () => {
  const ok = { configSettings: { formFactor: "mobile", throttlingMethod: "simulate", throttling: { ...PSI_PROFILES.mobile.throttling }, screenEmulation: { ...PSI_PROFILES.mobile.screenEmulation } } };
  assert.deepEqual(checkSettings(ok, "mobile"), []);
  const bad = structuredClone(ok);
  bad.configSettings.throttling.cpuSlowdownMultiplier = 1;
  assert.deepEqual(checkSettings(bad, "mobile"), ["throttling.cpuSlowdownMultiplier 1"]);
});

test("lighthouserc.json: Budgets (Regressionsbremse, 100er-Kategorien, Nr. 16)", () => {
  const { cfg, base, routes, runs } = readCiConfig();
  assert.equal(base, "http://localhost:3100");
  assert.equal(runs, 3);
  assert.deepEqual(routes, DEFAULT_ROUTES);
  const matrix = cfg.ci.assert.assertMatrix;
  const all = matrix.find((e) => e.matchingUrlPattern === ".*").assertions;
  for (const k of ["categories:accessibility", "categories:best-practices", "categories:seo"]) {
    assert.equal(all[k][0], "error", k);
    assert.equal(all[k][1].minScore, 1, k);
  }
  assert.deepEqual(all["cumulative-layout-shift"], ["error", { maxNumericValue: 0.1, aggregationMethod: "median-run" }]);
  // Nr. 16 / Bibel §13: Zielwerte als Warnung (Gate bleibt perf.mjs)
  assert.equal(all["largest-contentful-paint"][1].maxNumericValue, 2000);
  assert.equal(all["total-blocking-time"][1].maxNumericValue, 200);
  // Regressionsbremse: jede Route hat eine Performance-Untergrenze (Messwert − 3)
  for (const r of DEFAULT_ROUTES) {
    const e = matrix.find((x) => x.matchingUrlPattern !== ".*" && new RegExp(x.matchingUrlPattern).test(`${base}${r}`));
    assert.ok(e, `keine Performance-Grenze für ${r}`);
    const [level, opt] = e.assertions["categories:performance"];
    assert.equal(level, "error", r);
    assert.equal(opt.aggregationMethod, "median-run", r);
    assert.ok(opt.minScore >= 0.5 && opt.minScore < 1, `${r}: ${opt.minScore}`);
    assert.equal(Math.round(opt.minScore * 100), opt.minScore * 100, r);
    // genau eine Grenze je Route (sonst gilt die strengere unbemerkt)
    assert.equal(matrix.filter((x) => x.matchingUrlPattern !== ".*" && new RegExp(x.matchingUrlPattern).test(`${base}${r}`)).length, 1, r);
  }
});

test("Werkzeuge exakt gepinnt, npm-Skripte vorhanden, Anleitung warnt vor Dev-Server", () => {
  const pkg = json("package.json");
  for (const n of ["lighthouse", "@lhci/cli"]) {
    assert.match(pkg.devDependencies[n] || "", /^\d+\.\d+\.\d+$/, `${n} exakt pinnen`);
    assert.equal(pkg.dependencies[n], undefined, `${n} nur als devDependency`);
  }
  assert.equal(pkg.scripts.pagespeed, "node tools/qa/pagespeed.mjs");
  assert.equal(pkg.scripts["pagespeed:ci"], "node tools/qa/pagespeed.mjs --ci");
  const doc = read("tools/qa/PAGESPEED.md");
  assert.match(doc, /Nie gegen den Dev-Server messen/);
  assert.match(doc, /platzhirsch-prodtest/);
  assert.match(doc, /perf\.mjs/);
});

test("jsbytes: noModule-Skripte zählen nicht, three.js wird erkannt", () => {
  const html = '<script src="/_next/static/chunks/a.js" async=""></script><script src="/_next/static/chunks/poly.js" noModule=""></script><link rel="preload" as="script" href="/_next/static/chunks/b.js"/><link rel="preload" as="image" href="/x.js.png"/>';
  const refs = scriptRefs(html);
  assert.deepEqual(refs.map((r) => [r.src.split("/").pop(), r.noModule]), [["a.js", false], ["poly.js", true], ["b.js", false]]);
  assert.equal(hasThree('console.warn("THREE.WebGLRenderer: Context Lost.")'), true);
  assert.equal(hasThree("window.__THREE__"), true);
  assert.equal(hasThree("export const x = 1"), false);
});
