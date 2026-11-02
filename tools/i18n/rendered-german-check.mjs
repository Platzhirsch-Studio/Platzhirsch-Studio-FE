#!/usr/bin/env node
// tools/i18n/rendered-german-check.mjs
// Feinschliff Übersetzungen (28.10.2026): Zeigt eine EN/FR/IT-Seite deutsche
// Reste oder fehlende Schlüssel?
//
// 1) HTML-Durchgang (Standard): holt die EN/FR/IT-Routen vom Dev-Server
//    (sitemap-static.xml + Auswahl Marken/Produkte/News + Landingpages, wie
//    raw-keys.mjs) und prüft jeden sichtbaren Text, <title>, Meta, alt,
//    aria-label, title, placeholder mit derselben Heuristik wie parity.mjs
//    (deutsche Funktionswörter, Anrede „Sie/Ihr“, Umlaut-Wörter; Eigennamen
//    aus same-as-de-allow.json). Rohschlüssel (findRawKeys) zählen mit.
// 2) --browser[=N]: öffnet N Seiten (Standard 12) in Chromium und sammelt
//    Konsolenmeldungen von next-intl (MISSING_MESSAGE, FORMATTING_ERROR,
//    INVALID_KEY, „Could not resolve“).
//
// Einordnung der Funde: „de-message“ = der Text ist (Teil) eines Textes aus
// src/messages/de.json, d. h. auf der EN/FR/IT-Seite erscheint der deutsche
// Message-Text (fehlender Schlüssel mit DE-Fallback, tx(), fest verdrahtete
// Kopie). „andere“ = Text im Code oder aus dem Backoffice (Produkt-/
// Markentexte); das ist Sache des Code-Besitzers bzw. der Redaktion.
//
// 3) DE-only-404 (fix2, QM-Feedback P2-1): DE-only-Seiten (Labs, Preview,
//    Portal, Arbeitsweise …) stehen nicht in der Sitemap. Ihre EN/FR/IT-URL
//    liefert 404 – deren <title> und Meta-Description dürfen trotzdem nicht
//    deutsch sein (statisches `export const metadata` in der DE-only-Seite
//    oder im Root-Layout). Geprüft werden alle statischen page.js unter
//    src/app/[locale], die nicht schon als Route vorkommen, standardmäßig nur
//    unter /en (die Metadaten sind sprachunabhängig); --de-only=all prüft
//    EN/FR/IT, --de-only=off schaltet den Durchgang ab.
//
// Aufruf: node tools/i18n/rendered-german-check.mjs [--base=http://localhost:3000]
//   [--only=/en,/fr/kontakt] [--browser[=12]] [--json=out.json] [--concurrency=2]
//   [--de-only=en|all|off] [--timeout=240000]
// Exit 1 bei einem DE-Message-Text, einem Rohschlüssel, einer next-intl-
// Konsolenmeldung, einem deutschen 404-Titel/-Description oder einem 5xx;
// mit --strict auch bei „andere“.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, readMessages } from "./lib.mjs";
import { flatten, germanHints, isLegal } from "./parity.mjs";
import { buildRoutes, findRawKeys, htmlTexts, knownNamespaces, knownSegments } from "./raw-keys.mjs";

const TARGET = ["en", "fr", "it"];
const INTL_CONSOLE = /MISSING_MESSAGE|FORMATTING_ERROR|INVALID_KEY|INVALID_MESSAGE|Could not resolve|next-intl/i;

/** Deutsche Message-Texte (auch Teilstücke von ICU-Texten), nur mit deutschem Merkmal. */
function deMessageTexts() {
  const set = new Set();
  for (const [k, v] of flatten(readMessages("de").data)) {
    if (typeof v !== "string" || k.endsWith("#len")) continue;
    for (const part of v.split(/\{[^{}]*\}|[{}]/)) {
      const p = part.trim();
      if (p.length >= 12 && germanHints("en", "", p, undefined).length) set.add(p);
    }
  }
  return set;
}

/** Legal-Texte (markiert): auf der Seite gefunden → kein Fund, nur Hinweis. */
function legalTexts(locale) {
  const set = new Set();
  for (const [k, v] of flatten(readMessages(locale).data)) if (typeof v === "string" && isLegal(k)) set.add(v.trim());
  return set;
}

export function scanTexts(locale, texts, { deTexts, legal }) {
  const own = [];
  const cms = [];
  const seen = new Set();
  for (const t of texts) {
    const v = t.value.trim();
    if (!v || seen.has(v) || v.length > 2000) continue;
    seen.add(v);
    if (legal.has(v)) continue;
    // Datum/Uhrzeit, reine Zahlen, Code
    if (!/\p{L}{3}/u.test(v)) continue;
    const hints = germanHints(locale, "", v, undefined);
    if (!hints.length) continue;
    const fromMessages = [...deTexts].some((m) => v.includes(m) || (v.length >= 12 && m.includes(v)));
    (fromMessages ? own : cms).push({ where: t.where, hints, text: v.slice(0, 160) });
  }
  return { own, cms };
}

/** Statische Seiten unter src/app/[locale] (ohne [dynamische] Segmente), z. B. "labs/sofaplaner". */
export function staticPagePaths(root = ROOT) {
  const base = path.join(root, "src", "app", "[locale]");
  const out = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(base, rel), { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.includes("[") || e.name.startsWith("(") || e.name.startsWith("_")) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (fs.existsSync(path.join(base, r, "page.js"))) out.push(r);
      walk(r);
    }
  };
  walk("");
  return out.sort();
}

const decodeHtml = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** <title> und Meta-Description einer HTML-Antwort. */
export function headTexts(html) {
  const out = [];
  const t = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  if (t) out.push({ where: "title", value: decodeHtml(t[1]) });
  for (const m of html.matchAll(/<meta\s+[^>]*>/gi)) {
    const tag = m[0];
    if (!/(name|property)="(description|og:title|og:description)"/i.test(tag)) continue;
    const c = /content="([^"]*)"/i.exec(tag);
    if (c) out.push({ where: /name="description"/i.test(tag) ? "description" : /og:title/i.test(tag) ? "og:title" : "og:description", value: decodeHtml(c[1]) });
  }
  return out;
}

/** Deutsche <title>/Description auf einer EN/FR/IT-Antwort (Liste der Funde). */
export function germanHead(locale, html) {
  return headTexts(html)
    .map((h) => ({ ...h, hints: germanHints(locale, "", h.value, undefined) }))
    .filter((h) => h.hints.length && /\p{L}{3}/u.test(h.value));
}

async function fetchText(url, timeoutMs = 240000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": "i18n-german-check" } });
    return { status: res.status, text: await res.text() };
  } catch (e) {
    return { status: "ERR", text: "", error: String(e).slice(0, 160) };
  } finally {
    clearTimeout(timer);
  }
}

async function browserConsole(urls) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const out = {};
  try {
    for (const url of urls) {
      const page = await browser.newPage();
      const msgs = [];
      page.on("console", (m) => {
        if (INTL_CONSOLE.test(m.text())) msgs.push(`${m.type()}: ${m.text().slice(0, 300)}`);
      });
      page.on("pageerror", (e) => {
        if (INTL_CONSOLE.test(String(e))) msgs.push(`pageerror: ${String(e).slice(0, 300)}`);
      });
      try {
        await page.goto(url, { waitUntil: "load", timeout: 240000 });
        await page.waitForTimeout(1500);
      } catch (e) {
        msgs.push(`goto: ${String(e).slice(0, 160)}`);
      }
      out[url] = msgs;
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n) => args.find((a) => a === `--${n}` || a.startsWith(`--${n}=`));
  const val = (n, d) => opt(n)?.split("=")[1] ?? d;
  const base = val("base", "http://localhost:3000");
  const conc = Number(val("concurrency", 2));
  const only = opt("only") ? val("only").split(",").map((p) => base + p) : null;
  const timeoutMs = Number(val("timeout", 240000));
  let routes = only || (await buildRoutes({ base, brands: 3, products: 1, news: 1 }));
  routes = routes.filter((u) => TARGET.includes(new URL(u).pathname.split("/")[1]));
  const deOnlyMode = val("de-only", "en");
  const known = new Set(routes.map((u) => new URL(u).pathname.replace(/\/$/, "")));
  const deOnly = only || deOnlyMode === "off" ? [] : (deOnlyMode === "all" ? TARGET : ["en"]).flatMap((l) => staticPagePaths().map((p) => `/${l}/${p}`)).filter((p) => !known.has(p)).map((p) => base + p);
  const deOnlySet = new Set(deOnly);
  routes = [...routes, ...deOnly];
  const ns = knownNamespaces();
  const seg = knownSegments();
  const deTexts = deMessageTexts();
  const ctx = Object.fromEntries(TARGET.map((l) => [l, { deTexts, legal: legalTexts(l) }]));
  console.error(`Routen EN/FR/IT: ${routes.length} (davon DE-only-404-Proben: ${deOnly.length})`);
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: conc }, async () => {
      while (i < routes.length) {
        const url = routes[i++];
        const l = new URL(url).pathname.split("/")[1];
        const r = await fetchText(url, timeoutMs);
        const texts = r.text ? htmlTexts(r.text) : [];
        const { own, cms } = scanTexts(l, texts, ctx[l]);
        const raw = findRawKeys(texts, ns, seg);
        // Deutscher Kopf (title/description) zählt auf jeder EN/FR/IT-Antwort, auch auf der 404.
        const head = r.text ? germanHead(l, r.text) : [];
        results.push({ url, status: r.status, deOnly: deOnlySet.has(url), own, cms, raw, head, ...(r.error ? { error: r.error } : {}) });
        if (results.length % 20 === 0) console.error(`  ${results.length}/${routes.length}`);
      }
    }),
  );
  results.sort((a, b) => a.url.localeCompare(b.url));
  let fails = 0;
  for (const r of results) {
    const bad = r.own.length + r.raw.length + r.head.length + (opt("strict") ? r.cms.length : 0) + (String(r.status).startsWith("5") || r.status === "ERR" ? 1 : 0);
    fails += bad;
    console.log(`${String(r.status).padEnd(4)} ${r.url}${r.deOnly ? " (DE-only)" : ""}  de-message:${r.own.length} andere:${r.cms.length} roh:${r.raw.length} kopf-deutsch:${r.head.length}`);
    for (const h of r.head) console.log(`     [kopf ${h.where}] ${h.hints.join(", ")} ← ${h.value.slice(0, 160)}`);
    if (r.error) console.log(`     [fehler] ${r.error}`);
    for (const h of r.own) console.log(`     [de-message ${h.where}] ${h.hints.join(", ")} ← ${h.text}`);
    for (const h of r.raw) console.log(`     [rohschlüssel ${h.where}] ${h.key}`);
    for (const h of r.cms) console.log(`     (andere ${h.where}) ${h.hints.join(", ")} ← ${h.text}`);
  }
  let consoleOut = null;
  if (opt("browser")) {
    const n = Number(val("browser", 12)) || 12;
    const pick = [...new Set(results.filter((r) => r.status === 200).map((r) => r.url))].slice(0, n);
    consoleOut = await browserConsole(pick);
    for (const [u, m] of Object.entries(consoleOut)) {
      console.log(`konsole ${m.length ? "FUND" : "ok  "} ${u}`);
      for (const x of m) console.log(`     ${x}`);
      fails += m.filter((x) => !x.startsWith("goto")).length;
    }
  }
  const s = (k) => results.reduce((n, r) => n + r[k].length, 0);
  console.log(`\nSeiten ${results.length} (DE-only-404-Proben ${results.filter((r) => r.deOnly).length}) · DE-Message-Texte ${s("own")} · Rohschlüssel ${s("raw")} · deutscher title/description ${s("head")} · andere deutsche Texte (Code/Backoffice) ${s("cms")} · 5xx/Fehler ${results.filter((r) => String(r.status).startsWith("5") || r.status === "ERR").length}`);
  if (opt("json")) fs.writeFileSync(path.resolve(ROOT, val("json")), JSON.stringify({ results, console: consoleOut }, null, 2) + "\n");
  process.exit(fails ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
