// Widerrufsbelehrung außerhalb des Onlineshops (Inhaber 03.11.2026, Entscheidung
// Nr. 39): Text nach FAGG, Status, Seite /widerruf, Einhängung (Footer, STATIC,
// AGB, Termin, Beratung), Online-Formular ohne Bestellnummer.
// Run: node --test tests/unit/widerruf-belehrung.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  WIDERRUF_ANBIETER,
  WIDERRUF_FORMULAR_PATH,
  WIDERRUF_HINWEIS,
  WIDERRUF_MUSTERFORMULAR,
  WIDERRUF_PATH,
  WIDERRUF_SECTIONS,
  WIDERRUF_STAND,
  WIDERRUF_STATUS,
  sectionTexts,
  widerrufHinweis,
  widerrufLuecken,
  widerrufStandDe,
  widerrufText,
} from "../../src/lib/legal/widerruf.js";
import { agbText } from "../../src/lib/legal/agb.js";
import { findClaims, hasUnprovenClaim } from "../../src/lib/legal/claims.js";
import { LEGAL_TEXTS } from "../../src/components/LegalDrafts/liveStatus.js";
import { STATIC } from "../../src/lib/einblicke/routes.js";
import { LEGAL_NAME } from "../../src/lib/site.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const TEXT = widerrufText();

test("Widerruf: Status freigegeben, keine Platzhalter, Stand 03.11.2026, Anbieterin MW GmbH", () => {
  assert.equal(WIDERRUF_STATUS, "freigegeben");
  assert.deepEqual(widerrufLuecken(), [], "freigegebener Text ohne […]-Lücken");
  assert.equal(WIDERRUF_STAND, "2026-11-03");
  assert.equal(widerrufStandDe(), "03.11.2026");
  assert.equal(WIDERRUF_PATH, "/widerruf");
  assert.equal(WIDERRUF_ANBIETER.firma, LEGAL_NAME);
  assert.match(TEXT, /MW Immobilienverwaltungs GmbH/);
  assert.doesNotMatch(TEXT, /\[PLATZHALTER|\[Kanzlei|wird ergänzt|Handels-GmbH|\[●\]/);
});

test("Widerruf: Pflichtinhalte nach FAGG (Frist, Beginn, Ausnahmen § 18, Wertersatz § 16, Verlängerung § 12, Musterformular)", () => {
  const ids = WIDERRUF_SECTIONS.map((s) => s.id);
  assert.deepEqual(ids, ["geltung", "widerrufsrecht", "folgen", "vorzeitiger-beginn", "ausnahmen", "fehlende-belehrung", "erklaerung"]);
  for (const s of WIDERRUF_SECTIONS) for (const t of sectionTexts(s)) assert.ok(t.length > 20, `${s.id}: leerer Absatz`);
  for (const re of [
    /binnen vierzehn Tagen ohne Angabe von Gründen/,
    /Dienstleistung[^.]*ab dem Tag des Vertragsschlusses/,
    /Waren ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter/,
    /Fernabsatzvertrag, § 3 Z 2 FAGG/,
    /Außergeschäftsraumvertrag, § 3 Z 1 FAGG/,
    /Showroom in Lochau schließen/, // kein FAGG-Rücktritt im Geschäftsraum
    /§ 18 Abs 1 Z 3 FAGG/, // Kundenspezifikation
    /Küchen nach Maß, Einbaumöbel, Maßmöbel/,
    /§ 18 Abs 1 Z 1 FAGG/, // vollständig erbrachte Dienstleistung
    /§ 18 Abs 1 Z 5 FAGG/,
    /§ 16 FAGG/, // anteiliger Betrag
    /§ 10 FAGG/, // Verlangen auf dauerhaftem Datenträger
    /verlängert sich die Widerrufsfrist um zwölf Monate/,
    /zwölf Monate und vierzehn Tage/,
    /§ 16 Abs 2 FAGG/,
    /dasselbe Zahlungsmittel/,
    /höchstens etwa den Betrag/, // Rücksendekosten nicht paketfähiger Ware
    /holen wir sie auf unsere Kosten ab/,
    /Widerrufsbelehrung des Onlineshops/,
  ]) assert.match(TEXT, re);
  // Musterformular Anhang I Teil B wörtlich
  const mf = sectionTexts(WIDERRUF_MUSTERFORMULAR).join("\n");
  for (const re of [/Hiermit widerrufe\(n\) ich\/wir \(\*\)/, /Bestellt am \(\*\)\/erhalten am \(\*\)/, /Unterschrift des\/der Verbraucher\(s\)/, /\(\*\) Unzutreffendes streichen\./]) assert.match(mf, re);
  assert.match(mf, new RegExp(`An ${LEGAL_NAME}`));
});

test("Widerruf: keine erfundenen Zahlen, keine Händler-/Markenaussagen, kein KI-Wortlaut", () => {
  let t = TEXT.replaceAll(WIDERRUF_ANBIETER.telefon, "").replaceAll(WIDERRUF_ANBIETER.anschrift, "");
  t = t.replace(/\([^)]*(?:§|Art\.)[^)]*\)/g, "").replace(/(?:§§?|Art\.|Teil [IVX]+ §)\s*\d+[a-z]?(?:\.\d+)?(?:\s*(?:ff\.|Abs|Z|Satz|Nr\.|und|bis|,)\s*\d*[a-z]?)*/g, "");
  const rest = t.match(/[^\n]{0,30}\d+[^\n]{0,30}/g) || [];
  assert.deepEqual(rest, [], `verbliebene Zahlen: ${rest.join(" | ")}`);
  assert.doesNotMatch(TEXT, /€|EUR\b|Prozent\b/);
  assert.deepEqual(findClaims(TEXT), []);
  assert.equal(hasUnprovenClaim(TEXT), false);
  assert.doesNotMatch(TEXT, /\bKI\b|künstliche Intelligenz|Claude|Anthropic/i);
  assert.doesNotMatch(TEXT, /Minotti|Poliform|Ezarri|Gaggenau|Miele|Riedel|Baobab/i);
  for (const f of ["src/lib/legal/widerruf.js", "src/app/[locale]/widerruf/page.js"]) assert.doesNotMatch(read(f), /Claude|Anthropic|KI-Agent/);
});

test("Widerruf: Seite /widerruf (vier Sprachen, noindex, Inhalt, Druck, Shop-Links nur bei aktivem Shop)", () => {
  const page = read("src/app/[locale]/widerruf/page.js");
  assert.match(page, /LOCALES = \["de", "en", "fr", "it"\]/);
  assert.match(page, /robots: \{ index: false, follow: true \}/);
  assert.match(page, /GermanOnlyNotice/);
  assert.match(page, /aria-label="Inhalt"/);
  assert.match(page, /PrintButton/);
  assert.match(page, /WIDERRUF_STATUS === "entwurf"/);
  assert.match(page, /shopActive\(\)/);
  assert.match(page, /shop && <a href=\{`\/\$\{locale\}\$\{WIDERRUF_SHOP_PATH\}`\}/);
  assert.match(page, /s\.id === "erklaerung" && shop/);
  assert.match(page, /WIDERRUF_MUSTERFORMULAR/);
  assert.equal(WIDERRUF_FORMULAR_PATH, "/shop/recht/widerruf-formular");
  assert.match(page, /AGB_PATH/);
});

test("Widerruf: eingehängt in STATIC, Footer (vier Sprachen), Live-Status, AGB Teil II § 7, Termin und Beratung", () => {
  assert.ok(STATIC.includes("/widerruf"));
  const footer = read("src/components/Reusable/Footer.js");
  assert.match(footer, /localizeHref\("\/widerruf", locale\)/);
  assert.match(footer, /t\("withdrawal"\)/);
  for (const l of ["de", "en", "fr", "it"]) {
    const m = JSON.parse(read(`src/messages/${l}.json`));
    assert.ok(m.Footer.withdrawal, `${l}: Footer.withdrawal`);
    assert.ok(WIDERRUF_HINWEIS[l]?.text && WIDERRUF_HINWEIS[l]?.link, `${l}: Hinweis`);
    assert.doesNotMatch(WIDERRUF_HINWEIS[l].text, /!/);
  }
  assert.equal(widerrufHinweis("xx"), WIDERRUF_HINWEIS.en);
  // noindex → nicht in der Sitemap (wie /agb)
  assert.doesNotMatch(read("src/lib/seo/sitemapEntries.js"), /["']\/widerruf["']/);
  assert.doesNotMatch(read("src/lib/seo/sitemap/extraPages.js"), /["']\/widerruf["']/);
  const t = LEGAL_TEXTS.find((x) => x.id === "widerrufsbelehrung");
  assert.equal(t.state, "live");
  assert.equal(t.livePath, "/widerruf");
  // AGB verweisen auf die Belehrung
  assert.match(agbText(), /platzhirsch\.studio\/widerruf/);
  // Termin- und Beratungsformular: ein Satz mit Link, Ablauf unverändert
  const bw = read("src/components/Termin/BookingWizard.js");
  assert.match(bw, /widerrufHinweis\(locale\)\.text/);
  assert.match(bw, /href=\{`\/\$\{locale\}\$\{WIDERRUF_PATH\}`\}/);
  assert.match(bw, /data-termin-widerruf/);
  const bc = read("src/components/BeratungClient/BeratungClient.js");
  assert.match(bc, /step === TOTAL && \(/);
  assert.match(bc, /widerrufHinweis\(locale\)\.link/);
  assert.match(bc, /data-beratung-widerruf/);
});

test("Widerruf: Online-Formular ohne Bestellnummer nutzbar (Feld optional, Hinweis auf /widerruf)", () => {
  const form = read("src/components/Shop/WiderrufForm.js");
  assert.match(form, /name="bestellung" label="Bestellnummer" optionalText="optional"/);
  assert.doesNotMatch(form, /if \(f\.bestellung\.trim\(\)\.length < 6\) e\.bestellung/);
  const page = read("src/app/[locale]/shop/recht/widerruf-formular/page.js");
  assert.match(page, /Eine Bestellnummer brauchen Sie nur bei Bestellungen im Onlineshop/);
  assert.match(page, /href="\/widerruf"/);
  assert.match(read("src/lib/shop/widerruf.js"), /bestellung: trim\(40\)\s*\.nullish\(\)/);
});
