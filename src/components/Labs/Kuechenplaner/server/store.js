// Küchenplaner – Datenzugriff (nur Server). Kleine Adapter-Schicht:
//
//   getCatalog()          heute: Repo-Standard (catalog.js) + optionale lokale
//                         Überschreibung .data/kuechenplaner/catalog.json
//                         später: Frappe-Doctype "Kuechen Katalog" (siehe Feature-Doku)
//   savePlan(plan, img)   heute: .data/kuechenplaner/plans/<id>.json (+ .jpg)
//                         später: Frappe-Doctype "Kuechen Planung" (POST /api/resource/…)
//   loadPlan(id)
//
// Gespeichert werden nur Konfiguration und Screenshot – keine Kontaktdaten.
// Die Kontaktdaten gehen ausschließlich über /api/beratung_anfrage an das Backoffice.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_CATALOG, PRICE_TABLE } from "../catalog";

const DATA_DIR = path.join(process.cwd(), ".data", "kuechenplaner");
const PLAN_DIR = path.join(DATA_DIR, "plans");
const RETENTION_DAYS = 180;
// Globale Obergrenzen (QA Runde 1, P2-8): unabhängig von IP-Adressen, damit .data/ nicht vollläuft.
export const QUOTA = {
  plansPerDay: Number(process.env.KUECHENPLANER_MAX_PER_DAY) || 200,
  totalBytes: (Number(process.env.KUECHENPLANER_MAX_MB) || 500) * 1024 * 1024,
};

let warned = false;
function secret() {
  const s = process.env.KUECHENPLANER_SECRET || process.env.LABS_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") return null;
  if (!warned) {
    console.warn("[kuechenplaner] KUECHENPLANER_SECRET fehlt – unsicherer Entwicklungs-Schlüssel aktiv. In Produktion setzen!");
    warned = true;
  }
  return "dev-only-kuechenplaner-secret";
}

export function hasSecret() {
  return Boolean(secret());
}

export function sign(id) {
  return createHmac("sha256", secret()).update(`kuechenplan:${id}`).digest("base64url").slice(0, 22);
}

export function verify(id, sig) {
  if (typeof sig !== "string" || !/^[\w-]{22}$/.test(sig)) return false;
  const a = Buffer.from(sign(id));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getCatalog() {
  try {
    const raw = JSON.parse(await readFile(path.join(DATA_DIR, "catalog.json"), "utf8"));
    if (raw?.priceTable && typeof raw.priceTable === "object") {
      return { ...DEFAULT_CATALOG, source: "local-override", priceTable: { ...PRICE_TABLE, ...raw.priceTable } };
    }
  } catch {
    // keine Überschreibung vorhanden → Standard
  }
  return DEFAULT_CATALOG;
}

async function prune() {
  try {
    const cutoff = Date.now() - RETENTION_DAYS * 864e5;
    for (const f of await readdir(PLAN_DIR)) {
      const p = path.join(PLAN_DIR, f);
      if ((await stat(p)).mtimeMs < cutoff) await unlink(p);
    }
  } catch {
    // Ordner fehlt → nichts zu tun
  }
}

// Lead-Übergabe/DSGVO: „höchstens 180 Tage“ (Einwilligungstext, Datenschutz
// #planer) gilt auch, wenn lange niemand speichert – prune() lief bisher nur
// beim Speichern. Jetzt: abgelaufene Pläne werden beim Abruf nie mehr
// ausgeliefert, und das Aufräumen läuft höchstens alle 6 h auch beim Abruf.
const PRUNE_EVERY_MS = 6 * 3600_000;
let lastPrune = 0;
function prunePeriodically(now = Date.now()) {
  if (now - lastPrune < PRUNE_EVERY_MS) return;
  lastPrune = now;
  prune();
}

/** true, wenn `createdAt` (ISO) älter als RETENTION_DAYS ist (oder fehlt/kaputt). */
export function isExpired(createdAt, now = Date.now()) {
  const t = Date.parse(createdAt);
  return !Number.isFinite(t) || now - t > RETENTION_DAYS * 864e5;
}

async function removePlan(id) {
  for (const ext of [".json", ".jpg"]) {
    try {
      await unlink(path.join(PLAN_DIR, `${id}${ext}`));
    } catch {
      // schon weg
    }
  }
}

let usageCache = { at: 0, value: null };
/** Pläne der letzten 24 h und belegte Bytes im Planordner (30 s zwischengespeichert). */
export async function usage() {
  if (usageCache.value && Date.now() - usageCache.at < 30_000) return usageCache.value;
  let plans24h = 0;
  let bytes = 0;
  try {
    const dayAgo = Date.now() - 864e5;
    for (const f of await readdir(PLAN_DIR)) {
      const st = await stat(path.join(PLAN_DIR, f));
      bytes += st.size;
      if (f.endsWith(".json") && st.mtimeMs > dayAgo) plans24h++;
    }
  } catch {
    // Ordner fehlt → leer
  }
  usageCache = { at: Date.now(), value: { plans24h, bytes } };
  return usageCache.value;
}

/** true, solange Tageslimit und Gesamtspeicher nicht erreicht sind. */
export async function quotaOk(extraBytes = 0) {
  const u = await usage();
  return u.plans24h < QUOTA.plansPerDay && u.bytes + extraBytes < QUOTA.totalBytes;
}

export async function savePlan(plan, jpegBuffer) {
  await mkdir(PLAN_DIR, { recursive: true });
  const id = randomBytes(9).toString("base64url");
  const record = { id, createdAt: new Date().toISOString(), plan, hasImage: Boolean(jpegBuffer) };
  await writeFile(path.join(PLAN_DIR, `${id}.json`), JSON.stringify(record));
  if (jpegBuffer) await writeFile(path.join(PLAN_DIR, `${id}.jpg`), jpegBuffer);
  if (usageCache.value) {
    usageCache.value = { plans24h: usageCache.value.plans24h + 1, bytes: usageCache.value.bytes + (jpegBuffer?.length || 0) + 2000 };
  }
  prune();
  return { id, sig: sign(id) };
}

export async function loadPlan(id) {
  if (!/^[\w-]{12}$/.test(id)) return null;
  prunePeriodically();
  let rec;
  try {
    rec = JSON.parse(await readFile(path.join(PLAN_DIR, `${id}.json`), "utf8"));
  } catch {
    return null;
  }
  if (isExpired(rec?.createdAt)) {
    await removePlan(id);
    return null;
  }
  return rec;
}

export async function loadPlanImage(id) {
  // Das Bild gibt es nur, solange die Planung selbst noch gilt.
  if (!(await loadPlan(id))) return null;
  try {
    return await readFile(path.join(PLAN_DIR, `${id}.jpg`));
  } catch {
    return null;
  }
}
