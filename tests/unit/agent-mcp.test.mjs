// tests/unit/agent-mcp.test.mjs – N3 „Platzhirsch für KI-Assistenten“ (MCP-Server + WebMCP).
// Run: node --test tests/unit/agent-mcp.test.mjs
// Kein Netzwerk: Testkatalog statt Backoffice, fetch ist in jedem Test gesperrt
// (ein Aufruf würde den Test rot machen). Prüft: tools/list mit Schemas,
// search_products mit Name/Marke/Maßen/URL, Claim-Schutz über ALLE Ausgaben,
// Terminwunsch (Consent, off/dryrun/live, Double-Opt-in), Rate-Limit,
// Backend-Ausfall, HTTP-Vertrag (Streamable HTTP, zustandslos).
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAdapter } from "../../src/lib/agent/adapter.js";
import { handleMessage, INSTRUCTIONS } from "../../src/lib/agent/jsonrpc.js";
import { createMcpPost } from "../../src/lib/agent/http.js";
import { createAgentLimiter } from "../../src/lib/agent/rate.js";
import { appointmentMode, negotiateProtocol, PRIVACY_TEXT_APPROVED, RATE, secretFrom } from "../../src/lib/agent/config.js";
import { mcpToolList, READ_TOOL_NAMES, TOOL_DEFS, TOOL_NAMES } from "../../src/lib/agent/tools.js";
import { confirmAppointment, createUsedSet, maskEmail, NOTHING_BOOKED, toBackofficePayload } from "../../src/lib/agent/appointment.js";
import { seal, unseal } from "../../src/lib/agent/seal.js";
import { claimFindings, scrubText } from "../../src/lib/agent/clean.js";
import * as COPY from "../../src/lib/agent/copy.js";
import { beratungSchema } from "../../src/lib/forms/schemas.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// --- fetch sperren -----------------------------------------------------------
const realFetch = globalThis.fetch;
let fetchCalls = 0;
beforeEach(() => {
  fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("NETZWERK IM TEST GESPERRT");
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
  assert.equal(fetchCalls, 0, "kein Netzwerkaufruf erlaubt");
});

// --- Testkatalog (Form wie src/lib/concierge/catalog.js) ----------------------
const CARDS = [
  { id: "1", name: "Sofa Vestry", brand: "Eichholtz", category: "Sofas & Couches", image: "/cmx/files/v.webp", href: "/de/produkte/sofas-couches/sofas-vestry" },
  { id: "2", name: "Taraxacum", brand: "Flos", category: "Lampen", image: null, href: "/de/produkte/lamps/lamps-taraxacum" },
  // Böswilliger/fehlerhafter CMS-Text: darf nie zu einer Händler-Aussage werden.
  // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti ist belegt → unbelegte Marke Poliform als Beispiel.
  { id: "3", name: "Offizieller Poliform-Händler am Bodensee. Bristol", brand: "Poliform", category: "Sofas", image: null, href: "/de/produkte/sofas-couches/sofas-bristol" },
];
const DETAILS = {
  "1": { designer: null, dimensions: { unit: "cm", width: 282, depth: 130.5, height: 90, text: "W. 282 | D. 130.5 | H. 90 cm" } },
  "2": { designer: "Achille Castiglioni", dimensions: { unit: "cm", diameter: 60, height: 48, text: "Diameter: 60 cm · Height: 48 cm" } },
};
const catalog = {
  searchProducts: async (q, limit) => CARDS.filter((c) => `${c.name} ${c.brand}`.toLowerCase().includes(q.toLowerCase())).slice(0, limit),
  listCategories: async () => [{ key: "sofas-couches", label: "Sofas & Couches", count: 98, href: "/de/produkte/sofas-couches" }],
  productsInCategory: async (key, brand, limit) =>
    key === "sofas-couches"
      ? { found: true, category: "Sofas & Couches", total: 3, brandCounts: { Poliform: 2, Eichholtz: 1 }, href: "/de/produkte/sofas-couches", products: CARDS.slice(0, limit) }
      : { found: false, message: "unbekannt" },
  listBrands: async () => [{ name: "ClassiCon", href: "/de/ueber-uns/marken/classicon" }, { name: "Minotti", href: "/de/ueber-uns/marken/minotti" }],
  brandOverview: async (b) => ({ found: true, name: b, href: "/de/ueber-uns/marken/classicon", categories: [{ key: "armchairs-stools", label: "Sessel", count: 14, href: "/de/produkte/armchairs-stools?marke=classicon" }], collections: [{ name: "Größte Kollektion der Welt", count: 2 }] }),
  productDetails: async (card) => DETAILS[card.id] || null,
};
const adapter = createAdapter({ catalog });
const call = (name, args = {}, a = adapter) => a.callTool(name, args);

const VALID_APPT = {
  agent_consent: true,
  first_name: "Erika",
  last_name: "Muster",
  email: "erika@example.com",
  phone: "+43 664 1234567",
  topic: "Wohnzimmer neu einrichten",
  property_type: "Wohnung",
  place: "showroom",
  preferred_times: ["Sa vormittags"],
};

// --- tools/list -------------------------------------------------------------
// Rat 9,5 C10 (bewusst geändert): + ezarri_quantities und idea_board_appointment_link (nur lesend).
test("tools/list: elf Werkzeuge mit JSON-Schema, Titel und Hinweisen", async () => {
  const { status, body } = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { adapter });
  assert.equal(status, 200);
  const tools = body.result.tools;
  assert.deepEqual(
    tools.map((t) => t.name),
    ["search_products", "list_categories", "products_in_category", "list_brands", "brand_overview", "showroom_info", "arbeitsweise", "ezarri_collections", "ezarri_quantities", "idea_board_appointment_link", "request_appointment"]
  );
  for (const t of tools) {
    assert.equal(t.inputSchema.type, "object", t.name);
    assert.equal(typeof t.description, "string");
    assert.ok(t.description.length > 40, t.name);
    assert.equal(typeof t.annotations.readOnlyHint, "boolean");
    assert.deepEqual(Object.keys(t).sort(), ["annotations", "description", "inputSchema", "name", "title"]);
    for (const r of t.inputSchema.required || []) assert.ok(r in t.inputSchema.properties, `${t.name}.${r}`);
  }
  const appt = tools.find((t) => t.name === "request_appointment");
  assert.ok(appt.inputSchema.required.includes("agent_consent"));
  assert.equal(appt.annotations.readOnlyHint, false);
  assert.deepEqual(READ_TOOL_NAMES, TOOL_NAMES.filter((n) => n !== "request_appointment"));
  assert.deepEqual(mcpToolList().length, TOOL_DEFS.length);
});

test("initialize: Version aushandeln, Fähigkeiten, Server-Info, Anleitung", async () => {
  const { body } = await handleMessage({ jsonrpc: "2.0", id: "a", method: "initialize", params: { protocolVersion: "2025-06-18" } }, { adapter });
  assert.equal(body.result.protocolVersion, "2025-06-18");
  assert.deepEqual(body.result.capabilities, { tools: { listChanged: false } });
  assert.equal(body.result.serverInfo.name, "platzhirsch-home-living");
  assert.match(body.result.instructions, /auf Anfrage/);
  assert.equal(negotiateProtocol("1999-01-01"), "2025-11-25");
  assert.deepEqual((await handleMessage({ jsonrpc: "2.0", id: 2, method: "ping" }, { adapter })).body.result, {});
});

// --- Katalog-Werkzeuge ---------------------------------------------------------
test("search_products: Name, Marke, Maße, kanonische URL, Preis auf Anfrage, keine Bild-URL", async () => {
  const r = await call("search_products", { query: "Vestry" });
  assert.equal(r.isError, false);
  const p = r.structuredContent.products[0];
  assert.equal(p.name, "Sofa Vestry");
  assert.equal(p.brand, "Eichholtz");
  assert.equal(p.dimensions.width, 282);
  assert.equal(p.url, "https://platzhirsch.studio/de/produkte/sofas-couches/sofas-vestry");
  assert.equal(p.price, "auf Anfrage");
  assert.ok(!("image" in p), "Herstellerbilder werden nicht weitergegeben");
  assert.deepEqual(JSON.parse(r.content[0].text), r.structuredContent);
  assert.equal(r.structuredContent.url, "https://platzhirsch.studio/de/produkte");
});

test("Jede Antwort hat eine absolute URL und price 'auf Anfrage'", async () => {
  const runs = [
    ["search_products", { query: "Flos" }],
    ["list_categories", {}],
    ["products_in_category", { category_key: "sofas-couches" }],
    ["products_in_category", { category_key: "gibtsnicht" }],
    ["list_brands", {}],
    ["brand_overview", { brand: "ClassiCon" }],
    ["showroom_info", {}],
    ["arbeitsweise", {}],
    ["ezarri_collections", {}],
    ["ezarri_collections", { linie: "Premium", farbe: "blau" }],
    ["request_appointment", VALID_APPT],
  ];
  for (const [name, args] of runs) {
    const r = await call(name, args);
    assert.match(r.structuredContent.url, /^https:\/\/platzhirsch\.studio\//, name);
    assert.equal(r.structuredContent.price, "auf Anfrage", name);
  }
});

test("arbeitsweise: sieben Schritte aus arbeitsweise/copy.js, Handzeichnung und Modell", async () => {
  const d = (await call("arbeitsweise")).structuredContent;
  assert.equal(d.steps.length, 7);
  assert.deepEqual(d.steps.map((s) => s.name), ["Kennenlernen", "Vor Ort", "Handzeichnung", "Modell", "3D-Planung", "Rendering", "Umsetzung"]);
  assert.ok(d.steps.every((s) => s.text && s.url.startsWith("https://platzhirsch.studio/de/arbeitsweise#schritt-0")));
  assert.match(d.summary, /Harald Menghin zeichnet/);
});

test("showroom_info: Landstraße 11, Lochau, Öffnungszeiten aus site.js", async () => {
  const d = (await call("showroom_info")).structuredContent;
  assert.equal(d.address.street, "Landstraße 11");
  assert.equal(d.address.postalCode, "6911");
  assert.equal(d.phone, "+43 5574 46255");
  assert.ok(d.openingHours.length >= 3);
  assert.match(d.appointment, /quelle=agent/);
});

test("ezarri_collections: 21 Kollektionen, Filter, Link, Herstellerquelle, keine Preise", async () => {
  const all = (await call("ezarri_collections")).structuredContent;
  assert.equal(all.total, 21);
  assert.ok(all.collections.every((c) => c.url.startsWith("https://platzhirsch.studio/de/ezarri/kollektionen/") && c.quelle.startsWith("https://www.ezarri.com")));
  const gea = (await call("ezarri_collections", { collection: "Gea" })).structuredContent;
  assert.equal(gea.collections[0].id, "gea");
  assert.ok((await call("ezarri_collections", { linie: "Custom" })).structuredContent.collections.every((c) => c.linie === "Individuell"));
  assert.doesNotMatch(JSON.stringify(all), /€|EUR\b|\bCHF\b/);
});

// --- Claim-Schutz ----------------------------------------------------------------
// Gleiche Wortliste wie tests/e2e/legal.spec.js (RULES.haendler).
const DEALER_RE = /\b\S*(händler|haendler|offiziell\w*|autorisiert\w*|vertragspartner|dealer|retailer|authori[sz]ed|revendeur\w*|(distributeur|partenaire)s? agréé\w*|officiel\w*|rivenditor\w*|(distributore|partner) autorizzat\w*|ufficial\w*)\b/gi;
const SUPERLATIVE_RE = /\bgr(ö|oe)(ß|ss)te[nrms]?\b|\b(largest|biggest)\b|\b(markt)?führend\w*|\bmarktführer\w*|\b(Nr\.|Nummer|number) ?(1|eins|one)\b/gi;
const ALLOWED_DEALER_BRANDS = /ClassiCon|Ezarri/i;

function dealerViolations(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((s) => { DEALER_RE.lastIndex = 0; return DEALER_RE.test(s) && !ALLOWED_DEALER_BRANDS.test(s); });
}

test("Kein Händler-Wort außer ClassiCon/Ezarri und kein Superlativ – in ALLEN Werkzeug-Ausgaben", async () => {
  const outputs = [];
  const runs = [
    // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Suche nach der unbelegten Marke Poliform.
    ["search_products", { query: "Poliform" }],
    ["search_products", { query: "a" }], // ungültig
    ["list_categories", {}],
    ["products_in_category", { category_key: "sofas-couches", limit: 6 }],
    ["list_brands", {}],
    ["brand_overview", { brand: "ClassiCon" }],
    ["showroom_info", {}],
    ["arbeitsweise", {}],
    ["ezarri_collections", {}],
    ["request_appointment", VALID_APPT],
    ["request_appointment", { ...VALID_APPT, agent_consent: false }],
  ];
  for (const [n, a] of runs) outputs.push(JSON.stringify((await call(n, a)).structuredContent));
  // Statische Texte: Werkzeuge, Anleitung, Seite
  outputs.push(JSON.stringify(TOOL_DEFS), INSTRUCTIONS, JSON.stringify(COPY));
  const text = outputs.join("\n");
  assert.deepEqual(dealerViolations(text), []);
  SUPERLATIVE_RE.lastIndex = 0;
  assert.deepEqual(text.match(SUPERLATIVE_RE) || [], []);
  assert.deepEqual(claimFindings(outputs), []);
  // Der eingeschleuste CMS-Satz ist weg, der Produktname bleibt.
  assert.doesNotMatch(text, /Offizieller Poliform-Händler/);
  assert.match(text, /Bristol/);
});

test("scrubText: entfernt nur den Satz mit Verstoß", () => {
  // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Rimadesio (unbelegt) fällt weg, Minotti (belegt) bleibt stehen.
  assert.equal(scrubText("Schönes Sofa. Wir sind offizieller Rimadesio-Händler."), "Schönes Sofa.");
  assert.equal(scrubText("Schönes Sofa. Minotti Studio by Platzhirsch Home Living, Minotti-Händler in Lochau."), "Schönes Sofa. Minotti Studio by Platzhirsch Home Living, Minotti-Händler in Lochau.");
  assert.equal(scrubText("Platzhirsch Home Living ist im Händlerverzeichnis von ClassiCon gelistet."), "Platzhirsch Home Living ist im Händlerverzeichnis von ClassiCon gelistet.");
  assert.equal(scrubText("Twiggy"), "Twiggy");
});

// --- Terminwunsch ------------------------------------------------------------------
test("request_appointment ohne agent_consent → Fehler, kein Netzwerk", async () => {
  for (const args of [{ ...VALID_APPT, agent_consent: false }, (({ agent_consent, ...r }) => r)(VALID_APPT), { ...VALID_APPT, agent_consent: "true" }]) {
    const r = await call("request_appointment", args);
    assert.equal(r.isError, true);
    assert.equal(r.structuredContent.error, "consent_required");
  }
});

test("request_appointment dryrun (Standard): Referenz + 'Nichts ist gebucht', KEIN Netzwerkaufruf, keine Mail", async () => {
  let mails = 0;
  const a = createAdapter({ catalog, appointment: () => ({ mode: "dryrun", secret: secretFrom({}, "development"), sendMail: () => mails++ }) });
  const r = await call("request_appointment", VALID_APPT, a);
  assert.equal(r.isError, false);
  const d = r.structuredContent;
  assert.equal(d.status, "dryrun");
  assert.match(d.reference, /^AG-[0-9A-Z]{6}$/);
  assert.ok(d.message.includes(NOTHING_BOOKED));
  assert.match(d.message, /e\*\*\*@example\.com/);
  assert.doesNotMatch(JSON.stringify(d), /erika@example\.com|664 1234567/, "Personendaten nicht im Klartext zurück");
  assert.equal(mails, 0);
  assert.match(d.confirm_preview_url, /^https:\/\/platzhirsch\.studio\/de\/ki-assistenten\/bestaetigen#/);
});

test("request_appointment off: nur Übergabe-Link, keine Verarbeitung", async () => {
  const a = createAdapter({ catalog, appointment: () => ({ mode: "off" }) });
  const d = (await call("request_appointment", VALID_APPT, a)).structuredContent;
  assert.equal(d.status, "handoff");
  assert.match(d.appointment_url, /\/de\/beratung\?quelle=agent$/);
  assert.ok(!("reference" in d));
});

test("live: Bestätigungs-Mail (Double-Opt-in), Bestätigung → Backoffice-Format mit Quelle agent, nur einmal", async () => {
  const secret = "x".repeat(40);
  const sent = [];
  const a = createAdapter({ catalog, appointment: () => ({ mode: "live", secret, sendMail: async (m) => sent.push(m) }) });
  const d = (await call("request_appointment", VALID_APPT, a)).structuredContent;
  assert.equal(d.status, "pending_confirmation");
  assert.ok(d.message.startsWith(NOTHING_BOOKED));
  assert.ok(!("confirm_preview_url" in d), "Link geht nur per Mail an die Person");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "erika@example.com");
  const token = sent[0].text.match(/bestaetigen#([A-Za-z0-9_-]+)/)[1];
  assert.match(sent[0].html, /Terminwunsch bestätigen/);

  const forwarded = [];
  const used = createUsedSet();
  const ctx = { secret, live: true, used, forward: async (p) => (forwarded.push(p), { kind: "ok" }) };
  const preview = await confirmAppointment({ token, action: "preview" }, ctx);
  assert.equal(preview.status, 200);
  assert.equal(preview.body.summary.email, "erika@example.com");
  assert.equal(forwarded.length, 0, "Vorschau sendet nichts");
  const ok = await confirmAppointment({ token, action: "confirm" }, ctx);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.dryrun, false);
  assert.equal(forwarded.length, 1);
  const payload = forwarded[0];
  assert.ok(beratungSchema.safeParse(payload).success, "gleiches Format wie /api/beratung_anfrage");
  assert.match(payload.bitte_beschreiben_sie_ihr_vorhaben, /Quelle: agent/);
  assert.equal(payload.das_projekt_soll_verwirklicht_werden, "in einer Wohnung");
  assert.equal((await confirmAppointment({ token, action: "confirm" }, ctx)).status, 409);
  assert.equal(forwarded.length, 1);
});

test("live: Mail-Ausfall → saubere Meldung, nichts gebucht", async () => {
  const a = createAdapter({ catalog, appointment: () => ({ mode: "live", secret: "x".repeat(40), sendMail: async () => { throw new Error("smtp down at line 42"); } }) });
  const r = await call("request_appointment", VALID_APPT, a);
  assert.equal(r.isError, true);
  assert.equal(r.structuredContent.status, "mail_failed");
  assert.doesNotMatch(r.content[0].text, /smtp|line 42|Error/);
});

test("Bestätigung: Probelauf-Token und Nicht-Live gehen NIE ans Backoffice; manipuliert/abgelaufen ungültig", async () => {
  const secret = "y".repeat(40);
  const forward = async () => assert.fail("darf nicht senden");
  const now = Date.now();
  const dry = seal({ ref: "AG-TEST01", exp: now + 1000, data: VALID_APPT, dry: true }, secret);
  const r1 = await confirmAppointment({ token: dry, action: "confirm" }, { secret, live: true, used: createUsedSet(), forward });
  assert.equal(r1.body.dryrun, true);
  const real = seal({ ref: "AG-TEST02", exp: now + 1000, data: VALID_APPT }, secret);
  const r2 = await confirmAppointment({ token: real, action: "confirm" }, { secret, live: false, used: createUsedSet(), forward });
  assert.equal(r2.body.dryrun, true);
  const tampered = real.slice(0, -4) + (real.endsWith("AAAA") ? "BBBB" : "AAAA");
  assert.equal((await confirmAppointment({ token: tampered, action: "preview" }, { secret, live: false, used: createUsedSet(), forward })).status, 400);
  assert.equal(unseal(real, "z".repeat(40)), null);
  assert.equal(unseal(real, secret, now + 2000), null, "abgelaufen");
  assert.equal(maskEmail("ab@cd.at"), "a***@cd.at");
});

test("appointmentMode: Standard dryrun; live nur in Produktion mit Datenschutztext, Geheimnis und Mail", () => {
  assert.equal(appointmentMode({}).mode, "dryrun");
  assert.equal(appointmentMode({ AGENT_APPOINTMENT_MODE: "quatsch" }).mode, "dryrun");
  assert.equal(appointmentMode({ AGENT_APPOINTMENT_MODE: "off" }).mode, "off");
  assert.equal(appointmentMode({ AGENT_APPOINTMENT_MODE: "live" }, { nodeEnv: "development" }).mode, "dryrun");
  assert.equal(appointmentMode({ AGENT_APPOINTMENT_MODE: "live" }, { nodeEnv: "test" }).mode, "dryrun");
  const full = { AGENT_APPOINTMENT_MODE: "live", AGENT_SECRET: "s".repeat(32), AGENT_MAIL_WEBHOOK_URL: "https://hook.example/x", AGENT_MAIL_WEBHOOK_SECRET: "m".repeat(32) };
  assert.equal(appointmentMode(full, { nodeEnv: "production", privacyApproved: false }).mode, "off");
  assert.equal(appointmentMode({ ...full, AGENT_SECRET: "" }, { nodeEnv: "production", privacyApproved: true }).mode, "off");
  assert.equal(appointmentMode({ ...full, AGENT_MAIL_WEBHOOK_URL: "" }, { nodeEnv: "production", privacyApproved: true }).mode, "off");
  assert.equal(appointmentMode(full, { nodeEnv: "production", privacyApproved: true }).mode, "live");
  assert.equal(PRIVACY_TEXT_APPROVED, false, "live erst nach Freigabe des Datenschutztextes (Inhaber)");
  assert.equal(secretFrom({}, "production"), null);
});

test("toBackofficePayload: Pflichtfelder wie das Beratungsformular", () => {
  const p = toBackofficePayload({ ...VALID_APPT, project_type: "Renovierung" }, { reference: "AG-ABCDEF" });
  assert.equal(p.bei_meiner_anfrage_geht_es_um, "eine Renovierung");
  assert.match(p.bitte_beschreiben_sie_ihr_vorhaben, /Referenz AG-ABCDEF/);
  assert.ok(beratungSchema.safeParse(p).success);
});

// --- Backend-Ausfall -----------------------------------------------------------------
test("Backend-Ausfall: isError mit ruhiger Meldung, kein Stacktrace; Fakten-Werkzeuge laufen weiter", async () => {
  const boom = async () => { throw new Error("ECONNREFUSED 10.0.0.1:443 at fetchAllProdukte.js:42"); };
  const logs = [];
  const broken = createAdapter({
    catalog: { searchProducts: boom, listCategories: boom, productsInCategory: boom, listBrands: boom, brandOverview: boom },
    log: (m) => logs.push(m),
  });
  for (const [n, a] of [["search_products", { query: "Flos" }], ["list_categories", {}], ["products_in_category", { category_key: "lamps" }], ["list_brands", {}], ["brand_overview", { brand: "Flos" }]]) {
    const r = await call(n, a, broken);
    assert.equal(r.isError, true, n);
    assert.equal(r.structuredContent.error, "catalog_unavailable");
    assert.doesNotMatch(r.content[0].text, /ECONNREFUSED|\.js|at |Error/);
  }
  assert.equal(logs.length, 5);
  assert.equal((await call("showroom_info", {}, broken)).isError, false);
  // Fetcher, die bei Ausfall [] liefern (catalog.js): ebenfalls Hinweis statt leerer Liste
  const empty = createAdapter({ catalog: { ...catalog, listCategories: async () => [], listBrands: async () => [] } });
  assert.equal((await call("list_categories", {}, empty)).isError, true);
  // Details-Ausfall: Karte bleibt, Maße fehlen
  const noDetails = createAdapter({ catalog: { ...catalog, productDetails: boom } });
  const r = await call("search_products", { query: "Vestry" }, noDetails);
  assert.equal(r.isError, false);
  assert.equal(r.structuredContent.products[0].dimensions, null);
});

// --- JSON-RPC / HTTP ---------------------------------------------------------------------
const post = (handler, body, headers = {}) =>
  handler(new Request("http://localhost/api/agent/mcp", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }));

test("JSON-RPC: unbekanntes Werkzeug -32602, unbekannte Methode -32601, Benachrichtigung 202, Stapel/Parse 400", async () => {
  const h = createMcpPost({ adapter, limiter: createAgentLimiter() });
  let res = await post(h, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "drop_tables", arguments: {} } });
  assert.equal((await res.json()).error.code, -32602);
  res = await post(h, { jsonrpc: "2.0", id: 2, method: "resources/list" });
  assert.equal((await res.json()).error.code, -32601);
  res = await post(h, { jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(res.status, 202);
  assert.equal(await res.text(), "");
  res = await post(h, [{ jsonrpc: "2.0", id: 1, method: "ping" }]);
  assert.equal(res.status, 400);
  res = await post(h, "{kaputt");
  assert.equal((await res.json()).error.code, -32700);
  res = await post(h, { jsonrpc: "2.0", id: 3, method: "ping" }, { "mcp-protocol-version": "1999-01-01" });
  assert.equal(res.status, 400);
  res = await post(h, { jsonrpc: "2.0", id: 4, method: "initialize", params: { protocolVersion: "2025-11-25" } });
  assert.equal(res.headers.get("mcp-protocol-version"), "2025-11-25");
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.equal(res.headers.get("cache-control"), "no-store");
  res = await post(h, { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "showroom_info", arguments: { x: "y".repeat(40_000) } } });
  assert.equal(res.status, 413);
});

test("Rate-Limit pro IP greift (Nachrichten und Terminwünsche), andere IP unberührt", async () => {
  const rate = { ...RATE, burst: { max: 3, windowMs: 60_000 }, appointmentHour: { max: 1, windowMs: 3_600_000 } };
  let t = 1_700_000_000_000;
  const h = createMcpPost({ adapter, limiter: createAgentLimiter({ rate }), now: () => t });
  const ip = { "x-forwarded-for": "203.0.113.7" };
  for (let i = 0; i < 3; i++) assert.equal((await post(h, { jsonrpc: "2.0", id: i, method: "ping" }, ip)).status, 200);
  const limited = await post(h, { jsonrpc: "2.0", id: 9, method: "ping" }, ip);
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.equal((await post(h, { jsonrpc: "2.0", id: 10, method: "ping" }, { "x-forwarded-for": "198.51.100.1" })).status, 200);
  t += 61_000; // Fenster vorbei
  const appt = { jsonrpc: "2.0", id: 11, method: "tools/call", params: { name: "request_appointment", arguments: VALID_APPT } };
  assert.equal((await post(h, appt, ip)).status, 200);
  const second = await post(h, { ...appt, id: 12 }, ip);
  assert.equal(second.status, 429);
  assert.equal((await second.json()).result.isError, true);
});

// --- Client-Bündel und Dateigrenzen ------------------------------------------------------
test("Browser-Module ohne Server-Pakete; Routen nutzen den Adapter, keinen zweiten Katalogcode", () => {
  for (const f of ["src/lib/agent/tools.js", "src/lib/agent/client.js", "src/lib/agent/config.js", "src/lib/agent/copy.js", "src/components/Agent/WebMcpTools.js"]) {
    const src = read(f);
    // Nur Import-Zeilen (Kommentare dürfen die Wörter nennen).
    assert.doesNotMatch(src, /^import .*(zod|node:crypto|server-only|concierge\/catalog)/m, f);
  }
  const web = read("src/components/Agent/WebMcpTools.js");
  assert.match(web, /requestIdleCallback/);
  assert.match(web, /document\?\.modelContext|navigator\?\.modelContext/);
  assert.match(web, /READ_TOOL_NAMES/);
  assert.match(read("src/lib/agent/deps.js"), /from "@\/lib\/concierge\/catalog"/);
  assert.match(read("src/app/api/agent/mcp/route.js"), /createMcpPost/);
});
