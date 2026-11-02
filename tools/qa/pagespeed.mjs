// tools/qa/pagespeed.mjs – lokaler PageSpeed-Test (Inhaber-Wunsch 30.10.2026).
//
// Misst einen LAUFENDEN Produktions-Server (`next start`, Standard
// http://localhost:3100) mit Lighthouse und denselben Einstellungen wie Google
// PageSpeed Insights: mobil = Lighthouse-Standard (Moto G Power 412 × 823 @1,75,
// simulierte langsame 4G-Verbindung 150 ms RTT / 1,6 Mbit/s, 4× CPU-Bremse),
// desktop = Lighthouse-Preset „desktop“ (1350 × 940, 40 ms RTT, 10 Mbit/s, 1× CPU).
// Je Route und Gerät 3 Läufe, gewertet wird der Median-Lauf (Lighthouse
// computeMedianRun, wie PSI/LHCI). Nie gegen den Dev-Server messen: dort sind
// die Zahlen bedeutungslos (unminifiziert, HMR, kein Cache) – das Skript
// bricht dann ab. Anleitung: tools/qa/PAGESPEED.md.
//
//   node tools/qa/pagespeed.mjs [--base=http://localhost:3100] [--runs=3]
//        [--mobile-only|--desktop-only] [--out=<ordner>] [route …]
//   node tools/qa/pagespeed.mjs --ci      (Lighthouse CI: Budgets aus lighthouserc.json)
//
// Ausgabe: qa-screenshots/pagespeed/<JJJJ-MM-TT_HHMM>/ mit HTML- und JSON-Bericht
// je Lauf, summary.json und einer Tabelle in der Konsole. Das Gate für den
// Livegang bleibt tools/qa/perf.mjs (echte Drosselung, LCP p75 ≤ 2,0 s,
// Inhaber-Entscheidung Nr. 16); dieser Test ist die PageSpeed-Sicht dazu.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);

export const DEFAULT_BASE = "http://localhost:3100";
export const DEFAULT_RUNS = 3;
// Dieselben sechs Routen wie die Tempo-Messungen (qa-screenshots/tempo/messung3.md).
export const DEFAULT_ROUTES = ["/de", "/de/sofaplaner", "/de/yacht-interior", "/de/produkte", "/de/ezarri", "/de/beratung"];
export const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

// Erwartete Lighthouse-Einstellungen = PageSpeed Insights. Jeder Lauf wird
// gegen diese Werte geprüft (configSettings im Bericht); weicht einer ab,
// zählt der Lauf nicht.
export const PSI_PROFILES = {
  mobile: {
    formFactor: "mobile",
    throttlingMethod: "simulate",
    throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 },
    cliArgs: [],
  },
  desktop: {
    formFactor: "desktop",
    throttlingMethod: "simulate",
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1 },
    cliArgs: ["--preset=desktop"],
  },
};

export function parseArgs(argv) {
  const opt = { base: DEFAULT_BASE, baseGiven: false, runs: DEFAULT_RUNS, runsGiven: false, forms: ["mobile", "desktop"], routes: [], routesGiven: false, out: null, ci: false };
  for (const a of argv) {
    if (a.startsWith("--base=")) (opt.base = a.slice(7).replace(/\/+$/, "")), (opt.baseGiven = true);
    else if (a.startsWith("--runs=")) (opt.runs = Math.max(1, Number(a.slice(7)) || DEFAULT_RUNS)), (opt.runsGiven = true);
    else if (a.startsWith("--out=")) opt.out = a.slice(6);
    else if (a === "--mobile-only") opt.forms = ["mobile"];
    else if (a === "--desktop-only") opt.forms = ["desktop"];
    else if (a === "--ci") opt.ci = true;
    else if (!a.startsWith("--")) opt.routes.push(normalizeRoute(a));
  }
  opt.routesGiven = opt.routes.length > 0;
  if (!opt.routesGiven) opt.routes = [...DEFAULT_ROUTES];
  return opt;
}

// Git Bash schreibt "/de" zu "C:/Program Files/Git/de" um (MSYS-Pfadumwandlung).
// Beides wird hier zurückgeführt; "de/produkte" ohne Schrägstrich geht auch.
export function normalizeRoute(r) {
  const msys = r.match(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/](.*)$/);
  if (msys) r = msys[1];
  r = r.replace(/\\/g, "/");
  return r.startsWith("/") ? r : `/${r}`;
}

// true = sieht nach `next dev` aus. Der Dev-Server beantwortet den HMR-Endpunkt
// und liefert Turbopack-/React-Refresh-Laufzeit im HTML; `next start` nicht.
export function looksLikeDevServer({ hmrStatus, html }) {
  if (hmrStatus && hmrStatus !== 404) return true;
  return /react-refresh|__nextDevClientId|turbopack-hmr|\[turbopack\]_runtime|data-next-hide-fouc/.test(html || "");
}

async function assertProdServer(base) {
  let html = "";
  let hmrStatus = 0;
  try {
    const r = await fetch(base + "/de", { redirect: "follow" });
    html = await r.text();
  } catch (e) {
    throw new Error(`Kein Server unter ${base} erreichbar (${e.message}). Erst den Prod-Build starten, siehe tools/qa/PAGESPEED.md.`);
  }
  try {
    hmrStatus = (await fetch(base + "/_next/webpack-hmr")).status;
  } catch {
    /* kein HMR-Endpunkt = gut */
  }
  if (looksLikeDevServer({ hmrStatus, html })) {
    throw new Error(`${base} ist ein Dev-Server (next dev). PageSpeed-Werte nur gegen einen Prod-Build messen (next build && next start), siehe tools/qa/PAGESPEED.md.`);
  }
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    // Playwright-Chromium ist im Projekt ohnehin installiert (@playwright/test).
    const { chromium } = require("@playwright/test");
    const p = chromium.executablePath();
    if (p && fs.existsSync(p)) return p;
  } catch {
    /* Lighthouse sucht dann selbst ein installiertes Chrome */
  }
  return undefined;
}

export function slug(route) {
  return route.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "_") || "root";
}

export function checkSettings(lhr, form) {
  const want = PSI_PROFILES[form];
  const s = lhr.configSettings || {};
  const bad = [];
  if (s.formFactor !== want.formFactor) bad.push(`formFactor ${s.formFactor}`);
  if (s.throttlingMethod !== want.throttlingMethod) bad.push(`throttlingMethod ${s.throttlingMethod}`);
  for (const k of Object.keys(want.throttling)) if (s.throttling?.[k] !== want.throttling[k]) bad.push(`throttling.${k} ${s.throttling?.[k]}`);
  for (const k of Object.keys(want.screenEmulation)) if (s.screenEmulation?.[k] !== want.screenEmulation[k]) bad.push(`screenEmulation.${k} ${s.screenEmulation?.[k]}`);
  return bad;
}

export function pick(lhr) {
  const a = lhr.audits || {};
  const cat = (k) => (lhr.categories?.[k]?.score == null ? null : Math.round(lhr.categories[k].score * 100));
  const num = (k, d = 0) => (a[k]?.numericValue == null ? null : Number(a[k].numericValue.toFixed(d)));
  return {
    performance: cat("performance"),
    accessibility: cat("accessibility"),
    bestPractices: cat("best-practices"),
    seo: cat("seo"),
    fcp: num("first-contentful-paint"),
    lcp: num("largest-contentful-paint"),
    tbt: num("total-blocking-time"),
    cls: num("cumulative-layout-shift", 3),
    si: num("speed-index"),
    benchmarkIndex: Math.round(lhr.environment?.benchmarkIndex || 0),
  };
}

async function medianRun(lhrs) {
  const mod = await import(pathToFileURL(require.resolve("lighthouse/core/lib/median-run.js")).href);
  return mod.computeMedianRun(lhrs);
}

function runLighthouse({ url, form, file, chrome }) {
  const cli = require.resolve("lighthouse/cli/index.js");
  const args = [
    cli,
    url,
    ...PSI_PROFILES[form].cliArgs,
    ...CATEGORIES.length ? [`--only-categories=${CATEGORIES.join(",")}`] : [],
    "--output=json",
    "--output=html",
    `--output-path=${file}`,
    "--quiet",
    "--chrome-flags=--headless=new --no-first-run --no-default-browser-check",
  ];
  const r = spawnSync(process.execPath, args, {
    stdio: ["ignore", "ignore", "pipe"],
    timeout: 300000,
    env: { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) },
  });
  const json = `${file}.report.json`;
  if (!fs.existsSync(json)) throw new Error(`Lighthouse ohne Bericht (${url}, ${form}): ${String(r.stderr || "").slice(-300)}`);
  return JSON.parse(fs.readFileSync(json, "utf8"));
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

export function formatTable(rows) {
  const head = ["Route", "Gerät", "Perf", "A11y", "BP", "SEO", "FCP", "LCP", "TBT", "CLS", "SI", "Läufe LCP/TBT"];
  const s = (ms) => (ms == null ? "–" : `${(ms / 1000).toFixed(2).replace(".", ",")} s`);
  const body = rows.map((r) => [r.route, r.form, r.median.performance, r.median.accessibility, r.median.bestPractices, r.median.seo, s(r.median.fcp), s(r.median.lcp), r.median.tbt == null ? "–" : `${r.median.tbt} ms`, r.median.cls, s(r.median.si), r.runs.map((x) => `${x.lcp}/${x.tbt}`).join(" ")].map(String));
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(w[i])).join("  ");
  return [line(head), line(w.map((n) => "-".repeat(n))), ...body.map(line)].join("\n");
}

export async function run(opt, log = console.log) {
  await assertProdServer(opt.base);
  const outDir = path.resolve(opt.out || path.join(ROOT, "qa-screenshots", "pagespeed", stamp()));
  fs.mkdirSync(outDir, { recursive: true });
  const chrome = chromePath();
  const lhVersion = require("lighthouse/package.json").version;
  log(`PageSpeed lokal · Lighthouse ${lhVersion} · ${opt.base} · ${opt.runs} Läufe · ${opt.forms.join("+")} → ${path.relative(ROOT, outDir)}`);
  const rows = [];
  for (const route of opt.routes) {
    for (const form of opt.forms) {
      const lhrs = [];
      const runs = [];
      for (let i = 1; i <= opt.runs; i++) {
        const file = path.join(outDir, `${slug(route)}.${form}.${i}`);
        const lhr = runLighthouse({ url: opt.base + route, form, file, chrome });
        const bad = checkSettings(lhr, form);
        if (bad.length) throw new Error(`Einstellungen weichen von PageSpeed Insights ab (${route}, ${form}): ${bad.join(", ")}`);
        if (lhr.runtimeError) log(`  ! ${route} ${form} Lauf ${i}: ${lhr.runtimeError.code}`);
        lhrs.push(lhr);
        runs.push({ i, ...pick(lhr), report: path.basename(file) + ".report.html" });
      }
      const med = await medianRun(lhrs);
      const mi = lhrs.indexOf(med);
      const row = { route, form, median: { ...pick(med), run: mi + 1, report: runs[mi].report }, runs };
      rows.push(row);
      log(`  ${route} ${form}: Perf ${row.median.performance} · LCP ${row.median.lcp} ms · TBT ${row.median.tbt} ms · CLS ${row.median.cls}`);
      if (opt.ci) {
        // Lighthouse CI liest lhr-<zahl>.json (Median-Lauf und alle anderen,
        // lhci wertet selbst je URL den Median/alle Läufe nach Assertion).
        const ciDir = path.join(outDir, ".lighthouseci");
        fs.mkdirSync(ciDir, { recursive: true });
        lhrs.forEach((l, k) => fs.writeFileSync(path.join(ciDir, `lhr-${Date.now()}${k}.json`), JSON.stringify(l)));
      }
    }
  }
  const summary = {
    date: new Date().toISOString(),
    base: opt.base,
    lighthouse: lhVersion,
    runs: opt.runs,
    profiles: Object.fromEntries(opt.forms.map((f) => [f, { ...PSI_PROFILES[f], cliArgs: undefined }])),
    hint: "Median-Lauf je Route/Gerät (Lighthouse computeMedianRun). Gate für den Livegang: tools/qa/perf.mjs (Nr. 16).",
    rows,
  };
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  log("");
  log(formatTable(rows));
  log("");
  log(`Berichte: ${outDir}`);
  return { outDir, rows };
}

// Lighthouse CI: Routen, Läufe und Budgets stehen in lighthouserc.json.
// Gesammelt wird mit demselben Lighthouse wie oben (PSI-Fassung); lhci assert
// prüft danach die Budgets (Exit-Code ≠ 0 bei Verstoß).
export function readCiConfig(file = path.join(ROOT, "lighthouserc.json")) {
  const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
  const collect = cfg.ci?.collect || {};
  const urls = collect.url || [];
  const base = new URL(urls[0] || DEFAULT_BASE).origin;
  return { cfg, base, routes: urls.map((u) => new URL(u).pathname), runs: collect.numberOfRuns || DEFAULT_RUNS };
}

async function runCi(opt) {
  const { base, routes, runs } = readCiConfig();
  const res = await run({
    ...opt,
    base: opt.baseGiven ? opt.base : base,
    routes: opt.routesGiven ? opt.routes : routes,
    runs: opt.runsGiven ? opt.runs : runs,
    forms: ["mobile"],
    ci: true,
  });
  // lhci 0.15.1 liest gespeicherte Berichte immer aus <cwd>/.lighthouseci
  // (saved-reports.js ignoriert den Ordner von --lhr), daher cwd = Berichtsordner.
  const lhci = require.resolve("@lhci/cli/src/cli.js");
  const r = spawnSync(process.execPath, [lhci, "assert", `--config=${path.join(ROOT, "lighthouserc.json")}`], { stdio: "inherit", cwd: res.outDir });
  return r.status ?? 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const opt = parseArgs(process.argv.slice(2));
  (opt.ci ? runCi(opt) : run(opt).then(() => 0))
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error(String(e.message || e));
      process.exit(2);
    });
}
