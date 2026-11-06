// Unit-Tests Bereich CRM (Team B-CRM): Register-Teildateien, Seed, Fähigkeiten und Abgleich mit Backend-Import.
//   node --test tests/unit/crm-register.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crm from "../../src/lib/backoffice/bereiche/crm.js";
import kuerzel from "../../src/lib/backoffice/kuerzel/crm.js";
import aufgaben from "../../src/lib/backoffice/aufgaben/crm.js";
import freigaben from "../../src/lib/backoffice/freigaben/crm.js";
import { CRM_DRUCK } from "../../src/lib/backoffice/druck/crm.js";
import { DRUCKFORMATE } from "../../src/lib/backoffice/druck/index.js";
import slots from "../../src/lib/backoffice/akte/slots/crm.js";
import { pruefeSlots } from "../../src/lib/backoffice/akte/slots.js";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";
import { pruefeKuerzel } from "../../src/lib/backoffice/kuerzel/kern.js";
import { CRM_FAEHIGKEITEN } from "../../src/lib/backoffice/crm/faehigkeiten.js";
import { hatWhitelistFunktion } from "../../src/lib/backoffice/faehigkeiten.js";
import qa from "../../tools/qa/routen/crm.mjs";
import { metaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(HIER, "../../../Backend-Import");
const APP = path.resolve(HIER, "../../src/app");

test("Bereich: Navigation zeigt nur vorhandene Seiten, Routen sind kanonisch", () => {
  for (const n of crm.navigation) {
    const p = n.href.split("?")[0];
    assert.ok(fs.existsSync(path.join(APP, p, "page.js")), `Seite fehlt: ${p}`);
  }
  assert.equal(crm.routen["PH Anfrage"]("PH-ANF-2026-00001"), "/crm/anfragen/PH-ANF-2026-00001");
  assert.equal(crm.routen["PH Kontakt"](), "/crm/kontakte");
  assert.ok(fs.existsSync(path.join(APP, "kunden", "[kontakt]", "page.js")));
  assert.ok(!crm.navigation.some((n) => /posteingang/i.test(n.titel)));
});

test("Kürzel, Zu tun, Freigaben, Druck, Slots: gültig nach den Fundament-Prüfungen", () => {
  assert.deepEqual(pruefeKuerzel(kuerzel.map((k) => ({ ...k, kontext: `${k.kontext}@crm` }))), []);
  assert.ok(kuerzel.every((k) => k.taste.startsWith("shift+")));
  assert.ok(kuerzel.filter((k) => k.aussenwirkung).every((k) => k.nurDialog));
  assert.deepEqual(pruefeQuellen({ crm: aufgaben }), []);
  assert.deepEqual(freigaben, []);
  for (const [dt, f] of Object.entries(CRM_DRUCK)) assert.ok(DRUCKFORMATE[dt]?.includes(f), `${dt}: ${f}`);
  assert.deepEqual(pruefeSlots(slots), []);
  assert.ok(qa.every((r) => r.titel && (r.pfad || r.ersterDatensatz)));
});

test("Fähigkeiten: Methoden der Proben existieren in Backend-Import (whitelisted)", () => {
  const datei = (app, modul) => path.join(BACKEND, app, app, ...modul.split(".")) + ".py";
  const initDatei = (app, modul) => path.join(BACKEND, app, app, ...modul.split("."), "__init__.py");
  for (const def of Object.values(CRM_FAEHIGKEITEN)) {
    const m = def.probe?.methode;
    if (!m || def.erwartet === false) continue;
    const teile = m.split(".");
    const fn = teile.pop();
    const app = teile[0];
    const modul = teile.slice(1).join(".");
    const kandidaten = [datei(app, modul), initDatei(app, modul)].filter((p) => fs.existsSync(p));
    assert.ok(kandidaten.some((p) => hatWhitelistFunktion(fs.readFileSync(p, "utf8"), fn)), `${m} fehlt`);
  }
});

test("Mock-Pfad: jede nachgebildete Dokumentmethode gibt es im Controller (Signaturen wie Backend-Import)", () => {
  const quelle = fs.readFileSync(path.resolve(HIER, "../../src/lib/backoffice/crm/backend.js"), "utf8");
  const block = quelle.slice(quelle.indexOf("const MOCK = {"), quelle.indexOf("/** Alle Dokumentmethoden"));
  let dt = null;
  const paare = [];
  for (const zeile of block.split("\n")) {
    const d = /^ {2}"(PH [^"]+)": \{/.exec(zeile);
    if (d) dt = d[1];
    const m = /^ {4}async ([a-z_]+)\(/.exec(zeile);
    if (m && dt) paare.push([dt, m[1]]);
  }
  assert.ok(paare.length >= 20, `nur ${paare.length} Methoden gefunden`);
  for (const [doctype, methode] of paare) {
    const ordner = doctype.toLowerCase().replace(/\s+/g, "_");
    const py = path.join(BACKEND, "ph_crm", "ph_crm", "ph_crm", "doctype", ordner, `${ordner}.py`);
    assert.ok(hatWhitelistFunktion(fs.readFileSync(py, "utf8"), methode), `${doctype}.${methode} fehlt in ${ordner}.py`);
  }
});

test("Seed: alle Fälle für die CRM-Seiten vorhanden, Beispieldaten ohne echte Adressen", () => {
  const { db } = baueDatenbank(metaIndex());
  const t = (dt) => [...db.get(dt).values()];
  const anfragen = t("PH Anfrage");
  for (const s of ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot", "Gewonnen", "Verloren", "Spam"]) assert.ok(anfragen.some((a) => a.status === s), `Anfrage ${s}`);
  assert.ok(anfragen.some((a) => a.duplikat_von), "Duplikat");
  const termine = t("PH Termin");
  assert.ok(termine.some((x) => x.status === "Abgelehnt" && /E-Mail nicht bestätigt/.test(x.storno_grund)), "verfallen");
  assert.ok(termine.some((x) => x.status === "Storniert" && x.anfrage), "Termin entfallen");
  assert.ok(termine.some((x) => x.status === "Unbestaetigt" && x.email_verifiziert), "zu bestätigen");
  const kontakte = t("PH Kontakt");
  assert.ok(kontakte.some((k) => Number(k.nicht_kontaktieren)), "Widerspruch");
  assert.ok(kontakte.some((k) => k.anonymisiert_am), "anonymisiert");
  assert.ok(kontakte.some((k) => k.firma_kontakt), "Firma mit Personen");
  assert.ok(kontakte.every((k) => !k.email || /\.invalid$/.test(k.email)), "nur Beispieladressen");
  assert.ok(t("PH Beratungsgespraech").some((g) => (g.raeume || []).length > 0));
  assert.ok(t("PH Beratungsgespraech").some((g) => (g.raeume || []).length === 0), "leeres Protokoll");
  assert.ok(t("PH Verfuegbarkeit").length > 0);
  assert.equal(db.crmSeedVersion, 2);
});
