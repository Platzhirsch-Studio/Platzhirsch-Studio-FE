#!/usr/bin/env node
// tools/i18n/orphans.mjs
// Verwaiste Schlüssel in src/messages finden (R3-i18n Punkt 4).
//
// Zwei Stufen, bewusst vorsichtig:
//  1. Namespace verwaist: der Name der obersten Ebene (z. B. "Choice") kommt in
//     keiner Quelldatei unter src/ (inkl. preview/**, ohne src/messages), tests/
//     oder tools/ als String-Literal vor – weder als "NS" noch als "NS.…" noch in
//     einem Template-Literal. Nur solche Namespaces gelten als löschbar.
//  2. Schlüssel vermutlich verwaist: Namespace wird gelesen, aber das erste
//     Segment unterhalb des Namespace taucht in keiner Datei auf, die den
//     Namespace nennt. Diese Liste ist heuristisch (dynamische t()-Pfade wie
//     t(`${id}.title`) sind nicht sicher erkennbar) und wird NUR gelistet.
//
// Aufruf: node tools/i18n/orphans.mjs [--json=out.json] [--delete-namespaces]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, ROOT, isPlainObject, readMessages, writeMessages } from "./lib.mjs";

const EXTS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXTS.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

/** Quelltexte, in denen Leser stehen können. */
export function readerSources() {
  const files = [
    ...walk(path.join(ROOT, "src")),
    ...walk(path.join(ROOT, "tests")),
    ...walk(path.join(ROOT, "tools")).filter((f) => !f.includes(`${path.sep}i18n${path.sep}`)),
  ].filter((f) => !f.includes(`${path.sep}messages${path.sep}`));
  return files.map((f) => ({ file: path.relative(ROOT, f).replace(/\\/g, "/"), src: fs.readFileSync(f, "utf8") }));
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Kommt `name` als String-Literal (oder Präfix "name." / Template) vor? */
export function mentions(src, name) {
  const n = esc(name);
  return new RegExp(`["'\`]${n}(?:["'\`]|\\.)`).test(src) || new RegExp(`\\.${n}(?![\\w$])`).test(src);
}

export function analyse(sources = readerSources()) {
  const de = readMessages("de").data;
  const all = Object.fromEntries(LOCALES.map((l) => [l, readMessages(l).data]));
  const namespaces = [...new Set(LOCALES.flatMap((l) => Object.keys(all[l])))];
  const orphanNamespaces = [];
  const likelyOrphans = [];
  const readers = {};
  for (const ns of namespaces) {
    const files = sources.filter((s) => new RegExp(`["'\`]${esc(ns)}(?:["'\`]|\\.)`).test(s.src));
    readers[ns] = files.map((f) => f.file);
    if (!files.length) {
      orphanNamespaces.push(ns);
      continue;
    }
    const node = de[ns] ?? all.en[ns];
    if (!isPlainObject(node)) continue;
    for (const seg of Object.keys(node)) {
      if (/^\d+$/.test(seg)) continue; // Listen werden per Index/Map gelesen
      if (!files.some((f) => mentions(f.src, seg) || new RegExp(`["'\`]${esc(seg)}[.\\w]*["'\`]`).test(f.src))) {
        likelyOrphans.push(`${ns}.${seg}`);
      }
    }
  }
  // Stufe 1b: Namespace-Name kommt zwar als Literal vor (z. B. "article" als
  // HTML-Tag), aber nie als Übersetzungs-Namespace oder Wurzelpfad "NS.x".
  const allSrc = sources.map((s) => s.src).join("\n");
  const noTranslationReader = namespaces.filter((ns) => {
    if (orphanNamespaces.includes(ns)) return false;
    const e = esc(ns);
    const q = "[\"'`]";
    const re = new RegExp(
      [
        `(?:useTranslations|getTranslations|useInhalt|getInhalt|createTranslator)\\(\\s*(?:\\{[^}]*namespace:\\s*)?${q}${e}[${"\"'`"}.]`,
        `namespace:\\s*${q}${e}[${"\"'`"}.]`,
        `${q}${e}\\.[\\w$]`,
        `_NAMESPACE\\s*=\\s*${q}${e}${q}`,
      ].join("|"),
    );
    return !re.test(allSrc);
  });
  return { orphanNamespaces, noTranslationReader, likelyOrphans, readers };
}

function main() {
  const args = process.argv.slice(2);
  const r = analyse();
  console.log(`Verwaiste Namespaces (kein Literal in src/, tests/, tools/): ${r.orphanNamespaces.length}`);
  for (const ns of r.orphanNamespaces) console.log(`  ${ns}`);
  console.log(`\nNamespaces ohne Übersetzungs-Leser (Literal nur in anderem Sinn, von Hand prüfen): ${r.noTranslationReader.length}`);
  for (const ns of r.noTranslationReader) console.log(`  ${ns}  ← Literal in: ${r.readers[ns].slice(0, 3).join(", ")}`);
  console.log(`\nVermutlich verwaiste Schlüssel (nur Liste, heuristisch): ${r.likelyOrphans.length}`);
  for (const k of r.likelyOrphans) console.log(`  ${k}`);
  const j = args.find((a) => a.startsWith("--json="));
  if (j) fs.writeFileSync(j.slice(7), JSON.stringify(r, null, 2));
  if (args.includes("--delete-namespaces") && r.orphanNamespaces.length) {
    for (const l of LOCALES) {
      const m = readMessages(l);
      for (const ns of r.orphanNamespaces) delete m.data[ns];
      writeMessages(l, m.data, m.eol);
    }
    console.log(`\nGelöscht in allen 4 Sprachen: ${r.orphanNamespaces.join(", ")}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
