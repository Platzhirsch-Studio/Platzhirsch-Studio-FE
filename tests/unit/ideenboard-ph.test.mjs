// tests/unit/ideenboard-ph.test.mjs – geteilte Ideenboards im ph-Backend (ph_marketing), Website-Anbindung Runde 2, Punkt 3.
// Alle Aufrufe gegen fetch-Attrappen.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createPhStore, PH_IDEENBOARD, MAX_ATTEMPTS } from "../../src/lib/ideenboard/phAdapter.js";
import { ideenboardShareAvailable, storageKind } from "../../src/lib/ideenboard/mode.js";
import { BoardError, createRecord, syncRecord } from "../../src/lib/ideenboard/model.js";
import { newIds, sha256 } from "../../src/lib/ideenboard/ids.js";

const CFG = { url: "https://staging.example.test", key: "k", secret: "s" };
const PH_ENV = { BACKEND_GENERATION: "ph", BACKEND_PH_URL: CFG.url, BACKEND_PH_TOKEN: "k:s" };
const BOARD = { cards: [{ type: "moebel", title: "Sofa", href: "/de/produkte/sofa" }] };

function makeRecord() {
  const ids = newIds();
  const record = createRecord({ board: BOARD, ids, hashes: { share: sha256(ids.shareId), admin: sha256(ids.adminSecret) }, now: new Date("2026-11-04T10:00:00Z") });
  return { record, ids };
}

function fake(handlers) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const method = url.split("/api/method/")[1].split("?")[0];
    const params = init.body ? JSON.parse(init.body) : {};
    calls.push({ url, method, params, headers: init.headers });
    const h = handlers[method];
    const { status = 200, body } = h ? await h(params) : { status: 404, body: {} };
    return { ok: status < 400, status, json: async () => JSON.parse(JSON.stringify(body ?? null)) };
  };
  return { calls, fetchImpl };
}
const err = (code, status) => ({ status, body: { message: { code } } });

test("Speicherwahl: ohne Schalter lokal wie bisher; ph nur mit IDEENBOARD_STORAGE=ph + Gruppe + Zugang", () => {
  assert.equal(storageKind({}), "local");
  assert.equal(storageKind({ NODE_ENV: "production" }), null);
  assert.equal(storageKind({ ...PH_ENV }), "local", "Gruppe allein schaltet nichts um");
  assert.equal(storageKind({ ...PH_ENV, IDEENBOARD_STORAGE: "ph" }), "ph");
  assert.equal(storageKind({ ...PH_ENV, IDEENBOARD_STORAGE: "ph", NODE_ENV: "production" }), "ph", "kein Volume nötig");
  assert.equal(storageKind({ BACKEND_GENERATION: "ph", IDEENBOARD_STORAGE: "ph" }), null, "Zugang fehlt → aus");
  assert.equal(storageKind({ IDEENBOARD_STORAGE: "ph" }), "local", "Gruppe alt");
  assert.equal(ideenboardShareAvailable({ BACKEND_GENERATION: "ph", IDEENBOARD_STORAGE: "ph" }), false);
  assert.equal(ideenboardShareAvailable({ ...PH_ENV, IDEENBOARD_STORAGE: "ph" }), true);
});

test("create/get/getByShare: Pfad, Parameter, nur Hash des Teilen-Links, Token, X-PH-Client", async () => {
  const { record, ids } = makeRecord();
  const f = fake({
    [PH_IDEENBOARD.create]: (p) => ({ body: { message: { record: p.record } } }),
    [PH_IDEENBOARD.get]: () => ({ body: { message: { record } } }),
    [PH_IDEENBOARD.getByShare]: () => ({ body: { message: { record } } }),
  });
  const s = createPhStore(CFG, { fetchImpl: f.fetchImpl, env: { BACKEND_PH_CLIENT_SALT: "salz" }, visitorIp: "198.51.100.4" });
  assert.deepEqual(await s.create(record), record);
  assert.equal(f.calls[0].url, `${CFG.url}/api/method/ph_marketing.api.create_ideenboard`);
  assert.deepEqual(f.calls[0].params, { record });
  assert.equal(f.calls[0].headers.Authorization, "token k:s");
  assert.equal(f.calls[0].headers["X-PH-Client"], createHash("sha256").update("198.51.100.4salz").digest("hex"));
  assert.deepEqual(await s.get(ids.boardId), record);
  assert.deepEqual(f.calls[1].params, { board_id: ids.boardId });
  assert.deepEqual(await s.getByShare(ids.shareId), record);
  assert.deepEqual(f.calls[2].params, { share_hash: sha256(ids.shareId) });
  assert.ok(!JSON.stringify(f.calls).includes(ids.shareId) && !JSON.stringify(f.calls).includes(ids.adminSecret));
  assert.ok(!JSON.stringify(f.calls).includes("198.51.100.4"));

  const none = fake({ [PH_IDEENBOARD.get]: () => ({ body: { message: { record: null } } }) });
  assert.equal(await createPhStore(CFG, { fetchImpl: none.fetchImpl, env: {} }).get(ids.boardId), null);
  assert.equal(none.calls[0].headers["X-PH-Client"], undefined, "ohne Salz kein Header");
});

test("update: expected_updated_at = gelesenes updatedAt; 409 → neu laden + erneut anwenden", async () => {
  const { record, ids } = makeRecord();
  const newer = { ...structuredClone(record), updatedAt: "2026-11-04T11:00:00.000Z" };
  let n = 0;
  const f = fake({
    [PH_IDEENBOARD.get]: () => ({ body: { message: { record: n === 0 ? record : newer } } }),
    [PH_IDEENBOARD.update]: (p) => (n++ === 0 ? err("conflict", 409) : { body: { message: { record: p.record } } }),
  });
  const s = createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {} });
  const board = { cards: [...BOARD.cards, { type: "ezarri", title: "Mosaik", href: "/de/ezarri" }] };
  const { record: saved } = await s.update(ids.boardId, (r) => syncRecord(r, board));
  assert.equal(saved.cards.length, 2);
  const ups = f.calls.filter((c) => c.method === PH_IDEENBOARD.update);
  assert.equal(ups[0].params.expected_updated_at, record.updatedAt);
  assert.equal(ups[1].params.expected_updated_at, newer.updatedAt);
  assert.equal(ups[1].params.board_id, ids.boardId);
});

test("update: dauerhafter Konflikt → BoardError 409; 404 → null; Ausfall → 503", async () => {
  const { record, ids } = makeRecord();
  const f = fake({ [PH_IDEENBOARD.get]: () => ({ body: { message: { record } } }), [PH_IDEENBOARD.update]: () => err("conflict", 409) });
  await assert.rejects(createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {} }).update(ids.boardId, () => {}), (e) => e instanceof BoardError && e.code === "conflict" && e.status === 409);
  assert.equal(f.calls.filter((c) => c.method === PH_IDEENBOARD.update).length, MAX_ATTEMPTS);

  const g = fake({ [PH_IDEENBOARD.get]: () => ({ body: { message: { record } } }), [PH_IDEENBOARD.update]: () => err("not_found", 404) });
  assert.equal((await createPhStore(CFG, { fetchImpl: g.fetchImpl, env: {} }).update(ids.boardId, () => {})).record, null);

  const down = fake({ [PH_IDEENBOARD.get]: () => ({ status: 503, body: {} }) });
  await assert.rejects(createPhStore(CFG, { fetchImpl: down.fetchImpl, env: {} }).get(ids.boardId), (e) => e.code === "unavailable" && e.status === 503);
  const forb = fake({ [PH_IDEENBOARD.create]: () => err("forbidden", 403) });
  await assert.rejects(createPhStore(CFG, { fetchImpl: forb.fetchImpl, env: {} }).create(record), (e) => e.status === 503, "gesperrte API → 503, kein Detail an den Browser");
  const empty = fake({ [PH_IDEENBOARD.create]: () => err("invalid", 400) });
  await assert.rejects(createPhStore(CFG, { fetchImpl: empty.fetchImpl, env: {} }).create(record), (e) => e.code === "invalid" && e.status === 400);
});

test("remove: {removed}; sweep macht das Backend", async () => {
  const { ids } = makeRecord();
  const f = fake({ [PH_IDEENBOARD.remove]: () => ({ body: { message: { removed: true } } }) });
  const s = createPhStore(CFG, { fetchImpl: f.fetchImpl, env: {} });
  assert.equal(await s.remove(ids.boardId), true);
  assert.equal(f.calls[0].url, `${CFG.url}/api/method/ph_marketing.api.remove_ideenboard`);
  assert.deepEqual(await s.sweep(() => true), { checked: 0, removed: 0, orphans: 0 });
  assert.equal(f.calls.length, 1);
});
