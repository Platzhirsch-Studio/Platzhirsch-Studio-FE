// tests/unit/r4-ci-pipeline.test.mjs — R4-plattform-ci
// Perf-Tor, Reihenfolge der CI-Pipeline, deploy.sh (nur lesen, nie ausführen),
// ESLint-Schutzregeln nur als "warn".
// Run: node --test tests/unit/r4-ci-pipeline.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { evaluate, toMarkdown } from "../../tools/ci/perf-gate.mjs";

const read = (p) => fs.readFileSync(path.resolve(p), "utf8");

test("perf-gate: Budget aus perf.json, Gründe je Messung, fehlende LCP zählt als Fehler", () => {
  const data = {
    budget: { lcp: 2500, cls: 0.1, tbt: 200 },
    results: [
      { profile: "mobile", path: "/de", status: 200, lcp: 2400, cls: 0.01, tbt: 150 },
      { profile: "mobile", path: "/de/kontakt", status: 200, lcp: 3100, cls: 0.2, tbt: 500 },
      { profile: "desktop", path: "/de", status: 200, lcp: null, cls: 0, tbt: 0 },
    ],
  };
  const r = evaluate(data);
  assert.equal(r.failures.length, 2);
  assert.deepEqual(r.failures[0].reasons, ["LCP 3100 ms > 2500", "CLS 0.2 > 0.1", "TBT 500 ms > 200"]);
  assert.deepEqual(r.failures[1].reasons, ["keine LCP-Messung"]);
  assert.match(toMarkdown(r), /über Budget: \*\*2\*\*/);
});

test("perf-gate CLI: Exit 1 über Budget, 0 mit --warn-only, 2 ohne Datei", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "r4-ci-perf-"));
  const file = path.join(dir, "perf.json");
  fs.writeFileSync(file, JSON.stringify({ budget: { lcp: 2500, cls: 0.1, tbt: 200 }, results: [{ profile: "mobile", path: "/de", status: 200, lcp: 9000, cls: 0, tbt: 0 }] }));
  const tool = path.resolve("tools/ci/perf-gate.mjs");
  assert.equal(spawnSync(process.execPath, [tool, file]).status, 1);
  assert.equal(spawnSync(process.execPath, [tool, file, "--warn-only"]).status, 0);
  assert.equal(spawnSync(process.execPath, [tool, path.join(dir, "fehlt.json")]).status, 2);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("ci.yml: Reihenfolge lint → unit → build → Playwright+axe → Perf → check:claims → Bundle-Budget", () => {
  const yml = read(".github/workflows/ci.yml");
  const order = [
    "npx eslint .",
    "npm run test:unit",
    "npm run build",
    "npx playwright test",
    "node tools/qa/perf.mjs",
    "node tools/ci/perf-gate.mjs",
    "node tools/checks/check-claims.mjs",
    "node tools/ci/bundle-budget.mjs",
  ];
  let last = -1;
  for (const step of order) {
    const i = yml.indexOf(step);
    assert.ok(i > last, `${step} fehlt oder steht an falscher Stelle`);
    last = i;
  }
  // Keine Secrets, kein Deploy, nur Leserechte (Kommentare ausgenommen).
  const code = yml
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
  assert.doesNotMatch(code, /secrets\./);
  assert.doesNotMatch(code, /deploy\.sh|ssh |scp |rsync /);
  assert.match(yml, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(yml, /\t/, "YAML ohne Tabs");
});

test("deploy.sh: Bash-Syntax ok (bash -n), strikte Optionen, Rollback, Healthcheck, pm2 reload", { skip: !hasBash() && "bash nicht gefunden" }, () => {
  const file = path.resolve("scripts/deploy.sh");
  const r = spawnSync(bashPath(), ["-n", file], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const sh = read("scripts/deploy.sh");
  assert.match(sh, /^#!\/usr\/bin\/env bash/);
  assert.match(sh, /set -Eeuo pipefail/);
  for (const needle of ["releases", "ln -sfn", "mv -Tf", "pm2 reload", "rollback", "healthcheck", "KEEP_RELEASES", "flock"]) {
    assert.ok(sh.includes(needle), `${needle} fehlt`);
  }
  // Nie ein rm -rf auf eine Variable ohne Schutz.
  assert.doesNotMatch(sh, /rm -rf "?\$\{?[A-Z_]+\}?"?\s*$/m);
});

// R6-release: Die Regeln sind jetzt "error" (vorher "warn", Welle 1). Ausnahmen
// nur mit Begründung im Config-Block: Claim-Guard/Rechtsentwürfe/Concierge-Prompt
// ohne Händler-Regel, dunkle Flächen ohne Gold-Regel.
test("ESLint-Schutzregeln als error (R6-release), Ausnahmen je nur eine Regel", async () => {
  const { default: config } = await import("../../eslint.config.mjs");
  const ours = config.filter((c) => c?.name?.startsWith("platzhirsch/schutzregeln"));
  assert.equal(ours.length, 3);
  const has = (c, re) => c.rules["no-restricted-syntax"].slice(1).some((s) => re.test(s.selector));
  for (const c of ours) assert.equal(c.rules["no-restricted-syntax"][0], "error", c.name);
  const [all, guard, dark] = ours;
  assert.ok(has(all, /d1b250/) && has(all, /ndler/), "Grundregel mit Gold und Händler");
  assert.ok(has(guard, /d1b250/) && !has(guard, /ndler/), "Claim-Guard ohne Händler-Regel");
  assert.ok(!has(dark, /d1b250/) && has(dark, /ndler/), "dunkle Fläche ohne Gold-Regel");
});

function bashPath() {
  if (process.platform !== "win32") return "bash";
  for (const p of ["C:/Program Files/Git/bin/bash.exe", "C:/Program Files/Git/usr/bin/bash.exe"]) if (fs.existsSync(p)) return p;
  return "bash";
}
function hasBash() {
  return spawnSync(bashPath(), ["--version"]).status === 0;
}
