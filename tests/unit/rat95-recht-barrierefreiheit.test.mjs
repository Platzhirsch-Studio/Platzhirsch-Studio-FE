// Rat 9,5 · T5 Recht B13: /barrierefreiheit mit nur geprüften Aussagen.
//   node --test tests/unit/rat95-recht-barrierefreiheit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EINSCHRAENKUNGEN, MARKTUEBERWACHUNG, PRUEFUNG, STAND, UMGESETZT } from "../../src/lib/legal/barrierefreiheit.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

test("Prüfangaben stimmen mit dem Beleg überein (keine hochgerechneten Aussagen)", () => {
  const beleg = JSON.parse(read(PRUEFUNG.beleg));
  assert.equal(beleg.axe, PRUEFUNG.version, "axe-Version");
  assert.equal(beleg.date.slice(0, 10), PRUEFUNG.datum, "Prüfdatum");
  const paths = [...new Set(beleg.rows.map((r) => r.path))].sort();
  assert.deepEqual(paths, [...PRUEFUNG.seiten].sort(), "geprüfte Seiten");
  for (const dev of ["desktop", "pixel"]) assert.equal(beleg.rows.filter((r) => r.dev === dev).length, PRUEFUNG.seiten.length, dev);
  for (const r of beleg.rows) assert.equal(r.error, undefined, `${r.dev} ${r.path}: ${r.error}`);
  const found = beleg.rows.reduce((n, r) => n + r.violations.length, 0);
  assert.equal(found, PRUEFUNG.verstoesse, "Zahl der Verstöße wie im Beleg");
  assert.ok(beleg.tags.includes("wcag22aa"));
  assert.match(STAND, /^\d{4}-\d{2}-\d{2}$/);
});

test("Text: keine ungeprüften Versprechen, keine Platzhalter, Pflichtteile vorhanden", () => {
  const page = read("src/app/[locale]/barrierefreiheit/page.js");
  const lib = read("src/lib/legal/barrierefreiheit.js");
  const visible = [...UMGESETZT, ...EINSCHRAENKUNGEN].join(" ");
  assert.doesNotMatch(visible + page, /vollständig barrierefrei|vollumfänglich|zertifiziert|100 ?%|Screenreader getestet/i);
  assert.doesNotMatch(visible + page, /\[(?:vom|anwaltlich|Kanzlei|prüfen|Inhaber|Datum|Anschrift)/i, "keine [Platzhalter] auf der Seite");
  assert.doesNotMatch(lib, /manuell geprüft|von Hand geprüft/i);
  for (const id of ["pruefung", "umgesetzt", "einschraenkungen", "barriere-melden", "marktueberwachung"]) assert.match(page, new RegExp(`id="${id}"`), id);
  assert.match(page, /EMAIL_HREF/);
  assert.match(page, /PHONE_HREF/);
  assert.equal(MARKTUEBERWACHUNG.name, "Sozialministeriumservice");
  assert.ok(EINSCHRAENKUNGEN.length >= 3);
  // Rechtsseite: noindex wie Datenschutz/Impressum, deutscher Text mit lang="de"
  assert.match(page, /robots: \{ index: false, follow: true \}/);
  assert.match(page, /<LegalProse>/);
});
