#!/usr/bin/env node
// tools/i18n/raw-keys.mjs
// Rohschlüssel-Prüfung (R3-i18n Punkt 6): Sucht in gerenderten Seiten nach
// Message-Pfaden wie "HomePage.hero.title" – so sieht next-intl aus, wenn ein
// Schlüssel fehlt. Geprüft werden sichtbarer Text sowie alt, aria-label,
// aria-description, title, placeholder, <title> und <meta content>.
//
// Routen: sitemap-static.xml (alle 4 Sprachen) + sitemap-marken.xml (Marken-
// und Marke×Kategorie-Seiten, Auswahl) + Produktseiten (Auswahl) + News
// (Auswahl) + Landing-/Regions- und Zusatzseiten × 4 Sprachen + 404.
//
// Modus HTML (Standard): Server-HTML per fetch. Modus --browser: zusätzlich
// gerendertes DOM nach Hydration (Chromium) für --browser-limit Seiten.
//
// Aufruf: node tools/i18n/raw-keys.mjs [--base=http://localhost:3000]
//   [--concurrency=3] [--brands=6] [--products=2] [--news=2] [--browser]
//   [--browser-limit=40] [--json=out.json] [--only=/fr,/it]
// Exit 1 bei mindestens einem Rohschlüssel oder Serverfehler (5xx).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, ROOT, isPlainObject, readMessages } from "./lib.mjs";

const LANDING = [
  "kuechen-vorarlberg", "wohnzimmer-einrichten-vorarlberg", "interior-design-vorarlberg", "moebel-bodensee",
  "yacht-interior", "outdoor-gartenplanung", "designermoebel-bregenz", "designermoebel-dornbirn",
  "designermoebel-friedrichshafen", "designermoebel-lindau", "designermoebel-st-gallen", "designermoebel-appenzell",
  "designermoebel-arlberg", "designermoebel-feldkirch", "designermoebel-kempten", "designermoebel-konstanz",
  "designermoebel-liechtenstein", "designermoebel-ravensburg", "designermoebel-rheintal",
  "newsletter", "merkliste", "datenschutz", "impressum", "ratgeber", "adventsabend", "bewerten",
  "diese-seite-gibt-es-nicht-r3",
];

/** Erste Segmente, die als Namespace gelten (aktuell + gelöscht + Vorschläge). */
export function knownNamespaces() {
  const set = new Set();
  for (const l of LOCALES) for (const k of Object.keys(readMessages(l).data)) set.add(k);
  const extra = [
    path.join(ROOT, "qa-screenshots/teamleiter/r3-i18n/geloescht-namespaces.json"),
    ...fs
      .readdirSync(path.join(ROOT, "Marktresearch/digital/teamleiter"))
      .filter((f) => /^messages-.*\.json$/.test(f))
      .map((f) => path.join(ROOT, "Marktresearch/digital/teamleiter", f)),
  ];
  for (const f of extra) {
    try {
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      for (const l of LOCALES) if (isPlainObject(j[l])) for (const k of Object.keys(j[l])) set.add(k);
    } catch {
      /* optional */
    }
  }
  return set;
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

/** Texte eines HTML-Dokuments: [{where, value}]. */
export function htmlTexts(html) {
  const out = [];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) out.push({ where: "title", value: decode(title[1]) });
  for (const m of html.matchAll(/<meta\b[^>]*\bcontent="([^"]*)"[^>]*>/gi)) out.push({ where: "meta", value: decode(m[1]) });
  for (const m of html.matchAll(/\b(alt|aria-label|aria-description|title|placeholder)="([^"]*)"/gi)) {
    out.push({ where: m[1].toLowerCase(), value: decode(m[2]) });
  }
  const body = html
    .replace(/[\s\S]*?<body\b/i, "<body")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[\s\S]*?<\/template>/gi, " ")
    .replace(/<[^>]+>/g, "\n");
  for (const line of decode(body).split("\n")) {
    const v = line.trim();
    if (v) out.push({ where: "text", value: v });
  }
  return out;
}

const TOKEN_RE = /(?<![\w./@:-])([A-Za-z][\w-]*)((?:\.[\w-]+)+)(?![\w/@-])/g;

/**
 * Rohschlüssel in einer Textliste. Ein Treffer braucht einen bekannten
 * Namespace als erstes Segment und ein zweites Segment in Schlüssel-Schreibweise
 * (beginnt klein, z. B. "hero", "trust1") oder ein bekanntes zweites Segment.
 * So bleibt Fließtext wie „Platzhirsch Home.Living“ (Tippfehler im Backoffice)
 * außen vor.
 */
export function findRawKeys(texts, namespaces, segments = new Map()) {
  const hits = [];
  for (const t of texts) {
    for (const m of t.value.matchAll(TOKEN_RE)) {
      if (!namespaces.has(m[1])) continue;
      const seg = m[2].slice(1).split(".")[0];
      if (/^\d+$/.test(seg)) continue; // z. B. "Version 1.2"
      if (!/^[a-z_]/.test(seg) && !segments.get(m[1])?.has(seg)) continue;
      hits.push({ where: t.where, key: m[0], context: t.value.slice(0, 160) });
    }
  }
  return hits;
}

/** Bekannte zweite Segmente je Namespace (aus allen 4 Sprachen). */
export function knownSegments() {
  const map = new Map();
  for (const l of LOCALES) {
    for (const [ns, node] of Object.entries(readMessages(l).data)) {
      if (!isPlainObject(node)) continue;
      if (!map.has(ns)) map.set(ns, new Set());
      for (const k of Object.keys(node)) map.get(ns).add(k);
    }
  }
  return map;
}

async function fetchText(url, timeoutMs = 180000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": "r3-i18n-raw-keys" } });
    return { status: res.status, url: res.url, text: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

const locs = (xml, base) =>
  [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => base + new URL(m[1].trim()).pathname);

export async function buildRoutes({ base, brands = 6, products = 2, news = 2 }) {
  const routes = new Set();
  const sm = async (p) => {
    try {
      return locs((await fetchText(base + p)).text, base);
    } catch {
      return [];
    }
  };
  for (const u of await sm("/sitemap-static.xml")) routes.add(u);
  const marken = await sm("/sitemap-marken.xml");
  for (const l of LOCALES) {
    const mine = marken.filter((u) => new URL(u).pathname.startsWith(`/${l}/`));
    const brandPages = mine.filter((u) => new URL(u).pathname.split("/").length === 5);
    const pick = ["minotti", "classicon", "poliform"];
    const chosen = [
      ...brandPages.filter((u) => pick.some((p) => u.endsWith(`/${p}`))),
      ...brandPages.slice(0, brands),
    ];
    chosen.slice(0, brands).forEach((u) => routes.add(u));
    mine.filter((u) => new URL(u).pathname.split("/").length === 6).slice(0, 2).forEach((u) => routes.add(u));
  }
  const prod = await sm("/sitemap-produkte.xml");
  for (const l of LOCALES) {
    const mine = prod.filter((u) => new URL(u).pathname.startsWith(`/${l}/`));
    mine.filter((u) => new URL(u).pathname.split("/").length === 4).slice(0, 1).forEach((u) => routes.add(u));
    mine.filter((u) => new URL(u).pathname.split("/").length === 5).slice(0, products).forEach((u) => routes.add(u));
  }
  const nw = await sm("/sitemap-news.xml");
  for (const l of LOCALES) nw.filter((u) => new URL(u).pathname.startsWith(`/${l}/`)).slice(0, news).forEach((u) => routes.add(u));
  for (const l of LOCALES) for (const p of LANDING) routes.add(`${base}/${l}/${p}`);
  return [...routes];
}

async function browserScan(urls) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const out = {};
  try {
    for (const url of urls) {
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 180000 });
        await page.waitForTimeout(800);
        out[url] = await page.evaluate(() => {
          const texts = [{ where: "text", value: document.body.innerText }, { where: "title", value: document.title }];
          for (const el of document.querySelectorAll("[alt],[aria-label],[aria-description],[title],[placeholder],meta[content]")) {
            for (const a of ["alt", "aria-label", "aria-description", "title", "placeholder", "content"]) {
              const v = el.getAttribute(a);
              if (v) texts.push({ where: `dom-${a}`, value: v });
            }
          }
          return texts.flatMap((t) => t.value.split("\n").map((value) => ({ where: t.where, value })));
        });
      } catch (e) {
        out[url] = { error: String(e).slice(0, 200) };
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return out;
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, ...v] = a.replace(/^--/, "").split("=");
      return [k, v.length ? v.join("=") : true];
    }),
  );
  const base = String(args.base || "http://localhost:3000").replace(/\/$/, "");
  const concurrency = Number(args.concurrency || 3);
  const namespaces = knownNamespaces();
  const segments = knownSegments();
  let routes = await buildRoutes({
    base,
    brands: Number(args.brands ?? 6),
    products: Number(args.products ?? 2),
    news: Number(args.news ?? 2),
  });
  if (args.only) {
    const pre = String(args.only).split(",");
    routes = routes.filter((u) => pre.some((p) => new URL(u).pathname.startsWith(p)));
  }
  console.error(`Routen: ${routes.length}, Namespaces: ${namespaces.size}`);
  const results = [];
  const queue = [...routes];
  let done = 0;
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const r = { url: url.replace(base, ""), status: null, hits: [] };
      // Der Dev-Server antwortet unter Last (parallele Kompilate anderer
      // Pakete) gelegentlich mit 500; bis zu 3 Versuche mit Pause.
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { status, text } = await fetchText(url);
          r.status = status;
          r.attempts = attempt;
          r.hits = findRawKeys(htmlTexts(text), namespaces, segments);
          if (status < 500) break;
        } catch (e) {
          r.status = e.name === "AbortError" ? "timeout" : String(e.message);
        }
        await new Promise((res) => setTimeout(res, 4000 * attempt));
      }
      results.push(r);
      if (++done % 20 === 0) console.error(`  ${done}/${routes.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  if (args.browser) {
    const limit = Number(args["browser-limit"] || 40);
    const sample = routes.slice(0, limit);
    console.error(`Browser-Durchgang: ${sample.length} Seiten`);
    const dom = await browserScan(sample);
    for (const [url, texts] of Object.entries(dom)) {
      const r = results.find((x) => x.url === url.replace(base, ""));
      if (Array.isArray(texts)) r.hits.push(...findRawKeys(texts, namespaces, segments));
      else r.browserError = texts.error;
      r.browser = true;
    }
  }

  results.sort((a, b) => a.url.localeCompare(b.url));
  const withHits = results.filter((r) => r.hits.length);
  const serverErrors = results.filter((r) => typeof r.status !== "number" || r.status >= 500);
  for (const r of results) {
    const flag = r.hits.length ? `  ROH ${r.hits.length}` : "";
    console.log(`${String(r.status).padEnd(7)} ${r.url}${flag}`);
    for (const h of r.hits) console.log(`        [${h.where}] ${h.key}  ←  ${h.context}`);
  }
  const perLocale = Object.fromEntries(LOCALES.map((l) => [l, results.filter((r) => r.url.startsWith(`/${l}`)).length]));
  console.log(
    `\nGeprüft: ${results.length} Seiten (${LOCALES.map((l) => `${l} ${perLocale[l]}`).join(", ")}), ` +
      `Rohschlüssel: ${withHits.reduce((n, r) => n + r.hits.length, 0)} auf ${withHits.length} Seiten, ` +
      `Serverfehler/Timeouts: ${serverErrors.length}`,
  );
  if (args.json) fs.writeFileSync(String(args.json), JSON.stringify({ base, results }, null, 2));
  if (withHits.length || serverErrors.length) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
