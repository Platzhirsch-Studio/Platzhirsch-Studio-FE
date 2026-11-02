#!/usr/bin/env node
// tools/i18n/parity.mjs
// Abgleich aller Schlüssel von src/messages/{en,fr,it}.json gegen de.json
// (Feinschliff Übersetzungen, 28.10.2026). Nur lesen, nie schreiben.
//
// Geprüft je Sprache:
//   missing   Schlüssel aus DE fehlt (next-intl zeigt dann den Rohschlüssel
//             bzw. MISSING_MESSAGE in der Konsole)
//   extra     Schlüssel gibt es nur in dieser Sprache
//   type      Typ weicht ab (Text/Zahl/Liste/Objekt) oder Listenlänge
//   icu       ICU-Syntaxfehler oder andere Platzhalter/Plural-/Select-Variablen
//             als DE (z. B. {count} fehlt → Laufzeitfehler FORMATTING_ERROR)
//   german    vermutlich deutscher Rest: gleicher Text wie DE oder typische
//             deutsche Wörter/Umlaute (Eigennamen über same-as-de-allow.json)
//   legal     Rechtstext laut legal-keys.json: nur markiert, nicht übersetzt
//
// Aufruf: node tools/i18n/parity.mjs [--json=out.json] [--md=out.md]
//         [--todo=out.json]  (fehlende Schlüssel mit DE-Text als Übersetzungsliste)
// Exit 1 bei missing/extra/type/icu/german > 0.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseIcu } from "@formatjs/icu-messageformat-parser";
import { LOCALES, ROOT, isPlainObject, readMessages } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), "utf8"));

export const LEGAL = readJson("legal-keys.json").keys;
export const ALLOW = readJson("same-as-de-allow.json");

const matchesPrefix = (k, p) => k === p || k.startsWith(`${p}.`);
export const isLegal = (k) => LEGAL.some((e) => matchesPrefix(k, e.path));

/** Blätter inkl. Typ-Info; "_"-Schlüssel (Redaktionshinweise) zählen nicht. */
export function flatten(obj, prefix = "", out = new Map()) {
  if (Array.isArray(obj)) {
    out.set(`${prefix}#len`, obj.length);
    obj.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (isPlainObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("_")) continue;
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else out.set(prefix, obj);
  return out;
}

/** ICU-Signatur: Argumentnamen mit Art (arg/plural/select/tag), sortiert. */
export function icuSignature(text) {
  const sig = new Set();
  const walk = (els) => {
    for (const e of els) {
      // TYPE: 0 literal, 1 argument, 2 number, 3 date, 4 time, 5 select, 6 plural, 7 pound, 8 tag
      if (e.type === 1 || e.type === 2 || e.type === 3 || e.type === 4) sig.add(`${e.value}`);
      if (e.type === 5 || e.type === 6) {
        sig.add(`${e.value}:${e.type === 5 ? "select" : "plural"}`);
        for (const o of Object.values(e.options)) walk(o.value);
      }
      if (e.type === 8) {
        sig.add(`<${e.value}>`);
        walk(e.children);
      }
    }
  };
  walk(parseIcu(text, { ignoreTag: false }));
  return [...sig].sort().join(" ");
}

// Typische deutsche Funktionswörter (ganze Wörter, Groß-/Kleinschreibung egal,
// außer "Sie"/"Ihr…", die nur großgeschrieben deutsch sind).
const GERMAN_WORDS = /(?<![\p{L}])(und|oder|nicht|mit|für|bitte|wir|unsere?[nmrs]?|eine?[nmrs]?|der|die|das|dem|den|des|ist|sind|auf|von|zum|zur|vom|bei|über|nach|noch|auch|werden|können|möchten|Uhr|Stück|Möbel|Küche[n]?|Termin|Anfrage)(?![\p{L}])/iu;
const GERMAN_FORMAL = /(?<![\p{L}])(Sie|Ihre?[nmrs]?)(?![\p{L}])/u;
const UMLAUT_WORD = /\p{L}*[äöüßÄÖÜ]\p{L}*/gu;

function stripAllowed(text, locale) {
  let s = text;
  // Längste zuerst, damit „Designer“ nicht als „Design“ + „er“ übrig bleibt.
  const allowed = [...ALLOW.names, ...(ALLOW.words[locale] || [])].sort((a, b) => b.length - a.length);
  for (const w of allowed) s = s.split(w).join(" ");
  // ICU-Argumente und -Schlüsselwörter entfernen ({count, plural, one {…}})
  s = s.replace(/\{\s*\w+\s*(,\s*(plural|select|selectordinal|number|date|time)\s*,?)?/g, " ");
  s = s.replace(/\b(one|other|zero|few|many|two|yes|no)\b|=\d+/g, " ");
  // URLs, E-Mail, Pfade
  s = s.replace(/https?:\/\/\S+|[\w.+-]+@[\w.-]+|\/[\w/-]+/g, " ");
  return s;
}

/** Gründe, warum ein Wert in locale nach deutschem Rest aussieht (leer = ok). */
export function germanHints(locale, key, value, deValue) {
  if (typeof value !== "string" || !value.trim()) return [];
  if (ALLOW.keys.some((p) => matchesPrefix(key, p))) return [];
  const hints = [];
  const s = stripAllowed(value, locale);
  const letters = (x) => /\p{L}{2,}/u.test(x);
  if (typeof deValue === "string" && value === deValue && letters(s)) hints.push("gleich wie DE");
  const w = s.match(GERMAN_WORDS);
  // "die"/"des"/"me" usw. sind in FR/IT/EN eigene Wörter → nur Wörter zählen,
  // die in der Zielsprache nicht vorkommen.
  const falseFriends = { fr: ["des", "die", "auf", "Termin"], it: ["die", "des", "den", "Termin"], en: ["die", "den", "Termin"] };
  if (w && !(falseFriends[locale] || []).some((f) => f.toLowerCase() === w[1].toLowerCase())) hints.push(`deutsches Wort „${w[1]}“`);
  if (GERMAN_FORMAL.test(s)) hints.push("Anrede „Sie/Ihr“");
  const um = (s.match(UMLAUT_WORD) || []).filter((x) => !(locale === "fr" && /^[\p{L}]*[ëïüÿ][\p{L}]*$/u.test(x) && !/[äöß]/.test(x)));
  if (um.length) hints.push(`Umlaut-Wort „${um[0]}“`);
  return hints;
}

export function parity(messages = Object.fromEntries(LOCALES.map((l) => [l, readMessages(l).data]))) {
  const de = flatten(messages.de);
  const result = { leaves: [...de.keys()].filter((k) => !k.endsWith("#len")).length, legal: [], locales: {} };
  for (const [k] of de) if (!k.endsWith("#len") && isLegal(k)) result.legal.push(k);
  const deSig = new Map();
  for (const [k, v] of de) {
    if (typeof v !== "string") continue;
    try {
      deSig.set(k, icuSignature(v));
    } catch (e) {
      deSig.set(k, `PARSEFEHLER ${e.message}`);
    }
  }
  for (const l of LOCALES.filter((x) => x !== "de")) {
    const m = flatten(messages[l]);
    const r = { missing: [], extra: [], type: [], icu: [], german: [], legalSameAsDe: [] };
    for (const [k, v] of de) {
      if (!m.has(k)) {
        if (!k.endsWith("#len")) r.missing.push(k);
        continue;
      }
      const lv = m.get(k);
      if (k.endsWith("#len")) {
        if (lv !== v) r.type.push(`${k.slice(0, -4)}: Liste ${v} vs. ${lv}`);
        continue;
      }
      if (typeof lv !== typeof v) {
        r.type.push(`${k}: ${typeof v} vs. ${typeof lv}`);
        continue;
      }
      if (typeof v !== "string") continue;
      let sig;
      try {
        sig = icuSignature(lv);
      } catch (e) {
        sig = `PARSEFEHLER ${e.message}`;
      }
      if (sig !== deSig.get(k)) r.icu.push(`${k}: DE [${deSig.get(k)}] vs. ${l.toUpperCase()} [${sig}]`);
      if (isLegal(k)) {
        if (lv === v && /\p{L}{3}/u.test(stripAllowed(v, l))) r.legalSameAsDe.push(k);
        continue;
      }
      const hints = germanHints(l, k, lv, v);
      if (hints.length) r.german.push({ key: k, hints, value: lv });
    }
    for (const k of m.keys()) if (!de.has(k)) r.extra.push(k.replace(/#len$/, ""));
    result.locales[l] = r;
  }
  return result;
}

export function failures(result) {
  let n = 0;
  for (const r of Object.values(result.locales)) n += r.missing.length + r.extra.length + r.type.length + r.icu.length + r.german.length;
  return n;
}

function main() {
  const args = process.argv.slice(2);
  const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
  const messages = Object.fromEntries(LOCALES.map((l) => [l, readMessages(l).data]));
  const res = parity(messages);
  const lines = [
    `Blätter DE: ${res.leaves} · Rechtstexte markiert (nicht übersetzt, Kanzlei): ${res.legal.length}`,
    "",
    "| Sprache | fehlend | nur hier | Typ | ICU | deutsche Reste | Rechtstext = DE |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const [l, r] of Object.entries(res.locales)) {
    lines.push(`| ${l} | ${r.missing.length} | ${r.extra.length} | ${r.type.length} | ${r.icu.length} | ${r.german.length} | ${r.legalSameAsDe.length} |`);
  }
  console.log(lines.join("\n"));
  for (const [l, r] of Object.entries(res.locales)) {
    for (const k of r.missing) console.error(`FEHLT ${l}: ${k}`);
    for (const k of r.extra) console.error(`NUR ${l}: ${k}`);
    for (const k of r.type) console.error(`TYP ${l}: ${k}`);
    for (const k of r.icu) console.error(`ICU ${l}: ${k}`);
    for (const g of r.german) console.error(`DEUTSCH? ${l}: ${g.key} (${g.hints.join(", ")}) ${JSON.stringify(g.value).slice(0, 100)}`);
    for (const k of r.legalSameAsDe) console.error(`RECHTSTEXT ${l} noch deutsch (Kanzlei): ${k}`);
  }
  const todo = opt("todo");
  if (todo) {
    const de = flatten(messages.de);
    const out = {};
    for (const [l, r] of Object.entries(res.locales)) out[l] = Object.fromEntries(r.missing.map((k) => [k, de.get(k)]));
    fs.writeFileSync(path.resolve(ROOT, todo), JSON.stringify(out, null, 2) + "\n");
  }
  if (opt("json")) fs.writeFileSync(path.resolve(ROOT, opt("json")), JSON.stringify(res, null, 2) + "\n");
  if (opt("md")) fs.writeFileSync(path.resolve(ROOT, opt("md")), lines.join("\n") + "\n");
  const n = failures(res);
  console.log(n ? `\n${n} Befunde` : "\n0 Befunde: gleiche Schlüssel, gleiche ICU-Platzhalter, keine deutschen Reste");
  process.exit(n ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
