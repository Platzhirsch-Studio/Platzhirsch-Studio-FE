// tests/unit/planer-labs-advent-ph.test.mjs – Website-Anbindung Runde 2, Punkte 5–7:
// Planer-Beilage (planer, planer_konfiguration, planer_link) nur an ph,
// AR-Viewer und Dreiländer-Rechner über die Gast-Methoden von ph_sortiment,
// Adventsabend über ph_marketing.api.register_event. Alles gegen fetch-Attrappen.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { forwardInquiry } from "../../src/lib/backend/forms.js";
import { CLIENT_KONFIG_MAX, PLANER_MAX_BYTES, konfigurationOf, planerFields, planerLinkOf, planerPayload, withoutPlanerFields } from "../../src/lib/forms/planerFields.js";
import { beratungSchema, adventSchema } from "../../src/lib/forms/schemas.js";
import { readHandoff, HANDOFF_KEY } from "../../src/lib/forms/draft.js";
import { storeHandoff } from "../../src/lib/sofaplaner/handoff.js";
import { PH_MODELLE_3D_METHOD, PH_WECHSELKURS_METHOD, fetchPhModelle3d, fetchPhWechselkurs, mapPhModelle3d, mapPhWechselkurs, phAssetPath } from "../../src/lib/backend/labs.js";
import { ADVENT_ROUTE, adventHandler, adventPhTarget, adventSubmitUrl, registerEventPayload, sendAdventAnmeldung } from "../../src/lib/backend/adventsabend.js";
import { guardForm, errorResponse } from "../../src/lib/forms/guard.js";
import { forbiddenResponse, originCheck } from "../../src/lib/forms/origin.js";

const PH = { BACKEND_PH_URL: "https://ph.staging.test", BACKEND_PH_TOKEN: "key1:secret1" };
const PH_FORMS = { ...PH, BACKEND_PH_GRUPPEN: "formulare" };
const PH_KAT = { ...PH, BACKEND_PH_GRUPPEN: "katalog" };
const quiet = () => {
  const w = console.warn;
  const e = console.error;
  console.warn = () => {};
  console.error = () => {};
  return () => {
    console.warn = w;
    console.error = e;
  };
};

function recorder(body = { message: {} }, status = 200) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init, body: init.body ? JSON.parse(init.body) : null });
    return { ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) };
  };
  return { calls, fetchImpl };
}

const PLAN = { v: 2, name: "Wohnzimmer", family: "connery", room: { w: 420, d: 380 }, items: [{ id: "a", code: "X1", x: 0, y: 0, rot: 0, w: 100, d: 90 }] };
const LINK = "https://www.platzhirsch.studio/de/sofaplaner?p=abc123";
const BERATUNG = {
  bei_meiner_anfrage_geht_es_um: "Sofa",
  das_projekt_soll_verwirklicht_werden: "Wohnung",
  bitte_beschreiben_sie_ihr_vorhaben: "Ein Sofa für das Wohnzimmer.",
  vorname: "Eva",
  nachname: "Muster",
  email: "eva@example.test",
  telefon: "",
};

// ── 5. Planer-Beilage ────────────────────────────────────────────────────────

test("planerFields spiegelt planer.py: Schlüssel, JSON-Objekt ≤ 64 KB, Tiefe ≤ 12, Link *.platzhirsch.studio", () => {
  assert.deepEqual(planerFields({}), {});
  assert.deepEqual(planerFields({ planer: "unbekannt", planer_link: LINK }), {}, "ohne gültigen Planer nichts");
  const f = planerFields({ planer: "Sofaplaner", planer_konfiguration: PLAN, planer_link: LINK });
  assert.equal(f.planer, "sofaplaner");
  assert.deepEqual(JSON.parse(f.planer_konfiguration), PLAN);
  assert.equal(f.planer_link, LINK);
  assert.equal(planerLinkOf("http://www.platzhirsch.studio/x"), null, "nur https");
  assert.equal(planerLinkOf("https://platzhirsch.studio.evil.test/x"), null, "fremder Host");
  assert.equal(planerLinkOf(`https://platzhirsch.studio/${"a".repeat(500)}`), null, "≤ 500 Zeichen");
  assert.equal(konfigurationOf("[1,2]"), null, "Liste ist kein Objekt");
  assert.equal(konfigurationOf("{kaputt"), null);
  assert.equal(konfigurationOf({ a: "x".repeat(PLANER_MAX_BYTES) }), null, "zu groß");
  let tief = { x: 1 };
  for (let i = 0; i < 14; i++) tief = { t: tief };
  assert.equal(konfigurationOf(tief), null, "zu tief");
  // Zu große Konfiguration fällt weg, Planer und Link bleiben (die Anfrage scheitert nie daran).
  assert.deepEqual(planerFields({ planer: "sofaplaner", planer_konfiguration: { a: "x".repeat(PLANER_MAX_BYTES) }, planer_link: LINK }), { planer: "sofaplaner", planer_link: LINK });
});

test("planerPayload: Sofaplaner aus Übergabe (Plan + Link), Dreiländer aus ?land/?wert, sonst {}", () => {
  const sofa = planerPayload({ lines: [{ key: "sofaplaner" }] }, { text: "x", url: LINK, config: PLAN });
  assert.equal(sofa.planer, "sofaplaner");
  assert.equal(sofa.planer_link, LINK);
  assert.deepEqual(JSON.parse(sofa.planer_konfiguration), PLAN);
  const gross = planerPayload({ lines: [{ key: "sofaplaner" }], plan: LINK }, { config: { a: "x".repeat(CLIENT_KONFIG_MAX) } });
  assert.deepEqual(gross, { planer: "sofaplaner", planer_link: LINK }, "Browser: über 16 KB nur der Link (Anfrage-Grenze 32 KB)");
  const d = planerPayload({ lines: [{ key: "dreilaenderResult", vars: { land: "CH", wert: "5000-15000" } }] });
  assert.deepEqual(d, { planer: "dreilaender", planer_konfiguration: JSON.stringify({ land: "CH", wert: "5000-15000" }) });
  assert.deepEqual(planerPayload({ lines: [{ key: "dreilaender" }] }), { planer: "dreilaender" });
  assert.deepEqual(planerPayload({ lines: [{ key: "kuechenplaner" }] }), {});
  assert.deepEqual(planerPayload(null), {});
});

test("Sofaplaner-Übergabe trägt den Plan, draft.readHandoff gibt ihn weiter (ohne Plan wie bisher)", () => {
  const store = new Map();
  const storage = { setItem: (k, v) => store.set(k, v), getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k) };
  assert.equal(storeHandoff(storage, { text: "Plan", shareUrl: LINK, locale: "de", config: PLAN }), true);
  const raw = store.get(HANDOFF_KEY);
  assert.deepEqual(JSON.parse(raw).config, PLAN);
  const h = readHandoff(raw, { lineKeys: ["sofaplaner"] });
  assert.deepEqual(h.config, PLAN);
  storeHandoff(storage, { text: "Plan", shareUrl: LINK, locale: "de" });
  const ohne = readHandoff(store.get(HANDOFF_KEY), { lineKeys: ["sofaplaner"] });
  assert.deepEqual(Object.keys(ohne).sort(), ["text", "url"]);
});

test("beratungSchema lässt planer_* durch; forwardInquiry: alt exakt ohne planer_*, ph mit", async () => {
  const parsed = beratungSchema.parse({ ...BERATUNG, planer: "sofaplaner", planer_konfiguration: JSON.stringify(PLAN), planer_link: LINK });
  assert.equal(parsed.planer, "sofaplaner");

  const alt = recorder({ message: "ok" });
  await forwardInquiry("beratung", parsed, { altUrl: "https://alt.test/create_anfrage", fetchImpl: alt.fetchImpl, env: {} });
  assert.equal(alt.calls[0].url, "https://alt.test/create_anfrage");
  assert.ok(!("planer" in alt.calls[0].body) && !("planer_konfiguration" in alt.calls[0].body) && !("planer_link" in alt.calls[0].body));
  assert.deepEqual(alt.calls[0].body, withoutPlanerFields(parsed));

  const ph = recorder({ message: { referenz: "PH-ANF-9", status: "Neu" } });
  const r = await forwardInquiry("beratung", parsed, { altUrl: "https://alt.test/x", fetchImpl: ph.fetchImpl, env: PH_FORMS, idempotencyKey: "lead-1" });
  assert.equal(ph.calls[0].url, "https://ph.staging.test/api/method/ph_crm.api.create_anfrage");
  assert.equal(ph.calls[0].body.planer, "sofaplaner");
  assert.deepEqual(JSON.parse(ph.calls[0].body.planer_konfiguration), PLAN);
  assert.equal(ph.calls[0].body.planer_link, LINK);
  assert.equal(r.data.message.name, "PH-ANF-9");

  // Ungültiger Link geht nicht mit (sonst 400 invalid des Backends).
  const bad = recorder({ message: { referenz: "PH-ANF-10" } });
  await forwardInquiry("beratung", { ...parsed, planer_link: "https://evil.test/x" }, { altUrl: "https://alt.test/x", fetchImpl: bad.fetchImpl, env: PH_FORMS });
  assert.equal(bad.calls[0].body.planer_link, undefined);
  // Ohne planer: Payload unverändert wie bisher.
  const plain = recorder({ message: { referenz: "PH-ANF-11" } });
  await forwardInquiry("beratung", BERATUNG, { altUrl: "https://alt.test/x", fetchImpl: plain.fetchImpl, env: PH_FORMS });
  assert.equal(plain.calls[0].body.planer, undefined);
});

test("Quelltext: ResultPanel gibt den Plan in die Übergabe, BeratungClient sendet planerPayload", () => {
  const rp = readFileSync("src/components/Labs/Sofaplaner/ResultPanel.js", "utf8");
  assert.match(rp, /storeHandoff\(storage, \{[^}]*config: plan \}\)/);
  const bc = readFileSync("src/components/BeratungClient/BeratungClient.js", "utf8");
  assert.match(bc, /\.\.\.planerPayload\(context, planerHandoff\.current\)/);
});

// ── 6. AR-Viewer und Dreiländer-Rechner ──────────────────────────────────────

const LOCAL = [
  { id: "sessel-demo", name: "Sessel", category: "Sessel", src: "/labs/ar-viewer/sessel.glb", iosSrc: null, poster: "/labs/ar-viewer/sessel.webp", posterAlt: "Sessel", dimensionsCm: { w: 80, d: 80, h: 90 } },
];

test("phAssetPath: /files → /cmx/files, eigene Pfade bleiben, private/fremde Dateien nie", () => {
  assert.equal(phAssetPath("/files/modell.glb"), "/cmx/files/modell.glb");
  assert.equal(phAssetPath("/labs/ar-viewer/a.glb"), "/labs/ar-viewer/a.glb");
  assert.equal(phAssetPath("/private/files/a.glb"), null);
  assert.equal(phAssetPath("https://evil.test/a.glb"), null);
  assert.equal(phAssetPath("/files/../a.glb"), null);
});

test("mapPhModelle3d: ersetzt Dateien bekannter Modelle (id/path_field), Unbekannte fallen weg", () => {
  const { models, ohneGegenstueck, ungueltig } = mapPhModelle3d(
    [
      { path_field: "sessel-demo", id: "sessel-demo", glb: "/files/s.glb", usdz: "/files/s.usdz", src: "/files/s.glb", iosSrc: "/files/s.usdz", poster: "/files/s.webp", name: "Sessel X" },
      { path_field: "neu", id: "neu", src: "/files/n.glb", poster: "" },
      { path_field: "sessel-demo", id: "sessel-demo-2", src: "/files/kein-modell.txt" },
    ],
    LOCAL
  );
  assert.equal(models.length, 1);
  assert.deepEqual(
    { src: models[0].src, iosSrc: models[0].iosSrc, poster: models[0].poster, name: models[0].name, dims: models[0].dimensionsCm },
    { src: "/cmx/files/s.glb", iosSrc: "/cmx/files/s.usdz", poster: "/cmx/files/s.webp", name: "Sessel X", dims: { w: 80, d: 80, h: 90 } }
  );
  assert.deepEqual(ohneGegenstueck, ["neu"]);
  assert.deepEqual(ungueltig, ["sessel-demo-2"]);
});

test("fetchPhModelle3d: Gast-GET ohne Token/X-PH-Client, marke als Query; alt/Fehler → null", async () => {
  const r = recorder({ message: [{ id: "a" }] });
  const list = await fetchPhModelle3d({ marke: "minotti", env: { ...PH_KAT, BACKEND_PH_CLIENT_SALT: "s" }, fetchImpl: r.fetchImpl });
  assert.deepEqual(list, [{ id: "a" }]);
  assert.equal(r.calls[0].url, `https://ph.staging.test/api/method/${PH_MODELLE_3D_METHOD}?marke=minotti`);
  assert.equal(r.calls[0].init.method, "GET");
  assert.equal(r.calls[0].init.headers.Authorization, undefined);
  assert.equal(r.calls[0].init.headers["X-PH-Client"], undefined);
  assert.equal(r.calls[0].init.next.revalidate, 3600);

  const none = recorder();
  assert.equal(await fetchPhModelle3d({ env: {}, fetchImpl: none.fetchImpl }), null, "alt");
  assert.equal(none.calls.length, 0, "alt: kein Aufruf");
  assert.equal(await fetchPhModelle3d({ env: PH_KAT, fetchImpl: recorder({}, 503).fetchImpl }), null, "HTTP-Fehler");
  assert.equal(await fetchPhModelle3d({ env: PH_KAT, fetchImpl: async () => { throw new Error("netz"); } }), null, "Netz");
});

test("Wechselkurs: Mapping auf configSchema, {} = nicht aktiv, Kundentext der Vorgabe bleibt", async () => {
  const base = { deliveryEur: { CH: { min: 450, max: 450, source: "Richtwert" } }, customsFeeChf: { min: 80, max: 150, source: "Richtwert" } };
  const ph = { version: 1, ossActive: false, deliveryEur: { CH: { min: 380, max: 420, approved: true } }, customsFeeChf: { min: 90, max: 90, approved: true, source: "Spediteur" }, fallbackRate: { rate: 0.93, date: "2026-11-01" } };
  assert.deepEqual(mapPhWechselkurs(ph, base), {
    version: 1,
    ossActive: false,
    deliveryEur: { CH: { min: 380, max: 420, approved: true, source: "Richtwert" } },
    customsFeeChf: { min: 90, max: 90, approved: true, source: "Spediteur" },
    fallbackRate: { rate: 0.93, date: "2026-11-01" },
  });
  assert.equal(mapPhWechselkurs({}, base), null);
  assert.equal(mapPhWechselkurs(null, base), null);

  const r = recorder({ message: ph });
  const o = await fetchPhWechselkurs(base, { env: PH_KAT, fetchImpl: r.fetchImpl });
  assert.equal(o.deliveryEur.CH.min, 380);
  assert.equal(r.calls[0].url, `https://ph.staging.test/api/method/${PH_WECHSELKURS_METHOD}`);
  assert.equal(r.calls[0].init.headers.Authorization, undefined);
  assert.equal(await fetchPhWechselkurs(base, { env: PH_KAT, fetchImpl: recorder({ message: {} }).fetchImpl }), null, "nicht aktiv → heutiger Weg");
  assert.equal(await fetchPhWechselkurs(base, { env: {}, fetchImpl: r.fetchImpl }), null, "alt");
});

test("Quelltext: source.js und store.server.js nutzen die ph-Adapter, alt-Weg bleibt", () => {
  const src = readFileSync("src/components/Labs/ArViewer/data/source.js", "utf8");
  assert.match(src, /fetchPhModelle3d/);
  assert.match(src, /return fromFrappe \|\| models;/);
  const st = readFileSync("src/components/Labs/Dreilaender/store.server.js", "utf8");
  assert.match(st, /fetchPhWechselkurs\(DEFAULT_CONFIG\)/);
  assert.match(st, /readJson\(CONFIG_FILE\)/);
});

// ── 7. Adventsabend ──────────────────────────────────────────────────────────

const ADV_ENV = { ...PH_FORMS, ADVENTSABEND_EVENT_ID: "EV-2026-0001" };
const ANMELDUNG = { name: "Eva Muster", email_address: "eva@example.test", telefon: "+43 5574 1234", personen: 2, nachricht: "Wir freuen uns." };

test("Advent: ph-Ziel nur mit formulare=ph, Zugang UND ADVENTSABEND_EVENT_ID, sonst /api/kontakt", () => {
  assert.equal(adventSubmitUrl({}), "/api/kontakt");
  assert.equal(adventSubmitUrl(PH_FORMS), "/api/kontakt", "ohne Event-Kennung alter Weg");
  assert.equal(adventSubmitUrl({ ADVENTSABEND_EVENT_ID: "EV-1" }), "/api/kontakt", "alt bleibt alt");
  assert.equal(adventSubmitUrl(ADV_ENV), ADVENT_ROUTE);
  assert.equal(adventPhTarget({ ...ADV_ENV, BACKEND_PH_TOKEN: "" }), null, "ohne Token nichts");
});

test("registerEventPayload: dokumentierte Felder, Personen 1–10", () => {
  assert.deepEqual(registerEventPayload(ANMELDUNG, { eventId: "EV-1", idempotencyKey: "k1" }), {
    event_id: "EV-1",
    name: "Eva Muster",
    email: "eva@example.test",
    personen: 2,
    telefon: "+43 5574 1234",
    nachricht: "Wir freuen uns.",
    idempotency_key: "k1",
  });
  assert.equal(registerEventPayload({ ...ANMELDUNG, personen: 99 }, { eventId: "E" }).personen, 10);
  assert.equal(registerEventPayload({ name: "A B", email_address: "a@b.test" }, { eventId: "E" }).telefon, undefined);
});

test("sendAdventAnmeldung: Pfad, Token, Antwort und Fehler (ausgebucht, geschlossen, Event unbekannt)", async () => {
  const r = recorder({ message: { success: true, status: "warteliste", event: "EV-2026-0001", personen: 2, bereits_angemeldet: false } });
  const ok = await sendAdventAnmeldung(ANMELDUNG, { env: ADV_ENV, fetchImpl: r.fetchImpl });
  assert.deepEqual(ok, { ok: true, status: "warteliste", warteliste: true, bereitsAngemeldet: false });
  assert.equal(r.calls[0].url, "https://ph.staging.test/api/method/ph_marketing.api.register_event");
  assert.equal(r.calls[0].init.headers.Authorization, "token key1:secret1");
  assert.equal(r.calls[0].body.event_id, "EV-2026-0001");

  const err = (code, status) => recorder({ message: { code } }, status).fetchImpl;
  assert.deepEqual(await sendAdventAnmeldung(ANMELDUNG, { env: ADV_ENV, fetchImpl: err("conflict", 409) }), { ok: false, status: 409, code: "ausgebucht" });
  assert.deepEqual(await sendAdventAnmeldung(ANMELDUNG, { env: ADV_ENV, fetchImpl: err("outside_window", 422) }), { ok: false, status: 410, code: "geschlossen" });
  assert.deepEqual(await sendAdventAnmeldung(ANMELDUNG, { env: ADV_ENV, fetchImpl: err("expired", 410) }), { ok: false, status: 410, code: "geschlossen" });
  assert.deepEqual(await sendAdventAnmeldung(ANMELDUNG, { env: ADV_ENV, fetchImpl: err("not_found", 404) }), { ok: false, status: 503, code: "not_configured" });
  assert.deepEqual(await sendAdventAnmeldung(ANMELDUNG, { env: ADV_ENV, fetchImpl: err("internal", 500) }), { ok: false, status: 502, code: "upstream" });
  const none = recorder();
  assert.deepEqual(await sendAdventAnmeldung(ANMELDUNG, { env: {}, fetchImpl: none.fetchImpl }), { ok: false, status: 503, code: "not_configured" });
  assert.equal(none.calls.length, 0);
});

test("adventHandler: Herkunft, Schema, Weiterleitung; alt 503 ohne Aufruf", async () => {
  const restore = quiet();
  try {
    const limiter = { peek: () => ({ ok: true }), take: () => ({ ok: true }) };
    const deps = { schema: adventSchema, maxBytes: 4096, guardForm, originCheck, forbiddenResponse, errorResponse, limiter };
    const req = (body, headers = { origin: "https://www.platzhirsch.studio", host: "www.platzhirsch.studio" }) =>
      new Request("https://www.platzhirsch.studio/api/adventsabend/anmelden", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
    const valid = { ...ANMELDUNG, website: "", _t: 9000 };

    const r = recorder({ message: { success: true, status: "angemeldet", bereits_angemeldet: false } });
    const res = await adventHandler({ ...deps, env: ADV_ENV, fetchImpl: r.fetchImpl })(req(valid));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { success: true, status: "angemeldet", warteliste: false });
    assert.equal(r.calls[0].body.personen, 2);

    const full = await adventHandler({ ...deps, env: ADV_ENV, fetchImpl: recorder({ message: { code: "conflict" } }, 409).fetchImpl })(req(valid));
    assert.equal(full.status, 409);
    assert.equal((await full.json()).code, "ausgebucht");

    const bad = await adventHandler({ ...deps, env: ADV_ENV, fetchImpl: r.fetchImpl })(req({ ...valid, personen: 0 }));
    assert.equal(bad.status, 400);

    const cross = await adventHandler({ ...deps, env: ADV_ENV, fetchImpl: r.fetchImpl })(req(valid, { origin: "https://evil.test", host: "www.platzhirsch.studio" }));
    assert.equal(cross.status, 403);

    const off = recorder();
    const alt = await adventHandler({ ...deps, env: {}, fetchImpl: off.fetchImpl })(req(valid));
    assert.equal(alt.status, 503);
    assert.equal(off.calls.length, 0);
    assert.equal(r.calls.length, 1, "nur die eine gültige Anmeldung ging hinaus");
  } finally {
    restore();
  }
});

test("Quelltext: Formular sendet alt wie bisher an /api/kontakt, ph an die neue Route", () => {
  const f = readFileSync("src/app/[locale]/adventsabend/AdventsabendForm.js", "utf8");
  assert.match(f, /submitUrl = "\/api\/kontakt"/);
  assert.match(f, /postForm\(ph \? PH_URL : "\/api\/kontakt", body\)/);
  assert.match(f, /\[Anmeldung Adventsabend \$\{dateLabel\}\]/, "alt-Payload unverändert");
  const p = readFileSync("src/app/[locale]/adventsabend/page.js", "utf8");
  assert.match(p, /submitUrl=\{adventSubmitUrl\(\)\}/);
});
