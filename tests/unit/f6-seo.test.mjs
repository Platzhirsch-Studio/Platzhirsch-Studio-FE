// tests/unit/f6-seo.test.mjs — Fix-Team F6 (SEO, Ezarri, Katalog), 28.10.2026.
//   1. Site JSON-LD: Ezarri as brand with #brand/ezarri, café as containsPlace,
//      knowsAbout with the Kern-USP, areaServed without the noindex cities;
//      Rich-Results-tauglich (validateRichResult) for LocalBusiness + Café.
//   2. Ezarri mosaics: no Product node without offers (ItemPage + Thing).
//   3. deOnlyMetadata(): hreflang de + x-default, og:image only with rights,
//      title ≤ 65 / description ≤ 165.
//   4. Sitemap hook: 10 Ezarri pages added (tools + 7 custom collections).
//   5. llms.txt header with the Kern-USP; shop copy without blanket delivery promise.
//   6. Landing targets in the visitor's language; catalogue search query rules.
//   7. Live (dev server): sitemap URLs 200 + index + self-canonical, ?q= filters.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const SITE = process.env.SITE_URL || process.env.SITEMAP_BASE || process.env.QA_BASE || "";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier.startsWith("@/")) {
      const base = path.join(SRC, specifier.slice(2));
      const file = [base, `${base}.js`, path.join(base, "index.js")].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
      if (file) return next(pathToFileURL(file).href, context);
    }
    return next(specifier, context);
  },
});

const load = (rel) => import(pathToFileURL(path.join(SRC, rel)).href);
let SCHEMA, AUDIT, PM, EZ_SCHEMA, EZ_DATA, LLMS, SHOP, TARGETS, DOORWAY;
before(async () => {
  SCHEMA = await load("lib/seo/siteSchema.js");
  AUDIT = await load("lib/seo/audit/seoAudit.js");
  PM = await load("lib/seo/pageMetadata.js");
  EZ_SCHEMA = await load("components/Ezarri/Welt/schema.js");
  EZ_DATA = await load("lib/ezarri/data.js");
  LLMS = await load("lib/seo/llms.js");
  SHOP = await load("lib/seo/shopSeoCopy.js");
  TARGETS = await load("components/Landing/targets.js");
  DOORWAY = await load("lib/seo/sitemap/doorwayAudit.js");
});

// Runde 3 P5: Bregenz, Lindau, Dornbirn, St. Gallen and Friedrichshafen pass the
// doorway audit now (own facts); still noindex: Kempten, Ravensburg.
const NOINDEX_CITIES = ["Kempten", "Ravensburg"];

// ---------------------------------------------------------------- 1. site JSON-LD
test("Organization: Ezarri-Brand mit #brand/ezarri, Café, USP, areaServed konsistent zum Doorway-Audit", () => {
  const org = SCHEMA.organizationNode();
  assert.ok(SCHEMA.SHOWROOM_BRANDS.includes("Ezarri"));
  const ezarri = org.brand.find((b) => b.name === "Ezarri");
  assert.equal(ezarri["@id"], "https://platzhirsch.studio/#brand/ezarri");
  assert.equal(ezarri["@id"], EZ_SCHEMA.BRAND_ID, "gleiche @id wie die Ezarri-Welt");
  for (const topic of ["Einrichtungsplanung mit Handzeichnung", "Raummodelle im Maßstab"]) assert.ok(org.knowsAbout.includes(topic), topic);
  const cafe = org.containsPlace;
  assert.equal(cafe["@type"], "CafeOrCoffeeShop");
  assert.deepEqual(cafe.containedInPlace, { "@id": SCHEMA.ORGANIZATION_ID });
  assert.deepEqual(cafe.address, org.address);
  assert.ok(!("servesCuisine" in cafe) && !("priceRange" in cafe) && !("menu" in cafe), "nur belegte Angaben");
  const cities = org.areaServed.filter((a) => a["@type"] === "City").map((a) => a.name);
  for (const c of NOINDEX_CITIES) assert.ok(!cities.includes(c), c);
  // Runde 3 P5: Vaduz is served by the Liechtenstein page.
  const pageOf = (c) => (c === "Vaduz" ? "/designermoebel-liechtenstein" : `/designermoebel-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
  for (const c of cities) assert.ok(DOORWAY.passesDoorwayAudit(pageOf(c)), c);
});

test("Site-JSON-LD Rich-Results-tauglich: LocalBusiness + Café ohne Fehler, keine Bewertungen/Preise", () => {
  const doc = SCHEMA.siteSchema();
  const nodes = AUDIT.jsonLdNodes ? AUDIT.jsonLdNodes([doc]) : [doc["@graph"][0], doc["@graph"][0].containsPlace];
  const local = nodes.filter((n) => AUDIT.richResultKind(n) === "LocalBusiness");
  assert.ok(local.length >= 1);
  for (const n of [...local, doc["@graph"][0].containsPlace]) assert.deepEqual(AUDIT.validateRichResult(n), [], JSON.stringify(n["@type"]));
  assert.doesNotMatch(JSON.stringify(doc), /aggregateRating|"review"|"offers"|"price"/);
  assert.doesNotMatch(SCHEMA.SITE_DESCRIPTION, /ganz Österreich/);
});

// ---------------------------------------------------------------- 2. Ezarri mosaics
test("Ezarri-Mosaik: kein Product ohne Angebot (ItemPage + Thing), kein Preis", () => {
  const node = EZ_SCHEMA.mosaikNode({
    ref: { name: "2502-A 25", code: "2502-A", farben: ["Blau"] },
    path: "/ezarri/mosaike/2502-a",
    kollektionName: "Niebla",
    kollektionPath: "/ezarri/kollektionen/niebla",
    images: ["/ezarri/niebla/x-1600.webp"],
    facts: [{ name: "Format", value: "25 × 25 mm" }, { name: "Dicke", value: null }],
  });
  assert.equal(node["@type"], "ItemPage");
  assert.equal(node.mainEntity["@type"], "Thing");
  assert.equal(AUDIT.richResultKind(node), null, "kein Product-Snippet-Kandidat");
  assert.equal(AUDIT.richResultKind(node.mainEntity), null);
  assert.doesNotMatch(JSON.stringify(node), /"Product"|"offers"|"price"/);
  assert.deepEqual(node.about, [{ "@id": EZ_SCHEMA.BRAND_ID }]);
  assert.match(node.mainEntity.description, /Format: 25 × 25 mm/);
  assert.doesNotMatch(node.mainEntity.description, /Dicke/);
  assert.equal(node.isPartOf.url, "https://platzhirsch.studio/de/ezarri/kollektionen/niebla");
});

// ---------------------------------------------------------------- 3. deOnlyMetadata
test("deOnlyMetadata: hreflang nur de + x-default, Self-Canonical, Längen, og:image nur mit Rechten", () => {
  const m = PM.deOnlyMetadata({ path: "/kuechen-vorarlberg", title: "x".repeat(80), description: "Wort ".repeat(60) });
  assert.deepEqual(Object.keys(m.alternates.languages).sort(), ["de", "x-default"]);
  assert.equal(m.alternates.canonical, "https://platzhirsch.studio/de/kuechen-vorarlberg");
  assert.ok(m.title.length <= 65 && m.description.length <= 165);
  assert.equal(m.openGraph.images[0].url, "https://platzhirsch.studio/de/kuechen-vorarlberg/opengraph-image");
  assert.equal(m.openGraph.images[0].width, 1200);
  // Ohne Karte und ohne freigegebenes Bild: kein og:image statt eines Fotos ohne Rechte.
  const none = PM.deOnlyMetadata({ path: "/unbekannt", title: "T", description: "D" });
  assert.equal(none.openGraph.images, undefined);
  assert.equal(none.twitter.card, "summary");
  // Eigenes Bild (z. B. Ezarri-Material) gewinnt.
  const own = PM.deOnlyMetadata({ path: "/yacht-interior", title: "T", description: "D", image: "/ezarri/a-1600.webp" });
  assert.equal(own.openGraph.images[0].url, "/ezarri/a-1600.webp");
});

test("OG-Karten: jede eigene Landingpage, Yacht und Outdoor haben eine Karte mit Datei", () => {
  const pages = [
    "/yacht-interior", "/outdoor-gartenplanung", "/kuechen-vorarlberg", "/interior-design-vorarlberg",
    "/wohnzimmer-einrichten-vorarlberg", "/moebel-bodensee", ...Object.keys(DOORWAY.REGION_AUDIT),
  ];
  for (const p of pages) {
    assert.ok(PM.OG_CARDS[p], `${p}: OG_CARDS`);
    assert.ok(fs.existsSync(path.join(SRC, "app/[locale]", p.slice(1), "opengraph-image.js")), `${p}: opengraph-image.js`);
    assert.doesNotMatch(JSON.stringify(PM.OG_CARDS[p]), /Minotti|Custom Line|Navetta/);
  }
  // Die Karte ist typografisch: kein Foto aus /Images (Rechte offen).
  assert.doesNotMatch(fs.readFileSync(path.join(SRC, "lib/seo/ogCard.js"), "utf8"), /\/Images\/|<img/);
});

test("clampText kürzt an der Wortgrenze", () => {
  assert.equal(PM.clampText("kurz", 65), "kurz");
  const c = PM.clampText("Ein sehr langer Titel, der weit über die erlaubte Länge hinausgeht und gekürzt wird", 40);
  assert.ok(c.length <= 40 && c.endsWith("…"));
});

// ---------------------------------------------------------------- 4. sitemap
test("Sitemap-Hook: Konfigurator, Rechner, Custom-Mix und 7 Custom-Kollektionen enthalten", () => {
  const paths = EZ_DATA.getEzarriEntries(true).map((e) => e.path);
  for (const p of ["/ezarri/konfigurator", "/ezarri/rechner", "/ezarri/custom-mix"]) assert.ok(paths.includes(p), p);
  const custom = ["custom-mix", "custom-printed", "custom-pixel", "patterns", "fading-out", "standard-printed", "standard-pixel"];
  for (const id of custom) assert.ok(paths.includes(`/ezarri/kollektionen/${id}`), id);
  assert.equal(new Set(paths).size, paths.length, "keine Duplikate");
  for (const p of ["/ezarri/anfrage", "/ezarri/konfigurator/blatt", "/ezarri/mosaike/vergleich"]) assert.ok(!paths.includes(p), `${p} ist noindex`);
});

// ---------------------------------------------------------------- 5. copy
test("llms.txt-Einleitung mit Kern-USP; Shop-Texte ohne pauschales Lieferversprechen", () => {
  assert.match(LLMS.LLMS_HEADER, /von Hand/);
  assert.match(LLMS.LLMS_HEADER, /Raummodell/);
  assert.match(LLMS.LLMS_HEADER, /fotorealistisches Rendering/);
  for (const locale of ["de", "en", "fr", "it"]) {
    const { description } = SHOP.categorySeo(locale, { label: "Sofas", count: 3, brands: ["A"], key: "sofas-couches" });
    assert.doesNotMatch(description, /ganz Österreich|throughout Austria/i, locale);
    assert.match(description, /auf Wunsch|on request|sur demande|su richiesta/, locale);
  }
});

// ---------------------------------------------------------------- 6. targets
test("Landing-Ziele: EN/FR/IT verlinken auf Seiten in ihrer Sprache, DE auf die Landingpage", () => {
  assert.deepEqual(TARGETS.landingTarget("/kuechen-vorarlberg", "de"), { href: "/kuechen-vorarlberg", locale: "de", germanOnly: false });
  // Sprach-Integration 01.11.2026 (bewusst geändert): Küchen, Interior, Wohnzimmer,
  // Outdoor und Yacht gibt es in EN/FR/IT – der Link führt auf die Seite selbst.
  assert.deepEqual(TARGETS.landingTarget("/kuechen-vorarlberg", "en"), { href: "/kuechen-vorarlberg", locale: "en", germanOnly: false, own: true });
  assert.equal(TARGETS.landingTarget("/interior-design-vorarlberg", "fr").href, "/interior-design-vorarlberg");
  assert.equal(TARGETS.landingTarget("/outdoor-gartenplanung", "it").href, "/outdoor-gartenplanung");
  // Möbel Bodensee bleibt nur Deutsch → Katalog in der Sprache.
  assert.equal(TARGETS.landingTarget("/moebel-bodensee", "it").href, "/prodotti");
  assert.equal(TARGETS.landingTarget("/yacht-interior", "en").locale, "en");
});

// ---------------------------------------------------------------- 7. live
async function get(url) {
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
  return { status: res.status, body: await res.text() };
}
async function serverUp() {
  try {
    return (await fetch(`${SITE}/llms.txt`, { signal: AbortSignal.timeout(30_000) })).ok;
  } catch {
    return false;
  }
}

// Runde 2 (technik P2-1): the search moved to /de/produkte/suche so the hub
// stays static/cacheable; the hub no longer renders results for ?q=.
test("live: /de/produkte/suche?q=westside filtert serverseitig, noindex, canonical ohne q", async (t) => {
  if (!(await serverUp())) return t.skip("dev server not running");
  const { status, body } = await get(`${SITE}/de/produkte/suche?q=westside`);
  assert.equal(status, 200);
  assert.match(body, /<meta name="robots" content="noindex, follow"\/>/);
  assert.match(body, /<link rel="canonical" href="https:\/\/platzhirsch\.studio\/de\/produkte"\/>/);
  assert.match(body, /data-testid="katalog-suche"/);
  assert.match(body, /Westside/i);
  const hub = await get(`${SITE}/de/produkte`);
  assert.match(hub.body, /<meta name="robots" content="index, follow"\/>/);
  assert.doesNotMatch(hub.body, /data-testid="katalog-suche"/);
});

test("live: Ezarri-Sitemap-URLs 200, index, Self-Canonical, hreflang de + x-default", async (t) => {
  if (!(await serverUp())) return t.skip("dev server not running");
  const xml = (await get(`${SITE}/sitemap-static.xml`)).body;
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const wanted = ["/de/ezarri/konfigurator", "/de/ezarri/rechner", "/de/ezarri/custom-mix", "/de/ezarri/kollektionen/custom-mix", "/de/ezarri/kollektionen/standard-pixel", "/de/yacht-interior", "/de/kuechen-vorarlberg"];
  for (const p of wanted) {
    const url = `https://platzhirsch.studio${p}`;
    assert.ok(locs.includes(url), `${p} in sitemap-static.xml`);
    const { status, body } = await get(`${SITE}${p}`);
    assert.equal(status, 200, p);
    assert.match(body, /<meta name="robots" content="index, follow"\/>/, p);
    assert.ok(body.includes(`<link rel="canonical" href="${url}"/>`), `${p}: self-canonical`);
    const langs = [...body.matchAll(/<link rel="alternate" hrefLang="([^"]+)"/g)].map((m) => m[1]).sort();
    assert.deepEqual(langs, ["de", "x-default"], `${p}: hreflang`);
    assert.match(body, /<meta property="og:image" content="[^"]+"/, `${p}: og:image`);
    const title = body.match(/<title>([^<]*)<\/title>/)[1].replace(/&amp;/g, "&");
    assert.ok(title.length <= 65, `${p}: title ${title.length}`);
  }
});
