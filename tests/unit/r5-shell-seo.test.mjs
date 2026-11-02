// R5-shell-seo: contracts of this round.
//   node --test tests/unit/r5-shell-seo.test.mjs
// 1. Layout renders siteSchema() (no inline Organization, brand only via the
//    dealer filter of src/lib/legal, LocalBusiness facts from src/lib/site.js,
//    no aggregateRating), one og:locale map.
// 2. Breadcrumbs: "Startseite" as the German home step, middle steps without
//    a page are left out of the BreadcrumbList JSON-LD.
// 3. SearchDialog: 429/error notice in the aria-live region, 4 languages.
// 4. Consent/portal bars: layout only (names, cookie and texts unchanged).
// 5. Dead files, Merkliste image.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteSchema, organizationNode, areaServed } from "../../src/lib/seo/siteSchema.js";
import { ADDRESS, AREA_SERVED, GBP, LEGAL_NAME, SOCIAL, openingHoursSpecification } from "../../src/lib/site.js";
import { isVerifiedDealerBrand, toBrandSlug } from "../../src/lib/legal/claims.js";
import { OG_LOCALE, ogLocale } from "../../src/lib/seo/pageMetadata.js";
import { HOME_CRUMB, breadcrumbSchemaItems, homeCrumbLabel, normalizeHomeCrumb } from "../../src/lib/seo/breadcrumbs.js";
import { validateRichResult, richResultKind } from "../../src/lib/seo/audit/seoAudit.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const code = (file) => read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const LAYOUT = "src/app/[locale]/layout.js";

// ------------------------------------------------------------------ 1 schema
test("Layout: siteSchema() statt Inline-Objekt, keine Markenliste, kein aggregateRating", () => {
  const src = code(LAYOUT);
  assert.match(src, /import \{ siteSchema \} from "@\/lib\/seo\/structuredData"/);
  assert.match(src, /siteSchema\(\{\s*"openingHoursSpecification": openingHoursSpecification\(\),?\s*\}\)/);
  assert.match(src, /import \{ openingHoursSpecification \} from "@\/lib\/site"/);
  assert.match(src, /<JsonLd data=\{SITE_SCHEMA\} \/>/);
  assert.doesNotMatch(src, /"@type": \["Organization", "FurnitureStore"\]|"brand"\s*:|Minotti|aggregateRating/);
  assert.doesNotMatch(src, /Landstraße|\+43 5574/, "keine hartcodierte NAP im Layout");
});

test("siteSchema(): nur Öffnungszeiten überschreibbar, brand/Rating/Adresse nicht", () => {
  const org = siteSchema({
    openingHoursSpecification: openingHoursSpecification(),
    brand: [{ "@type": "Brand", name: "Minotti" }],
    aggregateRating: { ratingValue: 5 },
    address: {},
  })["@graph"][0];
  assert.deepEqual(org, organizationNode());
  assert.deepEqual(siteSchema(), siteSchema({}));
});

test("LocalBusiness aus site.js: legalName, Landstraße 11, Öffnungszeiten, sameAs, areaServed", () => {
  const org = organizationNode();
  assert.equal(org.legalName, LEGAL_NAME);
  assert.equal(org.address.streetAddress, "Landstraße 11");
  assert.equal(org.address.streetAddress, ADDRESS.street);
  assert.deepEqual(org.openingHoursSpecification, openingHoursSpecification());
  assert.deepEqual(org.sameAs, [...SOCIAL.map((s) => s.href), GBP.mapsUrl]);
  for (const url of org.sameAs) assert.match(url, /^https:\/\//);
  assert.equal(org.hasMap, GBP.mapsUrl);
  assert.deepEqual(org.areaServed, areaServed());
  // F6 (28.10.2026): Städte, deren Regionsseite den Doorway-Audit nicht besteht, stehen
  // nicht in areaServed. Runde 3 P5: Bregenz, Lindau, Dornbirn, St. Gallen und
  // Friedrichshafen bestehen jetzt (eigene Fakten) und stehen drin; statt ganzer Länder
  // (Österreich, Deutschland, Schweiz – Entscheidung Nr. 3, r3-seo P2-5) Regionen.
  const names = org.areaServed.map((a) => a.name);
  for (const city of ["Bregenz", "Dornbirn", "Lindau", "Friedrichshafen", "St. Gallen"]) assert.ok(names.includes(city), city);
  for (const city of ["Kempten", "Ravensburg"]) assert.ok(!names.includes(city), city);
  for (const name of ["Vorarlberg", "Bodensee", "Rheintal", "Ostschweiz", "Liechtenstein"]) assert.ok(names.includes(name), name);
  for (const name of ["Österreich", "Schweiz", "Deutschland"]) assert.ok(!names.includes(name), name);
  // Café im selben Haus: gleiche Adresse wie das Studio.
  // Bewusst geändert 31.10.2026 (GEO-Prüfung, Quelle platzhirsch.cafe + Lochau Tourismus):
  // das Café hat eigene Telefonnummer und eigene Öffnungszeiten (Di–So 9–24 Uhr),
  // nicht die des Showrooms.
  assert.equal(org.containsPlace["@type"], "CafeOrCoffeeShop");
  assert.deepEqual(org.containsPlace.address, org.address);
  assert.equal(org.containsPlace.telephone, "+43 5574 46257");
  assert.notEqual(org.containsPlace.telephone, org.telephone);
  assert.deepEqual(org.containsPlace.openingHoursSpecification[0].dayOfWeek, ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
  assert.equal(org.containsPlace.openingHoursSpecification[0].opens, "09:00");
  assert.equal(richResultKind(org), "LocalBusiness");
  assert.deepEqual(validateRichResult(org), []);
});

test("brand nur über den Händler-Filter (src/lib/legal), nie aggregateRating/review/offers", () => {
  const org = organizationNode();
  for (const b of org.brand || []) assert.ok(isVerifiedDealerBrand(b.name), b.name);
  // Ezarri seit Inhaber-Entscheidung Nr. 7 (28.10.2026) im Claim-Register.
  // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti und die 7 Bad-&-Wellness-Marken kommen hinzu.
  // Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): die 6 Küchengeräte-Marken kommen hinzu.
  // Inhaber-Entscheidungen Nr. 27/28 (bewusst geändert, SEO-Team A 31.10.2026): Baobab Collection, Riedel und Cire Trudon kommen hinzu (DEALER_ONLY_BRANDS).
  assert.deepEqual((org.brand || []).map((b) => b.name), [
    // Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): Flos und Tom Dixon (Showroom-Marken mit Markenseite) laufen durch den Händler-Filter.
    "Minotti", "Flos", "Tom Dixon", "ClassiCon", "Ezarri",
    "Dornbracht", "antoniolupi", "Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura",
    "Gaggenau", "Miele", "V-ZUG", "BORA", "Liebherr", "Quooker",
    "Baobab Collection", "Riedel", "Cire Trudon",
    "Zalto", "Assouline", "Kähler", "Lyngby Porcelæn",
  ]);
  for (const n of ["Poliform", "Rimadesio", "Agape", "Paola Lenti"]) assert.ok(!(org.brand || []).some((b) => b.name === n), n);
  const json = JSON.stringify(siteSchema());
  assert.doesNotMatch(json, /aggregateRating|"review"|"offers"|händler|offiziell|größte|führend/i);
  // SEO-Team A (bewusst geändert, 31.10.2026): dealerStudio kommt für subjectOf (Minotti-Pressemeldung, GEO W2) hinzu.
  assert.match(read("src/lib/seo/siteSchema.js"), /import \{ (?:dealerStudio, )?isVerifiedDealerBrand, toBrandSlug \} from "\.\.\/legal\/claims\.js"/);
});

test("og:locale: eine Karte (de_AT, en_GB, fr_FR, it_IT) in Layout, Marken und Merkliste", () => {
  assert.deepEqual({ ...OG_LOCALE }, { de: "de_AT", en: "en_GB", fr: "fr_FR", it: "it_IT" });
  assert.equal(ogLocale("xx"), "de_AT");
  for (const file of [
    LAYOUT,
    "src/app/[locale]/ueber-uns/marken/page.js",
    "src/app/[locale]/ueber-uns/marken/[title]/page.js",
    "src/app/[locale]/merkliste/page.js",
    "src/lib/marken/brandCategoryPage.js",
    "src/lib/marken/collectionPage.js",
    "src/lib/seo/pageMetadata.js",
  ]) {
    const src = code(file);
    assert.match(src, /ogLocale\(/, file);
    assert.doesNotMatch(src, /"de_DE"|"en_US"|meta\?\.locale/, file);
  }
});

// ------------------------------------------------------------- 2 breadcrumbs
test("Brotkrumen: Startseite auf DE, Sprachname sonst; generisches Home wird ersetzt", () => {
  assert.deepEqual({ ...HOME_CRUMB }, { de: "Startseite", en: "Home", fr: "Accueil", it: "Home" });
  assert.equal(homeCrumbLabel("de"), "Startseite");
  assert.equal(normalizeHomeCrumb("Home", "de"), "Startseite");
  assert.equal(normalizeHomeCrumb("HOME", "fr"), "Accueil");
  assert.equal(normalizeHomeCrumb("Marken", "de"), "Marken");
  const ui = code("src/components/ui/Breadcrumbs.js");
  assert.match(ui, /normalizeHomeCrumb\(item\.label, locale\)/);
  assert.match(ui, /breadcrumbSchemaItems\(items/);
  for (const file of [
    "src/app/[locale]/ueber-uns/marken/page.js",
    "src/app/[locale]/ueber-uns/marken/[title]/page.js",
    "src/components/MarkenClient/Marken.js",
    "src/app/[locale]/merkliste/page.js",
  ]) {
    const src = code(file);
    assert.match(src, /homeCrumbLabel\(locale\)/, file);
    assert.doesNotMatch(src, /\? "Home"|: "Home"/, file);
  }
  assert.match(code("src/lib/marken/brandCategoryPage.js"), /normalizeHomeCrumb\(tr\("breadcrumbHome"\), l\)/);
});

test("BreadcrumbList: Zwischenstufe ohne Seite fällt weg, alle Stufen außer der letzten mit item", () => {
  const items = breadcrumbSchemaItems(
    [{ label: "Startseite", href: "/" }, { label: "Über uns" }, { label: "Platzhirsch" }],
    "https://platzhirsch.studio/de"
  );
  assert.deepEqual(items, [
    { "@type": "ListItem", position: 1, name: "Startseite", item: "https://platzhirsch.studio/de" },
    { "@type": "ListItem", position: 2, name: "Platzhirsch" },
  ]);
  assert.deepEqual(validateRichResult({ "@type": "BreadcrumbList", itemListElement: items }), []);
  const withPages = breadcrumbSchemaItems([{ label: "Startseite", href: "/" }, { label: "Marken", href: "/ueber-uns/marken" }, { label: "Minotti" }], "https://platzhirsch.studio/de");
  assert.equal(withPages.length, 3);
  assert.equal(withPages[1].item, "https://platzhirsch.studio/de/ueber-uns/marken");
});

// --------------------------------------------------------------- 3 search 429
test("SearchSheet: 429 und Fehler werden im aria-live-Bereich angesagt", () => {
  const src = read("src/components/Navbar/SearchSheet.js");
  assert.match(src, /res\.status === 429 \? "rateLimited" : "error"/);
  assert.match(src, /<div aria-live="polite"[^>]*>\s*\{showResults &&\s*\(status !== "ok"/);
  assert.match(src, /t\.has\(key\) \? t\(key\)/);
});

test("messages-r5-shell.json: gleiche Schlüssel in 4 Sprachen, SearchSheet-Ersatztexte identisch", async () => {
  const msgs = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r5-shell.json"));
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
  const de = keys(msgs.de);
  for (const l of ["en", "fr", "it"]) assert.deepEqual(keys(msgs[l]), de, l);
  assert.equal(msgs.de.marken.breadcrumbHome, "Startseite");
  // The fallback table in SearchSheet.js says the same as the proposal.
  const src = read("src/components/Navbar/SearchSheet.js");
  for (const l of ["de", "en", "fr", "it"]) {
    for (const k of ["searchRateLimited", "searchError"]) {
      assert.ok(src.includes(JSON.stringify(msgs[l].Navbar[k])), `${l}.${k}`);
    }
  }
  assert.doesNotMatch(msgs.it.Navbar.searchRateLimited + msgs.it.Navbar.searchError, /\b(Lei|voi|Riprovi|prema)\b/);
});

// ------------------------------------------------------- 4 consent / portal bar
test("Consent-Leiste: nur Layout geändert, Knöpfe weiter ≥ 44 px, Portal-Leiste bekommt Platz", () => {
  const src = read("src/components/Cookies/cookiecomponent.js");
  assert.match(src, /const CONSENT_COOKIE = "cookieConsent";/);
  assert.match(src, /const CONSENT_EVENT = "ph-consent-change";/);
  assert.match(src, /"inline-flex min-h-11 items-center justify-center border border-ink/);
  assert.match(src, /setProperty\("--ph-consent-h"/);
  for (const key of ["acceptAll", "rejectAll", "customize", "bannerTitle", "bannerText"]) assert.match(src, new RegExp(`t\\("${key}"\\)`));
  const css = read("src/app/globals.css");
  assert.match(css, /body:has\(nav\[class\*="bottom-\[var\(--ph-consent-h"\]\) \{\s*padding-bottom: calc\(var\(--ph-consent-h, 0px\) \+ 4rem/);
  // The hook the CSS relies on is still the portal bar's class.
  assert.match(read("src/components/Portal/Core/PortalNav.js"), /bottom-\[var\(--ph-consent-h,0px\)\]/);
});

// --------------------------------------------------------- 5 dead files, image
test("breadcrumbBar.js gelöscht (0 Leser); Merkliste lädt das verkleinerte Bild", () => {
  assert.ok(!fs.existsSync(path.join(root, "src/components/Reusable/breadcrumbBar.js")));
  const merk = code("src/app/[locale]/merkliste/page.js");
  // Runde 5 (P3, ux P2-9, bewusst geänderte Erwartung): die Merkliste zeigt
  // kein Kopfbild mehr (Herkunft laut bildrechte.csv unbekannt, Leerzustand
  // im ersten Bildschirm); Kontakt nutzt das verkleinerte Bild weiter.
  assert.doesNotMatch(merk, /image: "\/Images\/Newsletter\/room/);
  assert.ok(fs.statSync(path.join(root, "public/Images/Newsletter/room-1600.jpg")).size < 400_000);
  // PageHeader requests it with real sizes and quality 50 (no 100vw).
  const ph = read("src/components/UberUns/PageHeader.js");
  assert.match(ph, /sizes=\{caption \? "\(min-width: 640px\) 176px, 144px" : IMAGE_SIZES\}/);
  assert.doesNotMatch(ph, /sizes="100vw"/);
});
