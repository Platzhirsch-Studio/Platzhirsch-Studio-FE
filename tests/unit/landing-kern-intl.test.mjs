// tests/unit/landing-kern-intl.test.mjs – Gruppe „landing-kern“ in EN/FR/IT
// (Outdoor, Küchen, Interior Design, Wohnzimmer, Leistungen; 01.11.2026).
// Struktur gleich in allen Sprachen und passend zur deutschen Fassung,
// Claim-Guard, Typografie, Title/Description-Längen, Outdoor-Rechtsbegriffe,
// Linkziele ohne eigene Sprachfassung gekennzeichnet, hreflang nur auf
// vorhandene Fassungen.
// Run: node --test tests/unit/landing-kern-intl.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  INTL_LOCALES,
  KERN_PATHS,
  kernContent,
  kernIntl,
  kernLanguages,
  kernMeta,
  kernMetadata,
  kernOgCard,
  leistungenCopy,
  localizePath,
  mergeText,
} from "../../src/lib/content/landingKern/index.js";
import { LANG_NOTE, localeLink, pageLocales } from "../../src/lib/content/landingKern/links.js";
import { SHARED_INTL } from "../../src/lib/content/landingKern/shared.js";
import { FEATURES as FEATURE_TEXTS, GROUPS, HUB } from "../../src/lib/content/landingKern/leistungen.js";
import { FEATURES, FEATURE_GROUPS } from "../../src/lib/features.js";
import { PROCESS_STEPS, PLANER } from "../../src/components/Landing/copy.js";
import { findClaims, hasCountryPromise, hasUnprovenClaim } from "../../src/lib/legal/claims.js";

const LANDINGS = KERN_PATHS.filter((p) => p !== "/leistungen");
const SLUG_DIR = (p) => new URL(`../../src/app/[locale]${p}/page.js`, import.meta.url);

function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, shape(value[k])]));
  return typeof value;
}
const count = (src, re) => (src.match(re) || []).length;

test("fünf Seiten, drei neue Sprachen, Slugs unverändert", () => {
  assert.deepEqual([...KERN_PATHS].sort(), ["/interior-design-vorarlberg", "/kuechen-vorarlberg", "/leistungen", "/outdoor-gartenplanung", "/wohnzimmer-einrichten-vorarlberg"]);
  assert.deepEqual([...INTL_LOCALES], ["en", "fr", "it"]);
  for (const p of LANDINGS) for (const l of INTL_LOCALES) assert.ok(kernIntl(p, l), `${p} ${l}`);
  assert.equal(kernIntl("/kuechen-vorarlberg", "de"), null);
  assert.equal(kernIntl("/kuechen-vorarlberg", "es"), null);
});

test("EN, FR und IT haben dieselbe Struktur", () => {
  for (const p of LANDINGS) {
    const en = shape(kernIntl(p, "en"));
    for (const l of ["fr", "it"]) assert.deepEqual(shape(kernIntl(p, l)), en, `${p} ${l}`);
    const meta = shape(kernMeta(p, "en"));
    for (const l of ["fr", "it"]) assert.deepEqual(shape(kernMeta(p, l)), meta, `${p} meta ${l}`);
  }
  assert.deepEqual(shape(HUB.en), shape(HUB.de));
  for (const l of INTL_LOCALES) {
    assert.deepEqual(shape(HUB[l]), shape(HUB.de), `hub ${l}`);
    assert.deepEqual(Object.keys(GROUPS[l]).sort(), FEATURE_GROUPS.map((g) => g.id).sort(), `groups ${l}`);
    assert.deepEqual(Object.keys(FEATURE_TEXTS[l]).sort(), FEATURES.map((f) => f.id).sort(), `features ${l}`);
    assert.deepEqual(shape(SHARED_INTL[l]), shape(SHARED_INTL.en), `shared ${l}`);
    assert.equal(SHARED_INTL[l].steps.length, PROCESS_STEPS.length);
    assert.equal(SHARED_INTL[l].planer.points.length, PLANER.points.length);
  }
});

test("Listen passen zur deutschen Fassung in page.js (FAQ, Schritte, Galerie, Querverweise)", () => {
  const src = (p) => fs.readFileSync(SLUG_DIR(p), "utf8");
  for (const p of LANDINGS) {
    const de = src(p);
    const en = kernIntl(p, "en");
    assert.equal(en.faq.items.length, count(de, /^\s*(?:\{ )?q: "/gm), `${p} FAQ`);
    assert.equal(en.gallery.length, count(de.slice(de.indexOf("gallery: [")).split("],")[0], /\{ src: "/g), `${p} gallery`);
    if (en.steps?.links) assert.equal(en.steps.links.length, count(de.slice(de.indexOf("links: [")).split("],")[0], /href: /g), `${p} links`);
  }
  const outdoor = kernIntl("/outdoor-gartenplanung", "en");
  assert.equal(outdoor.services.items.length, 7);
  assert.equal(outdoor.season.items.length, 5);
  assert.equal(outdoor.roles.columns.length, 3);
  assert.equal(outdoor.bridgeLinks.length, 4);
});

test("mergeText: Texte ersetzt, Bilder/Slugs/Icons bleiben", () => {
  const Icon = { $$typeof: Symbol.for("react.forward_ref"), render() {} };
  const de = { a: "Hallo", img: "/x.jpg", items: [{ icon: Icon, title: "T", slug: "s" }], links: [{ href: "/arbeitsweise", label: "So" }] };
  const out = mergeText(de, { a: "Hello", items: [{ title: "Title" }], links: [{ label: "How" }] });
  assert.deepEqual(out, { a: "Hello", img: "/x.jpg", items: [{ icon: Icon, title: "Title", slug: "s" }], links: [{ href: "/arbeitsweise", label: "How" }] });
  const c = kernContent("/kuechen-vorarlberg", "en", { banner: { title: "X", image: "/i.jpg" }, steps: { links: [{ href: "/kuechenplaner", label: "K" }] }, brands: { cta: { href: "/produkte/kitchen", label: "B" } } });
  assert.equal(c.locale, "en");
  assert.equal(c.banner.image, "/i.jpg");
  assert.equal(c.brands.cta.href, "/products/kitchen");
});

test("FR: geschützte Leerzeichen vor : ; ? ! und in « », IT ohne Leerzeichen vor ?", () => {
  const fr = [...LANDINGS.flatMap((p) => strings(kernIntl(p, "fr"))), ...strings(leistungenCopy("fr").advice), ...strings(SHARED_INTL.fr)];
  for (const t of fr) {
    assert.doesNotMatch(t, / [:;?!»]/, `normales Leerzeichen vor Satzzeichen: ${t}`);
    assert.doesNotMatch(t, /« /, t);
  }
  assert.match(kernIntl("/kuechen-vorarlberg", "fr").faq.items[0].q, / ?$/);
  for (const p of LANDINGS) for (const t of strings(kernIntl(p, "it"))) assert.doesNotMatch(t, / [?!:;]/, `IT: ${t}`);
});

test("SEO: Titel mit Suffix ≤ 60, Description 120–149 (wird nicht gekürzt), eigene Canonical", () => {
  for (const p of KERN_PATHS) {
    for (const l of INTL_LOCALES) {
      const meta = kernMeta(p, l);
      const md = kernMetadata({ path: p, locale: l });
      assert.ok(md.title.length <= 60, `${p} ${l} title ${md.title.length}`);
      assert.ok(meta.title.length <= 60, `${p} ${l} title`);
      assert.ok(meta.description.length >= 120 && meta.description.length < 150, `${p} ${l} description ${meta.description.length}`);
      assert.equal(md.description, meta.description.replace(/[  ]/g, " "), `${p} ${l} description gekürzt`);
      assert.equal(md.alternates.canonical, `https://platzhirsch.studio/${l}${p}`);
      assert.equal(md.openGraph.locale, { en: "en_GB", fr: "fr_FR", it: "it_IT" }[l]);
    }
  }
  for (const p of LANDINGS) for (const l of INTL_LOCALES) assert.ok(kernOgCard(p, l)?.title, `${p} ${l} og`);
  assert.equal(kernMetadata({ path: "/outdoor-gartenplanung", locale: "en", index: false }).robots.index, false);
});

test("hreflang nur auf vorhandene Fassungen (Quelle: deOnlyRedirects), reziprok sobald frei", () => {
  for (const p of KERN_PATHS) {
    const langs = kernLanguages(p);
    const have = pageLocales(p);
    for (const code of Object.keys(langs)) if (code !== "x-default") assert.ok(have.includes(code.slice(0, 2)), `${p}: ${code}`);
    assert.equal(langs["x-default"], `https://platzhirsch.studio/de${p}`);
    if (have.length === 4) for (const l of ["de", "en", "fr", "it"]) assert.equal(langs[l], `https://platzhirsch.studio/${l}${p}`);
  }
  // noindex: kein hreflang (Runde 5 P6)
  assert.equal(kernMetadata({ path: "/outdoor-gartenplanung", locale: "fr", index: false }).alternates.languages, undefined);
});

test("Linkziele ohne eigene Sprachfassung: Präfix und Hinweis im Text", () => {
  // Sprach-Integration 01.11.2026 (bewusst geändert): Küchenplaner und Ezarri-Welt sind
  // viersprachig → Link in der Seitensprache. Nur-Deutsch-Ziele (Bodensee-Licht, Ratgeber)
  // und Ezarri Custom Mix (DE/EN) behalten Präfix und Hinweis.
  assert.deepEqual(localeLink({ href: "/kuechenplaner", label: "Kitchen planner" }, "en"), { href: "/kuechenplaner", label: "Kitchen planner" });
  assert.deepEqual(localeLink({ href: "/ezarri/pool", label: "Piscine" }, "fr"), { href: "/ezarri/pool", label: "Piscine" });
  assert.deepEqual(localeLink({ href: "/bodensee-licht", label: "Light" }, "en"), { href: "/de/bodensee-licht", label: "Light (in German)", lang: "de" });
  assert.deepEqual(localeLink({ href: "/ezarri/custom-mix", label: "Mélange" }, "fr"), { href: "/en/ezarri/custom-mix", label: "Mélange (en anglais)", lang: "en" });
  assert.deepEqual(localeLink({ href: "/arbeitsweise", label: "Metodo" }, "it"), { href: "/arbeitsweise", label: "Metodo" });
  assert.equal(localizePath("/produkte/sofas-couches", "it"), "/prodotti/sofas-couches");
  assert.equal(localizePath("/beratung?thema=kueche", "fr"), "/conseil?thema=kueche");
  for (const l of INTL_LOCALES) {
    const c = leistungenCopy(l, { sofaName: "S" });
    const kp = c.feature(FEATURES.find((f) => f.id === "kuechenplaner"));
    assert.equal(kp.href, "/kuechenplaner");
    assert.ok(!kp.title.endsWith(LANG_NOTE[l].de), kp.title);
    const ratgeber = c.advice.find((a) => a.href.includes("ratgeber"));
    assert.equal(ratgeber.href, "/de/ratgeber");
  }
});

test("keine Superlative, Händler-Claims, Preise oder Länderversprechen (Claim-Guard)", () => {
  const banned = [/€|EUR\b|CHF|\bFranken\b/, /\b(best|leading|unique|luxury|meilleure?s?|leader|luxe|migliore|lusso|esclusiv[oa]|exclusi(f|ve)s?)\b/i, /(official|authori[sz]ed) (dealer|retailer)|revendeur (officiel|agréé)|rivenditore (ufficiale|autorizzato)/i];
  for (const l of INTL_LOCALES) {
    const texts = [...KERN_PATHS.flatMap((p) => strings(kernIntl(p, l) || {})), ...strings(kernMeta("/leistungen", l)), ...strings(HUB[l]), ...strings(FEATURE_TEXTS[l]), ...strings(GROUPS[l]), ...strings(SHARED_INTL[l])];
    const claims = texts.flatMap((t) => findClaims(t, { locale: l }));
    assert.deepEqual(claims, [], `${l}: ${JSON.stringify(claims)}`);
    for (const t of texts) {
      for (const re of banned) assert.doesNotMatch(t, re, `${l}: ${t}`);
      assert.equal(hasUnprovenClaim(t), false, `${l}: ${t}`);
      assert.equal(hasCountryPromise(t), false, `${l}: ${t}`);
    }
  }
});

test("Outdoor: Bauleitung nie als eigene Leistung, befugte Betriebe, Behördenwege ausgeschlossen", () => {
  const words = {
    en: { mgmt: /site management/i, licensed: /licensed/i, notUs: /^Not ourselves/, authorities: /we do not handle dealings with the authorities/ },
    fr: { mgmt: /direction (et surveillance )?des travaux/i, licensed: /habilité/i, notUs: /^Pas nous-mêmes/, authorities: /nous ne nous chargeons pas des démarches administratives/ },
    it: { mgmt: /direzione (e sorveglianza )?dei lavori/i, licensed: /abilitat/i, notUs: /^No, non noi\./, authorities: /le pratiche presso le autorità non le seguiamo noi/ },
  };
  for (const l of INTL_LOCALES) {
    const c = kernIntl("/outdoor-gartenplanung", l);
    const w = words[l];
    // „Bauleitung“ steht nur bei Baumeister/befugten Betrieben – nie in der Platzhirsch-Spalte.
    for (const item of c.roles.columns[0].items) assert.doesNotMatch(item, w.mgmt, `${l}: ${item}`);
    assert.match(c.roles.columns[2].items[0], w.mgmt);
    assert.match(c.roles.columns[2].title, /Baumeister/);
    assert.match(c.faq.items[0].a, w.notUs);
    assert.match(c.faq.items[0].a, /Baumeister/);
    assert.match(c.faq.items[3].a, /§ 19 Vorarlberger Baugesetz/);
    assert.match(c.faq.items[3].a, /§ 24 GNL/);
    assert.match(c.faq.items[3].a, w.authorities);
    assert.match(c.roles.columns[2].items[3], /BauKG/);
    assert.ok(strings(c).filter((t) => w.licensed.test(t)).length >= 5, `${l}: befugt`);
    assert.doesNotMatch(strings(c).join(" "), /general contractor|entreprise générale|general contractor|impresa generale|garden designer|paysagiste concepteur|architetto paesaggista/i);
  }
});

test("Leistungen: KI gekennzeichnet, Steuerhinweis wörtlich, Preise nur auf Anfrage", () => {
  const ai = { en: /You are chatting with an AI/, fr: /Vous écrivez avec une IA/, it: /State scrivendo con un’IA/ };
  const tax = { en: /not tax advice/, fr: /pas de conseil fiscal/, it: /non è una consulenza fiscale/ };
  for (const l of INTL_LOCALES) {
    assert.match(FEATURE_TEXTS[l].concierge.note, ai[l]);
    assert.match(FEATURE_TEXTS[l].dreilaender.note, tax[l]);
    assert.doesNotMatch(FEATURE_TEXTS[l].sofaplaner.summary, /Minotti/, "Sofaplaner-Text ohne Marke (consent.js)");
  }
});

// Lektorat (01.11.2026): Begriffe und Anrede wie im Rest der Website,
// keine deutschen Satzstellungen („Helpful are …“), kein geschützt
// klingender Berufstitel („architecture d’intérieur“ → „design d’intérieur“,
// wie src/messages/fr.json „aménagement intérieur“), Outdoor ohne
// „aus einer Hand“-Versprechen („from one team“), IT ohne „Non direttamente“
// (klänge nach indirekter Bauleitung).
test("Lektorat: Terminologie, Anrede und keine Lehnsatzstellungen", () => {
  const all = (l) => [...LANDINGS.map((p) => strings(kernIntl(p, l)).join(" ")), strings(kernMeta("/interior-design-vorarlberg", l)).join(" "), strings(HUB[l]).join(" ")].join(" ");
  const en = all("en");
  const fr = all("fr");
  const it = all("it");
  assert.doesNotMatch(en, /\bHelpful are\b|also outside Vorarlberg on enquiry|, we (work out|clarify|discuss) (together )?(in|individually)/);
  assert.doesNotMatch(en, /Outdoor concept from one team/);
  assert.doesNotMatch(fr, /architecture d’intérieur/i);
  assert.doesNotMatch(fr, /Vous êtes le bienvenu\b|Utiles\s*:/);
  assert.doesNotMatch(it, /Non direttamente|un’unica fonte/);
  assert.doesNotMatch(it, /\b(tuo|tua|tuoi|tue)\b/);
});
