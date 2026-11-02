// R6-shell-perf: contracts of the shell round 6.
//   node --test tests/unit/r6-shell-perf.test.mjs
// 1. Language switch: every top-level page that 404s outside "de" is in the
//    German-only list (EN/FR/IT then lead to the home page), plus the
//    visible note (Shell.header.germanOnlyNote in all 4 catalogues).
// 2. Global 404 / global-error: house fonts from the font definitions file,
//    no cookies()/headers().
// 3. TBT: mega-menu panels as server HTML, consent bar after idle.
// 4. FadeInView gone, ConsentEmbed props, Merkliste image quality.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expectedFor, itExpected, itExpectedTree } from "./r5-i18n-voi.lib.mjs"; // Runde 4: IT voi (tools/i18n/patches/r4-p2-it-voi.json)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const code = (file) => read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

function germanOnlySet() {
  const nav = read("src/components/Navbar/shellNav.js");
  const block = nav.match(/GERMAN_ONLY_FIRST_SEGMENTS = new Set\(\[([\s\S]*?)\]\);/)[1];
  // Welle 2: "<segment>@en" = German and English (FR/IT 404/308) – counts as listed.
  const set = new Set([...block.matchAll(/^\s*"([^"@]+)(?:@[a-z,]+)?",/gm)].map((m) => m[1]));
  for (const m of read("src/lib/content/landingPages.js").matchAll(/slug: "([^"]+)"/g)) set.add(m[1]);
  for (const m of read("src/lib/seo/sitemap/extraPages.js").matchAll(/path: "\/([^"]+)"/g)) set.add(m[1]);
  return set;
}

test("Sprachumschalter: jede DE-only-Seite steht in der Liste (kein 404 aus EN/FR/IT)", () => {
  const set = germanOnlySet();
  const dir = path.join(root, "src/app/[locale]");
  const missing = [];
  for (const seg of fs.readdirSync(dir)) {
    const page = path.join(dir, seg, "page.js");
    if (!fs.existsSync(page) || seg.startsWith("[")) continue;
    const src = fs.readFileSync(page, "utf8");
    // Sprach-Integration 01.11.2026 (bewusst geändert): nur die reine Sperre
    // `locale !== "de") notFound()`; `locale !== "de" && !copy` (Einkaufen aus der
    // Schweiz, Dreiländer-Rechner) liefert EN/FR/IT aus.
    if (/locale !== ["']de["']\s*\)\s*notFound\(\)/.test(src) && !set.has(seg) && !seg.startsWith("designermoebel-")) missing.push(seg);
  }
  assert.deepEqual(missing, [], `fehlen in GERMAN_ONLY_FIRST_SEGMENTS: ${missing.join(", ")}`);
  for (const seg of ["ratgeber", "projekte", "gutscheine", "gutscheinbedingungen", "atelierverkauf", "bewerten"]) {
    assert.ok(set.has(seg), seg);
  }
});

test("Sprachumschalter: sichtbarer Hinweis 'nur Deutsch' aus den Katalogen, keine Ersatztabelle", () => {
  const labels = code("src/components/Navbar/shellLabels.js");
  assert.match(labels, /germanOnlyNote: c\("header\.germanOnlyNote"\)/);
  assert.doesNotMatch(labels, /GERMAN_ONLY_NOTE\b|tShell/, "Text nur an einer Stelle (src/messages)");
  const proposal = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r6-shell.json"));
  for (const locale of ["de", "en", "fr", "it"]) {
    const text = JSON.parse(read(`src/messages/${locale}.json`)).Shell?.header?.germanOnlyNote;
    assert.ok(text, `${locale}: Shell.header.germanOnlyNote fehlt`);
    assert.equal(text, expectedFor(locale, "Shell.header.germanOnlyNote", proposal[locale].Shell.header.germanOnlyNote), `${locale}: weicht vom Vorschlag ab`);
  }
  const sw = read("src/components/Navbar/LanguageSwitcher.js");
  assert.match(sw, /isGermanOnlyPath\(pathname, germanOnly\)/);
  assert.equal((sw.match(/= useGermanOnlyNote\(labels, germanOnly\)/g) || []).length, 2, "Kopf-Liste und LanguageList zeigen den Hinweis");
  // The links stay links (no disabled controls) and hreflang stays on them.
  assert.match(sw, /hrefLang=\{lang\.code\}/);
  for (const f of ["src/components/Navbar/navbar.js", "src/components/Reusable/Footer.js"]) assert.match(read(f), /shellLabels\(c, locale\)/, f);
});

test("Globale 404 und global-error: Hausschriften, keine Request-Daten", () => {
  const fonts = read("src/components/Reusable/fonts.js");
  assert.match(fonts, /const bodoni = Bodoni_Moda\(/);
  assert.match(fonts, /const instrument = Instrument_Sans\(/);
  // `export const x = Font()` breaks Turbopack 16.3 as soon as a client module imports the file.
  assert.doesNotMatch(fonts, /export const \w+ = (Bodoni_Moda|Instrument_Sans|Montserrat)\(/);
  assert.match(fonts, /export const HOUSE_FONT_VARIABLES = `\$\{bodoni\.variable\} \$\{instrument\.variable\}`/);
  const nf = code("src/app/not-found.js");
  assert.match(nf, /className=\{HOUSE_FONT_VARIABLES\}/);
  assert.doesNotMatch(nf, /Montserrat|next\/font|cookies\(|headers\(/);
  const layout = code("src/app/[locale]/layout.js");
  assert.match(layout, /from "@\/components\/Reusable\/fonts"/);
  assert.doesNotMatch(layout, /next\/font\/google/);
  const ge = read("src/app/global-error.js");
  assert.match(ge, /const FONT_VARS = /);
  assert.match(ge, /style=\{FONT_VARS\}/);
  assert.doesNotMatch(ge, /cookies\(|headers\(/);
  // Family names = the @font-face names next/font writes ("Bodoni Moda", "Instrument Sans").
  assert.match(ge, /"--font-bodoni": "\\"Bodoni Moda\\""/);
  assert.match(ge, /"--font-instrument": "\\"Instrument Sans\\""/);
});

// R4 technik P1-2 (bewusst geändert): Die Panel-HTML reiste als Prop doppelt
// mit jeder Seite (Server-HTML + maskierte RSC-Kopie, ≈ 77 KB auf /de). Jetzt
// bekommt die Insel schlanke Daten (desktopRooms) und baut dasselbe Markup mit
// megaPanelHtml() erst beim ersten Öffnen – weiter ein Element pro Panel,
// keine hydrierten Link-Elemente, kein lucide-react.
test("TBT: Mega-Menü-Inhalte als HTML-String erst beim Öffnen, nicht im RSC-Payload", () => {
  const dn = code("src/components/Navbar/DesktopNav.js");
  assert.match(dn, /dangerouslySetInnerHTML=\{\{ __html: panelHtml\(room\) \}\}/);
  assert.match(dn, /\{expanded && \(/, "Inhalt nur im offenen Panel");
  assert.doesNotMatch(dn, /lucide-react|column\.links\.map/);
  assert.match(dn, /a\[data-nav-path\]/, "aria-current wird nach dem Öffnen gesetzt");
  const mp = read("src/components/Navbar/megaPanelHtml.js");
  assert.ok(!/^["']use client["']/m.test(mp));
  assert.match(mp, /replace\(\/\[&<>"'\]\/g/, "Texte und Attribute werden maskiert");
  assert.doesNotMatch(mp, /html: megaPanelHtml/, "kein fertiges HTML in den Props");
  assert.match(code("src/components/Navbar/navbar.js"), /<DesktopNav rooms=\{navRooms\}/);
});

test("TBT: Consent-Leiste mountet nach Leerlauf, früher Download und Pins bleiben", () => {
  const cl = read("src/app/[locale]/client-layout.js");
  assert.match(cl, /requestIdleCallback\(\(\) => setReady\(true\), \{ timeout \}\)/);
  assert.match(cl, /\{consentReady && <CookieComponent \/>\}/);
  assert.match(cl, /import\('@\/components\/Cookies\/cookiecomponent'\)\.catch/);
  assert.match(cl, /import\('@\/components\/Cookies\/cookiecomponent'\), \{ ssr: false \}/);
});

test("FadeInView entfernt (0 Leser), Reveal-CSS bleibt mit reduced motion", () => {
  assert.ok(!fs.existsSync(path.join(root, "src/components/Reusable/FadeInView.js")));
  const css = read("src/app/globals.css");
  assert.match(css, /prefers-reduced-motion: no-preference[\s\S]*?:is\(\.reveal, \.ph-reveal\)/);
  // Designsystem 01.11.2026: "calm" ist Alias der Ruhigen Ansicht.
  assert.match(css, /\[data-motion="reduced"\](?:, \[data-motion="calm"\]\))? :is\([^)]*\.ph-reveal/);
});

test("ConsentEmbed: Props für Titel, Text, Knopf und Icon, Standard unverändert", () => {
  const src = read("src/components/Cookies/ConsentEmbed.js");
  for (const p of ["title,", "text,", "label,", "icon,"]) assert.ok(src.includes(p), p);
  assert.match(src, /\{title \?\? defaults\.title\}/);
  assert.match(src, /\{text \?\? defaults\.text\}/);
  assert.match(src, /\{label \?\? defaults\.label\}/);
  assert.match(src, /youtube: PlayCircle/);
  assert.match(src, /DEFAULT_ICONS\[service\] \|\| MapPin/);
  assert.match(src, /setCookie\("cookieConsent"/, "Cookie-Name unverändert");
});

test("ConsentEmbed: YouTube/Vimeo ohne Props mit eigenen Videotexten in 4 Sprachen, kein Maps-Text", () => {
  const src = read("src/components/Cookies/ConsentEmbed.js");
  const literal = src.match(/const VIDEO_TEXTS = (\{[\s\S]*?\n\});/)[1];
  const VIDEO_TEXTS = new Function(`return (${literal});`)();
  for (const service of ["youtube", "vimeo"]) {
    for (const locale of ["de", "en", "fr", "it"]) {
      const v = VIDEO_TEXTS[service][locale];
      for (const k of ["title", "text", "label"]) assert.ok(v?.[k], `${service}.${locale}.${k}`);
      assert.doesNotMatch(Object.values(v).join(" "), /Maps|Karte|map\b|carte|mappa/i, `${service}.${locale}`);
      assert.match(v.title, service === "youtube" ? /YouTube/ : /Vimeo/);
    }
  }
  // Global catalogue (banner keys present) -> video table; a nested provider
  // (YouTubeFacade) without banner keys keeps its own embed* texts.
  assert.match(src, /if \(video && t\.has\("bannerTitle"\)\) return video\[locale\] \|\| video\.de;/);
  assert.match(src, /const defaults = defaultEmbedTexts\(service, locale, t\);/);
});

test("TBT: Fußzeilen-Linklisten als Server-HTML, escaped, Navigation über LinkDelegate", () => {
  const footer = code("src/components/Reusable/Footer.js");
  assert.match(footer, /import \{ esc \} from "@\/components\/Navbar\/megaPanelHtml"/);
  assert.equal((footer.match(/dangerouslySetInnerHTML=\{\{ __html: linkItemsHtml\(/g) || []).length, 2, "Spalten und Regionen");
  assert.match(footer, /href="\$\{esc\(localizeHref\(link\.href, locale\)\)\}" class="\$\{className\}">\$\{esc\(link\.label\)\}/);
  assert.match(footer, /<LinkDelegate>/);
  assert.doesNotMatch(footer, /links\.map\(\(link\) => \(\s*<li/, "keine hydrierten <li> mehr");
});

test("Merkliste: Hero mit quality 75 (in images.qualities)", () => {
  // Runde 5 (P3, ux P2-9, bewusst geänderte Erwartung): die Merkliste hat kein
  // Kopfbild mehr (Herkunft unbekannt, Leerzustand im ersten Bildschirm) –
  // also auch keine quality-Angabe. Der Mechanismus (singlePageSlider) bleibt.
  assert.doesNotMatch(read("src/app/[locale]/merkliste/page.js"), /image: "/);
  assert.match(read("next.config.js"), /qualities: \[50, 75, 90, 100\]/);
  assert.match(read("src/components/Reusable/singlePageSlider.js"), /quality: info\.quality/);
});
