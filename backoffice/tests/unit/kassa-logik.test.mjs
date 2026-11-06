// Kassa – reine Logik (Team B-KAS). Testfälle aus Backend-Import/ph_kassa/ph_kassa/tests (test_betraege,
// test_luecken) übernommen: Der Port muss dieselben Zahlen liefern wie der Server.
//   node --test tests/unit/kassa-logik.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { belegPruefen, euro, KassenFehler, nettoAusBrutto, positionBerechnen, rabattBerechnen, rabattFreigabeNoetig, rueckgeld, rueckzahlungPruefen, schnellbetraege, stueckelung, summen, zahlartenPruefen } from "../../src/lib/backoffice/kassa/betraege.js";
import { eanPruefzifferOk, erkennen, scanErlaubt, suchbar } from "../../src/lib/backoffice/kassa/codes.js";
import { pruefe, rechnungsfrageNoetig, stornoFreigabe, stornoGesperrt, umsatzFuerRechnung } from "../../src/lib/backoffice/kassa/regeln.js";
import { abschlussSchritte, bargeldSoll, differenzGrundPflichtig, differenzWort, naechsterStatus, sollAusBelegen, zaehlprotokollAus, zaehlprotokollSumme } from "../../src/lib/backoffice/kassa/abschluss.js";
import { bewegung, grundText, inDerLade, pruefeBuchung, tagesstart, zweckeFuer } from "../../src/lib/backoffice/kassa/bargeld.js";

test("Beträge: netto/ust wie test_netto_aus_brutto", () => {
  assert.deepEqual(nettoAusBrutto(12000, "Normal 20"), [10000, 2000]);
  assert.deepEqual(nettoAusBrutto(11000, "Ermaessigt-1 10"), [10000, 1000]);
  assert.deepEqual(nettoAusBrutto(11300, "Ermaessigt-2 13"), [10000, 1300]);
  assert.deepEqual(nettoAusBrutto(5000, "Null 0"), [5000, 0]);
  assert.deepEqual(nettoAusBrutto(11900, "Besonders 19"), [10000, 1900]);
  const [n, u] = nettoAusBrutto(999, "Normal 20");
  assert.equal(n + u, 999);
  assert.throws(() => nettoAusBrutto(100, "Gibt es nicht"), KassenFehler);
  // negative Beträge symmetrisch gerundet (Storno)
  assert.deepEqual(nettoAusBrutto(-12000, "Normal 20"), [-10000, -2000]);
});

test("Beträge: Summen je Steuersatz wie test_summen_je_steuersatz", () => {
  const s = summen([
    { art: "Artikel", bezeichnung: "Sofa", menge: 1, einzel_brutto_cent: 120000, steuersatz: "Normal 20" },
    { art: "Artikel", bezeichnung: "Kissen", menge: 3, einzel_brutto_cent: 2400, steuersatz: "Normal 20" },
    { art: "Freitext", bezeichnung: "Buch", menge: 1, einzel_brutto_cent: 2200, steuersatz: "Ermaessigt-1 10" },
    { art: "Gutschein Verkauf", bezeichnung: "Gutschein", menge: 1, einzel_brutto_cent: 10000, steuersatz: "Null 0" },
  ]);
  assert.equal(s.gesamt_cent, 120000 + 7200 + 2200 + 10000);
  assert.equal(s.je_satz["Normal 20"].brutto_cent, 127200);
  assert.equal(s.je_satz["Normal 20"].netto_cent, 106000);
  assert.equal(s.je_satz["Normal 20"].ust_cent, 21200);
  assert.equal(s.je_satz["Ermaessigt-1 10"].ust_cent, 200);
  assert.equal(s.je_satz["Null 0"].ust_cent, 0);
  assert.equal(s.rksv.betrag_normal_cent, 127200);
  assert.equal(s.rksv.betrag_ermaessigt1_cent, 2200);
  assert.equal(s.rksv.betrag_null_cent, 10000);
  assert.equal(s.rksv.betrag_besonders_cent, 0);
  assert.equal(s.netto_cent + s.ust_cent, s.gesamt_cent);
});

test("Beträge: Gutschein-Einlösung mindert, Menge ≤ 0 ist Fehler", () => {
  const s = summen([{ art: "Artikel", menge: 1, einzel_brutto_cent: 5000, steuersatz: "Normal 20" }, { art: "Gutschein Einloesung", menge: 1, einzel_brutto_cent: 2000, steuersatz: "Normal 20" }]);
  assert.equal(s.gesamt_cent, 3000);
  assert.throws(() => positionBerechnen({ art: "Artikel", menge: 0, einzel_brutto_cent: 100 }), /Menge muss größer 0/);
});

test("Beträge: Rückgeld, Stückelung, Schnellbeträge", () => {
  assert.equal(rueckgeld(4350, 5000), 650);
  assert.equal(rueckgeld(5000, 4000), -1000);
  assert.deepEqual(stueckelung(650), [[500, 1], [100, 1], [50, 1]]);
  assert.deepEqual(stueckelung(28763), [[20000, 1], [5000, 1], [2000, 1], [1000, 1], [500, 1], [200, 1], [50, 1], [10, 1], [2, 1], [1, 1]]);
  assert.throws(() => stueckelung(-1), KassenFehler);
  assert.deepEqual(schnellbetraege(12960), [12960, 13000, 14000, 15000]);
  assert.deepEqual(schnellbetraege(5000), [5000, 6000, 10000, 20000]);
  assert.deepEqual(schnellbetraege(0), []);
});

test("Beträge: Zahlarten wie test_zahlarten_* (Bar, Split, Fehler, Überweisung)", () => {
  const z = zahlartenPruefen(4350, [{ zahlart: "Bar", gegeben_cent: 5000 }]);
  assert.equal(z.rueckgeld_cent, 650);
  assert.equal(z.zahlarten[0].betrag_cent, 4350);
  assert.equal(z.zahlarten[0].retour_cent, 650);
  assert.equal(z.barumsatz_cent, 4350);
  const sp = zahlartenPruefen(10000, [{ zahlart: "Gutschein", betrag_cent: 3000, rest_cent: 5000, gutschein: "G1" }, { zahlart: "Bar", gegeben_cent: 10000 }]);
  assert.equal(sp.rueckgeld_cent, 3000);
  assert.equal(sp.zahlarten.find((x) => x.zahlart === "Bar").betrag_cent, 7000);
  assert.equal(sp.barumsatz_cent, 10000);
  assert.throws(() => zahlartenPruefen(10000, [{ zahlart: "Bar", gegeben_cent: 9000 }]), KassenFehler);
  assert.throws(() => zahlartenPruefen(10000, [{ zahlart: "Karte Stripe Terminal", betrag_cent: 12000 }]), KassenFehler);
  assert.throws(() => zahlartenPruefen(10000, [{ zahlart: "Gutschein", betrag_cent: 6000, rest_cent: 5000 }]), KassenFehler);
  assert.throws(() => zahlartenPruefen(10000, [{ zahlart: "Ueberweisung", betrag_cent: 9000 }]), KassenFehler);
  assert.throws(() => zahlartenPruefen(10000, []), KassenFehler);
  const u = zahlartenPruefen(10000, [{ zahlart: "Ueberweisung", betrag_cent: 10000 }]);
  assert.equal(u.barumsatz_cent, 0);
  assert.equal(u.zahlarten[0].barumsatz, 0);
  const b = belegPruefen([{ art: "Anzahlung", menge: 1, einzel_brutto_cent: 300000, steuersatz: "Normal 20" }], [{ zahlart: "Karte Stripe Terminal", betrag_cent: 300000, terminal_payment_intent: "pi_x" }]);
  assert.equal(b.gesamt_cent, 300000);
  assert.equal(b.rueckgeld_cent, 0);
  assert.equal(b.rksv.betrag_normal_cent, 300000);
});

test("Beträge: Rückzahlung (Retoure) und Rabatt", () => {
  const r = rueckzahlungPruefen(-5000, [{ zahlart: "Bar" }]);
  assert.equal(r.zahlarten[0].betrag_cent, -5000);
  assert.throws(() => rueckzahlungPruefen(-5000, [{ zahlart: "Gutschein", betrag_cent: 5000 }]), /Gutschein Verkauf/);
  assert.deepEqual(rabattBerechnen(10000, 100), { einzel_brutto_cent: 9000, rabatt_cent: 1000, rabatt_promille: 100 });
  assert.throws(() => rabattBerechnen(10000, 100, 500), KassenFehler);
  assert.deepEqual(rabattFreigabeNoetig([{ listenpreis_cent: 10000, rabatt_promille: 150 }, { listenpreis_cent: 10000, rabatt_cent: 500 }], 100), [0]);
  assert.throws(() => positionBerechnen({ art: "Artikel", listenpreis_cent: 10000, rabatt_promille: 100 }), /Rabatt braucht einen Grund/);
  assert.equal(positionBerechnen({ art: "Artikel", listenpreis_cent: 10000, rabatt_promille: 100, rabatt_grund: "Ausstellungsstück" }).brutto_cent, 9000);
});

test("Beträge: Anzeige de-AT aus Cent", () => {
  assert.equal(euro(105900), "1.059,00 €");
  assert.equal(euro(-240), "− 2,40 €");
  assert.equal(euro(0), "0,00 €");
  assert.equal(euro(null), "");
});

test("Codes: Erkennung wie test_luecken (codes.erkennen)", () => {
  assert.equal(erkennen("4006381333931").art, "ean");
  assert.equal(erkennen("4006381333932").art, "suche");
  assert.equal(erkennen("kk-7k3qx9").art, "kundenkarte");
  assert.equal(erkennen("kk-7k3qx9").wert, "KK-7K3QX9");
  assert.equal(erkennen("PH-7K3Q-X9MA-2BCD-EFGH").art, "gutschein");
  assert.equal(erkennen("AB-2026-00012").art, "auftrag");
  assert.equal(erkennen("RE-2026-00012").art, "rechnung");
  assert.equal(erkennen("SHOWROOM1-000012").art, "kassenbeleg");
  const q = erkennen("_R1-AT1_SHOWROOM1_12_2026-11-04T10:00:00_1,00_0,00_0,00_0,00_0,00_AAA=_1A_BBB=_CCC=");
  assert.deepEqual([q.art, q.kassen_id, q.belegnummer], ["rksv_qr", "SHOWROOM1", "12"]);
  assert.equal(erkennen("Sofa Grau").art, "suche");
  assert.equal(erkennen("KASSE-LOCHAU-01-000012").art, "kassenbeleg");
  assert.ok(eanPruefzifferOk("2000000010014"));
});

test("Codes: Suchschwelle und Scan je Zustand (§2.4/§2.6)", () => {
  assert.equal(suchbar("a"), false);
  assert.equal(suchbar("vase"), true);
  assert.equal(suchbar("123"), false);
  assert.equal(suchbar("1234"), true);
  assert.deepEqual(scanErlaubt("ean", "bon"), { wirkt: true });
  assert.equal(scanErlaubt("ean", "zahlmaske").hinweis, "zahlungBeenden");
  assert.equal(scanErlaubt("gutschein", "zahlmaske").wirkt, true);
  assert.equal(scanErlaubt("kundenkarte", "karte").hinweis, "zahlungLaeuft");
  assert.equal(scanErlaubt("ean", "dialog").hinweis, "eingabeBeenden");
});

test("Regeln: Rechnungsfrage strikt über der Schwelle, nur ohne Kunde (E1)", () => {
  const pos = (b) => [{ art: "Artikel", brutto_cent: b }];
  const einst = { barverkauf_rechnung_ab_cent: 40000 };
  assert.equal(rechnungsfrageNoetig({ positionen: pos(40000) }, einst), false);
  assert.equal(rechnungsfrageNoetig({ positionen: pos(40001) }, einst), true);
  assert.equal(rechnungsfrageNoetig({ positionen: pos(90000), kontakt: "PH-KON-1" }, einst), false);
  assert.equal(rechnungsfrageNoetig({ positionen: pos(90000), antwort: { art: "privat" } }, einst), false);
  assert.equal(umsatzFuerRechnung([{ art: "Anzahlung", brutto_cent: 90000 }, { art: "Gutschein Verkauf", brutto_cent: 50000 }]), 0);
});

test("Regeln: pruefe – Fehler, Freigaben, Hinweise wie logik/regeln.py", () => {
  const e = { gutschein_art: "Mehrzweck", barverkauf_rechnung_ab_cent: 40000, retoure_bar_nur_leitung: 1 };
  assert.match(pruefe({ positionen: [{ art: "Anzahlung", brutto_cent: 1000 }], gesamt_cent: 1000 }, e).fehler[0], /nur mit Auftrag/);
  assert.deepEqual(pruefe({ positionen: [{ art: "Anzahlung", brutto_cent: 5000 }], auftrag: "AB-1", auftrag_offen_cent: 1000, gesamt_cent: 5000 }, e).freigaben, ["ueberzahlung"]);
  assert.match(pruefe({ positionen: [{ art: "Gutschein Verkauf", brutto_cent: 5000 }], zahlarten: [{ zahlart: "Gutschein" }], gesamt_cent: 5000 }, e).fehler.join(), /verkaufen und einlösen/);
  const ret = pruefe({ positionen: [{ art: "Retoure", brutto_cent: -5000, zusatz: "Umtausch" }], zahlarten: [{ zahlart: "Bar", betrag_cent: -5000 }], gesamt_cent: -5000 }, e);
  assert.deepEqual(ret.freigaben, ["retoure_bar", "retoure_ohne_beleg"]);
  assert.match(pruefe({ positionen: [{ art: "Artikel", brutto_cent: 50000 }], gesamt_cent: 50000 }, e).fehler[0], /Rechnungsempfänger/);
  assert.deepEqual(pruefe({ positionen: [{ art: "Artikel", brutto_cent: 50000 }], gesamt_cent: 50000, empfaenger: { name: "Beispiel GmbH", strasse: "Weg 1", ort: "Lochau" } }, e).fehler, []);
  assert.match(pruefe({ positionen: [{ art: "Artikel", brutto_cent: 1200000 }], kontakt: "K", zahlarten: [{ zahlart: "Bar", betrag_cent: 1200000 }], gesamt_cent: 1200000 }, e).fehler.join(), /Identität/);
});

test("Regeln: Storno-Freigabe und Sperren (E2, Karte)", () => {
  assert.deepEqual(stornoFreigabe({ bediener: "a", datum: "2026-11-04", gesamt_cent: 3000 }, "a", "2026-11-04", false, 5000), []);
  assert.deepEqual(stornoFreigabe({ bediener: "b", datum: "2026-11-04", gesamt_cent: 3000 }, "a", "2026-11-04", false, 5000), ["storno_fremd"]);
  assert.deepEqual(stornoFreigabe({ bediener: "a", datum: "2026-11-04", gesamt_cent: 9000 }, "a", "2026-11-04", false, 5000), ["storno_betrag"]);
  assert.deepEqual(stornoFreigabe({ bediener: "b", datum: "2026-11-01", gesamt_cent: 9000 }, "a", "2026-11-04", true, 5000), []);
  assert.equal(stornoGesperrt({ belegart: "Nullbeleg" }), "belegart");
  assert.equal(stornoGesperrt({ belegart: "Standard", zahlarten: [{ zahlart: "Karte Stripe Terminal" }] }, {}), "karte");
  assert.equal(stornoGesperrt({ belegart: "Standard", zahlarten: [{ zahlart: "Karte Stripe Terminal" }] }, { terminal_erstatten: true }), null);
  assert.equal(stornoGesperrt({ belegart: "Standard", auftrag: "AB-1", zahlarten: [] }, { terminal_erstatten: true }), "ursprung");
  assert.equal(stornoGesperrt({ belegart: "Standard", storniert: true }), "bereits");
});

test("Abschluss: Zählprotokoll, Soll, Differenz, Zustände", () => {
  assert.equal(zaehlprotokollSumme([{ stueckelung_cent: 5000, anzahl: 3 }, { stueckelung_cent: 200, anzahl: 4 }]), 15800);
  assert.throws(() => zaehlprotokollSumme([{ stueckelung_cent: 300, anzahl: 1 }]), /Unbekannte Stückelung/);
  assert.equal(zaehlprotokollAus({ 5000: 2, 1: "3" }).find((z) => z.stueckelung_cent === 1).summe_cent, 3);
  assert.equal(bargeldSoll(15000, 30000, 2000, 5000, 1000), 47000);
  assert.equal(differenzGrundPflichtig(-240, 100), true);
  assert.equal(differenzWort(-240, 100), "Fehlbetrag");
  assert.equal(differenzWort(50, 100), "innerhalb der Toleranz");
  assert.equal(differenzWort(0, 100), "stimmt");
  assert.equal(naechsterStatus("Offen", "zaehlen"), "Gezaehlt");
  assert.throws(() => naechsterStatus("Offen", "abschliessen"));
  const s = sollAusBelegen([
    { belegart: "Standard", gesamt_cent: 10000, bediener: "a", zahlarten: [{ zahlart: "Bar", betrag_cent: 10000 }], positionen: [{ art: "Artikel", steuersatz: "Normal 20", netto_cent: 8333, ust_cent: 1667, brutto_cent: 10000 }] },
    { belegart: "Stornobeleg", gesamt_cent: -10000, bediener: "a", zahlarten: [{ zahlart: "Bar", betrag_cent: -10000 }], positionen: [] },
    { belegart: "Trainingsbeleg", trainings: 1, gesamt_cent: 5000 },
  ]);
  assert.equal(s.bar_einnahmen_cent, 10000);
  assert.equal(s.bar_ausgaben_cent, 10000);
  assert.equal(s.trainings_anzahl, 1);
  assert.equal(s.stornos_anzahl, 1);
  assert.deepEqual(abschlussSchritte({ leitung: false }).map((x) => x.id), ["pruefen", "zaehlen", "uebergeben"]);
  assert.deepEqual(abschlussSchritte({ leitung: true, abschoepfung: true }).map((x) => x.id), ["pruefen", "zaehlen", "differenz", "abschoepfen", "abschliessen"]);
});

test("Bargeld: Zweck, Grundtext mit Projekt, Lade, Tagesstart (E6, E8)", () => {
  assert.ok(zweckeFuer("Entnahme").some((z) => z.id === "ausgabe"));
  assert.ok(zweckeFuer("Einlage").every((z) => z.art === "Einlage"));
  assert.equal(grundText({ zweckId: "ausgabe", grund: "Porto", projekt: "PH-PRJ-2026-0001" }), "Ausgabe: Porto (Projekt PH-PRJ-2026-0001)");
  assert.equal(grundText({ zweckId: "tresor" }), "Geldtransit Tresor");
  assert.equal(inDerLade({ anfang: 15000, barEinnahmen: 5000, barAusgaben: 1000, einlagen: 2000, entnahmen: 3000 }), 18000);
  assert.deepEqual(tagesstart({ letzter: null }), { wert: 0, quelle: "leer" });
  assert.deepEqual(tagesstart({ letzter: { bargeld_ist_cent: 20000, geschlossen_am: "2026-11-03 18:40:00" }, buchungenSeit: [{ art: "Entnahme", betrag_cent: 5000, zeitpunkt: "2026-11-03 18:42:00" }, { art: "Einlage", betrag_cent: 999, zeitpunkt: "2026-11-02 10:00:00" }] }), { wert: 15000, quelle: "formel" });
  assert.deepEqual(tagesstart({ letzter: { bargeld_ende_cent: 12345, bargeld_ist_cent: 1 }, anfangServer: true }), { wert: 12345, quelle: "server" });
  assert.equal(pruefeBuchung({ art: "Entnahme", betragCent: 0, zweckId: "bank" }).fehler, "betrag");
  assert.equal(pruefeBuchung({ art: "Entnahme", betragCent: 100, zweckId: "wechselgeld" }).fehler, "zweck");
  assert.equal(pruefeBuchung({ art: "Entnahme", betragCent: 100, zweckId: "ausgabe" }).fehler, "grund");
  assert.deepEqual(pruefeBuchung({ art: "Entnahme", betragCent: 50000, zweckId: "bank", bestandCent: 1000 }), { fehler: null, warnung: "ueberBestand" });
  assert.equal(pruefeBuchung({ art: "Entnahme", betragCent: 50000, zweckId: "bank", bestandCent: 1000, stoppAbBestand: true }).fehler, "ueberBestand");
  assert.equal(bewegung({ art: "Entnahme", betrag_cent: 500 }), -500);
  assert.equal(bewegung({ art: "Differenz", betrag_cent: -240 }), -240);
});
