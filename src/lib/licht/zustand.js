// Bodensee-Licht (N4) – Lichtzustand: Standardwerte, URL-Parameter, Texte für
// Werttext (Screenreader), Merkliste, Lichtblatt (PDF) und Anfrage.
//
// URL (kurz und lesbar, damit Links in Mails heil bleiben):
//   ?ort=lochau&fenster=225&datum=2026-12-15&zeit=08:30[&szene=pool]
//   eigene Koordinaten statt Ort: ?lat=47.5&lon=9.75
// Einbau in andere Planer: parseLicht(searchParams) → Zustand,
// lichtParams(zustand) → URLSearchParams (nur die Licht-Schlüssel).
import ORTE_DATEN from "./orte.json" with { type: "json" };
import { formatDatum, himmelsrichtung, parseDatum, sonnenstand, uhrzeit } from "./sonne.js";

export const ORTE = ORTE_DATEN.orte;
export const ORT_STANDARD = "lochau";
export const LAENDER = { AT: "Österreich", DE: "Deutschland", CH: "Schweiz", LI: "Liechtenstein" };
export const SZENEN = [
  { id: "kueche", name: "Küche" },
  { id: "pool", name: "Pool" },
];
/** Regionsgrenzen für eigene Koordinaten (Chur bis Ulm, großzügig). */
export const GRENZEN = { lat: [45.5, 49.5], lon: [7.5, 11.5] };

export const ortNachId = (id) => ORTE.find((o) => o.id === id) || null;

/** Heutiges Datum in Europe/Vienna als "YYYY-MM-DD". */
export function heute(now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

export function standardZustand(now = new Date()) {
  return { ort: ORT_STANDARD, lat: null, lon: null, fenster: 225, datum: heute(now), minuten: 10 * 60 + 30, szene: "kueche" };
}

const zahl = (v) => {
  const t = String(v ?? "").trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const erstes = (v) => (Array.isArray(v) ? v[0] : v);

/** "8:30" | "08:30" → 510, sonst null. */
export function parseZeit(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(text || ""));
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * URLSearchParams | Objekt (Next searchParams) → vollständiger Zustand.
 * Ungültige Werte fallen still auf den Standard zurück.
 */
export function parseLicht(params, now = new Date()) {
  const get = (k) => (typeof params?.get === "function" ? params.get(k) : erstes(params?.[k]));
  const z = standardZustand(now);
  const ort = get("ort");
  if (ort && ortNachId(ort)) z.ort = ort;
  const lat = zahl(get("lat"));
  const lon = zahl(get("lon"));
  if (lat != null && lon != null && lat >= GRENZEN.lat[0] && lat <= GRENZEN.lat[1] && lon >= GRENZEN.lon[0] && lon <= GRENZEN.lon[1]) {
    z.lat = Math.round(lat * 1e4) / 1e4;
    z.lon = Math.round(lon * 1e4) / 1e4;
    z.ort = null;
  }
  const f = zahl(get("fenster"));
  if (f != null) z.fenster = ((Math.round(f) % 360) + 360) % 360;
  const d = parseDatum(get("datum"));
  if (d) z.datum = formatDatum(d);
  const t = parseZeit(get("zeit"));
  if (t != null) z.minuten = t;
  const s = get("szene");
  if (SZENEN.some((x) => x.id === s)) z.szene = s;
  return z;
}

/** Zustand → lesbarer Query-String ohne „?“ (Doppelpunkt der Uhrzeit bleibt lesbar). */
export function lichtQuery(z) {
  return lichtParams(z).toString().replace(/%3A/gi, ":");
}

/** Zustand → URLSearchParams (Standard-Szene wird weggelassen). */
export function lichtParams(z) {
  const p = new URLSearchParams();
  if (z.ort) p.set("ort", z.ort);
  else {
    p.set("lat", String(z.lat));
    p.set("lon", String(z.lon));
  }
  p.set("fenster", String(z.fenster));
  p.set("datum", z.datum);
  p.set("zeit", uhrzeit(z.minuten).padStart(5, "0"));
  if (z.szene && z.szene !== "kueche") p.set("szene", z.szene);
  return p;
}

/** Ort des Zustands: { name, lat, lon, land } */
export function ortVon(z) {
  if (z.ort) {
    const o = ortNachId(z.ort) || ortNachId(ORT_STANDARD);
    return { name: o.name, lat: o.lat, lon: o.lon, land: o.land };
  }
  const f = (v) => v.toFixed(3).replace(".", ",");
  return { name: `${f(z.lat)}° N, ${f(z.lon)}° O`, lat: z.lat, lon: z.lon, land: null };
}

/** "15. Dezember 2026" */
export function datumText(datum, mitJahr = true) {
  const d = parseDatum(datum);
  if (!d) return datum;
  return new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", ...(mitJahr ? { year: "numeric" } : {}), timeZone: "UTC" }).format(
    new Date(Date.UTC(d.jahr, d.monat - 1, d.tag)),
  );
}

/** Fensterrichtung als Text: "Südwest (225°)" */
export function fensterText(grad) {
  return `${himmelsrichtung(grad).adj} (${grad}°)`;
}

/**
 * Werttext für Screenreader und sichtbare Anzeige:
 * "8:30 Uhr, Sonne 9° über dem Horizont, aus Südosten"
 */
export function werttext(sonne, minuten) {
  const h = Math.round(sonne.hoehe);
  const zeit = `${uhrzeit(minuten)} Uhr`;
  if (sonne.hoehe > -0.833) {
    const hoehe = h <= 0 ? "Sonne knapp über dem Horizont" : `Sonne ${h}° über dem Horizont`;
    return `${zeit}, ${hoehe}, aus ${himmelsrichtung(sonne.azimut).name}`;
  }
  return `${zeit}, Sonne ${Math.abs(h)}° unter dem Horizont, kein direktes Sonnenlicht`;
}

/** Sonnenstand für einen Zustand (bequem für Szenen). */
export function sonneVon(z) {
  return sonnenstand(ortVon(z), z.datum, z.minuten);
}

/** Kurzbeschreibung: "Lochau (Studio), Fenster Südwest, 15. Dezember 2026, 8:30 Uhr" */
export function kurzText(z) {
  return `${ortVon(z).name}, Fenster ${himmelsrichtung(z.fenster).adj}, ${datumText(z.datum)}, ${uhrzeit(z.minuten)} Uhr`;
}

/** Mehrzeiliger Text für Anfrage und Lichtblatt. */
export function anfrageText(z, url) {
  const s = sonneVon(z);
  const szene = SZENEN.find((x) => x.id === z.szene)?.name || "Küche";
  const zeilen = [
    `Lichtstudie (${szene}): ${kurzText(z)}`,
    `Sonnenstand: ${werttext(s, z.minuten)} (Azimut ${Math.round(s.azimut)}°).`,
  ];
  if (url) zeilen.push(`Link: ${url}`);
  return zeilen.join("\n");
}

/** Stabiler Kurzschlüssel für die Merkliste (gleicher Zustand → gleiche ID). */
export function zustandSchluessel(z) {
  return lichtQuery(z).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}
