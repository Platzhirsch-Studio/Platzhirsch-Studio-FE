// node --test tests/unit/stilfinder-pdflead-outbox.test.mjs
// pdf-lead fix-06: abgelaufene Postausgang-Einträge (Testadressen) verschwinden auch
// beim Lesen, nicht erst beim nächsten Schreiben.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const { writeOutbox, readOutboxPdf } = await import("../../src/lib/stilfinder/outbox.js");
const mail = { subject: "S", html: "<p>h</p>", text: "t" };

test("readOutboxPdf löscht abgelaufene Einträge", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "sf-outbox-read-"));
  try {
    const now = Date.now();
    const fresh = await writeOutbox({ dir, pdf: Buffer.from("%PDF-1.7"), mail, meta: { to: "neu@example.invalid" }, now: now - 2 * 864e5 });
    // a second entry, one day younger
    const old = await writeOutbox({ dir, pdf: Buffer.from("%PDF-1.7"), mail, meta: { to: "alt@example.invalid" }, now: now - 1 * 864e5 });
    assert.ok(existsSync(path.join(dir, old.id)));
    // days later nobody writes – a read alone cleans up
    const later = now + 5.5 * 864e5; // fresh: 7.5 days old, old: 6.5 days
    assert.equal(await readOutboxPdf(fresh.id, { dir, now: later }), null);
    assert.ok(!existsSync(path.join(dir, fresh.id)), "abgelaufen → gelöscht");
    assert.ok(existsSync(path.join(dir, old.id)), "noch in der Frist → bleibt");
    assert.ok((await readOutboxPdf(old.id, { dir, now: later }))?.pdf.length > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
