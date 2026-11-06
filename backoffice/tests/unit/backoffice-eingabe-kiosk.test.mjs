// Unit-Tests Team P0-6 (Fundament v2): G-21 Kalender/Raster/Slotraster/BetragFeld, G-22 ScanTor,
// G-23 Unterschrift, G-24 Kiosk-Kern v2, G-30 FotoAufnahme (EXIF), Kundendisplay-Kanal.
//   node --test "tests/unit/**/*.test.mjs"
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import * as datum from "../../src/lib/backoffice/datum.js";
import * as kal from "../../src/components/Backoffice/Kalender/logik.js";
import * as betrag from "../../src/components/Backoffice/Eingabe/betrag.js";
import { erstelleScanErkenner, scanAnsage, scanZiel } from "../../src/components/Backoffice/Eingabe/scan.js";
import { exifZeit, formatiere } from "../../src/components/Backoffice/Eingabe/exif.js";
import { alternativeFehler, glaette, pngAusDataUrl, pruefwert, strichLaenge, unterschriftGenug } from "../../src/components/Backoffice/Eingabe/unterschrift-logik.js";
import * as kiosk from "../../src/components/Backoffice/Kiosk/logik.js";
import { anzeigeName, bereinige, istNeuer, kanalName, kasseGueltig, nachrichtGueltig } from "../../src/lib/backoffice/kanal/protokoll.js";
import { _leeren, abonniere, letzte, veroeffentliche } from "../../src/lib/backoffice/kanal/hub.js";
import { demoFuer } from "../../src/lib/backoffice/demo-register.js";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const lies = (p) => readFileSync(path.join(WURZEL, p), "utf8");

// ---- datum.js (Erweiterung) ------------------------------------------------------------------

test("datum: Woche, Kalenderwoche, Zeitrechnung über Tagesgrenzen", () => {
  assert.equal(datum.wochenStart("2026-11-04"), "2026-11-02");
  assert.deepEqual(datum.wochenTage("2026-11-08"), ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"]);
  assert.equal(datum.kalenderwoche("2026-11-04"), 45);
  assert.equal(datum.kalenderwoche("2026-01-01"), 1);
  assert.equal(datum.kalenderwoche("2027-01-03"), 53);
  assert.equal(datum.kalenderwoche("2024-12-30"), 1);
  assert.equal(datum.zeitZuMinuten("09:30"), 570);
  assert.equal(datum.zeitZuMinuten("25:00"), null);
  assert.equal(datum.minutenZuZeit(570), "09:30");
  assert.equal(datum.plusMinuten("2026-11-04 23:30", 45), "2026-11-05 00:15");
  assert.equal(datum.plusMinuten("2026-03-29 01:30", 60), "2026-03-29 02:30"); // keine Zeitzonen-Sprünge
  assert.equal(datum.minutenZwischen("2026-11-04 10:00", "2026-11-05 09:00"), 1380);
  assert.equal(datum.tageZwischen("2026-11-04 10:00", "2026-11-06"), 2);
  assert.deepEqual(datum.zerlegeDatumZeit("2026-11-04T10:05:00"), { datum: "2026-11-04", zeit: "10:05" });
  assert.deepEqual(datum.zerlegeDatumZeit("2026-02-30 10:00"), { datum: "", zeit: "" });
  assert.equal(datum.tagKurz("2026-11-04"), "Mi 4.11.");
  assert.equal(datum.tagLang("2026-11-04"), "Mittwoch, 4. November 2026");
  assert.equal(datum.spanneTitel("2026-11-02", "2026-11-08"), "2.–8. November 2026");
  assert.equal(datum.spanneTitel("2026-11-30", "2026-12-06"), "30. November – 6. Dezember 2026");
  assert.equal(datum.spanneTitel("2026-12-28", "2027-01-03"), "28. Dezember 2026 – 3. Januar 2027");
  // Bestehende API unverändert
  assert.equal(datum.parseDatum("4.11.26"), "2026-11-04");
  assert.equal(datum.isoZuDeutsch("2026-11-04"), "04.11.2026");
});

// ---- Kalender-Logik --------------------------------------------------------------------------

const roh = [
  { id: "a", quelle: "termin", titel: "Beratung", start: "2026-11-04 10:00", ende: "2026-11-04 11:30", personen: ["Lena"] },
  { id: "b", quelle: "termin", titel: "Rückruf", start: "2026-11-04 11:00", ende: "2026-11-04 11:30", personen: ["Lena"] },
  { id: "c", quelle: "montage", titel: "Montage", start: "2026-11-04 11:00", ende: "2026-11-04 15:00", personen: ["Markus"] },
  { id: "d", quelle: "abwesenheit", titel: "Krankenstand", start: "2026-11-05", ganztag: true, personen: ["Markus"], notiz: "geheim" },
  { id: "e", quelle: "unbekannt", titel: "Ohne Ende", start: "2026-11-05 09:00" },
  { id: "f", quelle: "montage", titel: "Montage 2", start: "2026-11-05 08:00", ende: "2026-11-05 12:00", personen: ["Markus"] },
];

test("Kalender: normalisieren – Standarddauer, Quelle, Abwesenheit ohne Art", () => {
  const n = kal.normalisiere(roh);
  const e = n.find((x) => x.id === "e");
  assert.equal(e.quelle, "termin");
  assert.equal(e.ende, "2026-11-05 10:00");
  const d = n.find((x) => x.id === "d");
  assert.equal(d.titel, "Abwesend · Markus");
  assert.ok(!JSON.stringify(d).includes("Krankenstand"));
  assert.ok(!JSON.stringify(d).includes("geheim"));
  assert.equal(d.verschiebbar, false);
  assert.equal(n[0].id, "a"); // sortiert nach Beginn
  const kaputt = kal.normalisiere([{ id: "x", start: "2026-11-04 10:00", ende: "2026-11-04 09:00" }]);
  assert.equal(kaputt[0].ende, "2026-11-04 11:00");
});

test("Kalender: Spalten-Layout überlappender Einträge", () => {
  const n = kal.normalisiere(roh);
  const l = kal.layoutTag(n, "2026-11-04");
  const by = Object.fromEntries(l.map((x) => [x.eintrag.id, x]));
  assert.equal(by.a.spalten, 3);
  assert.equal(by.a.spalte, 0);
  assert.notEqual(by.b.spalte, by.c.spalte);
  assert.equal(by.a.von, 600);
  assert.equal(by.a.bis, 690);
});

test("Kalender: Kollisionen nur bei gleicher Person, Abwesenheit sperrt den Tag", () => {
  const n = kal.normalisiere(roh);
  const k = kal.kollisionen(n);
  assert.deepEqual(k.get("a").map((x) => x.id), ["b"]);
  assert.ok(!k.get("c")?.some((x) => x.id === "a")); // andere Person
  assert.ok(k.get("f").some((x) => x.id === "d")); // Abwesenheit derselben Person
  assert.equal(kal.kollisionsText(k.get("a")), "Überschneidet sich mit „Rückruf“");
  assert.equal(kal.kollisionsText([{}, {}]), "Überschneidet sich mit 2 Einträgen");
});

test("Kalender: Zeitraum, Blättern, Roving-Fokus", () => {
  const w = kal.zeitraum("woche", "2026-11-04");
  assert.equal(w.von, "2026-11-02");
  assert.equal(w.kurztitel, "KW 45");
  const m = kal.zeitraum("monat", "2026-11-04");
  assert.equal(m.tage.length, 42);
  assert.equal(m.titel, "November 2026");
  assert.equal(kal.blaettern("monat", "2026-01-31", 1), "2026-02-28");
  assert.equal(kal.blaettern("woche", "2026-11-04", -1), "2026-10-28");
  const opt = { ansicht: "woche", tage: w.tage, von: 420, bis: 1200, schritt: 30 };
  assert.deepEqual(kal.bewegeFokus({ tag: "2026-11-04", min: 600 }, "ArrowDown", opt), { tag: "2026-11-04", min: 630, aussen: false });
  assert.deepEqual(kal.bewegeFokus({ tag: "2026-11-04", min: 420 }, "ArrowUp", opt).min, 420);
  assert.equal(kal.bewegeFokus({ tag: "2026-11-08", min: 600 }, "ArrowRight", opt).aussen, true);
  assert.equal(kal.bewegeFokus({ tag: "2026-11-04", min: 600 }, "End", opt).tag, "2026-11-08");
  assert.equal(kal.bewegeFokus({ tag: "2026-11-04", min: 600 }, "PageDown", opt).min, 1170);
  assert.equal(kal.bewegeFokus({ tag: "2026-11-04", min: 600 }, "ArrowDown", { ...opt, ansicht: "monat", tage: m.tage }).tag, "2026-11-11");
  assert.equal(kal.bewegeFokus({ tag: "2026-11-04", min: 600 }, "x", opt), null);
});

test("Slotraster: freie 30-min-Slots, belegte und vergangene ausgenommen, Abwesenheit sperrt", () => {
  const n = kal.normalisiere(roh);
  const frei = kal.freieSlots({ tag: "2026-11-04", von: 540, bis: 720, dauer: 60, belegt: n.filter((e) => e.personen.includes("Lena")) });
  assert.deepEqual(frei.map((s) => s.min), [540]); // 9:00–10:00 frei, 10:00–11:30 belegt, 11:30–12:00 zu kurz
  const spaeter = kal.freieSlots({ tag: "2026-11-04", von: 540, bis: 720, dauer: 30, belegt: [], jetzt: "2026-11-04 10:10" });
  assert.equal(spaeter[0].start, "2026-11-04 10:30");
  assert.deepEqual(kal.freieSlots({ tag: "2026-11-05", belegt: n.filter((e) => e.id === "d") }), []);
});

test("Kalender: Ziehen rastet auf 15 min ein, Dauer bleibt", () => {
  assert.equal(kal.minutenAusLage(0, 728, { von: 420, bis: 1200, raster: 15 }), 420);
  assert.equal(kal.minutenAusLage(364, 728, { von: 420, bis: 1200, raster: 15 }), 810);
  assert.equal(kal.minutenAusLage(9999, 728, { von: 420, bis: 1200, raster: 15 }), 1185);
  assert.deepEqual(kal.verschiebeEintrag({ start: "2026-11-04 10:00", ende: "2026-11-04 11:30" }, "2026-11-05 23:00"), { start: "2026-11-05 23:00", ende: "2026-11-06 00:30" });
  assert.equal(kal.zeitText({ start: "2026-11-04 22:00", ende: "2026-11-05 01:00" }, "2026-11-05"), "bis 01:00");
  assert.equal(kal.zeitText({ start: "2026-11-04 22:00", ende: "2026-11-05 01:00" }, "2026-11-04"), "ab 22:00");
});

test("Raster: Balkenlage, Abschneiden, Bahnen, Verschieben", () => {
  assert.deepEqual(kal.balkenLage({ start: "2026-11-03", ende: "2026-11-05" }, "2026-11-04", "2026-11-10"), { start: 0, laenge: 2, abgeschnittenLinks: true, abgeschnittenRechts: false });
  assert.equal(kal.balkenLage({ start: "2026-11-11" }, "2026-11-04", "2026-11-10"), null);
  const b = kal.bahnen([{ id: 1, start: "2026-11-04", ende: "2026-11-06" }, { id: 2, start: "2026-11-05", ende: "2026-11-05" }, { id: 3, start: "2026-11-07" }], "2026-11-04", "2026-11-10");
  assert.equal(b.bahnen, 2);
  assert.equal(b.balken.find((x) => x.id === 3).bahn, 0);
  assert.deepEqual(kal.verschiebeBalken({ start: "2026-11-30", ende: "2026-12-01" }, 2), { start: "2026-12-02", ende: "2026-12-03" });
  assert.equal(kal.tageVonBis("2026-11-02", "2026-11-15").length, 14);
});

// ---- BetragFeld / Zahlentastatur -------------------------------------------------------------

test("BetragFeld: Komma-Modell, Cent, Fehlertext, negativ nur mit Prop", () => {
  const p = betrag.parseBetrag;
  assert.equal(p("1.234,50").cent, 123450);
  assert.equal(p("1234,5").cent, 123450);
  assert.equal(p("12").cent, 1200);
  assert.equal(p("12.50").cent, 1250);
  assert.equal(p("1.250").cent, 125000);
  assert.equal(p("€ 1 234,50").cent, 123450);
  assert.equal(p("12,–").cent, 1200);
  assert.equal(p(",5").cent, 50);
  assert.deepEqual(p(""), { ok: true, cent: null, fehler: "" });
  assert.equal(p("12,345").fehler, "Betrag im Format 1.234,50");
  assert.equal(p("1.23.4,00").ok, false);
  assert.equal(p("12,3,4").ok, false);
  assert.equal(p("abc").fehler, "Betrag im Format 1.234,50");
  assert.equal(p("-5,00").ok, false);
  assert.equal(p("−5,00", { negativ: true }).cent, -500);
  assert.equal(p("-0", { negativ: true }).cent, 0);
  assert.equal(p("2000000000").ok, false);
  assert.equal(betrag.formatBetrag(123450), "1.234,50");
  assert.equal(betrag.formatBetrag(-4950, { waehrung: true }), "−49,50 €");
  assert.equal(betrag.formatBetrag(null), "");
});

test("Zahlentastatur: Tasten wie ein Taschenrechner, ohne Rundung", () => {
  const t = (folge, opt) => folge.reduce((s, k) => betrag.tasteAnwenden(s, k, opt), "");
  assert.equal(t(["1", "2", ",", "5"]), "12,5");
  assert.equal(betrag.textZuWert("12,5"), 1250);
  assert.equal(t(["0", "5"]), "5");
  assert.equal(t([",", "5", "0", "1"]), "0,50");
  assert.equal(t(["1", "2", "⌫"]), "1");
  assert.equal(t(["1", "C"]), "");
  assert.equal(t(["5", "±"]), "5"); // ohne negativ kein Vorzeichen
  assert.equal(t(["5", "±"], { negativ: true }), "-5");
  assert.equal(t(["1", "00"], { dezimalen: 0 }), "100");
  assert.equal(t(["1", ","], { dezimalen: 0 }), "1");
  assert.equal(t(Array(12).fill("9"), { maxStellen: 9 }).length, 9);
  assert.equal(betrag.anzeigeText("12345,5"), "12.345,5");
  assert.equal(betrag.wertZuText(125050), "1250,5");
  assert.equal(betrag.wertZuText(5000), "50");
  assert.equal(betrag.textZuWert("7", { dezimalen: 0 }), 7);
  assert.equal(betrag.parseMenge("3,6").ok, false);
  assert.match(betrag.parseMenge("3,6").fehler, /ganze Stück/);
  assert.equal(betrag.parseMenge("3").menge, 3);
});

// ---- ScanTor ---------------------------------------------------------------------------------

test("ScanTor: Scanner-Folge < 30 ms mit Enter ist ein Scan, Tippen nicht", () => {
  const e = erstelleScanErkenner();
  let t = 0;
  const scan = (code, abstand) => {
    let r;
    for (const ch of code) {
      t += abstand;
      r = e.taste(ch, t);
    }
    t += abstand;
    return [r, e.taste("Enter", t)];
  };
  const [vorletzt, ende] = scan("9008564001019", 8);
  assert.equal(vorletzt.folge, true);
  assert.deepEqual(ende, { art: "scan", code: "9008564001019" });
  t += 1000;
  const [, getippt] = scan("1234", 120);
  assert.equal(getippt.art, "andere");
  t += 1000;
  const [, kurz] = scan("12", 5);
  assert.equal(kurz.art, "andere"); // < 4 Zeichen
  t += 1000;
  e.taste("K", (t += 5));
  assert.equal(e.taste("Shift", (t += 5)).neutral, true); // Umschalt unterbricht den Scan nicht
  assert.equal(e.taste("K", (t += 5)).folge, true);
});

test("ScanTor: Ziel je Modus und data-scan (Q-D8)", () => {
  const el = (tag, scan, opt = {}) => {
    const knoten = { tagName: tag, getAttribute: () => scan, isContentEditable: false, ...opt };
    knoten.closest = () => (scan ? knoten : null);
    return knoten;
  };
  assert.equal(scanZiel(el("INPUT", "ja"), "backoffice"), "feld");
  assert.equal(scanZiel(el("INPUT", null), "backoffice"), "tippen");
  assert.equal(scanZiel(el("DIV", null), "backoffice"), "palette");
  assert.equal(scanZiel(el("DIV", null), "kiosk"), "global");
  assert.equal(scanZiel(el("INPUT", null), "kiosk"), "global");
  assert.equal(scanZiel(el("DIV", "nein"), "kiosk"), "aus");
  assert.equal(scanZiel(null, "kiosk"), "global");
  assert.equal(scanAnsage({ art: "kundenkarte", wert: "KK-ABC234" }, "kk-abc234"), "Kundenkarte KK-ABC234 gelesen");
  assert.equal(scanAnsage({ art: "text" }, "xyz"), "Code xyz gelesen");
});

// ---- FotoAufnahme: EXIF ----------------------------------------------------------------------

function jpegMitExif(zeit) {
  const tiff = [];
  const u16 = (n) => tiff.push(n & 0xff, (n >> 8) & 0xff);
  const u32 = (n) => tiff.push(n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff);
  tiff.push(0x49, 0x49); // II
  u16(42);
  u32(8); // IFD0
  u16(1); // 1 Eintrag
  u16(0x8769);
  u16(4);
  u32(1);
  u32(26); // Exif-IFD
  u32(0);
  u16(1);
  u16(0x9003);
  u16(2);
  u32(20);
  u32(44);
  u32(0);
  for (const c of `${zeit}\0`) tiff.push(c.charCodeAt(0));
  const app1 = [..."Exif"].map((c) => c.charCodeAt(0)).concat([0, 0], tiff);
  const len = app1.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, (len >> 8) & 0xff, len & 0xff, ...app1, 0xff, 0xd9]);
}

test("FotoAufnahme: Aufnahmezeit aus EXIF, sonst null", () => {
  assert.equal(exifZeit(jpegMitExif("2026:11:04 14:32:10")), "2026-11-04 14:32");
  assert.equal(exifZeit(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), null);
  assert.equal(exifZeit(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2])), null);
  assert.equal(formatiere("0000:00:00 00:00:00"), null);
});

// ---- Unterschrift ----------------------------------------------------------------------------

test("Unterschrift: Mindestlänge, Glätten, Prüfwert, Alternativen", async () => {
  const strich = [{ x: 0.1, y: 0.5 }, { x: 0.3, y: 0.4 }, { x: 0.5, y: 0.6 }];
  assert.ok(strichLaenge([strich], 600, 200) > 200);
  assert.equal(unterschriftGenug([strich], 600, 200), true);
  assert.equal(unterschriftGenug([[{ x: 0.1, y: 0.1 }]], 600, 200), false);
  assert.equal(unterschriftGenug([[{ x: 0.1, y: 0.1 }, { x: 0.11, y: 0.1 }]], 600, 200), false);
  assert.equal(glaette({ x: 0.5, y: 0.5 }, { x: 0.501, y: 0.5 }, 600, 200), null);
  const hash = await pruefwert(new TextEncoder().encode("abc"));
  assert.equal(hash, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.deepEqual([...pngAusDataUrl("data:image/png;base64,AAEC")], [0, 1, 2]);
  assert.equal(pngAusDataUrl("data:text/html;base64,AAEC"), null);
  const T = { nameFehlt: "Name", fotoFehlt: "Foto" };
  assert.equal(alternativeFehler({ feld: { label: "x" } }, { text: " " }, T), "Name");
  assert.equal(alternativeFehler({ fotoPflicht: true }, { fotos: 0 }, T), "Foto");
  assert.equal(alternativeFehler({ fotoPflicht: true }, { fotos: 1 }, T), "");
});

// ---- Kiosk-Kern v2 ---------------------------------------------------------------------------

test("Kiosk: Bänder nach Rang, max. 2 + Rest, Töne nach Q-J4", () => {
  const r = kiosk.ordneBaender([
    { art: "training", text: "Training" },
    { art: "offline", text: "Offline" },
    { art: "zahlung-ohne-beleg", text: "Zahlung ohne Beleg" },
    { art: "see", text: "Signatur" },
  ]);
  assert.deepEqual(r.sichtbar.map((b) => b.art), ["zahlung-ohne-beleg", "offline"]);
  assert.equal(r.weitere, 2);
  assert.equal(r.sichtbar[0].ton, "gefahr");
  assert.equal(r.sichtbar[1].ton, "warnung");
  assert.equal(kiosk.ordneBaender([{ art: "x", text: "" }]).sichtbar.length, 0);
});

test("Kiosk: Idle-Sperre mit 30-s-Band", () => {
  const opt = { idleMs: 15 * 60_000, warnMs: 30_000 };
  assert.equal(kiosk.idlePhase(0, opt).phase, "aktiv");
  assert.deepEqual(kiosk.idlePhase(15 * 60_000 - 29_500, opt), { phase: "warnung", rest: 30 });
  assert.equal(kiosk.idlePhase(15 * 60_000, opt).phase, "gesperrt");
});

test("Kiosk: Warteschlangen-Text sichtbar und verständlich (Q-J6)", () => {
  assert.equal(kiosk.warteschlangenText([]), "");
  assert.equal(kiosk.warteschlangenText([{ art: "foto", zustand: "wartet" }, { art: "foto", zustand: "sendet" }]), "2 Fotos werden gesendet");
  assert.equal(kiosk.warteschlangenText([{ art: "foto", zustand: "wartet" }, { art: "unterschrift", zustand: "wartet" }], { online: false }), "1 Foto und 1 Unterschrift warten auf Verbindung");
  assert.equal(kiosk.warteschlangenText([{ art: "foto", zustand: "fehler" }]), "1 Foto konnte nicht gesendet werden");
});

test("Kiosk: Wischen, Gummiband, Stepper, Positionsgrid", () => {
  assert.equal(kiosk.wischEntscheidung({ dx: -150, breite: 400 }), "links");
  assert.equal(kiosk.wischEntscheidung({ dx: 60, breite: 400 }), null);
  assert.equal(kiosk.wischEntscheidung({ dx: 60, breite: 400, geschwindigkeit: 0.9 }), "rechts");
  assert.equal(kiosk.wischEntscheidung({ dx: -200, breite: 400, links: false }), null);
  assert.equal(kiosk.gummiband(100, 180), 100);
  assert.ok(kiosk.gummiband(300, 180) < 300);
  assert.equal(kiosk.stepperWert(5, 1, { max: 6 }), 6);
  assert.equal(kiosk.stepperWert(6, 1, { max: 6 }), 6);
  assert.equal(kiosk.stepperWert(0, -1), 0);
  assert.deepEqual(kiosk.gridBewegung({ zeile: 0, spalte: 0 }, "ArrowDown", { zeilen: 3, spalten: 3 }), { zeile: 1, spalte: 0 });
  assert.deepEqual(kiosk.gridBewegung({ zeile: 2, spalte: 1 }, "End", { zeilen: 3, spalten: 3 }), { zeile: 2, spalte: 2 });
  assert.deepEqual(kiosk.gridBewegung({ zeile: 2, spalte: 1 }, "Home", { zeilen: 3, spalten: 3, strg: true }), { zeile: 0, spalte: 0 });
  assert.equal(kiosk.gridBewegung({ zeile: 0, spalte: 0 }, "a", { zeilen: 3, spalten: 3 }), null);
  assert.equal(kiosk.istPhysischeTaste({ key: "F1" }), true);
  assert.equal(kiosk.istPhysischeTaste({ key: "a" }), false);
});

// ---- Kundendisplay-Kanal ---------------------------------------------------------------------

test("Kanal: datensparsam – nur Stufe, keine Kontaktdaten, Name nur nach Einstellung, nie Anrede", () => {
  const roh = {
    zustand: "positionen",
    positionen: Array.from({ length: 8 }, (_, i) => ({ titel: `Artikel ${i}`, menge: 1, brutto_cent: 1000, ean: "123" })),
    gesamt_cent: 8000,
    kunde: { name: "Frau Dr. Miriam Köhler", email: "m@k.at", telefon: "+43" },
    kundenkarte: { stufe: "Platzhirsch Plus", punkte: 900, guthaben_cent: 5000, vorteile: [{ titel: "Lieferung frei", eingeloest: true }] },
    adresse: "Seestraße 4",
  };
  const n = bereinige(roh, { seq: 3 });
  assert.equal(n.zustand, "einkauf");
  assert.equal(n.positionen.length, 6);
  assert.equal(n.positionen[0].titel, "Artikel 2");
  assert.equal(n.name, "");
  const text = JSON.stringify(n);
  for (const verboten of ["m@k.at", "+43", "Seestraße", "punkte", "guthaben", "900", "ean"]) assert.ok(!text.includes(verboten), verboten);
  assert.equal(n.kundenkarte.stufe, "Platzhirsch Plus");
  assert.equal(bereinige(roh, { anrede: "vorname" }).name, "Miriam");
  assert.equal(bereinige(roh, { anrede: "name" }).name, "Miriam Köhler");
  assert.equal(anzeigeName({ vorname: "Herr Paul", nachname: "Stadler" }, "name"), "Paul Stadler");
  assert.equal(bereinige({ zustand: "karte", gesamt_cent: 100 }).zahlart, "karte");
  assert.equal(bereinige({ zustand: "fertig" }).zustand, "danke");
  assert.equal(bereinige({ zustand: "hack" }), null);
  assert.equal(bereinige({ zustand: "einkauf", positionen: [{ titel: "x", bild: "https://fremd.example/x.png" }] }).positionen[0].bild, "");
  assert.equal(nachrichtGueltig(n), true);
  assert.equal(istNeuer({ seq: 4 }, n), true);
  assert.equal(kanalName("K1"), "ph-kassa-K1");
  assert.equal(kasseGueltig("K1"), true);
  assert.equal(kasseGueltig("../x"), false);
});

test("Kanal: Verteiler – letzte Nachricht, Abonnenten, fortlaufende seq", () => {
  _leeren();
  const empfangen = [];
  const ab = abonniere("K1", (n) => empfangen.push(n.seq));
  veroeffentliche("K1", { zustand: "ruhe" });
  veroeffentliche("K1", { zustand: "bezahlen", gesamt_cent: 100 });
  assert.equal(veroeffentliche("K1", { zustand: "quatsch" }), null);
  assert.equal(veroeffentliche("../K1", { zustand: "ruhe" }), null);
  ab();
  veroeffentliche("K1", { zustand: "danke" });
  assert.deepEqual(empfangen, [1, 2]);
  assert.equal(letzte("K1").zustand, "danke");
  assert.equal(letzte("K2"), null);
});

// ---- Gestaltung, Register, Kompatibilität ----------------------------------------------------

const EIGENE = [
  "src/components/Backoffice/Kalender",
  "src/components/Backoffice/Eingabe",
  "src/components/Backoffice/Kiosk",
  "src/lib/backoffice/kanal",
];

test("Gestaltung: nur definierte Farb-Token, keine Hex-Werte, keine Versalien (Lounge)", () => {
  const css = lies("src/app/globals.css");
  const definiert = new Set([...css.matchAll(/(--color-[a-z0-9-]+):/g)].map((m) => m[1]));
  for (const ordner of EIGENE) {
    for (const datei of readdirSync(path.join(WURZEL, ordner))) {
      if (!/\.(js|css)$/.test(datei)) continue;
      const text = lies(`${ordner}/${datei}`);
      assert.doesNotMatch(text, /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/, `${ordner}/${datei}: Hex-Wert`);
      assert.doesNotMatch(text, /\buppercase\b|text-transform:\s*uppercase/, `${ordner}/${datei}: Versalien`);
      for (const m of text.matchAll(/var\((--color-[a-z0-9-]+)/g)) assert.ok(definiert.has(m[1]), `${ordner}/${datei}: ${m[1]} fehlt in globals.css`);
      for (const m of text.matchAll(/(?:bg|text|fill|stroke)-(bo-[a-z0-9-]+?)(?:\/\d+)?(?=[\s"'`:\]])/g)) assert.ok(definiert.has(`--color-${m[1]}`), `${ordner}/${datei}: --color-${m[1]} fehlt`);
    }
  }
});

test("Kiosk-Shell v2: bestehende Prüfpunkte bleiben (kiosk-inhalt, bedienerwechsel, Verbunden) und F1/Hilfe 44+ px", () => {
  const s = lies("src/components/Backoffice/Kiosk/KioskShell.js");
  assert.match(s, /data-testid="kiosk-inhalt"/);
  assert.match(s, /data-testid="bedienerwechsel"/);
  assert.match(s, /aria-keyshortcuts="F1"/);
  assert.match(lies("src/components/Backoffice/Kiosk/texte.js"), /verbunden: "Verbunden"/);
  assert.match(lies("src/components/Backoffice/Kiosk/kiosk.css"), /\.bo-ki-kopf \.bo-rund \{ width: 44px; height: 44px; \}/);
  // Kiosk-Kürzel nur über das Register (F1, Umschalt+F2, F11, Strg+P)
  for (const id of ["kiosk.hilfe", "kiosk.bediener", "kiosk.vollbild", "kiosk.drucken"]) assert.match(s, new RegExp(`"${id.replace(".", "\\.")}"`));
});

test("Demo-Register: Eingabe und Kiosk nur für Admin im Mock", () => {
  assert.equal(demoFuer("eingabe", { admin: true, modus: "mock" })?.team, "P0-6");
  assert.equal(demoFuer("eingabe", { admin: false, modus: "mock" }), null);
  assert.equal(demoFuer("eingabe", { admin: true, modus: "frappe" }), null);
});
