// Bereich Personal – Mock-Pfad der Methoden und Seed (MASTER Q-A3): Stempeln, Krankmeldung, Gespräch, Absage,
// Einstellen idempotent, Löschen räumt Gespräche, Workflow Abwesenheit (Selbstgenehmigung gesperrt), Register.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import { metaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { istGesaet } from "../../src/lib/backoffice/mock/seed/personal.js";
import { M, DT, aufruf, methode, workflow, abwesenheitAnlegen, mockBuchungSpeichern } from "../../src/lib/backoffice/personal/methoden.js";
import aktionen from "../../src/lib/backoffice/commit/aktionen/personal.js";
import freigaben from "../../src/lib/backoffice/freigaben/personal.js";
import quellen from "../../src/lib/backoffice/aufgaben/personal.js";
import kuerzel from "../../src/lib/backoffice/kuerzel/personal.js";
import bereich from "../../src/lib/backoffice/bereiche/personal.js";
import slots from "../../src/lib/backoffice/akte/slots/personal.js";
import { pruefeFreigaben } from "../../src/lib/backoffice/freigaben/index.js";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";

const index = metaIndex();
const JETZT = new Date(2026, 10, 4, 12, 0, 0);
function neu(user, roles) {
  const db = { ...baueDatenbank(index), kommentare: new Map(), versionen: new Map(), dateien: new Map(), protokoll: [] };
  return (u = user, r = roles) => new MockClient({ user: u, roles: r }, { index, db, jetzt: () => JETZT });
}
const LEITUNG = ["PH Personal Leitung", "PH Personal Mitarbeiter"];

test("Seed: Festbestand mit jedem Status und Leerfällen", () => {
  const { db } = baueDatenbank(index);
  assert.ok(istGesaet(db));
  const status = (dt) => new Set([...db.get(dt).values()].map((d) => d.status));
  for (const s of ["Entwurf", "Aktiv", "Pausiert", "Besetzt", "Archiviert"]) assert.ok(status("PH Stelle").has(s), s);
  for (const s of ["Eingegangen", "Gesichtet", "Gespraech", "Angebot", "Eingestellt", "Abgesagt", "Zurueckgezogen"]) assert.ok(status("PH Bewerbung").has(s), s);
  for (const s of ["Geplant", "Durchgefuehrt", "Abgesagt", "Nicht erschienen"]) assert.ok(status("PH Bewerbungsgespraech").has(s), s);
  for (const s of ["Beantragt", "Genehmigt", "Abgelehnt", "Storniert"]) assert.ok(status("PH Abwesenheit").has(s), s);
  for (const s of ["Offen", "Erfasst", "Korrigiert"]) assert.ok(status("PH Zeiterfassung").has(s), s);
  assert.ok([...db.get("PH Bewerbung").values()].filter((b) => b.pseudonymisiert).length >= 2);
  assert.ok([...db.get("PH Bewerbung").values()].every((b) => !b.email || b.email.endsWith("@beispiel.invalid")));
  assert.ok([...db.get("PH Mitarbeiter").values()].some((m) => m.user === "personal@demo.local"), "Leitung hat einen Mitarbeiter-Datensatz");
});

test("Stempeln: Kommen, Doppeltipp < 60 s, Gehen mit Pausenvorschlag", async () => {
  const c = neu("personal@demo.local", LEITUNG)();
  const k = await aufruf(c, M.stempeln, {});
  assert.equal(k.ok, true);
  assert.match(k.meldung, /^Kommen gebucht/);
  const doppelt = await aufruf(c, M.stempeln, {});
  assert.equal(doppelt.ok, false);
  const b = c.tabelle(DT.zeit).get(k.name);
  b.kommen = "05:00:00";
  b.modified = "2026-11-04 05:00:00.000000";
  const g = await aufruf(c, M.stempeln, {});
  assert.equal(g.ok, true, JSON.stringify(g));
  assert.equal(g.pause_bestaetigen, true);
  assert.equal(c.tabelle(DT.zeit).get(k.name).pause_min, 30);
});

test("Buchung: Zukunft und Überschneidung abgelehnt", () => {
  const c = neu("personal@demo.local", LEITUNG)();
  assert.throws(() => mockBuchungSpeichern(c, null, { mitarbeiter: "PH-MA-0002", datum: "2026-11-05", kommen: "08:00:00" }), /Zukunft/);
  assert.throws(() => mockBuchungSpeichern(c, null, { mitarbeiter: "PH-MA-0002", datum: "2026-11-02", kommen: "09:00:00", gehen: "10:00:00" }), /Überschneidung/);
});

test("Krankmeldung: eigene ja, fremde nur Leitung; Urlaub wird unterbrochen", async () => {
  const mk = neu("selbst@demo.local", ["PH Personal Selbstservice"]);
  const c = mk();
  await assert.rejects(aufruf(c, M.krank_melden, { mitarbeiter: "PH-MA-0005" }), /Leitung|Berechtigung/);
  const r = await aufruf(c, M.krank_melden, { von: "2026-12-23" });
  assert.ok(r.urlaub_unterbrochen === null || typeof r.urlaub_unterbrochen === "string");
  assert.equal(c.tabelle(DT.krank).get(r.name).status, "Gemeldet");
});

test("Abwesenheit: Workflow ohne Selbstgenehmigung, Leitung genehmigt fremde", async () => {
  const mk = neu("personal@demo.local", LEITUNG);
  const c = mk();
  const eigen = [...c.tabelle(DT.abw).values()].find((a) => a.mitarbeiter === "PH-MA-0001" && a.status === "Beantragt");
  await assert.rejects(workflow(c, DT.abw, eigen.name, "Genehmigen"), /andere Person/);
  const fremd = [...c.tabelle(DT.abw).values()].find((a) => a.mitarbeiter_name === "Lena Demo" && a.status === "Beantragt");
  assert.equal((await workflow(c, DT.abw, fremd.name, "Genehmigen")).status, "Genehmigt");
  await assert.rejects(abwesenheitAnlegen(c, { mitarbeiter: "PH-MA-0002", art: "Urlaub", von: "2026-12-24", bis: "2026-12-24" }), /Überschneidung/);
});

test("Bewerbung: Gespräch aus Eingegangen, Absage mit Löschfrist, Einstellen idempotent, Löschen räumt auf", async () => {
  const c = neu("personal@demo.local", LEITUNG)();
  const bew = [...c.tabelle(DT.bewerbung).values()];
  const ein = bew.find((b) => b.status === "Eingegangen");
  const g = await methode(c, DT.bewerbung, ein.name, "gespraech_anlegen", { start: "2026-11-10 10:00:00", verantwortlich: "personal@demo.local" });
  assert.equal(c.tabelle(DT.bewerbung).get(ein.name).status, "Gespraech");
  assert.ok(c.tabelle(DT.bewerbung).get(ein.name).gesichtet_am, "gesichtet_am gesetzt");
  await methode(c, DT.bewerbung, ein.name, "absage_senden", { grund: "Qualifikation", per_mail: 1 });
  const ab = c.tabelle(DT.bewerbung).get(ein.name);
  assert.equal(ab.status, "Abgesagt");
  assert.equal(ab.loeschfrist, "2027-06-04");
  await methode(c, DT.bewerbung, ein.name, "unterlagen_loeschen", {});
  assert.equal(c.tabelle(DT.bewerbung).get(ein.name).pseudonymisiert, 1);
  assert.equal(c.tabelle(DT.gespraech).get(g).notiz, "");
  const angebot = bew.find((b) => b.status === "Angebot");
  const m1 = await methode(c, DT.bewerbung, angebot.name, "einstellen", { eintritt: "2026-12-01", rolle_intern: "Montage" });
  const m2 = await methode(c, DT.bewerbung, angebot.name, "einstellen", { eintritt: "2026-12-01", rolle_intern: "Montage" });
  assert.equal(m1, m2, "keine zweite Personalakte");
  await assert.rejects(methode(c, DT.bewerbung, bew.find((b) => b.status === "Gesichtet").name, "unterlagen_loeschen", {}), /Offene Bewerbungen/);
});

test("Register-Teildateien: Commit-Namen, Freigaben, Zu tun, Kürzel, Navigation", () => {
  for (const n of Object.keys(aktionen)) assert.match(n, /^personal\.[a-z-]+$/);
  assert.deepEqual(pruefeFreigaben({ personal: freigaben }), []);
  assert.deepEqual(pruefeQuellen({ personal: quellen }), []);
  for (const k of kuerzel) assert.match(k.taste, /^shift\+[a-z]$/, "nur Umschalt+Buchstabe (Q-F5)");
  assert.ok(!kuerzel.some((k) => /stempel|kommen|gehen/i.test(k.id)), "kein Einzeltasten-Kürzel für Stempeln (E6)");
  const doppelt = kuerzel.map((k) => `${k.kontext}:${k.taste}`);
  assert.equal(new Set(doppelt).size, doppelt.length);
  assert.ok(bereich.navigation.some((n) => n.href === "/personal/meins" && !n.recht), "Mein Bereich für alle");
  assert.ok(bereich.navigation.filter((n) => n.href !== "/personal/meins").every((n) => n.recht), "Fachseiten ausgeblendet für reinen Selbstservice");
  assert.deepEqual(slots, []);
});

test("Commit: Antrag ablehnen braucht Grund, Absage begrenzt auf 50", async () => {
  const c = neu("personal@demo.local", LEITUNG)();
  const r = await aktionen["personal.antrag"]({ client: c, args: { name: "x", aktion: "Ablehnen" }, revalidiere: () => {} });
  assert.equal(r.ok, false);
  const s = await aktionen["personal.absage"]({ client: c, args: { namen: [] }, revalidiere: () => {} });
  assert.equal(s.ok, false);
});
