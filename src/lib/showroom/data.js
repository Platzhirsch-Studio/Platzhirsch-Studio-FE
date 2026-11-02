// src/lib/showroom/data.js – Stationen, Stücke (Hotspots) und Manifest des Rundgangs (N1).
//
// Datenquellen (alle in diesem Ordner):
//   manifest.json   Zonen, Stimmungen (tag/abend), LOD-Dateien, Poster, Videos
//                   (geschrieben von tools/splat/pack.mjs und media.mjs)
//   hotspots.json   echte Stationen und Stücke der Ausstellung (leer bis zur Aufnahme)
//   testszene.json  synthetische Testszene, nur Entwicklung
//
// Regeln (Unit-Test tests/unit/showroom-hotspots.test.mjs):
//   - rechte "pruefen" → kein Hotspot; imShowroom false → kein Hotspot
//   - Händler-Wort nur über dealerLine() und nur für ClassiCon/Ezarri (haendler: true)
//   - Station typ "haralds-tisch" nur mit echtem Material (material[] mit src + quelle),
//     sonst fällt sie weg – kein Platzhalter (Inhaber-Entscheidung Nr. 8)
//
// Rein, ohne Pakete.
import { DEALER_BRANDS, dealerLine, pick } from "./copy.js";
import { localizeShowroomHref } from "./paths.js";
import { findClaims, hasDealerClaim } from "../legal/claims.js";
import { hasRealMaterial, visibleHotspots, visibleStations } from "./stations.js";

export const RECHTE = Object.freeze(["ok", "pruefen"]);
export const AKTIONEN = Object.freeze(["produkt", "ar", "merken", "termin"]);
export const STIMMUNGEN = Object.freeze(["tag", "abend"]);

const isVec3 = (v) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number" && Number.isFinite(n));
const isLocaleMap = (v) => typeof v === "string" || (v && typeof v === "object" && typeof v.de === "string" && v.de.length > 0);

// Sichtbarkeit von Stationen und Stücken: eigenes Modul ohne Importe
// (Tempo fix1), hier weitergereicht.
export { hasRealMaterial, hotspotAllowed, visibleHotspots, visibleStations } from "./stations.js";

/** Freitext mit Händler-Formulierung (Erkennung aus src/lib/legal/claims.js, alle Sprachen)? */
export function textHasDealerWord(text) {
  return hasDealerClaim(String(text || ""));
}

/** Freitext mit Superlativ ohne Beleg? */
export function textHasSuperlative(text) {
  return findClaims(String(text || "")).some((f) => f.type === "superlative");
}

/**
 * Schema-Prüfung einer Stations-/Stückdatei. Liefert eine Liste von Fehlern (leer = gültig).
 */
export function validateData(data) {
  const err = [];
  if (!data || data.schema !== 1) err.push("schema muss 1 sein");
  if (data?.stand != null && !/^\d{4}-\d{2}(-\d{2})?$/.test(data.stand)) err.push("stand: JJJJ-MM oder JJJJ-MM-TT");
  const stations = Array.isArray(data?.stationen) ? data.stationen : null;
  const hotspots = Array.isArray(data?.hotspots) ? data.hotspots : null;
  if (!stations) err.push("stationen muss eine Liste sein");
  if (!hotspots) err.push("hotspots muss eine Liste sein");
  const sIds = new Set();
  for (const s of stations || []) {
    const p = `Station ${s?.id ?? "?"}`;
    if (!s?.id || typeof s.id !== "string") err.push(`${p}: id fehlt`);
    if (sIds.has(s?.id)) err.push(`${p}: id doppelt`);
    sIds.add(s?.id);
    if (!s?.zone) err.push(`${p}: zone fehlt`);
    if (!isLocaleMap(s?.titel)) err.push(`${p}: titel (mind. de) fehlt`);
    if (!isLocaleMap(s?.text)) err.push(`${p}: text (mind. de) fehlt`);
    if (!s?.nurFoto && (!isVec3(s?.kamera?.pos) || !isVec3(s?.kamera?.ziel))) err.push(`${p}: kamera.pos/ziel [x,y,z] fehlt`);
    if (s?.nurFoto && !s?.foto?.src) err.push(`${p}: nurFoto ohne foto.src`);
    if (s?.foto && (!s.foto.src || !s.foto.alt)) err.push(`${p}: foto braucht src und alt`);
    if (s?.typ === "haralds-tisch" && s.material?.length && !hasRealMaterial(s)) err.push(`${p}: material braucht src (unter /) und quelle`);
    for (const lang of ["de", "en", "fr", "it"]) {
      const t = `${pick(s?.titel, lang)} ${pick(s?.text, lang)}`;
      if (textHasDealerWord(t)) err.push(`${p}: Claim-Formulierung im Stationstext (${lang}) – nur über das Claim-Feld (Claim-Register)`);
      if (textHasSuperlative(t)) err.push(`${p}: Superlativ im Stationstext (${lang})`);
    }
  }
  const hIds = new Set();
  for (const h of hotspots || []) {
    const p = `Hotspot ${h?.id ?? "?"}`;
    if (!h?.id) err.push(`${p}: id fehlt`);
    if (hIds.has(h?.id)) err.push(`${p}: id doppelt`);
    hIds.add(h?.id);
    if (!sIds.has(h?.station)) err.push(`${p}: station ${h?.station} unbekannt`);
    if (!isVec3(h?.pos)) err.push(`${p}: pos [x,y,z] fehlt`);
    if (!h?.label || typeof h.label !== "string") err.push(`${p}: label fehlt`);
    if (!RECHTE.includes(h?.rechte)) err.push(`${p}: rechte muss ok oder pruefen sein`);
    if (typeof h?.imShowroom !== "boolean") err.push(`${p}: imShowroom true/false fehlt`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(h?.stand || "")) err.push(`${p}: stand JJJJ-MM-TT fehlt`);
    if (!Array.isArray(h?.aktionen) || !h.aktionen.length || h.aktionen.some((a) => !AKTIONEN.includes(a))) err.push(`${p}: aktionen nur ${AKTIONEN.join("/")}`);
    if (h?.aktionen?.includes("produkt") && !(typeof h.productPath === "string" && h.productPath.startsWith("/"))) err.push(`${p}: Aktion produkt ohne productPath`);
    if (h?.aktionen?.includes("ar") && !(typeof h.arPath === "string" && h.arPath.startsWith("/"))) err.push(`${p}: Aktion ar ohne arPath`);
    if (h?.haendler === true && !DEALER_BRANDS.includes(h?.marke)) err.push(`${p}: Claim-Feld nur bei ${DEALER_BRANDS.join("/")}`);
    const free = [h?.label, h?.masse, pick(h?.text, "de"), pick(h?.text, "en"), pick(h?.text, "fr"), pick(h?.text, "it")].filter(Boolean).join(" ");
    if (textHasDealerWord(free)) err.push(`${p}: Claim-Formulierung im Freitext – nur über das Claim-Feld (Claim-Register)`);
    if (textHasSuperlative(free)) err.push(`${p}: Superlativ im Freitext`);
    if (/€|eur\b|chf|preis|price|prix|prezzo/i.test(free)) err.push(`${p}: keine Preise (auf Anfrage)`);
    if (/minotti/i.test(h?.marke || "") && h?.bild) err.push(`${p}: keine Minotti-Herstellerbilder`);
  }
  return err;
}

/** Zone aus dem Manifest (echte Zonen oder die Testszene). */
export function zoneOf(manifest, id) {
  if (manifest?.testszene?.id === id) return manifest.testszene;
  return (manifest?.zonen || []).find((z) => z.id === id) || null;
}

/** Bytes des ersten Splat-Downloads (lo-Stufe, Stimmung tag) einer Zone. */
export function firstBytes(zone) {
  return zone?.stimmungen?.tag?.lod?.find((l) => l.id === "lo")?.bytes ?? null;
}

/**
 * Rundgang für den Client: Texte in der Sprache aufgelöst, nur erlaubte
 * Stationen und Stücke, nur die Manifest-Teile, die der Viewer braucht.
 * @param {{ data: object, manifest: object, locale: string, test?: boolean }} p
 */
export function buildTour({ data, manifest, locale = "de", test = false }) {
  const stations = visibleStations(data);
  const hotspots = visibleHotspots(data);
  const zonen = {};
  for (const s of stations) {
    if (zonen[s.zone]) continue;
    const z = zoneOf(manifest, s.zone);
    if (!z) continue;
    const stimmungen = {};
    for (const st of STIMMUNGEN) {
      const m = z.stimmungen?.[st];
      if (!m?.lod?.length) continue;
      stimmungen[st] = {
        lod: m.lod.map((l) => ({ id: l.id, url: l.url, bytes: l.bytes ?? null })),
        poster: m.poster || null,
        video: m.video || null,
      };
    }
    zonen[s.zone] = { id: z.id, drehung: z.drehung || [1, 0, 0, 0], stimmungen };
  }
  const tourStations = stations
    .filter((s) => zonen[s.zone] || s.nurFoto)
    .map((s) => ({
      id: s.id,
      zone: s.zone,
      titel: pick(s.titel, locale),
      text: pick(s.text, locale),
      kamera: s.kamera || null,
      foto: s.foto ? { ...s.foto, alt: pick(s.foto.alt, locale) } : null,
      nurFoto: Boolean(s.nurFoto),
      material: hasRealMaterial(s) ? s.material.map((m) => ({ ...m, alt: pick(m.alt, locale) })) : null,
      hotspots: hotspots
        .filter((h) => h.station === s.id)
        .map((h) => ({
          id: h.id,
          pos: h.pos,
          label: h.label,
          marke: h.marke || null,
          dealer: h.haendler === true ? dealerLine(h.marke, locale) : null,
          masse: h.masse || null,
          text: pick(h.text, locale) || null,
          merkHref: h.productPath || "/showroom",
          productLink: h.productPath ? localizeShowroomHref(h.productPath, locale) : null,
          arLink: h.arPath ? localizeShowroomHref(h.arPath, locale) : null,
          aktionen: h.aktionen,
        })),
    }));
  const firstZone = tourStations[0] ? zonen[tourStations[0].zone] : null;
  const tag = firstZone?.stimmungen?.tag || null;
  return {
    test,
    stand: data?.stand || manifest?.stand || null,
    stations: tourStations,
    zonen,
    poster: tag?.poster || null,
    video: tag?.video || null,
    firstBytes: firstBytes(firstZone),
    hatAbend: Object.values(zonen).some((z) => z.stimmungen.abend),
  };
}
