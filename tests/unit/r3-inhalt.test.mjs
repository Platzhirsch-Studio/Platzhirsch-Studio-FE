// tests/unit/r3-inhalt.test.mjs — R3-inhalt: news filter, fallback removal,
// career sharing without react-share, form texts (Lead-Restliste P3-3/P3-4).
// Run from the repo root: node --test tests/unit/r3-inhalt.test.mjs
// No network, no backoffice: the news records below are local fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  defuseHouseVoice,
  isIndexableNews,
  newsSitemapEntries,
  presentNews,
  sanitizeNewsText,
} from "../../src/lib/news/newsCopy.js";
import { isWithheldNews, publicNews } from "../../src/lib/news/withheldNews.js";
import { findClaims } from "../../src/lib/legal/claims.js";
import { createTranslator } from "next-intl";
import { FORM_LOCALES } from "../../src/lib/forms/i18n.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));
const LOCALES = ["de", "en", "fr", "it"];
// R5-i18n: proposalR3.js, FORM_TEXT and FORM_TEXT_R3 are gone; the proposals
// are merged and every check below runs against src/messages/*.json.
const MESSAGES = Object.fromEntries(LOCALES.map((l) => [l, json(`src/messages/${l}.json`)]));
const formsT = (l) => createTranslator({ locale: l, messages: MESSAGES[l], namespace: "forms" });

function leaves(obj, prefix = "") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { [prefix]: obj };
  return Object.entries(obj).reduce((acc, [k, v]) => Object.assign(acc, leaves(v, prefix ? `${prefix}.${k}` : k)), {});
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(m?js|jsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const VOICE = /(?<![\p{L}])(exklusiv|luxus|luxuriös|einzigartig|größte|exclusive|luxury|luxurious|esclusiv|lusso|lussuos|luxueu)\p{L}*/giu;

// --- (2) Fallback removal --------------------------------------------------

test("fallback removal: every key of the Runde-1/2 fallback is in all four message files", () => {
  // messages-inhaltsseiten.json is the source fallback.js was generated from.
  const source = json("Marktresearch/digital/redesign/messages-inhaltsseiten.json");
  let checked = 0;
  for (const l of LOCALES) {
    const messages = json(`src/messages/${l}.json`);
    for (const ns of ["inhalt", "error404"]) {
      const want = leaves(source[l][ns] ?? source.de[ns]);
      const have = leaves(messages[ns]);
      for (const key of Object.keys(want)) {
        assert.ok(key in have, `${l}: ${ns}.${key} missing in src/messages/${l}.json`);
        const value = have[key];
        assert.ok(Array.isArray(value) ? value.length > 0 : String(value ?? "").trim() !== "", `${l}: ${ns}.${key} empty`);
        checked++;
      }
    }
  }
  assert.ok(checked > 4 * 140, `checked ${checked} keys`);
});

test("fallback removal: fallback.js and the NotFound FALLBACK are gone", () => {
  assert.equal(fs.existsSync(path.join(ROOT, "src/components/UberUns/inhalt/fallback.js")), false);
  const offenders = walk(path.join(ROOT, "src")).filter((f) => /inhalt\/fallback/.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(offenders, []);
  assert.doesNotMatch(read("src/components/NotFound/NotFoundContent.js"), /const FALLBACK/);
});

// --- new texts: proposal merged, messages are the only source -----------------

test("messages-r3-inhalt.json: same keys in 4 languages, merged into src/messages, no claims", () => {
  const proposal = json("Marktresearch/digital/teamleiter/messages-r3-inhalt.json");
  const deKeys = Object.keys(leaves(proposal.de)).sort();
  for (const l of LOCALES) {
    assert.deepEqual(Object.keys(leaves(proposal[l])).sort(), deKeys, `keys ${l}`);
    const have = leaves({ inhalt: MESSAGES[l].inhalt, forms: MESSAGES[l].forms });
    for (const key of Object.keys(leaves({ inhalt: proposal[l].inhalt, forms: proposal[l].forms }))) {
      assert.ok(key in have, `${l}: ${key} merged into src/messages`);
      for (const value of [have[key]].flat()) {
        assert.ok(String(value ?? "").trim(), `${l}.${key} empty`);
        assert.equal(findClaims(String(value), { locale: l }).length, 0, `${l}.${key}: ${value}`);
        assert.doesNotMatch(String(value), VOICE, `${l}.${key}`);
        assert.ok(!String(value).includes("!"), `${l}.${key}: no exclamation mark`);
      }
    }
  }
  // The module copies are gone (one source).
  assert.equal(fs.existsSync(path.join(ROOT, "src/components/UberUns/inhalt/proposalR3.js")), false);
  assert.doesNotMatch(read("src/components/UberUns/inhalt/useInhalt.js"), /proposal|PROPOSAL_R3/i);
});

test("forms.*: Runde-2 and R3 keys resolve from the messages in 4 languages", () => {
  const r2 = json("Marktresearch/digital/teamleiter/messages-r2-leads.json");
  for (const l of FORM_LOCALES) {
    for (const k of Object.keys(leaves(r2[l].forms))) assert.equal(typeof formsT(l).raw(k), "string", `${l}: forms.${k}`);
    assert.ok(formsT(l)("backToList").trim(), `${l}: backToList`);
    assert.ok(formsT(l)("productPrefix", { product: "Minotti Hamilton" }).endsWith("Minotti Hamilton"));
  }
  assert.equal(formsT("de")("productPrefix", { product: "X" }), "Anfrage zu: X");
  assert.equal(formsT("en")("productPrefix", { product: "X" }), "Enquiry about: X");
  assert.doesNotMatch(formsT("fr")("productPrefix", { product: "X" }), /Anfrage/);
  assert.doesNotMatch(formsT("it")("productPrefix", { product: "X" }), /Anfrage/);
});

// --- (4) Lead-Restliste -----------------------------------------------------

test("Lead-Restliste: one term (Merkliste) and no German prefix in EN/FR/IT", () => {
  const product = read("src/components/AnfrageFormProduct/AnfrageFormProduct.js");
  assert.doesNotMatch(product, /backToWishlist/);
  assert.match(product, /text\("backToList"\)/);
  assert.match(MESSAGES.de.forms.backToList, /Merkliste/);
  assert.doesNotMatch(JSON.stringify(MESSAGES.de.forms), /Wunschliste/);
  const beratung = read("src/components/BeratungClient/BeratungClient.js");
  assert.doesNotMatch(beratung, /`Anfrage zu:/);
  assert.match(beratung, /text\("productPrefix"/);
  // Form contract untouched: honeypot and timing field still sent.
  for (const file of ["src/components/BeratungClient/BeratungClient.js", "src/components/AnfrageFormProduct/AnfrageFormProduct.js"]) {
    assert.match(read(file), /useFormGuard|guard\(/, file);
  }
});

// --- (3) Karriere ---------------------------------------------------------------

test("career: no react-share import, no simulated application form", () => {
  const offenders = walk(path.join(ROOT, "src")).filter((f) => /from\s+["']react-share["']|require\(["']react-share["']\)/.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(offenders.map((f) => path.relative(ROOT, f)), []);
  assert.equal(fs.existsSync(path.join(ROOT, "src/app/[locale]/ueber-uns/karriere/[slug]/jobdetailsclient.js")), false);
  const detail = read("src/components/Karriere/JobDetail.js");
  assert.doesNotMatch(detail, /setTimeout|Simulate|<form/);
  assert.match(detail, /mailto:\$\{APPLICATION_EMAIL\}/);
  const share = read("src/components/Karriere/ShareJob.js");
  assert.match(share, /navigator\.share/);
  assert.match(share, /navigator\.clipboard/);
  assert.match(share, /useSyncExternalStore\(noop, canNativeShare, \(\) => false\)/, "no hydration mismatch");
  assert.match(share, /role="status"/);
});

// Depends on R5-release (sole owner of package.json, "ungenutzte Pakete
// entfernen"). Until that uninstall lands this runs as TODO, so it is reported
// but does not turn the suite red; afterwards it is a hard contract again.
const reactShareInstalled = json("package.json").dependencies?.["react-share"] !== undefined;
test(
  "career: react-share uninstalled (R5-release)",
  { todo: reactShareInstalled ? "waiting for R5-release to uninstall react-share" : false },
  () => {
    assert.equal(json("package.json").dependencies?.["react-share"], undefined, "react-share uninstalled");
  },
);

// --- (1) News ------------------------------------------------------------------

const DISCOUNT = {
  name: "N-0001",
  status: "Aktiv",
  daten: "2025-01-14",
  name1: "PLATZHIRSCH – Lagerabverkauf Küchen, Betten und Sofas",
  beschreibung: "Bis zu 60 % reduziert. Statt € 47.520,- um € 27.000,-",
};
const RENAMED_DISCOUNT = { ...DISCOUNT, name1: "Großer Verkauf im Studio", beschreibung: "Jetzt bis zu 40 % Rabatt auf Sofas." };
const LUXURY = {
  name: "N-0002",
  status: "Aktiv",
  daten: "2024-05-02",
  modified: "2024-06-01 10:00:00",
  name1: "MINOTTI – Exklusives Möbeldesign für Draußen",
  name_en: "MINOTTI – Exclusive outdoor furniture design",
  beschreibung:
    "Genießen Sie den Luxus des MINOTTI-Designs auch im Freien. Mit der exklusiven Kollektion an Outdoor-Möbeln.\n\nLuxuriös, wetterfest und stilvoll – die einzigartige Auswahl.",
  beschreibung_en: "Exclusive outdoor furniture by Solpuri: an exclusive selection of luxurious pieces, unique in style.",
  beschreibung_fr: "Une collection exclusive de meubles luxueux, le luxe à la française. Sur la photo : Minotti.",
  beschreibung_it: "Vi presentiamo gli esclusivi mobili da giardino: il lusso di pezzi lussuosi, unici.",
  metadata_description_de: "Luxuriöser Schlafkomfort: exklusive Betten.",
  keywords_de: "exklusive Möbel, Luxus",
  artikel_table: [{ artikel_name: "Exclusive Chair", unternehmen: "Minotti", beschreibung: "Dieses exklusive Duo vereint Stil." }],
};
const INACTIVE = { ...LUXURY, name: "N-0003", status: "Inaktiv", name1: "Alter Beitrag" };
const PLAIN = { name: "N-0004", status: "Aktiv", daten: "2023-03-01", name1: "Flos – Leuchten", beschreibung: "Leuchten von Flos im Studio." };

test("news: discount promotions are withheld (slug, title pattern and safety net)", () => {
  assert.equal(isWithheldNews(DISCOUNT), true);
  assert.equal(isWithheldNews(RENAMED_DISCOUNT), true, "bezifferter Rabatt im Text");
  assert.equal(isWithheldNews(LUXURY), false);
  assert.deepEqual(publicNews([DISCOUNT, RENAMED_DISCOUNT, LUXURY, INACTIVE, PLAIN]).map((n) => n.name), ["N-0002", "N-0004"]);
});

test("news: sitemap entries = indexable articles only (no withheld, no inactive, no duplicates)", () => {
  const entries = newsSitemapEntries([DISCOUNT, LUXURY, INACTIVE, PLAIN, { ...PLAIN }, null, { status: "Aktiv" }]);
  assert.deepEqual(
    entries.map((e) => e.path),
    ["/news/minotti-exklusives-moebeldesign-fuer-draussen", "/news/flos-leuchten"]
  );
  assert.equal(entries[0].lastModified.toISOString().slice(0, 10), "2024-06-01");
  assert.equal(entries[1].lastModified.toISOString().slice(0, 10), "2023-03-01");
  assert.equal(isIndexableNews(DISCOUNT), false);
  assert.equal(isIndexableNews(INACTIVE), false);
});

test("news: presentNews defuses advertising words in every language, slug from the raw title", () => {
  const shown = presentNews(LUXURY);
  assert.equal(shown.slug, "minotti-exklusives-moebeldesign-fuer-draussen", "URL unchanged");
  assert.equal(shown.withheld, false);
  assert.equal(shown.name1, "MINOTTI – Möbeldesign für Draußen");
  assert.equal(shown.name_en, "MINOTTI – Outdoor furniture design");
  assert.equal(
    shown.beschreibung,
    "Genießen Sie den Stil des MINOTTI-Designs auch im Freien. Mit der Kollektion an Outdoor-Möbeln.\n\nHochwertig, wetterfest und stilvoll – die besondere Auswahl."
  );
  assert.equal(shown.beschreibung_en, "Outdoor furniture by Solpuri: a selection of high-quality pieces, distinctive in style.");
  assert.equal(shown.beschreibung_fr, "Une collection de meubles de qualité, le raffinement à la française. Sur la photo : Minotti.");
  assert.equal(shown.beschreibung_it, "Vi presentiamo i mobili da giardino: il comfort di pezzi raffinati, speciali.");
  assert.equal(shown.metadata_description_de, "Hochwertiger Schlafkomfort: Betten.");
  assert.equal(shown.artikel_table[0].beschreibung, "Dieses Duo vereint Stil.");
  // Product and brand names stay as the manufacturer writes them; record id and keywords untouched.
  assert.equal(shown.artikel_table[0].artikel_name, "Exclusive Chair");
  assert.equal(shown.name, "N-0002");
  assert.equal(shown.keywords_de, LUXURY.keywords_de);
  // The input record is not modified (backoffice data stays as it is).
  assert.match(LUXURY.beschreibung, /Luxus/);
  for (const key of ["name1", "name_en", "beschreibung", "beschreibung_en", "beschreibung_fr", "beschreibung_it", "metadata_description_de"]) {
    assert.doesNotMatch(shown[key], VOICE, key);
  }
});

test("news: withheld items are flagged, not rewritten; plain text stays byte-identical", () => {
  const withheld = presentNews(DISCOUNT);
  assert.equal(withheld.withheld, true);
  assert.equal(withheld.beschreibung, DISCOUNT.beschreibung);
  const plain = presentNews(PLAIN);
  assert.equal(plain.beschreibung, PLAIN.beschreibung);
  // French spacing and paragraphs survive a text without findings.
  const fr = "Une lumière qui vous accompagne : voici In Vitro.\n\nPhotos : Flos.";
  assert.equal(sanitizeNewsText(fr, "fr"), fr);
  assert.equal(presentNews(null), null);
});

test("news: house-voice rules keep grammar (capitals, articles, punctuation)", () => {
  assert.equal(defuseHouseVoice("Exklusive Designmöbel von Minotti.", "de"), "Designmöbel von Minotti.");
  assert.equal(defuseHouseVoice("die Essenz von Luxus und Luxusmöbel-Design", "de"), "die Essenz von Stil und Möbel-Design");
  assert.equal(defuseHouseVoice("An exclusive selection.", "en"), "A selection.");
  assert.equal(defuseHouseVoice("an exclusive offer", "en"), "an offer");
  assert.equal(defuseHouseVoice("gli esclusivi arredi outdoor", "it"), "gli arredi outdoor");
  assert.equal(defuseHouseVoice("Diese Stücke sind exklusiv.", "de"), "Diese Stücke sind.");
  assert.equal(defuseHouseVoice("Ohne Fund bleibt alles  so.", "de"), "Ohne Fund bleibt alles  so.");
});

test("news pages use the shared module (list, detail, more news)", () => {
  assert.match(read("src/components/News/news.js"), /listed\.map\(presentNews\)/);
  const detail = read("src/app/[locale]/news/[title]/page.js");
  assert.match(detail, /const news = presentNews\(found\)/g);
  assert.equal((detail.match(/presentNews\(found\)/g) || []).length, 2, "metadata and page");
  assert.match(detail, /robots: withheld \? \{ index: false, follow: true \}/);
  assert.match(detail, /isIndexableNews\(item\)/);
});
