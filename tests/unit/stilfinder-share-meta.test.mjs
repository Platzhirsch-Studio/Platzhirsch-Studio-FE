// Stil-Finder-Ergebnis: Teilen-Metadaten (mobil-code-seo, fix-02).
// Canonical ohne ?a=, og:url/type/site_name, Teilen-Bild = eigene Palettenkarte
// statt profile.hero (teils Herstellerbilder ohne Freigabe).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
// Code ohne Zeilenkommentare (die Kommentare nennen das alte hero.src bewusst).
const code = (p) => read(p).replace(/^\s*\/\/.*$/gm, "");
const DIR = "src/app/[locale]/stil-finder/ergebnis/[profil]/";
const { deOnlyMetadata, SITE_URL } = await import("../../src/lib/seo/pageMetadata.js");

// Mehrsprachigkeit (01.11.2026): Metadaten aus src/lib/stilfinder/seo.js
// (stilfinderResultMetadata) – Canonical je Sprache, noindex + follow.
test("Ergebnisseite: stilfinderResultMetadata, noindex + follow, kein Herstellerbild als og:image", () => {
  const s = code(`${DIR}page.js`);
  assert.match(s, /stilfinderResultMetadata\(locale, /);
  const seo = code("src/lib/stilfinder/seo.js");
  assert.match(seo, /`\$\{STILFINDER_PATH\}\/ergebnis\/\$\{profile\.slug\}`/);
  assert.match(seo, /const robots = \{ index: false, follow: true \}/);
  for (const src of [s, seo]) {
    assert.doesNotMatch(src, /hero\.src/);
    assert.doesNotMatch(src, /images: \[\{ url: profile\.hero/);
  }
});

test("Canonical ist der Profilpfad ohne Antwort-Code, og:url gleich", () => {
  const m = deOnlyMetadata({
    path: "/stil-finder/ergebnis/italienische-ruhe",
    title: "Mein Wohnstil: Italienische Ruhe | Platzhirsch Stil-Finder",
    description: "Tief sitzen, weit schauen, nichts muss.",
    robots: { index: false, follow: true },
  });
  const url = `${SITE_URL}/de/stil-finder/ergebnis/italienische-ruhe`;
  assert.equal(m.alternates.canonical, url);
  assert.equal(m.alternates.languages, undefined, "noindex: kein hreflang");
  assert.equal(m.openGraph.url, url);
  assert.equal(m.openGraph.type, "website");
  assert.ok(m.openGraph.siteName);
  assert.ok(!m.openGraph.images?.length, "Bild kommt aus opengraph-image.js");
});

test("opengraph-image.js und twitter-image.js: Palettenkarte, 404 für fremde Profile/Sprachen", () => {
  for (const f of ["opengraph-image.js", "twitter-image.js"]) {
    assert.ok(existsSync(new URL(`${DIR}${f}`, root)), f);
    const s = read(`${DIR}${f}`);
    // Mehrsprachigkeit: stilOgImage() liefert null für unbekannte Sprachen → 404
    assert.match(s, /stilOgImage\(profil, locale\)/, f);
    assert.match(s, /notFound\(\)/, f);
    assert.match(s, /width: 1200, height: 630/, f);
  }
  const card = code("src/lib/stilfinder/ogCard.js");
  assert.doesNotMatch(card, /hero\b|\/Images\//, "keine Fotos in der Karte");
  assert.match(card, /if \(!base \|\| !copy\) return null;/);
  assert.match(card, /p\.palette\.map/);
});
