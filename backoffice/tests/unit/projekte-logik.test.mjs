// Bereich Projekte – reine Logik (Team B-PRJ): Texte/Glossar, Dauer, Mengen, Mängel, Montage, Zählformeln,
// Empfohlen, Phase (E4), Bezugsfilter (E8/QA 41), Nachkalkulation (Port von utils/kalkulation.py), Mappe, Schnellanlage,
// Regeln (PA8, Referenz, Fremdgewerk), Register-Teildateien.
//   node --test tests/unit/projekte-logik.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { GLOSSAR, PHASEN, TEXTE, fuelle, statusText } from "../../src/lib/backoffice/projekte/texte.js";
import { statusBadge, statusTon, tonKarte } from "../../src/lib/backoffice/projekte/status.js";
import { dauerText, hmm, parseDauer } from "../../src/lib/backoffice/projekte/zeit.js";
import { parseMenge } from "../../src/lib/backoffice/projekte/mengen.js";
import { istErledigt, maengelListe, offeneAbnahmeMaengel, tageUeberfaellig } from "../../src/lib/backoffice/projekte/maengel.js";
import { doppelbuchungen, kapazitaet, kioskZustandsknopf, leistungenAusPositionen, montageZeitraum, stundenVon } from "../../src/lib/backoffice/projekte/montage.js";
import { RUECK_FILTER, istOffeneRueckmeldung, rueckmeldungen, rueckmeldungenZahl } from "../../src/lib/backoffice/projekte/zaehler.js";
import { empfehlungen, primaerEmpfehlung } from "../../src/lib/backoffice/projekte/empfohlen.js";
import { phaseHinweise, phaseSchieben, zuruecksetzenSchritte } from "../../src/lib/backoffice/projekte/phase.js";
import { FREMDBELEGE, bezugStatus, erlaubteFelder, verwirftFremdeKontakte, waehrungen } from "../../src/lib/backoffice/projekte/bezug.js";
import { ampelBudget, ampelDb, erloes, fertigstellungsgrad, kalkulationV2, prognoseZeile, stufen, woche, zeitreihe } from "../../src/lib/backoffice/projekte/kalkulation.js";
import { aktivitaetsStrom, kalkulationAusMappe, miniGantt, naechsterTermin, phasenSchritte, termineListe } from "../../src/lib/backoffice/projekte/mappe.js";
import { schnellanlage } from "../../src/lib/backoffice/projekte/schnell.js";
import { abschlussPruefliste, fremdgewerkErlaubt, gewerkKonflikte, referenzPruefung } from "../../src/lib/backoffice/projekte/regeln.js";
import { datumKurz, euroRund, phasenFortschritt, phasenPunkte, prozentText, terminText } from "../../src/lib/backoffice/projekte/anzeige.js";

const HEUTE = "2026-11-04";

// ------------------------------------------------------------------ Texte --

function alleTexte(o, out = []) {
  if (typeof o === "string") out.push(o);
  else if (typeof o === "function") {
    try {
      const r = o(1, 2, 3);
      if (typeof r === "string") out.push(r);
    } catch {
      /* Funktionen mit Objekt-Argument */
    }
  } else if (o && typeof o === "object") for (const v of Object.values(o)) alleTexte(v, out);
  return out;
}

test("Texte: Glossar § 3.2 – verbotene Wörter fehlen, Umlaute korrekt, keine Superlative/Ausrufezeichen", () => {
  const texte = alleTexte(TEXTE);
  assert.ok(texte.length > 300);
  for (const [verboten] of GLOSSAR) for (const t of texte) assert.ok(!t.includes(verboten), `„${verboten}“ in „${t}“`);
  for (const t of texte) {
    assert.ok(!/Uebergabe|Kueche|Maengel|Aenderung|fuer |ueber |Pruef/.test(t), `ASCII-Umschreibung in „${t}“`);
    assert.ok(!/!(\s|$)/.test(t), `Ausrufezeichen in „${t}“`);
    assert.ok(!/beste[nrms]?|perfekt|optimal|einzigartig|revolution/i.test(t), `Superlativ in „${t}“`);
  }
  assert.equal(statusText("PH Projekt", "Uebergabe"), "Übergabe");
  assert.equal(statusText("PH Rendering", "Feedback offen"), "Rückmeldung offen");
  assert.equal(statusText("PH Planung", "Kunde vorgelegt"), "Vorgelegt");
  assert.equal(statusText("PH Montageauftrag", "Erledigt"), "Fertig");
  assert.equal(statusText("PH Abnahme", "Mit Maengeln"), "Mit Mängeln");
  assert.equal(fuelle("Hallo {a} {b}", { a: "X" }), "Hallo X {b}");
  assert.equal(PHASEN.length, 9);
  assert.equal(PHASEN.at(-1), "Abgeschlossen");
});

test("Status: Ton je DocType, Wort immer dabei, Storno durchgestrichen", () => {
  assert.equal(statusTon("PH Projekt", "Abgebrochen"), "rot");
  assert.equal(statusTon("PH Projekt", "Montage"), "orange");
  assert.equal(statusTon("PH X", "egal"), "grau");
  assert.deepEqual(statusBadge("PH Nachtrag", "Storniert"), { wert: "Storniert", ton: "grau", text: "Storniert", storniert: true });
  assert.equal(tonKarte("PH Montageauftrag").Unterwegs, "tuerkis");
});

test("Dauer: 1:30, 90 min, 1,5 h, Zahl ≤ 12 = Stunden, > 24 h abgelehnt", () => {
  assert.equal(parseDauer("1:30").minuten, 90);
  assert.equal(parseDauer("90 min").minuten, 90);
  assert.equal(parseDauer("1,5 h").minuten, 90);
  assert.equal(parseDauer("2").minuten, 120);
  assert.equal(parseDauer("45").minuten, 45);
  assert.equal(parseDauer("2h 15").minuten, 135);
  assert.deepEqual(parseDauer(""), { ok: false, fehler: "leer" });
  assert.equal(parseDauer("25 h").fehler, "zuviel");
  assert.equal(parseDauer("abc").fehler, "unklar");
  assert.equal(dauerText(90), "1 h 30 min");
  assert.equal(dauerText(120), "2 h");
  assert.equal(hmm(75), "1:15");
});

test("Mengen (E10/Q-D6): 3,6 wird abgelehnt statt gerundet; mit Dezimal-Fähigkeit 2,5 bleibt 2,5", () => {
  const r = parseMenge("3,6");
  assert.equal(r.ok, false);
  assert.match(r.fehler, /Dezimalmengen folgen/);
  assert.deepEqual(parseMenge("3"), { ok: true, wert: 3 });
  assert.deepEqual(parseMenge("2,5", { dezimal: true }), { ok: true, wert: 2.5 });
  assert.equal(parseMenge("0").ok, false);
});

// ------------------------------------------------------------------ Mängel, Montage --

test("Mängel: drei Quellen, „behoben“ klein/groß erledigt, Überfälligkeit, Sortierung", () => {
  assert.ok(istErledigt("behoben") && istErledigt("Behoben") && istErledigt("Erledigt") && !istErledigt("offen"));
  assert.equal(tageUeberfaellig("2026-11-01", HEUTE), 3);
  assert.equal(tageUeberfaellig("2026-11-10", HEUTE), 0);
  const l = maengelListe({
    montagen: [{ name: "M1", projekt: "P", maengel: [{ name: "z1", beschreibung: "Fuge", frist: "2026-11-02", status: "offen" }, { name: "z2", beschreibung: "alt", status: "behoben" }] }],
    abnahmen: [{ name: "A1", projekt: "P", positionen: [{ name: "a1", bezeichnung: "Schrank", zustand: "Mangel", beschreibung: "Kratzer", frist: "2026-11-01", erledigt: 0 }, { name: "a2", bezeichnung: "Tisch", zustand: "ok" }] }],
    gewerke: [{ name: "G1", projekt: "P", maengel: [{ name: "g1", beschreibung: "Kante", status: "offen" }] }],
  }, { heute: HEUTE });
  assert.deepEqual(l.map((x) => x.quelle), ["abnahme", "montage", "fremdgewerk"]);
  assert.equal(l[0].ueberfaellig, 3);
  assert.equal(offeneAbnahmeMaengel({ positionen: [{ zustand: "Mangel" }, { zustand: "Nacharbeit", erledigt: 1 }, { zustand: "ok" }] }), 1);
});

test("Montage: Leistungsregel § 6.2 – nur geliefert/teilgeliefert, Eigenmontage, nie storniert", () => {
  const { montierbar, fehlend } = leistungenAusPositionen([
    { name: "1", bezeichnung: "A", lieferstatus: "geliefert", montage_art: "Eigenmontage" },
    { name: "2", bezeichnung: "B", lieferstatus: "teilgeliefert", montage_art: "" },
    { name: "3", bezeichnung: "C", lieferstatus: "storniert", montage_art: "Eigenmontage" },
    { name: "4", bezeichnung: "D", lieferstatus: "geliefert", montage_art: "Fremdgewerk" },
    { name: "5", bezeichnung: "E", lieferstatus: "bestellt", montage_art: "Eigenmontage", liefertermin: "2026-12-01" },
  ]);
  assert.deepEqual(montierbar.map((x) => x.position), ["1", "2"]);
  assert.deepEqual(fehlend.map((x) => x.bezeichnung), ["E"]);
});

test("Montage: Kapazität = Monteure verfügbar × Tagesstunden (nicht eingeteilte Personen), Doppelbuchung, Zeitraum, Kiosk-Wörter", () => {
  const m = [
    { name: "M1", status: "Geplant", start: "2026-11-04 08:00:00", ende: "2026-11-04 16:00:00", stunden_geplant: 8, montageleiter: "a", team: [{ user: "a" }, { user: "b" }] },
    { name: "M2", status: "Geplant", start: "2026-11-04 10:00:00", ende: "2026-11-04 12:00:00", team: [{ user: "b" }] },
    { name: "M3", status: "Abgebrochen", start: "2026-11-05 08:00:00", stunden_geplant: 8, team: [{ user: "c" }] },
  ];
  const k = kapazitaet(m, ["2026-11-04", "2026-11-05"], { monteure: 2, tagesstunden: 8 });
  assert.deepEqual(k[0], { tag: "2026-11-04", ist: 18, soll: 16, prozent: 113, ueber: true });
  assert.equal(k[1].ist, 0);
  assert.equal(stundenVon(m[1]), 2);
  assert.deepEqual(doppelbuchungen(m).map((d) => d.user), ["b"]);
  assert.deepEqual(montageZeitraum(m), { von: "2026-11-04", bis: "2026-11-04" });
  assert.equal(kioskZustandsknopf("In Arbeit").wort, "Fertig");
  assert.equal(kioskZustandsknopf("Erledigt").wort, "Abnahme mit Kunde");
  assert.equal(kioskZustandsknopf("Abgenommen"), null);
});

// ------------------------------------------------------------------ Zählformeln --

test("Rückmeldungen offen (§ 3.6): eine Formel, Votes und Studio zählen nicht, Nachtragsentscheidung zählt", () => {
  const q = {
    feedback: [
      { name: "f1", projekt: "P1", von: "kunde", art: "annotation", status: "Offen", erstellt_am: "2026-10-30 10:00:00" },
      { name: "f2", projekt: "P1", von: "kunde", art: "vote", status: "Offen" },
      { name: "f3", projekt: "P1", von: "studio", art: "annotation", status: "Offen" },
      { name: "f4", projekt: "P2", von: "kunde", art: "sprachnachricht", status: "Offen", erstellt_am: "2026-11-03 10:00:00" },
    ],
    nachrichten: [{ name: "n1", projekt: "P2", richtung: "eingehend", status: "Ungelesen", gesendet_am: "2026-11-04 09:00:00" }, { name: "n2", projekt: "P2", richtung: "ausgehend", status: "Ungelesen" }],
    nachtraege: [{ name: "t1", projekt: "P1", status: "Freigegeben", uebernommen: 0, entscheidung_am: "2026-10-25 10:00:00" }, { name: "t2", projekt: "P1", status: "Freigegeben", uebernommen: 1, entscheidung_am: "x" }],
    planungen: [{ name: "p1", projekt: "P1", status: "Kunde vorgelegt", kunde_entscheidung: "aenderung" }, { name: "p2", projekt: "P1", status: "Kunde vorgelegt", kunde_entscheidung: "offen" }],
  };
  const z = rueckmeldungenZahl(q, { heute: HEUTE, erinnerungTage: 3 });
  assert.equal(z.offen, 5);
  assert.equal(z.ueberfaellig, 2);
  assert.equal(rueckmeldungen(q, { heute: HEUTE, nurProjekte: new Set(["P2"]) }).length, 2);
  assert.ok(Object.keys(RUECK_FILTER).every((a) => typeof istOffeneRueckmeldung(a, {}) === "boolean"));
});

// ------------------------------------------------------------------ Empfohlen, Phase --

const basis = (status, extra = {}) => ({ projekt: { name: "P1", status, projektart: "Kueche", ...extra.projekt }, positionen: [], planungen: [], renderings: [], montagen: [], abnahmen: [], nachtraege: [], aufmasse: [], termine: [], auftraege: [], angebote: [], rechnungen: [], referenzen: [], ...extra });

test("Empfohlen § 4.3: je Phase die richtige Primäraktion, Leitungsregeln werden für Mitarbeiter Hinweis", () => {
  assert.equal(primaerEmpfehlung(empfehlungen(basis("Anfrage"), { heute: HEUTE })).id, "termin");
  assert.equal(primaerEmpfehlung(empfehlungen(basis("Anfrage", { termine: [{ start: "2026-10-01 10:00:00" }] }), { heute: HEUTE })).aktion.aktion, "Planung starten");
  const plan = empfehlungen(basis("Planung", { planungen: [{ name: "pl", status: "Kunde vorgelegt", kunde_entscheidung: "aenderung", kunde_kommentar: "kürzer" }] }), { heute: HEUTE });
  assert.ok(plan.some((e) => e.id === "neue-version" && /kürzer/.test(e.weil)));
  assert.ok(plan.some((e) => e.id === "aufmass"), "Küche ohne geprüftes Aufmaß");
  const ab = basis("Angebot", { auftraege: [{ name: "AB-1", status: "Offen" }] });
  assert.equal(primaerEmpfehlung(empfehlungen(ab, { heute: HEUTE, leitung: true })).aktion.aktion, "Beauftragen");
  const mitarbeiter = empfehlungen(ab, { heute: HEUTE, leitung: false });
  assert.equal(mitarbeiter[0].aktion, null);
  assert.match(mitarbeiter[0].titel, /wartet auf Beauftragung/);
  const lief = basis("Lieferung", { positionen: [{ lieferstatus: "geliefert", montage_art: "Eigenmontage" }, { lieferstatus: "storniert" }] });
  assert.deepEqual(primaerEmpfehlung(empfehlungen(lief, { heute: HEUTE })).aktion, { art: "sheet", sheet: "montage-planen" });
  const teil = basis("Lieferung", { positionen: [{ lieferstatus: "geliefert" }, { lieferstatus: "bestellt" }] });
  assert.equal(primaerEmpfehlung(empfehlungen(teil, { heute: HEUTE })).id, "teilmontage");
  assert.equal(primaerEmpfehlung(empfehlungen(basis("Montage", { montagen: [{ name: "M1", status: "Erledigt" }] }), { heute: HEUTE })).titel, "Abnahme mit Kunde");
  const ueb = empfehlungen(basis("Uebergabe", { abnahmen: [{ name: "A", status: "Mit Maengeln", maengel_offen: 1 }] }), { heute: HEUTE });
  assert.equal(ueb[0].id, "maengel");
  const nt = empfehlungen(basis("Montage", { nachtraege: [{ name: "N1", status: "Freigegeben", uebernommen: 0 }] }), { heute: HEUTE });
  assert.ok(nt.some((e) => e.id === "ab-N1"));
});

test("Phase E4: operative Fakten schieben (Montieren, Liefern, Übergeben), AB vorhanden nie", () => {
  assert.equal(phaseSchieben(basis("Lieferung", { montagen: [{ name: "M", status: "In Arbeit" }] })).aktion, "Montieren");
  assert.equal(phaseSchieben(basis("Lieferung", { montagen: [{ name: "M", status: "Geplant" }] })), null);
  assert.equal(phaseSchieben(basis("Bestellung", { positionen: [{ lieferstatus: "geliefert" }, { lieferstatus: "storniert" }] })).ziel, "Lieferung");
  assert.equal(phaseSchieben(basis("Montage", { abnahmen: [{ name: "A", status: "Unterzeichnet" }] })).aktion, "Übergeben");
  assert.equal(phaseSchieben(basis("Angebot", { auftraege: [{ name: "AB", status: "Offen" }] })), null);
  assert.equal(phaseHinweise(basis("Angebot", { auftraege: [{ name: "AB", status: "Offen" }] }))[0].id, "ab-vorhanden");
  assert.equal(zuruecksetzenSchritte("Montage", "Bestellung"), 2);
  assert.equal(zuruecksetzenSchritte("Abgeschlossen", "Montage"), 0);
  assert.equal(zuruecksetzenSchritte("Planung", "Montage"), 0);
});

// ------------------------------------------------------------------ Bezug E8 / QA 41 --

test("Bezug (E8, QA 41): fremder Kontakt wird verworfen, Beträge nur Leitung, fehlendes Filterfeld = nicht verknüpft", () => {
  const z = [{ name: "RE-1", kontakt: "K1", brutto_cent: 100 }, { name: "RE-2", kontakt: "K2", brutto_cent: 200 }, { name: "RE-3" }];
  const r = verwirftFremdeKontakte(z, { kontakt: "K1", leitung: false });
  assert.deepEqual(r.zeilen.map((x) => x.name), ["RE-1", "RE-3"]);
  assert.equal(r.verworfen, 1);
  assert.ok(r.zeilen.every((x) => !("brutto_cent" in x)), "keine Beträge für Mitarbeiter");
  assert.equal(verwirftFremdeKontakte(z, { kontakt: "K1", leitung: true }).zeilen[0].brutto_cent, 100);
  assert.equal(bezugStatus(FREMDBELEGE.rechnungen, null), "app-fehlt");
  assert.equal(bezugStatus(FREMDBELEGE.rechnungen, { fields: [{ fieldname: "kontakt" }] }), "nicht-verknuepft");
  assert.equal(bezugStatus(FREMDBELEGE.herstellerbestellungen, { fields: [{ fieldname: "bezug_doctype" }, { fieldname: "bezug_name" }] }), "ok");
  assert.ok(!erlaubteFelder(FREMDBELEGE.rechnungen, { fields: [{ fieldname: "brutto_cent" }, { fieldname: "status" }] }).includes("brutto_cent"));
  assert.deepEqual(waehrungen([{ waehrung: "EUR" }, { waehrung: "CHF" }, {}]), ["EUR", "CHF"]);
  for (const def of Object.values(FREMDBELEGE)) assert.ok(def.filter("P").every((f) => Array.isArray(f) && f.length === 3), "nur explizite Filter");
});

// ------------------------------------------------------------------ Nachkalkulation --

test("Nachkalkulation: Erlös (Anzahlungsrechnung nicht doppelt), Stufen, Prognose, Ampeln wie utils/kalkulation.py", () => {
  assert.deepEqual(erloes({ auftrag_netto_cent: 100000, nachtraege_cent: 10000 }).basis, "auftrag");
  const e2 = erloes({ auftrag_netto_cent: 100000, rechnungen: [{ art: "Anzahlungsrechnung", netto_cent: 40000, status: "Bezahlt" }, { art: "Schlussrechnung", netto_cent: 105000, status: "Offen" }] });
  assert.equal(e2.erloes_cent, 105000);
  assert.equal(e2.basis, "gestellt");
  const st = stufen(100000, { Ware: 60000, "Montage eigen": 10000, "Planung intern": 5000 }, { Ware: "DB1", "Montage eigen": "DB2", "Planung intern": "DB3" });
  assert.equal(st.db1_cent, 40000);
  assert.equal(st.db3_prozent, 25);
  assert.equal(stufen(0, {}, {}).db1_prozent, null);
  assert.deepEqual(prognoseZeile(1000, 400, 300).rest_cent, 300);
  assert.equal(prognoseZeile(1000, 400, 300, 500).prognose_cent, 1200);
  assert.equal(ampelBudget(1000, 900, 0), "gelb");
  assert.equal(ampelBudget(1000, 1000, 0), "gelb", "genau 100 % ist noch nicht rot");
  assert.equal(ampelBudget(1000, 1001, 0), "rot");
  assert.equal(ampelBudget(0, 10, 0), "gelb");
  assert.equal(ampelDb(30, 35, 0, 5), "rot");
  assert.equal(ampelDb(33, 35, 0, 5), "gelb");
  assert.equal(ampelDb(36, 35), "gruen");
  assert.equal(ampelDb(20, null), "");
  assert.equal(fertigstellungsgrad({ phase: "Abgeschlossen" }).grad, 100);
  assert.equal(fertigstellungsgrad({ phase: "Uebergabe", positionen: [] }).grad, 95);
  assert.equal(fertigstellungsgrad({ phase: "Lieferung", positionen: [{ menge: 2, menge_geliefert: 2 }], montage_h_ist: 0, montage_h_plan: 8 }).grad, 48);
  assert.equal(woche("2026-11-04"), "2026-W45");
  assert.deepEqual(zeitreihe([{ datum: "2026-11-02", betrag_cent: 100 }, { datum: "2026-11-10", betrag_cent: 50 }]).map((w) => w.ist_kumuliert_cent), [100, 150]);
});

test("Nachkalkulation v2: Gesamtstruktur, Summe = Zeilen, DB laufend gegen Fertigstellung", () => {
  const r = kalkulationV2({
    erloes: { auftrag_netto_cent: 200000 },
    kostenarten: [{ name: "Ware", db_stufe: "DB1", reihenfolge: 1 }, { name: "Montage eigen", db_stufe: "DB2", reihenfolge: 2 }],
    ist: [{ kostenart: "Ware", betrag_cent: 100000, datum: "2026-10-01" }],
    obligo: [{ kostenart: "Ware", betrag_cent: 20000, datum: "2026-10-05" }],
    budget: [{ kostenart: "Ware", budget_auftrag_cent: 110000 }, { kostenart: "Montage eigen", budget_auftrag_cent: 20000 }],
    fortschritt: { phase: "Lieferung", positionen: [{ menge: 1, menge_geliefert: 1 }] },
    parameter: { ziel: { ziel_db1: 35, ziel_db2: 25, ziel_db3: null }, ampel_gelb_unter: 0, ampel_rot_unter: 5, budget_gelb: 90, budget_rot: 100, gemeinkosten: { art: "Aus" } },
  });
  assert.equal(r.summe.ist_cent, 100000);
  assert.equal(r.kopf.obligo_cent, 20000);
  assert.equal(r.kostenarten.find((z) => z.kostenart === "Ware").ampel, "rot");
  assert.equal(r.kopf.ueber_budget, true);
  assert.equal(r.kopf.db_prognose_stufe, "DB3");
  assert.equal(r.kopf.fertigstellungsgrad, 80, "Phase 40 × 20 + Lieferquote 100 × 40, ohne Montageplan");
  assert.equal(r.kopf.erloes_anteilig_cent, 160000);
  assert.equal(r.quellen.length, 2);
});

// ------------------------------------------------------------------ Mappe --

const MAPPE = basis("Lieferung", {
  projekt: { name: "P1", status: "Lieferung", titel: "Küche", liefertermin_geplant: "2026-11-20", projektart: "Kueche", eingang: "2026-08-01 10:00:00" },
  phasen: [{ phase: "Anfrage", datum: "2026-08-01 10:00:00", von: "a" }, { phase: "Lieferung", datum: "2026-11-01 10:00:00", von: "Administrator", notiz: "System: Folgeobjekt" }],
  positionen: [{ bezeichnung: "A", lieferstatus: "geliefert", menge: 1, menge_geliefert: 1, ek_cent: 10000, preis_cent: 20000, liefertermin: "2026-11-01" }, { bezeichnung: "B", lieferstatus: "bestellt", menge: 1, ek_cent: 5000, preis_cent: 9000 }],
  montagen: [{ name: "M1", status: "Geplant", start: "2026-11-10 08:00:00", ende: "2026-11-10 16:00:00", stunden_geplant: 8 }],
  gewerke: [{ name: "G1", gewerk: "Elektriker", status: "Geplant", termin_von: "2026-11-08 08:00:00", termin_bis: "2026-11-08 12:00:00", kosten_cent: 30000 }],
  zeiten: [{ name: "Z1", taetigkeit: "Planung", dauer_min: 120, datum: "2026-10-01" }],
  nachrichten: [{ name: "N1", richtung: "eingehend", status: "Ungelesen", text: "Frage", gesendet_am: "2026-11-03 09:00:00", autor: "Kunde" }],
});

test("Mappe: Phasenleiste 9 Punkte (teilweise bei Teillieferung), Termine, nächster Termin, Mini-Gantt, Aktivität", () => {
  const s = phasenSchritte(MAPPE);
  assert.equal(s.length, 9);
  assert.equal(s[5].zustand, "teilweise");
  assert.equal(s[5].quelle, "system");
  assert.equal(s[0].zustand, "erledigt");
  assert.equal(s[8].titel, "Abgeschlossen");
  const ab = phasenSchritte({ ...MAPPE, projekt: { ...MAPPE.projekt, status: "Abgebrochen" } });
  assert.equal(ab[8].titel, "Abgebrochen");
  const t = termineListe(MAPPE, HEUTE);
  assert.deepEqual(t.map((x) => x.art), ["fremdgewerk", "montage", "lieferung"]);
  assert.equal(naechsterTermin(MAPPE, HEUTE).art, "fremdgewerk");
  const g = miniGantt(MAPPE, HEUTE);
  assert.equal(g.kw.length, 8);
  assert.ok(g.zeilen.some((z) => z.art === "raute") && g.zeilen.some((z) => z.art === "balken"));
  const a = aktivitaetsStrom(MAPPE, { kommentare: [{ name: "K1", comment_type: "Comment", content: "intern", creation: "2026-11-04 10:00:00", owner: "x" }] });
  assert.equal(a[0].intern, true);
  assert.ok(a.some((e) => e.art === "kunde" && e.ungelesen));
});

test("Mappe: Mock-Nachkalkulation aus Seed-Daten (Ist = geliefert, Obligo = bestellt/geplant, Zeiten × Satz)", () => {
  const k = kalkulationAusMappe(MAPPE, { einstellungen: { kostensaetze: [{ taetigkeit: "Planung", satz_cent: 7500, platzhalter: 1 }] }, kostenarten: [{ name: "Ware", db_stufe: "DB1" }, { name: "Planung intern", db_stufe: "DB3" }, { name: "Fremdgewerk", db_stufe: "DB2" }], stichtag: HEUTE });
  assert.equal(k.kopf.erloes_cent, 29000);
  assert.equal(k.kopf.kosten_ist_cent, 10000 + 15000);
  assert.equal(k.kopf.obligo_cent, 5000 + 30000);
  assert.ok(k.hinweise.some((h) => /Platzhalter/.test(h)));
});

// ------------------------------------------------------------------ Schnellanlage, Regeln, Anzeige --

test("Schnellanlage: #Projekt mit Leerzeichen, @Person, !hoch, morgen, TT.MM.", () => {
  const ctx = { projekte: [{ name: "P1", titel: "Küche am See" }, { name: "P2", titel: "Haus am See" }], leute: [{ user: "p@x", name: "Paul Schema" }], heute: HEUTE };
  assert.deepEqual(schnellanlage("#Küche am See Termin abstimmen @paul morgen !hoch", ctx), { titel: "Termin abstimmen", projekt: "P1", projektTitel: "Küche am See", person: "p@x", personName: "Paul Schema", faellig: "2026-11-05", prioritaet: "Hoch" });
  assert.equal(schnellanlage("Muster 12.11. #haus", ctx).faellig, "2026-11-12");
  assert.equal(schnellanlage("Muster 12.11. #haus", ctx).projekt, "P2");
  assert.equal(schnellanlage("Nur Text", ctx).projekt, "");
});

test("Regeln: Fremdgewerk-Übergänge exakt, Konflikt Gewerk/Montage, Referenz-Prüfliste, PA8", () => {
  assert.ok(fremdgewerkErlaubt("Offen", "Geplant") && !fremdgewerkErlaubt("Offen", "Erledigt") && fremdgewerkErlaubt("Abgesagt", "Offen"));
  const k = gewerkKonflikte([{ name: "G", projekt: "P", gewerk: "Maler", status: "Angefragt", termin_von: "2026-11-06 08:00:00", termin_bis: "2026-11-08 17:00:00" }], [{ name: "M", projekt: "P", status: "Geplant", start: "2026-11-07 08:00:00" }]);
  assert.equal(k.length, 1);
  const pr = referenzPruefung({ titel: "Hauptstraße 5", anzeige_art: "vorname_ort", anzeige_vorname: "Anna", anzeige_ort: "6911 Lochau", bilder: [], einwilligung_textstatus: "entwurf" });
  assert.deepEqual(pr.filter((z) => !z.ok).map((z) => z.id), ["ort", "titel", "anzahl", "text"]);
  const p8 = abschlussPruefliste(basis("Uebergabe", { abnahmen: [{ name: "A", status: "Abgeschlossen" }], rechnungen: [{ art: "Schlussrechnung", status: "Bezahlt" }] }));
  assert.ok(p8.find((z) => z.id === "schlussrechnung").ok);
  assert.ok(p8.find((z) => z.id === "abnahmen").ok);
});

test("Anzeige: relativ, Euro de-DE mit Minuszeichen, Prozent, Phasenpunkte", () => {
  assert.equal(terminText("2026-11-04 08:00:00", HEUTE), "heute 08:00");
  assert.equal(terminText("2026-11-05", HEUTE), "morgen");
  assert.equal(terminText("2026-11-10 09:30:00", HEUTE), "Di 10.11. 09:30");
  assert.equal(euroRund(14860000), "148.600 €");
  assert.equal(euroRund(-150), "−1,50 €");
  assert.equal(prozentText(27.43), "27,4 %");
  assert.equal(prozentText(null), "–");
  assert.equal(datumKurz("2026-11-04", { jahr: true }), "04.11.2026");
  assert.equal(phasenFortschritt("Lieferung"), 40);
  assert.deepEqual(phasenPunkte("Planung").map((p) => p.z).slice(0, 3), ["erledigt", "aktuell", "offen"]);
  assert.equal(phasenPunkte("Abgebrochen").at(-1).z, "abbruch");
});
