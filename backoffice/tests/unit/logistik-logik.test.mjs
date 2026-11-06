// Unit-Tests Bereich Logistik (Team B-LOG): reine Regeln (§ 3, § 5, § 6, § 8 des Konzepts) und Mock-Dienst.
//   node --test tests/unit/logistik-logik.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { statusText, statusTon, phasenSchritte, toeneFuer } from "../../src/lib/backoffice/logistik/status.js";
import { schalter } from "../../src/lib/backoffice/logistik/schalter.js";
import { aenderbareFelder, pruefeAenderung, stornoMoeglich } from "../../src/lib/backoffice/logistik/belegsperre.js";
import { pruefeMengen, restJePosition } from "../../src/lib/backoffice/logistik/rest.js";
import { anzahlungStatus, pruefeOverride, warenwertAnzeige, zahlungsSperre } from "../../src/lib/backoffice/logistik/zahlung.js";
import { tourAuslastung, vorschauDanach } from "../../src/lib/backoffice/logistik/auslastung.js";
import { entnahmeVorschlag } from "../../src/lib/backoffice/logistik/entnahme.js";
import { erkenneLogistikCode } from "../../src/lib/backoffice/logistik/scan.js";
import { fortschritt, gewichtPlausibel, mengePruefen, primaerAktion, sortierePositionen, verpackenPruefen, wendeScanAn } from "../../src/lib/backoffice/logistik/packen.js";
import { abdeckung, abwertungPromille, alterMonate, bewerte, freigabePruefen, inventurFortschritt, plaetzeVorschlagen, platzliste, vierAugenVerletzt } from "../../src/lib/backoffice/logistik/inventur.js";
import { baueTafel, kw, zeitraum } from "../../src/lib/backoffice/logistik/plantafel.js";
import { istLeitung, darfTourMobil } from "../../src/lib/backoffice/logistik/rechte.js";

test("Status: Töne § 3.1 und Anzeige mit Umlaut / Arbeitsschritt", () => {
  assert.equal(statusTon("PH Lieferschein", "Gepackt"), "blau");
  assert.equal(statusTon("PH Sendung", "Etikett"), "blau");
  assert.equal(statusTon("PH Sendung", "Problem"), "rot");
  assert.equal(statusText("PH Lieferschein", "Uebergeben"), "Übergeben");
  assert.equal(statusText("PH Lieferschein", "Zugestellt", { lieferart: "Abholung" }), "Abgeholt");
  assert.equal(statusText("PH Sendung", "Angelegt"), "Ohne Etikett");
  assert.equal(statusText("PH Lagerbestand", "Verfuegbar"), "Verfügbar");
  assert.deepEqual(phasenSchritte("PH Lieferschein", "Gepackt").map((s) => s.zustand), ["erledigt", "aktuell", "offen", "offen"]);
  assert.equal(toeneFuer("PH Inventur").Laufend, "orange");
});

test("Schalter § 3.7: Standard streng, per Text überschreibbar", () => {
  assert.equal(schalter("").anzahlungHart, true);
  assert.equal(schalter("").teilzustellung, false);
  const s = schalter("teilzustellung,-anzahlungHart,unbekannt");
  assert.equal(s.teilzustellung, true);
  assert.equal(s.anzahlungHart, false);
});

test("Belegsperre E13: ab Übergeben nur Notiz intern; Gepackt eingeschränkt; Storno-Regeln", () => {
  assert.equal(aenderbareFelder({ status: "Entwurf" }), "alle");
  assert.ok(aenderbareFelder({ status: "Gepackt", lieferart: "Eigenlieferung" }).has("liefer_ort"));
  assert.ok(!aenderbareFelder({ status: "Gepackt", lieferart: "Versand" }).has("liefer_ort"));
  assert.equal(pruefeAenderung({ status: "Uebergeben" }, { notiz_intern: "x" }).ok, true);
  const r = pruefeAenderung({ status: "Zugestellt" }, { wunschtermin: "2026-11-10" });
  assert.equal(r.ok, false);
  assert.equal(r.code, "forbidden");
  assert.equal(pruefeAenderung({ status: "Entwurf" }, { status: "Gepackt" }).ok, false, "Status nie direkt");
  assert.equal(pruefeAenderung({ status: "Entwurf", auftrag: "AB-1" }, { positionen: [] }).ok, false);
  assert.equal(stornoMoeglich({ status: "Gepackt" }, { leitung: false }).moeglich, false);
  assert.equal(stornoMoeglich({ status: "Gepackt" }, { leitung: true }).moeglich, true);
  assert.equal(stornoMoeglich({ status: "Uebergeben" }, { leitung: true }).moeglich, false);
  assert.match(stornoMoeglich({ status: "Entwurf", teilrechnung: "RE-1" }, { leitung: true }).grund, /Teilrechnung RE-1/);
});

test("Rest E8/E9: offene Lieferscheine zählen mit, Dezimal gesperrt, Überschreitung je Zeile", () => {
  const ab = [
    { name: "p1", idx: 1, art: "Produkt", bezeichnung: "Sofa", menge: 2, lieferschein_menge: 0 },
    { name: "p2", idx: 2, art: "Produkt", bezeichnung: "Stuhl", menge: 8, lieferschein_menge: 4 },
    { name: "p3", idx: 3, art: "Produkt", bezeichnung: "Platte", menge: 2.5, einheit: "lfm", lieferschein_menge: 0 },
    { name: "p4", idx: 4, art: "Text", menge: 1 },
  ];
  const rest = restJePosition({ beleg: "AB-1", positionen: ab, offeneLieferscheine: [{ name: "LS-1", status: "Gepackt", positionen: [{ beleg_position: "p2", menge: 3 }] }, { name: "LS-0", status: "Storniert", positionen: [{ beleg_position: "p1", menge: 2 }] }] });
  assert.equal(rest.length, 3, "Textzeilen nicht lieferbar");
  assert.equal(rest.find((r) => r.schluessel === "p1").rest, 2);
  assert.equal(rest.find((r) => r.schluessel === "p2").rest, 1);
  assert.ok(rest.find((r) => r.schluessel === "p3").dezimal);
  const p = pruefeMengen(rest, { p1: 2, p2: 2, p3: 1 });
  assert.equal(p.ok, false);
  assert.match(p.fehler.find((f) => f.schluessel === "p2").text, /nur noch 1 offen \(3 in LS-1\)/);
  assert.match(p.fehler.find((f) => f.schluessel === "p3").text, /noch nicht abbilden/);
  assert.equal(pruefeMengen(rest, {}).fehler[0].text, "Mindestens eine Position mit Menge > 0.");
  assert.deepEqual(pruefeMengen(rest, { p1: 1 }).positionen, [{ schluessel: "p1", menge: 1 }]);
});

test("Zahlung E10/E11: Anzahlung sperrt, Shop nur mit bezahlt_am, Override nur Leitung mit Grund, Fremdwährung", () => {
  assert.equal(anzahlungStatus({ anzahlung_soll_cent: 300000, anzahlung_ist_cent: 180000 }).fehltCent, 120000);
  assert.equal(zahlungsSperre({ ab: { anzahlung_soll_cent: 1, anzahlung_ist_cent: 0 } }).gesperrt, true);
  assert.equal(zahlungsSperre({ ab: { anzahlung_soll_cent: 1, anzahlung_ist_cent: 0 }, schalter: { anzahlungHart: false } }).gesperrt, false);
  assert.equal(zahlungsSperre({ bestellung: { bezahlt_am: "", offen_cent: 0 }, aktion: "ausgeben" }).art, "bezahlung");
  assert.equal(zahlungsSperre({ bestellung: { bezahlt_am: "2026-11-01", offen_cent: 0 }, aktion: "ausgeben" }).gesperrt, false);
  assert.equal(pruefeOverride({ leitung: false, grund: "ausreichend" }).code, "forbidden");
  assert.equal(pruefeOverride({ leitung: true, grund: "kurz" }).code, "invalid");
  assert.equal(pruefeOverride({ leitung: true, grund: "Kunde zahlt bar nach" }).ok, true);
  assert.deepEqual(warenwertAnzeige({ warenwert_cent: 100 }, { waehrung: "CHF" }), { cent: null, text: "in CHF – siehe AB" });
});

test("Auslastung: kg gegen Zuladung, Überschreitung mit Text, Volumen unbekannt, Vorschau danach", () => {
  const ls = [{ gesamtgewicht_g: 412000, pakete: [{ laenge_cm: 100, breite_cm: 100, hoehe_cm: 100, gewicht_g: 1 }] }, { gesamtgewicht_g: 0, pakete: [] }];
  const a = tourAuslastung(ls, { zuladung_kg: 1100 });
  assert.equal(a.kg, 412);
  assert.match(a.text, /412 \/ 1\D?100 kg/);
  assert.match(a.volumenText, /Volumen unbekannt \(1\)/);
  const v = vorschauDanach(ls, { zuladung_kg: 450 }, { gesamtgewicht_g: 120000 });
  assert.equal(v.ueber, true);
  assert.match(v.warnText, /Zuladung überschritten um 82 kg/);
  assert.match(v.text, /^\+120 kg →/);
});

test("Entnahme: SN zuerst, reserviert, Kommission, Lagerort; nie gesperrt", () => {
  const b = [
    { name: "B1", produkt: "x", lagerort: "Lager", status: "Verfuegbar", verfuegbar: 5, menge: 5 },
    { name: "B2", produkt: "x", lagerort: "Showroom", status: "Gesperrt", gesperrt: 1, verfuegbar: 0, menge: 1, seriennummer: "SN-1" },
    { name: "B3", produkt: "x", lagerort: "Showroom", status: "Verfuegbar", verfuegbar: 1, menge: 1, seriennummer: "SN-2" },
  ];
  assert.equal(entnahmeVorschlag({ produkt: "x", seriennummer: "SN-2", menge: 1 }, b).lagerbestand, "B3");
  assert.notEqual(entnahmeVorschlag({ produkt: "x", seriennummer: "SN-1", menge: 1 }, b).lagerbestand, "B2");
  assert.equal(entnahmeVorschlag({ produkt: "x", menge: 2 }, b, { packtischLagerort: "Lager" }).lagerbestand, "B1");
  assert.equal(entnahmeVorschlag({ produkt: "y", menge: 1 }, b).text, "Ort unbekannt");
});

test("Scan: Lieferschein, Abholcode, Platz, Kommission, EAN, SN", () => {
  assert.equal(erkenneLogistikCode("LS-2026-00138").art, "lieferschein");
  assert.equal(erkenneLogistikCode("K7M2QX").art, "abholcode");
  const p = erkenneLogistikCode("Lager Lochau/R-12");
  assert.equal(p.art, "platz");
  assert.equal(p.platz, "R-12");
  assert.equal(erkenneLogistikCode("KOM:PH-PRJ-2026-0003").art, "kommission");
  assert.equal(erkenneLogistikCode("9008564001019").art, "artikel");
  assert.equal(erkenneLogistikCode("SN-0441").art, "seriennummer");
  assert.equal(erkenneLogistikCode("").art, "unbekannt");
});

test("Packen (JTL M2/M3/M7/M8): Scan, Menge > 1 bestätigen, vollständig, unbekannt, Sortierung, Primärtaste", () => {
  const pos = [
    { name: "a", beschreibung: "Glas", ean: "9008564001019", menge: 6, menge_gepackt: 4 },
    { name: "b", beschreibung: "Plaid", ean: "", menge: 1, menge_gepackt: 0 },
    { name: "c", beschreibung: "Bell", ean: "5056394707181", menge: 1, menge_gepackt: 1 },
  ];
  assert.equal(wendeScanAn(pos, "123", 1).ergebnis, "unbekannt");
  assert.equal(wendeScanAn(pos, "5056394707181", 1).ergebnis, "vollstaendig");
  assert.equal(wendeScanAn(pos, "9008564001019", 2).ergebnis, "bestaetigen");
  assert.equal(wendeScanAn(pos, "9008564001019", 3, { bestaetigt: true }).ergebnis, "zu_viel");
  const r = wendeScanAn(pos, "9008564001019", 2, { bestaetigt: true });
  assert.equal(r.ergebnis, "erkannt");
  assert.equal(r.positionen.find((p) => p.name === "a").menge_gepackt, 6);
  assert.equal(mengePruefen(pos[0], 0).fehler, "ungueltig");
  assert.deepEqual(sortierePositionen(pos, "a").map((p) => p.name), ["a", "b", "c"], "erledigte nach unten, aktive oben");
  const f = fortschritt(pos);
  assert.equal(f.fertig, 1);
  assert.equal(f.stueck, 5);
  assert.equal(primaerAktion({ lieferart: "Versand" }).id, "verpacken");
  assert.equal(primaerAktion({ lieferart: "Abholung" }).verzoegert, true);
  assert.equal(primaerAktion({ lieferart: "Eigenlieferung", tour: "T" }).titel, "An Tour übergeben");
});

test("Packen: Gewicht-Plausibilität und Verpacken-Prüfung wie packtisch_regeln", () => {
  assert.equal(gewichtPlausibel(0, 6700).grund, "gewicht_fehlt");
  assert.equal(gewichtPlausibel(6800, 6700).ok, true);
  assert.equal(gewichtPlausibel(9800, 6700).grund, "abweichung");
  assert.equal(gewichtPlausibel(21000, 0, { maxG: 20000 }).grund, "ueber_profilgrenze");
  assert.deepEqual(verpackenPruefen({ positionen: [{ menge: 1, menge_gepackt: 1 }], pakete: [{ paket_nr: 1, gewicht_g: 0 }], lieferart: "Versand" }), ["gewicht_paket_1"]);
  assert.deepEqual(verpackenPruefen({ positionen: [{ menge: 2, menge_gepackt: 1 }], pakete: [], lieferart: "Eigenlieferung", teillieferung: true }), []);
  assert.ok(verpackenPruefen({ positionen: [{ menge: 2, menge_gepackt: 1 }], pakete: [], lieferart: "Eigenlieferung" }).includes("nicht_alles_gepackt"));
});

test("Inventur: Fortschritt, Vier-Augen, Grund-Pflicht, Bewegungen seit Zählbeginn", () => {
  const inv = { status: "Laufend", gezaehlt_von: "a@x", positionen: [{ soll: 5, ist: 4, gezaehlt: 1, grund: "" }, { soll: 2, ist: 2, gezaehlt: 1 }, { soll: 1, gezaehlt: 0 }] };
  const f = inventurFortschritt(inv.positionen);
  assert.deepEqual([f.gezaehlt, f.offen, f.differenzen, f.ohneGrund, f.summeDifferenz], [2, 1, 1, 1, -1]);
  assert.equal(vierAugenVerletzt("a@x", "a@x"), true);
  assert.equal(vierAugenVerletzt("Administrator", "Administrator"), false);
  const p = freigabePruefen({ inventur: inv, benutzer: "a@x", leitung: true, bewegungenSeitStart: [{ name: "B" }] });
  assert.equal(p.darf, false);
  assert.deepEqual(p.gruende.map((g) => g.code).sort(), ["bewegungen", "grund", "vier-augen"]);
  inv.positionen[0].grund = "Schwund";
  const ok = freigabePruefen({ inventur: inv, benutzer: "b@x", leitung: true });
  assert.equal(ok.darf, true);
  assert.match(ok.zusammenfassung, /1 ungezählte bleiben unverändert/);
});

test("Teilinventur und Bewertung: Platzvorschlag, Abdeckung, Staffel, Niederstwert", () => {
  const plaetze = [{ lagerort: "L", platz: "R-01", zuletzt: "2026-03-01" }, { lagerort: "L", platz: "R-02", zuletzt: null }, { lagerort: "L", platz: "R-03", zuletzt: "2025-06-01" }];
  assert.deepEqual(plaetzeVorschlagen(plaetze, "2026-11-04", 1, 2).map((p) => p.platz), ["R-02", "R-03"]);
  const a = abdeckung(plaetze, "2026-11-04", 1);
  assert.equal(a.gezaehlt, 1);
  assert.equal(a.gesamt, 3);
  assert.ok(a.rueckstand >= 1);
  assert.deepEqual(platzliste("R-01\nR-01, R-02\n\n"), ["R-01", "R-02"]);
  assert.equal(alterMonate("2025-11-05", "2026-11-04"), 11);
  assert.equal(abwertungPromille("Ausstellungsstueck", 13), 400);
  assert.equal(abwertungPromille("Lagerware", 12), 0);
  const w = bewerte(2, 10000, 200, 7000);
  assert.deepEqual([w.einzelwert_cent, w.wert_cent, w.niederstwert], [7000, 14000, true]);
});

test("Plantafel: Zeitraum, KW, Raster, Warnungen, Ablage", () => {
  assert.deepEqual(zeitraum("woche", "2026-11-04").tage, ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
  assert.equal(zeitraum("3tage", "2026-11-06").tage[1], "2026-11-09", "Wochenende übersprungen");
  assert.equal(kw("2026-11-04"), 45);
  const t = baueTafel({
    tage: ["2026-11-05"],
    fahrzeuge: [{ name: "FZ", bezeichnung: "Sprinter", zuladung_kg: 1100, aktiv: 1 }],
    touren: [{ name: "T1", datum: "2026-11-05", fahrzeug: "FZ", fahrer: "", status: "Geplant", stopps: [{ lieferschein: "L1" }] }],
    lieferscheine: [{ name: "L1", status: "Entwurf", lieferart: "Eigenlieferung", gesamtgewicht_g: 100000, tour: "T1" }, { name: "L2", status: "Gepackt", lieferart: "Spedition", tour: "" }, { name: "L3", status: "Gepackt", lieferart: "Versand", tour: "" }],
  });
  assert.equal(t.zeilen[0].zellen[0].touren.length, 1);
  assert.ok(t.karten[0].warnungen.includes("Kein Fahrer"));
  assert.ok(t.karten[0].warnungen.includes("Lieferschein noch nicht gepackt"));
  assert.deepEqual(t.ablage.ohneTour.map((l) => l.name), ["L2"], "Versand fährt nie auf Touren");
});

test("Rechte: Leitung, Montage nur eigene Touren", () => {
  assert.equal(istLeitung({ roles: ["PH Logistik Mitarbeiter"] }), false);
  assert.equal(istLeitung({ roles: ["PH Geschäftsführung"] }), true);
  const tour = { fahrer: "m@x", team: [{ user: "t@x" }] };
  assert.equal(darfTourMobil({ user: "t@x", roles: ["PH Montage"] }, tour), true);
  assert.equal(darfTourMobil({ user: "z@x", roles: ["PH Montage"] }, tour), false);
});
