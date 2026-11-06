// Zentrale (Team B-ZEN): Rollenplan, Fristen, buchhalterische Kennzahlen, Aufgabenquellen, Titel-Parser,
// Projekte-Ableitungen, Kalkulationsprüfung, Texte. node --test tests/unit/zentrale-logik.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { gruss, plan, primaerAktion, spaltenJeReihe, variante, vorname } from "../../src/lib/backoffice/zentrale/layout.js";
import { depChip, erstattungChip, jahresbelegChip, ordneChips, ossChip, seeChip, tageZwischen, uvaChip } from "../../src/lib/backoffice/zentrale/fristen.js";
import { kassaHeute, letzteMonate, offenePosten, trendProzent, umsatzMonatNetto, zahlungseingangMonat } from "../../src/lib/backoffice/zentrale/umsatz.js";
import { faelligAnzeige, filtere, fuehreZusammen, parseTitel, todoTitel, zaehleFaellig } from "../../src/lib/backoffice/zentrale/aufgaben.js";
import { fortschritt, naechsterSchritt, projektBild, team } from "../../src/lib/backoffice/zentrale/projekte.js";
import { pruefeKalkulation } from "../../src/lib/backoffice/zentrale/dienste.js";
import { mockTodos, setzeMockTodo, setzeMockZurueck } from "../../src/lib/backoffice/zentrale/mock.js";
import { alleTexte } from "../../src/lib/backoffice/zentrale/texte.js";

const s = (...roles) => ({ user: "x@demo.local", roles });

test("Variante je Rolle (Konzept § 3.2.5)", () => {
  assert.equal(variante(s("PH Backoffice-Admin", "System Manager")), "admin");
  assert.equal(variante(s("PH Geschäftsführung")), "gf");
  assert.equal(variante(s("PH CRM Leitung", "PH CRM Mitarbeiter")), "leitung");
  assert.equal(variante(s("PH CRM Mitarbeiter")), "mitarbeiter");
  assert.equal(variante(s("PH Buchhaltung extern")), "extern");
  assert.equal(variante(s("PH Personal Selbstservice")), "selbst");
  assert.equal(variante(s("PH Kassa Mitarbeiter")), "kiosk");
  assert.equal(variante(s("PH Montage", "PH Personal Selbstservice")), "kiosk");
});

test("Bento-Plan: jede Reihe geht auf 12 auf, keine Kachel doppelt (alle Rollen, Rechte- und Akzent-Varianten)", () => {
  const rollen = [["PH Backoffice-Admin"], ["PH Geschäftsführung"], ["PH CRM Leitung"], ["PH CRM Mitarbeiter"], ["PH Faktura Leitung"], ["PH Logistik Mitarbeiter"], ["PH Buchhaltung extern"], ["PH Personal Selbstservice"], ["PH Kassa Mitarbeiter"], ["PH Marketing Mitarbeiter"]];
  const sichten = [() => true, () => false, (b) => b === "crm", (b) => b === "faktura", (b) => b === "projekte"];
  for (const r of rollen)
    for (const sicht of sichten)
      for (const akzente of [0, 1, 2])
        for (const kennzahlen of [0, 3]) {
          const p = plan(s(...r), { sicht, akzente, kennzahlen });
          for (const summe of spaltenJeReihe(p)) assert.equal(summe, 12, `${r} akz ${akzente} kz ${kennzahlen}: ${JSON.stringify(p)}`);
          const ids = p.flat().map((k) => k.id);
          assert.equal(new Set(ids).size, ids.length, `doppelt: ${ids}`);
        }
});

test("Kanzlei: nur drei Kacheln, keine Aufgaben/Aktivität (Z-66)", () => {
  const ids = plan(s("PH Buchhaltung extern")).flat().map((k) => k.id);
  assert.deepEqual(ids, ["extern-export", "extern-posten", "extern-kassa"]);
});

test("Primäraktion fest je Rolle, Rückfall bei fehlendem Recht", () => {
  assert.equal(primaerAktion(s("PH CRM Mitarbeiter")).titel, "Neue Anfrage");
  assert.equal(primaerAktion(s("PH Faktura Leitung")).titel, "Neue Rechnung");
  assert.equal(primaerAktion(s("PH CRM Mitarbeiter"), (p) => p.doctype !== "PH Anfrage").titel, "Neue Aufgabe");
  assert.equal(primaerAktion(s("PH CRM Mitarbeiter"), () => false), null);
});

test("Begrüßung nach Wiener Uhrzeit, Vorname ohne Rollenklammer", () => {
  assert.equal(gruss(new Date("2026-11-04T07:00:00Z")), "Guten Morgen");
  assert.equal(gruss(new Date("2026-11-04T12:00:00Z")), "Guten Tag");
  assert.equal(gruss(new Date("2026-11-04T19:30:00Z")), "Guten Abend");
  assert.equal(vorname("Erika Beispiel (Admin)"), "Erika");
  assert.equal(vorname("Dr. Miriam Köhler"), "Miriam");
});

test("UVA: 5 Tage vorher sichtbar, rot ≤ 2 Tage, weg mit übergebenem Export-Lauf (Z-67)", () => {
  assert.equal(uvaChip("2026-11-09"), null);
  const c = uvaChip("2026-11-10");
  assert.equal(c.text, "UVA September fällig 15.11.");
  assert.equal(c.ton, "sand");
  assert.equal(uvaChip("2026-11-13").ton, "rot");
  assert.equal(uvaChip("2026-11-12", [{ zeitraum_bis: "2026-09-30", status: "Uebergeben" }]), null);
  assert.ok(uvaChip("2026-11-12", [{ zeitraum_bis: "2026-09-30", status: "Erzeugt" }]));
  assert.equal(uvaChip("2027-01-11").text, "UVA November fällig 15.01.");
  assert.equal(tageZwischen("2026-12-30", "2027-01-02"), 3);
});

test("OSS, Jahresbeleg, SEE, DEP, Erstattung", () => {
  assert.equal(ossChip("2026-10-25", () => true).text, "OSS Q3 fällig 31.10.");
  assert.equal(ossChip("2026-10-25", () => false), null);
  assert.equal(ossChip("2026-10-01", () => true), null);
  assert.equal(jahresbelegChip("2027-01-20").ton, "sand");
  assert.equal(jahresbelegChip("2027-02-11").ton, "rot");
  assert.equal(jahresbelegChip("2027-02-16"), null);
  assert.equal(jahresbelegChip("2027-01-20", true), null);
  assert.equal(seeChip(0), null);
  assert.equal(seeChip(2).text, "2 SEE-Ausfälle melden");
  assert.ok(depChip("2026-11-04", "2026-09-30"));
  assert.equal(depChip("2026-11-04", "2026-10-02 10:00:00"), null);
  assert.equal(erstattungChip("2026-11-04", [{ erstattung_bis: "2026-11-07", status: "Ware erhalten" }, { erstattung_bis: "2026-11-08", status: "Ware erhalten" }, { erstattung_bis: "2026-11-01", status: "Erstattet" }]).anzahl, 1);
});

test("Heute-Leiste: nur > 0, rot vor Sand vor neutral, max. 6 + Rest", () => {
  const c = [{ id: "a", anzahl: 1, ton: "sand" }, { id: "b", anzahl: 0, ton: "rot" }, { id: "c", anzahl: 2, ton: "rot" }, { id: "d", anzahl: 1, ton: "neutral" }];
  assert.deepEqual(ordneChips(c).sichtbar.map((x) => x.id), ["c", "a", "d"]);
  const viele = Array.from({ length: 9 }, (_, i) => ({ id: `x${i}`, anzahl: 1, ton: "sand" }));
  assert.equal(ordneChips(viele).mehr, 3);
});

test("Umsatz Monat netto: ohne Anzahlung/Storno/Entwurf, CHF über Kurs, minus Gutschriften (Z-54)", () => {
  const r = [
    { docstatus: 1, status: "Bezahlt", art: "Rechnung", netto_cent: 100000, leistungsdatum: "2026-10-03" },
    { docstatus: 1, status: "Gestellt", art: "Anzahlungsrechnung", netto_cent: 50000, leistungsdatum: "2026-10-05" },
    { docstatus: 1, status: "Storniert", art: "Rechnung", netto_cent: 70000, leistungsdatum: "2026-10-06" },
    { docstatus: 0, status: "Entwurf", art: "Rechnung", netto_cent: 90000, leistungsdatum: "2026-10-06" },
    { docstatus: 1, status: "Gestellt", art: "Rechnung", netto_cent: 10000, waehrung: "CHF", kurs: 1.05, datum: "2026-10-20" },
    { docstatus: 1, status: "Gestellt", art: "Schlussrechnung", netto_cent: 20000, leistungsdatum: "2026-09-30" },
  ];
  const g = [{ docstatus: 1, netto_cent: 5000, datum: "2026-10-10" }, { docstatus: 0, netto_cent: 9999, datum: "2026-10-11" }];
  const e = umsatzMonatNetto("2026-10", r, g);
  assert.equal(e.cent, 100000 + 10500 - 5000);
  assert.equal(e.chf, true);
  assert.equal(umsatzMonatNetto("2026-10", [{ docstatus: 1, art: "Rechnung", status: "Gestellt", netto_cent: 100, waehrung: "CHF", datum: "2026-10-01" }]).ohneKurs, 1);
});

test("Zahlungseingang: livemode, Erstattung abgezogen, Anzahlungen getrennt (Z-55)", () => {
  const z = [
    { livemode: 1, art: "Eingang", status: "Bezahlt", betrag_eur: 120, zeitpunkt: "2026-10-02 10:00:00", anz: true },
    { livemode: 0, art: "Eingang", status: "Bezahlt", betrag_eur: 999, zeitpunkt: "2026-10-02 10:00:00" },
    { livemode: 1, art: "Erstattung", status: "Bezahlt", betrag_eur: 20, zeitpunkt: "2026-10-03 10:00:00" },
    { livemode: 1, art: "Eingang", status: "Fehlgeschlagen", betrag_eur: 50, zeitpunkt: "2026-10-03 10:00:00" },
  ];
  assert.deepEqual(zahlungseingangMonat("2026-10", z, { istAnzahlung: (x) => !!x.anz }), { cent: 10000, anzahlungenCent: 12000 });
});

test("Offene Posten ohne Anzahlungsrechnungen, getrennt ausgewiesen (Z-56)", () => {
  const r = [
    { status: "Gestellt", art: "Rechnung", offen_cent: 1000, faellig: "2026-12-01" },
    { status: "Ueberfaellig", art: "Rechnung", offen_cent: 500 },
    { status: "Gestellt", art: "Anzahlungsrechnung", offen_cent: 3000 },
    { status: "Bezahlt", art: "Rechnung", offen_cent: 0 },
  ];
  assert.deepEqual(offenePosten(r, "2026-11-04"), { cent: 1500, anzahl: 2, ueberfaellig: 1, anzahlungenCent: 3000 });
});

test("Kassa heute: ohne Training/Null/Start/Monat/Jahr/Schluss, Storno negativ (Z-57)", () => {
  const b = [
    { belegart: "Standard", status: "Signiert", gesamt_cent: 1000, datum_uhrzeit: "2026-11-04 10:00:00" },
    { belegart: "Stornobeleg", status: "Signiert", gesamt_cent: -300, datum_uhrzeit: "2026-11-04 11:00:00" },
    { belegart: "Standard", status: "Signiert", gesamt_cent: 5000, trainings: 1, datum_uhrzeit: "2026-11-04 11:00:00" },
    { belegart: "Nullbeleg", status: "Signiert", gesamt_cent: 0, datum_uhrzeit: "2026-11-04 08:00:00" },
    { belegart: "Monatsbeleg", status: "Signiert", gesamt_cent: 0, datum_uhrzeit: "2026-11-04 08:00:00" },
    { belegart: "Standard", status: "Entwurf", gesamt_cent: 700, datum_uhrzeit: "2026-11-04 08:00:00" },
    { belegart: "Standard", status: "Signiert", gesamt_cent: 900, datum_uhrzeit: "2026-11-03 08:00:00" },
  ];
  assert.deepEqual(kassaHeute(b, "2026-11-04"), { cent: 700, belege: 1, stornos: 1 });
});

test("Monatsliste und Trend", () => {
  assert.deepEqual(letzteMonate("2026-02-10", 3), ["2025-12", "2026-01", "2026-02"]);
  assert.equal(trendProzent(110, 100), 10);
  assert.equal(trendProzent(5, 0), null);
});

test("Aufgaben aus zwei Quellen: ToDo zu PH Aufgabe und zu offener Freigabe entfällt, überfällig zuerst (Z-69)", () => {
  const a = [
    { name: "A1", titel: "Später", status: "Offen", faellig: "2026-11-10" },
    { name: "A2", titel: "Alt", status: "Offen", faellig: "2026-11-01" },
  ];
  const t = [
    { name: "T1", description: "<p>Lieferschein prüfen</p><p>Zeile 2</p>", status: "Open", date: "2026-11-04", reference_type: "PH Lieferschein", reference_name: "LS-1" },
    { name: "T2", description: "Spiegel", status: "Open", reference_type: "PH Aufgabe", reference_name: "A1" },
    { name: "T3", description: "Kulanz", status: "Open", reference_type: "PH Servicefall", reference_name: "S-1" },
  ];
  const z = fuehreZusammen(a, t, { heute: "2026-11-04", freigabeObjekte: new Set(["PH Servicefall::S-1"]) });
  assert.deepEqual(z.map((x) => x.name), ["A2", "T1", "A1"]);
  assert.equal(z[1].titel, "Lieferschein prüfen");
  assert.equal(z[1].system, true);
  assert.deepEqual(zaehleFaellig(z, "2026-11-04"), { ueberfaellig: 1, heute: 1 });
  assert.equal(todoTitel("&amp; <b>fett</b>"), "& fett");
});

test("Fällig-Anzeige und Filter", () => {
  assert.deepEqual(faelligAnzeige("2026-11-04", "2026-11-04"), { text: "heute", ton: "sand", ueberfaellig: false });
  assert.equal(faelligAnzeige("2026-11-02", "2026-11-04").text, "vor 2 Tagen");
  assert.equal(faelligAnzeige("2026-11-06", "2026-11-04").text, "Fr. 6.11.");
  const z = [{ titel: "Rückruf Huber", status: "Offen", faellig: "2026-11-03", name: "A" }, { titel: "Muster", status: "Erledigt", faellig: "2026-11-05", name: "B" }];
  assert.equal(filtere(z, { frist: "ueberfaellig", heute: "2026-11-04" }).length, 1);
  assert.equal(filtere(z, { status: ["Erledigt"] })[0].name, "B");
  assert.equal(filtere(z, { q: "huber" }).length, 1);
});

test("Titel-Parser nur am Ende, Datum im Satz bleibt Text (Z-38)", () => {
  const ctx = { heute: "2026-11-04", personen: [{ user: "lena@x", name: "Lena Moosbrugger" }] };
  assert.deepEqual(parseTitel("Lieferung 12.11. bestätigen", ctx).titel, "Lieferung 12.11. bestätigen");
  assert.equal(parseTitel("Lieferung 12.11. bestätigen", ctx).faellig, null);
  const p = parseTitel("Rückruf Huber +3", ctx);
  assert.equal(p.titel, "Rückruf Huber");
  assert.equal(p.faellig, "2026-11-07");
  const q = parseTitel("Angebot senden @lena morgen", ctx);
  assert.equal(q.titel, "Angebot senden");
  assert.equal(q.zustaendig, "lena@x");
  assert.equal(q.faellig, "2026-11-05");
  assert.equal(parseTitel("Mail an anna@firma.at", ctx).titel, "Mail an anna@firma.at");
  assert.equal(parseTitel("Termin fr", ctx).faellig, "2026-11-06");
  assert.equal(parseTitel("Inventur 3.1.", ctx).faellig, "2027-01-03");
  assert.equal(parseTitel("+3", ctx).titel, "+3", "einzelnes Wort bleibt Titel");
});

test("Projekte: Fortschritt, nächster Schritt, Team, Raumbild nur als Symbol", () => {
  assert.equal(fortschritt("Anfrage"), 0);
  assert.equal(fortschritt("Uebergabe"), 100);
  assert.equal(naechsterSchritt({ status: "Montage", montage_von: "2026-11-12" }), "Montage ab 12.11.");
  assert.equal(naechsterSchritt({ status: "Bestellung" }), "Liefertermin bestätigen");
  assert.deepEqual(team({ berater: "a", planer: "a", montageleiter: "b" }), ["a", "b"]);
  assert.equal(projektBild({ projektart: "Kueche" }).symbol, true);
  assert.equal(projektBild({ projektart: "Bad", titel: "X" }, "/files/x.jpg").symbol, false);
});

test("Kalkulation: Prüfregeln wie ph_projekte (doppelte Gültigkeit, 0–100 %, gelb vor rot)", () => {
  assert.deepEqual(pruefeKalkulation({ kostensaetze: [{ taetigkeit: "Montage", satz_cent: 5800, gueltig_ab: "2026-01-01" }] }), []);
  const f = pruefeKalkulation({
    kostensaetze: [{ taetigkeit: "Montage", gueltig_ab: "2026-01-01" }, { taetigkeit: "Montage", gueltig_ab: "2026-01-01" }],
    ziel_db: [{ projektart: "Kueche", ziel_db1: 140, gueltig_ab: "2026-01-01" }],
    gemeinkosten: [{ projektart: "Alle", art: "Unbekannt", gueltig_ab: "" }],
    schwellen: { budget_gelb_prozent: 110, budget_rot_prozent: 100 },
  });
  assert.ok(f.some((x) => /doppelt/.test(x)));
  assert.ok(f.some((x) => /0–100/.test(x)));
  assert.ok(f.some((x) => /Zuschlagsart/.test(x)));
  assert.ok(f.some((x) => /Gültig ab fehlt/.test(x)));
  assert.ok(f.some((x) => /Budget gelb/.test(x)));
});

test("Mock-ToDo: Erledigen und Rückgängig, fremde Aufgabe gesperrt", () => {
  setzeMockZurueck();
  const gf = { user: "gf@demo.local", roles: ["PH CRM Mitarbeiter"] };
  const vorher = mockTodos(gf).length;
  assert.ok(vorher > 0);
  const r = setzeMockTodo("TODO-MOCK-0001", "Closed", gf);
  assert.deepEqual(r, { ok: true, alt: "Open" });
  assert.equal(mockTodos(gf).length, vorher - 1);
  setzeMockTodo("TODO-MOCK-0001", "Open", gf);
  assert.equal(mockTodos(gf).length, vorher);
  assert.equal(setzeMockTodo("TODO-MOCK-0003", "Closed", gf).code, "forbidden");
  setzeMockZurueck();
});

test("Texte: keine Superlative, keine Ausrufezeichen, keine Umschreibungen, keine Frappe-Begriffe (Q-K2, Z-35)", () => {
  const alle = alleTexte();
  assert.ok(alle.length > 200);
  for (const t of alle) {
    assert.ok(!t.includes("!"), t);
    assert.ok(!/\b(beste[nrms]?|bestens|perfekt\w*|optimal\w*|einzigartig\w*|super|erfolgreich\w*)\b/i.test(t), t);
    assert.ok(!/\b(DocType|Frappe|Submit|snake_case)\b/.test(t), t);
    assert.ok(!/(fuer|ueber|Ueber|aender|Aender|koenn|moeg|faell|Faell|pruef|Pruef|aeft|loesch|Loesch|oeffn|Oeffn|zurueck|Rueck|rueck|wuensch|Schliess|schliess|groess|Massnahme|Geraet|geraet|Gebuehr|waehl|Waehl|erklaer|naechst|Naechst|Kueche|Buero|Aufmass)/.test(t), `Umschreibung statt Umlaut: ${t}`);
  }
});
