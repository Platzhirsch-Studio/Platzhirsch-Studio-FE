// Runde 9, Fix-Team P5 (Recht, Texte, Übersetzungen). Belege zu den Aufträgen:
// 1 IT voi (recht P1-1), 2 UWG-Alleinstellung in News (recht P1-2),
// 3 Designer-/Marken-Bios je Sprache (recht P1-3), 4 Datenschutz Sprach-Cookie
// (recht P1-4, Vertrag aus P1), 5 kein „Innenarchitektur“ (seo P1-2, recht P2),
// 6 Brotkrume „Startseite“ + Kategorie-Volltextliste (seo P2), 7 CTA-Familie
// „Beratung anfragen“ (ux P2), 8 Schlüssel vollständig.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { itExpected, VOI } from "./r5-i18n-voi.lib.mjs";
import { sanitizeNewsText, dropPromiseSentences } from "../../src/lib/news/newsCopy.js";
import { BIO_I18N, localizedBio } from "../../src/lib/data/designerBios.js";
import { filterManufacturerText } from "../../src/lib/shop/manufacturerText.js";
import { hubSeo, categorySeo } from "../../src/lib/seo/shopSeoCopy.js";
import { MAPS_CONSENT_NEUTRAL } from "../../src/lib/legal/services.js";

const ROOT = path.resolve(import.meta.dirname, "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];
const msgs = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
function flatten(o, p = "", out = new Map()) {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out.set(key, v);
  }
  return out;
}
const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(msgs[l])]));

// tu-Formen (Pronomen, Verben, Imperative) – Regex aus r5-recht-inhalt P1-1.
// Pronomen/Verben klein (case-sensitiv: „mostra“ 3. Person, „C2TE“ sind kein
// tu); Imperative nur am Satz- bzw. Textanfang.
const TU = /(?<![\p{L}'’])(?:tu|tuo|tua|tuoi|tue|ti|te|hai|puoi|vuoi|vedi|Tu|Tuo|Tua|Tuoi|Tue|Ti|Te)(?![\p{L}])|(?:^|[.!?«"`]\s*)(?:Descrivi|Scegli|Mostra|Scopri|Leggi|Richiedi|Prenota|Scrivi|Contattaci|Scrivici)(?![\p{L}])/u;

// ------------------------------------------------------------ 1 IT voi
test("1) IT: Cookie-Knöpfe in voi (dokumentiert über r5-i18n-voi.lib), keine Infinitive", () => {
  const c = msgs.it.Cookies;
  assert.equal(c.acceptAll, "Accettate tutti");
  assert.equal(c.rejectAll, "Continuate senza consenso");
  for (const k of ["acceptAll", "rejectAll", "savePreferences", "showDetails", "hideDetails", "embedButton"]) {
    assert.equal(c[k], itExpected(`Cookies.${k}`, c[k]), k);
    assert.equal(VOI[`Cookies.${k}`] ?? c[k], c[k], `${k}: Patch-Kette = it.json`);
    assert.doesNotMatch(c[k], /^\p{Lu}\p{Ll}+(?:are|ere|ire)\b/u, `${k}: kein Infinitiv-Knopf`);
  }
  assert.match(c.thirdCountryNotice, new RegExp(`«${c.showDetails}»`), "Verweis = Knopftext");
});

test("1) IT voi in den eigenen Dateien: Produkt-/News-Meta, shopSeoCopy, Consent-Ersatztexte, Datenschutz-og", () => {
  const texts = {
    "hubSeo(it)": JSON.stringify(hubSeo("it")),
    "categorySeo(it)": JSON.stringify(categorySeo("it", { label: "Divani", count: 3, brands: ["Minotti"], key: "sofas-couches" })),
    "MAPS_CONSENT_NEUTRAL.it": JSON.stringify(MAPS_CONSENT_NEUTRAL.it),
  };
  const itLines = (file) => read(file).split("\n").filter((l) => /\bit\b\s*:|case "it"|"it"\s*\?|Leggete|Scoprite/.test(l)).join("\n");
  for (const f of [
    "src/app/[locale]/produkte/[category]/[product]/page.js",
    "src/app/[locale]/produkte/[category]/page.js",
    "src/app/[locale]/produkte/page.js",
    "src/app/[locale]/news/page.js",
    "src/app/[locale]/news/[title]/page.js",
    "src/app/[locale]/datenschutz/page.js",
    "src/app/[locale]/impressum/page.js",
  ]) texts[f] = itLines(f);
  for (const [name, t] of Object.entries(texts)) assert.doesNotMatch(t, TU, name);
  assert.match(read("src/app/[locale]/produkte/[category]/[product]/page.js"), /Vi offriamo consulenza su questo pezzo .* per il vostro spazio/);
  assert.match(hubSeo("it").description, /Scoprite la selezione/);
  // it.json selbst: weiter 0 tu-Formen.
  const hits = [...flat.it].filter(([, v]) => typeof v === "string" && TU.test(v)).map(([k, v]) => `${k}: ${v.slice(0, 60)}`);
  assert.deepEqual(hits, []);
});

// ------------------------------------------------------------ 2 UWG
test("2) News: Alleinstellungssatz (Rimadesio) entfällt als ganzer Satz, Rest bleibt", () => {
  const rima =
    "Rimadesio steht für Glas und Aluminium. Kein anderer Hersteller bietet so elegante Produkte mit derart außergewöhnlich technischem Know-how. Dazu gehören Ankleide-schränke und Regale.";
  assert.equal(sanitizeNewsText(rima, "de"), "Rimadesio steht für Glas und Aluminium. Dazu gehören Ankleideschränke und Regale.");
  const cases = {
    de: ["Die Leuchte wirkt wie keine andere. Sie ist aus Glas.", "Niemand sonst fertigt Glas so präzise. Sie ist aus Glas.", "Nur bei uns erhältlich. Sie ist aus Glas.", "Als einziger Hersteller arbeitet Rimadesio mit Glas. Sie ist aus Glas."],
    en: ["No other manufacturer offers such elegance. It is made of glass.", "The design is unmatched. It is made of glass.", "A sofa like no other. It is made of glass."],
    fr: ["Aucun autre fabricant n’offre une telle élégance. Il est en verre.", "Le design est sans égal. Il est en verre."],
    it: ["Nessun altro produttore offre una tale eleganza. È in vetro.", "Il design è senza pari. È in vetro.", "Un divano come nessun altro. È in vetro."],
  };
  const rest = { de: "Sie ist aus Glas.", en: "It is made of glass.", fr: "Il est en verre.", it: "È in vetro." };
  for (const [l, list] of Object.entries(cases)) for (const t of list) assert.equal(dropPromiseSentences(t, l), rest[l], `${l}: ${t}`);
  // „einzigartig“/„unvergleichlich“ werden entschärft (Wort), nicht übersehen.
  assert.doesNotMatch(sanitizeNewsText("Das Sofa ist einzigartig.", "de"), /einzigartig/);
  assert.equal(sanitizeNewsText("Das Sofa ist unvergleichlich. Es ist blau.", "de"), "Es ist blau.");
  // Keine Fehltreffer bei gewöhnlichen Sätzen.
  for (const [l, t] of [["de", "Wir haben keine anderen Termine frei."], ["en", "We have no other plans."], ["fr", "Nous n’avons aucune autre date."], ["it", "Non ha nessun altro scopo."]]) {
    assert.equal(sanitizeNewsText(t, l), t, `${l}: ${t}`);
  }
});

// ------------------------------------------------------------ 3 Bios
test("3) 17 Bios: DE/FR/IT übersetzt, keine englische Bio auf DE/FR/IT, Filter lässt die Übersetzung stehen", () => {
  const src = read("src/lib/data/staticShopProducts.js");
  const names = [...src.matchAll(/^ {2}"([^"]+)": \{ image: "[^"]+",(?: founded: "\d+", country: "\w+",)? bio: "/gm)].map((m) => m[1]);
  assert.equal(names.length, 17);
  assert.deepEqual(Object.keys(BIO_I18N).sort(), [...names].sort());
  const EN = /\b(?:the|and|with|since|his|her|its|is|was|founded|born)\b/;
  for (const n of names) {
    for (const l of ["de", "fr", "it"]) {
      const bio = localizedBio(n, "English source", l);
      assert.ok(bio && bio.length > 40, `${n} ${l}`);
      assert.doesNotMatch(bio, EN, `${n} ${l}: englisch`);
      assert.equal(filterManufacturerText(bio), bio, `${n} ${l}: Filter würde kürzen`);
      assert.doesNotMatch(bio, /innenarchitekt|architecture d.int|architettura d.interni|luxus|luxe|lusso/i, `${n} ${l}`);
    }
    assert.equal(localizedBio(n, "English source", "en"), "English source");
  }
  assert.equal(localizedBio("Unbekannt", "English source", "de"), null, "ohne Übersetzung keine Bio");
  assert.doesNotMatch(src, /interior architecture/);
  assert.match(read("src/app/[locale]/produkte/[category]/[product]/page.js"), /getDesignerInfo\(product\.designer, locale\)/);
});

// ------------------------------------------------------------ 4 Datenschutz
test("4) Datenschutz: Sprach-Cookie und Speicher nur beim aktiven Sprachwechsel (Vertrag LanguageSwitcher)", () => {
  const dse = read("src/components/Datenschutz/datenschutz.js");
  assert.match(dse, /Beide werden nur gesetzt, wenn Sie aktiv die Sprache wechseln, nicht schon beim ersten Besuch/);
  assert.doesNotMatch(dse, /merkt sich die gewählte Sprache, 12 Monate; dazu/);
  assert.match(read("src/components/Navbar/LanguageSwitcher.js"), /werden nur gesetzt, wenn der Besucher aktiv die Sprache/);
});

// ------------------------------------------------------------ 5 Innenarchitektur
test("5) Kein „Innenarchitektur“ (geschützte Berufsbezeichnung) in src/messages und Über uns", () => {
  const BAN = /innenarchitekt|interior architect|architecture d.\s?int[ée]rieur|architecte d.\s?int[ée]rieur|architettura d.\s?interni|architett[oi] d.\s?interni/iu;
  for (const l of LOCALES) for (const [k, v] of flat[l]) if (typeof v === "string") assert.doesNotMatch(v, BAN, `${l}: ${k}`);
  const dir = path.join(ROOT, "src/components/UberUns");
  const files = fs.readdirSync(dir, { recursive: true }).filter((f) => /\.js$/.test(f));
  for (const f of files) assert.doesNotMatch(fs.readFileSync(path.join(dir, f), "utf8"), BAN, f);
  assert.equal(msgs.fr.Slider.headline, "Mobilier design, cuisines & aménagement intérieur au Vorarlberg");
});

// ------------------------------------------------------------ 6 SEO
test("6) Brotkrume: „Startseite“ je Sprache über homeCrumbLabel (News, Produkte); Kategorie verlinkt alle Produkte", () => {
  for (const f of ["src/app/[locale]/news/[title]/page.js", "src/app/[locale]/news/page.js", "src/app/[locale]/produkte/page.js", "src/app/[locale]/produkte/[category]/page.js"]) {
    const s = read(f);
    assert.match(s, /import \{ homeCrumbLabel \} from "@\/lib\/seo\/breadcrumbs";/, f);
    assert.match(s, /const Home = homeCrumbLabel\(locale\);/, f);
    assert.doesNotMatch(s, /: "Accueil" : "Home"/, f);
  }
  const cat = read("src/app/[locale]/produkte/[category]/page.js");
  assert.match(cat, /products\.length > PRODUCTS_PER_PAGE && \(/);
  assert.match(cat, /tc\("catalog\.allModels", \{ count: products\.length \}\)/);
  for (const l of LOCALES) assert.match(flat[l].get("shop.catalog.allModels"), /\{count\}/, l);
});

// ------------------------------------------------------------ 7 CTA
test("7) CTA-Familie Beratung: ein Wort je Sprache, Termin-Knöpfe unverändert", () => {
  const CONSULT = { de: "Beratung anfragen", en: "Request a consultation", fr: "Demander un conseil", it: "Richiedete una consulenza" };
  for (const l of LOCALES) {
    for (const k of ["contact.consultCta", "shop.requestConsultation", "marken.requestConsultation", "inhalt.beratung.toForm"]) assert.equal(flat[l].get(k), CONSULT[l], `${l} ${k}`);
  }
  assert.equal(flat.de.get("Shell.menu.termin"), "Termin anfragen");
  assert.equal(flat.it.get("shop.atelier.ctaPrimary"), "Vedetelo a Lochau – richiedete un appuntamento");
});

// ------------------------------------------------------------ 8 Schlüssel
test("8) en/fr/it haben genau die Schlüssel von de, nichts leer", () => {
  const de = [...flat.de.keys()].sort();
  for (const l of ["en", "fr", "it"]) {
    assert.deepEqual([...flat[l].keys()].sort(), de, l);
    for (const [k, v] of flat[l]) if (typeof v === "string") assert.ok(v.trim() || !String(flat.de.get(k)).trim(), `${l}: ${k} leer`);
  }
});

test("1) Backoffice-IT (Produkt-/News-Meta und -Text) wird beim Rendern auf voi gebracht", async () => {
  const { itVoi } = await import("../../src/lib/seo/shopSeoCopy.js");
  assert.equal(itVoi("Base in alluminio. Richiedi una consulenza."), "Base in alluminio. Richiedete una consulenza.");
  assert.equal(itVoi("Scopri il tuo divano per casa tua."), "Scoprite il vostro divano per casa vostra.");
  assert.equal(itVoi("Visita allo showroom."), "Visita allo showroom.", "Substantiv bleibt");
  assert.equal(itVoi("Richiedi", "de"), "Richiedi", "nur IT");
  assert.equal(sanitizeNewsText("Il divano è blu. Scopri la collezione.", "it"), "Il divano è blu. Scoprite la collezione.");
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /toMetaDescription\(itVoi\(/);
  assert.match(page, /\.map\(\(p\) => itVoi\(p, locale\)\)/);
  assert.match(read("src/app/[locale]/news/[title]/page.js"), /itVoi\(news\?\.metadata_description_it\)/);
});
