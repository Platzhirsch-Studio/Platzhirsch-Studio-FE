// Sitzung (HMAC-Cookie, Ablauf, Store/Idle) und Rechte-Matrix.
//   node --test tests/unit/backoffice-session-rechte.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionValue, readSessionValue } from "../../src/lib/backoffice/auth/session.js";
import { MemorySessionStore, pruefeStoreEintrag, KIOSK_IDLE_SECONDS } from "../../src/lib/backoffice/auth/store.js";
import { aktionenIn, darf, darfDoc, darfUebergang, erlaubteArbeitsplaetze, istAdmin, sichtbareBereiche, zerlegeRolle } from "../../src/lib/backoffice/auth/rechte.js";
import { BEREICH_SLUGS } from "../../src/lib/backoffice/bereiche/index.js";
import { backofficeMode, hasSessionSecret, mockPassword } from "../../src/lib/backoffice/config.js";

const SECRET = "test-secret-mindestens-32-zeichen-lang-0000";

test("Session-Cookie: signieren, lesen, Manipulation und Ablauf erkennen", () => {
  const { value, sid } = createSessionValue({ user: "gf@demo.local", name: "Max", roles: ["PH Geschäftsführung"], secret: SECRET });
  const s = readSessionValue(value, { secret: SECRET, secretOk: true });
  assert.equal(s.user, "gf@demo.local");
  assert.equal(s.sid, sid);
  assert.deepEqual(s.roles, ["PH Geschäftsführung"]);
  assert.equal(s.expiresAt - s.issuedAt, 10 * 3600);
  // Manipulation: anderes Secret / verändertes Payload
  assert.equal(readSessionValue(value, { secret: "anderes-secret-mindestens-32-zeichen-00", secretOk: true }), null);
  assert.equal(readSessionValue(`x${value}`, { secret: SECRET, secretOk: true }), null);
  // Ablauf
  assert.equal(readSessionValue(value, { secret: SECRET, secretOk: true, now: Date.now() + 11 * 3600 * 1000 }), null);
  // Fail-closed ohne Secret
  assert.equal(readSessionValue(value, { secret: SECRET, secretOk: false }), null);
});

test("Store: Idle-Timeout 60 min (Kiosk 15 min), absolute Frist 10 h", async () => {
  const store = new MemorySessionStore();
  await store.set("s1", { user: "a", frappeSid: "frappe-sid" });
  const e = await store.get("s1");
  assert.equal(e.frappeSid, "frappe-sid");
  assert.equal(pruefeStoreEintrag(e), "ok");
  assert.equal(pruefeStoreEintrag(e, { now: Date.now() + 61 * 60 * 1000 }), "inaktiv");
  assert.equal(pruefeStoreEintrag(e, { now: Date.now() + 16 * 60 * 1000, kiosk: true }), "inaktiv");
  assert.equal(pruefeStoreEintrag(e, { now: Date.now() + 14 * 60 * 1000, kiosk: true }), "ok");
  assert.equal(pruefeStoreEintrag({ ...e, lastSeen: Date.now() }, { now: Date.now() + 11 * 3600 * 1000 }), "abgelaufen");
  assert.equal(pruefeStoreEintrag(null), "fehlt");
  assert.equal(KIOSK_IDLE_SECONDS, 900);
});

test("Konfiguration: Modus-Automatik, Mock-Passwort nur außerhalb Produktion, Secret-Pflicht", () => {
  assert.equal(backofficeMode({}), "mock");
  assert.equal(backofficeMode({ BACKOFFICE_FRAPPE_URL: "https://x" }), "frappe");
  assert.equal(backofficeMode({ BACKOFFICE_FRAPPE_URL: "https://x", BACKOFFICE_MODE: "mock" }), "mock");
  assert.equal(mockPassword({}, false), "demo");
  assert.equal(mockPassword({}, true), null);
  assert.equal(mockPassword({ BACKOFFICE_MOCK_PASSWORD: "geheim" }, true), "geheim");
  assert.equal(hasSessionSecret({}, true), false);
  assert.equal(hasSessionSecret({}, false), true);
  assert.equal(hasSessionSecret({ BACKOFFICE_SESSION_SECRET: SECRET }, true), true);
});

test("Rechte-Matrix nach CONVENTIONS §4/§5", () => {
  const gf = { roles: ["PH Geschäftsführung"] };
  const admin = { roles: ["PH Backoffice-Admin"] };
  const crm = { roles: ["PH CRM Mitarbeiter"] };
  const crmL = { roles: ["PH CRM Leitung"] };
  const buch = { roles: ["PH Buchhaltung extern"] };
  const montage = { roles: ["PH Montage"] };
  const web = { roles: ["PH Website Integration"] };

  assert.equal(sichtbareBereiche(gf).length, BEREICH_SLUGS.length, "GF sieht alle Bereiche");
  assert.ok(darf(gf, "faktura", "read") && !darf(gf, "faktura", "write") && darf(gf, "faktura", "export"));
  assert.ok(darf(admin, "shop", "delete") && istAdmin(admin) && !darf(admin, "shop", "submit"));
  assert.ok(darf(crm, "crm", "write") && darf(crm, "crm", "create") && !darf(crm, "crm", "delete") && !darf(crm, "crm", "export"));
  assert.ok(darf(crm, "zentrale", "read") && !darf(crm, "shop", "read"));
  assert.ok(darf(crmL, "crm", "delete") && darf(crmL, "crm", "export") && darf(crmL, "crm", "amend"));
  assert.deepEqual(sichtbareBereiche(buch), ["zentrale", "faktura", "kassa"]);
  assert.ok(darf(buch, "faktura", "export") && !darf(buch, "faktura", "write"));
  assert.ok(darf(montage, "projekte", "write") && !darf(montage, "projekte", "delete") && darf(montage, "logistik", "read"));
  assert.deepEqual(sichtbareBereiche(web), []);
  assert.deepEqual([...aktionenIn({ roles: [] }, "zentrale")], []);
  assert.deepEqual(zerlegeRolle("PH Kundenkarte Leitung"), { bereich: "kundenkarte", stufe: "leitung" });
});

test("darfDoc nutzt die Rechte aus der DocType-JSON, darfUebergang die allowed-Rolle", () => {
  const meta = {
    name: "PH Anfrage",
    bereich: "crm",
    permissions: [
      { role: "PH CRM Mitarbeiter", permlevel: 0, read: true, write: true, create: true, delete: false, export: false, report: true, print: true },
      { role: "PH Geschäftsführung", permlevel: 0, read: true, export: true },
    ],
  };
  assert.ok(darfDoc({ roles: ["PH CRM Mitarbeiter"] }, meta, "write"));
  assert.ok(!darfDoc({ roles: ["PH CRM Mitarbeiter"] }, meta, "export"));
  assert.ok(darfDoc({ roles: ["PH Geschäftsführung"] }, meta, "export"));
  assert.ok(!darfDoc({ roles: ["PH Shop Mitarbeiter"] }, meta, "read"));
  assert.ok(darfDoc({ roles: ["System Manager"] }, meta, "delete"));
  // Admin: aus Bereichs-Matrix (nicht in der JSON gelistet)
  assert.ok(darfDoc({ roles: ["PH Backoffice-Admin"] }, meta, "delete"));
  const t = { allowed: "PH CRM Mitarbeiter" };
  assert.ok(darfUebergang({ roles: ["PH CRM Mitarbeiter"] }, t));
  assert.ok(darfUebergang({ roles: ["PH CRM Leitung"] }, t), "Leitung darf Mitarbeiter-Übergänge");
  assert.ok(!darfUebergang({ roles: ["PH CRM Mitarbeiter"] }, { allowed: "PH CRM Leitung" }));
  assert.ok(!darfUebergang({ roles: ["PH Geschäftsführung"] }, t), "GF führt keine Übergänge aus");
});

test("Arbeitsplätze (Entscheidung Nr. 49) nach Rollen", () => {
  const slugs = (s) => erlaubteArbeitsplaetze(s).map((a) => a.slug);
  assert.deepEqual(slugs({ roles: ["PH Kassa Mitarbeiter"] }), ["backoffice", "kassa"]);
  assert.deepEqual(slugs({ roles: ["PH Logistik Leitung"] }), ["backoffice", "packtisch"]);
  assert.deepEqual(slugs({ roles: ["PH Montage"] }), ["backoffice", "montage"]);
  assert.deepEqual(slugs({ roles: ["PH Techniker"] }), ["backoffice", "technik"]);
  assert.deepEqual(slugs({ roles: ["PH CRM Mitarbeiter"] }), ["backoffice"]);
  assert.equal(slugs({ roles: ["PH Backoffice-Admin"] }).length, 5);
  assert.deepEqual(slugs({ roles: [] }), []);
});
