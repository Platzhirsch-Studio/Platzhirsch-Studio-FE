// Rat 9,5 · T5 Recht A13: Stelleninserate ohne Entgeltangabe werden nicht
// veröffentlicht (§ 9 Abs 2 GlBG).   node --test tests/unit/rat95-recht-karriere.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasSalary, publishableJob, publishableJobs } from "../../src/components/Karriere/glbg.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

test("Stelle ohne Gehalt wird nicht veröffentlicht", () => {
  const base = { title: "Verkauf", status: "Aktiv", slug: "verkauf" };
  for (const salary of [undefined, null, "", "  ", "nach Vereinbarung", "KV", 0, NaN]) {
    assert.equal(publishableJob({ ...base, salary }), false, String(salary));
  }
  for (const salary of ["2.400 brutto/Monat (KV Handel), Bereitschaft zur Überzahlung", "2400", 2400]) {
    assert.equal(publishableJob({ ...base, salary }), true, String(salary));
  }
  assert.equal(publishableJob({ ...base, status: "Entwurf", salary: "2400" }), false, "nur aktive Stellen");
  assert.equal(hasSalary({ salary: "ab 2.400 €" }), true);
  assert.deepEqual(publishableJobs([{ ...base, salary: "" }, { ...base, slug: "b", salary: "2400" }]).map((j) => j.slug), ["b"]);
  assert.deepEqual(publishableJobs(null), []);
});

test("Liste, Detailseite, statische Pfade und Datum nutzen die Sperre", () => {
  // Seit 31.10.2026: visibleJobs = publishableJobs in Produktion; die Vorschau zeigt gesperrte Stellen markiert.
  assert.match(read("src/components/Karriere/karriereposition.js"), /const jobs = visibleJobs\(karriere\);/);
  const detail = read("src/app/[locale]/ueber-uns/karriere/[slug]/page.js");
  assert.match(detail, /const activeJobs = publishableJobs\(jobs\);/);
  assert.match(detail, /if \(!job \|\| !visibleJob\(job\)\) notFound\(\);/);
  assert.match(detail, /if \(!job \|\| !visibleJob\(job\)\) \{/);
  assert.match(detail, /\{live && <JobPostingJsonLd/);
  assert.match(read("src/app/[locale]/ueber-uns/karriere/page.js"), /publishableJob\(j\) && j\?\.posted/);
});
