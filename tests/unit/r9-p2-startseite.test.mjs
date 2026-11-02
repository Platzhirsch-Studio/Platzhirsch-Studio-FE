// R5-fix P2 – Startseite, Arbeitsweise (mehrsprachig), Team, Räume, HTML-Größe.
//   node --test tests/unit/r9-p2-startseite.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as AW from "../../src/lib/arbeitsweise/copy.js";
import { INTL } from "../../src/lib/arbeitsweise/copy-intl.js";
import { arbeitsweiseSchema, pageUrl } from "../../src/lib/arbeitsweise/schema.js";
import { MEDIA } from "../../src/lib/arbeitsweise/media.js";
import { codaTarget, codaLabel } from "../../src/lib/wow/messages.js";
import { SERVICES, serviceHref } from "../../src/components/Home/homeLinks.js";
import { portraitCols, haraldNote } from "../../src/components/Team/teamCopy.js";
import { mapSprite, MAP_SPRITE } from "../../src/components/Home/dreilaenderGeo.js";
import { pictoSprite, PICTO_SPRITE } from "../../src/components/Home/pictoPaths.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const require = createRequire(import.meta.url);
const LOCALES = ["de", "en", "fr", "it"];

/** Shape of an object: keys and array lengths, not the text. */
const shape = (v) =>
  Array.isArray(v) ? v.map(shape) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k])])) : typeof v;

test("Arbeitsweise: EN/FR/IT vollständig, gleiche Struktur wie DE", () => {
  const de = AW.arbeitsweiseCopy("de");
  for (const l of ["en", "fr", "it"]) {
    const c = AW.arbeitsweiseCopy(l);
    for (const k of ["META", "HERO", "HALTUNG", "UEBERSICHT", "VOR_ORT", "VON_HAND", "STRICH_ZUM_RAUM", "WIRKLICHKEIT", "HARALD", "KETTE", "ONLINE", "FAQ", "ABSCHLUSS", "UI", "HANDWERK_LABELS"]) {
      // FAQ links carry locale "de" abroad (German target) – compared without it
      const strip = (v) => JSON.parse(JSON.stringify(v, (key, val) => (key === "locale" ? undefined : val)));
      assert.deepEqual(shape(strip(c[k])), shape(strip(de[k])), `${l}.${k}`);
    }
    assert.equal(c.STEPS.length, 7);
    assert.deepEqual(c.STEPS.map((s) => s.id), de.STEPS.map((s) => s.id));
    // no German left in the visible texts (spot check of every section's title)
    for (const k of ["HERO", "HALTUNG", "UEBERSICHT", "VOR_ORT", "VON_HAND", "STRICH_ZUM_RAUM", "WIRKLICHKEIT", "ONLINE", "FAQ", "ABSCHLUSS"]) {
      assert.notEqual(c[k].title, de[k].title, `${l}.${k}.title übersetzt`);
    }
    // FAQ links: the label is in the answer, the target is German (marked)
    for (const item of c.FAQ.items) for (const link of item.links || []) {
      assert.ok(item.a.includes(link.label), `${l}: ${link.label}`);
      assert.equal(link.locale, "de");
    }
  }
});

test("Arbeitsweise: keine neuen Aussagen (keine Dauer, kein kostenlos, keine Rolle, keine Preise, kein !)", () => {
  for (const l of ["en", "fr", "it"]) {
    const text = JSON.stringify(INTL[l]);
    assert.doesNotMatch(text, /\b60\b|minutes|minuti|free of charge|gratuit|gratuito|€|CHF|!/i, l);
    assert.doesNotMatch(text, /draughtsman|dessinateur|disegnatore|Designer &/i, `${l}: keine Rolle für Harald`);
    assert.doesNotMatch(text, /\b(best|unique|meilleur|migliore|unico|exclusive|exclusif|esclusiv)/i, l);
    assert.equal(AW.arbeitsweiseCopy(l).HARALD.role, null);
  }
});

test("Arbeitsweise: Brotkrume je Sprache, Ziele in der Besuchersprache", () => {
  const home = { de: "Startseite", en: "Home", fr: "Accueil", it: "Home" };
  const consult = { de: "/beratung", en: "/consultation", fr: "/conseil", it: "/consulenza" };
  for (const l of LOCALES) {
    const c = AW.arbeitsweiseCopy(l);
    assert.equal(c.CRUMBS[0].label, home[l], l);
    assert.equal(c.CRUMBS[0].href, "/");
    assert.equal(c.APPOINTMENT.href, consult[l], l);
  }
  assert.doesNotMatch(read("src/lib/arbeitsweise/copy.js"), /label: "Home"/);
});

test("Arbeitsweise: Seite in allen Sprachen, eigene Canonical, hreflang + x-default, kein 308, kein Sprachhinweis", () => {
  const page = read("src/app/[locale]/arbeitsweise/page.js");
  assert.doesNotMatch(page, /locale !== "de"/);
  assert.doesNotMatch(page, /<LangNotice/);
  assert.match(page, /canonical: url, languages: hreflangLanguages\(pageUrl\)/);
  assert.match(page, /robots: robotsForLaunch\(\)/);
  for (const l of LOCALES) assert.equal(pageUrl(l), `https://platzhirsch.studio/${l}/arbeitsweise`);
  const { DE_ONLY_EXACT, DE_ONLY_TREE, deOnlyRedirects } = require("../../src/lib/seo/deOnlyRedirects.cjs");
  assert.ok(!DE_ONLY_EXACT.includes("arbeitsweise") && !DE_ONLY_TREE.includes("arbeitsweise"));
  for (const r of deOnlyRedirects()) assert.ok(!/\barbeitsweise\b/.test(r.source), r.source);
  const ld = arbeitsweiseSchema(MEDIA, "fr")["@graph"];
  assert.equal(ld[0].url, "https://platzhirsch.studio/fr/arbeitsweise");
  assert.equal(ld[0].inLanguage, "fr-FR");
  assert.equal(ld[1].itemListElement[0].name, "Accueil");
  assert.equal(ld[2].mainEntity[0].name, AW.arbeitsweiseCopy("fr").FAQ.items[0].q);
});

test("Arbeitsweise-Auftakt: Papierblatt statt Liniengrafik, keine Bildzeile, Kontrast der Stationen", () => {
  const page = read("src/components/Arbeitsweise/ArbeitsweisePage.js");
  assert.doesNotMatch(page, /<LineStudy|import LineStudy/);
  assert.match(page, /data-hero-sheet/);
  for (const l of LOCALES) assert.ok(AW.arbeitsweiseCopy(l).HERO.sheet.line, l);
  const css = read("src/components/Arbeitsweise/arbeitsweise.module.css");
  assert.doesNotMatch(css, /awRise/, "keine Deckkraft-Animation an den Stationen (technik P1-7)");
  const station = css.slice(css.indexOf(':root:not([data-motion="reduced"]) .station'));
  assert.match(station.slice(0, 400), /animation: awLift/);
});

test("Startseite: Coda und Arbeitsweise-Link in der Besuchersprache, ohne „(in tedesco)“", () => {
  for (const l of LOCALES) {
    assert.deepEqual(codaTarget(l), { href: "/arbeitsweise", locale: l, germanOnly: false });
    assert.doesNotMatch(codaLabel(l), /German|allemand|tedesco|Deutsch\)/);
  }
  const proc = read("src/components/Home/Process.js");
  assert.doesNotMatch(proc, /t("process.linkGerman")|locale="de"/);
  assert.match(proc, /<LinkArrow href="\/arbeitsweise" locale=\{locale\}>/);
});

test("Startseite: Karten verlinken Canonical-URLs, ?thema= nur für die Beratung", () => {
  for (const l of LOCALES) {
    for (const s of SERVICES) {
      const { href } = serviceHref(s, l);
      const consult = /^\/(beratung|consultation|conseil|consulenza)\b/.test(href);
      if (consult) assert.match(href, /\?thema=/, `${l} ${s.key}`);
      else assert.doesNotMatch(href, /[?#]/, `${l} ${s.key}: ${href}`);
    }
  }
});

test("Räume: eine Linie (kein Versatz), feste Seitenverhältnisse, Herkunft je Bild dokumentiert", () => {
  const rooms = read("src/components/Home/Rooms.js");
  assert.doesNotMatch(rooms, /xl:mt-16/);
  assert.match(rooms, /ratio="4\/5"/);
  for (const img of [...rooms.matchAll(/image: "([^"]+)"/g)].map((m) => m[1])) {
    assert.ok(fs.existsSync(path.join(ROOT, "public", img)), img);
    assert.ok(rooms.split(img).length - 1 >= 2, `${img}: Herkunft im Kommentar`);
  }
});

test("Team: Raster ohne leere Spalte, Harald mit USP-Satz ohne Rolle", () => {
  assert.equal(portraitCols(1), 2);
  assert.equal(portraitCols(2), 2);
  assert.equal(portraitCols(3), 3);
  assert.equal(portraitCols(4), 4);
  for (const l of LOCALES) assert.match(haraldNote(l), /Hand|hand|main|mano/);
  const tm = read("src/components/Team/teammember.js");
  assert.match(tm, /cols=\{portraitCols\(withPhoto\.length\)\}/);
  assert.doesNotMatch(tm, /locale="de" hrefLang/);
});

test("HTML-Größe: Karten- und Piktogramm-Pfade als statische Sprites, aktuell", () => {
  assert.equal(read(`public${MAP_SPRITE}`), mapSprite(), "dreilaender-map.svg neu erzeugen (Befehl in dreilaenderGeo.js)");
  assert.equal(read(`public${PICTO_SPRITE}`), pictoSprite(), "pictos.svg neu erzeugen (Befehl in pictoPaths.js)");
  assert.doesNotMatch(read("src/components/Home/DreilaenderMap.js"), /d=\{curve\(/);
  assert.doesNotMatch(read("src/components/Home/Pictos.js"), /<path d=\{d\}/);
});
