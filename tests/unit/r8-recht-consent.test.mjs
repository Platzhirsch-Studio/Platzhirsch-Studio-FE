// R8-recht (Fix-Team P2-recht-texte-consent, Runde 3):
//   1 EN/FR/IT-Rechtsseiten: deutscher Textkörper lang="de", Hinweis in der
//     Seitensprache (r3-recht-inhalt P1-2, WCAG 3.1.2)
//   2 Datenschutz: Abschnitt E-Mail-Versand nach dem Code (Resend/Postmark, USA)
//   3 Erklärung = Dialog: jede Einwilligungs-Kategorie der Erklärung hat einen
//     sichtbaren Schalter, sonst ist sie entfernt (r3-recht-inhalt P1-4)
//   4 „Rundgang“ im Consent-Text nur mit echtem Splat (gesamtwerk P1-6)
//   5 Impressum: CHAMBER null → keine Kammer-Zeile, keine erfundenen Werte
//   node --test tests/unit/r8-recht-consent.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const imp = (p) => import(pathToFileURL(path.join(ROOT, "src", p)).href);
/** Source without full-line comments and without JSX block comments. */
const code = (p) => read(p).replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

let S;
let showroom;
before(async () => {
  S = await imp("lib/legal/services.js");
  showroom = await imp("lib/showroom/config.js");
});

// ------------------------------------------------------------ 3 Erklärung = Dialog
test("jede Einwilligungs-Kategorie der Erklärung hat einen sichtbaren Schalter (mit und ohne Ads-Kennung)", () => {
  for (const adsActive of [false, true]) {
    const visible = S.visibleConsentServices({ adsActive });
    const switches = new Set(Object.values(visible).flat());
    const sections = S.consentPolicySections({ adsActive });
    assert.ok(sections.length > 0);
    for (const s of sections) assert.ok(switches.has(s.service), `${s.id} ohne Schalter (adsActive=${adsActive})`);
    // and the other way round: every switch is explained
    const explained = new Set(sections.map((s) => s.service));
    for (const key of switches) assert.ok(explained.has(key), `Schalter ${key} ohne Abschnitt`);
    assert.equal("marketing" in visible, adsActive, "Marketing-Schalter nur mit Ads-Kennung");
    assert.equal(sections.some((s) => s.id === "google-ads"), adsActive);
  }
  // Without NEXT_PUBLIC_GOOGLE_ADS_ID (repo state): no Ads anywhere.
  if (!process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) {
    assert.equal(S.ADS_ACTIVE, false);
    // Own heatmap "einblicke" only while NEXT_PUBLIC_EINBLICKE runs it (dev/tests on, production off).
    const statistics = S.EINBLICKE_ACTIVE ? ["googleAnalytics", "einblicke"] : ["googleAnalytics"];
    assert.deepEqual(S.visibleConsentServices(), { functional: ["googleMaps"], statistics });
  }
  // Production without the switch: no heatmap switch and no heatmap section.
  assert.deepEqual(S.visibleConsentServices({ adsActive: false, einblickeActive: false }), { functional: ["googleMaps"], statistics: ["googleAnalytics"] });
  assert.ok(!S.consentPolicySections({ einblickeActive: false }).some((s) => s.service === "einblicke"));
});

test("Datenschutz rendert Google-Abschnitte nur über consentPolicySections, Ads-Text nur im Entwurf", () => {
  const ds = code("src/components/Datenschutz/datenschutz.js");
  assert.match(ds, /import \{ consentPolicySections \} from "@\/lib\/legal\/services"/);
  for (const id of ["google-maps", "google-analytics", "google-ads"]) {
    // every H3 of a consent service sits behind consentSections.has("<id>")
    const at = ds.indexOf(`<H3 id="${id}">`);
    assert.ok(at > 0, id);
    const guard = ds.lastIndexOf(`consentSections.has("${id}")`, at);
    assert.ok(guard > 0 && at - guard < 120, `${id}: Abschnitt hängt am Schalter`);
  }
  assert.doesNotMatch(ds, /Derzeit setzen wir Google Ads|ist für Google Ads vorgesehen|GOOGLE_TAG_IDS/);
  // The banner uses the same rule (no second copy of the filter).
  const banner = code("src/components/Cookies/cookiecomponent.js");
  assert.match(banner, /const VISIBLE_BY_CATEGORY = visibleConsentServices\(\);/);
  assert.doesNotMatch(banner, /id !== "googleAds"/);
  // The draft for the law firm keeps the Google-Ads section.
  assert.match(read("src/components/LegalDrafts/docs/datenschutz.js"), /id: "google-ads"/);
});

// ------------------------------------------------------------- 4 Rundgang
test("Consent-Text nennt den Rundgang nur, wenn showroom/config einen echten Splat meldet", () => {
  assert.equal(S.SHOWROOM_TOUR_LIVE, showroom.SHOWROOM_PUBLIC);
  const keys = ["bannerText", "categories.functional.description", "services.googleMaps.description"];
  for (const locale of ["de", "en", "fr", "it"]) {
    for (const key of keys) {
      const neutral = S.mapsConsentOverride(key, locale, { tourLive: false });
      assert.ok(neutral, `${locale}.${key}`);
      assert.doesNotMatch(neutral, /Rundgang|\btour\b|carte et visite|visite Street|\bvisita\b/i, `${locale}.${key}`);
      assert.match(neutral, /Street View|Street-View|Google Maps/);
      assert.equal(S.mapsConsentOverride(key, locale, { tourLive: true }), null, "mit Splat: Messages");
    }
  }
  // Repo state: no real recording → neutral texts active.
  if (!showroom.SHOWROOM_PUBLIC) assert.ok(S.mapsConsentOverride("bannerText", "de"));
  const banner = code("src/components/Cookies/cookiecomponent.js");
  assert.match(banner, /mapsConsentOverride\("bannerText", locale\) \?\? t\("bannerText"\)/);
  assert.match(banner, /tc\(`categories\.\$\{category\}\.description`\)/);
  assert.match(banner, /tc\(`services\.\$\{id\}\.description`\)/);
  // Privacy policy and register: no "Rundgang" for Google Maps.
  assert.doesNotMatch(code("src/components/Datenschutz/datenschutz.js"), /Rundgang/);
  const maps = S.getService("googleMaps");
  assert.doesNotMatch(maps.name + maps.purpose, /Rundgang/);
});

// --------------------------------------------------------- 2 E-Mail-Versand
test("Datenschutz: E-Mail-Versand nach dem Code (nur Resend, USA), Kanzlei-Vermerk nur intern", () => {
  const raw = read("src/components/Datenschutz/datenschutz.js");
  const jsx = code("src/components/Datenschutz/datenschutz.js");
  const section = jsx.slice(jsx.indexOf('id="mailversand"'), jsx.indexOf('id="rechte"'));
  assert.ok(section.length > 100, "Abschnitt E-Mail-Versand vorhanden");
  assert.match(section, /MAIL_SERVICE.name/);
  // Bewusst geändert (Runde 4, r4-recht-inhalt P1-2, Fix-Team P6): nur noch EIN
  // Versanddienst, Resend (einziger Dienst in allen drei Mail-Wegen des Codes),
  // die Oder-Formulierung mit Postmark ist gestrichen; Übermittlungsgrundlage
  // USA als Platzhalter-Satz (MAIL_SERVICE.transferBasis).
  assert.match(raw, /name: "Resend"/);
  assert.doesNotMatch(section, /Postmark/);
  assert.match(raw, /transferBasis:[\s\S]*Data Privacy Framework[\s\S]*Standardvertragsklauseln/);
  assert.match(section, /USA/);
  assert.match(section, /Art\. 6 Abs\. 1 lit\. b DSGVO/);
  assert.doesNotMatch(section, /\[/, "keine eckige Klammer öffentlich");
  // the providers really are in the code
  assert.match(read("src/lib/portal/mailer.js"), /api\.resend\.com[\s\S]*api\.postmarkapp\.com/);
  assert.match(read("src/lib/stilfinder/mail.js"), /api\.resend\.com[\s\S]*api\.postmarkapp\.com/);
  assert.doesNotMatch(read("src/lib/forms/forward.js"), /resend|postmark/i, "Formulare gehen nur ans Backoffice");
  // [Kanzlei prüfen] lives in the register and the internal status, not on the page
  const mail = S.getService("mailDelivery");
  assert.match(mail.legalBasis, /\[Kanzlei prüfen\]/);
  assert.match(mail.thirdCountry, /USA/);
  // internal status: no brackets (f4-kundentext-waechter scans the strings)
  // Bewusst geändert (Inhaber-Entscheidung Nr. 11): von der Kanzlei freigegeben.
  assert.match(raw, /approvedByLawFirm:[\s\S]*"E-Mail-Versand:[^"]*Kanzlei freigegeben"/);
  // Hoster: not in the repo → neutral on the page, placeholder only in the register
  assert.match(raw, /hosterInRepo: false/);
  assert.match(S.getService("hosting").provider, /^\[Hoster/);
  assert.match(jsx, /bei einem Hosting-Dienstleister/);
});

// ------------------------------------------------- 1 lang="de" + Hinweis
test("EN/FR/IT: deutscher Textkörper mit lang=\"de\", Hinweis in der Seitensprache, Canonical/Hreflang unverändert", () => {
  const notice = read("src/components/Legal/GermanOnlyNotice.js");
  assert.match(notice, /en: "This page is only available in German\. The German version is authoritative\."/);
  assert.match(notice, /fr: "Cette page n’est disponible qu’en allemand\. La version allemande fait foi\."/);
  assert.match(notice, /it: "Questa pagina è disponibile solo in tedesco\. Fa fede la versione tedesca\."/);
  assert.match(code("src/components/Impressum/LegalProse.js"), /<div lang="de" data-legal-body="" className=\{PROSE\}>/);
  // Erwartung bewusst geändert (Rat 9,5 A16, QA Recht −0,1): Die Datenschutzseite
  // hat auf EN/FR/IT H1, Brotkrume und Kurzfassung in der Seitensprache
  // (Datenschutz/kurzfassung.js, geprüft in rat95-recht-dse.test.mjs); der
  // deutsche Volltext bleibt lang="de". Das Impressum bleibt wie bisher.
  for (const [file, word] of [["src/components/Impressum/impressumbanner.js", "Impressum"]]) {
    const src = code(file);
    // QM-Endabnahme 02.11.2026, bewusst geändert: H1 darf weiche Trennstellen (U+00AD) tragen (200-%-Zoom).
    assert.match(src, new RegExp(`title=\\{germanText\\("${word.split("").join("\\u00AD?")}", locale\\)\\}`), file);
    assert.match(src, new RegExp(`label: germanText\\("${word}", locale\\)`), file);
    assert.match(src, /lead=\{locale !== "de" \? <GermanOnlyNotice locale=\{locale\} \/> : undefined\}/, file);
  }
  for (const route of ["datenschutz", "impressum"]) {
    const page = read(`src/app/[locale]/${route}/page.js`);
    assert.match(page, /canonical: PAGE_URL/);
    assert.match(page, /languages: hreflangLanguages\(/);
  }
});

// ---------------------------------------------------------- 5 Impressum
test("Impressum: CHAMBER ohne belegte Werte → Zeile ausgeblendet, nichts erfunden", () => {
  const src = read("src/components/Impressum/impressum.js");
  const chamber = src.slice(src.indexOf("export const CHAMBER"), src.indexOf("});", src.indexOf("export const CHAMBER")));
  // 30.10.2026: Kammer aus WKO Firmen A–Z belegt (Quelle + Datum Pflicht).
  assert.match(chamber, /chamber: "Wirtschaftskammer Vorarlberg"/);
  assert.match(chamber, /"Fachgruppe Gastronomie", "Landesgruppe Elektro- und Einrichtungsfachhandel"/);
  assert.match(chamber, /source: "WKO Firmen A–Z/);
  assert.match(chamber, /checkedAt: "2026-10-30"/);
  assert.match(src, /if \(!c\?\.chamber \|\| !groups\.length \|\| !c\.source \|\| !c\.checkedAt\) return null;/);
  assert.match(src, /\{chamber && \(/);
});
