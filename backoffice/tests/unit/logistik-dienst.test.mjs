// Unit-Tests Bereich Logistik: Mock-Pfad der Dienst-Schicht (jede Mutation hat einen Mock-Pfad, MASTER § 5.3),
// Seed-Abdeckung aller Status und Register-Teildateien.  node --test tests/unit/logistik-dienst.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { ladeMetaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import * as D from "../../src/lib/backoffice/logistik/dienst.js";
import { packtischStart, lieferscheinAkte, inventurAkte, plantafel, bericht, kennzahlen } from "../../src/lib/backoffice/logistik/daten.js";
import { mockStandSichern } from "../../src/lib/backoffice/logistik/client.js";
import aufgaben from "../../src/lib/backoffice/aufgaben/logistik.js";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";
import freigaben from "../../src/lib/backoffice/freigaben/logistik.js";
import { pruefeFreigaben } from "../../src/lib/backoffice/freigaben/index.js";
import slots from "../../src/lib/backoffice/akte/slots/logistik.js";
import { pruefeSlots } from "../../src/lib/backoffice/akte/slots.js";
import commit from "../../src/lib/backoffice/commit/aktionen/logistik.js";
import { LOGISTIK } from "../../src/lib/backoffice/logistik/faehigkeiten.js";

const index = ladeMetaIndex();
const ADMIN = { user: "admin@demo.local", name: "Admin", roles: ["PH Backoffice-Admin", "System Manager"] };
function neu() {
  const basis = baueDatenbank(index);
  const db = { ...basis, kommentare: new Map(), versionen: new Map(), dateien: new Map(), protokoll: [] };
  return new MockClient(ADMIN, { index, db, jetzt: () => new Date("2026-11-04T10:00:00") });
}
const ls = (c, kunde) => [...c.tabelle("PH Lieferschein").values()].find((l) => l.kunde_name === kunde);

test("Seed: jeder Status je DocType, Stammdaten, Stand-Marke", () => {
  const c = neu();
  const status = (dt) => new Set([...c.tabelle(dt).values()].map((d) => d.status));
  for (const s of ["Entwurf", "Gepackt", "Uebergeben", "Zugestellt", "Storniert"]) assert.ok(status("PH Lieferschein").has(s), s);
  for (const s of ["Angelegt", "Etikett", "Unterwegs", "Zugestellt", "Problem", "Storniert"]) assert.ok(status("PH Sendung").has(s), s);
  for (const s of ["Geplant", "Freigegeben", "Unterwegs", "Abgeschlossen", "Abgebrochen"]) assert.ok(status("PH Tour").has(s), s);
  for (const s of ["Verfuegbar", "Reserviert", "Kommission", "Gesperrt", "Verkauft", "Ausgeschieden"]) assert.ok(status("PH Lagerbestand").has(s), s);
  for (const s of ["Geplant", "Laufend", "Abgeschlossen", "Verworfen"]) assert.ok(status("PH Inventur").has(s), s);
  assert.ok(c.tabelle("PH Lagerort").has("Lager Lochau"));
  assert.equal(mockStandSichern(c), false, "frischer Seed braucht keine Ergänzung");
});

test("Packtisch-Ablauf im Mock: Vorgang scannen, Scan mit Menge, Hand, Gepackt bucht Verkauf", async () => {
  const c = neu();
  const huber = ls(c, "Familie Huber");
  assert.equal((await D.vorgangScannen(c, { code: huber.name })).lieferschein, huber.name);
  assert.equal((await D.vorgangScannen(c, { code: "K7M2QX" })).art, "abholcode");
  const r1 = await D.scanMenge(c, { lieferschein: huber.name, code: "9008564001019", anzahl: 2 });
  assert.equal(r1.ergebnis, "bestaetigen");
  const r2 = await D.scanMenge(c, { lieferschein: huber.name, code: "9008564001019", anzahl: 2, bestaetigt: true });
  assert.equal(r2.ergebnis, "erkannt");
  assert.equal((await D.scanMenge(c, { lieferschein: huber.name, code: "0000" })).ergebnis, "unbekannt");
  const stone = c.tabelle("PH Lieferschein").get(huber.name).positionen[1];
  await D.handBestaetigen(c, { lieferschein: huber.name, position: stone.name });
  await D.entnahmeSetzen(c, { lieferschein: huber.name, position: stone.name, lagerbestand: [...c.tabelle("PH Lagerbestand").values()].find((b) => b.seriennummer === "SN-0441").name });
  const r = await D.alsGepackt(c, { lieferschein: huber.name });
  assert.equal(r.status, "Gepackt");
  assert.ok([...c.tabelle("PH Lagerbewegung").values()].some((b) => b.bezug === huber.name && b.art === "Verkauf"));
  assert.equal((await D.alsGepackt(c, { lieferschein: huber.name })).wiederholt, true, "genau einmal");
});

test("Abholung ohne E-Mail: Gepackt legt Aufgabe „Kunde anrufen“ an; falscher Abholcode wird abgelehnt", async () => {
  const c = neu();
  const kurz = ls(c, "Peter Kurz");
  await assert.rejects(D.alsZugestellt(c, { lieferschein: kurz.name, empfaengerName: "P. Kurz", abholcode: "FALSCH" }), /Abholcode stimmt nicht/);
  await D.alsZugestellt(c, { lieferschein: kurz.name, empfaengerName: "P. Kurz", abholcode: "P4T9HW" });
  assert.equal(c.tabelle("PH Lieferschein").get(kurz.name).status, "Zugestellt");
  const reiter = ls(c, "Johanna Reiter");
  const z = c.tabelle("PH Lieferschein").get(reiter.name);
  z.lieferart = "Abholung";
  z.kunde_email = "";
  for (const p of z.positionen) p.menge_gepackt = p.menge;
  const r = await D.alsGepackt(c, { lieferschein: reiter.name });
  assert.ok(r.aufgabe, "Aufgabe angelegt");
});

test("Etikett und Verpacken: Muster-Tarife, keine Doppelbuchung, Gewicht Pflicht", async () => {
  const c = neu();
  const reiter = ls(c, "Johanna Reiter");
  const t = await D.tarife(c, { lieferschein: reiter.name });
  assert.equal(t.tarife.find((x) => x.empfohlen).id, "muster-dpd-classic");
  await assert.rejects(D.verpacken(c, { lieferschein: reiter.name, tarifId: "muster-dpd-classic" }), /nicht_alles_gepackt/);
  for (const p of c.tabelle("PH Lieferschein").get(reiter.name).positionen) p.menge_gepackt = p.menge;
  const v = await D.verpacken(c, { lieferschein: reiter.name, tarifId: "muster-dpd-classic" });
  assert.equal(v.status, "Gepackt");
  assert.equal(v.sendung.carrier, "DPD");
  await assert.rejects(D.etikettErzeugen(c, { lieferschein: reiter.name, tarifId: "muster-dpd-classic" }), /bereits eine aktive Sendung/);
  await assert.rejects(D.tarife(c, { lieferschein: ls(c, "Yacht Aurelia").name }), /Schweiz/);
});

test("Storno: entfernt Tour-Stopp, Belegsperre ab Übergeben", async () => {
  const c = neu();
  const b = ls(c, "Familie Brändle");
  const tourName = b.tour;
  await D.stornieren(c, { lieferschein: b.name, grund: "Kunde verschiebt" });
  const tour = c.tabelle("PH Tour").get(tourName);
  assert.ok(!(tour.stopps || []).some((s) => s.lieferschein === b.name));
  await assert.rejects(D.stornieren(c, { lieferschein: ls(c, "Anna Gruber").name, grund: "egal" }), /Beleg/);
});

test("Tour: zuordnen, Reihenfolge, Freigeben (einmal), Starten nur freigegeben, Abschließen nur ohne offene Stopps", async () => {
  const c = neu();
  const alp = ls(c, "Hotel Alpenrose");
  const tour = [...c.tabelle("PH Tour").values()].find((t) => t.status === "Geplant" && t.fahrer);
  await D.stoppsHinzufuegen(c, { tour: tour.name, lieferscheine: [alp.name] });
  assert.equal(c.tabelle("PH Lieferschein").get(alp.name).tour, tour.name);
  const namen = c.tabelle("PH Tour").get(tour.name).stopps.map((s) => s.name);
  await D.reihenfolge(c, { tour: tour.name, reihenfolge: [...namen].reverse() });
  assert.equal(c.tabelle("PH Tour").get(tour.name).stopps[0].name, namen.at(-1));
  await D.stoppEntfernen(c, { tour: tour.name, stopp: alp.name });
  assert.equal(c.tabelle("PH Lieferschein").get(alp.name).tour, "");
  await assert.rejects(D.tourMethode(c, { name: tour.name, methode: "starten" }), /freigegebenen/);
  await D.tourMethode(c, { name: tour.name, methode: "freigeben" });
  assert.equal((await D.tourMethode(c, { name: tour.name, methode: "freigeben" })).wiederholt, true);
  await D.tourMethode(c, { name: tour.name, methode: "starten", args: { km_start: 48300 } });
  await assert.rejects(D.tourMethode(c, { name: tour.name, methode: "abschliessen" }), /offen/);
});

test("Bestand: Teil-Umlagern teilt die Zeile, Ausbuchen nur ≤ verfügbar, Sperren/Entsperren", async () => {
  const c = neu();
  const glas = [...c.tabelle("PH Lagerbestand").values()].find((b) => b.platz === "R-12");
  const r = await D.bestandMethode(c, { name: glas.name, methode: "umlagern", args: { lagerort_nach: "Lager Lochau", platz_nach: "R-11", menge: 4 } });
  assert.equal(r.umgelagert, 4);
  assert.equal(c.tabelle("PH Lagerbestand").get(glas.name).menge, 20);
  await assert.rejects(D.bestandMethode(c, { name: glas.name, methode: "ausbuchen", args: { menge: 99, grund: "Schwund" } }), /verfügbar/);
  await D.bestandMethode(c, { name: glas.name, methode: "sperren", args: { grund: "Prüfung" } });
  assert.equal(c.tabelle("PH Lagerbestand").get(glas.name).status, "Gesperrt");
  await D.bestandMethode(c, { name: glas.name, methode: "entsperren" });
  assert.equal(c.tabelle("PH Lagerbestand").get(glas.name).status, "Verfuegbar");
});

test("Inventur: Anlegen erzeugt Zählliste, Zählen, Freigabe bucht Differenzen, Showroom gesperrt durch Bewegung", async () => {
  const c = neu();
  const inv = await D.inventurAnlegen(c, { lagerort: "Außenlager Hard", datum: "2026-11-04" });
  const doc = c.tabelle("PH Inventur").get(inv.name);
  assert.ok(doc.positionen.length > 0);
  await D.inventurMethode(c, { name: inv.name, methode: "starten" });
  const p = doc.positionen[0];
  await D.inventurMethode(c, { name: inv.name, methode: "zaehlen", args: { lagerbestand: p.lagerbestand, ist: Number(p.soll) - 1 } });
  const akte = await inventurAkte(c, inv.name, { session: { user: "chef@x" }, leitung: true });
  assert.equal(akte.freigabe.darf, false, "Differenz ohne Grund");
  await D.inventurGrund(c, { name: inv.name, lagerbestand: p.lagerbestand, grund: "Schwund" });
  const ok = await inventurAkte(c, inv.name, { session: { user: "chef@x" }, leitung: true });
  assert.equal(ok.freigabe.darf, true);
  const r = await D.inventurMethode(c, { name: inv.name, methode: "freigeben" });
  assert.equal(r.bewegungen, 1);
  const showroom = [...c.tabelle("PH Inventur").values()].find((i) => i.lagerort === "Showroom Lochau" && i.status === "Laufend");
  const s = await inventurAkte(c, showroom.name, { session: { user: "chef@x" }, leitung: true });
  assert.ok(s.freigabe.gruende.some((g) => g.code === "bewegungen"));
});

test("Bewertung, Spedition, Rücknahme, Sendung im Mock", async () => {
  const c = neu();
  const ib = await D.bewertungAnlegen(c, { stichtag: "2026-11-04" });
  assert.ok(c.tabelle("PH Inventurbewertung").get(ib.name).wert_cent > 0);
  await D.bewertungMethode(c, { name: ib.name, methode: "festschreiben" });
  await assert.rejects(D.bewertungMethode(c, { name: ib.name, methode: "berechnen" }), /unveränderlich/);
  const spa = [...c.tabelle("PH Speditionsauftrag").values()].find((s) => s.status === "Entwurf");
  await assert.rejects(D.speditionMethode(c, { name: spa.name, methode: "per_email_senden" }), /E-Mail/);
  const wr = [...c.tabelle("PH Warenruecknahme").values()].find((w) => w.status === "Angenommen");
  await D.ruecknahmeMethode(c, { name: wr.name, methode: "pruefung_buchen", args: { positionen: [{ zustand: "Neuwertig", entscheidung: "Wiedereinlagern", platz: "R-06" }] } });
  assert.equal(c.tabelle("PH Warenruecknahme").get(wr.name).status, "Geprueft");
  const unterwegs = [...c.tabelle("PH Sendung").values()].find((s) => s.status === "Unterwegs" && s.richtung === "Ausgang");
  await assert.rejects(D.sendungMethode(c, { name: unterwegs.name, methode: "stornieren" }), /telefonisch/);
});

test("Daten: Packtisch-Start, Akte mit Bändern, Plantafel, Kennzahlen, Berichte", async () => {
  const c = neu();
  const start = await packtischStart(c);
  assert.ok(start.packen.some((k) => k.typ === "lieferschein" && k.heute));
  assert.ok(start.abholung.length >= 2);
  const alp = await lieferscheinAkte(c, ls(c, "Hotel Alpenrose").name, { leitung: true });
  assert.ok(alp.baender.some((b) => b.id === "anzahlung" || b.id === "bestand"));
  const boesch = await lieferscheinAkte(c, ls(c, "Sarah Bösch").name, { leitung: true });
  assert.ok(boesch.baender.some((b) => b.id === "ab"), "E7: Liefermenge nicht gemeldet");
  const tafel = await plantafel(c, { ansicht: "woche", datum: "2026-11-04" });
  assert.ok(tafel.ablage.ohneTour.length >= 1);
  assert.ok(tafel.ablage.zurueck.length >= 1);
  const k = await kennzahlen(c);
  assert.ok(k.zuPacken >= 1);
  const b = await bericht(c, "PH Touren Auslastung");
  assert.ok(!b.columns.some((s) => /fahrer|person/i.test(s.fieldname)), "keine Personenspalte");
});

test("Register-Teildateien: Zu tun, Freigaben, Slots, Commit-Aktionen, Fähigkeiten", async () => {
  assert.deepEqual(pruefeQuellen({ logistik: aufgaben }), []);
  assert.deepEqual(pruefeFreigaben({ logistik: freigaben }), []);
  assert.deepEqual(pruefeSlots(slots), []);
  assert.deepEqual(Object.keys(commit).sort(), ["logistik.gepackt", "logistik.tour-freigeben", "logistik.uebergeben"]);
  assert.ok(LOGISTIK["logistik.teilzustellung"]);
  const c = neu();
  for (const q of aufgaben) assert.equal(typeof (await q.zaehle({ session: ADMIN, client: c })), "number", q.id);
});
