// Ezarri-Welt auf Französisch und Italienisch (Inhaber-Auftrag 01.11.2026).
// Prüft: dieselbe Struktur wie copy.en.js (keine fehlenden Texte), Zahlen wie
// in der englischen/deutschen Fassung (keine erfundenen Fakten), Typografie
// (FR: geschützte Leerzeichen vor : ; ? ! und in « »; IT: « » ohne Leerzeichen),
// keine Preise/Superlative/deutschen Reste, Händler-Aussage nur aus claims.js,
// Title ≤ 60 und Description 120–150, hreflang/Links je Sprache.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as EN from "../../src/lib/ezarri/copy.en.js";
import * as FR from "../../src/lib/ezarri/copy.fr.js";
import * as IT from "../../src/lib/ezarri/copy.it.js";
import { dealerStatement } from "../../src/lib/legal/claims.js";
import { EZARRI_LOCALES, EZARRI_WELT_LOCALES, ezarriCredit, ezarriLocaleEnabled, ezarriUrlFor, ezarriWeltLocaleEnabled } from "../../src/lib/ezarri/config.js";
import { ezLang, ezT, wert, dezimal, herstellerText } from "../../src/lib/ezarri/werte.js";
import { facetsFor, facetLabel } from "../../src/lib/ezarri/facets.js";
import { ezCrumbsFor } from "../../src/lib/ezarri/crumbs.js";
import { ezLinkProps } from "../../src/lib/ezarri/deLinks.js";
import { TOOL_LOCALES } from "../../src/lib/ezarri/konfigurator/intl.js";
import { intro, kollektionDescription, kollektionH1 } from "../../src/lib/ezarri/kollektionSeo.js";
import { mosaikHeading } from "../../src/lib/ezarri/indexierung.js";
import { fitTitle } from "../../src/lib/seo/pageMetadata.js";

const ST = { mosaike: 264, kollektionen: 17, sonderanfertigungen: 4 };
const SAMPLE = [2, 3];

/** Pfade aller Blätter (Strings/Funktionen) eines Objekts. Listen über Index. */
function shape(v, p = "") {
  if (typeof v === "function") return [`${p}()`];
  if (Array.isArray(v)) return v.flatMap((x, i) => shape(x, `${p}[${i}]`));
  if (v && typeof v === "object") return Object.keys(v).flatMap((k) => shape(v[k], p ? `${p}.${k}` : k));
  return [p];
}

/** Alle Texte eines Moduls (Funktionen mit Beispielwerten aufgerufen). */
function strings(mod) {
  const out = [];
  const callArgs = (fn) => {
    const src = String(fn);
    if (/\(\{\s*name/.test(src)) return [{ name: "Dune", code: "2511-A", kollektion: "Gea", facts: "Format 25 mm", fmt: "25 mm", oberflaeche: "mat", wasser: "bleu", others: ["50 mm"] }];
    if (/\(st\)/.test(src)) return [ST];
    return ["Gea", 3];
  };
  const walk = (v, p) => {
    if (typeof v === "function") {
      if (/^(dealerClaim|dealerTitleWord|dealerLine)$/.test(p)) return;
      for (const [i, args] of [callArgs(v), SAMPLE].entries()) {
        try {
          const r = v(...args);
          if (typeof r === "string") out.push([`${p}()#${i}`, r]);
        } catch {
          /* andere Signatur */
        }
      }
      return;
    }
    if (typeof v === "string") return out.push([p, v]);
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${p}[${i}]`));
    if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k);
  };
  for (const [k, v] of Object.entries(mod)) walk(v, k);
  return out;
}

// Felder ohne Fließtext (Pfade, Dateien, Quellen-URLs, ids, Schlüssel).
const TECH = /(href|Href|datei|quelle|galerie|id|einsatz\[\d+\]|sprache|filter|LINKS\.|NAV\.items\[\d+\]\.href|NAV\.muster\.href)$/;
const prose = (mod) => strings(mod).filter(([p, s]) => !TECH.test(p.replace(/\(\)$/, "")) && !/^(\/|https?:)/.test(s));

for (const [lang, mod] of [["fr", FR], ["it", IT]]) {
  test(`copy.${lang}.js: alle Exporte und Schlüssel wie copy.en.js`, () => {
    assert.deepEqual(Object.keys(mod).sort(), Object.keys(EN).sort());
    for (const key of Object.keys(EN)) {
      const missing = shape(EN[key]).filter((p) => !shape(mod[key]).includes(p));
      const extra = shape(mod[key]).filter((p) => !shape(EN[key]).includes(p));
      assert.deepEqual(missing, [], `copy.${lang}.js ${key}: fehlende Schlüssel`);
      assert.deepEqual(extra, [], `copy.${lang}.js ${key}: zusätzliche Schlüssel`);
    }
  });

  test(`copy.${lang}.js: Struktur- und Datenfelder identisch (ids, Filter, Bilder, Links)`, () => {
    for (const k of ["filter", "galerie", "id"]) assert.deepEqual(mod.WELTEN.map((w) => w[k]), EN.WELTEN.map((w) => w[k]), `WELTEN.${k}`);
    assert.deepEqual(mod.WELTEN.map((w) => w.bild.galerie), EN.WELTEN.map((w) => w.bild.galerie));
    assert.deepEqual(mod.WELTEN.map((w) => w.platzhirsch.href), EN.WELTEN.map((w) => w.platzhirsch.href));
    assert.deepEqual(mod.NAV.items.map((i) => i.href), EN.NAV.items.map((i) => i.href));
    assert.deepEqual(mod.TECHNIK.bereiche.map((b) => b.href), EN.TECHNIK.bereiche.map((b) => b.href));
    assert.deepEqual(mod.VERLEGUNG.typen.map((t) => [t.id, t.schritte.length]), EN.VERLEGUNG.typen.map((t) => [t.id, t.schritte.length]));
    assert.equal(mod.FRAGEN.liste.length, 18);
    assert.equal(mod.PFLEGE.themen.length, EN.PFLEGE.themen.length);
    assert.deepEqual(mod.DOWNLOADS.zertifikatListe.map((z) => [z.datei, z.quelle, z.sprache]), EN.DOWNLOADS.zertifikatListe.map((z) => [z.datei, z.quelle, z.sprache]));
    assert.deepEqual(mod.MOSAIKE.sortierung.map((s) => s.id), EN.MOSAIKE.sortierung.map((s) => s.id));
    assert.deepEqual(mod.GALERIE.einsatz.map((s) => s.id), EN.GALERIE.einsatz.map((s) => s.id));
    assert.equal(mod.LINKS.muster(["a", "b"]), EN.LINKS.muster(["a", "b"]));
  });

  test(`copy.${lang}.js: Zahlen wie in der englischen Fassung (keine erfundenen oder verlorenen Fakten)`, () => {
    const en = new Map(strings(EN));
    const digits = (s) => (String(s).match(/\d+/g) || []).join(" ");
    const diff = [];
    for (const [p, s] of strings(mod)) {
      if (!en.has(p) || TECH.test(p)) continue;
      const a = (String(s).match(/\d+/g) || []).sort().join(" ");
      const b = (String(en.get(p)).match(/\d+/g) || []).sort().join(" ");
      if (a !== b) diff.push(`${p}: ${digits(s)} ≠ ${digits(en.get(p))}`);
    }
    assert.deepEqual(diff, []);
  });

  test(`copy.${lang}.js: keine Preise, keine Superlative, keine deutschen Reste`, () => {
    const src = fs.readFileSync(`src/lib/ezarri/copy.${lang}.js`, "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(src, /€|\bEUR\b|\bCHF\b/);
    const SUPER = lang === "fr" ? /\b(meilleur\w*|uniques?|exclusi\w*|luxe\w*|luxueu\w*|parfait\w*|incomparable|exceptionnel\w*|idéal\w*)\b/i : /\b(miglior\w*|esclusiv\w*|lusso\w*|lussuos\w*|perfett\w*|incomparabil\w*|eccezional\w*|ideal\w*)\b/i;
    for (const [p, s] of prose(mod)) {
      assert.doesNotMatch(s, SUPER, `${p}: Superlativ/Werbewort`);
      const ohneNamen = s.replace(/Landstraße|Platzhirsch|Menghin|Lazkao|Gipuzkoa|Castellón|Sassuolo/g, "");
      assert.doesNotMatch(ohneNamen, /[äöüß]|\b(und|der|die|das|mit|für|Muster|Mosaike|Kollektion|Stand)\b/, `${p}: deutscher Rest „${s}“`);
    }
  });

  test(`copy.${lang}.js: Händler-Aussage nur aus dem Claim-Register`, () => {
    assert.equal(mod.dealerClaim(true), dealerStatement("ezarri", lang));
    assert.equal(mod.dealerClaim(false), null);
    assert.equal(mod.dealerTitleWord(false), null);
    assert.equal(mod.dealerLine(false), mod.NEUTRAL_CLAIM);
    const src = fs.readFileSync(`src/lib/ezarri/copy.${lang}.js`, "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    // Kein eigener Händlersatz im Text (revendeur/rivenditore nur über claims.js).
    assert.doesNotMatch(src.replace(/DEALER_TITLE_WORD|dealerStatement|isVerifiedDealerBrand/g, ""), lang === "fr" ? /revendeur|distributeur officiel|concessionnaire/i : /rivenditore|distributore ufficiale|concessionario/i);
  });

  test(`copy.${lang}.js: Werkzeuge und rein deutsche Seiten sind im Label gekennzeichnet`, () => {
    const hinweisEn = lang === "fr" ? /\((en anglais|outil en anglais)\)|en anglais/ : /\((in inglese|strumento in inglese)\)|in inglese/;
    const hinweisDe = lang === "fr" ? /\(en allemand\)/ : /\(in tedesco\)/;
    // Sprach-Integration 01.11.2026 (bewusst geändert): Küchen, Interior, Outdoor und
    // Einkaufen aus der Schweiz sind viersprachig – kein Hinweis mehr im Label.
    // Bodensee-Licht bleibt nur Deutsch.
    for (const w of mod.WELTEN) assert.doesNotMatch(w.platzhirsch.label, hinweisDe, `${w.id}: Seite gibt es in der Sprache`);
    assert.match(mod.HUB.usp.licht, hinweisDe);
    assert.doesNotMatch(mod.HUB.schweiz, hinweisDe);
    // Konfigurator und Rechner gibt es seit 01.11.2026 auf fr/it (konfigurator/intl.js);
    // Custom Mix und Anfrage (Katalog) nur de/en → Hinweis im Label.
    for (const s of [mod.HUB.konfigurator.customMix, mod.KOLLEKTIONEN.customLink, mod.KOLLEKTIONEN.service["custom-mix"], mod.DOWNLOADS.kataloge.link]) {
      assert.match(s, hinweisEn, `„${s}“: Werkzeug ohne Sprachhinweis`);
    }
  });

  test(`copy.${lang}.js: Title ≤ 60 (mit Suffix-Regel), Description 120–150`, () => {
    const rows = [];
    for (const [k, v] of Object.entries(mod)) if (v && typeof v === "object" && !Array.isArray(v) && "seoTitle" in v) rows.push([k, v.seoTitle, typeof v.description === "function" ? v.description(ST) : v.description]);
    for (const w of mod.WELTEN) rows.push([`WELTEN.${w.id}`, w.seoTitle, w.description]);
    rows.push(["HUB", null, mod.HUB.description(ST)]);
    for (const [k, t, d] of rows) {
      if (t) assert.ok(fitTitle(`${t} | Platzhirsch`).length <= 60 && t.length <= 60, `${k}: Title ${t.length}`);
      if (d) assert.ok(d.length >= 120 && d.length <= 150, `${k}: Description ${d.length} „${d}“`);
    }
  });
}

test("Französische Typografie: geschütztes Leerzeichen vor : ; ? ! % und in « »", () => {
  for (const [p, s] of prose(FR)) {
    assert.doesNotMatch(s, / [:;?!»%]/, `${p}: normales Leerzeichen vor Satzzeichen „${s}“`);
    assert.doesNotMatch(s, /« /, `${p}: normales Leerzeichen nach « „${s}“`);
    assert.doesNotMatch(s, /[“”„"]/, `${p}: englische/deutsche Anführungszeichen „${s}“`);
    assert.doesNotMatch(s, /'/, `${p}: gerader Apostroph „${s}“`);
  }
  assert.match(FR.HUB.weiche.title, / \?| \?/);
});

test("Italienische Typografie: « » ohne Leerzeichen, kein Leerzeichen vor Satzzeichen", () => {
  for (const [p, s] of prose(IT)) {
    assert.doesNotMatch(s, /[   ][:;?!»]/, `${p}: Leerzeichen vor Satzzeichen „${s}“`);
    assert.doesNotMatch(s, /«[\s ]/, `${p}: Leerzeichen nach « „${s}“`);
    assert.doesNotMatch(s, /[“”„"]/, `${p}: andere Anführungszeichen „${s}“`);
    assert.doesNotMatch(s, /'/, `${p}: gerader Apostroph „${s}“`);
  }
});

test("Sprachschalter: Welt in de/en/fr/it, Werkzeuge weiter de/en", () => {
  assert.deepEqual([...EZARRI_WELT_LOCALES], ["de", "en", "fr", "it"]);
  for (const l of ["de", "en", "fr", "it"]) assert.equal(ezarriWeltLocaleEnabled(l), true);
  assert.equal(ezarriWeltLocaleEnabled("es"), false);
  assert.deepEqual([...EZARRI_LOCALES], ["de", "en"]);
  assert.equal(ezarriLocaleEnabled("fr"), false);
  assert.equal(ezLang("fr"), "fr");
  assert.equal(ezLang("it"), "it");
  assert.equal(ezLang("es"), "de");
  assert.equal(ezT("fr")("Ja", "Yes", "Oui", "Sì"), "Oui");
  assert.equal(ezT("it")("Ja", "Yes", "Oui", "Sì"), "Sì");
  assert.equal(ezT("fr")("Ja", "Yes"), "Yes", "fehlt fr: Englisch statt Deutsch");
  assert.equal(ezT("de")("Ja", "Yes", "Oui", "Sì"), "Ja");
});

test("Werte, Zahlen, Herstellertexte fr/it", () => {
  assert.equal(wert("farbe", "Grün", "fr"), "Vert");
  assert.equal(wert("oberflaeche", "glänzend", "it"), "lucido");
  assert.equal(wert("sprache", "englisch", "fr"), "anglais");
  assert.equal(dezimal("24,7 x 24,7 mm", "fr"), "24,7 x 24,7 mm");
  assert.equal(herstellerText("from the Mix collection, designed for swimming pools.", "fr"), null, "kein englischer Herstellertext auf fr");
  assert.equal(facetLabel("wasser", "natur", "fr"), "Naturel, comme un lac de montagne");
  assert.equal(facetLabel("einsatz", "bad", "it"), "Bagno e doccia");
  for (const l of ["fr", "it"]) {
    const t = facetsFor(l);
    for (const [k, list] of Object.entries(t)) for (const x of list) assert.ok(x.label && !/[äöüß]/.test(x.label), `${l} ${k}.${x.id}: „${x.label}“`);
  }
  assert.equal(ezarriCredit("bild", "fr"), "Image : Ezarri, ezarri.com");
  assert.equal(ezarriCredit("daten", "it"), "Dati: Ezarri, ezarri.com");
  assert.equal(ezarriUrlFor("https://www.ezarri.com/de/kollektionen/gea", "fr"), "https://www.ezarri.com/en/collections/gea");
  assert.equal(ezarriUrlFor("https://www.ezarri.com/de/kollektionen/gea", "de"), "https://www.ezarri.com/de/kollektionen/gea");
});

test("Brotkrumen, Kollektions-SEO, H1 fr/it", () => {
  assert.deepEqual(ezCrumbsFor("fr", { label: "Pose" }).map((c) => c.label), ["Accueil", "Mosaïque de verre Ezarri", "Pose"]);
  assert.deepEqual(ezCrumbsFor("it").map((c) => c.label), ["Home", "Mosaico di vetro Ezarri"]);
  const c = { name: "Gea", linie: "Premium", formate: ["25mm", "50mm"], oberflaeche: { standard: ["matt"], safe: ["matt"] } };
  const refs = [{ typ: "mosaik" }, { typ: "safe-step" }];
  assert.equal(kollektionH1(c, "fr"), "Gea – mosaïque de verre Ezarri");
  assert.match(intro(c, refs, "fr"), /^Gea fait partie de la ligne Premium\. 2 références, dont 1 mosaïques, plus Safe-Steps/);
  assert.match(intro(c, refs, "it"), /Superficie: opaco, opaco \(Safe\)\.$/);
  const d = kollektionDescription(c, refs, 150, "it");
  assert.ok(d.startsWith("Ezarri Gea: mosaico di vetro della linea Premium.") && d.endsWith("Campioni e consulenza a Lochau.") && d.length <= 150, d);
  assert.equal(mosaikHeading({ name: "Dune", code: "D1" }, "Gea", "Mosaïque", "fr").kollektion, "Collection Gea");
});

test("Kollektionsseiten fr/it: Description 120–150 Zeichen für alle 21 Kollektionen", async () => {
  const C = JSON.parse(fs.readFileSync("src/lib/ezarri/collections.json", "utf8"));
  const R = JSON.parse(fs.readFileSync("src/lib/ezarri/references.json", "utf8"));
  const refs = R.referenzen || R;
  for (const l of ["fr", "it"]) {
    for (const c of C.kollektionen) {
      const d = kollektionDescription(c, refs.filter((r) => r.kollektion === c.id), 150, l);
      assert.ok(d.length >= 120 && d.length <= 150, `${l} ${c.id}: ${d.length} „${d}“`);
      assert.ok(fitTitle(`${(l === "fr" ? FR : IT).KOLLEKTIONEN.metaTitle(c.name, c.linie)} | Platzhirsch`).length <= 60, `${l} ${c.id}: Title`);
    }
  }
});

test("Links: Werkzeuge ohne fr/it → englische Fassung, rein deutsche Seiten → /de", () => {
  // Konfigurator/Rechner folgen TOOL_LOCALES (konfigurator/intl.js), Anfrage/Custom Mix EZARRI_LOCALES.
  const tools = TOOL_LOCALES.includes("fr") ? {} : { locale: "en", hrefLang: "en" };
  assert.deepEqual(ezLinkProps("fr", "/ezarri/konfigurator?serie=Gea"), tools);
  assert.deepEqual(ezLinkProps("fr", "/ezarri/rechner"), tools);
  assert.deepEqual(ezLinkProps("it", "/ezarri/anfrage?art=muster"), { locale: "en", hrefLang: "en" });
  assert.deepEqual(ezLinkProps("fr", "/ezarri/custom-mix"), { locale: "en", hrefLang: "en" });
  assert.deepEqual(ezLinkProps("fr", "/ezarri/mosaike"), {});
  assert.deepEqual(ezLinkProps("en", "/ezarri/konfigurator"), {});
  assert.deepEqual(ezLinkProps("de", "/ezarri/konfigurator"), {});
  // Sprach-Integration 01.11.2026: Küchen-Seite viersprachig; Bodensee-Licht nur Deutsch.
  assert.deepEqual(ezLinkProps("it", "/kuechen-vorarlberg"), {});
  assert.deepEqual(ezLinkProps("it", "/bodensee-licht"), { locale: "de", hrefLang: "de" });
});

test("Seiten der Welt prüfen ezarriWeltLocaleEnabled, Werkzeuge bleiben bei ezarriLocaleEnabled", () => {
  const APP = "src/app/[locale]/ezarri";
  const welt = ["page.js", "layout.js", "wasser/page.js", "kollektionen/page.js", "kollektionen/[kollektion]/page.js", "mosaike/page.js", "mosaike/[referenz]/page.js", "mosaike/vergleich/page.js", "galerie/page.js", "technik/page.js", "technik/jointpoint/page.js", "technik/verlegung/page.js", "technik/pflege/page.js", "technik/fragen/page.js", "technik/downloads/page.js"];
  for (const f of welt) {
    const src = fs.readFileSync(`${APP}/${f}`, "utf8");
    assert.match(src, /ezarriWeltLocaleEnabled\(locale\)/, f);
    assert.doesNotMatch(src, /\bezarriLocaleEnabled\(/, `${f}: alte Sprachprüfung`);
  }
  assert.match(fs.readFileSync("src/components/Ezarri/Welt/EinsatzWelt.js", "utf8"), /ezarriWeltLocaleEnabled\(locale\)\) notFound\(\)/);
  // Werkzeuge prüfen ihre Sprachen selbst (ezarriLocaleEnabled bzw. toolLocaleEnabled).
  for (const f of ["konfigurator/page.js", "rechner/page.js", "custom-mix/page.js", "anfrage/page.js"]) {
    assert.match(fs.readFileSync(`${APP}/${f}`, "utf8"), /(ezarriLocaleEnabled|toolLocaleEnabled)\(locale\)\)\s*notFound\(\)/, f);
  }
});

// Lektorat 01.11.2026: Wendungen, die beim Gegenlesen korrigiert wurden, kommen nicht zurück.
test("Lektorat fr/it: keine korrigierten Fehlformulierungen", () => {
  const all = (mod) => JSON.stringify(mod);
  const fr = all(FR);
  const it = all(IT);
  // IT „piante“ = Pflanzen (nicht Pläne), „sul posto“ doppelt, „da solo“ falscher Bezug.
  assert.doesNotMatch(it, /Portate piante/);
  assert.doesNotMatch(it, /sul posto\. Veniamo[^.]*sul posto/);
  assert.doesNotMatch(it, /selezionabile solo da solo/);
  assert.doesNotMatch(it, /Lasciate cercare a noi/);
  assert.doesNotMatch(it, /su Ezarri\b/);
  // FR „sur demande … sur demande“ im selben Satz.
  assert.doesNotMatch(fr, /Livraison sur demande[^.]*sur demande/);
  assert.doesNotMatch(fr, /Où est-elle produite/);
});

test("Mosaik-H1 fr/it: Gattungswort vor der Marke", () => {
  assert.equal(mosaikHeading({ name: "Celestite 25", code: "CELESTITE-25" }, "Gemma", "Mosaïque", "fr").main, "Mosaïque Ezarri Celestite 25 (CELESTITE-25)");
  assert.equal(mosaikHeading({ name: "Celestite 25" }, "Gemma", "Mosaico", "it").text, "Mosaico Ezarri Celestite 25 · Collezione Gemma");
  assert.equal(mosaikHeading({ name: "Celestite 25" }, "Gemma", "Mosaic", "en").main, "Ezarri Mosaic Celestite 25");
});
