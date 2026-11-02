// tests/unit/r6-leads.test.mjs — R6-leads:
//   (1) zod runs jitless in the form schemas: no `new Function` (neither the
//       eval probe nor the JIT fast path) while schemas are built and parsed,
//       same parse results as before;
//   (2) OG locale from ogLocale(locale) on Kontakt, Beratung, Newsletter,
//       Adventsabend and Bewerten (no hand-written de_DE/en_US map);
//   (3) thin fallbacks: SELF_REPORT_TEXT / LEADS_TEXT German only (the texts
//       are in src/messages, see r4-leads / r5-leads / forms-leads).
// No network, no POST. Run: node --test tests/unit/r6-leads.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// Counts `new Function(...)` in a fresh process: Function is swapped for a
// counting proxy BEFORE zod loads, then the module under test builds and
// parses schemas. Fresh process = zod's global config and eval cache start clean.
function functionConstructs(body) {
  const script = `
    const F = globalThis.Function;
    let calls = 0;
    globalThis.Function = new Proxy(F, { construct(t, a) { calls++; return Reflect.construct(t, a); } });
    ${body}
    process.stdout.write(JSON.stringify({ calls, out: globalThis.__out ?? null }));
  `;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

const schemasUrl = pathToFileURL(path.join(ROOT, "src/lib/forms/schemas.js")).href;

test("(1) control: plain zod 4 does use new Function for z.object (probe + JIT)", () => {
  const { calls } = functionConstructs(`
    const { z } = await import("zod");
    z.object({ a: z.string() }).parse({ a: "x" });
  `);
  assert.ok(calls > 0, "without jitless zod compiles with new Function – otherwise this test proves nothing");
});

test("(1) form schemas: jitless, 0 × new Function while building and parsing all four", () => {
  const { calls, out } = functionConstructs(`
    const m = await import(${JSON.stringify(schemasUrl)});
    const core = await import("zod/v4/core");
    const k = m.kontaktSchema.safeParse({ name: "Erika Muster", email_address: "erika@example.com", ihre_nachricht: "Ich interessiere mich für ein Sofa.", extra: 1 });
    const b = m.beratungSchema.safeParse({ bei_meiner_anfrage_geht_es_um: "Neubau", das_projekt_soll_verwirklicht_werden: "Wohnung", bitte_beschreiben_sie_ihr_vorhaben: "Wohnzimmer neu einrichten.", vorname: "Erika", nachname: "Muster", email: "erika@example.com", telefon: "+43 664 1234567" });
    const p = m.produktSchema.safeParse({ anfrage_type: "Privat", anfrage_vorname: "E", anfrage_nachname: "M", anfrage_email: "x@y.at", anfrage_phone: "066412345", anfrage_country: "AT", anfrage_city: "Lochau", anfrage_address: "Hauptstraße 1", produkte: [4711] });
    const n = m.newsletterSchema.safeParse({ email: " erika@example.com " });
    const bad = m.kontaktSchema.safeParse({ name: "E", email_address: "nope", ihre_nachricht: "kurz" });
    globalThis.__out = { jitless: core.globalConfig.jitless, k: k.success && Object.keys(k.data), b: b.success, p: p.success, n: n.success, bad: bad.error?.issues.map((i) => i.message) };
  `);
  assert.equal(calls, 0, "no eval probe, no JIT");
  assert.equal(out.jitless, true);
  assert.deepEqual(out.k, ["name", "email_address", "ihre_nachricht"], "unknown keys still dropped");
  assert.equal(out.b && out.p && out.n, true);
  assert.deepEqual(out.bad, ["Name must be at least 2 characters", "Invalid email format", "Message must be at least 10 characters"]);
});

test("(1) jitless is set before the first z.object() in schemas.js", () => {
  const src = read("src/lib/forms/schemas.js");
  const cfg = src.indexOf("z.config({ jitless: true });");
  assert.ok(cfg > 0);
  const first = src.search(/=\s*z\s*\.object\(/);
  assert.ok(first > 0 && cfg < first, "flag is read when an object schema is built");
});

const PAGES = ["kontakt", "beratung", "newsletter", "adventsabend", "bewerten"];

test("(2) OG locale: ogLocale(locale) on the five lead pages, no hand-written locale map", () => {
  for (const p of PAGES) {
    const src = read(`src/app/[locale]/${p}/page.js`);
    assert.match(src, /import \{[^}]*\bogLocale\b[^}]*\} from "@\/lib\/seo\/pageMetadata";/, `${p}: import`);
    assert.match(src, /locale: ogLocale\(locale\)/, `${p}: openGraph.locale`);
    assert.doesNotMatch(src, /"de_DE"|"en_US"|locale: "de_AT"|meta\?\.locale/, `${p}: no own map`);
  }
});

test("(3) fallbacks: German only, other locales empty", async () => {
  const { SELF_REPORT_TEXT } = await import("../../src/lib/forms/selfReport.js");
  const { LEADS_TEXT } = await import("../../src/lib/forms/leadsCopy.js");
  for (const table of [SELF_REPORT_TEXT, LEADS_TEXT]) {
    assert.ok(Object.keys(table.de).length > 0);
    for (const l of ["en", "fr", "it"]) assert.deepEqual(table[l], {}, l);
  }
});
