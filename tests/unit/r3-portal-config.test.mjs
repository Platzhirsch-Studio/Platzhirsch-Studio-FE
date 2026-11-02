// tests/unit/r3-portal-config.test.mjs — Prod-Build ohne PORTAL_SESSION_SECRET:
// hasSessionSecret() ist false; readSessionValue() liefert dann null, das Portal
// leitet zum Login mit Hinweis statt mit 500 zu antworten.
// config.js importiert "server-only" (nur im Next-Bundle auflösbar), daher wird
// eine Kopie ohne diese Zeile in einem Kindprozess geladen.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "r3-portal-config-"));
const copy = path.join(dir, "config.mjs");
fs.writeFileSync(copy, fs.readFileSync("src/lib/portal/config.js", "utf8").replace(/^import "server-only";\s*$/m, ""));

const probe = (env) =>
  spawnSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(copy).href)}); console.log(m.hasSessionSecret());`], {
    env: { ...process.env, PORTAL_SESSION_SECRET: "", ...env },
    encoding: "utf8",
  }).stdout.trim();

test("hasSessionSecret: Produktion ohne/mit zu kurzem Secret → false, mit Secret → true, Entwicklung → true", () => {
  assert.equal(probe({ NODE_ENV: "production" }), "false");
  assert.equal(probe({ NODE_ENV: "production", PORTAL_SESSION_SECRET: "kurz" }), "false");
  assert.equal(probe({ NODE_ENV: "production", PORTAL_SESSION_SECRET: "x".repeat(32) }), "true");
  assert.equal(probe({ NODE_ENV: "development" }), "true");
});

test("readSessionValue prüft hasSessionSecret vor der Signatur", () => {
  const src = fs.readFileSync("src/lib/portal/session.js", "utf8");
  assert.match(src, /if \(!value \|\| !hasSessionSecret\(\)\) return null;\s*const payload = verify/);
});
