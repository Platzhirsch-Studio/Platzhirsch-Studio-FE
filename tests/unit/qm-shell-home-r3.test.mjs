// QM shell-home r3 (01.11.2026): Fixes der Geräte-Abnahme Startseite/Shell.
// Logik (Hero-Phrasen, Menü-Spalten) plus Quelltext-Anker der Layout-Fixes,
// die bei 200 % Text (WCAG 1.4.4) und auf Tablets gemessen wurden.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HERO_PHRASES, splitPhrases } from "../../src/components/Home/heroPhrases.js";
import { menuColumns } from "../../src/components/Navbar/menuColumns.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const msgs = Object.fromEntries(["de", "en", "fr", "it"].map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));

test("Hero-H1: Phrasen bleiben zusammen, der Text bleibt Zeichen für Zeichen gleich", () => {
  for (const l of ["de", "en", "fr", "it"]) {
    const title = msgs[l].HomePage.hero.title;
    const parts = splitPhrases(title, l);
    assert.equal(parts.map((p) => p.text).join(""), title, l);
    const kept = parts.filter((p) => p.keep).map((p) => p.text);
    assert.ok(kept.length >= 1, `${l}: mindestens eine Phrase im aktuellen Titel`);
    for (const k of kept) assert.ok(HERO_PHRASES[l].includes(k), `${l}: ${k}`);
  }
  assert.deepEqual(splitPhrases("Dessiné à la main, au lac de Constance.", "fr"), [
    { text: "Dessiné ", keep: false },
    { text: "à la main", keep: true },
    { text: ", ", keep: false },
    { text: "au lac", keep: true },
    { text: " de Constance.", keep: false },
  ]);
  assert.deepEqual(splitPhrases("Ohne Treffer", "xx"), [{ text: "Ohne Treffer", keep: false }]);
  assert.deepEqual(splitPhrases("", "de"), []);
  // nowrap nur per Container-Query in rem – bei 200 % Text darf wieder umbrochen werden
  assert.match(read("src/components/Home/Hero.js"), /@min-\[20rem\]:whitespace-nowrap/);
});

test("Menü: Spaltenlink zur gleichen Seite wie der Übersichtslink fällt weg, leere Spalten auch", () => {
  const room = {
    all: { href: "/beratung", label: "Conseil et rendez-vous" },
    extra: [{ href: "/arbeitsweise", label: "Méthode" }],
    columns: [
      { title: "Conseil", links: [{ href: "/beratung?thema=x", label: "Conseil et rendez-vous" }, { href: "/hotel", label: "Hôtels" }] },
      { title: "Leer", links: [{ href: "/arbeitsweise#a", label: "Méthode" }] },
    ],
  };
  const cols = menuColumns(room);
  assert.equal(cols.length, 1);
  assert.deepEqual(cols[0].links.map((l) => l.href), ["/hotel"]);
  assert.deepEqual(menuColumns({}), []);
  assert.equal(room.columns[0].links.length, 2, "Eingabe bleibt unverändert");
});

test("200 % Text: Spalten folgen Container-Queries in rem statt Viewport", () => {
  assert.match(read("src/components/Home/BrandList.js"), /@container[\s\S]*@min-\[18rem\]:grid-cols-2[\s\S]*@min-\[52rem\]:grid-cols-3/);
  const hero = read("src/components/Home/Hero.js");
  assert.match(hero, /grid-cols-1 gap-x-5 gap-y-3[^"]*@min-\[20rem\]:grid-cols-2/);
  assert.match(hero, /lg:grid-rows-\[auto_auto_auto_auto_1fr\]/);
  const footer = read("src/components/Reusable/Footer.js");
  assert.match(footer, /@min-\[48rem\]:grid-cols-3 @min-\[68rem\]:grid-cols-\[minmax\(0,1\.4fr\)_repeat\(4,minmax\(0,1fr\)\)\]/);
  assert.match(read("src/components/Home/home.module.css"), /@container \(min-width: 20rem\)/);
  assert.match(read("src/components/Labs/Hub/HomeShowcase.js"), /@min-\[40rem\]:grid-cols-3/);
});

test("Mobile CTA-Leiste: schrumpfbare Spuren, Beschriftung bricht um statt über den Rand", () => {
  const bar = read("src/components/Reusable/MobileCtaBar.js");
  assert.match(bar, /grid-cols-\[minmax\(0,1fr\)_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(bar, /"grid-cols-2"/);
  assert.match(bar, /const ENTRY =\s*"flex min-h-16 min-w-0 flex-wrap/);
});

test("Cookie-Leiste: Kurzsatz auch im Querformat, höchstens halbe Bildschirmhöhe", () => {
  const c = read("src/components/Cookies/cookiecomponent.js");
  assert.match(c, /max-h-\[50svh\] overflow-y-auto/);
  assert.match(c, /grid grid-cols-1 gap-2 @min-\[20rem\]:grid-cols-2 md:flex/);
  // QM shell-home r5: long text by the bar width in rem and ≥ 54rem screen height.
  assert.match(c, /hidden @min-\[64rem\]:\[@media\(min-height:54rem\)\]:inline/);
});

test("Termin-Wort: Startseite folgt Kopf, Footer und Leiste (Kalender → „Termin wählen“)", () => {
  for (const f of ["src/components/Home/Hero.js", "src/components/Home/ClosingCta.js"]) {
    const src = read(f);
    assert.match(src, /terminCtaPath\(locale, ROUTES\.beratung\)/, f);
    assert.match(src, /ownCalendarActive\(\) \? terminLabel\(locale, \{ calendar: true \}\)/, f);
  }
});

test("EN-Menü in Satzschreibung, typografische Apostrophe FR/IT", () => {
  const labels = msgs.en.ProductsMenu.groups.flatMap((g) => [g.label || g.title, ...(g.items || []).map((i) => i.label)]).filter(Boolean);
  for (const l of labels) {
    const words = l.split(/\s+/).slice(1).filter((w) => /^[A-Za-z]/.test(w) && !["TV"].includes(w));
    for (const w of words) assert.ok(w[0] === w[0].toLowerCase(), `EN Title Case: ${l}`);
  }
  for (const l of ["fr", "it"]) assert.doesNotMatch(msgs[l].Shell.footer.tagline, /'/, `${l}: Footer-Zeile`);
  for (const l of ["fr", "it"]) {
    const items = msgs[l].ProductsMenu.groups.flatMap((g) => (g.items || []).map((i) => i.label));
    for (const label of items) assert.doesNotMatch(label, /'/, `${l}: ${label}`);
  }
});

test("Concierge: Platzhalter unter dem Footer nur, wenn ein Knopf wirklich gezeichnet ist", () => {
  const src = read("src/components/Concierge/Launcher.js");
  assert.match(src, /if \(!\(\(phone \|\| formPage\) && view === "closed"\)\) root\.setProperty\("--ph-concierge-h", "64px"\);/);
});
