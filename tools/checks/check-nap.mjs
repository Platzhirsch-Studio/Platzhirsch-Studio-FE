#!/usr/bin/env node
// tools/checks/check-nap.mjs
// NAP-Inventur (Name/Adresse/Telefon + Öffnungszeiten): findet hartcodierte
// Adressen, Hausnummern (Landstraße 9 bzw. 11), Telefonnummern, E-Mail und
// Öffnungszeiten AUSSERHALB von src/lib/site.js und listet sie je Datei.
// Zweck: Die Hausnummern-Entscheidung (Firmenbuch 11 vs. Website 9) soll in
// einem Schritt umsetzbar sein. Das Skript ÄNDERT NICHTS.
//
// Aufruf: node tools/checks/check-nap.mjs [--json=out.json] [--strict]
//         [--dirs=src,public] [--only=hausnummer,telefon,…]
// Exit-Code: 0 (Inventur). Mit --strict 1, sobald außerhalb von site.js
// eine Hausnummer oder Telefonnummer hartcodiert ist.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walk, parseArgs } from "./lib/parse.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

export const SOURCE_OF_TRUTH = "src/lib/site.js";
const EXTS = [".js", ".jsx", ".mjs", ".ts", ".tsx", ".json", ".md", ".txt", ".xml", ".html", ".webmanifest", ".css"];
const SKIP = ["/node_modules/", "/.next/", "tools/checks/", "/tests/", "public/labs/models/"];

const STRASSE = "Landstra(?:ß|ss|s|%C3%9F|\\\\u00df|&szlig;)e";
const STRASSE_SEP = "(?:\\s|\\+|%20|&nbsp;|\\u00a0)*";

/** Regeln: id, label, regex (global). Reihenfolge = Ausgabe-Reihenfolge. */
export const NAP_RULES = [
  { id: "hausnummer", label: "Straße + Hausnummer", re: new RegExp(`${STRASSE}${STRASSE_SEP}(\\d+[a-z]?)`, "gi") },
  { id: "strasse", label: "Straße ohne Nummer", re: new RegExp(`${STRASSE}(?!${STRASSE_SEP}\\d)`, "gi") },
  { id: "plz-ort", label: "PLZ + Ort", re: /\b(?:A-|AT-)?6911(?:\s|\+|%20|,)*Lochau\b/gi },
  { id: "telefon", label: "Telefon Platzhirsch", re: /(?:(?:\+|00)\s*43[\s\-/().]*(?:\(0\))?[\s\-/().]*|\b0)5574[\s\-/().]*4[\s\-/.]*6[\s\-/.]*2[\s\-/.]*5[\s\-/.]*5\b/g },
  { id: "telefon-sonst", label: "Andere Telefonnummer", re: /(?<![\w./=#-])(?:\+|00)(?:41|43|49|39|33|423)[\s\-/().]*\d[\d\s\-/().]{6,16}\d(?![\w])/g },
  { id: "email", label: "E-Mail info@", re: /\binfo@platzhirsch\.studio\b/gi },
  { id: "geo", label: "Geo-Koordinaten", re: /\b47\.53\d{2,}\b|\b9\.75\d{2,}\b/g },
  {
    id: "oeffnungszeiten",
    label: "Öffnungszeiten",
    re: new RegExp(
      [
        // 10:00–18:00, 10.00 bis 18.00
        String.raw`\b(?:[01]?\d|2[0-3])[:.][0-5]\d\s*(?:Uhr\s*)?(?:–|—|-|bis|to|à|alle|a)\s*(?:[01]?\d|2[0-3])[:.][0-5]\d\b`,
        // 10–18 Uhr, 10 bis 14 Uhr, de 10 h à 18 h, dalle 10 alle 18
        String.raw`\b(?:[01]?\d|2[0-3])\s*(?:–|—|-|bis)\s*(?:[01]?\d|2[0-3])\s*Uhr\b`,
        String.raw`\bde\s+\d{1,2}\s*h\s*(?:\d{2})?\s*à\s*\d{1,2}\s*h`,
        String.raw`\bdalle\s+\d{1,2}(?:[:.]\d{2})?\s+alle\s+\d{1,2}`,
        // Di–Fr, Tue–Fri, Dienstag bis Freitag, Tuesday to Friday, du mardi au vendredi, da martedì a venerdì
        String.raw`\b(?:Montag|Dienstag|Mittwoch|Donnerstag|Monday|Tuesday|Wednesday|Thursday|lundi|mardi|mercredi|jeudi|lunedì|martedì|mercoledì|giovedì)\s+(?:bis|to|au|a)\s+(?:Freitag|Samstag|Friday|Saturday|vendredi|samedi|venerdì|sabato)\b`,
        String.raw`"(?:opens|closes)"\s*:`,
        String.raw`\b(?:opens|closes)\s*:\s*["']`,
        String.raw`openingHours(?:Specification)?`,
        String.raw`Öffnungszeiten|opening hours|horaires d'ouverture|orari di apertura`,
      ].join("|"),
      "gi",
    ),
  },
  // Wochentag-Spannen (Di–Fr, Tue–Fri) case-sensitiv, sonst trifft "fr-FR".
  { id: "oeffnungszeiten", label: "Öffnungszeiten", re: /\b(?:Mo|Di|Mi|Do|Fr|Sa|Mon|Tue|Wed|Thu|Fri|Sat)\s*(?:–|—|-)\s*(?:Fr|Sa|So|Fri|Sat|Sun)\b/g },
];

/** Alle NAP-Funde in einem Text. @returns {{rule:string, line:number, match:string, number?:string, text:string}[]} */
export function scanNap(source, { only = null } = {}) {
  const out = [];
  const lines = String(source).split(/\r?\n/);
  lines.forEach((text, i) => {
    for (const rule of NAP_RULES) {
      if (only && !only.includes(rule.id)) continue;
      rule.re.lastIndex = 0;
      for (const m of text.matchAll(rule.re)) {
        // Telefon-sonst: Platzhirsch-Nummer nicht doppelt zählen.
        if (rule.id === "telefon-sonst" && /5574\D*4\D*6\D*2\D*5\D*5/.test(m[0])) continue;
        const f = { rule: rule.id, line: i + 1, match: m[0].trim(), text: text.trim().slice(0, 200) };
        if (rule.id === "hausnummer") f.number = m[1];
        out.push(f);
      }
    }
  });
  return out;
}

export function scanFiles(dirs) {
  const results = [];
  for (const d of dirs) {
    for (const file of walk(path.join(ROOT, d), { exts: EXTS, skip: SKIP })) {
      const r = rel(file);
      if (r === SOURCE_OF_TRUTH) continue;
      let src;
      try {
        src = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }
      if (src.length > 3_000_000) continue;
      const findings = scanNap(src);
      if (findings.length) results.push({ file: r, findings });
    }
  }
  return results;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dirs = typeof args.dirs === "string" ? args.dirs.split(",") : ["src", "public"];
  let results = scanFiles(dirs);
  if (typeof args.only === "string") {
    const only = args.only.split(",");
    results = results
      .map((r) => ({ ...r, findings: r.findings.filter((f) => only.includes(f.rule)) }))
      .filter((r) => r.findings.length);
  }

  const totals = {};
  const numbers = {};
  for (const r of results) {
    for (const f of r.findings) {
      totals[f.rule] = (totals[f.rule] || 0) + 1;
      if (f.number) numbers[f.number] = (numbers[f.number] || 0) + 1;
    }
  }

  console.log(`NAP-Inventur (außerhalb von ${SOURCE_OF_TRUTH}), Ordner: ${dirs.join(", ")}\n`);
  for (const r of results) {
    const counts = r.findings.reduce((a, f) => ((a[f.rule] = (a[f.rule] || 0) + 1), a), {});
    console.log(`${r.file}  [${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ")}]`);
    for (const f of r.findings) {
      console.log(`  ${String(f.line).padStart(5)}  ${f.rule.padEnd(15)} ${f.match}${f.number ? `  (Nr. ${f.number})` : ""}`);
    }
  }
  console.log(`\nDateien mit Funden: ${results.length}`);
  console.log(`Funde je Regel: ${Object.entries(totals).map(([k, v]) => `${k} ${v}`).join(", ") || "keine"}`);
  console.log(`Hausnummern: ${Object.entries(numbers).map(([k, v]) => `Landstraße ${k} × ${v}`).join(", ") || "keine"}`);

  if (args.json) fs.writeFileSync(path.resolve(String(args.json)), JSON.stringify({ totals, numbers, results }, null, 2));
  const hard = (totals.hausnummer || 0) + (totals.telefon || 0);
  process.exitCode = args.strict && hard ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
