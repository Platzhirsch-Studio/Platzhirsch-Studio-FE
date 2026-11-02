#!/usr/bin/env node
// tools/i18n/rendered-text-check.mjs (R6-i18n Fix)
// Schlussprüfung „eine Textquelle“ am ausgelieferten HTML: claims-words.mjs
// prüft nur src/messages. Texte aus dem CMS (Meta der Startseite) und aus dem
// Code (homeSeo.js, llms.js) landen aber ebenso in <meta>, JSON-LD und
// Fließtext. Dieses Werkzeug holt die Seiten vom laufenden Dev-Server und
// meldet Prüfwörter der Design-Bibel sowie feste Markenzahlen („über 35“ …).
// Die Markenzahl ist bewusst nicht als feste Angabe zugelassen: Die einzige
// Zahl ist der Live-Zähler der Markenseite („{count} Marken von A bis Z“,
// direkt aus der CMS-Liste gezählt).
//
// Aufruf: node tools/i18n/rendered-text-check.mjs [--base=http://localhost:3000]
//         [--json=out.json] [--report] [pfad …]   (Exit 1 bei Fund, außer --report)
import fs from "node:fs";
import { WORDS, loadAllow } from "./claims-words.mjs";
import { leaves, readMessages } from "./lib.mjs";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("--base="))?.slice(7) || "http://localhost:3000";
const jsonOut = args.find((a) => a.startsWith("--json="))?.slice(7);
const report = args.includes("--report");
const paths = args.filter((a) => !a.startsWith("--"));
const PATHS = paths.length
  ? paths
  : ["/de", "/en", "/fr", "/it", "/de/ueber-uns/marken", "/de/kontakt", "/it/contatto", "/llms.txt"];

const L = "\\p{L}\\p{N}";
const WORD_RE = new RegExp(`(?<![${L}])(?:${WORDS.join("|")})(?![${L}])`, "giu");
// Feste Markenzahl: „über/mehr als 35 … Marken“, „more than 35 … brands“, „plus de 35 … marques“, „oltre 35 … marchi“.
const COUNT_RE = /(?:über|mehr als|more than|over|plus de|oltre|più di)\s+\d{2}\s+(?:[\p{L}-]+\s+){0,3}(?:marken|designmarken|brands|marques|marchi)/giu;

function decode(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
}

// Sichtbarer Text, Meta-Inhalte und JSON-LD getrennt, damit der Fundort klar ist.
export function partsOf(html) {
  const meta = [...html.matchAll(/<meta[^>]+content="([^"]*)"/g)].map((m) => decode(m[1])).join("\n");
  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
  const body = decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
  return { meta, jsonld: ld, text: body };
}

// Freigegebene Messages (claims-words-allow.json): Treffer innerhalb eines
// solchen Textes auf der Seite gelten als freigegeben.
export function allowedSpans() {
  const out = [];
  for (const a of loadAllow()) {
    const flat = new Map(leaves(readMessages(a.locale).data));
    const v = flat.get(a.key);
    if (typeof v === "string") out.push(v.replace(/\s+/g, " ").trim());
  }
  return out;
}

function inAllowed(s, idx, spans) {
  for (const v of spans) {
    for (let i = s.indexOf(v); i !== -1; i = s.indexOf(v, i + 1)) if (idx >= i && idx < i + v.length) return true;
  }
  return false;
}

export function findings(parts, spans = []) {
  const out = [];
  for (const [where, s] of Object.entries(parts)) {
    for (const m of s.matchAll(WORD_RE)) if (!inAllowed(s, m.index, spans)) out.push({ where, kind: "prüfwort", hit: m[0], ctx: s.slice(Math.max(0, m.index - 50), m.index + 60).replace(/\s+/g, " ") });
    for (const m of s.matchAll(COUNT_RE)) out.push({ where, kind: "markenzahl", hit: m[0], ctx: s.slice(Math.max(0, m.index - 50), m.index + 80).replace(/\s+/g, " ") });
  }
  return out;
}

async function main() {
  const result = {};
  const spans = allowedSpans();
  let total = 0;
  for (const p of PATHS) {
    const res = await fetch(base + p, { redirect: "follow" });
    const html = await res.text();
    const parts = p.endsWith(".txt") ? { text: html } : partsOf(html);
    const f = findings(parts, spans);
    result[p] = { status: res.status, findings: f };
    total += f.length;
    console.log(`${p}  ${res.status}  ${f.length ? f.length + " Fund(e)" : "ok"}`);
    for (const x of f) console.log(`   [${x.where}] ${x.kind}: „${x.hit}“  … ${x.ctx} …`);
  }
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(result, null, 2));
  console.log(`\n${total} Fund(e) auf ${PATHS.length} Seiten`);
  if (total && !report) process.exit(1);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) main();
