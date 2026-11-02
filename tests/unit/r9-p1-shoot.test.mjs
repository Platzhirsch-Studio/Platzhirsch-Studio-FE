// tests/unit/r9-p1-shoot.test.mjs – R5-Fix P1 (Auftrag 9): tools/qa/shoot.mjs
// names files with the query (no overwriting), writes report.json after every
// URL and limits each URL instead of the whole run.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugOf, uniqueSlugs, withTimeout } from "../../tools/qa/shoot-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("slugOf: Query gehört zum Namen, Startseite = home", () => {
  assert.equal(slugOf("http://localhost:3000/de"), "de");
  assert.equal(slugOf("http://localhost:3000/"), "home");
  assert.equal(slugOf("http://localhost:3000/de/beratung?thema=yacht"), "de-beratung--q-thema-yacht");
  assert.notEqual(slugOf("http://localhost:3000/de/beratung?thema=yacht"), slugOf("http://localhost:3000/de/beratung?thema=kueche"));
  assert.notEqual(slugOf("http://localhost:3000/de/beratung?thema=yacht"), slugOf("http://localhost:3000/de/beratung"));
  const long = slugOf(`http://localhost:3000/de/produkte?q=${"x".repeat(300)}`);
  assert.ok(long.length <= 120, long.length);
});

test("uniqueSlugs: dieselbe URL zweimal → eigene Namen", () => {
  assert.deepEqual(uniqueSlugs(["http://a/de", "http://a/de", "http://a/de?x=1"]), ["de", "de-2", "de--q-x-1"]);
});

test("withTimeout: hängende URL → timedOut + Aufräumen, schnelle URL → Wert", async () => {
  let closed = false;
  const slow = await withTimeout(() => new Promise(() => {}), 30, () => {
    closed = true;
  });
  assert.equal(slow.timedOut, true);
  assert.equal(closed, true);
  assert.deepEqual(await withTimeout(async () => 7, 1000), { value: 7 });
  await assert.rejects(withTimeout(async () => { throw new Error("boom"); }, 1000), /boom/);
});

test("shoot.mjs: report.json nach jeder URL, Zeitlimit je URL", () => {
  const src = fs.readFileSync(path.join(ROOT, "tools/qa/shoot.mjs"), "utf8");
  assert.match(src, /report\.push\(entry\);\n\s+writeReport\(\);/);
  assert.match(src, /withTimeout\(\(\) => shootOne\(/);
  assert.match(src, /SHOOT_URL_TIMEOUT_MS/);
  assert.match(src, /uniqueSlugs\(urls\)/);
});
