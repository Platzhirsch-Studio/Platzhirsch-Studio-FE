// AR-Viewer: das ganze Sortiment aus dem Backoffice (nur lesen).
//
// Quelle: Frappe "Produkte New" über die bestehenden Fetcher in src/lib/api
// (Guest-GET, Next-Data-Cache 1 h, Tag "products"); Produkte je Marke über einen
// strengen eigenen Abruf mit Wiederholung und Snapshot (sortiment-load.js, QA R2 P1-1):
//   marken.api.marken_data                    → aktive Marken
//   produkte_new.api.get_produkte_by_marke_api → Produkte je Marke (Kartenform)
//   produkte_new.api.get_all_kategorien        → Kategorie-Bezeichnungen
//   produkte_new.api.get_produkt_by_path_field_api → Detail (nur Produktseite)
// Dazu die Register in src/lib/arviewer/*.json (Stufe, Rechte, Maße, Assets).
// Nichts wird geschrieben, keine Preise.
import "server-only";
import { cache } from "react";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { headers } from "next/headers";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";
import { katalogApi } from "@/lib/backend/katalog";
import { backofficeFetch } from "@/lib/api/http";
import { loadSortimentRows } from "./sortiment-load.js";
import { fetchKategorienWithCounts, fetchProduktNewByPathField } from "@/lib/api/fetchAllProdukte";
import { getActiveMarken } from "@/lib/api/fetchMarkenData";
import { getKategorieLabel } from "@/lib/api/fetchKategorien";
import { cleanProductName, displayBrandName } from "@/lib/content/brands";
import { generateSlug } from "@/lib/slugify";
import { productsPath } from "@/utils/routing";
import { resolveStage, verifiedDims } from "./stage.js";
import SOURCES from "./sources.json";
import RIGHTS from "./rights.json";
import DIMS from "./dims.json";
import ARFOTOS from "./arfotos.json";
import MODELS3D from "./models3d.json";
import RAUM from "./raumbedarf.json";
import INDEX from "./catalog-index.json";

const INTERN = process.env.ARVIEWER_INTERN === "1";
const WITH_DIMS = new Set(INDEX.mitMassen || []);
const MODEL_BY_PATH = new Map(
  Object.values(SOURCES.marken || {}).flatMap((m) => (m.modelle3d || []).map((x) => [x.path_field, x]))
);

const rightsFor = (brand) => RIGHTS.marken[brand] || RIGHTS.marken[displayBrandName(brand)] || null;

function stageFor({ path, brand, hasImage }) {
  return resolveStage({
    brand: displayBrandName(brand),
    hasImage,
    rights: rightsFor(brand),
    model3d: MODELS3D.produkte[path] || null,
    arFoto: ARFOTOS.produkte[path] || null,
    dims: DIMS.produkte[path] || null,
    raumbedarf: RAUM.produkte[path] || null,
    source3d: MODEL_BY_PATH.get(path) || null,
    brand3d: SOURCES.marken?.[brand]?.quelle3d?.status || null,
    catalogDims: WITH_DIMS.has(path),
    intern: INTERN,
  });
}

async function categoryLabels() {
  const rows = await fetchKategorienWithCounts().catch(() => []);
  return new Map((rows || []).map((k) => [String(k.category_key || k.name || "").toLowerCase(), getKategorieLabel(k, "de")]));
}

// ---------------- Laden je Marke mit Wiederholung und Snapshot (QA R2 P1-1) ----------------
// Eigener, strenger Abruf: fetchProdukteNewByMarke() liefert bei Fehlern still [] –
// damit ließe sich „Marke hat 0 Produkte“ nicht von „Marke nicht geladen“ trennen.
// Gleiche URL und gleicher Data Cache (1 h, Tag "products"), aber Fehler werfen.
const PRODUKTE_NEW_API = katalogApi("produkte_new.api", NEW_API_BASE_URL);
const SNAPSHOT_FILE = path.join(process.cwd(), ".data", "ar-viewer", "sortiment-snapshot.json");
const SNAPSHOT_MIN_AGE_MS = 10 * 60 * 1000; // nicht bei jedem Request neu schreiben
let memSnapshot = null; // letzter vollständiger Stand im Prozess (falls .data nicht beschreibbar ist)

async function fetchMarkeStrict(name) {
  const res = await backofficeFetch(`${PRODUKTE_NEW_API}.get_produkte_by_marke_api?marken=${encodeURIComponent(name)}`, {
    method: "GET",
    next: { revalidate: 3600, tags: ["products"] },
    timeoutMs: 8000,
    retries: 0, // die eine Wiederholung (800 ms) macht loadSortimentRows()
    critical: true,
  });
  const data = await res.json();
  if (!data || !("message" in data)) throw new Error("Antwort ohne message");
  return data.message || [];
}

async function readSnapshot() {
  if (memSnapshot) return memSnapshot;
  try {
    memSnapshot = JSON.parse(await readFile(SNAPSHOT_FILE, "utf8"));
    return memSnapshot;
  } catch {
    return null;
  }
}

async function saveSnapshot(candidate, prev) {
  const count = Object.values(candidate.rows).reduce((a, r) => a + r.length, 0);
  const prevCount = prev ? Object.values(prev.rows || {}).reduce((a, r) => a + r.length, 0) : -1;
  if (prev && prevCount === count && Date.now() - Date.parse(prev.stand) < SNAPSHOT_MIN_AGE_MS) return;
  const snap = {
    $note: "Letzter vollständiger Sortiment-Stand des AR-Viewers (nur GET, gitignored). Fallback, wenn Marken nicht laden.",
    stand: new Date().toISOString(),
    produkte: count,
    ...candidate,
  };
  memSnapshot = snap;
  try {
    await mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true });
    await writeFile(SNAPSHOT_FILE, JSON.stringify(snap));
  } catch (err) {
    console.warn("[labs/ar-viewer] Snapshot nicht gespeichert:", err?.message);
  }
}

// Nur Entwicklung/Test: Header "x-arviewer-sim: fehler=Minotti[,Flos][;ohne-stand]" lässt diese
// Marken scheitern (E2E für P1-1; ein Server-Fetch lässt sich mit page.route nicht abfangen).
async function simulation() {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const v = (await headers()).get("x-arviewer-sim");
    if (!v) return null;
    const list = (/fehler=([^;]+)/.exec(v)?.[1] || "").split(",").map((x) => x.trim().toLowerCase());
    return { fehler: new Set(list.filter(Boolean)), ohneStand: /ohne-stand/.test(v) };
  } catch {
    return null;
  }
}

/**
 * Alle aktiven Katalogprodukte (schlank, für Liste und Filter).
 * Pro Request einmal (React cache); die Backoffice-Antworten liegen im Data Cache.
 *   failed: Marken, die weder live noch aus dem letzten Stand kamen (Liste unvollständig)
 *   stale:  Marken aus dem letzten vollständigen Stand (Liste vollständig, Stand wird genannt)
 * @returns {Promise<{items, brands, categories, error, complete, failed, stale, standVon}>}
 */
export const getSortiment = cache(async () => {
  const sim = await simulation();
  const [marken, labels, snapshotReal] = await Promise.all([getActiveMarken(), categoryLabels(), readSnapshot()]);
  const load = await loadSortimentRows({
    marken,
    snapshot: sim?.ohneStand ? null : snapshotReal,
    fetchRows: (name) => {
      const n = String(name).toLowerCase();
      if (sim && (sim.fehler.has(n) || sim.fehler.has(displayBrandName(name).toLowerCase()))) return Promise.reject(new Error("simuliert"));
      return fetchMarkeStrict(name);
    },
  });
  if (load.snapshotCandidate && !sim) await saveSnapshot(load.snapshotCandidate, snapshotReal);
  for (const r of load.results) {
    if (r.quelle !== "live") console.warn(`[labs/ar-viewer] Marke ${r.name}: ${r.quelle === "stand" ? "aus letztem Stand" : "fehlt"} (${r.fehler})`);
  }
  const seen = new Set();
  const items = [];
  for (const { rows } of load.results) {
    for (const p of rows || []) {
      if (p?.status !== "Aktiv" || !p.path_field || !p.kategories || seen.has(p.path_field)) continue;
      seen.add(p.path_field);
      const first = (p.bild_anhangen || []).find((b) => b?.bild_anhangen);
      const brand = displayBrandName(p.marken);
      const name = cleanProductName(p.produkt_name);
      const category = String(p.kategories).toLowerCase();
      const st = stageFor({ path: p.path_field, brand: p.marken, hasImage: Boolean(first) });
      const ar = st.stufe === "ar-foto" ? ARFOTOS.produkte[p.path_field] : null;
      const raum = RAUM.produkte[p.path_field] && DIMS.produkte[p.path_field]?.quelle ? RAUM.produkte[p.path_field] : null;
      items.push({
        id: p.path_field,
        name,
        brand,
        brandKey: generateSlug(p.marken),
        category,
        categoryLabel: labels.get(category) || category,
        // Freigestelltes Poster nur, wenn Stufe 2 tatsächlich gilt (Rechte!).
        // Ohne Herstellerbild zeigt die Karte die Axonometrie des Raumbedarfs (kein Foto).
        image: ar?.poster || (first ? `/cmx${first.bild_anhangen}` : raum?.poster || null),
        imageCutout: Boolean(ar?.poster) || (!first && Boolean(raum?.poster)),
        // eigene Axonometrie als Ersatz, wenn das Herstellerbild nicht lädt (QA R2 P2-3)
        posterRaum: raum?.poster || null,
        raum: Boolean(raum || ar || st.stufe === "3d"),
        masse: raum ? { w: raum.w, d: raum.d, h: raum.h } : null,
        alt: first?.alt_text || `${brand} ${name}`,
        stufe: st.stufe,
        hinweis3d: st.ausblick[0] || null,
      });
    }
  }
  const brands = [...new Map(items.map((i) => [i.brandKey, { key: i.brandKey, label: i.brand }])).values()].sort((a, b) =>
    a.label.localeCompare(b.label, "de")
  );
  const categories = [...new Map(items.map((i) => [i.category, { key: i.category, label: i.categoryLabel }])).values()].sort((a, b) =>
    a.label.localeCompare(b.label, "de")
  );
  return {
    items,
    brands,
    categories,
    error: items.length === 0,
    complete: load.complete,
    failed: [...new Set(load.failed.map((n) => displayBrandName(n)))],
    stale: [...new Set(load.stale.map((n) => displayBrandName(n)))],
    standVon: load.standVon,
  };
});

/** Ein Produkt für die Viewer-Produktseite. null, wenn es nicht (mehr) existiert. */
export async function getArProduct(path) {
  if (!/^[a-z0-9][a-z0-9-]{0,160}$/.test(path)) return null;
  const detail = await fetchProduktNewByPathField(path, "de");
  if (!detail || detail.status === "Inaktiv") return null;
  const images = (detail.bild_anhangen || [])
    .map((b) => b?.bild_anhangen)
    .filter(Boolean)
    .slice(0, 8)
    .map((src) => `/cmx${src}`);
  const brand = displayBrandName(detail.marken);
  const name = cleanProductName(detail.produkt_name);
  const st = stageFor({ path, brand: detail.marken, hasImage: images.length > 0 });
  const labels = await categoryLabels();
  const category = String(detail.kategories || "").toLowerCase();
  const katalogMasse = (detail.additional_information || [])
    .map((a) => String(a?.dimensions || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3);
  const ar = st.stufe === "ar-foto" ? ARFOTOS.produkte[path] : null;
  const m3d = st.stufe === "3d" ? MODELS3D.produkte[path] : null;
  const dimsEntry = DIMS.produkte[path] || null;
  const raum = RAUM.produkte[path] && dimsEntry?.quelle ? RAUM.produkte[path] : null;
  return {
    id: path,
    name,
    brand,
    brandKey: generateSlug(detail.marken),
    category,
    categoryLabel: labels.get(category) || category,
    images,
    alt: `${brand} ${name}`,
    shopHref: category ? `/de${productsPath("de", generateSlug(category), path)}` : null,
    ...st,
    dims: verifiedDims(dimsEntry),
    dimsMeta: dimsEntry
      ? {
          produktseite: dimsEntry.produktseite || null,
          herkunft: dimsEntry.herkunft || "datenblatt",
          familie: dimsEntry.familie || null,
          alternativen: (dimsEntry.alternativen || []).slice(0, 12),
          rund: Boolean(dimsEntry.rund),
        }
      : null,
    raumbedarf: raum,
    katalogMasse,
    rights: rightsFor(detail.marken),
    arFoto: ar,
    model3d: m3d,
  };
}

/** Zahlen für die Stufen-Übersicht (aus der Inventur, ganzes Sortiment). */
export function inventurSumme() {
  return SOURCES.summe;
}
