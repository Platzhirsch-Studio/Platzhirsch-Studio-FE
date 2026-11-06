// Bereich Projekte – Register-Teildateien und Mock-Seed (Team B-PRJ): Navigation/Routen, Zu-tun-Quellen,
// Kürzel, Fähigkeiten, Seed deckt jeden Status und die Leer-/Fehlerfälle ab, Workflows im Mock benutzbar.
//   node --test tests/unit/projekte-register.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { BEREICHE, kanonischeRoute, pruefeBereiche, umleitungFuerD } from "../../src/lib/backoffice/bereiche/index.js";
import { pruefeQuelle, zaehleQuelle } from "../../src/lib/backoffice/aufgaben/index.js";
import ZUTUN from "../../src/lib/backoffice/aufgaben/projekte.js";
import KUERZEL_PRJ from "../../src/lib/backoffice/kuerzel/projekte.js";
import ROUTEN_PRJ from "../../tools/qa/routen/projekte.mjs";
import { PROJEKTE, AUTOMATIONEN } from "../../src/lib/backoffice/projekte/faehigkeiten.js";
import { faehigkeit } from "../../src/lib/backoffice/faehigkeiten.js";
import { ladeMetaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import { kalkulationAusMappe } from "../../src/lib/backoffice/projekte/mappe.js";
import { verwirftFremdeKontakte } from "../../src/lib/backoffice/projekte/bezug.js";
import { rueckmeldungen } from "../../src/lib/backoffice/projekte/zaehler.js";

const index = ladeMetaIndex();
const frisch = () => ({ ...baueDatenbank(index), kommentare: new Map(), versionen: new Map(), dateien: new Map() });
const LEITUNG = { user: "projekte@demo.local", name: "Paul Schema", roles: ["PH Projekte Leitung", "PH Projekte Mitarbeiter"] };

test("Bereich: Navigation (Pills § 3.1), kanonische Routen, 307 von /d/, keine Befunde", () => {
  const b = BEREICHE.find((x) => x.slug === "projekte");
  assert.deepEqual(b.navigation.slice(0, 6).map((n) => n.titel), ["Übersicht", "Projekte", "Rückmeldungen", "Montagen", "Aufgaben", "Mängel"]);
  assert.ok(b.navigation.find((n) => n.titel === "Einstellungen").recht === "cancel");
  assert.equal(kanonischeRoute("PH Projekt", "PH-PRJ-2026-0001"), "/projekte/PH-PRJ-2026-0001");
  assert.equal(kanonischeRoute("PH Montageauftrag"), "/projekte/montagen");
  assert.equal(kanonischeRoute("PH Planung", "PH-PLN-2026-0001"), "/projekte/objekt/planung/PH-PLN-2026-0001");
  assert.equal(umleitungFuerD({ doctype: "PH Projekt", name: "PH-PRJ-2026-0001" }), "/projekte/PH-PRJ-2026-0001");
  assert.equal(umleitungFuerD({ doctype: "PH Projekt", name: "neu" }), null);
  assert.deepEqual(pruefeBereiche().filter((x) => /projekte/i.test(x)), []);
});

test("Zu tun: Quellen gültig, zählen echte Daten im Mock", async () => {
  const ids = new Set();
  for (const q of ZUTUN) assert.deepEqual(pruefeQuelle(q, ids), [], q.id);
  const db = frisch();
  const client = new MockClient(LEITUNG, { index, db });
  const r = await zaehleQuelle(ZUTUN.find((q) => q.id === "projekte.rueckmeldungen"), { session: LEITUNG, client });
  assert.equal(r.status, "ok");
  assert.ok(r.n >= 5, `Rückmeldungen im Seed: ${r.n}`);
});

test("Kürzel: Präfix projekte., nur Umschalt+Buchstabe im Backoffice, Mail nur als Dialog", () => {
  for (const k of KUERZEL_PRJ) {
    assert.ok(k.id.startsWith("projekte."), k.id);
    assert.match(k.taste, /^shift\+[a-z]$/);
    if (k.aussenwirkung) assert.equal(k.nurDialog, true);
  }
});

test("QA-Routen: Pfade unter /projekte bzw. /montage, Ränge eindeutig", () => {
  const raenge = new Set();
  for (const r of ROUTEN_PRJ) {
    if (r.pfad) assert.match(r.pfad, /^\/(projekte|montage)/);
    else assert.ok(r.ersterDatensatz);
    assert.ok(!raenge.has(r.rang));
    raenge.add(r.rang);
  }
});

test("Fähigkeiten: Kalkulation über Backend-Probe an, Summen/Dezimal ohne Backend aus (nicht erwartet), Automationen 12", async () => {
  assert.equal(Object.keys(PROJEKTE).length, 12);
  const env = { BACKOFFICE_MODE: "mock" };
  const kalk = await faehigkeit(LEITUNG, "projekte.kalkulation", { katalog: PROJEKTE, modus: "mock", env, ueberschreibung: "" });
  assert.equal(kalk.an, true, "projekt_kalkulation_v2 ist in Backend-Import whitelisted");
  const ma = await faehigkeit({ user: "x", roles: ["PH Projekte Mitarbeiter"] }, "projekte.kalkulation", { katalog: PROJEKTE, modus: "mock", env, ueberschreibung: "" });
  assert.equal(ma.an, false, "Mitarbeiter ohne Leitungsrecht");
  const dez = await faehigkeit(LEITUNG, "projekte.mengen_dezimal", { katalog: PROJEKTE, modus: "mock", env, ueberschreibung: "" });
  assert.equal(dez.an, false);
  assert.equal(dez.erwartet, false);
  assert.equal(AUTOMATIONEN.length, 12);
});

test("Seed: jeder Projektstatus, jeder Montage-/Abnahme-/Planungs-/Rendering-/Nachtragsstatus, Leer- und Fehlerfälle", async () => {
  const db = frisch();
  const c = new MockClient(LEITUNG, { index, db });
  const projekte = await c.getList("PH Projekt", { fields: ["name", "status", "workflow_state", "objekt_land"], limit: 100 });
  for (const s of ["Anfrage", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen", "Abgebrochen"]) assert.ok(projekte.some((p) => p.status === s), `Projekt ${s}`);
  assert.ok(projekte.some((p) => p.objekt_land === "Schweiz"), "Montage im Ausland");
  const st = async (dt) => new Set((await c.getList(dt, { fields: ["status"], limit: 200 })).map((x) => x.status));
  for (const s of ["Geplant", "Unterwegs", "In Arbeit", "Erledigt", "Abgenommen", "Abgebrochen"]) assert.ok((await st("PH Montageauftrag")).has(s), `Montage ${s}`);
  for (const s of ["Mit Maengeln", "Abgeschlossen"]) assert.ok((await st("PH Abnahme")).has(s));
  for (const s of ["Entwurf", "Kunde vorgelegt", "Freigegeben", "Verworfen"]) assert.ok((await st("PH Planung")).has(s), `Planung ${s}`);
  for (const s of ["Entwurf", "Vorgelegt", "Feedback offen", "Freigegeben"]) assert.ok((await st("PH Rendering")).has(s), `Rendering ${s}`);
  for (const s of ["Entwurf", "Vorgelegt", "Freigegeben", "Abgelehnt"]) assert.ok((await st("PH Nachtrag")).has(s), `Nachtrag ${s}`);
  for (const s of ["Offen", "Angefragt", "Geplant", "In Arbeit", "Erledigt"]) assert.ok((await st("PH Fremdgewerk")).has(s), `Fremdgewerk ${s}`);
  // Leerfälle: Projekt ohne Bild/Termin (Anfrage), Projekt ohne Planung
  const leer = projekte.find((p) => p.status === "Anfrage");
  assert.equal(await c.count("PH Planung", { filters: [["projekt", "=", leer.name]] }), 0);
  assert.equal(await c.count("PH Tagebuch Foto", { filters: [["projekt", "=", leer.name]] }), 0);
  // Workflow benutzbar: Zustand „PH Phase …“ → Übergänge vorhanden
  const lief = projekte.find((p) => p.status === "Lieferung");
  assert.equal(lief.workflow_state, "PH Phase Lieferung");
  assert.ok((await c.getTransitions("PH Projekt", lief.name)).some((t) => t.action === "Montieren"));
});

test("Seed: Rückmeldungen gemischt (Pin, Sprachnotiz, Nachricht, Nachtrag, Planung) und Kostenarten für die Nachkalkulation", async () => {
  const db = frisch();
  const c = new MockClient(LEITUNG, { index, db });
  const fb = await c.getList("PH Rendering Feedback", { fields: ["art", "von", "status"], limit: 100 });
  assert.ok(fb.some((f) => f.art === "annotation" && f.von === "kunde" && f.status === "Offen"));
  assert.ok(fb.some((f) => f.art === "sprachnachricht"));
  assert.ok(fb.some((f) => f.art === "vote"));
  assert.equal(await c.count("PH Kostenart"), 11);
  const p = await c.getDoc("PH Projekt", "PH-PRJ-2026-0002");
  const einst = await c.getDoc("PH Projekte Einstellungen", "PH Projekte Einstellungen");
  const k = kalkulationAusMappe({ projekt: p, positionen: p.positionen, budget: p.kalk_budget, montagen: [], gewerke: [], zeiten: [], nachtraege: [] }, { einstellungen: einst, kostenarten: await c.getList("PH Kostenart", { fields: ["name", "db_stufe", "reihenfolge", "bezeichnung"], limit: 20 }), stichtag: "2026-11-04" });
  assert.ok(k.kopf.erloes_cent > 0 && k.kopf.kosten_ist_cent > 0);
});

test("QA 41: Fremdbelege eines Projekts enthalten keinen Datensatz mit fremdem Kontakt (Seed mit fremden Rechnungen)", async () => {
  const db = frisch();
  const c = new MockClient({ user: "admin@demo.local", roles: ["System Manager"] }, { index, db });
  const p = await c.getDoc("PH Projekt", "PH-PRJ-2026-0001");
  const fremd = (await c.getList("PH Rechnung", { fields: ["name", "kontakt"], limit: 5 })).map((r) => ({ ...r, projekt: p.name }));
  const r = verwirftFremdeKontakte(fremd, { kontakt: p.kontakt, leitung: true });
  assert.ok(r.zeilen.every((z) => !z.kontakt || z.kontakt === p.kontakt));
});

test("QA 23: Zu-tun-Zahl „Rückmeldungen“ = Formel der Inbox (§ 3.6) auf dem Seed", async () => {
  const db = frisch();
  const client = new MockClient(LEITUNG, { index, db });
  const z = await zaehleQuelle(ZUTUN.find((q) => q.id === "projekte.rueckmeldungen"), { session: LEITUNG, client });
  const alle = (dt, f) => client.getList(dt, { fields: ["*"], filters: f, limit: 500 });
  const inbox = rueckmeldungen({
    feedback: await alle("PH Rendering Feedback", [["status", "=", "Offen"]]),
    nachrichten: await alle("PH Projekt Nachricht", [["status", "=", "Ungelesen"]]),
    nachtraege: await alle("PH Nachtrag", [["status", "in", ["Freigegeben", "Abgelehnt"]]]),
    planungen: await alle("PH Planung", [["status", "=", "Kunde vorgelegt"]]),
  }, { heute: "2026-11-04" });
  assert.equal(z.n, inbox.length);
});
