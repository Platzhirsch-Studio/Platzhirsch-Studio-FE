// tests/unit/shop-kopfleiste.test.mjs — Shop-Kopfleiste auf allen /accessoires-Seiten (Layout,
// ShopSubHeader, ShopNavCurrent): Suche ohne JavaScript, genau EIN Warenkorb-Symbol
// (CartLink in der Hauptkopfzeile, nur bei shopActive()), Insel ohne Text-Tabellen und Katalog.
// Run: node --test tests/unit/shop-kopfleiste.test.mjs
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

test("Layout: Kopfleiste über allen Shop-Seiten (Accessoires und Warenkorb/Kasse)", () => {
  for (const p of ["src/app/[locale]/accessoires/layout.js", "src/app/[locale]/shop/layout.js"]) assert.match(read(p), /<ShopSubHeader/, p);
});

test("Kopfleiste: GET-Suche mit Label, Abteilungen, kein zweites Warenkorb-Symbol", () => {
  const sub = read("src/components/ShopStart/ShopSubHeader.js");
  assert.match(sub, /role="search"/);
  assert.match(sub, /method="get"/);
  assert.ok(sub.includes("action={`/${locale}${SHOP_SUCHE_PATH}`}"));
  assert.ok(sub.includes("<label htmlFor={sucheId}"));
  assert.match(sub, /name="q"/);
  assert.doesNotMatch(sub, /<\w*CartLink\b|import \w*CartLink|SHOP_WARENKORB_PATH/, "Warenkorb nur in der Hauptkopfzeile");
  const nav = read("src/components/Navbar/navbar.js");
  assert.ok(nav.includes("const shop = shopActive();") && nav.includes("{shop && <CartLink"), "CartLink nur bei shopActive()");
  assert.ok(sub.includes("abteilungen()"));
  assert.match(sub, /min-h-11/, "Zielgröße ≥ 44 px");
  assert.equal(start.SHOP_SUCHE_PATH, "/accessoires/suche");
  assert.equal(start.SHOP_WARENKORB_PATH, "/shop/warenkorb");
  assert.ok(fs.existsSync(path.join(ROOT, "src/app/[locale]/shop/warenkorb/page.js")), "Warenkorb-Seite existiert");
});

test("Insel: \"use client\", ohne Text-Tabelle/Katalog", () => {
  const src = read("src/components/ShopStart/ShopNavCurrent.js");
  assert.match(src, /^"use client";/);
  assert.ok(!["startCopy", "shopStart", "lib/katalog"].some((s) => src.includes(s)));
  assert.ok(!fs.existsSync(path.join(ROOT, "src/components/ShopStart/ShopCartLink.js")), "kein zweiter Warenkorb-Link");
  assert.doesNotMatch(read("src/components/ShopStart/ShopSubHeader.js"), /^"use client"/);
});
