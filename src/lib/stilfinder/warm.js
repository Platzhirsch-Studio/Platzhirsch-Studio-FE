// src/lib/stilfinder/warm.js
// Catalogue rows per profile (short in-memory cache), the shared catalogue
// image loader of the main process and the cache warm-up (QA Runde 1,
// P1.1 b). Server only. Kept free of the PDF renderer, so the result page can
// import it without pulling @react-pdf into its bundle.
import "server-only";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { NEW_API_SERVER } from "@/lib/apiBaseUrl";
import { PROFILES, profileBySlug } from "@/components/Labs/Stilfinder/profiles";
import { seedFromCode } from "@/components/Labs/Stilfinder/questions";
import { BUDGET } from "./config";
import { brandsFor, roomCandidates } from "./rooms";
import { createCatalogImageLoader, warmImages } from "./images";
import { SCENE_ALT_TRIES, altImages, needsCutout } from "./curate";
import { prewarmWorker } from "./pdfPool";

const withTimeout = (p, ms, fallback) => Promise.race([p.catch(() => fallback), new Promise((r) => setTimeout(() => r(fallback), ms))]);

export const loadImage = createCatalogImageLoader({ server: NEW_API_SERVER });

// Catalogue rows per profile, kept for a few minutes (the backoffice answer
// for one brand is the same for every customer of that profile).
const catalogCache = new Map();
const CATALOG_TTL_MS = 10 * 60 * 1000;
export async function catalogFor(profileKey) {
  const hit = catalogCache.get(profileKey);
  if (hit && Date.now() - hit.at < CATALOG_TTL_MS) return { byBrand: hit.byBrand, cached: true };
  const brands = brandsFor(profileKey);
  const rows = await Promise.all(brands.map((b) => withTimeout(fetchProdukteNewByMarke(b), BUDGET.catalogMs, [])));
  const byBrand = Object.fromEntries(brands.map((b, i) => [b, Array.isArray(rows[i]) ? rows[i] : []]));
  if (rows.some((r) => Array.isArray(r) && r.length)) catalogCache.set(profileKey, { byBrand, at: Date.now() });
  return { byBrand, cached: false };
}

const cmxOf = (row) => {
  const first = row?.bild_anhangen?.[0]?.bild_anhangen || "";
  return first.startsWith("/files/") ? `/cmx${first}` : null;
};

// Pre-loads the candidate images of a profile (curator picks + the seeded
// slot candidates) into the disk cache, so the customer's PDF finds its
// pictures ready. Fire and forget; once per profile and 6 hours per process.
const warmed = new Map();
// QA Runde 3, P2.7: a real order has priority. While a PDF is being built the
// warm-up pauses (the result page and the API route are separate bundles in
// Next, so the counter lives on globalThis).
const WARM = (globalThis.__stilfinderWarm ||= { jobs: 0 });
export function orderStarted() {
  WARM.jobs++;
}
export function orderFinished() {
  WARM.jobs = Math.max(0, WARM.jobs - 1);
}
export const orderRunning = () => WARM.jobs > 0;
export function warmProfile(slugOrKey) {
  const profile = profileBySlug(slugOrKey) || PROFILES[slugOrKey];
  if (!profile) return;
  prewarmWorker();
  const last = warmed.get(profile.key);
  if (last && Date.now() - last < 6 * 60 * 60 * 1000) return;
  warmed.set(profile.key, Date.now());
  (async () => {
    // wait (max. 30 s) while an order is being built, e.g. the call right after a PDF
    for (let i = 0; i < 60 && orderRunning(); i++) await new Promise((r) => setTimeout(r, 500));
    const { byBrand } = await catalogFor(profile.key);
    const paths = new Set();
    for (const seed of [seedFromCode(profile.slug), 1, 2])
      for (const row of Object.values(roomCandidates(profile.key, byBrand, seed)).flat()) {
        paths.add(cmxOf(row));
        // Abnahme Runde 3, Restliste 1: the cut-out candidates of detail pieces
        if (needsCutout(String(row.kategories || "").toLowerCase())) for (const p of altImages(row).slice(0, SCENE_ALT_TRIES)) paths.add(p);
      }
    const r = await warmImages(loadImage, [...paths].filter(Boolean), {
      shouldStop: orderRunning,
    });
    if (r.stopped) {
      // paused for an order: try again with the next page view or PDF
      warmed.delete(profile.key);
      console.info(`[stilfinder] Vorwärmen ${profile.slug} angehalten (Auftrag hat Vorrang): ${r.ok}/${r.total}`);
      return;
    }
    console.info(`[stilfinder] Bild-Cache ${profile.slug} vorgewärmt: ${r.ok}/${r.total}`);
  })().catch((e) => {
    warmed.delete(profile.key);
    console.warn("[stilfinder] Vorwärmen fehlgeschlagen:", e?.message || e);
  });
}
