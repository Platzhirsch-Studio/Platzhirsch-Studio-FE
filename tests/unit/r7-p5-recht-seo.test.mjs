// node --test tests/unit/r7-p5-recht-seo.test.mjs
// Fix-Team P5 (Runde 2): SEO & Recht-Inhalt.
//  1. Design-Ansatz ohne Zitat (recht P0-1) – Quelltext + alle 36 Marken (live, optional)
//  2. Markentitel ohne Händler-Anschein, 4 Sprachen (seo P0-2, P2-1, recht P2-8)
//  3. Claim-Filter: Länderversprechen, perfekt*/Exzellenz/ausschließlich/weltweit, Craft ohne Quelle
//  4. llms.txt / mcp.json am Termin-Schalter, /arbeitsweise und /concierge nach Regel
//  5. News-Titel ≤ 65 an Wortgrenze, kein „|“-Rest, keine Doppelmarke
//  6. Produkt-Schema ohne Product/offers/sku
//  7. Ratgeber/Adventsabend nur mit Freigabe in Produktion, „Geprüft am“ nur mit reviewedBy
//  8. Impressum: WKO-Zeile nur mit belegten Angaben; ki-assistenten Description ≤ 165
//  9. Person-Schema, BreadcrumbList, robots.txt-Regeln
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import { brandPageTitle, BRAND_TITLE_MAX } from "../../src/lib/marken/brandTitle.js";
import { hasCountryPromise, hasUnprovenClaim, dealerStatement, verifiedDealersSentence } from "../../src/lib/legal/claims.js";
import { cleanProse, cleanCraftEntries, resolveShowroomText, sanitizeManufacturerText } from "../../src/lib/legal/manufacturerText.js";
import { EXTRA_PAGES, visibleExtraPages, kiAssistentenLlms } from "../../src/lib/seo/sitemap/extraPages.js";
import { buildLlmsTxt } from "../../src/lib/seo/llms.js";
import { newsMetaTitle, NEWS_TITLE_MAX } from "../../src/lib/news/newsTitle.js";
import { breadcrumbJsonLd, houseTrail } from "../../src/lib/seo/breadcrumbs.js";
import { titleWithSuffix } from "../../src/lib/seo/pageMetadata.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
// Source without comments (assertions about code, not about explanations).
const code = (p) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
const LOCALES = ["de", "en", "fr", "it"];

// ---------------------------------------------------------------- 1 Zitat
test("1 Design-Ansatz: kein blockquote, keine Anführungszeichen, keine Gründer-Caption (Quelltext)", () => {
  const src = read("src/components/MarkenItems/markenitems.js");
  const block = src.slice(src.indexOf("const approachBlock"), src.indexOf("const askHref"));
  assert.ok(block.length > 50, "approachBlock vorhanden");
  assert.doesNotMatch(block, /<blockquote|<figcaption|<figure|quoteOpen|quoteClose|founders/);
  assert.match(block, /approachLabel/);
  assert.doesNotMatch(src, /approachQuote|quoteOpen/);
});

// Live über alle Marken: nur mit laufendem Server (SITEMAP_BASE oder :3000).
// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const LIVE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";
async function liveUp() {
  try {
    return (await fetch(`${LIVE}/robots.txt`, { signal: AbortSignal.timeout(15000) })).ok;
  } catch {
    return false;
  }
}

test("1 live: alle Markenseiten ohne Zitat-Zuschreibung im Design-Ansatz", { timeout: 900_000 }, async (t) => {
  if (!(await liveUp())) return t.skip(`${LIVE} nicht erreichbar`);
  const xml = await (await fetch(`${LIVE}/sitemap-marken.xml`, { signal: AbortSignal.timeout(120000) })).text();
  const brandUrls = [...xml.matchAll(/<loc>https:\/\/platzhirsch\.studio(\/de\/ueber-uns\/marken\/[a-z0-9-]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(brandUrls.length >= 30, `${brandUrls.length} Markenseiten in der Sitemap`);
  for (const p of brandUrls) {
    const res = await fetch(`${LIVE}${p}`, { signal: AbortSignal.timeout(120000) });
    assert.equal(res.status, 200, p);
    const html = await res.text();
    assert.doesNotMatch(html, /<blockquote/, `${p}: blockquote`);
    const m = html.match(/data-brand-approach=""[^>]*>([\s\S]*?)<\/div>/);
    if (!m) continue;
    const text = m[1].replace(/<[^>]+>/g, "");
    assert.doesNotMatch(text, /[„“”«»"]/, `${p}: Anführungszeichen im Design-Ansatz`);
    assert.doesNotMatch(m[0], /figcaption/, `${p}: Personen-Caption`);
  }
});

// ---------------------------------------------------------------- 2 Titel
const BANNED_TITLE = /showroom (österreich|austria|autriche|lochau)|händler|dealer|revendeur|rivenditore|offiziell|official|officiel|ufficiale/i;

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti ist belegt → Rimadesio und Agape
// stehen als unbelegte Marken in der Liste.
test("2 Markentitel: Nicht-Vertragsmarken ohne Händler-/Showroom-Land-Anspruch, ≤ 65, 4 Sprachen", () => {
  for (const brand of ["Paola Lenti", "Rimadesio", "Agape", "Poliform", "Tonon", "Next125", "Brand van Egmond", "101 Copenhagen", "Schüller"]) {
    for (const l of LOCALES) {
      const t = brandPageTitle(brand, l);
      assert.ok(t.startsWith(brand), t);
      assert.doesNotMatch(t, BANNED_TITLE, `${brand}/${l}: ${t}`);
      assert.ok(t.length <= BRAND_TITLE_MAX, `${t.length}: ${t}`);
    }
  }
  assert.equal(brandPageTitle("Paola Lenti", "de"), "Paola Lenti – Designmarke im Showroom am Bodensee | Platzhirsch");
});

test("2 Markentitel: ClassiCon und Ezarri „Vertragshändler“, ohne „offiziell“/Gebiet Vorarlberg", () => {
  for (const brand of ["ClassiCon", "Ezarri"]) {
    for (const l of LOCALES) {
      const t = brandPageTitle(brand, l);
      assert.match(t, /Vertragshändler|dealer|revendeur|rivenditore/, t);
      assert.doesNotMatch(t, /offiziell|official|officiel|ufficial|Vorarlberg/i, t);
      assert.ok(t.length <= BRAND_TITLE_MAX, t);
    }
  }
  assert.match(brandPageTitle("ClassiCon", "de"), /^ClassiCon – Vertragshändler am Bodensee/);
});

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti trägt den Studio-Namen aus der Minotti-
// Pressemeldung, Bad-&-Wellness-Marken „Händler“ (Liefervereinbarung), nie „offiziell“.
test("2 Markentitel: Minotti Studio, Bad-&-Wellness-Marken Händler, ≤ 65", () => {
  for (const l of LOCALES) {
    const t = brandPageTitle("Minotti", l);
    assert.equal(t, "Minotti Studio by Platzhirsch Home Living – Lochau");
    assert.ok(t.length <= BRAND_TITLE_MAX, t);
    assert.doesNotMatch(t, /offiziell|official|officiel|ufficial|Vorarlberg|m²/i, t);
  }
  assert.equal(brandPageTitle("Starpool", "de"), "Starpool – Händler am Bodensee | Platzhirsch");
  assert.equal(brandPageTitle("Dornbracht", "en"), "Dornbracht – dealer on Lake Constance | Platzhirsch");
  for (const brand of ["Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura", "Dornbracht", "antoniolupi"]) {
    for (const l of LOCALES) assert.ok(brandPageTitle(brand, l).length <= BRAND_TITLE_MAX, brand);
  }
});

test("2 Markenseite nutzt brandPageTitle, keine alten Overrides", () => {
  const src = code("src/app/[locale]/ueber-uns/marken/[title]/page.js");
  assert.match(src, /brandPageTitle\(displayBrandName\(marke\.name1\), locale\)/);
  assert.doesNotMatch(src, /BRAND_TITLE_OVERRIDES|Showroom Österreich|Showroom Austria/);
});

test("2 ClassiCon-Showroomtext: kein „offiziell … in Vorarlberg“, Satz aus dem Claim-Register", () => {
  const marke = {
    name1: "ClassiCon",
    dealers_title_de: "ClassiCon bei Platzhirsch Studio",
    dealers_description_de:
      "Platzhirsch Studio ist Ihr offizieller ClassiCon Händler in Vorarlberg. In unserer Ausstellung in Lochau erleben Sie die Möbel live – wir beraten Sie persönlich und liefern in ganz Österreich.",
  };
  const r = resolveShowroomText(marke, "de");
  assert.doesNotMatch(r.text, /offiziell|ganz Österreich/);
  assert.match(r.text, new RegExp(dealerStatement("classicon", "de").replace(/\./g, "\\.")));
  assert.equal(r.title, "ClassiCon bei Platzhirsch Home Living");
});

// ---------------------------------------------------------------- 3 Claims
test("3 Länderversprechen ohne „auf Wunsch“ fallen weg, mit „auf Wunsch“ bleiben sie", () => {
  for (const s of [
    "Wir beraten Sie persönlich und liefern in ganz Österreich.",
    "Mit Planung, Lieferung und Montage in ganz Österreich.",
    "We deliver throughout Austria.",
    "Livraison dans toute l'Autriche.",
    "Consegna in tutta l'Austria.",
  ]) {
    assert.equal(hasCountryPromise(s), true, s);
    assert.equal(cleanProse(`${s} Gegründet 1948.`), "Gegründet 1948.", s);
  }
  assert.equal(hasCountryPromise("Lieferung und Montage auf Wunsch, auch in ganz Österreich."), false);
});

test("3 perfekt*, Perfektion, Exzellenz, ausschließlich, weltweit (DE/EN/FR/IT) fallen weg", () => {
  for (const s of [
    "Jedes Sofa hat perfekte Proportionen.",
    "UV-Lack in Perfektion.",
    "Ein Ausdruck traditioneller Exzellenz.",
    "Gefertigt ausschließlich in Italien.",
    "Die Marke ist weltweit bekannt.",
    "A perfectly balanced chair.",
    "Une finition parfaite.",
    "Una finitura perfetta.",
    "Sold worldwide.",
  ]) {
    assert.equal(hasUnprovenClaim(s), true, s);
    assert.equal(sanitizeManufacturerText(`${s} Gegründet 1948.`, { brand: "Minotti" }), "Gegründet 1948.", s);
  }
  assert.equal(hasUnprovenClaim("Ein Sofa mit Leinenbezug."), false);
});

test("3 Craft-Abschnitte ohne Quelle werden ausgeblendet (Inhaber-offen Nr. 28)", () => {
  const entries = [{ title: "Polsterung", eyeline: "Meda", text: "Von Hand gefertigt." }];
  assert.deepEqual(cleanCraftEntries(entries), []);
  assert.equal(cleanCraftEntries([{ ...entries[0], source: "Freigabe Hersteller 2026-11" }]).length, 1);
  const src = read("src/components/MarkenItems/brandData.js");
  assert.match(src, /source: String\(item\?\.source/);
});

test("3 Filter gilt für story, craft und approach (Markenseite)", () => {
  const src = read("src/components/MarkenItems/markenitems.js");
  assert.match(src, /cleanProse\(localized\(marke, "desing_approach", locale\)/);
  assert.match(src, /cleanCraftEntries\(localizedCraft\(/);
  assert.match(read("src/components/MarkenItems/brandData.js"), /raw\.map\(\(p\) => cleanProse\(p/);
  assert.match(read("src/lib/legal/manufacturerText.js"), /!hasManufacturerClaim\(s\)/);
});

// ---------------------------------------------------------------- 4 llms/mcp/sitemap
test("4 llms.txt: Termin nur mit Schalter, „auf Wunsch“, Vertragshändler-Satz", () => {
  assert.doesNotMatch(kiAssistentenLlms(false), /Terminwunsch/);
  assert.match(kiAssistentenLlms(true), /Terminwunsch/);
  const off = buildLlmsTxt({ extraPages: visibleExtraPages({ appointmentOffered: false }) });
  assert.doesNotMatch(off, /Terminwunsch/);
  assert.match(off, /Lieferung und Montage auf Wunsch/);
  assert.ok(off.includes(verifiedDealersSentence()));
  const on = buildLlmsTxt({ extraPages: visibleExtraPages({ appointmentOffered: true }) });
  assert.match(on, /Terminwunsch/);
});

test("4 /concierge nur mit verfügbarer KI, /arbeitsweise nur wenn indexierbar", () => {
  const paths = (o) => visibleExtraPages(o).map((p) => p.path);
  assert.ok(!paths({ conciergeAvailable: false }).includes("/concierge"));
  assert.ok(paths({ conciergeAvailable: true }).includes("/concierge"));
  assert.ok(paths({ arbeitsweiseIndexable: true }).includes("/arbeitsweise"));
  assert.ok(!paths({ arbeitsweiseIndexable: false }).includes("/arbeitsweise"));
  assert.ok(EXTRA_PAGES.some((p) => p.path === "/arbeitsweise"));
  // Sitemap und llms.txt verwenden dieselbe Regel.
  // Runde 5 P6 (seo P2, recht P2): die Sitemap nutzt jetzt dieselbe Regel wie
  // Seite und Footer (conciergeIndexable() && conciergeLive()) – bewusst
  // geänderte Erwartung, vorher nur conciergeIndexable().
  assert.match(read("src/lib/seo/sitemapEntries.js"), /visibleExtraPages\(\{ conciergeAvailable: conciergeAvailableForSeo\(\) \}\)/);
  assert.match(read("src/lib/seo/sitemapEntries.js"), /return conciergeIndexable\(\) && conciergeLive\(\);/);
  // Runde 4 P5 (seo P1-4): llms.txt nennt den Concierge nur mit gesetztem Schlüssel
  // (conciergeLive()), strenger als die Sitemap – bewusst geänderte Erwartung.
  assert.match(read("src/app/llms.txt/route.js"), /visibleExtraPages\(\{ conciergeAvailable: conciergeLive\(\), appointmentOffered: APPOINTMENT_OFFERED \}\)/);
});

// Mit NODE_ENV=production (Kindprozess, damit APPOINTMENT_OFFERED neu berechnet wird).
function prodEval(code) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production", AGENT_APPOINTMENT_MODE: "", PRIVACY_TEXT_APPROVED: "" },
  }).trim();
}

test("4 NODE_ENV=production: mcp.json-Beschreibung und llms-Zeile ohne Terminwunsch, Concierge-Regel", () => {
  const out = JSON.parse(
    prodEval(`
      const { APPOINTMENT_OFFERED } = await import("./src/lib/agent/tools.js");
      const { cardDescription } = await import("./src/lib/agent/card.js");
      const { instructionsFor } = await import("./src/lib/agent/jsonrpc.js");
      const { visibleExtraPages } = await import("./src/lib/seo/sitemap/extraPages.js");
      const ki = visibleExtraPages({ appointmentOffered: APPOINTMENT_OFFERED }).find((p) => p.path === "/ki-assistenten");
      console.log(JSON.stringify({ offered: APPOINTMENT_OFFERED, card: cardDescription(), llms: ki.llms, instr: instructionsFor() }));
    `)
  );
  assert.equal(out.offered, false);
  assert.doesNotMatch(out.card, /Terminwunsch/);
  assert.doesNotMatch(out.llms, /Terminwunsch/);
  assert.doesNotMatch(out.instr, /request_appointment/);
  const route = read("src/app/.well-known/mcp.json/route.js");
  assert.match(route, /description: cardDescription\(\)/);
});

test("4 Concierge: Title/Überzeile neutral ohne KI, Sitemap-Regel = Robots-Regel", () => {
  const page = read("src/app/[locale]/concierge/page.js");
  assert.match(page, /TITLE_OFF = "Fragen an unser Team \| Platzhirsch Home Living"/);
  assert.match(page, /\{off \? "Fragen an unser Team" : "KI-Concierge"\}/);
  const cfg = read("src/lib/concierge/config.js");
  assert.match(cfg, /export function conciergeIndexable\(\) \{\s*return !IS_PROD \|\| isAvailable\(\);/);
});

// ---------------------------------------------------------------- 5 News
test("5 News-Titel: ≤ 65, Wortgrenze, kein „|“-Rest, keine Doppelmarke, kein Stoppwort am Ende", () => {
  const cases = [
    "CLASSICON – Möbeldesign von Eileen Gray bis Konstantin Grcic, jetzt in Lochau zu sehen",
    "VERNISSAGE: “Birds Cycle” by Lisa Muster – Bilder und Skulpturen im Showroom am Bodensee",
    "Vernissage: Platzhirsch Home Living",
    "Inspiration für einen Sommer auf der Terrasse mit Gloster, Tuuci und Paola Lenti am See",
    "Der PLATZHIRSCH lässt Wünsche wahr werden | Adventsverlosung",
    "Kurz",
  ];
  const STOP = /\s(von|für|einen|der|die|das|by|mit|und|in|am|im)…?$/i;
  for (const raw of cases) {
    const t = newsMetaTitle(raw);
    assert.ok(t.length <= NEWS_TITLE_MAX, `${t.length}: ${t}`);
    assert.doesNotMatch(t.replace(/ \| Platzhirsch( Home Living)?$/, ""), /\|/, t);
    assert.doesNotMatch(t, /Platzhirsch.*Platzhirsch/i, t);
    assert.doesNotMatch(t.replace(/ \| Platzhirsch( Home Living)?$/, ""), STOP, t);
    assert.doesNotMatch(t, /CLASSICON|VERNISSAGE/, t);
  }
  assert.equal(newsMetaTitle("Vernissage: Platzhirsch Home Living"), "Vernissage: Platzhirsch Home Living");
  assert.match(read("src/app/[locale]/news/[title]/page.js"), /newsMetaTitle\(/);
});

// ---------------------------------------------------------------- 6 Produkt
test("6 Produkt-Schema: ItemPage + Thing, kein Product, keine offers, kein sku", async () => {
  // structuredData.js nutzt "@/"-Aliase nicht mehr? → Quelltext-Prüfung + Aufbau.
  const src = read("src/lib/seo/structuredData.js");
  const fn = src.slice(src.indexOf("export function productSchema"), src.indexOf("// CollectionPage whose mainEntity"));
  assert.match(fn, /"@type": "ItemPage"/);
  assert.match(fn, /"@type": "Thing"/);
  assert.doesNotMatch(fn, /"Product"|offers|sku|price:/);
  assert.match(fn, /L\.price/);
  assert.doesNotMatch(read("src/app/[locale]/produkte/[category]/[product]/page.js"), /\.\.\.measures/);
});

test("6 /produkte ohne searchParams (cachebar), Suche auf /produkte/suche (noindex)", () => {
  const hub = code("src/app/[locale]/produkte/page.js");
  assert.doesNotMatch(hub, /searchParams/);
  const search = read("src/app/[locale]/produkte/suche/page.js");
  assert.match(search, /robots: \{ index: false, follow: true \}/);
  assert.match(read("src/components/ShopCatalog/catalogSearch.js"), /\/suche`\)\} method="get"/);
});

// ---------------------------------------------------------------- 7 Ratgeber/Event/Partner
test("7 Ratgeber: in Produktion nur Freigegebenes, „Geprüft am“ nur mit reviewedBy, Titel ≤ 65", async () => {
  const out = JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", `
      const r = await import("./src/lib/ratgeber/index.js");
      const draft = r.listRatgeber().find((a) => a.freigegeben !== true);
      console.log(JSON.stringify({ visible: r.RATGEBER_DRAFTS_VISIBLE, pub: r.listPublicRatgeber().length, all: r.listRatgeber().length, one: draft ? r.getPublicRatgeber(draft.slug) : null }));
    `], { cwd: ROOT, encoding: "utf8", env: { ...process.env, NODE_ENV: "production" } })
  );
  assert.equal(out.visible, false);
  // QM content-legal (01.11.2026): 8 Artikel freigegeben; die sechs AP-6-
  // Entwürfe (Inhaber-Freigabe nicht belegt) und der Whirlpool-Entwurf in
  // Produktion 404.
  assert.equal(out.pub, 8, "8 freigegebene Ratgeber-Artikel");
  assert.ok(out.all > 0);
  assert.equal(out.one, null);
  const parts = read("src/components/Ratgeber/RatgeberParts.js");
  assert.match(parts, /article\.reviewedBy \? formatDate\(article\.geprueftAm\) : ""/);
  const { listRatgeber } = await import("../../src/lib/ratgeber/index.js");
  for (const a of listRatgeber()) assert.ok(titleWithSuffix(a.seoTitle).length <= 65, a.seoTitle);
  assert.ok(titleWithSuffix("Ratgeber Designmöbel und Küche").length <= 65);
});

test("7 Adventsabend: Produktion ohne Uhrzeit 404; Partner: Landstraße, Title ohne Werbefloskel", () => {
  const ev = read("src/app/[locale]/adventsabend/event.js");
  assert.match(ev, /startTime: null/);
  assert.match(ev, /export function eventPublic\(\{ nodeEnv = process\.env\.NODE_ENV \} = \{\}\) \{\s*return nodeEnv !== "production" \|\| hasStartTime\(\);/);
  // Bewusst geändert (Runde 4, r4-technik P2-2, Fix-Team P6): vor notFound()
  // steht connection(), damit die 404 pro Anfrage gerendert wird (echte
  // 404-Seite statt gecachter leerer Hülle).
  assert.match(read("src/app/[locale]/adventsabend/page.js"), /if \(locale !== "de" \|\| !eventPublic\(\)\) \{\s*await connection\(\);\s*notFound\(\);/);
  const partner = read("src/components/Partner/partner.js");
  assert.doesNotMatch(partner, /Landstrasse/);
  const page = code("src/app/[locale]/ueber-uns/partner/page.js");
  assert.doesNotMatch(page, /Starke|Trusted|meta\?\.title/);
  // Runde 5 P6 (seo): sprechender Titel 30–60 Zeichen statt nur „Partner“ –
  // bewusst geänderte Erwartung; weiterhin ohne Werbefloskel/CMS-Titel.
  assert.match(page, /default: return "Partnerbetriebe in Vorarlberg \| Platzhirsch Home Living";/);
});

// ---------------------------------------------------------------- 8 Impressum/ki-assistenten
test("8 Impressum: WKO-Zeile vorbereitet, ohne belegte Angaben nicht gerendert", () => {
  const src = read("src/components/Impressum/impressum.js");
  // 30.10.2026: Kammer aus WKO Firmen A–Z belegt (Quelle Pflicht).
  assert.match(src, /source: "WKO Firmen A–Z/);
  assert.match(src, /if \(!c\?\.chamber \|\| !groups\.length \|\| !c\.source \|\| !c\.checkedAt\) return null;/);
  assert.match(src, /\{chamber && \(/);
  assert.doesNotMatch(src, /\[WKO|Fachgruppe folgt|TODO/);
});

test("8 ki-assistenten: kein „z. Zum Beispiel“, Description ≤ 165, og:image-Karte", async () => {
  const tools = read("src/lib/agent/tools.js");
  const first = tools.match(/"Sucht aktive Produkte[^"]*"/)[0];
  assert.doesNotMatch(first.split(/(?<=\.)\s/)[0], /z\.$|z\. B\./);
  const copy = read("src/lib/agent/copy.js");
  const descs = [...copy.matchAll(/\? "(Claude[^"]+)"\s*: "(Claude[^"]+)"/g)][0];
  assert.ok(descs, "beide Descriptions gefunden");
  for (const d of [descs[1], descs[2]]) assert.ok(d.length <= 165, `${d.length}: ${d}`);
  assert.match(read("src/app/[locale]/ki-assistenten/page.js"), /deOnlyMetadata\(/);
  assert.match(read("src/app/[locale]/ki-assistenten/opengraph-image.js"), /ogCardImage\("\/ki-assistenten"\)/);
  assert.match(read("src/lib/seo/pageMetadata.js"), /"\/ki-assistenten": \{/);
});

// ---------------------------------------------------------------- 9 Schema & Signale
test("9 BreadcrumbList zentral, Team-Krumen = Menü (Das Haus › Team)", () => {
  const trail = houseTrail("de", "Team", "/ueber-uns/platzhirsch");
  assert.deepEqual(trail.map((i) => i.label), ["Startseite", "Das Haus", "Team"]);
  const ld = breadcrumbJsonLd(trail, "de", { id: "x#breadcrumb" });
  assert.equal(ld["@type"], "BreadcrumbList");
  assert.deepEqual(ld.itemListElement.map((i) => i.item), ["https://platzhirsch.studio/de", "https://platzhirsch.studio/de/ueber-uns/platzhirsch", undefined]);
  assert.match(read("src/components/Team/team.js"), /breadcrumbs=\{teamTrail\(locale\)\}/);
  assert.match(read("src/app/[locale]/ueber-uns/team/page.js"), /breadcrumbJsonLd\(teamTrail\(locale\), locale/);
});

test("9 Person-Schema Harald Menghin: worksFor #organization, knowsAbout, kein erfundener jobTitle", () => {
  const src = read("src/lib/seo/structuredData.js");
  assert.match(src, /"Harald Menghin": Object\.freeze\(/);
  assert.match(src, /worksFor: \{ "@id": ORGANIZATION_ID \}/);
  assert.match(src, /de: \["Handzeichnung", "Raummodelle"/);
  assert.match(src, /\.\.\.\(jobTitle \? \{ jobTitle \} : \{\}\)/);
  // jobTitle nur aus der Team-Seite (Backoffice-Rolle oder inhalt.team.roles).
  const de = JSON.parse(read("src/messages/de.json"));
  assert.equal(de.inhalt.team.roles["Harald Menghin"], undefined, "Harald hat auf der Team-Seite keine Rolle → kein jobTitle");
});

test("9 robots.txt: Applebot-Extended gesperrt wie GPTBot, /*?* auch für Googlebot/Bingbot", async () => {
  const src = read("src/app/robots.js");
  const groups = src.split("userAgent:").slice(1);
  const training = groups.find((g) => g.includes('"GPTBot"'));
  assert.match(training, /"Applebot-Extended"/);
  assert.match(training, /disallow: \["\/"\]/);
  const search = groups.find((g) => g.includes('"Googlebot"'));
  assert.match(search, /"\/\*\?\*"/);
  const answer = groups.find((g) => g.includes('"OAI-SearchBot"'));
  assert.doesNotMatch(answer, /Applebot-Extended/);
  assert.match(answer, /"\/\*\?\*"/);
});

test("9 og:image-Standard typografisch, 404 ohne Herstellerfoto", () => {
  const meta = read("src/lib/seo/pageMetadata.js");
  assert.match(meta, /export const DEFAULT_OG_IMAGE = "\/og-standard\.png";/);
  assert.doesNotMatch(meta, /aboutHome\.jpg";/);
  assert.match(read("src/app/og-standard.png/route.js"), /ogDefaultImageResponse/);
  const nf = code("src/components/NotFound/NotFoundContent.js");
  assert.doesNotMatch(nf, /minotti|\.webp|next\/image/i);
});
