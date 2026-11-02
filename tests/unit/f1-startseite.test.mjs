// tests/unit/f1-startseite.test.mjs – Fix-Runde 1, Team F1 (USP Startseite, Wow).
// Run: node --test tests/unit/f1-startseite.test.mjs
// Prüft: Home-Meta mit Kern-USP (Title ≤ 65, Description ≤ 165, kein „ganz
// Österreich“), Bildzeile „Linie: abstrahierte Grafik“ (nicht „Studie“),
// Coda-Link in derselben Sprache, F1-Texte in allen vier Sprachen, Piktogramme,
// USP-Kapitel ohne Platzhalter und Schritttexte ≥ 15 px, Coda-Einblendung ohne
// Deckkraft (Kontrast), Haus-Kapitel ohne leeren Bildplatz.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MESSAGES, { codaTarget } from "../../src/lib/wow/messages.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];

// copy.js imports next-intl (server) – read the F1 block as data instead.
function f1Block() {
  const src = read("src/components/Home/copy.js");
  const body = src.slice(src.indexOf("const F1 = {") + "const F1 = ".length, src.indexOf("};", src.indexOf("const F1 = {")) + 1);
  return Function(`"use strict"; return (${body});`)();
}

test("Home-Meta: Kern-USP in Title und Description, Längen, kein „ganz Österreich“", () => {
  const src = read("src/app/[locale]/page.js");
  const block = src.slice(src.indexOf("const FALLBACK_META_BY_LOCALE = {"), src.indexOf("function getFallbackMeta"));
  const meta = Function(`"use strict"; ${block.replace("const FALLBACK_META_BY_LOCALE =", "return")}`)();
  const usp = { de: /von Hand gezeichnet/i, en: /drawn by hand/i, fr: /dessinés à la main/i, it: /disegnati a mano/i };
  for (const l of LOCALES) {
    const { title, description } = meta[l];
    assert.ok(title.length <= 65, `${l} title ${title.length}`);
    assert.ok(description.length <= 165, `${l} description ${description.length}`);
    // Inhaber 30.10.2026 (bewusst geändert): Firmenname vorn im Titel, USP in der Description.
    assert.match(title, /^Platzhirsch Home Living – /, `${l} title`);
    assert.match(title, /Lochau/, `${l} title`);
    assert.match(description, usp[l], `${l} description`);
    assert.match(description, /Lochau/);
    assert.doesNotMatch(`${title} ${description}`, /ganz Österreich|across Austria|toute l'Autriche|tutta l'Austria/i);
  }
  // the USP title wins over the CMS fields
  assert.doesNotMatch(src, /metadata_title_(de|en|fr|it) \|\|/);
});

// R8 (bewusst geänderte Erwartung, gesamtwerk P0-1 / neuland P1-2): „abstrahierte
// Grafik“ las sich neben „Von Hand gezeichnet“ wie eine Ausflucht – die Bildzeile
// sagt jetzt ausdrücklich, dass die Linie keine Skizze ist.
// R5-USP (bewusst geändert): „Zeichen des Studios“ ohne Verneinung an der H1.
test("Wow-Bildzeile Phase A: „Linie: Zeichen des Studios“, nie „Studie“", () => {
  const want = { de: /Linie: Zeichen des Studios/, en: /Line: the studio’s mark/, fr: /Ligne : signe du studio/, it: /Linea: segno dello studio/ };
  for (const l of LOCALES) {
    assert.match(MESSAGES[l].caption.phaseA, want[l], l);
    assert.doesNotMatch(MESSAGES[l].caption.phaseA, /Studie|study|étude|studio dalla/i, l);
    // the language note is added by codaLabel() only where the target is German (r7-p2-links)
    assert.doesNotMatch(MESSAGES[l].coda.link, /German|allemand|tedesco/i, `${l}: Linktext ohne fest eingebauten Sprachhinweis`);
  }
});

// Runde 2, Fix-Team P2 (bewusst geänderte Erwartung, ux P1-7 / Auftrag P2):
// the coda leads to the process page /de/arbeitsweise in every locale – EN/FR/IT
// marked as German (hreflang + visible note, see r7-p2-links.test.mjs). The
// F1 targets (consultation page abroad, interior page until indexable) are gone.
// R5-fix P2 (gesamtwerk P1-2, bewusst geändert): /arbeitsweise gibt es jetzt in
// allen vier Sprachen – die Coda führt auf die Seite der Besuchersprache, ohne Hinweis.
test("Coda-Link: /<locale>/arbeitsweise in der Besuchersprache", () => {
  for (const l of ["de", "en", "fr", "it"]) assert.deepEqual(codaTarget(l), { href: "/arbeitsweise", locale: l, germanOnly: false });
  for (const p of ["consultation", "conseil", "consulenza"]) {
    const routing = read("src/utils/routing.js");
    assert.ok(routing.includes(`'/${p}'`) || routing.includes(`"/${p}"`), p);
  }
  for (const f of ["src/components/Wow/WowStage.js", "src/components/Wow/WowCoda.js"]) {
    const src = read(f);
    assert.match(src, /codaTarget\(locale\)/, f);
    assert.doesNotMatch(src, /href="\/interior-design-vorarlberg"/, f);
  }
});

test("Coda-Einblendung ohne Deckkraft-/Farbübergang (Kontrast ≥ 4.5:1 in jedem Frame), nur transform", () => {
  const css = read("src/components/Wow/Pause.module.css");
  for (const m of css.matchAll(/\.(coda|codaPhone a)\s*\{\s*animation:\s*([a-z-]+)/g)) assert.equal(m[2], "wow-rise", m[0]);
  const rise = css.match(/@keyframes wow-rise \{([\s\S]*?\})\s*\}/)[1];
  assert.match(rise, /transform/);
  assert.doesNotMatch(rise, /opacity|color/);
});

test("F1-Texte vollständig in allen vier Sprachen, ohne „Studie“/„Skizze“", () => {
  const F1 = f1Block();
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  const ref = keys(F1.de).sort();
  for (const l of LOCALES) {
    assert.deepEqual(keys(F1[l]).sort(), ref, l);
    for (const k of ref) {
      const v = k.split(".").reduce((o, x) => o[x], F1[l]);
      assert.ok(typeof v === "string" && v.trim(), `${l}.${k}`);
    }
    const flat = JSON.stringify(F1[l]);
    assert.doesNotMatch(flat, /Studie|study|étude|studio dalla|Skizze|sketch|Harald|!/i, l);
  }
});

// R5-USP (bewusst geändert, gesamtwerk P0-1): ohne echtes Material keine
// Liniengrafik mehr im Kapitel, sondern eine Typo-Komposition; der Hinweis zur
// Linie (text-small) steht im Fuß, die Schritttexte bleiben text-ui.
test("USP-Kapitel: Typo-Komposition statt Grafik, 7 eigene Piktogramme, Schritttexte ≥ 15 px, keine doppelte Zählung", () => {
  const proc = read("src/components/Home/Process.js");
  assert.doesNotMatch(proc, /<LineStudy/);
  assert.match(proc, /<TypeComposition/);
  assert.match(proc, /<Picto name=\{s\}/);
  assert.doesNotMatch(proc, /mt-1 hidden text-small/, "Schritttexte nicht mehr 14/12 px");
  assert.match(proc, /process\.steps\.\$\{s\}\.text`\)/);
  assert.match(proc, /text-ui text-text-soft/, "text-ui = 16 px");
  assert.doesNotMatch(proc, /sr-only">\{`\$\{i \+ 1\}\. `\}/, "keine zweite Nummer");
  // R5-fix P2: the path data moved to pictoPaths.js (static sprite, HTML size of /de)
  const pictos = read("src/components/Home/pictoPaths.js") + read("src/components/Home/Pictos.js");
  for (const k of ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "kitchen", "interior", "outdoor", "yacht"]) assert.match(pictos, new RegExp(`\\n  ${k}: "M`), k);
  assert.match(pictos, /aria-hidden="true"/);
  const study = read("src/components/Home/LineStudy.js");
  assert.match(study, /lineCaption/);
  assert.doesNotMatch(study, /inkStrokes|swell|belly/, "gleichmäßige Linie, keine Tinten-Imitation einer Hand");
  assert.match(read("src/components/Home/home.module.css"), /prefers-reduced-motion: no-preference/);
});

test("Haus-Kapitel: keine lazy Fotofläche mehr, Komposition rechts; Leistungen mit Piktogrammen; Werkzeuge nicht direkt nach den Leistungen", () => {
  const house = read("src/components/Home/HouseCafe.js");
  assert.doesNotMatch(house, /secondAboutHome|<Media/);
  assert.match(house, /data-home-house-art/);
  const services = read("src/components/Home/Services.js");
  assert.match(services, /<Picto name=\{s\.key\}/);
  // B12 (bewusst geändert, 31.10.2026): Startseite 13 → 9 Kapitel. Marken sind
  // der Fuß von „Sechs Stücke“, Leistungen und Werkzeuge Blöcke im Kapitel
  // „Gastgeber“ (HostPromises) – page.js setzt sie nicht mehr einzeln. Geprüft
  // wird die neue Kapitelfolge und die Folge Leistungen → Werkzeuge im Kapitel
  // (die Werkzeuge hängen weiter nicht am Leistungs-Kopf: eigener H3-Block).
  const page = read("src/app/[locale]/page.js");
  const chapters = ["<Hero ", "<Rooms ", "<CuratedSelection ", "<Process ", "<HouseCafe ", "<HostPromises ", "<DreilaenderService ", "<Journal ", "<ClosingCta "];
  const order = chapters.map((t) => page.indexOf(t));
  assert.ok(order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])), `Reihenfolge ${order}`);
  assert.equal((page.match(/^\s*<[A-Z][A-Za-z]+ locale=\{locale\}/gm) || []).length, 9, "höchstens 9 Kapitel");
  for (const gone of ["<Services ", "<ToolsShowcase ", "<BrandList ", "<SeoIntro "]) assert.equal(page.indexOf(gone), -1, gone);
  const host = read("src/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome.js");
  assert.ok(host.indexOf("<Services ") > 0 && host.indexOf("<ToolsShowcase ") > host.indexOf("<Services "), "Leistungen vor Werkzeugen");
  assert.match(read("src/components/ProuductSectionHome/ProuductSectionHome.js"), /<BrandList locale=\{locale\} brands=\{brands\} embedded \/>/);
  assert.match(read("src/components/Home/Journal.js"), /<SeoIntro locale=\{locale\} embedded \/>/);
});
