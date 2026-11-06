// Fähigkeiten-Register (G-04, Q-A7, K-19): Schalter, Mock-Probe gegen Backend-Import, Frappe-Probe,
// Rechte, Darstellung (an / deaktiviert / aus), Cache.
//   node --test tests/unit/backoffice-register-faehigkeiten.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { BackofficeError } from "../../src/lib/backoffice/frappe/errors.js";
import {
  KERN_FAEHIGKEITEN, alleFaehigkeiten, darstellung, definiereFaehigkeiten, faehigkeit, faehigkeiten, hatWhitelistFunktion, hinweisText, leereFaehigkeitenCache, parseSchalter, schalterSagt,
} from "../../src/lib/backoffice/faehigkeiten.js";

const GF = { user: "gf@demo.local", roles: ["PH Geschäftsführung"] };
const KASSA_MA = { user: "kassa@demo.local", roles: ["PH Kassa Mitarbeiter"] };

const T = definiereFaehigkeiten("testp", {
  da: { titel: "Vorhandene Methode", probe: { methode: "ph_kundenkarte.api.lookup_card" } },
  fehlt: { titel: "Fehlende Methode", probe: { methode: "ph_kassa.dienste.gibt_es_nicht" }, ersatz: { titel: "An der Kassa kassieren", href: "/kassa" } },
  feld: { titel: "Feld EAN", probe: { doctype: "PH Produkt", feld: "ean" } },
  feldfehlt: { titel: "Feld fehlt", probe: [{ doctype: "PH Produkt" }, { doctype: "PH Produkt", feld: "gibt_es_nicht" }], erwartet: false },
  doctypefehlt: { titel: "DocType fehlt", probe: { doctype: "PH Gibt Es Nicht" } },
  ohne: { titel: "Ohne Probe", grund: "Wartet auf Steuerberater" },
  leitung: { titel: "Nur Faktura-Leitung", recht: { bereich: "faktura", aktion: "cancel" }, probe: { doctype: "PH Rechnung" } },
  methodefrappe: { titel: "Methode im Frappe-Modus", probe: { methode: "ph_core.api.suche.global_search", get: true } },
  ungeprueft: { titel: "Methode ohne GET-Probe", probe: { methode: "ph_kassa.dienste.retoure" } },
});

const env = {};
const mock = (id, o = {}) => faehigkeit(GF, id, { katalog: T, env, modus: "mock", ...o });

test("Schalter: alle, keine, einzeln, Bereich", () => {
  const s = parseSchalter(" alle , -Kassa.Retoure, +shop.x ");
  assert.equal(s.alle, true);
  assert.deepEqual([...s.aus], ["kassa.retoure"]);
  assert.deepEqual([...s.an], ["shop.x"]);
  assert.equal(schalterSagt(s, "kassa.retoure"), false);
  assert.equal(schalterSagt(s, "faktura.y"), true);
  assert.equal(schalterSagt(s, "faktura.y", { alleErlaubt: false }), null);
  assert.equal(schalterSagt("keine,+crm.a", "crm.a"), true);
  assert.equal(schalterSagt("keine", "crm.b"), false);
  assert.equal(schalterSagt("-crm.*", "crm.c"), false);
  assert.equal(schalterSagt("", "crm.c"), null);
});

test("Mock: Probe gegen die echten Dateien in Backend-Import", async () => {
  leereFaehigkeitenCache();
  assert.equal((await mock("testp.da")).an, true);
  const fehlt = await mock("testp.fehlt");
  assert.deepEqual([fehlt.an, fehlt.erwartet, fehlt.quelle], [false, true, "probe"]);
  assert.equal(hinweisText(fehlt), "Noch nicht verfügbar – An der Kassa kassieren");
  assert.equal(darstellung(fehlt), "deaktiviert");
  assert.equal((await mock("testp.feld")).an, true);
  const ff = await mock("testp.feldfehlt");
  assert.deepEqual([ff.an, darstellung(ff)], [false, "aus"], "nicht erwartet → ausgeblendet");
  assert.equal((await mock("testp.doctypefehlt")).an, false);
  const ohne = await mock("testp.ohne");
  assert.deepEqual([ohne.an, ohne.grund, ohne.quelle], [false, "Wartet auf Steuerberater", "ohne-probe"]);
  assert.equal(hinweisText(ohne), "Wartet auf Steuerberater");
});

test("Mock: Schalter überstimmt die Probe (QA „alle an / alle aus“)", async () => {
  assert.equal((await mock("testp.fehlt", { env: { BACKOFFICE_MOCK_FAEHIGKEITEN: "alle" } })).an, true);
  assert.equal((await mock("testp.da", { env: { BACKOFFICE_MOCK_FAEHIGKEITEN: "keine" } })).an, false);
  assert.equal((await mock("testp.da", { ueberschreibung: "alle,-testp.da" })).quelle, "schalter");
  assert.equal((await mock("testp.da", { ueberschreibung: "alle,-testp.da" })).an, false);
});

test("Recht und unbekannte ID → ausgeblendet, nie Schein-Knopf", async () => {
  const r = await faehigkeit(KASSA_MA, "testp.leitung", { katalog: T, env, modus: "mock" });
  assert.deepEqual([r.an, r.erwartet, r.quelle, darstellung(r)], [false, false, "recht", "aus"]);
  const u = await faehigkeit(GF, "gibt.es.nicht", { env, modus: "mock" });
  assert.deepEqual([u.an, darstellung(u)], [false, "aus"]);
  assert.equal(darstellung(null), "aus");
});

test("Frappe: getMeta-Probe, GET-Probe, „alle“ wirkt nicht, Betrieb gibt frei", async () => {
  leereFaehigkeitenCache();
  const aufrufe = [];
  const client = {
    modus: "frappe",
    async getMeta(dt) {
      aufrufe.push(dt);
      if (dt === "PH Produkt") return { name: dt, fields: [{ fieldname: "ean" }] };
      throw new BackofficeError("not_found", "fehlt");
    },
    async methodGet(m) {
      aufrufe.push(m);
      throw new BackofficeError("invalid", "q fehlt"); // Methode existiert, Parameter fehlt
    },
  };
  const f = (id, o = {}) => faehigkeit(GF, id, { katalog: T, client, env: {}, ...o });
  assert.equal((await f("testp.feld")).an, true);
  assert.equal((await f("testp.doctypefehlt")).an, false);
  assert.equal((await f("testp.methodefrappe")).an, true, "invalid = Methode vorhanden");
  assert.equal((await f("testp.ungeprueft")).an, false, "ohne GET-Probe nicht gefahrlos prüfbar → aus");
  assert.equal((await f("testp.ungeprueft", { env: { BACKOFFICE_FAEHIGKEITEN: "testp.ungeprueft" } })).an, true, "Betrieb gibt frei");
  assert.equal((await f("testp.doctypefehlt", { env: { BACKOFFICE_FAEHIGKEITEN: "alle" } })).an, false, "„alle“ überstimmt im Frappe-Modus keine Probe");
  const vorher = aufrufe.length;
  await f("testp.feld");
  assert.equal(aufrufe.length, vorher, "Cache 5 min");
  await f("testp.feld", { jetzt: Date.now() + 6 * 60_000 });
  assert.ok(aufrufe.length >= vorher, "nach Ablauf neue Probe erlaubt");
});

test("Definition: IDs mit Bereich, Doppelte werfen, Übersicht und Kern", async () => {
  assert.ok(T["testp.da"] && T["testp.da"].erwartet === true);
  assert.throws(() => definiereFaehigkeiten("testp", { da: { titel: "Andere Definition" } }), /doppelt definiert: testp\.da/);
  assert.throws(() => definiereFaehigkeiten("Test", { a: { titel: "x" } }), /ungültiger Bereich/);
  assert.throws(() => definiereFaehigkeiten("testq", { a: {} }), /ohne Titel/);
  assert.ok(alleFaehigkeiten().some((d) => d.id === "kern.suche"));
  const kern = await faehigkeiten(GF, Object.keys(KERN_FAEHIGKEITEN), { env: {}, modus: "mock" });
  assert.equal(kern["kern.suche"].an, true, "ph_core.api.suche.global_search ist whitelisted");
  assert.equal(kern["kern.geraete"].an, true);
});

test("Whitelist-Erkennung mit weiteren Dekoratoren", () => {
  const py = '@frappe.whitelist(allow_guest=False, methods=["GET"])\n@ph_api(limit_pro_minute=30)\ndef ping():\n    pass\n\ndef intern():\n    pass\n';
  assert.ok(hatWhitelistFunktion(py, "ping"));
  assert.ok(!hatWhitelistFunktion(py, "intern"));
  assert.ok(hatWhitelistFunktion("    @frappe.whitelist()\n    def scan(self, code):", "scan"));
});
