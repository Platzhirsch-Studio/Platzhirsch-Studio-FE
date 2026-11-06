// tests/unit/wunschliste-ph.test.mjs – Wunschliste im ph-Backend (ph_shop), Website-Anbindung Runde 2, Punkt 2.
// Alle Aufrufe gegen fetch-Attrappen, nichts geht an ein Backend.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createPhStore, PH_WISHLIST, MAX_ATTEMPTS } from "../../src/lib/wunschliste/phAdapter.js";
import { contributionChannel, storageKind, wunschlisteAvailable } from "../../src/lib/wunschliste/mode.js";
import { createRecord, reserveItem, WishlistError } from "../../src/lib/wunschliste/model.js";
import { sha256 } from "../../src/lib/wunschliste/ids.js";
import { WUNSCHLISTE_TEXT } from "../../src/lib/wunschliste/copy.js";

const CFG = { url: "https://staging.example.test", key: "k", secret: "s" };
const ENV = { BACKEND_PH_CLIENT_SALT: "salz" };
const PH_ENV = { BACKEND_GENERATION: "ph", BACKEND_PH_URL: CFG.url, BACKEND_PH_TOKEN: "k:s" };

function makeRecord() {
  return createRecord({ title: "Einzug", occasion: "einzug", locale: "de", items: [{ name: "Sofa", brand: "X", href: "/produkte/sofa" }, { name: "Tisch", brand: "Y", href: "/produkte/tisch" }] });
}

/** Attrappe: Antworten je Methode als Funktion(params) → { status, body }. */
function fake(handlers) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const method = url.split("/api/method/")[1].split("?")[0];
    const params = init.body ? JSON.parse(init.body) : {};
    calls.push({ url, method, params, headers: init.headers, httpMethod: init.method });
    const h = handlers[method];
    const { status = 200, body } = h ? await h(params, calls) : { status: 404, body: {} };
    return { ok: status < 400, status, json: async () => JSON.parse(JSON.stringify(body ?? null)) };
  };
  return { calls, fetchImpl };
}
const err = (code, status) => ({ status, body: { message: { code } } });

test("Speicherwahl: ohne Schalter unverändert lokal; ph nur mit WUNSCHLISTE_STORAGE + Gruppe + Zugang", () => {
  assert.equal(storageKind({}), "local");
  assert.equal(storageKind({ NODE_ENV: "production" }), null);
  assert.equal(storageKind({ ...PH_ENV }), "local", "Gruppe auf ph allein schaltet nichts um");
  assert.equal(storageKind({ ...PH_ENV, WUNSCHLISTE_STORAGE: "frappe" }), "ph");
  assert.equal(storageKind({ ...PH_ENV, WUNSCHLISTE_STORAGE: "ph" }), "ph");
  assert.equal(storageKind({ BACKEND_GENERATION: "ph", WUNSCHLISTE_STORAGE: "ph" }), null, "ph gewünscht, Zugang fehlt → aus, nicht lokal");
  assert.equal(storageKind({ WUNSCHLISTE_STORAGE: "ph" }), "local", "Gruppe alt → wie bisher");
  assert.equal(wunschlisteAvailable({ BACKEND_GENERATION: "ph", WUNSCHLISTE_STORAGE: "ph" }), false);
  assert.equal(contributionChannel("off", { ...PH_ENV, WUNSCHLISTE_STORAGE: "ph", NODE_ENV: "production" }), "aus");
  assert.equal(contributionChannel("anfrage", { ...PH_ENV, WUNSCHLISTE_STORAGE: "ph", NODE_ENV: "production" }), "anfrage", "ph-Speicher: Anfragen kommen im Studio an");
  assert.equal(contributionChannel("anfrage", { NODE_ENV: "production", WUNSCHLISTE_LOCAL_DIR: "/x" }), "kontakt");
});

test("create/get/getByShare: Pfad, Parameter (nur sha256 des Teilen-Links), Token, X-PH-Client", async () => {
  const { record, shareId } = makeRecord();
  const f = fake({
    [PH_WISHLIST.create]: () => ({ body: { message: { referenz: "PH-WL-1", list_id: record.listId, ref: record.ref, share_hash: record.shareHash, modified: "2026-11-04 10:00:00.000001" } } }),
    [PH_WISHLIST.get]: () => ({ body: { message: { found: true, record, modified: "m1", referenz: "PH-WL-1" } } }),
    [PH_WISHLIST.getByShare]: () => ({ body: { message: { found: true, record, modified: "m1" } } }),
  });
  const s = createPhStore(CFG, { fetchImpl: f.fetchImpl, env: ENV });
  assert.equal(await s.create(record), record);
  assert.equal(f.calls[0].url, `${CFG.url}/api/method/ph_shop.api.create_wishlist`);
  assert.equal(f.calls[0].httpMethod, "POST");
  assert.deepEqual(f.calls[0].params, { record: JSON.parse(JSON.stringify(record)) });
  assert.equal(f.calls[0].headers.Authorization, "token k:s");

  assert.deepEqual(await s.get(record.listId), record);
  assert.deepEqual(f.calls[1].params, { list_id: record.listId });

  assert.deepEqual(await s.getByShare(shareId), record);
  assert.deepEqual(f.calls[2].params, { share_hash: sha256(shareId) });
  assert.ok(!JSON.stringify(f.calls).includes(shareId), "Teilen-Link geht nie ans Backend");

  // X-PH-Client nur über phCall mit Salz und Besucher-IP (hier ohne Request-Kontext: kein Header).
  assert.equal(f.calls[0].headers["X-PH-Client"], undefined);
  assert.equal(await s.get("kurz"), null);
  assert.equal(f.calls.length, 3, "ungültige Kennung: kein Aufruf");
});

test("getByShare: found:false und ausgetauschter Link → null", async () => {
  const { record, shareId } = makeRecord();
  const f = fake({ [PH_WISHLIST.getByShare]: () => ({ body: { message: { found: false } } }) });
  assert.equal(await createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {} }).getByShare(shareId), null);
  const g = fake({ [PH_WISHLIST.getByShare]: () => ({ body: { message: { found: true, record: { ...record, shareHash: "0".repeat(64) }, modified: "m" } } }) });
  assert.equal(await createPhStore(CFG, { fetchImpl: g.fetchImpl, env: {} }).getByShare(shareId), null);
});

test("update: expected_modified aus der letzten Antwort, Ergebnis aus der Antwort", async () => {
  const { record, shareId } = makeRecord();
  const key = record.items[0].key;
  const f = fake({
    [PH_WISHLIST.getByShare]: () => ({ body: { message: { found: true, record, modified: "m1" } } }),
    [PH_WISHLIST.update]: (p) => ({ body: { message: { found: true, record: p.record, modified: "m2" } } }),
  });
  const s = createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {} });
  await s.getByShare(shareId);
  const { record: saved, result } = await s.update(record.listId, (r) => reserveItem(r, key, { name: "Anna" }));
  assert.equal(typeof result, "string", "Storno-Schlüssel");
  assert.ok(saved.reservations[key]);
  const up = f.calls.find((c) => c.method === PH_WISHLIST.update);
  assert.equal(up.params.list_id, record.listId);
  assert.equal(up.params.expected_modified, "m1");
  assert.equal(f.calls.filter((c) => c.method === PH_WISHLIST.get).length, 0, "Stand aus der letzten Antwort, kein zweites Lesen");
});

test("update bei 409: neu laden, Änderung erneut anwenden; gleiche Reservierung → already_reserved", async () => {
  const { record } = makeRecord();
  const key = record.items[0].key;
  const other = structuredClone(record);
  reserveItem(other, key, { name: "Ben" });
  let n = 0;
  const f = fake({
    [PH_WISHLIST.get]: () => ({ body: { message: { found: true, record: n === 0 ? record : other, modified: n === 0 ? "m1" : "m2" } } }),
    [PH_WISHLIST.update]: () => (n++ === 0 ? err("conflict", 409) : { body: { message: { found: true, record: other, modified: "m3" } } }),
  });
  const s = createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {} });
  await assert.rejects(
    s.update(record.listId, (r) => reserveItem(r, key, { name: "Anna" })),
    (e) => e instanceof WishlistError && e.code === "already_reserved" && e.status === 409
  );
  assert.equal(f.calls.filter((c) => c.method === PH_WISHLIST.get).length, 2);

  // anderes Stück: zweiter Versuch gelingt mit dem neuen Stand
  n = 0;
  const g = fake({
    [PH_WISHLIST.get]: () => ({ body: { message: { found: true, record: n === 0 ? record : other, modified: n === 0 ? "m1" : "m2" } } }),
    [PH_WISHLIST.update]: (p) => (n++ === 0 ? err("conflict", 409) : { body: { message: { found: true, record: p.record, modified: "m3" } } }),
  });
  const t = createPhStore(CFG, { fetchImpl: g.fetchImpl, env: {} });
  const { record: saved } = await t.update(record.listId, (r) => reserveItem(r, record.items[1].key, {}));
  assert.ok(saved.reservations[key] && saved.reservations[record.items[1].key], "beide Reservierungen erhalten");
  assert.equal(g.calls.filter((c) => c.method === PH_WISHLIST.update)[1].params.expected_modified, "m2");
});

test("update: dauerhafter Konflikt → WishlistError conflict 409; 404 → record null; Ausfall → 503", async () => {
  const { record } = makeRecord();
  const f = fake({
    [PH_WISHLIST.get]: () => ({ body: { message: { found: true, record, modified: "m" } } }),
    [PH_WISHLIST.update]: () => err("conflict", 409),
  });
  await assert.rejects(createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {} }).update(record.listId, () => {}), (e) => e.code === "conflict" && e.status === 409);
  assert.equal(f.calls.filter((c) => c.method === PH_WISHLIST.update).length, MAX_ATTEMPTS);

  const g = fake({ [PH_WISHLIST.get]: () => ({ body: { message: { found: false } } }) });
  assert.deepEqual(await createPhStore(CFG, { fetchImpl: g.fetchImpl, env: {} }).update(record.listId, () => {}), { record: null, result: undefined });

  const h = fake({ [PH_WISHLIST.get]: () => ({ body: { message: { found: true, record, modified: "m" } } }), [PH_WISHLIST.update]: () => err("not_found", 404) });
  assert.equal((await createPhStore(CFG, { fetchImpl: h.fetchImpl, env: {} }).update(record.listId, () => {})).record, null);

  const down = fake({ [PH_WISHLIST.get]: () => ({ status: 503, body: {} }) });
  await assert.rejects(createPhStore(CFG, { fetchImpl: down.fetchImpl, env: {} }).get(record.listId), (e) => e instanceof WishlistError && e.code === "unavailable" && e.status === 503);
  const net = { fetchImpl: async () => { throw new TypeError("fetch failed"); } };
  await assert.rejects(createPhStore(CFG, { ...net, env: {} }).get(record.listId), (e) => e.status === 503);
  const rl = fake({ [PH_WISHLIST.get]: () => err("rate_limited", 429) });
  await assert.rejects(createPhStore(CFG, { fetchImpl: rl.fetchImpl, env: {} }).get(record.listId), (e) => e.code === "rate_limited" && e.status === 429);
});

test("remove: {deleted}", async () => {
  const { record } = makeRecord();
  const f = fake({ [PH_WISHLIST.remove]: (p) => ({ body: { message: { deleted: p.list_id === record.listId } } }) });
  assert.equal(await createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {} }).remove(record.listId), true);
  assert.equal(f.calls[0].url, `${CFG.url}/api/method/ph_shop.api.remove_wishlist`);
});

test("X-PH-Client: sha256(ip + salz) mit Salz, ohne Salz kein Header, IP nie im Aufruf", async () => {
  const { record } = makeRecord();
  const f = fake({ [PH_WISHLIST.get]: () => ({ body: { message: { found: false } } }) });
  await createPhStore(CFG, { fetchImpl: f.fetchImpl, env: ENV, visitorIp: "203.0.113.7" }).get(record.listId);
  assert.equal(f.calls[0].headers["X-PH-Client"], createHash("sha256").update("203.0.113.7salz").digest("hex"));
  assert.ok(!JSON.stringify(f.calls).includes("203.0.113.7"));
  await createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {}, visitorIp: "203.0.113.7" }).get(record.listId);
  assert.equal(f.calls[1].headers["X-PH-Client"], undefined);
});

test("Konflikt-Hinweis in vier Sprachen", () => {
  for (const l of ["de", "en", "fr", "it"]) assert.ok(WUNSCHLISTE_TEXT[l].errors.conflict?.length > 20, l);
});
