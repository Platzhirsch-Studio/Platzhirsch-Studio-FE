// tests/unit/minotti-bodensee.test.mjs
// „Minotti am Bodensee“ (Markenseite) und „Dieses Modell im Sofaplaner planen“
// (Minotti-Sofa-Produkt- und Kollektionsseiten): src/lib/marken/minottiBodensee.js,
// src/lib/crossSell.js.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  isMinotti,
  matchSofaFamily,
  minottiBodensee,
  minottiTerminHref,
  sofaplanerFamilyFor,
  sofaplanerModelPath,
} from "../../src/lib/marken/minottiBodensee.js";
import { productPlanLinks } from "../../src/lib/crossSell.js";
import { dealerStatement, findClaims, hasCountryPromise, hasUnprovenClaim } from "../../src/lib/legal/claims.js";
import { ADDRESS } from "../../src/lib/site.js";
import { SOURCE_COPY } from "../../src/lib/sofaplaner/consent.js";

// Familien wie im Sofaplaner-Katalog (Ausschnitt aus src/lib/sofaplaner/minotti).
const FAMILIES = new Set(["lido", "freeman", "freeman-tailor", "yves", "yves-sofa", "lawrence", "lawrence-clan", "white", "andersen-slim-90", "connery"]);
const has = (s) => FAMILIES.has(s);

test("matchSofaFamily: längstes Präfix an Wortgrenzen, nur bekannte Familien", () => {
  assert.equal(matchSofaFamily("Lido", has), "lido");
  assert.equal(matchSofaFamily("Lido Sofas", has), "lido");
  assert.equal(matchSofaFamily("Freeman Tailor", has), "freeman-tailor");
  assert.equal(matchSofaFamily("Freeman", has), "freeman");
  assert.equal(matchSofaFamily("Yves Sofa", has), "yves-sofa");
  assert.equal(matchSofaFamily("Lawrence Clan", has), "lawrence-clan");
  assert.equal(matchSofaFamily('White "Saddle-Hide"', has), "white");
  assert.equal(matchSofaFamily("Andersen Slim 90", has), "andersen-slim-90");
  assert.equal(matchSofaFamily("Minotti Connery", has), "connery");
  assert.equal(matchSofaFamily("Side Tables", has), null);
  assert.equal(matchSofaFamily("Jensen", has), null);
  assert.equal(matchSofaFamily("", has), null);
  assert.equal(matchSofaFamily("Lido", undefined), null);
});

test("sofaplanerFamilyFor: nur Minotti, nur Deutsch, Produkte nur in der Sofa-Kategorie", () => {
  const base = { locale: "de", brand: "Minotti", name: "Lido", hasFamily: has };
  assert.equal(sofaplanerFamilyFor({ ...base, categoryKey: "sofas-couches" }), "lido");
  assert.equal(sofaplanerFamilyFor({ ...base, categoryKey: "armchairs-stools" }), null);
  assert.equal(sofaplanerFamilyFor({ ...base, categoryKey: null }), null);
  // Kollektionsseite: keine Kategorie-Prüfung
  assert.equal(sofaplanerFamilyFor(base), "lido");
  assert.equal(sofaplanerFamilyFor({ ...base, locale: "en" }), null);
  assert.equal(sofaplanerFamilyFor({ ...base, brand: "Poliform" }), null);
  assert.equal(sofaplanerFamilyFor({ ...base, name: "Unbekannt" }), null);
  assert.ok(isMinotti("minotti") && isMinotti("Minotti") && !isMinotti("Minotti Italia"));
});

test("sofaplanerModelPath: ?m=<slug>, ungültige Slugs fallen auf den Planer zurück", () => {
  assert.equal(sofaplanerModelPath("freeman-tailor"), "/sofaplaner?m=freeman-tailor");
  assert.equal(sofaplanerModelPath("../x"), "/sofaplaner");
  assert.equal(sofaplanerModelPath(null), "/sofaplaner");
});

test("productPlanLinks: Modell-Link nur mit geprüfter Familie in der Sofa-Kategorie", () => {
  const p = { locale: "de", categoryKey: "sofas-couches", brand: "Minotti", name: "Lido" };
  const plain = productPlanLinks(p).find((l) => l.id === "sofaplaner");
  assert.equal(plain.href, "/sofaplaner");
  assert.equal(plain.label, SOURCE_COPY.crossLabel);
  const model = productPlanLinks({ ...p, sofaFamily: "lido" }).find((l) => l.id === "sofaplaner");
  assert.equal(model.href, "/sofaplaner?m=lido");
  assert.equal(model.label, "Dieses Modell im Sofaplaner planen");
  // Sessel: allgemeiner Link, auch wenn eine Familie übergeben wird
  const chair = productPlanLinks({ ...p, categoryKey: "armchairs-stools", sofaFamily: "lido" }).find((l) => l.id === "sofaplaner");
  assert.equal(chair.href, "/sofaplaner");
  // ungültiger Slug → allgemeiner Link
  assert.equal(productPlanLinks({ ...p, sofaFamily: "a b" }).find((l) => l.id === "sofaplaner").href, "/sofaplaner");
  assert.deepEqual(productPlanLinks({ ...p, locale: "en", sofaFamily: "lido" }), []);
});

test("minottiTerminHref: /de/termin mit Thema bei aktivem Kalender, sonst /de/beratung", () => {
  assert.equal(minottiTerminHref(true), "/de/termin?thema=sofa&produkt=Minotti");
  assert.equal(minottiTerminHref(false), "/de/beratung?thema=sofa&produkt=Minotti");
});

test("minottiBodensee: nur Minotti auf Deutsch", () => {
  assert.equal(minottiBodensee({ slug: "minotti", locale: "en" }), null);
  assert.equal(minottiBodensee({ slug: "poliform", locale: "de" }), null);
  assert.ok(minottiBodensee({ slug: "minotti", locale: "de" }));
});

test("minottiBodensee: Studio-Satz aus dem Claim-Guard, Adresse aus site.js, Links, eine FAQ", () => {
  const s = minottiBodensee({ slug: "minotti", locale: "de", calendar: true });
  assert.equal(s.title, "Minotti am Bodensee");
  assert.equal(s.paragraphs[0], dealerStatement("minotti", "de"));
  assert.ok(s.address.lines[0].includes(`${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}`));
  const hrefs = Object.fromEntries(s.links.map((l) => [l.id, l.href]));
  assert.deepEqual(hrefs, {
    sofaplaner: "/de/sofaplaner",
    termin: "/de/termin?thema=sofa&produkt=Minotti",
    "ratgeber-preis": "/de/ratgeber/was-kostet-ein-minotti-sofa",
    "ratgeber-schweiz": "/de/ratgeber/moebel-aus-oesterreich-in-die-schweiz",
    yacht: "/de/yacht-interior",
  });
  assert.match(s.links.find((l) => l.id === "yacht").label, /^Minotti auch an Bord/);
  assert.equal(s.faq.length, 1);
  assert.equal(s.faq[0].q, "Wo kann ich Minotti am Bodensee probesitzen?");
  assert.ok(s.faq[0].a.includes(ADDRESS.street) && /Termin/.test(s.faq[0].a));
  // Ausgeschaltete Features werden nicht verlinkt
  const off = minottiBodensee({ slug: "minotti", locale: "de", on: (id) => id !== "yacht" && id !== "sofaplaner" });
  assert.deepEqual(off.links.map((l) => l.id), ["termin", "ratgeber-preis", "ratgeber-schweiz"]);
});

test("minottiBodensee: keine Superlative, kein Händlerwort, keine Fahrzeiten, keine Ausstellungs-Aussage", () => {
  const s = minottiBodensee({ slug: "minotti", locale: "de" });
  const text = [s.title, ...s.paragraphs, ...s.address.lines, ...s.links.map((l) => l.label), ...s.faq.flatMap((f) => [f.q, f.a])].join("\n");
  assert.deepEqual(findClaims(text, { locale: "de", brandSlug: "minotti" }), []);
  assert.equal(hasUnprovenClaim(text), false);
  assert.equal(hasCountryPromise(text), false);
  assert.doesNotMatch(text, /händler/i);
  assert.doesNotMatch(text, /Minuten|\bmin\b|km\b|m²|€|EUR/);
  assert.doesNotMatch(text, /ausgestellt|steht .* in der Ausstellung|vorrätig|lagernd/i);
  assert.doesNotMatch(text, /\bdu\b|\bdein/i);
  // Schweiz-Hub (Entwurf, noindex) wird nicht verlinkt
  assert.ok(!s.links.some((l) => l.href.includes("einkaufen-aus-der-schweiz")));
});

test("Einbau: Markenseite, Produktseite und Kollektionsseite nutzen die Helfer", () => {
  const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
  const brand = read("src/components/MarkenItems/markenitems.js");
  assert.match(brand, /minottiBodensee\(\{ slug: brandSlug, locale/);
  assert.match(brand, /faqPageSchema\(pageUrl, locale, faqItems\)/);
  assert.match(read("src/app/[locale]/produkte/[category]/[product]/page.js"), /sofaFamily,/);
  assert.match(read("src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js"), /sofaplanerFamilySlug\(/);
  const server = read("src/lib/marken/sofaplanerFamily.server.js");
  assert.match(server, /import "server-only"/);
  assert.match(server, /getFamily\(slug\)/);
});
