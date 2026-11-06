// Bereich Sortiment – Übermittlung an Hersteller (IWOfurn, EDI, CSV) und AB-Merker, gleiche Regeln wie
// ph_sortiment/logik/uebermittlung.py.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as U from "../../src/lib/backoffice/sortiment/uebermittlung.js";
import { glnAus } from "../../src/lib/backoffice/mock/seed/sortiment.js";

const best = { name: "HB-2026-00001", datum: "2026-11-02", wunschtermin: "2026-11-25", kommission: "Hotel + Seeblick", waehrung: "EUR", lieferadresse_text: "Platzhirsch\nSeestraße 1\n6911 Lochau", positionen: [{ idx: 1, hersteller_artikelnr: "EZA-1", bezeichnung: "Mosaik Mix 2,5", menge: 40, wunschtermin: "2026-11-25" }, { idx: 2, hersteller_artikelnr: "EZA-2", ean: "4006381333931", bezeichnung: "Fuge <weiß>", ausfuehrung_text: "Weiß", menge: 2 }] };
const ich = { firma: "Platzhirsch Home Living", gln: glnAus("900999900001") };
const lf = { firmenname: "Ezarri", gln: glnAus("900123400001"), kundennummer: "K-4711" };

test("GLN-Prüfziffer und Weg aus dem Bestellweg", () => {
  assert.equal(U.glnGueltig(glnAus("900123400001")), true);
  assert.equal(U.glnGueltig("9001234000010"), U.glnGueltig(glnAus("900123400001")) && glnAus("900123400001") === "9001234000010");
  assert.equal(U.glnGueltig("123"), false);
  assert.equal(U.wegFuerBestellweg("IWOfurn"), "IWOfurn");
  assert.equal(U.wegFuerBestellweg("Portal"), "CSV");
  assert.equal(U.wegFuerBestellweg(""), "E-Mail");
});

test("Prüfung: Positionen, Mengen, GLN nur bei IWOfurn/EDI", () => {
  assert.deepEqual(U.pruefeExport("CSV", best, {}, {}), []);
  assert.deepEqual(U.pruefeExport("EDI", best, {}, lf), ["Eigene GLN fehlt/ungültig (Einstellungen Sortiment)"]);
  assert.ok(U.pruefeExport("IWOfurn", { ...best, positionen: [] }, ich, lf).includes("Bestellung ohne Positionen"));
  assert.ok(U.pruefeExport("CSV", { ...best, positionen: [{ idx: 3, menge: 0 }] }).includes("Position 3: Menge fehlt"));
  assert.throws(() => U.exportieren("E-Mail", best, ich, lf), U.AdapterFehler);
});

test("CSV mit BOM, Semikolon und unveränderten Spalten", () => {
  const e = U.exportieren("CSV", best, ich, lf);
  assert.equal(e.dateiname, "HB-2026-00001-csv.csv");
  assert.ok(e.inhalt.startsWith("﻿pos;hersteller_artikelnr;bezeichnung;ausfuehrung;menge;wunschtermin;kommission\r\n"));
  assert.ok(e.inhalt.includes("1;EZA-1;Mosaik Mix 2,5;;40;2026-11-25;"));
  assert.equal(e.verifiziert, true);
});

test("IWOfurn-XML: maskiert, GLN von Käufer und Lieferant, unverifiziert", () => {
  const e = U.exportieren("IWOfurn", best, ich, lf);
  assert.equal(e.mime, "application/xml");
  assert.match(e.inhalt, /<Kaeufer GLN="9009999000016" Kundennummer="K-4711">/);
  assert.match(e.inhalt, /<Text>Fuge &lt;weiß&gt;<\/Text>/);
  assert.match(e.inhalt, /<Kommission>Hotel \+ Seeblick<\/Kommission>/);
  assert.equal(e.verifiziert, false);
  assert.match(e.hinweis, /unverifiziert/);
});

test("EDIFACT ORDERS: Freigabezeichen, Segmentzähler, Lieferadresse", () => {
  const e = U.exportieren("EDI", best, ich, lf, { jetzt: new Date(2026, 10, 4) });
  const seg = e.inhalt.trim().split("'\n");
  assert.equal(seg[0].split("\n")[0], "UNA:+.? ");
  assert.ok(e.inhalt.includes("RFF+CR:Hotel ?+ Seeblick"));
  assert.ok(e.inhalt.includes("LIN+2++4006381333931:SRV"));
  assert.ok(e.inhalt.includes("NAD+DP+++Platzhirsch:Seestraße 1:6911 Lochau"));
  assert.ok(e.inhalt.includes("UNB+UNOC:3+9009999000016:14+9001234000010:14+261104:0000+HB202600001"));
  const unh = seg.findIndex((s) => s.startsWith("UNH"));
  const unt = seg.findIndex((s) => s.startsWith("UNT"));
  assert.equal(seg[unt], `UNT+${unt - unh + 1}+1`);
  assert.equal(U.ediEscape("a'b+c:d?e"), "a?'b?+c?:d??e");
});

test("Übermittlungsstatus: erlaubte Schritte wie im Backend", () => {
  assert.equal(U.uebermittlungErlaubt("", "Uebermittelt"), true);
  assert.equal(U.uebermittlungErlaubt("Bestaetigt", "Fehler"), false);
  assert.deepEqual(U.naechsteUebermittlung("Exportiert"), ["Uebermittelt", "Fehler"]);
  assert.deepEqual(U.naechsteUebermittlung("Uebermittelt"), ["Bestaetigt", "Fehler"]);
});

test("AB-Merker: offen · bestätigt · Abweichung · geklärt; vollständig nur ohne offene", () => {
  assert.equal(U.abMerker(false, []), "offen");
  assert.equal(U.abMerker(true, []), "bestaetigt");
  assert.equal(U.abMerker(true, [{ bewertung: "pruefen" }]), "abweichung");
  assert.equal(U.abMerker(true, [{ bewertung: "ok" }, { bewertung: "abgelehnt" }]), "geklaert");
  assert.equal(U.abVollstaendig(["bestaetigt", "geklaert"]), true);
  assert.equal(U.abVollstaendig(["bestaetigt", "abweichung"]), false);
  assert.equal(U.abVollstaendig([]), false);
  const doc = { ab_nummer: "AB-1", positionen: [{ idx: 1 }, { idx: 2 }, { idx: 3, status: "Storniert" }], ab_abgleich: [{ position: 2, bewertung: "offen" }] };
  assert.deepEqual(U.merkerAlle(doc), [{ idx: 1, merker: "bestaetigt" }, { idx: 2, merker: "abweichung" }]);
});

test("Exportdaten aus der Bestellung: stornierte Positionen fehlen, Standard-Lieferadresse", () => {
  const d = U.exportDaten({ name: "HB-1", positionen: [{ idx: 1, menge: 1, bezeichnung: "A" }, { idx: 2, menge: 1, status: "Storniert" }] }, { lieferant: { firmenname: "L", gln: "1", kundennummer_bei_lieferant: "K" }, einst: { eigene_gln: "2", standard_lieferadresse: "Lochau" } });
  assert.equal(d.bestellung.positionen.length, 1);
  assert.equal(d.bestellung.lieferadresse_text, "Lochau");
  assert.deepEqual(d.lieferant, { firmenname: "L", gln: "1", kundennummer: "K" });
});
