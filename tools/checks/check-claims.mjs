#!/usr/bin/env node
// tools/checks/check-claims.mjs
// UWG-Sicherung: sucht Händler-Behauptungen (außer belegt: ClassiCon) und
// Superlative in
//   - src/messages/*.json (nur String-Werte)
//   - String-Literalen, Template-Texten und JSX-Text in src/**/*.js|jsx|mjs (Kommentare ignoriert)
//   - Marktresearch/content/** (.md, .json, .txt)
//   - optional --live: gerendertes HTML von http://localhost:3000 (sitemap-static.xml
//     + sitemap-marken.xml, Host auf localhost umgeschrieben, plus neue Landingpages
//     und eine Stichprobe der Produktseiten inkl. importierter Marken, siehe productSample)
//
// Aufruf:  node tools/checks/check-claims.mjs [--live] [--base=http://localhost:3000]
//          [--locales=de,en] [--limit=50] [--concurrency=4] [--json=out.json]
//          [--no-static] [--allowlist=tools/checks/claims-allowlist.json]
//          [--products=60] [--per-brand=10]   (R4: Produktseiten-Stichprobe, 0 = aus)
//          [--commerce-preview] [--freigabe-preview]   (R6: Vorschauseiten mitprüfen,
//          nur wenn der Server den Schalter COMMERCE_PREVIEW=1 bzw. FREIGABE_PREVIEW=1
//          hat; die Umgebungsvariablen gleichen Namens wirken wie die Flags)
// Exit-Code 1 bei mindestens einem nicht freigegebenen Verstoß, sonst 0.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findClaims } from "../../src/lib/legal/claims.js";
import {
  extractJsonStrings,
  extractJsStrings,
  htmlToText,
  htmlMetaTexts,
  parseSitemapLocs,
  brandSlugFromUrl,
  loadAllowlist,
  isAllowed,
  invalidAllowlistEntries,
  walk,
  parseArgs,
} from "./lib/parse.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

// Dateien, die die Muster selbst enthalten oder keine Seiteninhalte sind.
const SKIP = ["/node_modules/", "/.next/", "src/lib/legal/", "tools/checks/", "/tests/"];

// Neue Seiten, die (noch) nicht in sitemap-static.xml stehen.
const EXTRA_PATHS = [
  "/de/designermoebel-appenzell",
  "/de/designermoebel-arlberg",
  "/de/designermoebel-feldkirch",
  "/de/designermoebel-kempten",
  "/de/designermoebel-konstanz",
  "/de/designermoebel-liechtenstein",
  "/de/designermoebel-ravensburg",
  "/de/designermoebel-rheintal",
  "/de/yacht-interior",
  "/de/outdoor-gartenplanung",
  // Runde 2: noindex-Seiten, die trotzdem öffentlich erreichbar sind.
  "/de/ratgeber",
  "/de/adventsabend",
  "/de/bewerten",
  // Runde 5 (R5-release): noindex, unverlinkt, aber öffentlich erreichbar.
  // Gutscheine/Atelier sind standardmäßig aus (404) und werden erst geprüft,
  // wenn sie live gehen.
  // R6-release: Schweiz-Hub und Projekte bleiben fest in der Liste.
  "/de/einkaufen-aus-der-schweiz",
  "/de/projekte",
  // Inhaber-Entscheidungen Nr. 19/21/22 (31.10.2026): Bad & Wellness mit Händlersätzen
  // der 7 Liefermarken (Agape ohne) und die Minotti-Markenseite mit Studio-Wortlaut.
  "/de/bad-wellness",
  "/en/bad-wellness",
  "/de/ueber-uns/marken/minotti",
  "/en/about-us/brands/minotti",
  ...ratgeberPaths(),
];

// R6-release: Vorschauseiten sind in Produktion ohne Schalter 404 (ein 404
// wäre hier ein Fehler). Sie kommen nur dazu, wenn der geprüfte Server den
// Schalter hat: --commerce-preview / COMMERCE_PREVIEW=1 (src/lib/commerce/mode.js)
// und --freigabe-preview / FREIGABE_PREVIEW=1 (Freigabe-Cockpit, R6-uebergabe).
export const PREVIEW_PATHS = {
  commerce: ["/de/preview/commerce"],
  freigabe: ["/de/preview/freigaben"],
};
export function previewPaths({ args = {}, env = process.env } = {}) {
  const on = (flag, name) => !!args[flag] || env[name] === "1";
  return [
    ...(on("commerce-preview", "COMMERCE_PREVIEW") ? PREVIEW_PATHS.commerce : []),
    ...(on("freigabe-preview", "FREIGABE_PREVIEW") ? PREVIEW_PATHS.freigabe : []),
  ];
}

/** /de/ratgeber/<slug> für jede Datei in src/content/ratgeber (Slug = Dateiname). */
function ratgeberPaths() {
  const dir = path.join(ROOT, "src", "content", "ratgeber");
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => `/de/ratgeber/${f.replace(/\.md$/, "")}`);
  } catch {
    return [];
  }
}

function scanTexts(items, where, opts = {}) {
  const out = [];
  for (const it of items) {
    for (const f of findClaims(it.value, opts)) {
      out.push({ ...where, line: it.line, key: it.key, kind: it.kind, ...f });
    }
  }
  return out;
}

export function scanJsonFile(file) {
  const src = fs.readFileSync(file, "utf8");
  return scanTexts(extractJsonStrings(src), { file: rel(file) });
}

export function scanJsFile(file) {
  const src = fs.readFileSync(file, "utf8");
  return scanTexts(extractJsStrings(src), { file: rel(file) });
}

// Interne Abschnitte in Markdown-Entwürfen (werden nicht veröffentlicht).
const INTERNAL_HEADING_RE = /^#{1,4}\s*(?:Redaktion|Prüfvermerk|Pruefvermerk|Interne?|Quellen|Notizen|Faktencheck)/i;

/** Zeilen eines Text-/Markdown-Entwurfs bis zum ersten internen Abschnitt. */
export function markdownLines(src) {
  const lines = String(src).split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (INTERNAL_HEADING_RE.test(lines[i])) break;
    // Redaktions-Marker [prüfen: …] gehören nicht zum Text.
    const value = lines[i].replace(/\[(?:prüfen|pruefen|todo|hinweis)[^\]]*\]/gi, "");
    out.push({ line: i + 1, value });
  }
  return out;
}

export function scanTextFile(file) {
  const src = fs.readFileSync(file, "utf8");
  return scanTexts(markdownLines(src), { file: rel(file) });
}

function staticScan() {
  const findings = [];
  for (const f of walk(path.join(ROOT, "src/messages"), { exts: [".json"] })) findings.push(...scanJsonFile(f));
  for (const f of walk(path.join(ROOT, "src"), { exts: [".js", ".jsx", ".mjs"], skip: SKIP })) findings.push(...scanJsFile(f));
  // Veröffentlichte Markdown-Inhalte (z. B. src/content/ratgeber) wie Marktresearch/content behandeln.
  for (const f of walk(path.join(ROOT, "src/content"), { exts: [".md", ".txt"] })) findings.push(...scanTextFile(f));
  for (const f of walk(path.join(ROOT, "Marktresearch/content"), { exts: [".md", ".json", ".txt"] })) {
    findings.push(...(f.endsWith(".json") ? scanJsonFile(f) : scanTextFile(f)));
  }
  return findings;
}

async function fetchText(url, timeoutMs = 90000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    return { status: res.status, text: await res.text() };
  } finally {
    clearTimeout(t);
  }
}

/** String-Werte aus dem Next-Flight-Payload (self.__next_f.push([1,"…"])) eines HTML-Dokuments. */
export function flightTexts(html) {
  const out = new Set();
  for (const m of String(html).matchAll(/self\.__next_f\.push\(\[\d+,("(?:[^"\\]|\\.)*")\]\)/g)) {
    let chunk;
    try {
      chunk = JSON.parse(m[1]);
    } catch {
      continue;
    }
    for (const s of chunk.matchAll(/"((?:[^"\\]|\\.){20,})"/g)) {
      try {
        const v = JSON.parse(`"${s[1]}"`);
        if (/\s/.test(v)) out.add(v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      } catch {
        /* kein gültiger String */
      }
    }
  }
  return [...out];
}

// Produktseiten-Stichprobe (R4-release): Die Herstellertexte laufen beim
// Rendern durch den Claim-Filter (src/lib/legal/manufacturerText.js). Ob das
// live hält, prüft eine feste Stichprobe aus sitemap-produkte.xml (gleichmäßig
// über die Liste verteilt, also reproduzierbar) plus Produkte der importierten
// Kataloge, erkannt über ihre path_fields aus dem Backoffice (nur GET).
export const IMPORTED_BRANDS = ["Brand van Egmond", "Treca", "Next125"];
const BRAND_API =
  "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api.get_produkte_by_marke_api";
const PRODUCT_PATH_RE = /^\/de\/produkte\/[^/]+\/[^/]+$/;

/** n Einträge gleichmäßig über die Liste verteilt (erster und letzter inklusive). */
export function spread(list, n) {
  if (n <= 0 || !list.length) return [];
  if (list.length <= n) return [...list];
  const step = (list.length - 1) / (n - 1 || 1);
  return [...new Set(Array.from({ length: n }, (_, i) => list[Math.round(i * step)]))];
}

async function importedPathFields() {
  const out = {};
  for (const brand of IMPORTED_BRANDS) {
    try {
      const res = await fetch(`${BRAND_API}?marken=${encodeURIComponent(brand)}`, { signal: AbortSignal.timeout(30_000) });
      const data = res.ok ? await res.json() : { message: [] };
      out[brand] = (data.message || []).filter((p) => p.status === "Aktiv" && p.path_field).map((p) => p.path_field);
    } catch (e) {
      console.error(`! Backoffice-Liste ${brand} nicht ladbar: ${e.message}`);
      out[brand] = [];
    }
  }
  return out;
}

/** Deutsche Produkt-URLs: `sample` aus der Sitemap + bis zu `perBrand` je importierter Marke. */
export async function productSample(base, { sample = 60, perBrand = 10 } = {}) {
  let all = [];
  try {
    all = parseSitemapLocs((await fetchText(base + "/sitemap-produkte.xml")).text, base).filter((u) => PRODUCT_PATH_RE.test(new URL(u).pathname));
  } catch (e) {
    console.error(`! Sitemap /sitemap-produkte.xml nicht ladbar: ${e.message}`);
  }
  const fromSitemap = spread(all, sample);
  const imported = {};
  if (perBrand > 0) {
    const fields = await importedPathFields();
    for (const [brand, list] of Object.entries(fields)) {
      const set = new Set(list);
      imported[brand] = spread(
        all.filter((u) => set.has(new URL(u).pathname.split("/").pop())),
        perBrand,
      );
    }
  }
  return { totalInSitemap: all.length, fromSitemap, imported, urls: [...new Set([...fromSitemap, ...Object.values(imported).flat()])] };
}

async function liveScan({ base, locales, limit, concurrency, products = 60, perBrand = 10, extra = [] }) {
  const urls = [];
  for (const sm of ["/sitemap-static.xml", "/sitemap-marken.xml"]) {
    try {
      const { text } = await fetchText(base + sm);
      urls.push(...parseSitemapLocs(text, base));
    } catch (e) {
      console.error(`! Sitemap ${sm} nicht ladbar: ${e.message}`);
    }
  }
  urls.push(...[...EXTRA_PATHS, ...extra].map((p) => base + p));
  if (extra.length) console.log(`Vorschauseiten (Schalter gesetzt): ${extra.join(", ")}`);
  let productInfo = null;
  if (products > 0 || perBrand > 0) {
    productInfo = await productSample(base, { sample: products, perBrand });
    urls.push(...productInfo.urls);
    console.log(
      `Produkt-Stichprobe: ${productInfo.fromSitemap.length} aus ${productInfo.totalInSitemap} (sitemap-produkte, DE) + ` +
        Object.entries(productInfo.imported)
          .map(([b, l]) => `${b} ${l.length}`)
          .join(", "),
    );
  }
  let list = [...new Set(urls)];
  if (locales) list = list.filter((u) => locales.some((l) => new URL(u).pathname.startsWith(`/${l}`)));
  if (limit) list = list.slice(0, limit);

  const findings = [];
  const errors = [];
  let done = 0;
  const queue = [...list];
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      try {
        const { status, text } = await fetchText(url);
        if (status >= 400) {
          errors.push({ url, status });
        } else {
          const brandSlug = brandSlugFromUrl(url) ?? undefined;
          const body = htmlToText(text.replace(/[\s\S]*?<body\b/i, "<body"))
            .split("\n")
            .map((value, i) => ({ line: i + 1, value, kind: "html" }));
          const meta = htmlMetaTexts(text).map((m) => ({ line: 0, value: m.value, kind: m.where }));
          findings.push(...scanTexts([...meta, ...body], { url: url.replace(base, "") }, { brandSlug }));
          // RSC-/Flight-Payload: Crawler lesen ihn mit. Hier nur Händler-Claims
          // (Superlative stehen dort doppelt zum sichtbaren Text).
          const payload = flightTexts(text).map((value) => ({ line: 0, value, kind: "payload" }));
          findings.push(
            ...scanTexts(payload, { url: url.replace(base, "") }, { brandSlug }).filter((f) => f.type === "dealer"),
          );
        }
      } catch (e) {
        errors.push({ url, status: e.name === "AbortError" ? "timeout" : e.message });
      }
      done++;
      if (done % 25 === 0) process.stderr.write(`  live: ${done}/${list.length}\n`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { findings, errors, count: list.length, products: productInfo };
}

function format(f) {
  const where = f.file ? `${f.file}:${f.line}` : `${f.url}${f.kind && f.kind !== "html" ? ` [${f.kind}]` : ""}`;
  const brands = f.brands?.length ? ` (${f.brands.join(", ")})` : "";
  const snippet = f.sentence.length > 160 ? f.sentence.slice(0, 157) + "…" : f.sentence;
  return `${where}  ${f.type}/${f.id}${brands}  „${f.match}“  →  ${snippet}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = String(args.base || "http://localhost:3000").replace(/\/$/, "");
  const allowFile = path.resolve(ROOT, String(args.allowlist || "tools/checks/claims-allowlist.json"));
  const allowlist = loadAllowlist(allowFile);
  // Einträge ohne Datei-/URL-Bezug oder ohne Textstück gelten nicht (R3-release).
  const invalid = invalidAllowlistEntries(allowFile);
  for (const e of invalid) console.log(`Allowlist: Eintrag ohne file/contains ignoriert: ${JSON.stringify(e.contains ?? e)}`);

  let findings = [];
  if (!args["no-static"]) findings.push(...staticScan());
  let live = null;
  if (args.live) {
    live = await liveScan({
      base,
      locales: typeof args.locales === "string" ? args.locales.split(",") : null,
      limit: args.limit ? Number(args.limit) : 0,
      concurrency: Number(args.concurrency || 4),
      products: args.products === undefined ? 60 : Number(args.products),
      perBrand: args["per-brand"] === undefined ? 10 : Number(args["per-brand"]),
      extra: previewPaths({ args }),
    });
    findings.push(...live.findings);
  }

  // Live: gleiche Fundstelle auf vielen Seiten (Header/Footer) nur einmal je URL+Satz.
  const seen = new Set();
  findings = findings.filter((f) => {
    const k = `${f.file ?? f.url}|${f.file ? f.line : ""}|${f.id}|${f.match}|${f.sentence}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const allowed = findings.filter((f) => isAllowed(f, allowlist));
  const violations = findings.filter((f) => !isAllowed(f, allowlist));

  for (const f of violations) console.log(format(f));
  const byType = violations.reduce((a, f) => ((a[f.type] = (a[f.type] || 0) + 1), a), {});
  console.log(
    `\nClaim-Check: ${violations.length} Verstoß/Verstöße (dealer ${byType.dealer || 0}, superlative ${byType.superlative || 0}), ` +
      `${allowed.length} per Allowlist freigegeben` +
      (live ? `; live ${live.count} URLs, ${live.errors.length} Fehler` : ""),
  );
  if (live?.errors.length) for (const e of live.errors.slice(0, 30)) console.log(`  ! ${e.url} → ${e.status}`);
  if (args.json) {
    fs.writeFileSync(path.resolve(String(args.json)), JSON.stringify({ violations, allowed, live: live && { count: live.count, errors: live.errors, products: live.products } }, null, 2));
  }
  process.exitCode = violations.length || invalid.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 2;
  });
}
