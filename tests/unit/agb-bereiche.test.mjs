// AGB je Geschäftsbereich (Inhaber 02.11.2026): Struktur, Bereiche, keine
// erfundenen Zahlen, keine Händlerwörter, kein KI-Wortlaut, Seite und Footer.
// Run: node --test tests/unit/agb-bereiche.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AGB_ANBIETER,
  AGB_BEREICHE,
  AGB_BEREICH_KEYS,
  AGB_PATH,
  AGB_STAND,
  AGB_STATUS,
  AGB_TEILE,
  agbSections,
  agbStandDe,
  agbText,
  kanzleiLuecken,
  sectionTexts,
  splitInline,
} from "../../src/lib/legal/agb.js";
import { findClaims, hasCountryPromise, hasUnprovenClaim } from "../../src/lib/legal/claims.js";
import { LEGAL_TEXTS } from "../../src/components/LegalDrafts/liveStatus.js";
import { footerLinkAllowed } from "../../src/lib/seo/footerLinks.js";
import { LEGAL_NAME } from "../../src/lib/site.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const TEXT = agbText();

// ------------------------------------------------------------ 1 Struktur

test("AGB: vier Teile, zehn Bereiche in der Reihenfolge des Auftrags", () => {
  assert.deepEqual(
    AGB_TEILE.map((t) => t.id),
    ["teil-i", "teil-ii", "teil-iii", "teil-iv"]
  );
  assert.deepEqual(AGB_BEREICH_KEYS, ["moebel", "kuechen", "geraete", "wellness", "planung", "outdoor", "onlineshop", "gutscheine", "anzahlung", "ausland"]);
  assert.equal(AGB_TEILE[3].sections, AGB_BEREICHE);
  // Abschnitts-IDs eindeutig (Sprungmarken)
  const ids = agbSections().map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of agbSections()) {
    assert.ok(s.num && s.title && s.blocks.length > 0, s.id);
    for (const t of sectionTexts(s)) assert.ok(t.length > 20, `${s.id}: leerer Absatz`);
  }
  for (const b of AGB_BEREICHE) assert.ok(b.lead, `${b.key}: lead`);
  // Inhaber 03.11.2026: „AGB zur Kanzlei – alle geprüft und freigegeben!“
  assert.equal(AGB_STATUS, "freigegeben");
  assert.equal(AGB_STAND, "2026-11-03");
  assert.equal(agbStandDe(), "03.11.2026");
  assert.equal(AGB_PATH, "/agb");
});

test("AGB: Allgemeiner Teil deckt die Pflichtthemen ab", () => {
  const titles = AGB_TEILE[0].sections.map((s) => s.title).join(" | ");
  for (const re of [/Vertragspartnerin/, /Vertragsschluss/, /Preise/, /Zahlung/, /Lieferung/, /Eigentumsvorbehalt/, /Haftung/, /Datenschutz/, /Recht/]) assert.match(titles, re);
  const t2 = AGB_TEILE[1].sections.map((s) => s.title).join(" | ");
  for (const re of [/Gewährleistung/, /Haftung/, /Rücktrittsrecht/, /Gerichtsstand/]) assert.match(t2, re);
  const t3 = AGB_TEILE[2].sections.map((s) => s.title).join(" | ");
  for (const re of [/Gewährleistung/, /Haftung/, /Eigentumsvorbehalt/, /Gerichtsstand/]) assert.match(t3, re);
  // Gesetzliche Anker
  for (const re of [/§ 14 KSchG/, /§ 6 Abs 1 Z 9 KSchG/, /§ 6 Abs 1 Z 8 KSchG/, /§ 18 Abs 1 Z 3 FAGG/, /§ 11 FAGG/, /§ 7b KSchG/, /§ 10 Abs 1 VGG/, /§ 377 UGB/, /§ 456 UGB/, /Art\. 6 Abs 2 Rom-I-VO/, /Art\. 715 ZGB/, /CISG/]) assert.match(TEXT, re);
});

test("AGB: B2B und B2C getrennt – Gerichtsstand Wien nur für Unternehmer, Verbraucher gesetzlich", () => {
  const teilII = AGB_TEILE[1].sections.flatMap(sectionTexts).join("\n");
  const teilIII = AGB_TEILE[2].sections.flatMap(sectionTexts).join("\n");
  assert.match(teilIII, /Gericht in Wien als allein zuständiges Gericht vereinbart \(§ 104 JN\)/);
  assert.match(teilII, /gesetzlichen Gerichtsstände/);
  assert.match(teilII, /§ 14 KSchG/);
  assert.doesNotMatch(teilII, /Gerichtsstandsvereinbarung.*Wien.*gilt/);
  assert.doesNotMatch(TEXT, /Bregenz/, "Gerichtsstand ist Wien, nicht Bregenz");
  // Verbraucher: 2 Jahre VGG; Unternehmer: ein Jahr, § 924 abbedungen, § 377 UGB
  assert.match(teilII, /innerhalb von zwei Jahren ab Übergabe/);
  assert.match(teilIII, /Gewährleistungsfrist beträgt ein Jahr/);
  assert.match(teilIII, /§ 924 ABGB ist ausgeschlossen/);
  assert.match(teilIII, /Netto-Auftragswert/);
  assert.match(teilIII, /sechs Monate ab Kenntnis/);
  // Verbraucher-Haftung nie ohne Personenschäden/Vorsatz/grobe Fahrlässigkeit
  assert.match(teilII, /unbeschränkt für Vorsatz und grobe Fahrlässigkeit, für Personenschäden/);
});

test("AGB: Bereiche enthalten ihre Kernregeln", () => {
  const by = Object.fromEntries(AGB_BEREICHE.map((b) => [b.key, sectionTexts(b).join("\n")]));
  assert.match(by.moebel, /kein Rücktrittsrecht/);
  assert.match(by.moebel, /Freigabe/);
  assert.match(by.kuechen, /Werklieferungsvertrag/);
  assert.match(by.kuechen, /Aufmaß/);
  assert.match(by.kuechen, /befugte Fachbetriebe/);
  assert.match(by.kuechen, /Abnahme/);
  assert.match(by.geraete, /Herstellergarantien/);
  assert.match(by.geraete, /befugte Fachbetriebe/);
  assert.match(by.wellness, /Frost/);
  assert.match(by.wellness, /Wasserpflege/);
  assert.match(by.wellness, /Statik/);
  assert.match(by.planung, /geistiges Eigentum/);
  assert.match(by.planung, /laut Angebot/);
  assert.match(by.planung, /keine Bauleitung/);
  assert.match(by.outdoor, /Werft/);
  assert.match(by.outdoor, /Bootssattlerei/);
  assert.match(by.outdoor, /Bauarbeitenkoordinationsgesetz/);
  assert.match(by.onlineshop, /Widerrufsbelehrung/);
  assert.match(by.onlineshop, /Zahlungspflichtig bestellen/);
  assert.match(by.gutscheine, /Gutscheinbedingungen/);
  assert.match(by.anzahlung, /Anzahlung laut Angebot/);
  assert.match(by.anzahlung, /weder Angeld noch Reugeld/);
  assert.doesNotMatch(by.anzahlung, /\[Kanzlei:/);
  assert.match(by.ausland, /Ausfuhr/);
  assert.match(by.ausland, /Verzollung/);
  assert.match(by.ausland, /Fixtermin/);
  // Marktresearch/30: Bauleitung/Bauaufsicht nie im eigenen Namen
  assert.doesNotMatch(TEXT, /wir (übernehmen|führen) die Bau(leitung|aufsicht)/i);
});

// ------------------------------------------------------------ 2 Keine erfundenen Fakten

test("AGB: keine Zahlen außer gesetzlichen und Firmendaten", () => {
  let t = TEXT;
  // Firmendaten entfernen
  t = t.replaceAll(AGB_ANBIETER.fn, "").replaceAll(AGB_ANBIETER.uid, "").replaceAll(AGB_ANBIETER.telefon, "").replaceAll(AGB_ANBIETER.anschrift, "");
  // Fundstellen in Klammern (§ 6 Abs 1 Z 9 KSchG, Art. 715 ZGB) und im Fließtext (§ 377 UGB, Teil II § 7.5)
  t = t.replace(/\([^)]*(?:§|Art\.)[^)]*\)/g, "");
  t = t.replace(/(?:§§?|Art\.|Teil [IVX]+ §)\s*\d+[a-z]?(?:\.\d+)?(?:\s*(?:ff\.|Abs|Z|Satz|Nr\.|und|bis|,)\s*\d*[a-z]?)*/g, "");
  t = t.replace(/^\d+\.\d+ /gm, ""); // Absatznummern 1.1, 10.3
  t = t.replace(/\b3D\b|\bB2[BC]\b|\(\d\)|\b\d+ ff\./g, ""); // 3D-Modelle, B2C/B2B, Aufzählungen (1), §§ … ff.
  t = t.replace(/\b\d{4}\b/g, ""); // Jahreszahl im Stand
  // Gesetzliche Zahlen (Whitelist): 14 Tage FAGG, 4 % ABGB, 9,2 Prozentpunkte UGB
  t = t.replace(/14 Tagen?/g, "").replace(/4 % pro Jahr/g, "").replace(/9,2 Prozentpunkten/g, "");
  const rest = t.match(/[^\n]{0,30}\d+[^\n]{0,30}/g) || [];
  assert.deepEqual(rest, [], `verbliebene Zahlen: ${rest.join(" | ")}`);
  assert.doesNotMatch(TEXT, /€|EUR\b|CHF\s*\d|Prozent\b(?! ?punkt)/, "keine Beträge oder Prozentsätze");
  assert.doesNotMatch(TEXT, /versichert|Versicherungsschutz durch uns|abgesichert/i, "keine Versicherungsaussagen");
  assert.doesNotMatch(TEXT, /\bWochen\b|\bWerktage\b/, "keine Fristen in Wochen oder Werktagen");
});

test("AGB: keine Händler-, Marken- oder Superlativ-Aussagen, kein KI-Wortlaut", () => {
  assert.deepEqual(findClaims(TEXT), []);
  assert.equal(hasUnprovenClaim(TEXT), false);
  assert.equal(hasCountryPromise(TEXT), false);
  assert.doesNotMatch(TEXT, /\bKI\b|künstliche Intelligenz|Claude|Agent(en|in)?\b|Anthropic|ChatGPT/i);
  assert.doesNotMatch(TEXT, /Handels-GmbH|vom Unternehmen auszufüllen|anwaltlich prüfen|\[●\]/);
  assert.doesNotMatch(TEXT, /Minotti|Poliform|Binni|next125|Schüller|Gaggenau|Miele|Starpool/i, "keine Markennamen in den AGB");
  // Seite und Modul ohne KI-Hinweis im sichtbaren Text
  for (const f of ["src/app/[locale]/agb/page.js", "src/lib/legal/agb.js"]) assert.doesNotMatch(read(f), /Claude|Anthropic|KI-Agent/);
});

test("AGB: Vertragspartnerin ist die MW Immobilienverwaltungs GmbH, Registerdaten wie Impressum", () => {
  assert.equal(AGB_ANBIETER.firma, LEGAL_NAME);
  assert.equal(LEGAL_NAME, "MW Immobilienverwaltungs GmbH");
  const impressum = read("src/components/Impressum/impressum.js");
  for (const v of [AGB_ANBIETER.fn, AGB_ANBIETER.uid, AGB_ANBIETER.gericht]) assert.ok(impressum.includes(v), v);
  assert.match(sectionTexts(AGB_TEILE[0].sections[0])[0], new RegExp(`^1\\.1 Vertragspartnerin ist die ${LEGAL_NAME}`));
});

// ------------------------------------------------------------ 3 Lücken für die Kanzlei (seit 03.11.2026: keine)

test("AGB: freigegeben → null Kanzlei-Lücken, die 15 Stellen tragen Standardformulierungen", () => {
  assert.deepEqual(kanzleiLuecken(), [], "freigegebene AGB dürfen keine [Kanzlei: …]-Lücke zeigen");
  assert.doesNotMatch(TEXT, /\[Kanzlei:|wird ergänzt|\[…\]/);
  // Die 15 Ersetzungen (AGB-KANZLEI-2026-11-02.md, Stand 03.11.2026) – je ein Anker
  for (const re of [
    /§ 38 Abs 2 UGB/, // I § 1.5 Rechtsnachfolge, Widerspruchsrecht
    /höchstens die Hälfte des Auftragswerts/, // I § 3.4 Anzahlung
    /Unser Rücktrittsrecht besteht nur, wenn wir die Nichtbelieferung nicht zu vertreten haben/, // I § 4.3
    /unselbständige Bestandteile des Gebäudes/, // I § 7.2 Einbauten
    /nach oben wie nach unten \(§ 6 Abs 1 Z 5 KSchG\)/, // II § 2.2 Preisanpassung
    /§ 21 IO/, // II § 3.3 Insolvenz
    /Lieferzeit gilt Ihnen gegenüber als vereinbart/, // II § 4.1 Lieferfrist
    /wesentlicher Vertragspflichten/, // II § 6.2 Haftung B2C
    /holen wir sie auf unsere Kosten ab \(§ 15 FAGG\)/, // II § 7.3 Rücksendekosten
    /Einen Pauschalbetrag für das Storno vereinbaren wir mit Verbrauchern nicht/, // II § 7.5 Storno
    /nur mit Unternehmern vereinbarte Zuständigkeit der Gerichte in Wien erstreckt sich nicht auf Verbraucherinnen und Verbraucher/, // II § 8.2
    /Verbraucherschlichtungsstelle sind wir nicht verpflichtet/, // II § 8.3
    /§ 933b Abs 2 ABGB/, // III § 5.4 Regress
    /Buchvermerk/, // III § 7.1 verlängerter EV
    /weder Angeld noch Reugeld/, // IV § 9.2 Anzahlung
  ]) assert.match(TEXT, re);
  // Verweis auf die allgemeine Widerrufsbelehrung (/widerruf) aus Teil II § 7
  assert.match(TEXT, /platzhirsch\.studio\/widerruf/);
  // splitInline: Marker werden getrennt, Lücke trägt den Kanzlei-Text nur als Daten
  const parts = splitInline("Vorne [Verbraucher] Mitte [Kanzlei: Test] hinten");
  assert.deepEqual(
    parts.map((p) => p.t),
    ["text", "mark", "text", "luecke", "text"]
  );
  const page = read("src/app/[locale]/agb/page.js");
  assert.match(page, /wird ergänzt/);
  assert.doesNotMatch(page, /\{p\.text\}[^]*data-agb-luecke/, "Kanzlei-Text nicht sichtbar rendern");
  assert.match(page, /data-agb-luecke=""/);
});

// ------------------------------------------------------------ 4 Seite, Footer, Sitemap, Status

test("AGB: Seite vorhanden (vier Sprachen, noindex, Inhaltsverzeichnis, Druck, Entwurfsmarker, Stand)", () => {
  const page = read("src/app/[locale]/agb/page.js");
  assert.match(page, /LOCALES = \["de", "en", "fr", "it"\]/);
  assert.match(page, /robots: \{ index: false, follow: true \}/);
  assert.match(page, /GermanOnlyNotice/);
  assert.match(page, /aria-label="Inhalt"/);
  assert.match(page, /PrintButton/);
  assert.match(page, /AGB_STATUS === "entwurf"/);
  assert.match(page, /agbStandDe\(\)/);
  assert.match(read("src/components/Legal/PrintButton.js"), /window\.print\(\)/);
  // Verweise auf Shop und Gutscheine nur, wenn die Zielseite erreichbar ist
  assert.match(page, /shopActive\(\) \? AGB_VERWEISE\.onlineshop\.path : null/);
  assert.match(page, /voucherEnabled\(\) \? AGB_VERWEISE\.gutscheine\.path : null/);
});

test("AGB: Footer verlinkt /agb als Rechtslink in allen Sprachen; nicht in der Sitemap", () => {
  const footer = read("src/components/Reusable/Footer.js");
  assert.match(footer, /localizeHref\("\/agb", locale\)/);
  assert.match(footer, /t\("terms"\)/);
  for (const l of ["de", "en", "fr", "it"]) {
    const m = JSON.parse(read(`src/messages/${l}.json`));
    assert.ok(m.Footer.terms, `${l}: Footer.terms`);
  }
  assert.equal(footerLinkAllowed("/de/agb"), true);
  // noindex wie Impressum/Datenschutz → nicht in den statischen Sitemap-Einträgen
  assert.doesNotMatch(read("src/lib/seo/sitemapEntries.js"), /["']\/agb["']/);
  assert.doesNotMatch(read("src/lib/seo/sitemap/extraPages.js"), /["']\/agb["']/);
});

test("AGB: Live-Status führt die Seite als live und freigegeben (Inhaber 03.11.2026)", () => {
  const agb = LEGAL_TEXTS.find((t) => t.id === "agb");
  assert.equal(agb.livePath, "/agb");
  assert.equal(agb.state, "live");
  assert.equal(agb.wording, undefined, "nicht mehr „kanzlei-offen“");
  assert.match(agb.file, /src\/lib\/legal\/agb\.js/);
  assert.match(agb.ownerFills, /AGB-KANZLEI-2026-11-02\.md/);
  // Seite: kein Entwurfsmarker mehr (eyebrow/„· Entwurf“ hängen an AGB_STATUS)
  assert.notEqual(AGB_STATUS, "entwurf");
});
