// Unit-Tests Bereich Faktura (B-FAK): reine Regeln aus lib/backoffice/faktura (10-konzept-faktura § 16.1/§ 13).
//   node --test "tests/unit/faktura-*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";

import { belegSummen, vereinnahmteAnzahlungen, summenblock, zahlungsplanAus, zahlungsplanPruefen, zahlungsbedingungSatz, auftragStand, altersband, inAlter, tageZwischen } from "../../src/lib/backoffice/faktura/betraege.js";
import { pruefePflichtangaben, istUnternehmer, leistungsQuelle } from "../../src/lib/backoffice/faktura/pflichtangaben.js";
import { zahlKanaele, kanalErlaubt, erstattKanaele, pruefeRechnungsdatum, uvaMonat, spaeteRechnung, ankerAusZweck, sicherheitWort, darfFeldSchreiben, mahnvorschlag, naechsteMahnungAb, monatName, vormonat, monatsEnde } from "../../src/lib/backoffice/faktura/regeln.js";
import * as KZ from "../../src/lib/backoffice/faktura/kostenzuordnung.js";
import { statusAnzeige, STATUS_WERTE } from "../../src/lib/backoffice/faktura/status.js";
import { anredeBrief, fuelle, wertLabel } from "../../src/lib/backoffice/faktura/texte.js";
import { zuTunBuchhaltung, zuTunVertrieb } from "../../src/lib/backoffice/faktura/zuTun.js";
import { rechnungSignal, rechnungAktion, auftragAktion, bankVorschlag, RECHNUNG_REITER, suchePasst } from "../../src/lib/backoffice/faktura/zeilen.js";
import { listenModell, paramsAus } from "../../src/lib/backoffice/faktura/listen.js";
import { rechnungPrimaer, rechnungMenue, rechnungBand, angebotPrimaer } from "../../src/lib/backoffice/faktura/akte.js";
import { nummernluecken, projektkosten, umsatzJeMonat } from "../../src/lib/backoffice/faktura/berichte.js";
import { fakturaRolle, bereinige } from "../../src/lib/backoffice/faktura/rolle.js";

const HEUTE = "2026-11-04";
const pos = (menge, einzel, extra = {}) => ({ art: "Produkt", bezeichnung: "Sofa", menge, einzel_netto_cent: einzel, ust_satz_promille: 200, ...extra });

// ------------------------------------------------------------------ Beträge --

test("Beträge: Summen je USt-Satz, Rabatt, Alternativen nicht in Summe", () => {
  const s = belegSummen([pos(2, 10000), pos(1, 5000, { ust_satz_promille: 100 }), pos(1, 99999, { alternativ: 1 }), pos(1, 10000, { rabatt_promille: 100 })]);
  assert.equal(s.netto_cent, 20000 + 5000 + 9000);
  assert.equal(s.ust_cent, 5800 + 500);
  assert.equal(s.brutto_cent, s.netto_cent + s.ust_cent);
  assert.equal(s.alternativ_cent, 99999);
  assert.equal(s.rabatt_gesamt_cent, 1000);
  assert.deepEqual(s.ust_aufteilung.map((z) => z.ust_satz_promille), [200, 100]);
});

test("Beträge: nur vereinnahmte Anzahlungen werden abgezogen (R-10, F-05, F-26)", () => {
  const v = vereinnahmteAnzahlungen([{ name: "RE-1", brutto_cent: 998400, bezahlt_cent: 374400 }, { name: "RE-2", brutto_cent: 120000, bezahlt_cent: 120000 }]);
  assert.equal(v.abzug_brutto_cent, 374400 + 120000);
  assert.equal(v.blockiert.length, 1);
  assert.equal(v.blockiert[0].rest_cent, 624000);
  assert.equal(v.abzug_netto_cent + v.abzug_ust_cent, v.abzug_brutto_cent);
});

test("Beträge: Summenblock, Zahlungsplan, Zahlungsbedingungs-Satz, Stand", () => {
  const s = summenblock({ netto_cent: 1000, brutto_cent: 1200, anzahlung_brutto_cent: 200, bezahlt_cent: 300, docstatus: 0, positionen: [pos(1, 1000)] });
  assert.equal(s.zahlbar, 1000);
  assert.equal(s.offen, 700);
  const plan = zahlungsplanAus({ anzahlung_prozent: 40, teilzahlung_prozent: 50 }, 2496001);
  assert.equal(plan.reduce((x, z) => x + z.betrag_cent, 0), 2496001, "Rest auf die letzte Zeile");
  assert.equal(zahlungsplanPruefen(plan, 2496001).ok, true);
  assert.match(zahlungsplanPruefen([{ betrag_cent: 1 }], 2).ok ? "" : "fehler", /fehler/);
  assert.equal(zahlungsbedingungSatz({ anzahlung_prozent: 40, teilzahlung_prozent: 50 }).satz, "Kunde zahlt 40 % bei Auftrag, 50 % bei Lieferung, 10 % nach Montage");
  assert.equal(zahlungsbedingungSatz({ anzahlung_prozent: 60, teilzahlung_prozent: 50 }).ok, false);
  const st = auftragStand({ auftragswert_cent: 1000, bezahlt_cent: 400, abgerechnet_cent: 400, geliefert_cent: 750, anzahlung_soll_cent: 400, anzahlung_ist_cent: 400 });
  assert.deepEqual([st.bezahlt, st.abgerechnet, st.geliefert, st.anzahlungErfuellt], [40, 40, 75, true]);
});

test("Beträge: Altersband und Filter ?alter=", () => {
  const re = [{ offen_cent: 100, faellig: "2026-11-10" }, { offen_cent: 200, faellig: "2026-10-20" }, { offen_cent: 300, faellig: "2026-09-01" }, { offen_cent: 0, faellig: "2026-01-01" }];
  const b = altersband(re, HEUTE);
  assert.deepEqual(b.map((s) => s.cent), [100, 200, 0, 300]);
  assert.equal(inAlter(re[2], "60+", HEUTE), true);
  assert.equal(tageZwischen("2026-10-23", HEUTE), 12);
});

// ----------------------------------------------------------- Pflichtangaben --

const FIRMA = { firmenname: "Platzhirsch", uid: "ATU00000000" };
const ENTWURF = { kunde_name: "Familie Muster", strasse: "Landstraße 5", plz: "6911", ort: "Lochau", datum: HEUTE, leistungsdatum: "2026-11-01", leistung_quelle: "Lieferschein", positionen: [pos(1, 1000000)], brutto_cent: 1200000, ust_fall: "Steuerpflichtig AT" };

test("Pflichtangaben: Privat über 10.000 € ohne UID ist stellbar, Unternehmer nicht (F-15, F-23)", () => {
  assert.equal(pruefePflichtangaben(ENTWURF, { kontaktart: "Privat" }, FIRMA).ok, true);
  const u = pruefePflichtangaben({ ...ENTWURF, firma: "Beispiel GmbH" }, { kontaktart: "Geschaeft" }, FIRMA);
  assert.equal(u.ok, false);
  assert.ok(u.befunde.some((b) => b.id === "uid"));
  assert.equal(istUnternehmer({ empfaenger_unternehmer: 0, firma: "X" }, { kontaktart: "Geschaeft" }), false, "Schalter im Entwurf übersteuert");
});

test("Pflichtangaben: Leistungsdatum nur gleich Rechnungsdatum verlangt Bestätigung (F-01)", () => {
  const r = { ...ENTWURF, leistungsdatum: HEUTE, leistung_quelle: undefined };
  assert.equal(leistungsQuelle(r).belastbar, false);
  const p = pruefePflichtangaben(r, {}, FIRMA);
  assert.ok(p.befunde.some((b) => b.id === "leistung-pruefen" && b.bestaetigbar));
  assert.equal(pruefePflichtangaben(r, {}, FIRMA, {}, { leistungGeprueft: true }).ok, true);
});

test("Pflichtangaben: Kleinbetrag ohne Anschrift, EU-Firma ohne geprüfte UID blockiert, Fremdwährung blockiert", () => {
  const klein = { ...ENTWURF, strasse: "", plz: "", ort: "", kunde_name: "", brutto_cent: 30000 };
  assert.equal(pruefePflichtangaben(klein, {}, FIRMA).ok, true);
  const eu = pruefePflichtangaben({ ...ENTWURF, ust_fall: "Innergemeinschaftlich steuerfrei", uid_empfaenger: "DE123", ust_hinweistext: "steuerfrei" }, {}, FIRMA);
  assert.ok(eu.befunde.some((b) => b.id === "uid-geprueft" && b.uebersteuerbar));
  assert.equal(pruefePflichtangaben({ ...ENTWURF, waehrung: "CHF" }, {}, FIRMA).ok, false);
  assert.ok(pruefePflichtangaben({ ...ENTWURF, positionen: [{ art: "Produkt", menge: 0, bezeichnung: "" }] }, {}, FIRMA).befunde.length >= 2);
});

// ------------------------------------------------------------------- Regeln --

test("Kanäle: nur Überweisung, Stripe Link nur mit Schalter; Bar/Karte nie (E2, F-19)", () => {
  assert.deepEqual(zahlKanaele(), ["Ueberweisung"]);
  assert.deepEqual(zahlKanaele({ stripeLink: true }), ["Ueberweisung", "Stripe Link"]);
  for (const k of ["Bar", "Karte", "Gutschein", "Verrechnung"]) assert.equal(kanalErlaubt(k, { stripeLink: true }), false);
  assert.deepEqual(erstattKanaele(), ["Ueberweisung"]);
});

test("Datumsregeln: anderes Datum nur Leitung, nie vor letzter RE, nie im abgeschlossenen Monat (E7, F-22)", () => {
  assert.equal(pruefeRechnungsdatum({ datum: HEUTE, heute: HEUTE }).ok, true);
  assert.equal(pruefeRechnungsdatum({ datum: "2026-11-03", heute: HEUTE }).code, "forbidden");
  assert.match(pruefeRechnungsdatum({ datum: "2026-11-02", heute: HEUTE, leitung: true, letzte: { name: "RE-2026-00041", datum: "2026-11-03" } }).text, /Vor RE-2026-00041 vom 03\.11\.2026/);
  assert.match(pruefeRechnungsdatum({ datum: "2026-10-30", heute: HEUTE, leitung: true, gesperrtBis: "2026-10-31" }).text, /Oktober 2026 ist abgeschlossen/);
  assert.equal(uvaMonat("2026-11-04", "2026-08-15"), "2026-09");
  assert.equal(spaeteRechnung("2026-11-04", "2026-08-15").uvaMonat, "September");
  assert.equal(spaeteRechnung("2026-11-04", "2026-10-30"), null);
  assert.equal(monatName("2026-01-05"), "Jänner 2026");
  assert.equal(vormonat("2026-01-04"), "2025-12");
  assert.equal(monatsEnde("2026-02"), "2026-02-28");
});

test("Bankanker: RE-, AB- und ER-Nummern im Verwendungszweck; Sicherheitswort", () => {
  const t = ankerAusZweck("Anzahlung AB2026-00019 und RE-2026-00042 Kueche");
  assert.deepEqual(t.map((x) => x.nummer), ["AB-2026-00019", "RE-2026-00042"]);
  assert.equal(sicherheitWort(100), "Sicher");
  assert.equal(sicherheitWort(80), "Wahrscheinlich");
  assert.equal(sicherheitWort(60), "Möglich");
  assert.equal(sicherheitWort(40), "Unklar");
  assert.equal(sicherheitWort(100, { auftrag: true }), "Auftrag");
  assert.equal(bankVorschlag({ verwendungszweck: "AB-2026-00019 Anzahlung" }).wort, "Auftrag");
});

test("Felder: gestellte Belege nur Whitelist (B-03, F-03)", () => {
  assert.equal(darfFeldSchreiben("PH Rechnung", { docstatus: 1 }, { mahnsperre: 1, mahnsperre_grund: "x" }), true);
  assert.equal(darfFeldSchreiben("PH Rechnung", { docstatus: 1 }, { offen_cent: 0 }), false);
  assert.equal(darfFeldSchreiben("PH Rechnung", { docstatus: 0 }, { offen_cent: 0 }), true);
});

test("Mahnvorschlag: ohne Mahnsperre, versandt, Mindestbetrag, Wartezeit, keine doppelte Stufe (F-11, F-31)", () => {
  const basis = { docstatus: 1, status: "Ueberfaellig", offen_cent: 50000, faellig: "2026-10-01", gesendet_am: "2026-09-20", email: "a@beispiel.invalid", mahnstufe: 0 };
  const v = mahnvorschlag(
    [
      { ...basis, name: "A" },
      { ...basis, name: "B", mahnsperre: 1 },
      { ...basis, name: "C", gesendet_am: "", versandkanal: "" },
      { ...basis, name: "D", offen_cent: 500 },
      { ...basis, name: "E", faellig: "2026-11-01" },
      { ...basis, name: "F", mahnstufe: 3 },
      { ...basis, name: "G", email: "" },
    ],
    { heute: HEUTE }
  );
  const n = Object.fromEntries(v.map((r) => [r.name, r]));
  assert.equal(n.A.waehlbar, true);
  assert.equal(n.A.naechste, 1);
  assert.equal(n.B.grund, "sperre");
  assert.equal(n.C.grund, "nichtVersandt");
  assert.equal(n.D.grund, "mindest");
  assert.equal(n.E, undefined, "innerhalb der Wartezeit");
  assert.equal(n.F.grund, "hoechste");
  assert.equal(n.G.post, true, "ohne E-Mail → Post, nie übersprungen");
  assert.equal(naechsteMahnungAb({ faellig: "2026-10-01" }), "2026-10-09");
});

// -------------------------------------------------------- Kostenzuordnung --

test("Kostenzuordnung: Aufteilen mit Rundungsrest auf die größte Zeile (wie rechenwerk/kostenzuordnung.py)", () => {
  const { betraege, differenz } = KZ.aufteilen(10001, [{ prozent: 33.33 }, { prozent: 33.33 }, { prozent: 33.34 }]);
  assert.equal(betraege.reduce((s, b) => s + b, 0), 10001);
  assert.equal(differenz, 0);
  const fehlt = KZ.aufteilen(10000, [{ prozent: 50 }, { prozent: 40 }]);
  assert.equal(fehlt.differenz, 1000, "fehlende Anteile werden nicht versteckt");
});

test("Kostenzuordnung: Modi und Prüftexte", () => {
  assert.deepEqual(KZ.pruefen("Gemeinkosten", 1000, []), []);
  assert.equal(KZ.status("Gemeinkosten", 1000, []), "Gemeinkosten");
  assert.match(KZ.pruefen("Ganz einem Projekt", 1000, [{ projekt: "P1", kostenart: "Ware", betrag_cent: 1000 }, { projekt: "P2", kostenart: "Ware", betrag_cent: 0 }]).join(" "), /genau eine Zeile/);
  assert.match(KZ.pruefen("Aliquot", 1000, [{ projekt: "", kostenart: "Ware", betrag_cent: 1000 }])[0], /Projekt fehlt/);
  const ganz = KZ.berechne({ modus: "Ganz einem Projekt", netto_cent: 726833, projekt: "P1", kostenart: "Ware" });
  assert.equal(ganz.status, "Vollstaendig");
  const pos2 = KZ.berechne({ modus: "Nach Positionen", netto_cent: 412000, positionen: [{ pos: 1, netto_cent: 312000, bezeichnung: "Tisch" }, { pos: 2, netto_cent: 100000, bezeichnung: "Wand" }, { pos: 3, art: "Text" }], zeilen: [{ belegposition: 1, projekt: "P2", kostenart: "Fremdgewerk" }] });
  assert.equal(pos2.zeilen.length, 2);
  assert.equal(pos2.status, "Offen", "Position 2 ohne Projekt");
  const ali = KZ.berechne({ modus: "Aliquot", netto_cent: 180000, zeilen: [{ projekt: "P1", kostenart: "Montage extern", prozent: 60 }, { projekt: "P3", kostenart: "Montage extern", prozent: 40 }] });
  assert.deepEqual(ali.zeilen.map((z) => z.betrag_cent), [108000, 72000]);
  assert.equal(ali.differenz_cent, 0);
  assert.match(KZ.unterschied([{ projekt: "P1", kostenart: "Ware", betrag_cent: 100 }], [{ projekt: "P2", kostenart: "Ware", betrag_cent: 100 }]), /P1\/Ware 1\.00 → P2\/Ware 1\.00/);
});

test("Kostenzuordnung: Budget-Hinweis gelb/rot/ohne, Gutschrift negativ, Umbuchen nur Leitung mit Grund", () => {
  const budgets = { P1: { titel: "Haus am See", kostenarten: { Ware: { budget_cent: 1000, gebunden_cent: 850 } } } };
  assert.equal(KZ.budgetHinweise([{ projekt: "P1", kostenart: "Ware", betrag_cent: 60 }], budgets)[0].stufe, "gelb");
  assert.equal(KZ.budgetHinweise([{ projekt: "P1", kostenart: "Ware", betrag_cent: 200 }], budgets)[0].stufe, "rot");
  assert.equal(KZ.budgetHinweise([{ projekt: "P9", kostenart: "Ware", betrag_cent: 1 }], budgets)[0].stufe, "ohne");
  assert.equal(KZ.budgetHinweise([{ projekt: "P1", kostenart: "Ware", betrag_cent: 100 }], budgets, {}, "Gutschrift")[0].gebunden_cent, 750);
  assert.equal(KZ.pruefeUmbuchen({ leitung: false, grund: "x" }).code, "forbidden");
  assert.equal(KZ.pruefeUmbuchen({ leitung: true, grund: " " }).code, "invalid");
  assert.equal(KZ.pruefeUmbuchen({ leitung: true, grund: "Falsches Projekt" }).ok, true);
});

// -------------------------------------------------------- Status und Texte --

test("Status: Töne exakt § 2.4, Gemahnt Stufe 3 rot, Umlaute in der Anzeige", () => {
  assert.deepEqual(statusAnzeige("PH Rechnung", "Gemahnt", { mahnstufe: 2 }), { ton: "orange", text: "Gemahnt · Stufe 2", wert: "Gemahnt" });
  assert.equal(statusAnzeige("PH Rechnung", "Gemahnt", { mahnstufe: 3 }).ton, "rot");
  assert.equal(statusAnzeige("PH Rechnung", "Ueberfaellig").text, "Überfällig");
  assert.equal(statusAnzeige("PH Eingangsrechnung", "Sachlich geprueft").text, "Sachlich geprüft");
  assert.equal(statusAnzeige("PH Export Lauf", "Uebergeben").ton, "tuerkis");
  for (const [dt, werte] of Object.entries(STATUS_WERTE)) for (const w of werte) assert.ok(statusAnzeige(dt, w).ton, `${dt} ${w}`);
  assert.equal(wertLabel("Ueberweisung"), "Überweisung");
});

test("Texte: Anrede aus Kontakt (R-18) und Platzhalter bleiben sichtbar", () => {
  assert.equal(anredeBrief({ anrede: "Frau", nachname: "Probe" }), "Sehr geehrte Frau Probe");
  assert.equal(anredeBrief({ anrede: "Herr", nachname: "Muster" }), "Sehr geehrter Herr Muster");
  assert.equal(anredeBrief({ kontaktart: "Geschaeft", firma: "Beispiel GmbH" }), "Sehr geehrte Damen und Herren");
  assert.equal(anredeBrief({ vorname: "Kim", nachname: "Demo" }), "Guten Tag Kim Demo");
  assert.equal(fuelle("{a} und {b}", { a: "X" }), "X und {b}");
});

// ------------------------------------------------------------ Zeilen, Akte --

test("Zeilen: Signal überfällig vor bald, Aktion je Zustand, Suche nach Betrag", () => {
  const r = { docstatus: 1, status: "Ueberfaellig", offen_cent: 624000, faellig: "2026-10-23", mahnstufe: 1 };
  assert.equal(rechnungSignal(r, HEUTE).text, "12 Tage überfällig");
  assert.equal(rechnungAktion(r, { schreibt: true }).titel, "Mahnen (Stufe 2)");
  assert.equal(rechnungAktion({ ...r, mahnstufe: 3 }, { schreibt: true }).id, "zahlung");
  assert.equal(rechnungAktion({ docstatus: 0 }, { schreibt: true }).id, "stellen");
  assert.equal(rechnungAktion(r, { schreibt: false }), null, "ohne Recht keine Aktion");
  assert.equal(RECHNUNG_REITER.ueberfaellig(r, HEUTE), true);
  assert.equal(suchePasst("6.240", ["X", 624000]), true);
  assert.equal(auftragAktion({ status: "Offen", anzahlung_soll_cent: 100, anzahlung_ist_cent: 0, zahlungsplan: [{ art: "Anzahlung", status: "Offen" }] }, { schreibt: true }).id, "anzahlung");
  assert.equal(auftragAktion({ status: "Geliefert" }, { schreibt: true }).id, "schlussrechnung");
});

test("Listenmodell: Reiter mit Zählern, Filter in der URL, Blättern", () => {
  const daten = Array.from({ length: 30 }, (_, i) => ({ name: `RE-${i}`, docstatus: i < 5 ? 0 : 1, status: i < 5 ? "Entwurf" : "Gestellt", datum: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`, kunde_name: i === 7 ? "Familie Muster" : "Beispiel" }));
  const m = listenModell({ daten, reiter: [{ id: "offen", titel: "Offen" }, { id: "entwuerfe", titel: "Entwürfe" }], regeln: RECHNUNG_REITER, params: { r: "offen", seite: "1" }, standard: "offen", zeile: (x) => x, suchFelder: (x) => [x.name, x.kunde_name], zaehlerFuer: ["entwuerfe"] });
  assert.equal(m.gesamt, 25);
  assert.equal(m.zeilen.length, 25);
  assert.equal(m.reiter.find((r) => r.id === "entwuerfe").anzahl, 5);
  const q = listenModell({ daten, reiter: [], regeln: RECHNUNG_REITER, params: { q: "muster" }, standard: "alle", zeile: (x) => x, suchFelder: (x) => [x.kunde_name] });
  assert.equal(q.gesamt, 1);
  assert.deepEqual(paramsAus({ r: "offen", boese: "x", q: ["a", "b"] }), { r: "offen", q: "a" });
});

test("Akte: Primäraktion je Zustand, Menü mit gesperrten Einträgen und Grund, ein Band (§ 2.1, § 2.6)", () => {
  const leitung = { schreibt: true, leitung: true };
  const ma = { schreibt: true, leitung: false };
  assert.equal(rechnungPrimaer({ docstatus: 0 }, ma).id, "stellen");
  assert.equal(rechnungPrimaer({ docstatus: 1, status: "Bezahlt", offen_cent: 0 }, ma), null);
  const m = rechnungMenue({ name: "RE-1", docstatus: 1, status: "Gemahnt", offen_cent: 100, bezahlt_cent: 50, mahnstufe: 1 }, ma, { uneinbringlich: true });
  const un = m.find((x) => x.id === "uneinbringlich");
  assert.equal(un.deaktiviert, true);
  assert.equal(un.grund, "Nur Faktura-Leitung");
  assert.equal(m.find((x) => x.id === "korrigieren").deaktiviert, true, "Korrektur mit Zahlung braucht Schalter");
  assert.equal(rechnungMenue({ name: "RE-1", docstatus: 1, status: "Gemahnt", offen_cent: 100, mahnstufe: 1 }, leitung, { uneinbringlich: true }).find((x) => x.id === "uneinbringlich").deaktiviert, undefined);
  assert.match(rechnungBand({ status: "Storniert", storno_durch: "GU-2026-00004", export_status: "exportiert" }).titel, /Storniert durch GU-2026-00004/);
  assert.match(rechnungBand({ export_status: "exportiert", export_lauf: "EX-1", docstatus: 1 }).titel, /Exportiert in EX-1/);
  assert.equal(angebotPrimaer({ status: "Gesendet" }, ma).id, "uebernehmen");
});

// ---------------------------------------------------------------- Zu tun --

test("Zu tun: Regeln § 3.1, höchstens 8 Zeilen, Leitung sieht Bank/Freigabe", () => {
  const z = zuTunBuchhaltung({
    heute: HEUTE,
    rolle: { leitung: true, schreibt: true },
    bank: [{ status: "Offen", vorschlag_sicherheit: 100, vorschlag_doctype: "PH Rechnung", betrag_cent: 100 }],
    mahnbar: [{ waehlbar: true, tage: 12, offen_cent: 624000 }],
    er: [{ name: "ER-1", status: "Sachlich geprueft", lieferant_name: "Bulthaup", skonto_bis: "2026-11-06", zahlbetrag_cent: 1, zuordnung_status: "Vollstaendig" }],
    auftraege: [{ name: "AB-1", status: "Offen", datum: "2026-10-01", anzahlung_soll_cent: 100, anzahlung_ist_cent: 0, anzahlung_ohne_rechnung: true }],
    rechnungen: [],
    exporte: [],
    uva: [{ name: "U", status: "Berechnet", zeitraum_von: "2026-10-01" }],
    gutschriften: [],
  });
  assert.ok(z.length <= 8);
  assert.deepEqual(z.slice(0, 3).map((x) => x.id), ["bank", "mahnen", "er-ER-1"]);
  assert.match(z.find((x) => x.id === "er-ER-1").satz, /Skonto noch 2 Tage/);
  assert.ok(!z.some((x) => x.id === "export"), "Export des Vormonats ab dem 5. – am 4. noch nicht");
  const mit = zuTunBuchhaltung({ heute: "2026-11-05", rolle: { leitung: true, schreibt: true }, exporte: [] });
  assert.ok(mit.some((x) => x.id === "export"));
  const ma = zuTunBuchhaltung({ heute: HEUTE, rolle: { leitung: false, schreibt: true }, bank: [{ status: "Offen", vorschlag_sicherheit: 100, vorschlag_doctype: "PH Rechnung" }] });
  assert.ok(!ma.some((x) => x.id === "bank"), "Mitarbeiter sieht keine Bank");
  const vt = zuTunVertrieb({ heute: HEUTE, angebote: [{ name: "AN-1", status: "Gesendet", gueltig_bis: "2026-11-07", brutto_cent: 1 }] });
  assert.match(vt[0].satz, /noch 3 Tage/);
});

// ----------------------------------------------------- Berichte, Rolle --

test("Berichte: Nummernlücken, Projektkosten (Gemeinkosten eigene Zeile), Umsatz 12 Monate", () => {
  const l = nummernluecken([{ name: "RE-2026-00001", docstatus: 1 }, { name: "RE-2026-00003", docstatus: 1 }, { name: "ENTW-2026-00009", docstatus: 0 }]);
  assert.deepEqual(l[0], { kreis: "RE-2026", von: 1, bis: 3, anzahl: 2, luecken: 1, fehlend: "2" });
  const k = projektkosten([{ status: "Freigegeben", zuordnung_modus: "Aliquot", zuordnung: [{ projekt: "P1", kostenart: "Fracht", betrag_cent: 10 }] }, { status: "Erfasst", zuordnung_modus: "Gemeinkosten", netto_cent: 5 }, { status: "Abgelehnt", zuordnung: [{ projekt: "P1", kostenart: "Fracht", betrag_cent: 99 }] }]);
  assert.deepEqual(k.map((x) => [x.projekt, x.betrag_cent]), [["Gemeinkosten", 5], ["P1", 10]]);
  assert.equal(umsatzJeMonat([], [], HEUTE).length, 12);
});

test("Rolle: Mitarbeiter ohne Bank/CSV/permlevel 1, StB ohne notiz_intern/Unterschrift/ip_hash (F-16, F-32)", () => {
  const ma = fakturaRolle({ roles: ["PH Faktura Mitarbeiter"] });
  assert.deepEqual([ma.schreibt, ma.leitung, ma.darfBank, ma.darfCsv, ma.permlevel1], [true, false, false, false, false]);
  const le = fakturaRolle({ roles: ["PH Faktura Leitung", "PH Faktura Mitarbeiter"] });
  assert.deepEqual([le.leitung, le.darfBank, le.darfCsv, le.permlevel1], [true, true, true, true]);
  const stb = fakturaRolle({ roles: ["PH Buchhaltung extern"] });
  assert.deepEqual([stb.stb, stb.schreibt, stb.darfBank, stb.export], [true, false, true, true]);
  const doc = { name: "X", notiz_intern: "geheim", unterschrift_kunde: "data:", ip_hash: "h", positionen: [{ einkauf_cent: 5, bezeichnung: "a" }] };
  const b = bereinige(doc, stb);
  assert.equal(b.notiz_intern, undefined);
  assert.equal(b.unterschrift_kunde, undefined);
  assert.equal(b.ip_hash, undefined);
  assert.equal(b.positionen[0].einkauf_cent, undefined);
  assert.equal(bereinige(doc, le).notiz_intern, "geheim");
});
