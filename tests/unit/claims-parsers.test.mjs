// Parser der Prüfskripte (tools/checks). Run: node --test tests/unit/claims-parsers.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractJsonStrings,
  extractJsStrings,
  htmlToText,
  htmlMetaTexts,
  parseSitemapLocs,
  brandSlugFromUrl,
  isAllowed,
  parseArgs,
  lineAt,
} from "../../tools/checks/lib/parse.mjs";
import { markdownLines } from "../../tools/checks/check-claims.mjs";

test("JSON: nur Werte, keine Schlüssel; Zeilen und Pfade stimmen", () => {
  const src = '{\n  "brand": {\n    "officialWebsite": "Offizielle Website",\n    "list": ["a", "Ihr \\"Händler\\""]\n  }\n}';
  const items = extractJsonStrings(src);
  assert.deepEqual(
    items.map((i) => [i.line, i.key, i.value]),
    [
      [3, "brand.officialWebsite", "Offizielle Website"],
      [4, "brand.list[0]", "a"],
      [4, "brand.list[1]", 'Ihr "Händler"'],
    ],
  );
});

test("JS: Kommentare werden ignoriert, Strings gefunden", () => {
  const src = [
    "// Ihr offizieller Minotti-Händler (Kommentar)",
    "/* größte Ausstellung */",
    'const a = "Ihr offizieller Minotti-Händler";',
    "const b = 'zweiter';",
  ].join("\n");
  const items = extractJsStrings(src).filter((i) => i.kind !== "jsx");
  assert.deepEqual(items.map((i) => [i.line, i.value]), [
    [3, "Ihr offizieller Minotti-Händler"],
    [4, "zweiter"],
  ]);
});

test("JS: Template-Literal ohne ${}-Ausdrücke, URL mit // ist kein Kommentar", () => {
  const src = 'const u = "https://example.com/x";\nconst t = `Die größte ${brand} Ausstellung`;';
  const items = extractJsStrings(src);
  assert.deepEqual(items.map((i) => i.value), ["https://example.com/x", "Die größte ", " Ausstellung"]);
  assert.equal(items[1].line, 2);
});

test("JS: Regex-Literal mit Anführungszeichen bricht nichts", () => {
  const src = "const r = /\"x'/g;\nconst s = \"danach\";";
  assert.deepEqual(extractJsStrings(src).map((i) => i.value), ["danach"]);
});

test("JS: Division wird nicht als Regex gelesen", () => {
  const src = "const x = a / b; const s = 'ok'; const y = c / 2;";
  assert.deepEqual(extractJsStrings(src).map((i) => i.value), ["ok"]);
});

test("JSX-Text wird erfasst", () => {
  const src = 'return (\n  <p className="x">Ihr offizieller Minotti-Händler</p>\n);';
  const jsx = extractJsStrings(src).filter((i) => i.kind === "jsx");
  assert.equal(jsx.length, 1);
  assert.equal(jsx[0].value, "Ihr offizieller Minotti-Händler");
  assert.equal(jsx[0].line, 2);
});

test("HTML: script/style entfernt, Entities dekodiert, Blöcke als Zeilen", () => {
  const html = "<body><script>var a='Händler'</script><style>.x{}</style><h1>Minotti &amp; Poliform</h1><p>Die&nbsp;größte</p></body>";
  assert.equal(htmlToText(html), "Minotti & Poliform\nDie größte");
});

test("HTML: Meta-Texte (title, description, og, alt)", () => {
  const html = '<title>Minotti Händler | X</title><meta name="description" content="Offizieller Partner"><meta property="og:title" content="OG"><img alt="Bild">';
  assert.deepEqual(htmlMetaTexts(html).map((m) => m.where), ["title", "meta:description", "meta:og:title", "img-alt"]);
});

test("Sitemap: Host auf localhost umgeschrieben", () => {
  const xml = "<urlset><url><loc>https://platzhirsch.studio/de/ueber-uns/marken/minotti</loc></url><url><loc> https://platzhirsch.studio/en/about-us/brands/flos?x=1 </loc></url></urlset>";
  assert.deepEqual(parseSitemapLocs(xml), [
    "http://localhost:3000/de/ueber-uns/marken/minotti",
    "http://localhost:3000/en/about-us/brands/flos?x=1",
  ]);
});

test("Markenslug aus URL in 4 Sprachen", () => {
  assert.equal(brandSlugFromUrl("http://localhost:3000/de/ueber-uns/marken/minotti"), "minotti");
  assert.equal(brandSlugFromUrl("/en/about-us/brands/paola-lenti"), "paola-lenti");
  assert.equal(brandSlugFromUrl("/fr/a-propos/marques/flos"), "flos");
  assert.equal(brandSlugFromUrl("/it/chi-siamo/marche/classicon"), "classicon");
  assert.equal(brandSlugFromUrl("/de/kontakt"), null);
});

test("Allowlist: Datei-Präfix, Textstück, Regel-ID", () => {
  const allow = [{ file: "Marktresearch/content/", contains: "größte Hebel", id: "de-groesste" }];
  assert.ok(isAllowed({ file: "Marktresearch/content/ratgeber/a.md", sentence: "Der größte Hebel", id: "de-groesste", type: "superlative" }, allow));
  assert.ok(!isAllowed({ file: "src/x.js", sentence: "Der größte Hebel", id: "de-groesste" }, allow));
  assert.ok(!isAllowed({ file: "Marktresearch/content/a.md", sentence: "Die größte Ausstellung", id: "de-groesste" }, allow));
  assert.ok(!isAllowed({ file: "a" }, [{}]));
});

test("Markdown: interne Abschnitte und [prüfen: …]-Marker werden übersprungen", () => {
  const md = "# Titel\nText [prüfen: keine Händlerbehauptung] weiter\n## Redaktion: Links\nNr. 1 intern";
  assert.deepEqual(markdownLines(md), [
    { line: 1, value: "# Titel" },
    { line: 2, value: "Text  weiter" },
  ]);
});

test("parseArgs und lineAt", () => {
  assert.deepEqual(parseArgs(["--live", "--limit=5", "x"]), { _: ["x"], live: true, limit: "5" });
  assert.equal(lineAt("a\nb\nc", 4), 3);
});
