// Mock-Client: Filter-Operatoren, Sortierung, Paging, Nummernkreise, Workflow,
// Rechte, Konflikte. Liest die echten DocType-JSONs aus ../Backend-Import.
//   node --test tests/unit/backoffice-mock-client.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { ladeMetaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed.js";
import { namingSeries, namingFormat, neuerName, normalisiereFilter, parseOrderBy, passtFilter, werteBedingungAus } from "../../src/lib/backoffice/mock/engine.js";

const index = ladeMetaIndex();
const frisch = () => ({ ...baueDatenbank(index), kommentare: new Map(), versionen: new Map(), dateien: new Map() });
const gf = (db) => new MockClient({ user: "gf@demo.local", roles: ["PH Geschäftsführung"] }, { index, db });
const crm = (db) => new MockClient({ user: "crm@demo.local", roles: ["PH CRM Mitarbeiter"] }, { index, db });
const crmL = (db) => new MockClient({ user: "crm-leitung@demo.local", roles: ["PH CRM Leitung"] }, { index, db });

test("Filter-Operatoren wie Frappe", () => {
  const d = { status: "Neu", betrag_cent: 1500, name: "PH-ANF-2026-00001", eingang: "2026-11-02 10:00:00", leer: "" };
  assert.ok(passtFilter(d, ["status", "=", "Neu"]));
  assert.ok(passtFilter(d, ["status", "!=", "Spam"]));
  assert.ok(passtFilter(d, ["name", "like", "%ANF%"]));
  assert.ok(!passtFilter(d, ["name", "not like", "%ANF%"]));
  assert.ok(passtFilter(d, ["status", "in", ["Neu", "Qualifiziert"]]));
  assert.ok(passtFilter(d, ["status", "not in", "Spam,Verloren"]));
  assert.ok(passtFilter(d, ["betrag_cent", ">=", 1500]) && !passtFilter(d, ["betrag_cent", ">", 1500]));
  assert.ok(passtFilter(d, ["betrag_cent", "<=", "1500"]) && passtFilter(d, ["betrag_cent", "<", 2000]));
  assert.ok(passtFilter(d, ["eingang", "between", ["2026-11-01", "2026-11-02"]]), "between schließt den Endtag ein");
  assert.ok(!passtFilter(d, ["eingang", "between", ["2026-11-03", "2026-11-04"]]));
  assert.ok(passtFilter(d, ["leer", "is", "not set"]) && passtFilter(d, ["status", "is", "set"]));
  assert.deepEqual(normalisiereFilter({ status: "Neu", betrag_cent: [">", 10] }), [["status", "=", "Neu"], ["betrag_cent", ">", 10]]);
  assert.deepEqual(normalisiereFilter([["PH Anfrage", "status", "=", "Neu"]]), [["status", "=", "Neu"]]);
  assert.deepEqual(parseOrderBy("`tabPH Anfrage`.eingang desc, name"), [{ feld: "eingang", richtung: -1 }, { feld: "name", richtung: 1 }]);
});

test("Nummernkreise: naming_series, format:, field:, hash", () => {
  const z = new Map();
  const zaehler = (p) => {
    z.set(p, (z.get(p) || 0) + 1);
    return z.get(p);
  };
  const d = new Date(2026, 10, 4);
  assert.equal(namingSeries("PH-ANF-.YYYY.-.#####", zaehler, d), "PH-ANF-2026-00001");
  assert.equal(namingSeries("PH-ANF-.YYYY.-.#####", zaehler, d), "PH-ANF-2026-00002");
  assert.equal(namingSeries("PH-S-.YY.MM.DD.-.#####", zaehler, d), "PH-S-261104-00001");
  assert.equal(namingSeries("PH-KON-.#####", zaehler, d), "PH-KON-00001");
  assert.equal(namingFormat("format:ENTW-{YYYY}-{#####}", {}, zaehler, d), "ENTW-2026-00001");
  const metaField = { autoname: "field:slug", fields: [] };
  assert.equal(neuerName(metaField, { slug: "sofa-240" }, zaehler), "sofa-240");
  assert.match(neuerName({ autoname: "hash", fields: [] }, {}, zaehler), /^[a-z0-9]{10}$/);
});

test("Workflow-Bedingungen (Python-Ausdrücke über doc)", () => {
  assert.equal(werteBedingungAus("doc.email or doc.telefon", { email: "", telefon: "+43" }), true);
  assert.equal(werteBedingungAus("doc.email or doc.telefon", { email: "", telefon: "" }), false);
  assert.equal(werteBedingungAus("doc.start and doc.terminart", { start: "2026-11-04 10:00:00", terminart: "" }), false);
  assert.equal(werteBedingungAus("doc.brutto_cent > 0", { brutto_cent: 100 }), true);
  assert.equal(werteBedingungAus("doc.status == 'Offen'", { status: "Offen" }), true);
  assert.equal(werteBedingungAus("not doc.gesperrt", { gesperrt: 0 }), true);
  assert.equal(werteBedingungAus("doc.art in ('A', 'B')", { art: "B" }), true);
  assert.equal(werteBedingungAus("", {}), true);
  assert.throws(() => werteBedingungAus("frappe.db.get_value('x')", {}));
});

test("Meta-Index liest die echten JSONs: DocTypes, Workflows, Kanban, Zusatz-Metas", () => {
  assert.ok(index.dateien > 150, `nur ${index.dateien} DocType-Dateien gefunden`);
  const anf = index.doctypes.get("PH Anfrage");
  assert.equal(anf.module, "PH CRM");
  assert.equal(anf.bereich, "crm");
  assert.equal(anf.slug, "ph-anfrage");
  assert.ok(anf.fields.some((f) => f.fieldname === "anliegen" && f.reqd));
  assert.deepEqual(anf.statusOptionen, ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot", "Gewonnen", "Verloren", "Spam"]);
  assert.equal(anf.states.find((s) => s.title === "Gewonnen").ton, "gruen");
  const wf = index.workflows.get("PH Anfrage");
  assert.ok(wf && wf.transitions.some((t) => t.action === "Qualifizieren"));
  assert.ok(index.doctypes.get("User").quelle === "synthetisch");
  assert.ok(index.doctypes.get("PH Kundenkarte Antrag"));
  assert.equal(index.slugs.get("ph-kontakt"), "PH Kontakt");
});

test("getList: Filter, Sortierung, Paging, Feldauswahl; count", async () => {
  const db = frisch();
  const c = gf(db);
  const alle = await c.count("PH Anfrage");
  assert.ok(alle >= 20);
  const neu = await c.getList("PH Anfrage", { fields: ["name", "status", "eingang"], filters: { status: "Neu" }, orderBy: "eingang desc", limit: 5 });
  assert.ok(neu.length > 0 && neu.length <= 5);
  assert.ok(neu.every((d) => d.status === "Neu"));
  assert.ok(neu.every((d) => Object.keys(d).length === 3));
  for (let i = 1; i < neu.length; i++) assert.ok(neu[i - 1].eingang >= neu[i].eingang, "absteigend");
  const s1 = await c.getList("PH Anfrage", { fields: ["name"], orderBy: "name asc", limit: 3, start: 0 });
  const s2 = await c.getList("PH Anfrage", { fields: ["name"], orderBy: "name asc", limit: 3, start: 3 });
  assert.equal(s1.length, 3);
  assert.notEqual(s1[0].name, s2[0].name);
  const like = await c.getList("PH Kontakt", { fields: ["name", "titel"], orFilters: [["titel", "like", "%Muster%"], ["name", "like", "%Muster%"]], limit: 50 });
  assert.ok(like.length > 0 && like.every((d) => /Muster/.test(d.titel)));
});

test("insert → Nummernkreis, Pflichtfelder, Workflow-Startzustand; save mit Konfliktprüfung", async () => {
  const db = frisch();
  const c = crm(db);
  await assert.rejects(c.insert("PH Anfrage", { art: "Beratung" }), (e) => e.code === "invalid" && /Pflichtfelder/.test(e.message));
  const doc = await c.insert("PH Anfrage", { art: "Beratung", nachname: "Testner", anliegen: "Bitte Beratung.", eingang: "2026-11-04 10:00:00", email: "t@beispiel.invalid" });
  assert.match(doc.name, /^PH-ANF-2026-\d{5}$/);
  assert.equal(doc.status, "Neu");
  assert.equal(doc.workflow_state, "PH Neu");
  assert.equal(doc.owner, "crm@demo.local");
  const g = await c.save("PH Anfrage", { name: doc.name, naechster_schritt: "Rückruf" }, { modified: doc.modified });
  assert.equal(g.naechster_schritt, "Rückruf");
  await assert.rejects(c.save("PH Anfrage", { name: doc.name, naechster_schritt: "x" }, { modified: doc.modified }), (e) => e.code === "conflict");
  // Status nur über Workflow
  const h = await c.save("PH Anfrage", { name: doc.name, status: "Gewonnen" }, { modified: g.modified });
  assert.equal(h.status, "Neu");
});

test("Workflow: erlaubte Übergänge je Rolle und Bedingung, Rückwärts nur Leitung", async () => {
  const db = frisch();
  const m = crm(db);
  const doc = await m.insert("PH Anfrage", { art: "Kontakt", nachname: "Probe", anliegen: "Hallo", eingang: "2026-11-04 10:00:00" });
  // Bedingung "doc.email or doc.telefon" nicht erfüllt → Qualifizieren fehlt
  let t = await m.getTransitions("PH Anfrage", doc.name);
  assert.deepEqual(t.map((x) => x.action), ["Als Spam markieren"]);
  await assert.rejects(m.workflowAction("PH Anfrage", doc.name, "Qualifizieren"), (e) => e.code === "invalid");
  await m.save("PH Anfrage", { name: doc.name, email: "p@beispiel.invalid" });
  t = await m.getTransitions("PH Anfrage", doc.name);
  assert.ok(t.some((x) => x.action === "Qualifizieren"));
  const q = await m.workflowAction("PH Anfrage", doc.name, "Qualifizieren");
  assert.equal(q.status, "Qualifiziert");
  const v = await m.workflowAction("PH Anfrage", doc.name, "Verloren");
  assert.equal(v.status, "Verloren");
  await assert.rejects(m.workflowAction("PH Anfrage", doc.name, "Zurück auf Neu"), (e) => e.code === "forbidden");
  const z = await crmL(db).workflowAction("PH Anfrage", doc.name, "Zurück auf Neu");
  assert.equal(z.status, "Neu");
  const info = await m.docinfo("PH Anfrage", doc.name);
  assert.ok(info.comments.some((k) => /Workflow: Qualifizieren/.test(k.content)));
  assert.ok(info.versions.length >= 2);
});

test("Rechte im Client: GF liest, schreibt nicht; Shop sieht CRM nicht; submit/cancel", async () => {
  const db = frisch();
  await assert.rejects(gf(db).insert("PH Anfrage", { art: "Kontakt", nachname: "x", anliegen: "y", eingang: "2026-11-04 10:00:00" }), (e) => e.code === "forbidden");
  await assert.rejects(new MockClient({ user: "shop@demo.local", roles: ["PH Shop Mitarbeiter"] }, { index, db }).getList("PH Anfrage"), (e) => e.code === "forbidden");
  const f = new MockClient({ user: "faktura@demo.local", roles: ["PH Faktura Leitung"] }, { index, db });
  const [r] = await f.getList("PH Rechnung", { fields: ["name", "docstatus"], filters: { docstatus: 0 }, limit: 1 });
  assert.ok(r, "ein Entwurf vorhanden");
  const s = await f.submit("PH Rechnung", r.name);
  assert.equal(s.docstatus, 1);
  await assert.rejects(f.save("PH Rechnung", { name: r.name, kunde_name: "neu" }), (e) => e.code === "conflict");
  const st = await f.cancel("PH Rechnung", r.name);
  assert.equal(st.docstatus, 2);
});

test("Kanban, searchLink, setValue ohne Workflow, Einzeldokument", async () => {
  const db = frisch();
  const c = gf(db);
  const board = await c.getKanban("PH Aufgabe", { fields: ["name", "titel", "status"] });
  assert.deepEqual(board.map((s) => s.status), ["Offen", "In Arbeit", "Erledigt", "Verworfen"]);
  const karte = board.find((s) => s.karten.length)?.karten[0];
  const nach = await c.setValue("PH Aufgabe", karte.name, "status", "Erledigt");
  assert.equal(nach.status, "Erledigt");
  await assert.rejects(crmL(db).setValue("PH Anfrage", (await c.getList("PH Anfrage", { filters: { status: "Neu" }, limit: 1 }))[0].name, "status", "Spam"), (e) => e.code === "invalid", "Status nur über Workflow");
  const treffer = await c.searchLink("PH Kontakt", "mu", 5);
  assert.ok(treffer.length > 0 && treffer.length <= 5 && treffer[0].value);
  const e = await c.getDoc("PH Einstellungen", "PH Einstellungen");
  assert.equal(e.name, "PH Einstellungen");
});

test("Beispieldaten: alle Hauptobjekte vorhanden, keine echten Personen", async () => {
  const db = frisch();
  const c = new MockClient({ user: "admin@demo.local", roles: ["System Manager"] }, { index, db });
  for (const dt of ["PH Anfrage", "PH Kontakt", "PH Termin", "PH Produkt", "PH Projekt", "PH Bestellung", "PH Zahlung", "PH Rechnung", "PH Lieferschein", "PH Bewerbung", "PH Newsletter Ausgabe", "PH Kassenbeleg", "PH Servicefall", "PH Kundenkarte Antrag", "PH Aufgabe", "PH API Protokoll", "User"]) {
    const n = await c.count(dt);
    assert.ok(n >= 5, `${dt}: ${n} Datensätze`);
  }
  const kontakte = await c.getList("PH Kontakt", { fields: ["nachname", "email"], limit: 100 });
  assert.ok(kontakte.every((k) => /Muster|Beispiel|Probe|Testner|Demo|Vorlage|Platzhalter|Schema|Mustermann|Musterfrau/.test(k.nachname)));
  assert.ok(kontakte.every((k) => !k.email || /beispiel\.invalid$/.test(k.email)));
});
