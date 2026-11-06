// Bereich Service (B-SER): Mock-Pfad der ph_service-Methoden auf einer frischen Mock-Datenbank – ein Fall vom
// Melden bis zum Schließen, Einsatz, Bestellung, Regress, Pflege; Seed-Bestand; Register-Teildateien.
//   node --test tests/unit/service-mock.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { MockClient, mockDatenbank } from "../../src/lib/backoffice/mock/client.js";
import { metaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { SEED_VERSION } from "../../src/lib/backoffice/mock/seed/service.js";
import { mockAkte, mockMethode, mockNaechsteSchritte, mockSlots, freieFenster, sichereServiceSeed } from "../../src/lib/backoffice/service/mock.js";
import freigaben from "../../src/lib/backoffice/freigaben/service.js";
import quellen from "../../src/lib/backoffice/aufgaben/service.js";
import { pruefeFreigaben } from "../../src/lib/backoffice/freigaben/index.js";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";
import commitAktionen from "../../src/lib/backoffice/service/commit-aktionen.js";
import bereich from "../../src/lib/backoffice/bereiche/service.js";

const index = metaIndex();
const ADMIN = { user: "admin@demo.local", name: "Erika Beispiel", roles: ["System Manager"] };
const MA = { user: "service@demo.local", name: "Simon Demo", roles: ["PH Service Mitarbeiter"] };
const frisch = (session = ADMIN) => {
  const roh = baueDatenbank(index);
  const db = { ...roh, kommentare: new Map(), versionen: new Map(), dateien: new Map(), protokoll: [] };
  return new MockClient(session, { index, db, jetzt: () => new Date(2026, 10, 4, 10, 0, 0) });
};
const fall = (c, i) => [...c.tabelle("PH Servicefall").values()][i];

test("Seed: 14 Fälle über alle Status, Katalog mit -99, Techniker, Einsätze, Regresse, Verträge", () => {
  const c = frisch();
  const f = [...c.tabelle("PH Servicefall").values()];
  assert.equal(f.length, 14);
  for (const s of ["Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant", "Erledigt", "Geschlossen", "Abgelehnt"]) assert.ok(f.some((x) => x.status === s), s);
  assert.ok(f.every((x) => x.workflow_state === `PH ${x.status}`));
  assert.ok(f.every((x) => /beispiel\.invalid$/.test(x.kunde_email) || !x.kunde_email));
  assert.ok(f.some((x) => x.kulanz_freigabe_status === "Angefordert") && f.some((x) => x.kulanz_freigabe_status === "Abgelehnt"));
  assert.ok(f.some((x) => !x.kunde_email) && f.some((x) => x.quelle === "website") && f.some((x) => x.projekt) && f.some((x) => x.kundentyp === "Unternehmer"));
  assert.ok(c.tabelle("PH Fehlercode").has("POL-99") && c.tabelle("PH Fehlercode").size === 69);
  assert.equal([...c.tabelle("User").values()].filter((u) => u.roles.some((r) => r.role === "PH Techniker")).length, 3);
  assert.equal(c.tabelle("PH Serviceeinsatz").size, 9);
  assert.equal(c.tabelle("PH Lieferantenregress").size, 3);
  assert.equal(c.tabelle("PH Pflege Abo").size, 3);
  assert.equal(c.db.db.__serviceSeed, SEED_VERSION);
  assert.equal(sichereServiceSeed(c), false, "frischer Seed wird nicht erneut angelegt");
});

test("Mock: Fall von „Gemeldet“ bis „Geschlossen“ mit den App-Methoden", async () => {
  const c = frisch();
  const f = fall(c, 0); // Gemeldet, ohne Erstreaktion, mit E-Mail
  await mockMethode(c, "PH Servicefall", f.name, "kunde_informieren", { vorlage: "eingang" });
  let x = c.tabelle("PH Servicefall").get(f.name);
  assert.ok(x.erstreaktion_am && x.kunde_informiert_am && x.erstreaktion_kanal === "E-Mail");
  await c.setValue("PH Servicefall", f.name, { mangel_bestaetigt: "Ja", entscheidung: "Verbesserung", entscheidung_begruendung: "Nachnähen." });
  await c.workflowAction("PH Servicefall", f.name, "Prüfung abschließen");
  await c.workflowAction("PH Servicefall", f.name, "Entscheidung treffen");
  await c.workflowAction("PH Servicefall", f.name, "In Bearbeitung nehmen");
  assert.equal(mockNaechsteSchritte(c, [f.name])[f.name].aktion, "erledigt_melden", "Besichtigung läuft bereits (Seed)");
  const e = await mockMethode(c, "PH Servicefall", f.name, "einsatz_anlegen", { datum: "2026-11-09", zeit_von: "08:00", zeit_bis: "10:00", techniker: "techniker@demo.local" });
  assert.equal(c.tabelle("PH Servicefall").get(f.name).status, "Einsatz geplant");
  for (const alt of [...c.tabelle("PH Serviceeinsatz").values()].filter((x) => x.servicefall === f.name && x.name !== e)) await mockMethode(c, "PH Serviceeinsatz", alt.name, "abbrechen", { grund: "Test" });
  await mockMethode(c, "PH Serviceeinsatz", e, "starten");
  await mockMethode(c, "PH Serviceeinsatz", e, "abschliessen", { ergebnis: "Behoben", unterschrift_art: "Name bestätigt", pause_min: 0 });
  assert.equal(c.tabelle("PH Serviceeinsatz").get(e).status, "Erledigt");
  assert.equal(c.tabelle("PH Servicefall").get(f.name).status, "In Bearbeitung", "Fall zurück nach Einsatzende");
  await mockMethode(c, "PH Servicefall", f.name, "erledigt_melden", { abschlussbericht: "Naht nachgenäht." });
  x = c.tabelle("PH Servicefall").get(f.name);
  assert.equal(x.status, "Erledigt");
  assert.ok(x.erledigt_am && x.regress_frist_bis);
  await c.workflowAction("PH Servicefall", f.name, "Schließen");
  assert.equal(c.tabelle("PH Servicefall").get(f.name).status, "Geschlossen");
});

test("Mock: Kulanz-Freigabe nur Leitung, Betragskonflikt, Ablehnen mit Grund", async () => {
  const ma = frisch(MA);
  const f = [...ma.tabelle("PH Servicefall").values()].find((x) => x.kulanz_freigabe_status === "Angefordert");
  await assert.rejects(() => mockMethode(ma, "PH Servicefall", f.name, "kulanz_freigeben", {}), /Leitung/);
  const c = new MockClient(ADMIN, { index, db: ma.db, jetzt: ma.jetzt });
  await assert.rejects(() => mockMethode(c, "PH Servicefall", f.name, "kulanz_freigeben", { betrag_cent: 1 }), /geändert/);
  await mockMethode(c, "PH Servicefall", f.name, "kulanz_freigeben", { betrag_cent: f.kulanz_cent });
  assert.equal(c.tabelle("PH Servicefall").get(f.name).kulanz_freigabe_status, "Freigegeben");
  const offen = await freigaben[0].laden(ADMIN, c);
  assert.ok(!offen.some((o) => o.name === f.name));
});

test("Mock: Ersatzteile bestellen → Wareneingang setzt Fall-Zeilen auf Eingetroffen; Bewegung nie negativ", async () => {
  const c = frisch();
  const f = [...c.tabelle("PH Servicefall").values()].find((x) => (x.ersatzteile || []).some((z) => z.status === "Benoetigt"));
  const b = await mockMethode(c, "PH Servicefall", f.name, "ersatzteile_bestellen", {});
  assert.equal(c.tabelle("PH Servicefall").get(f.name).ersatzteile[0].status, "Bestellt");
  await mockMethode(c, "PH Ersatzteilbestellung", b, "senden", { empfaenger: "a@b.invalid" });
  await mockMethode(c, "PH Ersatzteilbestellung", b, "bestaetigen", { erwartet_am: "2026-11-10" });
  await mockMethode(c, "PH Ersatzteilbestellung", b, "wareneingang", { alles: 1 });
  assert.equal(c.tabelle("PH Ersatzteilbestellung").get(b).status, "Geliefert");
  assert.equal(c.tabelle("PH Servicefall").get(f.name).ersatzteile[0].status, "Eingetroffen");
  const teil = [...c.tabelle("PH Ersatzteil").values()].find((t) => Number(t.bestand_fuehren) && t.bestand === 0);
  await assert.rejects(() => mockMethode(c, "PH Ersatzteil", teil.name, "bewegung_buchen", { art: "Verbrauch", menge: 1 }), /negativ/);
  await mockMethode(c, "PH Ersatzteil", teil.name, "bewegung_buchen", { art: "Zugang", menge: 3 });
  assert.equal(c.tabelle("PH Ersatzteil").get(teil.name).bestand, 3);
});

test("Mock: Regress – Gutschrift erfassen gleicht ab (Unterdeckung), Ausbuchen nur Leitung", async () => {
  const c = frisch();
  const r = [...c.tabelle("PH Lieferantenregress").values()].find((x) => x.status === "Gemeldet");
  await mockMethode(c, "PH Lieferantenregress", r.name, "gutschrift_erfassen", { betrag_cent: 100000 });
  const n = c.tabelle("PH Lieferantenregress").get(r.name);
  assert.equal(n.betrag_erhalten_cent, 100000);
  assert.equal(n.status, "Anerkannt");
  const ma = new MockClient(MA, { index, db: c.db });
  await assert.rejects(() => mockMethode(ma, "PH Lieferantenregress", r.name, "differenz_ausbuchen", { grund: "Kulanz des Herstellers" }), /Leitung/);
});

test("Mock: Akte in einem Aufruf, Kosten nur mit Recht; Slots mit Puffer", () => {
  const c = frisch();
  const f = [...c.tabelle("PH Servicefall").values()].find((x) => x.kosten_extern_cent);
  const ohne = mockAkte(c, f.name);
  assert.equal(ohne.fall.kosten_extern_cent, undefined);
  assert.equal(mockAkte(c, f.name, { kostenSichtbar: true }).fall.kosten_extern_cent, f.kosten_extern_cent);
  assert.ok(ohne.naechsterSchritt && ohne.fristen && ohne.sla);
  assert.deepEqual(freieFenster([["10:00", "11:00"]], "08:00", "13:00", 60, 30, 30).map((x) => x[0]), ["08:00", "08:30", "11:30", "12:00"]);
  const s = mockSlots(c, { datum: "2026-11-04", dauer_min: 60 });
  assert.equal(Object.keys(s.techniker).length, 3);
});

test("Register: Freigaben, Zu tun, Commit-Aktionen und Bereich gültig", async () => {
  assert.deepEqual(pruefeFreigaben({ service: freigaben }), []);
  assert.deepEqual(pruefeQuellen({ service: quellen }), []);
  assert.deepEqual(Object.keys(commitAktionen), ["service.methode", "service.workflow"]);
  assert.equal(bereich.routen["PH Servicefall"]("PH-SRV-2026-00013"), "/service/faelle/PH-SRV-2026-00013");
  const c = frisch();
  assert.equal(await quellen[0].zaehle({ client: c }), 1, "ein Fall mit überfälliger Reaktion im Seed");
  void mockDatenbank;
});
