#!/usr/bin/env node
// tools/i18n/claims-words.mjs
// Ergänzt `npm run check:claims` für src/messages: listet Prüfwörter der
// Design-Bibel (Superlative/Alleinstellung, Luxus, Traum, exklusiv, Premium …)
// in allen 4 Sprachen, mit Schlüsselpfad. Exit 1 bei Fund (außer --report).
// Freigaben (bewusst belassen, mit Begründung) stehen in claims-words-allow.json.
//
// Aufruf: node tools/i18n/claims-words.mjs [--report] [--all] [--json=out.json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, leaves, readMessages } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const L = "\\p{L}\\p{N}";
export const WORDS = [
  // DE
  "größt\\p{L}*", "grösst\\p{L}*", "führend\\p{L}*", "exklusiv\\p{L}*", "luxus\\p{L}*", "luxuriös\\p{L}*", "traum\\p{L}*",
  "beste[nmrs]?", "bestens", "perfekt\\p{L}*", "einzigartig\\p{L}*", "einmalig\\p{L}*", "premium[\\p{L}-]*", "erstklassig\\p{L}*",
  "unvergleichlich\\p{L}*", "nr\\. ?1", "nummer eins", "marktführ\\p{L}*",
  // EN
  "largest", "biggest", "leading", "exclusive\\p{L}*", "exclusively", "luxury", "luxurious", "dream\\p{L}*", "best",
  "perfect\\p{L}*", "unique\\p{L}*", "unparalleled", "unrivall?ed", "world-class", "first-class", "finest",
  // FR
  "plus grand\\p{L}*", "leader", "exclusi[fv]\\p{L}*", "luxe", "luxueu\\p{L}*", "rêve\\p{L}*", "meilleur\\p{L}*",
  "parfait\\p{L}*", "parfaitement", "incomparable\\p{L}*", "haut de gamme",
  // IT
  "più grand\\p{L}*", "esclusiv\\p{L}*", "lusso", "lussuos\\p{L}*", "sogn\\p{L}*", "miglior\\p{L}*",
  "perfett\\p{L}*", "unic[oaie]", "unicità", "ineguagliabil\\p{L}*", "eccellenz\\p{L}*",
];
export const WORD_RE = new RegExp(`(?<![${L}])(?:${WORDS.join("|")})(?![${L}])`, "giu");

/** Freigaben: [{locale, key, word, reason}] – word optional (dann alle Wörter des Schlüssels). */
export function loadAllow(file = path.join(HERE, "claims-words-allow.json")) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")).allow ?? [];
  } catch {
    return [];
  }
}

function allowed(hit, allow) {
  return allow.some(
    (a) =>
      (a.locale === "*" || a.locale === hit.locale) &&
      (a.key === hit.key || (a.key.endsWith(".*") && hit.key.startsWith(a.key.slice(0, -1)))) &&
      (!a.word || a.word.toLowerCase() === hit.word.toLowerCase()),
  );
}

/** Funde je Sprache: {locale, key, word, value, allowed}. */
export function scanMessages(locales = LOCALES, allow = loadAllow()) {
  const out = [];
  for (const l of locales) {
    for (const [key, value] of leaves(readMessages(l).data)) {
      if (typeof value !== "string") continue;
      for (const m of value.matchAll(WORD_RE)) {
        const hit = { locale: l, key, word: m[0], value };
        hit.allowed = allowed(hit, allow);
        out.push(hit);
      }
    }
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const all = scanMessages();
  const hits = args.includes("--all") ? all : all.filter((h) => !h.allowed);
  for (const h of hits) console.log(`${h.locale}  ${h.key}  „${h.word}“${h.allowed ? " (frei)" : ""}  →  ${h.value.slice(0, 140)}`);
  console.log(`\nPrüfwörter in src/messages: ${all.filter((h) => !h.allowed).length} offen, ${all.filter((h) => h.allowed).length} freigegeben`);
  const j = args.find((a) => a.startsWith("--json="));
  if (j) fs.writeFileSync(j.slice(7), JSON.stringify(all, null, 2));
  if (hits.some((h) => !h.allowed) && !args.includes("--report")) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
