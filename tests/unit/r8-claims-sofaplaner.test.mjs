// node --test tests/unit/r8-claims-sofaplaner.test.mjs
// R8 (Fix-Team P1-claims; gesamtwerk P0-2, recht P0-1, ux P1-4, seo P1-1):
// Jede Nennung des Sofaplaners (Name, Lead, Beschreibung) bezieht ihren Text
// aus SOURCE_COPY / SOURCE_COPY_I18N (src/lib/sofaplaner/consent.js). Solange
// MINOTTI_DATA_CONSENT=false ist, verspricht keine Seite einen
// „Minotti-Sofaplaner“, ein „Minotti-Sofa“ oder „echte Elemente/Herstellermaße“.
// Drei Ebenen: Quellen (Grep), Bindung (Werte), gerendertes HTML + llms.txt
// (Dev-Server, SITEMAP_BASE; ohne Server übersprungen).
// Inhaber-Entscheidung Nr. 11 (29.10.2026): Minotti-Zustimmung liegt vor →
// MINOTTI_DATA_CONSENT=true. Erwartungen bewusst umgestellt: Die Markentexte
// sind jetzt erlaubt; geprüft wird weiter die Bindung an SOURCE_COPY (keine
// fest verdrahteten Texte) und die neutrale Rückfallfassung.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MINOTTI_DATA_CONSENT, SOURCE_COPY, SOURCE_COPY_I18N, sourceCopyFor } from "../../src/lib/sofaplaner/consent.js";
import { FEATURES } from "../../src/lib/features.js";
import { brandPlanLinks, productPlanLinks } from "../../src/lib/crossSell.js";
import { EXTRA_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";

const root = join(import.meta.dirname, "..", "..");
const read = (p) => readFileSync(join(root, p), "utf8");
// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const BASE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";

// Planer-Versprechen, die ohne Zustimmung nirgends stehen dürfen (DE/EN/FR/IT).
const PROMISE = /Minotti-Sofaplaner|Minotti-Sofa|Minotti sofa|canapé Minotti|divano Minotti|echten? Elemente|Herstellerma(ß|ss)e/;

test("Schalter ein (Nr. 11): SOURCE_COPY und SOURCE_COPY_I18N sind die Minotti-Texte", () => {
  assert.equal(MINOTTI_DATA_CONSENT, true);
  for (const k of ["seoName", "leadShort", "lead", "terminProdukt", "h1", "summary", "crossLabel", "crossText", "brandText"]) {
    assert.equal(typeof SOURCE_COPY[k], "string", k);
  }
  assert.match(SOURCE_COPY.lead, /Minotti/);
  assert.match(SOURCE_COPY.sourceNote, /^Daten: Minotti S.p.A./);
  for (const l of ["de", "en", "fr", "it"]) {
    assert.ok(SOURCE_COPY_I18N[l].seoName && SOURCE_COPY_I18N[l].leadShort, l);
    assert.match(SOURCE_COPY_I18N[l].leadShort, /Minotti/, l);
    assert.equal(sourceCopyFor(l), SOURCE_COPY_I18N[l]);
  }
  assert.equal(sourceCopyFor("xx"), SOURCE_COPY_I18N.de);
  assert.equal(SOURCE_COPY.h1, "Sofaplaner: Minotti-Sofa aus echten Elementen planen");
});

test("Quellen: keine fest verdrahteten Minotti-Planer-Texte, alle Stellen importieren SOURCE_COPY", () => {
  const bound = [
    "src/lib/features.js",
    "src/lib/crossSell.js",
    "src/lib/seo/sitemap/extraPages.js",
    "src/app/[locale]/leistungen/page.js",
    "src/components/Home/copy.js",
    "src/app/[locale]/wohnzimmer-einrichten-vorarlberg/page.js",
    "src/app/[locale]/sofaplaner/page.js",
  ];
  for (const f of bound) {
    const src = read(f);
    assert.match(src, /SOURCE_COPY/, `${f}: an SOURCE_COPY gebunden`);
    assert.doesNotMatch(src, /"[^"\n]*(Minotti-Sofaplaner|Minotti-Sofa zusammenstellen|Minotti-Sofa aus|Minotti sofa from|canapé Minotti à partir|divano Minotti a partire)[^"\n]*"/, f);
  }
  // Planer-H1 aus SOURCE_COPY
  assert.match(read("src/app/[locale]/sofaplaner/page.js"), /SOURCE_COPY\.h1/);
  // Concierge und Ratgeber nennen keinen Minotti-Sofaplaner
  assert.doesNotMatch(read("src/components/Concierge/core/texts.js"), /Sofaplaner|sofa planner/i);
  for (const f of ["designsofa-kaufen-checkliste.md", "was-kostet-ein-minotti-sofa.md", "lieferzeiten-italienische-designmoebel.md"]) {
    assert.doesNotMatch(read(`src/content/ratgeber/${f}`), /Minotti-Sofaplaner|Sofaplaner für Minotti/, f);
  }
});

test("Bindung: Übersicht, Cross-Sell, Sitemap/llms und Startseite zeigen SOURCE_COPY", async () => {
  const f = FEATURES.find((x) => x.id === "sofaplaner");
  assert.equal(f.title, SOURCE_COPY.seoName);
  assert.equal(f.summary, SOURCE_COPY.summary);

  const brand = brandPlanLinks({ locale: "de", brand: "Minotti" }).find((l) => l.id === "sofaplaner");
  assert.deepEqual([brand.label, brand.text], [SOURCE_COPY.seoName, SOURCE_COPY.brandText]);
  assert.match(brand.text, /Minotti/, "Minotti-Markenseite verlinkt den Minotti-Planer (Zustimmung Nr. 11)");

  const prod = productPlanLinks({ locale: "de", categoryKey: "sofas-couches", brand: "Minotti", name: "Lawrence" }).find((l) => l.id === "sofaplaner");
  assert.deepEqual([prod.label, prod.text], [SOURCE_COPY.crossLabel, SOURCE_COPY.crossText]);

  const extra = EXTRA_PAGES.find((p) => p.path === "/sofaplaner");
  assert.equal(extra.label, SOURCE_COPY.seoName);
  assert.ok(extra.llms.startsWith(SOURCE_COPY.leadShort.replace(/\.$/, "")), extra.llms);

  // Startseite: copy.js importiert next-intl → Quelltext prüfen. r7Copy()
  // setzt die Sofaplaner-Karte aus sourceCopyFor(locale) ein, die Daten im
  // R7-Block sind dieselben neutralen Texte.
  const home = read("src/components/Home/copy.js");
  assert.ok(home.includes("const sofa = sourceCopyFor(locale);"));
  assert.ok(home.includes("sofaplaner: { title: sofa.seoName, text: sofa.leadShort }"));
  // Nr. 11: Die Platzhalter im R7-Block bleiben die neutrale Rückfallfassung;
  // r7Copy() überschreibt sie zur Laufzeit mit SOURCE_COPY_I18N (jetzt Minotti).
  const placeholders = home.match(/sofaplaner: \{ title: "[^"]+", text: "[^"]+" \}/g) || [];
  assert.equal(placeholders.length, 4, "ein Platzhalter je Sprache");
  for (const ph of placeholders) assert.doesNotMatch(ph, /Minotti/, ph);
});

// Gerendertes HTML: Fenster um jede Nennung des Planers (Link oder Name) darf
// kein Minotti-Planer-Versprechen enthalten; die reinen Planer-Formeln dürfen
// gar nicht vorkommen.
const STRICT = /Minotti-Sofaplaner|Minotti-Sofa zusammenstellen|Minotti-Sofa aus echten|Minotti sofa from modules|canapé Minotti à partir|divano Minotti a partire|aus echten Elementen und Herstellerma/;
function planerWindows(html) {
  const out = [];
  for (const m of html.matchAll(/sofaplaner|Sofaplaner|Sofa planner|Planificateur de canapé|Planner divano/g)) {
    out.push(html.slice(Math.max(0, m.index - 300), m.index + 300));
  }
  return out;
}

test("Live: /de, /en, /fr, /it, /de/leistungen, Minotti-Markenseite und llms.txt an SOURCE_COPY gebunden", async (t) => {
  const urls = ["/de", "/en", "/fr", "/it", "/de/leistungen", "/de/ueber-uns/marken/minotti", "/de/wohnzimmer-einrichten-vorarlberg", "/de/sofaplaner", "/llms.txt"];
  for (const u of urls) {
    let html;
    try {
      const res = await fetch(`${BASE}${u}`, { signal: AbortSignal.timeout(180000) });
      if (res.status !== 200) return t.skip(`${u}: HTTP ${res.status}`);
      html = await res.text();
    } catch (e) {
      return t.skip(`dev server not reachable at ${BASE}: ${e.message}`);
    }
    // Nr. 11: mit Zustimmung sind die Minotti-Texte erlaubt; ohne gilt weiter das Verbot.
    if (!MINOTTI_DATA_CONSENT) {
      assert.doesNotMatch(html, STRICT, u);
      for (const w of planerWindows(html)) assert.doesNotMatch(w, PROMISE, `${u}: …${w.replace(/\s+/g, " ").slice(200, 420)}…`);
    }
    if (u === "/de/sofaplaner" && MINOTTI_DATA_CONSENT) assert.ok(html.includes("Daten: Minotti S.p.A."), "Quellenangabe sichtbar");
    if (u === "/llms.txt") assert.ok(html.includes(SOURCE_COPY.leadShort.replace(/\.$/, "")), "llms.txt nennt den Lead aus SOURCE_COPY");
    // R5 (gesamtwerk P2, Fix-Team P4): sichtbare H1 als ganzer Satz wie beim Küchenplaner (SOURCE_COPY.h1Satz);
    // SOURCE_COPY.h1 bleibt die beschreibende Fassung für Teaser/Metas, der Werkzeugname steht in der Overline.
    if (u === "/de/sofaplaner") assert.match(html, /<h1[^>]*>Ihr Sofa, Modul für Modul geplant\.<\/h1>/);
  }
});
