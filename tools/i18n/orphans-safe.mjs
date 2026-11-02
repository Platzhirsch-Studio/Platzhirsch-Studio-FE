#!/usr/bin/env node
// tools/i18n/orphans-safe.mjs
// R4-i18n (4): strenge Zweitprüfung der heuristisch verwaisten Schlüssel aus
// tools/i18n/orphans.mjs. Ein Schlüssel NS.seg gilt nur dann als löschbar, wenn
//   A) das Segment `seg` als ganzes Wort in KEINER Quelldatei vorkommt
//      (src/ inkl. preview/**, tests/, tools/ außer tools/i18n, ohne src/messages) –
//      damit sind Datenlisten wie ["living","kitchen"] für t(`rooms.${k}.title`)
//      und Objekt-Schlüssel abgedeckt, und
//   B) keine Leserdatei des Namespace einen dynamischen Pfad baut
//      (t(variable), t(`…${x}…`), t.raw(variable)), weil der Schlüssel dann aus
//      Backoffice-Daten kommen kann (z. B. Slider.<marke>).
// Leserdateien: Dateien mit dem Namespace als Literal, dazu die Wrapper
// (useShellCopy → Shell, useInhalt → inhalt, getHomeT → HomePage, makeTr → Namespace-Argument).
//
// Aufruf: node tools/i18n/orphans-safe.mjs [--json=out.json] [--delete]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, ROOT, deletePath, readMessages, writeMessages } from "./lib.mjs";
import { analyse, readerSources } from "./orphans.mjs";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wrapper-Hooks, die einen Namespace lesen, ohne ihn als Literal zu nennen. */
export const WRAPPERS = {
  Shell: /\buseShellCopy\b/,
  inhalt: /\buseInhalt\b|\bgetInhalt\b/,
  HomePage: /\bgetHomeT\b/,
};

/** Übersetzer-Aufruf mit nicht-literalem Pfad. */
const DYNAMIC_CALL =
  /\b(?:t|tr|c|text|tt|tx|msg|messages|t[A-Z]\w*)(?:\.raw|\.rich|\.markup|\.has)?\(\s*(?:`[^`]*\$\{|[A-Za-z_$][\w$]*(?:\.[\w$]+|\[[^\]]+\])*\s*[,)])/;

export function hasDynamicCall(src) {
  return DYNAMIC_CALL.test(src);
}

export function safeAnalyse(sources = readerSources()) {
  const base = analyse(sources);
  const keep = [];
  const deletable = [];
  const readerFiles = (ns) =>
    sources.filter((s) => new RegExp(`["'\`]${esc(ns)}(?:["'\`]|\\.)`).test(s.src) || (WRAPPERS[ns] && WRAPPERS[ns].test(s.src)));
  const dynCache = {};
  for (const key of base.likelyOrphans) {
    const [ns, seg] = key.split(".");
    const word = new RegExp(`(?<![\\w$-])${esc(seg)}(?![\\w$-])`);
    const hits = sources.filter((s) => word.test(s.src)).map((s) => s.file);
    if (!(ns in dynCache)) dynCache[ns] = readerFiles(ns).filter((s) => hasDynamicCall(s.src)).map((s) => s.file);
    const dyn = dynCache[ns];
    if (hits.length) keep.push({ key, reason: "Wort kommt vor", files: hits.slice(0, 5) });
    else if (dyn.length) keep.push({ key, reason: "dynamischer Pfad im Leser", files: dyn.slice(0, 5) });
    else deletable.push(key);
  }
  return { orphanNamespaces: base.orphanNamespaces, likelyOrphans: base.likelyOrphans, keep, deletable };
}

function main() {
  const args = process.argv.slice(2);
  const r = safeAnalyse();
  console.log(`Verwaiste Namespaces: ${r.orphanNamespaces.join(", ") || "keine"}`);
  console.log(`Heuristisch verwaist: ${r.likelyOrphans.length}`);
  console.log(`\nLöschbar (kein Wort, kein dynamischer Pfad): ${r.deletable.length}`);
  for (const k of r.deletable) console.log(`  ${k}`);
  console.log(`\nBleiben (möglicher Leser): ${r.keep.length}`);
  for (const k of r.keep) console.log(`  ${k.key}  ← ${k.reason}: ${k.files.join(", ")}`);
  const j = args.find((a) => a.startsWith("--json="));
  if (j) fs.writeFileSync(j.slice(7), JSON.stringify(r, null, 2));
  if (args.includes("--delete") && r.deletable.length) {
    for (const l of LOCALES) {
      const m = readMessages(l);
      for (const k of r.deletable) deletePath(m.data, k);
      writeMessages(l, m.data, m.eol);
    }
    console.log(`\nGelöscht in allen 4 Sprachen: ${r.deletable.length} Schlüssel`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
