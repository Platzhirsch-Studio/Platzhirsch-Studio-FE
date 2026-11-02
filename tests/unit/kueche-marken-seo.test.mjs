// tests/unit/kueche-marken-seo.test.mjs
// Kaufwort-Seiten der Gerätemarken (src/lib/kueche/markenSeo.js, eingehängt in
// src/components/Katalog/katalogRoutes.js und KatalogListe.js):
// - alle sechs Händlermarken, vier Sprachen, vollständige Felder, FAQ 3–4 Fragen
// - Titel ≤ 60 nach fitTitle (mit Hausmarke), Description ≤ 150 ungekürzt
// - Händlerwort nur über den Claim-Guard (dealerTitleWord), nicht in den Texten
// - keine Preise, keine Showroom-Aussage, keine Superlative
// - Modellnamen nur, wenn sie im Herstellerkatalog stehen
// - Schweiz: kein Link auf /einkaufen-aus-der-schweiz (Entwurf, noindex)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const { MARKEN_SEO, MARKEN_SEO_SLUGS, MARKEN_SEO_LOCALES, MODELLE, CH_RATGEBER_PATH, markenSeo, markenSeoTitel, chRatgeberLink } = await import("../../src/lib/kueche/markenSeo.js");
const { dealerTitleWord, isVerifiedDealerBrand, findClaims } = await import("../../src/lib/legal/claims.js");
const { fitTitle, clampDescription, META_TITLE_MAX, META_DESCRIPTION_MAX } = await import("../../src/lib/seo/pageMetadata.js");
const { produkteByMarke, markeBySlug } = await import("../../src/lib/katalog/index.js");
const { GERAETE_MARKEN } = await import("../../src/lib/kueche/geraete.js");

const SUFFIX = " | Platzhirsch";
const FORBIDDEN =
  /händler|haendler|partner|partenaire|offiziell|official|officiel|ufficial|autorisiert|authori[sz]ed|autoris[ée]|autorizzat|dealer|revendeur|rivenditore|concessionari|\bbeste[nrs]?\b|\bbest\b|führend|fuehrend|leading|leader|meilleur|migliore|einzigartig|unique|unico|exklusiv|exclusive|premium/i;
const PRICE = /(?:€|\bEUR\b|\bCHF\b)\s*\d|\d[\d.,']*\s*(?:€|\bEUR\b|\bCHF\b|euro\b|franken\b)|\bab \d|\bfrom \d|à partir de \d|a partire da \d/i;
const SHOWROOM_CLAIM = /showroom|ausstellung|ausgestellt|exposition|esposizion|exhibit|on display|vorführ|in stock|vorrätig|lagernd/i;

function leaves(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") out.push(...leaves(v, p));
    else out.push([p, v]);
  }
  return out;
}

test("genau die sechs Gerätemarken, alle belegt, vier Sprachen, vollständige Felder", () => {
  assert.deepEqual([...MARKEN_SEO_SLUGS].sort(), GERAETE_MARKEN.map((m) => m.id).sort());
  for (const slug of MARKEN_SEO_SLUGS) {
    assert.ok(isVerifiedDealerBrand(slug), slug);
    assert.ok(markeBySlug(slug)?.dealer, `${slug}: dealer-Schalter im Katalog`);
    assert.ok(produkteByMarke(slug, "kuechengeraete").length > 0, `${slug}: Produkte`);
    for (const l of MARKEN_SEO_LOCALES) {
      const e = markenSeo(slug, l);
      assert.ok(e, `${slug}/${l}`);
      for (const k of ["kaufwort", "description", "intro", "planer", "planerLabel", "faqTitle"]) assert.ok(typeof e[k] === "string" && e[k].trim(), `${slug}/${l}.${k}`);
      assert.ok(e.faq.length >= 3 && e.faq.length <= 4, `${slug}/${l}: ${e.faq.length} FAQ`);
      for (const it of e.faq) assert.ok(it.q.trim() && it.a.trim(), `${slug}/${l}: leere FAQ`);
    }
  }
  assert.equal(markenSeo("dornbracht", "de"), null);
  assert.equal(markenSeo("bora", "es"), null);
});

test("Kaufwort vorn: Titel ≤ 60 mit Hausmarke, Description ≤ 150 ungekürzt", () => {
  const KAUF = { de: /kaufen/, en: /^Buy\b/, fr: /^Acheter\b/, it: /^Comprare\b/ };
  for (const slug of MARKEN_SEO_SLUGS) {
    for (const l of MARKEN_SEO_LOCALES) {
      const e = markenSeo(slug, l);
      assert.match(e.kaufwort, KAUF[l], `${slug}/${l}: Kaufwort`);
      assert.ok(e.kaufwort.includes(markeBySlug(slug).name), `${slug}/${l}: Markenname im Kaufwort`);
      const titel = fitTitle(markenSeoTitel(slug, l, dealerTitleWord(slug, l)) + SUFFIX);
      assert.ok(titel.length <= META_TITLE_MAX, `${slug}/${l}: ${titel.length} ${titel}`);
      assert.ok(titel.startsWith(e.kaufwort), `${slug}/${l}: Kaufwort bleibt vorn: ${titel}`);
      assert.ok(titel.includes("Lochau"), `${slug}/${l}: Ort im Titel: ${titel}`);
      assert.ok(e.description.length <= META_DESCRIPTION_MAX, `${slug}/${l}: Description ${e.description.length}`);
      assert.equal(clampDescription(e.description), e.description, `${slug}/${l}: Description ungekürzt`);
      assert.ok(e.description.includes("Lochau"), `${slug}/${l}: Ort in der Description`);
    }
  }
});

test("Händlerwort nur aus dem Claim-Guard: Titel mit Wort, ohne Wort nur Kaufwort", () => {
  for (const slug of MARKEN_SEO_SLUGS) {
    for (const l of MARKEN_SEO_LOCALES) {
      const w = dealerTitleWord(slug, l);
      assert.ok(w, `${slug}/${l}: dealerTitleWord`);
      assert.ok(markenSeoTitel(slug, l, w).includes(` – ${w} `), `${slug}/${l}`);
      assert.equal(markenSeoTitel(slug, l, ""), markenSeo(slug, l).kaufwort);
    }
  }
  assert.equal(markenSeoTitel("dornbracht", "de", "Händler"), "");
});

test("keine Händler-/Superlativ-Wörter, keine Preise, keine Showroom-Aussage in den Texten", () => {
  for (const slug of MARKEN_SEO_SLUGS) {
    for (const l of MARKEN_SEO_LOCALES) {
      for (const [k, v] of leaves(MARKEN_SEO[slug][l])) {
        assert.doesNotMatch(v, FORBIDDEN, `${slug}/${l}.${k}: ${v}`);
        assert.doesNotMatch(v, PRICE, `${slug}/${l}.${k}: ${v}`);
        assert.doesNotMatch(v, SHOWROOM_CLAIM, `${slug}/${l}.${k}: ${v}`);
        assert.deepEqual(findClaims(v, { locale: l }), [], `${slug}/${l}.${k}: Claim-Guard`);
      }
      // „Was kostet …?“ wird beantwortet, ohne eine Zahl zu nennen.
      const kosten = markenSeo(slug, l).faq[0];
      assert.match(kosten.q, /kostet|cost|coûte|costa/i, `${slug}/${l}`);
      // Baureihen wie PRO3 oder V4000 sind erlaubt, freistehende Zahlen (Beträge) nicht.
      assert.doesNotMatch(kosten.a, /\b\d{2,}\b/, `${slug}/${l}: Zahl in der Preisantwort: ${kosten.a}`);
      assert.match(kosten.a, /Termin|appointment|rendez-vous|appuntamento/, `${slug}/${l}: Angebot im Termin`);
    }
  }
});

test("Modellnamen aus den Texten stehen im Herstellerkatalog", () => {
  for (const slug of MARKEN_SEO_SLUGS) {
    const namen = new Set(produkteByMarke(slug).map((p) => p.name));
    for (const modell of MODELLE[slug]) assert.ok(namen.has(modell), `${slug}: „${modell}“ nicht im Katalog`);
  }
  // Stichproben: die im Text genannten Bezeichnungen sind in MODELLE erfasst.
  assert.ok(MODELLE.bora.includes("BORA X Pure"));
  assert.ok(MODELLE.quooker.includes("CUBE") && MODELLE.quooker.includes("PRO3"));
  assert.ok(MODELLE.liebherr.includes("ECBNe BioFresh NoFrost"));
});

test("Schweiz-Hinweis nur bei V-ZUG, Ratgeber nur Deutsch, kein Link auf den Schweiz-Entwurf", () => {
  const de = chRatgeberLink("v-zug", "de");
  assert.ok(de && de.href === CH_RATGEBER_PATH && de.label && de.text);
  assert.ok(fs.existsSync(path.join(ROOT, "src/app/[locale]/ratgeber/[slug]/page.js")));
  for (const l of ["en", "fr", "it"]) assert.equal(chRatgeberLink("v-zug", l), null, l);
  for (const slug of MARKEN_SEO_SLUGS.filter((s) => s !== "v-zug")) assert.equal(chRatgeberLink(slug, "de"), null, slug);
  assert.ok(!read("src/lib/kueche/markenSeo.js").includes("einkaufen-aus-der-schweiz\""));
  for (const l of MARKEN_SEO_LOCALES) assert.match(markenSeo("v-zug", l).intro, /55/, `${l}: SMS-Raster`);
});

test("Einhängung: Metadaten in katalogRoutes.js, Intro/Planer-Link/FAQ in KatalogListe.js, nur Welt kuechengeraete Seite 1", () => {
  const routes = read("src/components/Katalog/katalogRoutes.js");
  assert.match(routes, /import \{ dealerTitleWord \} from "@\/lib\/legal\/claims"/);
  assert.match(routes, /markenSeoTitel\(r\.m\.slug, r\.locale, r\.m\.dealer \? dealerTitleWord\(r\.m\.slug, r\.locale\) : ""\)/);
  assert.match(routes, /welt === "kuechengeraete" && r\.seite === 1 \? markenSeo\(/);
  const liste = read("src/components/Katalog/KatalogListe.js");
  assert.match(liste, /modus === "marke" && welt === "kuechengeraete" && seite === 1 \? markenSeo\(/);
  assert.match(liste, /data-kat-marke-seo=\{marke\.slug\}/);
  assert.match(liste, /href=\{planerHref\(marke\.slug\)\}/);
  assert.match(liste, /<SeoFaq locale=\{locale\} page=\{`marke-\$\{marke\.slug\}`\}[^>]*items=\{seo\.faq\}/);
  assert.match(liste, /chRatgeberLink\(marke\.slug, locale\)/);
});
