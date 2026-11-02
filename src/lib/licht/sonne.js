// Bodensee-Licht (Neuland N4) – Sonnenstand als reine Funktion.
//
// Algorithmus: NOAA Solar Calculator (Global Monitoring Laboratory,
// https://gml.noaa.gov/grad/solcalc/, nach Meeus „Astronomical Algorithms“),
// eigenständig umgesetzt, ohne Paket und ohne Netz. Genauigkeit laut NOAA
// besser als 1 Bogenminute für Jahre 1800–2100 zwischen ±72° Breite;
// tests/unit/licht-sonne.test.mjs prüft ≤ 0,5° gegen die NOAA-Referenz.
//
// Zeitzone: Alle Orte der Liste (AT, DE, CH, LI) haben MEZ/MESZ mit der
// EU-Sommerzeitregel (seit 1996; die Schweiz folgt ihr seit 1981):
// MESZ von letztem Sonntag im März 01:00 UTC bis letztem Sonntag im Oktober
// 01:00 UTC. Deshalb rechnet utcOffsetMinuten() ohne Intl/Zeitzonendaten.
//
// Konventionen: Azimut in Grad ab Nord im Uhrzeigersinn (90 = Ost,
// 180 = Süd), Höhe in Grad über dem Horizont inkl. Refraktion (wie NOAA).
// Uhrzeiten sind „Minuten nach Mitternacht“ in Ortszeit (MEZ/MESZ).

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Zenitwinkel für Auf-/Untergang: 90° + 34' Refraktion + 16' Sonnenradius. */
export const ZENIT_AUFGANG = 90.833;

// ---------------------------------------------------------------------------
// Datum und Zeitzone

/** "2026-12-15" → { jahr, monat, tag } oder null. */
export function parseDatum(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || ""));
  if (!m) return null;
  const jahr = +m[1];
  const monat = +m[2];
  const tag = +m[3];
  if (monat < 1 || monat > 12 || tag < 1 || tag > tageImMonat(jahr, monat)) return null;
  if (jahr < 1900 || jahr > 2099) return null;
  return { jahr, monat, tag };
}

export function formatDatum({ jahr, monat, tag }) {
  return `${jahr}-${String(monat).padStart(2, "0")}-${String(tag).padStart(2, "0")}`;
}

export function tageImMonat(jahr, monat) {
  return new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
}

/** Tag des Monats des letzten Sonntags. */
function letzterSonntag(jahr, monat) {
  const letzter = tageImMonat(jahr, monat);
  const wochentag = new Date(Date.UTC(jahr, monat - 1, letzter)).getUTCDay(); // 0 = So
  return letzter - wochentag;
}

/**
 * UTC-Versatz der Ortszeit in Minuten (60 = MEZ, 120 = MESZ) für ein lokales
 * Datum und eine lokale Uhrzeit. Umstellungstage: im März gilt ab 02:00
 * Ortszeit MESZ (die Stunde 02:00–03:00 gibt es nicht, sie wird als MESZ
 * gelesen), im Oktober bis 03:00 Ortszeit noch MESZ.
 */
export function utcOffsetMinuten(jahr, monat, tag, minutenLokal = 720) {
  if (monat > 3 && monat < 10) return 120;
  if (monat < 3 || monat > 10) return 60;
  if (monat === 3) {
    const ls = letzterSonntag(jahr, 3);
    if (tag > ls) return 120;
    if (tag < ls) return 60;
    return minutenLokal >= 120 ? 120 : 60;
  }
  const ls = letzterSonntag(jahr, 10);
  if (tag < ls) return 120;
  if (tag > ls) return 60;
  return minutenLokal < 180 ? 120 : 60;
}

export const istSommerzeit = (jahr, monat, tag, minutenLokal) => utcOffsetMinuten(jahr, monat, tag, minutenLokal) === 120;

/** Julianisches Datum um 0 h UT des Kalendertags (gregorianisch). */
export function julianDay(jahr, monat, tag) {
  let y = jahr;
  let m = monat;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + tag + b - 1524.5;
}

// ---------------------------------------------------------------------------
// Sonnenbahn (NOAA-Reihen in julianischen Jahrhunderten seit J2000.0)

const jahrhunderte = (jd) => (jd - 2451545.0) / 36525.0;

function normal360(x) {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

function sonnenGroessen(t) {
  const l0 = normal360(280.46646 + t * (36000.76983 + t * 0.0003032)); // mittlere Länge
  const m = 357.52911 + t * (35999.05029 - 0.0001537 * t); // mittlere Anomalie
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t); // Exzentrizität
  const mr = m * RAD;
  const c =
    Math.sin(mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * mr) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * mr) * 0.000289; // Mittelpunktsgleichung
  const wahreLaenge = l0 + c;
  const omega = 125.04 - 1934.136 * t;
  const lambda = wahreLaenge - 0.00569 - 0.00478 * Math.sin(omega * RAD); // scheinbare Länge
  const sek = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  const eps0 = 23 + (26 + sek / 60) / 60; // mittlere Schiefe
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD); // korrigierte Schiefe
  const deklination = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) * DEG;

  let y = Math.tan((eps * RAD) / 2);
  y *= y;
  const l0r = l0 * RAD;
  const zeitgleichung =
    4 *
    DEG *
    (y * Math.sin(2 * l0r) -
      2 * e * Math.sin(mr) +
      4 * e * y * Math.sin(mr) * Math.cos(2 * l0r) -
      0.5 * y * y * Math.sin(4 * l0r) -
      1.25 * e * e * Math.sin(2 * mr)); // Minuten
  return { deklination, zeitgleichung };
}

/** Atmosphärische Refraktion in Grad (NOAA-Näherung), für die geometrische Höhe. */
export function refraktion(hoehe) {
  if (hoehe > 85) return 0;
  const te = Math.tan(hoehe * RAD);
  let sek;
  if (hoehe > 5) sek = 58.1 / te - 0.07 / te ** 3 + 0.000086 / te ** 5;
  else if (hoehe > -0.575) sek = 1735 + hoehe * (-518.2 + hoehe * (103.4 + hoehe * (-12.79 + hoehe * 0.711)));
  else sek = -20.774 / te;
  return sek / 3600;
}

/**
 * Sonnenstand für einen Zeitpunkt in UT.
 *   jd0      julianisches Datum 0 h UT des Kalendertags (julianDay())
 *   minUT    Minuten seit 0 h UT (darf < 0 oder > 1440 sein)
 * → { azimut, hoehe, hoeheGeometrisch, deklination, zeitgleichung, stundenwinkel }
 */
export function sonnenstandUT(lat, lon, jd0, minUT) {
  const t = jahrhunderte(jd0 + minUT / 1440);
  const { deklination, zeitgleichung } = sonnenGroessen(t);
  // Wahre Sonnenzeit (Minuten) und Stundenwinkel (Grad, 0 = Mittag, + = Nachmittag)
  let wahreZeit = (minUT + zeitgleichung + 4 * lon) % 1440;
  if (wahreZeit < 0) wahreZeit += 1440;
  let stundenwinkel = wahreZeit / 4 - 180;
  if (stundenwinkel < -180) stundenwinkel += 360;

  const latR = lat * RAD;
  const decR = deklination * RAD;
  const haR = stundenwinkel * RAD;
  const cosZ = Math.min(1, Math.max(-1, Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR)));
  const zenit = Math.acos(cosZ) * DEG;
  const hoeheGeometrisch = 90 - zenit;

  // Azimut ab Nord im Uhrzeigersinn über atan2 (stabil, auch nahe Zenit)
  const az = Math.atan2(Math.sin(haR), Math.cos(haR) * Math.sin(latR) - Math.tan(decR) * Math.cos(latR)) * DEG + 180;
  const azimut = normal360(az);
  const hoehe = hoeheGeometrisch + refraktion(hoeheGeometrisch);
  return { azimut, hoehe, hoeheGeometrisch, deklination, zeitgleichung, stundenwinkel };
}

/**
 * Sonnenstand für Ortszeit (MEZ/MESZ).
 *   ort      { lat, lon }
 *   datum    "YYYY-MM-DD" oder { jahr, monat, tag }
 *   minuten  Minuten nach Mitternacht Ortszeit (0–1439)
 * → { azimut, hoehe, …, utcOffset, sommerzeit, ueberHorizont }
 */
export function sonnenstand({ lat, lon }, datum, minuten) {
  const d = typeof datum === "string" ? parseDatum(datum) : datum;
  if (!d) throw new Error(`ungültiges Datum: ${datum}`);
  const offset = utcOffsetMinuten(d.jahr, d.monat, d.tag, minuten);
  const r = sonnenstandUT(lat, lon, julianDay(d.jahr, d.monat, d.tag), minuten - offset);
  return { ...r, utcOffset: offset, sommerzeit: offset === 120, ueberHorizont: r.hoehe > -0.833 };
}

// ---------------------------------------------------------------------------
// Tageslauf

/** Ortszeit (Minuten) eines Ereignisses mit Stundenwinkel ha (Grad) um den Sonnenmittag, iteriert. */
function ereignisMinuten(lat, lon, jd0, offset, zenit, aufgang) {
  let minUT = 720 - 4 * lon;
  for (let i = 0; i < 3; i++) {
    const { deklination, zeitgleichung } = sonnenGroessen(jahrhunderte(jd0 + minUT / 1440));
    const latR = lat * RAD;
    const decR = deklination * RAD;
    const arg = Math.cos(zenit * RAD) / (Math.cos(latR) * Math.cos(decR)) - Math.tan(latR) * Math.tan(decR);
    if (arg > 1) return { polar: "nacht" };
    if (arg < -1) return { polar: "tag" };
    const ha = Math.acos(arg) * DEG * (aufgang ? 1 : -1);
    minUT = 720 - 4 * (lon + ha) - zeitgleichung;
  }
  return { minuten: minUT + offset };
}

/**
 * Tagesdaten für Ort und Datum (Ortszeit-Minuten):
 * { aufgang, untergang, mittag, hoeheMittag, aufgangAzimut, untergangAzimut,
 *   tageslaenge, daemmerungMorgen, daemmerungAbend, polar }
 * daemmerung* = bürgerliche Dämmerung (Sonne 6° unter dem Horizont).
 */
export function sonnenTag({ lat, lon }, datum) {
  const d = typeof datum === "string" ? parseDatum(datum) : datum;
  if (!d) throw new Error(`ungültiges Datum: ${datum}`);
  const jd0 = julianDay(d.jahr, d.monat, d.tag);
  const offset = utcOffsetMinuten(d.jahr, d.monat, d.tag, 720);

  // Sonnenmittag: wahre Sonnenzeit 12:00, zweimal iteriert
  let mittagUT = 720 - 4 * lon;
  for (let i = 0; i < 2; i++) mittagUT = 720 - 4 * lon - sonnenGroessen(jahrhunderte(jd0 + mittagUT / 1440)).zeitgleichung;
  const mittag = mittagUT + offset;
  const amMittag = sonnenstandUT(lat, lon, jd0, mittagUT);

  const auf = ereignisMinuten(lat, lon, jd0, offset, ZENIT_AUFGANG, true);
  const unter = ereignisMinuten(lat, lon, jd0, offset, ZENIT_AUFGANG, false);
  const dm = ereignisMinuten(lat, lon, jd0, offset, 96, true);
  const da = ereignisMinuten(lat, lon, jd0, offset, 96, false);
  const polar = auf.polar || null;
  const aufgang = auf.minuten ?? null;
  const untergang = unter.minuten ?? null;
  const az = (m) => (m == null ? null : sonnenstandUT(lat, lon, jd0, m - offset).azimut);
  return {
    datum: formatDatum(d),
    utcOffset: offset,
    sommerzeit: offset === 120,
    mittag,
    hoeheMittag: amMittag.hoehe,
    aufgang,
    untergang,
    aufgangAzimut: az(aufgang),
    untergangAzimut: az(untergang),
    tageslaenge: aufgang != null && untergang != null ? untergang - aufgang : polar === "tag" ? 1440 : 0,
    daemmerungMorgen: dm.minuten ?? null,
    daemmerungAbend: da.minuten ?? null,
    polar,
  };
}

/** Punkte der Tagesbahn [{ minuten, azimut, hoehe }] von 0 bis 24 Uhr Ortszeit. */
export function sonnenBahn(ort, datum, schrittMinuten = 10) {
  const d = typeof datum === "string" ? parseDatum(datum) : datum;
  const punkte = [];
  for (let m = 0; m <= 1440; m += schrittMinuten) {
    const s = sonnenstand(ort, d, Math.min(m, 1439.99));
    punkte.push({ minuten: m, azimut: s.azimut, hoehe: s.hoehe });
  }
  return punkte;
}

// ---------------------------------------------------------------------------
// Himmelsrichtungen und Fenster

const RICHTUNGEN = [
  { kurz: "N", name: "Norden", adj: "Nord" },
  { kurz: "NO", name: "Nordosten", adj: "Nordost" },
  { kurz: "O", name: "Osten", adj: "Ost" },
  { kurz: "SO", name: "Südosten", adj: "Südost" },
  { kurz: "S", name: "Süden", adj: "Süd" },
  { kurz: "SW", name: "Südwesten", adj: "Südwest" },
  { kurz: "W", name: "Westen", adj: "West" },
  { kurz: "NW", name: "Nordwesten", adj: "Nordwest" },
];

/** Achtelrichtung zu einem Azimut: { kurz: "SO", name: "Südosten", adj: "Südost", grad: 135 }. */
export function himmelsrichtung(azimut) {
  const i = Math.round(normal360(azimut) / 45) % 8;
  return { ...RICHTUNGEN[i], grad: i * 45 };
}

export const ACHT_RICHTUNGEN = RICHTUNGEN.map((r, i) => ({ ...r, grad: i * 45 }));

/** Kleinster Winkel zwischen zwei Azimuten (−180 … 180, + = b liegt rechts von a). */
export function winkelDifferenz(a, b) {
  let d = normal360(b - a);
  if (d > 180) d -= 360;
  return d;
}

/**
 * Fällt direkte Sonne durch ein senkrechtes Fenster, das nach `fensterAzimut`
 * hinausschaut? Berge, Bäume und Nachbarhäuser sind bewusst NICHT
 * berücksichtigt (das sieht man nur vor Ort).
 *   fenster { azimut, bruestung = 0.9, sturz = 2.1 }  (Meter über Boden)
 * → { scheint, relativ, einfall, tiefeMax, tiefeMin }
 *   relativ   Sonne relativ zur Fensternormalen (Grad, + = rechts beim Hinausschauen)
 *   einfall   Winkel zwischen Sonnenstrahl und Fensternormale (0 = senkrecht)
 *   tiefe*    wie weit der Sonnenfleck auf dem Boden in den Raum reicht (m, senkrecht zur Wand)
 */
export function fensterSonne(sonne, { azimut, bruestung = 0.9, sturz = 2.1 }) {
  const relativ = winkelDifferenz(azimut, sonne.azimut);
  const cosRel = Math.cos(relativ * RAD);
  const h = sonne.hoehe;
  const scheint = h > 0.5 && cosRel > 0.02;
  if (!scheint) return { scheint: false, relativ, einfall: null, tiefeMax: 0, tiefeMin: 0 };
  const einfall = Math.acos(Math.min(1, Math.cos(h * RAD) * cosRel)) * DEG;
  const tanH = Math.tan(h * RAD);
  const tiefe = (hoehe) => (hoehe / tanH) * cosRel;
  return { scheint: true, relativ, einfall, tiefeMax: tiefe(sturz), tiefeMin: tiefe(bruestung) };
}

/**
 * Zeitfenster mit direkter Sonne durchs Fenster an einem Tag:
 * [{ von, bis }] in Ortszeit-Minuten, plus Summe in Minuten.
 */
export function sonnenZeitenFenster(ort, datum, fensterAzimut, schrittMinuten = 5) {
  const d = typeof datum === "string" ? parseDatum(datum) : datum;
  const bereiche = [];
  let offen = null;
  for (let m = 0; m <= 1440; m += schrittMinuten) {
    const s = sonnenstand(ort, d, Math.min(m, 1439.99));
    const an = fensterSonne(s, { azimut: fensterAzimut }).scheint;
    if (an && offen == null) offen = m;
    if (!an && offen != null) {
      bereiche.push({ von: offen, bis: m });
      offen = null;
    }
  }
  if (offen != null) bereiche.push({ von: offen, bis: 1440 });
  return { bereiche, summe: bereiche.reduce((a, b) => a + (b.bis - b.von), 0) };
}

// ---------------------------------------------------------------------------
// Formatierung (Deutsch)

/** 510 → "8:30" */
export function uhrzeit(minuten) {
  const m = ((Math.round(minuten) % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** 285 → "4 h 45 min" */
export function dauer(minuten) {
  const m = Math.round(minuten);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** Vektor zur Sonne in einem Ost-Nord-Oben-System (x = Ost, y = oben, z = Süd). */
export function sonnenVektor(azimut, hoehe) {
  const a = azimut * RAD;
  const h = hoehe * RAD;
  return { x: Math.cos(h) * Math.sin(a), y: Math.sin(h), z: -Math.cos(h) * Math.cos(a) };
}
