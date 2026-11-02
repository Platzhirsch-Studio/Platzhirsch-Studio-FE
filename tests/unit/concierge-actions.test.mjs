// tests/unit/concierge-actions.test.mjs — KI-Concierge seitenweit: Website-Agent.
// Run: node --test tests/unit/concierge-actions.test.mjs
// Double whitelist (actionKinds.js on server and client), proposals from
// actions.js with a fake catalogue and a fake signer – no network, no Claude.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHref, checkAction, cleanNote, ROUTE_KEY_LIST } from "../../src/lib/concierge/actionKinds.js";
import { ACTION_TOOLS, createProposer, resetSessionCounts } from "../../src/lib/concierge/actions.js";

const NOW = Date.parse("2026-10-27T10:00:00Z");
const base = { id: "a_abcdefgh12", sig: "x".repeat(32), exp: NOW + 60_000 };
const ok = (a, locale = "de") => checkAction({ ...base, ...a }, { locale, now: NOW, origin: "https://platzhirsch.studio" });

test("buildHref: Routen-Schlüssel je Sprache, nie eine URL", () => {
  assert.equal(buildHref({ kind: "navigation", params: { route: "beratung" } }, "fr"), "/fr/conseil");
  assert.equal(buildHref({ kind: "navigation", params: { route: "home" } }, "it"), "/it");
  assert.equal(buildHref({ kind: "navigation", params: { route: "marken" } }, "en"), "/en/about-us/brands");
  // German-only pages always link to /de
  assert.equal(buildHref({ kind: "navigation", params: { route: "yacht-interior" } }, "en"), "/de/yacht-interior");
  assert.equal(buildHref({ kind: "navigation", params: { route: "https://evil.example" } }, "de"), null);
  assert.equal(buildHref({ kind: "navigation", params: { route: "javascript:alert(1)" } }, "de"), null);
  assert.equal(buildHref({ kind: "navigation", params: { route: "../admin" } }, "de"), null);
  assert.equal(buildHref({ kind: "navigation", params: { route: "kontakt" } }, "xx"), null);
  assert.ok(ROUTE_KEY_LIST.every((k) => /^[a-z/-]+$/.test(k)));
});

test("buildHref: Produkt, Filter (feste Reihenfolge), Termin mit Vorbelegung", () => {
  assert.equal(buildHref({ kind: "open_product", params: { categorySlug: "sofas-couches", urlSlug: "sofas-riley" } }, "fr"), "/fr/produits/sofas-couches/sofas-riley");
  assert.equal(buildHref({ kind: "open_product", params: { categorySlug: "Sofas", urlSlug: "x" } }, "de"), null);
  assert.equal(buildHref({ kind: "open_product", params: { categorySlug: "a", urlSlug: "b/../../c" } }, "de"), null);
  assert.equal(
    buildHref({ kind: "catalog_filter", params: { categorySlug: "sofas-couches", filters: { typ: ["modulsofa"], marke: ["minotti", "flexform"] } } }, "de"),
    "/de/produkte/sofas-couches?marke=flexform,minotti&typ=modulsofa"
  );
  assert.equal(buildHref({ kind: "catalog_filter", params: { categorySlug: "sofas-couches", filters: { evil: ["x"] } } }, "de"), null);
  assert.equal(buildHref({ kind: "catalog_filter", params: { categorySlug: "sofas-couches", filters: { marke: ["a&b=c"] } } }, "de"), null);
  const href = buildHref({ kind: "appointment_form", params: { note: "Termin: Sofa ansehen", product: "Minotti Riley" } }, "fr");
  assert.equal(href, "/fr/conseil?quelle=concierge&anliegen=Termin%3A+Sofa+ansehen&produkt=Minotti+Riley#anfrage");
});

test("cleanNote: keine Personendaten, keine URLs, keine Steuerzeichen", () => {
  const n = cleanNote("Bitte Rückruf an max@example.com oder +43 664 1234567, siehe https://x.example/a\u0007 – Sofa 240 cm");
  assert.doesNotMatch(n, /@|664|https|x\.example|\u0007/);
  assert.match(n, /Sofa 240 cm/);
  assert.ok(cleanNote("a".repeat(500)).length <= 300);
});

test("checkAction (Client): Art, Signaturformat, Ablauf, Pfad", () => {
  assert.equal(ok({ kind: "navigation", params: { route: "kontakt" } }).href, "/de/kontakt");
  assert.equal(ok({ kind: "navigation", params: { route: "kontakt" }, exp: NOW - 1 }).error, "expired");
  assert.equal(ok({ kind: "submit_form", params: {} }).error, "kind");
  assert.equal(ok({ kind: "navigation", params: { route: "kontakt" }, sig: "<b>" }).error, "sig");
  assert.equal(ok({ kind: "navigation", params: { route: "kontakt" }, id: "x" }).error, "id");
  assert.equal(ok({ kind: "scroll_to_section", params: { sectionId: "masse-title" } }).ok, true);
  assert.equal(ok({ kind: "scroll_to_section", params: { sectionId: "<img>" } }).ok, false);
  const item = { id: "Riley", categorySlug: "sofas-couches", urlSlug: "sofas-riley" };
  assert.equal(ok({ kind: "save_to_selection", params: { items: [item] } }).ok, true);
  assert.equal(ok({ kind: "save_to_selection", params: { items: Array(7).fill(item) } }).ok, false);
  assert.equal(ok({ kind: "save_to_selection", params: { items: [{ ...item, urlSlug: "../x" }] } }).ok, false);
});

// Fake catalogue: one category with three products.
const PRODUCTS = [
  { id: "Riley", name: "Riley", brand: "Minotti", categoryKey: "sofas-couches", url_slug: "sofas-riley", subCategoryKeys: ["Modulsofa"], materialKeys: [], colorKeys: [], indoorOutdoor: "Indoor" },
  { id: "Lido", name: "Lido", brand: "Minotti", categoryKey: "sofas-couches", url_slug: "sofas-lido", subCategoryKeys: [], materialKeys: [], colorKeys: [], indoorOutdoor: "Indoor" },
  { id: "Mags", name: "Mags", brand: "HAY", categoryKey: "sofas-couches", url_slug: "mags", subCategoryKeys: ["Modulsofa"], materialKeys: [], colorKeys: [], indoorOutdoor: "Indoor" },
];
const SEEN = { Riley: { id: "Riley", name: "Riley", brand: "Minotti", categorySlug: "sofas-couches", urlSlug: "sofas-riley", image: null } };
const catalog = {
  findCategory: async (k) => (k === "sofas-couches" ? { key: "sofas-couches", slug: "sofas-couches", label: "Sofas" } : null),
  categoryProducts: async () => PRODUCTS,
  seenProduct: (id) => SEEN[id] || null,
};
const signed = [];
const propose = createProposer({
  catalog,
  sign: (p) => {
    signed.push(p);
    return "s".repeat(32);
  },
  now: () => NOW,
});

test("Vorschlag Filter: geprüft, Trefferzahl, signiert; 0 Treffer → Fehler", async () => {
  resetSessionCounts();
  const r = await propose("propose_catalog_filter", { category_key: "sofas-couches", brand: ["Minotti"], sub_category: ["Modulsofa"] }, { sid: "S1", locale: "de" });
  assert.equal(r.isError, undefined);
  assert.equal(r.action.kind, "catalog_filter");
  assert.equal(r.action.count, 1);
  assert.equal(r.action.href, "/de/produkte/sofas-couches?marke=minotti&typ=modulsofa");
  assert.equal(r.action.exp, NOW + 30 * 60 * 1000);
  assert.equal(signed.at(-1).sid, "S1");
  assert.deepEqual(JSON.parse(r.content), { proposed: true, id: r.action.id, shown_to_customer: true, executed: false, label: "Sofas · Minotti · Modulsofa", summary: "1 Stück" });
  const none = await propose("propose_catalog_filter", { category_key: "sofas-couches", brand: ["HAY"], sub_category: ["Nope"] }, { sid: "S1" });
  assert.equal(none.isError, true);
  const zero = await propose("propose_catalog_filter", { category_key: "sofas-couches", brand: ["HAY"], area: ["Outdoor"] }, { sid: "S1" });
  assert.equal(zero.isError, true);
  const unknown = await propose("propose_catalog_filter", { category_key: "raketen" }, { sid: "S1" });
  assert.equal(unknown.isError, true);
});

test("Vorschläge: nur gezeigte Produkte, nur bekannte Abschnitte, nur Whitelist-Routen", async () => {
  resetSessionCounts();
  assert.equal((await propose("propose_open_product", { product_id: "Riley" }, { sid: "S2" })).action.href, "/de/produkte/sofas-couches/sofas-riley");
  assert.equal((await propose("propose_open_product", { product_id: "Erfunden" }, { sid: "S2" })).isError, true);
  assert.equal((await propose("propose_save_to_selection", { product_ids: ["Riley", "Erfunden"] }, { sid: "S3" })).isError, true);
  const sec = [{ id: "masse-title", label: "Maße" }];
  assert.equal((await propose("propose_scroll_to_section", { section_id: "masse-title" }, { sid: "S4", sections: sec })).action.kind, "scroll_to_section");
  assert.equal((await propose("propose_scroll_to_section", { section_id: "nicht-da" }, { sid: "S4", sections: sec })).isError, true);
  assert.equal((await propose("propose_navigation", { route: "https://evil.example" }, { sid: "S5" })).isError, true);
  const nav = await propose("propose_navigation", { route: "beratung" }, { sid: "S5", locale: "it" });
  assert.equal(nav.action.href, "/it/consulenza");
});

test("Termin-Vorschlag: Notiz ohne Personendaten, nie Absenden", async () => {
  const r = await propose("propose_appointment_form", { topic: "Sofa", note: "Rückruf unter 0664 1234567 oder a@b.at", product_id: "Riley" }, { sid: "S6", locale: "de" });
  assert.doesNotMatch(r.action.params.note, /0664|@/);
  assert.match(r.action.href, /^\/de\/beratung\?quelle=concierge&anliegen=/);
  assert.match(r.action.href, /produkt=Minotti\+Riley/);
  assert.ok(!ACTION_TOOLS.some((t) => /submit|send|delete|clear|consent|checkout/.test(t.name)));
});

test("Grenzen: max. 3 pro Antwort (auch parallel), 30 pro Session", async () => {
  resetSessionCounts();
  const env = { sid: "S7", round: { count: 0 } };
  const results = await Promise.all([1, 2, 3, 4].map(() => propose("propose_navigation", { route: "kontakt" }, env)));
  assert.equal(results.filter((r) => r.action).length, 3);
  assert.equal(results.filter((r) => r.isError).length, 1);
  resetSessionCounts();
  let last;
  for (let i = 0; i < 31; i++) last = await propose("propose_navigation", { route: "kontakt" }, { sid: "S8" });
  assert.equal(last.isError, true);
});

test("Tool-Definitionen: 6 Werkzeuge, eager streaming, deterministisch", () => {
  assert.deepEqual(
    ACTION_TOOLS.map((t) => t.name),
    ["propose_navigation", "propose_open_product", "propose_catalog_filter", "propose_save_to_selection", "propose_appointment_form", "propose_scroll_to_section"]
  );
  assert.ok(ACTION_TOOLS.every((t) => t.eager_input_streaming === true));
});
