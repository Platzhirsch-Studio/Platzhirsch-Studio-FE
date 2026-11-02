// node --test tests/unit/sofaplaner-teilen-body.test.mjs
// Team katalog-modell-code (31.10.2026), fix-02: the share route reads its
// JSON body with a hard byte limit instead of buffering request.text() first.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readJsonLimited } from "../../src/components/Labs/Sofaplaner/server/body.js";

const MAX = 32 * 1024;
const req = (body, headers = { "content-type": "application/json" }) => new Request("http://localhost/de/sofaplaner/teilen", { method: "POST", headers, body });

test("gültiges JSON unter der Grenze wird gelesen (auch mit charset)", async () => {
  const r = await readJsonLimited(req(JSON.stringify({ plan: { v: 2 } }), { "content-type": "application/json; charset=utf-8" }), MAX);
  assert.deepEqual(r, { json: { plan: { v: 2 } } });
});

test("falscher Content-Type → 415 (kein Formular-Post von fremden Seiten)", async () => {
  for (const type of ["text/plain", "application/x-www-form-urlencoded", ""]) {
    const r = await readJsonLimited(req("{}", type ? { "content-type": type } : {}), MAX);
    assert.equal(r.status, 415, type);
  }
});

test("zu groß: angekündigte Länge → 413, ohne den Body zu lesen", async () => {
  let pulled = 0;
  const stream = new ReadableStream({
    pull(c) {
      pulled += 1;
      c.enqueue(new Uint8Array(1024));
    },
  });
  const r = await readJsonLimited(
    new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json", "content-length": String(MAX + 1) }, body: stream, duplex: "half" }),
    MAX
  );
  assert.equal(r.status, 413);
  assert.ok(pulled <= 2, `${pulled} Blöcke gelesen`);
});

test("zu groß ohne Content-Length (Stream): Abbruch kurz nach der Grenze, nicht erst am Ende", async () => {
  let sent = 0;
  const stream = new ReadableStream({
    pull(c) {
      sent += 4096;
      c.enqueue(new Uint8Array(4096).fill(32));
      if (sent > 50 * 1024 * 1024) c.close();
    },
  });
  const r = await readJsonLimited(new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" }), MAX);
  assert.equal(r.status, 413);
  assert.ok(sent < MAX + 64 * 1024, `${sent} Bytes gelesen`);
});

test("Grenze in Bytes, nicht in Zeichen (Umlaute zählen doppelt)", async () => {
  const name = "ü".repeat(Math.floor(MAX / 2) + 10); // < MAX characters, > MAX bytes
  assert.ok(JSON.stringify({ name }).length < MAX);
  const r = await readJsonLimited(req(JSON.stringify({ name })), MAX);
  assert.equal(r.status, 413);
});

test("kaputtes JSON und ungültiges UTF-8 → 400", async () => {
  assert.equal((await readJsonLimited(req("{plan:"), MAX)).status, 400);
  assert.equal((await readJsonLimited(req(new Uint8Array([0x7b, 0xff, 0x7d])), MAX)).status, 400);
});

test("Teilen-Route nutzt readJsonLimited statt request.text()", () => {
  const src = readFileSync(new URL("../../src/app/[locale]/sofaplaner/teilen/route.js", import.meta.url), "utf8");
  assert.match(src, /readJsonLimited\(request, MAX_BYTES\)/);
  assert.doesNotMatch(src, /request\.text\(\)/);
});
