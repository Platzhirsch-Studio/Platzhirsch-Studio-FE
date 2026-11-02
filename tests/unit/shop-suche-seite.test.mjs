// tests/unit/shop-suche-seite.test.mjs — Suchseite /<locale>/accessoires/suche: noindex, Canonical ohne
// Query, gleiche Kachel wie die Listen, funktioniert ohne JavaScript.
// Run: node --test tests/unit/shop-suche-seite.test.mjs
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

test("Suchseite: noindex/follow, gleiche Kachel, GET-Formular, Paginierung mit rel", () => {
  const src = read("src/app/[locale]/accessoires/suche/page.js");
  assert.match(src, /index: false/);
  assert.match(src, /pathByLocale: SHOP_SUCHE_PATH/, "Canonical ohne Query");
  assert.match(src, /<ShopKachel /, "gleiche Kachel wie die Produktliste");
  assert.match(src, /method="get"/);
  assert.match(src, /rel="prev"/);
  assert.match(src, /rel="next"/);
  assert.ok(src.includes("sucheProdukte(q, { welt: SHOP_WELT, locale, katLabel })"));
  assert.ok(!/backoffice|fetch\(/i.test(src), "kein Backoffice-Abruf");
});
