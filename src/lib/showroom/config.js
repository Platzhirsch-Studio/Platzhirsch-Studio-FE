// src/lib/showroom/config.js – Schalter des Rundgangs /[locale]/showroom (N1).
//
// SHOWROOM_PUBLIC = SHOWROOM_SWITCH && manifestReady(manifest, hotspots).ok
//
// Der Schalter steht auf an (Inhaber-Entscheidung Nr. 9: Features fester Teil
// der Seite), öffentlich wird die Seite aber erst, wenn das Manifest eine
// echte, freigegebene Aufnahme beschreibt (neuland.md §2.5 Fallback 2: „ohne
// Aufnahme kein Platzhalter live“). Bis dahin:
//   Produktion   → 404 (notFound), nicht in Sitemap, llms.txt oder Menü
//   Entwicklung  → Vorschau (noindex) mit der synthetischen Testszene
//   SHOWROOM_PREVIEW=1 beim Build (nur platzhirsch-prodtest, Messung) → Vorschau
//
// Rein: keine Pakete, keine "@/"-Aliase. Seite, Sitemap-Code und node --test
// importieren es. Jede Funktion nimmt ihre Eingaben als Parameter, damit
// Tests beide Zustände prüfen (tests/unit/showroom-hotspots.test.mjs).
import MANIFEST from "./manifest.json" with { type: "json" };
import HOTSPOTS from "./hotspots.json" with { type: "json" };
// Tempo fix1: stations.js (no imports) instead of data.js – this module is in
// the consent chunk of every page via legal/services.js.
import { visibleStations } from "./stations.js";

/** Feature-Schalter. Aus (false) nimmt die Seite auch mit Aufnahme vom Netz. */
export const SHOWROOM_SWITCH = true;

/** Pfad nach dem Locale-Präfix (gleich in allen Sprachen). */
export const SHOWROOM_PATH = "/showroom";

/** Budgets (neuland.md §2.4). */
export const BUDGET = Object.freeze({
  posterAvifBytes: 120 * 1024,
  firstSplatBytes: 20 * 1024 * 1024,
  minStations: 6,
  maxStations: 10,
  minAbnahmeNote: 8,
});

/**
 * Ist die echte Aufnahme vollständig und freigegeben?
 * @returns {{ ok: boolean, gruende: string[] }}
 */
export function manifestReady(manifest = MANIFEST, hotspots = HOTSPOTS) {
  const gruende = [];
  const a = manifest?.aufnahme;
  if (!a) gruende.push("keine Aufnahme im Manifest");
  else {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.datum || "")) gruende.push("Aufnahmedatum fehlt");
    if (a.freigabe?.inhaber !== true) gruende.push("Freigabe Inhaber fehlt");
    if (a.freigabe?.personen !== true) gruende.push("Einwilligung sichtbarer Personen fehlt (oder keine Personen bestätigt)");
    if (!(Number(a.abnahme?.note) >= BUDGET.minAbnahmeNote)) gruende.push(`Abnahme-Note < ${BUDGET.minAbnahmeNote}/10`);
  }
  if (!manifest?.stand) gruende.push("Ausstellungsstand fehlt");
  const zonen = Array.isArray(manifest?.zonen) ? manifest.zonen : [];
  if (!zonen.length) gruende.push("keine Zone");
  for (const z of zonen) {
    const tag = z.stimmungen?.tag;
    const lo = tag?.lod?.find((l) => l.id === "lo");
    if (!lo?.url) gruende.push(`Zone ${z.id}: lo.sog fehlt`);
    else if (lo.bytes > BUDGET.firstSplatBytes) gruende.push(`Zone ${z.id}: lo.sog > 20 MB`);
    if (!tag?.poster?.avif) gruende.push(`Zone ${z.id}: Poster fehlt`);
    else if (tag.poster.bytes?.avif > BUDGET.posterAvifBytes) gruende.push(`Zone ${z.id}: Poster > 120 KB`);
  }
  const stations = visibleStations(hotspots);
  if (stations.length < BUDGET.minStations) gruende.push(`weniger als ${BUDGET.minStations} Stationen`);
  if (stations.length > BUDGET.maxStations) gruende.push(`mehr als ${BUDGET.maxStations} Stationen`);
  const zoneIds = new Set(zonen.map((z) => z.id));
  for (const s of stations) if (!zoneIds.has(s.zone)) gruende.push(`Station ${s.id}: Zone ${s.zone} fehlt im Manifest`);
  if (!hotspots?.stand) gruende.push("Stand der Stücke fehlt");
  return { ok: gruende.length === 0, gruende };
}

/** Öffentlich? (gekoppelt an das Manifest, siehe oben) */
export const SHOWROOM_PUBLIC = SHOWROOM_SWITCH && manifestReady().ok;

/**
 * Auslieferungsmodus der Seite.
 *   "public"   echte Aufnahme, indexierbar
 *   "preview"  Entwicklung bzw. SHOWROOM_PREVIEW=1: noindex, echte Daten oder Testszene
 *   "off"      Produktion ohne Aufnahme: 404
 */
export function showroomMode({
  isPublic = SHOWROOM_PUBLIC,
  nodeEnv = process.env.NODE_ENV,
  preview = process.env.SHOWROOM_PREVIEW,
  switchOn = SHOWROOM_SWITCH,
} = {}) {
  if (!switchOn) return "off";
  if (isPublic) return "public";
  if (nodeEnv !== "production" || preview === "1") return "preview";
  return "off";
}

/** robots für generateMetadata(): nur öffentlich indexierbar. */
export function showroomRobots(mode) {
  if (mode === "public") return { index: true, follow: true };
  return { index: false, follow: false, googleBot: { index: false, follow: false } };
}

/**
 * QM Inhaber-Entscheidung Nr. 7, 02.11.: Die Showroom-Testszene (Low-Poly) wird
 * erst mit echtem Material verlinkt. DIE eine Bedingung für alle Links und Teaser
 * auf /showroom (Menü: shellNav.js navFeatures, Startseite/Leistungen: features.js
 * hubFeatures, Footer: seo/footerLinks.js, Sitemap/llms.txt: showroomSitemapPaths,
 * Vorschauen kino-zeichnung/pinterest). Die Seite selbst bleibt im Modus
 * "preview" erreichbar (noindex, showroomRobots); mit echter Aufnahme im Manifest
 * (manifestReady().ok) kommen alle Links automatisch zurück.
 * @param {{ mode?: string, ready?: boolean }} [opts] für Tests
 */
export function showroomSichtbar({ mode = showroomMode(), ready = manifestReady().ok } = {}) {
  return mode !== "off" && ready === true;
}

/**
 * Sitemap-Einträge für das Integrationsteam (src/lib/seo/sitemapEntries.js):
 * leer, solange die Seite nicht öffentlich ist (QM Nr. 7: showroomSichtbar()).
 */
export function showroomSitemapPaths(isPublic = showroomSichtbar()) {
  return isPublic ? [SHOWROOM_PATH] : [];
}

export { MANIFEST, HOTSPOTS };
