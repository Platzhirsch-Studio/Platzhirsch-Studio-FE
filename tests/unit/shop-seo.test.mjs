// tests/unit/shop-seo.test.mjs — Accessoires-Shop SEO-Einbindung: Sitemap-Eintrag /accessoires
// (vier Sprachen, Prüfdatum), Suche nicht in der Sitemap, Einblicke-Routen.
// Run: node --test tests/unit/shop-seo.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    let file;
    if (specifier.startsWith("@/")) file = path.join(ROOT, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.includes("/src/") && !path.extname(specifier)) {
      file = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    } else return nextResolve(specifier, context);
    const cand = [file, `${file}.js`, path.join(file, "index.js")].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    return nextResolve(pathToFileURL(cand || `${file}.js`).href, context);
  },
});

const start = await import("../../src/lib/shop/shopStart.js");
const { templateOf } = await import("../../src/lib/einblicke/routes.js");

test("Sitemap: /accessoires in vier Sprachen mit Prüfdatum, Suche nicht", () => {
  const p = start.shopStartSitemapPage();
  assert.equal(p.path, "/accessoires");
  assert.deepEqual(p.locales, LOCALES);
  assert.match(p.lastModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(start.shopStartSitemapPage("gibt-es-nicht"), null);
  const entries = read("src/lib/seo/sitemapEntries.js");
  assert.ok(entries.includes("shopStartSitemapPage()"));
  assert.ok(!entries.includes("accessoires/suche"));
});

test("Einblicke: Startseite und Suche sind bekannte Routen", () => {
  assert.equal(templateOf("/de/accessoires"), "/de/accessoires");
  assert.equal(templateOf("/fr/accessoires/suche"), "/fr/accessoires/suche");
});
