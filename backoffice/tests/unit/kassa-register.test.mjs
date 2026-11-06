// Kassa – Teildateien der Register (Zu tun, Freigaben, Akte-Slots, Druck) nach den Prüfregeln des Fundaments.
//   node --test tests/unit/kassa-register.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";
import { pruefeFreigaben } from "../../src/lib/backoffice/freigaben/index.js";
import { pruefeSlot } from "../../src/lib/backoffice/akte/slots.js";
import { DRUCKFORMATE } from "../../src/lib/backoffice/druck/index.js";
import aufgaben from "../../src/lib/backoffice/aufgaben/kassa.js";
import freigaben from "../../src/lib/backoffice/freigaben/kassa.js";
import slots from "../../src/lib/backoffice/akte/slots/kassa.js";
import druck from "../../src/lib/backoffice/druck/kassa.js";
import { MockClient, mockDatenbank } from "../../src/lib/backoffice/mock/client.js";
import { sicherstellen } from "../../src/lib/backoffice/kassa/mock.js";

test("Zu tun: Quellen der Kassa sind gültig und zählen im Mock", async () => {
  assert.deepEqual(pruefeQuellen({ kassa: aufgaben }), []);
  const c = new MockClient({ user: "kassa-leitung@demo.local", roles: ["PH Kassa Leitung"] }, { db: mockDatenbank({ reset: true }) });
  sicherstellen(c);
  const n = Object.fromEntries(await Promise.all(aufgaben.map(async (q) => [q.id, await q.zaehle({ client: c })])));
  assert.equal(n["kassa.abschluss-gezaehlt"], 1);
  assert.equal(n["kassa.meldung-finanzonline"], 1);
  assert.ok(n["kassa.abschluss-offen"] >= 1);
  assert.equal(n["kassa.dep-archivieren"], 1);
});

test("Freigaben und Druck: leer bzw. nur bekannte Formate", () => {
  assert.deepEqual(pruefeFreigaben({ kassa: freigaben }), []);
  const bekannt = new Set(Object.values(DRUCKFORMATE).flat());
  for (const d of Object.values(druck)) for (const f of d.formate) assert.ok(bekannt.has(f), f);
});

test("Akte-Slot „Kassenbelege“: gültig nach SLOT-API v1 und lädt Belege des Kontakts", async () => {
  for (const s of slots) assert.deepEqual(pruefeSlot(s), []);
  const c = new MockClient({ user: "kassa@demo.local", roles: ["PH Kassa Mitarbeiter"] }, { db: mockDatenbank({ reset: true }) });
  sicherstellen(c);
  const mitKunde = [...c.db.db.get("PH Kassenbeleg").values()].find((b) => b.kontakt);
  const daten = await slots[0].lade({}, mitKunde.kontakt, { client: c });
  assert.ok(daten.some((b) => b.name === mitKunde.name));
  assert.equal(slots[0].recht({ roles: ["PH CRM Mitarbeiter"] }), false);
});
