// Unit tests for the Ratgeber pipeline (front matter, Markdown, review filter,
// renderer). Run from the repo root: node --test tests/unit/ratgeber.test.mjs
// Proves that no "[prüfen]" passage and no internal section reaches the
// rendered page – for every article in src/content/ratgeber/.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { parseFrontmatter } from "../../src/lib/ratgeber/frontmatter.js";
import { parseBlocks, parseInline, slugify } from "../../src/lib/ratgeber/markdown.js";
import { removeMarkedSentences, filterBlocks, cutInternal, hasMarker } from "../../src/lib/ratgeber/review.js";
import { buildArticle, articleText, isoDate } from "../../src/lib/ratgeber/article.js";
import { articleSchema } from "../../src/lib/ratgeber/schema.js";
import { relatedBrandLinks } from "../../src/lib/ratgeber/brands.js";
import { listRatgeber, getIndexableRatgeber } from "../../src/lib/ratgeber/index.js";
import Blocks, { Inline } from "../../src/components/Ratgeber/Markdown.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT = path.join(ROOT, "src/content/ratgeber");
const FILES = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".md"));

// Welle 2 (29.10.2026, Inhaber-Auftrag): the three buying-question articles
// are released. Their public part carries no review marker at all; the
// other five stay drafts (open points: Marktresearch/digital/features/ratgeber-offen.md).
const RELEASED = ["moebel-aus-oesterreich-in-die-schweiz", "was-kostet-ein-minotti-sofa", "was-kostet-eine-designerkueche"];
// Inhaber 31.10.2026 („Ratgeber alles freigegeben“): alle 14 Artikel, die zum
// Zeitpunkt der Entscheidung existierten. Der danach angelegte Whirlpool/Swimspa-
// Entwurf (Ideen-Team, 31.10.2026) bleibt bis zu seiner eigenen Freigabe Entwurf.
// QM content-legal (01.11.2026): Die sechs AP-6-Entwürfe tragen weiter
// status „Entwurf – … Inhaber-Freigabe offen“ und Prüfvermerk „Noch nicht
// freigegeben“; eine Freigabe ist nicht belegt → bis zur Klärung Entwurf.
const DRAFTS = [
  "whirlpool-swimspa-garten-planen",
  "bora-kochfeld-kosten",
  "interior-designer-oder-innenarchitekt",
  "quooker-kosten-strom-einbau",
  "sauna-zuhause-planen",
  "sofa-probesitzen-worauf-achten",
  "warum-sind-designermoebel-so-teuer",
];
const OWNER_RELEASED = FILES.map((f) => f.replace(/\.md$/, "")).filter((slug) => !DRAFTS.includes(slug));
const publicPart = (src) => src.split(/<!--|\n## (?:Interne|Bildvorschl|Prüfvermerk|Redaktion)/)[0];

// Everything that must never be visible.
const FORBIDDEN = [
  /\[\s*prüfen/i,
  /prüfen\s*\]/i,
  /\[\s*pruefen/i,
  /\[\s*Freigabe/i,
  /\[\s*Quelle ergänzen/i,
  /\[\s*Name\s*,/i,
  /eintragen\s*\]/i,
  /Prüfvermerk/i,
  /Bildvorschl/i,
  /Interne Link/i,
  /REDAKTION/,
  /nicht veröffentlichen/i,
  /<!--/,
  /binni/i, // embargo: cooperation not agreed (Bericht 26)
  /Poliform führen wir/i,
];

function renderArticle(article) {
  const html = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement("h1", null, article.heading),
      article.lead ? createElement("p", null, createElement(Inline, { text: article.lead })) : null,
      createElement(Blocks, { blocks: article.blocks })
    )
  );
  const jsonLd = JSON.stringify(
    articleSchema(article, { siteUrl: "https://example.test", organizationId: "o", websiteId: "w" })
  );
  return { html, jsonLd };
}

test("there are 15 Ratgeber articles (Welle 3: 6 Entwürfe, AP-6; Ideen-Team: Whirlpool/Swimspa)", () => {
  assert.equal(FILES.length, 15);
});

for (const file of FILES) {
  test(`${file}: no review marker or internal note in the rendered page`, () => {
    const source = fs.readFileSync(path.join(CONTENT, file), "utf8");
    const released = OWNER_RELEASED.includes(file.replace(/\.md$/, ""));
    if (released) assert.ok(!hasMarker(publicPart(source)), "released article: no marker left in the public part");
    else assert.ok(/\[prüfen|\[Name, Funktion\]|Prüfvermerk|REDAKTION/i.test(source), "fixture really contains markers");

    const article = buildArticle(source, { fallbackSlug: file.replace(/\.md$/, "") });
    const { html, jsonLd } = renderArticle(article);
    for (const [label, text] of [
      ["text", articleText(article)],
      ["html", html],
      ["json-ld", jsonLd],
    ]) {
      for (const re of FORBIDDEN) assert.doesNotMatch(text, re, `${file} ${label} matches ${re}`);
    }
    assert.ok(article.blocks.length > 10, "article body survives the filter");
    // Inhaber 31.10.2026: alle Ratgeber freigegeben (außer dem später angelegten
    // Whirlpool-Entwurf). Freigegebene Artikel tragen im öffentlichen Teil keine
    // [prüfen]-Stelle mehr (Prüfung oben).
    assert.equal(article.freigegeben, released);
    assert.equal(article.reviewedBy, null); // no invented reviewer
    assert.ok(isoDate(article.updatedAt));
  });
}

test("front matter: scalars, quotes, lists, booleans, null", () => {
  const { data, body } = parseFrontmatter(
    '---\ntitle: "A: B"\nslug: x\nkeywords:\n  - eins\n  - zwei\nfreigegeben: false\nreviewedBy: null\n---\n# Hallo\n'
  );
  assert.deepEqual(data, { title: "A: B", slug: "x", keywords: ["eins", "zwei"], freigegeben: false, reviewedBy: null });
  assert.equal(body, "# Hallo\n");
});

test("placeholder dates are not dates", () => {
  assert.equal(isoDate("[Datum der Freigabe eintragen]"), null);
  assert.equal(isoDate("2026-10-26"), "2026-10-26");
});

test("sentence with a marker is removed, the rest of the paragraph stays", () => {
  assert.equal(
    removeMarkedSentences("Erster Satz. Zweiter Satz mit Lücke [prüfen: Quelle]. Dritter Satz."),
    "Erster Satz. Dritter Satz."
  );
  // A marker after a sentence end belongs to the preceding sentence.
  assert.equal(removeMarkedSentences("Eins ist belegt. Zwei ist offen. [prüfen] Drei ist belegt."), "Eins ist belegt. Drei ist belegt.");
  // Abbreviations do not end a sentence.
  assert.equal(removeMarkedSentences("Gilt ab ca. 55 cm. Laut z. B. Ratgeber gilt das [prüfen]."), "Gilt ab ca. 55 cm.");
  // Marker at the start → whole block.
  assert.equal(removeMarkedSentences("[Freigabe erst nach Vertrag] Ganzer Absatz."), "");
  assert.equal(removeMarkedSentences("*Geprüft von [Name, Funktion] am 26.10.2026.*"), "");
  // Links whose text looks like a word with "Prüf" are not markers.
  assert.equal(hasMarker("[Prüfbericht, April 2026](https://example.test)"), false);
});

test("list items and table rows with a marker are dropped as a whole", () => {
  const blocks = filterBlocks(
    parseBlocks("## A\n\n- gut\n- offen [prüfen]. Noch ein Satz.\n\n| Kopf | Wert |\n|---|---|\n| x | 1 |\n| y | 2 [prüfen] |\n")
  );
  const list = blocks.find((b) => b.type === "list");
  const table = blocks.find((b) => b.type === "table");
  assert.deepEqual(list.items, ["gut"]);
  assert.deepEqual(table.rows, [["x", "1"]]);
});

test("a marker standing alone under a heading removes the whole section", () => {
  const blocks = filterBlocks(parseBlocks("## Behalten\n\nText.\n\n## Weg\n\n[prüfen: Freigabe]\n\nGeheim.\n\n### Unter\n\nAuch weg.\n\n## Wieder da\n\nOk."));
  const text = blocks.map((b) => b.text || "").join("|");
  assert.equal(text, "Behalten|Text.|Wieder da|Ok.");
});

test("internal sections and HTML comments are cut", () => {
  const blocks = cutInternal(parseBlocks("Text.\n\n<!-- intern\n## x\n-->\n\n## Redaktion: interne Link-Vorschläge\n\nGeheim."));
  assert.deepEqual(blocks, [{ type: "paragraph", text: "Text." }]);
});

test("renderer: escapes raw HTML, safe links, table scopes, heading ids", () => {
  const article = buildArticle(
    "---\ntitle: T\nslug: t\n---\n# T\n\nLead.\n\n## Maße & Tür\n\n<script>alert(1)</script> [extern](https://a.test) [böse](javascript:alert(1)) [intern](/de/beratung)\n\n| Maß | Wert |\n|---|---|\n| Höhe | 45 cm |\n"
  );
  const html = renderToStaticMarkup(createElement(Blocks, { blocks: article.blocks }));
  assert.match(html, /<h2 id="masse-tuer"/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<a href="https:\/\/a.test" rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<a href="\/de\/beratung"/);
  assert.match(html, /<caption[^>]*>Tabelle: Maße &amp; Tür<\/caption>/);
  assert.match(html, /<th scope="col"/);
  assert.match(html, /<th scope="row"/);
  assert.equal(article.lead, "Lead.");
});

test("inline parser handles URLs with parentheses", () => {
  const [link] = parseInline("[Martindale](https://en.wikipedia.org/wiki/Martindale_(unit))");
  assert.equal(link.href, "https://en.wikipedia.org/wiki/Martindale_(unit)");
});

test("inline parser: backslash escapes give literal characters, never a stray backslash", () => {
  // QM content-legal: footnote "*\*Laut Verfasser …*" rendered "\Laut … *".
  const nodes = parseInline("*\\*Laut Verfasser.*");
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].type, "em");
  assert.equal(nodes[0].children.map((c) => c.value).join(""), "*Laut Verfasser.");
  assert.deepEqual(parseInline("5 \\* 3"), [{ type: "text", value: "5 " }, { type: "text", value: "*" }, { type: "text", value: " 3" }]);
  // unescaped emphasis keeps working
  assert.equal(parseInline("a **b** *c*").filter((n) => n.type !== "text").length, 2);
});

test("slugify: umlauts and punctuation", () => {
  assert.equal(slugify("Stoff oder **Leder**? Größe & Pflege"), "stoff-oder-leder-groesse-pflege");
});

test("JSON-LD: author is the organisation while reviewedBy is null", () => {
  const article = listRatgeber()[0];
  const ld = articleSchema(article, { siteUrl: "https://example.test", organizationId: "org", websiteId: "web" });
  const node = ld["@graph"].find((n) => n["@type"] === "Article");
  assert.equal(node.author["@type"], "Organization");
  assert.equal(node.author["@id"], "org");
});

test("FAQ: answers come from the FAQ section, questions without markers", () => {
  for (const a of listRatgeber()) {
    assert.ok(a.faq.length > 0, `${a.slug} has FAQ`);
    for (const f of a.faq) {
      assert.ok(f.q.endsWith("?"), `${a.slug}: question "${f.q}"`);
      assert.ok(f.a.length > 20);
      assert.equal(hasMarker(f.q + f.a), false);
    }
  }
});

test("list / indexable: 15 articles, 8 released, 7 drafts noindex", () => {
  assert.equal(listRatgeber().length, 15);
  assert.equal(OWNER_RELEASED.length, 8);
  assert.deepEqual(getIndexableRatgeber().map((a) => a.slug).sort(), [...OWNER_RELEASED].sort());
  assert.ok(getIndexableRatgeber().length >= 3);
});

test("released articles: dated sources, 'auf Anfrage', USP and internal links, no dealer claim", () => {
  const get = (slug) => listRatgeber().find((x) => x.slug === slug);
  for (const slug of RELEASED) {
    const a = get(slug);
    const t = articleText(a);
    assert.ok(a.geprueftAm && a.updatedAt, slug);
    assert.ok(a.quellen.length >= 3, slug);
    assert.match(t, /Harald Menghin skizziert/, slug);
    for (const href of ["/de/arbeitsweise", "/de/beratung", "/de/dreilaender-rechner"]) assert.ok(t.includes(`](${href})`), `${slug} → ${href}`);
    assert.match(t, /\]\(\/de\/(sofaplaner|kuechenplaner)\)/, slug);
    assert.doesNotMatch(t, /eigenes? (Liefer|Montage)/i, slug); // Inhaber Nr. 3: "auf Wunsch"
    assert.doesNotMatch(t, /Vertragshändler|autorisierte?r? Händler|offizielle?r? Händler/i, slug);
  }
  assert.match(articleText(get("was-kostet-ein-minotti-sofa")), /auf Anfrage/);
  assert.match(articleText(get("was-kostet-eine-designerkueche")), /auf Anfrage/);
  assert.doesNotMatch(articleText(get("was-kostet-eine-designerkueche")), /18\.657|Innsbruck/); // no competitor prices
});

test("brand links only for verified brand pages", () => {
  assert.deepEqual(relatedBrandLinks(["minotti", "unbekannt"]).map((b) => b.href), ["/ueber-uns/marken/minotti", null]);
});

test("Optik QA: running text keeps numbers and units together (typoDe)", () => {
  const html = renderToStaticMarkup(createElement(Inline, { text: "Sitzhöhe 40 bis 50 cm, z. B. **35 bis 38 cm** laut [§ 2](https://example.org)" }));
  assert.match(html, /50\u00a0cm/);
  assert.match(html, /38\u00a0cm<\/strong>/);
  assert.match(html, /z\.\u202fB\./);
  assert.match(html, /§\u00a02/);
  assert.match(html, /href="https:\/\/example\.org"/); // URLs untouched
});
