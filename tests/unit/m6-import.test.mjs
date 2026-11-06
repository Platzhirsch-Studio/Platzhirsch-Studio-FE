// tests/unit/m6-import.test.mjs – tools/migration/m6-import.mjs (Migration M6, Website-Anbindung Runde 2 Punkt 8).
// Testdaten in einem Temp-Ordner, Backend nur als fetch-Attrappe.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { MAX_STAPEL, METHOD, parseArgs, run, stapeln, stapelSchluessel } from "../../tools/migration/m6-import.mjs";

const H = (n) => String(n).padStart(64, "a").slice(-64).replace(/[^a-f0-9]/g, "b");
const ENV = { BACKEND_PH_URL: "https://staging.example.test", BACKEND_PH_TOKEN: "key1:geheim1" };

async function testDaten({ bestellungen = 3, gutscheine = 2 } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "m6-"));
  await mkdir(path.join(dir, "shop"), { recursive: true });
  await mkdir(path.join(dir, "payments"), { recursive: true });
  const obj = (list) => Object.fromEntries(list.map((e) => [e.id || e.hash, e]));
  const b = Array.from({ length: bestellungen }, (_, i) => ({ id: `PH-S-261031-${String(i).padStart(6, "0")}`, token: "t", status: "bezahlt", zeilen: [] }));
  await writeFile(path.join(dir, "shop", "bestellungen.json"), JSON.stringify(obj(b)));
  await writeFile(path.join(dir, "shop", "widerrufe.json"), JSON.stringify(obj([{ id: "WS-AAAA-BBBB", name: "A", email: "a@b.test", angabe: b[0]?.id }])));
  await writeFile(path.join(dir, "payments", "orders.json"), JSON.stringify(obj([{ id: "G-AAAA-BBBB", status: "bezahlt", codes: [{ hash: H(1), ende: "ABCD" }] }])));
  const reg = Array.from({ length: gutscheine }, (_, i) => ({ hash: H(i + 1), ende: "ABCD", wert_cent: 5000, rest_cent: 5000, status: "aktiv", einloesungen: [] }));
  reg.push({ hash: "kaputt", ende: "ZZZZ", wert_cent: 100, rest_cent: 200 });
  await writeFile(path.join(dir, "payments", "register.json"), JSON.stringify(obj(reg)));
  await writeFile(path.join(dir, "payments", "withdrawals.json"), JSON.stringify(obj([{ id: "W-AAAA-BBBB", name: "B", email: "b@b.test", angabe: "G-AAAA-BBBB" }])));
  // deposits.json fehlt absichtlich.
  return dir;
}

function attrappe(antwort = () => ({ status: 200, body: { message: { probelauf: false, angelegt: { bestellungen: 1 }, uebersprungen: {}, fehler: [] } } })) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, init, body });
    const r = antwort(body, calls.length);
    return { ok: r.status < 400, status: r.status, json: async () => r.body };
  };
  return { calls, fetchImpl };
}

test("Trockenlauf (Standard): liest alle Sammlungen, zählt, prüft vor – sendet nichts, auch mit Env", async () => {
  const dir = await testDaten();
  try {
    const f = attrappe();
    const { bericht, exitCode } = await run({ dataDir: dir, env: ENV, fetchImpl: f.fetchImpl });
    assert.equal(exitCode, 0);
    assert.equal(f.calls.length, 0, "Trockenlauf sendet nie");
    assert.equal(bericht.modus, "trockenlauf");
    assert.deepEqual(bericht.gelesen, { bestellungen: 3, gutschein_bestellungen: 1, gutscheine: 3, anzahlungen: 0, widerrufe: 2 });
    assert.equal(bericht.gesamt, 9);
    assert.equal(bericht.stapel.length, 1);
    assert.ok(bericht.quellen.find((q) => q.art === "anzahlungen").fehlt);
    assert.deepEqual(bericht.vorpruefung, [{ art: "gutscheine", id: "…ZZZZ", grund: "hash fehlt oder ist kein sha256" }]);
    assert.ok(!JSON.stringify(bericht).includes("geheim1"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("stapeln: höchstens n Einträge gesamt je Stapel, Backend-Reihenfolge der Arten", () => {
  const daten = { bestellungen: Array.from({ length: 1203 }, (_, i) => ({ id: `B${i}` })), gutscheine: [{ hash: "x" }], widerrufe: [{ id: "W" }] };
  const s = stapeln(daten);
  assert.deepEqual(s.map((x) => Object.values(x).reduce((n, l) => n + l.length, 0)), [500, 500, 205]);
  assert.deepEqual(Object.keys(s[2]), ["bestellungen", "gutscheine", "widerrufe"]);
  assert.equal(stapeln(daten, 9999).length, 3, "Obergrenze 500 gilt immer");
  assert.equal(stapeln(daten, 100).length, 13);
  assert.equal(stapeln({}).length, 0);
});

test("--wirklich ohne Env/mit geschütztem Backoffice: nichts gesendet, Exit 2", async () => {
  const dir = await testDaten();
  try {
    const f = attrappe();
    const a = await run({ wirklich: true, dataDir: dir, env: {}, fetchImpl: f.fetchImpl });
    assert.equal(a.exitCode, 2);
    assert.deepEqual(a.bericht.abgebrochen, { grund: "zugang", detail: "url_fehlt" });
    const b = await run({ wirklich: true, dataDir: dir, env: { BACKEND_PH_URL: "https://backoffice.platzhirsch.studio", BACKEND_PH_TOKEN: "k:s" }, fetchImpl: f.fetchImpl });
    assert.equal(b.bericht.abgebrochen.detail, "geschuetzt");
    assert.equal(f.calls.length, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("--wirklich gegen Attrappe: Pfad, Token, Stapel ≤ 500, probelauf, Idempotenz-Schlüssel, Summen", async () => {
  const dir = await testDaten({ bestellungen: 620, gutscheine: 1 });
  try {
    const f = attrappe((body) => ({ status: 200, body: { message: { probelauf: Boolean(body.probelauf), angelegt: { bestellungen: (body.bestellungen || []).length }, uebersprungen: { gutscheine: (body.gutscheine || []).length }, fehler: [] } } }));
    const { bericht, exitCode } = await run({ wirklich: true, probelauf: true, dataDir: dir, env: ENV, fetchImpl: f.fetchImpl });
    assert.equal(exitCode, 0);
    assert.equal(f.calls.length, 2);
    for (const c of f.calls) {
      assert.equal(c.url, `https://staging.example.test/api/method/${METHOD}`);
      assert.equal(c.init.method, "POST");
      assert.equal(c.init.headers.Authorization, "token key1:geheim1");
      assert.equal(c.init.headers["X-PH-Client"], undefined, "kein Besucher-Request");
      assert.equal(c.body.probelauf, 1);
      assert.match(c.body.idempotency_key, /^m6:p:[0-9a-f]{48}$/);
      assert.ok(c.body.idempotency_key.length <= 80);
      const n = Object.entries(c.body).filter(([, v]) => Array.isArray(v)).reduce((s, [, v]) => s + v.length, 0);
      assert.ok(n <= MAX_STAPEL);
    }
    assert.equal(f.calls[0].body.bestellungen.length, 500);
    assert.equal(bericht.modus, "probelauf");
    assert.equal(bericht.angelegt.bestellungen, 620);
    assert.equal(bericht.uebersprungen.gutscheine, 2);
    assert.equal(bericht.ziel, "https://staging.example.test");
    // gleicher Stapel → gleicher Schlüssel; Probelauf und echter Lauf unterscheiden sich
    const s = { bestellungen: [{ id: "X" }] };
    assert.equal(stapelSchluessel(s, false), stapelSchluessel(s, false));
    assert.notEqual(stapelSchluessel(s, false), stapelSchluessel(s, true));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Fehlerbericht: Eintragsfehler aus dem Backend gesammelt (Exit 1); Aufruffehler bricht ab", async () => {
  const dir = await testDaten({ bestellungen: 700 });
  try {
    const a = attrappe((body, n) => ({ status: 200, body: { message: { angelegt: {}, uebersprungen: {}, fehler: n === 1 ? [{ art: "bestellungen", id: "PH-S-X", code: "invalid", meldung: "id fehlt." }] : [] } } }));
    const r1 = await run({ wirklich: true, dataDir: dir, env: ENV, fetchImpl: a.fetchImpl });
    assert.equal(r1.exitCode, 1);
    assert.deepEqual(r1.bericht.fehler, [{ stapel: 1, art: "bestellungen", id: "PH-S-X", code: "invalid", meldung: "id fehlt." }]);
    assert.equal(a.calls[0].body.probelauf, 0);
    assert.match(a.calls[0].body.idempotency_key, /^m6:w:/);

    const b = attrappe(() => ({ status: 403, body: { message: { code: "forbidden", message: "Import ist abgeschaltet" } } }));
    const r2 = await run({ wirklich: true, dataDir: dir, env: ENV, fetchImpl: b.fetchImpl });
    assert.equal(r2.exitCode, 1);
    assert.equal(b.calls.length, 1, "nach dem ersten Aufruffehler kein weiterer Stapel");
    assert.deepEqual(r2.bericht.abgebrochen, { grund: "aufruf", stapel: 1, code: "forbidden", status: 403 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("parseArgs: Standard Trockenlauf, Optionen, Grenzen", () => {
  assert.deepEqual(parseArgs([]), { wirklich: false, probelauf: false, dataDir: null, stapel: 500, bericht: null });
  const o = parseArgs(["--wirklich", "--probelauf", "--stapel", "100", "--data-dir", "x", "--bericht", "b.json"]);
  assert.equal(o.wirklich, true);
  assert.equal(o.stapel, 100);
  assert.equal(o.dataDir, path.resolve("x"));
  assert.throws(() => parseArgs(["--stapel", "501"]), /zwischen 1 und 500/);
  assert.throws(() => parseArgs(["--url", "https://x"]), /Unbekannte Option/);
});
