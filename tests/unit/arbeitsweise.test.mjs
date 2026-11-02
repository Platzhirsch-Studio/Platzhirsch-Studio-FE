// tests/unit/arbeitsweise.test.mjs – Signature-Seite /de/arbeitsweise (Kern-USP).
// Run: node --test tests/unit/arbeitsweise.test.mjs
// Prüft: media.js (eine Bildquelle, Pflichtfelder, kein KI-Material, Launch-Liste,
// Platzhalter nur außerhalb der Produktion), Texte (keine Superlative/Ausrufezeichen,
// Liniengrafik nie als „Skizze“ beschriftet), FAQ sichtbar = FAQ-JSON-LD, Komponenten
// kennen keine Bildpfade.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as copy from "../../src/lib/arbeitsweise/copy.js";
import {
  HAND_SLOTS,
  KETTE,
  LAUNCH_REQUIRED,
  MEDIA,
  RATIO,
  chainComplete,
  chainCount,
  missingForLaunch,
  robotsForLaunch,
  placeholdersVisible,
  validateMedia,
} from "../../src/lib/arbeitsweise/media.js";
import { arbeitsweiseSchema, PAGE_URL } from "../../src/lib/arbeitsweise/schema.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const COMPONENTS = "src/components/Arbeitsweise";

const realSlot = (over = {}) => ({
  src: "/arbeitsweise/test.avif",
  alt: "Handzeichnung eines Wohnraums mit Sofa vor dem Fenster",
  width: 3000,
  height: 2000,
  credit: "Handzeichnung: Harald Menghin",
  datum: "09/2026",
  einwilligung: "BR-TEST",
  kiStufe: "keine",
  typ: "skizze",
  ...over,
});

test("media.js: alle Slots heute leer (kein Platzhalter-Material als echtes Bild eingetragen)", () => {
  for (const [k, v] of Object.entries(MEDIA)) assert.equal(v, null, `${k} ist eingetragen – nur echtes Material von Harald`);
  for (const [k, v] of Object.entries(KETTE)) assert.equal(v, null, `kette.${k}`);
  assert.deepEqual(validateMedia(), []);
});

test("media.js: Launch-Liste und Seitenverhältnisse nach Bibel §6", () => {
  assert.deepEqual(LAUNCH_REQUIRED, ["handzeichnung", "modell", "rendering", "portrait"]);
  assert.deepEqual(missingForLaunch(), LAUNCH_REQUIRED);
  const filled = Object.fromEntries(LAUNCH_REQUIRED.map((k) => [k, realSlot()]));
  assert.deepEqual(missingForLaunch(filled), []);
  for (const r of Object.values(RATIO)) assert.ok(["21/9", "4/5", "3/2", "1/1", "9/16"].includes(r), r);
  for (const k of Object.keys(MEDIA)) assert.ok(RATIO[k], `RATIO.${k} fehlt`);
});

test("media.js: Pflichtfelder, Ablageort und kein KI-Material bei Haralds Handwerk", () => {
  assert.deepEqual(validateMedia({ handzeichnung: realSlot() }, {}), []);
  const noCredit = validateMedia({ handzeichnung: realSlot({ credit: "" }) }, {});
  assert.ok(noCredit.some((e) => e.includes("credit")));
  const noConsent = validateMedia({ modell: realSlot({ einwilligung: undefined, typ: "modell" }) }, {});
  assert.ok(noConsent.some((e) => e.includes("einwilligung")));
  const ai = validateMedia({ handzeichnung: realSlot({ kiStufe: "generiert" }) }, {});
  assert.ok(ai.some((e) => e.includes("kiStufe")));
  const outside = validateMedia({ modell: realSlot({ src: "/Images/foo.jpg" }) }, {});
  assert.ok(outside.some((e) => e.includes("public/arbeitsweise")));
  const chainAi = validateMedia({}, { skizze: realSlot({ kiStufe: "KI-Upscaling" }) });
  assert.ok(chainAi.some((e) => e.includes("kette.skizze")));
  assert.deepEqual(HAND_SLOTS, ["handzeichnung", "modell"]);
});

// Fix-Runde 1 (F1, Release-Rat recht P0-3 / ux P1-6): bewusst geänderte
// Erwartung – „Bild folgt“ erscheint auch im Dev-Server nicht mehr, nur noch
// mit dem Schalter NEXT_PUBLIC_ARBEITSWEISE_PLATZHALTER=1 (Bildplanung).
test("media.js: Platzhalter nur mit Schalter (auch nicht im Dev-Server), Schalter wirkt", () => {
  assert.equal(placeholdersVisible(undefined, "production"), false);
  assert.equal(placeholdersVisible(undefined, "development"), false);
  assert.equal(placeholdersVisible("1", "production"), true);
  assert.equal(placeholdersVisible("0", "development"), false);
  assert.match(read("src/lib/arbeitsweise/media.js"), /process\.env\.NEXT_PUBLIC_ARBEITSWEISE_PLATZHALTER/);
});

test("Kette erscheint nur komplett", () => {
  assert.equal(chainComplete(), false);
  const all = Object.fromEntries(["vorher", "skizze", "modell", "rendering", "umsetzung"].map((k) => [k, realSlot()]));
  assert.equal(chainComplete(all), true);
  assert.equal(chainComplete({ ...all, modell: null }), false);
});

test("Komponenten kennen keine Bildpfade (einzige Quelle: media.js)", () => {
  for (const f of fs.readdirSync(path.join(ROOT, COMPONENTS)).filter((f) => f.endsWith(".js"))) {
    const src = read(`${COMPONENTS}/${f}`);
    assert.doesNotMatch(src, /["'`]\/(Images|arbeitsweise|labs)\/[^"'`]*\.(jpe?g|png|webp|avif|svg|mp4)/i, `${f} enthält einen Bildpfad`);
  }
});

test("Texte: Gastgeber-Ton – keine Superlative, kein Ausrufezeichen, keine Händler-Formel", () => {
  const all = JSON.stringify(copy);
  assert.doesNotMatch(all, /!/);
  assert.doesNotMatch(all, /\b(größt\w*|beste[nrs]?|führend\w*|einzig\w*|Luxus|exklusiv\w*|Traum\w*|perfekt\w*|Händler|offiziell\w*)\b/i);
  assert.doesNotMatch(all, /\d+\s?(€|EUR|CHF)/, "kein Preis bis zur Inhaber-Entscheidung");
});

// Runde 2 (gesamtwerk P1-1), bewusst geänderte Erwartung: kein sichtbares Etikett
// „Schema“ mehr (Werkstatt-Sprache). Stattdessen EIN Hinweis in der Übersicht,
// dass die Liniengrafiken abstrahiert und keine Zeichnungen von Harald sind.
test("Liniengrafik: kein Etikett „Schema“, ein ehrlicher Hinweis, nie „Skizze“", () => {
  assert.equal(copy.UI.schema, undefined);
  assert.match(copy.UEBERSICHT.grafikNote, /digitale Schemata des Studios.*nicht Haralds Zeichnungen/); // R5-USP: ohne „keine …“-Verneinung
  assert.doesNotMatch(read(`${COMPONENTS}/ArbeitsweisePage.js`), /UI\.schema/);
  const linie = read(`${COMPONENTS}/Linie.js`);
  assert.doesNotMatch(linie, /aria-label|<title>|alt=/, "die Schema-Grafik hat keinen Alt-/Titeltext");
  assert.match(linie, /aria-hidden="true"/);
  // Kein three.js / R3F auf dieser Seite (Konzept §5.5).
  for (const f of fs.readdirSync(path.join(ROOT, COMPONENTS)).filter((f) => f.endsWith(".js"))) {
    assert.doesNotMatch(read(`${COMPONENTS}/${f}`), /from "(three|@react-three\/[a-z]+)"/, f);
  }
});

test("Motion/Layout: kein Barrel-Import, keine Sticky-Werkstrecke, Schritte ohne Mindesthöhe", () => {
  const files = fs.readdirSync(path.join(ROOT, COMPONENTS)).filter((f) => f.endsWith(".js"));
  for (const f of files) {
    const src = read(`${COMPONENTS}/${f}`);
    assert.doesNotMatch(src, /from "motion\/react"/, `${f}: Barrel-Import`);
    assert.doesNotMatch(src, /<motion\.[a-z]+|\bmotion\.(div|span|section|article|p|a|img|li|ul|figure)\b/,`${f}: motion.* statt m.*`);
  }
  // Runde 2 (gesamtwerk P1-1), bewusst geänderte Erwartung: die Sticky-Werkstrecke
  // (LazyMotion, Fortschrittsbalken) ist entfernt – sie ließ neben den Schritten
  // 700–1 000 px leere Fläche. Jeder Schritt ist ein Zweispalter mit seinem
  // Standbild; die Seite braucht kein Motion-Paket mehr.
  assert.equal(fs.existsSync(path.join(ROOT, COMPONENTS, "Werkstrecke.js")), false);
  assert.equal(fs.existsSync(path.join(ROOT, COMPONENTS, "motion.js")), false);
  for (const f of files) assert.doesNotMatch(read(`${COMPONENTS}/${f}`), /from "framer-motion"/, `${f}: Motion-Import`);
  const page = read(`${COMPONENTS}/ArbeitsweisePage.js`);
  assert.doesNotMatch(page, /min-h-\[64vh\]/, "kein Mindesthöhen-Schritt");
  assert.match(page, /<LinieFrame phase=\{n\}/, "Standbild je Schritt");
  assert.match(page, /CH_GRID/, "Kapitelkopf neben den Schritten (Desktop)");
});

test("sieben Schritte in der Reihenfolge der USP-Doku", () => {
  assert.deepEqual(
    copy.STEPS.map((s) => s.name),
    ["Kennenlernen", "Vor Ort", "Handzeichnung", "Modell", "3D-Planung", "Rendering", "Umsetzung"]
  );
  assert.equal(copy.stationLabel(3), "Schritt 03 von 07");
  assert.equal(copy.HERO.title, "Von der Handzeichnung zum Rendering.");
  assert.ok(copy.META.title.length <= 60, "Title ≤ 60 Zeichen");
  assert.ok(copy.META.description.length <= 160, "Description ≤ 160 Zeichen");
  // „ein, zwei Tage“ nur als Bedingung, nie als pauschales Versprechen.
  for (const m of JSON.stringify(copy).matchAll(/[^."]*ein, zwei Tage[^."]*/g)) assert.match(m[0], /wenn Ihr Projekt es braucht/i, m[0]);
});

test("JSON-LD: FAQPage = sichtbare Fragen, Person ohne Titel/Bild, kein HowTo/Review", () => {
  const ld = arbeitsweiseSchema();
  const types = ld["@graph"].map((n) => n["@type"]);
  assert.deepEqual(types, ["WebPage", "BreadcrumbList", "FAQPage", "Person"]);
  const faq = ld["@graph"].find((n) => n["@type"] === "FAQPage");
  assert.deepEqual(
    faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
    copy.FAQ.items.map((i) => [i.q, i.a])
  );
  assert.equal(faq.mainEntity.length, 8);
  const person = ld["@graph"].find((n) => n["@type"] === "Person");
  assert.equal(person.name, "Harald Menghin");
  assert.equal(person.jobTitle, undefined, "jobTitle erst nach Bestätigung durch den Inhaber");
  assert.equal(person.image, undefined, "image nur mit echtem Porträt");
  const page = ld["@graph"][0];
  assert.equal(page.url, PAGE_URL);
  assert.equal(page.primaryImageOfPage, undefined, "kein Platzhalter als primaryImageOfPage");
  assert.doesNotMatch(JSON.stringify(ld), /HowTo|Review|AggregateRating/);
});

// Runde 2 (r2-seo P0-1, Inhaber-Entscheidung Nr. 9), bewusst geänderte Erwartung:
// früher noindex, bis die Pflicht-Bilder da waren. Die Seite trägt ohne Bilder
// typografisch (kein „Bild folgt“) und ist die Kern-USP-Seite – sie wird
// indexiert, unabhängig von den Bildslots.
test("Indexierung: index, follow – unabhängig von den Bildslots (r2-seo P0-1)", () => {
  assert.deepEqual(robotsForLaunch(), { index: true, follow: true });
  const filled = Object.fromEntries(LAUNCH_REQUIRED.map((k) => [k, realSlot()]));
  assert.deepEqual(robotsForLaunch(filled), { index: true, follow: true });
  assert.ok(missingForLaunch().length > 0, "Bilder fehlen weiterhin (Inhaber-Lieferung) – trotzdem index");
  const page = read("src/app/[locale]/arbeitsweise/page.js");
  assert.match(page, /robots:\s*robotsForLaunch\(\)/);
});

// F1 (Release-Rat gesamtwerk P0-1/P1-1, recht P0-3): statt des leeren
// „Schema“-Rahmens (Phase 1) kein Leerraum im Auftakt.
// R5-fix P2 (gesamtwerk P1-1, bewusst geändert): nicht mehr die Liniengrafik
// des Showrooms (LineStudy zog die Sessel nach, Bildzeile „Showroom Lochau“
// behauptete ein Foto), sondern ein typografisches Papierblatt ohne Bildzeile.
test("Hero-Slot: in media.js, 4:5, bis dahin ein typografisches Papierblatt (keine Liniengrafik, keine Bildzeile)", () => {
  assert.ok("hero" in MEDIA);
  assert.equal(MEDIA.hero, null);
  assert.equal(RATIO.hero, "4/5");
  const page = read(`${COMPONENTS}/ArbeitsweisePage.js`);
  assert.match(page, /function HeroVisual/);
  assert.doesNotMatch(page, /<LineStudy|import LineStudy/, "keine Sessel-Liniengrafik im Auftakt");
  assert.match(page, /data-hero-sheet/, "Auftakt zeigt das Papierblatt");
  assert.doesNotMatch(read("src/lib/arbeitsweise/copy.js") + read("src/lib/arbeitsweise/copy-intl.js"), /lineCaption|Showroom Lochau ·/, "keine Bildzeile, die ein Foto behauptet");
  assert.doesNotMatch(page, /<LinieFrame phase=\{1\}/, "kein leerer Raumrahmen");
  assert.doesNotMatch(page, /<Linie(Frame)? phase=\{3\}/);
  // Knopf vor dem Bild im DOM (mobil über der Falz)
  const hero = page.slice(page.indexOf("function Hero({ c })"), page.indexOf("function Haltung({ c })"));
  assert.ok(hero.indexOf("<HeroVisual c={c} />") > hero.indexOf("APPOINTMENT.label"), "HeroVisual steht nach dem Knopf");
});

test("Handwerk (P2-3b): nur Haralds echte Angaben, heute nichts sichtbar", () => {
  for (const [k, v] of Object.entries(copy.HANDWERK)) assert.equal(v, null, `HANDWERK.${k} ohne Antwort von Harald`);
  assert.deepEqual(copy.handwerkLines(3), []);
  assert.deepEqual(copy.handwerkLines(4), []);
  assert.equal(copy.INHABER_RUECKFRAGEN.length, 4);
  assert.deepEqual(copy.handwerkLines(3, { werkzeug: " X " }), [{ label: "Werkzeug", value: "X" }]);
  assert.deepEqual(copy.handwerkLines(4, { massstab: "A", material: "", modellDauer: "B" }).map((l) => l.label), ["Maßstab", "Dauer"]);
  assert.deepEqual(copy.handwerkLines(5, { werkzeug: "X" }), []);
  const page = read(`${COMPONENTS}/ArbeitsweisePage.js`);
  assert.match(page, /HANDWERK\.zitat &&/, "Zitat nur, wenn eingetragen");
});

test("FAQ 8 verlinkt Yacht-Interieur und Outdoor (P3-8), Routen existieren", () => {
  const item = copy.FAQ.items[7];
  for (const l of item.links) {
    assert.ok(item.a.includes(l.label), l.label);
    assert.ok(fs.existsSync(path.join(ROOT, "src/app/[locale]", l.href, "page.js")), l.href);
  }
});

test("Share-Bild (P2-5): typografisch, nicht aboutHome.jpg", () => {
  const page = read("src/app/[locale]/arbeitsweise/page.js");
  assert.doesNotMatch(page, /aboutHome/);
  // R5-fix P2: je Sprache /<locale>/arbeitsweise/teilen.png (früher nur /de/…)
  assert.match(page, /\/\$\{locale\}\$\{PATH\}\/teilen\.png/);
  assert.match(read("src/app/[locale]/arbeitsweise/teilen.png/route.js"), /LOCALES\.map\(\(locale\) => \(\{ locale \}\)\)/);
  const route = read("src/app/[locale]/arbeitsweise/teilen.png/route.js");
  assert.match(route, /ImageResponse/);
  assert.doesNotMatch(route, /<img|\.(jpe?g|avif|webp)["'`]/, "kein Foto im Share-Bild");
});

test("Schema: Sonnenbogen Phase 7 über dem Horizont, dunkles Kapitel ohne Messing-Linien (P3-5b, P3-3)", () => {
  const css = read(`${COMPONENTS}/arbeitsweise.module.css`);
  const shift = Number(css.match(/data-phase="7"\] \.sun \{\s*transform: translateY\((\d+)%\)/)[1]);
  assert.ok(26 + shift <= 40, "Bogenenden mindestens 10 % über dem Horizont (50 %)");
  const dark = css.match(/\.linieDark \{([^}]*)\}/)[1];
  assert.doesNotMatch(dark, /brass/);
});

test("Kette: unter zwei echten Bildern nur EIN Platzhalter (P3-4)", () => {
  assert.equal(chainCount(), 0);
  assert.equal(chainCount({ skizze: realSlot(), modell: realSlot() }), 2);
  assert.match(copy.KETTE.placeholder, /Projekt-Kette folgt/);
});

// Runde 2: Fortschrittsbalken entfällt mit der Werkstrecke. Stattdessen: die
// Säulen „Ort / Hand / Präzision“ blenden nicht mehr über die Deckkraft ein
// (gesamtwerk P2-5: wirkten im ersten Zustand hellgrau).
test("Reduced Motion: Grafiken ohne Übergänge, Säulen ohne Deckkraft-Einblendung", () => {
  const css = read(`${COMPONENTS}/arbeitsweise.module.css`);
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{\s*\.linie,/);
  const name = css.match(/\.reveal \{\s*--aw-tl: view\(\);\s*animation: (\w+)/)[1];
  const at = css.indexOf(`@keyframes ${name} {`);
  assert.doesNotMatch(css.slice(at, css.indexOf("\n}\n", at)), /opacity/, "Säulen starten mit vollem Kontrast");
});

test("Texte: keine unbelegten Zusagen, Modell-Aussage einheitlich (P2-4)", () => {
  const all = JSON.stringify(copy);
  assert.doesNotMatch(all, /Ansprechperson/);
  assert.doesNotMatch(all, /bevor Kosten entstehen/);
  assert.doesNotMatch(all, /mehrere Varianten desselben Raums/);
  assert.doesNotMatch(all, /ob ein Modell sinnvoll ist/, "FAQ 1 widerspricht nicht dem Lead „baut ein Modell“");
  assert.match(copy.FAQ.items[0].a, /baut Harald ein Modell/);
});

test("Schema: Maßtext 3,60 m steht in der Isometrie nicht kopfüber (rotate 90, P2-3)", () => {
  const linie = read(`${COMPONENTS}/Linie.js`);
  assert.match(linie, /transform="rotate\(90 /);
  assert.doesNotMatch(linie, /rotate\(-90/);
});

// Fix-Runde 1 (F1): keine unbestätigten Angaben, keine Platzhalter-Texte auf der Seite.
test("F1: keine Dauer/„kostenlos“, keine Rolle bis zur Bestätigung (inhaber-offen A3/A4)", () => {
  const all = JSON.stringify(copy);
  assert.doesNotMatch(all, /60 Minuten/);
  assert.doesNotMatch(all, /kostenlos/i);
  assert.doesNotMatch(all, /Designer & Zeichner/);
  assert.equal(copy.HARALD.role, null);
  const page = read(`${COMPONENTS}/ArbeitsweisePage.js`);
  assert.match(page, /HARALD\.role &&/, "Rollenzeile nur, wenn bestätigt");
  assert.match(page, /n > 1 &&/, "Schritt 01 ohne leeres Standbild");});
