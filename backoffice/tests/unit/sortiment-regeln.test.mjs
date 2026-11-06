// Bereich Sortiment – reine Regeln (10-konzept-sortiment § 20.8): Checkliste, gültig bis mit Monatsende,
// Tiefstpreis 30 Tage, brutto/netto, Restmengen mit stornierten Positionen, AB-Abgleich mit Toleranzen,
// Sperrgründe je Rolle, Löschen nur bei Entwürfen, EAN, Händlerwörter, Bestellkette.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as R from "../../src/lib/backoffice/sortiment/regeln.js";

const marke = { status: "Aktiv", haendlerstatus: "Haendler" };
const kategorie = { ust_klasse: "normal", grundpreis_pflicht: 0 };
const fertig = { status: "Geprueft", marke: "Bora", kategorie: "Kochfelder", kurz_de: "Text", bild_freigegeben: 1, aktueller_preis_cent: 10000 };

test("gültig bis: Stand + Monate je Preisart, Monatsende korrekt", () => {
  assert.equal(R.gueltigBis("2026-01-31", "Verkaufspreis", { preis_max_monate_verkaufspreis: 1 }), "2026-02-28");
  assert.equal(R.gueltigBis("2026-03-15", "UVP", {}), "2026-09-15");
  assert.equal(R.gueltigBis("2026-03-15", "Verkaufspreis", {}), "2027-03-15");
  assert.equal(R.gueltigBis("", "UVP"), null);
  assert.equal(R.plusMonate("2028-01-31", 1), "2028-02-29");
});

test("Preiszustand: kein · Anfrage · ok · läuft ab · veraltet", () => {
  const jetzt = new Date(2026, 10, 4);
  assert.equal(R.preisZustand({ aktueller_preis_cent: 0 }, { jetzt }).art, "kein");
  assert.equal(R.preisZustand({ preisart: "Auf Anfrage" }, { jetzt }).art, "anfrage");
  assert.equal(R.preisZustand({ aktueller_preis_cent: 100, aktueller_preis_stand: "2026-10-01", preisart: "Verkaufspreis" }, { jetzt }).art, "ok");
  assert.equal(R.preisZustand({ aktueller_preis_cent: 100, aktueller_preis_stand: "2025-11-20", preisart: "Verkaufspreis" }, { jetzt }).art, "laeuftAb");
  assert.equal(R.preisZustand({ aktueller_preis_cent: 100, aktueller_preis_stand: "2026-10-01", preisstand_alt: 1 }, { jetzt }).art, "veraltet");
  assert.equal(R.preisZustand({ aktueller_preis_cent: 100, aktueller_preis_stand: "2026-01-01", preisart: "UVP" }, { jetzt }).art, "veraltet");
});

test("Tiefstpreis 30 Tage: nur freigegebene, je Ausführung, null ohne 30 Tage Geschichte", () => {
  const heute = new Date(2026, 10, 4);
  const preise = [
    { ab: "2026-09-01", brutto_cent: 1000, freigegeben: 1, preisart: "Verkaufspreis" },
    { ab: "2026-10-20", brutto_cent: 900, freigegeben: 1, preisart: "Verkaufspreis" },
    { ab: "2026-10-25", brutto_cent: 800, freigegeben: 0, preisart: "Verkaufspreis" },
    { ab: "2026-10-26", brutto_cent: 700, freigegeben: 1, preisart: "Angebot" },
    { ab: "2026-09-01", brutto_cent: 500, freigegeben: 1, preisart: "Verkaufspreis", ausfuehrung: "x" },
  ];
  assert.equal(R.tiefstpreis30(preise, { heute }), 900);
  assert.equal(R.tiefstpreis30(preise, { heute, ausfuehrung: "x" }), 500);
  assert.equal(R.tiefstpreis30([{ ab: "2026-10-20", brutto_cent: 900, freigegeben: 1 }], { heute }), null);
});

test("brutto/netto mit 20/13/10 %, USt-Klasse ohne Raten", () => {
  assert.equal(R.bruttoZuNetto(12000, 20), 10000);
  assert.equal(R.bruttoZuNetto(11300, 13), 10000);
  assert.equal(R.bruttoZuNetto(11000, 10), 10000);
  assert.equal(R.nettoZuBrutto(10000, 20), 12000);
  assert.equal(R.ustSatz("normal"), 20);
  assert.equal(R.ustSatz("13"), 13);
  assert.equal(R.ustSatz("ermaessigt"), null);
});

test("Checkliste und Sperrgründe: Team darf nicht veröffentlichen, fehlende Punkte im Klartext", () => {
  assert.equal(R.sperrgrund(fertig, "Veröffentlichen", { marke, kategorie, leitung: false }), "Nur Leitung Sortiment");
  assert.equal(R.sperrgrund(fertig, "Veröffentlichen", { marke, kategorie, leitung: true }), null);
  assert.match(R.sperrgrund({ ...fertig, bild_freigegeben: 0 }, "Veröffentlichen", { marke, kategorie, leitung: true }), /freigegebenes Bild/);
  assert.match(R.sperrgrund(fertig, "Veröffentlichen", { marke: { status: "Pausiert" }, kategorie, leitung: true }), /Marke aktiv/);
  assert.match(R.sperrgrund(fertig, "Veröffentlichen", { marke, kategorie: { ust_klasse: "ermaessigt" }, leitung: true }), /USt-Satz/);
  assert.match(R.sperrgrund(fertig, "Veröffentlichen", { marke, kategorie: { ust_klasse: "normal", grundpreis_pflicht: 1 }, leitung: true }), /Grundpreis/);
  assert.match(R.sperrgrund({ status: "Entwurf", marke: "Bora" }, "Prüfen", {}), /Kategorie.*deutscher Text/);
  assert.equal(R.sperrgrund({ status: "Aktiv" }, "Prüfen", {}), "In diesem Zustand nicht möglich");
  const v = R.vorpruefung([fertig, { ...fertig, name: "b", bild_freigegeben: 0 }].map((p, i) => ({ ...p, name: p.name || `a${i}` })), "Veröffentlichen", { marke: () => marke, kategorie: () => kategorie, leitung: true });
  assert.deepEqual(v.moeglich, ["a0"]);
  assert.equal(v.gesperrt.length, 1);
  const punkte = R.checkliste({ ...fertig, verkauf_online: 1 }, { marke, kategorie });
  assert.ok(punkte.some((p) => p.id === "lieferzeit" && !p.ok));
  assert.equal(R.aufWebsite({ ...fertig, status: "Aktiv" }), true);
  assert.equal(R.aufWebsite({ ...fertig, status: "Aktiv", website_sichtbar: 0 }), false);
  assert.deepEqual(R.produktUebergaenge("Pausiert", { leitung: false }), []);
});

test("Löschen nur bei Entwürfen ohne Folgen (BAO § 132)", () => {
  assert.equal(R.darfLoeschen({ status: "Entwurf", preise: [] }, "PH Produkt"), true);
  assert.equal(R.darfLoeschen({ status: "Entwurf", preise: [{}] }, "PH Produkt"), false);
  assert.equal(R.darfLoeschen({ status: "Entwurf" }, "PH Herstellerbestellung"), true);
  assert.equal(R.darfLoeschen({ status: "Entwurf", gesendet_am: "2026-11-01" }, "PH Herstellerbestellung"), false);
  assert.equal(R.darfLoeschen({ status: "Offen" }, "PH Wareneingang"), false);
});

test("EAN-Prüfziffer, Slug und Web-Adresse", () => {
  assert.equal(R.eanGueltig("4006381333931"), true);
  assert.equal(R.eanGueltig("4006381333932"), false);
  assert.equal(R.eanGueltig(""), true);
  assert.equal(R.slugVon("Küche Größe 3"), "kueche-groesse-3");
  assert.equal(R.webAdresse({ kategorie: "Kochfelder", marke: "Bora", bezeichnung: "X Pure" }), "/produkte/kochfelder/bora-x-pure");
});

test("Händlerwörter nur mit passendem Händlerstatus", () => {
  assert.deepEqual(R.haendlerwortTreffer("Ihr Vertragshändler am See", "Haendler"), ["Vertragshändler"]);
  assert.deepEqual(R.haendlerwortTreffer("Ihr Vertragshändler am See", "Vertragshaendler"), []);
  assert.deepEqual(R.haendlerwortTreffer("", "Keiner"), []);
});

test("Restmengen (AB-Menge vor Bestellmenge, stornierte ausgelassen) und Status nach Lieferung", () => {
  const b = { positionen: [{ idx: 1, menge: 4, ab_menge: 3, menge_erhalten: 1 }, { idx: 2, menge: 2, menge_erhalten: 0, status: "Storniert" }, { idx: 3, menge: 2, menge_erhalten: 2 }] };
  assert.deepEqual(R.restmengen(b).map((r) => [r.idx, r.rest]), [[1, 2], [3, 0]]);
  assert.equal(R.bestellstatusAusMengen([{ menge: 2, menge_erhalten: 2 }]), "Geliefert");
  assert.equal(R.bestellstatusAusMengen([{ menge: 2, menge_erhalten: 1 }]), "Teilgeliefert");
  assert.equal(R.bestellstatusAusMengen([{ menge: 2, menge_erhalten: 0 }]), null);
  assert.deepEqual(R.mengenAbgleich(5, 6), { differenz: 1, abweichung: "Ueberlieferung" });
  assert.equal(R.weStatusAus([{ menge_erwartet: 2, menge_erhalten: 2, zustand: "Transportschaden" }]), "Reklamiert");
  assert.equal(R.weStatusAus([{ menge_erwartet: 2, menge_erhalten: 1, zustand: "ok" }]), "Teilweise");
});

test("AB-Abgleich wie ph_sortiment: Toleranz 0 und > 0, leere AB-Felder nicht verglichen", () => {
  const pos = { menge: 2, ek_cent: 10000, wunschtermin: "2026-12-01", hersteller_artikelnr: "AB-1", ausfuehrung_text: "Edelstahl, matt", bezeichnung: "X" };
  assert.deepEqual(R.abweichungenPosition(pos, 1), []);
  const z = R.abweichungenPosition({ ...pos, ab_menge: 1, ab_ek_cent: 10500, bestaetigter_termin: "2026-12-18", ab_artikelnr: "ab-2", ab_ausfuehrung_text: "edelstahl matt" }, 1);
  assert.deepEqual(z.map((x) => x.feld), ["Menge", "Preis", "Termin", "Artikel"]);
  assert.equal(z.find((x) => x.feld === "Termin").abweichung_text, "+17 Tage");
  assert.equal(z.find((x) => x.feld === "Preis").abweichung_text, "+5,00 € (+5,0 %)");
  assert.equal(z.find((x) => x.feld === "Menge").abweichung_text, "−1 Stk");
  const tol = R.abweichungenPosition({ ...pos, ab_ek_cent: 10500, bestaetigter_termin: "2026-12-03" }, 1, { toleranzPreis: 5, toleranzTermin: 2 });
  assert.deepEqual(tol, []);
  const g = R.abgleich([pos, { ...pos, ab_ausfuehrung_text: "Schwarz" }]);
  assert.equal(g.kennzeichen[1], "keine");
  assert.equal(g.kennzeichen[2], "Ausfuehrung");
  assert.equal(R.offeneAbweichungen([{ bewertung: "offen" }, { bewertung: "pruefen" }, { bewertung: "ok" }]), 2);
  assert.match(R.reklamationText(g.protokoll, "HB-1", "AB-7"), /Auftragsbestätigung AB-7 zu unserer Bestellung HB-1/);
});

test("Bewertung je Rolle: Ablehnen und Preis-OK nur Leitung", () => {
  assert.equal(R.bewertungErlaubt("abgelehnt", "Menge", { leitung: false }), false);
  assert.equal(R.bewertungErlaubt("ok", "Preis", { leitung: false }), false);
  assert.equal(R.bewertungErlaubt("ok", "Termin", { leitung: false }), true);
  assert.equal(R.bewertungErlaubt("abgelehnt", "Preis", { leitung: true }), true);
});

test("Bestellung: Sperrgründe, eine Primäraktion je Zustand, Kette, AB überfällig", () => {
  const e = { status: "Entwurf", lieferant: "L", positionen: [{}] };
  assert.equal(R.bestellSperrgrund(e, "senden", { lieferant: { bestell_email: "a@b.invalid" } }), null);
  assert.match(R.bestellSperrgrund({ ...e, lieferant: "" }, "senden"), /Lieferanten/);
  assert.match(R.bestellSperrgrund(e, "senden", { lieferant: {} }), /E-Mail/);
  assert.match(R.bestellSperrgrund({ status: "Gesendet" }, "stornieren", { leitung: false }), /Leitung/);
  assert.equal(R.bestellSperrgrund({ status: "Gesendet" }, "stornieren", { leitung: true }), null);
  assert.match(R.bestellSperrgrund({ status: "AB erhalten", abweichungen_anzahl: 1, abweichungen_offen: 0, ab_vollstaendig: 1 }, "abBestaetigen", { leitung: false }), /Leitung/);
  assert.equal(R.bestellSperrgrund({ status: "AB erhalten", abweichungen_anzahl: 1, abweichungen_offen: 0, ab_vollstaendig: 1 }, "abBestaetigen", { leitung: true }), null);
  assert.match(R.bestellSperrgrund({ status: "AB geprueft", lieferadresse: "Kunde direkt" }, "eingang"), /Strecke/);
  assert.equal(R.bestellPrimaer({ status: "Entwurf" }), "lieferant");
  assert.equal(R.bestellPrimaer({ status: "AB erhalten", abweichungen_offen: 2 }), "klaeren");
  assert.equal(R.bestellPrimaer({ status: "Geliefert" }), "abschliessen");
  assert.deepEqual(R.bestellKette({ status: "AB erhalten" }).map((s) => s.zustand), ["erledigt", "erledigt", "aktuell", "offen", "offen", "offen"]);
  assert.ok(R.bestellKette({ status: "Storniert" }).every((s) => s.zustand === "uebersprungen"));
  const u = R.abUeberfaellig({ status: "Gesendet", gesendet_am: "2026-10-26 10:00:00" }, { frist: 5, jetzt: new Date(2026, 10, 4) });
  assert.deepEqual(u, { tage: 9, ueberfaellig: true });
});

test("Vorschlagsmenge aus Meldebestand (Ziel, Mindestmenge, Verpackungseinheit)", () => {
  assert.equal(R.vorschlagMenge({ verfuegbar: 2, offen_bestellt: 0, zielbestand: 12, bestellmenge_min: 6 }), 10);
  assert.equal(R.vorschlagMenge({ verfuegbar: 10, zielbestand: 12, bestellmenge_min: 6 }), 6);
  assert.equal(R.vorschlagMenge({ verfuegbar: 12, zielbestand: 12 }), 0);
  assert.equal(R.vorschlagMenge({ verfuegbar: 0, zielbestand: 10, verpackungseinheit: 4 }), 12);
});
