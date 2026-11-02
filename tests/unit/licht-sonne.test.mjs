// Bodensee-Licht (Neuland N4): Sonnenstand, Tageslauf, Lichtwerte, Lichtzustand.
//
// Referenzwerte: offizieller NOAA Solar Calculator (https://gml.noaa.gov/grad/solcalc/,
// Datei main.js, Funktionen calcAzEl / calcSunriseSet / calcSolNoon), am 28.10.2026
// heruntergeladen und in Node ausgeführt (nicht Teil des Repos). Ort: Studio Lochau,
// Landstraße 11 (47,5303° N, 9,7517° O, src/lib/site.js GEO). Zeitzone wie NOAA
// „Europe/Vienna“: MEZ (UTC+1) im März/Dezember, MESZ (UTC+2) im Juni/September.
// Akzeptanz N4 §5.4/1: Abweichung ≤ 0,5° an 4 Stichtagen × 3 Uhrzeiten.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fensterSonne,
  himmelsrichtung,
  julianDay,
  sonnenBahn,
  sonnenstand,
  sonnenTag,
  sonnenZeitenFenster,
  utcOffsetMinuten,
  uhrzeit,
  winkelDifferenz,
} from "../../src/lib/licht/sonne.js";
import { farbtemperatur, kelvinZuRgb, lichtWerte, sonnenStaerke, K_MAX, K_MIN } from "../../src/lib/licht/himmel.js";
import { anfrageText, kurzText, lichtParams, lichtQuery, ORTE, ortNachId, parseLicht, werttext } from "../../src/lib/licht/zustand.js";
import { richtungInSzene } from "../../src/lib/licht/szene.js";

const LOCHAU = { lat: 47.5303, lon: 9.7517 };

const NOAA = [
  // Frühlings-Tagundnachtgleiche
  { datum: "2026-03-20", zeit: 540, azimut: 119.92, hoehe: 24.44 },
  { datum: "2026-03-20", zeit: 750, azimut: 180.53, hoehe: 42.43 },
  { datum: "2026-03-20", zeit: 960, azimut: 240.85, hoehe: 24.07 },
  // Sommersonnenwende (MESZ)
  { datum: "2026-06-21", zeit: 540, azimut: 90.69, hoehe: 33.28 },
  { datum: "2026-06-21", zeit: 750, azimut: 151.77, hoehe: 63.71 },
  { datum: "2026-06-21", zeit: 960, azimut: 246.29, hoehe: 50.62 },
  // Herbst-Tagundnachtgleiche (MESZ)
  { datum: "2026-09-23", zeit: 540, azimut: 110.38, hoehe: 17.59 },
  { datum: "2026-09-23", zeit: 750, azimut: 165.47, hoehe: 41.39 },
  { datum: "2026-09-23", zeit: 960, azimut: 230.21, hoehe: 30.13 },
  // Wintersonnenwende
  { datum: "2026-12-21", zeit: 540, azimut: 135.23, hoehe: 6.27 },
  { datum: "2026-12-21", zeit: 750, azimut: 182.65, hoehe: 19.04 },
  { datum: "2026-12-21", zeit: 960, azimut: 229.02, hoehe: 3.65 },
];

const NOAA_TAG = [
  { datum: "2026-03-20", aufgang: 384.24, untergang: 1113.5, mittag: 748.58 },
  { datum: "2026-06-21", aufgang: 323.51, untergang: 1282.11, mittag: 802.7 },
  { datum: "2026-09-23", aufgang: 428.9, untergang: 1157.02, mittag: 793.57 },
  { datum: "2026-12-21", aufgang: 485.97, untergang: 992.13, mittag: 738.81 },
];

test("Sonnenstand Lochau: ≤ 0,5° zur NOAA-Referenz an 4 Stichtagen × 3 Uhrzeiten", () => {
  assert.equal(NOAA.length, 12);
  for (const r of NOAA) {
    const s = sonnenstand(LOCHAU, r.datum, r.zeit);
    const dAz = Math.abs(winkelDifferenz(s.azimut, r.azimut));
    const dH = Math.abs(s.hoehe - r.hoehe);
    assert.ok(dAz <= 0.5, `${r.datum} ${uhrzeit(r.zeit)} Azimut ${s.azimut.toFixed(2)} statt ${r.azimut}`);
    assert.ok(dH <= 0.5, `${r.datum} ${uhrzeit(r.zeit)} Höhe ${s.hoehe.toFixed(2)} statt ${r.hoehe}`);
    // tatsächlich viel genauer (gleicher Algorithmus): ≤ 0,05°
    assert.ok(dAz <= 0.05 && dH <= 0.05, `${r.datum} ${uhrzeit(r.zeit)} weicht mehr als 0,05° ab`);
  }
});

test("Aufgang, Untergang, Sonnenmittag: ≤ 1 Minute zur NOAA-Referenz", () => {
  for (const r of NOAA_TAG) {
    const t = sonnenTag(LOCHAU, r.datum);
    assert.ok(Math.abs(t.aufgang - r.aufgang) <= 1, `${r.datum} Aufgang ${uhrzeit(t.aufgang)}`);
    assert.ok(Math.abs(t.untergang - r.untergang) <= 1, `${r.datum} Untergang ${uhrzeit(t.untergang)}`);
    assert.ok(Math.abs(t.mittag - r.mittag) <= 1, `${r.datum} Mittag ${uhrzeit(t.mittag)}`);
    assert.equal(t.polar, null);
  }
  const winter = sonnenTag(LOCHAU, "2026-12-21");
  assert.ok(winter.hoeheMittag > 18.5 && winter.hoeheMittag < 19.5, "Wintersonne mittags ≈ 19°");
  assert.ok(winter.aufgangAzimut > 120 && winter.aufgangAzimut < 130, "Winter: Aufgang im Südosten");
});

test("Sommerzeit nach EU-Regel (letzter Sonntag März/Oktober)", () => {
  assert.equal(utcOffsetMinuten(2026, 1, 15), 60);
  assert.equal(utcOffsetMinuten(2026, 7, 15), 120);
  // 2026: Umstellung am 29. März und 25. Oktober
  assert.equal(utcOffsetMinuten(2026, 3, 28, 720), 60);
  assert.equal(utcOffsetMinuten(2026, 3, 29, 60), 60);
  assert.equal(utcOffsetMinuten(2026, 3, 29, 180), 120);
  assert.equal(utcOffsetMinuten(2026, 10, 24, 720), 120);
  assert.equal(utcOffsetMinuten(2026, 10, 25, 120), 120);
  assert.equal(utcOffsetMinuten(2026, 10, 25, 240), 60);
  assert.equal(utcOffsetMinuten(2027, 3, 28, 600), 120); // 2027: 28. März
  // Sommerzeit verschiebt den Sonnenmittag um eine Stunde
  assert.ok(sonnenTag(LOCHAU, "2026-10-24").mittag - sonnenTag(LOCHAU, "2026-10-26").mittag > 55);
  assert.equal(julianDay(2000, 1, 1), 2451544.5);
});

test("Nacht: Sonne unter dem Horizont → kein direktes Licht, kein Schatten, Kunstlicht an", () => {
  const nacht = sonnenstand(LOCHAU, "2026-12-21", 22 * 60);
  assert.ok(nacht.hoehe < -30);
  assert.equal(nacht.ueberHorizont, false);
  const w = lichtWerte(nacht.hoehe);
  assert.equal(w.sonne.an, false);
  assert.equal(w.sonne.intensitaet, 0);
  assert.equal(w.schatten, false);
  assert.equal(w.kunstlicht.an, true);
  assert.equal(w.phase.id, "nacht");
  assert.equal(fensterSonne(nacht, { azimut: 180 }).scheint, false);
  assert.match(werttext(nacht, 22 * 60), /^22:00 Uhr, Sonne \d+° unter dem Horizont, kein direktes Sonnenlicht$/);
});

test("Lichtwerte: Farbtemperatur 2.000–5.500 K, Stärke steigt mit der Höhe", () => {
  assert.equal(farbtemperatur(-5), K_MIN);
  assert.equal(farbtemperatur(0), K_MIN);
  assert.equal(farbtemperatur(60), K_MAX);
  let vorher = -1;
  for (let h = 0; h <= 90; h += 5) {
    const k = farbtemperatur(h);
    assert.ok(k >= K_MIN && k <= K_MAX);
    assert.ok(k >= vorher, `Kelvin fällt bei ${h}°`);
    vorher = k;
    assert.ok(sonnenStaerke(h + 5) >= sonnenStaerke(h));
  }
  assert.ok(sonnenStaerke(90) > 0.99);
  const warm = kelvinZuRgb(2000);
  assert.ok(warm.r > warm.b, "2.000 K ist warm");
  const tag = lichtWerte(40);
  assert.equal(tag.sonne.an, true);
  assert.equal(tag.schatten, true);
  assert.equal(tag.kunstlicht.an, false);
  assert.match(tag.sonne.farbe, /^#[0-9a-f]{6}$/);
});

test("Werttext wie spezifiziert: „8:30 Uhr, Sonne 9° über dem Horizont, aus Südosten“", () => {
  // 10. Februar 8:30 Lochau: Sonne niedrig im Südosten
  const s = sonnenstand(LOCHAU, "2026-02-10", 510);
  assert.equal(himmelsrichtung(s.azimut).name, "Südosten");
  assert.match(werttext(s, 510), /^8:30 Uhr, Sonne \d+° über dem Horizont, aus Südosten$/);
  assert.equal(werttext({ hoehe: 9.2, azimut: 130 }, 510), "8:30 Uhr, Sonne 9° über dem Horizont, aus Südosten");
  assert.equal(himmelsrichtung(359).kurz, "N");
  assert.equal(himmelsrichtung(225).adj, "Südwest");
});

test("Fenster: Südfenster im Dezember mittags tiefer Lichteinfall, Nordfenster ohne Sonne", () => {
  const mittag = sonnenstand(LOCHAU, "2026-12-21", 739);
  const sued = fensterSonne(mittag, { azimut: 180 });
  assert.equal(sued.scheint, true);
  assert.ok(sued.tiefeMax > 5 && sued.tiefeMax < 7, `Sonnenfleck ${sued.tiefeMax.toFixed(2)} m`);
  assert.equal(fensterSonne(mittag, { azimut: 0 }).scheint, false);
  const sommer = fensterSonne(sonnenstand(LOCHAU, "2026-06-21", 803), { azimut: 180 });
  assert.ok(sommer.tiefeMax < 1.2, "Sommersonne steht steil, kurzer Fleck");
  // Ostfenster: nur vormittags Sonne
  const ost = sonnenZeitenFenster(LOCHAU, "2026-06-21", 90);
  assert.equal(ost.bereiche.length, 1);
  assert.ok(ost.bereiche[0].von < 360 && ost.bereiche[0].bis < 13 * 60 + 40);
  assert.equal(sonnenZeitenFenster(LOCHAU, "2026-12-21", 0).summe, 0, "Nordfenster im Winter ohne Direktsonne");
  assert.equal(sonnenBahn(LOCHAU, "2026-06-21", 60).length, 25);
});

test("Szene: Richtung zur Sonne relativ zur Fensterachse (−Z schaut nach `fenster`)", () => {
  const v = richtungInSzene(180, 30, 180); // Sonne genau vor dem Südfenster
  assert.ok(Math.abs(v[0]) < 1e-9 && v[2] < 0 && v[1] > 0);
  const rechts = richtungInSzene(270, 10, 180); // Westsonne, Fenster Süd → rechts (+X)
  assert.ok(rechts[0] > 0.9);
  assert.ok(Math.abs(Math.hypot(...rechts) - 1) < 1e-9);
});

test("Ortsliste: rund 80 Orte von Chur bis Ulm, eindeutig, gültige Koordinaten", () => {
  assert.ok(ORTE.length >= 75 && ORTE.length <= 100, `${ORTE.length} Orte`);
  assert.equal(new Set(ORTE.map((o) => o.id)).size, ORTE.length);
  for (const o of ORTE) {
    assert.ok(o.lat > 46.5 && o.lat < 48.6 && o.lon > 8.4 && o.lon < 10.8, o.id);
    assert.ok(["AT", "DE", "CH", "LI"].includes(o.land), o.id);
  }
  for (const id of ["lochau", "chur", "ulm", "st-gallen", "vaduz", "konstanz", "lindau"]) assert.ok(ortNachId(id), id);
  assert.ok(Math.abs(ortNachId("lochau").lat - LOCHAU.lat) < 1e-6);
});

test("Lichtzustand: URL hin und zurück, ungültige Werte fallen auf Standard", () => {
  const now = new Date("2026-10-28T09:00:00Z");
  const z = parseLicht(new URLSearchParams("ort=chur&fenster=135&datum=2026-12-15&zeit=08:30&szene=pool"), now);
  assert.deepEqual(z, { ort: "chur", lat: null, lon: null, fenster: 135, datum: "2026-12-15", minuten: 510, szene: "pool" });
  assert.equal(lichtParams(z).toString(), "ort=chur&fenster=135&datum=2026-12-15&zeit=08%3A30&szene=pool");
  assert.deepEqual(parseLicht(Object.fromEntries(lichtParams(z)), now), z);
  const kaputt = parseLicht({ ort: "atlantis", fenster: "abc", datum: "2026-02-31", zeit: "25:00", szene: "mond" }, now);
  assert.deepEqual(kaputt, { ort: "lochau", lat: null, lon: null, fenster: 225, datum: "2026-10-28", minuten: 630, szene: "kueche" });
  assert.deepEqual(parseLicht(new URLSearchParams(""), now), kaputt, "leere URL → Standard (Fenster Südwest, nicht 0°)");
  assert.deepEqual(parseLicht(undefined, now), kaputt);
  assert.equal(lichtQuery(z), "ort=chur&fenster=135&datum=2026-12-15&zeit=08:30&szene=pool");
  const koord = parseLicht({ lat: "47,41", lon: "9.74" }, now);
  assert.equal(koord.ort, null);
  assert.equal(koord.lat, 47.41);
  assert.equal(parseLicht({ lat: "52.5", lon: "13.4" }, now).ort, "lochau", "außerhalb der Region → Standardort");
  assert.equal(kurzText(z), "Chur, Fenster Südost, 15. Dezember 2026, 8:30 Uhr");
  const text = anfrageText(z, "https://platzhirsch.studio/de/bodensee-licht?x");
  assert.match(text, /^Lichtstudie \(Pool\): Chur, Fenster Südost, 15\. Dezember 2026, 8:30 Uhr\nSonnenstand: 8:30 Uhr, Sonne/);
  assert.match(text, /Link: https:\/\/platzhirsch\.studio\/de\/bodensee-licht\?x$/);
});
