// node --test tests/unit/yacht-sprachhinweis.test.mjs
// Yacht team (anfrage-mobil-code, 31.10.2026): /fr|it/yacht-interior → 308 →
// /de/yacht-interior?lang=fr|it. The global notice said "Cette page n'existe
// qu'en allemand" – wrong since Welle 2 (there is /en/yacht-interior). Pages
// with an English twin now say so and link to the English version.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { APPOINTMENT_HREF, EN_TWINS, NOTICE_LANGS, enTwin, globalNotice } from "../../src/lib/arbeitsweise/langNotice.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const require = createRequire(import.meta.url);

test("Yacht und Sofaplaner: Hinweis „auch auf Englisch“ mit Link auf die englische Fassung", () => {
  for (const [de, en] of Object.entries(EN_TWINS)) {
    for (const l of NOTICE_LANGS) {
      const n = globalNotice(l, de);
      assert.equal(n.href, en, `${de}/${l}`);
      assert.equal(n.hrefLang, "en");
      assert.doesNotMatch(n.note, /only available in German|n’existe qu’en allemand|solo in tedesco/, `${de}/${l}`);
      assert.match(n.note, /English|anglais|inglese/);
      assert.match(n.core, /Harald Menghin/, "Kern-USP bleibt");
    }
  }
  assert.equal(enTwin("/de/yacht-interior/"), "/en/yacht-interior");
  assert.equal(enTwin("/de/yacht-interior-x"), null);
});

test("Alle anderen deutschen Seiten unverändert: „nur auf Deutsch“ + Termin in der Besuchersprache", () => {
  for (const l of NOTICE_LANGS) {
    for (const p of ["", "/de/bodensee-licht", "/de/kuechenplaner"]) {
      const n = globalNotice(l, p);
      assert.equal(n.href, APPOINTMENT_HREF[l], `${p}/${l}`);
      assert.equal(n.hrefLang, l);
    }
  }
  assert.equal(globalNotice("de", "/de/yacht-interior"), null);
});

test("Die Zwillinge sind genau die Seiten, die FR/IT weiter auf /de leiten und auf Englisch existieren", () => {
  const { FR_IT_ONLY_EXACT } = require(path.join(ROOT, "src/lib/seo/deOnlyRedirects.cjs"));
  for (const page of FR_IT_ONLY_EXACT) assert.ok(EN_TWINS[`/de/${page}`], `${page}: EN-Zwilling fehlt`);
  for (const p of Object.values(EN_TWINS)) {
    const seg = p.split("/")[2];
    assert.ok(fs.existsSync(path.join(ROOT, `src/app/[locale]/${seg}/page.js`)), `${p}: Seite existiert`);
  }
});

test("GermanOnlyNotice: Skript und JSX wählen die Zwillings-Fassung je Pfad, hreflang aus dem Hinweis", () => {
  const c = read("src/components/I18n/GermanOnlyNotice.js");
  assert.match(c, /const TWIN_MARKUP = Object\.fromEntries\(Object\.keys\(EN_TWINS\)/);
  assert.match(c, /var tw=\$\{JSON\.stringify\(TWIN_MARKUP\)/);
  assert.match(c, /const n = globalNotice\(l, pathname\);/);
  assert.match(c, /hrefLang=\{n\.hrefLang\}/);
  assert.match(c, /hreflang="\$\{esc\(n\.hrefLang\)\}"/);
});
