// src/lib/stilfinder/images.js
// Image preparation for the Moodboard PDF (server only, sharp is installed).
// - Product images come ONLY from the catalogue: the item carries the public
//   path "/cmx/files/<name>" (the site's file proxy, src/app/cmx). Server side
//   we resolve it the same way the proxy does (<backoffice>/files/<name>),
//   with the same allowlist (files/ + image extension), so no other URL can
//   ever be fetched.
// - Every image is decoded, auto-rotated, scaled to max BUDGET.imageMaxPx and
//   re-encoded as JPEG (react-pdf embeds JPEG/PNG only; keeps the PDF small).
//   Scaling is the only change to the stored file. The layout decides crop and
//   tone per brand (PROTECTED_BRANDS stay unaltered, see document.js).
// - Each image is analysed once (imageStats.js: dominant colour, coverage,
//   contrast, cut-out) for the curation in build.js.
// - Disk cache (QA Runde 1, P1.1 b): .data/stilfinder/img-cache/<hash>.jpg +
//   .json, TTL 7 days, shared by the main process and the PDF worker, plus a
//   small in-memory LRU. warmImages() fills it ahead of the first request.
// No "@/..." imports: tested with node --test.
// R3 technik P2-1: Laufzeitpfade (.data/stilfinder, public/) mit turbopackIgnore,
// sonst traced Turbopack das ganze Projekt (10 Build-Warnungen, 7 GB .next).
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { BUDGET, IMG_CACHE_DIR, IMG_CACHE_MAX_FILES, IMG_CACHE_TTL_MS, PUBLIC_DIR } from "./config.js";
import { analyseImage } from "./imageStats.js";

const CMX_PATH = /^\/cmx\/files\/[^?#\\]+\.(?:jpe?g|png|webp|avif|gif)$/i;
const PUBLIC_PATH = /^\/Images\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|webp|avif)$/;

export function isCatalogImagePath(p) {
  return typeof p === "string" && CMX_PATH.test(p) && !p.split("/").some((s) => s === ".." || s === ".");
}

/** Decode → rotate → scale → JPEG (+ analysis). Returns { data, width, height, cutout, stats } or null. */
export async function toPdfJpeg(input, { maxPx = BUDGET.imageMaxPx, quality = BUDGET.jpegQuality } = {}) {
  try {
    const base = sharp(input, { failOn: "none", limitInputPixels: 60_000_000 }).rotate();
    const { data, info } = await base
      .clone()
      .resize({ width: maxPx, height: maxPx, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:2:0" })
      .toBuffer({ resolveWithObject: true });
    const stats = await analyseImage(data).catch(() => null);
    return { data, width: info.width, height: info.height, cutout: Boolean(stats?.cutout), stats };
  } catch {
    return null;
  }
}

const cacheKey = (cmxPath) => createHash("sha1").update(cmxPath).digest("hex").slice(0, 24);

/** Disk cache: { get(cmxPath), set(cmxPath, img), prune() }. `dir` null = off. */
export function createDiskCache({ dir = IMG_CACHE_DIR, ttlMs = IMG_CACHE_TTL_MS, maxFiles = IMG_CACHE_MAX_FILES, now = () => Date.now() } = {}) {
  let ready = null;
  const ensure = () => (ready ||= fs.mkdir(/*turbopackIgnore: true*/ dir, { recursive: true }).catch(() => {}));
  return {
    async get(cmxPath) {
      if (!dir) return null;
      const k = cacheKey(cmxPath);
      try {
        const meta = JSON.parse(await fs.readFile(path.join(/*turbopackIgnore: true*/ dir, `${k}.json`), "utf8"));
        if (meta.cmx !== cmxPath || now() - meta.at > ttlMs) return null;
        const data = await fs.readFile(path.join(/*turbopackIgnore: true*/ dir, `${k}.jpg`));
        return { data, width: meta.width, height: meta.height, cutout: Boolean(meta.cutout), stats: meta.stats || null };
      } catch {
        return null;
      }
    },
    async set(cmxPath, img) {
      if (!dir || !img) return;
      await ensure();
      const k = cacheKey(cmxPath);
      const tmp = `.${k}-${process.pid}-${Math.random().toString(36).slice(2)}`;
      try {
        await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, `${tmp}.jpg`), img.data);
        await fs.rename(path.join(/*turbopackIgnore: true*/ dir, `${tmp}.jpg`), path.join(/*turbopackIgnore: true*/ dir, `${k}.jpg`));
        const meta = { cmx: cmxPath, at: now(), width: img.width, height: img.height, cutout: img.cutout, stats: img.stats };
        await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, `${tmp}.json`), JSON.stringify(meta));
        await fs.rename(path.join(/*turbopackIgnore: true*/ dir, `${tmp}.json`), path.join(/*turbopackIgnore: true*/ dir, `${k}.json`));
      } catch {
        /* cache is best effort */
      }
    },
    /** Deletes expired entries and the oldest beyond maxFiles. Returns the count removed. */
    async prune() {
      if (!dir) return 0;
      let names;
      try {
        names = (await fs.readdir(/*turbopackIgnore: true*/ dir)).filter((n) => n.endsWith(".json") && !n.startsWith("."));
      } catch {
        return 0;
      }
      const rows = [];
      for (const n of names) {
        try {
          const st = await fs.stat(path.join(/*turbopackIgnore: true*/ dir, n));
          rows.push({ n, t: st.mtimeMs });
        } catch {
          /* gone */
        }
      }
      rows.sort((a, b) => b.t - a.t);
      let removed = 0;
      for (const [i, r] of rows.entries()) {
        if (i < maxFiles && now() - r.t <= ttlMs) continue;
        const k = r.n.slice(0, -5);
        await Promise.all([fs.rm(path.join(/*turbopackIgnore: true*/ dir, `${k}.json`), { force: true }), fs.rm(path.join(/*turbopackIgnore: true*/ dir, `${k}.jpg`), { force: true })]);
        removed++;
      }
      return removed;
    },
  };
}

/**
 * createCatalogImageLoader({ server, fetchImpl, cacheDir }) → async (cmxPath) => image|null
 * `server` = backoffice origin (NEW_API_SERVER); the /cmx route proxies the same.
 * Order: memory LRU → disk cache → download + convert (+ write to disk).
 */
export function createCatalogImageLoader({ server, fetchImpl = fetch, timeoutMs = BUDGET.imageTimeoutMs, cacheSize = 160, cacheDir = IMG_CACHE_DIR } = {}) {
  const origin = String(server || "").replace(/\/+$/, "");
  const disk = createDiskCache({ dir: cacheDir });
  const cache = new Map();
  const inflight = new Map();
  let writes = 0;
  const remember = (cmxPath, img) => {
    cache.set(cmxPath, img);
    if (cache.size > cacheSize) cache.delete(cache.keys().next().value);
  };
  async function load(cmxPath) {
    const hit = await disk.get(cmxPath);
    if (hit) return hit;
    const img = await fetchAndConvert(cmxPath);
    if (img) {
      await disk.set(cmxPath, img);
      if (++writes % 200 === 0) disk.prune().catch(() => {});
    }
    return img;
  }
  async function loadCatalogImage(cmxPath) {
    if (!origin || !isCatalogImagePath(cmxPath)) return null;
    if (cache.has(cmxPath)) {
      const hit = cache.get(cmxPath);
      cache.delete(cmxPath);
      cache.set(cmxPath, hit);
      return hit;
    }
    // one download per file, also when two PDFs ask at the same moment
    if (!inflight.has(cmxPath)) {
      inflight.set(
        cmxPath,
        load(cmxPath).finally(() => inflight.delete(cmxPath))
      );
    }
    const img = await inflight.get(cmxPath);
    if (img) remember(cmxPath, img);
    return img;
  }
  loadCatalogImage.disk = disk;
  return loadCatalogImage;
  async function fetchAndConvert(cmxPath) {
    const url = `${origin}${cmxPath.slice("/cmx".length)}`;
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 25 * 1024 * 1024) return null;
      return toPdfJpeg(buf);
    } catch {
      return null;
    }
  }
}

/**
 * Cut-out shots on the cream page (QA P1.5): the empty white margin around
 * the product is trimmed (so the piece fills its frame) and the white ground
 * is brought to the paper tone by multiplying with it (#f7f5f1 = 97 % / 96 % /
 * 95 %), so no pure-white box sits on the page. Not used for PROTECTED_BRANDS.
 */
const toned = new Map();
export async function toneToPaper(img, paper = [247, 245, 241]) {
  if (!img?.data) return img;
  const key = img.data;
  if (toned.has(key)) return toned.get(key);
  try {
    let base = img.data;
    // QA Runde 3, P2.2: share of the trimmed frame the piece fills (the inset
    // on a room scene needs ≥ 35 % coverage)
    let fill = img.stats?.coverage ?? null;
    try {
      let t = await sharp(img.data).trim({ background: "#ffffff", threshold: 12 }).toBuffer({ resolveWithObject: true });
      // Feinschliff P3.3: some studio shots carry a light grey box inside the
      // white ground (Westside Sofa, Helsinki Trolley); a second trim against
      // that box's own tone (top-left pixel) brings the piece to its frame
      try {
        const t2 = await sharp(t.data).trim({ threshold: 18 }).toBuffer({ resolveWithObject: true });
        if (t2.info.width > 40 && t2.info.height > 40 && t2.info.width * t2.info.height < 0.92 * t.info.width * t.info.height) t = t2;
      } catch {
        /* first trim stays */
      }
      // keep a little air around the piece; skip when trim would eat the image
      if (t.info.width > 40 && t.info.height > 40) {
        const m = Math.round(Math.max(t.info.width, t.info.height) * 0.03);
        const area = ((t.info.width + 2 * m) * (t.info.height + 2 * m)) / Math.max(1, img.width * img.height);
        if (fill != null && area > 0 && area < 1) fill = Math.min(1, fill / area);
        base = await sharp(t.data).extend({ top: m, bottom: m, left: m, right: m, background: "#ffffff" }).toBuffer();
      }
    } catch {
      /* untrimmed */
    }
    const { data, info } = await sharp(base)
      .linear(paper.map((v) => v / 255), [0, 0, 0])
      .jpeg({ quality: BUDGET.jpegQuality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    const out = { ...img, data, width: info.width, height: info.height, toned: true, fill };
    toned.set(key, out);
    if (toned.size > 200) toned.delete(toned.keys().next().value);
    return out;
  } catch {
    return img;
  }
}

// Profile heroes and the showroom photo are the same for every PDF.
const publicCache = new Map();

/** Image from /public (profile heroes, showroom photo). */
export async function loadPublicImage(publicPath, { maxPx = 1800, quality = 80 } = {}) {
  if (!PUBLIC_PATH.test(publicPath) || publicPath.includes("..")) return null;
  const k = `${publicPath}@${maxPx}`;
  if (publicCache.has(k)) return publicCache.get(k);
  try {
    const buf = await fs.readFile(path.join(/*turbopackIgnore: true*/ PUBLIC_DIR, publicPath));
    const img = await toPdfJpeg(buf, { maxPx, quality });
    if (img) publicCache.set(k, img);
    return img;
  } catch {
    return null;
  }
}

/**
 * Runs loaders with a concurrency cap and an overall deadline: whatever is
 * not ready when the deadline passes resolves to null, so the PDF stays
 * inside the time budget even with a slow backoffice.
 */
export async function loadAll(tasks, { concurrency = 6, deadlineMs = BUDGET.imagesMs } = {}) {
  const results = new Array(tasks.length).fill(null);
  if (!tasks.length || deadlineMs <= 0) return results;
  let next = 0;
  let expired = false;
  let timerId;
  const timer = new Promise((resolve) => {
    timerId = setTimeout(() => {
      expired = true;
      resolve();
    }, deadlineMs);
    timerId.unref?.();
  });
  async function worker() {
    while (!expired && next < tasks.length) {
      const i = next++;
      try {
        const r = await tasks[i]();
        if (!expired) results[i] = r;
      } catch {
        /* stays null */
      }
    }
  }
  const workers = Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  await Promise.race([workers, timer]);
  clearTimeout(timerId);
  expired = true;
  return results;
}

/**
 * Pre-loads catalogue images into the disk cache (QA P1.1 b): called in the
 * background after the result page / first request of a profile, so the
 * customer's PDF finds its pictures ready. Never throws.
 */
export async function warmImages(loader, cmxPaths, { concurrency = 3, shouldStop = () => false } = {}) {
  const list = [...new Set(cmxPaths.filter(isCatalogImagePath))];
  let i = 0;
  let ok = 0;
  let stopped = false;
  async function worker() {
    while (i < list.length) {
      // QA Runde 3, P2.7: a real order has priority – the warm-up yields
      if (shouldStop()) {
        stopped = true;
        return;
      }
      const p = list[i++];
      try {
        if (await loader(p)) ok++;
      } catch {
        /* ignore */
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
  return { total: list.length, ok, stopped };
}
