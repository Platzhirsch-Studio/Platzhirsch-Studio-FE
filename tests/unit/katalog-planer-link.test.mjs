// Produktdetail Küchengeräte: „In meine Küchenplanung aufnehmen“ →
// /de/kuechenplaner?geraet=<produkt-slug>, nur für Produkte, die der Planer anbietet.
// Run: node --test tests/unit/katalog-planer-link.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { imPlanerVerfuegbar, planerLinkFuer } from "../../src/components/Katalog/planerLink.js";
import { GERAETE_KATEGORIEN, buildGeraeteIndex, geraetParam } from "../../src/lib/kuechenplaner/geraete.js";
import { produkteByWelt } from "../../src/lib/katalog/index.js";

const read = (rel) => fs.readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");

test("1 Link mit Produkt-Slug, immer auf /de, DE ohne Sprachhinweis", () => {
  const p = { slug: "bora-x-pure-max", welt: "kuechengeraete", kategorie: "kochfeld-mit-abzug" };
  const de = planerLinkFuer(p, "de");
  assert.equal(de.href, "/kuechenplaner?geraet=bora-x-pure-max");
  assert.equal(de.locale, "de");
  assert.equal(de.hrefLang, undefined);
  assert.equal(de.label, "In meine Küchenplanung aufnehmen");
  assert.equal(de.hinweis, "");
  const en = planerLinkFuer(p, "en");
  assert.equal(en.href, "/kuechenplaner?geraet=bora-x-pure-max");
  assert.equal(en.hrefLang, "de");
  assert.equal(en.hinweis, " (in German)");
  assert.doesNotMatch(`${de.label}${en.label}`, /händler|vertragshändler/i);
});

test("2 nur Welt kuechengeraete und Planer-Kategorien", () => {
  assert.equal(planerLinkFuer({ slug: "x", welt: "kuechengeraete", kategorie: "kaffeevollautomat" }, "de"), null);
  assert.equal(planerLinkFuer({ slug: "x", welt: "kuechengeraete", kategorie: "zubehoer" }, "de"), null);
  assert.equal(planerLinkFuer({ slug: "x", welt: "bad-wellness", kategorie: "armatur" }, "de"), null);
  assert.equal(planerLinkFuer({ welt: "kuechengeraete", kategorie: "backofen" }, "de"), null);
  for (const k of GERAETE_KATEGORIEN) assert.ok(imPlanerVerfuegbar({ slug: "x", welt: "kuechengeraete", kategorie: k }), k);
});

test("3 jedes verlinkte Katalogprodukt löst der Planer als Produkt auf", () => {
  const produkte = produkteByWelt("kuechengeraete");
  const index = buildGeraeteIndex(produkte, { heute: "2026-10-31", an: false });
  const mitLink = produkte.filter((p) => planerLinkFuer(p, "de"));
  assert.ok(mitLink.length > 0);
  for (const p of mitLink) {
    const slug = new URL(planerLinkFuer(p, "de").href, "https://x").searchParams.get("geraet");
    assert.equal(slug, p.slug);
    const r = geraetParam(slug, index);
    assert.equal(r?.typ, "produkt", p.slug);
    assert.equal(r.g.s, p.slug);
  }
});

test("4 ProduktDetail rendert den Link mit Slug (data-kat-planer)", () => {
  const src = read("src/components/Katalog/ProduktDetail.js");
  assert.match(src, /import \{ planerLinkFuer \} from "\.\/planerLink"/);
  assert.match(src, /const planer = planerLinkFuer\(p, locale\)/);
  assert.match(src, /\{planer && \(\s*<LinkArrow href=\{planer\.href\} locale=\{planer\.locale\} hrefLang=\{planer\.hrefLang\} data-kat-planer=\{p\.slug\}>/);
});
