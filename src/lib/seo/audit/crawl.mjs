// src/lib/seo/audit/crawl.mjs
// R4-seo live audit: reads /sitemap.xml and every child sitemap from a running
// server, fetches the listed pages and checks them with ./seoAudit.js:
//   - every sitemap URL answers 200 (no redirect, no 404),
//   - no URL in a sitemap is noindex, canonical = the listed URL,
//   - hreflang reciprocity across all crawled pages,
//   - Rich-Results sample: Product, FAQPage, BreadcrumbList, LocalBusiness,
//   - <lastmod> present, valid and not in the future.
// Read-only GETs; nothing is sent anywhere else.
//
// CLI (from the repo root, server on :3000):
//   node src/lib/seo/audit/crawl.mjs [--base=http://localhost:3000]
//     [--products=30] [--all] [--imported] [--concurrency=4]
//     [--out=qa-screenshots/teamleiter/r4-seo/audit.json]
// Default: all of sitemap-static plus DEFAULT_SEEDS German URLs of the other
//   sitemaps, then all their hreflang targets. --products overrides the
//   product seed count; --all crawls every listed URL (hours on dev, meant
//   for a production server).
// --imported: additionally every product of the imported catalogues
//   (Brand van Egmond, Treca, Next125), recognised by their path_field list
//   from the backoffice brand endpoint (read-only GET, same as the brand page).
// Used by tests/e2e/r4-seo.spec.js with a small sample.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import {
  checkHreflangReciprocity,
  isNoindex,
  jsonLdNodes,
  parseHead,
  parseLocs,
  parseUrlset,
  richResultKind,
  richResultWarnings,
  spreadSample,
  validateRichResult,
} from "./seoAudit.js";

export const SITE = "https://platzhirsch.studio";
export const IMPORTED_BRANDS = Object.freeze(["Brand van Egmond", "Treca", "Next125"]);
const BACKOFFICE_API =
  "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api";

// Seeds per sitemap (German URLs; hreflang targets are added in phase 2).
export const DEFAULT_SEEDS = Object.freeze({
  "/sitemap-static.xml": Infinity,
  "/sitemap-marken.xml": 30,
  "/sitemap-news.xml": 8,
  "/sitemap-produkte.xml": 30,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { retries = 1 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(90_000) });
      const body = res.status === 200 ? await res.text() : "";
      if (res.status >= 500 && attempt < retries) {
        await sleep(2000);
        continue;
      }
      return { status: res.status, location: res.headers.get("location"), body };
    } catch (err) {
      if (attempt < retries) {
        await sleep(2000);
        continue;
      }
      return { status: 0, location: null, body: "", error: String(err?.message || err) };
    }
  }
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, size) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
}

/** path_fields of the imported catalogues (read-only backoffice GET). */
export async function importedPathFields(brands = IMPORTED_BRANDS) {
  const result = {};
  for (const brand of brands) {
    const res = await fetch(`${BACKOFFICE_API}.get_produkte_by_marke_api?marken=${encodeURIComponent(brand)}`, {
      signal: AbortSignal.timeout(30_000),
    });
    const data = res.ok ? await res.json() : { message: [] };
    result[brand] = (data.message || []).filter((p) => p.status === "Aktiv").map((p) => p.path_field);
  }
  return result;
}

/**
 * Runs the audit. Returns the report object (also written to `out` if given).
 * @param {{ base?: string, seeds?: Record<string, number>, all?: boolean, imported?: boolean,
 *   concurrency?: number, out?: string, log?: (s: string) => void }} opts
 */
export async function runSeoAudit(opts = {}) {
  const base = (opts.base || "http://localhost:3000").replace(/\/$/, "");
  const log = opts.log || (() => {});
  const toLocal = (u) => u.replace(SITE, base);
  const now = Date.now();

  const index = await get(`${base}/sitemap.xml`);
  const sitemapPaths = parseLocs(index.body).map((u) => u.replace(SITE, ""));
  const sitemaps = {};
  const listed = [];
  const lastmodProblems = [];
  for (const path of sitemapPaths) {
    const res = await get(`${base}${path}`);
    const rows = parseUrlset(res.body);
    sitemaps[path] = { status: res.status, urls: rows.length };
    for (const row of rows) {
      const t = row.lastmod ? Date.parse(row.lastmod) : NaN;
      // Runde 5 P6 (Inhaber-offen Nr. 47): news without a real change date
      // carry NO <lastmod> on purpose (src/lib/seo/sitemap/newsLastmod.js) –
      // a missing value is allowed there, a wrong one never.
      const missingAllowed = !row.lastmod && path === "/sitemap-news.xml";
      if (!missingAllowed && (!row.lastmod || isNaN(t) || t > now + 86_400_000)) lastmodProblems.push({ loc: row.loc, lastmod: row.lastmod });
      listed.push({ loc: row.loc, sitemap: path });
    }
  }
  const seen = new Map();
  const duplicates = [];
  for (const l of listed) {
    if (seen.has(l.loc)) duplicates.push(l.loc);
    else seen.set(l.loc, l.sitemap);
  }

  // Pick what to crawl (the shared dev server renders a page in 3-15 s, so
  // 8 000 URLs are out of reach): per sitemap an evenly spread sample of
  // German seed URLs (static: all of them), then — phase 2 — every hreflang
  // target of those seeds, so each sampled cluster is checked for
  // reciprocity in full. --imported adds every German URL of the imported
  // catalogues (status/robots/canonical; no hreflang follow).
  const bySection = (path) => [...seen].filter(([, s]) => s === path).map(([u]) => u);
  const isDe = (u) => u === `${SITE}/de` || u.startsWith(`${SITE}/de/`);
  const seeds = new Set();
  for (const path of sitemapPaths) {
    const list = bySection(path);
    const n = opts.all ? Infinity : (opts.seeds?.[path] ?? DEFAULT_SEEDS[path] ?? 20);
    const de = list.filter(isDe);
    (n === Infinity ? list : spreadSample(de, n)).forEach((u) => seeds.add(u));
  }
  let imported = null;
  const importedUrls = new Set();
  if (opts.imported) {
    const products = bySection("/sitemap-produkte.xml");
    const fields = await importedPathFields();
    imported = {};
    for (const [brand, list] of Object.entries(fields)) {
      const wanted = new Set(list);
      const urls = products.filter((u) => wanted.has(u.split("/").pop()));
      const missing = list.filter((f) => !products.some((u) => u.endsWith(`/${f}`)));
      imported[brand] = { backoffice: list.length, inSitemap: urls.length / 4, missing };
      urls.filter(isDe).forEach((u) => importedUrls.add(u));
    }
  }

  const pages = new Map();
  let done = 0;
  const visit = async (loc) => {
    if (pages.has(loc)) return;
    pages.set(loc, null);
    const res = await get(toLocal(loc));
    const head = res.status === 200 ? parseHead(res.body) : { robots: null, canonical: null, hreflang: {}, jsonLd: [], jsonLdErrors: 0 };
    const rich = jsonLdNodes(head.jsonLd)
      .map((node) => ({ kind: richResultKind(node), problems: validateRichResult(node), warnings: richResultWarnings(node) }))
      .filter((r) => r.kind);
    pages.set(loc, {
      status: res.status,
      location: res.location,
      robots: head.robots,
      canonical: head.canonical,
      hreflang: head.hreflang,
      jsonLdErrors: head.jsonLdErrors,
      rich,
      sitemap: seen.get(loc) || null,
    });
    done += 1;
    if (done % 50 === 0) log(`${done} Seiten`);
  };
  log(`Phase 1: ${seeds.size} Seeds + ${importedUrls.size} importierte von ${seen.size} Sitemap-URLs`);
  await pool([...seeds, ...importedUrls], opts.concurrency || 4, visit);
  const targets = new Set();
  for (const loc of seeds) {
    for (const t of Object.values(pages.get(loc)?.hreflang || {})) if (t && !pages.has(t)) targets.add(t);
  }
  log(`Phase 2: ${targets.size} hreflang-Ziele`);
  await pool([...targets], opts.concurrency || 4, visit);
  // Phase 3: a shared dev server under load answers some pages 500, and the
  // product page 404s when the backoffice detail call times out. Every
  // non-200 is fetched again, one at a time; a URL that then answers 200 is
  // kept as `transient` (reported, but not counted as a sitemap error).
  const transient = [];
  for (const [loc, p] of [...pages]) {
    if (!p || p.status === 200) continue;
    const before = p.status;
    pages.delete(loc);
    await visit(loc);
    if (pages.get(loc)?.status === 200) transient.push({ url: loc, first: before });
  }
  if (transient.length) log(`Phase 3: ${transient.length} nur beim ersten Abruf nicht 200`);
  const crawl = [...pages.keys()];
  // hreflang targets that are indexable but in no sitemap (would be a gap).
  const targetsNotInSitemap = [...targets].filter((t) => !seen.has(t) && pages.get(t)?.status === 200 && !isNoindex(pages.get(t)?.robots));

  const all = [...pages].filter(([, p]) => p);
  const non200 = all.filter(([, p]) => p.status !== 200).map(([url, p]) => ({ url, status: p.status, location: p.location }));
  const noindex = all.filter(([, p]) => p.status === 200 && isNoindex(p.robots)).map(([url, p]) => ({ url, robots: p.robots }));
  const noRobots = all.filter(([, p]) => p.status === 200 && !p.robots).map(([url]) => url);
  const canonicalMismatch = all
    .filter(([url, p]) => p.status === 200 && p.canonical !== url)
    .map(([url, p]) => ({ url, canonical: p.canonical }));
  const jsonLdErrors = all.filter(([, p]) => p.jsonLdErrors).map(([url]) => url);
  const hreflang = checkHreflangReciprocity(pages);

  const richResults = {};
  for (const [url, p] of all) {
    for (const r of p.rich) {
      const k = (richResults[r.kind] ||= { pages: 0, valid: 0, problems: [], warnings: {}, warningSamples: {} });
      for (const w of r.warnings) {
        k.warnings[w] = (k.warnings[w] || 0) + 1;
        const samples = (k.warningSamples[w] ||= []);
        if (samples.length < 5) samples.push(url);
      }
      k.pages += 1;
      if (!r.problems.length) k.valid += 1;
      else if (k.problems.length < 20) k.problems.push({ url, problems: r.problems });
    }
  }

  const report = {
    date: new Date().toISOString(),
    base,
    sitemaps,
    listed: seen.size,
    duplicates,
    crawled: crawl.length,
    seeds: seeds.size,
    transient,
    targetsNotInSitemap,
    crawledBySitemap: Object.fromEntries(
      sitemapPaths.map((s) => [s, all.filter(([, p]) => p.sitemap === s).length])
    ),
    imported,
    lastmodProblems: lastmodProblems.slice(0, 50),
    lastmodProblemCount: lastmodProblems.length,
    non200,
    noindex,
    noRobots: noRobots.slice(0, 50),
    canonicalMismatch: canonicalMismatch.slice(0, 50),
    canonicalMismatchCount: canonicalMismatch.length,
    jsonLdErrors,
    hreflang: { pairs: hreflang.pairs, unchecked: hreflang.unchecked, errors: hreflang.errors.slice(0, 50), errorCount: hreflang.errors.length },
    richResults,
  };
  if (opts.out) {
    mkdirSync(dirname(opts.out), { recursive: true });
    writeFileSync(opts.out, JSON.stringify(report, null, 2));
  }
  return report;
}

// CLI
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
  const flag = (name) => process.argv.includes(`--${name}`);
  const report = await runSeoAudit({
    base: arg("base"),
    all: flag("all"),
    seeds: arg("products") ? { "/sitemap-produkte.xml": Number(arg("products")) } : undefined,
    imported: flag("imported"),
    concurrency: arg("concurrency") ? Number(arg("concurrency")) : undefined,
    out: arg("out") || "qa-screenshots/teamleiter/r4-seo/audit.json",
    log: (s) => console.log(s),
  });
  const summary = {
    listed: report.listed,
    crawled: report.crawled,
    duplicates: report.duplicates.length,
    non200: report.non200.length,
    transient: report.transient.length,
    noindex: report.noindex.length,
    canonicalMismatch: report.canonicalMismatchCount,
    hreflangErrors: report.hreflang.errorCount,
    hreflangPairs: report.hreflang.pairs,
    lastmodProblems: report.lastmodProblemCount,
    rich: Object.fromEntries(Object.entries(report.richResults).map(([k, v]) => [k, `${v.valid}/${v.pages}`])),
    seeds: report.seeds,
    targetsNotInSitemap: report.targetsNotInSitemap.length,
    imported: report.imported,
  };
  console.log(JSON.stringify(summary, null, 2));
}
