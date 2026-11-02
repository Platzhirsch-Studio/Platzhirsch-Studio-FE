// Regression tests for the QA feedback on R1-ratgeber (26.10.2026):
// Binni embargo (text, FAQ, sources, JSON-LD), sources of filtered passages,
// Poliform/Tax-Free wording, seoTitle length, geprueft_am.
// Run: node --test tests/unit/ratgeber-fix.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseBlocks } from "../../src/lib/ratgeber/markdown.js";
import { removeMarkedSentences, extractFaq, filterBlocks, hasEmbargo } from "../../src/lib/ratgeber/review.js";
import { buildArticle, articleText } from "../../src/lib/ratgeber/article.js";
import { articleSchema } from "../../src/lib/ratgeber/schema.js";
import { getRatgeber, listRatgeber } from "../../src/lib/ratgeber/index.js";

const SITE_NAME = "Platzhirsch Home Living";
const ld = (a) => JSON.stringify(articleSchema(a, { siteUrl: "https://example.test", organizationId: "o", websiteId: "w" }));

test("embargo term removes its sentence even without a marker", () => {
  assert.equal(hasEmbargo("Manufakturpartner Binni"), true);
  assert.equal(removeMarkedSentences("Eins bleibt. Wir arbeiten mit Binni zusammen. Drei bleibt."), "Eins bleibt. Drei bleibt.");
  assert.equal(removeMarkedSentences("Nur Binni hier."), "");
});

test("embargo inside a marker does not leave marker fragments behind", () => {
  assert.equal(
    removeMarkedSentences("Satz A zeigt etwas. [prüfen: Binni erst später; Vorschlag: „X. Y.“] Satz B bleibt."),
    "Satz B bleibt."
  );
});

test("FAQ: marker on the question line drops the item, answer does not leak", () => {
  const md = "## Häufige Fragen\n\n**Erste Frage?**\nAntwort eins bleibt.\n\n**Zweite Frage?** [prüfen: offen]\nGeheime Antwort.\n\n**Dritte Frage?**\nMit Binni als Partner.\n";
  const [, faq] = filterBlocks(extractFaq(parseBlocks(md)));
  assert.deepEqual(faq.items.map((i) => i.q), ["Erste Frage?"]);
  assert.deepEqual(faq.items[0].a, ["Antwort eins bleibt."]);
});

test("sources cited only in filtered passages are not output", () => {
  const a = buildArticle(
    "---\ntitle: T\nquellen:\n  - https://a.test/x\n  - https://b.test/y\n  - https://c.test/allgemein\n---\n# T\n\nLead.\n\n## A\n\nBelegt ([a](https://a.test/x)).\n\n## B\n\n[prüfen: Freigabe]\n\nOffen ([b](https://b.test/y)).\n"
  );
  assert.deepEqual(a.quellen, ["https://a.test/x", "https://c.test/allgemein"]);
});

test("no Binni anywhere in visible text, sources or JSON-LD", () => {
  for (const a of listRatgeber()) {
    assert.doesNotMatch(articleText(a), /binni/i, a.slug);
    assert.doesNotMatch(a.quellen.join(" "), /binni/i, a.slug);
    assert.doesNotMatch(ld(a), /binni/i, a.slug);
  }
});

test("Designerküche: stone-kitchen FAQ is not published", () => {
  const a = getRatgeber("was-kostet-eine-designerkueche");
  assert.ok(!a.faq.some((f) => /günstigere Küchen mit Stein/.test(f.q)));
  assert.doesNotMatch(ld(a), /Manufakturpartner/);
});

test("no unqualified Poliform showroom claim", () => {
  for (const a of listRatgeber()) {
    assert.doesNotMatch(articleText(a), /Poliform führen wir|zeigen wir (?:\w+ )*?(?:Küchen )?von Poliform/i, a.slug);
  }
});

test("Schweiz: Tax-Free only 'sofern angeboten', no offer by Platzhirsch implied", () => {
  const t = articleText(getRatgeber("moebel-aus-oesterreich-in-die-schweiz"));
  assert.match(t, /Weg A: Sie holen selbst ab \(Tax-Free, sofern angeboten\)/);
  assert.doesNotMatch(t, /Sie kaufen in Lochau/);
  assert.doesNotMatch(t, /Das verkaufende Geschäft erstattet Ihnen/);
  assert.doesNotMatch(t, /Kosovo/);
});

test("seoTitle ≤ 60 characters, full <title> ≤ 90", () => {
  for (const a of listRatgeber()) {
    assert.ok(a.seoTitle.length <= 60, `${a.slug}: ${a.seoTitle.length}`);
    assert.ok(`${a.seoTitle} | ${SITE_NAME}`.length <= 90, a.slug);
  }
});

test("geprueft_am: 'Geprüft am' only where a real check date is set", () => {
  const withDate = listRatgeber().filter((a) => a.geprueftAm).map((a) => a.slug).sort();
  assert.deepEqual(withDate, [
    "designmoebel-pflegen-leder-stoff-holz",
    "designsofa-kaufen-checkliste",
    "lieferzeiten-italienische-designmoebel",
    "moebel-aus-oesterreich-in-die-schweiz",
    "outdoor-moebel-am-see-material",
    "was-kostet-ein-minotti-sofa",
    "was-kostet-eine-designerkueche",
  ]);
  for (const a of listRatgeber()) assert.ok(a.updatedAt, `${a.slug} has a Stand date`);
});

// QM content-legal (01.11.2026): Ein Artikel, dessen Front Matter noch
// „Entwurf“ als status trägt oder dessen Prüfvermerk „Noch nicht freigegeben“
// sagt, darf nicht freigegeben: true stehen (sonst öffentlich, indexierbar, in
// Sitemap und llms.txt – ohne belegte Inhaber-Freigabe).
test("no article is released while status or Prüfvermerk still says draft", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "src/content/ratgeber");
  const wrong = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const fm = raw.split(/^---\s*$/m)[1] || "";
    if (!/^freigegeben:\s*true\s*$/m.test(fm)) continue;
    const status = (fm.match(/^status:\s*(.*)$/m) || [])[1] || "";
    if (/Entwurf/i.test(status) || /Noch nicht freigegeben/i.test(raw)) wrong.push(file);
  }
  assert.deepEqual(wrong, []);
});
