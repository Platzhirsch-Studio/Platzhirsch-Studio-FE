// tests/unit/nav-katalog.test.mjs — Herstellerkatalog im Hauptmenü
// (Inhaber 31.10.2026): Küchengeräte → Produktliste, eigener Punkt „Bad“,
// Whirlpools & Swimspas unter „Outdoor & Pool“, Marken gruppiert nach Welt.
// NAV_KATALOG (src/components/Navbar/shellNav.js) ist eine schlanke Kopie –
// hier wird sie mit dem Katalog abgeglichen, damit kein Menülink ins Leere führt.
// Run: node --test tests/unit/nav-katalog.test.mjs
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

const { buildRooms, navFeatures, NAV_KATALOG } = await import("../../src/components/Navbar/shellNav.js");
const { desktopRooms, megaPanelHtml } = await import("../../src/components/Navbar/megaPanelHtml.js");
const katalog = await import("../../src/lib/katalog/index.js");
const katalogNav = await import("../../src/components/Navbar/navMatch.js");
const messages = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
const c = (k) => k;
const PROD = { raw: {}, nodeEnv: "production", ezarri: true, showroom: false };
const links = (room) => room.columns.flatMap((col) => col.links);

test("NAV_KATALOG: nur Kategorien mit Produkten, Labels in allen vier Sprachen", () => {
  const vorhanden = new Set(katalog.kategorienMitProdukten("bad-wellness"));
  for (const gruppe of ["bath", "wellness", "spa"]) {
    for (const [key, label] of NAV_KATALOG[gruppe]) {
      assert.ok(vorhanden.has(key), `${gruppe}: ${key} hat Produkte`);
      for (const l of LOCALES) assert.ok(messages[l].Shell.nav[label.replace("nav.", "")], `${l}: Shell.${label}`);
    }
  }
});

test("NAV_KATALOG: Marken wie im Katalog (Slug, Name, Reihenfolge)", () => {
  for (const [welt, rows] of Object.entries(NAV_KATALOG.marken)) {
    const imKatalog = katalog.markenMitProdukten(welt);
    const reihenfolge = imKatalog.map((m) => m.slug).filter((s) => rows.some(([slug]) => slug === s));
    assert.deepEqual(rows.map(([slug]) => slug), reihenfolge, `${welt}: Reihenfolge`);
    for (const [slug, name] of rows) assert.equal(imKatalog.find((m) => m.slug === slug)?.name, name, `${welt}/${slug}`);
  }
  // Accessoires: alle Katalogmarken außer Flos und Tom Dixon (die stehen mit Markenseite bei „Wohnen“).
  assert.deepEqual(
    katalog.markenMitProdukten("accessoires").map((m) => m.slug).filter((s) => !["flos", "tom-dixon"].includes(s)),
    NAV_KATALOG.marken.accessoires.map(([s]) => s)
  );
  assert.equal(NAV_KATALOG.marken.kuechengeraete.length, katalog.markenMitProdukten("kuechengeraete").length);
  assert.equal(NAV_KATALOG.marken["bad-wellness"].length, katalog.markenMitProdukten("bad-wellness").length);
});

test("Küche: „Küchengeräte“ führt zur Produktliste, die redaktionelle Seite bleibt erreichbar", () => {
  for (const locale of LOCALES) {
    const kitchen = buildRooms({ locale, groups: [], c, features: navFeatures(PROD) }).find((r) => r.id === "kitchen");
    if (!kitchen) continue;
    assert.ok(links(kitchen).some((l) => l.label === "nav.kitchenAppliances" && l.href === "/kuechengeraete/produkte"), locale);
    assert.ok(kitchen.extra.some((l) => l.href === "/kuechengeraete"), locale);
  }
});

test("Bad: nach Küche, Spalten Bad · Wellness · Planung, Beratung mit thema=bad", () => {
  const groups = [
    { title: "Sofas", items: [{ key: "sofas-couches", label: "Sofas" }] },
    { title: "Küche", items: [{ key: "kitchen", label: "Küchen" }] },
    { title: "Betten", items: [{ key: "beds", label: "Betten" }] },
    { title: "Garten", items: [{ key: "garden-tables", label: "Gartentische" }] },
  ];
  for (const locale of LOCALES) {
    const rooms = buildRooms({ locale, groups, c, features: navFeatures(PROD) });
    assert.deepEqual(rooms.map((r) => r.id), ["living", "kitchen", "bath", "sleeping", "outdoor", "shop", "brands", "services", "house"], locale);
    const bath = rooms.find((r) => r.id === "bath");
    assert.deepEqual(bath.columns.map((col) => col.title), ["nav.bathGroup", "nav.wellnessGroup", "nav.planning"]);
    assert.equal(bath.all.href, "/bad-wellness/produkte");
    assert.ok(links(bath).some((l) => l.href.endsWith("?thema=bad")), `${locale}: Beratung mit thema=bad`);
    assert.ok(links(bath).every((l) => !l.href.includes("whirlpool")), "Whirlpools nicht unter Bad");
  }
});

test("Outdoor & Pool: eigene Gruppe Whirlpools & Swimspas, Pool ohne Bad & Wellness", () => {
  const rooms = buildRooms({ locale: "de", groups: [], c, features: navFeatures(PROD) });
  const outdoor = rooms.find((r) => r.id === "outdoor");
  const spa = outdoor.columns.find((col) => col.title === "nav.spaGroup");
  assert.deepEqual(spa.links.map((l) => l.href), ["/bad-wellness/kategorie/whirlpool", "/bad-wellness/kategorie/swimspa", "/bad-wellness/kategorie/cold-plunge"]);
  const pool = outdoor.columns.find((col) => col.title === "nav.poolGroup");
  assert.ok(!pool.links.some((l) => l.href === "/bad-wellness"));
  // Aktiver Raum: Whirlpool-Seite → Outdoor, übrige Bad-&-Wellness-Seiten → Bad.
  const slim = desktopRooms(rooms);
  const { findActiveRoom } = katalogNav;
  assert.equal(findActiveRoom(slim, "/bad-wellness/kategorie/whirlpool"), "outdoor");
  assert.equal(findActiveRoom(slim, "/bad-wellness"), "bath");
  assert.equal(findActiveRoom(slim, "/bad-wellness/kategorie/sauna"), "bath");
  assert.equal(findActiveRoom(slim, "/bad-wellness/produkte/starpool-classic-sauna"), "bath");
  assert.equal(findActiveRoom(slim, "/kuechengeraete/kategorie/backofen"), "kitchen");
});

test("Marken: vier Gruppen, kompakt, Katalog-Markenseiten", () => {
  for (const locale of LOCALES) {
    const brands = buildRooms({ locale, groups: [], c, features: navFeatures(PROD) }).find((r) => r.id === "brands");
    assert.deepEqual(brands.columns.map((col) => col.title), ["nav.living", "nav.brandsKitchen", "nav.badWellness", "nav.brandsAccessories"], locale);
    assert.equal(brands.compact, true);
    const all = links(brands);
    for (const href of ["/kuechengeraete/marke/gaggenau", "/kuechengeraete/marke/dornbracht", "/bad-wellness/marke/dornbracht", "/bad-wellness/marke/naggura", "/accessoires/marke/lyngby-porcelaen"]) {
      assert.ok(all.some((l) => l.href === href), `${locale}: ${href}`);
    }
    assert.ok(brands.columns[1].links.some((l) => l.label === "next125"), "next125 bei Küche & Geräte");
    assert.ok(Math.max(...brands.columns.map((col) => col.links.length)) <= 12, "keine Spalte über 12 Zeilen");
    const html = megaPanelHtml(desktopRooms([brands])[0], locale);
    assert.match(html, /min-h-9/);
  }
});

test("Menüdaten bleiben schlank (RSC-Payload)", () => {
  const de = desktopRooms(buildRooms({ locale: "de", groups: [], c, features: navFeatures(PROD) }));
  assert.ok(JSON.stringify(de).length < 12_000, `${JSON.stringify(de).length} B`);
  // Der Katalog (Markendateien) gelangt nicht in die Shell.
  assert.doesNotMatch(read("src/components/Navbar/shellNav.js"), /from "@\/lib\/katalog/);
  assert.doesNotMatch(read("src/components/Navbar/navbar.js"), /from "@\/lib\/katalog/);
});
