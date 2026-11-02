// tests/unit/r7-p2-links.test.mjs – Runde 2, Fix-Team P2 (Startseite & Wow).
// Run: node --test tests/unit/r7-p2-links.test.mjs
// Prüft: Leistungskarten (5, inkl. Hotel/Objekt) sprachrichtig über
// landingTarget mit ?thema=; EN/FR/IT ohne unmarkierte Links auf DE-Seiten
// (Karten, Coda, Werkzeuge); Regionen-Links nur auf indexierte Seiten;
// Runde-2-Texte in allen vier Sprachen; Meta-Title ≤ 65 ohne „Designermöbel …
// von Hand gezeichnet“ (recht P2-5); kein „ganz Österreich“ in homeSeo.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SERVICES, TOOLS_ABROAD, regionLinks, serviceHref } from "../../src/components/Home/homeLinks.js";
import MESSAGES, { codaLabel, codaTarget } from "../../src/lib/wow/messages.js";
import { HOME_SEO } from "../../src/lib/content/homeSeo.js";
import { ROUTES } from "../../src/utils/routing.js";
import { passesDoorwayAudit } from "../../src/lib/seo/sitemap/doorwayAudit.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];
const ABROAD = ["en", "fr", "it"];

// copy.js imports next-intl (server) – read the R7 block as data instead.
function r7Block() {
  const src = read("src/components/Home/copy.js");
  const from = src.indexOf("const R7 = {");
  const body = src.slice(from + "const R7 = ".length, src.indexOf("\n};", from) + 2);
  return Function(`"use strict"; return (${body});`)();
}

test("Leistungen: fünf Karten inkl. Hotel, Gastronomie & Objekt, jede mit ?thema=", () => {
  assert.deepEqual(SERVICES.map((s) => s.key), ["kitchen", "interior", "outdoor", "yacht", "objekt"]);
  const de = Object.fromEntries(SERVICES.map((s) => [s.key, serviceHref(s, "de")]));
  // R5-fix P2 (seo P2, ux P2, bewusst geändert): Inhaltsseiten mit ihrer
  // Canonical-URL, ?thema= nur auf der Beratungsseite.
  assert.equal(de.kitchen.href, "/kuechen-vorarlberg");
  assert.equal(de.yacht.href, "/yacht-interior");
  for (const l of Object.values(de)) if (!l.href.startsWith("/beratung")) assert.doesNotMatch(l.href, /\?/, l.href);
  // Welle 2 (bewusst geändert): die Hotel-Karte führt auf die eigene Seite Hotel & Objekt;
  // Inhaber 01.11.2026 (bewusst geändert): auch FR/IT – die Seite gibt es in allen vier Sprachen.
  assert.equal(de.objekt.href, "/hotel-objekt");
  assert.equal(serviceHref(SERVICES.find((s) => s.key === "objekt"), "en").href, "/hotel-objekt");
  for (const l of ["fr", "it"]) assert.deepEqual(serviceHref(SERVICES.find((s) => s.key === "objekt"), l), { href: "/hotel-objekt", locale: l, germanOnly: false, own: true });
  for (const l of Object.values(de)) assert.equal(l.locale, "de");
  // beratungContext kennt alle Themen (Wizard-Vorbelegung)
  const ctx = read("src/lib/forms/beratungContext.js");
  for (const s of SERVICES) assert.match(ctx, new RegExp(`\\b${s.thema}:`), s.thema);
});

test("EN/FR/IT: Leistungskarten führen auf Seiten derselben Sprache (kein unmarkierter DE-Link)", () => {
  for (const l of ABROAD) {
    for (const s of SERVICES) {
      const link = serviceHref(s, l);
      assert.equal(link.locale, l, `${l} ${s.key}`);
      assert.equal(link.germanOnly, false, `${l} ${s.key}`);
      // Sprach-Integration 01.11.2026 (bewusst geändert): Küchen, Interior, Outdoor,
      // Yacht und Hotel & Objekt gibt es in EN/FR/IT – jede Karte führt auf die Seite selbst.
      assert.equal(link.href, s.path, `${l} ${s.key}: eigene Sprachfassung`);
      assert.equal(link.own, true, `${l} ${s.key}`);
      // consultation targets carry the topic, catalogue targets do not
      if (link.href.startsWith(ROUTES.beratung[l])) assert.match(link.href, /\?thema=/, `${l} ${s.key}`);
    }
  }
});

// R5-fix P2 (gesamtwerk P1-2, bewusst geändert): /arbeitsweise ist mehrsprachig –
// die Coda führt in der Besuchersprache dorthin, ohne „(in German)“.
test("Coda „Unsere Arbeitsweise“: /<locale>/arbeitsweise, ohne Sprachhinweis", () => {
  assert.deepEqual(codaTarget("de"), { href: "/arbeitsweise", locale: "de", germanOnly: false });
  assert.equal(codaLabel("de"), "Unsere Arbeitsweise");
  for (const l of ABROAD) {
    assert.deepEqual(codaTarget(l), { href: "/arbeitsweise", locale: l, germanOnly: false });
    assert.doesNotMatch(codaLabel(l), /German|allemand|tedesco/);
  }
  for (const f of ["src/components/Wow/WowStage.js", "src/components/Wow/WowCoda.js"]) {
    const src = read(f);
    assert.match(src, /codaLabel\(locale\)/, f);
    assert.match(src, /hrefLang=\{coda\.germanOnly \? "de" : undefined\}/, f);
  }
  for (const l of LOCALES) assert.doesNotMatch(MESSAGES[l].coda.link, /Zur Planung|Plan with us/, l);
});

test("Werkzeuge EN/FR/IT: Abschnitt vorhanden, jeder Link deutsch markiert (sichtbar + hreflang)", () => {
  const src = read("src/components/Home/Services.js");
  // Rat 9,5 B11 (Auftrag T2 → T4, bewusst geändert): EN zeigt den Showcase mit
  // englischen Texten; FR/IT behalten den Abschnitt ToolsAbroad (Links deutsch markiert).
  assert.match(src, /const SHOWCASE_HOME = \["de", "en"\];/);
  assert.match(src, /if \(SHOWCASE_HOME\.includes\(locale\)\) return <HomeShowcase/);
  assert.match(src, /<ToolsAbroad locale=\{locale\} \/>/);
  // Sprach-Integration 01.11.2026 (bewusst geändert): Werkzeuge mit eigener Sprachfassung
  // (features.js locales) ohne Hinweis; die übrigen (3D-Ansicht) deutsch markiert.
  assert.match(src, /f\.locales\?\.includes\(locale\)/);
  assert.match(src, /locale: "de", hrefLang: "de"/);
  assert.match(src, /own \? "" : ` \(\$\{c\.german\}\)`/);
  assert.doesNotMatch(src, /<Image|<img|aboutHome/, "kein Foto (Hero-Foto nicht wiederholen)");
  const R7 = r7Block();
  for (const l of LOCALES) for (const id of TOOLS_ABROAD) assert.ok(R7[l].tools.items[id]?.title, `${l} ${id}`);
});

test("Regionen-Links: nur indexierte Seiten, keine noindex-Städte", () => {
  const pages = regionLinks();
  const links = pages.map((p) => p.path);
  for (const p of links) assert.ok(passesDoorwayAudit(p), p);
  // Runde 3 P5 (seo P0-1): the five city pages have own facts now and pass
  // the doorway audit, so they are linked (their teaser comes from
  // LANDING_PAGES); Kempten and Ravensburg still fail and stay out.
  for (const city of ["kempten", "ravensburg"]) assert.ok(!links.includes(`/designermoebel-${city}`), city);
  for (const r of ["bregenz", "dornbirn", "lindau", "friedrichshafen", "st-gallen", "liechtenstein", "rheintal", "arlberg", "konstanz", "feldkirch", "appenzell"]) {
    assert.ok(links.includes(`/designermoebel-${r}`), r);
  }
  const teasers = r7Block().de.regionsTeaser;
  for (const page of pages.filter((x) => x.path.startsWith("/designermoebel-"))) assert.ok(teasers[page.path] || page.teaser, `Teaser ${page.path}`);
  assert.match(read("src/components/Home/DreilaenderService.js"), /regionLinks\(/);
});

test("Runde-2-Texte vollständig in allen vier Sprachen, ohne Superlative/Ausrufezeichen/Preise", () => {
  const R7 = r7Block();
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  const ref = keys({ objekt: R7.de.objekt, tools: R7.de.tools }).sort();
  for (const l of LOCALES) {
    assert.deepEqual(keys({ objekt: R7[l].objekt, tools: R7[l].tools }).sort(), ref, l);
    const flat = JSON.stringify(R7[l]);
    assert.doesNotMatch(flat, /!|€|CHF|\b(beste|einzigartig|best|unique|meilleur|migliore|exklusiv|exclusive)\b/i, l);
  }
  for (const l of ABROAD) for (const k of ["kitchen", "interior", "outdoor", "yacht"]) assert.ok(R7[l].serviceLink[k], `${l} ${k}`);
});

test("Hero: USP im ersten Bildschirm (Desktop-Lead, Handy-Coda), höchstens zwei Ebenen unter dem CTA", () => {
  const hero = read("src/components/Home/Hero.js");
  assert.match(hero, /<WowCoda locale=\{locale\} usp=\{uspPhone\} \/>/);
  assert.match(hero, /const lead = t\("hero\.lead"\)/, "USP-Text von P1 (HomePage.hero.lead)");
  for (const l of LOCALES) {
    const lead = JSON.parse(read(`src/messages/${l}.json`)).HomePage.hero.lead;
    assert.match(lead, /Harald Menghin/, `${l}: hero.lead = Kern-USP`);
  }
  assert.match(hero, /data-hero-usp=""/);
  assert.match(hero, /lead: "px-gutter pt-stack-m max-sm:hidden/);
  const coda = read("src/components/Wow/WowCoda.js");
  assert.doesNotMatch(coda, /codaCredit/, "Bildzeile steht am Bild, nicht unter dem CTA");
  const css = read("src/components/Wow/Pause.module.css");
  assert.match(css, /@media \(min-width: 640px\) and \(max-width: 1023px\) \{[\s\S]*?margin-inline-end: var\(--spacing-gutter/, "iPad-Coda mit Rand");
});

test("Meta-Title ≤ 65, „von Hand gezeichnet“ beim Interior Design; homeSeo ohne „ganz Österreich“", () => {
  const src = read("src/app/[locale]/page.js");
  const block = src.slice(src.indexOf("const FALLBACK_META_BY_LOCALE = {"), src.indexOf("function getFallbackMeta"));
  const meta = Function(`"use strict"; ${block.replace("const FALLBACK_META_BY_LOCALE =", "return")}`)();
  for (const l of LOCALES) {
    // R5-USP (seo P1-4, bewusst geändert): Ort statt Markenzusatz – Lochau und
    // Bodensee in ≤ 60 Zeichen; die Marke steht in og:site_name und der Domain.
    assert.ok(meta[l].title.length <= 65, `${l} ${meta[l].title.length}`);
    assert.match(meta[l].title, /Lochau/);
  }
  // Inhaber 30.10.2026 (bewusst geändert): Firmenname vorn, ≤ 65 Zeichen.
  assert.match(meta.de.title, /^Platzhirsch Home Living – Interior Design/);
  assert.doesNotMatch(meta.de.title, /Designermöbel[^|]*von Hand/);
  const seo = JSON.stringify(HOME_SEO);
  assert.doesNotMatch(seo, /ganz Österreich|all of Austria|toute l'Autriche|tutta l'Austria/);
  for (const l of LOCALES) assert.ok(HOME_SEO[l].faq.length === 5, `${l}: USP-FAQ ergänzt`);
});

test("Desktop-Kapitelabstand gestrafft (lg:py-20), Café-Kapitel ohne leeren Bildrahmen", () => {
  assert.match(read("src/components/Home/row.js"), /SECTION_Y = "py-10 sm:py-section lg:py-20[ "]/);
  const house = read("src/components/Home/HouseCafe.js");
  assert.match(house, /data-home-house-art=""/);
  assert.match(house, /house\.hoursTitle/);
  assert.doesNotMatch(read("src/components/Home/home.module.css"), /\.house \{[^}]*aspect-ratio/);
});
