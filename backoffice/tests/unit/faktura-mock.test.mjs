// Unit-Tests Bereich Faktura (B-FAK): Mock-Bestand (jeder Status, jeder Leer-/Fehlerfall), Mock-Pfad der
// Dokumentmethoden (Stellen vergibt die Nummer erst beim Stellen, Zahlung, Bank, Kostenzuordnung, Export),
// Commit-Register und Fähigkeiten.
import { test } from "node:test";
import assert from "node:assert/strict";

import { metaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import { STATUS_WERTE } from "../../src/lib/backoffice/faktura/status.js";
import { methode, neuerBeleg } from "../../src/lib/backoffice/faktura/methoden.js";
import { stelleMockBestandSicher } from "../../src/lib/backoffice/faktura/mock-bestand.js";
import { pruefeAktionen, AKTIONEN } from "../../src/lib/backoffice/commit/aktionen/index.js";
import { FAKTURA, SCHALTER, schalterAn } from "../../src/lib/backoffice/faktura/faehigkeiten.js";
import fakturaBereich from "../../src/lib/backoffice/bereiche/faktura.js";
import kuerzel from "../../src/lib/backoffice/kuerzel/faktura.js";
import routen from "../../tools/qa/routen/faktura.mjs";
import aufgaben from "../../src/lib/backoffice/aufgaben/faktura.js";
import slots from "../../src/lib/backoffice/akte/slots/faktura.js";
import { pruefeSlots } from "../../src/lib/backoffice/akte/slots.js";

const index = metaIndex();
const frisch = () => ({ ...baueDatenbank(index), kommentare: new Map(), versionen: new Map(), dateien: new Map() });
const leitung = { user: "faktura@demo.local", name: "Jonas Muster", roles: ["PH Faktura Leitung", "PH Faktura Mitarbeiter"] };

test("Mock-Bestand: jeder Status je Belegart ist vorhanden, Nummern fest, keine echten Personen", () => {
  const { db } = baueDatenbank(index);
  const pflicht = {
    "PH Rechnung": ["Entwurf", "Gestellt", "Teilbezahlt", "Bezahlt", "Ueberfaellig", "Gemahnt", "Storniert", "Uneinbringlich"],
    "PH Angebot": STATUS_WERTE["PH Angebot"],
    "PH Auftragsbestaetigung": STATUS_WERTE["PH Auftragsbestaetigung"],
    "PH Gutschrift": STATUS_WERTE["PH Gutschrift"],
    "PH Mahnung": ["Entwurf", "Gesendet", "Erledigt"],
    "PH Eingangsrechnung": STATUS_WERTE["PH Eingangsrechnung"],
    "PH Bankumsatz": STATUS_WERTE["PH Bankumsatz"],
    "PH Export Lauf": ["Entwurf", "Bestaetigt"],
    "PH UVA Auswertung": ["Berechnet", "Uebergeben"],
  };
  for (const [dt, werte] of Object.entries(pflicht)) {
    const da = new Set([...db.get(dt).values()].map((d) => d.status));
    for (const w of werte) assert.ok(da.has(w), `${dt}: Status ${w} fehlt im Bestand`);
  }
  const re = db.get("PH Rechnung");
  assert.ok(re.has("RE-2026-00042") && re.get("RE-2026-00042").offen_cent === 624000);
  const arten = new Set([...re.values()].map((r) => r.art));
  for (const a of ["Rechnung", "Anzahlungsrechnung", "Teilrechnung", "Schlussrechnung", "Barverkauf"]) assert.ok(arten.has(a), a);
  const modi = new Set([...db.get("PH Eingangsrechnung").values()].map((e) => e.zuordnung_modus));
  for (const m of ["Ganz einem Projekt", "Nach Positionen", "Aliquot", "Gemeinkosten", ""]) assert.ok(modi.has(m), `Kostenzuordnung ${m || "ohne"}`);
  const sicher = new Set([...db.get("PH Bankumsatz").values()].map((b) => b.vorschlag_sicherheit));
  for (const s of [100, 80, 60, 40, 0]) assert.ok(sicher.has(s), `Sicherheit ${s}`);
  assert.ok([...db.get("PH Rechnung").values()].some((r) => r.land === "CH" && r.montage_im_ausland), "CH-Montage");
  assert.ok([...db.get("PH Rechnung").values()].some((r) => !r.email && r.docstatus === 1), "ohne E-Mail");
  assert.ok([...db.get("PH Auftragsbestaetigung").values()].some((a) => a.kassa_datenfehler), "Kassa-Datenfehler");
  for (const t of ["PH Rechnung", "PH Angebot", "PH Eingangsrechnung"]) for (const d of db.get(t).values()) assert.ok(!d.email || /beispiel\.invalid$/.test(d.email), `${d.name} E-Mail`);
});

test("Mock: Stellen vergibt die Nummer erst beim Stellen, Zahlung macht bezahlt, Anzahlung zählt im Auftrag", async () => {
  const db = frisch();
  const c = new MockClient(leitung, { index, db });
  const r = await methode(c, "PH Rechnung", "ENTW-2026-00007", "stellen", {});
  assert.match(r.nummer, /^RE-2026-\d{5}$/);
  assert.ok(Number(r.nummer.slice(-5)) > 54, "hinter dem Bestand");
  const neu = await c.getDoc("PH Rechnung", r.nummer);
  assert.equal(neu.docstatus, 1);
  assert.equal(neu.status, "Gestellt");
  await assert.rejects(c.getDoc("PH Rechnung", "ENTW-2026-00007"), (e) => e.code === "not_found");
  await assert.rejects(methode(c, "PH Rechnung", r.nummer, "stellen", {}), (e) => e.code === "conflict", "zweites Stellen");
  const z = await methode(c, "PH Rechnung", "RE-2026-00042", "zahlung_erfassen", { betrag_cent: 624000, kanal: "Ueberweisung" });
  assert.equal(z.status, "Bezahlt");
  assert.equal(z.vollstaendig, true);
  const ab = await c.getDoc("PH Auftragsbestaetigung", "AB-2026-00017");
  assert.equal(ab.anzahlung_ist_cent, 374400 + 624000);
});

test("Mock: Bank zuordnen bucht genau einmal, zweites Zuordnen meldet conflict (F-33)", async () => {
  const db = frisch();
  const c = new MockClient(leitung, { index, db });
  await methode(c, "PH Bankumsatz", "BU-2026-001201", "zuordnen", { beleg_doctype: "PH Rechnung", beleg: "RE-2026-00042" });
  assert.equal((await c.getDoc("PH Bankumsatz", "BU-2026-001201")).status, "Zugeordnet");
  assert.equal((await c.getDoc("PH Rechnung", "RE-2026-00042")).offen_cent, 0);
  await assert.rejects(methode(c, "PH Bankumsatz", "BU-2026-001201", "zuordnen", { beleg_doctype: "PH Rechnung", beleg: "RE-2026-00042" }), (e) => e.code === "conflict");
});

test("Mock: Freigabe erst mit vollständiger Kostenzuordnung, Umbuchen protokolliert alt → neu", async () => {
  const db = frisch();
  const c = new MockClient(leitung, { index, db });
  await assert.rejects(methode(c, "PH Eingangsrechnung", "ER-2026-00026", "freigeben", {}), (e) => e.code === "invalid");
  await methode(c, "PH Eingangsrechnung", "ER-2026-00021", "freigeben", {});
  assert.equal((await c.getDoc("PH Eingangsrechnung", "ER-2026-00021")).status, "Freigegeben");
  await methode(c, "PH Eingangsrechnung", "ER-2026-00023", "zuordnung_umbuchen", { modus: "Aliquot", zeilen: [{ projekt: "PH-PRJ-2026-0001", kostenart: "Ware", prozent: 50 }, { projekt: "PH-PRJ-2026-0002", kostenart: "Ware", prozent: 50 }], grund: "Ware für zwei Projekte" });
  const er = await c.getDoc("PH Eingangsrechnung", "ER-2026-00023");
  assert.equal(er.zuordnung_modus, "Aliquot");
  assert.equal(er.zuordnung.reduce((s, z) => s + z.betrag_cent, 0), er.netto_cent);
  const info = await c.docinfo("PH Eingangsrechnung", "ER-2026-00023");
  assert.ok(info.comments.some((k) => /umgebucht.*Grund: Ware für zwei Projekte/.test(k.content)));
});

test("Mock: Gutschrift-Sperre bei abgezogener Anzahlungsrechnung (B-05, F-27), Storno setzt Rechnung storniert", async () => {
  const db = frisch();
  const c = new MockClient(leitung, { index, db });
  await assert.rejects(methode(c, "PH Rechnung", "RE-2026-00031", "gutschrift_erstellen", { art: "Storno" }), (e) => e.code === "conflict" && /Schlussrechnung RE-2026-00035/.test(e.message));
  const g = await methode(c, "PH Rechnung", "RE-2026-00044", "gutschrift_erstellen", { art: "Storno", grund: "Test" });
  const s = await methode(c, "PH Gutschrift", g.gutschrift, "stellen", {});
  assert.match(s.nummer, /^GU-2026-/);
  assert.equal((await c.getDoc("PH Rechnung", "RE-2026-00044")).status, "Storniert");
});

test("Mock: Angebot → Auftrag mit Anzahlungsrechnung (Entwurf), Export sperrt Belege, Verwerfen gibt frei", async () => {
  const db = frisch();
  const c = new MockClient(leitung, { index, db });
  const an = await c.getDoc("PH Angebot", "AN-2026-00088");
  const r = await methode(c, "PH Angebot", "AN-2026-00088", "auftrag_erstellen", { zahlungsplan: [{ art: "Anzahlung", prozent: 40, betrag_cent: Math.round(an.brutto_cent * 0.4), faellig_bei: "Auftrag" }, { art: "Schlusszahlung", prozent: 60, betrag_cent: an.brutto_cent - Math.round(an.brutto_cent * 0.4), faellig_bei: "Lieferung" }] });
  assert.match(r.auftrag, /^AB-2026-\d{5}$/);
  assert.match(r.anzahlungsrechnung, /^ENTW-2026-/);
  const ar = await c.getDoc("PH Rechnung", r.anzahlungsrechnung);
  assert.equal(ar.brutto_cent, Math.round(an.brutto_cent * 0.4));
  const ex = await neuerBeleg(c, "PH Export Lauf", { titel: "Test", status: "Entwurf", zeitraum_von: "2026-11-01", zeitraum_bis: "2026-11-30", format: "BMD CSV", belege: [] });
  await methode(c, "PH Export Lauf", ex.name, "erzeugen", {});
  const lauf = await c.getDoc("PH Export Lauf", ex.name);
  assert.ok(lauf.anzahl > 0);
  assert.equal((await c.getDoc("PH Rechnung", lauf.belege[0].beleg)).export_status, "exportiert");
  await methode(c, "PH Export Lauf", ex.name, "verwerfen", {});
  assert.equal((await c.getDoc("PH Rechnung", lauf.belege[0].beleg)).export_status, "offen");
});

test("Mock-Bestand nachspielen: alter Prozess-Bestand bekommt die Faktura-Tabellen einmal", () => {
  const db = frisch();
  db.db.get("PH Rechnung").clear();
  const c = new MockClient(leitung, { index, db });
  assert.equal(stelleMockBestandSicher(c), true);
  assert.ok(db.db.get("PH Rechnung").has("RE-2026-00042"));
  assert.equal(stelleMockBestandSicher(c), false);
});

test("Register: Commit-Aktionen, Fähigkeiten, Bereich, Kürzel, QA-Routen, Zu tun, Slots", () => {
  assert.deepEqual(pruefeAktionen(), []);
  for (const a of ["faktura.bank-zuordnen", "faktura.er-freigeben", "faktura.angebot-ablehnen", "faktura.mahnung-erledigt", "faktura.mahnsperre", "faktura.zahllauf"]) assert.ok(AKTIONEN.has(a), a);
  assert.ok(Object.keys(FAKTURA).every((id) => /^faktura\.[a-z0-9-]+$/.test(id)));
  assert.equal(SCHALTER.stripeLink, "faktura.stripe-link");
  assert.equal(schalterAn({ "faktura.stripe-link": { an: true } }).stripeLink, true);
  assert.equal(fakturaBereich.navigation[0].href, "/faktura");
  assert.equal(fakturaBereich.routen["PH Rechnung"]("RE-2026-00042"), "/faktura/rechnungen/RE-2026-00042");
  assert.ok(kuerzel.every((k) => /^shift\+[a-z]$/.test(k.taste)), "nur Umschalt+Buchstabe (Q-F5)");
  assert.ok(routen.every((r) => r.pfad.startsWith("/faktura")));
  assert.ok(aufgaben.every((q) => q.id.startsWith("faktura.") && typeof q.zaehle === "function"));
  assert.deepEqual(pruefeSlots(slots), []);
});
