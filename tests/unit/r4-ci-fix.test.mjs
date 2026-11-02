// tests/unit/r4-ci-fix.test.mjs — R4-plattform-ci, Nachbesserung nach QM (P2 1, 2, 4)
// 1) Bundle-Budget als Ratchet (Baseline, rot nur bei Zuwachs)
// 2) Rate-Limit: Next nur lokal binden, nginx-Vorlage überschreibt X-Forwarded-For
// 4) deploy.sh: Rollback auch bei fehlgeschlagenem pm2-Reload; DRY_RUN legt nichts an
// Run: node --test tests/unit/r4-ci-fix.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { analyze, buildBaseline, loadBaseline } from "../../tools/ci/bundle-budget.mjs";

const TOOL = path.resolve("tools/ci/bundle-budget.mjs");
const DEPLOY = path.resolve("scripts/deploy.sh").replace(/\\/g, "/");
const read = (p) => fs.readFileSync(path.resolve(p), "utf8");
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p)).replace(/\\/g, "/");

// ---------- 1) Ratchet ----------

function writeChunk(dir, name, kib) {
  const file = path.join(dir, "static", "chunks", name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const buf = crypto.randomBytes(Math.round(kib * 1024));
  fs.writeFileSync(file, buf);
  return zlib.gzipSync(buf, { level: 9 }).length;
}
function writeManifest(dir, key, entries) {
  const file = path.join(dir, "server", "app", `${key}_client-reference-manifest.js`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = { clientModules: {}, entryCSSFiles: {}, entryJSFiles: entries };
  fs.writeFileSync(file, `globalThis.__RSC_MANIFEST = {};\nglobalThis.__RSC_MANIFEST[${JSON.stringify(key)}] = ${JSON.stringify(body)};\n`);
}
// gross ≈ 220 KiB (über 190), klein ≈ 140 KiB
function fixture({ bigKib = 80 } = {}) {
  const dir = tmp("r4-ci-fix-bb-");
  writeChunk(dir, "main.js", 100);
  writeChunk(dir, "layout.js", 30);
  writeChunk(dir, "small.js", 10);
  writeChunk(dir, "big.js", bigKib);
  fs.writeFileSync(path.join(dir, "build-manifest.json"), JSON.stringify({ rootMainFiles: ["static/chunks/main.js"] }));
  fs.writeFileSync(
    path.join(dir, "app-path-routes-manifest.json"),
    JSON.stringify({ "/[locale]/klein/page": "/[locale]/klein", "/[locale]/gross/page": "/[locale]/gross" })
  );
  writeManifest(dir, "/[locale]/klein/page", { l: ["static/chunks/layout.js"], p: ["static/chunks/small.js"] });
  writeManifest(dir, "/[locale]/gross/page", { l: ["static/chunks/layout.js"], p: ["static/chunks/big.js"] });
  return dir;
}

test("Ratchet: über Budget, aber nicht gewachsen = nicht rot; Zuwachs > Toleranz = rot; neue Route = rot", () => {
  const dir = fixture();
  const gross = analyze(dir).routes.find((r) => r.route === "/[locale]/gross").gzKb;
  assert.ok(gross > 190);

  const same = analyze(dir, { baseline: { "/[locale]/gross": gross }, toleranceKb: 2 });
  const g = same.routes.find((r) => r.route === "/[locale]/gross");
  assert.equal(g.status, "baseline");
  assert.equal(g.over, false);
  assert.deepEqual(same.over, []);
  assert.deepEqual(same.overBudget, ["/[locale]/gross"]);

  // 1 KiB Wachstum liegt in der Toleranz (gzip-Rauschen), 5 KiB nicht.
  assert.equal(analyze(dir, { baseline: { "/[locale]/gross": gross - 1 }, toleranceKb: 2 }).over.length, 0);
  const grown = analyze(dir, { baseline: { "/[locale]/gross": gross - 5 }, toleranceKb: 2 });
  assert.equal(grown.routes.find((r) => r.route === "/[locale]/gross").status, "regression");
  assert.deepEqual(grown.over, ["/[locale]/gross"]);

  // Baseline ohne diese Route: neue Route über Budget ist rot.
  const fresh = analyze(dir, { baseline: { "/[locale]/anders": 300 } });
  assert.equal(fresh.routes.find((r) => r.route === "/[locale]/gross").status, "new");
  assert.equal(fresh.over.length, 1);

  // Kleiner geworden → Hinweis "improved".
  const better = analyze(dir, { baseline: { "/[locale]/gross": gross + 10 }, toleranceKb: 2 });
  assert.equal(better.routes.find((r) => r.route === "/[locale]/gross").improved, true);
});

test("buildBaseline: nur Routen über Budget, Wert sinkt, steigt nie", () => {
  const dir = fixture();
  const report = analyze(dir);
  const gross = report.routes.find((r) => r.route === "/[locale]/gross").gzKb;
  const b = buildBaseline(report);
  assert.deepEqual(Object.keys(b.routes), ["/[locale]/gross"]);
  assert.equal(b.routes["/[locale]/gross"], gross);
  assert.equal(buildBaseline(report, { "/[locale]/gross": gross - 3 }).routes["/[locale]/gross"], gross - 3);
  assert.equal(buildBaseline(report, { "/[locale]/gross": gross + 3 }).routes["/[locale]/gross"], gross);
});

test("CLI Ratchet: Exit 0 mit Baseline, 1 nach Wachstum, 2 ohne Baseline-Datei; --write-baseline", () => {
  const dir = fixture();
  const base = path.join(dir, "baseline.json");
  const w = spawnSync(process.execPath, [TOOL, `--dir=${dir}`, `--write-baseline=${base}`, "--reset-baseline"], { encoding: "utf8" });
  assert.match(w.stdout, /Baseline geschrieben/);
  assert.equal(Object.keys(loadBaseline(base)).length, 1);

  const ok = spawnSync(process.execPath, [TOOL, `--dir=${dir}`, `--baseline=${base}`], { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /kein Zuwachs/);

  writeChunk(dir, "big.js", 95); // +15 KiB
  const red = spawnSync(process.execPath, [TOOL, `--dir=${dir}`, `--baseline=${base}`], { encoding: "utf8" });
  assert.equal(red.status, 1);
  assert.match(red.stderr, /gewachsen/);

  const missing = spawnSync(process.execPath, [TOOL, `--dir=${dir}`, `--baseline=${path.join(dir, "fehlt.json")}`], { encoding: "utf8" });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /Baseline fehlt/);
});

test("Eingecheckte Baseline ist gültig und ci.yml nutzt sie", () => {
  const file = path.resolve("tools/ci/bundle-baseline.json");
  const data = JSON.parse(read(file));
  assert.equal(data.budgetKb, 190);
  const routes = loadBaseline(file);
  assert.ok(Object.keys(routes).length > 0);
  for (const [route, value] of Object.entries(routes)) {
    assert.ok(route.startsWith("/"), route);
    assert.ok(value > 190 && value < 1000, `${route}: ${value}`);
  }
  const yml = read(".github/workflows/ci.yml");
  assert.match(yml, /bundle-budget\.mjs --dir=\.next --budget-kb=190 --baseline=tools\/ci\/bundle-baseline\.json/);
});

// ---------- 2) Bindung + nginx ----------

test("nginx-Vorlage: X-Forwarded-For wird überschrieben, upstream nur Loopback, /cmx-Fehler no-store", () => {
  const conf = read("tools/ci/nginx-platzhirsch.conf.example");
  assert.match(conf, /proxy_set_header X-Forwarded-For\s+\$remote_addr;/);
  assert.match(conf, /server 127\.0\.0\.1:3000;/);
  assert.match(conf, /default\s+"no-store";/);
  assert.match(conf, /proxy_hide_header Cache-Control;/);
  assert.match(conf, /add_header Cache-Control \$platzhirsch_cmx_cache always;/);
});

// ---------- 4) deploy.sh ----------

function bashPath() {
  if (process.platform !== "win32") return "bash";
  for (const p of ["C:/Program Files/Git/bin/bash.exe", "C:/Program Files/Git/usr/bin/bash.exe"]) if (fs.existsSync(p)) return p;
  return "bash";
}
const hasBash = () => spawnSync(bashPath(), ["--version"]).status === 0;
const bash = (script, env = {}) =>
  spawnSync(bashPath(), ["-c", script], { encoding: "utf8", env: { ...process.env, ...env }, timeout: 60_000 });

// Lädt deploy.sh als Bibliothek (main läuft beim source nicht) und ersetzt
// Symlink, pm2 und curl durch Attrappen, die in $LOG protokollieren.
const harness = (log, pm2Body) => `
source ${JSON.stringify(DEPLOY)}
LOG=${JSON.stringify(log)}
switch_to() { echo "switch $1" >>"$LOG"; SWITCHED=1; }
write_pm2_config() { :; }
pm2() { ${pm2Body}; }
curl() { printf 200; }
sleep() { :; }
`;

test("deploy.sh: source lädt nur Funktionen, main läuft nicht", { skip: !hasBash() && "bash fehlt" }, () => {
  const r = bash(`source ${JSON.stringify(DEPLOY)}; type reload_or_rollback >/dev/null && echo geladen`);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /geladen/);
});

test("deploy.sh: pm2-Reload schlägt nach dem Umschalten fehl → Rollback auf Vorgänger", { skip: !hasBash() && "bash fehlt" }, () => {
  const dir = tmp("r4-ci-fix-dep-");
  const log = `${dir}/log`;
  // Erster startOrReload (neues Release) scheitert, alles danach klappt.
  const pm2Body = `if [[ "$1" == startOrReload && ! -f ${JSON.stringify(dir)}/once ]]; then touch ${JSON.stringify(dir)}/once; echo "pm2 fail" >>"$LOG"; return 1; fi; echo "pm2 $1" >>"$LOG"`;
  const r = bash(`${harness(log, pm2Body)}\nreload_or_rollback neu alt`);
  assert.equal(r.status, 1, "Deploy muss rot enden");
  const lines = fs.readFileSync(log, "utf8").trim().split("\n");
  assert.deepEqual(lines, ["pm2 fail", "switch alt", "pm2 startOrReload", "pm2 save"]);
  assert.match(r.stderr, /alt läuft wieder/);
});

test("deploy.sh: Vorgänger startet auch nicht → klare Meldung; ohne Vorgänger → Abbruch ohne Umschalten", { skip: !hasBash() && "bash fehlt" }, () => {
  const dir = tmp("r4-ci-fix-dep2-");
  const both = bash(`${harness(`${dir}/a`, "return 1")}\nreload_or_rollback neu alt`);
  assert.equal(both.status, 1);
  assert.match(both.stderr, /Auch das vorige Release alt antwortet nicht/);
  const none = bash(`${harness(`${dir}/b`, "return 1")}\nreload_or_rollback neu ""`);
  assert.equal(none.status, 1);
  assert.match(none.stderr, /kein Vorgänger-Release/);
  assert.ok(!fs.existsSync(`${dir}/b`) || !/switch/.test(fs.readFileSync(`${dir}/b`, "utf8")));
});

test("deploy.sh: Erfolg → kein Rollback; pm2_reload meldet Fehler auch im if-Kontext (set -e aus)", { skip: !hasBash() && "bash fehlt" }, () => {
  const dir = tmp("r4-ci-fix-dep3-");
  const ok = bash(`${harness(`${dir}/ok`, 'echo "pm2 $1" >>"$LOG"')}\nreload_or_rollback neu alt && echo FERTIG`);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /FERTIG/);
  assert.doesNotMatch(fs.readFileSync(`${dir}/ok`, "utf8"), /switch/);
  // Früher: "pm2 save" lief nach dem Fehler weiter und die Funktion meldete 0.
  const r = bash(`${harness(`${dir}/x`, '[[ "$1" == save ]]')}\nif pm2_reload; then echo OK; else echo ROT; fi`);
  assert.match(r.stdout, /ROT/);
});

test("deploy.sh: pm2-Konfiguration bindet Next an 127.0.0.1 (BIND_HOST)", { skip: !hasBash() && "bash fehlt" }, () => {
  const root = tmp("r4-ci-fix-eco-");
  fs.mkdirSync(`${root}/current`, { recursive: true });
  fs.mkdirSync(`${root}/shared`, { recursive: true });
  fs.copyFileSync(path.resolve("ecosystem.config.js"), `${root}/current/ecosystem.config.js`);
  const r = bash(`source ${JSON.stringify(DEPLOY)}; write_pm2_config`, { APP_ROOT: root, PORT: "3000" });
  assert.equal(r.status, 0, r.stderr);
  const req = createRequire(import.meta.url);
  const cfg = req(path.resolve(`${root}/shared/ecosystem.deploy.cjs`));
  const app = cfg.apps[0];
  assert.deepEqual(app.args, ["start", "-H", "127.0.0.1", "-p", "3000"]);
  assert.equal(app.env.HOSTNAME, "127.0.0.1");
  assert.equal(app.cwd, `${root}/current`);
});

test("deploy.sh DRY_RUN: legt keine Ordner und keine Sperrdatei an", { skip: !hasBash() && "bash fehlt" }, () => {
  const root = tmp("r4-ci-fix-dry-");
  fs.mkdirSync(`${root}/shared`, { recursive: true });
  fs.writeFileSync(`${root}/shared/.env.production`, "X=1\n");
  const stubs = `${root}-bin`;
  fs.mkdirSync(stubs, { recursive: true });
  for (const cmd of ["pm2", "npm", "flock"]) {
    fs.writeFileSync(path.join(stubs, cmd), "#!/usr/bin/env bash\necho \"STUB $0 $*\" >&2\nexit 0\n", { mode: 0o755 });
  }
  // Windows-Pfad (C:/…) enthält ":" → für PATH erst in /c/… umwandeln.
  const s = JSON.stringify(stubs);
  const r = bash(`B=$(command -v cygpath >/dev/null && cygpath -u ${s} || echo ${s}); export PATH="$B:$PATH"; bash ${JSON.stringify(DEPLOY)} deploy HEAD`, {
    DRY_RUN: "1",
    APP_ROOT: root,
    REPO_DIR: path.resolve(".git").replace(/\\/g, "/"),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stderr, /STUB/, "DRY_RUN darf keine Befehle ausführen");
  assert.deepEqual(fs.readdirSync(root).sort(), ["shared"]);
  assert.deepEqual(fs.readdirSync(`${root}/shared`), [".env.production"]);
  assert.match(r.stderr, /\[dry-run\] .*mv -Tf/);
});

test("deploy.sh: Healthcheck-Tor nur /de, /de/produkte nur Warnung; fork-Downtime dokumentiert", () => {
  const sh = read("scripts/deploy.sh");
  assert.match(sh, /HEALTH_URLS="\$\{HEALTH_URLS:-http:\/\/127\.0\.0\.1:\$PORT\/de\}"/);
  assert.match(sh, /HEALTH_WARN_URLS="\$\{HEALTH_WARN_URLS:-http:\/\/127\.0\.0\.1:\$PORT\/de\/produkte\}"/);
  assert.match(sh, /KEIN Zero-Downtime/);
  assert.match(sh, /reload_or_rollback "\$name" "\$prev"/);
});
