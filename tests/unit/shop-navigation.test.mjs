// tests/unit/shop-navigation.test.mjs — Menüpunkt „Shop“ (shellNav.js buildRooms): klar als Shop,
// Abteilungen = Katalog, Suche/Café, aktiv auf /accessoires/*, voller Name
// „Accessoires · Shop“ im Panel und Mobilmenü, schlanke Menüdaten.
// Run: node --test tests/unit/shop-navigation.test.mjs
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

const katalog = await import("../../src/lib/katalog/index.js");
const start = await import("../../src/lib/shop/shopStart.js");
const { startCopy } = await import("../../src/lib/shop/startCopy.js");
const { buildRooms, navFeatures, NAV_SHOP, NAV_KATALOG } = await import("../../src/components/Navbar/shellNav.js");
const { desktopRooms, megaPanelHtml } = await import("../../src/components/Navbar/megaPanelHtml.js");
const { findActiveRoom } = await import("../../src/components/Navbar/navMatch.js");

const pfade = new Set(katalog.katalogPfade().map((e) => e.path));
const c = (k) => k;
const PROD = { raw: {}, nodeEnv: "production", ezarri: true, showroom: false };

test("Menü: NAV_SHOP = Katalog (Abteilungen, Ziele)", () => {
  assert.deepEqual(NAV_SHOP.map((r) => [...r]), start.navShopTabelle());
  for (const [, href] of NAV_SHOP) assert.ok(pfade.has(href), href);
});

test("Menü: Punkt „Shop“ vor „Marken“, Kategorien, Suche, Café, aktiv auf /accessoires/*", () => {
  for (const locale of LOCALES) {
    const rooms = buildRooms({ locale, groups: [], c, features: navFeatures(PROD) });
    const ids = rooms.map((r) => r.id);
    assert.equal(ids.indexOf("shop"), ids.indexOf("brands") - 1, `${locale}: ${ids}`);
    const shop = rooms.find((r) => r.id === "shop");
    assert.equal(shop.label, "Shop");
    assert.equal(shop.title, startCopy(locale).navTitle);
    assert.equal(shop.all.href, "/accessoires");
    const links = shop.columns.flatMap((col) => col.links);
    assert.ok(links.some((l) => l.href === "/accessoires/suche"));
    assert.ok(links.some((l) => l.external && l.href === "https://platzhirsch.cafe/"));
    for (const l of links.filter((x) => !x.external)) assert.ok(pfade.has(l.href) || l.href === "/accessoires/suche", l.href);
    assert.equal(links.filter((l) => l.href.includes("/marke/")).length, NAV_KATALOG.marken.accessoires.length);
    for (const p of ["/accessoires", "/accessoires/produkte", "/accessoires/kategorie/glas/seite/2", "/accessoires/marke/riedel", "/accessoires/suche"]) {
      assert.equal(findActiveRoom(rooms, p), "shop", `${locale}: ${p}`);
    }
    assert.equal(findActiveRoom(rooms, "/kuechengeraete/marke/miele"), "brands");
  }
});

test("Menü: voller Name im Panel/Mobilmenü, schlanke Menüdaten", () => {
  const slim = desktopRooms(buildRooms({ locale: "de", groups: [], c, features: navFeatures(PROD) }));
  const shop = slim.find((r) => r.id === "shop");
  assert.equal(shop.title, "Accessoires · Shop");
  assert.match(megaPanelHtml(shop, "de"), /Accessoires · Shop/);
  assert.ok(JSON.stringify(slim).length < 12_000, `${JSON.stringify(slim).length} B`);
  assert.match(read("src/components/Navbar/MobileMenu.js"), /room\.title \|\| room\.label/);
  assert.doesNotMatch(read("src/components/Navbar/shellNav.js"), /from "@\/lib\/katalog/);
});
